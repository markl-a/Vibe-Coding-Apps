# 🤖 Electron AI 共享模組

此目錄包含所有 Electron 應用共享的 AI 輔助功能模組。

## 📦 模組說明

### ai-helper.js

提供完整的 AI 輔助功能，包括：

#### 圖像處理
- `recognizeText(imageBase64)` - OCR 文字識別
- `describeImage(imageBase64)` - 圖片內容描述

#### 文字處理
- `summarizeText(text, maxLength)` - 生成文字摘要
- `classifyText(text, categories)` - 文字分類
- `improveSuggestions(text, type)` - 內容改進建議
- `autocomplete(text, context)` - 自動完成文字
- `translate(text, targetLang)` - 文字翻譯
- `extractKeywords(text, count)` - 關鍵字提取
- `analyzeSentiment(text)` - 情感分析

#### 程式碼輔助
- `explainCode(code, language)` - 程式碼解釋
- `optimizeCode(code, language)` - 程式碼優化建議
- `generateCode(description, language)` - 程式碼生成

#### 生產力輔助
- `analyzePriority(tasks)` - 任務優先級分析
- `suggestTasks(context)` - 智能任務建議
- `suggestFileName(content, extension)` - 文件名建議

## 🚀 快速開始

### 1. 安裝依賴

在你的 Electron 應用中安裝所需依賴：

```bash
npm install node-fetch
```

### 2. 配置 API Key

複製配置文件範例：

```bash
cp ai-config.example.js ai-config.js
```

編輯 `ai-config.js` 並填入你的 OpenAI API Key。

### 3. 在主程序中使用

```javascript
// main.js
const AIHelper = require('../shared/ai-helper');
const config = require('../shared/ai-config');

const aiHelper = new AIHelper(config.OPENAI_API_KEY);

// 註冊 IPC 處理器
ipcMain.handle('ai-summarize', async (event, text) => {
  try {
    const summary = await aiHelper.summarizeText(text);
    return { success: true, result: summary };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-ocr', async (event, imageBase64) => {
  try {
    const text = await aiHelper.recognizeText(imageBase64);
    return { success: true, result: text };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### 4. 在渲染程序中調用

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ai', {
  summarize: (text) => ipcRenderer.invoke('ai-summarize', text),
  ocr: (imageBase64) => ipcRenderer.invoke('ai-ocr', imageBase64)
});
```

```javascript
// renderer.js
async function summarizeText() {
  const text = document.getElementById('input').value;
  const result = await window.ai.summarize(text);

  if (result.success) {
    console.log('摘要：', result.result);
  } else {
    console.error('錯誤：', result.error);
  }
}
```

## 📝 使用範例

### 範例 1: OCR 文字識別

```javascript
const imageBase64 = 'data:image/png;base64,...';
const text = await aiHelper.recognizeText(imageBase64);
console.log('識別的文字：', text);
```

### 範例 2: 文字摘要

```javascript
const longText = '這是一篇很長的文章...';
const summary = await aiHelper.summarizeText(longText, 100);
console.log('摘要：', summary);
```

### 範例 3: 智能分類

```javascript
const text = '明天要完成專案報告';
const category = await aiHelper.classifyText(text, ['工作', '個人', '學習']);
console.log('分類：', category);
```

### 範例 4: 程式碼解釋

```javascript
const code = `
function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}
`;
const explanation = await aiHelper.explainCode(code, 'javascript');
console.log('解釋：', explanation);
```

### 範例 5: 任務優先級分析

```javascript
const tasks = [
  '完成專案報告',
  '回覆客戶郵件',
  '學習新技術',
  '運動健身'
];
const analysis = await aiHelper.analyzePriority(tasks);
console.log('優先級分析：', analysis);
```

## ⚙️ 進階配置

### 自定義模型

```javascript
const aiHelper = new AIHelper(apiKey);
aiHelper.model = 'gpt-4o';  // 使用更強大的模型
```

### 調整生成參數

```javascript
const result = await aiHelper.makeRequest(messages, {
  temperature: 0.9,    // 更有創意
  max_tokens: 2000,    // 更長的回應
  stream: false
});
```

### 錯誤處理

```javascript
try {
  const result = await aiHelper.summarizeText(text);
  console.log(result);
} catch (error) {
  if (error.message.includes('API key')) {
    console.error('請檢查 API Key 設定');
  } else if (error.message.includes('quota')) {
    console.error('API 額度不足');
  } else {
    console.error('未知錯誤：', error.message);
  }
}
```

## 💡 最佳實踐

### 1. API Key 安全

不要將 API Key 硬編碼在程式碼中：

```javascript
// ❌ 不好
const aiHelper = new AIHelper('sk-xxxxx');

// ✅ 好
const config = require('./ai-config');
const aiHelper = new AIHelper(config.OPENAI_API_KEY);

// ✅ 更好 - 使用環境變數
const aiHelper = new AIHelper(process.env.OPENAI_API_KEY);
```

### 2. 錯誤處理

始終處理可能的錯誤：

```javascript
async function safeAICall(text) {
  try {
    return await aiHelper.summarizeText(text);
  } catch (error) {
    console.error('AI 調用失敗：', error);
    return '摘要生成失敗，請稍後再試';
  }
}
```

### 3. 使用快取

對於相同的請求，使用快取避免重複調用：

```javascript
const cache = new Map();

async function getCachedSummary(text) {
  if (cache.has(text)) {
    return cache.get(text);
  }

  const summary = await aiHelper.summarizeText(text);
  cache.set(text, summary);
  return summary;
}
```

### 4. 顯示載入狀態

AI 請求可能需要幾秒鐘，顯示載入狀態：

```javascript
async function summarizeWithLoading(text) {
  showLoadingSpinner();
  try {
    const summary = await aiHelper.summarizeText(text);
    return summary;
  } finally {
    hideLoadingSpinner();
  }
}
```

### 5. 限制輸入長度

避免發送過長的文字：

```javascript
const MAX_LENGTH = 10000;

async function safeSummarize(text) {
  if (text.length > MAX_LENGTH) {
    text = text.substring(0, MAX_LENGTH);
  }
  return await aiHelper.summarizeText(text);
}
```

## 🔧 故障排除

### API Key 無效

確認 API Key 正確且有效：
- 檢查 `ai-config.js` 中的 API Key
- 確認 API Key 沒有過期
- 確認有足夠的 API 額度

### 請求超時

調整超時設定或使用較短的輸入：

```javascript
// 在 ai-helper.js 中添加超時設定
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

const response = await fetch(url, {
  signal: controller.signal,
  ...options
});

clearTimeout(timeout);
```

### 速率限制

實現請求節流：

```javascript
class RateLimiter {
  constructor(maxRequests, interval) {
    this.maxRequests = maxRequests;
    this.interval = interval;
    this.requests = [];
  }

  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.interval);

    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.interval - (now - this.requests[0]);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.throttle();
    }

    this.requests.push(now);
  }
}

const limiter = new RateLimiter(3, 60000); // 每分鐘最多 3 次請求

async function limitedAICall(text) {
  await limiter.throttle();
  return await aiHelper.summarizeText(text);
}
```

## 📊 成本優化

### 使用經濟模型

```javascript
// 對於簡單任務使用 gpt-4o-mini
aiHelper.model = 'gpt-4o-mini';

// 對於複雜任務使用 gpt-4o
aiHelper.model = 'gpt-4o';
```

### 限制 Token 使用

```javascript
// 限制最大 token 數
const result = await aiHelper.makeRequest(messages, {
  max_tokens: 500  // 減少成本
});
```

### 批次處理

將多個小請求合併為一個大請求：

```javascript
async function batchSummarize(texts) {
  const combined = texts.join('\n---\n');
  const summary = await aiHelper.summarizeText(combined);
  return summary.split('---');
}
```

## 📄 授權

MIT License

---

**作者**: Vibe Coding Apps
**更新日期**: 2025-11-18
