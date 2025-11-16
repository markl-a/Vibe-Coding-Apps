import { PasswordEntry, StoredPassword, PasswordGeneratorOptions, PasswordStrength } from '../types';
import { CryptoUtils } from '../utils/crypto';
import { PasswordGenerator } from '../utils/password-generator';

/**
 * 密碼管理服務
 */
export class PasswordService {
  /**
   * 儲存密碼
   */
  static async savePassword(
    entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>,
    masterPassword: string
  ): Promise<void> {
    const id = CryptoUtils.generateId();
    const now = new Date().toISOString();

    const fullEntry: PasswordEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now
    };

    const encrypted = await CryptoUtils.encrypt(
      JSON.stringify(fullEntry),
      masterPassword
    );

    const passwords = await this.getAllStoredPasswords();
    passwords.push({
      id,
      domain: entry.domain,
      url: entry.url,
      username: entry.username,
      encrypted,
      createdAt: now,
      updatedAt: now
    });

    await chrome.storage.local.set({ passwords });
  }

  /**
   * 更新密碼
   */
  static async updatePassword(
    id: string,
    updates: Partial<Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>>,
    masterPassword: string
  ): Promise<void> {
    const passwords = await this.getAllStoredPasswords();
    const index = passwords.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error('密碼不存在');
    }

    const stored = passwords[index];
    const decrypted = await CryptoUtils.decrypt(stored.encrypted, masterPassword);
    const entry: PasswordEntry = JSON.parse(decrypted);

    const updatedEntry: PasswordEntry = {
      ...entry,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const encrypted = await CryptoUtils.encrypt(
      JSON.stringify(updatedEntry),
      masterPassword
    );

    passwords[index] = {
      ...stored,
      domain: updatedEntry.domain,
      url: updatedEntry.url,
      username: updatedEntry.username,
      encrypted,
      updatedAt: updatedEntry.updatedAt
    };

    await chrome.storage.local.set({ passwords });
  }

  /**
   * 取得密碼
   */
  static async getPassword(
    id: string,
    masterPassword: string
  ): Promise<PasswordEntry | null> {
    const passwords = await this.getAllStoredPasswords();
    const stored = passwords.find(p => p.id === id);

    if (!stored) return null;

    try {
      const decrypted = await CryptoUtils.decrypt(stored.encrypted, masterPassword);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('解密密碼失敗:', error);
      return null;
    }
  }

  /**
   * 取得特定域名的所有密碼
   */
  static async getPasswordsForDomain(
    domain: string,
    masterPassword: string
  ): Promise<PasswordEntry[]> {
    const passwords = await this.getAllStoredPasswords();
    const domainPasswords = passwords.filter(p => p.domain === domain);

    const decrypted: PasswordEntry[] = [];
    for (const stored of domainPasswords) {
      try {
        const decryptedData = await CryptoUtils.decrypt(stored.encrypted, masterPassword);
        decrypted.push(JSON.parse(decryptedData));
      } catch (error) {
        console.error('解密密碼失敗:', error);
      }
    }

    return decrypted;
  }

  /**
   * 取得所有密碼（僅元數據）
   */
  static async getAllPasswordMetadata(): Promise<Array<{
    id: string;
    domain: string;
    url: string;
    username: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    const passwords = await this.getAllStoredPasswords();
    return passwords.map(p => ({
      id: p.id,
      domain: p.domain,
      url: p.url,
      username: p.username,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
  }

  /**
   * 刪除密碼
   */
  static async deletePassword(id: string): Promise<void> {
    const passwords = await this.getAllStoredPasswords();
    const filtered = passwords.filter(p => p.id !== id);
    await chrome.storage.local.set({ passwords: filtered });
  }

  /**
   * 生成強密碼
   */
  static generatePassword(options?: PasswordGeneratorOptions): string {
    return PasswordGenerator.generate(options);
  }

  /**
   * 生成可記憶的密碼短語
   */
  static generatePassphrase(wordCount?: number): string {
    return PasswordGenerator.generatePassphrase(wordCount);
  }

  /**
   * 評估密碼強度
   */
  static async evaluatePasswordStrength(password: string): Promise<PasswordStrength> {
    // 簡化版評估（生產環境應使用 zxcvbn）
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (password.length < 12) feedback.push('密碼長度應至少 12 個字元');
    if (!/[A-Z]/.test(password)) feedback.push('加入大寫字母可增強安全性');
    if (!/[0-9]/.test(password)) feedback.push('加入數字可增強安全性');
    if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('加入特殊符號可增強安全性');

    const scoreNormalized = Math.min(4, Math.floor(score / 2));

    return {
      score: scoreNormalized,
      feedback: { suggestions: feedback },
      crackTime: this.estimateCrackTime(password),
      suggestions: feedback
    };
  }

  /**
   * 檢查密碼是否洩漏（Have I Been Pwned API）
   */
  static async checkPasswordBreach(password: string): Promise<boolean> {
    try {
      const hash = await CryptoUtils.sha1(password);
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`
      );
      const text = await response.text();

      return text.toUpperCase().includes(suffix.toUpperCase());
    } catch (error) {
      console.error('檢查密碼洩漏失敗:', error);
      return false;
    }
  }

  /**
   * 驗證主密碼
   */
  static async verifyMasterPassword(password: string): Promise<boolean> {
    const result = await chrome.storage.local.get('masterPasswordHash');
    if (!result.masterPasswordHash) {
      return false;
    }

    const hash = await CryptoUtils.hashPassword(password);
    return hash === result.masterPasswordHash;
  }

  /**
   * 設定主密碼
   */
  static async setMasterPassword(password: string): Promise<void> {
    const hash = await CryptoUtils.hashPassword(password);
    await chrome.storage.local.set({ masterPasswordHash: hash });
  }

  /**
   * 檢查是否已設定主密碼
   */
  static async hasMasterPassword(): Promise<boolean> {
    const result = await chrome.storage.local.get('masterPasswordHash');
    return !!result.masterPasswordHash;
  }

  private static async getAllStoredPasswords(): Promise<StoredPassword[]> {
    const result = await chrome.storage.local.get('passwords');
    return result.passwords || [];
  }

  private static estimateCrackTime(password: string): string {
    const entropy = this.calculateEntropy(password);
    const seconds = Math.pow(2, entropy) / 1e9; // 假設 1B 次嘗試/秒

    if (seconds < 60) return '少於 1 分鐘';
    if (seconds < 3600) return `約 ${Math.floor(seconds / 60)} 分鐘`;
    if (seconds < 86400) return `約 ${Math.floor(seconds / 3600)} 小時`;
    if (seconds < 31536000) return `約 ${Math.floor(seconds / 86400)} 天`;
    return `約 ${Math.floor(seconds / 31536000)} 年`;
  }

  private static calculateEntropy(password: string): number {
    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

    return password.length * Math.log2(poolSize);
  }
}
