# Knowledge Base - 快速開始指南

## 📦 前置要求

- **Node.js** 18+
- **Docker** & **Docker Compose**
- **Git**

## 🚀 快速啟動

```bash
# 1. 進入專案目錄
cd knowledge-base

# 2. 啟動所有服務
docker-compose up -d

# 3. 查看服務狀態
docker-compose ps
```

服務啟動後：
- 🌐 **前端**: http://localhost:3000
- 🔧 **後端 API**: http://localhost:3004
- 🗄️ **PostgreSQL**: localhost:5435
- 💾 **Redis**: localhost:6382
- 🔍 **Elasticsearch**: http://localhost:9201

## 📚 核心功能

### 1. 語義搜索

利用 OpenAI Embeddings 實現智能搜索：

```bash
curl -X POST http://localhost:3004/api/search/semantic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "如何提升團隊協作效率？",
    "limit": 5
  }'
```

### 2. AI 問答助手

基於知識庫內容回答問題：

```bash
curl -X POST http://localhost:3004/api/search/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question": "公司的遠程工作政策是什麼？"
  }'
```

響應示例：
```json
{
  "success": true,
  "data": {
    "answer": "根據公司政策，員工可以選擇每週最多3天遠程工作...",
    "sources": [
      {
        "id": "page-123",
        "title": "遠程工作指南",
        "score": 0.95
      }
    ]
  }
}
```

### 3. 自動分類和標籤

```bash
curl -X POST http://localhost:3004/api/knowledge/ai/extract-keywords \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "您的文檔內容..."
  }'
```

### 4. 內容質量評估

```bash
curl -X POST http://localhost:3004/api/knowledge/ai/assess-quality \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "文檔內容..."
  }'
```

### 5. 識別內容空缺

```bash
curl -X POST http://localhost:3004/api/knowledge/ai/content-gaps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "existingPages": [
      {"title": "產品介紹", "topics": ["產品", "功能"]},
      {"title": "用戶指南", "topics": ["使用", "教程"]}
    ],
    "organizationContext": "SaaS 軟體公司"
  }'
```

## 🎯 完整使用流程

### 創建知識頁面

```bash
curl -X POST http://localhost:3004/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "如何使用 API",
    "content": "# API 使用指南\n\n本文檔介紹如何使用我們的 API...",
    "tags": ["API", "開發", "文檔"],
    "category": "技術文檔",
    "visibility": "INTERNAL"
  }'
```

### 全文搜索

```bash
curl -X GET "http://localhost:3004/api/search?q=API使用&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 獲取推薦

```bash
curl -X GET "http://localhost:3004/api/pages/page-123/recommendations?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🤖 AI 增強功能詳解

### 1. 自動提取關鍵詞和實體

分析文檔內容，自動識別關鍵詞、實體（人物、組織、技術等）和主題：

```json
{
  "keywords": ["API", "認證", "OAuth"],
  "entities": [
    {"name": "OAuth 2.0", "type": "技術"},
    {"name": "JWT", "type": "技術"}
  ],
  "topics": ["API安全", "身份驗證"]
}
```

### 2. 智能相關鏈接建議

自動識別文檔間的關聯，建議添加內部鏈接。

### 3. 內容擴展建議

AI 分析文檔，建議可以添加哪些內容使其更完整。

### 4. FAQ 自動生成

根據文檔內容自動生成常見問題和答案。

### 5. 多層次摘要

生成不同詳細程度的摘要（一句話、簡短、詳細）。

### 6. 術語標準化

確保整個知識庫使用統一的術語。

### 7. 過時內容檢測

AI 檢測可能已過時的內容並建議更新。

## 📊 統計和分析

### 查看熱門頁面

```bash
curl -X GET "http://localhost:3004/api/analytics/popular-pages?period=week" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 搜索分析

```bash
curl -X GET "http://localhost:3004/api/analytics/search-queries?period=month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 管理功能

### 批量導入

```bash
curl -X POST http://localhost:3004/api/admin/import \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@knowledge-export.json"
```

### 導出知識庫

```bash
curl -X GET "http://localhost:3004/api/admin/export" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -O knowledge-export.json
```

## 📁 層級結構示例

```
知識庫
├── 產品文檔
│   ├── 產品介紹
│   ├── 功能說明
│   └── 發布記錄
├── 開發者文檔
│   ├── API 參考
│   ├── SDK 指南
│   └── 最佳實踐
├── 用戶指南
│   ├── 快速開始
│   ├── 進階功能
│   └── 常見問題
└── 內部文檔
    ├── 流程規範
    ├── 團隊手冊
    └── 政策制度
```

## 🎨 前端集成示例

### React 搜索組件

```typescript
import React, { useState, useEffect } from 'react';
import { searchPages, getAIAnswer } from './api/knowledge';

const KnowledgeSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [aiAnswer, setAiAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);

    // 執行語義搜索
    const searchResults = await searchPages(query);
    setResults(searchResults);

    // 獲取 AI 答案
    const answer = await getAIAnswer(query);
    setAiAnswer(answer);

    setLoading(false);
  };

  return (
    <div className="knowledge-search">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索知識庫..."
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
      />
      <button onClick={handleSearch} disabled={loading}>
        搜索
      </button>

      {aiAnswer && (
        <div className="ai-answer">
          <h3>AI 答案</h3>
          <p>{aiAnswer.answer}</p>
          <div className="sources">
            <h4>參考來源：</h4>
            {aiAnswer.sources.map((source) => (
              <a key={source.id} href={`/pages/${source.id}`}>
                {source.title}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="search-results">
        {results.map((result) => (
          <div key={result.id} className="result-item">
            <h3>{result.title}</h3>
            <p dangerouslySetInnerHTML={{ __html: result.highlights[0] }} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🔍 搜索優化技巧

1. **使用語義搜索**：比關鍵字搜索更智能
2. **標籤過濾**：縮小搜索範圍
3. **時間範圍**：查找最新內容
4. **作者篩選**：找特定人員的文檔

## 📚 最佳實踐

### 內容組織
- 使用清晰的層級結構
- 為每個頁面添加適當的標籤
- 定期審查和更新內容

### 搜索優化
- 使用描述性的標題
- 包含關鍵詞和同義詞
- 添加摘要和元數據

### 協作
- 啟用版本控制
- 使用評論功能討論
- 設置審核流程

## 🐛 常見問題

### Q: 搜索結果不準確？
確保文檔已正確索引，可以重建索引：
```bash
curl -X POST http://localhost:3004/api/admin/reindex \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Q: AI 答案質量不高？
- 確保相關文檔內容完整
- 檢查 OpenAI API 配置
- 考慮使用 GPT-4 獲得更好效果

### Q: 如何備份知識庫？
定期導出數據並備份 PostgreSQL 和 Elasticsearch：
```bash
docker-compose exec postgres pg_dump -U postgres knowledgebase > backup.sql
```

---

**🎉 開始構建您的智能知識庫！**
