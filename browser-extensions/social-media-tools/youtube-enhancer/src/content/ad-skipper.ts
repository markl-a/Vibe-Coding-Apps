/**
 * YouTube 廣告跳過器
 */

export class AdSkipper {
  private observer: MutationObserver | null = null;
  private checkInterval: number | null = null;

  /**
   * 開始跳過廣告
   */
  start(): void {
    console.log('廣告跳過器已啟動');

    // 方法 1: 監控跳過按鈕
    this.watchForSkipButton();

    // 方法 2: 定期檢查廣告
    this.checkInterval = window.setInterval(() => {
      this.skipCurrentAd();
    }, 500);
  }

  /**
   * 停止跳過廣告
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * 監控跳過按鈕
   */
  private watchForSkipButton(): void {
    this.observer = new MutationObserver(() => {
      const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
      if (skipButton) {
        console.log('找到跳過按鈕，點擊中...');
        (skipButton as HTMLElement).click();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 跳過當前廣告
   */
  private skipCurrentAd(): void {
    const video = document.querySelector('video');
    if (!video) return;

    // 檢查是否正在播放廣告
    const adContainer = document.querySelector('.ad-showing');
    if (adContainer) {
      // 嘗試點擊跳過按鈕
      const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
      if (skipButton) {
        (skipButton as HTMLElement).click();
        return;
      }

      // 如果沒有跳過按鈕，快進到廣告結尾
      if (video.duration && video.currentTime < video.duration - 0.5) {
        video.currentTime = video.duration - 0.1;
      }

      // 靜音廣告
      if (!video.muted) {
        video.muted = true;
      }
    } else {
      // 如果沒有廣告，確保影片未靜音（如果用戶設定要取消靜音）
      // 這裡可以根據使用者設定來決定
    }
  }
}
