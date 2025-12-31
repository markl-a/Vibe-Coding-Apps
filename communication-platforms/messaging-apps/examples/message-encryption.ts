/**
 * Message Encryption Example
 *
 * Demonstrates end-to-end encryption (E2EE) for secure messaging
 * using Web Crypto API with key exchange, message encryption, and verification.
 */

import { EventEmitter } from 'events';

// Encrypted message
export interface EncryptedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  ciphertext: string; // Base64 encoded
  iv: string; // Initialization vector (Base64)
  salt: string; // For key derivation (Base64)
  algorithm: string;
  timestamp: Date;
  signature?: string; // For message authentication
}

// Key pair
export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyExport?: JsonWebKey;
}

// Shared secret
export interface SharedSecret {
  conversationId: string;
  otherUserId: string;
  sharedKey: CryptoKey;
  createdAt: Date;
}

/**
 * End-to-End Encryption Manager
 *
 * Manages encryption keys and provides message encryption/decryption
 * using Web Crypto API with ECDH key exchange and AES-GCM encryption
 */
export class E2EEncryptionManager extends EventEmitter {
  private keyPair: KeyPair | null = null;
  private sharedSecrets: Map<string, SharedSecret> = new Map();
  private publicKeys: Map<string, CryptoKey> = new Map();
  private readonly algorithm = {
    name: 'ECDH',
    namedCurve: 'P-256',
  };

  /**
   * Initialize encryption (generate key pair)
   */
  async initialize(): Promise<void> {
    try {
      // Generate ECDH key pair
      const keyPair = await crypto.subtle.generateKey(
        this.algorithm,
        true, // extractable
        ['deriveKey', 'deriveBits']
      );

      // Export public key for sharing
      const publicKeyExport = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

      this.keyPair = {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyExport,
      };

      this.emit('initialized', publicKeyExport);
    } catch (error) {
      this.emit('error', {
        type: 'initialization-error',
        message: 'Failed to initialize encryption',
        error,
      });
      throw error;
    }
  }

  /**
   * Get public key for sharing
   */
  getPublicKey(): JsonWebKey | null {
    return this.keyPair?.publicKeyExport ?? null;
  }

  /**
   * Import other user's public key
   */
  async importPublicKey(userId: string, publicKeyJwk: JsonWebKey): Promise<void> {
    try {
      const publicKey = await crypto.subtle.importKey(
        'jwk',
        publicKeyJwk,
        this.algorithm,
        true,
        []
      );

      this.publicKeys.set(userId, publicKey);
      this.emit('public-key-imported', userId);
    } catch (error) {
      this.emit('error', {
        type: 'import-error',
        message: 'Failed to import public key',
        error,
      });
      throw error;
    }
  }

  /**
   * Derive shared secret with another user
   */
  async deriveSharedSecret(conversationId: string, otherUserId: string): Promise<CryptoKey> {
    if (!this.keyPair) {
      throw new Error('Encryption not initialized');
    }

    // Check if we already have a shared secret
    const existing = this.sharedSecrets.get(conversationId);
    if (existing) {
      return existing.sharedKey;
    }

    const otherPublicKey = this.publicKeys.get(otherUserId);
    if (!otherPublicKey) {
      throw new Error(`Public key not found for user: ${otherUserId}`);
    }

    try {
      // Derive shared key using ECDH
      const sharedKey = await crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: otherPublicKey,
        },
        this.keyPair.privateKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false, // not extractable
        ['encrypt', 'decrypt']
      );

      const secret: SharedSecret = {
        conversationId,
        otherUserId,
        sharedKey,
        createdAt: new Date(),
      };

      this.sharedSecrets.set(conversationId, secret);
      this.emit('shared-secret-established', conversationId);

      return sharedKey;
    } catch (error) {
      this.emit('error', {
        type: 'key-derivation-error',
        message: 'Failed to derive shared secret',
        error,
      });
      throw error;
    }
  }

  /**
   * Encrypt message
   */
  async encryptMessage(
    conversationId: string,
    message: string,
    otherUserId: string
  ): Promise<EncryptedMessage> {
    // Get or derive shared secret
    let sharedKey = this.sharedSecrets.get(conversationId)?.sharedKey;
    if (!sharedKey) {
      sharedKey = await this.deriveSharedSecret(conversationId, otherUserId);
    }

    try {
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encode message
      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      // Encrypt
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        sharedKey,
        data
      );

      // Generate salt for additional security
      const salt = crypto.getRandomValues(new Uint8Array(16));

      const encryptedMessage: EncryptedMessage = {
        id: `enc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        senderId: otherUserId, // Will be set by caller
        ciphertext: this.arrayBufferToBase64(ciphertext),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt),
        algorithm: 'AES-GCM-256',
        timestamp: new Date(),
      };

      return encryptedMessage;
    } catch (error) {
      this.emit('error', {
        type: 'encryption-error',
        message: 'Failed to encrypt message',
        error,
      });
      throw error;
    }
  }

  /**
   * Decrypt message
   */
  async decryptMessage(
    encryptedMessage: EncryptedMessage,
    otherUserId: string
  ): Promise<string> {
    // Get shared secret
    const secret = this.sharedSecrets.get(encryptedMessage.conversationId);
    if (!secret) {
      // Try to derive it
      await this.deriveSharedSecret(encryptedMessage.conversationId, otherUserId);
      return this.decryptMessage(encryptedMessage, otherUserId);
    }

    try {
      // Convert from Base64
      const ciphertext = this.base64ToArrayBuffer(encryptedMessage.ciphertext);
      const iv = this.base64ToArrayBuffer(encryptedMessage.iv);

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        secret.sharedKey,
        ciphertext
      );

      // Decode message
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      this.emit('error', {
        type: 'decryption-error',
        message: 'Failed to decrypt message',
        error,
      });
      throw error;
    }
  }

  /**
   * Sign message for authentication
   */
  async signMessage(message: string): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Encryption not initialized');
    }

    try {
      // Generate signing key pair (separate from encryption)
      const signingKeyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        false,
        ['sign']
      );

      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      const signature = await crypto.subtle.sign(
        {
          name: 'ECDSA',
          hash: { name: 'SHA-256' },
        },
        signingKeyPair.privateKey,
        data
      );

      return this.arrayBufferToBase64(signature);
    } catch (error) {
      this.emit('error', {
        type: 'signing-error',
        message: 'Failed to sign message',
        error,
      });
      throw error;
    }
  }

  /**
   * Verify message signature
   */
  async verifySignature(
    message: string,
    signature: string,
    publicKey: CryptoKey
  ): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const signatureBuffer = this.base64ToArrayBuffer(signature);

      return await crypto.subtle.verify(
        {
          name: 'ECDSA',
          hash: { name: 'SHA-256' },
        },
        publicKey,
        signatureBuffer,
        data
      );
    } catch (error) {
      this.emit('error', {
        type: 'verification-error',
        message: 'Failed to verify signature',
        error,
      });
      return false;
    }
  }

  /**
   * Rotate keys (re-generate key pair)
   */
  async rotateKeys(): Promise<JsonWebKey> {
    // Clear existing shared secrets
    this.sharedSecrets.clear();

    // Generate new key pair
    await this.initialize();

    return this.keyPair!.publicKeyExport!;
  }

  /**
   * Export keys for backup
   */
  async exportKeys(): Promise<{
    publicKey: JsonWebKey;
    privateKey: JsonWebKey;
  }> {
    if (!this.keyPair) {
      throw new Error('Encryption not initialized');
    }

    const privateKey = await crypto.subtle.exportKey('jwk', this.keyPair.privateKey);

    return {
      publicKey: this.keyPair.publicKeyExport!,
      privateKey,
    };
  }

  /**
   * Import keys from backup
   */
  async importKeys(publicKeyJwk: JsonWebKey, privateKeyJwk: JsonWebKey): Promise<void> {
    try {
      const publicKey = await crypto.subtle.importKey(
        'jwk',
        publicKeyJwk,
        this.algorithm,
        true,
        []
      );

      const privateKey = await crypto.subtle.importKey(
        'jwk',
        privateKeyJwk,
        this.algorithm,
        true,
        ['deriveKey', 'deriveBits']
      );

      this.keyPair = {
        publicKey,
        privateKey,
        publicKeyExport: publicKeyJwk,
      };

      this.emit('keys-imported');
    } catch (error) {
      this.emit('error', {
        type: 'import-error',
        message: 'Failed to import keys',
        error,
      });
      throw error;
    }
  }

  /**
   * Helper: Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper: Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Clear all encryption data
   */
  clear(): void {
    this.keyPair = null;
    this.sharedSecrets.clear();
    this.publicKeys.clear();
    this.emit('cleared');
  }
}

/**
 * Secure Message Storage
 *
 * Encrypted local storage for messages
 */
export class SecureMessageStorage extends EventEmitter {
  private storageKey = 'encrypted_messages';
  private encryptionKey: CryptoKey | null = null;

  /**
   * Initialize storage with encryption key
   */
  async initialize(password: string): Promise<void> {
    try {
      // Derive encryption key from password
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);

      const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const salt = crypto.getRandomValues(new Uint8Array(16));

      this.encryptionKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        baseKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      );

      // Store salt
      localStorage.setItem('encryption_salt', btoa(String.fromCharCode(...salt)));

      this.emit('initialized');
    } catch (error) {
      this.emit('error', {
        type: 'storage-init-error',
        message: 'Failed to initialize secure storage',
        error,
      });
      throw error;
    }
  }

  /**
   * Store encrypted message
   */
  async storeMessage(message: EncryptedMessage): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('Storage not initialized');
    }

    try {
      // Get existing messages
      const messages = await this.getAllMessages();

      // Add new message
      messages.push(message);

      // Encrypt and store
      const data = JSON.stringify(messages);
      const encrypted = await this.encrypt(data);

      localStorage.setItem(this.storageKey, encrypted);

      this.emit('message-stored', message.id);
    } catch (error) {
      this.emit('error', {
        type: 'storage-error',
        message: 'Failed to store message',
        error,
      });
      throw error;
    }
  }

  /**
   * Retrieve all messages
   */
  async getAllMessages(): Promise<EncryptedMessage[]> {
    if (!this.encryptionKey) {
      throw new Error('Storage not initialized');
    }

    try {
      const encrypted = localStorage.getItem(this.storageKey);
      if (!encrypted) {
        return [];
      }

      const decrypted = await this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      this.emit('error', {
        type: 'retrieval-error',
        message: 'Failed to retrieve messages',
        error,
      });
      return [];
    }
  }

  /**
   * Get messages by conversation
   */
  async getConversationMessages(conversationId: string): Promise<EncryptedMessage[]> {
    const allMessages = await this.getAllMessages();
    return allMessages.filter((m) => m.conversationId === conversationId);
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<void> {
    const messages = await this.getAllMessages();
    const filtered = messages.filter((m) => m.id !== messageId);

    const data = JSON.stringify(filtered);
    const encrypted = await this.encrypt(data);

    localStorage.setItem(this.storageKey, encrypted);
    this.emit('message-deleted', messageId);
  }

  /**
   * Encrypt data
   */
  private async encrypt(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      this.encryptionKey!,
      encodedData
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt data
   */
  private async decrypt(encryptedData: string): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      this.encryptionKey!,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Clear all stored messages
   */
  clear(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem('encryption_salt');
    this.encryptionKey = null;
    this.emit('cleared');
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Initialize E2E encryption
 */
export async function exampleInitializeEncryption() {
  const encryption = new E2EEncryptionManager();

  // Initialize
  await encryption.initialize();

  const publicKey = encryption.getPublicKey();
  console.log('Public key ready to share:', publicKey);

  // Share public key with other users via server
  // await sendPublicKeyToServer(publicKey);

  return encryption;
}

/**
 * Example: Exchange keys and send encrypted message
 */
export async function exampleEncryptedChat() {
  const alice = new E2EEncryptionManager();
  const bob = new E2EEncryptionManager();

  // Initialize both
  await alice.initialize();
  await bob.initialize();

  // Exchange public keys
  const alicePublicKey = alice.getPublicKey()!;
  const bobPublicKey = bob.getPublicKey()!;

  await alice.importPublicKey('bob', bobPublicKey);
  await bob.importPublicKey('alice', alicePublicKey);

  // Alice sends encrypted message to Bob
  const conversationId = 'conv-alice-bob';
  const message = 'Hello Bob, this is a secret message!';

  const encrypted = await alice.encryptMessage(conversationId, message, 'bob');
  console.log('Encrypted message:', encrypted);

  // Bob decrypts message
  const decrypted = await bob.decryptMessage(encrypted, 'alice');
  console.log('Decrypted message:', decrypted);

  return { alice, bob };
}

/**
 * Example: Secure message storage
 */
export async function exampleSecureStorage() {
  const storage = new SecureMessageStorage();

  // Initialize with password
  await storage.initialize('user-secure-password-123');

  const encryption = new E2EEncryptionManager();
  await encryption.initialize();

  // Encrypt and store message
  const encryptedMessage = await encryption.encryptMessage(
    'conv-123',
    'Sensitive information',
    'user-456'
  );

  await storage.storeMessage(encryptedMessage);

  // Retrieve messages
  const messages = await storage.getConversationMessages('conv-123');
  console.log('Retrieved messages:', messages.length);

  return storage;
}

/**
 * Example: Key rotation
 */
export async function exampleKeyRotation(encryption: E2EEncryptionManager) {
  // Export keys for backup
  const backup = await encryption.exportKeys();
  console.log('Keys backed up');

  // Store backup securely
  localStorage.setItem('key_backup', JSON.stringify(backup));

  // Rotate keys
  const newPublicKey = await encryption.rotateKeys();
  console.log('Keys rotated, new public key:', newPublicKey);

  // Distribute new public key to contacts
  // await distributeNewPublicKey(newPublicKey);
}

/**
 * Example: Restore from backup
 */
export async function exampleRestoreFromBackup() {
  const encryption = new E2EEncryptionManager();

  // Retrieve backup
  const backupStr = localStorage.getItem('key_backup');
  if (backupStr) {
    const backup = JSON.parse(backupStr);

    // Import keys
    await encryption.importKeys(backup.publicKey, backup.privateKey);

    console.log('Keys restored from backup');
  }

  return encryption;
}

/**
 * Example: Group encryption (using multiple shared secrets)
 */
export async function exampleGroupEncryption() {
  const user = new E2EEncryptionManager();
  await user.initialize();

  const groupMembers = ['user-1', 'user-2', 'user-3'];

  // Import all member public keys
  for (const memberId of groupMembers) {
    // In real app, fetch from server
    const memberPublicKey = await fetchPublicKey(memberId);
    await user.importPublicKey(memberId, memberPublicKey);
  }

  // Encrypt message for each member
  const groupId = 'group-123';
  const message = 'Hello everyone!';

  const encryptedMessages = [];
  for (const memberId of groupMembers) {
    const encrypted = await user.encryptMessage(
      `${groupId}-${memberId}`,
      message,
      memberId
    );
    encryptedMessages.push({ memberId, encrypted });
  }

  console.log('Encrypted for', encryptedMessages.length, 'members');

  return encryptedMessages;
}

// Helper function (mock)
async function fetchPublicKey(userId: string): Promise<JsonWebKey> {
  // Mock implementation
  const temp = new E2EEncryptionManager();
  await temp.initialize();
  return temp.getPublicKey()!;
}
