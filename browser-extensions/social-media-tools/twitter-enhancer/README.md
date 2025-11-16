# 🐦 Twitter/X Enhancer

> 全方位增強 Twitter/X 使用體驗

## 功能特色

### 媒體下載
- ⬇️ **圖片下載** - 快速下載推文中的圖片
- 🎬 **影片下載** - 高畫質影片下載
- 🔗 **批次下載** - 一次下載多個媒體檔案
- 📦 **GIF 下載** - 下載 GIF 動圖

### 介面增強
- 🚫 **隱藏廣告** - 自動隱藏推廣推文
- 🎨 **自訂主題** - 深色/淺色主題切換
- 📐 **版面優化** - 調整版面配置
- 👁️ **隱藏已讀** - 隱藏已看過的推文

### 功能增強
- 📊 **統計資訊** - 顯示詳細互動統計
- 🔍 **進階搜尋** - 更強大的搜尋過濾
- 📌 **書籤管理** - 更好的書籤組織
- ⌨️ **快捷鍵** - 自訂鍵盤快捷鍵

### 隱私保護
- 🔒 **阻擋追蹤** - 防止追蹤腳本
- 🛡️ **隱私模式** - 匿名瀏覽
- 🔐 **資料加密** - 本地資料加密儲存

## 安裝方式

### 從原始碼安裝

1. 克隆專案
```bash
git clone <repository-url>
cd browser-extensions/social-media-tools/twitter-enhancer
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

### 下載媒體

1. 瀏覽任何包含媒體的推文
2. 點擊推文上的下載按鈕
3. 選擇要下載的媒體檔案

### 隱藏廣告

1. 點擊擴充功能圖示
2. 開啟「隱藏廣告」選項
3. 重新整理頁面

### 自訂主題

1. 點擊擴充功能圖示
2. 選擇「主題設定」
3. 選擇您喜歡的顏色和樣式

## 專案結構

```
twitter-enhancer/
├── README.md
├── package.json
├── manifest.json
├── webpack.config.js
├── tsconfig.json
├── src/
│   ├── background/
│   │   └── service-worker.ts      # 背景服務
│   ├── content/
│   │   ├── twitter-enhancer.ts    # 主要內容腳本
│   │   ├── media-downloader.ts    # 媒體下載器
│   │   ├── ad-blocker.ts          # 廣告隱藏
│   │   ├── theme-manager.ts       # 主題管理
│   │   └── styles.css             # 自訂樣式
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   └── utils/
│       ├── storage.ts             # 儲存管理
│       └── dom-utils.ts           # DOM 工具
└── icons/
```

## 核心程式碼

### 媒體下載器

```typescript
// src/content/media-downloader.ts
export class MediaDownloader {
  /**
   * 從推文中提取媒體 URL
   */
  extractMediaFromTweet(tweetElement: HTMLElement): MediaInfo[] {
    const mediaList: MediaInfo[] = [];

    // 提取圖片
    const images = tweetElement.querySelectorAll('img[src*="media"]');
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
          filename: this.generateFilename('video', 'mp4')
        });
      }
    });

    return mediaList;
  }

  /**
   * 獲取原始圖片 URL（最高畫質）
   */
  private getOriginalImageUrl(url: string): string {
    // Twitter 圖片 URL 格式: https://pbs.twimg.com/media/xxx.jpg:large
    // 改為: https://pbs.twimg.com/media/xxx.jpg:orig
    return url.replace(/\.(jpg|png|webp)(:\w+)?$/, '.$1:orig');
  }
}
```

### 廣告隱藏器

```typescript
// src/content/ad-blocker.ts
export class AdBlocker {
  private observer: MutationObserver;

  constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  /**
   * 開始監控並隱藏廣告
   */
  start(): void {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.hideAds();
  }

  /**
   * 隱藏廣告推文
   */
  private hideAds(): void {
    // 找到所有推廣標籤
    const promotedLabels = document.querySelectorAll('[data-testid="placementTracking"]');

    promotedLabels.forEach(label => {
      // 找到包含的推文容器
      const tweet = label.closest('article');
      if (tweet) {
        (tweet as HTMLElement).style.display = 'none';
      }
    });

    // 隱藏「Who to follow」推薦
    const recommendations = document.querySelectorAll('[aria-label*="Timeline: Trending now"]');
    recommendations.forEach(rec => {
      (rec as HTMLElement).style.display = 'none';
    });
  }
}
```

### 主題管理器

```typescript
// src/content/theme-manager.ts
export class ThemeManager {
  /**
   * 應用自訂主題
   */
  applyTheme(theme: Theme): void {
    const root = document.documentElement;

    // 設定 CSS 變數
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--background-color', theme.backgroundColor);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--border-color', theme.borderColor);

    // 儲存主題設定
    chrome.storage.local.set({ theme });
  }

  /**
   * 預設主題
   */
  getDefaultThemes(): Record<string, Theme> {
    return {
      dark: {
        primaryColor: '#1d9bf0',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        borderColor: '#2f3336'
      },
      light: {
        primaryColor: '#1d9bf0',
        backgroundColor: '#ffffff',
        textColor: '#0f1419',
        borderColor: '#eff3f4'
      },
      dim: {
        primaryColor: '#1d9bf0',
        backgroundColor: '#15202b',
        textColor: '#ffffff',
        borderColor: '#38444d'
      }
    };
  }
}
```

## 技術棧

- **TypeScript** - 型別安全的開發
- **Webpack** - 模組打包
- **Chrome Extension Manifest V3** - 最新擴充功能標準
- **MutationObserver** - 動態內容監控

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

- [x] 基本媒體下載
- [x] 廣告隱藏
- [x] 主題切換
- [ ] 影片畫質選擇
- [ ] 批次下載
- [ ] 進階搜尋過濾
- [ ] 書籤分類管理
- [ ] 自訂快捷鍵
- [ ] 推文排程
- [ ] 分析儀表板

## 隱私聲明

- 不收集任何使用者資料
- 所有設定和資料僅儲存在本地
- 不與第三方分享資訊
- 開源透明

## 授權

MIT License

---

**讓 Twitter/X 更好用** 🐦
