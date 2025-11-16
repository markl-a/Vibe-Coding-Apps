# 實時文檔協作系統 (Real-time Document Collaboration)

一個功能完整的實時文檔協作平台，類似 Google Docs，支持多人同時編輯、評論、版本控制等功能。

## 功能特性

### 核心功能
- ✅ 實時協作編輯（多人同時編輯）
- ✅ 富文本編輯器（支持格式化）
- ✅ Markdown 支持
- ✅ 實時游標顯示（顯示其他用戶位置）
- ✅ 版本歷史記錄
- ✅ 評論和批註功能
- ✅ 文檔權限管理
- ✅ 文檔分享（鏈接分享）
- ✅ 文件夾組織

### 進階功能
- ✅ 離線編輯同步
- ✅ 變更追蹤
- ✅ 衝突解決（CRDT）
- ✅ 評論線程
- ✅ 任務清單
- ✅ 表格支持
- ✅ 圖片嵌入
- ✅ 程式碼塊高亮
- ✅ 導出功能（PDF, Word, Markdown）

### AI 智能功能
- ✅ AI 寫作助手
- ✅ 自動摘要生成
- ✅ 語法和風格建議
- ✅ 智能格式化
- ✅ 內容翻譯
- ✅ 自動目錄生成

## 技術架構

### 後端技術棧
- **框架**: NestJS + TypeScript
- **數據庫**: PostgreSQL (文檔元數據) + MongoDB (文檔內容)
- **實時同步**: Socket.IO + CRDT (Yjs)
- **認證**: JWT + Passport
- **文件存儲**: AWS S3 / MinIO
- **快取**: Redis
- **搜索**: Elasticsearch

### 前端技術棧
- **框架**: React 18 + TypeScript
- **編輯器**: TipTap / ProseMirror
- **CRDT**: Yjs
- **狀態管理**: Zustand
- **UI 組件**: Tailwind CSS + Headless UI
- **實時通訊**: Socket.IO Client

## 項目結構

```
realtime-docs/
├── backend/                 # 後端服務
│   ├── src/
│   │   ├── modules/        # 功能模組
│   │   │   ├── auth/       # 認證模組
│   │   │   ├── user/       # 用戶模組
│   │   │   ├── document/   # 文檔模組
│   │   │   └── collaboration/ # 協作模組
│   │   ├── common/         # 共用工具
│   │   └── config/         # 配置文件
│   └── package.json
├── frontend/               # 前端應用
│   ├── src/
│   │   ├── components/     # React 組件
│   │   │   ├── Editor/    # 編輯器組件
│   │   │   ├── Comments/  # 評論組件
│   │   │   └── Sidebar/   # 側邊欄組件
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
- MongoDB 6+
- Redis 6+

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

## CRDT 協同編輯原理

本系統使用 **Yjs** CRDT 庫實現無衝突的實時協作編輯：

### CRDT (Conflict-free Replicated Data Type)
- 保證最終一致性
- 無需中央協調器
- 支持離線編輯
- 自動衝突解決

### 工作流程
```
用戶 A 編輯 → Yjs 生成變更 → WebSocket 廣播 → 其他用戶接收 → Yjs 合併變更 → 編輯器更新
```

## API 端點

### 文檔管理
- `GET /api/documents` - 獲取文檔列表
- `POST /api/documents` - 創建新文檔
- `GET /api/documents/:id` - 獲取文檔詳情
- `PATCH /api/documents/:id` - 更新文檔
- `DELETE /api/documents/:id` - 刪除文檔

### 協作編輯
- `GET /api/documents/:id/content` - 獲取文檔內容
- `GET /api/documents/:id/collaborators` - 獲取協作者列表
- `POST /api/documents/:id/share` - 分享文檔

### 版本歷史
- `GET /api/documents/:id/versions` - 獲取版本列表
- `GET /api/documents/:id/versions/:versionId` - 獲取特定版本
- `POST /api/documents/:id/versions/:versionId/restore` - 恢復到某個版本

### 評論
- `GET /api/documents/:id/comments` - 獲取評論列表
- `POST /api/documents/:id/comments` - 添加評論
- `PATCH /api/comments/:id` - 更新評論
- `DELETE /api/comments/:id` - 刪除評論

### WebSocket 事件

#### 客戶端發送
- `join-document` - 加入文檔編輯
- `leave-document` - 離開文檔
- `sync-update` - 同步文檔更新
- `cursor-position` - 游標位置更新

#### 服務器發送
- `document-update` - 文檔內容更新
- `user-joined` - 用戶加入
- `user-left` - 用戶離開
- `cursor-update` - 游標位置變化
- `sync-response` - 同步響應

## 數據庫模型

### Document (文檔)
```typescript
{
  id: string
  title: string
  content: string // Yjs 文檔的編碼版本
  ownerId: string
  folderId?: string
  isPublic: boolean
  version: number
  lastEditedBy: string
  lastEditedAt: Date
  createdAt: Date
  updatedAt: Date
}
```

### DocumentVersion (版本)
```typescript
{
  id: string
  documentId: string
  version: number
  content: string
  changes: string
  createdBy: string
  createdAt: Date
}
```

### Comment (評論)
```typescript
{
  id: string
  documentId: string
  userId: string
  content: string
  position: {
    from: number
    to: number
  }
  threadId?: string
  isResolved: boolean
  createdAt: Date
  updatedAt: Date
}
```

### DocumentPermission (權限)
```typescript
{
  id: string
  documentId: string
  userId?: string
  role: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER'
  shareLink?: string
  expiresAt?: Date
}
```

## 編輯器功能

### 文本格式
- 粗體、斜體、下劃線、刪除線
- 標題（H1-H6）
- 列表（有序、無序、任務清單）
- 引用塊
- 程式碼塊（語法高亮）
- 鏈接
- 圖片

### 高級功能
- 表格
- 水平分隔線
- 提及用戶 (@mention)
- Emoji 支持
- LaTeX 公式
- 檔案嵌入

## 導出格式

支持導出為以下格式：
- PDF
- Microsoft Word (.docx)
- Markdown (.md)
- HTML
- 純文本 (.txt)

## 性能優化

- ✅ 增量同步（僅傳輸變更部分）
- ✅ 壓縮傳輸數據
- ✅ 延遲加載大型文檔
- ✅ 虛擬滾動
- ✅ Redis 快取
- ✅ CDN 加速

## 安全措施

- ✅ 端到端加密（可選）
- ✅ 權限檢查
- ✅ XSS 防護
- ✅ CSRF 防護
- ✅ 速率限制
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

### 環境變數
參見 `.env.example` 文件

## 未來計劃

- [ ] 語音輸入
- [ ] AI 輔助寫作
- [ ] 模板系統
- [ ] 更多導出格式
- [ ] 移動應用
- [ ] 離線模式增強

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 授權

MIT License
