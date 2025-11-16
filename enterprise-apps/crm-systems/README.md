# CRM 系統 (Customer Relationship Management Systems)
🤖 **AI-Driven | AI-Native** 🚀

客戶關係管理 (CRM) 系統幫助企業管理與客戶的互動關係，提升銷售效率和客戶滿意度。使用 AI 輔助開發可以快速建立功能完整、智能化的 CRM 系統。

## 📋 目錄

- [CRM 系統概述](#crm-系統概述)
- [核心功能模組](#核心功能模組)
- [技術架構](#技術架構)
- [推薦技術棧](#推薦技術棧)
- [AI 智能功能](#ai-智能功能)
- [開發實例](#開發實例)
- [開發路線圖](#開發路線圖)

---

## 🎯 CRM 系統概述

### 什麼是 CRM？

CRM（客戶關係管理）系統是管理企業與現有及潛在客戶之間關係的工具，主要包括：
- **銷售管理**：銷售機會、報價、訂單
- **客戶管理**：客戶資料、互動記錄、客戶分級
- **行銷自動化**：活動管理、郵件行銷、線索培育
- **客戶服務**：工單系統、知識庫、客戶支援
- **數據分析**：銷售分析、客戶洞察、預測分析

### CRM 系統的價值

- 📊 **提升銷售效率**：自動化銷售流程，提高成交率
- 🎯 **精準行銷**：客戶分群，個性化行銷
- 💬 **改善客戶服務**：統一客戶視圖，快速響應
- 📈 **數據驅動決策**：銷售預測，業績分析
- 🤝 **增強客戶忠誠度**：持續互動，客戶關懷

---

## 🧩 核心功能模組

### 1. 客戶管理 (Customer Management)

#### 客戶資料管理
```typescript
interface Customer {
  id: string;
  name: string;
  company: string;
  industry: string;
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  status: 'LEAD' | 'PROSPECT' | 'CUSTOMER' | 'PARTNER';
  source: string;
  rating: 'HOT' | 'WARM' | 'COLD';
  contacts: Contact[];
  addresses: Address[];
  tags: string[];
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 核心功能
- **客戶檔案**：完整的客戶資訊管理
- **聯絡人管理**：關聯的聯絡人信息
- **客戶分級**：ABC 分類、信用評級
- **客戶標籤**：自定義標籤分類
- **互動記錄**：所有接觸點歷史
- **客戶視圖**：360° 客戶全貌

### 2. 銷售管理 (Sales Management)

#### 銷售漏斗 (Sales Funnel)
```
線索 (Leads)
    ↓
機會 (Opportunities)
    ↓
報價 (Quotes)
    ↓
訂單 (Orders)
    ↓
成交客戶 (Customers)
```

#### 銷售機會管理
```typescript
interface Opportunity {
  id: string;
  name: string;
  customer: Customer;
  stage: 'PROSPECTING' | 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  amount: number;
  probability: number; // 0-100
  expectedCloseDate: Date;
  products: Product[];
  competitors: string[];
  nextSteps: string;
  owner: User;
  team: User[];
  activities: Activity[];
  documents: Document[];
}
```

#### 核心功能
- **線索管理**：線索捕獲、分配、轉化
- **機會追蹤**：銷售階段管理、贏率預測
- **報價管理**：報價單生成、版本控制
- **銷售預測**：基於機會的銷售預測
- **銷售儀表板**：實時銷售數據展示
- **業績追蹤**：個人/團隊業績統計

### 3. 行銷自動化 (Marketing Automation)

#### 行銷活動
```typescript
interface Campaign {
  id: string;
  name: string;
  type: 'EMAIL' | 'SOCIAL' | 'EVENT' | 'WEBINAR' | 'CONTENT';
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  startDate: Date;
  endDate: Date;
  budget: number;
  targetAudience: Segment;
  channels: Channel[];
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    roi: number;
  };
}
```

#### 核心功能
- **郵件行銷**：批量郵件、自動化流程
- **線索評分**：基於行為的自動評分
- **客戶分群**：多維度客戶分組
- **行銷活動**：活動策劃、執行、追蹤
- **落地頁**：表單設計、A/B 測試
- **社交媒體**：社交媒體整合、監控

### 4. 客戶服務 (Customer Service)

#### 工單系統
```typescript
interface Ticket {
  id: string;
  ticketNumber: string;
  customer: Customer;
  contact: Contact;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  category: string;
  assignedTo: User;
  channel: 'EMAIL' | 'PHONE' | 'CHAT' | 'WEB' | 'SOCIAL';
  sla: {
    responseTime: number;
    resolutionTime: number;
  };
  comments: Comment[];
  attachments: File[];
  createdAt: Date;
  resolvedAt?: Date;
}
```

#### 核心功能
- **工單管理**：創建、分配、追蹤、解決
- **知識庫**：常見問題、解決方案
- **服務等級協議 (SLA)**：響應時間、解決時間
- **客戶滿意度**：滿意度調查、NPS 評分
- **多渠道支援**：郵件、電話、聊天、社交媒體
- **自助服務**：客戶門戶、FAQ、聊天機器人

### 5. 報表分析 (Analytics & Reporting)

#### 核心報表
- **銷售報表**
  - 銷售漏斗分析
  - 成交率分析
  - 銷售預測
  - 產品銷售分析
  - 地區銷售分析

- **客戶報表**
  - 客戶獲取成本 (CAC)
  - 客戶生命週期價值 (LTV)
  - 客戶流失率
  - 客戶滿意度趨勢

- **行銷報表**
  - 行銷活動 ROI
  - 線索轉化率
  - 渠道效果分析
  - 內容績效分析

- **服務報表**
  - 工單統計
  - 平均解決時間
  - 首次響應時間
  - 客戶滿意度

---

## 🏗️ 技術架構

### 系統架構圖

```
┌─────────────────────────────────────────────────────────┐
│                     前端層 (Frontend)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Web App  │  │ Mobile   │  │ Admin    │  │ Customer │ │
│  │ (React)  │  │ App      │  │ Portal   │  │ Portal   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   API 閘道 (API Gateway)                  │
│         認證、授權、限流、日誌、監控                         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   應用服務層 (Services)                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │  Customer  │ │   Sales    │ │ Marketing  │           │
│  │  Service   │ │  Service   │ │  Service   │  ...      │
│  └────────────┘ └────────────┘ └────────────┘           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     數據層 (Data Layer)                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ PostgreSQL │ │   Redis    │ │ Elastic-   │           │
│  │  (主庫)    │ │  (快取)    │ │  search    │           │
│  └────────────┘ └────────────┘ └────────────┘           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   整合層 (Integrations)                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │   郵件     │ │   SMS      │ │   社交     │           │
│  │  服務      │ │   服務     │ │  媒體      │  ...      │
│  └────────────┘ └────────────┘ └────────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 推薦技術棧

### 後端選擇

#### 選項 1: Node.js + NestJS + TypeORM ⭐⭐⭐⭐⭐
```typescript
// 範例：客戶服務
@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  async findAll(filters: CustomerFilters): Promise<Customer[]> {
    const query = this.customerRepository.createQueryBuilder('customer');

    if (filters.industry) {
      query.andWhere('customer.industry = :industry', { industry: filters.industry });
    }

    if (filters.rating) {
      query.andWhere('customer.rating = :rating', { rating: filters.rating });
    }

    return await query.getMany();
  }

  async getCustomer360(customerId: string): Promise<Customer360> {
    const customer = await this.customerRepository.findOne(customerId, {
      relations: ['contacts', 'opportunities', 'orders', 'tickets']
    });

    return {
      customer,
      recentActivities: await this.getRecentActivities(customerId),
      salesSummary: await this.getSalesSummary(customerId),
      supportSummary: await this.getSupportSummary(customerId),
    };
  }
}
```

**優勢**：
- TypeScript 類型安全
- 模組化架構
- 豐富的生態系統
- 開發效率高

#### 選項 2: Python + Django/FastAPI ⭐⭐⭐⭐
```python
# 範例：銷售機會管理
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/opportunities/", response_model=OpportunityResponse)
async def create_opportunity(
    opportunity: OpportunityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_opportunity = Opportunity(
        **opportunity.dict(),
        owner_id=current_user.id,
        created_at=datetime.now()
    )
    db.add(db_opportunity)
    db.commit()
    db.refresh(db_opportunity)
    return db_opportunity

@router.get("/opportunities/forecast")
async def get_sales_forecast(
    quarter: str,
    db: Session = Depends(get_db)
):
    opportunities = db.query(Opportunity).filter(
        Opportunity.expected_close_date.between(start_date, end_date),
        Opportunity.stage != 'CLOSED_LOST'
    ).all()

    forecast = {
        'total_value': sum(opp.amount for opp in opportunities),
        'weighted_value': sum(opp.amount * opp.probability / 100 for opp in opportunities),
        'opportunities_count': len(opportunities)
    }

    return forecast
```

**優勢**：
- 快速開發
- AI/ML 整合容易
- 豐富的數據處理庫
- Django Admin 內建後台

### 前端選擇

#### React + Ant Design Pro ⭐⭐⭐⭐⭐
```tsx
// 範例：客戶列表頁面
import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { customerService } from '@/services';

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

  const columns = [
    {
      title: '客戶名稱',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Customer) => (
        <a href={`/customers/${record.id}`}>{text}</a>
      ),
    },
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: '行業',
      dataIndex: 'industry',
      key: 'industry',
    },
    {
      title: '評級',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: string) => {
        const colorMap = { HOT: 'red', WARM: 'orange', COLD: 'blue' };
        return <Tag color={colorMap[rating]}>{rating}</Tag>;
      },
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag>{status}</Tag>,
    },
    {
      title: '建立日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  useEffect(() => {
    loadCustomers();
  }, [pagination.current]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, total } = await customerService.getCustomers({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setCustomers(data);
      setPagination({ ...pagination, total });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="客戶列表"
      extra={
        <Button type="primary" icon={<PlusOutlined />} href="/customers/new">
          新增客戶
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={customers}
        loading={loading}
        pagination={pagination}
        onChange={(newPagination) => setPagination(newPagination)}
      />
    </Card>
  );
};

export default CustomerList;
```

### 資料庫設計

#### 核心資料表結構

```sql
-- 客戶表
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(50),
  status VARCHAR(50),
  rating VARCHAR(50),
  source VARCHAR(100),
  website VARCHAR(255),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 聯絡人表
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  title VARCHAR(100),
  department VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 銷售機會表
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  stage VARCHAR(50),
  amount DECIMAL(15, 2),
  probability INTEGER,
  expected_close_date DATE,
  owner_id UUID REFERENCES users(id),
  next_steps TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 活動記錄表
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50), -- 'call', 'email', 'meeting', 'task'
  subject VARCHAR(255),
  description TEXT,
  customer_id UUID REFERENCES customers(id),
  opportunity_id UUID REFERENCES opportunities(id),
  contact_id UUID REFERENCES contacts(id),
  owner_id UUID REFERENCES users(id),
  status VARCHAR(50),
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 工單表
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE,
  customer_id UUID REFERENCES customers(id),
  contact_id UUID REFERENCES contacts(id),
  subject VARCHAR(255),
  description TEXT,
  priority VARCHAR(50),
  status VARCHAR(50),
  category VARCHAR(100),
  assigned_to UUID REFERENCES users(id),
  channel VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

---

## 🤖 AI 智能功能

### 1. 智能線索評分

```typescript
// AI 驅動的線索評分
interface LeadScoringModel {
  // 人口統計學評分
  demographicScore: {
    industry: number;      // 行業匹配度
    companySize: number;   // 公司規模
    revenue: number;       // 營收規模
    location: number;      // 地理位置
  };

  // 行為評分
  behaviorScore: {
    websiteVisits: number;     // 網站訪問次數
    emailOpens: number;        // 郵件打開率
    contentDownloads: number;  // 內容下載次數
    formSubmissions: number;   // 表單提交次數
  };

  // 互動評分
  engagementScore: {
    lastActivityDays: number;  // 最後活動天數
    activityFrequency: number; // 活動頻率
    responseRate: number;      // 響應率
  };

  totalScore: number;  // 總分 0-100
  grade: 'A' | 'B' | 'C' | 'D';  // 評級
}

// 使用 AI 計算線索評分
async function calculateLeadScore(leadId: string): Promise<number> {
  const lead = await getLeadDetails(leadId);
  const activities = await getLeadActivities(leadId);

  // 可以整合機器學習模型
  const score = await aiService.predictLeadScore({
    demographic: lead.demographic,
    behavior: activities.behavior,
    engagement: activities.engagement,
  });

  return score;
}
```

### 2. 銷售預測

```python
# 使用 AI 進行銷售預測
from sklearn.ensemble import RandomForestRegressor
import pandas as pd

class SalesForecastService:
    def __init__(self):
        self.model = RandomForestRegressor()

    def train_model(self, historical_data):
        """訓練銷售預測模型"""
        features = ['month', 'quarter', 'previous_sales', 'marketing_spend',
                    'num_opportunities', 'avg_deal_size']
        X = historical_data[features]
        y = historical_data['actual_sales']

        self.model.fit(X, y)

    def forecast_next_quarter(self, current_opportunities):
        """預測下季度銷售"""
        features = self.extract_features(current_opportunities)
        prediction = self.model.predict([features])

        return {
            'predicted_sales': prediction[0],
            'confidence_interval': self.calculate_confidence(prediction),
            'key_factors': self.get_feature_importance()
        }
```

### 3. 智能推薦

```typescript
// 智能產品推薦
interface ProductRecommendation {
  productId: string;
  productName: string;
  score: number;
  reason: string;
}

async function getProductRecommendations(
  customerId: string
): Promise<ProductRecommendation[]> {
  const customer = await getCustomer(customerId);
  const purchaseHistory = await getPurchaseHistory(customerId);
  const similarCustomers = await findSimilarCustomers(customer);

  // 基於協同過濾的推薦
  const recommendations = await aiService.recommendProducts({
    customer,
    purchaseHistory,
    similarCustomers,
  });

  return recommendations;
}

// 智能下一步建議
async function suggestNextAction(
  opportunityId: string
): Promise<ActionSuggestion> {
  const opportunity = await getOpportunity(opportunityId);
  const similarWonDeals = await getSimilarWonDeals(opportunity);

  // 分析成功案例，建議下一步
  const suggestion = await aiService.analyzeAndSuggest({
    currentStage: opportunity.stage,
    daysInStage: opportunity.daysInCurrentStage,
    successPatterns: similarWonDeals,
  });

  return suggestion;
}
```

### 4. 客戶流失預測

```python
# 客戶流失預測
class ChurnPredictionService:
    def predict_churn_risk(self, customer_id: str) -> dict:
        """預測客戶流失風險"""
        customer = self.get_customer_data(customer_id)

        features = {
            'days_since_last_purchase': customer.days_since_last_purchase,
            'total_purchases': customer.total_purchases,
            'avg_order_value': customer.avg_order_value,
            'support_tickets_count': customer.support_tickets_count,
            'nps_score': customer.nps_score,
            'engagement_score': customer.engagement_score,
        }

        # 使用訓練好的模型預測
        churn_probability = self.model.predict_proba([list(features.values())])[0][1]

        return {
            'customer_id': customer_id,
            'churn_risk': 'high' if churn_probability > 0.7 else 'medium' if churn_probability > 0.4 else 'low',
            'churn_probability': churn_probability,
            'risk_factors': self.identify_risk_factors(features),
            'recommended_actions': self.get_retention_actions(churn_probability)
        }
```

---

## 🗺️ 開發路線圖

### MVP 階段（4-6 週）

#### Week 1-2: 核心架構
- [ ] 專案初始化
- [ ] 資料庫設計
- [ ] 認證系統
- [ ] 基礎 CRUD API

#### Week 3-4: 客戶與銷售
- [ ] 客戶管理
- [ ] 聯絡人管理
- [ ] 銷售機會管理
- [ ] 基礎儀表板

#### Week 5-6: 活動與報表
- [ ] 活動管理
- [ ] 任務管理
- [ ] 基礎報表
- [ ] 部署測試

### 完整版（3-4 個月）

#### 第二階段: 行銷自動化
- [ ] 郵件行銷
- [ ] 線索評分
- [ ] 行銷活動管理
- [ ] 落地頁設計器

#### 第三階段: 客戶服務
- [ ] 工單系統
- [ ] 知識庫
- [ ] 客戶門戶
- [ ] SLA 管理

#### 第四階段: AI 功能
- [ ] 智能線索評分
- [ ] 銷售預測
- [ ] 流失預測
- [ ] 智能推薦

#### 第五階段: 整合與優化
- [ ] 第三方整合
- [ ] 性能優化
- [ ] 移動應用
- [ ] 完整文檔

---

## 🎯 開發建議

### AI 輔助開發技巧

1. **數據模型設計**
   ```
   提示: "設計一個 CRM 系統的資料庫 Schema，包含客戶、聯絡人、
   銷售機會、活動記錄。使用 PostgreSQL，考慮查詢性能。"
   ```

2. **業務邏輯實現**
   ```
   提示: "實現銷售機會的階段轉換邏輯，包括驗證規則、
   自動化任務觸發、通知發送。使用 NestJS。"
   ```

3. **報表生成**
   ```
   提示: "生成銷售漏斗報表的 SQL 查詢，統計各階段機會數量、
   金額、平均停留時間、轉化率。"
   ```

### 最佳實踐

✅ **推薦**：
- 客戶數據安全第一
- 實現完整的審計日誌
- 支援自定義欄位
- 移動端響應式設計
- 第三方整合能力

❌ **避免**：
- 複雜的用戶界面
- 缺少數據驗證
- 忽略性能優化
- 沒有備份策略

---

## 📚 參考資源

### 開源 CRM 系統
- **SuiteCRM** - 功能完整的開源 CRM
- **EspoCRM** - 現代化的開源 CRM
- **Odoo CRM** - Odoo 的 CRM 模組
- **Twenty** - 現代化的開源 CRM

### 學習資源
- Salesforce 開發者文檔
- HubSpot API 文檔
- CRM 最佳實踐指南

---

**🚀 開始使用 AI 建立你的 CRM 系統，提升客戶關係管理！**
