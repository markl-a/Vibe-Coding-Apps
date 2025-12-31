/**
 * Cryptographic Hashing and Password Security Example
 *
 * This example demonstrates secure password hashing and general cryptographic hashing.
 *
 * Key Concepts:
 * - Hashing is one-way (cannot be reversed)
 * - Same input always produces same output
 * - Small change in input drastically changes output
 * - Collision-resistant (hard to find two inputs with same hash)
 *
 * Use Cases:
 * - Password storage (with bcrypt/argon2)
 * - Data integrity verification
 * - Digital signatures
 * - File checksums
 * - Blockchain/cryptocurrency
 *
 * Security Best Practices:
 * 1. NEVER store passwords in plain text
 * 2. Use bcrypt, argon2, or scrypt for passwords (NOT MD5/SHA)
 * 3. Use unique salt for each password
 * 4. Implement password complexity requirements
 * 5. Use timing-safe comparison for hashes
 * 6. Use SHA-256 or SHA-3 for data integrity
 * 7. Combine hash with HMAC for authentication
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Hashing configuration
const HASH_CONFIG = {
  // Password hashing (bcrypt)
  BCRYPT_ROUNDS: 12,      // Higher = more secure but slower (10-12 recommended)

  // PBKDF2 parameters (alternative to bcrypt)
  PBKDF2_ITERATIONS: 100000,
  PBKDF2_KEYLEN: 64,
  PBKDF2_DIGEST: 'sha512' as const,

  // General purpose hashing
  HASH_ALGORITHM: 'sha256' as const,

  // HMAC (keyed hash)
  HMAC_ALGORITHM: 'sha256' as const,
};

// Type definitions
interface HashedPassword {
  hash: string;
  algorithm: 'bcrypt' | 'pbkdf2';
  salt?: string;  // For PBKDF2
}

interface FileHash {
  hash: string;
  algorithm: string;
  size: number;
}

/**
 * Hash password using bcrypt (RECOMMENDED for passwords)
 * bcrypt is specifically designed for password hashing with:
 * - Automatic salt generation
 * - Configurable work factor (cost)
 * - Resistance to brute-force and rainbow table attacks
 *
 * @param password - Plain text password
 * @param rounds - Cost factor (10-12 recommended, higher = slower)
 * @returns Hashed password (includes salt)
 *
 * SECURITY NOTES:
 * - bcrypt automatically generates and stores salt in hash
 * - Hash format: $2b$[cost]$[22-char salt][31-char hash]
 * - Slow by design to resist brute-force
 * - Recommended rounds: 10-12 (doubles time per increment)
 */
export async function hashPasswordBcrypt(
  password: string,
  rounds: number = HASH_CONFIG.BCRYPT_ROUNDS
): Promise<HashedPassword> {
  console.log('→ Hashing password with bcrypt...');
  console.log('  Cost factor:', rounds);

  const startTime = Date.now();

  // Hash password (salt is automatically generated)
  const hash = await bcrypt.hash(password, rounds);

  const duration = Date.now() - startTime;
  console.log('✓ Password hashed successfully');
  console.log('  Time taken:', duration, 'ms');
  console.log('  Hash length:', hash.length, 'characters');

  return {
    hash,
    algorithm: 'bcrypt',
  };
}

/**
 * Verify password against bcrypt hash
 *
 * @param password - Plain text password to verify
 * @param hashedPassword - Previously hashed password
 * @returns true if password matches
 *
 * SECURITY:
 * - Uses constant-time comparison (bcrypt.compare)
 * - Prevents timing attacks
 */
export async function verifyPasswordBcrypt(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  console.log('→ Verifying password with bcrypt...');

  const startTime = Date.now();
  const isMatch = await bcrypt.compare(password, hashedPassword);
  const duration = Date.now() - startTime;

  if (isMatch) {
    console.log('✓ Password verified - match found');
  } else {
    console.log('✗ Password verification failed - no match');
  }
  console.log('  Time taken:', duration, 'ms');

  return isMatch;
}

/**
 * Hash password using PBKDF2 (alternative to bcrypt)
 * PBKDF2 is a key derivation function suitable for password hashing
 *
 * @param password - Plain text password
 * @param salt - Optional salt (generates new if not provided)
 * @returns Hashed password with salt
 *
 * NOTE: bcrypt is generally preferred over PBKDF2 for passwords
 * Use PBKDF2 when bcrypt is not available or for compatibility
 */
export function hashPasswordPBKDF2(
  password: string,
  salt?: Buffer
): HashedPassword {
  console.log('→ Hashing password with PBKDF2...');

  const startTime = Date.now();

  // Generate or use provided salt
  const passwordSalt = salt || crypto.randomBytes(32);

  // Derive key using PBKDF2
  const hash = crypto.pbkdf2Sync(
    password,
    passwordSalt,
    HASH_CONFIG.PBKDF2_ITERATIONS,
    HASH_CONFIG.PBKDF2_KEYLEN,
    HASH_CONFIG.PBKDF2_DIGEST
  );

  const duration = Date.now() - startTime;
  console.log('✓ Password hashed successfully');
  console.log('  Time taken:', duration, 'ms');
  console.log('  Iterations:', HASH_CONFIG.PBKDF2_ITERATIONS);

  return {
    hash: hash.toString('hex'),
    salt: passwordSalt.toString('hex'),
    algorithm: 'pbkdf2',
  };
}

/**
 * Verify password against PBKDF2 hash
 *
 * @param password - Plain text password to verify
 * @param hashedPassword - Previously hashed password object
 * @returns true if password matches
 */
export function verifyPasswordPBKDF2(
  password: string,
  hashedPassword: HashedPassword
): boolean {
  console.log('→ Verifying password with PBKDF2...');

  if (!hashedPassword.salt) {
    throw new Error('Salt is required for PBKDF2 verification');
  }

  // Hash provided password with same salt
  const salt = Buffer.from(hashedPassword.salt, 'hex');
  const verification = hashPasswordPBKDF2(password, salt);

  // Constant-time comparison
  const hashBuffer = Buffer.from(hashedPassword.hash, 'hex');
  const verificationBuffer = Buffer.from(verification.hash, 'hex');

  const isMatch = crypto.timingSafeEqual(hashBuffer, verificationBuffer);

  if (isMatch) {
    console.log('✓ Password verified - match found');
  } else {
    console.log('✗ Password verification failed - no match');
  }

  return isMatch;
}

/**
 * Hash data using SHA-256 (for data integrity, NOT passwords)
 * Use this for checksums, data integrity verification
 *
 * @param data - Data to hash (string or Buffer)
 * @returns Hex-encoded hash
 *
 * IMPORTANT: Do NOT use SHA-256 for password hashing!
 * SHA-256 is too fast - use bcrypt/argon2 for passwords
 */
export function hashSHA256(data: string | Buffer): string {
  const hash = crypto
    .createHash(HASH_CONFIG.HASH_ALGORITHM)
    .update(data)
    .digest('hex');

  return hash;
}

/**
 * Hash data using SHA-512 (stronger than SHA-256)
 *
 * @param data - Data to hash
 * @returns Hex-encoded hash
 */
export function hashSHA512(data: string | Buffer): string {
  const hash = crypto
    .createHash('sha512')
    .update(data)
    .digest('hex');

  return hash;
}

/**
 * Calculate file hash (for integrity verification)
 * Useful for verifying file downloads, detecting tampering
 *
 * @param fileData - File content as Buffer
 * @param algorithm - Hash algorithm ('sha256' or 'sha512')
 * @returns File hash information
 */
export function hashFile(
  fileData: Buffer,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): FileHash {
  console.log('→ Calculating file hash...');
  console.log('  File size:', fileData.length, 'bytes');
  console.log('  Algorithm:', algorithm);

  const hash = crypto
    .createHash(algorithm)
    .update(fileData)
    .digest('hex');

  console.log('✓ File hash calculated');
  console.log('  Hash:', hash.substring(0, 32) + '...');

  return {
    hash,
    algorithm,
    size: fileData.length,
  };
}

/**
 * Verify file integrity by comparing hashes
 *
 * @param fileData - File content to verify
 * @param expectedHash - Expected hash value
 * @param algorithm - Hash algorithm used
 * @returns true if file is intact
 */
export function verifyFileIntegrity(
  fileData: Buffer,
  expectedHash: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  console.log('→ Verifying file integrity...');

  const calculatedHash = crypto
    .createHash(algorithm)
    .update(fileData)
    .digest('hex');

  // Constant-time comparison
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const calculatedBuffer = Buffer.from(calculatedHash, 'hex');

  if (expectedBuffer.length !== calculatedBuffer.length) {
    console.error('✗ File integrity check failed - hash length mismatch');
    return false;
  }

  const isValid = crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);

  if (isValid) {
    console.log('✓ File integrity verified - hash matches');
  } else {
    console.error('✗ File integrity check failed - file may be corrupted or tampered');
  }

  return isValid;
}

/**
 * Generate HMAC (Hash-based Message Authentication Code)
 * Combines hashing with a secret key for authentication
 *
 * @param data - Data to authenticate
 * @param key - Secret key
 * @returns HMAC hex string
 *
 * USE CASES:
 * - API request signing
 * - Webhook signature verification
 * - Message authentication
 * - Prevent tampering with encrypted data
 */
export function generateHMAC(data: string | Buffer, key: string | Buffer): string {
  console.log('→ Generating HMAC...');

  const hmac = crypto
    .createHmac(HASH_CONFIG.HMAC_ALGORITHM, key)
    .update(data)
    .digest('hex');

  console.log('✓ HMAC generated');
  console.log('  HMAC:', hmac.substring(0, 32) + '...');

  return hmac;
}

/**
 * Verify HMAC
 *
 * @param data - Original data
 * @param key - Secret key
 * @param expectedHmac - Expected HMAC value
 * @returns true if HMAC is valid
 */
export function verifyHMAC(
  data: string | Buffer,
  key: string | Buffer,
  expectedHmac: string
): boolean {
  console.log('→ Verifying HMAC...');

  const calculatedHmac = generateHMAC(data, key);

  // Constant-time comparison
  const expectedBuffer = Buffer.from(expectedHmac, 'hex');
  const calculatedBuffer = Buffer.from(calculatedHmac, 'hex');

  if (expectedBuffer.length !== calculatedBuffer.length) {
    console.error('✗ HMAC verification failed');
    return false;
  }

  const isValid = crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);

  if (isValid) {
    console.log('✓ HMAC verified - data is authentic');
  } else {
    console.error('✗ HMAC verification failed - data may be tampered');
  }

  return isValid;
}

/**
 * Generate secure random salt
 *
 * @param length - Salt length in bytes
 * @returns Random salt as hex string
 */
export function generateSalt(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Calculate hash of multiple files (e.g., for directory verification)
 *
 * @param files - Array of file data
 * @returns Combined hash
 */
export function hashMultipleFiles(files: Buffer[]): string {
  console.log('→ Hashing multiple files...');
  console.log('  Number of files:', files.length);

  const hash = crypto.createHash('sha256');

  files.forEach((file, index) => {
    console.log(`  Hashing file ${index + 1}: ${file.length} bytes`);
    hash.update(file);
  });

  const result = hash.digest('hex');
  console.log('✓ Combined hash calculated');

  return result;
}

/**
 * Example: Comprehensive Hashing Demonstration
 */
export async function demonstrateHashing() {
  console.log('\n=== Cryptographic Hashing Example ===\n');

  // =============================================================================
  // Part 1: Password Hashing with bcrypt (RECOMMENDED)
  // =============================================================================
  console.log('Part 1: Password Hashing with bcrypt');
  console.log('═════════════════════════════════════════════════════════\n');

  const password = 'MySecurePassword123!';
  console.log('Original password:', password);
  console.log('');

  // Hash password
  const hashedBcrypt = await hashPasswordBcrypt(password);
  console.log('Bcrypt hash:', hashedBcrypt.hash);
  console.log('');

  // Verify correct password
  console.log('Verifying correct password:');
  const validPassword = await verifyPasswordBcrypt(password, hashedBcrypt.hash);
  console.log('Result:', validPassword ? '✓ Valid' : '✗ Invalid');
  console.log('');

  // Verify incorrect password
  console.log('Verifying incorrect password:');
  const invalidPassword = await verifyPasswordBcrypt('WrongPassword', hashedBcrypt.hash);
  console.log('Result:', invalidPassword ? '✓ Valid' : '✗ Invalid');
  console.log('');

  // =============================================================================
  // Part 2: Password Hashing with PBKDF2
  // =============================================================================
  console.log('Part 2: Password Hashing with PBKDF2');
  console.log('═════════════════════════════════════════════════════════\n');

  const hashedPBKDF2 = hashPasswordPBKDF2(password);
  console.log('PBKDF2 hash:', hashedPBKDF2.hash.substring(0, 64) + '...');
  console.log('Salt:', hashedPBKDF2.salt?.substring(0, 32) + '...');
  console.log('');

  const validPBKDF2 = verifyPasswordPBKDF2(password, hashedPBKDF2);
  console.log('Verification result:', validPBKDF2 ? '✓ Valid' : '✗ Invalid');
  console.log('');

  // =============================================================================
  // Part 3: Data Integrity Hashing (SHA-256)
  // =============================================================================
  console.log('Part 3: Data Integrity Hashing');
  console.log('═════════════════════════════════════════════════════════\n');

  const data = 'Important data that must not be tampered with';
  console.log('Original data:', data);
  console.log('');

  const sha256Hash = hashSHA256(data);
  console.log('SHA-256 hash:', sha256Hash);
  console.log('');

  const sha512Hash = hashSHA512(data);
  console.log('SHA-512 hash:', sha512Hash);
  console.log('');

  // Demonstrate hash sensitivity
  console.log('Hash sensitivity demonstration:');
  const slightlyDifferent = 'Important data that must not be tampered wit'; // One char less
  const differentHash = hashSHA256(slightlyDifferent);
  console.log('Original hash:', sha256Hash);
  console.log('Modified hash:', differentHash);
  console.log('Completely different:', sha256Hash !== differentHash ? '✓' : '✗');
  console.log('');

  // =============================================================================
  // Part 4: File Integrity Verification
  // =============================================================================
  console.log('Part 4: File Integrity Verification');
  console.log('═════════════════════════════════════════════════════════\n');

  const fileContent = Buffer.from('This is the content of an important file');
  const fileHashInfo = hashFile(fileContent);
  console.log('');

  // Verify file integrity (same content)
  console.log('Verifying intact file:');
  const intactFile = verifyFileIntegrity(fileContent, fileHashInfo.hash);
  console.log('');

  // Verify file integrity (tampered content)
  console.log('Verifying tampered file:');
  const tamperedContent = Buffer.from('This is the content of an important file!'); // Added '!'
  const tamperedFile = verifyFileIntegrity(tamperedContent, fileHashInfo.hash);
  console.log('');

  // =============================================================================
  // Part 5: HMAC (Message Authentication)
  // =============================================================================
  console.log('Part 5: HMAC (Message Authentication)');
  console.log('═════════════════════════════════════════════════════════\n');

  const message = 'Transfer $1000 to account 12345';
  const secretKey = 'shared-secret-key-between-parties';

  console.log('Message:', message);
  console.log('Secret key:', secretKey);
  console.log('');

  const hmac = generateHMAC(message, secretKey);
  console.log('');

  // Verify valid HMAC
  console.log('Verifying authentic message:');
  const validHmac = verifyHMAC(message, secretKey, hmac);
  console.log('');

  // Verify tampered message
  console.log('Verifying tampered message:');
  const tamperedMessage = 'Transfer $9999 to account 12345'; // Amount changed
  const tamperedHmac = verifyHMAC(tamperedMessage, secretKey, hmac);
  console.log('');

  // =============================================================================
  // Part 6: Multiple Files Hash
  // =============================================================================
  console.log('Part 6: Multiple Files Hash');
  console.log('═════════════════════════════════════════════════════════\n');

  const file1 = Buffer.from('Content of file 1');
  const file2 = Buffer.from('Content of file 2');
  const file3 = Buffer.from('Content of file 3');

  const combinedHash = hashMultipleFiles([file1, file2, file3]);
  console.log('Combined hash:', combinedHash);
  console.log('');

  // =============================================================================
  // Part 7: Performance Comparison
  // =============================================================================
  console.log('Part 7: Performance Comparison');
  console.log('═════════════════════════════════════════════════════════\n');

  const testData = 'Test data for performance comparison';

  console.log('Hashing performance (1000 iterations):');

  // SHA-256 (fast - unsuitable for passwords)
  let start = Date.now();
  for (let i = 0; i < 1000; i++) {
    hashSHA256(testData);
  }
  console.log('  SHA-256:  ', Date.now() - start, 'ms (Too fast for passwords!)');

  // bcrypt (slow - good for passwords)
  start = Date.now();
  for (let i = 0; i < 10; i++) {  // Only 10 iterations due to slowness
    await hashPasswordBcrypt(testData, 10);
  }
  console.log('  bcrypt:   ', (Date.now() - start) * 100, 'ms (estimated for 1000)');
  console.log('');

  // =============================================================================
  // Best Practices Summary
  // =============================================================================
  console.log('═════════════════════════════════════════════════════════');
  console.log('Hashing Best Practices:');
  console.log('═════════════════════════════════════════════════════════');
  console.log('Password Storage:');
  console.log('  ✓ Use bcrypt, argon2, or scrypt (NOT SHA-256!)');
  console.log('  ✓ Use high cost factor (bcrypt rounds: 10-12)');
  console.log('  ✓ Each password gets unique salt (automatic with bcrypt)');
  console.log('  ✓ Use constant-time comparison for verification');
  console.log('  ✓ Never store passwords in plain text');
  console.log('');
  console.log('Data Integrity:');
  console.log('  ✓ Use SHA-256 or SHA-512 for checksums');
  console.log('  ✓ Verify file downloads with published hashes');
  console.log('  ✓ Hash before and after transmission');
  console.log('  ✓ Use cryptographically secure hash functions');
  console.log('');
  console.log('Message Authentication:');
  console.log('  ✓ Use HMAC to verify data authenticity');
  console.log('  ✓ Combine with encryption for full security');
  console.log('  ✓ Protect HMAC keys like encryption keys');
  console.log('  ✓ Use timing-safe comparison for HMAC verification');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('Common Mistakes to Avoid:');
  console.log('  ✗ Using SHA-256 for password storage');
  console.log('  ✗ Not using salt for password hashing');
  console.log('  ✗ Using same salt for all passwords');
  console.log('  ✗ Using non-constant-time comparison');
  console.log('  ✗ Using MD5 or SHA-1 (deprecated, insecure)');
  console.log('  ✗ Implementing your own hashing algorithm');
  console.log('');

  console.log('=== Hashing Example Complete ===\n');
}

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateHashing().catch(console.error);
}
