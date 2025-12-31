/**
 * Crypto Toolkit Types
 */

// Hash algorithms
export type HashAlgorithm = 'sha256' | 'sha384' | 'sha512' | 'md5';

// Encryption algorithms
export type EncryptionAlgorithm = 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';

// Key types
export type KeyType = 'symmetric' | 'rsa' | 'ec';

// Encoding formats
export type EncodingFormat = 'hex' | 'base64' | 'utf8';

// Hash result
export interface HashResult {
  algorithm: HashAlgorithm;
  digest: string;
  encoding: EncodingFormat;
}

// Encrypted data
export interface EncryptedData {
  algorithm: EncryptionAlgorithm;
  ciphertext: string;
  iv: string;
  tag?: string;        // For GCM mode
  encoding: EncodingFormat;
}

// Symmetric key
export interface SymmetricKey {
  id: string;
  algorithm: EncryptionAlgorithm;
  key: string;
  createdAt: Date;
  expiresAt?: Date;
}

// RSA key pair
export interface RSAKeyPair {
  id: string;
  publicKey: string;
  privateKey: string;
  modulusLength: number;
  createdAt: Date;
}

// Signature
export interface Signature {
  algorithm: string;
  signature: string;
  encoding: EncodingFormat;
}

// Password hash options
export interface PasswordHashOptions {
  algorithm: 'pbkdf2' | 'scrypt' | 'argon2';
  iterations?: number;
  memorySize?: number;
  parallelism?: number;
  saltLength?: number;
  keyLength?: number;
}

// Password hash result
export interface PasswordHash {
  hash: string;
  salt: string;
  algorithm: string;
  params: Record<string, number>;
}

// Token payload
export interface TokenPayload {
  sub?: string;        // Subject
  iss?: string;        // Issuer
  aud?: string;        // Audience
  exp?: number;        // Expiration
  iat?: number;        // Issued at
  nbf?: number;        // Not before
  jti?: string;        // JWT ID
  [key: string]: unknown;
}

// Token options
export interface TokenOptions {
  expiresIn?: number;  // Seconds
  issuer?: string;
  audience?: string;
}

// HMAC options
export interface HMACOptions {
  algorithm: HashAlgorithm;
  encoding: EncodingFormat;
}

// Key derivation options
export interface KeyDerivationOptions {
  algorithm: 'pbkdf2' | 'hkdf';
  hash: HashAlgorithm;
  iterations?: number;
  keyLength: number;
  info?: string;
}
