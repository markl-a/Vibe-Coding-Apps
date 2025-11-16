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

### 1. **code_generator.py** - 程式碼生成器
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

| 工具 | 狀態 | 功能完整度 | 測試 |
|------|------|------------|------|
| code_generator.py | ✅ 完成 | 90% | ✅ |
| code_formatter.py | ✅ 完成 | 85% | ✅ |
| test_runner.py | ✅ 完成 | 88% | ✅ |
| dependency_checker.py | ✅ 完成 | 85% | ✅ |
| deploy_helper.py | ✅ 完成 | 80% | ✅ |
| doc_generator.py | ✅ 完成 | 82% | ✅ |

## 🔜 未來計劃

### 即將推出的功能

- **AI Code Review** - AI 輔助程式碼審查
- **Performance Profiler** - 效能分析工具
- **Security Scanner** - 安全掃描工具
- **Database Migration** - 資料庫遷移工具
- **API Mock Server** - API 模擬伺服器

### 改進計劃

- [ ] 支援更多程式語言範本
- [ ] 增強 AI 程式碼生成能力
- [ ] 整合更多 CI/CD 平台
- [ ] 視覺化部署流程
- [ ] 雲端部署支援（AWS、GCP、Azure）

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
