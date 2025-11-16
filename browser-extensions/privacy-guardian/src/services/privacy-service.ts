/**
 * 隱私清理服務
 */
export class PrivacyService {
  /**
   * 清除瀏覽歷史
   */
  static async clearHistory(options: {
    since?: number; // 時間戳
  } = {}): Promise<void> {
    const since = options.since || 0;
    await chrome.browsingData.removeHistory({ since });
  }

  /**
   * 清除快取
   */
  static async clearCache(options: {
    since?: number;
  } = {}): Promise<void> {
    const since = options.since || 0;
    await chrome.browsingData.removeCache({ since });
  }

  /**
   * 清除下載記錄
   */
  static async clearDownloads(options: {
    since?: number;
  } = {}): Promise<void> {
    const since = options.since || 0;
    await chrome.browsingData.removeDownloads({ since });
  }

  /**
   * 清除表單資料
   */
  static async clearFormData(options: {
    since?: number;
  } = {}): Promise<void> {
    const since = options.since || 0;
    await chrome.browsingData.removeFormData({ since });
  }

  /**
   * 清除密碼（瀏覽器儲存的，非此擴展）
   */
  static async clearPasswords(options: {
    since?: number;
  } = {}): Promise<void> {
    const since = options.since || 0;
    await chrome.browsingData.removePasswords({ since });
  }

  /**
   * 清除 localStorage
   */
  static async clearLocalStorage(options: {
    since?: number;
  } = {}): Promise<void> {
    const since = options.since || 0;
    await chrome.browsingData.removeLocalStorage({ since });
  }

  /**
   * 清除 IndexedDB
   */
  static async clearIndexedDB(options: {
    since?: number;
  } = {}): Promise<void> {
    const since = options.since || 0;
    await chrome.browsingData.remove(
      { since },
      { indexedDB: true }
    );
  }

  /**
   * 清除所有瀏覽資料
   */
  static async clearAll(options: {
    since?: number;
  } = {}): Promise<void> {
    const since = options.since || 0;
    await chrome.browsingData.remove(
      { since },
      {
        cache: true,
        cookies: true,
        downloads: true,
        formData: true,
        history: true,
        indexedDB: true,
        localStorage: true,
        passwords: true,
        serviceWorkers: true
      }
    );
  }

  /**
   * 取得自動清理設定
   */
  static async getAutoCleanSettings(): Promise<{
    enabled: boolean;
    interval: 'hourly' | 'daily' | 'weekly';
    dataTypes: string[];
  }> {
    const result = await chrome.storage.local.get('autoCleanSettings');
    return result.autoCleanSettings || {
      enabled: false,
      interval: 'daily',
      dataTypes: ['cache', 'history']
    };
  }

  /**
   * 設定自動清理
   */
  static async setAutoCleanSettings(settings: {
    enabled: boolean;
    interval: 'hourly' | 'daily' | 'weekly';
    dataTypes: string[];
  }): Promise<void> {
    await chrome.storage.local.set({ autoCleanSettings: settings });
  }

  /**
   * 執行自動清理
   */
  static async performAutoClean(): Promise<void> {
    const settings = await this.getAutoCleanSettings();
    if (!settings.enabled) return;

    const dataTypes = settings.dataTypes;
    const removeOptions: chrome.browsingData.RemovalOptions = { since: 0 };
    const dataToRemove: chrome.browsingData.DataTypeSet = {};

    for (const type of dataTypes) {
      switch (type) {
        case 'cache':
          dataToRemove.cache = true;
          break;
        case 'history':
          dataToRemove.history = true;
          break;
        case 'downloads':
          dataToRemove.downloads = true;
          break;
        case 'formData':
          dataToRemove.formData = true;
          break;
        case 'cookies':
          dataToRemove.cookies = true;
          break;
      }
    }

    await chrome.browsingData.remove(removeOptions, dataToRemove);
  }

  /**
   * 取得隱私設定
   */
  static async getPrivacySettings(): Promise<{
    networkPredictionEnabled: boolean;
    safeBrowsingEnabled: boolean;
    thirdPartyCookiesAllowed: boolean;
  }> {
    const settings = await chrome.privacy.services.get({});
    const network = await chrome.privacy.network.networkPredictionEnabled.get({});
    const safeBrowsing = await chrome.privacy.services.safeBrowsingEnabled.get({});

    return {
      networkPredictionEnabled: network.value,
      safeBrowsingEnabled: safeBrowsing.value,
      thirdPartyCookiesAllowed: true // Chrome API 限制
    };
  }

  /**
   * 設定網路預測
   */
  static async setNetworkPrediction(enabled: boolean): Promise<void> {
    await chrome.privacy.network.networkPredictionEnabled.set({
      value: enabled
    });
  }

  /**
   * 取得瀏覽資料使用量
   */
  static async getDataUsage(): Promise<{
    estimate?: {
      usage: number;
      quota: number;
    };
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return { estimate };
    }
    return {};
  }
}
