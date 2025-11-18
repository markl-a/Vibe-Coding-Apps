import { DataBreach } from '../types';

/**
 * 數據洩漏監控服務
 * 整合 Have I Been Pwned API 檢查帳號和密碼是否洩漏
 */
export class BreachMonitorService {
  private static readonly HIBP_API_BASE = 'https://api.pwnedpasswords.com';
  private static readonly HIBP_BREACH_API = 'https://haveibeenpwned.com/api/v3';

  /**
   * 檢查 Email 是否出現在數據洩漏中
   * 使用 Have I Been Pwned API
   */
  static async checkEmailBreach(email: string): Promise<DataBreach> {
    try {
      // 注意：實際使用需要 API Key
      // 這裡提供基礎實現框架

      const result = await this.getStoredBreachData(email);
      if (result) {
        // 檢查是否需要更新（每週檢查一次）
        const lastChecked = new Date(result.lastChecked);
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        if (lastChecked.getTime() > weekAgo) {
          return result;
        }
      }

      // 模擬檢查（實際應調用 HIBP API）
      const breachData: DataBreach = {
        email,
        breaches: [],
        lastChecked: new Date().toISOString()
      };

      // 儲存結果
      await this.storeBreachData(email, breachData);

      return breachData;
    } catch (error) {
      console.error('檢查 Email 洩漏失敗:', error);
      throw new Error('無法檢查 Email 洩漏狀態');
    }
  }

  /**
   * 檢查密碼是否在已知洩漏中（使用 k-Anonymity）
   */
  static async checkPasswordBreach(password: string): Promise<{
    isBreached: boolean;
    breachCount: number;
  }> {
    try {
      // 計算 SHA-1 雜湊
      const hash = await this.sha1Hash(password);
      const prefix = hash.substring(0, 5).toUpperCase();
      const suffix = hash.substring(5).toUpperCase();

      // 使用 k-Anonymity 方法查詢
      const response = await fetch(`${this.HIBP_API_BASE}/range/${prefix}`, {
        method: 'GET',
        headers: {
          'Add-Padding': 'true'  // 增加隱私保護
        }
      });

      if (!response.ok) {
        throw new Error('API 請求失敗');
      }

      const text = await response.text();
      const hashes = text.split('\n');

      // 查找匹配的雜湊
      for (const line of hashes) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix.trim() === suffix) {
          return {
            isBreached: true,
            breachCount: parseInt(count.trim(), 10)
          };
        }
      }

      return {
        isBreached: false,
        breachCount: 0
      };
    } catch (error) {
      console.error('檢查密碼洩漏失敗:', error);
      return {
        isBreached: false,
        breachCount: 0
      };
    }
  }

  /**
   * 批量檢查已儲存的密碼
   */
  static async scanAllPasswords(): Promise<{
    total: number;
    breached: number;
    details: Array<{ domain: string; username: string; breachCount: number }>;
  }> {
    const { PasswordService } = await import('./password-service');
    const metadata = await PasswordService.getAllPasswordMetadata();

    const results = {
      total: metadata.length,
      breached: 0,
      details: [] as Array<{ domain: string; username: string; breachCount: number }>
    };

    // 注意：實際使用需要輸入主密碼解密
    // 這裡只是框架

    for (const entry of metadata) {
      // 由於無法直接獲取密碼（已加密），需要其他方式
      // 可以在使用者解鎖密碼庫時進行掃描
    }

    return results;
  }

  /**
   * 監控新的數據洩漏事件
   */
  static async monitorNewBreaches(): Promise<Array<{
    name: string;
    date: string;
    description: string;
    affectedAccounts: number;
  }>> {
    try {
      // 取得已知的洩漏列表
      const knownBreaches = await this.getKnownBreaches();
      const latestBreaches = await this.fetchLatestBreaches();

      // 找出新的洩漏事件
      const newBreaches = latestBreaches.filter(breach =>
        !knownBreaches.some(known => known.name === breach.name)
      );

      if (newBreaches.length > 0) {
        // 更新已知洩漏列表
        await this.updateKnownBreaches([...knownBreaches, ...newBreaches]);

        // 發送通知
        await this.notifyNewBreaches(newBreaches);
      }

      return newBreaches;
    } catch (error) {
      console.error('監控洩漏事件失敗:', error);
      return [];
    }
  }

  /**
   * 設定自動監控
   */
  static async setupAutoMonitoring(enabled: boolean, interval: 'daily' | 'weekly' = 'weekly'): Promise<void> {
    const settings = {
      enabled,
      interval,
      lastCheck: new Date().toISOString()
    };

    await chrome.storage.local.set({ breachMonitorSettings: settings });

    if (enabled) {
      // 設定定期檢查
      const intervalMs = interval === 'daily' ? 24 * 60 : 7 * 24 * 60;
      chrome.alarms.create('breachMonitor', { periodInMinutes: intervalMs });
    } else {
      chrome.alarms.clear('breachMonitor');
    }
  }

  /**
   * 取得監控設定
   */
  static async getMonitoringSettings(): Promise<{
    enabled: boolean;
    interval: 'daily' | 'weekly';
    lastCheck: string;
  }> {
    const result = await chrome.storage.local.get('breachMonitorSettings');
    return result.breachMonitorSettings || {
      enabled: false,
      interval: 'weekly',
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * 取得安全建議
   */
  static async getSecurityRecommendations(email: string): Promise<string[]> {
    const breachData = await this.checkEmailBreach(email);
    const recommendations: string[] = [];

    if (breachData.breaches.length === 0) {
      recommendations.push('✅ 太好了！此 Email 未出現在已知的數據洩漏中');
      recommendations.push('💡 建議定期檢查以確保帳號安全');
    } else {
      recommendations.push('⚠️ 此 Email 出現在以下數據洩漏事件中：');

      breachData.breaches.forEach(breach => {
        recommendations.push(`  • ${breach.name} (${breach.breachDate})`);
      });

      recommendations.push('');
      recommendations.push('🔒 建議採取以下措施：');
      recommendations.push('  1. 立即更改受影響帳號的密碼');
      recommendations.push('  2. 啟用雙因素驗證（2FA）');
      recommendations.push('  3. 檢查其他使用相同密碼的帳號');
      recommendations.push('  4. 保持警惕，注意可疑活動');
    }

    return recommendations;
  }

  /**
   * 匯出洩漏報告
   */
  static async exportBreachReport(email: string): Promise<string> {
    const breachData = await this.checkEmailBreach(email);
    const recommendations = await this.getSecurityRecommendations(email);

    const report = {
      generatedAt: new Date().toISOString(),
      email: email,
      totalBreaches: breachData.breaches.length,
      breaches: breachData.breaches,
      lastChecked: breachData.lastChecked,
      recommendations
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * 訂閱洩漏通知
   */
  static async subscribeToAlerts(email: string): Promise<void> {
    const subscriptions = await this.getSubscriptions();

    if (!subscriptions.includes(email)) {
      subscriptions.push(email);
      await chrome.storage.local.set({ breachSubscriptions: subscriptions });

      // 立即檢查一次
      await this.checkEmailBreach(email);
    }
  }

  /**
   * 取消訂閱
   */
  static async unsubscribeFromAlerts(email: string): Promise<void> {
    const subscriptions = await this.getSubscriptions();
    const filtered = subscriptions.filter(e => e !== email);
    await chrome.storage.local.set({ breachSubscriptions: filtered });
  }

  /**
   * 取得訂閱列表
   */
  static async getSubscriptions(): Promise<string[]> {
    const result = await chrome.storage.local.get('breachSubscriptions');
    return result.breachSubscriptions || [];
  }

  // ========== 私有方法 ==========

  /**
   * SHA-1 雜湊
   */
  private static async sha1Hash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 取得已儲存的洩漏資料
   */
  private static async getStoredBreachData(email: string): Promise<DataBreach | null> {
    const result = await chrome.storage.local.get('breachData');
    const data = result.breachData || {};
    return data[email] || null;
  }

  /**
   * 儲存洩漏資料
   */
  private static async storeBreachData(email: string, data: DataBreach): Promise<void> {
    const result = await chrome.storage.local.get('breachData');
    const breachData = result.breachData || {};
    breachData[email] = data;
    await chrome.storage.local.set({ breachData });
  }

  /**
   * 取得已知洩漏列表
   */
  private static async getKnownBreaches(): Promise<Array<{
    name: string;
    date: string;
    description: string;
    affectedAccounts: number;
  }>> {
    const result = await chrome.storage.local.get('knownBreaches');
    return result.knownBreaches || [];
  }

  /**
   * 更新已知洩漏列表
   */
  private static async updateKnownBreaches(breaches: any[]): Promise<void> {
    await chrome.storage.local.set({ knownBreaches: breaches });
  }

  /**
   * 獲取最新洩漏事件（模擬）
   */
  private static async fetchLatestBreaches(): Promise<Array<{
    name: string;
    date: string;
    description: string;
    affectedAccounts: number;
  }>> {
    // 實際應該調用 HIBP API
    // 這裡返回空數組作為示例
    return [];
  }

  /**
   * 發送洩漏通知
   */
  private static async notifyNewBreaches(breaches: any[]): Promise<void> {
    for (const breach of breaches) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
        title: '⚠️ 新的數據洩漏警報',
        message: `${breach.name} 發生數據洩漏，影響 ${breach.affectedAccounts.toLocaleString()} 個帳號`,
        priority: 2
      });
    }
  }

  /**
   * 分析洩漏嚴重性
   */
  static analyzeBreachSeverity(breach: {
    name: string;
    dataClasses: string[];
  }): 'critical' | 'high' | 'medium' | 'low' {
    const criticalClasses = ['passwords', 'credit cards', 'social security numbers', 'bank accounts'];
    const highClasses = ['email addresses', 'phone numbers', 'physical addresses'];

    const hasCritical = breach.dataClasses.some(dc =>
      criticalClasses.some(cc => dc.toLowerCase().includes(cc.toLowerCase()))
    );

    const hasHigh = breach.dataClasses.some(dc =>
      highClasses.some(hc => dc.toLowerCase().includes(hc.toLowerCase()))
    );

    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    if (breach.dataClasses.length > 5) return 'medium';
    return 'low';
  }

  /**
   * 取得洩漏統計
   */
  static async getBreachStatistics(): Promise<{
    totalEmails: number;
    totalBreaches: number;
    criticalBreaches: number;
    lastCheck: string;
  }> {
    const subscriptions = await this.getSubscriptions();
    let totalBreaches = 0;
    let criticalBreaches = 0;
    let lastCheck = '';

    for (const email of subscriptions) {
      const data = await this.getStoredBreachData(email);
      if (data) {
        totalBreaches += data.breaches.length;
        lastCheck = data.lastChecked;

        // 統計嚴重洩漏
        for (const breach of data.breaches) {
          const severity = this.analyzeBreachSeverity(breach);
          if (severity === 'critical') {
            criticalBreaches++;
          }
        }
      }
    }

    return {
      totalEmails: subscriptions.length,
      totalBreaches,
      criticalBreaches,
      lastCheck
    };
  }
}
