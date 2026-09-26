import fs from 'fs';
import path from 'path';

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all<T = any>(): Promise<{ results: T[]; success: boolean }>;
  first<T = any>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta?: any }>;
}

export interface D1DatabaseInterface {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<void>;
  batch?(statements: D1PreparedStatement[]): Promise<any[]>;
}

let localDbInstance: any = null;

function getLocalSqliteDb() {
  if (localDbInstance) {
    return localDbInstance;
  }

  const DatabaseSync = process.getBuiltinModule('node:sqlite')?.DatabaseSync;
  if (!DatabaseSync) {
    throw new Error('Node.js built-in SQLite is unavailable. Use Node.js 22.5 or later.');
  }
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'pcm_vanhanh.sqlite');
  localDbInstance = new DatabaseSync(dbPath);
  localDbInstance.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  // Bring the schema up to date (creates it on a fresh database)
  runMigrations(localDbInstance);

  return localDbInstance;
}

/**
 * Applies every *.sql file in /migrations exactly once, in filename order,
 * and records what has been applied in `schema_migrations`.
 *
 * 0001/0002 are written with IF NOT EXISTS / INSERT OR IGNORE, so a database
 * created by an earlier version of this file migrates cleanly.
 *
 * Only runs for the local SQLite database: on Cloudflare D1 the migration
 * files are applied with `wrangler d1 execute` instead (see README).
 */
function runMigrations(db: any) {
  try {
    db.exec(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP))'
    );

    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) return;

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const isApplied = db.prepare('SELECT name FROM schema_migrations WHERE name = ?');
    const markApplied = db.prepare('INSERT OR IGNORE INTO schema_migrations (name) VALUES (?)');

    for (const file of files) {
      if (isApplied.get(file)) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      db.exec(sql);
      markApplied.run(file);
      console.log(`[db] applied migration ${file}`);
    }
  } catch (err) {
    console.error('Database migration error:', err);
    throw err;
  }
}

/**
 * Creates a D1-compatible wrapper around Node.js SQLite for local Next.js execution
 */
function createLocalD1Wrapper(sqliteDb: any): D1DatabaseInterface {
  return {
    prepare(query: string): D1PreparedStatement {
      let boundValues: any[] = [];

      const statementWrapper: D1PreparedStatement = {
        bind(...values: any[]) {
          boundValues = values;
          return statementWrapper;
        },
        async all<T = any>() {
          try {
            const stmt = sqliteDb.prepare(query);
            const results = stmt.all(...boundValues) as T[];
            return { results, success: true };
          } catch (error) {
            console.error('SQL Error (all):', query, boundValues, error);
            throw error;
          }
        },
        async first<T = any>(colName?: string) {
          try {
            const stmt = sqliteDb.prepare(query);
            const row = stmt.get(...boundValues) as any;
            if (!row) return null;
            if (colName) return row[colName] ?? null;
            return row as T;
          } catch (error) {
            console.error('SQL Error (first):', query, boundValues, error);
            throw error;
          }
        },
        async run() {
          try {
            const stmt = sqliteDb.prepare(query);
            const info = stmt.run(...boundValues);
            return { success: true, meta: info };
          } catch (error) {
            console.error('SQL Error (run):', query, boundValues, error);
            throw error;
          }
        },
      };

      return statementWrapper;
    },
    async exec(query: string) {
      sqliteDb.exec(query);
    },
  };
}

/**
 * Returns the D1Database instance.
 * Automatically checks for Cloudflare Workers / Pages env.DB,
 * and falls back to local SQLite with D1-compatible interface.
 */
export function getDb(): D1DatabaseInterface {
  // If running in Cloudflare Pages / Workers with D1 binding
  if (typeof process !== 'undefined' && (process.env as any)?.DB) {
    return (process.env as any).DB as D1DatabaseInterface;
  }

  // Fallback to local Node.js SQLite
  const sqlite = getLocalSqliteDb();
  return createLocalD1Wrapper(sqlite);
}
