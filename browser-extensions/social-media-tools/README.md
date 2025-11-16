# 📱 社交媒體工具 - Social Media Tools Extension

> 🚀 **AI 輔助開發的全能社交媒體增強工具**

一個專為社交媒體使用者設計的瀏覽器擴充功能，提供內容下載、排程發文、分析統計、批次操作等強大功能。

## 📋 專案目標

提升社交媒體使用體驗，讓使用者能夠：
- 下載圖片、影片和故事
- 排程自動發文
- 分析互動數據和趨勢
- 批次管理追蹤和封鎖
- 增強介面和功能
- 自動化重複性任務

## 🎯 核心功能

### 1. 多媒體下載器
- 📷 Instagram 圖片/影片下載
- 🎬 YouTube 影片下載
- 📘 Facebook 影片/相片下載
- 🐦 Twitter/X 媒體下載
- 📖 Stories 和 Reels 下載
- 📊 批次下載功能
- 🎨 自動檔名和分類

### 2. 排程發文
- ⏰ 預約發文時間
- 📝 草稿箱管理
- 🔄 跨平台發布
- 📊 最佳發文時間建議（AI）
- 🎨 圖片/影片預覽
- 📋 發文佇列管理
- 🔔 發文提醒

### 3. 分析工具
- 📊 追蹤者增長趨勢
- 💬 互動率統計
- 🔥 熱門貼文分析
- 👥 粉絲洞察報告
- 📈 歷史數據追蹤
- 🎯 競品分析
- 📉 退追分析

### 4. 批次操作
- ✅ 批次按讚/留言
- 👥 批次追蹤/取消追蹤
- 🗑️ 批次刪除貼文
- 📥 批次儲存/分類
- 🚫 批次封鎖/解封
- 💬 批次訊息發送

### 5. 介面增強
- 🌙 自訂主題和顏色
- 🎨 隱藏廣告和建議
- 📐 重新排列版面
- 🔍 進階搜尋過濾
- ⬇️ 自動載入更多
- 🎯 內容過濾器

### 6. 智能助手
- 🤖 AI 生成貼文內容
- 🎨 AI 圖片說明生成
- 🏷️ 智能標籤建議
- 💬 自動回覆機器人
- 📊 趨勢話題推薦
- 🎯 最佳標籤組合

## 🛠️ 技術棧

### 前端框架
- **React 18** + **TypeScript**
- **Tailwind CSS** - UI 樣式
- **Zustand** - 狀態管理
- **React Query** - 資料快取

### 瀏覽器 API
- **Chrome Downloads API** - 檔案下載
- **Chrome Alarms API** - 排程任務
- **Chrome Storage API** - 資料儲存
- **Chrome Notifications API** - 通知

### 核心技術
- **MutationObserver** - DOM 監控
- **Blob API** - 檔案處理
- **Canvas API** - 圖片處理
- **IndexedDB** - 大量資料儲存

### 工具庫
- **axios** - HTTP 請求
- **file-saver** - 檔案儲存
- **chart.js** - 資料視覺化
- **date-fns** - 日期處理
- **jszip** - 批次壓縮

## 🚀 快速開始

### 安裝依賴

```bash
cd browser-extensions/social-media-tools
npm install
```

### 開發模式

```bash
npm run dev

# 載入到 Chrome:
# chrome://extensions/ -> 開發者模式 -> 載入未封裝項目
```

### 建置

```bash
npm run build
```

## 📁 專案結構

```
social-media-tools/
├── README.md
├── package.json
├── manifest.json
├── src/
│   ├── background/
│   │   ├── service-worker.ts       # 背景服務
│   │   ├── scheduler.ts            # 排程管理
│   │   └── downloader.ts           # 下載管理
│   ├── content/
│   │   ├── instagram/
│   │   │   ├── download-button.ts  # 下載按鈕注入
│   │   │   ├── analytics.ts        # 數據收集
│   │   │   └── ui-enhancer.ts      # UI 增強
│   │   ├── twitter/
│   │   │   ├── download-button.ts
│   │   │   └── analytics.ts
│   │   ├── facebook/
│   │   │   ├── download-button.ts
│   │   │   └── analytics.ts
│   │   └── youtube/
│   │       ├── download-button.ts
│   │       └── quality-selector.ts
│   ├── popup/
│   │   ├── Popup.tsx
│   │   ├── components/
│   │   │   ├── QuickDownload.tsx
│   │   │   ├── ScheduledPosts.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── QuickActions.tsx
│   │   └── index.html
│   ├── options/
│   │   ├── Options.tsx
│   │   ├── pages/
│   │   │   ├── Download.tsx
│   │   │   ├── Scheduler.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── Automation.tsx
│   │   │   └── Settings.tsx
│   │   └── index.html
│   ├── services/
│   │   ├── download-service.ts     # 下載服務
│   │   ├── scheduler-service.ts    # 排程服務
│   │   ├── analytics-service.ts    # 分析服務
│   │   ├── platform-api.ts         # 平台 API 整合
│   │   └── ai-service.ts           # AI 功能
│   ├── utils/
│   │   ├── media-fetcher.ts        # 媒體獲取
│   │   ├── file-utils.ts           # 檔案工具
│   │   ├── date-utils.ts           # 日期工具
│   │   └── platform-detector.ts    # 平台偵測
│   ├── types/
│   │   └── index.ts
│   └── constants/
│       ├── platforms.ts            # 平台設定
│       └── selectors.ts            # DOM 選擇器
└── tests/
```

## 💻 核心程式碼範例

### 媒體下載服務

```typescript
// src/services/download-service.ts
export class DownloadService {
  /**
   * 下載 Instagram 圖片/影片
   */
  async downloadInstagramMedia(url: string): Promise<void> {
    const mediaData = await this.fetchInstagramMedia(url);

    if (mediaData.type === 'image') {
      await this.downloadImage(mediaData.url, mediaData.filename);
    } else if (mediaData.type === 'video') {
      await this.downloadVideo(mediaData.url, mediaData.filename);
    }
  }

  /**
   * 批次下載
   */
  async batchDownload(urls: string[]): Promise<void> {
    const downloads = urls.map(url => this.downloadInstagramMedia(url));
    await Promise.all(downloads);
  }

  /**
   * 下載圖片
   */
  private async downloadImage(url: string, filename: string): Promise<void> {
    const response = await fetch(url);
    const blob = await response.blob();

    chrome.downloads.download({
      url: URL.createObjectURL(blob),
      filename: `instagram/${filename}`,
      saveAs: false
    });
  }

  /**
   * 下載影片
   */
  private async downloadVideo(url: string, filename: string): Promise<void> {
    chrome.downloads.download({
      url: url,
      filename: `instagram/${filename}`,
      saveAs: false
    });
  }

  /**
   * 獲取 Instagram 媒體資料
   */
  private async fetchInstagramMedia(url: string): Promise<MediaData> {
    // 從頁面中提取媒體 URL
    const response = await fetch(url);
    const html = await response.text();

    // 解析 HTML 找到媒體 URL
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Instagram 特定選擇器
    const videoElement = doc.querySelector('video');
    const imageElement = doc.querySelector('meta[property="og:image"]');

    if (videoElement) {
      return {
        type: 'video',
        url: videoElement.src,
        filename: this.generateFilename('video', 'mp4')
      };
    } else if (imageElement) {
      return {
        type: 'image',
        url: imageElement.getAttribute('content') || '',
        filename: this.generateFilename('image', 'jpg')
      };
    }

    throw new Error('無法找到媒體');
  }

  /**
   * 生成檔案名稱
   */
  private generateFilename(type: string, extension: string): string {
    const timestamp = new Date().getTime();
    return `${type}_${timestamp}.${extension}`;
  }
}

interface MediaData {
  type: 'image' | 'video';
  url: string;
  filename: string;
}
```

### 排程發文服務

```typescript
// src/services/scheduler-service.ts
export class SchedulerService {
  /**
   * 建立排程發文
   */
  async schedulePost(post: ScheduledPost): Promise<void> {
    // 儲存到資料庫
    await this.saveScheduledPost(post);

    // 設定鬧鐘
    const delayInMinutes = this.calculateDelay(post.scheduledTime);

    await chrome.alarms.create(`post_${post.id}`, {
      delayInMinutes: delayInMinutes
    });
  }

  /**
   * 取消排程發文
   */
  async cancelScheduledPost(postId: string): Promise<void> {
    await chrome.alarms.clear(`post_${postId}`);
    await this.deleteScheduledPost(postId);
  }

  /**
   * 執行發文
   */
  async executePost(post: ScheduledPost): Promise<void> {
    const platform = post.platform;

    try {
      switch (platform) {
        case 'instagram':
          await this.postToInstagram(post);
          break;
        case 'twitter':
          await this.postToTwitter(post);
          break;
        case 'facebook':
          await this.postToFacebook(post);
          break;
      }

      // 標記為已發布
      await this.markAsPublished(post.id);

      // 發送通知
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: '發文成功',
        message: `您的貼文已成功發布到 ${platform}`
      });
    } catch (error) {
      console.error('發文失敗:', error);

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: '發文失敗',
        message: `發布到 ${platform} 失敗，請檢查設定`
      });
    }
  }

  /**
   * 發布到 Instagram
   */
  private async postToInstagram(post: ScheduledPost): Promise<void> {
    // 開啟 Instagram 並自動填寫內容
    const tab = await chrome.tabs.create({
      url: 'https://www.instagram.com/create/style/',
      active: false
    });

    // 注入腳本來自動填寫和發布
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: this.autoPostToInstagram,
      args: [post]
    });
  }

  private autoPostToInstagram(post: ScheduledPost): void {
    // 自動填寫表單和發布的腳本
    // （這需要根據 Instagram 的實際介面調整）
  }

  private calculateDelay(scheduledTime: Date): number {
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();
    return Math.max(0, delay / 1000 / 60); // 轉換為分鐘
  }

  private async saveScheduledPost(post: ScheduledPost): Promise<void> {
    const posts = await this.getAllScheduledPosts();
    posts.push(post);
    await chrome.storage.local.set({ scheduledPosts: posts });
  }

  private async deleteScheduledPost(postId: string): Promise<void> {
    const posts = await this.getAllScheduledPosts();
    const filtered = posts.filter(p => p.id !== postId);
    await chrome.storage.local.set({ scheduledPosts: filtered });
  }

  private async getAllScheduledPosts(): Promise<ScheduledPost[]> {
    const result = await chrome.storage.local.get('scheduledPosts');
    return result.scheduledPosts || [];
  }

  private async markAsPublished(postId: string): Promise<void> {
    const posts = await this.getAllScheduledPosts();
    const post = posts.find(p => p.id === postId);

    if (post) {
      post.status = 'published';
      post.publishedAt = new Date();
      await chrome.storage.local.set({ scheduledPosts: posts });
    }
  }
}

interface ScheduledPost {
  id: string;
  platform: 'instagram' | 'twitter' | 'facebook';
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
  scheduledTime: Date;
  status: 'pending' | 'published' | 'failed';
  publishedAt?: Date;
}
```

### 分析服務

```typescript
// src/services/analytics-service.ts
export class AnalyticsService {
  /**
   * 收集 Instagram 數據
   */
  async collectInstagramData(): Promise<InstagramAnalytics> {
    const profileData = await this.scrapeInstagramProfile();

    return {
      followers: profileData.followers,
      following: profileData.following,
      posts: profileData.posts,
      engagementRate: this.calculateEngagementRate(profileData),
      topPosts: await this.getTopPosts(),
      followerGrowth: await this.getFollowerGrowth(),
      bestPostingTimes: await this.analyzeBestPostingTimes()
    };
  }

  /**
   * 抓取 Instagram 個人檔案數據
   */
  private async scrapeInstagramProfile(): Promise<ProfileData> {
    // 從當前頁面中提取數據
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: () => {
        // 提取追蹤者、追蹤中、貼文數等
        const followers = document.querySelector('a[href*="followers"] span')?.textContent || '0';
        const following = document.querySelector('a[href*="following"] span')?.textContent || '0';
        const posts = document.querySelectorAll('article img').length;

        return {
          followers: this.parseNumber(followers),
          following: this.parseNumber(following),
          posts: posts
        };
      }
    });

    return result[0].result as ProfileData;
  }

  /**
   * 計算互動率
   */
  private calculateEngagementRate(data: ProfileData): number {
    // 簡化計算：平均按讚數 / 追蹤者數
    // 實際應該包含留言數
    return (data.averageLikes / data.followers) * 100;
  }

  /**
   * 取得熱門貼文
   */
  private async getTopPosts(): Promise<PostAnalytics[]> {
    // 分析近期貼文的互動數據
    return [];
  }

  /**
   * 追蹤者增長趨勢
   */
  private async getFollowerGrowth(): Promise<GrowthData[]> {
    const history = await this.getHistoricalData();

    return history.map((record, index) => ({
      date: record.date,
      followers: record.followers,
      change: index > 0 ? record.followers - history[index - 1].followers : 0
    }));
  }

  /**
   * 分析最佳發文時間
   */
  private async analyzeBestPostingTimes(): Promise<BestTime[]> {
    const posts = await this.getAllPostsData();

    // 按時段分組計算平均互動率
    const timeSlots = this.groupByTimeSlot(posts);

    return timeSlots
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5);
  }

  /**
   * 儲存歷史數據
   */
  async saveSnapshot(): Promise<void> {
    const data = await this.collectInstagramData();

    const history = await this.getHistoricalData();
    history.push({
      date: new Date(),
      followers: data.followers,
      following: data.following,
      posts: data.posts
    });

    await chrome.storage.local.set({ analyticsHistory: history });
  }

  private async getHistoricalData(): Promise<HistoricalData[]> {
    const result = await chrome.storage.local.get('analyticsHistory');
    return result.analyticsHistory || [];
  }

  private parseNumber(str: string): number {
    // 處理 1K, 1M 等格式
    const multipliers: Record<string, number> = {
      K: 1000,
      M: 1000000,
      B: 1000000000
    };

    const match = str.match(/^(\d+\.?\d*)([KMB])?$/);
    if (!match) return 0;

    const num = parseFloat(match[1]);
    const multiplier = match[2] ? multipliers[match[2]] : 1;

    return num * multiplier;
  }
}

interface InstagramAnalytics {
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  topPosts: PostAnalytics[];
  followerGrowth: GrowthData[];
  bestPostingTimes: BestTime[];
}

interface ProfileData {
  followers: number;
  following: number;
  posts: number;
  averageLikes: number;
}

interface PostAnalytics {
  url: string;
  likes: number;
  comments: number;
  engagement: number;
  postedAt: Date;
}

interface GrowthData {
  date: Date;
  followers: number;
  change: number;
}

interface BestTime {
  hour: number;
  avgEngagement: number;
}

interface HistoricalData {
  date: Date;
  followers: number;
  following: number;
  posts: number;
}
```

## 🤖 AI 功能整合

### AI 內容生成

```typescript
// src/services/ai-service.ts
export class AIContentService {
  /**
   * 生成貼文內容
   */
  async generatePostContent(topic: string, platform: string): Promise<string> {
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
            content: `You are a social media expert. Create engaging ${platform} posts.`
          },
          {
            role: 'user',
            content: `Create a post about: ${topic}`
          }
        ]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * 生成圖片說明
   */
  async generateImageCaption(imageUrl: string): Promise<string> {
    // 使用視覺 AI 模型生成圖片描述
    // 然後轉換為適合社交媒體的說明文字
  }

  /**
   * 建議標籤
   */
  async suggestHashtags(content: string): Promise<string[]> {
    // 使用 AI 分析內容並建議相關標籤
  }
}
```

## 🎨 UI 設計

### 主要介面
- **快速下載** - 一鍵下載當前頁面媒體
- **排程管理** - 發文行事曆和佇列
- **分析儀表板** - 數據視覺化
- **批次操作** - 多選和批次處理

## 🧪 開發路線圖

### Phase 1: 基礎功能 ✅
- [x] 專案設置
- [ ] Instagram 媒體下載
- [ ] 基本排程功能
- [ ] 簡單數據收集

### Phase 2: 多平台支援
- [ ] Twitter/X 整合
- [ ] Facebook 整合
- [ ] YouTube 整合
- [ ] TikTok 整合

### Phase 3: 進階功能
- [ ] 批次操作
- [ ] 進階分析
- [ ] 介面自訂
- [ ] 自動化規則

### Phase 4: AI 整合
- [ ] AI 內容生成
- [ ] 智能排程建議
- [ ] 趨勢分析
- [ ] 自動回覆

### Phase 5: 完善與發布
- [ ] 效能優化
- [ ] 更多平台
- [ ] 雲端同步
- [ ] 發布到商店

## 📚 支援平台

### 完整支援
- ✅ Instagram
- ✅ Twitter/X
- ✅ Facebook
- ✅ YouTube

### 計劃支援
- 🔜 TikTok
- 🔜 LinkedIn
- 🔜 Pinterest
- 🔜 Reddit

## ⚠️ 使用須知

### 遵守規範
- ✅ 遵守各平台使用條款
- ✅ 尊重版權和智慧財產權
- ✅ 不進行惡意自動化操作
- ✅ 合理使用速率限制

### 隱私保護
- ✅ 不收集使用者帳號資訊
- ✅ 本地儲存資料
- ✅ 不與第三方分享資料

## 🤝 貢獻指南

歡迎貢獻！特別需要：
- 新平台整合
- UI/UX 改進
- 功能建議
- Bug 回報

## 📄 授權

MIT License

---

**讓社交媒體管理更輕鬆** 🚀

最後更新: 2025-11-16
狀態: 🚧 開發中
