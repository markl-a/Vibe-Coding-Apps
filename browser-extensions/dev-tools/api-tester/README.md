# 🌐 API 測試工具

一個功能完整的 API 測試工具,支援多種 HTTP 方法、認證方式和請求格式。

## ✨ 功能特色

### 核心功能
- ✅ 支援 GET、POST、PUT、PATCH、DELETE 等 HTTP 方法
- ✅ 自訂請求標頭 (Headers)
- ✅ 多種請求體格式 (JSON, Form Data, Plain Text)
- ✅ 多種認證方式 (Bearer Token, Basic Auth, API Key)
- ✅ 語法高亮的回應顯示
- ✅ 請求歷史記錄 (最多 20 筆)
- ✅ 一鍵複製 cURL 指令
- ✅ 顯示回應時間和大小

### 介面特色
- 🎨 深色主題設計
- 📱 響應式布局
- ⚡ 快速操作
- 💾 自動儲存歷史

## 🚀 快速開始

### 直接使用
1. 在瀏覽器中開啟 `index.html`
2. 輸入 API URL
3. 選擇 HTTP 方法
4. 設定 Headers、Body、Auth (可選)
5. 點擊「發送請求」

### 基本範例

#### GET 請求
```
Method: GET
URL: https://api.github.com/users/octocat
```

#### POST 請求 (JSON)
```
Method: POST
URL: https://jsonplaceholder.typicode.com/posts
Headers:
  Content-Type: application/json
Body:
  {
    "title": "測試文章",
    "body": "這是測試內容",
    "userId": 1
  }
```

#### Bearer Token 認證
```
Method: GET
URL: https://api.example.com/protected
Auth Type: Bearer Token
Token: your-access-token-here
```

## 📋 使用說明

### 1. 設定請求

#### HTTP 方法
選擇適當的 HTTP 方法：
- **GET** - 獲取資源
- **POST** - 創建資源
- **PUT** - 完整更新資源
- **PATCH** - 部分更新資源
- **DELETE** - 刪除資源

#### URL
輸入完整的 API 端點 URL，例如：
```
https://api.example.com/v1/users
```

### 2. 設定 Headers

在 Headers 標籤中：
1. 輸入 Header 名稱（例如：Content-Type）
2. 輸入 Header 值（例如：application/json）
3. 點擊 + 按鈕新增
4. 可以新增多個 Headers
5. 點擊 ✕ 按鈕刪除已新增的 Header

### 3. 設定 Body

在 Body 標籤中：
1. 選擇 Body 類型：
   - **None** - 無請求體（通常用於 GET）
   - **JSON** - JSON 格式資料
   - **Form Data** - 表單資料
   - **Plain Text** - 純文字
2. 在文字區域輸入請求內容

### 4. 設定認證

在 Auth 標籤中選擇認證方式：

#### Bearer Token
```
用於 OAuth 2.0 等認證
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Basic Auth
```
傳統的使用者名稱/密碼認證
Username: user@example.com
Password: your-password
```

#### API Key
```
自訂 Header 認證
Key Name: X-API-Key
Key Value: your-api-key-123
```

### 5. 發送請求

點擊「發送請求」按鈕，回應將顯示在右側：
- **Status** - HTTP 狀態碼和狀態文字
- **Body** - 回應內容（自動格式化 JSON）
- **Headers** - 回應標頭
- **Time** - 請求耗時（毫秒）
- **Size** - 回應大小

### 6. 其他功能

#### 複製 cURL
點擊「複製 cURL」將當前請求轉換為 cURL 指令，方便在終端機使用：
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"title":"test"}' \
  "https://api.example.com/posts"
```

#### 清除表單
點擊「清除」重置所有輸入欄位

#### 歷史記錄
- 自動儲存最近 20 筆請求
- 點擊歷史項目快速載入
- 點擊「清除歷史」刪除所有記錄

## 💡 使用技巧

### 測試 RESTful API
```
# 獲取所有使用者
GET /api/users

# 獲取單一使用者
GET /api/users/1

# 創建使用者
POST /api/users
Body: {"name": "John", "email": "john@example.com"}

# 更新使用者
PUT /api/users/1
Body: {"name": "John Doe", "email": "john@example.com"}

# 部分更新
PATCH /api/users/1
Body: {"email": "newemail@example.com"}

# 刪除使用者
DELETE /api/users/1
```

### 常用 Headers
```
Content-Type: application/json          # JSON 資料
Content-Type: application/x-www-form-urlencoded  # 表單資料
Accept: application/json                # 期望 JSON 回應
User-Agent: MyApp/1.0                   # 自訂使用者代理
```

### 測試公開 API

#### GitHub API
```
GET https://api.github.com/users/octocat
```

#### JSONPlaceholder (測試用 API)
```
GET https://jsonplaceholder.typicode.com/posts
POST https://jsonplaceholder.typicode.com/posts
Body: {"title": "test", "body": "content", "userId": 1}
```

#### ReqRes (測試用 API)
```
GET https://reqres.in/api/users
POST https://reqres.in/api/users
Body: {"name": "John", "job": "developer"}
```

## 🎨 介面說明

### 左側面板 - 請求設定
- HTTP 方法選擇器
- URL 輸入框
- 三個標籤頁：Headers、Body、Auth
- 操作按鈕：發送、清除、複製 cURL

### 右側面板 - 回應結果
- 狀態顯示（綠色=成功，紅色=失敗）
- 兩個標籤頁：Body、Headers
- 回應資訊：時間、大小

### 底部面板 - 歷史記錄
- 顯示最近 20 筆請求
- 包含方法、URL、時間、狀態
- 點擊可快速載入

## 🔧 技術細節

### 技術棧
- 純 HTML/CSS/JavaScript
- 使用 Fetch API 發送請求
- LocalStorage 儲存歷史
- 響應式 CSS Grid 布局

### 檔案結構
```
api-tester/
├── index.html      # 主頁面
├── styles.css      # 樣式表
├── script.js       # 應用邏輯
└── README.md       # 說明文件
```

### 瀏覽器相容性
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 🔒 安全性與隱私

- ✅ 所有請求直接從瀏覽器發送
- ✅ 不經過任何第三方伺服器
- ✅ 歷史記錄僅儲存在本地
- ✅ 可隨時清除歷史記錄
- ⚠️ 請勿在歷史記錄中儲存敏感資料

## 🐛 已知限制

- 受瀏覽器 CORS 政策限制
- 無法發送某些受保護的 Headers
- 無法處理檔案上傳
- 歷史記錄最多 20 筆

## 🚀 未來功能

- [ ] 環境變數管理
- [ ] 請求集合管理
- [ ] 匯出/匯入請求
- [ ] WebSocket 支援
- [ ] GraphQL 支援
- [ ] 請求測試腳本
- [ ] 批次請求
- [ ] 請求鏈（將前一個請求的回應用於下一個請求）

## 📄 授權

MIT License

---

**快速、簡單、強大的 API 測試工具** 🚀
