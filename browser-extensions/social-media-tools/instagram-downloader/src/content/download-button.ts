/**
 * 下載按鈕注入器
 * 在 Instagram 貼文上自動顯示下載按鈕
 */

import { MediaExtractor, MediaInfo } from './media-extractor';

export class DownloadButtonInjector {
  private observer: MutationObserver;
  private mediaExtractor: MediaExtractor;
  private processedPosts: Set<Element>;

  constructor() {
    this.mediaExtractor = new MediaExtractor();
    this.processedPosts = new Set();
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  /**
   * 開始監控頁面變化並注入下載按鈕
   */
  start(): void {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 初始注入
    this.injectButtons();
  }

  /**
   * 處理 DOM 變化
   */
  private handleMutations(mutations: MutationRecord[]): void {
    let shouldInject = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // 檢查是否有新的貼文元素
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            if (node.matches('article') || node.querySelector('article')) {
              shouldInject = true;
            }
          }
        });
      }
    }

    if (shouldInject) {
      // 延遲執行以確保 DOM 完全載入
      setTimeout(() => this.injectButtons(), 100);
    }
  }

  /**
   * 在貼文上注入下載按鈕
   */
  private injectButtons(): void {
    // 找到所有貼文
    const posts = document.querySelectorAll('article[role="presentation"]');

    posts.forEach(post => {
      // 檢查是否已處理過
      if (this.processedPosts.has(post)) {
        return;
      }

      this.processedPosts.add(post);

      // 找到動作列（包含按讚、留言等按鈕的位置）
      const actionBar = post.querySelector('section > div[role="button"]')?.parentElement;

      if (actionBar && !actionBar.querySelector('.insta-download-btn')) {
        const downloadBtn = this.createDownloadButton();
        actionBar.insertBefore(downloadBtn, actionBar.firstChild);
      }
    });

    // 為 Stories 和 Reels 注入按鈕
    this.injectStoryButtons();
    this.injectReelButtons();
  }

  /**
   * 為 Stories 注入下載按鈕
   */
  private injectStoryButtons(): void {
    const storyContainer = document.querySelector('[role="dialog"] section');
    if (storyContainer && !storyContainer.querySelector('.insta-download-btn-story')) {
      const downloadBtn = this.createStoryDownloadButton();
      const header = storyContainer.querySelector('header');
      if (header) {
        header.appendChild(downloadBtn);
      }
    }
  }

  /**
   * 為 Reels 注入下載按鈕
   */
  private injectReelButtons(): void {
    const reels = document.querySelectorAll('div[class*="Reel"]');
    reels.forEach(reel => {
      if (!reel.querySelector('.insta-download-btn-reel')) {
        const actionBar = reel.querySelector('section');
        if (actionBar) {
          const downloadBtn = this.createReelDownloadButton();
          actionBar.insertBefore(downloadBtn, actionBar.firstChild);
        }
      }
    });
  }

  /**
   * 創建下載按鈕元素
   */
  private createDownloadButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'insta-download-btn';
    button.setAttribute('aria-label', '下載媒體');
    button.innerHTML = `
      <svg aria-label="下載" height="24" viewBox="0 0 24 24" width="24">
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
   * 創建 Story 下載按鈕
   */
  private createStoryDownloadButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'insta-download-btn-story';
    button.setAttribute('aria-label', '下載 Story');
    button.innerHTML = '⬇';
    button.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      font-size: 20px;
      z-index: 9999;
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleStoryDownload(button);
    });

    return button;
  }

  /**
   * 創建 Reel 下載按鈕
   */
  private createReelDownloadButton(): HTMLButtonElement {
    const button = this.createDownloadButton();
    button.className = 'insta-download-btn-reel';
    return button;
  }

  /**
   * 處理下載操作
   */
  private async handleDownload(button: HTMLButtonElement): Promise<void> {
    const post = button.closest('article');
    if (!post) return;

    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '⏳';

    try {
      const mediaList = this.mediaExtractor.extractMediaFromPost(post as HTMLElement);

      if (mediaList.length === 0) {
        throw new Error('找不到媒體檔案');
      }

      // 發送到背景腳本進行下載
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_MEDIA',
        media: mediaList
      });

      button.innerHTML = '✓';
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('下載失敗:', error);
      button.innerHTML = '✗';
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.disabled = false;
      }, 2000);
    }
  }

  /**
   * 處理 Story 下載
   */
  private async handleStoryDownload(button: HTMLButtonElement): Promise<void> {
    button.disabled = true;
    button.textContent = '⏳';

    try {
      const media = this.mediaExtractor.extractMediaFromStory();

      if (!media) {
        throw new Error('找不到 Story 媒體');
      }

      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_MEDIA',
        media: [media]
      });

      button.textContent = '✓';
      setTimeout(() => {
        button.textContent = '⬇';
        button.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('Story 下載失敗:', error);
      button.textContent = '✗';
      setTimeout(() => {
        button.textContent = '⬇';
        button.disabled = false;
      }, 2000);
    }
  }
}
