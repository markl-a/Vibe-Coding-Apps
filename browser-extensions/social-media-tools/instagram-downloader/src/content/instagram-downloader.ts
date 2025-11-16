/**
 * Instagram Media Downloader - 主要內容腳本
 * 監控頁面並注入下載按鈕
 */

import { MediaExtractor } from './media-extractor';
import { DownloadButtonInjector } from './download-button';

class InstagramDownloader {
  private buttonInjector: DownloadButtonInjector;
  private mediaExtractor: MediaExtractor;

  constructor() {
    this.buttonInjector = new DownloadButtonInjector();
    this.mediaExtractor = new MediaExtractor();
  }

  /**
   * 初始化擴充功能
   */
  init(): void {
    console.log('Instagram Downloader 已啟動');

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
   * 開始運行
   */
  private start(): void {
    // 開始注入下載按鈕
    this.buttonInjector.start();

    // 監聽來自彈出視窗的訊息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true; // 保持訊息通道開啟
    });
  }

  /**
   * 處理訊息
   */
  private handleMessage(message: any, sendResponse: (response: any) => void): void {
    switch (message.type) {
      case 'GET_CURRENT_MEDIA':
        this.getCurrentPageMedia(sendResponse);
        break;
      case 'DOWNLOAD_CURRENT_POST':
        this.downloadCurrentPost(sendResponse);
        break;
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  /**
   * 獲取當前頁面的媒體資訊
   */
  private getCurrentPageMedia(sendResponse: (response: any) => void): void {
    try {
      const posts = document.querySelectorAll('article[role="presentation"]');
      const allMedia: any[] = [];

      posts.forEach(post => {
        const media = this.mediaExtractor.extractMediaFromPost(post as HTMLElement);
        allMedia.push(...media);
      });

      sendResponse({ success: true, media: allMedia });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * 下載當前焦點貼文
   */
  private downloadCurrentPost(sendResponse: (response: any) => void): void {
    try {
      // 嘗試找到當前檢視的貼文
      const activePost = document.querySelector('article[role="presentation"][tabindex="-1"]');

      if (!activePost) {
        sendResponse({ success: false, error: '找不到活動貼文' });
        return;
      }

      const media = this.mediaExtractor.extractMediaFromPost(activePost as HTMLElement);

      // 發送到背景腳本進行下載
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_MEDIA',
        media: media
      });

      sendResponse({ success: true, count: media.length });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
}

// 初始化下載器
const downloader = new InstagramDownloader();
downloader.init();
