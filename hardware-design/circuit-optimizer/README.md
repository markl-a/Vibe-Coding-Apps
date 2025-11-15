# ⚡ 電路優化工具

> ⚠️ **驗證階段專案** - 此專案目前處於研究與開發階段

AI 驅動的電路性能優化和成本分析工具，協助設計者在多個目標之間找到最佳平衡。

## 📋 專案目標

提供智能化的電路優化解決方案：
- 多目標優化（成本、功耗、尺寸、性能）
- 智能元件選擇建議
- BOM 成本分析與優化
- 性能預測與驗證

## 🎯 核心功能（規劃中）

### 1. 多目標優化
- **成本最小化**: 選擇性價比最優的元件
- **功耗優化**: 降低整體功耗
- **尺寸優化**: 選擇更小封裝
- **性能最大化**: 在約束下達到最佳性能

### 2. 智能元件選擇
- 基於規格自動推薦元件
- 考慮供應鏈和庫存
- 替代元件建議
- 生命週期管理

### 3. BOM 分析
- 成本分析和預測
- 供應商比較
- 數量優化
- 風險評估

### 4. 性能預測
- 基於 ML 的性能預測
- 電路模擬整合
- 參數敏感度分析

## 🛠️ 技術棧

- **語言**: Python 3.8+
- **ML 框架**:
  - scikit-learn (傳統 ML)
  - XGBoost / LightGBM (梯度提升)
  - PyTorch (深度學習)
- **優化庫**:
  - SciPy (優化演算法)
  - DEAP (進化演算法)
  - Optuna (超參數優化)
- **電路模擬**:
  - PySpice (ngspice 介面)
  - scikit-rf (RF 分析)
- **資料處理**: Pandas, NumPy
- **視覺化**: Plotly, Matplotlib

## 🚀 快速開始（開發中）

### 安裝

```bash
pip install -r requirements.txt
```

### 基本使用

```python
from circuit_optimizer import CircuitOptimizer

# 定義優化目標
optimizer = CircuitOptimizer()

# 載入電路設計
optimizer.load_circuit("amplifier.net")

# 設定優化目標
optimizer.set_objectives({
    'cost': 'minimize',
    'power': 'minimize',
    'gain': 'maximize',
    'bandwidth': 'maximize'
})

# 設定約束
optimizer.add_constraints({
    'cost': {'max': 10},  # 最大成本 $10
    'power': {'max': 100},  # 最大功耗 100mW
    'size': {'max': (20, 20)}  # 最大尺寸 20x20mm
})

# 執行優化
results = optimizer.optimize(iterations=100)

# 查看結果
print(f"最佳成本: ${results.cost:.2f}")
print(f"預測增益: {results.gain:.1f}dB")
print(f"功耗: {results.power:.2f}mW")

# 取得推薦元件清單
bom = results.get_bom()
bom.export("optimized_bom.csv")
```

## 📊 優化演算法

### 1. 多目標優化 (Multi-Objective Optimization)

#### Pareto 最優解
找出無法同時改善所有目標的解集合。

```python
from scipy.optimize import differential_evolution

def objective_function(params):
    # 解析參數為元件值
    R1, R2, C1 = params

    # 計算各項指標
    cost = calculate_cost(R1, R2, C1)
    power = calculate_power(R1, R2, C1)
    performance = simulate_performance(R1, R2, C1)

    # 多目標轉換為單目標（加權）
    return cost * 0.3 + power * 0.3 - performance * 0.4

# 定義參數範圍
bounds = [
    (100, 100000),   # R1: 100Ω - 100kΩ
    (100, 100000),   # R2
    (1e-9, 1e-6)     # C1: 1nF - 1µF
]

# 執行優化
result = differential_evolution(objective_function, bounds)
```

#### NSGA-II (非支配排序遺傳演算法)
專為多目標優化設計的進化演算法。

```python
from deap import base, creator, tools, algorithms

# 定義多目標問題（最小化成本和功耗，最大化性能）
creator.create("FitnessMulti", base.Fitness, weights=(-1.0, -1.0, 1.0))
creator.create("Individual", list, fitness=creator.FitnessMulti)

def eval_circuit(individual):
    cost = calculate_cost(individual)
    power = calculate_power(individual)
    performance = calculate_performance(individual)
    return cost, power, performance

# 使用 NSGA-II
population = toolbox.population(n=100)
algorithms.eaMuPlusLambda(population, toolbox, mu=100, lambda_=100,
                          cxpb=0.7, mutpb=0.3, ngen=50)
```

### 2. 元件選擇優化

#### 決策樹 & 隨機森林
學習從規格到元件的映射關係。

```python
from sklearn.ensemble import RandomForestClassifier

# 訓練數據：歷史設計中的元件選擇
X_train = [  # 特徵: [電壓, 電流, 封裝偏好, 成本約束]
    [5, 0.1, 1, 5],
    [3.3, 0.5, 0, 2],
    # ...
]
y_train = [  # 標籤: 選擇的元件 ID
    'LM7805',
    'AMS1117-3.3',
    # ...
]

clf = RandomForestClassifier()
clf.fit(X_train, y_train)

# 預測新設計的元件
new_requirement = [[5, 0.2, 1, 3]]
suggested_component = clf.predict(new_requirement)
```

### 3. 成本預測

#### 迴歸模型
預測 BOM 總成本。

```python
from sklearn.linear_model import Ridge
import numpy as np

# 特徵: 元件數量、類型、規格等
features = extract_circuit_features(circuit)

# 訓練成本預測模型
cost_model = Ridge(alpha=1.0)
cost_model.fit(X_train, y_cost)

# 預測成本
predicted_cost = cost_model.predict([features])
```

## 📁 專案結構（規劃）

```
circuit-optimizer/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── optimizer.py          # 主優化器
│   ├── objectives/
│   │   ├── cost.py           # 成本目標
│   │   ├── power.py          # 功耗目標
│   │   └── performance.py    # 性能目標
│   ├── algorithms/
│   │   ├── nsga2.py          # NSGA-II 實作
│   │   ├── genetic.py        # 遺傳演算法
│   │   └── gradient.py       # 梯度優化
│   ├── component_selector.py # 元件選擇器
│   ├── bom_analyzer.py       # BOM 分析
│   ├── simulator.py          # 電路模擬介面
│   └── utils.py
├── data/
│   ├── components/           # 元件資料庫
│   ├── prices/               # 價格資料
│   └── models/               # 訓練模型
├── examples/
│   ├── basic_optimization.py
│   ├── multi_objective.py
│   └── component_selection.py
└── tests/
```

## 🔬 使用案例

### 案例 1: 電源設計優化

```python
# 優化線性穩壓器設計
optimizer = CircuitOptimizer()
optimizer.load_circuit("ldo_regulator.cir")

# 目標: 最小成本 + 最小功耗
optimizer.set_objectives({
    'cost': 'minimize',
    'power_dissipation': 'minimize'
})

# 約束: 輸出電壓穩定性 < 1%
optimizer.add_constraint('voltage_stability', max_value=0.01)

results = optimizer.optimize()
```

### 案例 2: 放大器性能優化

```python
# 優化運算放大器電路
optimizer = CircuitOptimizer()
optimizer.load_circuit("op_amp_circuit.cir")

# 多目標: 增益、頻寬、功耗
optimizer.set_objectives({
    'gain': 'maximize',
    'bandwidth': 'maximize',
    'power': 'minimize'
})

# Pareto 前沿分析
pareto_front = optimizer.find_pareto_front(population=200)

# 視覺化權衡
optimizer.plot_tradeoffs(pareto_front)
```

### 案例 3: BOM 成本優化

```python
from circuit_optimizer import BOMOptimizer

bom = BOMOptimizer()
bom.load_from_file("current_bom.csv")

# 尋找替代元件
alternatives = bom.find_alternatives(
    max_cost_increase=0.05,  # 允許 5% 成本增加
    min_availability=0.95     # 至少 95% 可用性
)

# 批量優化
optimized = bom.optimize_quantities(
    target_quantity=1000,
    consider_breaks=True  # 考慮價格斷點
)

print(f"原始成本: ${bom.total_cost:.2f}")
print(f"優化後成本: ${optimized.total_cost:.2f}")
print(f"節省: {optimized.savings_percent:.1f}%")
```

## 🧪 開發路線圖

### Phase 1: 基礎功能
- [ ] 元件資料庫建立
- [ ] 基本成本計算
- [ ] 簡單優化演算法
- [ ] BOM 分析工具

### Phase 2: 進階優化
- [ ] 多目標優化（NSGA-II）
- [ ] ML 元件推薦
- [ ] 電路模擬整合
- [ ] 性能預測模型

### Phase 3: 智能功能
- [ ] 自動化參數調整
- [ ] 供應鏈整合
- [ ] 即時價格更新
- [ ] 生命週期管理

### Phase 4: 使用者介面
- [ ] Web 介面
- [ ] 視覺化工具
- [ ] 批次處理
- [ ] API 服務

## 📚 參考資料

### 優化演算法
- NSGA-II: "A Fast and Elitist Multiobjective Genetic Algorithm"
- Differential Evolution: "Differential Evolution - A Simple and Efficient Heuristic"
- Particle Swarm Optimization: "Particle Swarm Optimization"

### 電路優化
- "Circuit Optimization via Sequential Convex Programming"
- "Machine Learning for Electronic Design Automation"

## ⚠️ 限制說明

1. **模型準確性**: ML 預測需要足夠訓練數據
2. **元件資料**: 需要維護最新的元件資料庫
3. **模擬時間**: 複雜電路模擬可能耗時
4. **全局最優**: 無法保證找到全局最優解
5. **實際驗證**: 優化結果需實際測試驗證

## 📄 授權

MIT License

---

**最後更新**: 2025-11-15
**狀態**: 🚧 規劃中
