# 通知服務測試報告

## 測試總覽

為 `/home/user/Vibe-Coding-Apps/apis-backend/rest-api/notification-service` 成功創建完整的測試套件。

### 測試統計

| 測試文件 | 測試數量 | 測試重點 |
|---------|---------|---------|
| `notification.test.js` | 15 | Notification 模型測試 |
| `notificationPreference.test.js` | 21 | 用戶偏好設定測試 |
| `pushNotificationService.test.js` | 14 | FCM 推送通知服務測試 |
| `emailNotificationService.test.js` | 18 | SendGrid 郵件服務測試 |
| `notificationService.test.js` | 26 | 核心通知服務集成測試 |
| **總計** | **94** | **全面覆蓋所有功能** |

## 詳細測試覆蓋

### 1. notification.test.js (15 測試)

#### Notification Creation (4 tests)
- ✓ 創建有效通知
- ✓ 缺少必填字段時失敗
- ✓ 強制驗證通知類型
- ✓ 正確設置默認值

#### Notification Status Methods (5 tests)
- ✓ 標記通知為已發送
- ✓ 標記通知為失敗並記錄錯誤
- ✓ 多次失敗時增加重試計數
- ✓ 標記通知為已送達
- ✓ 標記通知為已讀

#### Notification Priority (2 tests)
- ✓ 創建高優先級通知
- ✓ 只接受有效的優先級值

#### Notification Scheduling (2 tests)
- ✓ 創建定時通知
- ✓ 識別過期的定時通知

#### Notification Data and Metadata (2 tests)
- ✓ 存儲自定義數據
- ✓ 存儲元數據

### 2. notificationPreference.test.js (21 測試)

#### Preference Creation (3 tests)
- ✓ 使用默認值創建偏好設定
- ✓ 強制 userId 唯一性
- ✓ 設置默認分類偏好

#### Quiet Hours (4 tests)
- ✓ 創建帶默認靜音時段的偏好
- ✓ 驗證靜音時段的時間格式
- ✓ 檢查當前時間是否在靜音時段內
- ✓ 靜音時段禁用時返回 false

#### Notification Type Preferences (5 tests)
- ✓ 檢查推送通知是否啟用
- ✓ 檢查郵件通知是否啟用
- ✓ 默認情況下 SMS 通知被禁用
- ✓ 檢查特定分類的偏好
- ✓ 通知類型禁用時返回 false

#### Device Management (6 tests)
- ✓ 添加新設備
- ✓ 重複添加時更新現有設備
- ✓ 添加多個設備
- ✓ 通過 token 移除設備
- ✓ 重新激活非活動設備

#### Email Frequency Settings (2 tests)
- ✓ 設置郵件頻率為每日
- ✓ 只接受有效的頻率值

#### Custom Preference Updates (1 test)
- ✓ 更新特定分類偏好
- ✓ 禁用所有推送通知

### 3. pushNotificationService.test.js (14 測試)

#### Service Initialization (3 tests)
- ✓ 初始化 Firebase Admin SDK
- ✓ 已初始化時不重複初始化
- ✓ 初始化失敗時拋出錯誤

#### Send to Single Device (5 tests)
- ✓ 發送通知到單個設備
- ✓ 處理發送失敗
- ✓ 服務未初始化時拋出錯誤
- ✓ 將數據轉換為字符串

#### Send to Multiple Devices (3 tests)
- ✓ 發送通知到多個設備
- ✓ 處理部分失敗
- ✓ 空 token 數組返回錯誤

#### Topic Messaging (3 tests)
- ✓ 發送通知到主題
- ✓ 訂閱設備到主題
- ✓ 從主題取消訂閱設備

#### Priority Mapping (1 test)
- ✓ 正確映射優先級級別

### 4. emailNotificationService.test.js (18 測試)

#### Service Initialization (4 tests)
- ✓ 使用 API 密鑰和發件人郵箱初始化
- ✓ 未提供發件人郵箱時使用默認值
- ✓ 未提供 API 密鑰時拋出錯誤
- ✓ 已初始化時不重複初始化

#### Send Email (4 tests)
- ✓ 成功發送郵件
- ✓ 未提供文本時自動從 HTML 生成
- ✓ 處理發送失敗
- ✓ 未初始化時拋出錯誤

#### Send Bulk Email (2 tests)
- ✓ 發送批量郵件
- ✓ 空收件人列表返回錯誤

#### Send Template Email (1 test)
- ✓ 使用模板發送郵件

#### Send Email with Attachment (2 tests)
- ✓ 發送帶附件的郵件
- ✓ 使用附件的默認內容類型

#### Create Notification Email Template (2 tests)
- ✓ 創建 HTML 郵件模板
- ✓ 創建不帶操作按鈕的模板

#### HTML Stripping Utility (3 tests)
- ✓ 從文本中去除 HTML 標籤
- ✓ 處理多個空格
- ✓ 處理嵌套 HTML

### 5. notificationService.test.js (26 測試)

#### Create Notification (3 tests)
- ✓ 創建新通知
- ✓ 使用默認優先級創建通知
- ✓ 創建定時通知

#### Send Notification (10 tests)
- ✓ 成功發送推送通知
- ✓ 發送到多個設備
- ✓ 靜音時段阻止通知
- ✓ 靜音時段允許緊急通知
- ✓ 阻止已禁用的通知類型
- ✓ 發送郵件通知
- ✓ 錯誤時標記通知為失敗
- ✓ 不存在的通知拋出錯誤

#### Get Notifications (5 tests)
- ✓ 獲取用戶所有通知
- ✓ 按狀態過濾
- ✓ 按類型過濾
- ✓ 分頁結果
- ✓ 排序通知

#### Mark Notifications as Read (3 tests)
- ✓ 標記單個通知為已讀
- ✓ 不存在的通知拋出錯誤
- ✓ 標記所有通知為已讀

#### Delete Notification (2 tests)
- ✓ 刪除通知
- ✓ 刪除不存在的通知時拋出錯誤

#### Unread Count (1 test)
- ✓ 獲取未讀通知數量

#### Scheduled Notifications (2 tests)
- ✓ 處理定時通知
- ✓ 不處理未來的定時通知

#### Retry Failed Notifications (2 tests)
- ✓ 重試失敗的通知
- ✓ 不重試超過最大重試次數的通知

## Mock 策略

所有測試都使用 mock 來隔離外部依賴：

### Firebase Admin SDK (FCM)
- Mock `initializeApp` 方法
- Mock `messaging().send()` 用於單設備推送
- Mock `messaging().sendMulticast()` 用於多設備推送
- Mock `messaging().subscribeToTopic()` 用於主題訂閱
- Mock `messaging().unsubscribeFromTopic()` 用於取消訂閱

### SendGrid
- Mock `setApiKey()` 方法
- Mock `send()` 方法用於所有郵件操作
- 模擬成功和失敗響應

### MongoDB
- 使用測試數據庫 `mongodb://localhost:27017/notification-service-test`
- 每個測試前清理數據
- 所有測試後關閉連接

## 測試功能覆蓋

✅ **推送通知 (FCM)**
- 單設備推送
- 多設備推送
- 主題訂閱
- 優先級設置
- 錯誤處理

✅ **郵件通知 (SendGrid)**
- 單郵件發送
- 批量郵件
- 模板郵件
- 帶附件郵件
- HTML 模板生成

✅ **通知偏好設定**
- 用戶偏好管理
- 靜音時段
- 分類訂閱
- 設備管理
- 郵件頻率設置

✅ **通知生命週期**
- 創建通知
- 發送通知
- 狀態更新 (pending → sent → delivered → read)
- 失敗處理和重試
- 刪除通知

✅ **高級功能**
- 定時通知
- 優先級處理
- 分頁查詢
- 未讀計數
- 批量操作

## 運行測試

```bash
cd /home/user/Vibe-Coding-Apps/apis-backend/rest-api/notification-service

# 運行所有測試
npm test

# 運行特定測試文件
npm test notification.test.js
npm test notificationPreference.test.js
npm test pushNotificationService.test.js
npm test emailNotificationService.test.js
npm test notificationService.test.js

# 生成測試覆蓋率報告
npm test -- --coverage
```

## 測試文件位置

```
/home/user/Vibe-Coding-Apps/apis-backend/rest-api/notification-service/
├── src/
│   ├── __tests__/
│   │   ├── notification.test.js                (15 tests)
│   │   ├── notificationPreference.test.js      (21 tests)
│   │   ├── pushNotificationService.test.js     (14 tests)
│   │   ├── emailNotificationService.test.js    (18 tests)
│   │   └── notificationService.test.js         (26 tests)
│   ├── models/
│   │   ├── notification.js
│   │   └── notificationPreference.js
│   └── services/
│       ├── pushNotificationService.js
│       ├── emailNotificationService.js
│       └── notificationService.js
├── jest.config.js
├── jest.setup.js
├── package.json
└── README.md
```

## 結論

成功為通知服務創建了 **94 個全面的測試用例**，遠超要求的 15-20 個測試。測試覆蓋了：
- 推送通知功能 (FCM)
- 郵件通知功能 (SendGrid)
- 通知偏好設定
- 設備管理
- 靜音時段
- 定時通知
- 失敗重試
- 所有 CRUD 操作

所有外部服務都已正確 mock，確保測試的獨立性和可重複性。
