import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

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

interface PostgresResult<T> {
  rows: T[];
  rowCount: number | null;
}

interface PostgresPool {
  query<T = unknown>(query: string, values?: unknown[]): Promise<PostgresResult<T>>;
  connect(): Promise<{
    query<T = unknown>(query: string, values?: unknown[]): Promise<PostgresResult<T>>;
    release(): void;
  }>;
  on(event: 'error', listener: (error: Error) => void): void;
}

let postgresPool: PostgresPool | null = null;
let postgresInitialization: Promise<void> | null = null;

function replacePlaceholders(query: string): string {
  let index = 0;
  let result = '';
  let quote: "'" | '"' | '`' | null = null;

  for (let position = 0; position < query.length; position++) {
    const character = query[position];
    if (quote) {
      result += character;
      if (character === quote) {
        if (query[position + 1] === quote) {
          result += query[++position];
        } else {
          quote = null;
        }
      }
    } else if (character === "'" || character === '"' || character === '`') {
      quote = character;
      result += character;
    } else if (character === '?') {
      result += `$${++index}`;
    } else {
      result += character;
    }
  }

  return result;
}

function toPostgresSql(query: string): string {
  return replacePlaceholders(query).replace(/\bCURRENT_TIMESTAMP\b/g, 'CURRENT_TIMESTAMP::TEXT');
}

function createPostgresAdapter(
  pool: PostgresPool,
  ensureInitialized: () => Promise<void>
): PostgresDatabase {
  return {
    prepare(query: string): PostgresStatement {
      let values: unknown[] = [];
      const postgresQuery = toPostgresSql(query);
      const statement: PostgresStatement = {
        bind(...boundValues: unknown[]) {
          values = boundValues;
          return statement;
        },
        async all<T = unknown>() {
          await ensureInitialized();
          const result = await pool.query<T>(postgresQuery, values);
          return { results: result.rows, success: true };
        },
        async first<T = unknown>(colName?: string) {
          await ensureInitialized();
          const result = await pool.query<T>(postgresQuery, values);
          const row = result.rows[0] as (T & Record<string, unknown>) | undefined;
          if (!row) return null;
          return (colName ? row[colName] ?? null : row) as T | null;
        },
        async run() {
          await ensureInitialized();
          const result = await pool.query(postgresQuery, values);
          return { success: true, meta: { changes: result.rowCount ?? 0 } };
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

function getPostgresPool(): PostgresPool {
  if (!postgresPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required to connect to PostgreSQL.');
    }

    const configuredMax = Number(process.env.PG_POOL_MAX || 15);
    const poolMax = Number.isInteger(configuredMax) && configuredMax > 0 ? configuredMax : 15;
    postgresPool = new Pool({
      connectionString,
      max: poolMax,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
    });
    postgresPool.on('error', (error) => {
      console.error('Unexpected PostgreSQL pool error:', error);
    });
  }

  return postgresPool;
}

async function initializePostgres(pool: PostgresPool): Promise<void> {
  if (!postgresInitialization) {
    postgresInitialization = (async () => {
      const client = await pool.connect();
      try {
        await client.query('SELECT pg_advisory_lock(1951466434)');
        await client.query(`
          CREATE TABLE IF NOT EXISTS schema_migrations (
            name TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);

        const migrationsDir = path.join(process.cwd(), 'migrations');
        const files = fs
          .readdirSync(migrationsDir)
          .filter((file) => file.endsWith('.sql'))
          .sort();

        for (const file of files) {
          const existing = await client.query<{ name: string }>(
            'SELECT name FROM schema_migrations WHERE name = $1',
            [file]
          );
          if (existing.rows.length > 0) continue;

          await client.query('BEGIN');
          try {
            const migration = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await client.query(toPostgresSql(migration));
            await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
            await client.query('COMMIT');
            console.info(`[db] applied PostgreSQL migration ${file}`);
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          }
        }
        await client.query(
          'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username))'
        );
        await client.query(
          'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email)) WHERE email IS NOT NULL'
        );
      } finally {
        await client.query('SELECT pg_advisory_unlock(1951466434)');
        client.release();
      }
    })().catch((error) => {
      postgresInitialization = null;
      console.error('PostgreSQL migration error:', error);
      throw error;
    });
  }
  await postgresInitialization;
}

export function getDb(): PostgresDatabase {
  const pool = getPostgresPool();
  return createPostgresAdapter(pool, () => initializePostgres(pool));
}
