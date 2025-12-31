/**
 * Content Blocking Example
 * Demonstrates how to block trackers, ads, and unwanted content using WebRequest API
 *
 * Key Features:
 * - Block requests to known tracker domains
 * - Block ads and analytics scripts
 * - Content filtering with multiple rule types
 * - Performance monitoring and statistics
 * - Custom blocklist management
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Blocking rule configuration
 */
interface BlockingRule {
  id: string;
  pattern: string;          // URL pattern to match (supports wildcards)
  type: chrome.webRequest.ResourceType[];
  action: 'block' | 'redirect' | 'allow';
  redirectUrl?: string;     // For redirect actions
  enabled: boolean;
  category: 'tracker' | 'ad' | 'analytics' | 'social' | 'malware' | 'custom';
}

/**
 * Blocking statistics
 */
interface BlockingStats {
  totalBlocked: number;
  blockedToday: number;
  blockedByCategory: Map<string, number>;
  blockedByDomain: Map<string, number>;
  lastReset: string;
  bandwidthSaved: number;   // Estimated bytes saved
}

/**
 * Filter list configuration
 */
interface FilterList {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  lastUpdated: string;
  ruleCount: number;
}

// ============================================================================
// Content Blocking Service
// ============================================================================

export class ContentBlocker {
  private static rules: BlockingRule[] = [];
  private static stats: BlockingStats = {
    totalBlocked: 0,
    blockedToday: 0,
    blockedByCategory: new Map(),
    blockedByDomain: new Map(),
    lastReset: new Date().toISOString(),
    bandwidthSaved: 0
  };

  // Known tracker domains (subset - in production, use comprehensive lists like EasyList)
  private static readonly TRACKER_DOMAINS = [
    'google-analytics.com',
    'doubleclick.net',
    'facebook.com/tr',
    'connect.facebook.net',
    'analytics.twitter.com',
    'stats.g.doubleclick.net',
    'bat.bing.com',
    'scorecardresearch.com',
    'quantserve.com',
    'pixel.advertising.com'
  ];

  // Ad script patterns
  private static readonly AD_PATTERNS = [
    '*://*/ads.js',
    '*://*/advertising.js',
    '*://*.googlesyndication.com/*',
    '*://*.adservice.google.com/*',
    '*://*.advertising.com/*',
    '*://pagead2.googlesyndication.com/*'
  ];

  /**
   * Initialize the content blocker
   * Sets up WebRequest listeners and loads blocking rules
   */
  static async initialize(): Promise<void> {
    console.log('Initializing content blocker...');

    // Load saved rules and stats
    await this.loadRules();
    await this.loadStats();

    // Set up default blocking rules
    this.setupDefaultRules();

    // Register WebRequest listeners
    this.registerRequestListeners();

    // Update filter lists daily
    this.scheduleFilterListUpdates();

    console.log('Content blocker initialized with', this.rules.length, 'rules');
  }

  /**
   * Set up default blocking rules
   */
  private static setupDefaultRules(): void {
    // Add tracker domain rules
    this.TRACKER_DOMAINS.forEach((domain, index) => {
      this.rules.push({
        id: `tracker-${index}`,
        pattern: `*://${domain}/*`,
        type: ['script', 'xmlhttprequest', 'image', 'sub_frame'],
        action: 'block',
        enabled: true,
        category: 'tracker'
      });
    });

    // Add ad script rules
    this.AD_PATTERNS.forEach((pattern, index) => {
      this.rules.push({
        id: `ad-${index}`,
        pattern: pattern,
        type: ['script'],
        action: 'block',
        enabled: true,
        category: 'ad'
      });
    });

    // Social media widgets
    this.rules.push({
      id: 'social-facebook-sdk',
      pattern: '*://connect.facebook.net/*/sdk.js',
      type: ['script'],
      action: 'block',
      enabled: true,
      category: 'social'
    });

    this.rules.push({
      id: 'social-twitter-widgets',
      pattern: '*://platform.twitter.com/widgets.js',
      type: ['script'],
      action: 'block',
      enabled: true,
      category: 'social'
    });
  }

  /**
   * Register WebRequest listeners for blocking
   */
  private static registerRequestListeners(): void {
    // Listen for requests before they are sent
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => this.handleRequest(details),
      { urls: ['<all_urls>'] },
      ['blocking']
    );

    // Listen for response headers to estimate bandwidth saved
    chrome.webRequest.onCompleted.addListener(
      (details) => this.handleCompleted(details),
      { urls: ['<all_urls>'] },
      ['responseHeaders']
    );
  }

  /**
   * Handle incoming web requests
   */
  private static handleRequest(
    details: chrome.webRequest.WebRequestBodyDetails
  ): chrome.webRequest.BlockingResponse | void {
    // Check each enabled rule
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Check if request matches rule pattern
      if (this.matchesPattern(details.url, rule.pattern)) {
        // Check if request type matches
        if (rule.type.includes(details.type as chrome.webRequest.ResourceType)) {
          console.log(`Blocked ${rule.category}:`, details.url);

          // Record the block
          this.recordBlock(details.url, rule.category);

          // Perform the action
          if (rule.action === 'block') {
            return { cancel: true };
          } else if (rule.action === 'redirect' && rule.redirectUrl) {
            return { redirectUrl: rule.redirectUrl };
          }
        }
      }
    }

    // Allow request
    return { cancel: false };
  }

  /**
   * Handle completed requests (for statistics)
   */
  private static handleCompleted(
    details: chrome.webRequest.WebResponseHeadersDetails
  ): void {
    // This is called for allowed requests
    // We can use this to track bandwidth usage for comparison
  }

  /**
   * Check if URL matches pattern (supports wildcards)
   */
  private static matchesPattern(url: string, pattern: string): boolean {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')           // Escape dots
      .replace(/\*/g, '.*')            // Replace * with .*
      .replace(/\?/g, '.');            // Replace ? with .

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  }

  /**
   * Record a blocked request
   */
  private static recordBlock(url: string, category: string): void {
    // Update counters
    this.stats.totalBlocked++;
    this.stats.blockedToday++;

    // Update category stats
    const categoryCount = this.stats.blockedByCategory.get(category) || 0;
    this.stats.blockedByCategory.set(category, categoryCount + 1);

    // Update domain stats
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const domainCount = this.stats.blockedByDomain.get(domain) || 0;
      this.stats.blockedByDomain.set(domain, domainCount + 1);
    } catch (error) {
      console.error('Error parsing URL:', error);
    }

    // Estimate bandwidth saved (rough estimate)
    this.stats.bandwidthSaved += this.estimateResourceSize(url);

    // Save stats periodically
    this.saveStatsThrottled();
  }

  /**
   * Estimate the size of a blocked resource
   */
  private static estimateResourceSize(url: string): number {
    // Rough estimates based on resource type
    if (url.includes('.js')) return 50000;        // ~50KB for scripts
    if (url.includes('.css')) return 20000;       // ~20KB for styles
    if (url.includes('.jpg') || url.includes('.png')) return 100000; // ~100KB for images
    return 5000; // ~5KB for other resources
  }

  /**
   * Add a custom blocking rule
   */
  static async addRule(rule: Omit<BlockingRule, 'id'>): Promise<void> {
    const newRule: BlockingRule = {
      ...rule,
      id: `custom-${Date.now()}`
    };

    this.rules.push(newRule);
    await this.saveRules();
    console.log('Added custom rule:', newRule.id);
  }

  /**
   * Remove a blocking rule
   */
  static async removeRule(ruleId: string): Promise<void> {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    await this.saveRules();
    console.log('Removed rule:', ruleId);
  }

  /**
   * Enable/disable a rule
   */
  static async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      await this.saveRules();
    }
  }

  /**
   * Get current blocking statistics
   */
  static getStats(): BlockingStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  static async resetStats(): Promise<void> {
    this.stats = {
      totalBlocked: 0,
      blockedToday: 0,
      blockedByCategory: new Map(),
      blockedByDomain: new Map(),
      lastReset: new Date().toISOString(),
      bandwidthSaved: 0
    };
    await this.saveStats();
  }

  /**
   * Get all blocking rules
   */
  static getRules(): BlockingRule[] {
    return [...this.rules];
  }

  /**
   * Import filter list from URL (e.g., EasyList format)
   */
  static async importFilterList(url: string): Promise<number> {
    try {
      const response = await fetch(url);
      const text = await response.text();
      const lines = text.split('\n');

      let importedCount = 0;

      for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith('!') || line.startsWith('[') || !line.trim()) {
          continue;
        }

        // Parse EasyList format rules (simplified)
        if (line.startsWith('||')) {
          // Domain-based blocking
          const domain = line.substring(2).split(/[\^\/]/)[0];
          await this.addRule({
            pattern: `*://${domain}/*`,
            type: ['script', 'xmlhttprequest', 'image'],
            action: 'block',
            enabled: true,
            category: 'custom'
          });
          importedCount++;
        }
      }

      console.log(`Imported ${importedCount} rules from filter list`);
      return importedCount;
    } catch (error) {
      console.error('Error importing filter list:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic filter list updates
   */
  private static scheduleFilterListUpdates(): void {
    // Update filter lists every 24 hours
    const updateInterval = 24 * 60 * 60 * 1000; // 24 hours

    setInterval(async () => {
      console.log('Updating filter lists...');
      const lists = await this.getFilterLists();

      for (const list of lists) {
        if (list.enabled) {
          try {
            await this.importFilterList(list.url);
            list.lastUpdated = new Date().toISOString();
          } catch (error) {
            console.error('Error updating filter list:', list.name, error);
          }
        }
      }

      await this.saveFilterLists(lists);
    }, updateInterval);
  }

  // ============================================================================
  // Storage Methods
  // ============================================================================

  private static saveStatsTimeout: number | null = null;

  /**
   * Save stats with throttling (max once per 5 seconds)
   */
  private static saveStatsThrottled(): void {
    if (this.saveStatsTimeout) return;

    this.saveStatsTimeout = window.setTimeout(() => {
      this.saveStats();
      this.saveStatsTimeout = null;
    }, 5000);
  }

  /**
   * Save blocking rules to storage
   */
  private static async saveRules(): Promise<void> {
    await chrome.storage.local.set({ blockingRules: this.rules });
  }

  /**
   * Load blocking rules from storage
   */
  private static async loadRules(): Promise<void> {
    const result = await chrome.storage.local.get('blockingRules');
    if (result.blockingRules) {
      this.rules = result.blockingRules;
    }
  }

  /**
   * Save statistics to storage
   */
  private static async saveStats(): Promise<void> {
    const statsData = {
      totalBlocked: this.stats.totalBlocked,
      blockedToday: this.stats.blockedToday,
      blockedByCategory: Array.from(this.stats.blockedByCategory.entries()),
      blockedByDomain: Array.from(this.stats.blockedByDomain.entries()),
      lastReset: this.stats.lastReset,
      bandwidthSaved: this.stats.bandwidthSaved
    };

    await chrome.storage.local.set({ blockingStats: statsData });
  }

  /**
   * Load statistics from storage
   */
  private static async loadStats(): Promise<void> {
    const result = await chrome.storage.local.get('blockingStats');
    if (result.blockingStats) {
      const data = result.blockingStats;
      this.stats = {
        totalBlocked: data.totalBlocked || 0,
        blockedToday: data.blockedToday || 0,
        blockedByCategory: new Map(data.blockedByCategory || []),
        blockedByDomain: new Map(data.blockedByDomain || []),
        lastReset: data.lastReset || new Date().toISOString(),
        bandwidthSaved: data.bandwidthSaved || 0
      };
    }
  }

  /**
   * Get configured filter lists
   */
  private static async getFilterLists(): Promise<FilterList[]> {
    const result = await chrome.storage.local.get('filterLists');
    return result.filterLists || [];
  }

  /**
   * Save filter lists configuration
   */
  private static async saveFilterLists(lists: FilterList[]): Promise<void> {
    await chrome.storage.local.set({ filterLists: lists });
  }
}

// ============================================================================
// Usage Example in Background Script (service-worker.ts or background.js)
// ============================================================================

/**
 * Example: Initialize content blocker when extension starts
 */
export async function initializeExtension(): Promise<void> {
  // Initialize the content blocker
  await ContentBlocker.initialize();

  // Listen for messages from popup or content scripts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_STATS') {
      const stats = ContentBlocker.getStats();
      sendResponse({ success: true, stats });
      return true;
    }

    if (message.type === 'ADD_CUSTOM_RULE') {
      ContentBlocker.addRule(message.rule)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }

    if (message.type === 'TOGGLE_RULE') {
      ContentBlocker.toggleRule(message.ruleId, message.enabled)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }

    if (message.type === 'RESET_STATS') {
      ContentBlocker.resetStats()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
  });

  console.log('Extension initialized successfully');
}

// Auto-initialize when the extension loads
initializeExtension();

// ============================================================================
// Manifest.json Requirements
// ============================================================================

/*
{
  "manifest_version": 3,
  "name": "Content Blocker Example",
  "version": "1.0",
  "permissions": [
    "webRequest",
    "webRequestBlocking",
    "storage",
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "host_permissions": [
    "<all_urls>"
  ]
}
*/
