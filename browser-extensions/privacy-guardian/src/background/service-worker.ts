import { TrackerService } from '../services/tracker-service';
import { PrivacyService } from '../services/privacy-service';
import { TRACKER_BLOCKING_RULES, HTTPS_UPGRADE_RULES } from '../constants/rules';

/**
 * 背景服務 Worker
 */

// 安裝時初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Privacy Guardian 已安裝', details.reason);

  if (details.reason === 'install') {
    // 首次安裝：設定預設值
    await chrome.storage.local.set({
      enableTrackerBlocking: true,
      enableCookieProtection: true,
      enableHttpsUpgrade: true,
      trackerBlockingLevel: 'moderate',
      cookieWhitelist: [],
      autoCleanSettings: {
        enabled: false,
        interval: 'daily',
        dataTypes: ['cache']
      }
    });

    // 設定 declarativeNetRequest 規則
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1, 2, 3, 100],
        addRules: [...TRACKER_BLOCKING_RULES, ...HTTPS_UPGRADE_RULES]
      });
    } catch (error) {
      console.error('設定攔截規則失敗:', error);
    }

    // 開啟歡迎頁面
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html')
    });
  }
});

// 監聽網路請求（用於統計）
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    const enabled = await TrackerService.isEnabled();
    if (!enabled) return;

    if (TrackerService.isTracker(details.url)) {
      TrackerService.recordBlocked(details.url);
      console.log('已攔截追蹤器:', details.url);
    }
  },
  { urls: ['<all_urls>'] }
);

// 監聽來自 popup/content script 的訊息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // 保持訊息通道開啟
});

async function handleMessage(
  request: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  try {
    switch (request.action) {
      case 'getTrackerStats':
        const stats = await TrackerService.getStats();
        sendResponse({ success: true, data: stats });
        break;

      case 'resetTrackerStats':
        await TrackerService.resetStats();
        sendResponse({ success: true });
        break;

      case 'clearCookies':
        const { CookieService } = await import('../services/cookie-service');
        const count = await CookieService.clearAllCookies(request.whitelist);
        sendResponse({ success: true, count });
        break;

      case 'clearHistory':
        await PrivacyService.clearHistory(request.options);
        sendResponse({ success: true });
        break;

      case 'clearCache':
        await PrivacyService.clearCache(request.options);
        sendResponse({ success: true });
        break;

      case 'performAutoClean':
        await PrivacyService.performAutoClean();
        sendResponse({ success: true });
        break;

      case 'fillPassword':
        // 通知 content script 填寫密碼
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'fillPasswordData',
            data: request.passwordData
          });
        }
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: '未知的操作' });
    }
  } catch (error) {
    console.error('處理訊息失敗:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

// 定時執行自動清理
chrome.alarms.create('autoClean', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'autoClean') {
    const settings = await PrivacyService.getAutoCleanSettings();
    if (settings.enabled) {
      await PrivacyService.performAutoClean();
      console.log('已執行自動清理');
    }
  }
});

// 監聽擴展圖示點擊
chrome.action.onClicked.addListener((tab) => {
  // Popup 會自動開啟，這裡可以處理其他邏輯
  console.log('擴展圖示被點擊');
});

// 監聽快捷鍵
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case 'quick-clear-cookies':
      chrome.runtime.sendMessage({ action: 'clearCookies', whitelist: [] });
      break;
    case 'quick-clear-history':
      chrome.runtime.sendMessage({ action: 'clearHistory' });
      break;
  }
});

console.log('Privacy Guardian 背景服務已啟動');
