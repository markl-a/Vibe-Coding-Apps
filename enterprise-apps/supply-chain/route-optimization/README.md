# 智能路線規劃系統
🤖 **AI-Driven | AI-Native** 🚀

基於遺傳算法和啟發式算法的配送路線優化系統，幫助企業降低物流成本、提高配送效率。

## ✨ 功能特性

### 核心功能

- **TSP 優化**：旅行商問題，單車輛路線優化
- **VRP 優化**：車輛路徑問題，多車輛路線優化
- **容量約束**：考慮車輛載重限制
- **距離計算**：基於 Haversine 公式的精確距離計算
- **多算法比較**：遺傳算法 vs 最近鄰算法

### 優化算法

#### 1. 最近鄰算法 (Nearest Neighbor)

- **時間複雜度**: O(n²)
- **優點**: 快速，簡單
- **缺點**: 可能陷入局部最優
- **適用**: 小規模問題，快速估算

#### 2. 遺傳算法 (Genetic Algorithm)

- **時間複雜度**: O(generations × population × n)
- **優點**: 全局搜索能力強，解質量高
- **缺點**: 計算時間較長
- **適用**: 中大規模問題，追求最優解

#### 3. 貪婪算法 (Greedy Algorithm)

- **時間複雜度**: O(n²)
- **優點**: 實現簡單，效果不錯
- **缺點**: 可能遺漏更優解
- **適用**: VRP 問題，快速構建可行解

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

服務運行在 `http://localhost:8003`

## 📊 使用示例

### 1. TSP 優化(單車輛)

```python
import requests

# 配送中心
depot = {
    "id": "depot",
    "name": "配送中心",
    "latitude": 25.0330,
    "longitude": 121.5654,
    "demand": 0
}

# 配送點
locations = [
    {
        "id": "loc1",
        "name": "客戶A",
        "latitude": 25.0478,
        "longitude": 121.5318,
        "demand": 100,
        "service_time": 15
    },
    {
        "id": "loc2",
        "name": "客戶B",
        "latitude": 25.0375,
        "longitude": 121.5625,
        "demand": 150,
        "service_time": 20
    },
    # ... 更多配送點
]

# 車輛
vehicles = [
    {
        "id": "truck1",
        "capacity": 1000,
        "cost_per_km": 10.0,
        "max_distance": 200.0
    }
]

response = requests.post(
    "http://localhost:8003/api/optimize/tsp",
    json={
        "depot": depot,
        "locations": locations,
        "vehicles": vehicles,
        "optimization_goal": "distance"
    }
)

result = response.json()
print(f"最優路線距離: {result['route']['total_distance_km']} km")
print(f"預計時間: {result['route']['total_time_minutes']} 分鐘")
print(f"配送順序: {result['route']['sequence']}")
```

### 2. VRP 優化(多車輛)

```python
# 配送中心
depot = {
    "id": "depot",
    "name": "配送中心",
    "latitude": 25.0330,
    "longitude": 121.5654,
    "demand": 0
}

# 多個配送點
locations = [
    {
        "id": f"loc{i}",
        "name": f"客戶{i}",
        "latitude": 25.0 + random.uniform(-0.1, 0.1),
        "longitude": 121.5 + random.uniform(-0.1, 0.1),
        "demand": random.randint(50, 200),
        "service_time": 15
    }
    for i in range(1, 21)  # 20個配送點
]

# 多輛車
vehicles = [
    {
        "id": f"truck{i}",
        "capacity": 1000,
        "cost_per_km": 10.0,
        "max_distance": 200.0
    }
    for i in range(1, 4)  # 3輛車
]

response = requests.post(
    "http://localhost:8003/api/optimize/vrp",
    json={
        "depot": depot,
        "locations": locations,
        "vehicles": vehicles
    }
)

result = response.json()
print(f"使用車輛數: {result['summary']['vehicles_used']}")
print(f"總距離: {result['summary']['total_distance_km']} km")
print(f"總成本: ${result['summary']['total_cost']}")

for route in result['routes']:
    if 'vehicle_id' in route:
        print(f"\n車輛 {route['vehicle_id']}:")
        print(f"  距離: {route['total_distance']} km")
        print(f"  載重: {route['total_load']} / {route['capacity_utilization']}%")
```

### 3. 計算距離矩陣

```python
locations = [
    {"id": "A", "name": "點A", "latitude": 25.0330, "longitude": 121.5654},
    {"id": "B", "name": "點B", "latitude": 25.0478, "longitude": 121.5318},
    {"id": "C", "name": "點C", "latitude": 25.0375, "longitude": 121.5625}
]

response = requests.post(
    "http://localhost:8003/api/distance-matrix",
    json=locations
)

result = response.json()
print("距離矩陣 (km):")
for row in result['distance_matrix']:
    print([f"{d:.2f}" for d in row])
```

## 📈 應用場景

### 1. 快遞配送

- 優化快遞員配送路線
- 減少行駛距離和時間
- 提高配送效率

### 2. 外賣配送

- 多訂單路線規劃
- 考慮時間窗口約束
- 提升配送速度

### 3. 物流配送

- 多車輛路線優化
- 考慮車輛容量限制
- 降低運輸成本

### 4. 零售配送

- 門店補貨路線規劃
- 區域劃分優化
- 提高配送頻率

## 🔧 API 端點

### 計算距離矩陣

```http
POST /api/distance-matrix
Content-Type: application/json

[
  {
    "id": "A",
    "name": "點A",
    "latitude": 25.0330,
    "longitude": 121.5654
  }
]
```

### TSP 優化

```http
POST /api/optimize/tsp
Content-Type: application/json

{
  "depot": {...},
  "locations": [...],
  "vehicles": [...],
  "optimization_goal": "distance"
}
```

### VRP 優化

```http
POST /api/optimize/vrp
Content-Type: application/json

{
  "depot": {...},
  "locations": [...],
  "vehicles": [...]
}
```

## 📚 核心概念

### TSP (Traveling Salesman Problem)

旅行商問題:找到訪問所有城市一次且回到起點的最短路徑。

### VRP (Vehicle Routing Problem)

車輛路徑問題:多輛車從配送中心出發,服務多個客戶後返回,優化總路徑。

### 距離計算

使用 Haversine 公式計算地球表面兩點之間的大圓距離:

```
a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
c = 2 ⋅ atan2(√a, √(1−a))
d = R ⋅ c
```

其中:
- φ: 緯度
- λ: 經度
- R: 地球半徑(6371 km)

## 💡 最佳實踐

### 1. 數據準備

- 確保座標準確
- 合理估算需求量
- 設置實際的車輛參數

### 2. 算法選擇

- **小規模** (<20點): 使用遺傳算法獲取最優解
- **中規模** (20-50點): 使用遺傳算法+局部搜索
- **大規模** (>50點): 使用啟發式算法快速求解

### 3. 參數調整

- **遺傳算法**:
  - population_size: 100-300
  - generations: 500-2000
  - mutation_rate: 0.01-0.05

### 4. 實時調整

- 考慮實時交通狀況
- 處理緊急訂單插入
- 動態重新規劃路線

## 🔬 性能優化

### 算法改進

1. **2-opt 局部搜索**: 改進遺傳算法結果
2. **並行計算**: 多線程評估適應度
3. **智能初始化**: 使用啟發式方法生成初始種群

### 實踐建議

- 對大規模問題使用分區策略
- 緩存距離矩陣避免重複計算
- 使用增量更新處理動態變化

---

**🚀 開始使用智能算法優化你的配送路線吧！**
