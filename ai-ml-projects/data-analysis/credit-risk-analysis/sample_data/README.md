# 信用風險分析 - 示例數據

## 概述

本目錄包含信用風險分析項目所需的示例數據和生成說明。

## 生成示例數據

示例數據可以通過運行 `example_usage.py` 自動生成，該腳本包含以下功能：

### 使用方式

```bash
# 進入項目目錄
cd credit-risk-analysis

# 運行完整示例（會自動生成數據並進行分析）
python example_usage.py
```

## 數據說明

### 生成的數據欄位

| 欄位 | 說明 | 類型 | 範圍 |
|------|------|------|------|
| age | 申請人年齡 | int | 18-75 |
| annual_income | 年收入 | int | 20,000-200,000 |
| employment_length | 工作年資 | int | 0-50 |
| loan_amount | 貸款金額 | int | 1,000-50,000 |
| debt_to_income_ratio | 債務收入比 | float | 0-1 |
| credit_history_length | 信用歷史長度（年） | int | 0-50 |
| number_of_accounts | 帳戶數量 | int | 0-30 |
| number_of_delinquencies | 逾期次數 | int | 0-5 |
| revolving_balance | 循環信貸餘額 | int | 0-50,000 |
| total_credit_limit | 總信用額度 | int | 5,000-500,000 |
| home_ownership | 房屋所有權 | categorical | RENT, OWN, MORTGAGE |
| loan_purpose | 貸款目的 | categorical | debt_consolidation, credit_card, home_improvement, personal, auto |
| default | 是否違約（目標） | int | 0, 1 |

### 特徵工程

示例代碼會自動生成以下衍生特徵：

- `income_per_account`: 人均年收入
- `credit_utilization`: 信用使用率
- `age_groups`: 年齡分組
- `high_risk_features`: 高風險特徵標記
- `credit_history_years`: 信用歷史年數

## 手動準備數據

如果您有自己的數據，請確保包含上述必要欄位，並使用以下格式：

### CSV 格式示例

```
age,annual_income,employment_length,loan_amount,debt_to_income_ratio,credit_history_length,number_of_accounts,number_of_delinquencies,revolving_balance,total_credit_limit,home_ownership,loan_purpose,default
35,75000,5,15000,0.35,10,8,0,5000,50000,MORTGAGE,debt_consolidation,0
42,95000,10,20000,0.40,15,12,1,8000,80000,OWN,credit_card,0
28,45000,2,10000,0.60,5,4,2,2000,20000,RENT,personal,1
```

## 數據大小建議

- **訓練數據**: 至少 500-1000 條記錄
- **測試數據**: 至少 100-200 條記錄
- **特徵數**: 至少 10 個特徵

## 數據質量檢查

運行 `example_usage.py` 時會自動進行：

1. ✅ 缺失值檢查
2. ✅ 重複值檢查
3. ✅ 異常值檢測
4. ✅ 特徵相關性分析
5. ✅ 目標變數分佈檢查

## 注意事項

- 目標變數 (`default`) 應為二進制值 (0/1)
- 類別變數應為字符串類型
- 數值特徵應在合理範圍內
- 建議數據中違約比例在 10-30% 之間（用於訓練更好的模型）

## 進階：使用真實數據

對於真實項目，您可以：

1. 使用公開數據集（如 Kaggle 上的信用卡欺詐檢測數據集）
2. 從自己的業務系統導出數據
3. 合成足夠的訓練數據

## 相關資源

- [UCI 信用卡客戶數據集](https://archive.ics.uci.edu/ml/datasets/credit+card+default)
- [Kaggle 信用風險數據集](https://www.kaggle.com/datasets/laotse/credit-risk-dataset)
- [LendingClub 貸款數據](https://www.kaggle.com/datasets/wordsforthewise/lending-club)
