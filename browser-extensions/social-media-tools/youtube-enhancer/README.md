# 🎬 YouTube Enhancer

> 全面提升 YouTube 觀看體驗

## 功能特色

### 影片下載
- ⬇️ **一鍵下載** - 快速下載 YouTube 影片
- 🎞️ **畫質選擇** - 支援 4K/1080p/720p 等多種畫質
- 🎵 **音訊下載** - 僅下載音訊（MP3）
- 📝 **字幕下載** - 下載影片字幕檔案
- 📋 **播放清單下載** - 批次下載整個播放清單

### 播放器增強
- ⏩ **自訂速度** - 0.25x 到 3x 任意速度
- 🔊 **音量增強** - 超過 100% 音量
- ⏭️ **跳過片頭** - 自動跳過片頭動畫
- 🎮 **鍵盤快捷鍵** - 自訂快捷鍵操作
- 🖼️ **子母畫面** - 浮動視窗播放
- 🔁 **循環播放** - 單一區段循環

### 廣告移除
- 🚫 **移除影片廣告** - 自動跳過所有廣告
- 🛡️ **隱藏橫幅廣告** - 移除側邊欄廣告
- ⏭️ **跳過贊助片段** - SponsorBlock 整合

### 介面優化
- 🎨 **自訂主題** - 深色/淺色主題
- 📐 **版面配置** - 調整劇院模式寬度
- 💬 **留言增強** - 留言搜尋和過濾
- 📊 **統計資訊** - 顯示詳細觀看數據

### 訂閱管理
- 📁 **訂閱分類** - 將頻道分組管理
- 🔔 **通知過濾** - 自訂通知規則
- 📋 **觀看清單** - 稍後觀看管理

## 安裝方式

### 從原始碼安裝

1. 克隆專案
```bash
git clone <repository-url>
cd browser-extensions/social-media-tools/youtube-enhancer
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

### 下載影片

1. 播放任何 YouTube 影片
2. 點擊播放器下方的「下載」按鈕
3. 選擇畫質和格式
4. 開始下載

### 自訂播放速度

1. 播放影片時按下鍵盤上的 `[` 或 `]`
2. 或點擊播放器上的速度控制按鈕
3. 輸入任意速度（例如：1.25、1.5、2.0）

### 移除廣告

1. 點擊擴充功能圖示
2. 啟用「自動跳過廣告」
3. 重新載入頁面

## 專案結構

```
youtube-enhancer/
├── README.md
├── package.json
├── manifest.json
├── webpack.config.js
├── tsconfig.json
├── src/
│   ├── background/
│   │   └── service-worker.ts      # 背景服務
│   ├── content/
│   │   ├── youtube-enhancer.ts    # 主要腳本
│   │   ├── video-downloader.ts    # 影片下載器
│   │   ├── player-enhancements.ts # 播放器增強
│   │   ├── ad-skipper.ts          # 廣告跳過
│   │   └── styles.css             # 自訂樣式
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   └── utils/
│       ├── youtube-api.ts         # YouTube API 工具
│       └── storage.ts             # 儲存管理
└── icons/
```

## 核心程式碼

### 影片下載器

```typescript
// src/content/video-downloader.ts
export class VideoDownloader {
  /**
   * 獲取影片資訊
   */
  async getVideoInfo(): Promise<VideoInfo> {
    const videoId = this.extractVideoId();
    const player = (window as any).ytInitialPlayerResponse;

    return {
      videoId,
      title: player.videoDetails.title,
      author: player.videoDetails.author,
      duration: player.videoDetails.lengthSeconds,
      formats: player.streamingData.formats
    };
  }

  /**
   * 下載影片
   */
  async downloadVideo(quality: string): Promise<void> {
    const info = await this.getVideoInfo();
    const format = this.selectFormat(info.formats, quality);

    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_VIDEO',
      url: format.url,
      filename: `${info.title}.mp4`
    });
  }
}
```

### 廣告跳過器

```typescript
// src/content/ad-skipper.ts
export class AdSkipper {
  /**
   * 監控並跳過廣告
   */
  start(): void {
    const video = document.querySelector('video');
    if (!video) return;

    // 監控廣告出現
    const observer = new MutationObserver(() => {
      const skipButton = document.querySelector('.ytp-ad-skip-button');
      if (skipButton) {
        (skipButton as HTMLElement).click();
      }

      // 靜音廣告
      const adPlaying = document.querySelector('.ad-showing');
      if (adPlaying && video) {
        video.muted = true;
        video.currentTime = video.duration; // 跳到結尾
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}
```

### 播放器增強

```typescript
// src/content/player-enhancements.ts
export class PlayerEnhancements {
  /**
   * 添加自訂速度控制
   */
  addSpeedControl(): void {
    const player = document.querySelector('.ytp-right-controls');
    if (!player) return;

    const speedButton = this.createSpeedButton();
    player.insertBefore(speedButton, player.firstChild);
  }

  /**
   * 設定播放速度
   */
  setPlaybackSpeed(speed: number): void {
    const video = document.querySelector('video');
    if (video) {
      (video as HTMLVideoElement).playbackRate = speed;
    }
  }

  /**
   * 音量增強（超過 100%）
   */
  setVolumeBoost(level: number): void {
    const video = document.querySelector('video');
    if (video) {
      (video as HTMLVideoElement).volume = Math.min(level / 100, 1);
      // 使用 Web Audio API 進一步增強
      this.applyAudioGain(level);
    }
  }
}
```

## 技術棧

- **TypeScript** - 型別安全
- **Webpack** - 模組打包
- **Chrome Extension Manifest V3** - 最新標準
- **YouTube IFrame API** - 播放器控制

## 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Space` | 播放/暫停 |
| `[` | 減速 |
| `]` | 加速 |
| `M` | 靜音 |
| `F` | 全螢幕 |
| `T` | 劇院模式 |
| `<` | 上一部影片 |
| `>` | 下一部影片 |
| `0-9` | 跳到影片 0%-90% |

## 功能路線圖

- [x] 基本影片下載
- [x] 廣告跳過
- [x] 自訂播放速度
- [ ] 播放清單批次下載
- [ ] 字幕下載
- [ ] SponsorBlock 整合
- [ ] 留言搜尋
- [ ] 訂閱分類管理
- [ ] 觀看歷史統計
- [ ] 自動畫質選擇

## 注意事項

- 請遵守 YouTube 服務條款
- 下載的內容僅供個人使用
- 請尊重創作者的版權

## 授權

MIT License

---

**讓 YouTube 更好用** 🎬
