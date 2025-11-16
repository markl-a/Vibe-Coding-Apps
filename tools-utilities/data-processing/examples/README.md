# 範例資料

本目錄包含用於測試和演示的範例資料檔案。

## 檔案說明

### sample_data.csv
包含員工基本資訊的 CSV 檔案：
- id: 員工編號
- name: 姓名
- email: 電子郵件
- age: 年齡
- city: 城市
- salary: 薪資
- join_date: 入職日期

### sample_data.json
包含員工詳細資訊的 JSON 檔案，包括：
- 基本資訊（同 CSV）
- department: 部門
- skills: 技能列表

## 使用範例

### 查看 CSV 資訊
```bash
python csv_processor.py examples/sample_data.csv --info
```

### 轉換 CSV 為 JSON
```bash
python csv_processor.py examples/sample_data.csv --to-json output.json
```

### 美化 JSON
```bash
python json_transformer.py examples/sample_data.json --prettify
```

### 清理資料
```bash
python data_cleaner.py examples/sample_data.csv --clean-all -o clean_data.csv
```

### 驗證郵箱
```bash
python data_cleaner.py examples/sample_data.csv --validate-email email
```

### 合併資料
```bash
python data_merger.py examples/sample_data.csv examples/sample_data.json -o merged.csv
```
