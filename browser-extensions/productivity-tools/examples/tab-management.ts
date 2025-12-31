/**
 * Tab Management Example
 * Demonstrates advanced browser tab management techniques
 *
 * Key Features:
 * - Tab grouping and organization
 * - Tab search and filtering
 * - Session management (save/restore tab sessions)
 * - Duplicate tab detection and removal
 * - Tab suspending to save memory
 * - Tab pinning and muting
 * - Window management
 * - Tab statistics and analytics
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Tab group configuration
 */
interface TabGroup {
  id: string;
  name: string;
  color: 'grey' | 'blue' | 'red' | 'yellow' | 'green' | 'pink' | 'purple' | 'cyan';
  tabIds: number[];
  collapsed: boolean;
  createdAt: string;
}

/**
 * Saved session
 */
interface TabSession {
  id: string;
  name: string;
  windows: Array<{
    tabs: Array<{
      url: string;
      title: string;
      pinned: boolean;
      groupId?: string;
    }>;
  }>;
  createdAt: string;
  lastModified: string;
}

/**
 * Tab statistics
 */
interface TabStats {
  totalTabs: number;
  totalWindows: number;
  pinnedTabs: number;
  groupedTabs: number;
  duplicateTabs: number;
  memoryUsage: number;  // Estimated MB
  oldestTab: { id: number; age: number };  // Age in hours
}

/**
 * Tab filter options
 */
interface TabFilter {
  searchQuery?: string;
  domain?: string;
  pinned?: boolean;
  audible?: boolean;
  muted?: boolean;
  incognito?: boolean;
  currentWindow?: boolean;
}

// ============================================================================
// Tab Manager Service
// ============================================================================

export class TabManager {
  private static sessions: TabSession[] = [];
  private static autoSuspendEnabled = false;
  private static autoSuspendTimeout = 30; // minutes

  /**
   * Initialize the tab manager
   */
  static async initialize(): Promise<void> {
    console.log('Initializing tab manager...');

    // Load saved sessions
    await this.loadSessions();

    // Set up event listeners
    this.setupListeners();

    // Start auto-suspend if enabled
    const config = await this.getConfig();
    if (config.autoSuspend) {
      this.startAutoSuspend();
    }

    console.log('Tab manager initialized');
  }

  /**
   * Set up tab event listeners
   */
  private static setupListeners(): void {
    // Listen for tab creation
    chrome.tabs.onCreated.addListener((tab) => {
      console.log('Tab created:', tab.id);
    });

    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        console.log('Tab loaded:', tab.title);
      }
    });

    // Listen for tab removal
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      console.log('Tab removed:', tabId);
    });

    // Listen for tab activation
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo.tabId);
    });
  }

  /**
   * Handle tab activation
   */
  private static async handleTabActivated(tabId: number): Promise<void> {
    // Mark tab as recently used (for auto-suspend)
    await chrome.storage.session.set({
      [`tab_${tabId}_lastActive`]: Date.now()
    });
  }

  // ============================================================================
  // Tab Search and Filtering
  // ============================================================================

  /**
   * Search tabs by title or URL
   */
  static async searchTabs(filter: TabFilter): Promise<chrome.tabs.Tab[]> {
    let tabs = await chrome.tabs.query({});

    // Apply filters
    if (filter.currentWindow) {
      tabs = tabs.filter(tab => tab.active || tab.windowId === (await this.getCurrentWindow()).id);
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      tabs = tabs.filter(tab =>
        tab.title?.toLowerCase().includes(query) ||
        tab.url?.toLowerCase().includes(query)
      );
    }

    if (filter.domain) {
      tabs = tabs.filter(tab => {
        try {
          const url = new URL(tab.url || '');
          return url.hostname.includes(filter.domain!);
        } catch {
          return false;
        }
      });
    }

    if (filter.pinned !== undefined) {
      tabs = tabs.filter(tab => tab.pinned === filter.pinned);
    }

    if (filter.audible !== undefined) {
      tabs = tabs.filter(tab => tab.audible === filter.audible);
    }

    if (filter.muted !== undefined) {
      tabs = tabs.filter(tab => tab.mutedInfo?.muted === filter.muted);
    }

    if (filter.incognito !== undefined) {
      tabs = tabs.filter(tab => tab.incognito === filter.incognito);
    }

    return tabs;
  }

  /**
   * Get tabs by domain
   */
  static async getTabsByDomain(domain: string): Promise<chrome.tabs.Tab[]> {
    const allTabs = await chrome.tabs.query({});
    return allTabs.filter(tab => {
      try {
        const url = new URL(tab.url || '');
        return url.hostname === domain || url.hostname.endsWith('.' + domain);
      } catch {
        return false;
      }
    });
  }

  // ============================================================================
  // Tab Grouping
  // ============================================================================

  /**
   * Create a tab group
   */
  static async createTabGroup(
    tabIds: number[],
    name: string,
    color?: 'grey' | 'blue' | 'red' | 'yellow' | 'green' | 'pink' | 'purple' | 'cyan'
  ): Promise<number> {
    // Group the tabs
    const groupId = await chrome.tabs.group({ tabIds });

    // Update group properties
    await chrome.tabGroups.update(groupId, {
      title: name,
      color: color || 'blue',
      collapsed: false
    });

    console.log(`Created tab group "${name}" with ${tabIds.length} tabs`);
    return groupId;
  }

  /**
   * Group tabs by domain
   */
  static async groupTabsByDomain(): Promise<void> {
    const allTabs = await chrome.tabs.query({ currentWindow: true });

    // Group tabs by domain
    const tabsByDomain = new Map<string, number[]>();

    for (const tab of allTabs) {
      if (!tab.id || tab.pinned) continue;

      try {
        const url = new URL(tab.url || '');
        const domain = url.hostname;

        if (!tabsByDomain.has(domain)) {
          tabsByDomain.set(domain, []);
        }
        tabsByDomain.get(domain)!.push(tab.id);
      } catch {
        continue;
      }
    }

    // Create groups for domains with multiple tabs
    const colors: Array<'grey' | 'blue' | 'red' | 'yellow' | 'green' | 'pink' | 'purple' | 'cyan'> =
      ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan'];
    let colorIndex = 0;

    for (const [domain, tabIds] of tabsByDomain) {
      if (tabIds.length > 1) {
        const color = colors[colorIndex % colors.length];
        await this.createTabGroup(tabIds, domain, color);
        colorIndex++;
      }
    }

    console.log(`Grouped tabs into ${colorIndex} groups`);
  }

  /**
   * Ungroup all tabs
   */
  static async ungroupAllTabs(): Promise<void> {
    const groups = await chrome.tabGroups.query({});

    for (const group of groups) {
      await chrome.tabs.ungroup(await this.getTabsInGroup(group.id));
    }

    console.log('Ungrouped all tabs');
  }

  /**
   * Get tabs in a specific group
   */
  private static async getTabsInGroup(groupId: number): Promise<number[]> {
    const tabs = await chrome.tabs.query({ groupId });
    return tabs.map(tab => tab.id!).filter(id => id !== undefined);
  }

  // ============================================================================
  // Duplicate Tab Management
  // ============================================================================

  /**
   * Find duplicate tabs
   */
  static async findDuplicateTabs(): Promise<Map<string, chrome.tabs.Tab[]>> {
    const allTabs = await chrome.tabs.query({});
    const duplicates = new Map<string, chrome.tabs.Tab[]>();

    for (const tab of allTabs) {
      if (!tab.url) continue;

      if (!duplicates.has(tab.url)) {
        duplicates.set(tab.url, []);
      }
      duplicates.get(tab.url)!.push(tab);
    }

    // Keep only URLs with duplicates
    for (const [url, tabs] of duplicates) {
      if (tabs.length <= 1) {
        duplicates.delete(url);
      }
    }

    return duplicates;
  }

  /**
   * Close duplicate tabs (keep the first one)
   */
  static async closeDuplicateTabs(): Promise<number> {
    const duplicates = await this.findDuplicateTabs();
    let closedCount = 0;

    for (const [url, tabs] of duplicates) {
      // Sort by tab ID (older tabs have lower IDs)
      tabs.sort((a, b) => a.id! - b.id!);

      // Close all except the first tab
      for (let i = 1; i < tabs.length; i++) {
        if (tabs[i].id) {
          await chrome.tabs.remove(tabs[i].id);
          closedCount++;
        }
      }
    }

    console.log(`Closed ${closedCount} duplicate tabs`);
    return closedCount;
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Save current session
   */
  static async saveCurrentSession(name: string): Promise<TabSession> {
    const windows = await chrome.windows.getAll({ populate: true });

    const session: TabSession = {
      id: `session-${Date.now()}`,
      name: name,
      windows: windows.map(window => ({
        tabs: (window.tabs || []).map(tab => ({
          url: tab.url || '',
          title: tab.title || '',
          pinned: tab.pinned || false,
          groupId: tab.groupId?.toString()
        }))
      })),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    this.sessions.push(session);
    await this.saveSessions();

    console.log(`Saved session "${name}" with ${windows.length} windows`);
    return session;
  }

  /**
   * Restore a saved session
   */
  static async restoreSession(sessionId: string, newWindow = true): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    for (const windowData of session.windows) {
      const window = newWindow
        ? await chrome.windows.create({ focused: true })
        : await chrome.windows.getCurrent();

      for (const tabData of windowData.tabs) {
        await chrome.tabs.create({
          windowId: window.id,
          url: tabData.url,
          pinned: tabData.pinned,
          active: false
        });
      }

      // Close the default new tab if we created a new window
      if (newWindow && window.tabs && window.tabs.length > 0) {
        const firstTab = window.tabs[0];
        if (firstTab.id && firstTab.url === 'chrome://newtab/') {
          await chrome.tabs.remove(firstTab.id);
        }
      }
    }

    console.log(`Restored session "${session.name}"`);
  }

  /**
   * Delete a saved session
   */
  static async deleteSession(sessionId: string): Promise<void> {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    await this.saveSessions();
    console.log('Session deleted');
  }

  /**
   * Get all saved sessions
   */
  static getSessions(): TabSession[] {
    return [...this.sessions];
  }

  // ============================================================================
  // Tab Suspension (Memory Management)
  // ============================================================================

  /**
   * Suspend a tab to save memory
   */
  static async suspendTab(tabId: number): Promise<void> {
    const tab = await chrome.tabs.get(tabId);

    if (tab.url && !tab.url.startsWith('chrome://')) {
      // Save tab info before suspending
      await chrome.storage.session.set({
        [`suspended_${tabId}`]: {
          url: tab.url,
          title: tab.title
        }
      });

      // Navigate to a lightweight page
      await chrome.tabs.update(tabId, {
        url: `chrome://newtab/?suspended=${encodeURIComponent(tab.url)}`
      });

      console.log('Suspended tab:', tab.title);
    }
  }

  /**
   * Suspend inactive tabs
   */
  static async suspendInactiveTabs(inactiveMinutes = 30): Promise<number> {
    const allTabs = await chrome.tabs.query({});
    const now = Date.now();
    let suspendedCount = 0;

    for (const tab of allTabs) {
      if (!tab.id || tab.active || tab.pinned || tab.audible) continue;

      // Get last active time
      const result = await chrome.storage.session.get(`tab_${tab.id}_lastActive`);
      const lastActive = result[`tab_${tab.id}_lastActive`] || now;

      const inactiveTime = (now - lastActive) / (1000 * 60); // minutes

      if (inactiveTime > inactiveMinutes) {
        await this.suspendTab(tab.id);
        suspendedCount++;
      }
    }

    console.log(`Suspended ${suspendedCount} inactive tabs`);
    return suspendedCount;
  }

  /**
   * Start auto-suspend
   */
  private static startAutoSuspend(): void {
    // Check every 5 minutes
    setInterval(() => {
      this.suspendInactiveTabs(this.autoSuspendTimeout);
    }, 5 * 60 * 1000);
  }

  // ============================================================================
  // Tab Operations
  // ============================================================================

  /**
   * Close tabs by domain
   */
  static async closeTabsByDomain(domain: string): Promise<number> {
    const tabs = await this.getTabsByDomain(domain);
    const tabIds = tabs.map(tab => tab.id!).filter(id => id !== undefined);

    if (tabIds.length > 0) {
      await chrome.tabs.remove(tabIds);
    }

    console.log(`Closed ${tabIds.length} tabs from ${domain}`);
    return tabIds.length;
  }

  /**
   * Pin/unpin tabs
   */
  static async togglePinTab(tabId: number): Promise<void> {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tabId, { pinned: !tab.pinned });
  }

  /**
   * Mute/unmute tabs
   */
  static async toggleMuteTab(tabId: number): Promise<void> {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tabId, { muted: !tab.mutedInfo?.muted });
  }

  /**
   * Mute all audible tabs
   */
  static async muteAllAudibleTabs(): Promise<number> {
    const audibleTabs = await chrome.tabs.query({ audible: true });
    let mutedCount = 0;

    for (const tab of audibleTabs) {
      if (tab.id && !tab.mutedInfo?.muted) {
        await chrome.tabs.update(tab.id, { muted: true });
        mutedCount++;
      }
    }

    console.log(`Muted ${mutedCount} audible tabs`);
    return mutedCount;
  }

  /**
   * Move tab to new window
   */
  static async moveTabToNewWindow(tabId: number): Promise<void> {
    const newWindow = await chrome.windows.create({ tabId });
    console.log('Moved tab to new window:', newWindow.id);
  }

  /**
   * Merge all windows into one
   */
  static async mergeAllWindows(): Promise<void> {
    const windows = await chrome.windows.getAll({ populate: true });

    if (windows.length <= 1) {
      console.log('Only one window open');
      return;
    }

    // Use the first window as the target
    const targetWindow = windows[0];

    // Move tabs from other windows to the target window
    for (let i = 1; i < windows.length; i++) {
      const window = windows[i];
      if (window.tabs) {
        for (const tab of window.tabs) {
          if (tab.id) {
            await chrome.tabs.move(tab.id, {
              windowId: targetWindow.id!,
              index: -1
            });
          }
        }
      }
    }

    console.log(`Merged ${windows.length} windows into one`);
  }

  // ============================================================================
  // Tab Statistics
  // ============================================================================

  /**
   * Get tab statistics
   */
  static async getStats(): Promise<TabStats> {
    const allTabs = await chrome.tabs.query({});
    const windows = await chrome.windows.getAll();
    const duplicates = await this.findDuplicateTabs();

    let pinnedCount = 0;
    let groupedCount = 0;
    let oldestTab = { id: -1, age: 0 };
    const now = Date.now();

    for (const tab of allTabs) {
      if (tab.pinned) pinnedCount++;
      if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) groupedCount++;

      // Calculate tab age
      if (tab.id) {
        const result = await chrome.storage.session.get(`tab_${tab.id}_lastActive`);
        const createdTime = result[`tab_${tab.id}_lastActive`] || now;
        const age = (now - createdTime) / (1000 * 60 * 60); // hours

        if (age > oldestTab.age) {
          oldestTab = { id: tab.id, age };
        }
      }
    }

    // Estimate memory usage (rough estimate: 50MB per tab)
    const memoryUsage = allTabs.length * 50;

    let duplicateCount = 0;
    for (const tabs of duplicates.values()) {
      duplicateCount += tabs.length - 1; // Count extras as duplicates
    }

    return {
      totalTabs: allTabs.length,
      totalWindows: windows.length,
      pinnedTabs: pinnedCount,
      groupedTabs: groupedCount,
      duplicateTabs: duplicateCount,
      memoryUsage,
      oldestTab
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get current window
   */
  private static async getCurrentWindow(): Promise<chrome.windows.Window> {
    return chrome.windows.getCurrent();
  }

  /**
   * Get configuration
   */
  private static async getConfig(): Promise<any> {
    const result = await chrome.storage.local.get('tabManagerConfig');
    return result.tabManagerConfig || { autoSuspend: false };
  }

  // ============================================================================
  // Storage Methods
  // ============================================================================

  private static async loadSessions(): Promise<void> {
    const result = await chrome.storage.local.get('tabSessions');
    this.sessions = result.tabSessions || [];
  }

  private static async saveSessions(): Promise<void> {
    await chrome.storage.local.set({ tabSessions: this.sessions });
  }
}

// ============================================================================
// Usage Example
// ============================================================================

/**
 * Initialize in background script
 */
export async function initializeTabManager(): Promise<void> {
  await TabManager.initialize();

  // Set up keyboard shortcuts
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'group-by-domain') {
      TabManager.groupTabsByDomain();
    } else if (command === 'close-duplicates') {
      TabManager.closeDuplicateTabs();
    } else if (command === 'save-session') {
      TabManager.saveCurrentSession('Quick Save');
    }
  });

  // Handle messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SEARCH_TABS') {
      TabManager.searchTabs(message.filter)
        .then(tabs => sendResponse({ success: true, tabs }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }

    if (message.type === 'GET_TAB_STATS') {
      TabManager.getStats()
        .then(stats => sendResponse({ success: true, stats }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
  });
}

// Auto-initialize
initializeTabManager();

// ============================================================================
// Manifest Requirements
// ============================================================================

/*
{
  "manifest_version": 3,
  "permissions": [
    "tabs",
    "tabGroups",
    "storage",
    "windows"
  ],
  "commands": {
    "group-by-domain": {
      "suggested_key": {
        "default": "Ctrl+Shift+G"
      },
      "description": "Group tabs by domain"
    },
    "close-duplicates": {
      "suggested_key": {
        "default": "Ctrl+Shift+D"
      },
      "description": "Close duplicate tabs"
    }
  }
}
*/
