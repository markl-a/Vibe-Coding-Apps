# 智能需求預測系統
🤖 **AI-Driven | AI-Native** 🚀

基於 Prophet 時間序列預測模型的智能需求預測系統，幫助企業優化庫存管理和採購決策。

## 📋 目錄

- [功能特性](#功能特性)
- [技術架構](#技術架構)
- [快速開始](#快速開始)
- [API 文檔](#api-文檔)
- [使用示例](#使用示例)
- [部署指南](#部署指南)

---

## ✨ 功能特性

### 核心功能

- **時間序列預測**：使用 Facebook Prophet 進行需求預測
- **多週期預測**：支持日、週、月多種時間粒度
- **趨勢分析**：自動識別需求趨勢和季節性模式
- **異常檢測**：使用 Isolation Forest 檢測需求異常
- **置信區間**：提供預測的上下界，量化不確定性
- **準確度評估**：MAPE、RMSE、MAE、R² 等多種指標

### AI 能力

- **自動季節性檢測**：自動識別年度、週度季節性模式
- **促銷影響分析**：考慮促銷活動對需求的影響
- **趨勢變化點檢測**：自動識別需求模式的突變
- **多變量預測**：支持價格、促銷等外部因素

---

## 🏗️ 技術架構

### 後端技術棧

- **框架**: FastAPI 0.104+
- **AI/ML**: Prophet 1.1+, Scikit-learn 1.3+
- **數據處理**: Pandas 2.1+, NumPy 1.26+
- **資料庫**: SQLite / PostgreSQL
- **ORM**: SQLAlchemy 2.0+

### 前端技術棧

- **框架**: React 18+
- **UI 組件**: Ant Design 5+
- **圖表**: Recharts 2+
- **HTTP 客戶端**: Axios 1.6+
- **日期處理**: Day.js 1.11+

### 架構圖

```
前端 (React + Ant Design)
        ↓
   RESTful API
        ↓
FastAPI 後端服務
        ↓
Prophet ML 模型
        ↓
   SQLite 資料庫
```

---

## 🚀 快速開始

### 環境要求

- Python 3.8+
- Node.js 16+
- pip / npm

### 後端啟動

```bash
# 進入後端目錄
cd backend

# 安裝依賴
pip install -r requirements.txt

# 啟動服務
python main.py
```

後端服務將運行在 `http://localhost:8000`

### 前端啟動

```bash
# 進入前端目錄
cd frontend

# 安裝依賴
npm install

# 啟動開發服務器
npm start
```

前端應用將運行在 `http://localhost:3000`

### 生成測試數據

```bash
# 確保後端服務已啟動
cd backend
python data_generator.py
```

這將生成 3 個物料的 24 個月歷史數據並自動上傳到系統。

---

## 📚 API 文檔

### 健康檢查

```http
GET /health
```

### 獲取物料列表

```http
GET /api/items
```

**響應示例**:
```json
{
  "count": 3,
  "items": [
    {
      "item_id": "ITEM-001",
      "item_name": "筆記型電腦"
    }
  ]
}
```

### 獲取歷史需求

```http
GET /api/demand-history/{item_id}?limit=100
```

**響應示例**:
```json
{
  "item_id": "ITEM-001",
  "count": 24,
  "records": [
    {
      "date": "2024-01-01T00:00:00",
      "quantity": 1250.5,
      "is_promotion": 0,
      "price": 100.0
    }
  ]
}
```

### 創建歷史需求記錄

```http
POST /api/demand-history/
Content-Type: application/json

{
  "item_id": "ITEM-001",
  "item_name": "筆記型電腦",
  "date": "2024-01-01T00:00:00",
  "quantity": 1000,
  "is_promotion": 0,
  "price": 100.0
}
```

### 批量創建記錄

```http
POST /api/demand-history/batch
Content-Type: application/json

{
  "records": [
    {
      "item_id": "ITEM-001",
      "item_name": "筆記型電腦",
      "date": "2024-01-01T00:00:00",
      "quantity": 1000,
      "is_promotion": 0,
      "price": 100.0
    }
  ]
}
```

### 生成需求預測

```http
POST /api/forecast/
Content-Type: application/json

{
  "item_id": "ITEM-001",
  "periods": 12,
  "frequency": "M",
  "include_promotions": false
}
```

**參數說明**:
- `item_id`: 物料編號
- `periods`: 預測週期數量（默認 12）
- `frequency`: 時間頻率 - "D"(日), "W"(週), "M"(月)
- `include_promotions`: 是否考慮促銷影響

**響應示例**:
```json
{
  "item_id": "ITEM-001",
  "forecasts": [
    {
      "date": "2025-01-01T00:00:00",
      "predicted_quantity": 1350.25,
      "lower_bound": 1200.50,
      "upper_bound": 1500.00,
      "trend": 1340.00
    }
  ],
  "accuracy_metrics": {
    "mape": 8.5,
    "rmse": 125.3,
    "mae": 98.7,
    "r2_score": 0.92
  },
  "model_info": {
    "model_type": "Prophet",
    "training_samples": 24,
    "forecast_periods": 12,
    "frequency": "M"
  }
}
```

### 檢測需求異常

```http
GET /api/anomalies/{item_id}?contamination=0.1
```

**響應示例**:
```json
{
  "item_id": "ITEM-001",
  "total_records": 24,
  "anomaly_count": 2,
  "anomalies": [
    {
      "date": "2024-06-01T00:00:00",
      "quantity": 2500.0
    }
  ]
}
```

---

## 💡 使用示例

### Python 客戶端示例

```python
import requests
from datetime import datetime

API_URL = "http://localhost:8000"

# 1. 創建歷史需求數據
response = requests.post(
    f"{API_URL}/api/demand-history/",
    json={
        "item_id": "ITEM-001",
        "item_name": "筆記型電腦",
        "date": datetime.now().isoformat(),
        "quantity": 1000,
        "is_promotion": 0,
        "price": 100.0
    }
)
print(response.json())

# 2. 生成預測
response = requests.post(
    f"{API_URL}/api/forecast/",
    json={
        "item_id": "ITEM-001",
        "periods": 12,
        "frequency": "M",
        "include_promotions": False
    }
)
forecast_result = response.json()

# 3. 打印預測結果
print(f"準確度指標: {forecast_result['accuracy_metrics']}")
for fc in forecast_result['forecasts'][:3]:
    print(f"{fc['date']}: {fc['predicted_quantity']:.0f} "
          f"(區間: {fc['lower_bound']:.0f} - {fc['upper_bound']:.0f})")
```

### JavaScript 客戶端示例

```javascript
const API_URL = 'http://localhost:8000';

// 生成預測
async function generateForecast(itemId) {
  const response = await fetch(`${API_URL}/api/forecast/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item_id: itemId,
      periods: 12,
      frequency: 'M',
      include_promotions: false,
    }),
  });

  const result = await response.json();
  console.log('預測結果:', result);
  return result;
}

// 使用
generateForecast('ITEM-001');
```

---

## 📊 預測模型說明

### Prophet 模型

本系統使用 Facebook 開發的 Prophet 模型，特點包括:

1. **自動季節性處理**: 自動檢測年度、週度、日度季節性
2. **節假日效應**: 可配置節假日對需求的影響
3. **趨勢變化點**: 自動識別趨勢的突變點
4. **魯棒性**: 對缺失數據和異常值有良好的容錯性

### 模型參數

```python
Prophet(
    yearly_seasonality=True,      # 年度季節性
    weekly_seasonality=True,      # 週度季節性
    daily_seasonality=False,      # 日度季節性
    seasonality_mode='multiplicative',  # 季節性模式
    changepoint_prior_scale=0.05  # 趨勢靈活度
)
```

### 準確度指標

- **MAPE** (Mean Absolute Percentage Error): 平均絕對百分比誤差，越小越好
- **RMSE** (Root Mean Square Error): 均方根誤差，對大誤差敏感
- **MAE** (Mean Absolute Error): 平均絕對誤差
- **R² Score**: 決定係數，接近 1 表示模型擬合度好

---

## 🐳 部署指南

### Docker 部署

創建 `Dockerfile`:

```dockerfile
# 後端 Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
```

創建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./demand_forecasting.db
    volumes:
      - ./data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:8000
```

啟動:

```bash
docker-compose up -d
```

### 生產環境配置

#### 使用 PostgreSQL

```python
# 修改 main.py 中的資料庫 URL
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/demand_forecasting"
```

#### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

---

## 🔧 配置選項

### 環境變數

**後端**:
- `DATABASE_URL`: 資料庫連接字符串
- `API_HOST`: API 服務主機（默認: 0.0.0.0）
- `API_PORT`: API 服務端口（默認: 8000）

**前端**:
- `REACT_APP_API_URL`: 後端 API 地址（默認: http://localhost:8000）

---

## 📈 性能優化

### 模型優化

1. **訓練數據量**: 建議至少 2 年的歷史數據
2. **數據頻率**: 根據業務需求選擇合適的時間粒度
3. **異常值處理**: 使用異常檢測過濾極端值

### 系統優化

1. **資料庫索引**: 為常用查詢字段創建索引
2. **緩存策略**: 使用 Redis 緩存預測結果
3. **異步處理**: 對大批量預測使用異步任務隊列

---

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

### 開發流程

1. Fork 專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📝 許可證

MIT License

---

## 📞 聯繫方式

如有問題或建議，請提交 Issue 或聯繫開發團隊。

---

**🚀 開始使用 AI 優化你的需求預測吧！**
