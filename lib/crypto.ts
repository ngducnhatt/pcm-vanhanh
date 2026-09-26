/**
 * Password hashing & token helpers built on Web Crypto only.
 * Works in Node.js (Next.js runtime) and Cloudflare Workers/Pages without extra deps.
 *
 * Hash format: pbkdf2_sha256$<iterations>$<saltBase64>$<hashBase64>
 */

const ALGORITHM = 'pbkdf2_sha256';
const ITERATIONS = 210_000;
const KEY_LENGTH = 32; // 256-bit
const SALT_LENGTH = 16; // 128-bit

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as unknown as BufferSource, iterations },
    passwordKey,
    KEY_LENGTH * 8
  );
}

/**
 * Hash a plaintext password. Always returns a value with a fresh random salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const derived = await deriveKey(password, salt, ITERATIONS);
  return `${ALGORITHM}$${ITERATIONS}$${toBase64(salt)}$${toBase64(new Uint8Array(derived))}`;
}

/**
 * Verify a plaintext password against a stored hash.
 * Returns false (never throws) on malformed or legacy hashes.
 */
export async function verifyPassword(password: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!storedHash) return false;

  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== ALGORITHM) return false;

  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  try {
    const salt = fromBase64(parts[2]);
    const expected = fromBase64(parts[3]);
    const derived = new Uint8Array(await deriveKey(password, salt, iterations));
    return constantTimeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Length-independent, branch-free byte comparison to avoid timing leaks.
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * Cryptographically strong random token used for session ids and
 * temporary passwords. URL-safe so it can be embedded anywhere.
 */
export function generateToken(byteLength = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let token = toBase64(bytes);
  token = token.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return token;
}

/**
 * SHA-256 digest of a session token. Only the digest is stored in the
 * database, so a database leak cannot be replayed as a valid cookie.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return toBase64(new Uint8Array(digest));
}

export const PASSWORD_HASH_PREFIX = ALGORITHM;
