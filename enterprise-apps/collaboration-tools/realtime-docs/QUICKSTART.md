# Realtime Docs - 快速開始指南

## 📦 前置要求

- **Node.js** 18+
- **Docker** & **Docker Compose**
- **Git**

## 🚀 快速啟動

```bash
# 1. 進入專案目錄
cd realtime-docs

# 2. 啟動所有服務
docker-compose up -d

# 3. 查看服務狀態
docker-compose ps
```

服務啟動後：
- 🌐 **前端**: http://localhost:3000
- 🔧 **後端 API**: http://localhost:3003
- 🗄️ **PostgreSQL**: localhost:5434
- 💾 **Redis**: localhost:6381

## 📝 測試協作編輯功能

### 1. 創建文檔

```bash
curl -X POST http://localhost:3003/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "團隊協作文檔",
    "content": "這是一個支持多人即時編輯的文檔",
    "visibility": "TEAM"
  }'
```

### 2. 連接到文檔進行協作（WebSocket）

在前端應用中使用 Socket.IO 和 Yjs：

```javascript
import io from 'socket.io-client';
import * as Y from 'yjs';

// 創建 Yjs 文檔
const ydoc = new Y.Doc();
const ytext = ydoc.getText('content');

// 連接到後端
const socket = io('http://localhost:3003', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// 加入文檔房間
socket.emit('join-document', {
  documentId: 'doc-id',
  user: {
    id: 'user-123',
    name: 'John Doe'
  }
});

// 接收初始同步
socket.on('sync-response', ({ update, users }) => {
  // 應用更新
  Y.applyUpdate(ydoc, new Uint8Array(update));

  console.log('Current users:', users);
});

// 監聽本地變更並發送
ydoc.on('update', (update) => {
  socket.emit('sync-update', {
    documentId: 'doc-id',
    update: Array.from(update)
  });
});

// 接收遠程更新
socket.on('document-update', ({ update }) => {
  Y.applyUpdate(ydoc, new Uint8Array(update));
});

// 發送游標位置
function updateCursor(position) {
  socket.emit('cursor-position', {
    documentId: 'doc-id',
    cursor: {
      position,
      selection: { start: position, end: position }
    }
  });
}

// 接收其他用戶的游標
socket.on('cursor-update', ({ userId, cursor }) => {
  // 渲染其他用戶的游標
  console.log(`User ${userId} cursor at:`, cursor);
});
```

### 3. 使用富文本編輯器（Quill.js 示例）

```javascript
import Quill from 'quill';
import { QuillBinding } from 'y-quill';
import * as Y from 'yjs';

// 創建編輯器
const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean']
    ]
  }
});

// 綁定 Yjs 和 Quill
const ydoc = new Y.Doc();
const ytext = ydoc.getText('quill');
const binding = new QuillBinding(ytext, quill);

// 顯示其他用戶的游標
binding.awareness.setLocalStateField('user', {
  name: 'John Doe',
  color: '#ff0000'
});
```

## 🤖 AI 功能測試

### 1. 智能文本補全

```bash
curl -X POST http://localhost:3003/api/documents/ai/completion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "currentText": "今天的會議討論了產品開發計劃，主要包括",
    "context": {
      "documentType": "report",
      "tone": "formal"
    }
  }'
```

響應示例：
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "前端開發、後端架構和測試策略三個部分",
      "新功能的技術實現方案和時間表",
      "各部門的職責分工和協作方式"
    ]
  }
}
```

### 2. 語法檢查

```bash
curl -X POST http://localhost:3003/api/documents/ai/grammar-check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "我們的產品有很多的功能，包括用戶管理、數據分析和報告生成等等。"
  }'
```

### 3. 文檔摘要

```bash
curl -X POST http://localhost:3003/api/documents/ai/summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "長篇文檔內容...",
    "summaryLength": "medium"
  }'
```

### 4. 改寫建議

```bash
curl -X POST http://localhost:3003/api/documents/ai/improvements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "這個功能真的非常好用，我覺得大家都應該試試看。",
    "improvementType": "formality"
  }'
```

響應示例：
```json
{
  "success": true,
  "data": {
    "original": "這個功能真的非常好用，我覺得大家都應該試試看。",
    "improved": "此功能具有顯著的實用價值，建議團隊成員進行試用評估。",
    "changes": [
      {"type": "tone", "description": "調整為更正式的商務用語"},
      {"type": "word_choice", "description": "使用更專業的詞彙"}
    ]
  }
}
```

### 5. 文檔分析

```bash
curl -X POST http://localhost:3003/api/documents/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "您的文檔內容..."
  }'
```

### 6. 翻譯文檔

```bash
curl -X POST http://localhost:3003/api/documents/ai/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "This is a collaborative document for our team.",
    "targetLanguage": "中文"
  }'
```

### 7. 生成大綱

```bash
curl -X POST http://localhost:3003/api/documents/ai/outline \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "長篇文檔內容..."
  }'
```

### 8. 文檔問答

```bash
curl -X POST http://localhost:3003/api/documents/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "documentText": "我們的產品支持多種功能，包括用戶管理、數據分析和報告生成。用戶管理模塊允許管理員創建、編輯和刪除用戶賬戶。",
    "question": "產品支持哪些功能？"
  }'
```

### 9. 語氣分析

```bash
curl -X POST http://localhost:3003/api/documents/ai/tone-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "我們對這個項目的進展非常滿意！團隊的努力取得了顯著成果。"
  }'
```

## 🎨 前端 React 組件示例

### 完整的協作編輯器組件

```typescript
import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import { QuillBinding } from 'y-quill';
import * as Y from 'yjs';
import io from 'socket.io-client';
import 'quill/dist/quill.snow.css';

interface CollaborativeEditorProps {
  documentId: string;
  user: { id: string; name: string };
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  user,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [quill, setQuill] = useState<Quill | null>(null);
  const [ydoc] = useState(() => new Y.Doc());
  const [socket, setSocket] = useState<any>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  useEffect(() => {
    // 初始化 Quill 編輯器
    if (editorRef.current && !quill) {
      const q = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ header: [1, 2, 3, false] }],
          ],
        },
      });
      setQuill(q);

      // 綁定 Yjs
      const ytext = ydoc.getText('quill');
      new QuillBinding(ytext, q);
    }
  }, [editorRef, quill, ydoc]);

  useEffect(() => {
    // 連接 WebSocket
    const newSocket = io('http://localhost:3003', {
      auth: { token: localStorage.getItem('token') },
    });
    setSocket(newSocket);

    // 加入文檔
    newSocket.emit('join-document', { documentId, user });

    // 接收同步
    newSocket.on('sync-response', ({ update, users }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
      setActiveUsers(users);
    });

    // 接收更新
    newSocket.on('document-update', ({ update }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });

    // 用戶加入/離開
    newSocket.on('user-joined', ({ user }) => {
      setActiveUsers((prev) => [...prev, user]);
    });

    newSocket.on('user-left', ({ userId }) => {
      setActiveUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    // 發送本地更新
    const updateHandler = (update: Uint8Array) => {
      newSocket.emit('sync-update', {
        documentId,
        update: Array.from(update),
      });
    };

    ydoc.on('update', updateHandler);

    return () => {
      newSocket.disconnect();
      ydoc.off('update', updateHandler);
    };
  }, [documentId, user, ydoc]);

  return (
    <div className="collaborative-editor">
      <div className="active-users">
        {activeUsers.map((u) => (
          <span key={u.id} className="user-badge">
            {u.name}
          </span>
        ))}
      </div>
      <div ref={editorRef} className="editor" />
    </div>
  );
};

export default CollaborativeEditor;
```

## 🔧 技術架構

### CRDT (Conflict-free Replicated Data Type)

使用 **Yjs** 實現無衝突的協作編輯：

- **自動衝突解決**：多人同時編輯時自動合併變更
- **離線支持**：支持離線編輯，重新連接時自動同步
- **高效同步**：只傳輸增量變更
- **持久化**：將 CRDT 狀態保存到數據庫

### 實時同步流程

```
用戶 A 編輯 → Yjs 生成 Update → WebSocket 發送
                                     ↓
                              後端接收並轉發
                                     ↓
用戶 B 接收 ← WebSocket 接收 ← Yjs 應用 Update
```

## 📊 性能優化

- **增量同步**：只發送變更的部分
- **壓縮**：使用 LZ4 壓縮大型文檔
- **節流**：游標更新使用節流避免過度廣播
- **分片**：大型文檔分片加載

## 🐛 常見問題

### Q: 編輯衝突如何處理？

Yjs 使用 CRDT 算法自動解決衝突，無需手動處理。

### Q: 支持離線編輯嗎？

是的，Yjs 支持離線編輯，重新連接時會自動同步。

### Q: 如何顯示其他用戶的游標？

使用 Yjs Awareness API 和編輯器插件（如 y-quill）。

### Q: 文檔保存機制是什麼？

使用 debounce 機制，在用戶停止編輯 5 秒後自動保存到數據庫。

## 📚 更多資源

- [Yjs 官方文檔](https://docs.yjs.dev/)
- [Quill.js 文檔](https://quilljs.com/)
- [WebSocket 最佳實踐](https://socket.io/docs/)

---

**🎉 現在你可以開始使用即時協作文檔系統了！**
