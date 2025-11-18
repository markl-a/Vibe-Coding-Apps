# Team Chat - 快速開始指南

## 📦 前置要求

確保你已經安裝了以下工具：

- **Node.js** 18+ ([下載](https://nodejs.org/))
- **Docker** & **Docker Compose** ([下載](https://www.docker.com/))
- **Git**

## 🚀 方法一：使用 Docker（推薦）

最簡單的方式，一鍵啟動所有服務！

```bash
# 1. 進入專案目錄
cd team-chat

# 2. 啟動所有服務（數據庫、Redis、Elasticsearch、後端、前端）
docker-compose up -d

# 3. 查看服務狀態
docker-compose ps

# 4. 查看日誌
docker-compose logs -f backend
```

服務啟動後：
- 🌐 **前端**: http://localhost:3000
- 🔧 **後端 API**: http://localhost:3001
- 🗄️ **PostgreSQL**: localhost:5432
- 💾 **Redis**: localhost:6379
- 🔍 **Elasticsearch**: http://localhost:9200

### 停止服務

```bash
# 停止所有服務
docker-compose down

# 停止並刪除數據
docker-compose down -v
```

## 🛠️ 方法二：本地開發

如果你想在本地運行開發環境：

### 1. 安裝數據庫服務

```bash
# 只啟動數據庫服務
docker-compose up -d postgres redis elasticsearch

# 或者手動安裝 PostgreSQL、Redis、Elasticsearch
```

### 2. 配置後端

```bash
cd backend

# 安裝依賴
npm install

# 複製環境變數檔案
cp .env.example .env

# 編輯 .env 檔案，配置資料庫連接等
# vim .env 或使用你喜歡的編輯器

# 運行數據庫遷移
npm run migration:run

# 啟動後端開發服務器
npm run start:dev
```

後端將在 http://localhost:3001 運行

### 3. 配置前端

```bash
cd frontend

# 安裝依賴
npm install

# 創建環境變數檔案
cat > .env << EOF
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
EOF

# 啟動前端開發服務器
npm run dev
```

前端將在 http://localhost:3000 運行

## 🧪 測試功能

### 1. 註冊用戶

訪問 http://localhost:3000/register 創建新用戶

### 2. 登入

使用剛才創建的帳號登入

### 3. 測試即時通訊

1. 創建一個頻道
2. 發送訊息
3. 嘗試 @提及其他用戶
4. 添加 emoji 反應
5. 編輯/刪除訊息

### 4. 測試 AI 功能

#### 智能回覆建議

```bash
curl -X POST http://localhost:3001/api/ai/smart-replies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "明天下午3點開會討論新功能",
    "tone": "professional"
  }'
```

#### 訊息摘要

```bash
curl -X POST http://localhost:3001/api/ai/summarize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "messages": [
      "今天討論了新功能開發",
      "決定使用 React 和 TypeScript",
      "John 負責前端，Jane 負責後端",
      "預計兩週完成第一版"
    ]
  }'
```

#### 情感分析

```bash
curl -X POST http://localhost:3001/api/ai/sentiment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "這個功能做得太好了！非常感謝團隊的努力！"
  }'
```

#### 提取行動項

```bash
curl -X POST http://localhost:3001/api/ai/action-items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "messages": [
      "會議決定：John 負責完成前端開發",
      "Jane 需要在週五前完成 API 文檔",
      "下週一進行代碼審查"
    ]
  }'
```

#### 訊息翻譯

```bash
curl -X POST http://localhost:3001/api/ai/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Hello, how are you today?",
    "targetLanguage": "中文"
  }'
```

## 🔑 獲取 JWT Token

```bash
# 1. 註冊用戶
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "displayName": "Test User"
  }'

# 2. 登入獲取 token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

將返回的 `access_token` 用於後續 API 請求。

## 📊 監控和日誌

### 查看 Docker 日誌

```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### 進入容器

```bash
# 進入後端容器
docker-compose exec backend sh

# 進入數據庫容器
docker-compose exec postgres psql -U postgres -d teamchat

# 進入 Redis
docker-compose exec redis redis-cli
```

## 🔧 開發技巧

### 熱重載

使用 `docker-compose up` 時，代碼變更會自動觸發重新加載：
- 後端：NestJS 監聽文件變更
- 前端：Vite 提供熱模塊替換（HMR）

### 數據庫管理

```bash
# 創建新的遷移
cd backend
npm run migration:generate -- -n MigrationName

# 運行遷移
npm run migration:run

# 回滾遷移
npm run migration:revert
```

### 測試

```bash
cd backend

# 單元測試
npm run test

# 測試覆蓋率
npm run test:cov

# E2E 測試
npm run test:e2e

# 監聽模式
npm run test:watch
```

## 🎨 自定義配置

### 修改端口

編輯 `docker-compose.yml`：

```yaml
services:
  backend:
    ports:
      - "3002:3001"  # 將後端映射到 3002

  frontend:
    ports:
      - "3001:3000"  # 將前端映射到 3001
```

### 添加環境變數

編輯 `backend/.env`：

```env
# 添加你自己的配置
CUSTOM_VARIABLE=value
```

### 配置 OpenAI

為了使用 AI 功能，你需要配置 OpenAI API Key：

1. 訪問 https://platform.openai.com/api-keys
2. 創建一個新的 API Key
3. 在 `backend/.env` 中設置：

```env
OPENAI_API_KEY=sk-your-api-key-here
```

## ❓ 常見問題

### Q: 端口已被佔用？

```bash
# 查看端口使用情況
lsof -i :3000
lsof -i :3001
lsof -i :5432

# 停止佔用端口的進程
kill -9 <PID>
```

### Q: 數據庫連接失敗？

確保 PostgreSQL 服務正在運行：

```bash
docker-compose ps postgres
docker-compose logs postgres
```

### Q: Redis 連接失敗？

```bash
docker-compose ps redis
docker-compose restart redis
```

### Q: 前端無法連接後端？

檢查 CORS 設置和 API URL：
- 後端 `.env`: `CORS_ORIGIN=http://localhost:3000`
- 前端 `.env`: `VITE_API_URL=http://localhost:3001`

## 📚 更多資源

- [完整 API 文檔](./docs/API.md)
- [數據庫架構](./docs/DATABASE.md)
- [部署指南](./docs/DEPLOYMENT.md)
- [貢獻指南](./CONTRIBUTING.md)

## 🤝 需要幫助？

如果遇到問題，請：
1. 查看日誌：`docker-compose logs -f`
2. 檢查 GitHub Issues
3. 聯繫開發團隊

---

**🎉 現在你可以開始使用 Team Chat 了！享受協作的樂趣！**
