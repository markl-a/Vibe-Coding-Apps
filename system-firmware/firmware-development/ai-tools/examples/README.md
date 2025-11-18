# AI 工具使用示例

本目錄包含所有 AI 工具的使用示例腳本和示例代碼。

## 示例腳本

### 1. example_analysis.sh
演示代碼分析工具的各種用法：
- 完整代碼分析
- 單獨的質量、安全、性能和記憶體分析
- JSON 和 HTML 輸出格式

運行示例：
```bash
cd examples
chmod +x example_analysis.sh
./example_analysis.sh
```

### 2. example_optimization.sh
演示韌體優化工具的使用：
- 大小優化
- 速度優化
- 記憶體優化
- 功耗優化
- 聯合優化

運行示例：
```bash
cd examples
chmod +x example_optimization.sh
./example_optimization.sh
```

### 3. example_testing.sh
演示測試生成工具：
- 單元測試生成
- 測試用例生成
- 覆蓋率分析
- 模糊測試建議
- 不同測試框架支援

運行示例：
```bash
cd examples
chmod +x example_testing.sh
./example_testing.sh
```

### 4. example_documentation.sh
演示文檔生成功能：
- API 文檔
- 代碼註釋
- 使用手冊
- README 生成
- 不同註釋風格

運行示例：
```bash
cd examples
chmod +x example_documentation.sh
./example_documentation.sh
```

### 5. example_bug_detection.sh
演示 Bug 檢測功能：
- 靜態分析
- 常見錯誤檢測
- 邊界條件檢查
- 資源洩漏檢測

運行示例：
```bash
cd examples
chmod +x example_bug_detection.sh
./example_bug_detection.sh
```

### 6. example_batch.sh
演示批處理功能：
- 批量文件處理
- 多種操作組合
- 結果匯總

運行示例：
```bash
cd examples
chmod +x example_batch.sh
./example_batch.sh
```

## 示例代碼

### sample_code.c
包含各種常見編程錯誤的示例代碼，用於測試 AI 工具的檢測能力：
- 緩衝區溢出
- 空指針解引用
- 記憶體洩漏
- 邊界條件錯誤
- 除零錯誤

這個文件故意包含多種 bug，用於演示工具的檢測能力。

## 運行所有示例

要運行所有示例，可以創建並執行以下腳本：

```bash
#!/bin/bash
# run_all_examples.sh

echo "運行所有示例..."
echo ""

./example_analysis.sh
./example_optimization.sh
./example_testing.sh
./example_documentation.sh
./example_bug_detection.sh
./example_batch.sh

echo ""
echo "所有示例運行完成！"
```

## 查看結果

所有示例的輸出都保存在 `examples/output/` 目錄下。

查看 JSON 結果：
```bash
# 安裝 jq (JSON 處理工具)
sudo apt-get install jq  # Ubuntu/Debian
brew install jq          # macOS

# 查看分析結果
jq . output/full_analysis.json

# 提取特定信息
jq '.overall_score' output/full_analysis.json
```

查看 HTML 結果：
```bash
# 在瀏覽器中打開
xdg-open output/full_analysis.html  # Linux
open output/full_analysis.html      # macOS
```

## 自定義示例

您可以基於這些示例創建自己的腳本：

```bash
#!/bin/bash
# my_custom_example.sh

# 設置您的文件和參數
MY_FILE="../my_source.c"
OUTPUT_DIR="./my_output"

# 運行分析
python ../code_analyzer.py "$MY_FILE" -o "${OUTPUT_DIR}/my_analysis.json"

# 運行優化
python ../firmware_optimizer.py "$MY_FILE" --size --speed -o "${OUTPUT_DIR}/my_opt.json"

# 生成測試
python ../test_generator.py "$MY_FILE" -o "${OUTPUT_DIR}/my_tests/"

# 檢測 Bug
python ../bug_hunter.py "$MY_FILE" -o "${OUTPUT_DIR}/my_bugs.html" -f html
```

## 提示

1. **設置 API 密鑰**: 運行示例前確保已設置 `ANTHROPIC_API_KEY` 環境變量
   ```bash
   export ANTHROPIC_API_KEY="your-key-here"
   ```

2. **創建輸出目錄**: 示例腳本會自動創建輸出目錄，但也可以手動創建
   ```bash
   mkdir -p examples/output
   ```

3. **修改示例文件**: 可以編輯 `sample_code.c` 來測試不同的代碼模式

4. **查看幫助**: 每個工具都有詳細的幫助信息
   ```bash
   python ../code_analyzer.py --help
   ```

5. **組合使用**: 可以組合多個工具以獲得全面的分析
   ```bash
   python ../ai_assistant.py batch sample_code.c \
     --operations analyze optimize bugs \
     -o comprehensive_analysis/
   ```

## 故障排除

如果遇到問題：

1. 檢查 Python 版本（需要 3.8+）
   ```bash
   python --version
   ```

2. 檢查依賴安裝
   ```bash
   pip install -r ../requirements.txt
   ```

3. 驗證 API 密鑰
   ```bash
   echo $ANTHROPIC_API_KEY
   ```

4. 查看錯誤日誌
   ```bash
   python ../code_analyzer.py sample_code.c 2> error.log
   ```

## 進階用法

### 集成到 Makefile

```makefile
# Makefile
analyze:
	python ../code_analyzer.py src/main.c -o reports/analysis.json

optimize:
	python ../firmware_optimizer.py src/main.c -o reports/optimization.json

test:
	python ../test_generator.py src/main.c -o tests/

all: analyze optimize test
```

### CI/CD 集成

```yaml
# .github/workflows/ai-analysis.yml
- name: AI Code Analysis
  run: |
    cd examples
    ./example_analysis.sh
    ./example_bug_detection.sh
```

## 更多資源

- [主 README](../README.md) - 完整文檔
- [配置文件](../config.yaml) - 配置選項說明
- [工具源代碼](../) - 各工具的實現
