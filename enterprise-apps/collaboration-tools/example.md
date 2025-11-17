# Collaboration Tools - 協作工具範例

此類別包含 TypeScript/Node.js 專案，提供團隊協作相關功能。

## 子專案列表

### 1. 📚 Knowledge Base (知識庫系統)
**技術棧**: TypeScript, Node.js, Express
**功能**: 團隊知識管理、文件分類、搜尋功能

### 2. 📝 Realtime Docs (即時協作文件)
**技術棧**: TypeScript, Node.js, Socket.io
**功能**: 多人即時編輯、版本控制、評論功能

### 3. 💬 Team Chat (團隊聊天)
**技術棧**: TypeScript, Node.js, WebSocket
**功能**: 即時通訊、頻道管理、檔案分享

### 4. 🎥 Video Conference (視訊會議)
**技術棧**: TypeScript, Node.js, WebRTC
**功能**: 視訊通話、螢幕分享、會議錄製

## 運行指南

由於這些專案使用 TypeScript/Node.js，運行步驟如下：

```bash
# 進入任一子專案目錄
cd knowledge-base  # 或其他子專案

# 安裝依賴
npm install

# 運行開發服務器
npm run dev

# 或運行生產版本
npm run build
npm start
```

## 注意事項

⚠️ 這些專案是 TypeScript/Node.js 專案，與其他 Python 專案的技術棧不同。

確保您已安裝：
- Node.js (v14+)
- npm 或 yarn
- TypeScript (通常作為開發依賴自動安裝)

## TypeScript 範例

如需在這些專案中添加功能，請使用 TypeScript 語法：

```typescript
// 範例：創建一個簡單的協作工具 API
import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/documents', (req, res) => {
  const { title, content } = req.body;
  // 處理文件創建邏輯
  res.json({ success: true, id: Date.now() });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## 推薦學習資源

- TypeScript 官方文檔: https://www.typescriptlang.org/docs/
- Node.js 指南: https://nodejs.org/en/docs/
- Express 框架: https://expressjs.com/
