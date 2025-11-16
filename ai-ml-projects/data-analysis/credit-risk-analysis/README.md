# 信用風險分析 Credit Risk Analysis

💳 使用機器學習評估信用風險，幫助金融機構做出更好的貸款決策

## 專案簡介

本專案實現信用評分模型，預測借款人的違約風險，並提供信用額度建議。

## 功能特點

- ✅ 違約風險預測
- ✅ 信用評分計算
- ✅ 風險分級（A-F）
- ✅ 額度建議
- ✅ 特徵重要性分析
- ✅ 模型可解釋性（SHAP）
- ✅ 批次風險評估
- ✅ 風險監控儀表板

## 快速開始

### 安裝依賴

```bash
cd credit-risk-analysis
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

### 3. 執行風險評估

```bash
python assess.py --input data/test_applicants.csv --output risk_assessment.csv
```

### 4. 啟動 Web 介面

```bash
streamlit run app.py
```

## 使用範例

### Python API

```python
from credit_risk_analyzer import CreditRiskAnalyzer

# 初始化分析器
analyzer = CreditRiskAnalyzer()
analyzer.load_model('models/best_model.pkl')

# 評估單一申請人
applicant = {
    'age': 35,
    'annual_income': 75000,
    'employment_length': 5,
    'home_ownership': 'MORTGAGE',
    'loan_amount': 15000,
    'loan_purpose': 'debt_consolidation',
    'debt_to_income_ratio': 0.35,
    'credit_history_length': 10,
    'number_of_accounts': 8,
    'number_of_delinquencies': 0
}

# 預測違約風險
default_probability = analyzer.predict_risk(applicant)
credit_score = analyzer.calculate_credit_score(applicant)
risk_grade = analyzer.get_risk_grade(default_probability)

print(f"違約機率: {default_probability:.2%}")
print(f"信用評分: {credit_score}")
print(f"風險等級: {risk_grade}")
```

## 資料欄位說明

| 欄位 | 說明 | 類型 |
|------|------|------|
| age | 年齡 | int |
| annual_income | 年收入 | float |
| employment_length | 工作年資 | int |
| home_ownership | 房屋所有權（RENT/OWN/MORTGAGE）| categorical |
| loan_amount | 貸款金額 | float |
| loan_purpose | 貸款目的 | categorical |
| debt_to_income_ratio | 債務收入比 | float |
| credit_history_length | 信用歷史長度（年）| int |
| number_of_accounts | 帳戶數量 | int |
| number_of_delinquencies | 逾期次數 | int |
| revolving_balance | 循環信貸餘額 | float |
| total_credit_limit | 總信用額度 | float |
| default | 是否違約（目標變數）| int (0/1) |

## 風險等級

| 等級 | 違約機率範圍 | 建議 |
|------|-------------|------|
| A | 0-5% | 批准，優惠利率 |
| B | 5-10% | 批准，標準利率 |
| C | 10-20% | 批准，較高利率 |
| D | 20-35% | 謹慎考慮，高利率 |
| E | 35-50% | 不建議批准 |
| F | >50% | 拒絕 |

## 模型性能

在測試集上的表現：

| 模型 | Accuracy | Precision | Recall | AUC |
|------|----------|-----------|--------|-----|
| Logistic Regression | 82.3% | 78.5% | 75.2% | 0.87 |
| Random Forest | 88.7% | 85.3% | 83.1% | 0.93 |
| XGBoost | 91.2% | 88.6% | 86.8% | 0.95 |
| LightGBM | 90.8% | 87.9% | 86.2% | 0.94 |

## 主要功能

### 1. 風險評估

```python
# 批次評估
results = analyzer.batch_assessment(applicants_df)
high_risk = results[results['risk_grade'].isin(['E', 'F'])]
```

### 2. 信用評分

```python
# 計算信用評分（300-850）
credit_score = analyzer.calculate_credit_score(applicant)
```

### 3. 額度建議

```python
# 根據風險計算建議額度
recommended_limit = analyzer.recommend_credit_limit(
    applicant,
    risk_appetite='conservative'  # 或 'moderate', 'aggressive'
)
```

### 4. 模型可解釋性

```python
# SHAP 值分析
analyzer.explain_prediction(applicant)
```

## 技術棧

- **Python 3.8+**
- **Pandas / NumPy** - 資料處理
- **Scikit-learn** - 機器學習
- **XGBoost / LightGBM** - Gradient Boosting
- **SHAP** - 模型解釋
- **Streamlit** - Web 介面
- **Plotly** - 視覺化

## 授權

MIT License
