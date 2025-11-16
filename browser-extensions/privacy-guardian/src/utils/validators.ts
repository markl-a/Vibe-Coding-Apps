/**
 * 驗證器工具函數
 */
export class Validators {
  /**
   * 驗證 Email 格式
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 驗證 URL 格式
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 驗證域名格式
   */
  static isValidDomain(domain: string): boolean {
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }

  /**
   * 提取 URL 的域名
   */
  static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  /**
   * 檢查密碼強度（基本）
   */
  static checkPasswordStrength(password: string): {
    score: number;
    message: string;
  } {
    let score = 0;
    const feedback: string[] = [];

    // 長度檢查
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // 字元類型檢查
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // 生成訊息
    let message = '';
    if (score < 3) {
      message = '弱';
    } else if (score < 5) {
      message = '中等';
    } else if (score < 7) {
      message = '強';
    } else {
      message = '非常強';
    }

    return { score, message };
  }

  /**
   * 淨化字串（防止 XSS）
   */
  static sanitizeString(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
