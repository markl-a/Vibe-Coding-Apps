/**
 * Permissions API Example
 *
 * Demonstrates how to request, check, and manage permissions in Chrome extensions.
 * Includes optional permissions, host permissions, and permission events.
 */

// ============================================================================
// Example 1: Check Permissions
// ============================================================================

/**
 * Check if extension has specific permissions
 */
async function hasPermission(permission: string): Promise<boolean> {
  const result = await chrome.permissions.contains({
    permissions: [permission]
  });

  return result;
}

/**
 * Check if extension has host permissions
 */
async function hasHostPermission(host: string): Promise<boolean> {
  const result = await chrome.permissions.contains({
    origins: [host]
  });

  return result;
}

/**
 * Check multiple permissions at once
 */
async function hasPermissions(
  permissions: string[],
  origins?: string[]
): Promise<boolean> {
  const result = await chrome.permissions.contains({
    permissions,
    origins: origins || []
  });

  return result;
}

/**
 * Get all granted permissions
 */
async function getAllPermissions(): Promise<chrome.permissions.Permissions> {
  return await chrome.permissions.getAll();
}

// ============================================================================
// Example 2: Request Permissions
// ============================================================================

/**
 * Request a single permission
 */
async function requestPermission(permission: string): Promise<boolean> {
  try {
    const granted = await chrome.permissions.request({
      permissions: [permission]
    });

    if (granted) {
      console.log(`Permission granted: ${permission}`);
    } else {
      console.log(`Permission denied: ${permission}`);
    }

    return granted;
  } catch (error) {
    console.error('Error requesting permission:', error);
    return false;
  }
}

/**
 * Request host permission
 */
async function requestHostPermission(host: string): Promise<boolean> {
  try {
    const granted = await chrome.permissions.request({
      origins: [host]
    });

    if (granted) {
      console.log(`Host permission granted: ${host}`);
    } else {
      console.log(`Host permission denied: ${host}`);
    }

    return granted;
  } catch (error) {
    console.error('Error requesting host permission:', error);
    return false;
  }
}

/**
 * Request multiple permissions
 */
async function requestPermissions(
  permissions: string[],
  origins?: string[]
): Promise<boolean> {
  try {
    const granted = await chrome.permissions.request({
      permissions,
      origins: origins || []
    });

    return granted;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}

// ============================================================================
// Example 3: Remove Permissions
// ============================================================================

/**
 * Remove a permission
 */
async function removePermission(permission: string): Promise<boolean> {
  try {
    const removed = await chrome.permissions.remove({
      permissions: [permission]
    });

    if (removed) {
      console.log(`Permission removed: ${permission}`);
    }

    return removed;
  } catch (error) {
    console.error('Error removing permission:', error);
    return false;
  }
}

/**
 * Remove host permission
 */
async function removeHostPermission(host: string): Promise<boolean> {
  try {
    const removed = await chrome.permissions.remove({
      origins: [host]
    });

    if (removed) {
      console.log(`Host permission removed: ${host}`);
    }

    return removed;
  } catch (error) {
    console.error('Error removing host permission:', error);
    return false;
  }
}

/**
 * Remove multiple permissions
 */
async function removePermissions(
  permissions: string[],
  origins?: string[]
): Promise<boolean> {
  try {
    const removed = await chrome.permissions.remove({
      permissions,
      origins: origins || []
    });

    return removed;
  } catch (error) {
    console.error('Error removing permissions:', error);
    return false;
  }
}

// ============================================================================
// Example 4: Permission Events
// ============================================================================

/**
 * Permission change callback
 */
type PermissionChangeCallback = (permissions: chrome.permissions.Permissions) => void;

/**
 * Listen for permission additions
 */
function onPermissionAdded(callback: PermissionChangeCallback): void {
  chrome.permissions.onAdded.addListener(callback);
}

/**
 * Listen for permission removals
 */
function onPermissionRemoved(callback: PermissionChangeCallback): void {
  chrome.permissions.onRemoved.addListener(callback);
}

/**
 * Setup permission change listeners
 */
function setupPermissionListeners(): void {
  chrome.permissions.onAdded.addListener((permissions) => {
    console.log('Permissions added:', permissions);

    if (permissions.permissions) {
      permissions.permissions.forEach((permission) => {
        console.log(`New permission: ${permission}`);
      });
    }

    if (permissions.origins) {
      permissions.origins.forEach((origin) => {
        console.log(`New host permission: ${origin}`);
      });
    }
  });

  chrome.permissions.onRemoved.addListener((permissions) => {
    console.log('Permissions removed:', permissions);

    if (permissions.permissions) {
      permissions.permissions.forEach((permission) => {
        console.log(`Removed permission: ${permission}`);
      });
    }

    if (permissions.origins) {
      permissions.origins.forEach((origin) => {
        console.log(`Removed host permission: ${origin}`);
      });
    }
  });
}

// ============================================================================
// Example 5: Permission Manager
// ============================================================================

/**
 * Permission configuration
 */
interface PermissionConfig {
  name: string;
  permission?: string;
  origins?: string[];
  description: string;
  required: boolean;
}

/**
 * Permission manager class
 */
class PermissionManager {
  private configs: Map<string, PermissionConfig> = new Map();

  /**
   * Register permission configuration
   */
  register(config: PermissionConfig): void {
    this.configs.set(config.name, config);
  }

  /**
   * Check if feature is available
   */
  async isAvailable(name: string): Promise<boolean> {
    const config = this.configs.get(name);
    if (!config) return false;

    if (config.permission) {
      return await hasPermission(config.permission);
    }

    if (config.origins && config.origins.length > 0) {
      return await hasHostPermission(config.origins[0]);
    }

    return false;
  }

  /**
   * Request permission for feature
   */
  async requestFeature(name: string): Promise<boolean> {
    const config = this.configs.get(name);
    if (!config) {
      console.error(`Unknown feature: ${name}`);
      return false;
    }

    const permissions: string[] = config.permission ? [config.permission] : [];
    const origins: string[] = config.origins || [];

    return await requestPermissions(permissions, origins);
  }

  /**
   * Remove permission for feature
   */
  async removeFeature(name: string): Promise<boolean> {
    const config = this.configs.get(name);
    if (!config || config.required) {
      return false;
    }

    const permissions: string[] = config.permission ? [config.permission] : [];
    const origins: string[] = config.origins || [];

    return await removePermissions(permissions, origins);
  }

  /**
   * Get all features with their status
   */
  async getAllFeatures(): Promise<Array<{ name: string; available: boolean; config: PermissionConfig }>> {
    const features = [];

    for (const [name, config] of this.configs) {
      const available = await this.isAvailable(name);
      features.push({ name, available, config });
    }

    return features;
  }

  /**
   * Get available features
   */
  async getAvailableFeatures(): Promise<string[]> {
    const features = await this.getAllFeatures();
    return features.filter((f) => f.available).map((f) => f.name);
  }
}

// ============================================================================
// Example 6: Common Permission Patterns
// ============================================================================

/**
 * Request clipboard permissions
 */
async function requestClipboardPermissions(): Promise<boolean> {
  return await requestPermissions(['clipboardRead', 'clipboardWrite']);
}

/**
 * Request storage permissions
 */
async function requestStoragePermissions(): Promise<boolean> {
  return await requestPermission('storage');
}

/**
 * Request tabs permissions
 */
async function requestTabsPermissions(): Promise<boolean> {
  return await requestPermission('tabs');
}

/**
 * Request notifications permissions
 */
async function requestNotificationsPermissions(): Promise<boolean> {
  return await requestPermission('notifications');
}

/**
 * Request downloads permissions
 */
async function requestDownloadsPermissions(): Promise<boolean> {
  return await requestPermissions(['downloads', 'downloads.open']);
}

/**
 * Request context menus permissions
 */
async function requestContextMenusPermissions(): Promise<boolean> {
  return await requestPermission('contextMenus');
}

/**
 * Request bookmarks permissions
 */
async function requestBookmarksPermissions(): Promise<boolean> {
  return await requestPermission('bookmarks');
}

/**
 * Request history permissions
 */
async function requestHistoryPermissions(): Promise<boolean> {
  return await requestPermission('history');
}

/**
 * Request all URLs permission
 */
async function requestAllUrlsPermission(): Promise<boolean> {
  return await requestHostPermission('<all_urls>');
}

/**
 * Request specific website permission
 */
async function requestWebsitePermission(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const origin = `${urlObj.protocol}//${urlObj.hostname}/*`;
    return await requestHostPermission(origin);
  } catch (error) {
    console.error('Invalid URL:', url);
    return false;
  }
}

// ============================================================================
// Example 7: Permission UI Helper
// ============================================================================

/**
 * Permission request with user confirmation
 */
async function requestWithConfirmation(
  permissionName: string,
  description: string
): Promise<boolean> {
  // In a real extension, show a nice UI instead of confirm()
  const confirmed = confirm(
    `This extension needs permission to ${description}.\n\nGrant permission?`
  );

  if (!confirmed) {
    return false;
  }

  return await requestPermission(permissionName);
}

/**
 * Host permission request with user confirmation
 */
async function requestHostWithConfirmation(
  host: string,
  reason: string
): Promise<boolean> {
  const confirmed = confirm(
    `This extension needs access to ${host}.\n\nReason: ${reason}\n\nGrant permission?`
  );

  if (!confirmed) {
    return false;
  }

  return await requestHostPermission(host);
}

// ============================================================================
// Example 8: Optional Permissions in manifest.json
// ============================================================================

/**
 * Example manifest.json configuration:
 *
 * {
 *   "name": "My Extension",
 *   "version": "1.0",
 *   "manifest_version": 3,
 *   "permissions": [
 *     "storage",
 *     "activeTab"
 *   ],
 *   "optional_permissions": [
 *     "tabs",
 *     "bookmarks",
 *     "history",
 *     "downloads",
 *     "clipboardRead",
 *     "clipboardWrite"
 *   ],
 *   "optional_host_permissions": [
 *     "https://www.google.com/*",
 *     "https://twitter.com/*",
 *     "https://facebook.com/*"
 *   ]
 * }
 */

// ============================================================================
// Example 9: Feature Detection and Graceful Degradation
// ============================================================================

/**
 * Execute function with permission check
 */
async function withPermission<T>(
  permission: string,
  fn: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T | null> {
  const hasPermission = await hasPermission(permission);

  if (hasPermission) {
    return await fn();
  } else {
    console.warn(`Missing permission: ${permission}`);

    if (fallback) {
      return await fallback();
    }

    return null;
  }
}

/**
 * Execute function with auto-request
 */
async function withAutoRequest<T>(
  permission: string,
  fn: () => Promise<T>
): Promise<T | null> {
  let hasPermission = await hasPermission(permission);

  if (!hasPermission) {
    // Try to request permission
    const granted = await requestPermission(permission);
    if (!granted) {
      return null;
    }
  }

  return await fn();
}

// ============================================================================
// Example 10: Usage Examples
// ============================================================================

// Setup permission manager
const permissionManager = new PermissionManager();

permissionManager.register({
  name: 'clipboard',
  permission: 'clipboardRead',
  description: 'Read from clipboard',
  required: false
});

permissionManager.register({
  name: 'downloads',
  permission: 'downloads',
  description: 'Download files',
  required: false
});

permissionManager.register({
  name: 'twitter',
  origins: ['https://twitter.com/*'],
  description: 'Access Twitter',
  required: false
});

// Check and request permissions
async function setupFeatures(): Promise<void> {
  // Check if clipboard feature is available
  const hasClipboard = await permissionManager.isAvailable('clipboard');
  console.log('Clipboard available:', hasClipboard);

  // Request downloads feature
  const downloadsGranted = await permissionManager.requestFeature('downloads');
  console.log('Downloads granted:', downloadsGranted);

  // Get all available features
  const features = await permissionManager.getAvailableFeatures();
  console.log('Available features:', features);
}

// Use permissions with fallback
async function copyToClipboard(text: string): Promise<boolean> {
  const result = await withPermission(
    'clipboardWrite',
    async () => {
      await navigator.clipboard.writeText(text);
      return true;
    },
    async () => {
      // Fallback: use execCommand
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  );

  return result || false;
}

// Request permission when needed
async function downloadFile(url: string): Promise<void> {
  await withAutoRequest('downloads', async () => {
    await chrome.downloads.download({ url });
  });
}

// Listen for permission changes
setupPermissionListeners();

// Get all current permissions
getAllPermissions().then((permissions) => {
  console.log('Current permissions:', permissions);
});

export {
  hasPermission,
  hasHostPermission,
  hasPermissions,
  getAllPermissions,
  requestPermission,
  requestHostPermission,
  requestPermissions,
  removePermission,
  removeHostPermission,
  removePermissions,
  onPermissionAdded,
  onPermissionRemoved,
  setupPermissionListeners,
  PermissionManager,
  PermissionConfig,
  requestClipboardPermissions,
  requestStoragePermissions,
  requestTabsPermissions,
  requestNotificationsPermissions,
  requestDownloadsPermissions,
  requestContextMenusPermissions,
  requestBookmarksPermissions,
  requestHistoryPermissions,
  requestAllUrlsPermission,
  requestWebsitePermission,
  requestWithConfirmation,
  requestHostWithConfirmation,
  withPermission,
  withAutoRequest
};
