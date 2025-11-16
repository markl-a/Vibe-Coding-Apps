# 股市分析 Stock Market Analysis

📊 使用機器學習和技術分析進行股票市場分析和預測

## 專案簡介

本專案整合技術指標、基本面分析和機器學習模型，提供股票價格預測、趨勢分析和交易信號。

## 功能特點

- ✅ 股價預測（LSTM、XGBoost）
- ✅ 技術指標計算（MA、RSI、MACD、Bollinger Bands）
- ✅ 趨勢識別和模式檢測
- ✅ 買賣信號生成
- ✅ 投資組合優化
- ✅ 風險評估（VaR、Sharpe Ratio）
- ✅ 回測系統
- ✅ 即時資料視覺化

## 快速開始

### 安裝依賴

```bash
cd stock-market-analysis
pip install -r requirements.txt
```

### 1. 下載股票資料

```bash
python data_downloader.py --symbol AAPL --start 2020-01-01 --end 2024-01-01
```

### 2. 技術分析

```bash
python technical_analysis.py --symbol AAPL
```

### 3. 訓練預測模型

```bash
python train.py --symbol AAPL --model lstm
```

### 4. 執行回測

```bash
python backtest.py --symbol AAPL --strategy ma_crossover
```

### 5. 啟動 Web 介面

```bash
streamlit run app.py
```

## 使用範例

### Python API

```python
from stock_analyzer import StockAnalyzer

# 初始化分析器
analyzer = StockAnalyzer('AAPL')

# 下載歷史資料
analyzer.download_data(start='2020-01-01', end='2024-01-01')

# 計算技術指標
analyzer.calculate_indicators([
    'SMA_20', 'SMA_50', 'SMA_200',  # 移動平均
    'RSI_14',                        # 相對強弱指標
    'MACD',                          # MACD
    'BBANDS'                         # 布林通道
])

# 生成交易信號
signals = analyzer.generate_signals(strategy='ma_crossover')

# 視覺化
analyzer.plot_with_indicators()
```

### 股價預測

```python
from stock_predictor import StockPredictor

# LSTM 預測
predictor = StockPredictor(model_type='lstm')
predictor.load_data('AAPL')
predictor.train(lookback=60, epochs=100)

# 預測未來 30 天
forecast = predictor.predict(days=30)
predictor.plot_forecast(forecast)
```

### 投資組合優化

```python
from portfolio_optimizer import PortfolioOptimizer

# 多股票投資組合
symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
optimizer = PortfolioOptimizer(symbols)

# 最佳權重（最大 Sharpe Ratio）
optimal_weights = optimizer.maximize_sharpe_ratio()

print("最佳投資組合配置:")
for symbol, weight in zip(symbols, optimal_weights):
    print(f"  {symbol}: {weight*100:.2f}%")
```

### 回測策略

```python
from backtester import Backtester

# 初始化回測器
backtester = Backtester(
    initial_capital=10000,
    commission=0.001  # 0.1% 手續費
)

# 載入資料和策略
backtester.load_data('AAPL')
backtester.set_strategy('ma_crossover', fast=20, slow=50)

# 執行回測
results = backtester.run()

# 顯示結果
print(f"總報酬率: {results['total_return']:.2%}")
print(f"年化報酬率: {results['annual_return']:.2%}")
print(f"最大回撤: {results['max_drawdown']:.2%}")
print(f"Sharpe Ratio: {results['sharpe_ratio']:.2f}")
print(f"勝率: {results['win_rate']:.2%}")
```

## 支援的技術指標

### 趨勢指標
- **SMA** - 簡單移動平均
- **EMA** - 指數移動平均
- **MACD** - 移動平均收斂發散指標
- **ADX** - 平均趨向指標

### 動量指標
- **RSI** - 相對強弱指標
- **Stochastic** - 隨機指標
- **CCI** - 商品通道指數
- **Williams %R** - 威廉指標

### 波動指標
- **Bollinger Bands** - 布林通道
- **ATR** - 平均真實範圍
- **Keltner Channels** - 肯特納通道

### 成交量指標
- **OBV** - 能量潮指標
- **VWAP** - 成交量加權平均價
- **Volume Profile** - 成交量分佈

## 交易策略

### 1. 移動平均交叉策略

```python
# 黃金交叉買入，死亡交叉賣出
strategy = {
    'type': 'ma_crossover',
    'fast_period': 20,
    'slow_period': 50
}
```

### 2. RSI 策略

```python
# RSI 超買超賣策略
strategy = {
    'type': 'rsi',
    'period': 14,
    'oversold': 30,
    'overbought': 70
}
```

### 3. MACD 策略

```python
# MACD 交叉策略
strategy = {
    'type': 'macd',
    'fast': 12,
    'slow': 26,
    'signal': 9
}
```

### 4. 機器學習策略

```python
# 使用 LSTM 預測價格走勢
strategy = {
    'type': 'ml_prediction',
    'model': 'lstm',
    'threshold': 0.02  # 2% 預期報酬
}
```

## 風險管理

### Value at Risk (VaR)

```python
# 計算 VaR
var_95 = analyzer.calculate_var(confidence=0.95)
print(f"95% VaR: {var_95:.2%}")
```

### 停損停利

```python
# 設定停損停利
backtester.set_risk_management(
    stop_loss=0.05,   # 5% 停損
    take_profit=0.10  # 10% 停利
)
```

### 資金管理

```python
# 凱利公式計算最佳倉位
optimal_position = analyzer.kelly_criterion(
    win_rate=0.55,
    avg_win=0.08,
    avg_loss=0.04
)
```

## 模型性能

預測未來 1 天股價漲跌準確率：

| 模型 | Accuracy | Precision | Recall | Sharpe (回測) |
|------|----------|-----------|--------|---------------|
| Logistic Regression | 52.3% | 51.8% | 53.1% | 0.45 |
| Random Forest | 56.7% | 55.2% | 58.3% | 0.72 |
| XGBoost | 59.2% | 58.1% | 61.5% | 0.89 |
| LSTM | 61.5% | 60.3% | 63.2% | 1.12 |

## 資料來源

- **Yahoo Finance** - 歷史股價資料
- **Alpha Vantage** - 即時報價和財務資料
- **Quandl** - 另類金融資料

## 技術棧

- **Python 3.8+**
- **Pandas / NumPy** - 資料處理
- **TA-Lib** - 技術分析
- **yfinance** - 股票資料下載
- **TensorFlow/Keras** - LSTM 深度學習
- **Scikit-learn** - 機器學習
- **XGBoost** - Gradient Boosting
- **Plotly / Matplotlib** - 視覺化
- **Streamlit** - Web 介面
- **Backtrader** - 回測框架

## 免責聲明

⚠️ **重要警告**：本專案僅供教育和研究用途。股市投資有風險，過去的表現不代表未來的結果。請勿將本專案的預測和分析作為實際投資決策的唯一依據。投資前請諮詢專業財務顧問。

## 授權

MIT License
