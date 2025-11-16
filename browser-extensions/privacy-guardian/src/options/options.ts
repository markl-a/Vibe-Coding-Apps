import { TrackerService } from '../services/tracker-service';
import { CookieService } from '../services/cookie-service';
import { PasswordService } from '../services/password-service';
import { PrivacyService } from '../services/privacy-service';
import { PasswordGenerator } from '../utils/password-generator';

/**
 * Options 頁面邏輯
 */

class OptionsUI {
  private currentTab = 'overview';

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.setupTabs();
    this.setupEventListeners();
    await this.loadAllData();
  }

  private setupTabs(): void {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = (tab as HTMLElement).dataset.tab!;

        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tabId)?.classList.add('active');

        this.currentTab = tabId;
        this.loadTabData(tabId);
      });
    });
  }

  private setupEventListeners(): void {
    // 密碼生成器
    const lengthSlider = document.getElementById('password-length') as HTMLInputElement;
    const lengthValue = document.getElementById('length-value');

    lengthSlider?.addEventListener('input', () => {
      if (lengthValue) {
        lengthValue.textContent = lengthSlider.value;
      }
    });

    document.getElementById('generate-password')?.addEventListener('click', () => {
      this.generatePassword();
    });

    document.getElementById('copy-password')?.addEventListener('click', () => {
      const input = document.getElementById('generated-password') as HTMLInputElement;
      if (input && input.value) {
        navigator.clipboard.writeText(input.value);
        alert('密碼已複製到剪貼簿');
      }
    });

    // 快速操作
    document.getElementById('quick-clear-cookies')?.addEventListener('click', () => {
      this.clearCookies();
    });

    document.getElementById('quick-clear-history')?.addEventListener('click', () => {
      this.clearHistory();
    });

    document.getElementById('quick-clear-cache')?.addEventListener('click', () => {
      this.clearCache();
    });

    document.getElementById('reset-stats')?.addEventListener('click', () => {
      this.resetStats();
    });

    // Cookie 白名單
    document.getElementById('add-whitelist')?.addEventListener('click', () => {
      this.addToWhitelist();
    });

    // 設定切換
    this.setupToggleSwitches();
  }

  private setupToggleSwitches(): void {
    const toggles = [
      { id: 'enable-tracker-blocking', key: 'enableTrackerBlocking' },
      { id: 'enable-cookie-protection', key: 'enableCookieProtection' },
      { id: 'enable-https-upgrade', key: 'enableHttpsUpgrade' },
      { id: 'enable-password-manager', key: 'enablePasswordManager' },
      { id: 'enable-auto-clean', key: 'autoCleanEnabled' }
    ];

    toggles.forEach(({ id, key }) => {
      const element = document.getElementById(id) as HTMLInputElement;
      if (element) {
        element.addEventListener('change', async () => {
          await chrome.storage.local.set({ [key]: element.checked });
        });
      }
    });

    const blockingLevel = document.getElementById('blocking-level') as HTMLSelectElement;
    blockingLevel?.addEventListener('change', async () => {
      await TrackerService.setBlockingLevel(blockingLevel.value as any);
    });

    const cleanInterval = document.getElementById('clean-interval') as HTMLSelectElement;
    cleanInterval?.addEventListener('change', async () => {
      const settings = await PrivacyService.getAutoCleanSettings();
      settings.interval = cleanInterval.value as any;
      await PrivacyService.setAutoCleanSettings(settings);
    });
  }

  private async loadAllData(): Promise<void> {
    await this.loadOverviewData();
    await this.loadSettings();
  }

  private async loadTabData(tabId: string): Promise<void> {
    switch (tabId) {
      case 'overview':
        await this.loadOverviewData();
        break;
      case 'passwords':
        await this.loadPasswords();
        break;
      case 'cookies':
        await this.loadCookieStats();
        await this.loadWhitelist();
        break;
      case 'privacy':
        // Already loaded in settings
        break;
      case 'settings':
        await this.loadSettings();
        break;
    }
  }

  private async loadOverviewData(): Promise<void> {
    try {
      const stats = await TrackerService.getStats();
      const totalTrackers = document.getElementById('total-trackers');
      if (totalTrackers) {
        totalTrackers.textContent = stats.totalBlocked.toString();
      }

      const cookieCount = await CookieService.getCookieCount();
      const totalCookies = document.getElementById('total-cookies');
      if (totalCookies) {
        totalCookies.textContent = cookieCount.toString();
      }

      const passwords = await PasswordService.getAllPasswordMetadata();
      const totalPasswords = document.getElementById('total-passwords');
      if (totalPasswords) {
        totalPasswords.textContent = passwords.length.toString();
      }
    } catch (error) {
      console.error('載入總覽資料失敗:', error);
    }
  }

  private async loadPasswords(): Promise<void> {
    try {
      const passwords = await PasswordService.getAllPasswordMetadata();
      const list = document.getElementById('password-list');

      if (!list) return;

      if (passwords.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #999;">尚未儲存任何密碼</li>';
        return;
      }

      list.innerHTML = passwords.map(pwd => `
        <li class="password-item">
          <div class="password-info">
            <div class="password-domain">${pwd.domain}</div>
            <div class="password-username">${pwd.username}</div>
          </div>
          <button class="btn btn-danger btn-sm" data-id="${pwd.id}">刪除</button>
        </li>
      `).join('');

      // 綁定刪除按鈕
      list.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = (e.target as HTMLElement).dataset.id!;
          if (confirm('確定要刪除此密碼？')) {
            await PasswordService.deletePassword(id);
            await this.loadPasswords();
          }
        });
      });
    } catch (error) {
      console.error('載入密碼失敗:', error);
    }
  }

  private async loadCookieStats(): Promise<void> {
    try {
      const analysis = await CookieService.analyzeCookies();
      const statsDiv = document.getElementById('cookie-stats');

      if (!statsDiv) return;

      statsDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div><strong>總數:</strong> ${analysis.total}</div>
          <div><strong>會話 Cookie:</strong> ${analysis.session}</div>
          <div><strong>持久 Cookie:</strong> ${analysis.persistent}</div>
          <div><strong>安全 Cookie:</strong> ${analysis.secure}</div>
          <div><strong>HttpOnly:</strong> ${analysis.httpOnly}</div>
          <div><strong>SameSite=Strict:</strong> ${analysis.sameSite.strict}</div>
        </div>
      `;
    } catch (error) {
      console.error('載入 Cookie 統計失敗:', error);
    }
  }

  private async loadWhitelist(): Promise<void> {
    try {
      const whitelist = await CookieService.getWhitelist();
      const list = document.getElementById('whitelist');

      if (!list) return;

      if (whitelist.length === 0) {
        list.innerHTML = '<li style="color: #999;">白名單為空</li>';
        return;
      }

      list.innerHTML = whitelist.map(domain => `
        <li style="padding: 8px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between;">
          <span>${domain}</span>
          <button class="btn btn-danger btn-sm" data-domain="${domain}">移除</button>
        </li>
      `).join('');

      list.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const domain = (e.target as HTMLElement).dataset.domain!;
          await CookieService.removeFromWhitelist(domain);
          await this.loadWhitelist();
        });
      });
    } catch (error) {
      console.error('載入白名單失敗:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const settings = await chrome.storage.local.get([
        'enableTrackerBlocking',
        'enableCookieProtection',
        'enableHttpsUpgrade',
        'enablePasswordManager',
        'trackerBlockingLevel'
      ]);

      const trackerToggle = document.getElementById('enable-tracker-blocking') as HTMLInputElement;
      if (trackerToggle) trackerToggle.checked = settings.enableTrackerBlocking !== false;

      const cookieToggle = document.getElementById('enable-cookie-protection') as HTMLInputElement;
      if (cookieToggle) cookieToggle.checked = settings.enableCookieProtection !== false;

      const httpsToggle = document.getElementById('enable-https-upgrade') as HTMLInputElement;
      if (httpsToggle) httpsToggle.checked = settings.enableHttpsUpgrade !== false;

      const passwordToggle = document.getElementById('enable-password-manager') as HTMLInputElement;
      if (passwordToggle) passwordToggle.checked = settings.enablePasswordManager !== false;

      const blockingLevel = document.getElementById('blocking-level') as HTMLSelectElement;
      if (blockingLevel) blockingLevel.value = settings.trackerBlockingLevel || 'moderate';

      const autoCleanSettings = await PrivacyService.getAutoCleanSettings();
      const autoCleanToggle = document.getElementById('enable-auto-clean') as HTMLInputElement;
      if (autoCleanToggle) autoCleanToggle.checked = autoCleanSettings.enabled;

      const cleanInterval = document.getElementById('clean-interval') as HTMLSelectElement;
      if (cleanInterval) cleanInterval.value = autoCleanSettings.interval;
    } catch (error) {
      console.error('載入設定失敗:', error);
    }
  }

  private generatePassword(): void {
    const length = parseInt((document.getElementById('password-length') as HTMLInputElement).value);
    const uppercase = (document.getElementById('include-uppercase') as HTMLInputElement).checked;
    const lowercase = (document.getElementById('include-lowercase') as HTMLInputElement).checked;
    const numbers = (document.getElementById('include-numbers') as HTMLInputElement).checked;
    const symbols = (document.getElementById('include-symbols') as HTMLInputElement).checked;

    const password = PasswordGenerator.generate({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols
    });

    const input = document.getElementById('generated-password') as HTMLInputElement;
    if (input) {
      input.value = password;
    }
  }

  private async clearCookies(): Promise<void> {
    if (confirm('確定要清除所有 Cookie？此操作無法復原。')) {
      try {
        const whitelist = await CookieService.getWhitelist();
        const count = await CookieService.clearAllCookies(whitelist);
        alert(`已清除 ${count} 個 Cookie`);
        await this.loadCookieStats();
      } catch (error) {
        alert('清除失敗：' + error);
      }
    }
  }

  private async clearHistory(): Promise<void> {
    if (confirm('確定要清除瀏覽歷史？此操作無法復原。')) {
      try {
        await PrivacyService.clearHistory();
        alert('瀏覽歷史已清除');
      } catch (error) {
        alert('清除失敗：' + error);
      }
    }
  }

  private async clearCache(): Promise<void> {
    if (confirm('確定要清除快取？')) {
      try {
        await PrivacyService.clearCache();
        alert('快取已清除');
      } catch (error) {
        alert('清除失敗：' + error);
      }
    }
  }

  private async resetStats(): Promise<void> {
    if (confirm('確定要重置所有統計資料？')) {
      try {
        await TrackerService.resetStats();
        alert('統計資料已重置');
        await this.loadOverviewData();
      } catch (error) {
        alert('重置失敗：' + error);
      }
    }
  }

  private async addToWhitelist(): Promise<void> {
    const input = document.getElementById('whitelist-domain') as HTMLInputElement;
    const domain = input.value.trim();

    if (!domain) {
      alert('請輸入域名');
      return;
    }

    try {
      await CookieService.addToWhitelist(domain);
      input.value = '';
      await this.loadWhitelist();
    } catch (error) {
      alert('新增失敗：' + error);
    }
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new OptionsUI();
});
