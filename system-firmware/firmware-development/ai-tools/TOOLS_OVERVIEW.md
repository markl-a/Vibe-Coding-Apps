# AI 輔助開發工具總覽

## 核心工具 (6 個)

### 1. code_analyzer.py
**功能**: AI 代碼分析工具

**主要特性**:
- 代碼質量分析（可讀性、複雜度、最佳實踐）
- 安全漏洞檢測（緩衝區溢出、整數溢出、空指針等）
- 性能分析（時間/空間複雜度）
- 記憶體使用分析（靜態/堆疊/堆）

**使用方式**:
```bash
python code_analyzer.py source.c -o report.json
python code_analyzer.py source.c --security-only -o security.json
python code_analyzer.py source.c -o report.html -f html
```

**輸出**: JSON/HTML 格式的詳細分析報告

---

### 2. firmware_optimizer.py
**功能**: 韌體優化工具

**主要特性**:
- 大小優化（代碼大小減少建議）
- 速度優化（性能提升建議）
- 記憶體優化（RAM/Flash 優化）
- 功耗優化（電源管理建議）

**使用方式**:
```bash
python firmware_optimizer.py firmware.c -o optimization.json
python firmware_optimizer.py firmware.c --size --speed -o opt.json
python firmware_optimizer.py firmware.c -o report.html -f html
```

**輸出**: 包含優化建議和預期收益的報告

---

### 3. test_generator.py
**功能**: 測試生成工具

**主要特性**:
- 自動生成單元測試（支援 Unity、CppUTest 等）
- 測試用例生成（功能、邊界、異常測試）
- 覆蓋率分析（語句、分支、路徑）
- 模糊測試建議

**使用方式**:
```bash
python test_generator.py source.c -o tests/
python test_generator.py source.c --unit-tests-only -o test.c
python test_generator.py source.c -t CppUTest -o tests/
```

**輸出**: 可執行的測試代碼和測試計劃

---

### 4. doc_generator.py
**功能**: 文檔生成工具

**主要特性**:
- API 文檔生成
- 代碼註釋添加（Doxygen/JavaDoc 風格）
- 使用手冊生成
- README 生成

**使用方式**:
```bash
python doc_generator.py source.c -o docs/
python doc_generator.py source.c --api-only -o API.md
python doc_generator.py source.c --comments-only -o commented.c
```

**輸出**: Markdown/HTML 格式的文檔和帶註釋的代碼

---

### 5. bug_hunter.py
**功能**: Bug 檢測工具

**主要特性**:
- 靜態分析（語法、語義、控制流）
- 常見錯誤檢測（空指針、數組越界、緩衝區溢出等）
- 邊界條件檢查（輸入驗證、範圍檢查）
- 資源洩漏檢測（記憶體、文件、鎖）

**使用方式**:
```bash
python bug_hunter.py source.c -o bugs.json
python bug_hunter.py source.c --leaks -o leaks.json
python bug_hunter.py source.c -o bugs.html -f html
```

**輸出**: 包含修復建議和 CWE 參考的 Bug 報告

---

### 6. ai_assistant.py
**功能**: AI 助手主程序

**主要特性**:
- 統一 CLI 界面集成所有工具
- 配置管理（YAML 配置）
- 批處理支援（同時處理多個文件）
- 交互式模式

**使用方式**:
```bash
# 命令行模式
python ai_assistant.py analyze source.c -o report.json
python ai_assistant.py batch *.c --operations analyze bugs

# 交互式模式
python ai_assistant.py -i
```

**輸出**: 綜合分析結果和批處理摘要

---

## 配置文件

### config.yaml
**用途**: 工具配置文件模板

**包含設置**:
- API 配置（模型、token、超時）
- 項目信息（名稱、版本、倉庫）
- 分析選項（啟用的分析類型、評分閾值）
- 優化配置（優化級別、編譯器標誌）
- 測試配置（框架、覆蓋率目標）
- 輸出配置（格式、目錄）
- 日誌和快取設置

### requirements.txt
**用途**: Python 依賴列表

**主要依賴**:
- anthropic (Claude API)
- pyyaml (配置文件)
- argparse (命令行參數)
- jsonschema (JSON 驗證)

**可選依賴**:
- black, autopep8 (代碼格式化)
- pylint, flake8, mypy (靜態分析)
- pytest (測試)
- sphinx (文檔)
- tqdm, colorama (UI 增強)

---

## 文檔

### README.md
完整的項目文檔，包含：
- 功能特性詳細說明
- 安裝步驟
- 使用方法和示例
- 配置說明
- CI/CD 集成
- 最佳實踐
- 常見問題
- 進階功能

### QUICKSTART.md
5 分鐘快速入門指南：
- 快速安裝步驟
- 5 個最常用命令
- 快速測試
- 故障排除

### TOOLS_OVERVIEW.md (本文件)
工具總覽和快速參考

---

## 示例 (examples/)

### 示例腳本 (6 個)

1. **example_analysis.sh**
   - 演示代碼分析的各種用法
   - 包含質量、安全、性能、記憶體分析

2. **example_optimization.sh**
   - 演示韌體優化功能
   - 包含大小、速度、記憶體、功耗優化

3. **example_testing.sh**
   - 演示測試生成功能
   - 包含單元測試、測試用例、覆蓋率分析

4. **example_documentation.sh**
   - 演示文檔生成功能
   - 包含 API 文檔、註釋、手冊、README

5. **example_bug_detection.sh**
   - 演示 Bug 檢測功能
   - 包含靜態分析、錯誤檢測、洩漏檢測

6. **example_batch.sh**
   - 演示批處理功能
   - 包含多文件處理和操作組合

### 示例代碼

**sample_code.c**
包含各種常見編程錯誤的示例代碼，用於測試工具功能：
- 緩衝區溢出
- 空指針解引用
- 記憶體洩漏
- 邊界條件錯誤
- 除零錯誤

### examples/README.md
示例使用詳細說明

---

## 工具對比

| 工具 | 主要用途 | 輸入 | 輸出 | 適用場景 |
|------|----------|------|------|----------|
| code_analyzer | 代碼質量評估 | C/C++ 源文件 | JSON/HTML 報告 | 代碼審查、質量監控 |
| firmware_optimizer | 優化建議 | 韌體源文件 | 優化報告 | 性能調優、大小優化 |
| test_generator | 測試生成 | 源文件 | 測試代碼/報告 | 單元測試、覆蓋率提升 |
| doc_generator | 文檔生成 | 源文件 | 文檔/註釋 | 文檔編寫、註釋補充 |
| bug_hunter | Bug 檢測 | 源文件 | Bug 報告 | Bug 修復、安全審計 |
| ai_assistant | 集成工具 | 源文件 | 綜合報告 | 批處理、全面分析 |

---

## 工作流程建議

### 開發階段
```bash
# 1. 編寫代碼後進行分析
python code_analyzer.py new_module.c -o analysis.json

# 2. 檢測 Bug
python bug_hunter.py new_module.c -o bugs.json

# 3. 修復問題後生成測試
python test_generator.py new_module.c -o tests/
```

### 優化階段
```bash
# 1. 性能分析
python code_analyzer.py --performance-only module.c -o perf.json

# 2. 獲取優化建議
python firmware_optimizer.py module.c -o optimization.json

# 3. 應用優化後重新分析
python code_analyzer.py optimized_module.c -o analysis_v2.json
```

### 發布前
```bash
# 1. 完整分析
python ai_assistant.py batch src/*.c --operations analyze bugs

# 2. 生成文檔
python doc_generator.py src/*.c -o docs/

# 3. 確保測試覆蓋率
python test_generator.py src/*.c -o tests/
```

---

## 技術規格

### 支援的語言
- C (主要)
- C++ (支援)
- 可擴展到其他語言

### AI 模型
- Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
- 最大 token: 8000 (可配置)

### 輸出格式
- JSON (機器可讀)
- HTML (人類可讀)
- Markdown (文檔)
- 源代碼 (測試/註釋)

### 集成能力
- 命令行工具
- Python API
- CI/CD 兼容
- 可批處理

---

## 更新日誌

### v1.0.0 (2025-11-18)
- 初始發布
- 6 個核心 AI 工具
- 完整文檔和示例
- 配置管理系統
- 批處理支援

---

## 快速命令參考

```bash
# 分析
python code_analyzer.py file.c -o report.json
python code_analyzer.py file.c -o report.html -f html

# 優化
python firmware_optimizer.py file.c --size --speed -o opt.json

# 測試
python test_generator.py file.c -o tests/

# 文檔
python doc_generator.py file.c -o docs/

# Bug 檢測
python bug_hunter.py file.c -o bugs.json

# AI 助手
python ai_assistant.py analyze file.c -o report.json
python ai_assistant.py batch *.c --operations analyze bugs
python ai_assistant.py -i  # 交互式模式

# 運行示例
cd examples && ./example_analysis.sh
```

---

## 許可證

MIT License

## 支援

- GitHub Issues: 問題反饋
- Pull Requests: 功能貢獻
- Documentation: 文檔改進

---

**祝您開發愉快！**
