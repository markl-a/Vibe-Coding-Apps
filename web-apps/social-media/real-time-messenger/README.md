# Real-Time Messenger

一個功能完整的即時通訊應用，使用 Next.js 14、Socket.io 和 Zustand 構建。

## 功能特色

- **即時通訊**：使用 Socket.io 實現即時訊息傳送和接收
- **多聊天室**：支援創建和加入多個聊天室
- **在線用戶列表**：即時顯示當前房間的在線用戶
- **打字指示器**：顯示其他用戶正在輸入的狀態
- **表情符號支援**：內建表情符號選擇器
- **訊息時間戳**：所有訊息都帶有時間標記
- **響應式設計**：完美適配桌面和移動設備
- **用戶持久化**：使用 Zustand persist 保存用戶資訊

## 技術棧

### 前端
- **Next.js 14** - React 框架（使用 App Router）
- **TypeScript** - 類型安全
- **Tailwind CSS** - 樣式框架
- **Zustand** - 狀態管理
- **React Hook Form** - 表單處理
- **Zod** - Schema 驗證
- **Socket.io Client** - WebSocket 客戶端
- **date-fns** - 日期格式化
- **Lucide React** - 圖標庫

### 開發工具
- **ESLint** - 代碼檢查
- **PostCSS** - CSS 處理
- **Autoprefixer** - CSS 自動添加前綴

## 快速開始

### 前置需求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Socket.io 伺服器（需要單獨運行）

### 安裝

1. 克隆專案或導航到專案目錄：

```bash
cd real-time-messenger
```

2. 安裝依賴：

```bash
npm install
```

3. 複製環境變數檔案：

```bash
cp .env.example .env
```

4. 配置環境變數（編輯 `.env` 文件）：

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 運行開發伺服器

```bash
npm run dev
```

應用將在 [http://localhost:3000](http://localhost:3000) 運行。

### 構建生產版本

```bash
npm run build
npm start
```

## Socket.io 伺服器設置

此應用需要一個 Socket.io 伺服器才能正常工作。以下是基本的伺服器實現示例：

### 伺服器範例（server.js）

```javascript
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// 儲存房間和用戶資料
const rooms = new Map()
const users = new Map()

// 預設房間
const defaultRooms = [
  { id: 'general', name: '一般討論', description: '自由交流的空間', userCount: 0 },
  { id: 'tech', name: '技術討論', description: '技術相關話題', userCount: 0 },
  { id: 'random', name: '隨機聊天', description: '隨便聊聊', userCount: 0 },
]

defaultRooms.forEach(room => {
  rooms.set(room.id, { ...room, messages: [], users: new Set() })
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  const userId = socket.handshake.auth.userId
  const nickname = socket.handshake.auth.nickname

  if (userId && nickname) {
    users.set(socket.id, { id: userId, nickname, joinedAt: new Date() })
  }

  // 發送房間列表
  socket.on('room:list', () => {
    const roomList = Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      userCount: room.users.size,
    }))
    socket.emit('room:list', roomList)
  })

  // 創建房間
  socket.on('room:create', (data) => {
    const roomId = `room_${Date.now()}`
    const newRoom = {
      id: roomId,
      name: data.name,
      description: data.description,
      userCount: 0,
      messages: [],
      users: new Set(),
    }
    rooms.set(roomId, newRoom)

    // 廣播新房間
    io.emit('room:list', Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      userCount: room.users.size,
    })))
  })

  // 加入房間
  socket.on('room:join', (data) => {
    const room = rooms.get(data.roomId)
    if (room) {
      socket.join(data.roomId)
      room.users.add(socket.id)

      const user = users.get(socket.id)

      // 發送歷史訊息
      socket.emit('message:history', room.messages)

      // 發送在線用戶列表
      const onlineUsers = Array.from(room.users).map(id => users.get(id)).filter(Boolean)
      io.to(data.roomId).emit('users:online', onlineUsers)

      // 通知其他用戶
      if (user) {
        socket.to(data.roomId).emit('user:joined', user)
      }

      // 更新房間列表
      io.emit('room:list', Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        description: room.description,
        userCount: room.users.size,
      })))
    }
  })

  // 離開房間
  socket.on('room:leave', (data) => {
    const room = rooms.get(data.roomId)
    if (room) {
      socket.leave(data.roomId)
      room.users.delete(socket.id)

      const user = users.get(socket.id)

      // 通知其他用戶
      if (user) {
        socket.to(data.roomId).emit('user:left', user)
      }

      // 更新在線用戶列表
      const onlineUsers = Array.from(room.users).map(id => users.get(id)).filter(Boolean)
      io.to(data.roomId).emit('users:online', onlineUsers)

      // 更新房間列表
      io.emit('room:list', Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        description: room.description,
        userCount: room.users.size,
      })))
    }
  })

  // 發送訊息
  socket.on('message:send', (data) => {
    const message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      userId: data.userId,
      username: data.username,
      content: data.content,
      timestamp: data.timestamp,
      roomId: data.roomId,
    }

    const room = rooms.get(data.roomId)
    if (room) {
      room.messages.push(message)
      io.to(data.roomId).emit('message:new', message)
    }
  })

  // 打字狀態
  socket.on('typing:start', (data) => {
    socket.to(data.roomId).emit('typing:start', {
      userId: data.userId,
      username: data.username,
      roomId: data.roomId,
    })
  })

  socket.on('typing:stop', (data) => {
    socket.to(data.roomId).emit('typing:stop', {
      userId: data.userId,
      roomId: data.roomId,
    })
  })

  // 斷線處理
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)

    // 從所有房間移除用戶
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id)

        const user = users.get(socket.id)
        if (user) {
          socket.to(roomId).emit('user:left', user)
        }

        const onlineUsers = Array.from(room.users).map(id => users.get(id)).filter(Boolean)
        io.to(roomId).emit('users:online', onlineUsers)
      }
    })

    users.delete(socket.id)

    // 更新房間列表
    io.emit('room:list', Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      userCount: room.users.size,
    })))
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})
```

### 伺服器 package.json

```json
{
  "name": "real-time-messenger-server",
  "version": "1.0.0",
  "description": "Socket.io server for real-time messenger",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### 啟動伺服器

```bash
# 在伺服器目錄中
npm install
npm start
```

伺服器將在 `http://localhost:3001` 運行。

## 專案結構

```
real-time-messenger/
├── app/
│   ├── chat/
│   │   └── page.tsx          # 聊天主頁面
│   ├── globals.css            # 全局樣式
│   ├── layout.tsx             # 根布局
│   └── page.tsx               # 首頁（登入頁）
├── components/
│   ├── ChatRoom.tsx           # 聊天室主組件
│   ├── EmojiPicker.tsx        # 表情符號選擇器
│   ├── MessageInput.tsx       # 訊息輸入組件
│   ├── MessageList.tsx        # 訊息列表組件
│   ├── RoomList.tsx           # 聊天室列表組件
│   ├── TypingIndicator.tsx    # 打字指示器組件
│   └── UserList.tsx           # 用戶列表組件
├── lib/
│   └── socket.ts              # Socket.io 客戶端配置
├── store/
│   ├── chatStore.ts           # 聊天狀態管理
│   └── userStore.ts           # 用戶狀態管理
├── types/
│   └── index.ts               # TypeScript 類型定義
├── .env.example               # 環境變數範例
├── .gitignore                 # Git 忽略文件
├── next.config.js             # Next.js 配置
├── package.json               # 專案依賴
├── postcss.config.js          # PostCSS 配置
├── README.md                  # 專案文檔
├── tailwind.config.ts         # Tailwind CSS 配置
└── tsconfig.json              # TypeScript 配置
```

## 主要功能說明

### 用戶認證
- 用戶輸入暱稱即可進入聊天室
- 使用 Zustand persist 保存用戶資訊
- 支援登出功能

### 聊天室管理
- 查看所有可用的聊天室
- 創建新的聊天室
- 加入/離開聊天室
- 顯示房間內的用戶數量

### 訊息功能
- 即時發送和接收訊息
- 訊息帶有時間戳
- 自動滾動到最新訊息
- 支援多行訊息（Shift + Enter 換行）
- Enter 鍵快速發送

### 表情符號
- 內建表情符號選擇器
- 支援多個分類（常用、手勢、表情、其他）
- 點擊插入到訊息中

### 打字指示器
- 顯示正在輸入的用戶
- 2 秒無輸入後自動取消
- 支援多人同時輸入顯示

### 在線狀態
- 即時顯示連線狀態
- 顯示房間內的在線用戶
- 用戶加入/離開通知

## 環境變數

| 變數名稱 | 說明 | 預設值 |
|---------|------|--------|
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io 伺服器地址 | `http://localhost:3001` |
| `NEXT_PUBLIC_APP_NAME` | 應用名稱 | `Real-Time Messenger` |
| `NEXT_PUBLIC_ENABLE_EMOJI` | 啟用表情符號 | `true` |
| `NEXT_PUBLIC_ENABLE_TYPING_INDICATOR` | 啟用打字指示器 | `true` |
| `NEXT_PUBLIC_MAX_MESSAGE_LENGTH` | 訊息最大長度 | `500` |

## 開發指南

### 添加新功能

1. **添加新的 Socket 事件**：
   - 在 `types/index.ts` 中添加事件類型
   - 在 `app/chat/page.tsx` 中添加事件監聽器
   - 在伺服器端實現對應的事件處理

2. **添加新的 UI 組件**：
   - 在 `components/` 目錄下創建新組件
   - 使用 Tailwind CSS 進行樣式設計
   - 確保響應式設計

3. **狀態管理**：
   - 在 `store/` 目錄下管理應用狀態
   - 使用 Zustand 創建新的 store

### 代碼規範

- 使用 TypeScript 嚴格模式
- 遵循 ESLint 規則
- 組件使用函數式寫法
- 優先使用 Hooks

### 測試

```bash
# 類型檢查
npm run type-check

# Lint 檢查
npm run lint
```

## 部署

### Vercel 部署（推薦）

1. 將專案推送到 GitHub
2. 在 Vercel 中導入專案
3. 配置環境變數
4. 部署

### 其他平台

確保配置以下環境變數：
- `NEXT_PUBLIC_SOCKET_URL`：您的 Socket.io 伺服器地址

## 瀏覽器支援

- Chrome（最新版本）
- Firefox（最新版本）
- Safari（最新版本）
- Edge（最新版本）

## 常見問題

### 無法連接到伺服器
- 確認 Socket.io 伺服器正在運行
- 檢查 `.env` 文件中的 `NEXT_PUBLIC_SOCKET_URL` 是否正確
- 檢查防火牆設置

### 訊息沒有即時更新
- 檢查網路連線
- 查看瀏覽器控制台是否有錯誤
- 確認 Socket.io 連接狀態

### 表情符號顯示異常
- 確保瀏覽器支援 Unicode 表情符號
- 更新瀏覽器到最新版本

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 授權

MIT License

## 聯絡方式

如有問題或建議，請開啟 Issue。

---

**Enjoy chatting in real-time!** 🚀
