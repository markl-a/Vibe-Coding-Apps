# 股市分析 - 示例數據

## 概述

本目錄包含股市分析項目所需的示例數據和生成說明。

## 生成示例數據

示例數據可以通過運行 `example_usage.py` 自動生成，該腳本包含以下功能：

### 使用方式

```bash
# 進入項目目錄
cd stock-market-analysis

# 運行完整示例（會自動生成數據並進行分析）
python example_usage.py
```

## 數據說明

### OHLCV 數據格式

| 欄位 | 說明 | 類型 |
|------|------|------|
| Date | 交易日期 | datetime |
| Open | 開盤價 | float |
| High | 最高價 | float |
| Low | 最低價 | float |
| Close | 收盤價 | float |
| Volume | 成交量 | int |
| Symbol | 股票代碼 | string |

### CSV 格式示例

```
Date,Open,High,Low,Close,Volume,Symbol
2024-01-01,150.50,151.25,149.75,150.80,1500000,AAPL
2024-01-02,150.80,152.10,150.20,151.50,1650000,AAPL
2024-01-03,151.50,153.00,151.00,152.75,1800000,AAPL
```

## 數據大小建議

- **歷史數據長度**: 至少 1-2 年（250-500 個交易日）
- **訓練期**: 至少 200 個交易日
- **測試期**: 至少 50 個交易日
- **預測期**: 5-30 個交易日

## 生成的技術指標

示例代碼自動計算以下指標：

### 趨勢指標

| 指標 | 參數 | 說明 |
|------|------|------|
| SMA | 20, 50, 200 | 簡單移動平均 |
| EMA | 12, 26 | 指數移動平均 |
| MACD | 12, 26, 9 | 移動平均收斂發散 |

### 動量指標

| 指標 | 參數 | 說明 |
|------|------|------|
| RSI | 14 | 相對強弱指標 |
| Stochastic | 14, 3, 3 | 隨機指標 |

### 波動指標

| 指標 | 參數 | 說明 |
|------|------|------|
| Bollinger Bands | 20, 2 | 布林通道 |
| ATR | 14 | 平均真實範圍 |

## 手動準備數據

如果使用真實股票數據，確保以下要求：

### 數據來源

- **Yahoo Finance** API
- **Alpha Vantage**
- **IEX Cloud**
- **Polygon.io**

### 下載代碼示例

```python
import yfinance as yf

# 下載 Apple 股票數據
df = yf.download('AAPL', start='2023-01-01', end='2024-01-01')
df = df.reset_index()
df.rename(columns={'Date': 'Date'}, inplace=True)
df['Symbol'] = 'AAPL'
```

## 數據清理

### 處理缺失值

```python
# 填補缺失的交易日（如假日）
df['Date'] = pd.to_datetime(df['Date'])
df = df.set_index('Date')
df = df.reindex(pd.bdate_range(start=df.index.min(), end=df.index.max()))
df = df.fillna(method='ffill')  # 前向填充
```

### 驗證數據完整性

```python
# 檢查 OHLC 關係
assert (df['High'] >= df['Low']).all()
assert (df['High'] >= df['Open']).all()
assert (df['High'] >= df['Close']).all()

# 檢查成交量
assert (df['Volume'] > 0).all()
```

## 技術指標範圍

### RSI 解釋

| 值 | 說明 | 信號 |
|----|------|------|
| < 30 | 超賣 | 買入信號 |
| 30-70 | 正常 | 持平 |
| > 70 | 超買 | 賣出信號 |

### MACD 解釋

| 情況 | 說明 | 信號 |
|------|------|------|
| MACD > Signal | MACD線在信號線上方 | 買入 |
| MACD < Signal | MACD線在信號線下方 | 賣出 |
| MACD 穿過 Signal | 穿越 | 反轉信號 |

### 布林通道 (Bollinger Bands)

| 位置 | 說明 | 信號 |
|------|------|------|
| 上方 | 價格 > 上軌 | 超買 |
| 中間 | 在兩軌之間 | 正常 |
| 下方 | 價格 < 下軌 | 超賣 |

## 回測數據準備

### 確保順序正確

```python
df = df.sort_values('Date')
df = df.reset_index(drop=True)
```

### 添加交易信號

```python
df['MA_Signal'] = 0
df.loc[df['SMA_20'] > df['SMA_50'], 'MA_Signal'] = 1  # 買入
df.loc[df['SMA_20'] < df['SMA_50'], 'MA_Signal'] = -1  # 賣出
```

## 多股票組合數據

對於投資組合優化，需要多個股票的數據：

```python
symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']

data = {}
for symbol in symbols:
    df = yf.download(symbol, start='2023-01-01', end='2024-01-01')
    data[symbol] = df['Close']

# 合併為一個 DataFrame
portfolio_df = pd.DataFrame(data)
```

## 機器學習特徵工程

### 生成預測目標

```python
# 預測下一日是否上漲
df['Next_Day_Up'] = (df['Close'].shift(-1) > df['Close']).astype(int)

# 預測 n 日後是否上漲
n = 5
df['Target'] = (df['Close'].shift(-n) > df['Close']).astype(int)
```

### 特徵計算

```python
# 收益率
df['Return'] = df['Close'].pct_change()

# 波動率（20日）
df['Volatility'] = df['Return'].rolling(20).std()

# 成交量變化
df['Volume_Change'] = df['Volume'].pct_change()

# 日內波動
df['Intraday_Range'] = (df['High'] - df['Low']) / df['Close']
```

## 風險指標

### 計算風險指標

```python
# 日收益率
returns = df['Close'].pct_change()

# 年化收益率
annual_return = (1 + returns.mean()) ** 252 - 1

# 年化波動率
annual_volatility = returns.std() * np.sqrt(252)

# Sharpe Ratio（無風險利率=2%）
risk_free_rate = 0.02
sharpe_ratio = (annual_return - risk_free_rate) / annual_volatility

# 最大回撤
cumulative_return = (1 + returns).cumprod()
max_drawdown = (cumulative_return - cumulative_return.max()) / cumulative_return.max()
max_drawdown = max_drawdown.min()
```

## 數據驗證檢查表

- ✅ 日期順序正確（升序）
- ✅ 無重複日期
- ✅ High >= Low
- ✅ High >= Open, Close
- ✅ Low <= Open, Close
- ✅ 成交量 > 0
- ✅ 數據類型正確
- ✅ 無異常缺失值

## 相關資源

- [Yahoo Finance 數據](https://finance.yahoo.com/)
- [Alpha Vantage API](https://www.alphavantage.co/)
- [Polygon.io](https://polygon.io/)
- [Kaggle 股票數據](https://www.kaggle.com/datasets/dgawlik/nyse)

## 常見問題

**Q: 如何獲取更長的歷史數據？**
A: 使用 yfinance 的 start 和 end 參數，或付費 API 服務

**Q: 如何處理股票分割和分紅？**
A: Yahoo Finance 已自動調整，其他來源需要手動調整

**Q: 如何處理交易暫停期間的數據？**
A: 使用前向填充或插值，或移除該期間

**Q: 實時數據如何獲取？**
A: 使用 WebSocket API（如 Polygon.io、IEX）

## 免責聲明

⚠️ **重要警告**

- 過去的表現不代表未來的結果
- 股市投資存在風險
- 本數據和分析僅供教育和研究用途
- 投資決策前請諮詢專業財務顧問
- 不對任何損失負責
