# 視訊會議系統 (Video Conference System)

一個功能完整的企業級視訊會議平台，類似 Zoom，支持視訊通話、屏幕共享、會議錄製等功能。

## 功能特性

### 核心功能
- ✅ 高清視訊通話（HD/Full HD）
- ✅ 多人視訊會議（最多 100 人）
- ✅ 屏幕共享（全屏/應用窗口）
- ✅ 音訊和視訊控制
- ✅ 實時聊天
- ✅ 舉手發言
- ✅ 虛擬背景
- ✅ 會議室等候室
- ✅ 會議密碼保護

### 進階功能
- ✅ 會議錄製（雲端/本地）
- ✅ 直播功能
- ✅ 分組討論室（Breakout Rooms）
- ✅ 白板功能
- ✅ 投票功能
- ✅ 會議排程
- ✅ 自動字幕（語音轉文字）
- ✅ 多語言翻譯
- ✅ 畫廊視圖/演講者視圖

### AI 智能功能
- ✅ 智能降噪
- ✅ 背景模糊/替換
- ✅ 實時字幕生成
- ✅ 會議摘要自動生成
- ✅ 行動項提取
- ✅ 發言者識別
- ✅ 表情識別

## 技術架構

### 後端技術棧
- **框架**: NestJS + TypeScript
- **數據庫**: PostgreSQL (會議元數據) + MongoDB (聊天記錄)
- **WebRTC**: MediaSoup / Jitsi
- **信令服務器**: Socket.IO
- **認證**: JWT + Passport
- **錄製**: FFmpeg
- **流媒體**: HLS / DASH
- **存儲**: AWS S3 / MinIO

### 前端技術棧
- **框架**: React 18 + TypeScript
- **WebRTC**: Simple-peer / PeerJS
- **UI 組件**: Tailwind CSS + Headless UI
- **狀態管理**: Zustand
- **實時通訊**: Socket.IO Client
- **媒體處理**: Canvas API / WebGL

## 項目結構

```
video-conference/
├── backend/                 # 後端服務
│   ├── src/
│   │   ├── modules/        # 功能模組
│   │   │   ├── auth/       # 認證模組
│   │   │   ├── user/       # 用戶模組
│   │   │   ├── meeting/    # 會議模組
│   │   │   └── recording/  # 錄製模組
│   │   ├── common/         # 共用工具
│   │   └── config/         # 配置文件
│   └── package.json
├── frontend/               # 前端應用
│   ├── src/
│   │   ├── components/     # React 組件
│   │   │   ├── Video/     # 視訊組件
│   │   │   ├── Controls/  # 控制按鈕
│   │   │   └── Chat/      # 聊天組件
│   │   ├── pages/          # 頁面
│   │   ├── hooks/          # 自定義 Hooks
│   │   └── services/       # API 服務
│   └── package.json
└── shared/                 # 共享類型定義
```

## 快速開始

### 環境要求
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- FFmpeg 5+

### 安裝步驟

1. **安裝後端依賴**
```bash
cd backend
npm install
```

2. **配置環境變數**
```bash
cp .env.example .env
```

3. **運行數據庫遷移**
```bash
npm run migration:run
```

4. **啟動後端服務**
```bash
npm run start:dev
```

5. **安裝前端依賴**
```bash
cd ../frontend
npm install
```

6. **啟動前端開發服務器**
```bash
npm run dev
```

## WebRTC 架構

### P2P 模式（小型會議，2-4 人）
```
用戶 A ←→ 用戶 B
   ↓         ↑
用戶 C ←→ 用戶 D
```

### SFU 模式（大型會議，4+ 人）
```
用戶 A → SFU → 用戶 B
用戶 C → SFU → 用戶 D
用戶 E → SFU → 用戶 F
```

使用 **MediaSoup** 作為 SFU（Selective Forwarding Unit）服務器，提供：
- 低延遲
- 高擴展性
- 帶寬優化
- 錄製支持

## API 端點

### 會議管理
- `GET /api/meetings` - 獲取會議列表
- `POST /api/meetings` - 創建會議
- `GET /api/meetings/:id` - 獲取會議詳情
- `PATCH /api/meetings/:id` - 更新會議
- `DELETE /api/meetings/:id` - 刪除會議
- `POST /api/meetings/:id/join` - 加入會議

### 參與者管理
- `GET /api/meetings/:id/participants` - 獲取參與者列表
- `POST /api/meetings/:id/participants/:userId/mute` - 靜音參與者
- `POST /api/meetings/:id/participants/:userId/remove` - 移除參與者

### 錄製管理
- `POST /api/meetings/:id/recordings/start` - 開始錄製
- `POST /api/meetings/:id/recordings/stop` - 停止錄製
- `GET /api/meetings/:id/recordings` - 獲取錄製列表
- `GET /api/recordings/:id/download` - 下載錄製

### WebSocket 事件

#### 客戶端發送
- `join-meeting` - 加入會議
- `leave-meeting` - 離開會議
- `toggle-video` - 切換視訊
- `toggle-audio` - 切換音訊
- `share-screen` - 分享屏幕
- `send-message` - 發送聊天訊息
- `raise-hand` - 舉手
- `webrtc-offer` - WebRTC Offer
- `webrtc-answer` - WebRTC Answer
- `webrtc-ice-candidate` - ICE Candidate

#### 服務器發送
- `user-joined` - 用戶加入
- `user-left` - 用戶離開
- `participant-video-changed` - 視訊狀態變更
- `participant-audio-changed` - 音訊狀態變更
- `screen-share-started` - 屏幕分享開始
- `screen-share-stopped` - 屏幕分享停止
- `message-received` - 收到聊天訊息
- `hand-raised` - 有人舉手
- `webrtc-offer` - WebRTC Offer
- `webrtc-answer` - WebRTC Answer
- `webrtc-ice-candidate` - ICE Candidate

## 數據庫模型

### Meeting (會議)
```typescript
{
  id: string
  title: string
  description?: string
  hostId: string
  scheduledStart: Date
  scheduledEnd: Date
  actualStart?: Date
  actualEnd?: Date
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'ENDED' | 'CANCELLED'
  settings: {
    requirePassword: boolean
    password?: string
    allowRecording: boolean
    muteOnEntry: boolean
    waitingRoom: boolean
    allowScreenShare: boolean
    maxParticipants: number
  }
  joinUrl: string
  createdAt: Date
  updatedAt: Date
}
```

### Participant (參與者)
```typescript
{
  id: string
  meetingId: string
  userId: string
  role: 'HOST' | 'CO_HOST' | 'PARTICIPANT'
  isVideoOn: boolean
  isAudioOn: boolean
  isScreenSharing: boolean
  isHandRaised: boolean
  joinedAt: Date
  leftAt?: Date
}
```

### Recording (錄製)
```typescript
{
  id: string
  meetingId: string
  fileName: string
  fileSize: number
  duration: number
  format: 'MP4' | 'WEBM'
  storageUrl: string
  status: 'RECORDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  startedAt: Date
  endedAt: Date
}
```

## 視訊處理功能

### 視訊效果
- 背景模糊
- 虛擬背景（自定義圖片）
- 美顏效果
- 鏡像翻轉
- 亮度調整

### 音訊處理
- 降噪
- 回聲消除
- 自動增益控制
- 音量標準化

## 網絡優化

- ✅ 自適應碼率（根據帶寬調整）
- ✅ 丟包恢復
- ✅ 抖動緩衝
- ✅ 前向糾錯（FEC）
- ✅ NACK 重傳
- ✅ 帶寬估計

## 性能優化

- ✅ 視訊編解碼（VP8/VP9/H.264）
- ✅ 分辨率自適應
- ✅ 幀率控制
- ✅ Simulcast（同時發送多個質量的流）
- ✅ SVC（可伸縮視訊編碼）

## 安全措施

- ✅ 端到端加密（E2EE）
- ✅ DTLS-SRTP 加密
- ✅ 會議密碼
- ✅ 等候室
- ✅ 主持人控制
- ✅ 參與者權限管理
- ✅ 審計日誌

## 測試

```bash
# 後端測試
cd backend
npm run test

# 前端測試
cd frontend
npm run test
```

## 部署

### Docker 部署
```bash
docker-compose up -d
```

### TURN/STUN 服務器配置
```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password'
    }
  ]
}
```

## 未來計劃

- [ ] AR 濾鏡
- [ ] 實時翻譯
- [ ] 手勢識別
- [ ] 3D 虛擬會議室
- [ ] VR 支持
- [ ] AI 助手
- [ ] 移動應用

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 授權

MIT License
