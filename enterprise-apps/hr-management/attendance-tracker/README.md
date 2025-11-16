# 考勤打卡系統 (Attendance Tracker)

一個完整的員工考勤打卡管理系統，支持GPS定位、異常分析等功能。

## 功能特點

- ✅ 上下班打卡記錄
- ✅ GPS 位置定位
- ✅ 遲到/早退自動標記
- ✅ 考勤異常報表
- ✅ 月度考勤統計
- ✅ 打卡歷史查詢
- ✅ 移動端支持

## 技術棧

### 後端
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL

### 前端
- React 18 + TypeScript
- Ant Design
- React Query
- dayjs

## 快速開始

### 後端設置

```bash
cd backend
npm install
cp .env.example .env
# 編輯 .env 設置數據庫連接

npx prisma migrate dev
npm run dev
```

### 前端設置

```bash
cd frontend
npm install
npm run dev
```

## 主要功能

### 1. 打卡管理

- **上班打卡**：記錄上班時間和位置
- **下班打卡**：記錄下班時間，自動計算工時
- **異常標記**：自動標記遲到、早退、缺勤

### 2. 考勤統計

- 月度考勤匯總
- 工時統計
- 遲到/早退統計
- 加班時數計算

### 3. 報表功能

- 個人考勤報表
- 部門考勤報表
- 異常考勤分析
- 考勤導出 (Excel)

## API 端點

### 打卡記錄

```
POST   /api/attendance/check-in    # 上班打卡
POST   /api/attendance/check-out   # 下班打卡
GET    /api/attendance             # 獲取考勤記錄
GET    /api/attendance/stats       # 考勤統計
```

## 數據模型

### Attendance (考勤記錄)

```typescript
{
  id: string
  employeeId: string
  date: Date
  checkIn?: Date
  checkOut?: Date
  workHours: number
  overtimeHours: number
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE'
  location?: {
    latitude: number
    longitude: number
    address: string
  }
}
```

## 環境變數

```env
DATABASE_URL="postgresql://user:password@localhost:5432/attendance_tracker"
PORT=3001
WORK_START_TIME="09:00"
WORK_END_TIME="18:00"
LATE_THRESHOLD_MINUTES=15
```

## 許可證

MIT
