# HR Management - 人力資源管理範例

此類別包含 TypeScript/Node.js 專案，提供人力資源管理相關功能。

## 子專案列表

### 1. ⏰ Attendance Tracker (考勤追蹤系統)
**技術棧**: TypeScript, Node.js, Express
**功能**: 打卡記錄、出勤統計、異常提醒

### 2. 👥 Employee Directory (員工通訊錄)
**技術棧**: TypeScript, Node.js, MongoDB
**功能**: 員工資料管理、組織架構、權限控制

### 3. 🏖️ Leave Management (請假管理系統)
**技術棧**: TypeScript, Node.js, Express
**功能**: 請假申請、審批流程、假期統計

### 4. 💰 Payroll Calculator (薪資計算器)
**技術棧**: TypeScript, Node.js, Express
**功能**: 薪資計算、稅務處理、薪資條生成

## 運行指南

由於這些專案使用 TypeScript/Node.js，運行步驟如下：

```bash
# 進入任一子專案目錄
cd attendance-tracker  # 或其他子專案

# 安裝依賴
npm install

# 運行開發服務器
npm run dev

# 或運行生產版本
npm run build
npm start
```

## TypeScript 範例：簡單的薪資計算

```typescript
// payroll-calculator 範例
interface Employee {
  id: string;
  name: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
}

class PayrollCalculator {
  calculateNetSalary(employee: Employee): number {
    const grossSalary = employee.baseSalary + employee.allowances;
    const netSalary = grossSalary - employee.deductions;
    return netSalary;
  }

  generatePayslip(employee: Employee): string {
    const netSalary = this.calculateNetSalary(employee);
    return `
      薪資單
      員工: ${employee.name}
      基本薪資: $${employee.baseSalary}
      津貼: $${employee.allowances}
      扣除: $${employee.deductions}
      應發薪資: $${netSalary}
    `;
  }
}

// 使用範例
const calculator = new PayrollCalculator();
const employee = {
  id: 'E001',
  name: '張三',
  baseSalary: 50000,
  allowances: 5000,
  deductions: 3000
};

console.log(calculator.generatePayslip(employee));
```

## TypeScript 範例：請假管理 API

```typescript
import express from 'express';

interface LeaveRequest {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  type: 'annual' | 'sick' | 'personal';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

const app = express();
app.use(express.json());

// 模擬資料庫
const leaveRequests: LeaveRequest[] = [];

// 提交請假申請
app.post('/api/leave-requests', (req, res) => {
  const request: LeaveRequest = {
    ...req.body,
    status: 'pending'
  };
  leaveRequests.push(request);
  res.json({ success: true, request });
});

// 查詢請假記錄
app.get('/api/leave-requests/:employeeId', (req, res) => {
  const requests = leaveRequests.filter(
    r => r.employeeId === req.params.employeeId
  );
  res.json(requests);
});

// 審批請假
app.patch('/api/leave-requests/:id/approve', (req, res) => {
  // 審批邏輯
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Leave Management API running on port 3000');
});
```

## 注意事項

⚠️ 這些專案是 TypeScript/Node.js 專案，與其他 Python 專案的技術棧不同。

確保您已安裝：
- Node.js (v14+)
- npm 或 yarn
- TypeScript
- MongoDB (用於部分專案)

## 推薦學習資源

- TypeScript 官方文檔: https://www.typescriptlang.org/docs/
- Node.js 指南: https://nodejs.org/en/docs/
- Express 框架: https://expressjs.com/
