# 知識庫管理系統 (Knowledge Base Management System)

一個功能完整的企業級知識庫管理平台，類似 Confluence，支持 Wiki 頁面、文檔組織、全文搜索等功能。

## 功能特性

### 核心功能
- ✅ Wiki 頁面編輯（Markdown/富文本）
- ✅ 層級式頁面組織
- ✅ 全文搜索
- ✅ 版本歷史
- ✅ 頁面模板
- ✅ 標籤分類
- ✅ 評論功能
- ✅ 頁面權限管理
- ✅ 頁面分享

### 進階功能
- ✅ 知識樹導航
- ✅ 頁面關聯和引用
- ✅ 附件管理
- ✅ 圖表嵌入
- ✅ 程式碼高亮
- ✅ 數學公式支持
- ✅ 頁面導出（PDF, Word, HTML）
- ✅ 批量操作
- ✅ 頁面統計分析

### AI 智能功能
- ✅ 語義搜索
- ✅ 智能推薦
- ✅ 自動摘要
- ✅ 內容分類
- ✅ 相關頁面推薦
- ✅ 自動標籤生成
- ✅ 問答系統（RAG）

## 技術架構

### 後端技術棧
- **框架**: NestJS + TypeScript
- **數據庫**: PostgreSQL (頁面元數據)
- **搜索引擎**: Elasticsearch / Meilisearch
- **向量數據庫**: Pinecone / Qdrant（語義搜索）
- **認證**: JWT + Passport
- **文件存儲**: AWS S3 / MinIO
- **快取**: Redis
- **AI**: OpenAI API

### 前端技術棧
- **框架**: React 18 + TypeScript
- **編輯器**: TipTap / MDX Editor
- **狀態管理**: Zustand
- **UI 組件**: Tailwind CSS + Shadcn/ui
- **路由**: React Router v6
- **HTTP**: Axios
- **搜索**: InstantSearch.js

## 項目結構

```
knowledge-base/
├── backend/                 # 後端服務
│   ├── src/
│   │   ├── modules/        # 功能模組
│   │   │   ├── auth/       # 認證模組
│   │   │   ├── user/       # 用戶模組
│   │   │   ├── wiki/       # Wiki 模組
│   │   │   └── search/     # 搜索模組
│   │   ├── common/         # 共用工具
│   │   └── config/         # 配置文件
│   └── package.json
├── frontend/               # 前端應用
│   ├── src/
│   │   ├── components/     # React 組件
│   │   │   ├── Editor/    # 編輯器組件
│   │   │   ├── Tree/      # 樹形導航
│   │   │   └── Search/    # 搜索組件
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
- Elasticsearch 8+ 或 Meilisearch
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

## API 端點

### Wiki 頁面管理
- `GET /api/pages` - 獲取頁面列表
- `POST /api/pages` - 創建新頁面
- `GET /api/pages/:id` - 獲取頁面詳情
- `PATCH /api/pages/:id` - 更新頁面
- `DELETE /api/pages/:id` - 刪除頁面
- `GET /api/pages/:id/children` - 獲取子頁面

### 搜索
- `GET /api/search` - 搜索頁面
- `GET /api/search/suggest` - 搜索建議
- `GET /api/search/semantic` - 語義搜索

### 版本歷史
- `GET /api/pages/:id/versions` - 獲取版本列表
- `GET /api/pages/:id/versions/:versionId` - 獲取特定版本
- `POST /api/pages/:id/versions/:versionId/restore` - 恢復版本

### 評論
- `GET /api/pages/:id/comments` - 獲取評論列表
- `POST /api/pages/:id/comments` - 添加評論
- `PATCH /api/comments/:id` - 更新評論
- `DELETE /api/comments/:id` - 刪除評論

### 附件
- `GET /api/pages/:id/attachments` - 獲取附件列表
- `POST /api/pages/:id/attachments` - 上傳附件
- `DELETE /api/attachments/:id` - 刪除附件

### AI 功能
- `POST /api/ai/summarize` - 生成摘要
- `POST /api/ai/classify` - 內容分類
- `POST /api/ai/recommend` - 推薦相關頁面
- `POST /api/ai/qa` - 問答系統

## 數據庫模型

### WikiPage (Wiki 頁面)
```typescript
{
  id: string
  title: string
  slug: string
  content: string
  contentType: 'MARKDOWN' | 'HTML'

  // 層級結構
  parentId?: string
  path: string // "/產品/功能/用戶管理"
  level: number
  order: number

  // 元數據
  tags: string[]
  category?: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

  // 作者
  authorId: string
  lastEditedBy: string

  // 權限
  visibility: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED'
  allowedGroups: string[]

  // 統計
  views: number
  lastViewedAt: Date

  // 版本
  version: number

  createdAt: Date
  updatedAt: Date
}
```

### PageVersion (頁面版本)
```typescript
{
  id: string
  pageId: string
  version: number
  title: string
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
  pageId: string
  userId: string
  content: string
  parentId?: string // 支持評論回覆
  isResolved: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Tag (標籤)
```typescript
{
  id: string
  name: string
  color: string
  description?: string
  pageCount: number
  createdAt: Date
}
```

## 編輯器功能

### Markdown 支持
- 標題（H1-H6）
- 列表（有序、無序、任務清單）
- 表格
- 程式碼塊（語法高亮）
- 引用塊
- 鏈接和圖片
- 數學公式（LaTeX）

### 富文本功能
- 文本格式化（粗體、斜體、下劃線）
- 顏色和高亮
- 對齊方式
- 縮進
- 嵌入媒體（YouTube, Vimeo）
- 檔案附件
- 頁面引用

### 進階功能
- 即時保存（自動草稿）
- 協作編輯
- 快捷鍵支持
- 模板插入
- 巨集功能

## 搜索功能

### 全文搜索
- 支持中文分詞
- 模糊搜索
- 短語搜索
- 布爾運算符
- 搜索高亮

### 過濾選項
- 按標籤篩選
- 按分類篩選
- 按作者篩選
- 按日期範圍篩選
- 按權限篩選

### 語義搜索（RAG）
```typescript
// 使用向量嵌入進行語義搜索
const results = await searchService.semanticSearch({
  query: "如何配置 HTTPS",
  limit: 5
});

// 返回最相關的頁面
```

## AI 功能實現

### 自動摘要
```typescript
import { OpenAI } from 'openai';

async function generateSummary(content: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: '你是一個專業的文檔摘要助手。請生成簡潔的摘要。'
      },
      {
        role: 'user',
        content: `請為以下文檔生成摘要：\n\n${content}`
      }
    ],
    max_tokens: 200
  });

  return completion.choices[0].message.content;
}
```

### 問答系統（RAG）
```typescript
async function answerQuestion(question: string): Promise<string> {
  // 1. 向量搜索相關文檔
  const relevantDocs = await vectorSearch(question, 5);

  // 2. 構建上下文
  const context = relevantDocs.map(doc => doc.content).join('\n\n');

  // 3. 使用 GPT 生成答案
  const answer = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: '你是一個知識庫助手。基於提供的文檔回答問題。'
      },
      {
        role: 'user',
        content: `基於以下文檔：\n\n${context}\n\n回答問題：${question}`
      }
    ]
  });

  return answer.choices[0].message.content;
}
```

## 頁面模板

### 預設模板
- **會議記錄**: 會議資訊、參與者、討論要點、行動項
- **產品需求文檔**: 背景、目標、功能需求、技術方案
- **技術文檔**: 概述、架構、API 文檔、示例代碼
- **操作手冊**: 步驟說明、注意事項、常見問題
- **決策記錄**: 背景、選項分析、決策、理由

### 自定義模板
用戶可創建和分享自己的模板。

## 權限管理

### 權限級別
- **查看**: 只能查看頁面
- **評論**: 可以添加評論
- **編輯**: 可以編輯頁面
- **管理**: 可以管理權限和刪除頁面

### 權限繼承
子頁面默認繼承父頁面的權限設置。

## 導出功能

支持導出為：
- PDF（單頁面或整個空間）
- Microsoft Word (.docx)
- Markdown (.md)
- HTML（包含樣式）

## 性能優化

- ✅ 增量搜索索引
- ✅ 頁面內容快取
- ✅ 圖片懶加載
- ✅ 虛擬滾動（大型列表）
- ✅ CDN 加速
- ✅ 數據庫索引優化

## 安全措施

- ✅ XSS 防護（內容過濾）
- ✅ CSRF 防護
- ✅ SQL 注入防護
- ✅ 權限檢查
- ✅ 審計日誌
- ✅ 敏感內容掃描

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

### Elasticsearch 配置
```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
  environment:
    - discovery.type=single-node
    - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
  ports:
    - "9200:9200"
```

## 未來計劃

- [ ] 多語言支持
- [ ] 離線訪問
- [ ] 頁面比較（Diff）
- [ ] 更多導出格式
- [ ] 移動應用
- [ ] Slack/Teams 集成
- [ ] API 文檔生成器
- [ ] 知識圖譜可視化

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 授權

MIT License
