# Crypto Toolkit

A comprehensive cryptography toolkit with hashing, encryption, and key management utilities built on Node.js crypto.

## Features

- **Hashing**: SHA-256, SHA-384, SHA-512, MD5
- **HMAC**: Message authentication codes
- **Symmetric Encryption**: AES-256-GCM, AES-256-CBC
- **Password Hashing**: PBKDF2, Scrypt
- **Key Derivation**: PBKDF2, HKDF
- **JWT-like Tokens**: Create and verify tokens
- **Random Generation**: Bytes, hex, UUID

## Quick Start

```bash
pnpm install
pnpm example
```

## Usage

### Hashing

```typescript
import { hash } from '@vibe/crypto-toolkit';

const result = hash('Hello, World!', 'sha256');
console.log(result.digest);
// "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"
```

### HMAC

```typescript
import { hmac, verifyHmac } from '@vibe/crypto-toolkit';

const signature = hmac('data', 'secret-key');
const isValid = verifyHmac('data', 'secret-key', signature);
```

### Symmetric Encryption

```typescript
import { generateSymmetricKey, encrypt, decrypt } from '@vibe/crypto-toolkit';

// Generate key
const key = generateSymmetricKey('aes-256-gcm');

// Encrypt
const encrypted = encrypt('secret message', key.key, 'aes-256-gcm');

// Decrypt
const decrypted = decrypt(encrypted, key.key);
```

### Password Hashing

```typescript
import { hashPassword, verifyPassword } from '@vibe/crypto-toolkit';

// Hash password
const stored = hashPassword('user-password', {
  algorithm: 'pbkdf2',
  iterations: 100000,
});

// Verify later
const isValid = verifyPassword('user-password', stored);
```

### Key Derivation

```typescript
import { deriveKey, generateRandomHex } from '@vibe/crypto-toolkit';

const salt = generateRandomHex(32);
const key = deriveKey('master-password', Buffer.from(salt, 'hex'), {
  algorithm: 'pbkdf2',
  hash: 'sha256',
  iterations: 100000,
  keyLength: 32,
});
```

### JWT-like Tokens

```typescript
import { createToken, verifyToken } from '@vibe/crypto-toolkit';

// Create token
const token = createToken(
  { sub: 'user_123', role: 'admin' },
  'secret-key',
  { expiresIn: 3600 }
);

// Verify token
const result = verifyToken(token, 'secret-key');
if (result.valid) {
  console.log(result.payload);
}
```

### Random Generation

```typescript
import {
  generateRandomHex,
  generateRandomBytes,
  generateUUID,
  generatePassword
} from '@vibe/crypto-toolkit';

generateRandomHex(32);      // "a1b2c3d4..."
generateUUID();             // "550e8400-e29b-41d4-a716-446655440000"
generatePassword(16);       // "xK9#mP2$nL5@wQ8!"
generatePassword(16, { symbols: false }); // "xK9mP2nL5wQ8aB3c"
```

## API Reference

### Hashing Functions

| Function | Description |
|----------|-------------|
| `hash(data, algorithm, encoding)` | Hash data with specified algorithm |
| `hmac(data, key, options)` | Create HMAC signature |
| `verifyHmac(data, key, signature)` | Verify HMAC signature |

### Encryption Functions

| Function | Description |
|----------|-------------|
| `generateSymmetricKey(algorithm)` | Generate symmetric encryption key |
| `encrypt(plaintext, key, algorithm)` | Encrypt data |
| `decrypt(encrypted, key)` | Decrypt data |

### Password Functions

| Function | Description |
|----------|-------------|
| `hashPassword(password, options)` | Hash password securely |
| `verifyPassword(password, stored)` | Verify password against hash |
| `deriveKey(password, salt, options)` | Derive key from password |

### Token Functions

| Function | Description |
|----------|-------------|
| `createToken(payload, secret, options)` | Create JWT-like token |
| `verifyToken(token, secret)` | Verify and decode token |

### Generation Functions

| Function | Description |
|----------|-------------|
| `generateRandomBytes(length)` | Generate random bytes |
| `generateRandomHex(length)` | Generate random hex string |
| `generateRandomBase64(length)` | Generate random base64 string |
| `generateUUID()` | Generate UUID v4 |
| `generatePassword(length, options)` | Generate secure password |

### Encoding Functions

| Function | Description |
|----------|-------------|
| `toBase64(data)` | Encode to Base64 |
| `fromBase64(data)` | Decode from Base64 |
| `toBase64URL(data)` | Encode to Base64URL |
| `fromBase64URL(data)` | Decode from Base64URL |

## Security Best Practices

1. **Use strong keys**: Minimum 256 bits for symmetric encryption
2. **Use authenticated encryption**: AES-GCM instead of CBC
3. **Use secure password hashing**: PBKDF2 or Scrypt with high iterations
4. **Generate unique IVs**: Never reuse IVs with the same key
5. **Timing-safe comparisons**: Use `verifyHmac` instead of `===`

## Algorithm Recommendations

| Use Case | Recommended |
|----------|-------------|
| Hashing | SHA-256 or SHA-512 |
| Password hashing | PBKDF2 (100k+ iterations) or Scrypt |
| Symmetric encryption | AES-256-GCM |
| Message authentication | HMAC-SHA256 |

## Example: Secure Data Storage

```typescript
import {
  generateRandomHex,
  deriveKey,
  encrypt,
  decrypt,
  hashPassword,
} from '@vibe/crypto-toolkit';

// Store user credentials
const passwordHash = hashPassword(userPassword);
// Store: passwordHash.hash, passwordHash.salt, passwordHash.params

// Encrypt sensitive data
const dataSalt = generateRandomHex(32);
const dataKey = deriveKey(masterKey, dataSalt, {
  algorithm: 'pbkdf2',
  hash: 'sha256',
  iterations: 100000,
  keyLength: 32,
});

const encrypted = encrypt(sensitiveData, dataKey, 'aes-256-gcm');
// Store: dataSalt, encrypted.iv, encrypted.ciphertext, encrypted.tag
```

## License

MIT
