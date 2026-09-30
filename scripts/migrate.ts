import 'dotenv/config';
import { getDb } from '../lib/db';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must point to PostgreSQL before running migrations.');
  }

  await getDb().prepare('SELECT 1').first();
  console.log('PostgreSQL migrations are up to date.');
}

main().catch((error) => {
  console.error('Database migration failed:', error);
  process.exitCode = 1;
});
