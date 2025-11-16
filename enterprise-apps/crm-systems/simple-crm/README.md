# Simple CRM

一個基於 Node.js + Express + SQLite 的輕量級 CRM 系統，適合小型企業和個人使用。

## 功能特點

- 👥 客戶管理 - 新增、編輯、刪除、查詢客戶資料
- 📞 聯絡人管理 - 管理客戶的多個聯絡人
- 💼 銷售機會追蹤 - 追蹤潛在商機和銷售進度
- 📝 活動記錄 - 記錄與客戶的互動歷史
- 📊 簡單報表 - 基礎的銷售和客戶統計
- 🔍 搜索功能 - 快速查找客戶和聯絡人
- 🔐 基礎認證 - JWT 身份驗證
- 📱 RESTful API - 完整的 REST API 介面

## 技術棧

- **後端**: Node.js + Express.js
- **資料庫**: SQLite3
- **認證**: JWT (jsonwebtoken)
- **ORM**: better-sqlite3
- **API 測試**: Jest + Supertest

## 快速開始

### 安裝依賴

```bash
npm install
```

### 配置環境變數

```bash
cp .env.example .env
```

編輯 `.env` 文件設置必要的環境變數。

### 初始化資料庫

```bash
npm run db:init
```

### 啟動開發伺服器

```bash
npm run dev
```

伺服器將在 http://localhost:3000 啟動。

### 生產環境運行

```bash
npm start
```

## API 文檔

### 認證

#### 註冊用戶
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "password123"
}
```

#### 登入
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

### 客戶管理

#### 獲取所有客戶
```http
GET /api/customers
Authorization: Bearer {token}
```

#### 獲取單個客戶
```http
GET /api/customers/:id
Authorization: Bearer {token}
```

#### 創建客戶
```http
POST /api/customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "ABC 公司",
  "company": "ABC Corp",
  "email": "contact@abc.com",
  "phone": "02-1234-5678",
  "industry": "科技",
  "status": "潛在客戶",
  "rating": "A"
}
```

#### 更新客戶
```http
PUT /api/customers/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "正式客戶",
  "rating": "A+"
}
```

#### 刪除客戶
```http
DELETE /api/customers/:id
Authorization: Bearer {token}
```

### 聯絡人管理

#### 獲取客戶的所有聯絡人
```http
GET /api/customers/:customerId/contacts
Authorization: Bearer {token}
```

#### 創建聯絡人
```http
POST /api/customers/:customerId/contacts
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "張",
  "lastName": "三",
  "email": "zhang@abc.com",
  "phone": "0912-345-678",
  "title": "業務經理",
  "isPrimary": true
}
```

### 銷售機會

#### 獲取所有機會
```http
GET /api/opportunities
Authorization: Bearer {token}
```

#### 創建機會
```http
POST /api/opportunities
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": 1,
  "name": "企業軟體採購案",
  "stage": "提案",
  "amount": 500000,
  "probability": 60,
  "expectedCloseDate": "2025-12-31"
}
```

#### 更新機會階段
```http
PATCH /api/opportunities/:id/stage
Authorization: Bearer {token}
Content-Type: application/json

{
  "stage": "談判",
  "probability": 80
}
```

### 活動記錄

#### 獲取客戶活動記錄
```http
GET /api/customers/:customerId/activities
Authorization: Bearer {token}
```

#### 創建活動記錄
```http
POST /api/activities
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": 1,
  "type": "電話",
  "subject": "產品諮詢",
  "description": "客戶對新產品有興趣",
  "dueDate": "2025-11-20T10:00:00Z"
}
```

## 資料庫結構

### Users (用戶表)
- id (PRIMARY KEY)
- username
- email (UNIQUE)
- password_hash
- created_at

### Customers (客戶表)
- id (PRIMARY KEY)
- name
- company
- email
- phone
- industry
- status (潛在客戶/正式客戶/合作夥伴)
- rating (A/B/C/D)
- source (來源)
- user_id (FOREIGN KEY)
- created_at
- updated_at

### Contacts (聯絡人表)
- id (PRIMARY KEY)
- customer_id (FOREIGN KEY)
- first_name
- last_name
- email
- phone
- title
- is_primary
- created_at

### Opportunities (銷售機會表)
- id (PRIMARY KEY)
- customer_id (FOREIGN KEY)
- name
- stage (探索/提案/談判/成交/失敗)
- amount
- probability (0-100)
- expected_close_date
- next_steps
- user_id (FOREIGN KEY)
- created_at
- updated_at

### Activities (活動記錄表)
- id (PRIMARY KEY)
- customer_id (FOREIGN KEY)
- opportunity_id (FOREIGN KEY, nullable)
- type (電話/郵件/會議/任務)
- subject
- description
- status (計劃/完成/取消)
- due_date
- completed_at
- user_id (FOREIGN KEY)
- created_at

## 測試

```bash
# 運行所有測試
npm test

# 運行測試並顯示覆蓋率
npm run test:coverage
```

## 部署

### 使用 Docker

```bash
docker build -t simple-crm .
docker run -p 3000:3000 simple-crm
```

### 部署到 Heroku

```bash
heroku create your-app-name
git push heroku main
```

## 開發計劃

- [x] 基礎 CRUD API
- [x] JWT 認證
- [x] 客戶管理
- [x] 聯絡人管理
- [x] 銷售機會追蹤
- [x] 活動記錄
- [ ] 搜索和過濾功能
- [ ] 報表和儀表板
- [ ] 郵件整合
- [ ] 日曆整合
- [ ] 匯入/匯出功能
- [ ] 前端界面 (React)

## 授權

MIT License

## 貢獻

歡迎提交 Pull Request 或開 Issue！

## 相關資源

- [Express.js 文檔](https://expressjs.com/)
- [SQLite 文檔](https://www.sqlite.org/docs.html)
- [JWT 介紹](https://jwt.io/introduction)
