/**
 * YouTube Enhancer - 主要內容腳本
 */

import { VideoDownloader } from './video-downloader';
import { AdSkipper } from './ad-skipper';
import { PlayerEnhancements } from './player-enhancements';

class YouTubeEnhancer {
  private videoDownloader: VideoDownloader;
  private adSkipper: AdSkipper;
  private playerEnhancements: PlayerEnhancements;
  private settings: any;

  constructor() {
    this.videoDownloader = new VideoDownloader();
    this.adSkipper = new AdSkipper();
    this.playerEnhancements = new PlayerEnhancements();
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    console.log('YouTube Enhancer 已啟動');

    await this.loadSettings();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
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
      skipAds: true,
      enableDownloader: true,
      customSpeed: true,
      volumeBoost: false
    };
  }

  /**
   * 開始運行
   */
  private start(): void {
    // 等待播放器載入
    this.waitForPlayer().then(() => {
      if (this.settings.skipAds) {
        this.adSkipper.start();
      }

      if (this.settings.enableDownloader) {
        this.videoDownloader.addDownloadButton();
      }

      if (this.settings.customSpeed) {
        this.playerEnhancements.addSpeedControl();
      }

      this.setupKeyboardShortcuts();
    });
  }

  /**
   * 等待播放器載入
   */
  private waitForPlayer(): Promise<void> {
    return new Promise((resolve) => {
      const checkPlayer = () => {
        const player = document.querySelector('video');
        if (player) {
          resolve();
        } else {
          setTimeout(checkPlayer, 100);
        }
      };
      checkPlayer();
    });
  }

  /**
   * 設置鍵盤快捷鍵
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // 忽略輸入框中的按鍵
      if ((e.target as HTMLElement).tagName === 'INPUT' ||
          (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case '[':
          this.playerEnhancements.decreaseSpeed();
          e.preventDefault();
          break;
        case ']':
          this.playerEnhancements.increaseSpeed();
          e.preventDefault();
          break;
      }
    });
  }
}

// 初始化
const enhancer = new YouTubeEnhancer();
enhancer.init();
