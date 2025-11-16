import { EncryptedData } from '../types';

/**
 * 加密工具類別
 */
export class CryptoUtils {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  /**
   * 使用主密碼衍生加密金鑰
   */
  static async deriveKey(
    masterPassword: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(masterPassword),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 加密資料
   */
  static async encrypt(
    data: string,
    masterPassword: string
  ): Promise<EncryptedData> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await this.deriveKey(masterPassword, salt);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      this.encoder.encode(data)
    );

    return {
      ciphertext: Array.from(new Uint8Array(encryptedData)),
      salt: Array.from(salt),
      iv: Array.from(iv)
    };
  }

  /**
   * 解密資料
   */
  static async decrypt(
    encryptedData: EncryptedData,
    masterPassword: string
  ): Promise<string> {
    const salt = new Uint8Array(encryptedData.salt);
    const iv = new Uint8Array(encryptedData.iv);
    const ciphertext = new Uint8Array(encryptedData.ciphertext);

    const key = await this.deriveKey(masterPassword, salt);

    try {
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        ciphertext
      );

      return this.decoder.decode(decryptedData);
    } catch (error) {
      throw new Error('解密失敗：密碼錯誤');
    }
  }

  /**
   * 雜湊主密碼（用於驗證）
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await this.deriveKey(password, salt);

    // 匯出金鑰作為雜湊值
    const exported = await crypto.subtle.exportKey('raw', key);

    return JSON.stringify({
      hash: Array.from(new Uint8Array(exported)),
      salt: Array.from(salt)
    });
  }

  /**
   * SHA-1 雜湊（用於密碼洩漏檢查）
   */
  static async sha1(message: string): Promise<string> {
    const msgBuffer = this.encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 生成隨機 ID
   */
  static generateId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}
