# 測試說明

## 執行測試

### 執行所有測試
```bash
python -m pytest tests/
```

### 執行特定測試
```bash
python -m pytest tests/test_validators.py
python -m pytest tests/test_converters.py
```

### 執行單一測試
```bash
python tests/test_validators.py
```

### 測試覆蓋率
```bash
pytest --cov=. tests/
```

## 測試結構

- `test_validators.py` - 測試驗證器功能
- `test_converters.py` - 測試轉換器功能
- `test_utils.py` - 測試工具函數

## 新增測試

1. 在 `tests/` 目錄下創建新的測試檔案
2. 檔案名稱必須以 `test_` 開頭
3. 使用 `unittest` 或 `pytest` 框架
4. 確保測試獨立且可重複執行
