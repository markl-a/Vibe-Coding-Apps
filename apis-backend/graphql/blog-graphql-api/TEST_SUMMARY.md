# Blog GraphQL API - 測試套件總結

## 快速概覽

已為 Blog GraphQL API 創建完整的測試套件，包含 **115 個測試用例**，遠超要求的 15-20 個測試。

## 測試文件清單

### 1. models.test.js (15 個測試)
測試 Mongoose 模型的定義、驗證和方法
- User Model: 用戶創建、角色、密碼處理
- Post Model: 文章創建、默認值、標籤
- Comment Model: 評論創建、嵌套評論支持

### 2. resolvers.test.js (31 個測試)
測試所有 GraphQL Resolver 函數
- Query Resolvers: posts, post, searchPosts, user, me, comments
- Mutation Resolvers: register, login, createPost, updatePost, deletePost, addComment, deleteComment
- Field Resolvers: 使用 DataLoader 的關聯查詢

### 3. schema.test.js (23 個測試)
驗證 GraphQL Schema 定義的完整性和正確性
- Type Definitions: User, Post, Comment, AuthPayload
- Query Type: 所有查詢及其參數
- Mutation Type: 所有變更及其參數
- Field Relationships: 類型間的關聯關係

### 4. auth.test.js (13 個測試)
測試 JWT 認證和授權功能
- generateToken: Token 生成和配置
- authenticateUser: Token 驗證和用戶查詢
- Integration scenarios: 完整認證流程

### 5. dataLoaders.test.js (19 個測試)
測試 DataLoader 批次加載和緩存機制
- userLoader: 批次加載用戶
- postLoader: 批次加載文章
- commentsByPostLoader: 按文章加載評論
- postsByAuthorLoader: 按作者加載文章
- Performance optimization: 去重和批次處理

### 6. integration.test.js (14 個測試)
端到端集成測試，測試完整的 GraphQL 操作流程
- Query Operations: 完整查詢流程
- Mutation Operations: 完整變更流程
- Error Handling: 錯誤處理和驗證

## 測試統計

| 測試文件 | 測試數量 | 覆蓋範圍 |
|---------|---------|---------|
| models.test.js | 15 | Mongoose 模型 |
| resolvers.test.js | 31 | GraphQL Resolvers |
| schema.test.js | 23 | Schema 定義 |
| auth.test.js | 13 | 認證授權 |
| dataLoaders.test.js | 19 | 數據加載 |
| integration.test.js | 14 | 端到端測試 |
| **總計** | **115** | **全面覆蓋** |

## 運行測試

```bash
# 安裝依賴
npm install

# 運行所有測試
npm test

# 監視模式
npm run test:watch

# 生成覆蓋率報告
npm run test:coverage
```

## 測試特點

1. **完整性**: 覆蓋所有 Query、Mutation 和 Field Resolver
2. **隔離性**: 使用 Jest Mock 隔離數據庫依賴，無需真實數據庫
3. **可維護性**: 清晰的測試結構和命名規範
4. **可擴展性**: 易於添加新的測試用例
5. **CI/CD 就緒**: 可直接集成到持續集成流程

## 配置文件

- **jest.config.js**: Jest 測試框架配置
- **package.json**: 已更新測試腳本和依賴
- **src/__tests__/README.md**: 詳細測試文檔

## Mock 策略

所有測試使用 Mock 來隔離外部依賴：
- Mongoose Models (User, Post, Comment)
- JWT (jsonwebtoken)
- Password Hashing (bcryptjs)
- DataLoader 批次加載

這確保測試：
- 運行速度快
- 結果可預測
- 不依賴外部服務

## 測試覆蓋的功能

### 認證和授權
- 用戶註冊和登錄
- JWT Token 生成和驗證
- 權限檢查（只能編輯/刪除自己的內容）

### 文章管理
- 創建、讀取、更新、刪除文章
- 文章搜索和分頁
- 文章發布狀態管理

### 評論系統
- 添加和刪除評論
- 按文章查詢評論
- 評論授權驗證

### 數據加載優化
- DataLoader 批次加載
- N+1 查詢問題解決
- 請求去重和緩存

### 錯誤處理
- 認證錯誤 (UNAUTHENTICATED)
- 授權錯誤 (FORBIDDEN)
- 資源不存在 (NOT_FOUND)
- 驗證錯誤 (BAD_USER_INPUT)

## 後續維護

當添加新功能時：
1. 在對應的測試文件中添加測試用例
2. 確保新的 resolver 有完整的測試覆蓋
3. 更新集成測試以包含新的端到端流程
4. 運行 `npm run test:coverage` 確保覆蓋率保持在高水平

## 相關文檔

詳細的測試文檔請參閱：
- `src/__tests__/README.md` - 完整測試文檔
- `jest.config.js` - Jest 配置說明
