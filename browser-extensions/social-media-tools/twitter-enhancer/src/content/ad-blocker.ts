/**
 * Twitter 廣告隱藏器
 */

export class AdBlocker {
  private observer: MutationObserver;
  private isRunning: boolean = false;

  constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  /**
   * 開始隱藏廣告
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.hideAds();
  }

  /**
   * 停止隱藏廣告
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.observer.disconnect();
    this.showAds();
  }

  /**
   * 處理 DOM 變化
   */
  private handleMutations(mutations: MutationRecord[]): void {
    let shouldHide = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldHide = true;
        break;
      }
    }

    if (shouldHide) {
      setTimeout(() => this.hideAds(), 100);
    }
  }

  /**
   * 隱藏廣告
   */
  private hideAds(): void {
    // 方法 1: 隱藏推廣推文（包含「Ad」或「Promoted」標籤）
    const promotedTweets = document.querySelectorAll('[data-testid="placementTracking"]');
    promotedTweets.forEach(element => {
      const article = element.closest('article');
      if (article) {
        (article as HTMLElement).style.display = 'none';
        article.setAttribute('data-twitter-enhancer-hidden', 'true');
      }
    });

    // 方法 2: 隱藏「Who to follow」推薦區塊
    const followSuggestions = document.querySelectorAll('[aria-label*="Who to follow"]');
    followSuggestions.forEach(element => {
      const aside = element.closest('aside');
      if (aside) {
        (aside as HTMLElement).style.display = 'none';
        aside.setAttribute('data-twitter-enhancer-hidden', 'true');
      }
    });

    // 方法 3: 隱藏「Trends for you」中的推廣趨勢
    const trendItems = document.querySelectorAll('[data-testid="trend"]');
    trendItems.forEach(item => {
      const promoted = item.querySelector('span:not([dir])');
      if (promoted && (promoted.textContent === 'Promoted' || promoted.textContent === '推廣')) {
        (item as HTMLElement).style.display = 'none';
        item.setAttribute('data-twitter-enhancer-hidden', 'true');
      }
    });

    // 方法 4: 隱藏側邊欄廣告
    const sidebarAds = document.querySelectorAll('[data-testid="sidebarColumn"] [data-testid*="ad"]');
    sidebarAds.forEach(ad => {
      (ad as HTMLElement).style.display = 'none';
      ad.setAttribute('data-twitter-enhancer-hidden', 'true');
    });

    // 記錄隱藏的廣告數量
    this.updateAdCount();
  }

  /**
   * 顯示廣告（恢復）
   */
  private showAds(): void {
    const hiddenElements = document.querySelectorAll('[data-twitter-enhancer-hidden="true"]');
    hiddenElements.forEach(element => {
      (element as HTMLElement).style.display = '';
      element.removeAttribute('data-twitter-enhancer-hidden');
    });
  }

  /**
   * 更新隱藏廣告數量
   */
  private updateAdCount(): void {
    const hiddenCount = document.querySelectorAll('[data-twitter-enhancer-hidden="true"]').length;

    // 儲存到 storage
    chrome.storage.local.get('adStats', (result) => {
      const stats = result.adStats || { totalBlocked: 0 };
      stats.totalBlocked = Math.max(stats.totalBlocked, hiddenCount);
      chrome.storage.local.set({ adStats: stats });
    });
  }
}
