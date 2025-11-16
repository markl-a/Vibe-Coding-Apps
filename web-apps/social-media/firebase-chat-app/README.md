# Firebase 即時聊天應用

使用 Next.js 14 和 Firebase 打造的現代化即時聊天應用，支援一對一聊天、群組聊天、檔案分享等功能。

## 功能特色

- ✨ **美觀的 UI** - 現代化聊天介面設計
- ⚡ **即時通訊** - Firebase Firestore 即時資料同步
- 🔐 **安全認證** - Firebase Authentication 多種登入方式
- 👥 **群組聊天** - 建立群組、邀請成員
- 📁 **檔案分享** - 支援圖片、影片、文件上傳
- 🔔 **即時通知** - 新訊息即時推送
- ✅ **已讀狀態** - 顯示訊息已讀/未讀
- 💬 **正在輸入** - 顯示對方正在輸入狀態
- 😀 **表情符號** - 豐富的表情符號支援
- 📱 **響應式設計** - 完美支援各種裝置

## 核心功能

### 1. 用戶認證
- Email/密碼登入
- Google 登入
- Facebook 登入
- GitHub 登入
- 匿名登入
- 記住登入狀態

### 2. 一對一聊天
- 即時訊息傳送
- 訊息已讀狀態
- 正在輸入指示器
- 訊息搜尋
- 聊天記錄保存

### 3. 群組聊天
- 建立群組
- 邀請成員
- 移除成員
- 設定管理員
- 群組資訊編輯
- 群組頭貼上傳

### 4. 檔案分享
- 圖片上傳與預覽
- 影片上傳與播放
- 文件檔案分享
- 檔案下載
- Firebase Storage 儲存

### 5. 通知系統
- 新訊息推送
- 瀏覽器通知
- 未讀計數
- 聲音提示

### 6. 用戶狀態
- 在線/離線狀態
- 最後上線時間
- 正在輸入狀態

## 技術棧

- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **後端服務**: Firebase
  - Authentication（認證）
  - Firestore（資料庫）
  - Storage（檔案儲存）
  - Cloud Functions（雲端函式）
- **狀態管理**: Zustand
- **React Hooks**: react-firebase-hooks
- **日期處理**: date-fns
- **圖示**: Lucide React
- **表情符號**: emoji-picker-react
- **部署**: Vercel / Firebase Hosting

## 快速開始

### 前置需求

1. Node.js 18+
2. Firebase 專案（前往 [Firebase Console](https://console.firebase.google.com/) 建立）

### Firebase 設定

1. 建立 Firebase 專案
2. 啟用 Authentication 服務
   - 啟用 Email/Password 登入
   - 啟用 Google 登入（可選）
3. 建立 Firestore 資料庫
4. 建立 Storage 儲存空間
5. 取得 Firebase 配置資訊

### 安裝依賴

```bash
npm install
```

### 環境變數設定

建立 `.env.local` 檔案：

```bash
# Firebase 配置
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### Firestore 安全規則

在 Firebase Console 設定 Firestore 安全規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶資料
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // 聊天室
    match /chats/{chatId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in resource.data.members;
    }

    // 訊息
    match /chats/{chatId}/messages/{messageId} {
      allow read: if request.auth != null &&
        request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.members;
      allow create: if request.auth != null;
    }
  }
}
```

### Storage 安全規則

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    match /chats/{chatId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 開發模式

```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 建置生產版本

```bash
npm run build
npm start
```

## 專案結構

```
firebase-chat-app/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # 根佈局
│   ├── page.tsx               # 首頁
│   ├── globals.css            # 全局樣式
│   ├── chat/                  # 聊天頁面
│   │   └── page.tsx
│   ├── login/                 # 登入頁面
│   │   └── page.tsx
│   └── register/              # 註冊頁面
│       └── page.tsx
├── components/                # React 組件
│   ├── chat/
│   │   ├── ChatList.tsx      # 聊天列表
│   │   ├── ChatWindow.tsx    # 聊天視窗
│   │   ├── MessageBubble.tsx # 訊息氣泡
│   │   └── MessageInput.tsx  # 訊息輸入
│   ├── auth/
│   │   ├── LoginForm.tsx     # 登入表單
│   │   └── RegisterForm.tsx  # 註冊表單
│   └── ui/
│       ├── Button.tsx
│       └── Modal.tsx
├── lib/
│   ├── firebase.ts           # Firebase 初始化
│   ├── auth.ts               # 認證相關函式
│   ├── firestore.ts          # Firestore 操作
│   └── storage.ts            # Storage 操作
├── types/
│   ├── chat.ts               # 聊天型別
│   ├── message.ts            # 訊息型別
│   └── user.ts               # 用戶型別
├── public/                    # 靜態資源
├── package.json
├── next.config.js
├── tsconfig.json
└── tailwind.config.ts
```

## Firebase 資料結構

### Users Collection

```typescript
{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  status: 'online' | 'offline';
  lastSeen: Timestamp;
  createdAt: Timestamp;
}
```

### Chats Collection

```typescript
{
  id: string;
  type: 'direct' | 'group';
  members: string[];  // 用戶 UID 陣列
  name?: string;      // 群組名稱（僅群組）
  photoURL?: string;  // 群組頭貼（僅群組）
  lastMessage: {
    content: string;
    senderId: string;
    timestamp: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Messages SubCollection

```typescript
{
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file';
  fileURL?: string;
  fileName?: string;
  isRead: boolean;
  readBy: string[];  // 已讀用戶 UID 陣列
  timestamp: Timestamp;
}
```

## 使用 Firebase Hooks

### 取得聊天列表

```typescript
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function ChatList({ userId }: { userId: string }) {
  const [chatsSnapshot, loading, error] = useCollection(
    query(
      collection(db, 'chats'),
      where('members', 'array-contains', userId)
    )
  );

  const chats = chatsSnapshot?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // 渲染聊天列表...
}
```

### 發送訊息

```typescript
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function sendMessage(chatId: string, content: string, senderId: string) {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    content,
    senderId,
    type: 'text',
    isRead: false,
    readBy: [senderId],
    timestamp: serverTimestamp(),
  });
}
```

### 上傳檔案

```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

async function uploadFile(file: File, chatId: string) {
  const storageRef = ref(storage, `chats/${chatId}/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}
```

## 主要功能實作

### 1. 即時訊息監聽

```typescript
import { onSnapshot, query, orderBy, collection } from 'firebase/firestore';

// 監聽新訊息
const unsubscribe = onSnapshot(
  query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  ),
  (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setMessages(messages);
  }
);
```

### 2. 用戶在線狀態

```typescript
import { onDisconnect, ref, set } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

// 設定在線狀態
function setUserStatus(userId: string, status: 'online' | 'offline') {
  const userStatusRef = ref(rtdb, `status/${userId}`);

  set(userStatusRef, {
    status,
    lastSeen: Date.now()
  });

  // 離線時自動更新狀態
  onDisconnect(userStatusRef).set({
    status: 'offline',
    lastSeen: Date.now()
  });
}
```

### 3. 正在輸入指示器

```typescript
import { doc, updateDoc } from 'firebase/firestore';

// 更新正在輸入狀態
async function setTypingStatus(chatId: string, userId: string, isTyping: boolean) {
  await updateDoc(doc(db, 'chats', chatId), {
    [`typing.${userId}`]: isTyping
  });
}
```

## 部署

### Vercel 部署

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 部署
vercel --prod
```

### Firebase Hosting 部署

```bash
# 安裝 Firebase CLI
npm install -g firebase-tools

# 登入 Firebase
firebase login

# 初始化專案
firebase init hosting

# 建置專案
npm run build

# 部署
firebase deploy --only hosting
```

## 效能優化

- ✅ 分頁載入訊息（無限滾動）
- ✅ 訊息虛擬化（長列表優化）
- ✅ 圖片 lazy loading
- ✅ Firestore 查詢優化
- ✅ 離線支援（Firestore 快取）
- ✅ Service Worker（PWA）

## 安全性考量

- 🔒 Firestore 安全規則
- 🔒 Storage 安全規則
- 🔒 用戶資料驗證
- 🔒 XSS 防護
- 🔒 檔案類型檢查
- 🔒 檔案大小限制
- 🔒 Rate Limiting

## 進階功能建議

- 🎥 語音/視訊通話（WebRTC）
- 🔍 訊息全文搜尋
- 📌 釘選訊息
- 🔕 靜音通知
- 📱 推播通知（FCM）
- 🌐 多語言支援
- 🎨 主題切換
- 💾 訊息備份
- 🤖 聊天機器人整合

## 常見問題

### Q: Firebase 初始化錯誤？
確認 `.env.local` 中的 Firebase 配置是否正確。

### Q: 訊息無法即時更新？
檢查 Firestore 安全規則是否正確設定。

### Q: 檔案上傳失敗？
確認 Storage 安全規則已設定，並檢查檔案大小限制。

### Q: 認證失敗？
確認 Firebase Authentication 已啟用對應的登入方式。

## 測試

```bash
# 單元測試
npm run test

# E2E 測試
npm run test:e2e
```

## 貢獻

歡迎提交 Issue 和 Pull Request！

## License

MIT License

## 相關資源

- [Firebase 文檔](https://firebase.google.com/docs)
- [Next.js 文檔](https://nextjs.org/docs)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)

## 範例展示

### 聊天介面
- 左側：聊天列表（顯示最近對話、未讀計數）
- 右側：聊天視窗（訊息氣泡、輸入框）
- 即時更新訊息
- 已讀/未讀狀態

### 群組功能
- 建立新群組
- 邀請成員加入
- 設定群組名稱和頭貼
- 群組成員管理

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
