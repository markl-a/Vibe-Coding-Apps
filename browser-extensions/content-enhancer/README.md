# 🎨 內容增強工具 - Content Enhancer Extension

> 🚀 **AI 輔助開發的智能網頁體驗增強工具**

一個多功能的瀏覽器擴充功能，提供暗色模式、閱讀模式、字體調整、廣告過濾等網頁瀏覽增強功能，讓您的瀏覽體驗更加舒適。

## 📋 專案目標

提升網頁瀏覽體驗，讓使用者能夠：
- 自訂任何網站的視覺樣式
- 啟用舒適的暗色模式
- 使用專注的閱讀模式
- 過濾廣告和干擾元素
- 調整字體和排版
- 自動翻譯網頁內容

## 🎯 核心功能

### 1. 智能暗色模式
- 🌙 一鍵啟用全站暗色模式
- 🎨 智能反轉顏色（保護圖片）
- ⚙️ 亮度、對比度微調
- 📝 網站特定設定記憶
- 🕐 排程自動切換（日出日落）
- 🎯 AI 優化配色方案

### 2. 閱讀模式
- 📖 提取主要文章內容
- 🔤 可調整字體大小和間距
- 📏 自訂欄寬和對齊
- 🎨 多種閱讀主題
- 💾 儲存文章供離線閱讀
- 🔊 文字轉語音（TTS）

### 3. 廣告和干擾過濾
- 🚫 智能廣告攔截
- 🎯 Cookie 橫幅移除
- 🔇 自動播放影片禁用
- ✨ 彈出視窗攔截
- 📊 元素隱藏工具
- 🤖 AI 辨識干擾內容

### 4. 字體和排版
- 🔤 替換網頁字體
- 📐 調整行高和字間距
- 💪 強制最小字體大小
- 🎨 自訂連結顏色
- ✍️ 注音/拼音輔助顯示

### 5. 頁面自訂 CSS
- 🎨 注入自訂 CSS 樣式
- 💾 儲存網站特定樣式
- 📚 樣式範本庫
- 🔄 即時預覽
- 🌐 分享和匯入樣式

### 6. 翻譯功能
- 🌍 整頁翻譯
- 🎯 選取文字翻譯
- 💬 懸浮翻譯視窗
- 🗣️ 多語言支援
- 🤖 AI 翻譯整合

## 🛠️ 技術棧

### 前端框架
- **React 18** + **TypeScript**
- **Tailwind CSS** - UI 樣式
- **Framer Motion** - 動畫效果
- **Zustand** - 狀態管理

### 瀏覽器 API
- **Chrome Scripting API** - 注入腳本
- **Chrome Storage API** - 設定儲存
- **Chrome DeclarativeNetRequest** - 廣告攔截
- **Chrome TTS API** - 文字轉語音

### 核心技術
- **CSS Variables** - 動態主題
- **MutationObserver** - DOM 監控
- **Readability.js** - 文章提取
- **CSS-in-JS** - 動態樣式注入

### 工具庫
- **color** - 顏色處理
- **@mozilla/readability** - 閱讀模式
- **turndown** - HTML 轉 Markdown
- **franc** - 語言檢測

## 🚀 快速開始

### 安裝依賴

```bash
cd browser-extensions/content-enhancer
npm install
```

### 開發模式

```bash
npm run dev

# 載入到瀏覽器:
# chrome://extensions/ -> 開發者模式 -> 載入未封裝項目
```

### 建置

```bash
npm run build
```

## 📁 專案結構

```
content-enhancer/
├── README.md
├── package.json
├── manifest.json
├── src/
│   ├── background/
│   │   └── service-worker.ts      # 背景服務
│   ├── content/
│   │   ├── dark-mode.ts            # 暗色模式注入
│   │   ├── reader-mode.ts          # 閱讀模式
│   │   ├── ad-blocker.ts           # 廣告攔截
│   │   ├── font-customizer.ts      # 字體自訂
│   │   └── translator.ts           # 翻譯功能
│   ├── popup/
│   │   ├── Popup.tsx               # 彈出介面
│   │   ├── components/
│   │   │   ├── DarkModeToggle.tsx
│   │   │   ├── ReaderModeButton.tsx
│   │   │   ├── FontSettings.tsx
│   │   │   └── QuickSettings.tsx
│   │   └── index.html
│   ├── options/
│   │   ├── Options.tsx             # 設定頁面
│   │   ├── pages/
│   │   │   ├── DarkModeSettings.tsx
│   │   │   ├── ReaderSettings.tsx
│   │   │   ├── AdBlockSettings.tsx
│   │   │   └── CustomCSS.tsx
│   │   └── index.html
│   ├── services/
│   │   ├── dark-mode-service.ts    # 暗色模式邏輯
│   │   ├── reader-service.ts       # 閱讀模式邏輯
│   │   ├── storage-service.ts      # 設定管理
│   │   └── translation-service.ts  # 翻譯服務
│   ├── utils/
│   │   ├── color-inverter.ts       # 顏色反轉
│   │   ├── article-parser.ts       # 文章解析
│   │   ├── css-injector.ts         # CSS 注入
│   │   └── dom-utils.ts            # DOM 工具
│   ├── styles/
│   │   ├── dark-mode-themes/       # 暗色主題
│   │   ├── reader-themes/          # 閱讀主題
│   │   └── filters.css             # 廣告過濾規則
│   └── types/
│       └── index.ts
└── tests/
```

## 💻 核心程式碼範例

### 暗色模式實作

```typescript
// src/content/dark-mode.ts
export class DarkModeInjector {
  private observer: MutationObserver | null = null;
  private cssVariables: Map<string, string> = new Map();

  enable(options: DarkModeOptions): void {
    // 注入暗色模式 CSS
    this.injectCSS(this.generateDarkModeCSS(options));

    // 監控 DOM 變化
    this.observer = new MutationObserver(() => {
      this.applyDarkMode(options);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private generateDarkModeCSS(options: DarkModeOptions): string {
    const { brightness, contrast, preserveImages } = options;

    return `
      html {
        filter: invert(${100 - brightness}%)
                contrast(${contrast}%)
                hue-rotate(180deg);
      }

      ${preserveImages ? `
        img, video, iframe, [style*="background-image"] {
          filter: invert(${brightness}%)
                  contrast(${100 / contrast * 100}%)
                  hue-rotate(-180deg);
        }
      ` : ''}

      * {
        background-color: inherit !important;
        border-color: inherit !important;
      }
    `;
  }

  private injectCSS(css: string): void {
    const style = document.createElement('style');
    style.id = 'dark-mode-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  disable(): void {
    const style = document.getElementById('dark-mode-styles');
    if (style) {
      style.remove();
    }

    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

interface DarkModeOptions {
  brightness: number;    // 0-100
  contrast: number;      // 0-200
  preserveImages: boolean;
  schedule?: {
    enabled: boolean;
    sunrise: string;
    sunset: string;
  };
}
```

### 閱讀模式實作

```typescript
// src/services/reader-service.ts
import { Readability } from '@mozilla/readability';

export class ReaderService {
  extractArticle(): Article | null {
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article) {
      return null;
    }

    return {
      title: article.title,
      content: article.content,
      textContent: article.textContent,
      length: article.length,
      excerpt: article.excerpt,
      byline: article.byline,
      siteName: article.siteName
    };
  }

  renderReaderMode(article: Article, theme: ReaderTheme): void {
    // 創建閱讀模式容器
    const readerContainer = this.createReaderContainer(theme);

    // 渲染文章內容
    readerContainer.innerHTML = `
      <div class="reader-header">
        <h1>${article.title}</h1>
        ${article.byline ? `<p class="byline">${article.byline}</p>` : ''}
      </div>
      <div class="reader-content">
        ${article.content}
      </div>
    `;

    // 隱藏原始頁面
    document.body.style.display = 'none';

    // 插入閱讀模式
    document.documentElement.appendChild(readerContainer);
  }

  private createReaderContainer(theme: ReaderTheme): HTMLElement {
    const container = document.createElement('div');
    container.id = 'reader-mode-container';
    container.className = `theme-${theme.name}`;

    // 應用主題樣式
    container.style.cssText = `
      max-width: ${theme.maxWidth}px;
      font-size: ${theme.fontSize}px;
      font-family: ${theme.fontFamily};
      line-height: ${theme.lineHeight};
      color: ${theme.textColor};
      background-color: ${theme.backgroundColor};
      padding: ${theme.padding}px;
      margin: 0 auto;
    `;

    return container;
  }

  exitReaderMode(): void {
    const container = document.getElementById('reader-mode-container');
    if (container) {
      container.remove();
    }
    document.body.style.display = '';
  }
}

interface Article {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  byline: string | null;
  siteName: string | null;
}

interface ReaderTheme {
  name: string;
  maxWidth: number;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  textColor: string;
  backgroundColor: string;
  padding: number;
}
```

### 智能廣告攔截

```typescript
// src/content/ad-blocker.ts
export class AdBlocker {
  private blockedElements: Set<Element> = new Set();

  // 常見廣告選擇器
  private adSelectors = [
    '[class*="ad-"]',
    '[id*="ad-"]',
    '[class*="advertisement"]',
    '.sponsored',
    '[data-ad-slot]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]'
  ];

  init(): void {
    this.blockAds();
    this.observeNewAds();
    this.removeCookieBanners();
  }

  private blockAds(): void {
    const selector = this.adSelectors.join(', ');
    const adElements = document.querySelectorAll(selector);

    adElements.forEach(element => {
      this.hideElement(element);
    });
  }

  private hideElement(element: Element): void {
    (element as HTMLElement).style.display = 'none';
    this.blockedElements.add(element);
  }

  private observeNewAds(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // 檢查是否符合廣告選擇器
            if (this.isAdElement(element)) {
              this.hideElement(element);
            }

            // 檢查子元素
            const adChildren = element.querySelectorAll(
              this.adSelectors.join(', ')
            );
            adChildren.forEach(ad => this.hideElement(ad));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private isAdElement(element: Element): boolean {
    return this.adSelectors.some(selector => {
      return element.matches(selector);
    });
  }

  private removeCookieBanners(): void {
    const cookieBannerSelectors = [
      '[class*="cookie"]',
      '[id*="cookie"]',
      '[class*="gdpr"]',
      '[class*="consent"]'
    ];

    setTimeout(() => {
      const banners = document.querySelectorAll(
        cookieBannerSelectors.join(', ')
      );
      banners.forEach(banner => this.hideElement(banner));
    }, 1000);
  }

  getBlockedCount(): number {
    return this.blockedElements.size;
  }
}
```

## 🤖 AI 功能整合

### AI 智能配色優化

```typescript
// src/services/ai-color-optimizer.ts
export class AIColorOptimizer {
  async optimizeDarkMode(pageColors: string[]): Promise<DarkTheme> {
    // 使用 AI 分析頁面主色調，生成最佳暗色主題
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a color expert. Generate optimal dark mode color schemes.'
          },
          {
            role: 'user',
            content: `Generate a dark mode theme for these colors: ${pageColors.join(', ')}`
          }
        ]
      })
    });

    const data = await response.json();
    return this.parseDarkTheme(data.choices[0].message.content);
  }
}
```

## 🎨 UI 設計

### 彈出視窗功能
- 快速切換開關
- 亮度/對比度滑桿
- 預設主題選擇
- 當前頁面設定

### 設定頁面
- 詳細功能設定
- 自訂 CSS 編輯器
- 樣式範本庫
- 匯入/匯出設定

## 🧪 開發路線圖

### Phase 1: 基礎功能 ✅
- [x] 專案設置
- [ ] 基本暗色模式
- [ ] 簡單閱讀模式
- [ ] 字體調整

### Phase 2: 進階功能
- [ ] 智能暗色模式
- [ ] 進階閱讀模式（TTS）
- [ ] 廣告攔截
- [ ] 自訂 CSS

### Phase 3: AI 整合
- [ ] AI 配色優化
- [ ] 智能內容識別
- [ ] AI 翻譯功能

### Phase 4: 完善與發布
- [ ] 效能優化
- [ ] 更多網站相容性
- [ ] 雲端同步設定
- [ ] 發布到商店

## 📚 使用 AI 工具開發

### AI 開發工作流程
1. AI 生成 CSS 濾鏡效果
2. AI 優化顏色轉換演算法
3. AI 協助文章內容提取
4. AI 生成多語言翻譯

## ⚙️ 預設主題

### 暗色主題
- **深黑** - OLED 友善
- **柔和灰** - 降低對比
- **深藍** - 護眼模式
- **自訂** - 自訂顏色

### 閱讀主題
- **經典** - 白底黑字
- **護眼** - 淺黃底
- **夜間** - 深灰底
- **紙質** - 仿真紙張

## 🔒 隱私與安全

- ✅ 所有處理完全本地執行
- ✅ 不收集瀏覽歷史
- ✅ 設定儲存於本地
- ✅ 可選擇性啟用功能

## 🤝 貢獻指南

歡迎貢獻新功能和改進！

建議功能：
- 影片播放增強
- 圖片懶載入
- 頁面截圖工具
- PDF 閱讀模式

## 📄 授權

MIT License

---

**讓每個網頁都成為您的專屬體驗** 🚀

最後更新: 2025-11-16
狀態: 🚧 開發中
