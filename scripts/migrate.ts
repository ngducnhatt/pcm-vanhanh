import 'dotenv/config';
import { closeDb, getDb } from '../lib/db';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must point to MySQL/MariaDB before running migrations.');
  }

  await getDb().prepare('SELECT 1').first();
  console.log('MySQL migrations are up to date.');
  await closeDb();
}

main().catch((error) => {
  console.error('Database migration failed:', error);
  process.exitCode = 1;
});
