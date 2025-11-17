# Real-Time Messenger Server

Socket.io 伺服器端實作，用於支援即時通訊應用。

## 快速開始

### 安裝依賴

```bash
npm install
```

### 運行伺服器

開發模式（使用 nodemon 自動重啟）：
```bash
npm run dev
```

生產模式：
```bash
npm start
```

伺服器將在 `http://localhost:3001` 運行。

## 環境變數

可選的環境變數：

- `PORT`: 伺服器端口（預設：3001）
- `CLIENT_URL`: 允許的客戶端 URL（預設：http://localhost:3000）

## API 端點

### Health Check

```
GET /health
```

返回伺服器狀態資訊。

## Socket.io 事件

### 客戶端發送的事件

- `room:list` - 請求聊天室列表
- `room:create` - 創建新聊天室
- `room:join` - 加入聊天室
- `room:leave` - 離開聊天室
- `message:send` - 發送訊息
- `typing:start` - 開始輸入
- `typing:stop` - 停止輸入

### 伺服器發送的事件

- `room:list` - 聊天室列表
- `message:new` - 新訊息
- `message:history` - 訊息歷史
- `users:online` - 在線用戶列表
- `user:joined` - 用戶加入
- `user:left` - 用戶離開
- `typing:start` - 用戶開始輸入
- `typing:stop` - 用戶停止輸入

## 資料結構

### Room

```javascript
{
  id: string,
  name: string,
  description: string,
  userCount: number
}
```

### Message

```javascript
{
  id: string,
  userId: string,
  username: string,
  content: string,
  timestamp: string,
  roomId: string
}
```

### User

```javascript
{
  id: string,
  nickname: string,
  joinedAt: Date
}
```

## 預設聊天室

伺服器啟動時會自動創建三個預設聊天室：

1. **一般討論** (`general`) - 自由交流的空間
2. **技術討論** (`tech`) - 技術相關話題
3. **隨機聊天** (`random`) - 隨便聊聊

## 注意事項

- 此伺服器將所有資料存儲在記憶體中，重啟後資料將會遺失
- 每個聊天室最多保留 100 條訊息
- 適用於開發和測試環境
- 生產環境建議使用資料庫存儲資料

## 部署建議

### 使用 PM2

```bash
npm install -g pm2
pm2 start server.js --name messenger-server
```

### 使用 Docker

創建 `Dockerfile`：

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

構建和運行：

```bash
docker build -t messenger-server .
docker run -p 3001:3001 messenger-server
```

## 開發

### 添加新功能

1. 在 `server.js` 中添加新的 Socket.io 事件處理器
2. 更新客戶端代碼以使用新事件
3. 更新文檔

### 日誌

伺服器會記錄以下事件：
- 用戶連接/斷開
- 房間創建
- 用戶加入/離開房間
- 訊息發送

## 授權

MIT License
