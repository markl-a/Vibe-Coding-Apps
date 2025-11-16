import { CookieAnalysis } from '../types';

/**
 * Cookie 管理服務
 */
export class CookieService {
  /**
   * 取得所有 Cookie
   */
  static async getAllCookies(): Promise<chrome.cookies.Cookie[]> {
    return chrome.cookies.getAll({});
  }

  /**
   * 取得特定網站的 Cookie
   */
  static async getCookiesForDomain(domain: string): Promise<chrome.cookies.Cookie[]> {
    return chrome.cookies.getAll({ domain });
  }

  /**
   * 取得特定 URL 的 Cookie
   */
  static async getCookiesForUrl(url: string): Promise<chrome.cookies.Cookie[]> {
    return chrome.cookies.getAll({ url });
  }

  /**
   * 刪除單個 Cookie
   */
  static async deleteCookie(cookie: chrome.cookies.Cookie): Promise<void> {
    const url = this.getCookieUrl(cookie);
    await chrome.cookies.remove({
      url: url,
      name: cookie.name,
      storeId: cookie.storeId
    });
  }

  /**
   * 刪除特定域名的所有 Cookie
   */
  static async deleteCookiesForDomain(domain: string): Promise<number> {
    const cookies = await this.getCookiesForDomain(domain);
    let deletedCount = 0;

    for (const cookie of cookies) {
      try {
        await this.deleteCookie(cookie);
        deletedCount++;
      } catch (error) {
        console.error('刪除 Cookie 失敗:', error);
      }
    }

    return deletedCount;
  }

  /**
   * 清除所有 Cookie（支援白名單）
   */
  static async clearAllCookies(whitelist: string[] = []): Promise<number> {
    const cookies = await this.getAllCookies();
    let deletedCount = 0;

    for (const cookie of cookies) {
      // 檢查是否在白名單
      if (!this.isWhitelisted(cookie.domain, whitelist)) {
        try {
          await this.deleteCookie(cookie);
          deletedCount++;
        } catch (error) {
          console.error('刪除 Cookie 失敗:', error);
        }
      }
    }

    return deletedCount;
  }

  /**
   * 清除會話 Cookie
   */
  static async clearSessionCookies(whitelist: string[] = []): Promise<number> {
    const cookies = await this.getAllCookies();
    let deletedCount = 0;

    for (const cookie of cookies) {
      if (cookie.session && !this.isWhitelisted(cookie.domain, whitelist)) {
        try {
          await this.deleteCookie(cookie);
          deletedCount++;
        } catch (error) {
          console.error('刪除會話 Cookie 失敗:', error);
        }
      }
    }

    return deletedCount;
  }

  /**
   * 清除第三方 Cookie
   */
  static async clearThirdPartyCookies(currentDomain: string): Promise<number> {
    const cookies = await this.getAllCookies();
    let deletedCount = 0;

    for (const cookie of cookies) {
      // 簡單的第三方檢測：域名不匹配當前域名
      if (!cookie.domain.includes(currentDomain) && !currentDomain.includes(cookie.domain)) {
        try {
          await this.deleteCookie(cookie);
          deletedCount++;
        } catch (error) {
          console.error('刪除第三方 Cookie 失敗:', error);
        }
      }
    }

    return deletedCount;
  }

  /**
   * 分析 Cookie 使用情況
   */
  static async analyzeCookies(): Promise<CookieAnalysis> {
    const cookies = await this.getAllCookies();

    const analysis: CookieAnalysis = {
      total: cookies.length,
      session: 0,
      persistent: 0,
      secure: 0,
      httpOnly: 0,
      sameSite: {
        strict: 0,
        lax: 0,
        none: 0
      },
      byDomain: new Map()
    };

    for (const cookie of cookies) {
      // 會話 vs 持久
      if (cookie.session) {
        analysis.session++;
      } else {
        analysis.persistent++;
      }

      // 安全性
      if (cookie.secure) analysis.secure++;
      if (cookie.httpOnly) analysis.httpOnly++;

      // SameSite
      switch (cookie.sameSite) {
        case 'strict':
          analysis.sameSite.strict++;
          break;
        case 'lax':
          analysis.sameSite.lax++;
          break;
        default:
          analysis.sameSite.none++;
      }

      // 按域名統計
      const count = analysis.byDomain.get(cookie.domain) || 0;
      analysis.byDomain.set(cookie.domain, count + 1);
    }

    return analysis;
  }

  /**
   * 取得 Cookie 總數
   */
  static async getCookieCount(): Promise<number> {
    const cookies = await this.getAllCookies();
    return cookies.length;
  }

  /**
   * 匯出 Cookie（JSON 格式）
   */
  static async exportCookies(): Promise<string> {
    const cookies = await this.getAllCookies();
    return JSON.stringify(cookies, null, 2);
  }

  /**
   * 監聽 Cookie 變化
   */
  static onCookieChanged(
    callback: (changeInfo: chrome.cookies.CookieChangeInfo) => void
  ): void {
    chrome.cookies.onChanged.addListener(callback);
  }

  /**
   * 取得白名單
   */
  static async getWhitelist(): Promise<string[]> {
    const result = await chrome.storage.local.get('cookieWhitelist');
    return result.cookieWhitelist || [];
  }

  /**
   * 新增到白名單
   */
  static async addToWhitelist(domain: string): Promise<void> {
    const whitelist = await this.getWhitelist();
    if (!whitelist.includes(domain)) {
      whitelist.push(domain);
      await chrome.storage.local.set({ cookieWhitelist: whitelist });
    }
  }

  /**
   * 從白名單移除
   */
  static async removeFromWhitelist(domain: string): Promise<void> {
    const whitelist = await this.getWhitelist();
    const filtered = whitelist.filter(d => d !== domain);
    await chrome.storage.local.set({ cookieWhitelist: filtered });
  }

  private static getCookieUrl(cookie: chrome.cookies.Cookie): string {
    const protocol = cookie.secure ? 'https:' : 'http:';
    const domain = cookie.domain.startsWith('.')
      ? cookie.domain.substring(1)
      : cookie.domain;

    return `${protocol}//${domain}${cookie.path}`;
  }

  private static isWhitelisted(domain: string, whitelist: string[]): boolean {
    return whitelist.some(allowed =>
      domain.includes(allowed) || allowed.includes(domain)
    );
  }
}
