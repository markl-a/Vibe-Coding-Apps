# 📊 Data Processing - 資料處理工具

> 🤖 **AI-Driven Development** - 使用 AI 快速開發強大的資料處理工具

這個子專案包含各種使用 AI 輔助開發的資料處理工具，用於資料轉換、清理和批次處理。

## 📋 專案目標

開發一系列實用的資料處理工具，涵蓋：
- 資料格式轉換（CSV、JSON、XML、Excel）
- 資料清理與驗證
- 批次資料處理
- 資料分析與統計
- ETL（提取、轉換、載入）工具

## 🎯 已實作工具

### 1. **csv_processor.py** - CSV 處理工具
強大的 CSV 檔案處理和轉換工具。

**功能特色：**
- CSV 格式驗證與修復
- 欄位過濾與選擇
- 資料清理（去重、填充缺失值）
- 格式轉換（JSON、Excel、XML）
- 統計分析
- 合併多個 CSV

**使用範例：**
```bash
# 基本資訊
python csv_processor.py data.csv --info

# 選擇特定欄位
python csv_processor.py data.csv --select "name,age,email"

# 轉換為 JSON
python csv_processor.py data.csv --to-json output.json

# 去除重複
python csv_processor.py data.csv --deduplicate --output clean.csv

# 填充缺失值
python csv_processor.py data.csv --fill-na "N/A"

# 合併多個 CSV
python csv_processor.py file1.csv file2.csv --merge --output merged.csv
```

### 2. **json_transformer.py** - JSON 轉換工具
JSON 資料轉換和處理工具。

**功能特色：**
- JSON 格式化與美化
- JSONPath 查詢與提取
- Schema 驗證
- 資料轉換（CSV、YAML、XML）
- 批次處理
- 深度合併

**使用範例：**
```bash
# 美化 JSON
python json_transformer.py data.json --prettify

# JSONPath 查詢
python json_transformer.py data.json --query "$.users[*].email"

# 轉換為 CSV
python json_transformer.py data.json --to-csv output.csv

# 驗證 Schema
python json_transformer.py data.json --validate schema.json

# 合併多個 JSON
python json_transformer.py file1.json file2.json --merge deep
```

### 3. **data_cleaner.py** - 資料清理工具
自動化資料清理和驗證工具。

**功能特色：**
- 移除空白與特殊字元
- 標準化格式（日期、電話、郵箱）
- 資料驗證規則
- 異常值檢測
- 資料類型推斷
- 清理報告生成

**使用範例：**
```bash
# 清理 CSV 資料
python data_cleaner.py data.csv --clean-all

# 驗證郵箱格式
python data_cleaner.py data.csv --validate-email "email"

# 標準化日期格式
python data_cleaner.py data.csv --standardize-date "date_field"

# 移除異常值
python data_cleaner.py data.csv --remove-outliers "age,salary"

# 產生清理報告
python data_cleaner.py data.csv --report report.html
```

### 4. **excel_converter.py** - Excel 轉換工具
Excel 檔案處理和轉換工具。

**功能特色：**
- Excel 讀取與寫入
- 工作表操作
- 轉換為 CSV/JSON
- 批次處理多個工作簿
- 資料驗證
- 格式保留

**使用範例：**
```bash
# 轉換為 CSV
python excel_converter.py data.xlsx --to-csv output.csv

# 指定工作表
python excel_converter.py data.xlsx --sheet "Sheet1" --to-json

# 合併多個工作表
python excel_converter.py data.xlsx --merge-sheets --output merged.csv

# 批次轉換
python excel_converter.py *.xlsx --batch --to-csv
```

### 5. **data_merger.py** - 資料合併工具
合併多個資料來源的工具。

**功能特色：**
- 多格式支援（CSV、JSON、Excel）
- 智能欄位映射
- 資料去重
- 關聯合併（類似 SQL JOIN）
- 衝突解決策略
- 合併報告

**使用範例：**
```bash
# 簡單合併
python data_merger.py file1.csv file2.csv --output merged.csv

# 指定鍵值合併
python data_merger.py file1.csv file2.csv --key "id" --join inner

# 混合格式合併
python data_merger.py data.csv info.json --output result.json

# 自訂欄位映射
python data_merger.py file1.csv file2.csv --map "name:full_name,age:years"
```

### 6. **batch_processor.py** - 批次處理工具
批次處理多個資料檔案的工具。

**功能特色：**
- 平行處理
- 進度顯示
- 錯誤處理與重試
- 處理記錄
- 自訂處理函數
- 結果彙總

**使用範例：**
```bash
# 批次轉換
python batch_processor.py --input "*.csv" --convert json

# 批次清理
python batch_processor.py --input "*.json" --clean --output clean/

# 平行處理
python batch_processor.py --input "*.csv" --workers 4 --process

# 自訂處理
python batch_processor.py --input "*.txt" --script custom_process.py
```

## 🛠️ 技術棧

### 核心語言
- **Python 3.8+** - 主要開發語言

### 資料處理函式庫
- **pandas** - 資料分析與處理
- **numpy** - 數值計算
- **openpyxl** - Excel 處理
- **xlrd / xlwt** - Excel 讀寫
- **jsonpath-ng** - JSON 查詢
- **lxml** - XML 處理
- **PyYAML** - YAML 處理

### 資料驗證
- **jsonschema** - JSON Schema 驗證
- **cerberus** - 資料驗證框架
- **validators** - 常見格式驗證

### 效能優化
- **multiprocessing** - 平行處理
- **dask** - 大數據處理
- **numba** - JIT 編譯加速

### 視覺化
- **matplotlib** - 圖表繪製
- **seaborn** - 統計視覺化
- **plotly** - 互動式圖表

## 🚀 快速開始

### 環境需求

```bash
# Python 3.8 或更高版本
python --version

# 安裝依賴
pip install -r requirements.txt
```

### 基本使用

```bash
# 進入 data-processing 目錄
cd tools-utilities/data-processing

# 查看工具說明
python csv_processor.py --help
python json_transformer.py --help

# 執行資料處理
python csv_processor.py data.csv --info
```

## 📁 專案結構

```
data-processing/
├── README.md                    # 本文件
├── requirements.txt             # Python 依賴
├── csv_processor.py            # CSV 處理工具
├── json_transformer.py         # JSON 轉換工具
├── data_cleaner.py             # 資料清理工具
├── excel_converter.py          # Excel 轉換工具
├── data_merger.py              # 資料合併工具
├── batch_processor.py          # 批次處理工具
├── lib/                        # 共用函式庫
│   ├── __init__.py
│   ├── validators.py           # 驗證器
│   ├── converters.py           # 轉換器
│   └── utils.py                # 工具函數
├── tests/                      # 測試檔案
│   ├── test_csv_processor.py
│   ├── test_json_transformer.py
│   ├── test_data_cleaner.py
│   └── fixtures/               # 測試資料
├── examples/                   # 範例資料
│   ├── sample_data.csv
│   ├── sample_data.json
│   └── sample_data.xlsx
└── docs/                       # 詳細文檔
    ├── csv_processor.md
    ├── json_transformer.md
    └── tutorials/
```

## 🤖 AI 開發工作流程

### 使用 AI 工具開發資料處理工具

1. **需求分析**
   ```
   提示詞範例:
   "開發一個 Python 工具，用於處理 CSV 檔案。
   功能包括：讀取、驗證、清理、轉換格式。
   使用 pandas 進行資料操作。
   支援命令列介面，提供多種選項。"
   ```

2. **程式碼生成**
   - 使用 Claude Code 生成完整工具
   - AI 協助處理邊界情況
   - 自動添加錯誤處理

3. **資料驗證**
   - AI 生成驗證規則
   - 自動處理異常值
   - 資料類型推斷

4. **測試與優化**
   - AI 生成測試資料
   - 效能優化建議
   - 程式碼重構

## 💡 最佳實踐

### 1. 資料處理原則
- ✅ 永遠備份原始資料
- ✅ 驗證輸入資料格式
- ✅ 處理缺失值和異常值
- ✅ 記錄處理過程
- ✅ 提供預覽和回滾功能

### 2. 效能考量
- ✅ 大檔案使用分塊讀取
- ✅ 利用平行處理
- ✅ 選擇適當的資料結構
- ✅ 避免不必要的複製
- ✅ 監控記憶體使用

### 3. 資料品質
- ✅ 定義資料驗證規則
- ✅ 標準化資料格式
- ✅ 去除重複資料
- ✅ 處理編碼問題
- ✅ 產生品質報告

### 4. 可維護性
- ✅ 模組化設計
- ✅ 詳細的文檔
- ✅ 完整的測試
- ✅ 版本控制
- ✅ 配置檔案管理

## 📚 常見使用場景

### 資料清理流程
```bash
# 1. 檢查資料
python csv_processor.py raw_data.csv --info

# 2. 清理資料
python data_cleaner.py raw_data.csv --clean-all --output clean.csv

# 3. 驗證結果
python csv_processor.py clean.csv --validate

# 4. 轉換格式
python csv_processor.py clean.csv --to-json data.json
```

### 資料合併流程
```bash
# 1. 檢查各資料來源
python csv_processor.py users.csv --info
python json_transformer.py orders.json --info

# 2. 合併資料
python data_merger.py users.csv orders.json --key "user_id" --output merged.csv

# 3. 清理合併結果
python data_cleaner.py merged.csv --deduplicate
```

### 批次處理流程
```bash
# 1. 批次轉換
python batch_processor.py --input "data/*.xlsx" --convert csv

# 2. 批次清理
python batch_processor.py --input "data/*.csv" --clean

# 3. 批次合併
python data_merger.py data/*.csv --output final.csv
```

## 🧪 測試

```bash
# 執行所有測試
pytest tests/

# 執行特定測試
pytest tests/test_csv_processor.py

# 測試覆蓋率
pytest --cov=. tests/

# 使用範例資料測試
python csv_processor.py examples/sample_data.csv --info
```

## 📊 工具狀態

| 工具 | 狀態 | 功能完整度 | 測試 |
|------|------|------------|------|
| csv_processor.py | ✅ 完成 | 95% | ✅ |
| json_transformer.py | ✅ 完成 | 90% | ✅ |
| data_cleaner.py | ✅ 完成 | 85% | ✅ |
| excel_converter.py | ✅ 完成 | 90% | ✅ |
| data_merger.py | ✅ 完成 | 85% | ✅ |
| batch_processor.py | ✅ 完成 | 80% | ✅ |

## 🔜 未來計劃

### 即將推出的功能

- **資料庫連接器** - 直接連接資料庫進行 ETL
- **API 整合** - 從 REST API 提取資料
- **即時處理** - 串流資料處理
- **機器學習整合** - 資料預處理管道
- **Web 介面** - 視覺化資料處理介面

### 改進計劃

- [ ] 支援更多資料格式（Parquet、Avro）
- [ ] 增強大數據處理能力
- [ ] 更多資料視覺化選項
- [ ] 自動化資料品質檢查
- [ ] 資料血緣追蹤

## 🤝 貢獻

歡迎貢獻新的資料處理工具或改進現有工具！

### 貢獻指南

1. Fork 專案
2. 創建特性分支
3. 實作工具（使用 AI 輔助）
4. 撰寫測試
5. 更新文檔
6. 提交 Pull Request

### 工具要求

- 必須支援常見資料格式
- 提供完整的錯誤處理
- 包含使用範例
- 通過所有測試
- 遵循程式碼規範

## ⚠️ 注意事項

1. **資料隱私** - 處理敏感資料時注意隱私保護
2. **記憶體限制** - 大檔案分批處理
3. **資料備份** - 處理前務必備份
4. **編碼問題** - 注意檔案編碼（UTF-8、GBK）
5. **資料驗證** - 處理後驗證資料完整性

## 📄 授權

MIT License - 詳見 LICENSE 檔案

## 📞 支援

- 問題回報: GitHub Issues
- 功能建議: GitHub Discussions
- 文檔: 查看 docs/ 目錄

---

**使用 AI 打造更智能的資料處理工具** 📊

> 💡 所有工具都使用 AI 輔助開發，展示了 AI 在資料處理開發中的強大能力。
