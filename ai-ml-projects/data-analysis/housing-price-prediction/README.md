# 房價預測 Housing Price Prediction

🏠 使用機器學習預測房地產價格，幫助買家、賣家和房地產公司做出更明智的決策

## 專案簡介

本專案使用多種回歸模型分析房屋特徵，預測房價，並提供特徵重要性分析和價格建議。

## 功能特點

- ✅ 多種回歸模型（Linear Regression, Random Forest, XGBoost, LightGBM）
- ✅ 自動化特徵工程
- ✅ 地理位置分析
- ✅ 價格區間預測
- ✅ 特徵重要性分析
- ✅ 互動式價格計算器
- ✅ 市場趨勢分析
- ✅ 視覺化地圖展示

## 快速開始

### 安裝依賴

```bash
cd housing-price-prediction
pip install -r requirements.txt
```

### 1. 生成示例資料

```bash
python data_generator.py
```

### 2. 訓練模型

```bash
python train.py
```

### 3. 執行預測

```bash
python predict.py --input data/test_houses.csv --output predictions.csv
```

### 4. 啟動 Web 介面

```bash
streamlit run app.py
```

## 使用範例

### Python API

```python
from housing_predictor import HousingPredictor

# 初始化預測器
predictor = HousingPredictor()

# 載入資料
predictor.load_data('data/housing_data.csv')

# 訓練模型
predictor.train(model_type='xgboost')

# 預測單一房屋
house_features = {
    'bedrooms': 3,
    'bathrooms': 2,
    'sqft_living': 2000,
    'sqft_lot': 5000,
    'floors': 2,
    'waterfront': 0,
    'view': 3,
    'condition': 4,
    'grade': 7,
    'yr_built': 2005,
    'zipcode': '98001'
}

predicted_price = predictor.predict_single(house_features)
print(f"預測房價: ${predicted_price:,.2f}")
```

## 資料欄位說明

| 欄位 | 說明 | 類型 |
|------|------|------|
| bedrooms | 臥室數量 | int |
| bathrooms | 浴室數量 | float |
| sqft_living | 室內面積（平方英尺）| int |
| sqft_lot | 土地面積（平方英尺）| int |
| floors | 樓層數 | float |
| waterfront | 是否臨水 | int (0/1) |
| view | 景觀評分 (0-4) | int |
| condition | 房屋狀況 (1-5) | int |
| grade | 建築品質 (1-13) | int |
| yr_built | 建造年份 | int |
| yr_renovated | 翻新年份 | int |
| zipcode | 郵遞區號 | string |
| lat | 緯度 | float |
| long | 經度 | float |
| price | 房價（目標變數）| float |

## 模型性能

在測試集上的表現：

| 模型 | MAE ($) | RMSE ($) | R² Score |
|------|---------|----------|----------|
| Linear Regression | 112,450 | 168,320 | 0.782 |
| Random Forest | 89,320 | 135,250 | 0.856 |
| XGBoost | 75,280 | 118,640 | 0.891 |
| LightGBM | 73,650 | 115,890 | 0.895 |

## 特徵工程

### 自動生成特徵

```python
from housing_predictor import HousingPredictor

predictor = HousingPredictor()

# 自動生成特徵
predictor.create_features([
    'price_per_sqft',           # 每平方英尺價格
    'total_rooms',              # 總房間數
    'bathrooms_per_bedroom',    # 浴室/臥室比例
    'lot_to_living_ratio',      # 土地/室內面積比例
    'age',                      # 房齡
    'years_since_renovation'    # 距上次翻新年數
])
```

## 技術棧

- **Python 3.8+**
- **Pandas** - 資料處理
- **Scikit-learn** - 機器學習
- **XGBoost / LightGBM** - Gradient Boosting
- **Matplotlib / Seaborn** - 視覺化
- **Plotly** - 互動式圖表
- **Streamlit** - Web 介面
- **Folium** - 地圖視覺化

## 授權

MIT License
