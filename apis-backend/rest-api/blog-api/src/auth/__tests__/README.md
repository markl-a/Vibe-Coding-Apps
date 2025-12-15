# 認證服務測試套件

本目錄包含認證服務的完整測試套件，涵蓋登入、註冊、Token 驗證等核心功能。

## 📋 測試概覽

- **總測試數**: 83 個測試用例
- **測試框架**: Jest + TypeScript
- **測試類型**: 單元測試、集成測試、安全測試

## 🗂️ 測試文件結構

### 1. `auth.service.spec.ts` (16 個測試)
測試 `AuthService` 的核心業務邏輯：

#### validateUser (4 個測試)
- ✅ 驗證正確的用戶憑證
- ✅ 處理用戶不存在的情況
- ✅ 處理密碼錯誤的情況
- ✅ 處理 bcrypt 錯誤

#### login (5 個測試)
- ✅ 成功登入並返回 access token 和用戶數據
- ✅ 憑證無效時拋出 UnauthorizedException
- ✅ 用戶不存在時拋出 UnauthorizedException
- ✅ JWT payload 包含正確的數據
- ✅ 處理數據庫錯誤

#### register (7 個測試)
- ✅ 註冊新用戶並返回 access token
- ✅ 排除密碼字段在返回的用戶數據中
- ✅ JWT payload 包含新用戶的正確數據
- ✅ 處理重複的用戶名
- ✅ 處理重複的電子郵件
- ✅ 處理數據庫錯誤

### 2. `auth.controller.spec.ts` (17 個測試)
測試 `AuthController` 的 HTTP 請求處理：

#### login (7 個測試)
- ✅ 成功登入返回 token 和用戶信息
- ✅ 憑證無效時拋出異常
- ✅ 處理空用戶名
- ✅ 處理空密碼
- ✅ 處理服務錯誤
- ✅ 處理帶空格的用戶名和密碼
- ✅ 處理大小寫敏感的用戶名

#### register (8 個測試)
- ✅ 註冊新用戶並返回 token
- ✅ 處理最少必需數據的註冊
- ✅ 處理完整用戶數據的註冊
- ✅ 處理重複用戶名錯誤
- ✅ 處理重複電子郵件錯誤
- ✅ 處理無效的電子郵件格式
- ✅ 處理弱密碼
- ✅ 處理服務錯誤

#### Controller Metadata (2 個測試)
- ✅ 驗證路由前綴
- ✅ 驗證 Swagger API 標籤

### 3. `jwt.strategy.spec.ts` (15 個測試)
測試 JWT 認證策略：

#### constructor (3 個測試)
- ✅ 策略初始化成功
- ✅ 從配置服務獲取 JWT secret
- ✅ 配置從 Authorization header 提取 JWT

#### validate (8 個測試)
- ✅ 從有效的 JWT payload 返回用戶對象
- ✅ 將 "sub" 映射到 "userId"
- ✅ 處理 admin 角色
- ✅ 處理 editor 角色
- ✅ 處理 author 角色
- ✅ 處理帶額外字段的 payload
- ✅ 處理不同的用戶名格式
- ✅ 處理 UUID 格式的用戶 ID

#### JWT Configuration (2 個測試)
- ✅ 使用環境變量中的 JWT secret
- ✅ 默認不忽略 token 過期

#### Security (2 個測試)
- ✅ 從 Bearer Authorization header 提取 token
- ✅ 使用 secret 驗證 JWT 簽名

### 4. `auth.integration.spec.ts` (12 個測試)
集成測試，測試完整的認證流程：

#### Complete Login Flow (2 個測試)
- ✅ 從 controller 到 service 的完整登入流程
- ✅ 在 controller 層拒絕錯誤密碼

#### Complete Registration Flow (1 個測試)
- ✅ 從 controller 到 service 的完整註冊流程

#### Token Generation and Validation (2 個測試)
- ✅ 生成包含正確 payload 的有效 JWT token
- ✅ JWT payload 中包含用戶角色

#### Error Handling Flow (2 個測試)
- ✅ 從 service 到 controller 傳播數據庫錯誤
- ✅ 處理註冊期間的用戶服務錯誤

#### Password Security (1 個測試)
- ✅ 響應中永不暴露密碼

#### Multiple User Roles (4 個測試)
- ✅ 正確處理 admin 角色
- ✅ 正確處理 editor 角色
- ✅ 正確處理 author 角色
- ✅ 正確處理 user 角色

### 5. `auth.security.spec.ts` (24 個測試)
安全相關測試：

#### Password Security (5 個測試)
- ✅ 使用 bcrypt 比較密碼
- ✅ 用戶對象中永不返回密碼
- ✅ 拒絕 SQL 注入模式的登入嘗試
- ✅ 處理非常長的密碼
- ✅ 處理密碼中的特殊字符

#### JWT Token Security (5 個測試)
- ✅ JWT payload 中包含用戶 ID（作為 "sub"）
- ✅ JWT payload 中包含用戶名
- ✅ JWT payload 中包含角色
- ✅ JWT payload 中不包含敏感數據
- ✅ 在策略中驗證 JWT payload 結構

#### Authentication Attempts (5 個測試)
- ✅ 拒絕空用戶名
- ✅ 拒絕空密碼
- ✅ 拒絕 null 用戶名
- ✅ 拒絕 null 密碼
- ✅ 處理大小寫敏感的用戶名比較

#### Registration Security (3 個測試)
- ✅ 註冊響應中不暴露密碼
- ✅ 優雅處理重複用戶名
- ✅ 優雅處理重複電子郵件

#### Authorization Checks (2 個測試)
- ✅ 在認證期間保留用戶角色
- ✅ 從 JWT token 驗證角色

#### Inactive User Handling (2 個測試)
- ✅ 允許活躍用戶登入
- ✅ 驗證通過用戶名找到的用戶

#### Token Verification (2 個測試)
- ✅ 使用配置中的正確 JWT secret
- ✅ 錯誤中不暴露 JWT secret

### 6. `mocks/auth.mocks.ts`
共享的 mock 數據和工具函數：

- Mock 用戶數據（user, admin, editor, author）
- Mock JWT tokens
- Mock DTOs（login, register）
- Mock 服務（UsersService, JwtService, ConfigService）
- Mock 數據庫錯誤
- 輔助函數

## 🚀 運行測試

### 運行所有認證測試
```bash
npm test -- --testPathPattern=auth/__tests__
```

### 運行特定測試文件
```bash
npm test -- auth.service.spec.ts
npm test -- auth.controller.spec.ts
npm test -- jwt.strategy.spec.ts
npm test -- auth.integration.spec.ts
npm test -- auth.security.spec.ts
```

### 運行測試並生成覆蓋率報告
```bash
npm test -- --testPathPattern=auth/__tests__ --coverage
```

### 監視模式運行測試
```bash
npm test -- --testPathPattern=auth/__tests__ --watch
```

## 📊 測試覆蓋範圍

測試涵蓋以下功能：

### ✅ 認證功能
- 用戶登入
- 用戶註冊
- 密碼驗證
- JWT token 生成
- JWT token 驗證

### ✅ 錯誤處理
- 憑證無效
- 用戶不存在
- 重複用戶名/電子郵件
- 數據庫錯誤
- 服務錯誤

### ✅ 安全性
- 密碼加密（bcrypt）
- SQL 注入防護
- 敏感數據保護
- JWT 簽名驗證
- 角色授權

### ✅ 數據驗證
- 空值檢查
- 格式驗證
- 類型檢查
- 邊界條件

## 🔧 Mock 策略

所有測試使用 mock 來隔離依賴：

1. **UsersService**: Mock 數據庫操作
2. **JwtService**: Mock JWT token 生成和驗證
3. **ConfigService**: Mock 配置值
4. **bcrypt**: Mock 密碼哈希和比較

這確保測試：
- 快速執行
- 可靠且可重複
- 不依賴外部服務
- 易於維護

## 📝 測試最佳實踐

本測試套件遵循以下最佳實踐：

1. **AAA 模式**: Arrange（準備）、Act（執行）、Assert（斷言）
2. **隔離性**: 每個測試獨立運行，不依賴其他測試
3. **描述性命名**: 測試名稱清楚描述測試內容
4. **Mock 隔離**: 使用 mock 隔離外部依賴
5. **全面覆蓋**: 包括正常流程和錯誤流程
6. **安全優先**: 重點測試安全相關功能

## 🎯 測試目標

- ✅ 代碼覆蓋率 > 90%
- ✅ 所有業務邏輯都有測試
- ✅ 所有錯誤情況都有測試
- ✅ 所有安全功能都有測試
- ✅ 測試執行時間 < 20 秒

## 🔍 持續改進

未來可以添加的測試：

- [ ] 密碼重置功能測試
- [ ] Token 刷新功能測試
- [ ] 多因素認證測試
- [ ] 登出功能測試
- [ ] Session 管理測試
- [ ] Rate limiting 測試
- [ ] 端到端測試（E2E）
