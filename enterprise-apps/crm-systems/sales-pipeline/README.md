# Sales Pipeline Manager

基於 Python FastAPI + PostgreSQL 的銷售漏斗管理系統，專注於銷售機會追蹤和預測分析。

## 功能特點

- 🎯 銷售漏斗管理 - 完整的銷售階段追蹤
- 📊 視覺化儀表板 - 實時銷售數據視覺化
- 🤖 AI 銷售預測 - 基於歷史數據的銷售預測
- 📈 轉化率分析 - 各階段轉化率統計
- 👥 團隊協作 - 多用戶銷售團隊管理
- 📧 自動通知 - 重要事件自動提醒
- 📱 RESTful API - 完整的 API 文檔
- 🔐 OAuth2 認證 - 安全的身份驗證

## 技術棧

- **後端框架**: FastAPI
- **資料庫**: PostgreSQL
- **ORM**: SQLAlchemy
- **遷移**: Alembic
- **認證**: OAuth2 + JWT
- **API 文檔**: Swagger/OpenAPI
- **測試**: Pytest
- **背景任務**: Celery + Redis

## 快速開始

### 環境要求

- Python 3.9+
- PostgreSQL 13+
- Redis (可選，用於背景任務)

### 安裝

```bash
# 創建虛擬環境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安裝依賴
pip install -r requirements.txt
```

### 配置

```bash
# 複製環境變數檔案
cp .env.example .env

# 編輯 .env 設置資料庫連接等
```

### 資料庫初始化

```bash
# 運行資料庫遷移
alembic upgrade head

# (可選) 載入測試數據
python scripts/seed_data.py
```

### 啟動服務

```bash
# 開發模式
uvicorn app.main:app --reload

# 生產模式
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

訪問 http://localhost:8000/docs 查看 API 文檔

## API 文檔

### 認證

所有 API 請求需要在 Header 中包含 Bearer Token：

```
Authorization: Bearer {your_access_token}
```

### 獲取 Token

```http
POST /api/v1/auth/token
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=yourpassword
```

### 銷售漏斗 API

#### 獲取漏斗概覽

```http
GET /api/v1/pipeline/overview
Authorization: Bearer {token}
```

響應：
```json
{
  "stages": [
    {
      "name": "潛在客戶",
      "count": 45,
      "total_value": 2500000,
      "conversion_rate": 0.65
    },
    {
      "name": "需求確認",
      "count": 30,
      "total_value": 1800000,
      "conversion_rate": 0.78
    }
  ],
  "total_opportunities": 120,
  "total_pipeline_value": 8500000,
  "weighted_pipeline_value": 5200000
}
```

#### 獲取所有銷售機會

```http
GET /api/v1/opportunities?stage=需求確認&sort_by=amount
Authorization: Bearer {token}
```

#### 創建銷售機會

```http
POST /api/v1/opportunities
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_name": "ABC 科技公司",
  "contact_name": "張經理",
  "contact_email": "zhang@abc.com",
  "opportunity_name": "企業 ERP 系統採購",
  "stage": "潛在客戶",
  "amount": 500000,
  "probability": 30,
  "expected_close_date": "2025-12-31",
  "products": ["ERP 系統", "實施服務"],
  "notes": "初步接觸，對產品有興趣"
}
```

#### 更新銷售階段

```http
PATCH /api/v1/opportunities/{id}/stage
Authorization: Bearer {token}
Content-Type: application/json

{
  "stage": "需求確認",
  "probability": 50,
  "notes": "完成需求訪談"
}
```

#### 獲取銷售機會歷史

```http
GET /api/v1/opportunities/{id}/history
Authorization: Bearer {token}
```

### 銷售預測 API

#### 獲取銷售預測

```http
GET /api/v1/forecast?period=quarter&year=2025&quarter=4
Authorization: Bearer {token}
```

響應：
```json
{
  "period": "Q4 2025",
  "forecast": {
    "optimistic": 12000000,
    "realistic": 8500000,
    "pessimistic": 6000000
  },
  "by_stage": [
    {
      "stage": "提案",
      "count": 15,
      "total_value": 3500000,
      "weighted_value": 2100000
    }
  ]
}
```

### 報表 API

#### 轉化率分析

```http
GET /api/v1/reports/conversion-rate?start_date=2025-01-01&end_date=2025-12-31
Authorization: Bearer {token}
```

#### 銷售趨勢

```http
GET /api/v1/reports/sales-trend?period=monthly&year=2025
Authorization: Bearer {token}
```

#### 銷售人員業績

```http
GET /api/v1/reports/sales-performance?period=quarter
Authorization: Bearer {token}
```

## 資料庫結構

### 核心資料表

```sql
-- 用戶表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 客戶表
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    industry VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 銷售機會表
CREATE TABLE opportunities (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    opportunity_name VARCHAR(255) NOT NULL,
    stage VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2),
    probability INTEGER,
    expected_close_date DATE,
    actual_close_date DATE,
    owner_id INTEGER REFERENCES users(id),
    products TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 階段歷史表
CREATE TABLE stage_history (
    id SERIAL PRIMARY KEY,
    opportunity_id INTEGER REFERENCES opportunities(id),
    from_stage VARCHAR(50),
    to_stage VARCHAR(50) NOT NULL,
    changed_by INTEGER REFERENCES users(id),
    notes TEXT,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- 活動記錄表
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    opportunity_id INTEGER REFERENCES opportunities(id),
    activity_type VARCHAR(50),
    subject VARCHAR(255),
    description TEXT,
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 銷售漏斗階段

系統預設的銷售階段（可自定義）：

1. **潛在客戶** (Lead) - 初步接觸
2. **需求確認** (Qualification) - 確認需求和預算
3. **方案提案** (Proposal) - 提交解決方案
4. **商務談判** (Negotiation) - 價格和條款談判
5. **合約簽訂** (Contract) - 簽約階段
6. **成交** (Won) - 成功成交
7. **失敗** (Lost) - 未成交

## 使用範例

### Python SDK

```python
from sales_pipeline_client import SalesPipelineClient

# 初始化客戶端
client = SalesPipelineClient(
    base_url="http://localhost:8000",
    api_key="your_api_key"
)

# 創建銷售機會
opportunity = client.opportunities.create(
    customer_name="XYZ 公司",
    opportunity_name="軟體授權採購",
    stage="潛在客戶",
    amount=300000,
    probability=25
)

# 更新階段
client.opportunities.update_stage(
    opportunity_id=opportunity.id,
    new_stage="需求確認",
    probability=40,
    notes="需求訪談完成，預算確認"
)

# 獲取漏斗概覽
overview = client.pipeline.get_overview()
print(f"總管道價值: {overview.total_pipeline_value:,.0f}")

# 獲取銷售預測
forecast = client.forecast.get_quarterly(year=2025, quarter=4)
print(f"Q4 預測 (實際): {forecast.realistic:,.0f}")
```

## 測試

```bash
# 運行所有測試
pytest

# 運行測試並顯示覆蓋率
pytest --cov=app --cov-report=html

# 運行特定測試
pytest tests/test_opportunities.py
```

## 部署

### Docker

```bash
# 構建映像
docker build -t sales-pipeline .

# 運行容器
docker-compose up -d
```

### Kubernetes

```bash
# 應用配置
kubectl apply -f k8s/

# 檢查狀態
kubectl get pods -n sales-pipeline
```

## 環境變數

| 變數名 | 說明 | 預設值 |
|--------|------|--------|
| DATABASE_URL | PostgreSQL 連接字串 | - |
| SECRET_KEY | JWT 密鑰 | - |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token 過期時間 | 30 |
| REDIS_URL | Redis 連接字串 | redis://localhost:6379 |
| EMAIL_ENABLED | 是否啟用郵件通知 | false |

## 功能路線圖

- [x] 基礎 CRUD API
- [x] OAuth2 認證
- [x] 銷售漏斗管理
- [x] 階段歷史追蹤
- [x] 基礎報表
- [ ] AI 銷售預測
- [ ] 郵件整合
- [ ] 日曆同步
- [ ] Slack 整合
- [ ] 移動應用 API
- [ ] 即時通知
- [ ] 高級報表分析
- [ ] 匯入/匯出功能

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 相關資源

- [FastAPI 文檔](https://fastapi.tiangolo.com/)
- [SQLAlchemy 文檔](https://docs.sqlalchemy.org/)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)
