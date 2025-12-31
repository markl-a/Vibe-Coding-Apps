/**
 * Data Sync Example
 *
 * Demonstrates Chrome storage sync API for cross-device synchronization,
 * conflict resolution, and data management.
 */

// ============================================================================
// Example 1: Basic Chrome Storage Sync
// ============================================================================

/**
 * Save data to sync storage
 */
async function saveToSync<T>(key: string, value: T): Promise<void> {
  await chrome.storage.sync.set({ [key]: value });
  console.log(`Saved ${key} to sync storage`);
}

/**
 * Load data from sync storage
 */
async function loadFromSync<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.sync.get(key);
  return result[key] as T | undefined;
}

/**
 * Remove data from sync storage
 */
async function removeFromSync(key: string): Promise<void> {
  await chrome.storage.sync.remove(key);
  console.log(`Removed ${key} from sync storage`);
}

/**
 * Clear all sync storage
 */
async function clearSync(): Promise<void> {
  await chrome.storage.sync.clear();
  console.log('Cleared all sync storage');
}

// ============================================================================
// Example 2: Sync Storage Limits and Quota
// ============================================================================

/**
 * Get storage quota information
 */
async function getStorageQuota(): Promise<{
  bytesInUse: number;
  quota: number;
  percentUsed: number;
}> {
  const bytesInUse = await chrome.storage.sync.getBytesInUse();
  const quota = chrome.storage.sync.QUOTA_BYTES;

  return {
    bytesInUse,
    quota,
    percentUsed: (bytesInUse / quota) * 100
  };
}

/**
 * Check if data fits within quota
 */
async function checkQuota(data: object): Promise<boolean> {
  const dataSize = JSON.stringify(data).length;
  const { bytesInUse, quota } = await getStorageQuota();

  return bytesInUse + dataSize <= quota;
}

/**
 * Safe save with quota check
 */
async function safeSaveToSync<T>(key: string, value: T): Promise<boolean> {
  const data = { [key]: value };

  if (await checkQuota(data)) {
    await chrome.storage.sync.set(data);
    return true;
  } else {
    console.error('Quota exceeded');
    return false;
  }
}

// ============================================================================
// Example 3: Listen for Sync Changes
// ============================================================================

/**
 * Storage change listener callback type
 */
type StorageChangeListener = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: chrome.storage.AreaName
) => void;

/**
 * Listen for storage changes
 */
function onStorageChanged(listener: StorageChangeListener): void {
  chrome.storage.onChanged.addListener(listener);
}

/**
 * Listen for specific key changes
 */
function onKeyChanged<T>(
  key: string,
  callback: (oldValue: T | undefined, newValue: T | undefined) => void
): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes[key]) {
      callback(changes[key].oldValue as T, changes[key].newValue as T);
    }
  });
}

// Example usage
onKeyChanged<string>('username', (oldValue, newValue) => {
  console.log(`Username changed from ${oldValue} to ${newValue}`);
});

// ============================================================================
// Example 4: Sync Manager with Versioning
// ============================================================================

/**
 * Synced data with metadata
 */
interface SyncedData<T> {
  data: T;
  version: number;
  timestamp: number;
  deviceId: string;
}

/**
 * Sync manager class
 */
class SyncManager {
  private deviceId: string;

  constructor() {
    this.deviceId = this.generateDeviceId();
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    const existing = localStorage.getItem('deviceId');
    if (existing) return existing;

    const id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('deviceId', id);
    return id;
  }

  /**
   * Save data with metadata
   */
  async save<T>(key: string, data: T): Promise<void> {
    const existing = await this.load<T>(key);
    const version = existing ? existing.version + 1 : 1;

    const syncedData: SyncedData<T> = {
      data,
      version,
      timestamp: Date.now(),
      deviceId: this.deviceId
    };

    await chrome.storage.sync.set({ [key]: syncedData });
  }

  /**
   * Load data with metadata
   */
  async load<T>(key: string): Promise<SyncedData<T> | null> {
    const result = await chrome.storage.sync.get(key);
    return result[key] || null;
  }

  /**
   * Get just the data without metadata
   */
  async getData<T>(key: string): Promise<T | null> {
    const synced = await this.load<T>(key);
    return synced ? synced.data : null;
  }

  /**
   * Check if local version is outdated
   */
  async isOutdated<T>(key: string, localVersion: number): Promise<boolean> {
    const synced = await this.load<T>(key);
    return synced ? synced.version > localVersion : false;
  }
}

// ============================================================================
// Example 5: Conflict Resolution
// ============================================================================

/**
 * Conflict resolution strategy
 */
enum ConflictStrategy {
  LATEST_WINS = 'latest_wins',
  HIGHEST_VERSION = 'highest_version',
  MANUAL = 'manual',
  MERGE = 'merge'
}

/**
 * Conflict resolver
 */
class ConflictResolver<T> {
  /**
   * Resolve conflict between local and remote data
   */
  async resolve(
    key: string,
    localData: SyncedData<T>,
    remoteData: SyncedData<T>,
    strategy: ConflictStrategy = ConflictStrategy.LATEST_WINS
  ): Promise<SyncedData<T>> {
    switch (strategy) {
      case ConflictStrategy.LATEST_WINS:
        return this.resolveByTimestamp(localData, remoteData);

      case ConflictStrategy.HIGHEST_VERSION:
        return this.resolveByVersion(localData, remoteData);

      case ConflictStrategy.MANUAL:
        return await this.resolveManually(key, localData, remoteData);

      case ConflictStrategy.MERGE:
        return this.resolveMerge(localData, remoteData);

      default:
        return localData;
    }
  }

  /**
   * Resolve by latest timestamp
   */
  private resolveByTimestamp(
    localData: SyncedData<T>,
    remoteData: SyncedData<T>
  ): SyncedData<T> {
    return localData.timestamp > remoteData.timestamp ? localData : remoteData;
  }

  /**
   * Resolve by highest version
   */
  private resolveByVersion(
    localData: SyncedData<T>,
    remoteData: SyncedData<T>
  ): SyncedData<T> {
    return localData.version > remoteData.version ? localData : remoteData;
  }

  /**
   * Resolve manually with user input
   */
  private async resolveManually(
    key: string,
    localData: SyncedData<T>,
    remoteData: SyncedData<T>
  ): Promise<SyncedData<T>> {
    // In a real implementation, this would show a UI for the user to choose
    // For this example, we'll just log and return local
    console.log('Manual conflict resolution needed for:', key);
    console.log('Local:', localData);
    console.log('Remote:', remoteData);

    return localData;
  }

  /**
   * Merge data (only works for certain data types)
   */
  private resolveMerge(
    localData: SyncedData<T>,
    remoteData: SyncedData<T>
  ): SyncedData<T> {
    // Simple merge for objects
    if (typeof localData.data === 'object' && typeof remoteData.data === 'object') {
      const merged = {
        ...remoteData.data,
        ...localData.data
      } as T;

      return {
        data: merged,
        version: Math.max(localData.version, remoteData.version) + 1,
        timestamp: Date.now(),
        deviceId: localData.deviceId
      };
    }

    // For non-objects, use latest wins
    return this.resolveByTimestamp(localData, remoteData);
  }
}

// ============================================================================
// Example 6: Auto-Sync Manager
// ============================================================================

/**
 * Auto-sync manager with conflict resolution
 */
class AutoSyncManager<T> {
  private syncManager: SyncManager;
  private conflictResolver: ConflictResolver<T>;
  private syncInterval: number | null = null;

  constructor() {
    this.syncManager = new SyncManager();
    this.conflictResolver = new ConflictResolver<T>();
    this.setupListeners();
  }

  /**
   * Setup storage change listeners
   */
  private setupListeners(): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        this.handleRemoteChanges(changes);
      }
    });
  }

  /**
   * Handle remote changes
   */
  private async handleRemoteChanges(
    changes: { [key: string]: chrome.storage.StorageChange }
  ): Promise<void> {
    for (const [key, change] of Object.entries(changes)) {
      if (change.newValue) {
        console.log(`Remote change detected for ${key}`);
        // Notify app of remote changes
        this.notifyChange(key, change.newValue as SyncedData<T>);
      }
    }
  }

  /**
   * Notify app of data changes
   */
  private notifyChange(key: string, data: SyncedData<T>): void {
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('sync-update', {
      detail: { key, data }
    }));
  }

  /**
   * Save with automatic conflict resolution
   */
  async save(
    key: string,
    data: T,
    strategy: ConflictStrategy = ConflictStrategy.LATEST_WINS
  ): Promise<void> {
    const localData: SyncedData<T> = {
      data,
      version: 1,
      timestamp: Date.now(),
      deviceId: this.syncManager['deviceId']
    };

    // Check for existing remote data
    const remoteData = await this.syncManager.load<T>(key);

    if (remoteData) {
      // Resolve conflict
      const resolved = await this.conflictResolver.resolve(
        key,
        localData,
        remoteData,
        strategy
      );
      await chrome.storage.sync.set({ [key]: resolved });
    } else {
      // No conflict, save directly
      await chrome.storage.sync.set({ [key]: localData });
    }
  }

  /**
   * Load data
   */
  async load(key: string): Promise<T | null> {
    return await this.syncManager.getData<T>(key);
  }

  /**
   * Start periodic sync check
   */
  startPeriodicSync(intervalMs: number = 60000): void {
    this.stopPeriodicSync();

    this.syncInterval = window.setInterval(() => {
      this.checkSync();
    }, intervalMs);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Check sync status
   */
  private async checkSync(): Promise<void> {
    console.log('Checking sync status...');
    const quota = await getStorageQuota();
    console.log(`Storage: ${quota.bytesInUse} / ${quota.quota} bytes (${quota.percentUsed.toFixed(2)}%)`);
  }
}

// ============================================================================
// Example 7: Usage Examples
// ============================================================================

// Basic usage
async function basicUsageExample(): Promise<void> {
  // Save data
  await saveToSync('username', 'john_doe');

  // Load data
  const username = await loadFromSync<string>('username');
  console.log('Username:', username);

  // Check quota
  const quota = await getStorageQuota();
  console.log('Storage quota:', quota);
}

// Auto-sync usage
async function autoSyncExample(): Promise<void> {
  interface UserSettings {
    theme: string;
    fontSize: number;
    notifications: boolean;
  }

  const autoSync = new AutoSyncManager<UserSettings>();

  // Save settings
  await autoSync.save('userSettings', {
    theme: 'dark',
    fontSize: 14,
    notifications: true
  });

  // Load settings
  const settings = await autoSync.load('userSettings');
  console.log('Settings:', settings);

  // Start periodic sync
  autoSync.startPeriodicSync(30000); // Check every 30 seconds
}

// Listen for changes
function listenForChanges(): void {
  window.addEventListener('sync-update', ((event: CustomEvent) => {
    console.log('Sync update:', event.detail);
  }) as EventListener);
}

export {
  saveToSync,
  loadFromSync,
  removeFromSync,
  clearSync,
  getStorageQuota,
  safeSaveToSync,
  onStorageChanged,
  onKeyChanged,
  SyncManager,
  ConflictResolver,
  ConflictStrategy,
  AutoSyncManager,
  SyncedData
};
