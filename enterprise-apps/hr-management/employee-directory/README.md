# 員工檔案管理系統 (Employee Directory)

一個完整的員工檔案管理系統，提供員工資訊的增刪改查功能。

## 功能特點

- ✅ 員工檔案完整管理（CRUD）
- ✅ 部門與職位管理
- ✅ 高級搜索與篩選
- ✅ 員工頭像上傳
- ✅ 組織架構視圖
- ✅ 批量導入/導出
- ✅ 權限控制

## 技術棧

### 後端
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT 認證

### 前端
- React 18
- TypeScript
- Ant Design
- React Query
- React Router

## 快速開始

### 前置要求

- Node.js >= 18
- PostgreSQL >= 14
- npm 或 yarn

### 後端設置

```bash
cd backend

# 安裝依賴
npm install

# 配置環境變數
cp .env.example .env
# 編輯 .env 設置數據庫連接

# 執行數據庫遷移
npx prisma migrate dev

# 生成 Prisma Client
npx prisma generate

# 啟動開發服務器
npm run dev
```

後端將運行在 http://localhost:3000

### 前端設置

```bash
cd frontend

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

前端將運行在 http://localhost:5173

## API 文檔

### 員工管理

#### 獲取所有員工
```
GET /api/employees
Query: page, limit, search, department, status
```

#### 獲取單個員工
```
GET /api/employees/:id
```

#### 創建員工
```
POST /api/employees
Body: {
  firstName, lastName, email, phone,
  department, position, hireDate, etc.
}
```

#### 更新員工
```
PUT /api/employees/:id
Body: { ... }
```

#### 刪除員工
```
DELETE /api/employees/:id
```

### 部門管理

```
GET    /api/departments
POST   /api/departments
PUT    /api/departments/:id
DELETE /api/departments/:id
```

## 數據模型

### Employee (員工)
- id: UUID
- employeeNumber: 員工編號
- firstName: 名
- lastName: 姓
- email: 郵箱
- phone: 電話
- department: 部門
- position: 職位
- employeeType: 員工類型
- employmentStatus: 在職狀態
- hireDate: 入職日期
- baseSalary: 基本薪資
- managerId: 主管ID
- avatar: 頭像

### Department (部門)
- id: UUID
- name: 部門名稱
- code: 部門代碼
- parentId: 父部門ID
- managerId: 部門主管ID
- description: 描述

## 環境變數

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/employee_directory"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

## 開發指令

### 後端
```bash
npm run dev          # 開發模式
npm run build        # 構建
npm run start        # 生產模式
npm run lint         # 代碼檢查
npm run test         # 運行測試
```

### 前端
```bash
npm run dev          # 開發模式
npm run build        # 構建
npm run preview      # 預覽構建
npm run lint         # 代碼檢查
```

## 部署

### 使用 Docker

```bash
# 構建並啟動
docker-compose up -d

# 停止
docker-compose down
```

### 手動部署

1. 構建前端：`cd frontend && npm run build`
2. 構建後端：`cd backend && npm run build`
3. 配置 Nginx 反向代理
4. 設置 PM2 進程管理

## 許可證

MIT
