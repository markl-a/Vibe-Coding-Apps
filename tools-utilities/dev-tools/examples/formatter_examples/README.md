# Code Formatter 範例

這個目錄包含程式碼格式化的範例，展示 `code_formatter.py` 的功能。

## 檔案說明

- `unformatted_code.py` - 格式化前的程式碼，包含常見的格式問題
- `formatted_code.py` - 格式化後的程式碼，符合 PEP 8 標準
- `custom_formatter_config.yaml` - 自訂格式化規則範例

## 使用範例

### 1. 檢查程式碼格式

```bash
cd /home/user/Vibe-Coding-Apps/tools-utilities/dev-tools

# 檢查單個檔案
python code_formatter.py examples/formatter_examples/unformatted_code.py --check

# 檢查整個目錄
python code_formatter.py examples/formatter_examples/ --check
```

### 2. 顯示格式差異

```bash
# 顯示格式化前後的差異
python code_formatter.py examples/formatter_examples/unformatted_code.py --diff
```

### 3. 自動格式化

```bash
# 自動修復格式問題
python code_formatter.py examples/formatter_examples/unformatted_code.py --fix

# 批次格式化整個目錄
python code_formatter.py examples/formatter_examples/ --fix
```

### 4. 使用自訂配置

```bash
# 使用自訂規則配置
python code_formatter.py examples/formatter_examples/unformatted_code.py \
    --config examples/formatter_examples/custom_formatter_config.yaml \
    --fix
```

### 5. 格式化並產生報告

```bash
# 格式化並產生詳細報告
python code_formatter.py examples/formatter_examples/ \
    --fix \
    --report formatter_report.json
```

## 常見格式問題

`unformatted_code.py` 包含以下常見的格式問題：

1. **Import 順序混亂** - 標準庫、第三方庫、本地模組應該分組排序
2. **行長度過長** - 超過 88 字元（Black 預設）
3. **空格使用不當** - 運算符、逗號後的空格
4. **引號不一致** - 混用單引號和雙引號
5. **縮排不一致** - 空格和 Tab 混用
6. **函數參數格式** - 參數列表過長時的換行
7. **字典和列表格式** - 元素過多時的格式
8. **註解格式** - 註解前的空格、行內註解

## 格式化規則

預設使用以下工具進行格式化：

- **Black** - Python 程式碼格式化器
- **isort** - Import 語句排序
- **autopep8** - PEP 8 自動修復

## 自訂規則範例

可以透過 YAML 配置檔自訂格式化規則：

```yaml
python:
  formatter: black
  line_length: 100  # 自訂行長度
  target_version: py38

  isort:
    profile: black
    line_length: 100
```

## 整合到開發流程

### Git Pre-commit Hook

```bash
# 在提交前自動格式化
#!/bin/bash
python code_formatter.py . --fix --staged-only
```

### CI/CD Pipeline

```yaml
# .gitlab-ci.yml 或 .github/workflows/format.yml
format-check:
  script:
    - python code_formatter.py . --check
```

## 輸出範例

成功格式化的輸出：

```
✓ 格式化檢查完成
  - 檢查檔案: 5
  - 需要格式化: 2
  - 已修復: 2
  - 錯誤: 0
```

## 提示

1. 使用 `--diff` 先預覽變更再使用 `--fix`
2. 在重要變更前建議先提交到版本控制
3. 團隊應該統一使用相同的格式化配置
4. 可以在 IDE 中整合自動格式化（儲存時觸發）
