# AI 工具目錄結構

```
ai-tools/
│
├── 核心工具 (6個 Python 腳本)
│   ├── code_analyzer.py          # AI 代碼分析工具
│   ├── firmware_optimizer.py     # 韌體優化工具
│   ├── test_generator.py         # 測試生成工具
│   ├── doc_generator.py          # 文檔生成工具
│   ├── bug_hunter.py             # Bug 檢測工具
│   └── ai_assistant.py           # AI 助手主程序
│
├── 配置文件
│   ├── config.yaml               # 配置文件模板
│   ├── requirements.txt          # Python 依賴列表
│   └── .gitignore                # Git 忽略文件
│
├── 文檔
│   ├── README.md                 # 完整項目文檔 (11KB)
│   ├── QUICKSTART.md             # 快速入門指南
│   ├── TOOLS_OVERVIEW.md         # 工具總覽
│   └── STRUCTURE.md              # 本文件 - 目錄結構
│
├── 工具腳本
│   └── verify_installation.sh    # 安裝驗證腳本
│
└── examples/                      # 示例目錄
    ├── README.md                  # 示例說明
    ├── sample_code.c              # 示例 C 代碼
    │
    └── 示例腳本 (6個)
        ├── example_analysis.sh         # 代碼分析示例
        ├── example_optimization.sh     # 韌體優化示例
        ├── example_testing.sh          # 測試生成示例
        ├── example_documentation.sh    # 文檔生成示例
        ├── example_bug_detection.sh    # Bug 檢測示例
        └── example_batch.sh            # 批處理示例
```

## 文件說明

### 核心工具

| 文件 | 大小 | 功能 |
|------|------|------|
| code_analyzer.py | 16KB | 代碼質量、安全、性能、記憶體分析 |
| firmware_optimizer.py | 16KB | 大小、速度、記憶體、功耗優化 |
| test_generator.py | 17KB | 單元測試、測試用例、覆蓋率、模糊測試 |
| doc_generator.py | 16KB | API 文檔、代碼註釋、手冊、README |
| bug_hunter.py | 18KB | 靜態分析、錯誤檢測、洩漏檢測 |
| ai_assistant.py | 16KB | 統一界面、批處理、配置管理 |

### 配置文件

| 文件 | 大小 | 用途 |
|------|------|------|
| config.yaml | 3.4KB | 工具配置模板 |
| requirements.txt | 663B | Python 依賴清單 |
| .gitignore | - | Git 版本控制配置 |

### 文檔

| 文件 | 大小 | 內容 |
|------|------|------|
| README.md | 11KB | 完整功能說明、安裝、使用方法 |
| QUICKSTART.md | 3.4KB | 5 分鐘快速入門 |
| TOOLS_OVERVIEW.md | 7.9KB | 工具詳細對比和參考 |
| STRUCTURE.md | - | 目錄結構說明 (本文件) |

### 示例

| 文件 | 大小 | 說明 |
|------|------|------|
| example_analysis.sh | 1.6KB | 代碼分析示例 |
| example_optimization.sh | 2.0KB | 優化分析示例 |
| example_testing.sh | 1.7KB | 測試生成示例 |
| example_documentation.sh | 1.8KB | 文檔生成示例 |
| example_bug_detection.sh | 1.8KB | Bug 檢測示例 |
| example_batch.sh | 1.7KB | 批處理示例 |
| sample_code.c | 3.0KB | 包含各種 bug 的示例代碼 |
| examples/README.md | 4.9KB | 示例使用說明 |

## 總計

- **總文件數**: 21 個
- **Python 工具**: 6 個
- **文檔**: 4 個
- **示例腳本**: 6 個
- **配置文件**: 3 個
- **示例代碼**: 1 個
- **工具腳本**: 1 個

## 工作流程

```
開發 → 分析 → 優化 → 測試 → 文檔 → 發布
  ↓       ↓       ↓       ↓       ↓       ↓
編碼 → Analyzer → Optimizer → Test Gen → Doc Gen → 完成
       ↓
    Bug Hunter (持續檢測)
```

## 使用路徑

1. **新功能開發**:
   ```
   編寫代碼 → code_analyzer → bug_hunter → test_generator
   ```

2. **性能優化**:
   ```
   code_analyzer (性能分析) → firmware_optimizer → 重新分析
   ```

3. **發布準備**:
   ```
   全面分析 → 修復問題 → 生成測試 → 生成文檔 → 發布
   ```

4. **代碼審查**:
   ```
   ai_assistant batch → 查看報告 → 修復問題
   ```

## 擴展性

### 添加新工具
在主目錄創建新的 Python 腳本，遵循現有工具的結構。

### 自定義配置
編輯 `config.yaml` 或創建自定義配置文件。

### 添加示例
在 `examples/` 目錄添加新的示例腳本和代碼。

## 版本控制

建議的 `.gitignore` 已包含：
- Python 緩存和編譯文件
- 虛擬環境
- IDE 配置
- 輸出目錄
- 日誌文件
- 臨時文件

## 集成方式

### Make 集成
```makefile
analyze:
	python ai-tools/code_analyzer.py src/main.c
```

### CI/CD 集成
```yaml
- name: AI Analysis
  run: python ai-tools/ai_assistant.py batch src/*.c
```

### Git Hooks
```bash
# .git/hooks/pre-commit
python ai-tools/bug_hunter.py $FILES
```

## 路徑說明

- **絕對路徑**: `/home/user/Vibe-Coding-Apps/system-firmware/firmware-development/ai-tools/`
- **相對路徑** (從 firmware-development): `ai-tools/`
- **工作目錄**: 建議在 `ai-tools/` 目錄下運行命令

## 許可證

MIT License - 所有文件均採用相同許可證

---

最後更新: 2025-11-18
