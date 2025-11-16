# AWS Lambda Functions 示例 ⚡
🤖 **AI-Driven Lambda Functions** 🚀

使用 AWS Lambda 構建的無伺服器函數示例集合。

## 📦 函數列表

### 1. Hello World
基礎的 Lambda 函數示例

### 2. Image Resize
圖片縮放處理函數
- 觸發器: S3 上傳事件
- 功能: 自動生成縮圖

### 3. Email Sender
郵件發送函數
- 觸發器: API Gateway
- 功能: 發送通知郵件

### 4. Data Processor
數據處理函數
- 觸發器: SQS 隊列
- 功能: 批次數據處理

## 🚀 使用 Serverless Framework 部署

```bash
# 安裝 Serverless Framework
npm install -g serverless

# 配置 AWS 憑證
serverless config credentials --provider aws --key YOUR_KEY --secret YOUR_SECRET

# 部署所有函數
serverless deploy

# 部署單個函數
serverless deploy function -f functionName

# 查看日誌
serverless logs -f functionName -t

# 移除所有資源
serverless remove
```

## 📋 serverless.yml 配置範例

```yaml
service: my-lambda-functions

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1

functions:
  hello:
    handler: handler.hello
    events:
      - http:
          path: hello
          method: get

  processImage:
    handler: handler.processImage
    events:
      - s3:
          bucket: my-images
          event: s3:ObjectCreated:*
```

## 💰 成本優化

- 合理設定記憶體大小
- 優化冷啟動時間
- 使用 Lambda Layers 共享依賴
- 實作適當的超時設定

---

**AI 輔助開發高效 Lambda 函數！** 🚀
