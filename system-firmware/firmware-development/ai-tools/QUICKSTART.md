# 快速入門指南

5 分鐘內開始使用 AI 輔助韌體開發工具！

## 前置要求

- Python 3.8+
- Anthropic API 密鑰

## 安裝步驟

### 1. 安裝依賴

```bash
cd /home/user/Vibe-Coding-Apps/system-firmware/firmware-development/ai-tools
pip install -r requirements.txt
```

### 2. 設置 API 密鑰

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

或者在 `config.yaml` 中設置（不推薦，建議使用環境變量）。

### 3. 驗證安裝

```bash
python ai_assistant.py --help
```

## 快速測試

### 測試代碼分析

```bash
python code_analyzer.py examples/sample_code.c -o test_report.json
```

### 測試 AI 助手

```bash
python ai_assistant.py analyze examples/sample_code.c -o analysis.json
```

### 交互式模式

```bash
python ai_assistant.py -i
```

然後輸入：
```
analyze examples/sample_code.c
```

## 5 個最常用命令

### 1. 完整代碼分析
```bash
python code_analyzer.py your_code.c -o report.html -f html
```

### 2. Bug 檢測
```bash
python bug_hunter.py your_code.c -o bugs.json
```

### 3. 韌體優化
```bash
python firmware_optimizer.py your_firmware.c -o optimization.json
```

### 4. 生成測試
```bash
python test_generator.py your_code.c -o tests/
```

### 5. 生成文檔
```bash
python doc_generator.py your_code.c -o docs/
```

## 批處理示例

分析整個項目：

```bash
python ai_assistant.py batch src/*.c \
  --operations analyze bugs \
  -o project_analysis/
```

## 運行示例

```bash
cd examples
./example_analysis.sh
./example_bug_detection.sh
```

## 查看結果

### JSON 結果
```bash
cat report.json | python -m json.tool
# 或使用 jq
jq '.' report.json
```

### HTML 結果
在瀏覽器中打開生成的 HTML 文件。

## 常見用例

### 提交前檢查
```bash
python bug_hunter.py changed_file.c -o pre_commit_check.json
```

### 代碼審查
```bash
python ai_assistant.py analyze reviewed_file.c -o review_report.html -f html
```

### 性能優化
```bash
python firmware_optimizer.py firmware.c --speed --memory -o perf_opt.json
```

### 生成測試
```bash
python test_generator.py module.c -o module_tests/ -t Unity
```

## 配置

複製並編輯配置文件：
```bash
cp config.yaml my_config.yaml
# 編輯 my_config.yaml
python ai_assistant.py -c my_config.yaml analyze your_code.c
```

## 獲取幫助

每個工具都有詳細幫助：
```bash
python code_analyzer.py --help
python firmware_optimizer.py --help
python test_generator.py --help
python doc_generator.py --help
python bug_hunter.py --help
python ai_assistant.py --help
```

## 故障排除

### API 錯誤
檢查 API 密鑰是否正確設置：
```bash
echo $ANTHROPIC_API_KEY
```

### 依賴問題
重新安裝依賴：
```bash
pip install --upgrade -r requirements.txt
```

### 權限問題
確保腳本可執行：
```bash
chmod +x *.py
chmod +x examples/*.sh
```

## 下一步

- 閱讀 [README.md](README.md) 了解完整功能
- 查看 [examples/](examples/) 目錄中的示例
- 自定義 `config.yaml` 配置文件
- 集成到 CI/CD 流程

## 技巧

1. **使用配置文件**避免重複輸入參數
2. **批處理**可以節省時間
3. **HTML 報告**更易於閱讀和分享
4. **交互式模式**適合探索性分析
5. **組合工具**獲得全面的代碼洞察

## 支援

遇到問題？
- 查看完整 [README.md](README.md)
- 檢查 [examples/README.md](examples/README.md)
- 提交 GitHub Issue

祝您使用愉快！
