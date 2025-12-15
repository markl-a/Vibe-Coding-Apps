# Social Media REST API

完整的社交媒體平台 REST API，使用 Node.js、Express 和 MongoDB 構建。

## 功能特性

- **用戶管理**
  - 用戶註冊和登入
  - JWT 認證
  - 個人資料管理
  - 用戶搜索

- **貼文功能**
  - 創建、讀取、更新、刪除貼文
  - 支持圖片上傳
  - 按讚/取消按讚
  - 可見性設置（公開/僅關注者/私密）
  - 時間軸瀏覽

- **評論功能**
  - 創建、更新、刪除評論
  - 回覆評論（嵌套評論）
  - 評論按讚

- **社交功能**
  - 關注/取消關注用戶
  - 查看關注者和正在關注的用戶列表
  - 防止自我關注

## 技術棧

- **運行時**: Node.js
- **框架**: Express.js
- **數據庫**: MongoDB (Mongoose ORM)
- **認證**: JWT (JSON Web Tokens)
- **密碼加密**: bcrypt
- **測試**: Jest + Supertest + MongoDB Memory Server
- **驗證**: express-validator
- **安全**: Helmet, CORS

## 安裝

```bash
# 安裝依賴
npm install

# 複製環境變量文件
cp .env.example .env

# 編輯 .env 文件並設置你的配置
```

## 環境變量

```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/social_media
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

## 運行

```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

## 測試

本項目包含完整的測試套件，包括：

- **認證測試** (10 個測試用例)
  - 用戶註冊
  - 用戶登入
  - Token 驗證

- **貼文測試** (19 個測試用例)
  - 創建、讀取、更新、刪除貼文
  - 貼文按讚/取消按讚
  - 時間軸分頁
  - 權限控制

- **評論測試** (19 個測試用例)
  - 創建、更新、刪除評論
  - 嵌套評論（回覆）
  - 評論按讚
  - 評論分頁

- **用戶測試** (20 個測試用例)
  - 用戶資料管理
  - 關注/取消關注
  - 關注者列表
  - 用戶搜索

- **數據模型測試** (13 個測試用例)
  - 數據驗證
  - 密碼加密
  - 關係約束

### 運行測試

```bash
# 運行所有測試
npm test

# 運行測試並監聽變化
npm run test:watch

# 運行特定測試文件
npm test -- auth.test.js

# 查看測試覆蓋率
npm test -- --coverage
```

**總測試數量**: 81 個測試用例

## API 端點

### 認證

- `POST /api/auth/register` - 註冊新用戶
- `POST /api/auth/login` - 用戶登入
- `GET /api/auth/me` - 獲取當前用戶信息

### 貼文

- `POST /api/posts` - 創建貼文
- `GET /api/posts` - 獲取時間軸
- `GET /api/posts/:id` - 獲取單個貼文
- `PUT /api/posts/:id` - 更新貼文
- `DELETE /api/posts/:id` - 刪除貼文
- `POST /api/posts/:id/like` - 按讚貼文
- `DELETE /api/posts/:id/like` - 取消按讚

### 評論

- `POST /api/posts/:postId/comments` - 創建評論
- `GET /api/posts/:postId/comments` - 獲取貼文的評論
- `GET /api/comments/:commentId/replies` - 獲取評論的回覆
- `PUT /api/comments/:commentId` - 更新評論
- `DELETE /api/comments/:commentId` - 刪除評論
- `POST /api/comments/:commentId/like` - 按讚評論
- `DELETE /api/comments/:commentId/like` - 取消按讚評論

### 用戶

- `GET /api/users/search` - 搜索用戶
- `GET /api/users/:userId` - 獲取用戶資料
- `PUT /api/users/:userId` - 更新用戶資料
- `GET /api/users/:userId/posts` - 獲取用戶的貼文
- `POST /api/users/:userId/follow` - 關注用戶
- `DELETE /api/users/:userId/follow` - 取消關注用戶
- `GET /api/users/:userId/followers` - 獲取關注者列表
- `GET /api/users/:userId/following` - 獲取正在關注的用戶列表

## 測試覆蓋範圍

測試涵蓋以下方面：

- ✅ 所有 CRUD 操作
- ✅ 認證和授權
- ✅ 數據驗證
- ✅ 錯誤處理
- ✅ 邊界條件
- ✅ 數據庫關係和約束
- ✅ 分頁功能
- ✅ 權限控制

## 項目結構

```
social-media-api/
├── src/
│   ├── __tests__/          # 測試文件
│   │   ├── auth.test.js
│   │   ├── posts.test.js
│   │   ├── comments.test.js
│   │   ├── users.test.js
│   │   ├── models.test.js
│   │   ├── helpers.js      # 測試輔助函數
│   │   └── setup.js        # 測試設置
│   ├── controllers/        # 控制器
│   ├── middleware/         # 中間件
│   ├── models/            # 數據模型
│   ├── routes/            # 路由定義
│   └── index.js           # 應用入口
├── .env.example           # 環境變量示例
├── package.json
└── README.md
```

## 安全特性

- ✅ JWT Token 認證
- ✅ 密碼加密 (bcrypt)
- ✅ 輸入驗證 (express-validator)
- ✅ CORS 配置
- ✅ Helmet 安全頭
- ✅ 權限控制
- ✅ 防止重複操作（重複按讚、重複關注等）

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 授權

MIT License
