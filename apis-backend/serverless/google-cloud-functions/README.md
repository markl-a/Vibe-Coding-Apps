# Google Cloud Functions 示例 ☁️
🤖 **AI-Powered Google Cloud Functions** 🚀

使用 Google Cloud Functions 構建的無伺服器函數集合。

## 📋 功能列表

### 1️⃣ HTTP 觸發函數

#### Hello World
基礎的 HTTP 端點示例

**端點**: `GET/POST /hello`

#### User API
完整的 RESTful API 示例

**端點**:
- `GET /users` - 獲取用戶列表
- `POST /users` - 創建用戶
- `GET /users/:id` - 獲取單個用戶
- `PUT /users/:id` - 更新用戶
- `DELETE /users/:id` - 刪除用戶

#### Image Optimizer
圖片優化和處理服務

**功能**:
- 圖片壓縮
- 格式轉換（JPEG, PNG, WebP）
- 尺寸調整
- 自動優化

#### Email Sender
郵件發送服務（使用 SendGrid）

**功能**:
- 發送單封郵件
- 批量郵件發送
- HTML 郵件支援
- 模板郵件

### 2️⃣ 事件觸發函數

#### Cloud Storage 觸發器
當文件上傳到 Cloud Storage 時自動處理

**功能**:
- 圖片自動處理
- 文件元數據提取
- 病毒掃描
- 備份到其他儲存桶

#### Pub/Sub 觸發器
處理 Pub/Sub 訊息

**功能**:
- 異步任務處理
- 事件通知
- 數據管道
- 批次處理

#### Firestore 觸發器
響應 Firestore 數據庫變更

**功能**:
- 數據驗證
- 自動計算
- 通知發送
- 審計日誌

### 3️⃣ 定時函數

#### Scheduled Tasks
定時任務函數（使用 Cloud Scheduler）

**功能**:
- 數據備份
- 報告生成
- 清理過期數據
- 健康檢查

## 🚀 快速開始

### 前置需求

```bash
# 安裝 Google Cloud SDK
# macOS
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash

# Windows
# 下載安裝程式：https://cloud.google.com/sdk/docs/install

# 初始化 gcloud
gcloud init

# 設定專案
gcloud config set project YOUR_PROJECT_ID
```

### 本地開發

```bash
# 安裝依賴
npm install

# 安裝 Functions Framework
npm install -g @google-cloud/functions-framework

# 本地運行 HTTP 函數
npm run dev:hello
# 或
functions-framework --target=helloWorld --port=8080

# 測試函數
curl http://localhost:8080
```

### 部署函數

```bash
# 部署 HTTP 函數
gcloud functions deploy helloWorld \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region asia-east1

# 部署 Storage 觸發函數
gcloud functions deploy processImage \
  --runtime nodejs18 \
  --trigger-resource YOUR_BUCKET_NAME \
  --trigger-event google.storage.object.finalize \
  --region asia-east1

# 部署 Pub/Sub 觸發函數
gcloud functions deploy processPubSubMessage \
  --runtime nodejs18 \
  --trigger-topic YOUR_TOPIC_NAME \
  --region asia-east1

# 部署 Firestore 觸發函數
gcloud functions deploy onUserCreate \
  --runtime nodejs18 \
  --trigger-event providers/cloud.firestore/eventTypes/document.create \
  --trigger-resource projects/YOUR_PROJECT/databases/(default)/documents/users/{userId} \
  --region asia-east1

# 部署定時函數
gcloud functions deploy scheduledTask \
  --runtime nodejs18 \
  --trigger-topic scheduled-tasks \
  --region asia-east1

# 創建定時任務（每天凌晨 2 點）
gcloud scheduler jobs create pubsub daily-cleanup \
  --schedule="0 2 * * *" \
  --topic=scheduled-tasks \
  --message-body='{"task":"cleanup"}' \
  --time-zone="Asia/Taipei"
```

## 📝 環境變數配置

在 GCP Console 或使用命令行設定環境變數：

```bash
# 部署時設定環境變數
gcloud functions deploy myFunction \
  --set-env-vars KEY1=VALUE1,KEY2=VALUE2

# 或使用 .env.yaml 文件
cat > .env.yaml <<EOF
SENDGRID_API_KEY: your-sendgrid-api-key
DATABASE_URL: your-database-url
API_KEY: your-api-key
EOF

gcloud functions deploy myFunction \
  --env-vars-file .env.yaml
```

## 🔧 專案結構

```
google-cloud-functions/
├── functions/
│   ├── http/
│   │   ├── hello.js          # Hello World
│   │   ├── users.js          # User API
│   │   ├── image-optimizer.js # 圖片優化
│   │   └── email-sender.js   # 郵件發送
│   ├── storage/
│   │   └── process-image.js  # Storage 觸發
│   ├── pubsub/
│   │   └── process-message.js # Pub/Sub 觸發
│   ├── firestore/
│   │   └── on-user-create.js # Firestore 觸發
│   └── scheduled/
│       └── daily-tasks.js     # 定時任務
├── package.json
├── .gcloudignore
├── .env.example
└── README.md
```

## 📊 監控和日誌

### 查看日誌

```bash
# 查看函數日誌
gcloud functions logs read helloWorld --limit 50

# 實時查看日誌
gcloud functions logs read helloWorld --limit 50 --follow

# 過濾日誌
gcloud functions logs read helloWorld \
  --filter "severity=ERROR" \
  --limit 20
```

### 查看指標

在 GCP Console 中：
1. 前往 Cloud Functions
2. 選擇函數
3. 點擊「指標」標籤

可以查看：
- 調用次數
- 執行時間
- 錯誤率
- 記憶體使用
- 網路流量

## 💰 成本優化

1. **選擇適當的記憶體配置**
   - 根據實際需求調整記憶體
   - 記憶體越大，CPU 性能越好，但成本也越高

2. **優化執行時間**
   - 減少冷啟動時間
   - 優化代碼效能
   - 使用連接池

3. **設定超時時間**
   - 避免函數長時間運行
   - 預設 60 秒，最大 540 秒

4. **使用免費額度**
   - 每月 200 萬次調用免費
   - 40 萬 GB-秒計算時間免費
   - 20 萬 GHz-秒計算時間免費
   - 5GB 網路出流量免費

## 🔒 安全最佳實踐

1. **認證和授權**
   ```bash
   # 需要認證的函數
   gcloud functions deploy secureFunction \
     --no-allow-unauthenticated

   # 使用 IAM 控制訪問
   gcloud functions add-iam-policy-binding secureFunction \
     --member="user:user@example.com" \
     --role="roles/cloudfunctions.invoker"
   ```

2. **環境變數安全**
   - 使用 Secret Manager 存儲敏感資訊
   - 不要在代碼中硬編碼密鑰

3. **網路安全**
   - 使用 VPC 連接器
   - 限制出站流量
   - 設定 IP 白名單

## 🧪 測試

### 本地測試

```bash
# 運行測試
npm test

# 測試覆蓋率
npm run test:coverage
```

### 手動測試

```bash
# 測試 HTTP 函數
curl https://REGION-PROJECT_ID.cloudfunctions.net/helloWorld

# 使用 gcloud 測試
gcloud functions call helloWorld \
  --data '{"name":"Test"}'
```

## 📚 使用範例

### HTTP 函數

```javascript
// functions/http/hello.js
exports.helloWorld = (req, res) => {
  const name = req.query.name || req.body.name || 'World';
  res.status(200).json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString()
  });
};
```

### Storage 觸發函數

```javascript
// functions/storage/process-image.js
const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');

exports.processImage = async (file, context) => {
  const storage = new Storage();
  const bucket = storage.bucket(file.bucket);

  // 下載圖片
  const [imageBuffer] = await bucket.file(file.name).download();

  // 處理圖片
  const thumbnail = await sharp(imageBuffer)
    .resize(200, 200)
    .toBuffer();

  // 上傳縮圖
  await bucket.file(`thumbnails/${file.name}`).save(thumbnail);

  console.log(`Processed: ${file.name}`);
};
```

### Pub/Sub 觸發函數

```javascript
// functions/pubsub/process-message.js
exports.processPubSubMessage = (message, context) => {
  const data = Buffer.from(message.data, 'base64').toString();
  console.log('Received message:', data);

  // 處理訊息
  const payload = JSON.parse(data);
  // ... 執行業務邏輯

  return Promise.resolve();
};
```

## 🌐 相關資源

- [Google Cloud Functions 文檔](https://cloud.google.com/functions/docs)
- [Functions Framework](https://github.com/GoogleCloudPlatform/functions-framework-nodejs)
- [Cloud Console](https://console.cloud.google.com/functions)
- [定價](https://cloud.google.com/functions/pricing)

## 🎯 最佳實踐總結

✅ **函數設計**
- 保持函數小而專注
- 避免全局變數
- 重用實例化的對象

✅ **錯誤處理**
- 實作完善的錯誤處理
- 記錄詳細的錯誤資訊
- 返回適當的 HTTP 狀態碼

✅ **性能優化**
- 優化依賴項大小
- 使用連接池
- 快取常用數據

✅ **監控和維護**
- 設定告警
- 定期檢視日誌
- 監控成本

---

**使用 Google Cloud Functions 打造高效的 Serverless 應用！** 🚀
