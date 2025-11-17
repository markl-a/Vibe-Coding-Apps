# 銷售預測 - 示例數據

## 概述

本目錄包含銷售預測項目所需的示例數據和生成說明。

## 生成示例數據

示例數據可以通過運行 `example_usage.py` 自動生成，該腳本包含以下功能：

### 使用方式

```bash
# 進入項目目錄
cd sales-forecasting

# 運行完整示例（會自動生成數據並進行分析）
python example_usage.py
```

## 數據說明

### 生成的數據欄位

| 欄位 | 說明 | 類型 | 格式 |
|------|------|------|------|
| date | 日期 | datetime | YYYY-MM-DD |
| sales | 銷售額或銷售量 | float | 數值 |
| day_of_week | 星期幾 | int | 0-6 (0=星期一) |
| month | 月份 | int | 1-12 |
| is_holiday | 是否假日 | int | 0, 1 |

### 數據特性

生成的時間序列具有以下特性：

1. **趨勢 (Trend)**
   - 緩慢上升趨勢: 每日增長 $0.5
   - 時間跨度: 365 天

2. **季節性 (Seasonality)**
   - 週度模式: 每 7 天的週期
   - 月度模式: 每 30 天的週期
   - 振幅: 每日波動 $200-$150

3. **假日效應 (Holiday Effects)**
   - 聖誕節 (12月20-31日): +$300 銷售
   - 感恩節 (11月20-27日): +$250 銷售

4. **噪音 (Noise)**
   - 正態分佈: μ=0, σ=100
   - 代表不可預測的日常波動

## 手動準備數據

如果您有自己的銷售數據，請確保包含以下必要欄位。

### CSV 格式示例

```
date,sales,day_of_week,month,is_holiday
2024-01-01,1250.50,0,1,0
2024-01-02,1380.75,1,1,0
2024-01-03,1520.20,2,1,0
2024-11-28,1850.30,3,11,1
2024-12-25,2100.50,2,12,1
```

## 數據大小建議

- **歷史數據長度**: 至少 365 天（1年）
- **訓練期**: 至少 250-300 天
- **預測期**: 7-30 天
- **頻率**: 日度數據優先

## 數據質量檢查

運行 `example_usage.py` 時會自動進行：

1. ✅ 缺失值檢查
2. ✅ 異常值檢測
3. ✅ 趨勢分析
4. ✅ 季節性檢驗
5. ✅ 平穩性測試

## 時間序列特性

### 平穩性

- **平穩序列**: 沒有明顯趨勢和季節性
- **非平穩序列**: 示例數據中存在趨勢
- **處理方法**: 差分或去趨勢化

### 自相關性 (ACF)

示例數據的自相關性模式：

```
延遲 1: 強正相關 (~0.95)
延遲 7: 週度自相關 (~0.7)
延遲 30: 月度自相關 (~0.6)
```

## 高級功能

### 多維度銷售數據

如果您有多個產品類別，可以擴展數據：

```
date,sales,day_of_week,month,is_holiday,category,promotion
2024-01-01,500.00,0,1,0,Electronics,0
2024-01-01,300.00,0,1,0,Clothing,0
2024-01-01,450.50,0,1,0,Home,0
```

### 外部變數

可以添加影響銷售的外部變數：

| 變數 | 說明 | 影響 |
|------|------|------|
| promotion | 促銷活動 | 增加 20-50% |
| temperature | 溫度 | 影響服裝、飲料銷售 |
| competitor_price | 競爭對手價格 | 負相關 |
| day_type | 工作日/週末 | 影響銷售量 |

## 數據預處理建議

### 1. 缺失值處理

```python
# 線性插值
df['sales'] = df['sales'].interpolate(method='linear')

# 前向填充
df['sales'] = df['sales'].fillna(method='ffill')
```

### 2. 異常值處理

```python
# Z-score 方法
z_scores = np.abs((df['sales'] - df['sales'].mean()) / df['sales'].std())
outliers = z_scores > 3

# 替換異常值
df.loc[outliers, 'sales'] = df['sales'].median()
```

### 3. 標準化

```python
from sklearn.preprocessing import MinMaxScaler
scaler = MinMaxScaler()
df['sales_normalized'] = scaler.fit_transform(df[['sales']])
```

## 預測模型選擇

### 簡單方法
- **移動平均 (MA)**: 適合穩定數據
- **指數平滑 (ES)**: 適合快速變化的數據

### 統計方法
- **ARIMA**: 適合平穩序列
- **SARIMA**: 適合有季節性的序列
- **Prophet**: 適合有多種季節性和假日的數據

### 機器學習方法
- **XGBoost**: 快速，支持外部特徵
- **LSTM**: 複雜模式，需要大量數據
- **LightGBM**: 高效，適合快速預測

## 評估指標

預測性能評估使用以下指標：

| 指標 | 說明 | 理想值 |
|------|------|--------|
| MAE | 平均絕對誤差 | 越小越好 |
| RMSE | 均方根誤差 | 越小越好 |
| MAPE | 平均百分比誤差 | < 10% |
| R² | 決定係數 | > 0.8 |

## 相關資源

- [Kaggle 銷售預測數據集](https://www.kaggle.com/datasets/c1ff89d4dfd64f739b08be6fb264c3724d65c3f3bb79ad3bfc534b08)
- [M5 預測大賽](https://www.kaggle.com/competitions/m5-forecasting-accuracy)
- [Rossmann 商店銷售預測](https://www.kaggle.com/c/rossmann-store-sales)

## 業務應用

### 庫存管理

```python
# 預測未來7天的銷售
forecast = forecaster.predict(periods=7)

# 計算安全庫存（95%服務水準）
safety_stock = forecast.std() * 1.65 + forecast.mean() * lead_time_days
```

### 營運規劃

```python
# 識別銷售高峰期
peak_days = forecast.nlargest(5)

# 安排員工排班
staffing_level = forecast / forecast.mean() * baseline_staffing
```

### 財務預算

```python
# 預測未來30天的總收入
revenue_forecast = forecast.sum()

# 與去年同期比較
yoy_growth = (revenue_forecast - historical_revenue) / historical_revenue
```

## 常見問題

**Q: 數據噪音過大怎麼辦？**
A: 使用平滑方法（MA、ES）或增加數據量

**Q: 如何處理缺失值？**
A: 使用插值、填充或移除缺失期間

**Q: 模型準確度不高怎麼辦？**
A: 嘗試不同模型、增加特徵或調整超參數

**Q: 季節性不明顯怎麼辦？**
A: 考慮使用更長的歷史數據或簡單的趨勢模型
