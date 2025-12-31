/**
 * Cryptography Module
 *
 * Provides hashing, encryption, and key management utilities
 */

import { createHash, createHmac, randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync, scryptSync } from 'crypto';

import type {
  HashAlgorithm,
  EncryptionAlgorithm,
  EncodingFormat,
  HashResult,
  EncryptedData,
  SymmetricKey,
  Signature,
  PasswordHash,
  PasswordHashOptions,
  TokenPayload,
  TokenOptions,
  HMACOptions,
  KeyDerivationOptions,
} from './types.js';

/**
 * Generate random bytes
 */
export function generateRandomBytes(length: number): Buffer {
  return randomBytes(length);
}

/**
 * Generate random hex string
 */
export function generateRandomHex(length: number): string {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Generate random base64 string
 */
export function generateRandomBase64(length: number): string {
  return randomBytes(Math.ceil(length * 0.75)).toString('base64').slice(0, length);
}

/**
 * Hash data
 */
export function hash(
  data: string | Buffer,
  algorithm: HashAlgorithm = 'sha256',
  encoding: EncodingFormat = 'hex'
): HashResult {
  const hashObj = createHash(algorithm);
  hashObj.update(data);

  return {
    algorithm,
    digest: hashObj.digest(encoding as 'hex' | 'base64'),
    encoding,
  };
}

/**
 * HMAC signature
 */
export function hmac(
  data: string | Buffer,
  key: string | Buffer,
  options: HMACOptions = { algorithm: 'sha256', encoding: 'hex' }
): string {
  const hmacObj = createHmac(options.algorithm, key);
  hmacObj.update(data);
  return hmacObj.digest(options.encoding as 'hex' | 'base64');
}

/**
 * Verify HMAC
 */
export function verifyHmac(
  data: string | Buffer,
  key: string | Buffer,
  signature: string,
  options: HMACOptions = { algorithm: 'sha256', encoding: 'hex' }
): boolean {
  const computed = hmac(data, key, options);
  return timingSafeEqual(computed, signature);
}

/**
 * Timing-safe string comparison
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate symmetric key
 */
export function generateSymmetricKey(
  algorithm: EncryptionAlgorithm = 'aes-256-gcm'
): SymmetricKey {
  const keyLength = algorithm.includes('256') ? 32 : 16;

  return {
    id: generateRandomHex(16),
    algorithm,
    key: randomBytes(keyLength).toString('base64'),
    createdAt: new Date(),
  };
}

/**
 * Encrypt data with symmetric key
 */
export function encrypt(
  plaintext: string | Buffer,
  key: string | Buffer,
  algorithm: EncryptionAlgorithm = 'aes-256-gcm'
): EncryptedData {
  const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'base64') : key;
  const ivLength = algorithm.includes('gcm') ? 12 : 16;
  const iv = randomBytes(ivLength);

  const cipher = createCipheriv(
    algorithm.replace('chacha20-poly1305', 'chacha20-poly1305') as string,
    keyBuffer,
    iv,
    algorithm.includes('gcm') ? { authTagLength: 16 } : undefined
  );

  const encrypted = Buffer.concat([
    cipher.update(typeof plaintext === 'string' ? plaintext : plaintext),
    cipher.final(),
  ]);

  const result: EncryptedData = {
    algorithm,
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    encoding: 'base64',
  };

  if (algorithm.includes('gcm') || algorithm.includes('poly1305')) {
    result.tag = (cipher as unknown as { getAuthTag: () => Buffer }).getAuthTag().toString('base64');
  }

  return result;
}

/**
 * Decrypt data with symmetric key
 */
export function decrypt(
  encrypted: EncryptedData,
  key: string | Buffer
): string {
  const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'base64') : key;
  const iv = Buffer.from(encrypted.iv, 'base64');
  const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');

  const decipher = createDecipheriv(
    encrypted.algorithm as string,
    keyBuffer,
    iv,
    encrypted.algorithm.includes('gcm') ? { authTagLength: 16 } : undefined
  );

  if (encrypted.tag && (encrypted.algorithm.includes('gcm') || encrypted.algorithm.includes('poly1305'))) {
    (decipher as unknown as { setAuthTag: (tag: Buffer) => void }).setAuthTag(
      Buffer.from(encrypted.tag, 'base64')
    );
  }

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Hash password securely
 */
export function hashPassword(
  password: string,
  options: PasswordHashOptions = { algorithm: 'pbkdf2' }
): PasswordHash {
  const salt = randomBytes(options.saltLength || 32);
  const iterations = options.iterations || 100000;
  const keyLength = options.keyLength || 64;

  let hash: Buffer;
  let params: Record<string, number>;

  if (options.algorithm === 'scrypt') {
    const N = options.memorySize || 16384;
    const r = 8;
    const p = options.parallelism || 1;
    hash = scryptSync(password, salt, keyLength, { N, r, p });
    params = { N, r, p, keyLength };
  } else {
    // PBKDF2
    hash = pbkdf2Sync(password, salt, iterations, keyLength, 'sha512');
    params = { iterations, keyLength };
  }

  return {
    hash: hash.toString('base64'),
    salt: salt.toString('base64'),
    algorithm: options.algorithm,
    params,
  };
}

/**
 * Verify password
 */
export function verifyPassword(password: string, stored: PasswordHash): boolean {
  const salt = Buffer.from(stored.salt, 'base64');

  let hash: Buffer;

  if (stored.algorithm === 'scrypt') {
    hash = scryptSync(password, salt, stored.params.keyLength, {
      N: stored.params.N,
      r: stored.params.r,
      p: stored.params.p,
    });
  } else {
    hash = pbkdf2Sync(
      password,
      salt,
      stored.params.iterations,
      stored.params.keyLength,
      'sha512'
    );
  }

  return timingSafeEqual(hash.toString('base64'), stored.hash);
}

/**
 * Derive key from password
 */
export function deriveKey(
  password: string,
  salt: string | Buffer,
  options: KeyDerivationOptions
): Buffer {
  const saltBuffer = typeof salt === 'string' ? Buffer.from(salt, 'base64') : salt;

  if (options.algorithm === 'pbkdf2') {
    return pbkdf2Sync(
      password,
      saltBuffer,
      options.iterations || 100000,
      options.keyLength,
      options.hash
    );
  }

  // HKDF-like using HMAC
  const prk = createHmac(options.hash, saltBuffer).update(password).digest();
  const info = options.info || '';
  let okm = Buffer.alloc(0);
  let t = Buffer.alloc(0);
  let i = 1;

  while (okm.length < options.keyLength) {
    const hmacObj = createHmac(options.hash, prk);
    hmacObj.update(Buffer.concat([t, Buffer.from(info), Buffer.from([i])]));
    t = hmacObj.digest();
    okm = Buffer.concat([okm, t]);
    i++;
  }

  return okm.subarray(0, options.keyLength);
}

/**
 * Create simple JWT-like token
 */
export function createToken(
  payload: TokenPayload,
  secret: string,
  options: TokenOptions = {}
): string {
  const header = { alg: 'HS256', typ: 'JWT' };

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: options.expiresIn ? now + options.expiresIn : undefined,
    iss: options.issuer,
    aud: options.audience,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

  const signature = hmac(
    `${headerB64}.${payloadB64}`,
    secret,
    { algorithm: 'sha256', encoding: 'base64' }
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Verify and decode token
 */
export function verifyToken(
  token: string,
  secret: string
): { valid: boolean; payload?: TokenPayload; error?: string } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid token format' };
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify signature
  const expectedSig = hmac(
    `${headerB64}.${payloadB64}`,
    secret,
    { algorithm: 'sha256', encoding: 'base64' }
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  if (!timingSafeEqual(signatureB64, expectedSig)) {
    return { valid: false, error: 'Invalid signature' };
  }

  // Decode payload
  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as TokenPayload;

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    // Check not before
    if (payload.nbf && payload.nbf > Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token not yet valid' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Invalid payload' };
  }
}

/**
 * Generate secure password
 */
export function generatePassword(
  length: number = 16,
  options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}
): string {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  let chars = '';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (chars.length === 0) {
    chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  }

  const bytes = randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }

  return password;
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  const bytes = randomBytes(16);

  // Set version (4) and variant (RFC4122)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Encode to Base64
 */
export function toBase64(data: string | Buffer): string {
  return Buffer.from(data).toString('base64');
}

/**
 * Decode from Base64
 */
export function fromBase64(data: string): string {
  return Buffer.from(data, 'base64').toString('utf8');
}

/**
 * Encode to Base64URL
 */
export function toBase64URL(data: string | Buffer): string {
  return Buffer.from(data).toString('base64url');
}

/**
 * Decode from Base64URL
 */
export function fromBase64URL(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf8');
}
