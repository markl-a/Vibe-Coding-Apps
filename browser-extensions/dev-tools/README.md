# 🛠️ 開發者工具 - Developer Tools Extension

> 🚀 **AI 輔助開發的專業開發者瀏覽器工具集**

一個為開發者打造的多功能瀏覽器擴充功能，包含 API 測試、JSON 格式化、顏色選擇器、正規表示式測試等實用工具。

## 📋 專案目標

為開發者提供一站式的日常開發工具，無需離開瀏覽器即可：
- 快速測試 API 端點
- 格式化和驗證 JSON/XML
- 選擇和管理顏色
- 測試正規表示式
- Base64 編碼/解碼
- 時間戳轉換

## 🎯 核心功能

### 1. API 測試工具
- 🌐 支援 GET、POST、PUT、DELETE、PATCH 等方法
- 📝 自訂請求標頭和請求體
- 🔐 支援多種認證方式（Basic, Bearer, API Key）
- 💾 請求歷史紀錄
- 📋 一鍵複製 curl 指令
- 🎨 語法高亮的回應顯示

### 2. JSON/XML 工具
- ✨ JSON 格式化和壓縮
- ✅ JSON Schema 驗證
- 🔍 JSONPath 查詢
- 🌳 樹狀結構顯示
- 📊 XML 轉 JSON
- 🎯 錯誤定位和修正建議

### 3. 顏色工具
- 🎨 拾色器（螢幕取色）
- 🔄 多種格式轉換（HEX, RGB, HSL, HSV）
- 📚 顏色歷史和收藏
- 🎭 調色盤生成器
- ♿ 對比度檢查器（WCAG）
- 🌈 漸層生成器

### 4. 編碼工具
- 🔐 Base64 編碼/解碼
- 🌐 URL 編碼/解碼
- 🔤 HTML 實體編碼
- 🔑 Hash 生成（MD5, SHA-1, SHA-256）
- 🎲 UUID/GUID 生成器
- 📝 JWT 解碼器

### 5. 正規表示式測試器 ✅
- ✅ 即時匹配測試
- 🎯 群組擷取顯示
- 📚 常用正規表示式範本
- 🤖 AI 輔助生成正規表示式 ✅ 🆕
  - 支援 20+ 常用模式
  - 自然語言描述轉正則
  - 中英文關鍵詞識別
  - 自動生成說明和測試範例
- 📖 完整語法參考

### 6. 時間工具 ✅
- ⏰ Unix 時間戳轉換（秒/毫秒）
- 🕐 即時當前時間顯示
- 🧮 時間計算器（加減運算）
- ⚡ 快速預設（今天/昨天/一週前等）
- 📅 日期時間格式轉換
- 🔄 相對時間顯示

### 7. Markdown 預覽器 ✅ 🆕
- 📝 即時 Markdown 渲染
- 🎨 語法高亮（190+ 程式語言）
- 🛠️ 完整工具列（15+ 格式化按鈕）
- 👁️ 3 種檢視模式（分割/編輯/預覽）
- 🌗 深色/淺色主題切換
- 💾 自動儲存草稿
- ⬇️ 多格式導出（MD/HTML）
- 📊 智能統計（字元/字數/行數）

## 🛠️ 技術棧

### 前端框架
- **React 18** + **TypeScript**
- **Tailwind CSS** - UI 樣式
- **Monaco Editor** - 程式碼編輯器
- **React Query** - 資料管理

### 瀏覽器 API
- **Chrome Storage API** - 歷史記錄
- **Chrome Tabs API** - 頁面互動
- **Chrome DevTools API** - 開發者工具整合
- **Clipboard API** - 剪貼簿操作

### 工具庫
- **Axios** - HTTP 請求
- **Prism.js** - 語法高亮
- **react-colorful** - 顏色選擇器
- **crypto-js** - 加密工具
- **date-fns** - 日期處理

### 建置工具
- **Vite** + **CRXJS**
- **ESLint** + **Prettier**
- **Vitest** - 單元測試

## 🚀 快速開始

### 安裝依賴

```bash
cd browser-extensions/dev-tools
npm install
```

### 開發模式

```bash
npm run dev

# 載入到 Chrome:
# chrome://extensions/ -> 開發者模式 -> 載入未封裝項目 -> 選擇 dist/
```

### 建置

```bash
npm run build
```

## 📁 專案結構

```
dev-tools/
├── README.md
├── package.json
├── manifest.json
├── src/
│   ├── popup/
│   │   ├── Popup.tsx
│   │   └── index.html
│   ├── devtools/
│   │   ├── DevToolsPanel.tsx
│   │   └── devtools.html
│   ├── components/
│   │   ├── ApiTester/
│   │   │   ├── RequestForm.tsx
│   │   │   ├── ResponseViewer.tsx
│   │   │   └── HistoryList.tsx
│   │   ├── JsonTools/
│   │   │   ├── JsonFormatter.tsx
│   │   │   ├── JsonValidator.tsx
│   │   │   └── JsonPath.tsx
│   │   ├── ColorPicker/
│   │   │   ├── ColorWheel.tsx
│   │   │   ├── ColorHistory.tsx
│   │   │   └── PaletteGenerator.tsx
│   │   ├── EncodingTools/
│   │   │   ├── Base64Tool.tsx
│   │   │   ├── UrlEncoder.tsx
│   │   │   └── HashGenerator.tsx
│   │   ├── RegexTester/
│   │   │   ├── RegexInput.tsx
│   │   │   ├── TestString.tsx
│   │   │   └── MatchResults.tsx
│   │   └── TimeTools/
│   │       ├── TimestampConverter.tsx
│   │       └── TimezoneConverter.tsx
│   ├── hooks/
│   │   ├── useApiRequest.ts
│   │   ├── useStorage.ts
│   │   └── useClipboard.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── storage.ts
│   │   └── encoder.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       └── converters.ts
└── tests/
```

## 💻 核心程式碼範例

### API 測試服務

```typescript
// src/services/api.ts
import axios, { AxiosRequestConfig } from 'axios';

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  auth?: {
    type: 'basic' | 'bearer' | 'apikey';
    credentials: Record<string, string>;
  };
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
}

export class ApiService {
  async sendRequest(request: ApiRequest): Promise<ApiResponse> {
    const startTime = Date.now();

    const config: AxiosRequestConfig = {
      method: request.method,
      url: request.url,
      headers: request.headers,
      data: request.body,
    };

    // 處理認證
    if (request.auth) {
      switch (request.auth.type) {
        case 'basic':
          config.auth = {
            username: request.auth.credentials.username,
            password: request.auth.credentials.password,
          };
          break;
        case 'bearer':
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${request.auth.credentials.token}`,
          };
          break;
        case 'apikey':
          config.headers = {
            ...config.headers,
            [request.auth.credentials.keyName]: request.auth.credentials.keyValue,
          };
          break;
      }
    }

    try {
      const response = await axios(config);
      const endTime = Date.now();

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        data: response.data,
        time: endTime - startTime,
      };
    } catch (error: any) {
      const endTime = Date.now();

      if (error.response) {
        return {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          time: endTime - startTime,
        };
      }

      throw error;
    }
  }

  generateCurl(request: ApiRequest): string {
    let curl = `curl -X ${request.method}`;

    // 添加標頭
    if (request.headers) {
      Object.entries(request.headers).forEach(([key, value]) => {
        curl += ` \\\n  -H "${key}: ${value}"`;
      });
    }

    // 添加請求體
    if (request.body) {
      const body = typeof request.body === 'string'
        ? request.body
        : JSON.stringify(request.body);
      curl += ` \\\n  -d '${body}'`;
    }

    curl += ` \\\n  "${request.url}"`;

    return curl;
  }
}
```

### JSON 格式化工具

```typescript
// src/utils/formatters.ts
export class JsonFormatter {
  static format(json: string, indent: number = 2): string {
    try {
      const obj = JSON.parse(json);
      return JSON.stringify(obj, null, indent);
    } catch (error) {
      throw new Error('Invalid JSON');
    }
  }

  static minify(json: string): string {
    try {
      const obj = JSON.parse(json);
      return JSON.stringify(obj);
    } catch (error) {
      throw new Error('Invalid JSON');
    }
  }

  static validate(json: string): { valid: boolean; error?: string } {
    try {
      JSON.parse(json);
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  static highlight(json: string): string {
    // 使用 Prism.js 進行語法高亮
    return Prism.highlight(
      json,
      Prism.languages.json,
      'json'
    );
  }
}
```

### 顏色轉換工具

```typescript
// src/utils/converters.ts
export class ColorConverter {
  static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  static rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .toUpperCase();
  }

  static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  static checkContrast(color1: string, color2: string): {
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  } {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    const l1 = this.relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = this.relativeLuminance(rgb2.r, rgb2.g, rgb2.b);

    const ratio = l1 > l2
      ? (l1 + 0.05) / (l2 + 0.05)
      : (l2 + 0.05) / (l1 + 0.05);

    return {
      ratio: Math.round(ratio * 100) / 100,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7
    };
  }

  private static relativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
}
```

## 🤖 AI 功能整合

### AI 輔助正規表示式生成

```typescript
// src/services/ai.ts
export class AIRegexHelper {
  async generateRegex(description: string): Promise<string> {
    // 使用 OpenAI API 生成正規表示式
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
            content: 'You are a regex expert. Generate regex patterns based on descriptions.'
          },
          {
            role: 'user',
            content: `Generate a regex pattern for: ${description}`
          }
        ]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
```

## 🎨 UI 設計

### 主要介面
1. **工具選擇器** - 快速切換不同工具
2. **編輯區域** - Monaco Editor 提供程式碼編輯體驗
3. **結果顯示** - 語法高亮的結果展示
4. **歷史面板** - 快速存取歷史記錄

### 設計原則
- 深色主題優先（開發者友善）
- 鍵盤快捷鍵支援
- 響應式布局
- 清晰的視覺回饋

## 🧪 開發路線圖

### Phase 1: 基礎工具 ✅
- [x] 專案設置
- [x] API 測試工具
- [x] JSON 格式化工具
- [x] Base64 編碼工具
- [x] 顏色選擇器
- [x] HTTP 頭查看器

### Phase 2: 進階工具 ✅
- [x] 正規表示式測試器
- [x] Hash 生成器
- [x] JWT 解碼器
- [x] 時間戳轉換器 🆕
- [x] Markdown 預覽器 🆕

### Phase 3: AI 整合 ✅
- [x] AI 正規表示式生成 🆕
- [ ] API 請求建議
- [ ] JSON Schema 自動生成
- [ ] Markdown 寫作輔助

### Phase 4: 開發者工具整合
- [ ] Network 面板整合
- [ ] Console 輸出捕捉
- [ ] 效能分析
- [ ] WebSocket 測試

### Phase 5: 完善與發布
- [ ] 快捷鍵系統
- [ ] 主題自訂
- [ ] 匯入/匯出設定
- [ ] SQL 格式化工具
- [ ] 發布到商店

## 🎉 最新更新 (2025-11-18)

### 新增工具 🆕
1. **時間戳轉換器** - 完整的 Unix 時間戳與日期時間轉換工具
   - 即時顯示當前時間
   - 雙向轉換（時間戳 ⇄ 日期）
   - 時間計算器（加減運算）
   - 8 個快速預設按鈕

2. **Markdown 預覽器** - 功能完整的 Markdown 編輯與預覽工具
   - 即時渲染預覽
   - 語法高亮（190+ 語言）
   - 完整工具列
   - 多種檢視模式
   - 深色/淺色主題
   - 導出功能（MD/HTML）

### 功能增強 ⚡
3. **Regex Tester - AI 輔助生成**
   - 自然語言描述轉正則表達式
   - 支援 20+ 常用模式
   - 智能關鍵詞匹配
   - 自動生成說明和測試範例

## 📚 使用 AI 工具開發

### AI 開發建議
- 使用 Claude/ChatGPT 生成工具函數
- Cursor/Copilot 輔助 UI 元件
- AI 協助測試案例撰寫
- 自動生成 API 文檔

## ⚙️ 設定選項

- 預設編輯器主題
- 自動格式化選項
- 快捷鍵自訂
- 歷史記錄限制
- 語法高亮顏色

## 🔒 隱私與安全

- ✅ 所有操作完全本地執行
- ✅ API 請求不經過第三方伺服器
- ✅ 敏感資料不會被記錄
- ✅ 可選擇不儲存歷史記錄

## 🤝 貢獻指南

歡迎貢獻新工具和功能！

建議的新工具：
- GraphQL 查詢測試
- WebSocket 測試
- Markdown 預覽
- SQL 格式化
- YAML 驗證

## 📄 授權

MIT License

---

**為開發者打造的終極瀏覽器工具集** 🚀

最後更新: 2025-11-16
狀態: 🚧 開發中
