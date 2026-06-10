import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_BYTES = 32;

const ENV = 'TOKEN_ENCRYPTION_KEY';

/**
 * Decode `TOKEN_ENCRYPTION_KEY` (base64, 32 raw bytes) for AES-256-GCM.
 * Generate: `openssl rand -base64 32`
 */
export function loadEncryptionKey(): Buffer {
  const b64 = process.env[ENV]?.trim();
  if (!b64) {
    throw new Error(`${ENV} is not set`);
  }
  const key = Buffer.from(b64, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(`${ENV} must be base64 for exactly ${KEY_BYTES} bytes (got ${key.length})`);
  }
  return key;
}

/**
 * Encrypt UTF-8 string. Returns URL-safe base64: iv (12) || tag (16) || ciphertext.
 */
export function encryptString(plaintext: string, key: Buffer = loadEncryptionKey()): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

/**
 * Decrypt payload produced by `encryptString`.
 */
export function decryptString(ciphertext: string, key: Buffer = loadEncryptionKey()): string {
  const buf = Buffer.from(ciphertext, 'base64url');
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid ciphertext: too short');
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const data = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
