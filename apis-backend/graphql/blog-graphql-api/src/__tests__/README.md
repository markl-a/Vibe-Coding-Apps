# Blog GraphQL API - 測試套件

## 概述

完整的測試套件覆蓋了 GraphQL API 的所有核心功能，包括 resolvers、schema、models、認證和資料加載器。

## 測試文件結構

```
src/__tests__/
├── models.test.js          # Mongoose 模型測試 (15 個測試)
├── resolvers.test.js       # GraphQL Resolver 測試 (28 個測試)
├── schema.test.js          # GraphQL Schema 定義測試 (22 個測試)
├── auth.test.js            # 認證工具測試 (13 個測試)
├── dataLoaders.test.js     # DataLoader 測試 (19 個測試)
├── integration.test.js     # 集成測試 (15 個測試)
└── README.md               # 本文件
```

## 測試統計

- **總測試數量**: 112 個測試用例
- **測試覆蓋範圍**:
  - Models (User, Post, Comment): 15 個測試
  - Resolvers (Query, Mutation, Field Resolvers): 28 個測試
  - Schema 定義和驗證: 22 個測試
  - 認證和授權: 13 個測試
  - DataLoader 批次加載: 19 個測試
  - 端到端集成測試: 15 個測試

## 運行測試

### 安裝依賴

```bash
npm install
```

### 運行所有測試

```bash
npm test
```

### 監視模式（開發時使用）

```bash
npm run test:watch
```

### 生成測試覆蓋率報告

```bash
npm run test:coverage
```

## 測試詳細說明

### 1. models.test.js - 模型測試

測試所有 Mongoose 模型的定義、驗證和默認值：

- **User Model** (6 個測試):
  - 必填字段驗證
  - 默認角色設置
  - Email 小寫轉換
  - 字段修剪（trim）
  - 密碼比對方法

- **Post Model** (5 個測試):
  - 必填字段驗證
  - 默認值設置（published, views, likes）
  - 標籤數組處理
  - 時間戳字段

- **Comment Model** (4 個測試):
  - 必填字段驗證
  - 默認值設置
  - 嵌套評論支持（parentComment）
  - 時間戳字段

### 2. resolvers.test.js - Resolver 測試

測試所有 GraphQL 查詢和變更操作：

- **Query Resolvers** (9 個測試):
  - `posts`: 分頁查詢和參數處理
  - `post`: 單個文章查詢
  - `searchPosts`: 全文搜索
  - `user`: 用戶查詢
  - `me`: 當前用戶查詢和認證
  - `comments`: 文章評論查詢

- **Mutation Resolvers** (14 個測試):
  - `register`: 用戶註冊和重複檢查
  - `login`: 登錄驗證和錯誤處理
  - `createPost`: 創建文章和認證
  - `updatePost`: 更新文章和授權
  - `deletePost`: 刪除文章和關聯評論
  - `addComment`: 添加評論
  - `deleteComment`: 刪除評論

- **Field Resolvers** (5 個測試):
  - Post.author: DataLoader 使用
  - Post.comments: 批次加載評論
  - User.posts: 批次加載用戶文章
  - Comment.author: 加載評論作者
  - Comment.post: 加載評論所屬文章

### 3. schema.test.js - Schema 測試

驗證 GraphQL Schema 定義的正確性：

- **Type Definitions** (4 個測試):
  - User 類型字段定義
  - Post 類型字段定義
  - Comment 類型字段定義
  - AuthPayload 類型定義

- **Query Type** (5 個測試):
  - 所有查詢定義存在
  - 查詢參數正確性
  - 必填參數驗證

- **Mutation Type** (8 個測試):
  - 所有變更定義存在
  - 變更參數正確性
  - 必填和可選參數區分

- **Field Relationships** (5 個測試):
  - User 和 Post 關係
  - Post 和 Comment 關係
  - 返回類型驗證

### 4. auth.test.js - 認證測試

測試 JWT 認證和授權功能：

- **generateToken** (3 個測試):
  - Token 生成
  - 過期時間配置
  - 環境變量處理

- **authenticateUser** (7 個測試):
  - Bearer token 解析
  - Token 驗證
  - 用戶查詢
  - 錯誤處理（無效 token、用戶不存在）

- **Integration scenarios** (3 個測試):
  - 完整認證流程
  - 過期 token 處理
  - 畸形 token 處理

### 5. dataLoaders.test.js - DataLoader 測試

測試批次數據加載和緩存：

- **userLoader** (4 個測試):
  - 單個用戶加載
  - 批次加載多個用戶
  - 不存在的用戶處理
  - 緩存機制

- **postLoader** (3 個測試):
  - 單個文章加載
  - 批次加載文章
  - 錯誤處理

- **commentsByPostLoader** (4 個測試):
  - 按文章 ID 加載評論
  - 批次加載多個文章的評論
  - 空評論處理
  - 評論分組

- **postsByAuthorLoader** (4 個測試):
  - 按作者 ID 加載文章
  - 批次加載多個作者的文章
  - 空文章處理
  - 文章分組

- **Performance optimization** (2 個測試):
  - 請求去重
  - 批次處理

### 6. integration.test.js - 集成測試

端到端測試 GraphQL 操作：

- **Query Operations** (5 個測試):
  - 完整的 posts 查詢
  - 完整的 post 查詢
  - 完整的 searchPosts 查詢
  - 完整的 user 查詢
  - 完整的 comments 查詢

- **Mutation Operations** (7 個測試):
  - 完整的 register 流程
  - 完整的 createPost 流程
  - 完整的 updatePost 流程
  - 完整的 deletePost 流程
  - 完整的 addComment 流程
  - 完整的 deleteComment 流程

- **Error Handling** (3 個測試):
  - 認證錯誤處理
  - 資源不存在錯誤
  - 驗證錯誤處理

## Mock 策略

所有測試使用 Jest mock 來隔離數據庫依賴：

- **Mongoose Models**: 完全 mock，不需要真實數據庫連接
- **JWT**: Mock token 生成和驗證
- **bcryptjs**: Mock 密碼哈希和比對
- **DataLoader**: 測試批次加載邏輯

## 測試最佳實踐

1. **隔離性**: 每個測試獨立運行，不依賴其他測試
2. **可重複性**: 使用 mock 確保測試結果一致
3. **清晰性**: 測試名稱清楚描述測試內容
4. **完整性**: 覆蓋正常流程和錯誤情況
5. **性能**: 使用 mock 避免真實數據庫操作

## CI/CD 集成

這些測試可以輕松集成到 CI/CD 流程：

```yaml
# GitHub Actions 示例
- name: Run Tests
  run: npm test

- name: Generate Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## 貢獻指南

添加新功能時，請確保：

1. 為新的 resolver 添加單元測試
2. 為新的 model 添加驗證測試
3. 更新集成測試以覆蓋新的端到端流程
4. 保持測試覆蓋率在 80% 以上

## 故障排除

### 常見問題

**Q: 測試運行緩慢？**
A: 檢查是否有測試沒有正確使用 mock，導致連接真實數據庫。

**Q: Mock 不生效？**
A: 確保在測試文件頂部使用 `jest.mock()` 聲明所有需要 mock 的模塊。

**Q: 測試失敗但代碼沒問題？**
A: 檢查 `beforeEach` 中是否正確清理了 mock 狀態。

## 相關資源

- [Jest 官方文檔](https://jestjs.io/)
- [GraphQL Testing Best Practices](https://www.apollographql.com/docs/apollo-server/testing/testing/)
- [DataLoader 文檔](https://github.com/graphql/dataloader)
