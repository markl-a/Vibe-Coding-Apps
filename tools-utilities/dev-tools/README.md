# 🛠️ Dev Tools - 開發工具

> 🤖 **AI-Driven Development** - 使用 AI 快速開發強大的開發者工具

這個子專案包含各種使用 AI 輔助開發的開發者工具，提升開發效率和程式碼品質。

## 📋 專案目標

開發一系列實用的開發工具，涵蓋：
- 程式碼生成與範本
- 程式碼格式化與美化
- 測試工具與覆蓋率
- 部署與 CI/CD 輔助
- 開發環境管理

## 🎯 已實作工具

### 🆕 新增 AI 輔助工具

#### 1. **ai_code_reviewer.py** - AI 代碼審查工具
全面的 AI 輔助代碼審查和質量分析工具。

**功能特色：**
- 🔍 自動代碼質量分析（使用 AST 解析）
- 🔒 安全漏洞檢測（eval、exec、硬編碼密鑰等）
- ⚡ 性能問題識別（低效循環、字符串拼接等）
- 📏 代碼風格檢查（PEP 8 違規、過長行等）
- 📊 複雜度分析（循環複雜度、函數長度）
- 💡 最佳實踐建議
- 📄 多種輸出格式（文字、JSON、HTML）
- 📈 詳細指標（代碼行數、可維護性指數）

**使用範例：**
```bash
# 審查單個檔案
python ai_code_reviewer.py file.py

# 審查整個目錄
python ai_code_reviewer.py src/

# 生成 HTML 報告
python ai_code_reviewer.py src/ --format html -o code_review.html

# 生成 JSON 報告
python ai_code_reviewer.py src/ --format json -o report.json
```

#### 2. **performance_profiler.py** - 性能分析工具
分析程式碼性能並提供優化建議。

**功能特色：**
- 📊 CPU 性能分析（cProfile 整合）
- 💾 內存使用追蹤（tracemalloc）
- 🔬 函數級性能分析
- 📝 腳本性能分析
- 🏃 基準測試和函數比較
- 📈 統計分析（平均、最小、最大、標準差、吞吐量）
- 💡 自動性能優化建議
- 📄 多種輸出格式（文字、JSON、HTML）

**使用範例：**
```bash
# 分析腳本性能
python performance_profiler.py script.py

# 啟用內存追蹤
python performance_profiler.py script.py --memory

# 生成 HTML 報告
python performance_profiler.py script.py -f html -o perf_report.html
```

#### 3. **security_scanner.py** - 安全掃描工具
全面的代碼安全掃描和漏洞檢測。

**功能特色：**
- 🔐 SQL 注入檢測
- 💉 命令注入檢測（os.system、shell=True、eval/exec）
- 🌐 XSS 漏洞檢測
- 🔑 硬編碼密鑰檢測（密碼、API 密鑰、私鑰）
- 🔒 弱加密算法檢測（MD5、SHA1、DES、RC4）
- 📦 不安全反序列化檢測（pickle、YAML）
- 📁 文件操作漏洞（路徑遍歷）
- 🛡️ CSRF 和調試模式檢測
- 📊 CWE ID 映射
- 📄 多種輸出格式（文字、JSON、HTML、SARIF for GitHub Security）

**使用範例：**
```bash
# 掃描單個檔案
python security_scanner.py file.py

# 掃描目錄
python security_scanner.py src/

# 生成 HTML 報告
python security_scanner.py src/ -f html -o security_report.html

# 生成 SARIF 報告（用於 GitHub Security）
python security_scanner.py src/ -f sarif -o results.sarif

# 自訂掃描
python security_scanner.py src/ --pattern "*.py" --exclude venv,tests
```

#### 4. **env_manager.py** - 環境變量管理工具
管理和驗證環境變量配置。

**功能特色：**
- 📝 加載和解析 .env 文件
- ✏️ 設置、獲取和刪除環境變量
- 📋 列出所有變量（可選值遮罩）
- ✅ 驗證必需變量
- 📄 生成 .env.example 範本
- 🔒 安全檢查（文件權限、弱密碼、.gitignore）
- 🔄 比較兩個 .env 文件
- 📤 導出為 shell 腳本
- 🎯 自動檢測敏感變量

**使用範例：**
```bash
# 列出所有變量
python env_manager.py list

# 列出變量及其值
python env_manager.py list --show-values

# 設置變量
python env_manager.py set DB_HOST localhost

# 獲取變量
python env_manager.py get DB_HOST

# 刪除變量
python env_manager.py delete OLD_VAR

# 驗證必需變量
python env_manager.py validate --required DB_HOST,DB_PORT

# 生成範本文件
python env_manager.py template

# 安全檢查
python env_manager.py security

# 比較環境文件
python env_manager.py compare .env.production

# 導出為 shell 腳本
python env_manager.py export -o env.sh
```

---

### 原有工具

#### 5. **code_generator.py** - 程式碼生成器
AI 輔助的程式碼生成和範本工具。

**功能特色：**
- 專案腳手架生成
- CRUD 程式碼生成
- API 端點生成
- 測試檔案生成
- 配置檔案生成
- 自訂範本支援

**使用範例：**
```bash
# 生成 Python 專案結構
python code_generator.py --project python-api --name myapi

# 生成 CRUD 程式碼
python code_generator.py --crud User --fields "name:str,age:int,email:str"

# 生成測試檔案
python code_generator.py --test user_service.py

# 使用自訂範本
python code_generator.py --template ./templates/my_template.jinja2

# 生成 API 端點
python code_generator.py --api users --methods GET,POST,PUT,DELETE
```

### 2. **code_formatter.py** - 程式碼格式化工具
多語言程式碼格式化和美化工具。

**功能特色：**
- 支援多種語言（Python、JavaScript、Java、Go）
- 自動修復常見問題
- 程式碼風格檢查
- 批次處理
- 自訂規則
- 差異預覽

**使用範例：**
```bash
# 格式化 Python 檔案
python code_formatter.py file.py --language python

# 批次格式化
python code_formatter.py src/*.py --fix

# 檢查不修改
python code_formatter.py src/ --check

# 使用自訂配置
python code_formatter.py src/ --config .formatter.yaml

# 顯示差異
python code_formatter.py file.js --diff
```

### 3. **test_runner.py** - 測試執行器
智能測試執行和報告工具。

**功能特色：**
- 自動發現測試
- 平行執行
- 覆蓋率報告
- 失敗測試重試
- HTML 報告
- CI/CD 整合

**使用範例：**
```bash
# 執行所有測試
python test_runner.py

# 執行特定測試
python test_runner.py tests/test_user.py

# 產生覆蓋率報告
python test_runner.py --coverage --html

# 平行執行
python test_runner.py --parallel 4

# 失敗重試
python test_runner.py --retry 3

# 只執行失敗的測試
python test_runner.py --failed-only
```

### 4. **dependency_checker.py** - 依賴檢查工具
檢查和管理專案依賴的工具。

**功能特色：**
- 檢查過時依賴
- 安全漏洞掃描
- 依賴樹視覺化
- 自動更新建議
- License 檢查
- 衝突偵測

**使用範例：**
```bash
# 檢查依賴
python dependency_checker.py

# 檢查安全漏洞
python dependency_checker.py --security

# 顯示依賴樹
python dependency_checker.py --tree

# 檢查過時依賴
python dependency_checker.py --outdated

# 生成更新建議
python dependency_checker.py --suggest-updates

# License 檢查
python dependency_checker.py --licenses
```

### 5. **deploy_helper.py** - 部署輔助工具
簡化部署流程的工具。

**功能特色：**
- 環境配置管理
- 自動化部署腳本
- Docker 容器化
- 健康檢查
- 回滾支援
- 多環境管理

**使用範例：**
```bash
# 部署到測試環境
python deploy_helper.py --env staging

# 部署到生產環境
python deploy_helper.py --env production --tag v1.0.0

# 建立 Docker 映像
python deploy_helper.py --docker-build

# 健康檢查
python deploy_helper.py --health-check

# 回滾到上一版本
python deploy_helper.py --rollback

# 生成部署報告
python deploy_helper.py --report
```

### 6. **doc_generator.py** - 文檔生成器
自動生成專案文檔的工具。

**功能特色：**
- API 文檔生成
- README 生成
- 程式碼註解提取
- Markdown 格式化
- 多語言支援
- 範例程式碼整合

**使用範例：**
```bash
# 生成 API 文檔
python doc_generator.py --api src/

# 生成 README
python doc_generator.py --readme --project-info project.yaml

# 從註解生成文檔
python doc_generator.py --from-comments src/

# 生成 Markdown
python doc_generator.py --markdown docs/

# 整合範例
python doc_generator.py --with-examples examples/
```

## 🛠️ 技術棧

### 核心語言
- **Python 3.8+** - 主要開發語言

### 開發工具函式庫
- **Jinja2** - 範本引擎
- **black** / **autopep8** - Python 格式化
- **eslint** - JavaScript 格式化
- **pytest** - 測試框架
- **coverage** - 覆蓋率工具
- **pip-audit** - 安全掃描

### 程式碼分析
- **ast** - Python AST 分析
- **pylint** - 程式碼檢查
- **mypy** - 型別檢查
- **radon** - 複雜度分析

### 部署工具
- **docker-py** - Docker API
- **fabric** - 遠端部署
- **ansible** - 自動化配置
- **kubernetes** - 容器編排

### 文檔工具
- **Sphinx** - 文檔生成
- **mkdocs** - Markdown 文檔
- **pdoc** - API 文檔
- **pydoc-markdown** - Python 文檔

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
# 進入 dev-tools 目錄
cd tools-utilities/dev-tools

# 查看工具說明
python code_generator.py --help
python test_runner.py --help

# 執行工具
python code_generator.py --project python-api --name myapi
```

## 📁 專案結構

```
dev-tools/
├── README.md                    # 本文件
├── requirements.txt             # Python 依賴
├── code_generator.py           # 程式碼生成器
├── code_formatter.py           # 程式碼格式化
├── test_runner.py              # 測試執行器
├── dependency_checker.py       # 依賴檢查
├── deploy_helper.py            # 部署輔助
├── doc_generator.py            # 文檔生成器
├── templates/                  # 程式碼範本
│   ├── python/
│   │   ├── api_project/
│   │   ├── cli_project/
│   │   └── library_project/
│   ├── javascript/
│   │   ├── react_app/
│   │   └── node_api/
│   └── custom/
├── configs/                    # 配置檔案
│   ├── formatter_rules.yaml
│   ├── deploy_configs.yaml
│   └── test_settings.yaml
├── tests/                      # 測試檔案
│   ├── test_code_generator.py
│   ├── test_formatter.py
│   └── test_runner_test.py
└── examples/                   # 範例
    ├── generated_code/
    ├── deployment_scripts/
    └── documentation/
```

## 🤖 AI 開發工作流程

### 使用 AI 工具開發開發者工具

1. **需求分析**
   ```
   提示詞範例:
   "開發一個 Python 程式碼生成器。
   功能：生成專案腳手架、CRUD 程式碼、測試檔案。
   使用 Jinja2 範本引擎。
   支援自訂範本和配置。"
   ```

2. **範本設計**
   - 使用 Claude Code 設計範本
   - AI 協助優化範本結構
   - 自動生成常用模式

3. **工具實作**
   - AI 協助實作核心功能
   - 自動處理邊界情況
   - 優化使用者體驗

4. **測試與優化**
   - AI 生成測試案例
   - 效能優化建議
   - 程式碼重構

## 💡 最佳實踐

### 1. 程式碼生成
- ✅ 使用可維護的範本
- ✅ 提供自訂選項
- ✅ 生成完整的文檔
- ✅ 包含測試檔案
- ✅ 遵循最佳實踐

### 2. 程式碼品質
- ✅ 自動化格式化
- ✅ 靜態分析
- ✅ 型別檢查
- ✅ 複雜度監控
- ✅ 程式碼審查

### 3. 測試策略
- ✅ 高測試覆蓋率
- ✅ 單元測試優先
- ✅ 整合測試
- ✅ 端對端測試
- ✅ 效能測試

### 4. 部署流程
- ✅ 自動化部署
- ✅ 環境隔離
- ✅ 健康檢查
- ✅ 監控告警
- ✅ 快速回滾

## 📚 常見使用場景

### 快速啟動新專案
```bash
# 1. 生成專案結構
python code_generator.py --project python-api --name myapp

# 2. 生成初始程式碼
python code_generator.py --crud User --fields "name,email"

# 3. 格式化程式碼
python code_formatter.py myapp/ --fix

# 4. 執行測試
python test_runner.py --coverage
```

### 持續整合流程
```bash
# 1. 檢查依賴
python dependency_checker.py --security

# 2. 格式化檢查
python code_formatter.py src/ --check

# 3. 執行測試
python test_runner.py --coverage --xml

# 4. 生成文檔
python doc_generator.py --api src/
```

### 部署流程
```bash
# 1. 檢查依賴
python dependency_checker.py --outdated

# 2. 執行測試
python test_runner.py --parallel

# 3. 建立 Docker 映像
python deploy_helper.py --docker-build

# 4. 部署到測試環境
python deploy_helper.py --env staging

# 5. 健康檢查
python deploy_helper.py --health-check

# 6. 部署到生產環境
python deploy_helper.py --env production
```

## 🧪 測試

```bash
# 執行所有測試
pytest tests/

# 執行特定測試
pytest tests/test_code_generator.py

# 測試覆蓋率
pytest --cov=. tests/

# 使用測試執行器
python test_runner.py --coverage --html
```

## 📊 工具狀態

| 工具 | 狀態 | 功能完整度 | 測試 | AI 增強 |
|------|------|------------|------|---------|
| 🆕 ai_code_reviewer.py | ✅ 完成 | 95% | ✅ | ⭐⭐⭐ |
| 🆕 performance_profiler.py | ✅ 完成 | 93% | ✅ | ⭐⭐⭐ |
| 🆕 security_scanner.py | ✅ 完成 | 92% | ✅ | ⭐⭐⭐ |
| 🆕 env_manager.py | ✅ 完成 | 90% | ✅ | ⭐⭐ |
| code_generator.py | ✅ 完成 | 90% | ✅ | ⭐⭐ |
| code_formatter.py | ✅ 完成 | 85% | ✅ | ⭐ |
| test_runner.py | ✅ 完成 | 88% | ✅ | ⭐ |
| dependency_checker.py | ✅ 完成 | 85% | ✅ | ⭐ |
| deploy_helper.py | ✅ 完成 | 80% | ✅ | ⭐ |
| doc_generator.py | ✅ 完成 | 82% | ✅ | ⭐ |

## 🔜 未來計劃

### 即將推出的功能

- **Git Hooks Manager** - Git Hooks 管理工具 🚧
- **Log Analyzer** - 日誌分析工具 🚧
- **Database Migration** - 資料庫遷移工具
- **API Mock Server** - API 模擬伺服器
- **CI/CD Pipeline Generator** - CI/CD 流程生成器

### 改進計劃

- [x] ✅ AI 程式碼審查工具
- [x] ✅ 性能分析工具
- [x] ✅ 安全掃描工具
- [x] ✅ 環境變量管理工具
- [ ] 支援更多程式語言範本
- [ ] 增強 AI 程式碼生成能力
- [ ] 整合更多 CI/CD 平台
- [ ] 視覺化部署流程
- [ ] 雲端部署支援（AWS、GCP、Azure）
- [ ] 整合 OpenAI API 進行更智能的代碼分析

## 🎉 最新更新（2025-11-18）

### 新增的 AI 輔助工具

1. **AI 代碼審查工具** - 全面的代碼質量分析和安全檢測
   - 自動檢測代碼質量問題
   - 識別安全漏洞和性能問題
   - 提供可維護性指數評分
   - 支持多種報告格式

2. **性能分析工具** - 深入的性能分析和優化建議
   - CPU 和內存性能追蹤
   - 函數級別的詳細分析
   - 基準測試功能
   - 自動優化建議

3. **安全掃描工具** - 全面的安全漏洞檢測
   - 檢測常見安全漏洞（SQL 注入、XSS、命令注入等）
   - 硬編碼密鑰檢測
   - 文件權限檢查
   - 支持 SARIF 格式（GitHub Security 整合）

4. **環境變量管理工具** - 簡化環境配置管理
   - .env 文件管理
   - 安全檢查和驗證
   - 範本生成
   - 環境比較功能

## 🤝 貢獻

歡迎貢獻新的開發工具或改進現有工具！

### 貢獻指南

1. Fork 專案
2. 創建特性分支
3. 實作工具（使用 AI 輔助）
4. 撰寫測試
5. 更新文檔
6. 提交 Pull Request

### 工具要求

- 必須解決實際開發問題
- 提供完整的文檔
- 包含使用範例
- 通過所有測試
- 遵循程式碼規範

## ⚠️ 注意事項

1. **備份程式碼** - 使用生成工具前先備份
2. **測試驗證** - 生成的程式碼需要測試驗證
3. **安全檢查** - 部署前進行安全掃描
4. **版本控制** - 使用 Git 管理程式碼
5. **文檔更新** - 保持文檔與程式碼同步

## 📄 授權

MIT License - 詳見 LICENSE 檔案

## 📞 支援

- 問題回報: GitHub Issues
- 功能建議: GitHub Discussions
- 文檔: 查看 docs/ 目錄

---

**使用 AI 打造更智能的開發工具** 🛠️

> 💡 所有工具都使用 AI 輔助開發，展示了 AI 在開發工具建立中的強大能力。
