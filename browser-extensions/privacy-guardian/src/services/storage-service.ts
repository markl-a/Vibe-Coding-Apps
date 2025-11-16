/**
 * 安全儲存服務
 */
export class StorageService {
  /**
   * 儲存資料到 local storage
   */
  static async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  /**
   * 從 local storage 讀取資料
   */
  static async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? defaultValue;
  }

  /**
   * 從 local storage 刪除資料
   */
  static async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }

  /**
   * 清空 local storage
   */
  static async clear(): Promise<void> {
    await chrome.storage.local.clear();
  }

  /**
   * 儲存到 sync storage（跨裝置同步）
   */
  static async syncSet<T>(key: string, value: T): Promise<void> {
    await chrome.storage.sync.set({ [key]: value });
  }

  /**
   * 從 sync storage 讀取
   */
  static async syncGet<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const result = await chrome.storage.sync.get(key);
    return result[key] ?? defaultValue;
  }

  /**
   * 取得儲存空間使用情況
   */
  static async getUsage(): Promise<{
    used: number;
    total: number;
    percentage: number;
  }> {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    const quota = chrome.storage.local.QUOTA_BYTES;

    return {
      used: bytesInUse,
      total: quota,
      percentage: (bytesInUse / quota) * 100
    };
  }
}
