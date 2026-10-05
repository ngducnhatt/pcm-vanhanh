import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { checkPasswordPolicy } from '../lib/auth';
import { hashPassword } from '../lib/crypto';
import { closeDb, getDb } from '../lib/db';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const phone = process.env.ADMIN_PHONE?.trim();

  if (!databaseUrl) throw new Error('DATABASE_URL must point to MySQL/MariaDB.');
  if (!name || !username || !password || !phone) {
    throw new Error('Set ADMIN_NAME, ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_PHONE.');
  }

  const passwordPolicy = checkPasswordPolicy(password);
  if (!passwordPolicy.valid) {
    throw new Error(passwordPolicy.errors.join('; '));
  }

  const db = getDb();
  await db.prepare('SELECT 1').first();

  const existing = await db
    .prepare('SELECT id, role FROM users WHERE LOWER(username) = LOWER(?) OR (LOWER(email) = LOWER(?) AND email IS NOT NULL)')
    .bind(username, email || '')
    .first<{ id: string; role: string | null }>();
  if (existing) {
    const roles = await db
      .prepare('SELECT role FROM user_roles WHERE user_id = ?')
      .bind(existing.id)
      .all<{ role: string }>();
    const roleList = roles.results.map((r) => r.role);
    if (existing.role) roleList.push(existing.role);
    if (!roleList.includes('admin')) {
      throw new Error('ADMIN_USERNAME or ADMIN_EMAIL already belongs to a non-admin account.');
    }
    console.log('An admin account already exists; no account data was changed.');
    await closeDb();
    return;
  }

  const passwordHash = await hashPassword(password);
  const userId = `usr_${randomUUID()}`;
  
  await db
    .prepare(
      `INSERT INTO users (id, name, phone, email, is_active, username, password_hash, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)`
    )
    .bind(userId, name, phone, email || null, username, passwordHash)
    .run();

  // Thêm vai trò admin
  await db
    .prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)')
    .bind(userId, 'admin')
    .run();

  console.log(`Created initial administrator account "${username}".`);
  await closeDb();
}

main().catch((error) => {
  console.error('Could not create the initial admin account:', error);
  process.exitCode = 1;
});
