/**
 * Crypto Toolkit Examples
 */

import {
  hash,
  hmac,
  verifyHmac,
  generateSymmetricKey,
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  deriveKey,
  createToken,
  verifyToken,
  generatePassword,
  generateRandomHex,
  generateUUID,
  toBase64,
  fromBase64,
} from './index.js';

function main() {
  console.log('='.repeat(60));
  console.log('Crypto Toolkit Examples');
  console.log('='.repeat(60));

  // Example 1: Hashing
  console.log('\n🔒 Example 1: Hashing');
  console.log('-'.repeat(40));

  const message = 'Hello, World!';

  const sha256 = hash(message, 'sha256');
  console.log(`SHA-256: ${sha256.digest}`);

  const sha512 = hash(message, 'sha512');
  console.log(`SHA-512: ${sha512.digest.substring(0, 64)}...`);

  const md5 = hash(message, 'md5');
  console.log(`MD5: ${md5.digest}`);

  // Example 2: HMAC
  console.log('\n🔑 Example 2: HMAC');
  console.log('-'.repeat(40));

  const secret = generateRandomHex(32);
  const data = 'Important message';

  const signature = hmac(data, secret);
  console.log(`HMAC: ${signature}`);

  const isValid = verifyHmac(data, secret, signature);
  console.log(`Verification: ${isValid ? '✓ Valid' : '✗ Invalid'}`);

  const tampered = verifyHmac(data + 'x', secret, signature);
  console.log(`Tampered verification: ${tampered ? '✓ Valid' : '✗ Invalid'}`);

  // Example 3: Symmetric Encryption
  console.log('\n🔐 Example 3: Symmetric Encryption (AES-256-GCM)');
  console.log('-'.repeat(40));

  const key = generateSymmetricKey('aes-256-gcm');
  console.log(`Key ID: ${key.id}`);

  const plaintext = 'This is a secret message!';
  const encrypted = encrypt(plaintext, key.key, 'aes-256-gcm');
  console.log(`Ciphertext: ${encrypted.ciphertext.substring(0, 32)}...`);
  console.log(`IV: ${encrypted.iv}`);
  console.log(`Tag: ${encrypted.tag}`);

  const decrypted = decrypt(encrypted, key.key);
  console.log(`Decrypted: ${decrypted}`);
  console.log(`Match: ${decrypted === plaintext ? '✓' : '✗'}`);

  // Example 4: Password Hashing
  console.log('\n🔑 Example 4: Password Hashing');
  console.log('-'.repeat(40));

  const password = 'SuperSecureP@ssw0rd!';

  // PBKDF2
  const pbkdf2Hash = hashPassword(password, { algorithm: 'pbkdf2', iterations: 100000 });
  console.log(`PBKDF2 Hash: ${pbkdf2Hash.hash.substring(0, 32)}...`);
  console.log(`Salt: ${pbkdf2Hash.salt.substring(0, 16)}...`);

  const pbkdf2Valid = verifyPassword(password, pbkdf2Hash);
  console.log(`PBKDF2 Verification: ${pbkdf2Valid ? '✓ Valid' : '✗ Invalid'}`);

  // Scrypt
  const scryptHash = hashPassword(password, { algorithm: 'scrypt', memorySize: 16384 });
  console.log(`Scrypt Hash: ${scryptHash.hash.substring(0, 32)}...`);

  const scryptValid = verifyPassword(password, scryptHash);
  console.log(`Scrypt Verification: ${scryptValid ? '✓ Valid' : '✗ Invalid'}`);

  const wrongPassword = verifyPassword('wrong', pbkdf2Hash);
  console.log(`Wrong password: ${wrongPassword ? '✓ Valid' : '✗ Invalid'}`);

  // Example 5: Key Derivation
  console.log('\n🔧 Example 5: Key Derivation');
  console.log('-'.repeat(40));

  const masterPassword = 'master-password';
  const salt = generateRandomHex(32);

  const derivedKey = deriveKey(masterPassword, Buffer.from(salt, 'hex'), {
    algorithm: 'pbkdf2',
    hash: 'sha256',
    iterations: 100000,
    keyLength: 32,
  });

  console.log(`Derived key: ${derivedKey.toString('hex')}`);
  console.log(`Key length: ${derivedKey.length} bytes`);

  // Example 6: JWT-like Tokens
  console.log('\n🎫 Example 6: JWT Tokens');
  console.log('-'.repeat(40));

  const tokenSecret = generateRandomHex(64);

  const token = createToken(
    { sub: 'user_123', name: 'John Doe', role: 'admin' },
    tokenSecret,
    { expiresIn: 3600, issuer: 'example.com' }
  );

  console.log(`Token: ${token.substring(0, 50)}...`);

  const verified = verifyToken(token, tokenSecret);
  console.log(`Token valid: ${verified.valid}`);
  if (verified.payload) {
    console.log(`Subject: ${verified.payload.sub}`);
    console.log(`Name: ${verified.payload.name}`);
    console.log(`Role: ${verified.payload.role}`);
  }

  // Invalid token
  const invalidResult = verifyToken(token + 'x', tokenSecret);
  console.log(`Tampered token: ${invalidResult.error}`);

  // Example 7: Password Generation
  console.log('\n🔑 Example 7: Password Generation');
  console.log('-'.repeat(40));

  console.log('Generated passwords:');
  console.log(`  Default (16): ${generatePassword(16)}`);
  console.log(`  Long (32): ${generatePassword(32)}`);
  console.log(`  No symbols: ${generatePassword(16, { symbols: false })}`);
  console.log(`  Numbers only: ${generatePassword(8, {
    uppercase: false,
    lowercase: false,
    symbols: false
  })}`);

  // Example 8: Random Generation
  console.log('\n🎲 Example 8: Random Generation');
  console.log('-'.repeat(40));

  console.log(`Random hex (16): ${generateRandomHex(16)}`);
  console.log(`Random hex (32): ${generateRandomHex(32)}`);
  console.log(`UUID v4: ${generateUUID()}`);
  console.log(`UUID v4: ${generateUUID()}`);

  // Example 9: Base64 Encoding
  console.log('\n📝 Example 9: Base64 Encoding');
  console.log('-'.repeat(40));

  const original = 'Hello, 世界! 🌍';
  const encoded = toBase64(original);
  const decoded = fromBase64(encoded);

  console.log(`Original: ${original}`);
  console.log(`Encoded: ${encoded}`);
  console.log(`Decoded: ${decoded}`);
  console.log(`Match: ${original === decoded ? '✓' : '✗'}`);

  // Example 10: Complete encryption workflow
  console.log('\n🔄 Example 10: Complete Encryption Workflow');
  console.log('-'.repeat(40));

  // 1. User provides password
  const userPassword = 'user-secret-password';

  // 2. Derive encryption key from password
  const keySalt = generateRandomHex(32);
  const encryptionKey = deriveKey(userPassword, Buffer.from(keySalt, 'hex'), {
    algorithm: 'pbkdf2',
    hash: 'sha256',
    iterations: 100000,
    keyLength: 32,
  });

  // 3. Encrypt sensitive data
  const sensitiveData = JSON.stringify({
    creditCard: '4242-4242-4242-4242',
    cvv: '123',
    expiry: '12/25',
  });

  const encryptedData = encrypt(sensitiveData, encryptionKey, 'aes-256-gcm');

  console.log('Encrypted credit card data:');
  console.log(`  Salt: ${keySalt.substring(0, 16)}...`);
  console.log(`  IV: ${encryptedData.iv}`);
  console.log(`  Ciphertext: ${encryptedData.ciphertext.substring(0, 32)}...`);

  // 4. Later, decrypt with same password
  const decryptionKey = deriveKey(userPassword, Buffer.from(keySalt, 'hex'), {
    algorithm: 'pbkdf2',
    hash: 'sha256',
    iterations: 100000,
    keyLength: 32,
  });

  const decryptedData = decrypt(encryptedData, decryptionKey);
  const parsed = JSON.parse(decryptedData);

  console.log('Decrypted:');
  console.log(`  Card: ${parsed.creditCard}`);
  console.log(`  CVV: ***`);

  console.log('\n' + '='.repeat(60));
  console.log('Examples complete!');
}

main();
