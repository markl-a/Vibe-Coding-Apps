# 快速開始指南 🚀

## 📋 前置需求

- Node.js 18+
- npm 或 yarn
- AWS 帳號（用於部署）
- AI API Keys（OpenAI、Anthropic 等）

## 🔧 安裝步驟

### 1. 安裝依賴

```bash
npm install
```

### 2. 配置環境變數

複製環境變數範例文件：

```bash
cp .env.example .env
```

編輯 `.env` 文件，填入你的 API keys：

```env
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

### 3. 本地開發

啟動本地開發伺服器：

```bash
npm run dev
```

服務將在 `http://localhost:3001` 啟動

### 4. 測試 API

在另一個終端運行測試腳本：

```bash
node examples/test-ai-services.js
```

或者手動測試單個 API：

```bash
# AI 聊天助手
curl -X POST http://localhost:3001/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how can AI help developers?",
    "model": "gpt-3.5-turbo"
  }'

# 文本摘要
curl -X POST http://localhost:3001/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Long text here...",
    "maxLength": 100,
    "format": "paragraph"
  }'

# 情感分析
curl -X POST http://localhost:3001/sentiment-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is an amazing product!",
    "language": "en"
  }'
```

## 🚀 部署到 AWS

### 1. 配置 AWS 憑證

```bash
# 如果還沒安裝 Serverless Framework
npm install -g serverless

# 配置 AWS 憑證
serverless config credentials \
  --provider aws \
  --key YOUR_AWS_KEY \
  --secret YOUR_AWS_SECRET
```

### 2. 部署到開發環境

```bash
npm run deploy
# 或
serverless deploy --stage dev
```

### 3. 部署到生產環境

```bash
npm run deploy:prod
# 或
serverless deploy --stage prod
```

### 4. 部署特定函數

```bash
serverless deploy function -f aiChat
serverless deploy function -f textGeneration
```

## 📊 查看日誌

```bash
# 查看特定函數的日誌
serverless logs -f aiChat -t

# 查看最近的日誌
serverless logs -f aiChat --startTime 1h
```

## 🧪 運行測試

```bash
# 運行所有測試
npm test

# 運行特定測試
npm test -- ai-chat.test.js

# 生成覆蓋率報告
npm run test:coverage
```

## 📚 API 端點總覽

部署後，你會獲得以下端點：

| 端點 | 方法 | 功能 |
|-----|------|------|
| `/ai-chat` | POST | AI 聊天助手 |
| `/text-generation` | POST | 文本生成 |
| `/image-recognition` | POST | 圖片識別 |
| `/sentiment-analysis` | POST | 情感分析 |
| `/summarize` | POST | 文本摘要 |
| `/translate` | POST | 翻譯服務 |
| `/explain-code` | POST | 代碼解釋 |
| `/speech-to-text` | POST | 語音轉文字 |
| `/content-moderation` | POST | 內容審核 |

## 🔒 安全注意事項

1. **API Keys 保護**
   - 永遠不要將 API keys 提交到版本控制
   - 使用環境變數存儲敏感資訊
   - 定期輪換 API keys

2. **速率限制**
   - 實作請求速率限制
   - 監控 API 使用量
   - 設定預算警告

3. **輸入驗證**
   - 驗證所有輸入數據
   - 設定請求大小限制
   - 防止注入攻擊

## 💰 成本優化

1. **選擇合適的模型**
   - 簡單任務使用 GPT-3.5-turbo
   - 複雜任務使用 GPT-4
   - 考慮使用快取減少重複請求

2. **設定記憶體和超時**
   - 根據函數需求調整記憶體
   - 設定適當的超時時間
   - 監控執行時間和成本

3. **監控使用量**
   - 使用 CloudWatch 監控
   - 設定成本警報
   - 定期檢視使用報告

## 🛠️ 故障排除

### 問題：部署失敗

```bash
# 檢查 AWS 憑證
aws sts get-caller-identity

# 清理並重新部署
serverless remove
serverless deploy
```

### 問題：API 返回 401 錯誤

- 檢查環境變數是否正確設定
- 確認 API keys 有效且有足夠配額

### 問題：函數超時

- 增加 `serverless.yml` 中的 `timeout` 設定
- 優化代碼效能
- 考慮使用批次處理

## 📞 獲取幫助

- 查看完整文檔：[README.md](./README.md)
- 報告問題：建立 GitHub Issue
- 社群討論：加入我們的 Discord

---

**開始使用 AI 打造強大的 Serverless 應用！** 🚀
