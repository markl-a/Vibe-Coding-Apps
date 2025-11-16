# 供應鏈管理系統 (Supply Chain Management System)
🤖 **AI-Driven | AI-Native** 🚀

供應鏈管理系統幫助企業優化從供應商到客戶的整個流程,包括採購、庫存、物流和配送。使用 AI 輔助開發可以建立智能化、高效率的供應鏈系統。

## 📋 目錄

- [供應鏈概述](#供應鏈概述)
- [核心功能模組](#核心功能模組)
- [技術架構](#技術架構)
- [AI 智能功能](#ai-智能功能)
- [IoT 整合](#iot-整合)

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
