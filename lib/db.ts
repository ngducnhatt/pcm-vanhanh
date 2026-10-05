import fs from 'node:fs';
import path from 'node:path';
import mysql, { Pool } from 'mysql2/promise';

export interface PostgresStatement {
  bind(...values: unknown[]): PostgresStatement;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta?: { changes: number } }>;
}

export interface PostgresDatabase {
  prepare(query: string): PostgresStatement;
  exec(query: string): Promise<void>;
}

let mysqlPool: Pool | null = null;
let mysqlInitialization: Promise<void> | null = null;

function createMysqlAdapter(
  pool: Pool,
  ensureInitialized: () => Promise<void>
): PostgresDatabase {
  return {
    prepare(query: string): PostgresStatement {
      let values: unknown[] = [];
      const statement: PostgresStatement = {
        bind(...boundValues: unknown[]) {
          values = boundValues;
          return statement;
        },
        async all<T = unknown>() {
          await ensureInitialized();
          const [rows] = await pool.query(query, values as any);
          return { results: rows as T[], success: true };
        },
        async first<T = unknown>(colName?: string) {
          await ensureInitialized();
          const [rows] = await pool.query(query, values as any);
          const row = (rows as any[])[0] as (T & Record<string, unknown>) | undefined;
          if (!row) return null;
          return (colName ? row[colName] ?? null : row) as T | null;
        },
        async run() {
          await ensureInitialized();
          const [result] = await pool.query(query, values as any);
          return { success: true, meta: { changes: (result as any).affectedRows ?? 0 } };
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

function getMysqlPool(): Pool {
  if (!mysqlPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required to connect to MySQL/MariaDB.');
    }

    const configuredMax = Number(process.env.PG_POOL_MAX || 15);
    const poolMax = Number.isInteger(configuredMax) && configuredMax > 0 ? configuredMax : 15;
    mysqlPool = mysql.createPool({
      uri: connectionString,
      connectionLimit: poolMax,
      waitForConnections: true,
      dateStrings: true,
      multipleStatements: true,
      charset: 'utf8mb4',
    });
    mysqlPool.on('error' as any, (error: Error) => {
      console.error('Unexpected MySQL pool error:', error);
    });
  }

  return mysqlPool;
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
          const [existing] = await connection.query<any[]>(
            'SELECT name FROM schema_migrations WHERE name = ?',
            [file]
          );
          if (existing.length > 0) continue;

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

export function getDb(): PostgresDatabase {
  const pool = getMysqlPool();
  return createMysqlAdapter(pool, () => initializeMysql(pool));
}

export async function closeDb(): Promise<void> {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
    mysqlInitialization = null;
  }
}
