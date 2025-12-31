/**
 * Symmetric Encryption Example (AES)
 *
 * This example demonstrates secure symmetric encryption using AES (Advanced Encryption Standard)
 * with different modes and key derivation techniques.
 *
 * Symmetric encryption uses the same key for encryption and decryption.
 * Best for: Encrypting data at rest, secure data transmission with shared keys
 *
 * Security Best Practices:
 * 1. Use AES-256 for maximum security
 * 2. Use GCM mode for authenticated encryption (prevents tampering)
 * 3. Generate unique IV (Initialization Vector) for each encryption
 * 4. Use secure key derivation (PBKDF2, Argon2, or scrypt)
 * 5. Never reuse IVs with the same key
 * 6. Store IV with ciphertext (IV doesn't need to be secret)
 * 7. Use authenticated encryption to detect tampering
 */

import crypto from 'crypto';

// Encryption algorithms and parameters
const ENCRYPTION_CONFIG = {
  // AES-256-GCM: Galois/Counter Mode (authenticated encryption)
  ALGORITHM_GCM: 'aes-256-gcm' as const,

  // AES-256-CBC: Cipher Block Chaining (traditional mode)
  ALGORITHM_CBC: 'aes-256-cbc' as const,

  // Key derivation
  KEY_LENGTH: 32,        // 256 bits for AES-256
  IV_LENGTH: 16,         // 128 bits for AES
  AUTH_TAG_LENGTH: 16,   // 128 bits for GCM authentication tag
  SALT_LENGTH: 32,       // 256 bits for PBKDF2 salt

  // PBKDF2 parameters
  PBKDF2_ITERATIONS: 100000,  // Higher = more secure but slower
  PBKDF2_DIGEST: 'sha256' as const,
};

// Type definitions
interface EncryptedData {
  ciphertext: string;  // Base64 encoded
  iv: string;          // Base64 encoded
  authTag?: string;    // Base64 encoded (GCM only)
  salt?: string;       // Base64 encoded (when using password)
}

/**
 * Generate a secure random encryption key
 * Use this for generating new encryption keys
 *
 * @returns 32-byte (256-bit) random key as hex string
 */
export function generateKey(): string {
  const key = crypto.randomBytes(ENCRYPTION_CONFIG.KEY_LENGTH);
  console.log('✓ Generated 256-bit encryption key');
  return key.toString('hex');
}

/**
 * Derive encryption key from password using PBKDF2
 * Use this when you need to encrypt with a user password
 *
 * @param password - User password
 * @param salt - Salt (optional, generates new if not provided)
 * @returns Derived key and salt
 *
 * SECURITY NOTES:
 * - PBKDF2 applies key stretching (slow down brute force)
 * - Salt must be unique for each password
 * - Store salt with encrypted data (not secret)
 * - Consider using Argon2 for better resistance to GPU attacks
 */
export function deriveKeyFromPassword(
  password: string,
  salt?: Buffer
): { key: Buffer; salt: Buffer } {
  console.log('→ Deriving key from password...');

  // Generate or use provided salt
  const derivedSalt = salt || crypto.randomBytes(ENCRYPTION_CONFIG.SALT_LENGTH);

  // Derive key using PBKDF2
  const key = crypto.pbkdf2Sync(
    password,
    derivedSalt,
    ENCRYPTION_CONFIG.PBKDF2_ITERATIONS,
    ENCRYPTION_CONFIG.KEY_LENGTH,
    ENCRYPTION_CONFIG.PBKDF2_DIGEST
  );

  console.log('✓ Key derived successfully');
  console.log('  Iterations:', ENCRYPTION_CONFIG.PBKDF2_ITERATIONS);

  return { key, salt: derivedSalt };
}

/**
 * Encrypt data using AES-256-GCM (recommended)
 * GCM provides both confidentiality and authenticity
 *
 * @param plaintext - Data to encrypt
 * @param key - 32-byte encryption key (hex or Buffer)
 * @returns Encrypted data with IV and auth tag
 *
 * SECURITY NOTES:
 * - GCM mode provides authenticated encryption (AEAD)
 * - Authentication tag prevents tampering
 * - IV must be unique for each encryption
 * - IV doesn't need to be secret, store with ciphertext
 */
export function encryptAES_GCM(plaintext: string, key: string | Buffer): EncryptedData {
  console.log('→ Encrypting with AES-256-GCM...');

  // Convert key to Buffer if needed
  const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;

  // Validate key length
  if (keyBuffer.length !== ENCRYPTION_CONFIG.KEY_LENGTH) {
    throw new Error(`Key must be ${ENCRYPTION_CONFIG.KEY_LENGTH} bytes (256 bits)`);
  }

  // Generate random IV (must be unique for each encryption)
  const iv = crypto.randomBytes(ENCRYPTION_CONFIG.IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(
    ENCRYPTION_CONFIG.ALGORITHM_GCM,
    keyBuffer,
    iv
  );

  // Encrypt data
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  // Get authentication tag (proves data integrity)
  const authTag = cipher.getAuthTag();

  console.log('✓ Encryption successful');
  console.log('  Algorithm: AES-256-GCM');
  console.log('  IV length:', iv.length, 'bytes');
  console.log('  Auth tag length:', authTag.length, 'bytes');

  return {
    ciphertext,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Decrypt data encrypted with AES-256-GCM
 *
 * @param encryptedData - Encrypted data object
 * @param key - Encryption key (hex or Buffer)
 * @returns Decrypted plaintext
 *
 * SECURITY NOTES:
 * - Auth tag is verified automatically
 * - Decryption fails if data was tampered with
 * - Always use try/catch to handle decryption errors
 */
export function decryptAES_GCM(encryptedData: EncryptedData, key: string | Buffer): string {
  console.log('→ Decrypting with AES-256-GCM...');

  // Convert key to Buffer if needed
  const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;

  // Validate required fields
  if (!encryptedData.authTag) {
    throw new Error('Authentication tag is required for GCM decryption');
  }

  // Convert IV and auth tag from base64
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const authTag = Buffer.from(encryptedData.authTag, 'base64');

  // Create decipher
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_CONFIG.ALGORITHM_GCM,
    keyBuffer,
    iv
  );

  // Set auth tag (for verification)
  decipher.setAuthTag(authTag);

  try {
    // Decrypt data
    let plaintext = decipher.update(encryptedData.ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    console.log('✓ Decryption successful');
    console.log('  Authentication tag verified');

    return plaintext;
  } catch (error) {
    console.error('✗ Decryption failed - data may be corrupted or tampered');
    throw new Error('Decryption failed: invalid key or corrupted data');
  }
}

/**
 * Encrypt data using AES-256-CBC (traditional mode)
 * CBC mode provides confidentiality but not authenticity
 *
 * @param plaintext - Data to encrypt
 * @param key - 32-byte encryption key
 * @returns Encrypted data with IV
 *
 * NOTE: GCM is preferred over CBC. Use CBC only for compatibility.
 * Consider adding HMAC for authentication if using CBC.
 */
export function encryptAES_CBC(plaintext: string, key: string | Buffer): EncryptedData {
  console.log('→ Encrypting with AES-256-CBC...');

  const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;

  // Generate random IV
  const iv = crypto.randomBytes(ENCRYPTION_CONFIG.IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(
    ENCRYPTION_CONFIG.ALGORITHM_CBC,
    keyBuffer,
    iv
  );

  // Encrypt data
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  console.log('✓ Encryption successful');
  console.log('  Algorithm: AES-256-CBC');
  console.warn('  ⚠ Warning: CBC does not provide authentication');

  return {
    ciphertext,
    iv: iv.toString('base64'),
  };
}

/**
 * Decrypt data encrypted with AES-256-CBC
 *
 * @param encryptedData - Encrypted data object
 * @param key - Encryption key
 * @returns Decrypted plaintext
 */
export function decryptAES_CBC(encryptedData: EncryptedData, key: string | Buffer): string {
  console.log('→ Decrypting with AES-256-CBC...');

  const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
  const iv = Buffer.from(encryptedData.iv, 'base64');

  // Create decipher
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_CONFIG.ALGORITHM_CBC,
    keyBuffer,
    iv
  );

  try {
    // Decrypt data
    let plaintext = decipher.update(encryptedData.ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    console.log('✓ Decryption successful');
    return plaintext;
  } catch (error) {
    console.error('✗ Decryption failed');
    throw new Error('Decryption failed: invalid key or corrupted data');
  }
}

/**
 * Encrypt data with password (uses key derivation)
 * Convenient method for password-based encryption
 *
 * @param plaintext - Data to encrypt
 * @param password - User password
 * @returns Encrypted data with salt
 */
export function encryptWithPassword(plaintext: string, password: string): EncryptedData {
  console.log('→ Encrypting with password...');

  // Derive key from password
  const { key, salt } = deriveKeyFromPassword(password);

  // Encrypt with derived key
  const encrypted = encryptAES_GCM(plaintext, key);

  // Include salt in result (needed for decryption)
  encrypted.salt = salt.toString('base64');

  console.log('✓ Password-based encryption complete');
  return encrypted;
}

/**
 * Decrypt data encrypted with password
 *
 * @param encryptedData - Encrypted data object
 * @param password - User password
 * @returns Decrypted plaintext
 */
export function decryptWithPassword(encryptedData: EncryptedData, password: string): string {
  console.log('→ Decrypting with password...');

  if (!encryptedData.salt) {
    throw new Error('Salt is required for password-based decryption');
  }

  // Derive key from password using stored salt
  const salt = Buffer.from(encryptedData.salt, 'base64');
  const { key } = deriveKeyFromPassword(password, salt);

  // Decrypt with derived key
  return decryptAES_GCM(encryptedData, key);
}

/**
 * Encrypt file data (streaming approach for large files)
 *
 * @param data - File data as Buffer
 * @param key - Encryption key
 * @returns Encrypted data
 */
export function encryptFile(data: Buffer, key: string | Buffer): EncryptedData {
  console.log('→ Encrypting file data...');
  console.log('  Size:', data.length, 'bytes');

  const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
  const iv = crypto.randomBytes(ENCRYPTION_CONFIG.IV_LENGTH);

  const cipher = crypto.createCipheriv(
    ENCRYPTION_CONFIG.ALGORITHM_GCM,
    keyBuffer,
    iv
  );

  // Encrypt file data
  const encryptedBuffer = Buffer.concat([
    cipher.update(data),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  console.log('✓ File encrypted successfully');
  console.log('  Encrypted size:', encryptedBuffer.length, 'bytes');

  return {
    ciphertext: encryptedBuffer.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Decrypt file data
 *
 * @param encryptedData - Encrypted data object
 * @param key - Encryption key
 * @returns Decrypted file data as Buffer
 */
export function decryptFile(encryptedData: EncryptedData, key: string | Buffer): Buffer {
  console.log('→ Decrypting file data...');

  const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const authTag = Buffer.from(encryptedData.authTag!, 'base64');
  const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');

  const decipher = crypto.createDecipheriv(
    ENCRYPTION_CONFIG.ALGORITHM_GCM,
    keyBuffer,
    iv
  );

  decipher.setAuthTag(authTag);

  try {
    const decryptedBuffer = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    console.log('✓ File decrypted successfully');
    console.log('  Decrypted size:', decryptedBuffer.length, 'bytes');

    return decryptedBuffer;
  } catch (error) {
    console.error('✗ File decryption failed');
    throw new Error('File decryption failed: invalid key or corrupted data');
  }
}

/**
 * Example: Comprehensive Symmetric Encryption Demonstration
 */
export function demonstrateSymmetricEncryption() {
  console.log('\n=== Symmetric Encryption (AES) Example ===\n');

  const sensitiveData = 'This is highly confidential information!';
  console.log('Original data:', sensitiveData);
  console.log('Data length:', sensitiveData.length, 'characters\n');

  // =============================================================================
  // Method 1: AES-256-GCM with Random Key (Recommended)
  // =============================================================================
  console.log('Method 1: AES-256-GCM with Random Key');
  console.log('═════════════════════════════════════════════════════════\n');

  const key = generateKey();
  console.log('Encryption key (hex):', key.substring(0, 32) + '...');
  console.log('Key length:', key.length / 2, 'bytes\n');

  const encrypted = encryptAES_GCM(sensitiveData, key);
  console.log('Encrypted data:');
  console.log('  Ciphertext:', encrypted.ciphertext.substring(0, 40) + '...');
  console.log('  IV:', encrypted.iv);
  console.log('  Auth Tag:', encrypted.authTag + '\n');

  const decrypted = decryptAES_GCM(encrypted, key);
  console.log('Decrypted data:', decrypted);
  console.log('Match:', decrypted === sensitiveData ? '✓' : '✗');
  console.log('');

  // =============================================================================
  // Method 2: Password-Based Encryption
  // =============================================================================
  console.log('Method 2: Password-Based Encryption (PBKDF2)');
  console.log('═════════════════════════════════════════════════════════\n');

  const password = 'MySecurePassword123!';
  const encryptedWithPassword = encryptWithPassword(sensitiveData, password);
  console.log('Encrypted with password:');
  console.log('  Ciphertext:', encryptedWithPassword.ciphertext.substring(0, 40) + '...');
  console.log('  Salt:', encryptedWithPassword.salt?.substring(0, 32) + '...');
  console.log('  IV:', encryptedWithPassword.iv + '\n');

  const decryptedWithPassword = decryptWithPassword(encryptedWithPassword, password);
  console.log('Decrypted data:', decryptedWithPassword);
  console.log('Match:', decryptedWithPassword === sensitiveData ? '✓' : '✗');
  console.log('');

  // Test wrong password
  console.log('Testing wrong password:');
  try {
    decryptWithPassword(encryptedWithPassword, 'WrongPassword');
    console.log('✗ Should have failed!');
  } catch (error) {
    console.log('✓ Correctly rejected wrong password\n');
  }

  // =============================================================================
  // Method 3: AES-256-CBC (Traditional Mode)
  // =============================================================================
  console.log('Method 3: AES-256-CBC (Traditional)');
  console.log('═════════════════════════════════════════════════════════\n');

  const encryptedCBC = encryptAES_CBC(sensitiveData, key);
  console.log('Encrypted data:');
  console.log('  Ciphertext:', encryptedCBC.ciphertext.substring(0, 40) + '...');
  console.log('  IV:', encryptedCBC.iv);
  console.log('  Auth Tag: N/A (CBC does not provide authentication)\n');

  const decryptedCBC = decryptAES_CBC(encryptedCBC, key);
  console.log('Decrypted data:', decryptedCBC);
  console.log('Match:', decryptedCBC === sensitiveData ? '✓' : '✗');
  console.log('');

  // =============================================================================
  // Method 4: File Encryption
  // =============================================================================
  console.log('Method 4: File Encryption');
  console.log('═════════════════════════════════════════════════════════\n');

  const fileData = Buffer.from('This is file content with binary data: \x00\x01\x02\x03');
  const encryptedFile = encryptFile(fileData, key);
  const decryptedFile = decryptFile(encryptedFile, key);

  console.log('File encryption successful');
  console.log('Match:', fileData.equals(decryptedFile) ? '✓' : '✗');
  console.log('');

  // =============================================================================
  // Security Features Demonstration
  // =============================================================================
  console.log('Security Features Demonstration');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('1. Tampering Detection (GCM):');
  const tamperedData = { ...encrypted };
  tamperedData.ciphertext = tamperedData.ciphertext.replace('A', 'B');
  try {
    decryptAES_GCM(tamperedData, key);
    console.log('   ✗ Should have detected tampering!');
  } catch (error) {
    console.log('   ✓ Tampering detected and rejected\n');
  }

  console.log('2. IV Uniqueness:');
  const encrypted1 = encryptAES_GCM(sensitiveData, key);
  const encrypted2 = encryptAES_GCM(sensitiveData, key);
  console.log('   Same plaintext, different ciphertexts:', encrypted1.ciphertext !== encrypted2.ciphertext ? '✓' : '✗');
  console.log('   Different IVs:', encrypted1.iv !== encrypted2.iv ? '✓' : '✗');
  console.log('');

  // =============================================================================
  // Best Practices Summary
  // =============================================================================
  console.log('═════════════════════════════════════════════════════════');
  console.log('Symmetric Encryption Best Practices:');
  console.log('═════════════════════════════════════════════════════════');
  console.log('✓ Use AES-256-GCM (authenticated encryption)');
  console.log('✓ Generate unique IV for every encryption');
  console.log('✓ Use cryptographically secure random keys');
  console.log('✓ Use PBKDF2/Argon2 for password-based encryption');
  console.log('✓ Store IV and salt with ciphertext (not secret)');
  console.log('✓ Verify authentication tag before using decrypted data');
  console.log('✓ Never reuse IV with the same key');
  console.log('✓ Use minimum 256-bit keys for long-term security');
  console.log('✓ Implement secure key management (HSM, key rotation)');
  console.log('✓ Use authenticated encryption to prevent tampering');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('=== Symmetric Encryption Example Complete ===\n');
}

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateSymmetricEncryption();
}
