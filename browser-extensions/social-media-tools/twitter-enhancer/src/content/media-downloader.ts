/**
 * Twitter 媒體下載器
 */

export interface MediaInfo {
  type: 'image' | 'video' | 'gif';
  url: string;
  filename: string;
  thumbnail?: string;
}

export class MediaDownloader {
  private observer: MutationObserver;
  private processedTweets: Set<Element>;

  constructor() {
    this.processedTweets = new Set();
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  /**
   * 開始運行下載器
   */
  start(): void {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.injectDownloadButtons();
  }

  /**
   * 停止運行
   */
  stop(): void {
    this.observer.disconnect();
  }

  /**
   * 處理 DOM 變化
   */
  private handleMutations(mutations: MutationRecord[]): void {
    let shouldInject = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            if (node.matches('[data-testid="tweet"]') ||
                node.querySelector('[data-testid="tweet"]')) {
              shouldInject = true;
            }
          }
        });
      }
    }

    if (shouldInject) {
      setTimeout(() => this.injectDownloadButtons(), 100);
    }
  }

  /**
   * 注入下載按鈕
   */
  private injectDownloadButtons(): void {
    const tweets = document.querySelectorAll('[data-testid="tweet"]');

    tweets.forEach(tweet => {
      if (this.processedTweets.has(tweet)) {
        return;
      }

      // 檢查是否有媒體
      const hasMedia = tweet.querySelector('[data-testid="tweetPhoto"], [data-testid="videoPlayer"]');
      if (!hasMedia) {
        return;
      }

      this.processedTweets.add(tweet);

      // 找到動作列
      const actionBar = tweet.querySelector('[role="group"]');
      if (actionBar && !actionBar.querySelector('.twitter-download-btn')) {
        const downloadBtn = this.createDownloadButton();
        actionBar.appendChild(downloadBtn);
      }
    });
  }

  /**
   * 創建下載按鈕
   */
  private createDownloadButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'twitter-download-btn';
    button.setAttribute('aria-label', '下載媒體');
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M12 16L7 11L8.4 9.6L11 12.2V4H13V12.2L15.6 9.6L17 11L12 16Z" fill="currentColor"/>
        <path d="M20 18H4V20H20V18Z" fill="currentColor"/>
      </svg>
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleDownload(button);
    });

    return button;
  }

  /**
   * 處理下載
   */
  private async handleDownload(button: HTMLButtonElement): Promise<void> {
    const tweet = button.closest('[data-testid="tweet"]');
    if (!tweet) return;

    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span>⏳</span>';

    try {
      const mediaList = this.extractMediaFromTweet(tweet as HTMLElement);

      if (mediaList.length === 0) {
        throw new Error('找不到媒體檔案');
      }

      // 發送到背景腳本進行下載
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_MEDIA',
        media: mediaList
      });

      button.innerHTML = '<span>✓</span>';
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('下載失敗:', error);
      button.innerHTML = '<span>✗</span>';
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.disabled = false;
      }, 2000);
    }
  }

  /**
   * 從推文中提取媒體
   */
  extractMediaFromTweet(tweetElement: HTMLElement): MediaInfo[] {
    const mediaList: MediaInfo[] = [];

    // 提取圖片
    const images = tweetElement.querySelectorAll('[data-testid="tweetPhoto"] img');
    images.forEach(img => {
      const src = (img as HTMLImageElement).src;
      if (this.isMediaImage(src)) {
        mediaList.push({
          type: 'image',
          url: this.getOriginalImageUrl(src),
          filename: this.generateFilename('image', 'jpg')
        });
      }
    });

    // 提取影片
    const videos = tweetElement.querySelectorAll('video');
    videos.forEach(video => {
      const src = (video as HTMLVideoElement).src;
      if (src) {
        mediaList.push({
          type: 'video',
          url: src,
          filename: this.generateFilename('video', 'mp4'),
          thumbnail: video.poster
        });
      }
    });

    // 提取 GIF（在 Twitter 上以影片形式呈現）
    const gifVideos = tweetElement.querySelectorAll('video[playsinline][loop]');
    gifVideos.forEach(video => {
      const src = (video as HTMLVideoElement).src;
      if (src) {
        mediaList.push({
          type: 'gif',
          url: src,
          filename: this.generateFilename('gif', 'mp4')
        });
      }
    });

    return mediaList;
  }

  /**
   * 檢查是否為媒體圖片
   */
  private isMediaImage(url: string): boolean {
    return url.includes('pbs.twimg.com/media/') ||
           url.includes('pbs.twimg.com/ext_tw_video_thumb/');
  }

  /**
   * 獲取原始圖片 URL（最高畫質）
   */
  private getOriginalImageUrl(url: string): string {
    // Twitter 圖片 URL 格式: https://pbs.twimg.com/media/xxx.jpg?format=jpg&name=large
    // 改為: https://pbs.twimg.com/media/xxx.jpg?format=jpg&name=orig
    return url.replace(/[?&]name=\w+/, '').replace(/\?/, '?name=orig&');
  }

  /**
   * 生成檔案名稱
   */
  private generateFilename(type: string, extension: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `twitter_${type}_${timestamp}_${random}.${extension}`;
  }
}
