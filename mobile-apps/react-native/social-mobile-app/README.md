# Social Mobile App 🤖

一個使用 **AI 輔助開發**的 React Native 社交應用。

## 功能特點

- 📱 動態牆 - 瀏覽和互動貼文
- 💬 即時聊天 - 與好友即時通訊
- 🔔 通知中心 - 接收互動通知
- 👤 個人資料 - 管理個人檔案和設定

## 技術棧

- **框架**: React Native + Expo
- **導航**: React Navigation (Bottom Tabs)
- **狀態管理**: Zustand
- **語言**: TypeScript
- **UI 組件**: React Native Paper (可選)
- **圖標**: @expo/vector-icons (Ionicons)
- **日期處理**: date-fns

## 專案結構

```
social-mobile-app/
├── src/
│   ├── screens/            # 頁面組件
│   │   ├── FeedScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/         # 可重用組件
│   ├── navigation/         # 導航配置
│   ├── store/              # Zustand 狀態管理
│   │   └── userStore.ts
│   ├── services/           # API 服務
│   ├── utils/              # 工具函數
│   └── types/              # TypeScript 類型定義
│       └── index.ts
├── App.tsx                 # 應用入口
├── app.json                # Expo 配置
├── package.json
├── tsconfig.json
└── babel.config.js
```

## 開始使用

### 安裝依賴

```bash
npm install
# 或
yarn install
```

### 運行應用

```bash
# 啟動開發服務器
npm start

# 在 iOS 上運行
npm run ios

# 在 Android 上運行
npm run android

# 在網頁上運行
npm run web
```

## 主要功能

### 1. 動態牆 (Feed)

- 顯示用戶貼文列表
- 按讚和評論功能
- 下拉刷新
- 支持圖片貼文

### 2. 聊天 (Chat)

- 對話列表顯示
- 未讀消息提醒
- 最後訊息預覽
- 時間戳記顯示

### 3. 通知 (Notifications)

- 多種通知類型（按讚、評論、追蹤、訊息）
- 未讀通知標記
- 圖標區分不同類型

### 4. 個人資料 (Profile)

- 用戶資訊顯示
- 統計數據（貼文、追蹤者、追蹤中）
- 設定選項
- 登出功能

## 開發注意事項

### 狀態管理

使用 Zustand 進行狀態管理，簡單且高效：

```typescript
import { useUserStore } from './store/userStore';

const currentUser = useUserStore((state) => state.currentUser);
```

### 導航

使用 React Navigation 的 Bottom Tabs：

```typescript
<Tab.Navigator>
  <Tab.Screen name="Feed" component={FeedScreen} />
  <Tab.Screen name="Chat" component={ChatScreen} />
  ...
</Tab.Navigator>
```

### 類型安全

所有數據模型都在 `src/types/index.ts` 中定義：

- User
- Post
- Message
- Conversation
- Notification

## 未來改進

- [ ] 整合 Firebase 或其他後端服務
- [ ] 實現真實的即時聊天功能
- [ ] 添加推送通知
- [ ] 圖片上傳和處理
- [ ] 用戶認證和授權
- [ ] 搜索功能
- [ ] 黑暗模式支持
- [ ] 國際化 (i18n)

## AI 開發經驗

這個專案使用 AI 工具開發，展示了：

- 快速搭建專案結構
- 生成樣板代碼
- 實現常見 UI 模式
- TypeScript 類型定義
- 狀態管理實踐

## 授權

MIT License
