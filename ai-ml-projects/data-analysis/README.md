# 資料分析與預測 Data Analysis

📊 使用機器學習進行資料分析、視覺化和預測建模

## 功能特點

- ✅ 資料探索與視覺化
- ✅ 統計分析
- ✅ 預測建模 (回歸、分類)
- ✅ 時間序列分析
- ✅ 特徵工程
- ✅ 模型評估與比較
- ✅ 互動式報告
- ✅ 自動化 ML (AutoML)

## 專案結構

```
data-analysis/
├── README.md              # 專案說明
├── requirements.txt       # 依賴套件
├── analyzer.py           # 資料分析器
├── predictor.py          # 預測模型
├── visualizer.py         # 視覺化工具
├── time_series.py        # 時間序列分析
├── feature_engineering.py # 特徵工程
├── app.py                # Streamlit UI
├── notebooks/            # Jupyter Notebooks
│   └── exploratory_analysis.ipynb
├── data/                 # 資料集
│   ├── raw/
│   ├── processed/
│   └── sample_data.csv
└── models/               # 訓練好的模型
```

## 安裝

```bash
pip install -r requirements.txt
```

## 使用方式

### 1. 資料探索與分析

```python
from analyzer import DataAnalyzer

# 載入資料
analyzer = DataAnalyzer('data/dataset.csv')

# 基本統計
stats = analyzer.describe()
print(stats)

# 檢查缺失值
missing = analyzer.check_missing()

# 相關性分析
correlation = analyzer.correlation_analysis()

# 自動 EDA 報告
analyzer.generate_report(output='report.html')
```

### 2. 預測建模

```python
from predictor import Predictor

# 初始化預測器
predictor = Predictor(task='classification')  # 或 'regression'

# 訓練模型
predictor.train(
    X_train, y_train,
    model_type='random_forest',
    cv=5
)

# 預測
predictions = predictor.predict(X_test)

# 評估
metrics = predictor.evaluate(X_test, y_test)
print(f"Accuracy: {metrics['accuracy']:.2%}")

# 特徵重要性
importance = predictor.feature_importance()
```

### 3. 視覺化

```python
from visualizer import DataVisualizer

viz = DataVisualizer(df)

# 分佈圖
viz.plot_distribution('age')

# 散點圖矩陣
viz.scatter_matrix(['age', 'income', 'score'])

# 相關性熱圖
viz.correlation_heatmap()

# 時間序列圖
viz.time_series_plot('date', 'value')
```

### 4. 時間序列分析

```python
from time_series import TimeSeriesAnalyzer

ts = TimeSeriesAnalyzer(data, date_column='date')

# 趨勢分析
trend = ts.analyze_trend()

# 季節性分解
decomposition = ts.seasonal_decompose()

# 預測
forecast = ts.forecast(periods=30, method='arima')

# 視覺化
ts.plot_forecast(forecast)
```

### 5. Web UI

```bash
streamlit run app.py
```

## 支援的模型

### 分類模型
- Logistic Regression
- Random Forest Classifier
- Gradient Boosting (XGBoost, LightGBM)
- Support Vector Machine
- Neural Networks

### 回歸模型
- Linear Regression
- Random Forest Regressor
- Gradient Boosting Regressor
- Support Vector Regression
- Neural Networks

### 時間序列模型
- ARIMA
- Prophet
- LSTM
- Exponential Smoothing

## 資料集範例

專案包含以下範例資料集：

1. **customer_data.csv** - 客戶資料與購買行為
2. **sales_time_series.csv** - 銷售時間序列資料
3. **housing_prices.csv** - 房價預測資料
4. **credit_risk.csv** - 信用風險評估資料

## 主要功能

### 資料探索 (EDA)
- 自動生成統計摘要
- 檢測異常值
- 視覺化分佈
- 相關性分析
- 缺失值分析

### 特徵工程
- 特徵選擇
- 特徵轉換
- 特徵編碼（One-Hot, Label）
- 特徵縮放（標準化、正規化）
- 多項式特徵
- 交互特徵

### 模型訓練
- 自動超參數調整
- 交叉驗證
- 模型比較
- 集成學習
- 模型持久化

### 模型評估
- 分類指標（Accuracy, Precision, Recall, F1, AUC）
- 回歸指標（MSE, RMSE, MAE, R²）
- 混淆矩陣
- ROC 曲線
- 學習曲線

## 範例應用

### 1. 客戶流失預測

```python
from predictor import Predictor

# 訓練流失預測模型
predictor = Predictor(task='classification')
predictor.train(X_train, y_train, model_type='xgboost')

# 預測流失風險
churn_risk = predictor.predict_proba(X_new)

# 識別高風險客戶
high_risk = churn_risk[churn_risk[:, 1] > 0.7]
```

### 2. 銷售預測

```python
from time_series import TimeSeriesAnalyzer

ts = TimeSeriesAnalyzer(sales_data, date_column='date')
forecast = ts.forecast(periods=90, method='prophet')

# 計算預測區間
ts.plot_forecast_with_confidence(forecast)
```

### 3. 房價預測

```python
from predictor import Predictor
from feature_engineering import FeatureEngineer

# 特徵工程
fe = FeatureEngineer(housing_data)
fe.handle_missing_values()
fe.encode_categorical(['location', 'type'])
fe.create_polynomial_features(['area', 'rooms'])

# 訓練模型
predictor = Predictor(task='regression')
predictor.train(X_train, y_train, model_type='random_forest')

# 評估
metrics = predictor.evaluate(X_test, y_test)
print(f"R² Score: {metrics['r2']:.3f}")
```

## 技術棧

- **Pandas** - 資料處理
- **NumPy** - 數值計算
- **Scikit-learn** - 機器學習
- **XGBoost / LightGBM** - Gradient Boosting
- **Statsmodels** - 統計模型
- **Prophet** - 時間序列預測
- **Matplotlib / Seaborn** - 視覺化
- **Plotly** - 互動式圖表
- **Streamlit** - Web UI

## 最佳實踐

1. **資料準備**
   - 清理缺失值和異常值
   - 適當的特徵縮放
   - 處理類別不平衡

2. **模型選擇**
   - 從簡單模型開始
   - 使用交叉驗證
   - 比較多個模型

3. **模型評估**
   - 使用多個評估指標
   - 檢查過擬合
   - 分析特徵重要性

4. **部署**
   - 模型版本控制
   - 監控模型性能
   - 定期重新訓練

## 授權

MIT License
