# 薪資計算系統 (Payroll Calculator)

完整的員工薪資計算與管理系統，支持多種薪資組成和自動化計算。

## 功能特點

- ✅ 薪資結構配置（底薪、津貼、獎金）
- ✅ 自動計算薪資、加班費、扣款
- ✅ 個人所得稅計算
- ✅ 社保公積金計算
- ✅ 薪資單生成與發送
- ✅ 薪資報表統計
- ✅ 批量薪資處理
- ✅ 薪資歷史記錄

## 技術棧

### 後端
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- PDF 生成 (pdfkit)

### 前端
- React 18 + TypeScript
- Ant Design
- React Query
- Charts (recharts)

## 薪資組成

### 收入項目
- **底薪**: 基本工資
- **職位津貼**: 職位補貼
- **交通津貼**: 交通補助
- **餐費津貼**: 餐費補助
- **住房津貼**: 住房補貼
- **績效獎金**: 績效獎勵
- **加班費**: 加班工資

### 扣除項目
- **個人所得稅**: 按稅率計算
- **社會保險**: 養老、醫療、失業等
- **住房公積金**: 公積金繳納
- **其他扣款**: 遲到、借款等

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
POST   /api/payroll/calculate    # 計算薪資
GET    /api/payroll              # 獲取薪資記錄
GET    /api/payroll/:id          # 獲取薪資詳情
POST   /api/payroll/batch        # 批量計算薪資
GET    /api/payroll/payslip/:id  # 獲取薪資單
GET    /api/payroll/stats        # 薪資統計
```

## 薪資計算公式

### 基本計算

```
應發薪資 = 底薪 + 津貼 + 獎金 + 加班費
應扣金額 = 個稅 + 社保 + 公積金 + 其他扣款
實發薪資 = 應發薪資 - 應扣金額
```

### 個稅計算（台灣）

使用累進稅率表計算個人所得稅：
- 0-540,000: 5%
- 540,001-1,210,000: 12%
- 1,210,001-2,420,000: 20%
- 2,420,001-4,530,000: 30%
- 4,530,001以上: 40%

## 數據模型

```typescript
interface Payroll {
  id: string
  employeeId: string
  period: string // "2024-01"

  // 收入
  baseSalary: number
  allowances: Allowance[]
  bonus: number
  overtimePay: number
  totalEarnings: number

  // 扣除
  tax: number
  socialInsurance: number
  housingFund: number
  deductions: Deduction[]
  totalDeductions: number

  // 實發
  netSalary: number

  status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID'
}
```

## 環境變數

```env
DATABASE_URL="postgresql://user:password@localhost:5432/payroll_calculator"
PORT=3003
TAX_YEAR=2024
SOCIAL_INSURANCE_RATE=0.08
HOUSING_FUND_RATE=0.12
```

## 薪資單範例

系統自動生成 PDF 格式薪資單，包含：
- 員工基本資訊
- 薪資明細
- 扣款明細
- 實發金額
- 累計薪資統計

## 許可證

MIT
