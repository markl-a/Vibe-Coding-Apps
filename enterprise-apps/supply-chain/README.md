# 供應鏈管理系統 (Supply Chain Management System)
🤖 **AI-Driven | AI-Native | Production-Ready** 🚀

先進的 AI 驅動供應鏈管理系統，提供需求預測、庫存優化、路線規劃和供應商管理的完整解決方案。結合深度學習、機器學習和傳統優化算法，為企業提供智能化的決策支持。

## 🌟 主要特點

✨ **AI 增強功能**
- 🧠 LSTM/GRU 深度學習需求預測
- 💬 AI 助手自然語言交互
- 📊 自動化智能分析和洞察
- 🎯 智能模型選擇和集成預測

🚀 **生產就緒**
- 🐳 Docker 容器化部署
- 📦 微服務架構設計
- 🔄 健康檢查和自動重啟
- 📈 完整的測試覆蓋

## 📋 目錄

- [供應鏈概述](#供應鏈概述)
- [核心功能模組](#核心功能模組)
- [快速開始](#快速開始)
- [Docker 部署](#docker-部署)
- [技術架構](#技術架構)
- [AI 智能功能](#ai-智能功能)
- [API 文檔](#api-文檔)
- [測試和範例](#測試和範例)

---

## 🎯 供應鏈概述

### 核心功能領域

- **供應商管理 (SRM)**：供應商評估、績效追蹤、協作
- **採購管理**：需求規劃、採購執行、合同管理
- **庫存管理**：多倉庫、安全庫存、補貨策略
- **物流管理**：運輸規劃、路線優化、追蹤
- **需求預測**：AI 驅動的需求預測
- **供應鏈分析**：KPI 監控、瓶頸分析、優化建議

---

## 🧩 核心功能模組

### 1. 供應商管理

```typescript
interface Supplier {
  id: string;
  code: string;
  name: string;
  category: 'RAW_MATERIAL' | 'COMPONENT' | 'FINISHED_GOOD' | 'SERVICE';

  // 聯絡資訊
  contact: ContactInfo;
  addresses: Address[];

  // 評級
  rating: number; // 1-5
  tier: 'STRATEGIC' | 'PREFERRED' | 'APPROVED' | 'CONDITIONAL';

  // 績效指標
  performance: {
    onTimeDelivery: number; // 準時交付率
    qualityRate: number;    // 質量合格率
    responseTime: number;   // 平均響應時間
    priceCompetitiveness: number;
  };

  // 認證與合規
  certifications: Certification[];
  complianceStatus: 'COMPLIANT' | 'PENDING' | 'NON_COMPLIANT';

  // 財務
  paymentTerms: string;
  creditLimit: number;

  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

interface SupplierContract {
  id: string;
  supplierId: string;
  contractNumber: string;
  type: 'BLANKET' | 'STANDARD' | 'FRAMEWORK';

  startDate: Date;
  endDate: Date;

  items: ContractItem[];

  totalValue: number;
  paymentTerms: string;

  terms: string;
  attachments: Document[];

  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
}
```

### 2. 需求規劃

```typescript
interface DemandForecast {
  id: string;
  itemId: string;
  period: string; // "2024-Q1"

  // 預測數量
  forecastedDemand: number;

  // 預測方法
  method: 'MOVING_AVERAGE' | 'EXPONENTIAL_SMOOTHING' | 'ARIMA' | 'ML_MODEL';

  // 歷史數據
  historicalDemand: number[];

  // 置信區間
  lowerBound: number;
  upperBound: number;
  confidence: number;

  // 影響因素
  factors: {
    seasonality: number;
    trend: number;
    promotions: number;
    externalEvents: number;
  };

  createdAt: Date;
  accuracy?: number; // 事後準確度
}

interface MaterialRequirementPlanning {
  id: string;
  planDate: Date;

  // 需求
  demandSources: DemandSource[];

  // 供給
  onHandInventory: number;
  scheduledReceipts: ScheduledReceipt[];

  // 計劃
  plannedOrders: PlannedOrder[];

  // 例外訊息
  exceptions: Exception[];
}
```

### 3. 庫存優化

```typescript
interface InventoryPolicy {
  itemId: string;

  // 補貨策略
  replenishmentMethod: 'REORDER_POINT' | 'PERIODIC_REVIEW' | 'MRP' | 'JIT';

  // 參數
  reorderPoint: number;   // 再訂購點
  orderQuantity: number;  // 訂購量
  safetyStock: number;    // 安全庫存
  maxStock: number;       // 最大庫存

  // ABC 分類
  abcClass: 'A' | 'B' | 'C';

  // 成本
  holdingCost: number;    // 持有成本
  orderingCost: number;   // 訂購成本
  stockoutCost: number;   // 缺貨成本

  // 服務水平
  serviceLevel: number;   // 95%, 99% etc

  // 週期
  leadTime: number;       // 前置時間（天）
  reviewPeriod: number;   // 審查週期（天）
}

interface InventoryOptimization {
  async optimizeInventoryLevels(itemId: string): Promise<OptimizationResult> {
    const historical = await this.getHistoricalData(itemId);
    const forecast = await this.getDemandForecast(itemId);
    const costs = await this.getInventoryCosts(itemId);

    // EOQ 模型
    const eoq = this.calculateEOQ(
      forecast.averageDemand,
      costs.orderingCost,
      costs.holdingCost,
    );

    // 安全庫存計算
    const safetyStock = this.calculateSafetyStock(
      forecast.demandVariability,
      forecast.leadTime,
      costs.serviceLevel,
    );

    return {
      optimalOrderQuantity: eoq,
      safetyStock,
      reorderPoint: forecast.leadTimeDemand + safetyStock,
      expectedAnnualCost: this.calculateTotalCost(eoq, safetyStock),
    };
  }
}
```

### 4. 物流與運輸

```typescript
interface Shipment {
  id: string;
  shipmentNumber: string;
  type: 'INBOUND' | 'OUTBOUND' | 'TRANSFER';

  // 來源與目的
  origin: Location;
  destination: Location;

  // 貨物
  items: ShipmentItem[];
  totalWeight: number;
  totalVolume: number;

  // 運輸
  carrier: string;
  trackingNumber: string;
  transportMode: 'AIR' | 'SEA' | 'ROAD' | 'RAIL';

  // 時間
  scheduledPickup: Date;
  actualPickup?: Date;
  estimatedDelivery: Date;
  actualDelivery?: Date;

  // 狀態
  status: 'PLANNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'EXCEPTION';

  // 成本
  freight: number;
  insurance: number;
  customs: number;
  totalCost: number;

  // 追蹤
  trackingEvents: TrackingEvent[];
}

// 路線優化
interface RouteOptimization {
  async optimizeDeliveryRoute(deliveries: Delivery[]): Promise<Route> {
    // 使用遺傳算法或TSP算法優化路線
    const optimizedRoute = await this.solver.solve({
      deliveries,
      constraints: {
        vehicleCapacity: 1000, // kg
        maxDistance: 200, // km
        timeWindows: true,
        trafficData: true,
      },
      objectives: {
        minimizeDistance: 0.4,
        minimizeCost: 0.3,
        minimizeTime: 0.3,
      },
    });

    return optimizedRoute;
  }
}
```

---

## 🤖 AI 智能功能

### 1. 智能需求預測

```python
# AI 驅動的需求預測
from prophet import Prophet
import pandas as pd
import numpy as np

class DemandForecastingService:
    def __init__(self):
        self.model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
        )

    def forecast_demand(
        self,
        item_id: str,
        historical_data: pd.DataFrame,
        periods: int = 12
    ) -> dict:
        """預測未來需求"""

        # 準備數據
        df = pd.DataFrame({
            'ds': historical_data['date'],
            'y': historical_data['quantity'],
        })

        # 添加外部變數（促銷、節假日等）
        df['promotions'] = historical_data['is_promotion']

        # 訓練模型
        self.model.add_regressor('promotions')
        self.model.fit(df)

        # 預測
        future = self.model.make_future_dataframe(periods=periods, freq='M')
        future['promotions'] = 0  # 假設未來沒有促銷

        forecast = self.model.predict(future)

        # 計算準確度指標
        mape = self.calculate_mape(df['y'], forecast['yhat'][:len(df)])

        return {
            'forecast': forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']],
            'accuracy': {
                'mape': mape,
                'rmse': self.calculate_rmse(df['y'], forecast['yhat'][:len(df)]),
            },
            'components': {
                'trend': forecast['trend'],
                'seasonal': forecast['yearly'],
            },
        }

    def detect_anomalies(self, demand_data: pd.DataFrame) -> list:
        """檢測需求異常"""
        # 使用 Isolation Forest
        from sklearn.ensemble import IsolationForest

        clf = IsolationForest(contamination=0.1)
        predictions = clf.fit_predict(demand_data[['quantity']])

        anomalies = demand_data[predictions == -1]
        return anomalies
```

### 2. 智能補貨

```typescript
// AI 優化的補貨策略
class IntelligentReplenishment {
  async generateReplenishmentPlan(): Promise<ReplenishmentPlan> {
    const items = await this.getItemsNeedingReplenishment();

    for (const item of items) {
      // 獲取預測需求
      const forecast = await this.demandForecastService.forecast(item.id);

      // 獲取當前庫存
      const inventory = await this.inventoryService.getStock(item.id);

      // 獲取在途訂單
      const inTransit = await this.purchaseService.getInTransitQty(item.id);

      // 計算淨需求
      const netRequirement = this.calculateNetRequirement(
        forecast.demand,
        inventory.onHand,
        inTransit,
        inventory.safetyStock,
      );

      if (netRequirement > 0) {
        // 使用 AI 優化訂購量和時間
        const optimal = await this.optimizeOrder(item, netRequirement);

        this.replenishmentPlan.push({
          item,
          orderQuantity: optimal.quantity,
          orderDate: optimal.date,
          supplier: optimal.supplier,
          estimatedCost: optimal.cost,
          reasoning: optimal.reasoning,
        });
      }
    }

    return this.replenishmentPlan;
  }
}
```

### 3. 供應商績效預測

```python
# 預測供應商績效
class SupplierPerformancePrediction:
    def predict_supplier_risk(self, supplier_id: str) -> dict:
        """預測供應商風險"""

        # 收集供應商數據
        data = self.get_supplier_metrics(supplier_id)

        features = {
            'on_time_delivery_rate': data['otd_rate'],
            'quality_rate': data['quality_rate'],
            'financial_health_score': data['financial_score'],
            'capacity_utilization': data['capacity'],
            'geographic_risk': data['geo_risk'],
            'political_stability': data['political_index'],
        }

        # 使用訓練好的模型預測
        risk_score = self.model.predict([list(features.values())])[0]

        # 識別風險因素
        risk_factors = self.identify_risk_factors(features)

        # 生成建議
        recommendations = self.generate_recommendations(risk_score, risk_factors)

        return {
            'risk_level': 'high' if risk_score > 0.7 else 'medium' if risk_score > 0.4 else 'low',
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'recommendations': recommendations,
            'alternative_suppliers': self.find_alternatives(supplier_id) if risk_score > 0.7 else [],
        }
```

### 4. 智能路線規劃

```typescript
// AI 優化配送路線
class SmartRoutePlanning {
  async planOptimalRoutes(
    orders: Order[],
    vehicles: Vehicle[],
  ): Promise<RouteP an[]> {
    // 考慮多種因素
    const optimization = await this.solver.optimize({
      orders,
      vehicles,
      constraints: {
        vehicleCapacity: true,
        timeWindows: true,
        driverWorkHours: true,
        trafficConditions: true,
        fuelCosts: true,
      },
      objectives: {
        minimizeDistance: 0.3,
        minimizeCost: 0.3,
        minimizeVehicles: 0.2,
        maximizeCustomerSatisfaction: 0.2,
      },
    });

    // 實時調整
    const realTimeAdjustment = await this.adjustForRealTimeConditions(
      optimization.routes,
    );

    return realTimeAdjustment;
  }

  async adjustForRealTimeConditions(routes: Route[]): Promise<Route[]> {
    // 獲取實時交通數據
    const traffic = await this.trafficService.getCurrentConditions();

    // 獲取天氣數據
    const weather = await this.weatherService.getCurrentWeather();

    // 動態調整路線
    for (const route of routes) {
      if (this.hasSignificantDelay(route, traffic)) {
        const alternative = await this.findAlternativeRoute(route, traffic);
        if (alternative.isBetter(route)) {
          route.updateRoute(alternative);
        }
      }
    }

    return routes;
  }
}
```

---

## 📡 IoT 整合

### 實時追蹤

```typescript
// IoT 設備整合
interface IoTDevice {
  id: string;
  type: 'GPS_TRACKER' | 'TEMPERATURE_SENSOR' | 'RFID_READER';
  shipmentId: string;

  // 最新讀數
  lastReading: {
    timestamp: Date;
    location?: GeoLocation;
    temperature?: number;
    humidity?: number;
    shock?: number;
  };

  // 警報
  alerts: Alert[];
}

@Injectable()
export class IoTIntegrationService {
  async processDeviceData(deviceId: string, data: any): Promise<void> {
    const device = await this.deviceRepository.findOne(deviceId);

    // 更新設備讀數
    device.lastReading = {
      timestamp: new Date(),
      ...data,
    };

    await this.deviceRepository.save(device);

    // 檢查警報條件
    await this.checkAlertConditions(device, data);

    // 更新貨物狀態
    if (data.location) {
      await this.updateShipmentLocation(device.shipmentId, data.location);
    }
  }

  async checkAlertConditions(device: IoTDevice, data: any): Promise<void> {
    // 溫度超出範圍
    if (data.temperature && (data.temperature < 2 || data.temperature > 8)) {
      await this.createAlert({
        deviceId: device.id,
        type: 'TEMPERATURE_VIOLATION',
        severity: 'HIGH',
        message: `溫度超出範圍: ${data.temperature}°C`,
      });
    }

    // 震動過大
    if (data.shock && data.shock > 5) {
      await this.createAlert({
        deviceId: device.id,
        type: 'SHOCK_DETECTED',
        severity: 'MEDIUM',
        message: `檢測到異常震動: ${data.shock}G`,
      });
    }
  }
}
```

---

## 🚀 快速開始

### 使用 Docker Compose (推薦)

```bash
# 克隆專案
git clone <repository-url>
cd enterprise-apps/supply-chain

# 啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f
```

服務地址：
- 需求預測: http://localhost:8000
- 供應商績效: http://localhost:8001
- 庫存優化: http://localhost:8002
- 路線優化: http://localhost:8003

### 手動啟動單個服務

#### 需求預測服務

```bash
cd demand-forecasting/backend
pip install -r requirements.txt
python main.py
```

訪問 http://localhost:8000/docs 查看 API 文檔

#### 庫存優化服務

```bash
cd inventory-optimization/backend
pip install -r requirements.txt
python main.py
```

訪問 http://localhost:8002/docs 查看 API 文檔

#### 運行範例測試

```bash
# 需求預測範例
cd demand-forecasting/backend
python example_usage.py

# 庫存優化範例
cd inventory-optimization/backend
python example_usage.py
```

---

## 🐳 Docker 部署

### 服務架構

本系統采用微服務架構，包含四個獨立的服務：

| 服務 | 端口 | 描述 |
|------|------|------|
| demand-forecasting | 8000 | 需求預測服務（Prophet + LSTM/GRU）|
| supplier-performance | 8001 | 供應商績效管理服務 |
| inventory-optimization | 8002 | 庫存優化服務（EOQ + ABC分析）|
| route-optimization | 8003 | 路線優化服務（TSP + VRP）|

### Docker Compose 配置

```yaml
version: '3.8'

services:
  demand-forecasting:
    build: ./demand-forecasting/backend
    ports:
      - "8000:8000"
    volumes:
      - demand-forecasting-data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # ... 其他服務 ...
```

### 常用命令

```bash
# 構建所有服務
docker-compose build

# 啟動服務（後台運行）
docker-compose up -d

# 停止服務
docker-compose down

# 停止並移除數據卷
docker-compose down -v

# 重啟特定服務
docker-compose restart demand-forecasting

# 查看特定服務日誌
docker-compose logs -f demand-forecasting

# 進入容器
docker-compose exec demand-forecasting bash

# 擴展服務
docker-compose up -d --scale demand-forecasting=3
```

### 健康檢查

所有服務都配置了健康檢查端點：

```bash
# 檢查需求預測服務
curl http://localhost:8000/health

# 檢查所有服務
for port in 8000 8001 8002 8003; do
  echo "Checking port $port..."
  curl http://localhost:$port/health
done
```

### 數據持久化

系統使用 Docker volumes 來持久化數據：

- `demand-forecasting-data`: 需求預測歷史數據和模型
- `supplier-performance-data`: 供應商績效數據

```bash
# 備份數據
docker run --rm -v demand-forecasting-data:/data \
  -v $(pwd):/backup alpine \
  tar czf /backup/demand-data-backup.tar.gz /data

# 恢復數據
docker run --rm -v demand-forecasting-data:/data \
  -v $(pwd):/backup alpine \
  tar xzf /backup/demand-data-backup.tar.gz -C /
```

---

## 📊 API 文檔

### Swagger UI

每個服務都提供交互式 API 文檔（Swagger UI）：

- 需求預測: http://localhost:8000/docs
- 供應商績效: http://localhost:8001/docs
- 庫存優化: http://localhost:8002/docs
- 路線優化: http://localhost:8003/docs

### 主要 API 端點

#### 需求預測服務 (8000)

- `POST /api/forecast/` - Prophet 時間序列預測
- `POST /api/forecast/lstm` - LSTM 深度學習預測
- `POST /api/forecast/smart` - 智能預測（自動選模型）
- `POST /api/ai/analyze` - AI 智能分析
- `POST /api/ai/chat` - AI 助手對話
- `GET /api/anomalies/{item_id}` - 異常檢測

#### 庫存優化服務 (8002)

- `POST /api/eoq` - 經濟訂購量計算
- `POST /api/safety-stock` - 安全庫存計算
- `POST /api/reorder-point` - 補貨點計算
- `POST /api/abc-analysis` - ABC 分類分析
- `POST /api/optimize` - 綜合庫存優化

#### 路線優化服務 (8003)

- `POST /api/optimize/tsp` - TSP 單車輛路線優化
- `POST /api/optimize/vrp` - VRP 多車輛路線優化
- `POST /api/distance-matrix` - 距離矩陣計算

#### 供應商績效服務 (8001)

- `POST /api/suppliers/` - 創建供應商
- `GET /api/suppliers/` - 獲取供應商列表
- `POST /api/metrics/` - 創建績效記錄
- `POST /api/risk/assess` - 風險評估
- `GET /api/ranking` - 供應商排名

---

## 🧪 測試和範例

### 自動化測試

#### 需求預測服務測試

```bash
cd demand-forecasting/backend
python test_models.py
```

測試內容：
- LSTM/GRU 模型訓練和預測
- AI 助手功能
- 自然語言報告生成
- 趨勢分析和異常檢測

#### 完整功能測試

```bash
# 需求預測完整測試（包括 API 調用）
cd demand-forecasting/backend
python example_usage.py

# 庫存優化完整測試
cd inventory-optimization/backend
python example_usage.py
```

### 範例場景

#### 場景 1: 電子產品需求預測

```python
import requests

# 生成 36 個月歷史數據並預測未來 12 個月
response = requests.post(
    "http://localhost:8000/api/forecast/smart",
    json={
        "item_id": "LAPTOP-001",
        "periods": 12,
        "frequency": "M"
    }
)

result = response.json()
print(f"推薦模型: {result['model_type']}")
print(f"預測準確度 MAPE: {result['accuracy_metrics']['mape']}%")
```

#### 場景 2: 庫存策略優化

```python
# 計算最優庫存策略
response = requests.post(
    "http://localhost:8002/api/optimize",
    json={
        "item_id": "LAPTOP-001",
        "annual_demand": 5000,
        "ordering_cost": 5000,
        "holding_cost_rate": 0.20,
        "unit_cost": 20000,
        "avg_daily_demand": 13.7,
        "demand_std": 50.0,
        "lead_time_days": 14.0,
        "service_level": 0.95
    }
)

policy = response.json()['inventory_policy']
print(f"訂購量: {policy['order_quantity']} 台")
print(f"補貨點: {policy['reorder_point']} 台")
print(f"安全庫存: {policy['safety_stock']} 台")
```

#### 場景 3: 配送路線優化

```python
# 優化配送路線
response = requests.post(
    "http://localhost:8003/api/optimize/vrp",
    json={
        "depot": {
            "id": "DEPOT",
            "name": "配送中心",
            "latitude": 25.0330,
            "longitude": 121.5654
        },
        "locations": [
            {"id": "C1", "name": "客戶1", "latitude": 25.0122, "longitude": 121.4654, "demand": 15},
            {"id": "C2", "name": "客戶2", "latitude": 25.0378, "longitude": 121.4323, "demand": 20},
            # ... 更多客戶
        ],
        "vehicles": [
            {"id": "V1", "capacity": 100, "cost_per_km": 10},
            {"id": "V2", "capacity": 100, "cost_per_km": 10}
        ]
    }
)

summary = response.json()['summary']
print(f"使用車輛數: {summary['vehicles_used']}")
print(f"總距離: {summary['total_distance_km']} km")
print(f"總成本: ${summary['total_cost']}")
```

---

## 📚 參考資源

### 供應鏈管理理論
- **SCOR 模型** - 供應鏈運作參考模型
- **精益供應鏈** - 消除浪費，提升效率
- **敏捷供應鏈** - 快速響應市場變化

### 開源解決方案
- **Odoo SCM** - Odoo 供應鏈模組
- **ERPNext** - 開源 ERP 的供應鏈功能
- **OpenBoxes** - 開源供應鏈管理

---

**🚀 開始使用 AI 建立你的供應鏈管理系統，優化端到端流程！**
