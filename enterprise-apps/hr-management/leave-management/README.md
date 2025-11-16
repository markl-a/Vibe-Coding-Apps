# 請假管理系統 (Leave Management System)

完整的員工請假申請與審批系統，支持多種假期類型和審批流程。

## 功能特點

- ✅ 多種假期類型（年假、病假、事假等）
- ✅ 請假申請與審批流程
- ✅ 假期餘額管理
- ✅ 審批歷史記錄
- ✅ 郵件通知
- ✅ 假期日曆視圖
- ✅ 統計報表

## 技術棧

### 後端
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL

### 前端
- React 18 + TypeScript
- Ant Design
- React Query

## 假期類型

- **年假 (Annual Leave)**: 帶薪年假
- **病假 (Sick Leave)**: 疾病假期
- **事假 (Personal Leave)**: 個人事務假期
- **婚假 (Marriage Leave)**: 結婚假期
- **產假 (Maternity Leave)**: 產婦假期
- **陪產假 (Paternity Leave)**: 陪產假期
- **喪假 (Bereavement Leave)**: 喪葬假期

## 快速開始

### 後端

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

## API 端點

```
POST   /api/leaves              # 創建請假申請
GET    /api/leaves              # 獲取請假記錄
GET    /api/leaves/:id          # 獲取單個請假詳情
PUT    /api/leaves/:id/approve  # 審批請假
PUT    /api/leaves/:id/reject   # 拒絕請假
GET    /api/leaves/balance      # 獲取假期餘額
```

## 審批流程

1. **提交申請**: 員工提交請假申請
2. **主管審批**: 直屬主管審批
3. **HR 審核**: HR 最終審核（可選）
4. **通知結果**: 系統通知申請人

## 數據模型

```typescript
interface LeaveRequest {
  id: string
  employeeId: string
  leaveType: LeaveType
  startDate: Date
  endDate: Date
  days: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approverId?: string
  approvedAt?: Date
}

interface LeaveBalance {
  employeeId: string
  year: number
  leaveType: LeaveType
  total: number
  used: number
  available: number
}
```

## 環境變數

```env
DATABASE_URL="postgresql://user:password@localhost:5432/leave_management"
PORT=3002
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
```

## 許可證

MIT
