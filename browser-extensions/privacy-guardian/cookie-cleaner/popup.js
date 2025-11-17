// Cookie Cleaner Popup Script
class CookieCleanerPopup {
  constructor() {
    this.currentDomain = '';
    this.allCookies = [];
    this.currentCookies = [];
    this.whitelist = [];
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.getCurrentTab();
    await this.loadCookies();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadSettings() {
    const data = await chrome.storage.sync.get(['cookieCleanerSettings']);
    const settings = data.cookieCleanerSettings || {
      autoClean: false,
      cleanInterval: 60,
      whitelist: [],
      cleanOnStartup: false
    };

    this.whitelist = settings.whitelist || [];

    // Update toggle switches
    if (settings.cleanOnStartup) {
      document.getElementById('cleanOnStartup').classList.add('active');
    }
    if (settings.autoClean) {
      document.getElementById('autoClean').classList.add('active');
    }
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      try {
        const url = new URL(tab.url);
        this.currentDomain = url.hostname;
      } catch (e) {
        this.currentDomain = '';
      }
    }
  }

  async loadCookies() {
    const response = await chrome.runtime.sendMessage({ action: 'getAllCookies' });

    if (response.success) {
      this.allCookies = response.cookies;
      this.currentCookies = this.allCookies.filter(cookie =>
        cookie.domain.includes(this.currentDomain) || this.currentDomain.includes(cookie.domain.replace(/^\./, ''))
      );

      this.updateStats();
      this.displayCookies();
    }
  }

  updateStats() {
    document.getElementById('totalCookies').textContent = this.allCookies.length;
    document.getElementById('currentSiteCookies').textContent = this.currentCookies.length;
  }

  displayCookies() {
    const container = document.getElementById('cookieList');

    if (this.currentCookies.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: #9ca3af;">此網站沒有 Cookies</div>';
      return;
    }

    container.innerHTML = this.currentCookies.map(cookie => `
      <div class="cookie-item" data-cookie-name="${cookie.name}">
        <div class="cookie-name">${this.escapeHtml(cookie.name)}</div>
        <div class="cookie-domain">${this.escapeHtml(cookie.domain)}</div>
        <button class="delete-btn" data-cookie='${JSON.stringify(cookie).replace(/'/g, '&apos;')}'>
          刪除
        </button>
      </div>
    `).join('');

    // Add delete button listeners
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cookie = JSON.parse(e.target.dataset.cookie);
        this.deleteCookie(cookie);
      });
    });
  }

  async deleteCookie(cookie) {
    const response = await chrome.runtime.sendMessage({
      action: 'deleteCookie',
      cookie: cookie
    });

    if (response.success) {
      await this.loadCookies();
      this.showSuccess('Cookie 已刪除');
    }
  }

  async cleanCurrentSite() {
    if (!this.currentDomain) {
      this.showSuccess('無法識別當前網站');
      return;
    }

    const response = await chrome.runtime.sendMessage({
      action: 'deleteDomainCookies',
      domain: this.currentDomain
    });

    if (response.success) {
      await this.loadCookies();
      this.showSuccess(`已清除 ${response.count} 個 Cookies`);
    }
  }

  async cleanAllCookies() {
    if (!confirm('確定要清除所有 Cookies 嗎？（白名單網域除外）')) {
      return;
    }

    const response = await chrome.runtime.sendMessage({
      action: 'deleteAllCookies'
    });

    if (response.success) {
      await this.loadCookies();
      this.showSuccess(`已清除 ${response.count} 個 Cookies`);
    }
  }

  setupEventListeners() {
    // Clean current site
    document.getElementById('cleanCurrentBtn').addEventListener('click', () => {
      this.cleanCurrentSite();
    });

    // Clean all
    document.getElementById('cleanAllBtn').addEventListener('click', () => {
      this.cleanAllCookies();
    });

    // Whitelist
    document.getElementById('addWhitelistBtn').addEventListener('click', () => {
      this.addToWhitelist();
    });

    document.getElementById('whitelistInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addToWhitelist();
      }
    });

    // Toggle switches
    document.getElementById('cleanOnStartup').addEventListener('click', () => {
      this.toggleSetting('cleanOnStartup');
    });

    document.getElementById('autoClean').addEventListener('click', () => {
      this.toggleSetting('autoClean');
    });

    // Display whitelist
    this.displayWhitelist();
  }

  async addToWhitelist() {
    const input = document.getElementById('whitelistInput');
    const domain = input.value.trim();

    if (!domain) return;

    if (!this.whitelist.includes(domain)) {
      this.whitelist.push(domain);
      await this.saveSettings();
      this.displayWhitelist();
      input.value = '';
      this.showSuccess('已新增到白名單');
    }
  }

  async removeFromWhitelist(domain) {
    this.whitelist = this.whitelist.filter(d => d !== domain);
    await this.saveSettings();
    this.displayWhitelist();
    this.showSuccess('已從白名單移除');
  }

  displayWhitelist() {
    const container = document.getElementById('whitelistTags');

    if (this.whitelist.length === 0) {
      container.innerHTML = '<div style="margin-top: 8px; color: #9ca3af; font-size: 11px;">尚無白名單網域</div>';
      return;
    }

    container.innerHTML = this.whitelist.map(domain => `
      <div class="tag">
        ${this.escapeHtml(domain)}
        <span class="tag-remove" data-domain="${domain}">×</span>
      </div>
    `).join('');

    // Add remove listeners
    container.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.removeFromWhitelist(e.target.dataset.domain);
      });
    });
  }

  async toggleSetting(setting) {
    const toggle = document.getElementById(setting);
    toggle.classList.toggle('active');

    const data = await chrome.storage.sync.get(['cookieCleanerSettings']);
    const settings = data.cookieCleanerSettings || {};

    settings[setting] = toggle.classList.contains('active');

    await chrome.storage.sync.set({ cookieCleanerSettings: settings });
  }

  async saveSettings() {
    const data = await chrome.storage.sync.get(['cookieCleanerSettings']);
    const settings = data.cookieCleanerSettings || {};

    settings.whitelist = this.whitelist;

    await chrome.storage.sync.set({ cookieCleanerSettings: settings });
  }

  updateUI() {
    this.displayWhitelist();
  }

  showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.add('show');

    setTimeout(() => {
      successDiv.classList.remove('show');
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize
const cookieCleaner = new CookieCleanerPopup();
