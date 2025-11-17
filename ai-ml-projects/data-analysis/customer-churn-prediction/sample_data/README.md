# 客戶流失預測 - 示例數據

## 概述

本目錄包含客戶流失預測項目所需的示例數據和生成說明。

## 生成示例數據

示例數據可以通過運行 `example_usage.py` 自動生成，該腳本包含以下功能：

### 使用方式

```bash
# 進入項目目錄
cd customer-churn-prediction

# 運行完整示例（會自動生成數據並進行分析）
python example_usage.py
```

## 數據說明

### 生成的數據欄位

| 欄位 | 說明 | 類型 | 值/範圍 |
|------|------|------|--------|
| customer_id | 客戶ID | string | CUST_00001... |
| tenure | 使用服務月數 | int | 1-72 |
| monthly_charges | 月費用 | float | 20-120 |
| total_charges | 總費用 | float | 100-10,000 |
| phone_service | 是否使用電話服務 | int | 0, 1 |
| streaming_tv | 是否訂閱串流電視 | int | 0, 1 |
| streaming_movies | 是否訂閱串流電影 | int | 0, 1 |
| tech_support | 是否有技術支援 | int | 0, 1 |
| online_security | 是否有線上安全 | int | 0, 1 |
| device_protection | 是否有設備保護 | int | 0, 1 |
| paperless_billing | 是否使用無紙化帳單 | int | 0, 1 |
| senior_citizen | 是否為老年人 | int | 0, 1 |
| partner | 是否有伴侶 | int | 0, 1 |
| dependents | 是否有家屬 | int | 0, 1 |
| contract_type | 合約類型 | categorical | Month-to-month, One year, Two year |
| internet_service | 網路服務類型 | categorical | DSL, Fiber optic, No |
| payment_method | 付款方式 | categorical | Electronic check, Mailed check, Bank transfer, Credit card |
| churn | 是否流失（目標） | int | 0, 1 |

## 數據特性

### 流失原因分析

根據生成邏輯，以下因素影響客戶流失：

1. **合約類型** (30%): 月度合約客戶流失風險最高
2. **附加服務** (15%): 缺乏附加服務的客戶流失風險較高
3. **使用週期** (10%): 新客戶（<12個月）流失風險較高
4. **年齡** (5%): 老年客戶流失風險較高

## 手動準備數據

如果您有自己的數據，請確保包含上述必要欄位。

### CSV 格式示例

```
customer_id,tenure,monthly_charges,total_charges,phone_service,streaming_tv,streaming_movies,tech_support,online_security,device_protection,paperless_billing,senior_citizen,partner,dependents,contract_type,internet_service,payment_method,churn
CUST_00001,12,65.5,786.0,1,1,0,0,0,0,1,0,1,0,Month-to-month,DSL,Electronic check,1
CUST_00002,24,80.0,1920.0,1,1,1,1,1,0,0,0,0,1,One year,Fiber optic,Bank transfer,0
CUST_00003,6,45.0,270.0,0,0,0,0,0,0,1,1,0,0,Month-to-month,DSL,Mailed check,1
```

## 數據大小建議

- **訓練數據**: 至少 3,000-5,000 條記錄
- **測試數據**: 至少 500-1,000 條記錄
- **特徵數**: 至少 15 個特徵

## 數據質量檢查

運行 `example_usage.py` 時會自動進行：

1. ✅ 缺失值檢查
2. ✅ 重複值檢查
3. ✅ 資料類型驗證
4. ✅ 特徵分佈分析
5. ✅ 流失率分析

## 關鍵指標

### 流失率分佈

- 推薦的流失率範圍: **15-30%**
- 過低 (<10%): 模型可能欠擬合
- 過高 (>50%): 數據不平衡，需要特殊處理

### 特徵類型分佈

- 數值特徵: 約 50%
- 二進制特徵: 約 40%
- 類別特徵: 約 10%

## 進階應用

### 多維度分析

示例代碼支持按以下維度分析流失：

```python
# 按合約類型分析
churn_by_contract = df.groupby('contract_type')['churn'].mean()

# 按服務組合分析
churn_by_services = df.groupby(['tech_support', 'online_security', 'device_protection'])['churn'].mean()
```

### 客戶分層

根據流失風險進行客戶分層：

- 🟢 **低風險** (0-30%): 維持現有服務
- 🟡 **中風險** (30-70%): 主動關懷，評估需求
- 🔴 **高風險** (70-100%): 優先挽留，提供優惠

## 相關資源

- [Kaggle 電信客戶流失數據集](https://www.kaggle.com/datasets/blastchar/telco-customer-churn)
- [UCI ML Repository - Churn Dataset](https://archive.ics.uci.edu/ml/datasets/churn)

## 數據預處理建議

1. 標準化數值特徵（monthly_charges, total_charges）
2. 編碼類別變數（contract_type, internet_service, payment_method）
3. 處理可能的類別不平衡（使用 SMOTE 或權重調整）
4. 移除冗餘特徵（如 tenure 和 total_charges 的相關性）
