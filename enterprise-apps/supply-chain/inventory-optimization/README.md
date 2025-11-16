# 智能庫存優化系統
🤖 **AI-Driven | AI-Native** 🚀

基於運籌學和統計學的智能庫存優化系統，幫助企業降低庫存成本、提高服務水平。

## ✨ 功能特性

### 核心功能

- **經濟訂購量(EOQ)**：計算最優訂購批量
- **安全庫存計算**：基於服務水平的安全庫存
- **補貨點優化**：動態補貨點計算
- **ABC 分類分析**：物料重要性分類
- **綜合優化**：一站式庫存策略優化

### 優化模型

#### 1. 經濟訂購量 (EOQ)

```
EOQ = √((2 × 年需求量 × 訂購成本) / 持有成本)
```

- 最小化總庫存成本
- 平衡訂購成本和持有成本
- 確定最佳訂購批量和頻率

#### 2. 安全庫存

```
安全庫存 = Z × √((前置時間 × 需求變異) + (平均需求² × 前置時間變異))
```

- 防止缺貨
- 滿足服務水平要求
- 應對需求和前置時間的不確定性

#### 3. 補貨點 (ROP)

```
補貨點 = (平均日需求 × 前置時間) + 安全庫存
```

- 觸發訂購的庫存水平
- 確保在前置時間內不缺貨
- 結合安全庫存保障供應

## 🚀 快速開始

### 安裝依賴

```bash
cd backend
pip install -r requirements.txt
```

### 啟動服務

```bash
python main.py
```

服務運行在 `http://localhost:8002`

## 📊 使用示例

### 1. 計算經濟訂購量

```python
import requests

response = requests.post(
    "http://localhost:8002/api/eoq",
    json={
        "annual_demand": 10000,
        "ordering_cost": 100,
        "holding_cost_rate": 0.25,
        "unit_cost": 50
    }
)

result = response.json()
print(f"最優訂購量: {result['result']['eoq']} 件")
print(f"每年訂購次數: {result['result']['orders_per_year']} 次")
print(f"年度總成本: ${result['result']['total_annual_cost']}")
```

### 2. 計算安全庫存

```python
response = requests.post(
    "http://localhost:8002/api/safety-stock",
    json={
        "avg_demand": 100,
        "demand_std": 20,
        "lead_time": 7,
        "lead_time_std": 1,
        "service_level": 0.95
    }
)

result = response.json()
print(f"安全庫存: {result['result']['safety_stock']} 件")
print(f"服務水平: {result['result']['service_level']*100}%")
```

### 3. 計算補貨點

```python
response = requests.post(
    "http://localhost:8002/api/reorder-point",
    json={
        "avg_daily_demand": 100,
        "lead_time_days": 7,
        "demand_std": 20,
        "service_level": 0.95
    }
)

result = response.json()
print(f"補貨點: {result['result']['reorder_point']} 件")
```

### 4. ABC 分類分析

```python
response = requests.post(
    "http://localhost:8002/api/abc-analysis",
    json={
        "items": [
            {"item_id": "ITEM-001", "annual_value": 50000},
            {"item_id": "ITEM-002", "annual_value": 30000},
            {"item_id": "ITEM-003", "annual_value": 5000},
            # ... 更多物料
        ]
    }
)

result = response.json()
for item in result['result']['items']:
    print(f"{item['item_id']}: {item['category']} 類")
```

### 5. 綜合優化

```python
response = requests.post(
    "http://localhost:8002/api/optimize",
    json={
        "item_id": "ITEM-001",
        "annual_demand": 10000,
        "ordering_cost": 100,
        "holding_cost_rate": 0.25,
        "unit_cost": 50,
        "avg_daily_demand": 27.4,
        "demand_std": 8,
        "lead_time_days": 7,
        "lead_time_std": 1,
        "service_level": 0.95
    }
)

result = response.json()
policy = result['inventory_policy']
print(f"庫存策略:")
print(f"  訂購量: {policy['order_quantity']} 件")
print(f"  補貨點: {policy['reorder_point']} 件")
print(f"  安全庫存: {policy['safety_stock']} 件")
print(f"  最大庫存: {policy['max_stock']} 件")
```

## 📈 應用場景

### 1. 製造業

- 原物料庫存優化
- 零件安全庫存管理
- 生產計劃庫存配置

### 2. 零售業

- 商品庫存水平優化
- 季節性需求應對
- 多店鋪庫存分配

### 3. 電商

- SKU 庫存優化
- 倉庫補貨策略
- 快速周轉商品管理

## 🔧 API 端點

### 經濟訂購量

```http
POST /api/eoq
Content-Type: application/json

{
  "annual_demand": 10000,
  "ordering_cost": 100,
  "holding_cost_rate": 0.25,
  "unit_cost": 50
}
```

### 安全庫存

```http
POST /api/safety-stock
Content-Type: application/json

{
  "avg_demand": 100,
  "demand_std": 20,
  "lead_time": 7,
  "lead_time_std": 1,
  "service_level": 0.95
}
```

### 補貨點

```http
POST /api/reorder-point
Content-Type: application/json

{
  "avg_daily_demand": 100,
  "lead_time_days": 7,
  "safety_stock": 50
}
```

### ABC 分類

```http
POST /api/abc-analysis
Content-Type: application/json

{
  "items": [
    {"item_id": "ITEM-001", "annual_value": 50000}
  ]
}
```

### 綜合優化

```http
POST /api/optimize
Content-Type: application/json

{
  "item_id": "ITEM-001",
  "annual_demand": 10000,
  "ordering_cost": 100,
  "holding_cost_rate": 0.25,
  "unit_cost": 50,
  "avg_daily_demand": 27.4,
  "demand_std": 8,
  "lead_time_days": 7,
  "service_level": 0.95
}
```

## 📚 核心概念

### 服務水平

- **95%**: 一般商品，可接受偶爾缺貨
- **97%**: 重要商品，較少缺貨
- **99%**: 關鍵商品，極少缺貨
- **99.9%**: 戰略商品，幾乎不缺貨

### ABC 分類

- **A 類** (0-80%): 少數重要物料，需密切管理
- **B 類** (80-95%): 中等重要物料，定期審查
- **C 類** (95-100%): 大量低價值物料，簡化管理

### 庫存策略

- **(Q, R) 策略**: 固定訂購量，固定補貨點
- **(s, S) 策略**: 當降至 s 時，訂購至 S
- **定期審查**: 固定時間審查並訂購

## 💡 最佳實踐

### 1. 數據準確性

- 確保需求數據的準確性和時效性
- 定期更新成本參數
- 考慮季節性因素

### 2. 參數調整

- 根據實際情況調整服務水平
- 考慮缺貨的機會成本
- 平衡庫存成本和服務質量

### 3. 持續優化

- 定期審查庫存策略
- 分析實際績效與預期差異
- 根據市場變化調整參數

---

**🚀 開始使用數學模型優化你的庫存管理吧！**
