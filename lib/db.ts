import fs from 'node:fs';
import path from 'node:path';
import mysql, { Pool } from 'mysql2/promise';

/**
 * Adapter database theo giao diện giống D1/Postgres nhưng backend thật là
 * MySQL/MariaDB (mysql2). Tên `Statement`/`Database` trung tính để không gây
 * nhầm lẫn với Postgres.
 */
export interface Statement {
  bind(...values: unknown[]): Statement;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta?: { changes: number } }>;
}

export interface Database {
  prepare(query: string): Statement;
  exec(query: string): Promise<void>;
}

let mysqlPool: Pool | null = null;
/**
 * Pool riêng cho migration: `multipleStatements` chỉ bật ở đây.
 * Pool của ứng dụng luôn để multipleStatements = false để giảm tác hại nếu
 * có lỗ hổng SQL injection.
 */
let migrationPool: Pool | null = null;
let mysqlInitialization: Promise<void> | null = null;

function createMysqlAdapter(
  pool: Pool,
  ensureInitialized: () => Promise<void>
): Database {
  return {
    prepare(query: string): Statement {
      let values: unknown[] = [];
      const statement: Statement = {
        bind(...boundValues: unknown[]) {
          values = boundValues;
          return statement;
        },
        async all<T = unknown>() {
          await ensureInitialized();
          const [rows] = await pool.query(query, values as never[]);
          return { results: rows as T[], success: true };
        },
        async first<T = unknown>(colName?: string) {
          await ensureInitialized();
          const [rows] = await pool.query(query, values as never[]);
          const row = (rows as Array<Record<string, unknown>>)[0];
          if (!row) return null;
          return (colName ? (row[colName] ?? null) : row) as T | null;
        },
        async run() {
          await ensureInitialized();
          const [result] = await pool.query(query, values as never[]);
          const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
          return { success: true, meta: { changes: affectedRows } };
        },
      };
      return statement;
    },
    async exec(query: string) {
      await ensureInitialized();
      await pool.query(query);
    },
  };
}

/**
 * Số connection tối đa của pool ứng dụng.
 * Ưu tiên DB_POOL_MAX; PG_POOL_MAX giữ lại để tương thích cấu hình cũ.
 */
export function getPoolMax(): number {
  const raw = process.env.DB_POOL_MAX ?? process.env.PG_POOL_MAX ?? '15';
  const configured = Number(raw);
  return Number.isInteger(configured) && configured > 0 ? configured : 15;
}

function getMysqlPool(): Pool {
  if (!mysqlPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required to connect to MySQL/MariaDB.');
    }

    mysqlPool = mysql.createPool({
      uri: connectionString,
      connectionLimit: getPoolMax(),
      waitForConnections: true,
      dateStrings: true,
      // Runtime không bật multipleStatements: một câu lệnh mỗi lần gọi.
      multipleStatements: false,
      charset: 'utf8mb4',
    });
    (mysqlPool as unknown as { on: (event: string, cb: (error: Error) => void) => void }).on(
      'error',
      (error: Error) => {
        console.error('Unexpected MySQL pool error:', error);
      }
    );
  }

  return mysqlPool;
}

/**
 * Pool riêng cho migration — nơi duy nhất được phép `multipleStatements: true`
 * vì file migration chứa nhiều câu lệnh.
 */
function getMigrationPool(): Pool {
  if (!migrationPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required to connect to MySQL/MariaDB.');
    }
    migrationPool = mysql.createPool({
      uri: connectionString,
      connectionLimit: 1,
      waitForConnections: true,
      dateStrings: true,
      multipleStatements: true,
      charset: 'utf8mb4',
    });
  }
  return migrationPool;
}

async function initializeMysql(pool: Pool): Promise<void> {
  if (!mysqlInitialization) {
    mysqlInitialization = (async () => {
      const connection = await pool.getConnection();
      try {
        await connection.query("SELECT GET_LOCK('pcm_vanhanh_migrations', 30)");
        await connection.query(`
          CREATE TABLE IF NOT EXISTS schema_migrations (
            name VARCHAR(255) PRIMARY KEY,
            applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);

        const migrationsDir = path.join(process.cwd(), 'migrations');
        const files = fs
          .readdirSync(migrationsDir)
          .filter((file) => file.endsWith('.sql'))
          .sort();

        for (const file of files) {
          const [existing] = await connection.query(
            'SELECT name FROM schema_migrations WHERE name = ?',
            [file]
          );
          if (Array.isArray(existing) && existing.length > 0) continue;

          await connection.query('START TRANSACTION');
          try {
            const migration = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await connection.query(migration);
            await connection.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
            await connection.query('COMMIT');
            console.info(`[db] applied MySQL migration ${file}`);
          } catch (error) {
            await connection.query('ROLLBACK');
            throw error;
          }
        }
      } finally {
        await connection.query("SELECT RELEASE_LOCK('pcm_vanhanh_migrations')");
        connection.release();
      }
    })().catch((error) => {
      mysqlInitialization = null;
      console.error('MySQL migration error:', error);
      throw error;
    });
  }
  await mysqlInitialization;
}

export function getDb(): Database {
  const pool = getMysqlPool();
  // Migration luôn chạy trên pool riêng (multipleStatements bật).
  return createMysqlAdapter(pool, () => initializeMysql(getMigrationPool()));
}

/**
 * Kết quả của 1 câu lệnh SQL trong transaction.
 * - SELECT  -> mảng row
 * - INSERT/UPDATE/DELETE -> object có `affectedRows`
 */
export type QueryResult = unknown[] | { affectedRows?: number; insertId?: number };

/** Số dòng bị ảnh hưởng bởi 1 câu lệnh ghi (0 nếu kết quả không phải write). */
export function affectedRows(result: unknown): number {
  if (Array.isArray(result)) return result.length;
  const value = (result as { affectedRows?: number } | null)?.affectedRows;
  return typeof value === 'number' ? value : 0;
}

/**
 * Chạy callback trong 1 MySQL transaction (atomic cho multi-write).
 * `query` trả về mảng row (kết quả SELECT) hoặc `ResultSetHeader` (INSERT/UPDATE).
 */
export async function withTransaction<T>(
  fn: (query: (sql: string, params?: unknown[]) => Promise<QueryResult>) => Promise<T>
): Promise<T> {
  const pool = getMysqlPool();
  await initializeMysql(getMigrationPool());
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const query = async (sql: string, params: unknown[] = []): Promise<QueryResult> => {
      const [rows] = await conn.query(sql, params as never[]);
      return rows as QueryResult;
    };
    const result = await fn(query);
    await conn.commit();
    return result;
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    throw error;
  } finally {
    conn.release();
  }
}

export async function closeDb(): Promise<void> {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
  if (migrationPool) {
    await migrationPool.end();
    migrationPool = null;
  }
  mysqlInitialization = null;
}
