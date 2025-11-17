# Data Processing Tools - 範例與使用指南

本目錄包含完整的範例資料和使用示範，幫助您快速上手所有資料處理工具。

## 目錄結構

```
examples/
├── README.md                    # 本文件
├── create_sample_excel.py       # 創建範例 Excel 的腳本
├── complete_workflow.py         # 完整資料處理流程範例
│
├── 範例資料檔案
├── sample_data.csv              # 基本員工資料（CSV）
├── sample_data.json             # 員工詳細資料（JSON）
├── sample_data.xlsx             # 多工作表 Excel 檔案
├── sales_data.csv               # 銷售資料（含需清理的資料）
├── products.json                # 產品資訊（JSON）
├── customer_data.json           # 客戶資料（JSON）
├── employees_dept1.csv          # 部門1員工資料
└── employees_dept2.csv          # 部門2員工資料
```

## 範例檔案說明

### 1. sample_data.csv
基本員工資料，包含：
- id: 員工編號
- name: 姓名
- email: 電子郵件
- age: 年齡
- city: 城市
- salary: 薪資
- join_date: 入職日期

### 2. sample_data.xlsx
多工作表 Excel 檔案，包含：
- 員工資料（8筆）
- 部門資料（4筆）
- 專案資料（5筆）
- 銷售資料（20筆）

### 3. sales_data.csv
銷售資料，**特意包含需要清理的資料**：
- 重複資料
- 缺失值
- 前後空白
- 無效的電子郵件格式

### 4. products.json & customer_data.json
結構化的 JSON 資料，包含巢狀物件

---

## 工具使用範例

### 🔧 工具 1: CSV Processor

#### 檢視 CSV 檔案資訊
```bash
python csv_processor.py examples/sample_data.csv --info
```

#### 選擇特定欄位
```bash
python csv_processor.py examples/sample_data.csv \
  --select "name,email,salary" \
  -o output/selected.csv
```

#### 過濾資料
```bash
# 篩選台北的員工
python csv_processor.py examples/sample_data.csv \
  --filter city equals 台北 \
  -o output/taipei_employees.csv

# 篩選薪資包含 "6" 的員工
python csv_processor.py examples/sales_data.csv \
  --filter product_name contains 電腦 \
  -o output/computers.csv
```

#### 去除重複資料
```bash
python csv_processor.py examples/sales_data.csv \
  --deduplicate \
  -o output/sales_deduped.csv
```

#### 填充缺失值
```bash
python csv_processor.py examples/sales_data.csv \
  --fill-na "未提供" \
  -o output/sales_filled.csv
```

#### 轉換為 JSON
```bash
python csv_processor.py examples/sample_data.csv \
  --to-json output/employees.json
```

#### 合併多個 CSV 檔案
```bash
python csv_processor.py \
  examples/employees_dept1.csv \
  examples/employees_dept2.csv \
  --merge \
  -o output/all_employees.csv
```

---

### 🔄 工具 2: Excel Converter

#### 檢視 Excel 檔案資訊
```bash
python excel_converter.py examples/sample_data.xlsx --info
```

#### 轉換特定工作表為 CSV
```bash
# 轉換第一個工作表（索引 0）
python excel_converter.py examples/sample_data.xlsx \
  --sheet 0 \
  --to-csv output/employees.csv

# 轉換指定名稱的工作表
python excel_converter.py examples/sample_data.xlsx \
  --sheet "銷售資料" \
  --to-csv output/sales.csv
```

#### 轉換為 JSON
```bash
python excel_converter.py examples/sample_data.xlsx \
  --sheet "員工資料" \
  --to-json output/employees.json
```

#### 合併所有工作表
```bash
python excel_converter.py examples/sample_data.xlsx \
  --merge-sheets \
  --format csv \
  -o output/all_sheets_merged.csv
```

#### 分割工作表為獨立檔案
```bash
# 將每個工作表分別儲存為 CSV
python excel_converter.py examples/sample_data.xlsx \
  --split-sheets output/sheets \
  --format csv

# 將每個工作表分別儲存為 JSON
python excel_converter.py examples/sample_data.xlsx \
  --split-sheets output/sheets_json \
  --format json
```

#### 批次轉換多個 Excel 檔案
```bash
python excel_converter.py \
  --batch "examples/*.xlsx" \
  --format csv \
  --output output/converted
```

---

### 🔍 工具 3: JSON Transformer

#### 美化 JSON 格式
```bash
python json_transformer.py examples/products.json --prettify
```

#### 壓縮 JSON 格式
```bash
python json_transformer.py examples/products.json \
  --minify \
  -o output/products.min.json
```

#### JSONPath 查詢
```bash
# 查詢所有產品的名稱
python json_transformer.py examples/products.json \
  --query '$[*].name'

# 查詢價格大於 5000 的產品
python json_transformer.py examples/products.json \
  --query '$[?(@.price > 5000)]'

# 查詢所有客戶的城市
python json_transformer.py examples/customer_data.json \
  --query '$[*].address.city'
```

#### 轉換為 CSV
```bash
python json_transformer.py examples/sample_data.json \
  --to-csv output/from_json.csv
```

#### 轉換為 YAML
```bash
python json_transformer.py examples/products.json \
  --to-yaml output/products.yaml
```

#### 提取指定欄位
```bash
python json_transformer.py examples/sample_data.json \
  --extract "name,email,salary" \
  -o output/extracted.json
```

#### 展平巢狀 JSON
```bash
python json_transformer.py examples/customer_data.json \
  --flatten \
  -o output/customer_flat.json
```

#### 合併多個 JSON 檔案
```bash
# 簡單合併
python json_transformer.py \
  examples/sample_data.json \
  examples/products.json \
  --merge shallow \
  -o output/merged.json

# 深度合併（適用於物件）
python json_transformer.py \
  examples/customer_data.json \
  examples/products.json \
  --merge deep \
  -o output/deep_merged.json
```

---

### 🧹 工具 4: Data Cleaner

#### 執行完整清理流程
```bash
python data_cleaner.py examples/sales_data.csv \
  --clean-all \
  -o output/sales_cleaned.csv
```

#### 移除空白字元
```bash
python data_cleaner.py examples/sales_data.csv \
  --remove-whitespace \
  -o output/sales_trimmed.csv
```

#### 移除重複資料
```bash
python data_cleaner.py examples/sales_data.csv \
  --deduplicate \
  -o output/sales_unique.csv
```

#### 處理缺失值
```bash
# 移除含缺失值的資料列
python data_cleaner.py examples/sales_data.csv \
  --handle-na drop \
  -o output/sales_no_na.csv

# 填充缺失值
python data_cleaner.py examples/sales_data.csv \
  --handle-na fill \
  --fill-value "未知" \
  -o output/sales_filled.csv

# 使用前一筆資料填充
python data_cleaner.py examples/sales_data.csv \
  --handle-na forward \
  -o output/sales_ffill.csv
```

#### 驗證電子郵件
```bash
python data_cleaner.py examples/sales_data.csv \
  --validate-email customer_email \
  -o output/sales_email_validated.csv
```

#### 標準化日期格式
```bash
python data_cleaner.py examples/sales_data.csv \
  --standardize-date order_date \
  --date-format "%Y-%m-%d" \
  -o output/sales_date_std.csv
```

#### 移除異常值
```bash
# 使用 IQR 方法移除價格異常值
python data_cleaner.py examples/sales_data.csv \
  --remove-outliers price,quantity \
  --outlier-method iqr \
  -o output/sales_no_outliers.csv

# 使用 Z-score 方法
python data_cleaner.py examples/sales_data.csv \
  --remove-outliers price \
  --outlier-method zscore \
  -o output/sales_zscore.csv
```

#### 標準化文字格式
```bash
# 轉換為小寫
python data_cleaner.py examples/sales_data.csv \
  --normalize-text lower \
  -o output/sales_lower.csv

# 轉換為標題格式
python data_cleaner.py examples/sales_data.csv \
  --normalize-text title \
  -o output/sales_title.csv
```

#### 自動推斷資料類型
```bash
python data_cleaner.py examples/sales_data.csv \
  --infer-types \
  -o output/sales_typed.csv
```

#### 生成清理報告
```bash
python data_cleaner.py examples/sales_data.csv \
  --clean-all \
  --report output/cleaning_report.txt \
  -o output/sales_cleaned.csv
```

---

### 🔗 工具 5: Data Merger

#### 簡單堆疊合併
```bash
python data_merger.py \
  examples/employees_dept1.csv \
  examples/employees_dept2.csv \
  -o output/all_employees.csv
```

#### 使用鍵值合併（JOIN）
```bash
# Inner Join
python data_merger.py \
  examples/employees_dept1.csv \
  examples/employees_dept2.csv \
  --key emp_id \
  --join inner \
  -o output/employees_inner.csv

# Left Join
python data_merger.py \
  examples/employees_dept1.csv \
  examples/employees_dept2.csv \
  --key emp_id \
  --join left \
  -o output/employees_left.csv

# Outer Join
python data_merger.py \
  examples/employees_dept1.csv \
  examples/employees_dept2.csv \
  --key emp_id \
  --join outer \
  -o output/employees_outer.csv
```

#### 欄位映射合併
```bash
# 當兩個檔案的欄位名稱不同時
python data_merger.py \
  examples/employees_dept1.csv \
  examples/employees_dept2.csv \
  --map "old_name:new_name,emp_no:emp_id" \
  -o output/employees_mapped.csv
```

#### 智能合併（自動偵測相似欄位）
```bash
python data_merger.py \
  examples/employees_dept1.csv \
  examples/employees_dept2.csv \
  --smart \
  -o output/employees_smart.csv
```

#### 合併後去重
```bash
python data_merger.py \
  examples/employees_dept1.csv \
  examples/employees_dept2.csv \
  --deduplicate \
  --dedup-strategy first \
  -o output/employees_unique.csv

# 根據特定欄位去重
python data_merger.py \
  examples/employees_dept1.csv \
  examples/employees_dept2.csv \
  --deduplicate \
  --dedup-subset "emp_id,email" \
  -o output/employees_unique_by_id.csv
```

#### 顯示合併報告
```bash
python data_merger.py \
  examples/employees_dept1.csv \
  examples/employees_dept2.csv \
  --report \
  -o output/employees_merged.csv
```

#### 合併不同格式的檔案
```bash
# CSV + JSON → CSV
python data_merger.py \
  examples/sample_data.csv \
  examples/sample_data.json \
  -o output/mixed_format.csv

# CSV + JSON → Excel
python data_merger.py \
  examples/sample_data.csv \
  examples/sample_data.json \
  -o output/mixed_format.xlsx
```

---

### ⚡ 工具 6: Batch Processor

#### 批次轉換格式
```bash
# 將所有 CSV 轉為 JSON
python batch_processor.py \
  --input "examples/*.csv" \
  --convert json \
  --output output/batch_json

# 將所有 JSON 轉為 CSV
python batch_processor.py \
  --input "examples/*.json" \
  --convert csv \
  --output output/batch_csv
```

#### 批次清理資料
```bash
python batch_processor.py \
  --input "examples/sales*.csv" \
  --clean \
  --output output/cleaned \
  --workers 4
```

#### 批次驗證檔案
```bash
python batch_processor.py \
  --input "examples/*.csv" \
  --validate \
  --workers 4
```

#### 批次分析檔案
```bash
python batch_processor.py \
  --input "examples/*.csv" \
  --analyze \
  --workers 4
```

#### 合併多個檔案
```bash
python batch_processor.py \
  --input "examples/employees_*.csv" \
  --merge \
  --output output/all_employees_merged.csv
```

#### 生成處理報告
```bash
python batch_processor.py \
  --input "examples/*.csv" \
  --convert json \
  --output output/batch \
  --report output/batch_report.json \
  --workers 4
```

#### 調整平行工作者數量
```bash
# 使用 8 個平行工作者
python batch_processor.py \
  --input "examples/*.csv" \
  --convert json \
  --output output/batch \
  --workers 8
```

---

## 常見使用場景

### 場景 1: 清理髒資料
```bash
# 1. 檢視資料問題
python data_cleaner.py examples/sales_data.csv --clean-all -o /tmp/preview.csv

# 2. 完整清理流程
python data_cleaner.py examples/sales_data.csv \
  --remove-whitespace \
  --deduplicate \
  --handle-na drop \
  --validate-email customer_email \
  --report output/cleaning_report.txt \
  -o output/sales_clean.csv
```

### 場景 2: 合併多部門資料
```bash
# 合併多個部門的員工資料
python csv_processor.py \
  examples/employees_dept1.csv \
  examples/employees_dept2.csv \
  --merge \
  -o output/all_departments.csv
```

### 場景 3: Excel 資料處理
```bash
# 1. 檢視 Excel 結構
python excel_converter.py examples/sample_data.xlsx --info

# 2. 分割所有工作表
python excel_converter.py examples/sample_data.xlsx \
  --split-sheets output/sheets \
  --format csv

# 3. 處理特定工作表
python data_cleaner.py output/sheets/銷售資料.csv \
  --clean-all \
  -o output/sales_clean.csv
```

### 場景 4: JSON 資料轉換與查詢
```bash
# 1. 查詢特定資料
python json_transformer.py examples/customer_data.json \
  --query '$[?(@.total_spent > 100000)]'

# 2. 提取需要的欄位
python json_transformer.py examples/customer_data.json \
  --extract "customer_id,name,email" \
  -o output/customers_simple.json

# 3. 轉換為 CSV 進行分析
python json_transformer.py output/customers_simple.json \
  --to-csv output/customers.csv
```

### 場景 5: 批次處理大量檔案
```bash
# 批次轉換所有 CSV 為 JSON
python batch_processor.py \
  --input "examples/*.csv" \
  --convert json \
  --output output/json_files \
  --workers 8 \
  --report output/conversion_report.json
```

---

## 完整工作流程範例

查看 `complete_workflow.py` 腳本，它展示了如何在 Python 程式中組合使用這些工具：

```bash
python complete_workflow.py
```

這個腳本會執行：
1. 載入並清理髒資料
2. 合併多個資料來源
3. 轉換資料格式
4. 生成分析報告
5. 輸出處理後的資料

---

## 進階技巧

### 串連多個工具
```bash
# 1. CSV → JSON → 查詢 → CSV
python csv_processor.py examples/sample_data.csv --to-json /tmp/temp.json
python json_transformer.py /tmp/temp.json --query '$[?(@.salary > 60000)]' -o /tmp/filtered.json
python json_transformer.py /tmp/filtered.json --to-csv output/high_salary.csv
```

### 使用管道處理
```bash
# 清理 → 去重 → 選擇欄位 → 輸出
python data_cleaner.py examples/sales_data.csv --clean-all -o /tmp/step1.csv
python csv_processor.py /tmp/step1.csv --deduplicate -o /tmp/step2.csv
python csv_processor.py /tmp/step2.csv --select "product_name,price,quantity" -o output/final.csv
```

### 建立處理腳本
創建一個 shell 腳本自動化處理流程：

```bash
#!/bin/bash
# process_data.sh

echo "開始資料處理流程..."

# 1. 清理銷售資料
python data_cleaner.py examples/sales_data.csv \
  --clean-all \
  -o output/sales_clean.csv

# 2. 合併員工資料
python data_merger.py \
  examples/employees_dept1.csv \
  examples/employees_dept2.csv \
  --deduplicate \
  -o output/employees_all.csv

# 3. 轉換 Excel 資料
python excel_converter.py examples/sample_data.xlsx \
  --merge-sheets \
  -o output/excel_merged.csv

echo "處理完成！"
```

---

## 疑難排解

### 問題 1: 編碼錯誤
```bash
# 指定編碼
python csv_processor.py examples/data.csv --encoding big5 -o output.csv
```

### 問題 2: 記憶體不足
```bash
# 使用批次處理
python batch_processor.py --input "large_files/*.csv" --clean --workers 2
```

### 問題 3: 日期格式不一致
```bash
# 標準化日期
python data_cleaner.py examples/data.csv \
  --standardize-date date_column \
  --date-format "%Y-%m-%d" \
  -o output.csv
```

---

## 更多資源

- 查看主目錄的 `README.md` 了解工具詳細文檔
- 查看 `tests/` 目錄了解更多測試範例
- 參考 `complete_workflow.py` 學習如何在 Python 中使用這些工具

---

## 快速測試

運行以下命令快速測試所有工具：

```bash
# 進入範例目錄
cd examples

# 測試 CSV 處理
python ../csv_processor.py sample_data.csv --info

# 測試 Excel 轉換
python ../excel_converter.py sample_data.xlsx --info

# 測試 JSON 轉換
python ../json_transformer.py sample_data.json --prettify

# 測試資料清理
python ../data_cleaner.py sales_data.csv --clean-all -o /tmp/test_clean.csv

# 測試資料合併
python ../data_merger.py employees_dept1.csv employees_dept2.csv -o /tmp/test_merge.csv

# 測試批次處理
python ../batch_processor.py --input "*.csv" --validate
```

---

## 授權

這些範例檔案和文檔遵循與主專案相同的授權協議。
