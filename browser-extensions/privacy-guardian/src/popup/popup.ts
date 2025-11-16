import { TrackerService } from '../services/tracker-service';
import { CookieService } from '../services/cookie-service';
import { PasswordService } from '../services/password-service';
import { PrivacyService } from '../services/privacy-service';

/**
 * Popup 介面邏輯
 */

class PopupUI {
  private trackersBlockedEl: HTMLElement;
  private cookieCountEl: HTMLElement;
  private passwordCountEl: HTMLElement;
  private toggleTrackerEl: HTMLInputElement;
  private toggleCookieEl: HTMLInputElement;
  private toggleHttpsEl: HTMLInputElement;

  constructor() {
    this.trackersBlockedEl = document.getElementById('trackers-blocked')!;
    this.cookieCountEl = document.getElementById('cookie-count')!;
    this.passwordCountEl = document.getElementById('password-count')!;
    this.toggleTrackerEl = document.getElementById('toggle-tracker') as HTMLInputElement;
    this.toggleCookieEl = document.getElementById('toggle-cookie') as HTMLInputElement;
    this.toggleHttpsEl = document.getElementById('toggle-https') as HTMLInputElement;

    this.init();
  }

  private async init(): Promise<void> {
    await this.loadStats();
    this.setupEventListeners();
  }

  private async loadStats(): Promise<void> {
    try {
      // 載入追蹤器統計
      const trackerStats = await TrackerService.getStats();
      this.trackersBlockedEl.textContent = trackerStats.totalBlocked.toString();

      // 載入 Cookie 數量
      const cookieCount = await CookieService.getCookieCount();
      this.cookieCountEl.textContent = cookieCount.toString();

      // 載入密碼數量
      const passwords = await PasswordService.getAllPasswordMetadata();
      this.passwordCountEl.textContent = passwords.length.toString();

      // 載入開關狀態
      const trackerEnabled = await TrackerService.isEnabled();
      this.toggleTrackerEl.checked = trackerEnabled;

      const settings = await chrome.storage.local.get([
        'enableCookieProtection',
        'enableHttpsUpgrade'
      ]);
      this.toggleCookieEl.checked = settings.enableCookieProtection !== false;
      this.toggleHttpsEl.checked = settings.enableHttpsUpgrade !== false;
    } catch (error) {
      console.error('載入統計失敗:', error);
    }
  }

  private setupEventListeners(): void {
    // 清除 Cookie
    document.getElementById('clear-cookies')?.addEventListener('click', async () => {
      if (confirm('確定要清除所有 Cookie？此操作無法復原。')) {
        try {
          const whitelist = await CookieService.getWhitelist();
          const count = await CookieService.clearAllCookies(whitelist);
          alert(`已清除 ${count} 個 Cookie`);
          await this.loadStats();
        } catch (error) {
          alert('清除 Cookie 失敗：' + error);
        }
      }
    });

    // 清除歷史
    document.getElementById('clear-history')?.addEventListener('click', async () => {
      if (confirm('確定要清除瀏覽歷史？此操作無法復原。')) {
        try {
          await PrivacyService.clearHistory();
          alert('瀏覽歷史已清除');
        } catch (error) {
          alert('清除歷史失敗：' + error);
        }
      }
    });

    // 開啟設定頁面
    document.getElementById('open-options')?.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // 查看報告
    document.getElementById('view-report')?.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });

    // 追蹤器攔截開關
    this.toggleTrackerEl.addEventListener('change', async () => {
      await TrackerService.setEnabled(this.toggleTrackerEl.checked);
    });

    // Cookie 保護開關
    this.toggleCookieEl.addEventListener('change', async () => {
      await chrome.storage.local.set({
        enableCookieProtection: this.toggleCookieEl.checked
      });
    });

    // HTTPS 升級開關
    this.toggleHttpsEl.addEventListener('change', async () => {
      await chrome.storage.local.set({
        enableHttpsUpgrade: this.toggleHttpsEl.checked
      });
    });
  }
}

// 初始化 Popup
document.addEventListener('DOMContentLoaded', () => {
  new PopupUI();
});
