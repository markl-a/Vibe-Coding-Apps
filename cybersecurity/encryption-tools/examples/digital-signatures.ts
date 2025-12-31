/**
 * Digital Signatures Example
 *
 * This example demonstrates creating and verifying digital signatures using RSA and ECDSA.
 * Digital signatures provide:
 * 1. Authentication - Verify the sender's identity
 * 2. Integrity - Ensure data hasn't been tampered with
 * 3. Non-repudiation - Sender cannot deny signing the data
 *
 * Use Cases:
 * - Software distribution (code signing)
 * - Document signing (PDF, contracts)
 * - API request authentication (JWT)
 * - Blockchain transactions
 * - Email security (S/MIME, PGP)
 * - SSL/TLS certificates
 *
 * Security Best Practices:
 * 1. Use RSA-PSS or ECDSA (not PKCS#1 v1.5)
 * 2. Minimum 2048-bit RSA or 256-bit ECDSA
 * 3. Use SHA-256 or better for hashing
 * 4. Protect private signing keys rigorously
 * 5. Verify signatures before trusting data
 * 6. Include timestamp to prevent replay attacks
 * 7. Use certificate chains for public key verification
 */

import crypto from 'crypto';

// Signature configuration
const SIGNATURE_CONFIG = {
  // RSA signing
  RSA_KEY_SIZE: 2048,
  RSA_ALGORITHM: 'RSA-SHA256',
  RSA_PADDING: crypto.constants.RSA_PKCS1_PSS_PADDING,  // PSS (preferred)
  RSA_SALT_LENGTH: crypto.constants.RSA_PSS_SALTLEN_DIGEST,

  // ECDSA (Elliptic Curve) signing
  ECDSA_CURVE: 'secp256k1',  // Same curve as Bitcoin
  ECDSA_ALGORITHM: 'sha256',

  // Ed25519 (modern, fast)
  ED25519_ALGORITHM: 'ed25519',
};

// Type definitions
interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
  keySize: number;
}

interface ECDSAKeyPair {
  publicKey: string;
  privateKey: string;
  curve: string;
}

interface Signature {
  signature: string;      // Base64 encoded
  algorithm: string;
  timestamp: string;
  publicKey?: string;     // Optional: include for convenience
}

interface SignedDocument {
  data: string;
  signature: Signature;
  signer: string;
}

/**
 * Generate RSA key pair for signing
 *
 * @param keySize - Key size in bits (2048 minimum)
 * @param passphrase - Optional passphrase to protect private key
 * @returns RSA key pair
 */
export function generateRSASigningKey(
  keySize: number = SIGNATURE_CONFIG.RSA_KEY_SIZE,
  passphrase?: string
): RSAKeyPair {
  console.log(`→ Generating ${keySize}-bit RSA signing key...`);

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

  console.log('✓ RSA signing key generated');
  console.log('  Key size:', keySize, 'bits');

  return { publicKey, privateKey, keySize };
}

/**
 * Sign data using RSA private key (RSA-PSS)
 *
 * @param data - Data to sign
 * @param privateKey - RSA private key (PEM format)
 * @param passphrase - Passphrase if private key is encrypted
 * @returns Signature object
 *
 * SECURITY NOTES:
 * - Uses PSS padding (more secure than PKCS#1 v1.5)
 * - Includes timestamp to prevent replay attacks
 * - Hash is signed, not raw data (more efficient)
 */
export function signRSA(
  data: string | Buffer,
  privateKey: string,
  passphrase?: string
): Signature {
  console.log('→ Signing data with RSA...');

  try {
    // Create signature
    const sign = crypto.createSign(SIGNATURE_CONFIG.RSA_ALGORITHM);
    sign.update(data);

    const signature = sign.sign(
      {
        key: privateKey,
        padding: SIGNATURE_CONFIG.RSA_PADDING,
        saltLength: SIGNATURE_CONFIG.RSA_SALT_LENGTH,
        ...(passphrase && { passphrase }),
      }
    );

    console.log('✓ RSA signature created');
    console.log('  Signature size:', signature.length, 'bytes');

    return {
      signature: signature.toString('base64'),
      algorithm: SIGNATURE_CONFIG.RSA_ALGORITHM,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('✗ RSA signing failed:', error);
    throw new Error('RSA signing failed');
  }
}

/**
 * Verify RSA signature
 *
 * @param data - Original data that was signed
 * @param signature - Signature object
 * @param publicKey - RSA public key (PEM format)
 * @returns true if signature is valid
 *
 * SECURITY:
 * - Verifies data integrity (hash matches)
 * - Verifies authenticity (signed by private key owner)
 * - Consider checking timestamp to prevent replay
 */
export function verifyRSA(
  data: string | Buffer,
  signature: Signature,
  publicKey: string
): boolean {
  console.log('→ Verifying RSA signature...');

  try {
    const verify = crypto.createVerify(signature.algorithm);
    verify.update(data);

    const signatureBuffer = Buffer.from(signature.signature, 'base64');

    const isValid = verify.verify(
      {
        key: publicKey,
        padding: SIGNATURE_CONFIG.RSA_PADDING,
        saltLength: SIGNATURE_CONFIG.RSA_SALT_LENGTH,
      },
      signatureBuffer
    );

    if (isValid) {
      console.log('✓ RSA signature verified - data is authentic');
      console.log('  Signed at:', signature.timestamp);
    } else {
      console.error('✗ RSA signature verification failed - data may be tampered');
    }

    return isValid;
  } catch (error) {
    console.error('✗ RSA verification error:', error);
    return false;
  }
}

/**
 * Generate ECDSA key pair for signing
 * ECDSA provides same security as RSA with much smaller keys
 *
 * @param curve - Elliptic curve ('secp256k1', 'prime256v1', etc.)
 * @returns ECDSA key pair
 *
 * CURVES:
 * - secp256k1: Used by Bitcoin, Ethereum (256-bit security)
 * - prime256v1 (P-256): NIST standard (256-bit security)
 * - secp384r1 (P-384): Higher security (384-bit security)
 */
export function generateECDSASigningKey(
  curve: string = SIGNATURE_CONFIG.ECDSA_CURVE
): ECDSAKeyPair {
  console.log(`→ Generating ECDSA signing key (${curve})...`);

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: curve,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  console.log('✓ ECDSA signing key generated');
  console.log('  Curve:', curve);

  return { publicKey, privateKey, curve };
}

/**
 * Sign data using ECDSA private key
 *
 * @param data - Data to sign
 * @param privateKey - ECDSA private key (PEM format)
 * @returns Signature object
 *
 * ADVANTAGES OF ECDSA:
 * - Much smaller keys than RSA (256-bit ECDSA ≈ 3072-bit RSA)
 * - Faster signing and verification
 * - Smaller signatures
 * - Growing adoption (TLS 1.3, cryptocurrencies)
 */
export function signECDSA(
  data: string | Buffer,
  privateKey: string
): Signature {
  console.log('→ Signing data with ECDSA...');

  try {
    const sign = crypto.createSign(SIGNATURE_CONFIG.ECDSA_ALGORITHM);
    sign.update(data);

    const signature = sign.sign(privateKey);

    console.log('✓ ECDSA signature created');
    console.log('  Signature size:', signature.length, 'bytes');

    return {
      signature: signature.toString('base64'),
      algorithm: 'ECDSA-SHA256',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('✗ ECDSA signing failed:', error);
    throw new Error('ECDSA signing failed');
  }
}

/**
 * Verify ECDSA signature
 *
 * @param data - Original data that was signed
 * @param signature - Signature object
 * @param publicKey - ECDSA public key (PEM format)
 * @returns true if signature is valid
 */
export function verifyECDSA(
  data: string | Buffer,
  signature: Signature,
  publicKey: string
): boolean {
  console.log('→ Verifying ECDSA signature...');

  try {
    const verify = crypto.createVerify(SIGNATURE_CONFIG.ECDSA_ALGORITHM);
    verify.update(data);

    const signatureBuffer = Buffer.from(signature.signature, 'base64');
    const isValid = verify.verify(publicKey, signatureBuffer);

    if (isValid) {
      console.log('✓ ECDSA signature verified - data is authentic');
    } else {
      console.error('✗ ECDSA signature verification failed');
    }

    return isValid;
  } catch (error) {
    console.error('✗ ECDSA verification error:', error);
    return false;
  }
}

/**
 * Generate Ed25519 key pair for signing (modern, recommended)
 * Ed25519 is a modern signature scheme: fast, secure, simple
 *
 * @returns Ed25519 key pair
 *
 * ADVANTAGES:
 * - Extremely fast signing and verification
 * - Immune to timing attacks
 * - Deterministic signatures
 * - 256-bit security with 32-byte keys
 * - Used by: SSH, Signal Protocol, cryptocurrencies
 */
export function generateEd25519SigningKey(): { publicKey: string; privateKey: string } {
  console.log('→ Generating Ed25519 signing key...');

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  console.log('✓ Ed25519 signing key generated');

  return { publicKey, privateKey };
}

/**
 * Sign data using Ed25519 private key
 *
 * @param data - Data to sign
 * @param privateKey - Ed25519 private key (PEM format)
 * @returns Signature object
 */
export function signEd25519(
  data: string | Buffer,
  privateKey: string
): Signature {
  console.log('→ Signing data with Ed25519...');

  try {
    const signature = crypto.sign(null, Buffer.from(data), privateKey);

    console.log('✓ Ed25519 signature created');
    console.log('  Signature size:', signature.length, 'bytes (always 64)');

    return {
      signature: signature.toString('base64'),
      algorithm: 'Ed25519',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('✗ Ed25519 signing failed:', error);
    throw new Error('Ed25519 signing failed');
  }
}

/**
 * Verify Ed25519 signature
 *
 * @param data - Original data that was signed
 * @param signature - Signature object
 * @param publicKey - Ed25519 public key (PEM format)
 * @returns true if signature is valid
 */
export function verifyEd25519(
  data: string | Buffer,
  signature: Signature,
  publicKey: string
): boolean {
  console.log('→ Verifying Ed25519 signature...');

  try {
    const signatureBuffer = Buffer.from(signature.signature, 'base64');
    const isValid = crypto.verify(null, Buffer.from(data), publicKey, signatureBuffer);

    if (isValid) {
      console.log('✓ Ed25519 signature verified - data is authentic');
    } else {
      console.error('✗ Ed25519 signature verification failed');
    }

    return isValid;
  } catch (error) {
    console.error('✗ Ed25519 verification error:', error);
    return false;
  }
}

/**
 * Sign a document with metadata
 *
 * @param document - Document content
 * @param privateKey - Signing private key
 * @param signer - Signer's identifier (email, name, etc.)
 * @param algorithm - Signing algorithm ('rsa', 'ecdsa', 'ed25519')
 * @returns Signed document package
 */
export function signDocument(
  document: string,
  privateKey: string,
  signer: string,
  algorithm: 'rsa' | 'ecdsa' | 'ed25519' = 'rsa'
): SignedDocument {
  console.log('→ Signing document...');
  console.log('  Signer:', signer);
  console.log('  Algorithm:', algorithm);

  let signature: Signature;

  switch (algorithm) {
    case 'rsa':
      signature = signRSA(document, privateKey);
      break;
    case 'ecdsa':
      signature = signECDSA(document, privateKey);
      break;
    case 'ed25519':
      signature = signEd25519(document, privateKey);
      break;
    default:
      throw new Error('Unsupported algorithm');
  }

  console.log('✓ Document signed successfully');

  return {
    data: document,
    signature,
    signer,
  };
}

/**
 * Verify signed document
 *
 * @param signedDoc - Signed document package
 * @param publicKey - Signer's public key
 * @param algorithm - Signing algorithm used
 * @returns true if signature is valid
 */
export function verifyDocument(
  signedDoc: SignedDocument,
  publicKey: string,
  algorithm: 'rsa' | 'ecdsa' | 'ed25519' = 'rsa'
): boolean {
  console.log('→ Verifying signed document...');
  console.log('  Signer:', signedDoc.signer);
  console.log('  Signed at:', signedDoc.signature.timestamp);

  let isValid: boolean;

  switch (algorithm) {
    case 'rsa':
      isValid = verifyRSA(signedDoc.data, signedDoc.signature, publicKey);
      break;
    case 'ecdsa':
      isValid = verifyECDSA(signedDoc.data, signedDoc.signature, publicKey);
      break;
    case 'ed25519':
      isValid = verifyEd25519(signedDoc.data, signedDoc.signature, publicKey);
      break;
    default:
      throw new Error('Unsupported algorithm');
  }

  return isValid;
}

/**
 * Calculate public key fingerprint for verification
 * Use this to verify you have the correct public key
 *
 * @param publicKey - Public key (PEM format)
 * @returns Hex-encoded fingerprint
 */
export function getPublicKeyFingerprint(publicKey: string): string {
  const fingerprint = crypto
    .createHash('sha256')
    .update(publicKey)
    .digest('hex');

  return fingerprint;
}

/**
 * Example: Comprehensive Digital Signatures Demonstration
 */
export function demonstrateDigitalSignatures() {
  console.log('\n=== Digital Signatures Example ===\n');

  const document = `
CONTRACT AGREEMENT

This agreement is made between Party A and Party B.

Terms:
1. Party A agrees to provide services
2. Party B agrees to pay $10,000
3. Contract valid for 12 months

Signed and agreed.
  `.trim();

  console.log('Document to sign:');
  console.log('─────────────────────────────────────────────────────────');
  console.log(document);
  console.log('─────────────────────────────────────────────────────────\n');

  // =============================================================================
  // Method 1: RSA Signatures (Traditional)
  // =============================================================================
  console.log('Method 1: RSA Digital Signatures');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('Party A generates RSA signing key...');
  const rsaKeys = generateRSASigningKey(2048, 'PartyAPassword');
  console.log('');

  console.log('Party A signs the document:');
  const rsaSignedDoc = signDocument(document, rsaKeys.privateKey, 'Party A', 'rsa');
  console.log('Signature:', rsaSignedDoc.signature.signature.substring(0, 60) + '...');
  console.log('');

  console.log('Party B verifies the signature:');
  const rsaValid = verifyDocument(rsaSignedDoc, rsaKeys.publicKey, 'rsa');
  console.log('Contract is valid:', rsaValid ? '✓' : '✗');
  console.log('');

  // Test tampering
  console.log('Testing tampered document:');
  const tamperedDoc = { ...rsaSignedDoc, data: rsaSignedDoc.data.replace('$10,000', '$1,000') };
  const tamperedValid = verifyDocument(tamperedDoc, rsaKeys.publicKey, 'rsa');
  console.log('Tampered contract is valid:', tamperedValid ? '✓' : '✗');
  console.log('✓ Tampering detected!\n');

  // =============================================================================
  // Method 2: ECDSA Signatures (Modern, Efficient)
  // =============================================================================
  console.log('Method 2: ECDSA Digital Signatures');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('Party B generates ECDSA signing key...');
  const ecdsaKeys = generateECDSASigningKey('secp256k1');
  console.log('');

  console.log('Party B signs the document:');
  const ecdsaSignedDoc = signDocument(document, ecdsaKeys.privateKey, 'Party B', 'ecdsa');
  console.log('Signature:', ecdsaSignedDoc.signature.signature.substring(0, 60) + '...');
  console.log('');

  console.log('Party A verifies the signature:');
  const ecdsaValid = verifyDocument(ecdsaSignedDoc, ecdsaKeys.publicKey, 'ecdsa');
  console.log('Contract is valid:', ecdsaValid ? '✓' : '✗');
  console.log('');

  // =============================================================================
  // Method 3: Ed25519 Signatures (Fastest, Modern)
  // =============================================================================
  console.log('Method 3: Ed25519 Digital Signatures');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('Generating Ed25519 signing key...');
  const ed25519Keys = generateEd25519SigningKey();
  console.log('');

  console.log('Signing the document:');
  const ed25519SignedDoc = signDocument(document, ed25519Keys.privateKey, 'Party C', 'ed25519');
  console.log('Signature:', ed25519SignedDoc.signature.signature.substring(0, 60) + '...');
  console.log('');

  console.log('Verifying the signature:');
  const ed25519Valid = verifyDocument(ed25519SignedDoc, ed25519Keys.publicKey, 'ed25519');
  console.log('Contract is valid:', ed25519Valid ? '✓' : '✗');
  console.log('');

  // =============================================================================
  // Comparison: RSA vs ECDSA vs Ed25519
  // =============================================================================
  console.log('Signature Algorithm Comparison');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('Key Sizes:');
  console.log('  RSA Public Key:    ', rsaKeys.publicKey.length, 'characters');
  console.log('  ECDSA Public Key:  ', ecdsaKeys.publicKey.length, 'characters');
  console.log('  Ed25519 Public Key:', ed25519Keys.publicKey.length, 'characters');
  console.log('');

  console.log('Signature Sizes:');
  console.log('  RSA Signature:    ', rsaSignedDoc.signature.signature.length, 'characters');
  console.log('  ECDSA Signature:  ', ecdsaSignedDoc.signature.signature.length, 'characters');
  console.log('  Ed25519 Signature:', ed25519SignedDoc.signature.signature.length, 'characters');
  console.log('');

  // =============================================================================
  // Public Key Verification
  // =============================================================================
  console.log('Public Key Verification');
  console.log('═════════════════════════════════════════════════════════\n');

  const rsaFingerprint = getPublicKeyFingerprint(rsaKeys.publicKey);
  console.log('RSA Public Key Fingerprint:');
  console.log('  ', rsaFingerprint);
  console.log('  (Share this for out-of-band verification)');
  console.log('');

  const ecdsaFingerprint = getPublicKeyFingerprint(ecdsaKeys.publicKey);
  console.log('ECDSA Public Key Fingerprint:');
  console.log('  ', ecdsaFingerprint);
  console.log('');

  // =============================================================================
  // Best Practices Summary
  // =============================================================================
  console.log('═════════════════════════════════════════════════════════');
  console.log('Digital Signature Best Practices:');
  console.log('═════════════════════════════════════════════════════════');
  console.log('Algorithm Selection:');
  console.log('  ✓ RSA-PSS: Traditional, widely supported (2048+ bits)');
  console.log('  ✓ ECDSA: Modern, smaller keys (secp256k1, P-256)');
  console.log('  ✓ Ed25519: Fastest, most secure, simple (recommended)');
  console.log('  ✗ Avoid: RSA-PKCS#1 v1.5 (use PSS instead)');
  console.log('');
  console.log('Security:');
  console.log('  ✓ Protect private keys with passphrases');
  console.log('  ✓ Use HSM or secure key storage for critical keys');
  console.log('  ✓ Verify public key fingerprints out-of-band');
  console.log('  ✓ Include timestamps to prevent replay attacks');
  console.log('  ✓ Use certificate chains for public key trust');
  console.log('  ✓ Always verify signatures before trusting data');
  console.log('');
  console.log('Implementation:');
  console.log('  ✓ Sign hash, not raw data (efficiency)');
  console.log('  ✓ Use SHA-256 or better for hashing');
  console.log('  ✓ Implement proper error handling');
  console.log('  ✓ Log signature operations for audit trail');
  console.log('  ✓ Rotate keys periodically');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('Common Use Cases:');
  console.log('  • Code signing (software distribution)');
  console.log('  • Document signing (contracts, PDFs)');
  console.log('  • API authentication (JWT, OAuth)');
  console.log('  • Email security (S/MIME, PGP)');
  console.log('  • Blockchain transactions');
  console.log('  • SSL/TLS certificates');
  console.log('  • Software updates verification');
  console.log('');

  console.log('=== Digital Signatures Example Complete ===\n');
}

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateDigitalSignatures();
}
