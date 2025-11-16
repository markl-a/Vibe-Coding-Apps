import { PasswordGeneratorOptions } from '../types';

/**
 * 密碼生成器
 */
export class PasswordGenerator {
  /**
   * 生成強密碼
   */
  static generate(options: PasswordGeneratorOptions = {}): string {
    const {
      length = 16,
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true
    } = options;

    let charset = '';
    const charsets = {
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    if (lowercase) charset += charsets.lowercase;
    if (uppercase) charset += charsets.uppercase;
    if (numbers) charset += charsets.numbers;
    if (symbols) charset += charsets.symbols;

    if (charset.length === 0) {
      throw new Error('至少需要選擇一種字元類型');
    }

    // 使用加密安全的隨機數生成器
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[values[i] % charset.length];
    }

    // 確保包含每種選擇的字元類型
    password = this.ensureComplexity(password, {
      uppercase,
      lowercase,
      numbers,
      symbols
    }, charsets);

    return password;
  }

  /**
   * 確保密碼包含所有選擇的字元類型
   */
  private static ensureComplexity(
    password: string,
    options: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean },
    charsets: { uppercase: string; lowercase: string; numbers: string; symbols: string }
  ): string {
    let result = password;
    const checks = [
      { enabled: options.uppercase, regex: /[A-Z]/, charset: charsets.uppercase },
      { enabled: options.lowercase, regex: /[a-z]/, charset: charsets.lowercase },
      { enabled: options.numbers, regex: /[0-9]/, charset: charsets.numbers },
      { enabled: options.symbols, regex: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, charset: charsets.symbols }
    ];

    for (const check of checks) {
      if (check.enabled && !check.regex.test(result)) {
        // 隨機替換一個字元以確保包含此類型
        const pos = Math.floor(Math.random() * result.length);
        const char = check.charset[Math.floor(Math.random() * check.charset.length)];
        result = result.substring(0, pos) + char + result.substring(pos + 1);
      }
    }

    return result;
  }

  /**
   * 生成可記憶的密碼短語
   */
  static generatePassphrase(wordCount: number = 4): string {
    const words = [
      'correct', 'horse', 'battery', 'staple', 'dragon', 'phoenix', 'mountain',
      'ocean', 'forest', 'thunder', 'crystal', 'shadow', 'lightning', 'river',
      'falcon', 'tiger', 'eagle', 'wolf', 'bear', 'lion', 'shark', 'hawk'
    ];

    const selected: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      selected.push(words[randomIndex]);
    }

    // 添加隨機數字
    const number = Math.floor(Math.random() * 100);
    return selected.join('-') + '-' + number;
  }
}
