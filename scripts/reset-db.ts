import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'pcm_vanhanh.sqlite');

// Remove the database together with its WAL/SHM side files
for (const suffix of ['', '-wal', '-shm']) {
  const file = dbPath + suffix;
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log('Removed:', path.basename(file));
  }
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
db.exec(
  'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP))'
);

const migrationsDir = path.join(process.cwd(), 'migrations');
const files = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

for (const file of files) {
  console.log(`Executing ${file}...`);
  db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
  db.prepare('INSERT OR IGNORE INTO schema_migrations (name) VALUES (?)').run(file);
}

console.log('\nDatabase reset and seeded successfully!');
console.log('Tài khoản mẫu (mật khẩu chung: Pcshop@123):');
console.log('  admin | sale | kho | kythuat | qlkythuat | baohanh | qlship | shipper1 | shipper2');
db.close();
