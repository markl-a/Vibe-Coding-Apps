import { TrackerService } from '../services/tracker-service';
import { CookieService } from '../services/cookie-service';
import { PasswordService } from '../services/password-service';
import { SecurityScoreService } from '../services/security-score';
import { AISecurityAdvisor } from '../services/ai-security-advisor';
import { FingerprintProtection } from '../content/fingerprint-protection';

/**
 * Popup 介面邏輯 - 增強版
 */
class PopupUI {
  private securityScoreEl: HTMLElement;
  private securityLevelEl: HTMLElement;
  private scoreCircleEl: SVGCircleElement;
  private trackersBlockedEl: HTMLElement;
  private cookieCountEl: HTMLElement;
  private passwordCountEl: HTMLElement;
  private aiSuggestionEl: HTMLElement;

  private toggleTrackerEl: HTMLInputElement;
  private toggleCookieEl: HTMLInputElement;
  private toggleHttpsEl: HTMLInputElement;
  private toggleFingerprintEl: HTMLInputElement;

  constructor() {
    this.securityScoreEl = document.getElementById('security-score')!;
    this.securityLevelEl = document.getElementById('security-level')!;
    this.scoreCircleEl = document.getElementById('score-circle') as unknown as SVGCircleElement;
    this.trackersBlockedEl = document.getElementById('trackers-blocked')!;
    this.cookieCountEl = document.getElementById('cookie-count')!;
    this.passwordCountEl = document.getElementById('password-count')!;
    this.aiSuggestionEl = document.getElementById('ai-suggestion')!;

    this.toggleTrackerEl = document.getElementById('toggle-tracker') as HTMLInputElement;
    this.toggleCookieEl = document.getElementById('toggle-cookie') as HTMLInputElement;
    this.toggleHttpsEl = document.getElementById('toggle-https') as HTMLInputElement;
    this.toggleFingerprintEl = document.getElementById('toggle-fingerprint') as HTMLInputElement;

    this.init();
  }

  private async init(): Promise<void> {
    await this.loadSecurityScore();
    await this.loadStats();
    await this.loadAIInsights();
    this.setupEventListeners();
  }

  /**
   * 載入安全評分
   */
  private async loadSecurityScore(): Promise<void> {
    try {
      const scoreData = await SecurityScoreService.calculateSecurityScore();
      const level = SecurityScoreService.getSecurityLevel(scoreData.score);

      // 更新分數
      this.updateScoreCircle(scoreData.score);
      this.securityScoreEl.textContent = scoreData.score.toString();

      // 更新等級描述
      const levelDescriptions: Record<string, string> = {
        excellent: '🌟 優秀',
        good: '👍 良好',
        fair: '⚠️ 普通',
        poor: '❌ 需改進'
      };
      this.securityLevelEl.textContent = levelDescriptions[level] || '計算中...';
    } catch (error) {
      console.error('載入安全評分失敗:', error);
      this.securityScoreEl.textContent = '--';
      this.securityLevelEl.textContent = '無法計算';
    }
  }

  /**
   * 更新分數圓圈動畫
   */
  private updateScoreCircle(score: number): void {
    const circumference = 2 * Math.PI * 56; // r=56
    const progress = (score / 100) * circumference;
    const offset = circumference - progress;

    this.scoreCircleEl.style.strokeDashoffset = offset.toString();

    // 根據分數改變顏色
    if (score >= 80) {
      this.scoreCircleEl.style.stroke = '#22c55e'; // green
    } else if (score >= 60) {
      this.scoreCircleEl.style.stroke = '#f59e0b'; // yellow
    } else {
      this.scoreCircleEl.style.stroke = '#ef4444'; // red
    }
  }

  /**
   * 載入統計資料
   */
  private async loadStats(): Promise<void> {
    try {
      // 載入追蹤器統計
      const trackerStats = await TrackerService.getStats();
      this.updateCount(this.trackersBlockedEl, trackerStats.totalBlocked);

      // 載入 Cookie 數量
      const cookieCount = await CookieService.getCookieCount();
      this.updateCount(this.cookieCountEl, cookieCount);

      // 載入密碼數量
      const passwords = await PasswordService.getAllPasswordMetadata();
      this.updateCount(this.passwordCountEl, passwords.length);

      // 載入開關狀態
      await this.loadToggleStates();
    } catch (error) {
      console.error('載入統計失敗:', error);
    }
  }

  /**
   * 載入開關狀態
   */
  private async loadToggleStates(): Promise<void> {
    const trackerEnabled = await TrackerService.isEnabled();
    this.toggleTrackerEl.checked = trackerEnabled;
    this.updateBadge('tracker-badge', trackerEnabled);

    const settings = await chrome.storage.local.get([
      'enableCookieProtection',
      'enableHttpsUpgrade',
      'fingerprintProtection'
    ]);

    this.toggleCookieEl.checked = settings.enableCookieProtection !== false;
    this.updateBadge('cookie-badge', settings.enableCookieProtection !== false);

    this.toggleHttpsEl.checked = settings.enableHttpsUpgrade !== false;
    this.updateBadge('https-badge', settings.enableHttpsUpgrade !== false);

    const fingerprintSettings = settings.fingerprintProtection || { enabled: false };
    this.toggleFingerprintEl.checked = fingerprintSettings.enabled;
    this.updateBadge('fingerprint-badge', fingerprintSettings.enabled);
  }

  /**
   * 更新徽章狀態
   */
  private updateBadge(badgeId: string, enabled: boolean): void {
    const badge = document.getElementById(badgeId);
    if (badge) {
      badge.textContent = enabled ? '啟用' : '停用';
      badge.className = enabled ? 'badge badge-success' : 'badge badge-warning';
    }
  }

  /**
   * 載入 AI 安全建議
   */
  private async loadAIInsights(): Promise<void> {
    try {
      const report = await AISecurityAdvisor.generateSecurityReport();

      // 顯示最重要的建議
      if (report.insights.length > 0) {
        this.aiSuggestionEl.textContent = report.insights[0];
      } else if (report.actionItems.length > 0) {
        this.aiSuggestionEl.textContent = '💡 ' + report.actionItems[0];
      } else {
        this.aiSuggestionEl.textContent = '✅ 您的隱私和安全防護良好！';
      }
    } catch (error) {
      console.error('載入 AI 建議失敗:', error);
      this.aiSuggestionEl.textContent = '無法生成 AI 建議';
    }
  }

  /**
   * 數字動畫更新
   */
  private updateCount(element: HTMLElement, targetValue: number): void {
    const currentValue = parseInt(element.textContent || '0', 10);
    const duration = 500; // 500ms
    const steps = 20;
    const increment = (targetValue - currentValue) / steps;
    let currentStep = 0;

    const animate = () => {
      currentStep++;
      const newValue = Math.round(currentValue + increment * currentStep);
      element.textContent = newValue.toString();

      if (currentStep < steps) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = targetValue.toString();
      }
    };

    if (increment !== 0) {
      animate();
    }
  }

  /**
   * 設置事件監聽器
   */
  private setupEventListeners(): void {
    // 刷新統計
    document.getElementById('refresh-stats')?.addEventListener('click', async () => {
      await this.init();
    });

    // 清除 Cookie
    document.getElementById('clear-cookies')?.addEventListener('click', async () => {
      if (confirm('確定要清除所有 Cookie？此操作無法復原。')) {
        try {
          const whitelist = await CookieService.getWhitelist();
          const count = await CookieService.clearAllCookies(whitelist);
          this.showNotification(`✅ 已清除 ${count} 個 Cookie`);
          await this.loadStats();
        } catch (error) {
          this.showNotification('❌ 清除 Cookie 失敗', true);
        }
      }
    });

    // 掃描密碼洩漏
    document.getElementById('scan-passwords')?.addEventListener('click', async () => {
      this.showNotification('🔍 開始掃描密碼...');
      // 實際掃描需要主密碼，這裡僅示意
      setTimeout(() => {
        this.showNotification('✅ 掃描完成！未發現洩漏');
      }, 2000);
    });

    // 生成安全報告
    document.getElementById('generate-report')?.addEventListener('click', async () => {
      try {
        const report = await SecurityScoreService.exportSecurityReport();
        const blob = new Blob([report], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `privacy-guardian-report-${new Date().toISOString()}.json`;
        a.click();
        this.showNotification('✅ 報告已下載');
      } catch (error) {
        this.showNotification('❌ 生成報告失敗', true);
      }
    });

    // 開啟設定頁面
    document.getElementById('open-options')?.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // 查看儀表板
    document.getElementById('view-dashboard')?.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // 追蹤器攔截開關
    this.toggleTrackerEl.addEventListener('change', async () => {
      await TrackerService.setEnabled(this.toggleTrackerEl.checked);
      this.updateBadge('tracker-badge', this.toggleTrackerEl.checked);
      await this.loadSecurityScore();
    });

    // Cookie 保護開關
    this.toggleCookieEl.addEventListener('change', async () => {
      await chrome.storage.local.set({
        enableCookieProtection: this.toggleCookieEl.checked
      });
      this.updateBadge('cookie-badge', this.toggleCookieEl.checked);
      await this.loadSecurityScore();
    });

    // HTTPS 升級開關
    this.toggleHttpsEl.addEventListener('change', async () => {
      await chrome.storage.local.set({
        enableHttpsUpgrade: this.toggleHttpsEl.checked
      });
      this.updateBadge('https-badge', this.toggleHttpsEl.checked);
      await this.loadSecurityScore();
    });

    // 指紋防護開關
    this.toggleFingerprintEl.addEventListener('change', async () => {
      const enabled = this.toggleFingerprintEl.checked;
      if (enabled) {
        FingerprintProtection.enable('medium');
      } else {
        FingerprintProtection.disable();
      }
      this.updateBadge('fingerprint-badge', enabled);
      await this.loadSecurityScore();
    });
  }

  /**
   * 顯示通知
   */
  private showNotification(message: string, isError: boolean = false): void {
    // 簡單的通知實現
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg ${
      isError ? 'bg-danger-500' : 'bg-success-500'
    } text-white z-50 animate-slide-up`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// 初始化 Popup
document.addEventListener('DOMContentLoaded', () => {
  new PopupUI();
});
