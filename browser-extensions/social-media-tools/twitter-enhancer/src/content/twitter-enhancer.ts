/**
 * Twitter/X Enhancer - 主要內容腳本
 */

import { MediaDownloader } from './media-downloader';
import { AdBlocker } from './ad-blocker';
import { ThemeManager } from './theme-manager';

class TwitterEnhancer {
  private mediaDownloader: MediaDownloader;
  private adBlocker: AdBlocker;
  private themeManager: ThemeManager;
  private settings: any;

  constructor() {
    this.mediaDownloader = new MediaDownloader();
    this.adBlocker = new AdBlocker();
    this.themeManager = new ThemeManager();
  }

  /**
   * 初始化擴充功能
   */
  async init(): Promise<void> {
    console.log('Twitter/X Enhancer 已啟動');

    // 載入設定
    await this.loadSettings();

    // 等待頁面載入完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.start();
      });
    } else {
      this.start();
    }
  }

  /**
   * 載入設定
   */
  private async loadSettings(): Promise<void> {
    const result = await chrome.storage.local.get('settings');
    this.settings = result.settings || {
      blockAds: true,
      enableDownloader: true,
      theme: 'default',
      autoHideRead: false
    };
  }

  /**
   * 開始運行所有功能
   */
  private start(): void {
    // 啟用廣告隱藏
    if (this.settings.blockAds) {
      this.adBlocker.start();
    }

    // 啟用媒體下載器
    if (this.settings.enableDownloader) {
      this.mediaDownloader.start();
    }

    // 應用主題
    if (this.settings.theme && this.settings.theme !== 'default') {
      this.themeManager.loadAndApplyTheme(this.settings.theme);
    }

    // 監聽設定變更
    this.listenForSettingsChanges();

    // 監聽來自 popup 的訊息
    this.setupMessageListener();
  }

  /**
   * 監聽設定變更
   */
  private listenForSettingsChanges(): void {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.settings) {
        this.settings = changes.settings.newValue;
        this.applySettings();
      }
    });
  }

  /**
   * 應用設定
   */
  private applySettings(): void {
    if (this.settings.blockAds) {
      this.adBlocker.start();
    } else {
      this.adBlocker.stop();
    }

    if (this.settings.theme && this.settings.theme !== 'default') {
      this.themeManager.loadAndApplyTheme(this.settings.theme);
    }
  }

  /**
   * 設置訊息監聽器
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'DOWNLOAD_TWEET_MEDIA':
          this.handleDownloadTweetMedia(message.tweetUrl, sendResponse);
          break;
        case 'GET_PAGE_INFO':
          this.handleGetPageInfo(sendResponse);
          break;
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
      return true;
    });
  }

  /**
   * 處理下載推文媒體
   */
  private handleDownloadTweetMedia(tweetUrl: string, sendResponse: (response: any) => void): void {
    try {
      // 實作下載邏輯
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * 處理獲取頁面資訊
   */
  private handleGetPageInfo(sendResponse: (response: any) => void): void {
    try {
      const tweets = document.querySelectorAll('[data-testid="tweet"]').length;
      const ads = document.querySelectorAll('[data-testid="placementTracking"]').length;

      sendResponse({
        success: true,
        info: {
          tweets,
          ads,
          hiddenAds: this.settings.blockAds ? ads : 0
        }
      });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
}

// 初始化增強器
const enhancer = new TwitterEnhancer();
enhancer.init();
