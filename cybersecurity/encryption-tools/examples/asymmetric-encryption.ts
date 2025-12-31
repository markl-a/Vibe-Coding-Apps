/**
 * Asymmetric Encryption Example (RSA)
 *
 * This example demonstrates public-key cryptography using RSA encryption.
 * Asymmetric encryption uses a key pair: public key (encrypt) and private key (decrypt).
 *
 * Use Cases:
 * - Secure key exchange
 * - Digital signatures
 * - SSL/TLS certificates
 * - Email encryption (PGP/GPG)
 * - Hybrid encryption (RSA for key, AES for data)
 *
 * Security Best Practices:
 * 1. Use minimum 2048-bit keys (4096-bit for high security)
 * 2. Use OAEP padding (not PKCS#1 v1.5)
 * 3. Protect private keys with strong passphrases
 * 4. Use hybrid encryption for large data
 * 5. Implement proper key management and rotation
 * 6. Never share private keys
 * 7. Verify public key authenticity (certificates, fingerprints)
 */

import crypto from 'crypto';

// RSA configuration
const RSA_CONFIG = {
  // Key sizes (in bits)
  KEY_SIZE_2048: 2048,  // Minimum recommended
  KEY_SIZE_4096: 4096,  // High security

  // Padding schemes
  PADDING_OAEP: crypto.constants.RSA_PKCS1_OAEP_PADDING,  // Recommended
  PADDING_PKCS1: crypto.constants.RSA_PKCS1_PADDING,      // Legacy (less secure)

  // Hash algorithms for OAEP
  OAEP_HASH: 'sha256',
};

// Type definitions
interface RSAKeyPair {
  publicKey: string;   // PEM format
  privateKey: string;  // PEM format
  keySize: number;     // In bits
}

interface EncryptedMessage {
  ciphertext: string;      // Base64 encoded
  algorithm: string;
  keySize: number;
}

interface HybridEncrypted {
  encryptedData: string;      // AES encrypted data (base64)
  encryptedKey: string;       // RSA encrypted AES key (base64)
  iv: string;                 // AES IV (base64)
  authTag: string;            // AES-GCM auth tag (base64)
}

/**
 * Generate RSA key pair
 *
 * @param keySize - Key size in bits (2048 or 4096)
 * @param passphrase - Optional passphrase to encrypt private key
 * @returns RSA key pair in PEM format
 *
 * SECURITY NOTES:
 * - Use 2048-bit minimum (4096-bit for high security)
 * - Protect private key with passphrase
 * - Store private key securely (encrypted storage, HSM)
 * - Public key can be shared freely
 */
export function generateRSAKeyPair(
  keySize: number = RSA_CONFIG.KEY_SIZE_2048,
  passphrase?: string
): RSAKeyPair {
  console.log(`→ Generating ${keySize}-bit RSA key pair...`);

  // Validate key size
  if (keySize < 2048) {
    throw new Error('Key size must be at least 2048 bits');
  }

  // Generate key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: keySize,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      ...(passphrase && {
        cipher: 'aes-256-cbc',
        passphrase: passphrase,
      }),
    },
  });

  console.log('✓ RSA key pair generated successfully');
  console.log('  Key size:', keySize, 'bits');
  console.log('  Private key encrypted:', passphrase ? 'Yes' : 'No');

  return {
    publicKey,
    privateKey,
    keySize,
  };
}

/**
 * Encrypt data with RSA public key
 *
 * @param plaintext - Data to encrypt (max ~190 bytes for 2048-bit key)
 * @param publicKey - RSA public key in PEM format
 * @returns Encrypted message
 *
 * LIMITATIONS:
 * - RSA can only encrypt small amounts of data
 * - Max plaintext size ≈ (keySize / 8) - padding overhead
 * - For 2048-bit key: max ~190 bytes with OAEP
 * - For 4096-bit key: max ~446 bytes with OAEP
 * - Use hybrid encryption for larger data
 *
 * SECURITY:
 * - Uses OAEP padding (Optimal Asymmetric Encryption Padding)
 * - OAEP provides semantic security and prevents attacks
 */
export function encryptRSA(plaintext: string, publicKey: string): EncryptedMessage {
  console.log('→ Encrypting with RSA public key...');

  try {
    // Encrypt with OAEP padding
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: RSA_CONFIG.PADDING_OAEP,
        oaepHash: RSA_CONFIG.OAEP_HASH,
      },
      Buffer.from(plaintext, 'utf8')
    );

    console.log('✓ RSA encryption successful');
    console.log('  Plaintext size:', plaintext.length, 'bytes');
    console.log('  Ciphertext size:', encrypted.length, 'bytes');

    return {
      ciphertext: encrypted.toString('base64'),
      algorithm: 'RSA-OAEP',
      keySize: publicKey.includes('BEGIN PUBLIC KEY') ? 2048 : 0, // Approximate
    };
  } catch (error) {
    console.error('✗ RSA encryption failed:', error);
    throw new Error('RSA encryption failed - data may be too large');
  }
}

/**
 * Decrypt RSA encrypted data with private key
 *
 * @param encryptedMessage - Encrypted message object
 * @param privateKey - RSA private key in PEM format
 * @param passphrase - Passphrase if private key is encrypted
 * @returns Decrypted plaintext
 */
export function decryptRSA(
  encryptedMessage: EncryptedMessage,
  privateKey: string,
  passphrase?: string
): string {
  console.log('→ Decrypting with RSA private key...');

  try {
    const ciphertext = Buffer.from(encryptedMessage.ciphertext, 'base64');

    // Decrypt with OAEP padding
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: RSA_CONFIG.PADDING_OAEP,
        oaepHash: RSA_CONFIG.OAEP_HASH,
        ...(passphrase && { passphrase }),
      },
      ciphertext
    );

    console.log('✓ RSA decryption successful');
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('✗ RSA decryption failed:', error);
    throw new Error('RSA decryption failed - invalid key or corrupted data');
  }
}

/**
 * Hybrid encryption: RSA for key, AES for data
 * This is the standard approach for encrypting large amounts of data
 *
 * Process:
 * 1. Generate random AES key
 * 2. Encrypt data with AES-GCM
 * 3. Encrypt AES key with RSA public key
 * 4. Send encrypted data + encrypted key
 *
 * @param plaintext - Data to encrypt (any size)
 * @param publicKey - RSA public key
 * @returns Hybrid encrypted package
 *
 * ADVANTAGES:
 * - Can encrypt unlimited data size
 * - AES is much faster than RSA
 * - Combines security of RSA with efficiency of AES
 */
export function hybridEncrypt(plaintext: string, publicKey: string): HybridEncrypted {
  console.log('→ Performing hybrid encryption...');
  console.log('  Data size:', plaintext.length, 'bytes');

  // 1. Generate random AES-256 key
  const aesKey = crypto.randomBytes(32); // 256 bits
  const iv = crypto.randomBytes(16);     // 128 bits

  console.log('  1. Generated AES-256 key');

  // 2. Encrypt data with AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  let encryptedData = cipher.update(plaintext, 'utf8', 'base64');
  encryptedData += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  console.log('  2. Encrypted data with AES-256-GCM');

  // 3. Encrypt AES key with RSA
  const encryptedKey = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: RSA_CONFIG.PADDING_OAEP,
      oaepHash: RSA_CONFIG.OAEP_HASH,
    },
    aesKey
  );

  console.log('  3. Encrypted AES key with RSA');
  console.log('✓ Hybrid encryption complete');

  return {
    encryptedData,
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Decrypt hybrid encrypted data
 *
 * @param encrypted - Hybrid encrypted package
 * @param privateKey - RSA private key
 * @param passphrase - Passphrase if private key is encrypted
 * @returns Decrypted plaintext
 */
export function hybridDecrypt(
  encrypted: HybridEncrypted,
  privateKey: string,
  passphrase?: string
): string {
  console.log('→ Performing hybrid decryption...');

  try {
    // 1. Decrypt AES key with RSA private key
    const encryptedKeyBuffer = Buffer.from(encrypted.encryptedKey, 'base64');
    const aesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: RSA_CONFIG.PADDING_OAEP,
        oaepHash: RSA_CONFIG.OAEP_HASH,
        ...(passphrase && { passphrase }),
      },
      encryptedKeyBuffer
    );

    console.log('  1. Decrypted AES key with RSA');

    // 2. Decrypt data with AES-GCM
    const iv = Buffer.from(encrypted.iv, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(encrypted.encryptedData, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    console.log('  2. Decrypted data with AES-256-GCM');
    console.log('✓ Hybrid decryption complete');

    return plaintext;
  } catch (error) {
    console.error('✗ Hybrid decryption failed:', error);
    throw new Error('Hybrid decryption failed');
  }
}

/**
 * Export public key to shareable format
 *
 * @param keyPair - RSA key pair
 * @returns Public key fingerprint and PEM
 */
export function exportPublicKey(keyPair: RSAKeyPair): {
  publicKey: string;
  fingerprint: string;
  keySize: number;
} {
  // Calculate fingerprint (SHA-256 hash of public key)
  const fingerprint = crypto
    .createHash('sha256')
    .update(keyPair.publicKey)
    .digest('hex');

  console.log('✓ Public key exported');
  console.log('  Fingerprint:', fingerprint.substring(0, 32) + '...');

  return {
    publicKey: keyPair.publicKey,
    fingerprint,
    keySize: keyPair.keySize,
  };
}

/**
 * Verify public key fingerprint
 * Use this to verify you have the correct public key
 *
 * @param publicKey - Public key to verify
 * @param expectedFingerprint - Expected fingerprint
 * @returns true if fingerprint matches
 */
export function verifyPublicKeyFingerprint(
  publicKey: string,
  expectedFingerprint: string
): boolean {
  const fingerprint = crypto
    .createHash('sha256')
    .update(publicKey)
    .digest('hex');

  const match = fingerprint === expectedFingerprint;

  if (match) {
    console.log('✓ Public key fingerprint verified');
  } else {
    console.error('✗ Public key fingerprint mismatch!');
    console.error('  Expected:', expectedFingerprint);
    console.error('  Got:', fingerprint);
  }

  return match;
}

/**
 * Example: Comprehensive Asymmetric Encryption Demonstration
 */
export function demonstrateAsymmetricEncryption() {
  console.log('\n=== Asymmetric Encryption (RSA) Example ===\n');

  // =============================================================================
  // Step 1: Generate Key Pairs
  // =============================================================================
  console.log('Step 1: Generate RSA Key Pairs');
  console.log('═════════════════════════════════════════════════════════\n');

  // Alice generates her key pair (with passphrase protection)
  const aliceKeys = generateRSAKeyPair(2048, 'AliceSecretPassphrase123');
  console.log('Alice\'s public key (first 60 chars):');
  console.log(aliceKeys.publicKey.substring(0, 60) + '...\n');

  // Bob generates his key pair
  const bobKeys = generateRSAKeyPair(2048);
  console.log('Bob\'s public key (first 60 chars):');
  console.log(bobKeys.publicKey.substring(0, 60) + '...\n');

  // =============================================================================
  // Step 2: Public Key Exchange and Verification
  // =============================================================================
  console.log('Step 2: Public Key Exchange and Verification');
  console.log('═════════════════════════════════════════════════════════\n');

  const alicePublicExport = exportPublicKey(aliceKeys);
  console.log('Alice shares her public key:');
  console.log('  Key size:', alicePublicExport.keySize, 'bits');
  console.log('  Fingerprint:', alicePublicExport.fingerprint.substring(0, 32) + '...\n');

  // Bob verifies Alice's public key fingerprint (out-of-band verification)
  const verified = verifyPublicKeyFingerprint(
    aliceKeys.publicKey,
    alicePublicExport.fingerprint
  );
  console.log('Bob verifies Alice\'s public key:', verified ? '✓' : '✗');
  console.log('');

  // =============================================================================
  // Step 3: Basic RSA Encryption (Small Data)
  // =============================================================================
  console.log('Step 3: Basic RSA Encryption (Small Data)');
  console.log('═════════════════════════════════════════════════════════\n');

  const secretMessage = 'Meet me at the secret location at midnight!';
  console.log('Bob\'s secret message:', secretMessage);
  console.log('Message length:', secretMessage.length, 'bytes\n');

  // Bob encrypts message with Alice's public key
  const encryptedMessage = encryptRSA(secretMessage, aliceKeys.publicKey);
  console.log('Encrypted message (first 60 chars):');
  console.log(encryptedMessage.ciphertext.substring(0, 60) + '...\n');

  // Alice decrypts message with her private key
  const decryptedMessage = decryptRSA(
    encryptedMessage,
    aliceKeys.privateKey,
    'AliceSecretPassphrase123'
  );
  console.log('Decrypted message:', decryptedMessage);
  console.log('Match:', decryptedMessage === secretMessage ? '✓' : '✗');
  console.log('');

  // =============================================================================
  // Step 4: RSA Size Limitation
  // =============================================================================
  console.log('Step 4: RSA Encryption Size Limitation');
  console.log('═════════════════════════════════════════════════════════\n');

  const largeData = 'A'.repeat(300); // Too large for 2048-bit RSA
  console.log('Attempting to encrypt', largeData.length, 'bytes with RSA...');

  try {
    encryptRSA(largeData, aliceKeys.publicKey);
    console.log('✗ Should have failed - data too large!');
  } catch (error) {
    console.log('✓ Correctly rejected oversized data');
    console.log('  Max size for 2048-bit RSA: ~190 bytes with OAEP\n');
  }

  // =============================================================================
  // Step 5: Hybrid Encryption (Large Data)
  // =============================================================================
  console.log('Step 5: Hybrid Encryption (Large Data)');
  console.log('═════════════════════════════════════════════════════════\n');

  const largeDocument = `
    This is a large document that needs to be encrypted.
    It contains sensitive information that should only be
    readable by the intended recipient. RSA alone cannot
    encrypt this much data efficiently, so we use hybrid
    encryption: AES for the data, RSA for the key.
    This approach combines the security of RSA with the
    efficiency of AES symmetric encryption.
  `.repeat(10); // Make it even larger

  console.log('Document size:', largeDocument.length, 'bytes');
  console.log('Bob encrypts large document for Alice...\n');

  const hybridEncrypted = hybridEncrypt(largeDocument, aliceKeys.publicKey);
  console.log('Encrypted package:');
  console.log('  Encrypted data size:', hybridEncrypted.encryptedData.length, 'chars');
  console.log('  Encrypted AES key size:', hybridEncrypted.encryptedKey.length, 'chars');
  console.log('');

  const hybridDecrypted = hybridDecrypt(
    hybridEncrypted,
    aliceKeys.privateKey,
    'AliceSecretPassphrase123'
  );

  console.log('Decrypted document size:', hybridDecrypted.length, 'bytes');
  console.log('Match:', hybridDecrypted === largeDocument ? '✓' : '✗');
  console.log('');

  // =============================================================================
  // Step 6: Security Demonstrations
  // =============================================================================
  console.log('Step 6: Security Features');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('1. Wrong private key:');
  try {
    decryptRSA(encryptedMessage, bobKeys.privateKey);
    console.log('   ✗ Should have failed!');
  } catch (error) {
    console.log('   ✓ Correctly rejected wrong private key\n');
  }

  console.log('2. Wrong passphrase:');
  try {
    decryptRSA(encryptedMessage, aliceKeys.privateKey, 'WrongPassphrase');
    console.log('   ✗ Should have failed!');
  } catch (error) {
    console.log('   ✓ Correctly rejected wrong passphrase\n');
  }

  console.log('3. Different ciphertexts for same message:');
  const enc1 = encryptRSA(secretMessage, aliceKeys.publicKey);
  const enc2 = encryptRSA(secretMessage, aliceKeys.publicKey);
  console.log('   Same plaintext, different ciphertexts:', enc1.ciphertext !== enc2.ciphertext ? '✓' : '✗');
  console.log('   (OAEP padding includes randomness)\n');

  // =============================================================================
  // Step 7: Key Size Comparison
  // =============================================================================
  console.log('Step 7: Key Size Comparison');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('Generating 4096-bit key pair...');
  const highSecurityKeys = generateRSAKeyPair(4096);
  console.log('Public key size (2048-bit):', aliceKeys.publicKey.length, 'chars');
  console.log('Public key size (4096-bit):', highSecurityKeys.publicKey.length, 'chars');
  console.log('\nRecommendation: Use 2048-bit for general use, 4096-bit for high security\n');

  // =============================================================================
  // Best Practices Summary
  // =============================================================================
  console.log('═════════════════════════════════════════════════════════');
  console.log('Asymmetric Encryption Best Practices:');
  console.log('═════════════════════════════════════════════════════════');
  console.log('✓ Use minimum 2048-bit keys (4096-bit for high security)');
  console.log('✓ Use OAEP padding (not PKCS#1 v1.5)');
  console.log('✓ Protect private keys with strong passphrases');
  console.log('✓ Use hybrid encryption for large data');
  console.log('✓ Verify public key fingerprints out-of-band');
  console.log('✓ Store private keys securely (encrypted, HSM)');
  console.log('✓ Never share private keys');
  console.log('✓ Implement key rotation policies');
  console.log('✓ Use certificate authorities for public key verification');
  console.log('✓ RSA for key exchange, AES for data encryption');
  console.log('✓ Consider modern alternatives (ECC, post-quantum)');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('Use Cases:');
  console.log('  • Secure key exchange (SSL/TLS)');
  console.log('  • Email encryption (PGP/GPG)');
  console.log('  • Digital signatures');
  console.log('  • Software licensing');
  console.log('  • Cryptocurrency wallets');
  console.log('');

  console.log('=== Asymmetric Encryption Example Complete ===\n');
}

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateAsymmetricEncryption();
}
