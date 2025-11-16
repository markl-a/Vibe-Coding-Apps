# 客戶流失預測 Customer Churn Prediction

🎯 使用機器學習預測電信客戶流失率，幫助企業提前識別高風險客戶

## 專案簡介

本專案使用多種機器學習演算法分析客戶行為數據，預測客戶流失的可能性，並提供視覺化的分析報告。

## 功能特點

- ✅ 自動化資料生成與處理
- ✅ 多種 ML 模型比較（Random Forest, XGBoost, LightGBM）
- ✅ 特徵重要性分析
- ✅ 客戶流失風險評分
- ✅ 互動式 Web 介面
- ✅ 模型性能評估與視覺化
- ✅ 批次預測功能

## 快速開始

### 安裝依賴

```bash
cd customer-churn-prediction
pip install -r requirements.txt
```

### 1. 生成示例資料

```bash
python data_generator.py
```

這會在 `data/` 資料夾生成示例客戶資料。

### 2. 訓練模型

```bash
python train.py
```

訓練結果會儲存到 `models/` 資料夾。

### 3. 執行預測

```bash
python predict.py --input data/test_customers.csv --output predictions.csv
```

### 4. 啟動 Web 介面

```bash
streamlit run app.py
```

## 資料欄位說明

| 欄位 | 說明 | 類型 |
|------|------|------|
| customer_id | 客戶 ID | string |
| tenure | 使用服務月數 | int |
| monthly_charges | 月費用 | float |
| total_charges | 總費用 | float |
| contract_type | 合約類型 | categorical |
| payment_method | 付款方式 | categorical |
| internet_service | 網路服務類型 | categorical |
| phone_service | 是否使用電話服務 | boolean |
| streaming_tv | 是否訂閱串流電視 | boolean |
| streaming_movies | 是否訂閱串流電影 | boolean |
| tech_support | 是否有技術支援 | boolean |
| online_security | 是否有線上安全 | boolean |
| device_protection | 是否有設備保護 | boolean |
| paperless_billing | 是否使用無紙化帳單 | boolean |
| senior_citizen | 是否為老年人 | boolean |
| partner | 是否有伴侶 | boolean |
| dependents | 是否有家屬 | boolean |
| churn | 是否流失（目標變數）| boolean |

## 使用範例

### Python API

```python
from churn_predictor import ChurnPredictor

# 載入訓練好的模型
predictor = ChurnPredictor()
predictor.load_model('models/best_model.pkl')

# 預測單一客戶
customer_data = {
    'tenure': 12,
    'monthly_charges': 65.5,
    'contract_type': 'Month-to-month',
    # ... 其他特徵
}

churn_probability = predictor.predict_single(customer_data)
print(f"流失機率: {churn_probability:.2%}")

# 批次預測
import pandas as pd
customers_df = pd.read_csv('data/customers.csv')
predictions = predictor.predict_batch(customers_df)
```

### 特徵重要性分析

```python
from churn_predictor import ChurnPredictor

predictor = ChurnPredictor()
predictor.load_model('models/best_model.pkl')

# 取得特徵重要性
importance = predictor.get_feature_importance()
print(importance)

# 視覺化
predictor.plot_feature_importance(top_n=10)
```

## 模型性能

在測試集上的表現：

| 模型 | Accuracy | Precision | Recall | F1-Score | AUC |
|------|----------|-----------|--------|----------|-----|
| Random Forest | 85.2% | 83.1% | 78.5% | 80.7% | 0.89 |
| XGBoost | 87.3% | 85.4% | 81.2% | 83.2% | 0.91 |
| LightGBM | 86.8% | 84.7% | 80.8% | 82.7% | 0.90 |

## 專案結構

```
customer-churn-prediction/
├── README.md                 # 專案說明
├── requirements.txt          # 依賴套件
├── data_generator.py         # 資料生成器
├── churn_predictor.py       # 預測模型類別
├── train.py                 # 訓練腳本
├── predict.py               # 預測腳本
├── app.py                   # Streamlit Web UI
├── data/                    # 資料目錄
│   ├── train_customers.csv
│   ├── test_customers.csv
│   └── sample_customers.csv
├── models/                  # 模型目錄
│   ├── random_forest.pkl
│   ├── xgboost.pkl
│   └── best_model.pkl
└── notebooks/               # Jupyter Notebooks
    ├── exploratory_analysis.ipynb
    └── model_comparison.ipynb
```

## 業務應用

### 1. 識別高風險客戶

```python
# 找出流失機率 > 70% 的高風險客戶
high_risk = predictions[predictions['churn_probability'] > 0.7]
print(f"高風險客戶數量: {len(high_risk)}")
```

### 2. 客戶分群

根據流失風險分群：
- 🟢 低風險 (0-30%): 維持現有服務
- 🟡 中風險 (30-70%): 主動關懷
- 🔴 高風險 (70-100%): 優先挽留

### 3. 挽留策略建議

```python
from churn_predictor import ChurnPredictor

predictor = ChurnPredictor()
recommendations = predictor.get_retention_recommendations(customer_data)
print(recommendations)
```

可能的建議：
- 提供合約升級優惠
- 增加附加服務（技術支援、設備保護）
- 調整付款方式
- 個人化優惠方案

## 進階功能

### 模型更新

定期使用新資料重新訓練模型：

```bash
python train.py --retrain --data data/new_customers.csv
```

### 超參數調整

```python
from churn_predictor import ChurnPredictor

predictor = ChurnPredictor()
best_params = predictor.hyperparameter_tuning(
    X_train, y_train,
    n_iter=100,
    cv=5
)
```

### A/B 測試

比較不同模型或策略的效果：

```python
from churn_predictor import ChurnPredictor

# 比較兩個模型
model_a = ChurnPredictor()
model_a.load_model('models/model_v1.pkl')

model_b = ChurnPredictor()
model_b.load_model('models/model_v2.pkl')

# 評估性能差異
comparison = ChurnPredictor.compare_models(
    [model_a, model_b],
    X_test, y_test
)
```

## 技術棧

- **Python 3.8+**
- **Pandas** - 資料處理
- **Scikit-learn** - 機器學習
- **XGBoost / LightGBM** - Gradient Boosting
- **Matplotlib / Seaborn** - 視覺化
- **Streamlit** - Web 介面
- **Joblib** - 模型序列化

## 最佳實踐

1. **資料品質**
   - 定期更新訓練資料
   - 處理類別不平衡問題
   - 驗證資料完整性

2. **模型監控**
   - 追蹤模型性能指標
   - 檢測模型退化
   - 定期重新訓練

3. **業務整合**
   - 與 CRM 系統整合
   - 自動化預警通知
   - 建立回饋機制

## 授權

MIT License
