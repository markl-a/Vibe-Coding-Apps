# 📚 Data Processing Tools - 完整使用教程

本教程將帶您完整體驗所有資料處理工具的功能。

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd tools-utilities/data-processing
pip install -r requirements.txt
```

### 2. 準備測試資料

我們已經提供了測試資料檔案 `test_analysis_data.csv`,包含 20 筆員工資料。

## 📊 工具使用指南

### 1. 資料分析器 (data_analyzer.py)

進行全面的資料分析,獲取統計見解。

```bash
# 執行完整分析
python data_analyzer.py examples/test_analysis_data.csv --full

# 只執行基本統計
python data_analyzer.py examples/test_analysis_data.csv --basic

# 只執行相關性分析
python data_analyzer.py examples/test_analysis_data.csv --correlation

# 儲存分析報告
python data_analyzer.py examples/test_analysis_data.csv --full --report analysis_report.json --format html
```

**輸出示例:**
- 資料完整性評估
- 欄位統計摘要
- 相關性矩陣
- 分布分析
- 異常值識別
- AI 驅動的智能見解

### 2. 資料視覺化工具 (data_visualizer.py)

自動生成專業圖表。

```bash
# 自動視覺化
python data_visualizer.py examples/test_analysis_data.csv --auto

# 創建儀表板
python data_visualizer.py examples/test_analysis_data.csv --dashboard

# 繪製特定欄位的分布圖
python data_visualizer.py examples/test_analysis_data.csv --distribution age

# 繪製相關性矩陣
python data_visualizer.py examples/test_analysis_data.csv --correlation

# 繪製散點圖
python data_visualizer.py examples/test_analysis_data.csv --scatter age salary

# 指定輸出目錄
python data_visualizer.py examples/test_analysis_data.csv --auto --output-dir my_charts
```

**生成的圖表:**
- 分布直方圖
- 相關性熱力圖
- 散點圖(含趨勢線)
- 柱狀圖
- 圓餅圖
- 綜合儀表板

### 3. 資料品質檢測器 (quality_checker.py)

評估資料品質並獲得改進建議。

```bash
# 執行全面品質檢查
python quality_checker.py examples/test_analysis_data.csv

# 只檢查完整性
python quality_checker.py examples/test_analysis_data.csv --completeness

# 只檢查一致性
python quality_checker.py examples/test_analysis_data.csv --consistency

# 只檢查有效性
python quality_checker.py examples/test_analysis_data.csv --validity

# 儲存詳細報告
python quality_checker.py examples/test_analysis_data.csv --report quality_report.json
```

**評估維度:**
- ✅ 完整性 (Completeness) - 30%
- ✅ 一致性 (Consistency) - 20%
- ✅ 有效性 (Validity) - 30%
- ✅ 唯一性 (Uniqueness) - 20%

**輸出:** 總分 0-100,等級 A+/A/B/C/D

### 4. 異常檢測器 (anomaly_detector.py)

識別資料中的異常值。

```bash
# 執行全面異常檢測
python anomaly_detector.py examples/test_analysis_data.csv

# 使用 Z-score 方法
python anomaly_detector.py examples/test_analysis_data.csv --method zscore --threshold 3.0

# 使用 IQR 方法
python anomaly_detector.py examples/test_analysis_data.csv --method iqr --threshold 1.5

# 只使用統計方法
python anomaly_detector.py examples/test_analysis_data.csv --statistical-only

# 只使用機器學習方法
python anomaly_detector.py examples/test_analysis_data.csv --ml-only --contamination 0.05

# 標記異常並儲存
python anomaly_detector.py examples/test_analysis_data.csv --mark marked_data.csv

# 儲存異常報告
python anomaly_detector.py examples/test_analysis_data.csv --report anomaly_report.json
```

**檢測方法:**
- 統計方法: IQR, Z-score, Modified Z-score
- 機器學習: Isolation Forest
- 模式檢測: 常數值、過度重複、突然跳變
- 相關性異常

### 5. CSV 處理器 (csv_processor.py)

強大的 CSV 檔案處理工具。

```bash
# 查看 CSV 資訊
python csv_processor.py examples/test_analysis_data.csv --info

# 選擇特定欄位
python csv_processor.py examples/test_analysis_data.csv --select "name,age,salary" -o selected.csv

# 去除重複
python csv_processor.py examples/test_analysis_data.csv --deduplicate -o clean.csv

# 填充缺失值
python csv_processor.py examples/test_analysis_data.csv --fill-na "N/A" -o filled.csv

# 轉換為 JSON
python csv_processor.py examples/test_analysis_data.csv --to-json output.json

# 合併多個 CSV
python csv_processor.py file1.csv file2.csv --merge -o merged.csv
```

### 6. JSON 轉換器 (json_transformer.py)

JSON 資料處理工具。

```bash
# 美化 JSON
python json_transformer.py data.json --prettify

# JSONPath 查詢
python json_transformer.py data.json --query "$.users[*].name"

# 轉換為 CSV
python json_transformer.py data.json --to-csv output.csv

# 合併多個 JSON
python json_transformer.py file1.json file2.json --merge deep -o merged.json

# 展平巢狀 JSON
python json_transformer.py data.json --flatten -o flattened.json
```

### 7. 資料清理器 (data_cleaner.py)

自動化資料清理。

```bash
# 執行所有清理操作
python data_cleaner.py data.csv --clean-all -o clean.csv

# 移除空白
python data_cleaner.py data.csv --remove-whitespace -o cleaned.csv

# 去除重複
python data_cleaner.py data.csv --deduplicate -o unique.csv

# 處理缺失值
python data_cleaner.py data.csv --handle-na drop -o no_nulls.csv
python data_cleaner.py data.csv --handle-na fill --fill-value "Unknown" -o filled.csv

# 驗證 email
python data_cleaner.py data.csv --validate-email "email_column" -o validated.csv

# 標準化日期
python data_cleaner.py data.csv --standardize-date "join_date" --date-format "%Y-%m-%d" -o std_date.csv

# 移除異常值
python data_cleaner.py data.csv --remove-outliers "age,salary" --outlier-method iqr -o no_outliers.csv

# 生成清理報告
python data_cleaner.py data.csv --clean-all --report cleaning_report.txt -o clean.csv
```

### 8. 資料合併器 (data_merger.py)

合併多個資料來源。

```bash
# 簡單堆疊合併
python data_merger.py file1.csv file2.csv -o merged.csv

# 使用鍵值合併 (類似 SQL JOIN)
python data_merger.py users.csv orders.csv --key "user_id" --join inner -o merged.csv

# 不同 JOIN 類型
python data_merger.py file1.csv file2.csv --key "id" --join outer -o merged.csv
python data_merger.py file1.csv file2.csv --key "id" --join left -o merged.csv

# 智能合併 (自動偵測相似欄位)
python data_merger.py file1.csv file2.csv --smart -o merged.csv

# 去除重複
python data_merger.py file1.csv file2.csv --deduplicate --dedup-strategy first -o merged.csv

# 顯示合併報告
python data_merger.py file1.csv file2.csv --report -o merged.csv
```

### 9. 批次處理器 (batch_processor.py)

批次處理多個檔案。

```bash
# 批次轉換格式
python batch_processor.py --input "data/*.csv" --convert json --output converted/

# 批次清理
python batch_processor.py --input "data/*.csv" --clean --output cleaned/

# 批次驗證
python batch_processor.py --input "data/*.csv" --validate

# 批次分析
python batch_processor.py --input "data/*.csv" --analyze

# 合併多個檔案
python batch_processor.py --input "data/*.csv" --merge --output final.csv

# 平行處理 (使用多個工作者)
python batch_processor.py --input "data/*.csv" --convert json --workers 8 --output converted/

# 儲存處理報告
python batch_processor.py --input "data/*.csv" --convert json --report process_report.json
```

### 10. Excel 轉換器 (excel_converter.py)

Excel 檔案處理。

```bash
# 轉換為 CSV
python excel_converter.py data.xlsx --to-csv output.csv

# 指定工作表
python excel_converter.py data.xlsx --sheet "Sheet1" --to-json output.json

# 合併多個工作表
python excel_converter.py data.xlsx --merge-sheets --output merged.csv

# 批次轉換
python excel_converter.py *.xlsx --batch --to-csv --output converted/
```

### 11. API 資料提取器 (api_fetcher.py)

從 REST API 提取資料。

```bash
# 單一請求
python api_fetcher.py https://api.example.com /users/1

# 分頁請求
python api_fetcher.py https://api.example.com /users --paginated --per-page 50 -o users.json

# 帶認證
python api_fetcher.py https://api.example.com /data \
    --header "Authorization: Bearer YOUR_TOKEN" \
    --paginated -o data.csv

# POST 請求
python api_fetcher.py https://api.example.com /search \
    --method POST \
    --data '{"query": "test"}' \
    -o results.json

# 限制最大頁數
python api_fetcher.py https://api.example.com /users \
    --paginated --max-pages 10 -o users.csv
```

## 🔄 完整工作流程示例

### 情境:處理銷售資料

```bash
# 1. 從 API 提取資料
python api_fetcher.py https://api.company.com /sales \
    --paginated --per-page 1000 -o raw_sales.json

# 2. 轉換為 CSV
python json_transformer.py raw_sales.json --to-csv sales.csv

# 3. 檢查資料品質
python quality_checker.py sales.csv --report quality_report.json

# 4. 清理資料
python data_cleaner.py sales.csv \
    --clean-all \
    --remove-outliers "amount" \
    -o clean_sales.csv

# 5. 分析資料
python data_analyzer.py clean_sales.csv \
    --full \
    --report analysis_report.html \
    --format html

# 6. 視覺化
python data_visualizer.py clean_sales.csv --auto --dashboard

# 7. 檢測異常
python anomaly_detector.py clean_sales.csv \
    --mark sales_with_anomalies.csv \
    --report anomaly_report.json
```

## 💡 最佳實踐

### 1. 資料處理流程

```
原始資料 → 品質檢查 → 清理 → 驗證 → 分析 → 視覺化 → 報告
```

### 2. 始終備份原始資料

```bash
cp original_data.csv backup_data.csv
```

### 3. 使用管道組合工具

```bash
# 清理 → 去重 → 分析
python data_cleaner.py raw.csv --clean-all -o clean.csv && \
python csv_processor.py clean.csv --deduplicate -o unique.csv && \
python data_analyzer.py unique.csv --full --report report.html
```

### 4. 批次處理大量檔案

```bash
# 使用萬用字元處理多個檔案
python batch_processor.py --input "data/*.csv" --clean --workers 4
```

### 5. 組合不同格式

```bash
# CSV + JSON → 合併的 Excel
python data_merger.py sales.csv orders.json -o combined.xlsx
```

## 🎓 進階技巧

### 1. 自訂資料管道

創建一個 Shell 腳本自動化整個流程:

```bash
#!/bin/bash
# data_pipeline.sh

echo "🚀 開始資料處理管道..."

# 提取
python api_fetcher.py $API_URL /data --paginated -o raw.json

# 轉換
python json_transformer.py raw.json --to-csv data.csv

# 品質檢查
python quality_checker.py data.csv --report quality.json

# 清理
python data_cleaner.py data.csv --clean-all -o clean.csv

# 分析與視覺化
python data_analyzer.py clean.csv --full --report analysis.html
python data_visualizer.py clean.csv --auto

echo "✅ 管道完成!"
```

### 2. 使用配置檔案

創建 `config.json` 來管理設定:

```json
{
  "api": {
    "base_url": "https://api.example.com",
    "headers": {
      "Authorization": "Bearer TOKEN"
    }
  },
  "processing": {
    "remove_outliers": true,
    "fill_missing": "mean",
    "quality_threshold": 80
  },
  "output": {
    "format": "csv",
    "encoding": "utf-8"
  }
}
```

### 3. 定期自動化處理

使用 cron 或 Task Scheduler:

```cron
# 每天凌晨 2 點執行
0 2 * * * /path/to/data_pipeline.sh
```

## ❓ 常見問題

### Q: 如何處理大型檔案?

使用批次處理器的分塊功能:

```bash
python batch_processor.py --input large_file.csv --chunk-size 10000
```

### Q: 如何合併不同格式的檔案?

資料合併器支援混合格式:

```bash
python data_merger.py data.csv info.json stats.xlsx -o combined.csv
```

### Q: 如何自訂視覺化樣式?

編輯 `data_visualizer.py` 中的樣式設定或使用 matplotlib 樣式表。

### Q: 異常檢測的閾值如何選擇?

- IQR 方法: 1.5 (標準), 3.0 (寬鬆)
- Z-score: 3.0 (標準), 2.5 (嚴格)
- ML contamination: 0.1 (10% 異常預期)

## 📖 更多資源

- 查看各工具的 `--help` 獲取詳細選項
- 參考 `examples/` 目錄中的範例資料
- 閱讀主 README.md 了解架構設計

## 🤝 貢獻

歡迎提交問題和改進建議!

---

**Happy Data Processing!** 📊✨
