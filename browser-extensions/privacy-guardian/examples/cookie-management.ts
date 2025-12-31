/**
 * Cookie Management Example
 * Demonstrates comprehensive cookie handling, cleaning, and privacy protection
 *
 * Key Features:
 * - Automatic cookie cleaning based on rules
 * - Cookie whitelisting and blacklisting
 * - Session vs persistent cookie management
 * - Third-party cookie blocking
 * - Cookie analysis and auditing
 * - Scheduled automatic cleanup
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Cookie cleanup rule configuration
 */
interface CookieCleanupRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: 'manual' | 'onStartup' | 'onClose' | 'scheduled' | 'onIdle';
  schedule?: {
    interval: number;  // Minutes
    lastRun: string;
  };
  filters: {
    domains?: string[];           // Specific domains to clean
    excludeDomains?: string[];    // Domains to exclude from cleaning
    sessionOnly?: boolean;        // Only clean session cookies
    persistentOnly?: boolean;     // Only clean persistent cookies
    thirdPartyOnly?: boolean;     // Only clean third-party cookies
    olderThan?: number;           // Clean cookies older than X days
    namePattern?: string;         // Clean cookies matching name pattern (regex)
  };
}

/**
 * Cookie whitelist entry
 */
interface CookieWhitelistEntry {
  domain: string;
  cookieName?: string;  // If specified, only this cookie is whitelisted
  reason?: string;      // Why this cookie is whitelisted
  addedAt: string;
}

/**
 * Cookie analysis results
 */
interface CookieAnalysisReport {
  totalCookies: number;
  byType: {
    session: number;
    persistent: number;
  };
  bySecurity: {
    secure: number;
    insecure: number;
    httpOnly: number;
    notHttpOnly: number;
  };
  bySameSite: {
    strict: number;
    lax: number;
    none: number;
    unspecified: number;
  };
  byDomain: Map<string, number>;
  thirdPartyCookies: number;
  privacyScore: number;  // 0-100
  recommendations: string[];
}

/**
 * Cookie cleanup statistics
 */
interface CleanupStats {
  totalCleaned: number;
  lastCleanup: string;
  cleanupHistory: Array<{
    timestamp: string;
    cookiesCleaned: number;
    ruleId: string;
    trigger: string;
  }>;
}

// ============================================================================
// Cookie Management Service
// ============================================================================

export class CookieManager {
  private static rules: CookieCleanupRule[] = [];
  private static whitelist: CookieWhitelistEntry[] = [];
  private static stats: CleanupStats = {
    totalCleaned: 0,
    lastCleanup: '',
    cleanupHistory: []
  };

  private static cleanupInterval: number | null = null;

  /**
   * Initialize the cookie manager
   */
  static async initialize(): Promise<void> {
    console.log('Initializing cookie manager...');

    // Load configuration
    await this.loadRules();
    await this.loadWhitelist();
    await this.loadStats();

    // Set up default rules if none exist
    if (this.rules.length === 0) {
      await this.setupDefaultRules();
    }

    // Set up listeners
    this.setupListeners();

    // Start scheduled cleanup
    this.startScheduledCleanup();

    console.log('Cookie manager initialized');
  }

  /**
   * Set up default cleanup rules
   */
  private static async setupDefaultRules(): Promise<void> {
    // Rule 1: Clean session cookies on startup
    await this.addRule({
      name: 'Clean session cookies on startup',
      enabled: true,
      trigger: 'onStartup',
      filters: {
        sessionOnly: true
      }
    });

    // Rule 2: Clean third-party cookies every hour
    await this.addRule({
      name: 'Clean third-party cookies hourly',
      enabled: true,
      trigger: 'scheduled',
      schedule: {
        interval: 60, // 60 minutes
        lastRun: new Date().toISOString()
      },
      filters: {
        thirdPartyOnly: true
      }
    });

    // Rule 3: Clean old cookies weekly
    await this.addRule({
      name: 'Clean cookies older than 30 days',
      enabled: false,
      trigger: 'scheduled',
      schedule: {
        interval: 10080, // 7 days in minutes
        lastRun: new Date().toISOString()
      },
      filters: {
        olderThan: 30
      }
    });
  }

  /**
   * Set up event listeners
   */
  private static setupListeners(): void {
    // Listen for browser startup
    chrome.runtime.onStartup.addListener(() => {
      this.executeRulesByTrigger('onStartup');
    });

    // Listen for browser idle state
    chrome.idle.onStateChanged.addListener((state) => {
      if (state === 'idle') {
        this.executeRulesByTrigger('onIdle');
      }
    });

    // Listen for cookie changes (for monitoring)
    chrome.cookies.onChanged.addListener((changeInfo) => {
      this.handleCookieChange(changeInfo);
    });
  }

  /**
   * Handle cookie change events
   */
  private static handleCookieChange(
    changeInfo: chrome.cookies.CookieChangeInfo
  ): void {
    if (changeInfo.removed) {
      console.log('Cookie removed:', changeInfo.cookie.name);
    } else {
      console.log('Cookie added/modified:', changeInfo.cookie.name);

      // Check if this cookie should be auto-blocked
      if (this.shouldBlockCookie(changeInfo.cookie)) {
        this.removeCookie(changeInfo.cookie);
        console.log('Auto-blocked cookie:', changeInfo.cookie.name);
      }
    }
  }

  /**
   * Check if a cookie should be auto-blocked
   */
  private static shouldBlockCookie(cookie: chrome.cookies.Cookie): boolean {
    // Check if domain is whitelisted
    if (this.isWhitelisted(cookie)) {
      return false;
    }

    // Check if cookie is in blacklist (implement custom logic)
    // For example, block known tracking cookies
    const trackingCookieNames = ['_ga', '_gid', '_fbp', '__utma', '__utmz'];
    return trackingCookieNames.some(name => cookie.name.startsWith(name));
  }

  /**
   * Add a cleanup rule
   */
  static async addRule(
    rule: Omit<CookieCleanupRule, 'id'>
  ): Promise<CookieCleanupRule> {
    const newRule: CookieCleanupRule = {
      ...rule,
      id: `rule-${Date.now()}`
    };

    this.rules.push(newRule);
    await this.saveRules();
    return newRule;
  }

  /**
   * Remove a cleanup rule
   */
  static async removeRule(ruleId: string): Promise<void> {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    await this.saveRules();
  }

  /**
   * Execute rules by trigger type
   */
  static async executeRulesByTrigger(trigger: string): Promise<number> {
    let totalCleaned = 0;

    for (const rule of this.rules) {
      if (rule.enabled && rule.trigger === trigger) {
        const cleaned = await this.executeRule(rule);
        totalCleaned += cleaned;
      }
    }

    return totalCleaned;
  }

  /**
   * Execute a specific cleanup rule
   */
  static async executeRule(rule: CookieCleanupRule): Promise<number> {
    console.log('Executing rule:', rule.name);

    // Get all cookies
    const allCookies = await chrome.cookies.getAll({});

    // Filter cookies based on rule criteria
    const cookiesToDelete = allCookies.filter(cookie => {
      // Check whitelist first
      if (this.isWhitelisted(cookie)) {
        return false;
      }

      // Apply filters
      return this.matchesRuleFilters(cookie, rule.filters);
    });

    // Delete filtered cookies
    let deletedCount = 0;
    for (const cookie of cookiesToDelete) {
      try {
        await this.removeCookie(cookie);
        deletedCount++;
      } catch (error) {
        console.error('Error deleting cookie:', error);
      }
    }

    // Update statistics
    this.recordCleanup(deletedCount, rule.id, rule.trigger);

    // Update schedule if applicable
    if (rule.schedule) {
      rule.schedule.lastRun = new Date().toISOString();
      await this.saveRules();
    }

    console.log(`Rule "${rule.name}" cleaned ${deletedCount} cookies`);
    return deletedCount;
  }

  /**
   * Check if cookie matches rule filters
   */
  private static matchesRuleFilters(
    cookie: chrome.cookies.Cookie,
    filters: CookieCleanupRule['filters']
  ): boolean {
    // Domain filter
    if (filters.domains && filters.domains.length > 0) {
      if (!filters.domains.some(d => cookie.domain.includes(d))) {
        return false;
      }
    }

    // Exclude domains
    if (filters.excludeDomains && filters.excludeDomains.length > 0) {
      if (filters.excludeDomains.some(d => cookie.domain.includes(d))) {
        return false;
      }
    }

    // Session/Persistent filter
    if (filters.sessionOnly && !cookie.session) {
      return false;
    }
    if (filters.persistentOnly && cookie.session) {
      return false;
    }

    // Age filter
    if (filters.olderThan && cookie.expirationDate) {
      const cookieAge = Date.now() / 1000 - cookie.expirationDate;
      const maxAge = filters.olderThan * 24 * 60 * 60; // Convert days to seconds
      if (cookieAge < maxAge) {
        return false;
      }
    }

    // Name pattern filter
    if (filters.namePattern) {
      const regex = new RegExp(filters.namePattern);
      if (!regex.test(cookie.name)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if cookie is whitelisted
   */
  private static isWhitelisted(cookie: chrome.cookies.Cookie): boolean {
    return this.whitelist.some(entry => {
      const domainMatch = cookie.domain.includes(entry.domain) ||
                         entry.domain.includes(cookie.domain);

      if (!domainMatch) return false;

      // If specific cookie name is specified, check it
      if (entry.cookieName) {
        return cookie.name === entry.cookieName;
      }

      return true;
    });
  }

  /**
   * Remove a single cookie
   */
  private static async removeCookie(cookie: chrome.cookies.Cookie): Promise<void> {
    const url = this.getCookieUrl(cookie);
    await chrome.cookies.remove({
      url: url,
      name: cookie.name,
      storeId: cookie.storeId
    });
  }

  /**
   * Get URL for cookie removal
   */
  private static getCookieUrl(cookie: chrome.cookies.Cookie): string {
    const protocol = cookie.secure ? 'https:' : 'http:';
    const domain = cookie.domain.startsWith('.')
      ? cookie.domain.substring(1)
      : cookie.domain;
    return `${protocol}//${domain}${cookie.path}`;
  }

  /**
   * Add domain to whitelist
   */
  static async addToWhitelist(
    domain: string,
    cookieName?: string,
    reason?: string
  ): Promise<void> {
    const entry: CookieWhitelistEntry = {
      domain,
      cookieName,
      reason,
      addedAt: new Date().toISOString()
    };

    this.whitelist.push(entry);
    await this.saveWhitelist();
  }

  /**
   * Remove from whitelist
   */
  static async removeFromWhitelist(domain: string, cookieName?: string): Promise<void> {
    this.whitelist = this.whitelist.filter(entry => {
      if (cookieName) {
        return !(entry.domain === domain && entry.cookieName === cookieName);
      }
      return entry.domain !== domain;
    });
    await this.saveWhitelist();
  }

  /**
   * Analyze current cookies
   */
  static async analyzeCookies(): Promise<CookieAnalysisReport> {
    const allCookies = await chrome.cookies.getAll({});
    const currentTab = await this.getCurrentTab();

    const report: CookieAnalysisReport = {
      totalCookies: allCookies.length,
      byType: { session: 0, persistent: 0 },
      bySecurity: { secure: 0, insecure: 0, httpOnly: 0, notHttpOnly: 0 },
      bySameSite: { strict: 0, lax: 0, none: 0, unspecified: 0 },
      byDomain: new Map(),
      thirdPartyCookies: 0,
      privacyScore: 0,
      recommendations: []
    };

    let securityScore = 0;

    for (const cookie of allCookies) {
      // Type analysis
      if (cookie.session) {
        report.byType.session++;
      } else {
        report.byType.persistent++;
      }

      // Security analysis
      if (cookie.secure) {
        report.bySecurity.secure++;
        securityScore += 2;
      } else {
        report.bySecurity.insecure++;
      }

      if (cookie.httpOnly) {
        report.bySecurity.httpOnly++;
        securityScore += 2;
      } else {
        report.bySecurity.notHttpOnly++;
      }

      // SameSite analysis
      switch (cookie.sameSite) {
        case 'strict':
          report.bySameSite.strict++;
          securityScore += 3;
          break;
        case 'lax':
          report.bySameSite.lax++;
          securityScore += 2;
          break;
        case 'no_restriction':
          report.bySameSite.none++;
          break;
        default:
          report.bySameSite.unspecified++;
      }

      // Domain analysis
      const count = report.byDomain.get(cookie.domain) || 0;
      report.byDomain.set(cookie.domain, count + 1);

      // Third-party detection
      if (currentTab && currentTab.url) {
        const tabDomain = new URL(currentTab.url).hostname;
        if (!cookie.domain.includes(tabDomain) && !tabDomain.includes(cookie.domain)) {
          report.thirdPartyCookies++;
        }
      }
    }

    // Calculate privacy score (0-100)
    const maxScore = allCookies.length * 7; // 2+2+3 max per cookie
    report.privacyScore = maxScore > 0 ? Math.round((securityScore / maxScore) * 100) : 100;

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  /**
   * Generate privacy recommendations
   */
  private static generateRecommendations(report: CookieAnalysisReport): string[] {
    const recommendations: string[] = [];

    if (report.bySecurity.insecure > report.totalCookies * 0.3) {
      recommendations.push('Consider blocking insecure (non-HTTPS) cookies');
    }

    if (report.bySecurity.notHttpOnly > report.totalCookies * 0.5) {
      recommendations.push('Many cookies are accessible to JavaScript - potential XSS risk');
    }

    if (report.thirdPartyCookies > 10) {
      recommendations.push(`${report.thirdPartyCookies} third-party cookies detected - enable third-party blocking`);
    }

    if (report.bySameSite.none > 0 || report.bySameSite.unspecified > 0) {
      recommendations.push('Some cookies lack SameSite protection against CSRF attacks');
    }

    if (report.totalCookies > 100) {
      recommendations.push('Large number of cookies detected - consider periodic cleanup');
    }

    return recommendations;
  }

  /**
   * Get current active tab
   */
  private static async getCurrentTab(): Promise<chrome.tabs.Tab | null> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  }

  /**
   * Start scheduled cleanup
   */
  private static startScheduledCleanup(): void {
    // Check scheduled rules every minute
    this.cleanupInterval = window.setInterval(() => {
      this.checkScheduledRules();
    }, 60000); // 1 minute
  }

  /**
   * Check and execute scheduled rules
   */
  private static async checkScheduledRules(): Promise<void> {
    const now = new Date();

    for (const rule of this.rules) {
      if (rule.enabled && rule.trigger === 'scheduled' && rule.schedule) {
        const lastRun = new Date(rule.schedule.lastRun);
        const minutesSinceLastRun = (now.getTime() - lastRun.getTime()) / 60000;

        if (minutesSinceLastRun >= rule.schedule.interval) {
          await this.executeRule(rule);
        }
      }
    }
  }

  /**
   * Record cleanup in statistics
   */
  private static recordCleanup(
    count: number,
    ruleId: string,
    trigger: string
  ): void {
    this.stats.totalCleaned += count;
    this.stats.lastCleanup = new Date().toISOString();
    this.stats.cleanupHistory.push({
      timestamp: new Date().toISOString(),
      cookiesCleaned: count,
      ruleId,
      trigger
    });

    // Keep only last 50 cleanup records
    if (this.stats.cleanupHistory.length > 50) {
      this.stats.cleanupHistory = this.stats.cleanupHistory.slice(-50);
    }

    this.saveStats();
  }

  /**
   * Get cleanup statistics
   */
  static getStats(): CleanupStats {
    return { ...this.stats };
  }

  // ============================================================================
  // Storage Methods
  // ============================================================================

  private static async saveRules(): Promise<void> {
    await chrome.storage.local.set({ cookieCleanupRules: this.rules });
  }

  private static async loadRules(): Promise<void> {
    const result = await chrome.storage.local.get('cookieCleanupRules');
    this.rules = result.cookieCleanupRules || [];
  }

  private static async saveWhitelist(): Promise<void> {
    await chrome.storage.local.set({ cookieWhitelist: this.whitelist });
  }

  private static async loadWhitelist(): Promise<void> {
    const result = await chrome.storage.local.get('cookieWhitelist');
    this.whitelist = result.cookieWhitelist || [];
  }

  private static async saveStats(): Promise<void> {
    await chrome.storage.local.set({ cookieCleanupStats: this.stats });
  }

  private static async loadStats(): Promise<void> {
    const result = await chrome.storage.local.get('cookieCleanupStats');
    if (result.cookieCleanupStats) {
      this.stats = result.cookieCleanupStats;
    }
  }
}

// ============================================================================
// Usage Example
// ============================================================================

/**
 * Initialize in background script
 */
export async function initializeCookieManager(): Promise<void> {
  await CookieManager.initialize();

  // Handle messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ANALYZE_COOKIES') {
      CookieManager.analyzeCookies()
        .then(report => sendResponse({ success: true, report }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }

    if (message.type === 'CLEAN_NOW') {
      CookieManager.executeRulesByTrigger('manual')
        .then(count => sendResponse({ success: true, cleanedCount: count }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }

    if (message.type === 'ADD_WHITELIST') {
      CookieManager.addToWhitelist(message.domain, message.cookieName, message.reason)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
  });
}

// Auto-initialize
initializeCookieManager();

// ============================================================================
// Manifest Requirements
// ============================================================================

/*
{
  "manifest_version": 3,
  "permissions": [
    "cookies",
    "storage",
    "tabs",
    "idle"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
*/
