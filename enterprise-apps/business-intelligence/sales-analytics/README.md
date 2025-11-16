# 銷售分析平台 Sales Analytics Platform

📊 全方位銷售數據分析工具，支持多維度分析、趨勢預測、客戶細分和銷售歸因

## 專案簡介

本專案提供企業級銷售分析解決方案，整合多源銷售數據，通過先進的分析方法幫助企業深入了解銷售表現、識別增長機會、優化銷售策略。

## 功能特點

- ✅ 銷售漏斗分析
- ✅ 同期比較（YoY, MoM, WoW）
- ✅ 客戶分群（RFM 分析）
- ✅ 產品關聯分析
- ✅ 銷售預測
- ✅ 歸因分析
- ✅ 地理熱圖
- ✅ 自動化洞察發現
- ✅ 可視化報表

## 快速開始

### 安裝依賴

```bash
cd sales-analytics
pip install -r requirements.txt
```

### 1. 生成示例數據

```bash
python data_generator.py
```

### 2. 運行分析

```bash
# 生成完整分析報告
python analyze.py --input data/sales_data.csv --output reports/

# 指定分析類型
python analyze.py --type funnel  # 漏斗分析
python analyze.py --type rfm     # RFM 客戶分群
python analyze.py --type trend   # 趨勢分析
```

### 3. 啟動 Web 界面

```bash
streamlit run app.py
```

訪問 `http://localhost:8501` 查看互動式分析界面。

## 使用範例

### 銷售漏斗分析

```python
from sales_analytics import FunnelAnalysis

# 創建漏斗分析器
funnel = FunnelAnalysis()

# 載入數據
funnel.load_data('data/sales_data.csv')

# 定義漏斗階段
stages = [
    ('訪問', 'visitors'),
    ('查看商品', 'product_views'),
    ('加入購物車', 'add_to_cart'),
    ('開始結帳', 'checkout_started'),
    ('完成購買', 'purchase_completed')
]

# 分析漏斗
results = funnel.analyze(stages)

print(f"總轉化率: {results['overall_conversion']:.2%}")
print("\n各階段轉化:")
for stage, rate in results['stage_conversions'].items():
    print(f"  {stage}: {rate:.2%}")

# 視覺化漏斗
funnel.plot(results)
```

### RFM 客戶分群

```python
from sales_analytics import RFMAnalysis

# 創建 RFM 分析器
rfm = RFMAnalysis()

# 載入客戶交易數據
rfm.load_data('data/customer_transactions.csv')

# 執行 RFM 分析
segments = rfm.analyze(
    date_col='purchase_date',
    customer_col='customer_id',
    revenue_col='amount'
)

# 查看客戶分群
print(segments.head())

# 分群統計
print("\n客戶分群分布:")
print(segments['segment'].value_counts())

# 各分群價值
segment_value = segments.groupby('segment').agg({
    'monetary': 'sum',
    'customer_id': 'count'
}).sort_values('monetary', ascending=False)

print("\n分群價值:")
print(segment_value)

# 視覺化 RFM
rfm.plot_3d(segments)
```

### 同期比較分析

```python
from sales_analytics import TrendAnalysis

# 創建趨勢分析器
trend = TrendAnalysis()

# 載入數據
trend.load_data('data/sales_data.csv', date_col='date', value_col='sales')

# YoY 比較（年對年）
yoy = trend.year_over_year_comparison()
print(f"YoY 增長: {yoy['growth_rate']:.2%}")

# MoM 比較（月對月）
mom = trend.month_over_month_comparison()
print(f"MoM 增長: {mom['growth_rate']:.2%}")

# WoW 比較（週對週）
wow = trend.week_over_week_comparison()
print(f"WoW 增長: {wow['growth_rate']:.2%}")

# 視覺化趨勢
trend.plot_comparison(yoy, mom, wow)
```

### 產品關聯分析

```python
from sales_analytics import AssociationAnalysis

# 創建關聯分析器
assoc = AssociationAnalysis()

# 載入交易數據
assoc.load_transactions('data/transactions.csv')

# 執行關聯規則挖掘
rules = assoc.find_associations(
    min_support=0.01,      # 最小支持度 1%
    min_confidence=0.5,    # 最小置信度 50%
    min_lift=1.5          # 最小提升度 1.5
)

# 顯示推薦規則
print("產品推薦規則:")
for rule in rules.head(10).itertuples():
    print(f"{rule.antecedents} => {rule.consequents}")
    print(f"  支持度: {rule.support:.3f}, 置信度: {rule.confidence:.3f}, 提升度: {rule.lift:.3f}\n")

# 視覺化關聯網絡
assoc.plot_network(rules)
```

### 銷售預測

```python
from sales_analytics import SalesForecast

# 創建預測器
forecast = SalesForecast()

# 載入歷史數據
forecast.load_data('data/sales_history.csv')

# 訓練模型
forecast.train(
    model_type='prophet',  # 或 'arima', 'lstm'
    horizon=30            # 預測 30 天
)

# 執行預測
predictions = forecast.predict(periods=30)

# 評估準確度
metrics = forecast.evaluate()
print(f"預測準確度 (MAPE): {metrics['mape']:.2f}%")

# 視覺化預測
forecast.plot_forecast(predictions)
```

### 歸因分析

```python
from sales_analytics import AttributionAnalysis

# 創建歸因分析器
attribution = AttributionAnalysis()

# 載入用戶旅程數據
attribution.load_journeys('data/user_journeys.csv')

# 多觸點歸因分析
results = attribution.analyze(
    model='markov_chain'  # 或 'first_touch', 'last_touch', 'linear', 'time_decay'
)

# 各渠道貢獻
print("渠道貢獻度:")
for channel, contribution in results['channel_contribution'].items():
    print(f"  {channel}: {contribution:.2%}")

# 視覺化歸因
attribution.plot_attribution(results)
```

## 數據格式

### 銷售數據

```csv
date,order_id,customer_id,product_id,category,quantity,price,revenue,channel,region
2024-01-01,ORD001,C001,P101,Electronics,2,599.99,1199.98,Online,North
2024-01-01,ORD002,C002,P202,Clothing,1,89.99,89.99,Store,South
...
```

### 客戶交易數據

```csv
customer_id,purchase_date,amount,order_id,product_count
C001,2024-01-01,1199.98,ORD001,2
C001,2024-01-15,299.99,ORD005,1
C002,2024-01-01,89.99,ORD002,1
...
```

## 專案結構

```
sales-analytics/
├── README.md                    # 專案說明
├── requirements.txt             # 依賴套件
├── data_generator.py           # 數據生成器
├── analyze.py                  # 命令行分析工具
├── app.py                      # Streamlit Web UI
├── sales_analytics/            # 核心分析模組
│   ├── __init__.py
│   ├── funnel.py              # 漏斗分析
│   ├── rfm.py                 # RFM 分群
│   ├── trend.py               # 趨勢分析
│   ├── association.py         # 關聯分析
│   ├── forecast.py            # 銷售預測
│   ├── attribution.py         # 歸因分析
│   └── visualizer.py          # 視覺化工具
├── data/                       # 數據目錄
│   ├── sales_data.csv
│   ├── customer_transactions.csv
│   └── user_journeys.csv
├── reports/                    # 報告輸出
│   ├── funnel_analysis.html
│   ├── rfm_segments.csv
│   └── trend_report.pdf
└── models/                     # 預測模型
    └── sales_forecast_model.pkl
```

## 分析方法詳解

### 1. 漏斗分析

識別銷售流程中的瓶頸：

- **階段定義**：定義從接觸到轉化的各個階段
- **轉化率計算**：各階段間的轉化率
- **流失分析**：識別主要流失點
- **優化建議**：針對瓶頸提供改善建議

### 2. RFM 客戶分群

基於購買行為的客戶細分：

- **R (Recency)**：最近購買時間
- **F (Frequency)**：購買頻率
- **M (Monetary)**：購買金額

分群類型：
- 💎 **Champions**：最近購買、頻繁購買、高消費
- ⭐ **Loyal Customers**：頻繁購買
- 💰 **Big Spenders**：高消費
- 🆕 **New Customers**：新客戶
- ⚠️ **At Risk**：流失風險
- 💤 **Hibernating**：長期未購買

### 3. 同期比較

時間維度的表現對比：

- **YoY**：年對年比較，識別長期趨勢
- **MoM**：月對月比較，追蹤短期波動
- **WoW**：週對週比較，監控即時表現

### 4. 產品關聯分析

發現產品間的關聯規則：

- **支持度**：兩個商品同時出現的頻率
- **置信度**：購買 A 後購買 B 的概率
- **提升度**：關聯強度（>1 表示正相關）

應用：
- 商品推薦
- 貨架擺放優化
- 組合促銷

### 5. 銷售歸因

識別各行銷渠道的真實貢獻：

歸因模型：
- **首次接觸**：100% 歸功於第一個觸點
- **最後接觸**：100% 歸功於最後一個觸點
- **線性**：平均分配給所有觸點
- **時間衰減**：近期觸點權重更高
- **馬爾可夫鏈**：基於轉移概率的歸因

## 進階功能

### 自動洞察發現

```python
from sales_analytics import InsightEngine

engine = InsightEngine()
engine.load_data('data/sales_data.csv')

# 自動發現洞察
insights = engine.discover_insights()

print("🔍 自動發現的洞察:")
for insight in insights:
    print(f"\n{insight['type']}: {insight['title']}")
    print(f"  {insight['description']}")
    print(f"  重要性: {'⭐' * insight['importance']}")
```

### 異常檢測

```python
from sales_analytics import AnomalyDetector

detector = AnomalyDetector()
detector.load_data('data/sales_data.csv')

# 檢測異常
anomalies = detector.detect(
    method='isolation_forest',  # 或 'statistical', 'prophet'
    sensitivity=0.95
)

print(f"檢測到 {len(anomalies)} 個異常點")
```

### 客戶生命週期價值 (CLV)

```python
from sales_analytics import CLVAnalysis

clv = CLVAnalysis()
clv.load_data('data/customer_transactions.csv')

# 計算 CLV
customer_clv = clv.calculate_clv(
    discount_rate=0.1,  # 折現率
    periods=12          # 預測期間（月）
)

# 識別高價值客戶
top_customers = customer_clv.nlargest(100, 'clv')
print(f"前 100 名客戶貢獻 {top_customers['clv'].sum():,.0f} 元")
```

### 價格彈性分析

```python
from sales_analytics import PriceElasticity

elasticity = PriceElasticity()
elasticity.load_data('data/pricing_history.csv')

# 計算價格彈性
results = elasticity.analyze(
    product_id='P001',
    price_col='price',
    quantity_col='quantity'
)

print(f"價格彈性係數: {results['elasticity']:.2f}")
if results['elasticity'] < -1:
    print("需求富有彈性，降價可能增加總收入")
else:
    print("需求缺乏彈性，提價可能增加總收入")
```

## 報告生成

### HTML 報告

```python
from sales_analytics import ReportGenerator

report = ReportGenerator()
report.add_section('overview', title='銷售概覽')
report.add_section('funnel', title='漏斗分析')
report.add_section('rfm', title='客戶分群')
report.add_section('trend', title='趨勢分析')

# 生成報告
report.generate(
    output='reports/sales_analysis_report.html',
    template='executive_summary'
)
```

### PDF 報告

```python
report.generate(
    output='reports/sales_analysis_report.pdf',
    format='pdf',
    include_charts=True
)
```

### Excel 報告

```python
report.generate_excel(
    output='reports/sales_analysis_report.xlsx',
    sheets=['overview', 'funnel', 'rfm', 'products']
)
```

## 技術棧

- **Python 3.8+**
- **Pandas** - 數據處理
- **NumPy** - 數值計算
- **Scikit-learn** - 機器學習
- **MLxtend** - 關聯規則挖掘
- **Prophet** - 時間序列預測
- **Plotly** - 互動式圖表
- **Streamlit** - Web 界面
- **Seaborn/Matplotlib** - 靜態圖表

## 最佳實踐

### 1. 數據準備

- 確保數據完整性和一致性
- 處理缺失值和異常值
- 統一日期格式
- 標準化類別名稱

### 2. 分析頻率

- 日報：關鍵 KPI、異常監控
- 週報：趨勢分析、WoW 比較
- 月報：漏斗分析、RFM 分群、MoM 比較
- 季報：深度分析、預測更新

### 3. 可視化原則

- 選擇合適的圖表類型
- 使用一致的顏色方案
- 添加清晰的標籤和說明
- 突出關鍵發現

### 4. 自動化

- 設置定時任務自動更新數據
- 自動生成和發送報告
- 異常自動預警

## 常見問題

**Q: 如何整合多個數據源？**

A: 使用 `DataIntegrator` 類：

```python
from sales_analytics import DataIntegrator

integrator = DataIntegrator()
integrator.add_source('crm', 'data/crm_data.csv')
integrator.add_source('erp', 'postgresql://localhost/erp', table='sales')
integrator.add_source('web', 'https://api.example.com/sales')

# 整合數據
combined_data = integrator.integrate(
    join_key='customer_id',
    date_col='date'
)
```

**Q: RFM 分數如何計算？**

A: RFM 分數通常使用五分位數或十分位數：

- R 分數：最近購買越近，分數越高（1-5 或 1-10）
- F 分數：購買頻率越高，分數越高
- M 分數：購買金額越大，分數越高

總分 = R×100 + F×10 + M，例如 543 表示 R=5, F=4, M=3

**Q: 如何選擇歸因模型？**

A:
- **首次/最後接觸**：簡單，適合單一渠道為主的業務
- **線性**：公平但可能不准確
- **時間衰減**：適合週期較長的購買決策
- **馬爾可夫鏈**：最準確但計算複雜，適合多觸點旅程

## 授權

MIT License
