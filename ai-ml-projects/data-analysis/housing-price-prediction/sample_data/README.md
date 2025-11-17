# 房價預測 - 示例數據

## 概述

本目錄包含房價預測項目所需的示例數據和生成說明。

## 生成示例數據

示例數據可以通過運行 `example_usage.py` 自動生成，該腳本包含以下功能：

### 使用方式

```bash
# 進入項目目錄
cd housing-price-prediction

# 運行完整示例（會自動生成數據並進行分析）
python example_usage.py
```

## 數據說明

### 生成的數據欄位

| 欄位 | 說明 | 類型 | 範圍 |
|------|------|------|------|
| bedrooms | 臥室數量 | int | 1-5 |
| bathrooms | 浴室數量 | float | 1-5 |
| sqft_living | 室內面積（平方英尺） | int | 1,000-5,000 |
| sqft_lot | 土地面積（平方英尺） | int | 5,000-100,000 |
| floors | 樓層數 | float | 1.0-3.0 |
| waterfront | 是否臨水 | int | 0, 1 |
| view | 景觀評分 | int | 0-4 |
| condition | 房屋狀況 | int | 1-5 |
| grade | 建築品質 | int | 3-13 |
| yr_built | 建造年份 | int | 1950-2024 |
| yr_renovated | 翻新年份 | int | 0-2024 |
| lat | 緯度 | float | 47.15-47.78 |
| long | 經度 | float | -122.52-(-122.21) |
| price | 房價（目標） | float | 100,000+ |

### 衍生特徵

示例代碼會自動生成以下特徵：

| 特徵 | 說明 | 計算方式 |
|------|------|---------|
| price_per_sqft | 每平方英尺價格 | price / sqft_living |
| total_rooms | 總房間數 | bedrooms + bathrooms |
| bathrooms_per_bedroom | 浴室/臥室比例 | bathrooms / (bedrooms + 1) |
| lot_to_living_ratio | 土地/室內面積比 | sqft_lot / sqft_living |
| age | 房齡 | 2024 - yr_built |
| years_since_renovation | 距上次翻新年數 | 2024 - yr_renovated |
| is_renovated | 是否已翻新 | yr_renovated > 0 |

## 數據特性

### 價格影響因素

根據生成邏輯，房價主要受以下因素影響：

1. **室內面積** (高): 每平方英尺 $100
2. **臥室數** (高): 每間 $150,000
3. **浴室數** (中): 每間 $80,000
4. **建築品質** (中): 每級 $20,000
5. **地點** (中): 基於緯度和經度
6. **房齡** (低): 每年 -$500

## 手動準備數據

如果您有自己的房產數據，請確保包含上述必要欄位。

### CSV 格式示例

```
bedrooms,bathrooms,sqft_living,sqft_lot,floors,waterfront,view,condition,grade,yr_built,yr_renovated,lat,long,price
3,2.0,2000,5000,2.0,0,3,4,7,2005,2015,47.5,-122.3,550000
4,2.5,3500,8000,2.5,1,4,5,9,1995,2010,47.6,-122.4,750000
2,1.0,1200,3000,1.0,0,0,3,6,2010,0,47.4,-122.2,350000
```

## 數據大小建議

- **訓練數據**: 至少 300-500 條房屋記錄
- **測試數據**: 至少 50-100 條房屋記錄
- **特徵數**: 至少 10-15 個特徵

## 地理位置編碼

示例數據使用西雅圖地區的地理坐標：

- **緯度範圍**: 47.15 - 47.78
- **經度範圍**: -122.52 - (-122.21)

根據地點，房價會有以下變化：

- 高緯度 + 高經度: 較高房價
- 低緯度 + 低經度: 較低房價

## 數據質量檢查

運行 `example_usage.py` 時會自動進行：

1. ✅ 缺失值檢查
2. ✅ 價格異常值檢測
3. ✅ 特徵相關性分析
4. ✅ 地點分佈分析
5. ✅ 年份合理性驗證

## 房屋評分說明

### 狀況評分 (condition)

| 分數 | 說明 | 特徵 |
|------|------|------|
| 1 | 差 | 需要大量修復 |
| 2 | 一般 | 需要修復 |
| 3 | 平均 | 正常磨損 |
| 4 | 良好 | 光亮整潔 |
| 5 | 優秀 | 新建或完全翻新 |

### 品質評分 (grade)

| 分數 | 說明 | 特徵 |
|------|------|------|
| 3-6 | 低品質 | 基本設施，簡樸設計 |
| 7-9 | 中品質 | 標準設施，良好設計 |
| 10-12 | 高品質 | 優質設施，高端設計 |
| 13 | 豪華 | 最佳材料和工藝 |

## 進階應用

### 地點分析

```python
# 按地理區域的平均房價
location_prices = df.groupby(pd.cut(df['lat'], 5))['price'].mean()

# 識別房價熱點
high_price_areas = df[df['price'] > df['price'].quantile(0.75)]
```

### 投資回報分析

```python
# 房齡與價格的關係
df['price_per_year_of_age'] = df['price'] / (df['age'] + 1)

# 翻新房屋的溢價
renovation_premium = df[df['is_renovated'] == 1]['price'].mean() / df[df['is_renovated'] == 0]['price'].mean()
```

## 相關資源

- [Kaggle 房價預測數據集](https://www.kaggle.com/datasets/harlfoxem/housesalesprediction)
- [King County 房地產數據](https://www.kaggle.com/datasets/shivachandel/kc-house-data)
- [Zillow 房產數據](https://www.zillow.com/research/data/)

## 數據預處理建議

1. **特徵縮放**: 標準化所有數值特徵
2. **異常值處理**: 識別並處理房價異常
3. **缺失值處理**: 用中位數或眾數填補
4. **特徵編碼**: 一熱編碼地理區域或街道
5. **特徵選擇**: 移除共線性特徵

## 模型性能目標

- **Linear Regression**: R² > 0.70
- **Random Forest**: R² > 0.85
- **XGBoost/LightGBM**: R² > 0.90
- **RMSE**: 應低於平均房價的 15%
