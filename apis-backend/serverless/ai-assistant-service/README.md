# AI 助手服務 (AI Assistant Service) 🤖
🤖 **AI-Powered Serverless Functions** 🚀

使用 AI 技術構建的智能無伺服器函數服務集合。

## 📋 功能列表

### 1️⃣ AI 聊天助手 (AI Chat)
智能對話 API，支援多輪對話

**端點**: `POST /ai-chat`

**功能**:
- 智能問答
- 多輪對話支援
- 上下文記憶
- 支援多種 AI 模型（OpenAI GPT-4, Claude, Gemini）

### 2️⃣ 文本生成 (Text Generation)
AI 驅動的內容創作工具

**端點**: `POST /text-generation`

**功能**:
- 文章撰寫
- 社交媒體內容生成
- 產品描述生成
- Email 草稿生成

### 3️⃣ 圖片識別 (Image Recognition)
智能圖片分析服務

**端點**: `POST /image-recognition`

**功能**:
- 物體識別
- 場景分析
- 文字提取（OCR）
- 圖片內容描述生成

### 4️⃣ 情感分析 (Sentiment Analysis)
文本情感和意圖分析

**端點**: `POST /sentiment-analysis`

**功能**:
- 情感分類（正面/負面/中性）
- 情感強度評分
- 關鍵詞提取
- 主題分類

### 5️⃣ 文本摘要 (Text Summarization)
智能文本摘要生成

**端點**: `POST /summarize`

**功能**:
- 長文章摘要
- 會議記錄摘要
- 新聞摘要
- 可調整摘要長度

### 6️⃣ 翻譯服務 (Translation)
AI 驅動的多語言翻譯

**端點**: `POST /translate`

**功能**:
- 支援 100+ 語言
- 保留格式翻譯
- 術語一致性
- 上下文理解

### 7️⃣ 代碼解釋 (Code Explanation)
智能代碼分析和解釋

**端點**: `POST /explain-code`

**功能**:
- 代碼功能解釋
- 複雜度分析
- 優化建議
- 支援多種程式語言

### 8️⃣ 語音轉文字 (Speech to Text)
音訊轉錄服務

**端點**: `POST /speech-to-text`

**功能**:
- 多語言轉錄
- 時間戳記
- 說話者識別
- 標點符號自動添加

### 9️⃣ 內容審核 (Content Moderation)
AI 內容安全檢測

**端點**: `POST /content-moderation`

**功能**:
- 不當內容檢測
- 垃圾訊息過濾
- 敏感資訊識別
- 安全評分

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 環境變數配置

創建 `.env` 文件：

```env
# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google Cloud (for Vision API)
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key

# AWS (for Rekognition, Transcribe)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Azure (for Computer Vision, Cognitive Services)
AZURE_COGNITIVE_KEY=your_azure_key
AZURE_COGNITIVE_ENDPOINT=your_azure_endpoint
```

### 本地測試

```bash
# 使用 Serverless Offline
npm run dev

# 或使用 Serverless Framework
serverless offline
```

### 部署到 AWS Lambda

```bash
serverless deploy

# 部署特定函數
serverless deploy function -f aiChat
```

## 📝 API 使用範例

### AI 聊天助手

```bash
curl -X POST https://your-api.com/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "解釋什麼是量子計算",
    "conversationId": "conv-123",
    "model": "gpt-4"
  }'
```

**回應**:
```json
{
  "success": true,
  "response": "量子計算是一種利用量子力學原理...",
  "conversationId": "conv-123",
  "model": "gpt-4",
  "tokensUsed": 150
}
```

### 圖片識別

```bash
curl -X POST https://your-api.com/image-recognition \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "features": ["objects", "text", "faces"]
  }'
```

**回應**:
```json
{
  "success": true,
  "objects": [
    { "name": "cat", "confidence": 0.95 },
    { "name": "sofa", "confidence": 0.87 }
  ],
  "text": ["Welcome Home"],
  "faces": 2,
  "description": "A cat sitting on a sofa in a living room"
}
```

### 情感分析

```bash
curl -X POST https://your-api.com/sentiment-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This product is absolutely amazing! Best purchase ever!",
    "language": "en"
  }'
```

**回應**:
```json
{
  "success": true,
  "sentiment": "positive",
  "score": 0.95,
  "emotions": {
    "joy": 0.85,
    "surprise": 0.10,
    "neutral": 0.05
  },
  "keywords": ["amazing", "best", "purchase"]
}
```

### 文本摘要

```bash
curl -X POST https://your-api.com/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Long article text here...",
    "maxLength": 100,
    "format": "bullet-points"
  }'
```

### 翻譯服務

```bash
curl -X POST https://your-api.com/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you?",
    "from": "en",
    "to": "zh-TW"
  }'
```

**回應**:
```json
{
  "success": true,
  "translatedText": "你好，你好嗎？",
  "from": "en",
  "to": "zh-TW",
  "confidence": 0.99
}
```

## 🔧 支援的 AI 服務

### OpenAI
- GPT-4, GPT-3.5
- DALL-E (圖片生成)
- Whisper (語音轉文字)
- Embeddings

### Anthropic Claude
- Claude 3 Opus, Sonnet, Haiku
- 多模態輸入支援

### Google Cloud AI
- Vertex AI
- Vision AI
- Natural Language AI
- Translation API

### AWS AI Services
- Rekognition (圖片/影片分析)
- Comprehend (文本分析)
- Translate
- Transcribe (語音轉文字)
- Polly (文字轉語音)

### Azure Cognitive Services
- Computer Vision
- Text Analytics
- Translator
- Speech Services

## 💰 成本優化

1. **快取常見請求** - 減少重複的 AI API 調用
2. **批次處理** - 合併多個請求一次處理
3. **選擇適當模型** - 簡單任務使用較小模型
4. **設定請求限制** - 防止濫用和過度使用
5. **監控使用量** - 追蹤 API 使用和成本

## 🔒 安全最佳實踐

- ✅ 使用環境變數存儲 API Keys
- ✅ 實作速率限制
- ✅ 輸入驗證和清理
- ✅ 內容過濾和審核
- ✅ 記錄和監控異常活動
- ✅ 使用 API Gateway 進行認證

## 📊 監控和日誌

```javascript
// 結構化日誌範例
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  service: 'ai-chat',
  userId: 'user-123',
  model: 'gpt-4',
  tokensUsed: 150,
  duration: 1200,
  status: 'success'
}));
```

## 🧪 測試

```bash
# 運行所有測試
npm test

# 運行特定測試
npm test -- ai-chat.test.js

# 覆蓋率報告
npm run test:coverage
```

## 📚 相關資源

- [OpenAI API 文檔](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Google Cloud AI](https://cloud.google.com/products/ai)
- [AWS AI Services](https://aws.amazon.com/machine-learning/)
- [Azure Cognitive Services](https://azure.microsoft.com/services/cognitive-services/)

## 🎯 使用場景

- 💬 **客服機器人** - 自動化客戶支援
- 📝 **內容創作** - 自動生成文章、社交媒體內容
- 🔍 **智能搜尋** - 語義搜索和推薦
- 📊 **數據分析** - 自動化報告生成
- 🌐 **多語言支援** - 即時翻譯服務
- 🎨 **創意工具** - AI 輔助設計和創作
- 🔒 **安全審核** - 自動內容審核和過濾

---

**使用 AI 打造智能 Serverless 應用！** 🚀
