# AI 輔助韌體開發工具套件

一套完整的 AI 驅動韌體開發工具，使用 Claude Sonnet 4.5 API 提供智能化的代碼分析、優化、測試生成和文檔生成功能。

## 功能特性

### 1. 代碼分析器 (code_analyzer.py)
- **代碼質量分析**: 評估代碼可讀性、複雜度和最佳實踐遵循情況
- **安全漏洞檢測**: 識別緩衝區溢出、整數溢出、空指針等安全問題
- **性能分析**: 分析時間和空間複雜度，提供優化建議
- **記憶體使用分析**: 評估靜態、堆疊和堆記憶體使用情況
- **生成詳細報告**: 支援 JSON 和 HTML 格式

### 2. 韌體優化器 (firmware_optimizer.py)
- **大小優化**: 識別未使用代碼、重複代碼，建議編譯器優化選項
- **速度優化**: 熱點分析、循環優化、算法改進建議
- **記憶體優化**: RAM/Flash 使用優化、數據結構優化
- **功耗優化**: 睡眠模式、外設管理、電源優化建議
- **綜合優化報告**: 包含前後對比和預期收益

### 3. 測試生成器 (test_generator.py)
- **自動生成單元測試**: 支援 Unity、CppUTest 等測試框架
- **測試用例生成**: 功能測試、邊界測試、異常測試等
- **覆蓋率分析**: 語句、分支、路徑覆蓋率分析
- **模糊測試建議**: 識別模糊測試目標和策略
- **測試代碼生成**: 直接生成可執行的測試代碼

### 4. 文檔生成器 (doc_generator.py)
- **API 文檔**: 自動生成詳細的 API 參考文檔
- **代碼註釋**: 添加 Doxygen/JavaDoc 風格的代碼註釋
- **使用手冊**: 生成用戶使用手冊和配置指南
- **README 生成**: 自動生成項目 README 文件
- **多種格式**: 支援 Markdown、HTML、reStructuredText

### 5. Bug 檢測器 (bug_hunter.py)
- **靜態分析**: 語法、語義和控制流分析
- **常見錯誤檢測**: 空指針、數組越界、緩衝區溢出等
- **邊界條件檢查**: 輸入驗證、範圍檢查、邊緣情況
- **資源洩漏檢測**: 記憶體洩漏、文件句柄、鎖資源等
- **詳細報告**: 包含修復建議和 CWE 參考

### 6. AI 助手主程序 (ai_assistant.py)
- **統一 CLI 界面**: 集成所有工具的命令行界面
- **配置管理**: YAML 配置文件支援
- **批處理**: 同時處理多個文件
- **交互式模式**: 提供互動式命令行界面
- **靈活輸出**: 支援多種輸出格式和目錄結構

## 安裝

### 環境要求
- Python 3.8 或更高版本
- Anthropic API 密鑰

### 安裝步驟

1. **克隆或下載工具套件**
```bash
cd /path/to/system-firmware/firmware-development/ai-tools
```

2. **安裝依賴**
```bash
pip install -r requirements.txt
```

3. **設置 API 密鑰**

方式 1: 環境變量（推薦）
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

方式 2: 配置文件
```yaml
# 編輯 config.yaml
api_key: "your-api-key-here"
```

4. **驗證安裝**
```bash
python ai_assistant.py --help
```

## 使用方法

### 快速開始

#### 1. 代碼質量分析
```bash
# 分析單個文件
python code_analyzer.py source.c -o report.json

# 生成 HTML 報告
python code_analyzer.py source.c -o report.html -f html

# 僅進行安全分析
python code_analyzer.py source.c --security-only -o security.json
```

#### 2. 韌體優化
```bash
# 完整優化分析
python firmware_optimizer.py firmware.c -o optimization.json

# 僅分析大小優化
python firmware_optimizer.py firmware.c --size -o size_opt.json

# 速度和記憶體優化
python firmware_optimizer.py firmware.c --speed --memory -o opt.json
```

#### 3. 測試生成
```bash
# 生成完整測試套件
python test_generator.py source.c -o tests/

# 僅生成單元測試
python test_generator.py source.c --unit-tests-only -o test_source.c

# 使用特定測試框架
python test_generator.py source.c -t CppUTest -o tests/
```

#### 4. 文檔生成
```bash
# 生成完整文檔
python doc_generator.py source.c -o docs/

# 僅生成 API 文檔
python doc_generator.py source.c --api-only -o API.md

# 生成 README
python doc_generator.py source.c --readme-only -p "My Project" -o README.md
```

#### 5. Bug 檢測
```bash
# 完整 Bug 檢測
python bug_hunter.py source.c -o bugs.json

# 僅檢測資源洩漏
python bug_hunter.py source.c --leaks -o leaks.json

# 生成 HTML 報告
python bug_hunter.py source.c -o bugs.html -f html
```

### 使用 AI 助手主程序

#### 命令行模式

```bash
# 代碼分析
python ai_assistant.py analyze source.c -o report.json

# 韌體優化
python ai_assistant.py optimize firmware.c -o opt.json --types size speed

# 生成測試
python ai_assistant.py test source.c -o tests/

# 生成文檔
python ai_assistant.py document source.c -o docs/

# Bug 檢測
python ai_assistant.py bugs source.c -o bugs.html -f html

# 批處理多個文件
python ai_assistant.py batch file1.c file2.c file3.c \
  --operations analyze optimize bugs \
  -o batch_results/
```

#### 交互式模式

```bash
python ai_assistant.py -i
```

在交互式模式中可用的命令：
```
analyze <file>   - 代碼質量分析
optimize <file>  - 韌體優化
test <file>      - 生成測試
document <file>  - 生成文檔
bugs <file>      - Bug 檢測
batch <files>    - 批處理
config           - 顯示配置
help             - 顯示幫助
quit             - 退出
```

## 配置說明

編輯 `config.yaml` 文件自定義工具行為：

```yaml
# 基本配置
language: C
project_name: "My Firmware"
test_framework: Unity
doc_format: markdown
comment_style: doxygen

# API 配置
claude_api:
  model: "claude-sonnet-4-5-20250929"
  max_tokens: 8000
  temperature: 0.7

# 分析配置
code_analysis:
  min_quality_score: 70
  min_security_score: 80

# 優化配置
firmware_optimization:
  optimize_size: true
  optimize_speed: true
  optimization_level: 2

# 測試配置
test_generation:
  target_line_coverage: 80
  target_branch_coverage: 75
```

## 示例

詳細使用示例請查看 `examples/` 目錄：

- `example_analysis.sh` - 代碼分析示例
- `example_optimization.sh` - 韌體優化示例
- `example_testing.sh` - 測試生成示例
- `example_documentation.sh` - 文檔生成示例
- `example_bug_detection.sh` - Bug 檢測示例
- `example_batch.sh` - 批處理示例

## 輸出格式

### JSON 格式
所有工具都支援 JSON 格式輸出，適合程序化處理和集成到 CI/CD 流程。

```json
{
  "file": "source.c",
  "timestamp": "2025-11-18T10:30:00",
  "language": "C",
  "overall_score": 85.5,
  "code_quality": { ... },
  "security": { ... },
  "performance": { ... }
}
```

### HTML 格式
HTML 格式提供可視化的報告，包含彩色編碼的問題嚴重性和詳細的修復建議。

## 最佳實踐

### 1. CI/CD 集成

```yaml
# .github/workflows/ai-analysis.yml
name: AI Code Analysis
on: [push, pull_request]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.8'
      - name: Install dependencies
        run: pip install -r ai-tools/requirements.txt
      - name: Run AI Analysis
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          python ai-tools/ai_assistant.py batch src/*.c \
            --operations analyze bugs \
            -o analysis-results/
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: ai-analysis
          path: analysis-results/
```

### 2. 定期代碼審查

```bash
# 每日代碼質量檢查
#!/bin/bash
python ai_assistant.py batch src/*.c \
  --operations analyze bugs \
  -o daily-reports/$(date +%Y%m%d)/ \
  -c config.yaml
```

### 3. 提交前檢查

```bash
# pre-commit hook
#!/bin/bash
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.c$')
if [ -n "$FILES" ]; then
  for FILE in $FILES; do
    python ai_assistant.py bugs "$FILE" -o /tmp/bug-check.json
    # 檢查結果並決定是否允許提交
  done
fi
```

## 常見問題

### Q: API 調用失敗怎麼辦？
A: 檢查以下事項：
- 確認 API 密鑰正確設置
- 檢查網絡連接
- 驗證 API 配額是否充足
- 查看錯誤日誌獲取詳細信息

### Q: 分析大型文件時超時？
A: 調整配置文件中的超時設置：
```yaml
claude_api:
  timeout: 120  # 增加到 120 秒
  max_tokens: 16000  # 增加 token 限制
```

### Q: 如何批量處理整個項目？
A: 使用批處理命令：
```bash
python ai_assistant.py batch src/**/*.c \
  --operations analyze optimize bugs \
  -o project-analysis/
```

### Q: 生成的測試代碼無法編譯？
A: 確保：
- 正確設置測試框架
- 檢查依賴是否完整
- 驗證編譯器版本兼容性
- 查看生成的測試代碼並根據需要調整

## 進階功能

### 自定義提示詞
創建自定義提示詞模板以滿足特定需求：

```python
# custom_analyzer.py
from code_analyzer import CodeAnalyzer

class CustomAnalyzer(CodeAnalyzer):
    def custom_analysis(self, code):
        custom_prompt = """
        請針對嵌入式系統特殊需求分析此代碼...
        """
        # 實現自定義分析邏輯
```

### 插件系統
擴展工具功能：

```python
# plugins/custom_checker.py
def check_custom_rules(code):
    # 實現自定義檢查規則
    return results
```

## 性能優化建議

1. **使用快取**: 啟用結果快取以避免重複分析
2. **批處理**: 一次處理多個文件以提高效率
3. **並發處理**: 設置適當的並發數量
4. **過濾結果**: 只啟用需要的分析類型

## 貢獻

歡迎貢獻！請遵循以下步驟：

1. Fork 本項目
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 許可證

本項目採用 MIT 許可證 - 詳見 LICENSE 文件

## 聯繫方式

- 問題反饋: 在 GitHub Issues 中提出
- 功能建議: 通過 Pull Request 或 Issues 提出
- 文檔更新: 歡迎提交文檔改進

## 致謝

- [Anthropic](https://www.anthropic.com/) - 提供 Claude API
- 所有貢獻者和用戶的支持

## 版本歷史

### v1.0.0 (2025-11-18)
- 初始版本發布
- 包含 6 個核心 AI 工具
- 支援 C/C++ 韌體代碼分析
- 提供命令行和交互式界面
- 支援批處理和配置管理

---

**注意**: 本工具使用 AI 技術提供建議，請結合人工審查和專業判斷使用分析結果。
