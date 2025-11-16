import { TrackerStats } from '../types';
import { TRACKER_DOMAINS } from '../constants/tracker-list';

/**
 * 追蹤器攔截服務
 */
export class TrackerService {
  private static blockedCount = 0;
  private static blockedByDomain = new Map<string, number>();
  private static lastReset = new Date().toISOString();

  /**
   * 檢查 URL 是否為追蹤器
   */
  static isTracker(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // 完全匹配
      if (TRACKER_DOMAINS.includes(hostname)) {
        return true;
      }

      // 檢查子域名
      for (const tracker of TRACKER_DOMAINS) {
        if (hostname.endsWith('.' + tracker) || hostname === tracker) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 記錄被攔截的追蹤器
   */
  static recordBlocked(url: string): void {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      this.blockedCount++;

      const currentCount = this.blockedByDomain.get(hostname) || 0;
      this.blockedByDomain.set(hostname, currentCount + 1);

      // 儲存到 storage
      this.saveStats();
    } catch (error) {
      console.error('記錄追蹤器失敗:', error);
    }
  }

  /**
   * 取得統計資料
   */
  static async getStats(): Promise<TrackerStats> {
    await this.loadStats();

    return {
      totalBlocked: this.blockedCount,
      blockedToday: await this.getBlockedToday(),
      blockedByDomain: this.blockedByDomain,
      lastReset: this.lastReset
    };
  }

  /**
   * 取得今天攔截的數量
   */
  private static async getBlockedToday(): Promise<number> {
    const today = new Date().toDateString();
    const result = await chrome.storage.local.get('trackerStatsDaily');
    const daily = result.trackerStatsDaily || {};
    return daily[today] || 0;
  }

  /**
   * 重置統計
   */
  static async resetStats(): Promise<void> {
    this.blockedCount = 0;
    this.blockedByDomain.clear();
    this.lastReset = new Date().toISOString();
    await this.saveStats();
  }

  /**
   * 取得前 N 個被攔截最多的域名
   */
  static getTopBlockedDomains(limit: number = 10): Array<{ domain: string; count: number }> {
    const sorted = Array.from(this.blockedByDomain.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, limit);
  }

  /**
   * 檢查追蹤器攔截是否啟用
   */
  static async isEnabled(): Promise<boolean> {
    const result = await chrome.storage.local.get('enableTrackerBlocking');
    return result.enableTrackerBlocking !== false; // 預設啟用
  }

  /**
   * 設定追蹤器攔截
   */
  static async setEnabled(enabled: boolean): Promise<void> {
    await chrome.storage.local.set({ enableTrackerBlocking: enabled });
  }

  /**
   * 取得攔截級別
   */
  static async getBlockingLevel(): Promise<'strict' | 'moderate' | 'permissive'> {
    const result = await chrome.storage.local.get('trackerBlockingLevel');
    return result.trackerBlockingLevel || 'moderate';
  }

  /**
   * 設定攔截級別
   */
  static async setBlockingLevel(level: 'strict' | 'moderate' | 'permissive'): Promise<void> {
    await chrome.storage.local.set({ trackerBlockingLevel: level });
  }

  /**
   * 新增自訂追蹤器域名
   */
  static async addCustomTracker(domain: string): Promise<void> {
    const result = await chrome.storage.local.get('customTrackers');
    const customTrackers: string[] = result.customTrackers || [];

    if (!customTrackers.includes(domain)) {
      customTrackers.push(domain);
      await chrome.storage.local.set({ customTrackers });
    }
  }

  /**
   * 移除自訂追蹤器域名
   */
  static async removeCustomTracker(domain: string): Promise<void> {
    const result = await chrome.storage.local.get('customTrackers');
    const customTrackers: string[] = result.customTrackers || [];
    const filtered = customTrackers.filter(d => d !== domain);
    await chrome.storage.local.set({ customTrackers: filtered });
  }

  /**
   * 取得自訂追蹤器列表
   */
  static async getCustomTrackers(): Promise<string[]> {
    const result = await chrome.storage.local.get('customTrackers');
    return result.customTrackers || [];
  }

  private static async saveStats(): Promise<void> {
    const stats = {
      totalBlocked: this.blockedCount,
      blockedByDomain: Array.from(this.blockedByDomain.entries()),
      lastReset: this.lastReset
    };

    await chrome.storage.local.set({ trackerStats: stats });

    // 更新每日統計
    const today = new Date().toDateString();
    const result = await chrome.storage.local.get('trackerStatsDaily');
    const daily = result.trackerStatsDaily || {};
    daily[today] = (daily[today] || 0) + 1;
    await chrome.storage.local.set({ trackerStatsDaily: daily });
  }

  private static async loadStats(): Promise<void> {
    const result = await chrome.storage.local.get('trackerStats');
    if (result.trackerStats) {
      this.blockedCount = result.trackerStats.totalBlocked || 0;
      this.blockedByDomain = new Map(result.trackerStats.blockedByDomain || []);
      this.lastReset = result.trackerStats.lastReset || new Date().toISOString();
    }
  }
}
