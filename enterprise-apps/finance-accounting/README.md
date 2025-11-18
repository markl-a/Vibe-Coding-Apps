# 財務會計系統 (Finance & Accounting System)
🤖 **AI-Driven | AI-Native** 🚀

財務會計系統幫助企業管理財務數據、生成財務報表、確保合規性。使用 AI 輔助開發可以快速建立功能完整、準確可靠的財務系統。

## ✨ **NEW: AI 增強功能已完成！**

所有應用現已整合先進的 AI 功能，包括智能預測、異常檢測、優化建議等。查看 [IMPROVEMENTS.md](./IMPROVEMENTS.md) 了解詳情。

### 🎯 已完成的 AI 功能
- ✅ **Invoice Generator**: 智能價格建議、項目分類、健康度分析 (10 項 AI 功能)
- ✅ **Expense Tracker**: 支出預測、模式識別、節省建議 (7 項 AI 功能)
- ✅ **Budget Planner**: 智能預算規劃和財務目標管理 (新增應用)

## 📋 目錄

- [可用應用程式](#可用應用程式)
- [財務系統概述](#財務系統概述)
- [核心功能模組](#核心功能模組)
- [技術架構](#技術架構)
- [推薦技術棧](#推薦技術棧)
- [AI 智能功能](#ai-智能功能)
- [安全與合規](#安全與合規)

---

## 📱 可用應用程式

### 1. 📄 [Invoice Generator](./invoice-generator/) - 發票生成器
專業發票創建和管理系統，支援 PDF 生成。
- ✅ **AI 增強**: 智能價格建議、項目分類、健康度分析
- 🔧 **功能**: 客戶管理、產品目錄、自動計算、PDF 導出
- 📊 **狀態**: 完整實現 + AI 功能測試通過

### 2. 💰 [Expense Tracker](./expense-tracker/) - 費用追蹤器
智能費用追蹤和分析系統，支援預算管理。
- ✅ **AI 增強**: 支出預測、模式識別、節省建議、現金流預測
- 🔧 **功能**: 費用記錄、分類管理、統計分析、視覺化圖表
- 📊 **狀態**: 完整實現 + AI 功能測試通過

### 3. 📊 [Financial Dashboard](./financial-dashboard/) - 財務儀表板
即時財務數據視覺化和 KPI 追蹤系統。
- 🔧 **功能**: 收入支出趨勢、利潤分析、現金流、財務比率
- 📊 **狀態**: 核心功能完整

### 4. 🧾 [Receipt OCR](./receipt-ocr/) - 發票 OCR 識別器
自動識別發票並提取關鍵資訊。
- 🔧 **功能**: OCR 識別、資訊提取、批次處理、歷史記錄
- 📊 **狀態**: 核心功能完整

### 5. 🎯 [Budget Planner](./budget-planner/) - 預算規劃器 ⭐ NEW
智能預算規劃和財務目標管理系統。
- ✅ **AI 增強**: 智能預算建議、目標追蹤、優化方案
- 🔧 **功能**: 多維度預算、財務目標、預算範本、健康度評分
- 📊 **狀態**: 文檔完整

### 快速啟動
```bash
# 進入任一應用目錄
cd invoice-generator

# 安裝依賴
pip install -r requirements.txt

# 啟動應用
streamlit run app.py
```

---

## 🎯 財務系統概述

### 核心功能領域

- **總帳管理 (General Ledger)**：會計科目、憑證、帳簿
- **應收帳款 (AR)**：客戶應收、收款、帳齡分析
- **應付帳款 (AP)**：供應商應付、付款、對帳
- **固定資產**：資產登記、折舊計算、處置
- **成本會計**：成本中心、成本分攤、成本分析
- **財務報表**：資產負債表、損益表、現金流量表
- **預算管理**：預算編制、預算控制、差異分析
- **稅務管理**：稅務計算、申報、合規

---

## 🧩 核心功能模組

### 1. 總帳管理

#### 會計科目表 (Chart of Accounts)
```typescript
interface Account {
  id: string;
  code: string; // 科目代碼 如: 1001, 1002
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  subType: string; // 如: 'CURRENT_ASSET', 'FIXED_ASSET'
  parentId?: string;
  level: number;
  balance: number;
  normalBalance: 'DEBIT' | 'CREDIT';
  isActive: boolean;
  isBankAccount: boolean;
  currency: string;
}
```

#### 會計憑證 (Journal Entry)
```typescript
interface JournalEntry {
  id: string;
  journalNumber: string;
  date: Date;
  type: 'STANDARD' | 'ADJUSTING' | 'CLOSING' | 'REVERSING';
  status: 'DRAFT' | 'POSTED' | 'VOID';
  description: string;
  reference?: string; // 單據號

  lines: JournalLine[];

  totalDebit: number;
  totalCredit: number;

  createdBy: string;
  approvedBy?: string;
  postedAt?: Date;
}

interface JournalLine {
  id: string;
  accountId: string;
  account: Account;
  debit: number;
  credit: number;
  description: string;
  dimension1?: string; // 部門
  dimension2?: string; // 專案
  dimension3?: string; // 成本中心
}
```

### 2. 應收帳款管理

```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: Date;
  dueDate: Date;

  items: InvoiceItem[];

  subtotal: number;
  taxAmount: number;
  total: number;

  paidAmount: number;
  balance: number;

  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';

  paymentTerms: string;
  notes?: string;

  payments: Payment[];
}

interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  date: Date;
  amount: number;
  method: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD';
  reference?: string;
  bankAccountId?: string;
  status: 'PENDING' | 'CLEARED' | 'BOUNCED';
}
```

### 3. 應付帳款管理

```typescript
interface Bill {
  id: string;
  billNumber: string;
  vendorId: string;
  billDate: Date;
  dueDate: Date;

  items: BillItem[];

  subtotal: number;
  taxAmount: number;
  total: number;

  paidAmount: number;
  balance: number;

  status: 'DRAFT' | 'APPROVED' | 'PARTIAL' | 'PAID' | 'OVERDUE';

  approvedBy?: string;
  approvedAt?: Date;
}
```

### 4. 固定資產管理

```typescript
interface FixedAsset {
  id: string;
  assetNumber: string;
  name: string;
  category: string;

  // 購置資訊
  purchaseDate: Date;
  purchaseCost: number;
  vendorId: string;

  // 折舊資訊
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION';
  usefulLife: number; // 年
  salvageValue: number;

  // 帳面價值
  accumulatedDepreciation: number;
  bookValue: number;

  // 處置資訊
  disposalDate?: Date;
  disposalAmount?: number;
  disposalMethod?: 'SALE' | 'SCRAP' | 'DONATION';

  status: 'IN_USE' | 'DISPOSED' | 'UNDER_MAINTENANCE';
  location: string;
  responsiblePerson: string;
}
```

### 5. 財務報表

```typescript
// 資產負債表 (Balance Sheet)
interface BalanceSheet {
  date: Date;

  // 資產
  assets: {
    currentAssets: AssetCategory[];
    fixedAssets: AssetCategory[];
    otherAssets: AssetCategory[];
    totalAssets: number;
  };

  // 負債
  liabilities: {
    currentLiabilities: LiabilityCategory[];
    longTermLiabilities: LiabilityCategory[];
    totalLiabilities: number;
  };

  // 權益
  equity: {
    capital: number;
    retainedEarnings: number;
    totalEquity: number;
  };
}

// 損益表 (Income Statement)
interface IncomeStatement {
  period: {
    startDate: Date;
    endDate: Date;
  };

  revenue: {
    operatingRevenue: number;
    otherRevenue: number;
    totalRevenue: number;
  };

  costOfGoodsSold: number;
  grossProfit: number;

  operatingExpenses: ExpenseCategory[];
  totalOperatingExpenses: number;

  operatingIncome: number;

  otherIncomeExpenses: number;

  incomeBeforeTax: number;
  incomeTax: number;
  netIncome: number;
}

// 現金流量表 (Cash Flow Statement)
interface CashFlowStatement {
  period: {
    startDate: Date;
    endDate: Date;
  };

  operatingActivities: {
    netIncome: number;
    adjustments: Adjustment[];
    netCashFromOperating: number;
  };

  investingActivities: {
    items: CashFlowItem[];
    netCashFromInvesting: number;
  };

  financingActivities: {
    items: CashFlowItem[];
    netCashFromFinancing: number;
  };

  netChangeInCash: number;
  beginningCash: number;
  endingCash: number;
}
```

---

## 💻 推薦技術棧

### 後端實現

```typescript
// 範例：會計憑證服務
@Injectable()
export class JournalEntryService {
  async createJournalEntry(dto: CreateJournalEntryDto): Promise<JournalEntry> {
    // 驗證借貸平衡
    const totalDebit = dto.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('借貸不平衡');
    }

    const entry = new JournalEntry();
    entry.journalNumber = await this.generateJournalNumber();
    entry.date = dto.date;
    entry.description = dto.description;
    entry.lines = dto.lines;
    entry.totalDebit = totalDebit;
    entry.totalCredit = totalCredit;
    entry.status = 'DRAFT';

    return await this.journalEntryRepository.save(entry);
  }

  async postJournalEntry(id: string): Promise<JournalEntry> {
    const entry = await this.findOne(id);

    if (entry.status !== 'DRAFT') {
      throw new BadRequestException('只能過帳草稿狀態的憑證');
    }

    // 使用事務更新帳戶餘額
    await this.dataSource.transaction(async (manager) => {
      for (const line of entry.lines) {
        await this.updateAccountBalance(
          line.accountId,
          line.debit,
          line.credit,
          manager,
        );
      }

      entry.status = 'POSTED';
      entry.postedAt = new Date();
      await manager.save(entry);
    });

    return entry;
  }

  private async updateAccountBalance(
    accountId: string,
    debit: number,
    credit: number,
    manager: EntityManager,
  ): Promise<void> {
    const account = await manager.findOne(Account, accountId);

    // 根據科目正常餘額方向更新
    if (account.normalBalance === 'DEBIT') {
      account.balance += debit - credit;
    } else {
      account.balance += credit - debit;
    }

    await manager.save(account);
  }
}
```

### 財務報表生成

```typescript
@Injectable()
export class FinancialReportService {
  async generateBalanceSheet(date: Date): Promise<BalanceSheet> {
    // 獲取所有科目餘額
    const accounts = await this.getAccountBalances(date);

    // 分類科目
    const assets = accounts.filter(a => a.type === 'ASSET');
    const liabilities = accounts.filter(a => a.type === 'LIABILITY');
    const equity = accounts.filter(a => a.type === 'EQUITY');

    // 計算總額
    const totalAssets = this.sumBalances(assets);
    const totalLiabilities = this.sumBalances(liabilities);
    const totalEquity = this.sumBalances(equity);

    // 驗證會計等式: 資產 = 負債 + 權益
    if (Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 0.01) {
      throw new Error('資產負債表不平衡');
    }

    return {
      date,
      assets: this.categorizeAssets(assets),
      liabilities: this.categorizeLiabilities(liabilities),
      equity: this.categorizeEquity(equity),
    };
  }

  async generateIncomeStatement(
    startDate: Date,
    endDate: Date,
  ): Promise<IncomeStatement> {
    // 獲取期間內的收入和費用
    const revenue = await this.getRevenue(startDate, endDate);
    const expenses = await this.getExpenses(startDate, endDate);
    const cogs = await this.getCOGS(startDate, endDate);

    const totalRevenue = this.sumAmounts(revenue);
    const totalExpenses = this.sumAmounts(expenses);
    const grossProfit = totalRevenue - cogs;
    const operatingIncome = grossProfit - totalExpenses;

    // 計算稅後淨利
    const incomeTax = operatingIncome * 0.2; // 假設稅率 20%
    const netIncome = operatingIncome - incomeTax;

    return {
      period: { startDate, endDate },
      revenue: { totalRevenue, /* ... */ },
      costOfGoodsSold: cogs,
      grossProfit,
      operatingExpenses: this.categorizeExpenses(expenses),
      totalOperatingExpenses: totalExpenses,
      operatingIncome,
      incomeTax,
      netIncome,
    };
  }
}
```

---

## 🤖 AI 智能功能

### 1. 智能憑證識別

```python
# OCR + AI 自動識別發票並生成憑證
from transformers import pipeline
import pytesseract
from PIL import Image

class IntelligentReceiptProcessing:
    def __init__(self):
        self.ocr_engine = pytesseract
        self.nlp_model = pipeline("ner")

    def process_receipt(self, image_path: str) -> dict:
        """處理發票圖片"""
        # OCR 提取文字
        text = self.ocr_engine.image_to_string(Image.open(image_path))

        # 使用 NLP 提取關鍵資訊
        entities = self.extract_entities(text)

        # 智能分類科目
        account = self.classify_expense_account(entities['description'])

        return {
            'vendor': entities.get('vendor'),
            'date': entities.get('date'),
            'amount': entities.get('amount'),
            'tax': entities.get('tax'),
            'suggested_account': account,
            'confidence': entities.get('confidence'),
        }

    def classify_expense_account(self, description: str) -> str:
        """根據描述智能分類費用科目"""
        # 使用預訓練模型分類
        # 如: "辦公室租金" -> "租金費用"
        #    "員工午餐" -> "餐飲費用"
        classification = self.classifier.predict(description)
        return classification['account_code']
```

### 2. 異常檢測

```typescript
// AI 驅動的財務異常檢測
class FinancialAnomalyDetection {
  async detectAnomalies(period: Period): Promise<Anomaly[]> {
    const transactions = await this.getTransactions(period);
    const anomalies: Anomaly[] = [];

    for (const transaction of transactions) {
      // 1. 金額異常
      if (await this.isAmountAnomaly(transaction)) {
        anomalies.push({
          type: 'UNUSUAL_AMOUNT',
          transaction,
          severity: 'HIGH',
          description: '金額異常：顯著偏離歷史平均值',
        });
      }

      // 2. 重複交易
      if (await this.isDuplicate(transaction)) {
        anomalies.push({
          type: 'DUPLICATE',
          transaction,
          severity: 'MEDIUM',
          description: '可能的重複交易',
        });
      }

      // 3. 不尋常的科目配對
      if (await this.isUnusualAccountPairing(transaction)) {
        anomalies.push({
          type: 'UNUSUAL_PAIRING',
          transaction,
          severity: 'LOW',
          description: '不常見的科目配對',
        });
      }

      // 4. 週末交易
      if (this.isWeekendTransaction(transaction)) {
        anomalies.push({
          type: 'WEEKEND_TRANSACTION',
          transaction,
          severity: 'LOW',
          description: '週末交易需要審查',
        });
      }
    }

    return anomalies;
  }
}
```

### 3. 財務預測

```python
# 使用時間序列預測現金流
from prophet import Prophet
import pandas as pd

class CashFlowForecast:
    def forecast_cash_flow(self, months: int = 12) -> dict:
        """預測未來現金流"""
        # 獲取歷史現金流數據
        historical_data = self.get_historical_cash_flow()

        # 準備數據
        df = pd.DataFrame({
            'ds': historical_data['dates'],
            'y': historical_data['amounts'],
        })

        # 建立模型
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
        )
        model.fit(df)

        # 預測未來
        future = model.make_future_dataframe(periods=months, freq='M')
        forecast = model.predict(future)

        return {
            'forecast': forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(months),
            'trend': self.analyze_trend(forecast),
            'seasonality': self.analyze_seasonality(model),
            'alerts': self.generate_alerts(forecast),
        }
```

---

## 🔒 安全與合規

### 審計追蹤

```typescript
// 完整的審計日誌
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'VOID';
  entityType: 'JOURNAL_ENTRY' | 'INVOICE' | 'PAYMENT';
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
}

// 自動記錄所有財務操作
@Injectable()
export class AuditService {
  async logChange(params: AuditLogParams): Promise<void> {
    const log = new AuditLog();
    log.timestamp = new Date();
    log.userId = params.userId;
    log.action = params.action;
    log.entityType = params.entityType;
    log.entityId = params.entityId;
    log.oldValue = params.oldValue;
    log.newValue = params.newValue;

    await this.auditLogRepository.save(log);
  }
}
```

### 權限控制

```typescript
// 細粒度的權限控制
enum FinancePermission {
  // 憑證
  CREATE_JOURNAL_ENTRY = 'finance:journal:create',
  POST_JOURNAL_ENTRY = 'finance:journal:post',
  VOID_JOURNAL_ENTRY = 'finance:journal:void',

  // 應收
  CREATE_INVOICE = 'finance:invoice:create',
  APPROVE_INVOICE = 'finance:invoice:approve',

  // 應付
  CREATE_BILL = 'finance:bill:create',
  APPROVE_BILL = 'finance:bill:approve',

  // 報表
  VIEW_FINANCIAL_REPORTS = 'finance:reports:view',
  EXPORT_FINANCIAL_DATA = 'finance:data:export',

  // 設定
  MANAGE_CHART_OF_ACCOUNTS = 'finance:accounts:manage',
  CLOSE_PERIOD = 'finance:period:close',
}
```

---

## 📚 參考資源

### 會計準則
- **IFRS** - 國際財務報導準則
- **GAAP** - 一般公認會計原則
- **本地會計準則** - 各國家地區準則

### 開源財務軟體
- **GNUCash** - 個人/小企業財務軟體
- **Odoo Accounting** - Odoo 會計模組
- **ERPNext** - 包含會計功能的 ERP

---

**🚀 開始使用 AI 建立你的財務會計系統，確保財務準確與合規！**
