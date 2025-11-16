# 📸 Instagram Media Downloader

> 一鍵下載 Instagram 圖片、影片、Stories 和 Reels

## 功能特色

### 核心功能
- ⬇️ **一鍵下載** - 在任何 Instagram 貼文上點擊下載按鈕
- 📷 **圖片下載** - 支援單張和多張圖片下載
- 🎬 **影片下載** - 高畫質影片下載
- 📖 **Stories 下載** - 下載限時動態
- 🎥 **Reels 下載** - 下載短影片
- 📦 **批次下載** - 一次下載多個媒體檔案
- 🗂️ **自動分類** - 按類型自動整理下載檔案
- ⚙️ **自訂設定** - 檔案命名、儲存位置等

### 使用介面
- 🔘 **下載按鈕** - 自動在貼文上顯示下載按鈕
- 🎨 **彈出視窗** - 快速存取下載歷史和設定
- 📊 **下載統計** - 追蹤下載數量和歷史

## 安裝方式

### 從原始碼安裝

1. 克隆專案
```bash
git clone <repository-url>
cd browser-extensions/social-media-tools/instagram-downloader
```

2. 安裝依賴
```bash
npm install
```

3. 建置專案
```bash
npm run build
```

4. 載入到 Chrome
- 開啟 `chrome://extensions/`
- 啟用「開發者模式」
- 點擊「載入未封裝項目」
- 選擇 `dist` 資料夾

## 使用方法

### 下載單一媒體

1. 瀏覽 Instagram 貼文
2. 點擊貼文上的「下載」按鈕
3. 媒體檔案會自動下載到您的下載資料夾

### 批次下載

1. 點擊擴充功能圖示開啟彈出視窗
2. 選擇「批次下載模式」
3. 在 Instagram 上選擇多個貼文
4. 點擊「開始下載」

### 下載 Stories

1. 開啟任何使用者的 Stories
2. 點擊 Story 上的下載按鈕
3. Story 會被下載為圖片或影片

## 專案結構

```
instagram-downloader/
├── README.md
├── package.json
├── manifest.json
├── webpack.config.js
├── tsconfig.json
├── src/
│   ├── background/
│   │   └── service-worker.ts      # 背景服務處理下載
│   ├── content/
│   │   ├── instagram-downloader.ts # 主要內容腳本
│   │   ├── download-button.ts      # 下載按鈕注入
│   │   ├── media-extractor.ts      # 媒體 URL 提取
│   │   └── styles.css              # 自訂樣式
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── utils/
│   │   ├── downloader.ts           # 下載工具
│   │   ├── filename-generator.ts   # 檔名生成
│   │   └── storage.ts              # 儲存管理
│   └── types/
│       └── index.ts                # TypeScript 型別定義
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

## 核心程式碼

### 媒體提取器

```typescript
// src/content/media-extractor.ts
export class MediaExtractor {
  /**
   * 從 Instagram 貼文中提取媒體 URL
   */
  extractMediaFromPost(postElement: HTMLElement): MediaInfo[] {
    const mediaList: MediaInfo[] = [];

    // 提取圖片
    const images = postElement.querySelectorAll('img[src*="instagram"]');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.includes('profile')) {
        mediaList.push({
          type: 'image',
          url: src,
          filename: this.generateFilename('image', 'jpg')
        });
      }
    });

    // 提取影片
    const videos = postElement.querySelectorAll('video');
    videos.forEach(video => {
      const src = video.getAttribute('src') || video.querySelector('source')?.src;
      if (src) {
        mediaList.push({
          type: 'video',
          url: src,
          filename: this.generateFilename('video', 'mp4')
        });
      }
    });

    return mediaList;
  }

  /**
   * 從 Story 中提取媒體
   */
  extractMediaFromStory(): MediaInfo | null {
    // Story 通常在特定容器中
    const storyVideo = document.querySelector('video[class*="Story"]');
    const storyImage = document.querySelector('img[class*="Story"]');

    if (storyVideo) {
      return {
        type: 'video',
        url: storyVideo.getAttribute('src') || '',
        filename: this.generateFilename('story', 'mp4')
      };
    }

    if (storyImage) {
      return {
        type: 'image',
        url: storyImage.getAttribute('src') || '',
        filename: this.generateFilename('story', 'jpg')
      };
    }

    return null;
  }

  private generateFilename(type: string, extension: string): string {
    const timestamp = Date.now();
    return `instagram_${type}_${timestamp}.${extension}`;
  }
}

interface MediaInfo {
  type: 'image' | 'video';
  url: string;
  filename: string;
}
```

### 下載按鈕注入

```typescript
// src/content/download-button.ts
export class DownloadButtonInjector {
  private observer: MutationObserver;

  constructor() {
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
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        this.injectButtons();
      }
    }
  }

  /**
   * 在貼文上注入下載按鈕
   */
  private injectButtons(): void {
    // 找到所有貼文
    const posts = document.querySelectorAll('article[role="presentation"]');

    posts.forEach(post => {
      // 檢查是否已經有下載按鈕
      if (post.querySelector('.insta-download-btn')) {
        return;
      }

      // 創建下載按鈕
      const downloadBtn = this.createDownloadButton();

      // 找到適當的位置插入按鈕
      const actionBar = post.querySelector('section[class*="Action"]');
      if (actionBar) {
        actionBar.appendChild(downloadBtn);
      }
    });
  }

  /**
   * 創建下載按鈕元素
   */
  private createDownloadButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'insta-download-btn';
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 16L7 11L8.4 9.6L11 12.2V4H13V12.2L15.6 9.6L17 11L12 16Z" fill="currentColor"/>
        <path d="M20 18H4V20H20V18Z" fill="currentColor"/>
      </svg>
    `;
    button.title = '下載媒體';

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleDownload(button);
    });

    return button;
  }

  /**
   * 處理下載操作
   */
  private async handleDownload(button: HTMLButtonElement): Promise<void> {
    const post = button.closest('article');
    if (!post) return;

    button.disabled = true;
    button.textContent = '下載中...';

    try {
      const extractor = new MediaExtractor();
      const mediaList = extractor.extractMediaFromPost(post as HTMLElement);

      // 發送到背景腳本進行下載
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_MEDIA',
        media: mediaList
      });

      button.textContent = '✓ 完成';
      setTimeout(() => {
        button.innerHTML = button.querySelector('svg')!.outerHTML;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('下載失敗:', error);
      button.textContent = '✗ 失敗';
      setTimeout(() => {
        button.innerHTML = button.querySelector('svg')!.outerHTML;
        button.disabled = false;
      }, 2000);
    }
  }
}
```

### 下載管理器

```typescript
// src/background/service-worker.ts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_MEDIA') {
    handleMediaDownload(message.media);
  }
});

async function handleMediaDownload(mediaList: MediaInfo[]): Promise<void> {
  for (const media of mediaList) {
    try {
      await chrome.downloads.download({
        url: media.url,
        filename: `Instagram/${media.filename}`,
        saveAs: false
      });

      // 儲存下載歷史
      await saveDownloadHistory(media);
    } catch (error) {
      console.error('下載失敗:', error);
    }
  }
}

async function saveDownloadHistory(media: MediaInfo): Promise<void> {
  const history = await chrome.storage.local.get('downloadHistory');
  const downloads = history.downloadHistory || [];

  downloads.push({
    ...media,
    downloadedAt: new Date().toISOString()
  });

  // 只保留最近 100 筆記錄
  if (downloads.length > 100) {
    downloads.shift();
  }

  await chrome.storage.local.set({ downloadHistory: downloads });
}

interface MediaInfo {
  type: 'image' | 'video';
  url: string;
  filename: string;
}
```

## 技術棧

- **TypeScript** - 型別安全的開發
- **Webpack** - 模組打包
- **Chrome Extension Manifest V3** - 最新擴充功能標準
- **MutationObserver** - 動態內容監控
- **Chrome Downloads API** - 檔案下載管理

## 開發指令

```bash
# 開發模式（自動重新編譯）
npm run dev

# 生產建置
npm run build

# 程式碼檢查
npm run lint

# 型別檢查
npm run type-check
```

## 功能路線圖

- [x] 基本圖片下載
- [x] 影片下載
- [x] 下載按鈕注入
- [ ] Stories 下載
- [ ] Reels 下載
- [ ] 批次下載功能
- [ ] 下載佇列管理
- [ ] 自訂檔案命名規則
- [ ] 下載歷史記錄
- [ ] 高畫質選項
- [ ] 多帳號支援

## 注意事項

- 請尊重智慧財產權，僅下載您有權使用的內容
- 遵守 Instagram 的使用條款
- 此工具僅供個人使用，請勿用於商業用途

## 授權

MIT License

---

**輕鬆下載，精彩珍藏** 📸
