# Dev Tools 使用範例

這個目錄包含所有開發工具的完整使用範例，幫助您快速上手並掌握各種工具的功能。

## 📂 目錄結構

```
examples/
├── README.md                      # 本文件
│
├── formatter_examples/            # 程式碼格式化範例
│   ├── README.md                 # 詳細使用說明
│   ├── unformatted_code.py       # 格式化前的程式碼
│   ├── formatted_code.py         # 格式化後的程式碼
│   └── custom_formatter_config.yaml  # 自訂格式化配置
│
├── test_examples/                 # 測試執行範例
│   ├── README.md                 # 詳細使用說明
│   ├── example_test_suite.py     # 完整測試套件
│   ├── conftest.py               # Pytest 配置和 fixtures
│   └── pytest.ini                # Pytest 設定檔
│
├── dependency_examples/           # 依賴檢查範例
│   ├── README.md                 # 詳細使用說明
│   ├── requirements.txt          # 標準依賴檔案
│   ├── requirements-dev.txt      # 開發環境依賴
│   ├── requirements-outdated.txt # 過時依賴範例
│   └── setup.py                  # Python 專案設定
│
├── deploy_examples/               # 部署範例
│   ├── README.md                 # 詳細使用說明
│   ├── deploy_config.yaml        # 完整部署配置
│   ├── Dockerfile                # Docker 映像建構
│   ├── docker-compose.yml        # Docker Compose 配置
│   └── k8s-deployment.yaml       # Kubernetes 部署配置
│
├── doc_examples/                  # 文檔生成範例
│   ├── README.md                 # 詳細使用說明
│   └── sample_module.py          # 含詳細 docstring 的範例模組
│
├── generated_code/                # 程式碼生成範例
│   └── example_api.py            # 生成的 API 程式碼
│
├── deployment_scripts/            # 部署腳本範例
│   └── deploy.sh                 # 自動化部署腳本
│
└── documentation/                 # 文檔範例
    └── example_README.md         # README 範例
```

## 🚀 快速開始

### 前置需求

```bash
# 進入 dev-tools 目錄
cd /home/user/Vibe-Coding-Apps/tools-utilities/dev-tools

# 安裝依賴
pip install -r requirements.txt
```

### 基本使用

每個工具的基本使用範例：

```bash
# 1. 程式碼格式化
python code_formatter.py examples/formatter_examples/unformatted_code.py --diff

# 2. 執行測試
python test_runner.py examples/test_examples/

# 3. 檢查依賴
python dependency_checker.py --file examples/dependency_examples/requirements.txt

# 4. 部署輔助
python deploy_helper.py --config examples/deploy_examples/deploy_config.yaml --validate

# 5. 生成文檔
python doc_generator.py --input examples/doc_examples/sample_module.py --output /tmp/docs.md

# 6. 生成程式碼
python code_generator.py --project python-api --name myapi -o /tmp/myapi
```

## 📚 工具詳細說明

### 1. Code Formatter - 程式碼格式化工具

**功能：**
- 自動格式化 Python、JavaScript、TypeScript 等程式碼
- 支援多種格式化工具（Black、Prettier、autopep8）
- 可自訂格式化規則
- 批次處理整個專案

**範例目錄：** `formatter_examples/`

**常用命令：**

```bash
# 檢查格式問題
python code_formatter.py examples/formatter_examples/ --check

# 顯示差異
python code_formatter.py examples/formatter_examples/unformatted_code.py --diff

# 自動修復
python code_formatter.py examples/formatter_examples/unformatted_code.py --fix

# 使用自訂配置
python code_formatter.py . --config examples/formatter_examples/custom_formatter_config.yaml
```

**詳細文檔：** [formatter_examples/README.md](formatter_examples/README.md)

---

### 2. Test Runner - 測試執行工具

**功能：**
- 執行 pytest 和 unittest 測試
- 生成覆蓋率報告
- 支援平行執行
- 失敗重試機制
- 多種報告格式（HTML、XML、JSON）

**範例目錄：** `test_examples/`

**常用命令：**

```bash
# 執行所有測試
python test_runner.py examples/test_examples/

# 產生覆蓋率報告
python test_runner.py examples/test_examples/ --coverage --html-report /tmp/coverage

# 平行執行
python test_runner.py examples/test_examples/ --parallel 4

# 只執行特定標記
python test_runner.py examples/test_examples/ -m "not slow"

# 失敗重試
python test_runner.py examples/test_examples/ --retry 3
```

**詳細文檔：** [test_examples/README.md](test_examples/README.md)

---

### 3. Dependency Checker - 依賴檢查工具

**功能：**
- 檢查套件版本
- 掃描安全漏洞
- 識別過時的依賴
- 檢查相容性問題
- 授權合規檢查

**範例目錄：** `dependency_examples/`

**常用命令：**

```bash
# 基本檢查
python dependency_checker.py --file examples/dependency_examples/requirements.txt

# 檢查過時依賴
python dependency_checker.py --file examples/dependency_examples/requirements.txt --outdated

# 安全掃描
python dependency_checker.py --file examples/dependency_examples/requirements.txt --security

# 完整檢查
python dependency_checker.py --file examples/dependency_examples/requirements.txt --all

# 產生報告
python dependency_checker.py --file examples/dependency_examples/requirements.txt --all --report /tmp/dep_report.json
```

**詳細文檔：** [dependency_examples/README.md](dependency_examples/README.md)

---

### 4. Deploy Helper - 部署輔助工具

**功能：**
- Docker 映像建構和部署
- Kubernetes 部署管理
- 多環境配置（開發、測試、生產）
- 健康檢查和煙霧測試
- 自動回滾機制

**範例目錄：** `deploy_examples/`

**常用命令：**

```bash
# 驗證部署配置
python deploy_helper.py --config examples/deploy_examples/deploy_config.yaml --validate

# 建構 Docker 映像
python deploy_helper.py --docker-build --dockerfile examples/deploy_examples/Dockerfile

# Docker Compose 部署
python deploy_helper.py --compose-up --compose-file examples/deploy_examples/docker-compose.yml

# Kubernetes 部署
python deploy_helper.py --k8s-deploy --manifest examples/deploy_examples/k8s-deployment.yaml

# 健康檢查
python deploy_helper.py --health-check --env staging
```

**詳細文檔：** [deploy_examples/README.md](deploy_examples/README.md)

---

### 5. Doc Generator - 文檔生成工具

**功能：**
- 從程式碼註解生成文檔
- 支援多種 docstring 風格（Google、NumPy、Sphinx）
- API 文檔自動生成
- 支援多種輸出格式（Markdown、HTML、PDF）
- 整合 Sphinx 和 MkDocs

**範例目錄：** `doc_examples/`

**常用命令：**

```bash
# 生成模組文檔
python doc_generator.py --input examples/doc_examples/sample_module.py --output /tmp/docs.md

# 生成 API 文檔
python doc_generator.py --api examples/doc_examples/ --output /tmp/api_docs.md

# 生成專案 README
python doc_generator.py --readme --project-name "My Project" --output /tmp/README.md

# 從註解提取文檔
python doc_generator.py --from-comments examples/doc_examples/ --output /tmp/docs/
```

**詳細文檔：** [doc_examples/README.md](doc_examples/README.md)

---

### 6. Code Generator - 程式碼生成工具

**功能：**
- 快速建立專案骨架
- 生成 CRUD 程式碼
- API 端點生成
- 測試檔案生成
- 支援多種專案類型

**範例目錄：** `generated_code/`

**常用命令：**

```bash
# 生成 Python API 專案
python code_generator.py --project python-api --name myapi -o /tmp/myapi

# 生成 CRUD 程式碼
python code_generator.py --crud User --fields "name:str,email:str,age:int" -o /tmp/

# 生成測試檔案
python code_generator.py --test examples/generated_code/example_api.py -o /tmp/

# 查看範例生成的程式碼
cat examples/generated_code/example_api.py
```

**參考範例：** [generated_code/example_api.py](generated_code/example_api.py)

---

## 🔄 完整工作流程範例

### 開發流程

```bash
#!/bin/bash
# 完整的開發工作流程

# 1. 生成專案結構
python code_generator.py --project python-api --name myapp -o myapp/

# 2. 進入專案
cd myapp/

# 3. 生成業務邏輯程式碼
python ../code_generator.py --crud User --fields "name:str,email:str,age:int"

# 4. 格式化程式碼
python ../code_formatter.py . --fix

# 5. 執行測試
python ../test_runner.py --coverage

# 6. 檢查依賴
python ../dependency_checker.py --security

# 7. 生成文檔
python ../doc_generator.py --input . --output docs/

# 8. 準備部署
python ../deploy_helper.py --docker-build

echo "開發流程完成！"
```

### CI/CD 流程

```bash
#!/bin/bash
# CI/CD 管道範例

set -e

echo "=== 開始 CI/CD 流程 ==="

# 1. 程式碼品質檢查
echo "1. 檢查程式碼格式..."
python code_formatter.py . --check || exit 1

# 2. 執行測試套件
echo "2. 執行測試..."
python test_runner.py --coverage --junit-xml junit.xml || exit 1

# 3. 安全掃描
echo "3. 執行安全掃描..."
python dependency_checker.py --security || exit 1

# 4. 建構 Docker 映像
echo "4. 建構 Docker 映像..."
python deploy_helper.py --docker-build --tag ${CI_COMMIT_TAG:-latest}

# 5. 部署到測試環境
if [ "$CI_COMMIT_BRANCH" == "develop" ]; then
    echo "5. 部署到測試環境..."
    python deploy_helper.py --env staging
    python deploy_helper.py --health-check --env staging
fi

# 6. 部署到生產環境（需手動觸發）
if [ "$CI_COMMIT_TAG" != "" ]; then
    echo "6. 準備部署到生產環境..."
    python deploy_helper.py --env production --tag $CI_COMMIT_TAG
    python deploy_helper.py --health-check --env production
fi

echo "=== CI/CD 流程完成 ==="
```

## 📖 學習路徑

### 初學者

1. **從格式化開始**
   ```bash
   # 學習如何格式化程式碼
   cd examples/formatter_examples/
   cat README.md
   ```

2. **了解測試**
   ```bash
   # 學習如何編寫和執行測試
   cd examples/test_examples/
   cat README.md
   ```

3. **嘗試程式碼生成**
   ```bash
   # 快速建立專案
   python code_generator.py --project python-api --name demo -o /tmp/demo
   ```

### 中級使用者

1. **依賴管理**
   ```bash
   # 學習依賴檢查和安全掃描
   cd examples/dependency_examples/
   cat README.md
   ```

2. **文檔生成**
   ```bash
   # 學習自動生成文檔
   cd examples/doc_examples/
   cat README.md
   ```

3. **部署準備**
   ```bash
   # 學習 Docker 和基本部署
   cd examples/deploy_examples/
   cat README.md
   ```

### 進階使用者

1. **完整 CI/CD 流程**
   - 整合所有工具到 CI/CD 管道
   - 自動化測試和部署
   - 監控和回滾機制

2. **自訂工作流程**
   - 建立自訂配置檔
   - 編寫部署腳本
   - 整合第三方服務

3. **Kubernetes 部署**
   - 學習 K8s 配置
   - 實施自動擴展
   - 配置監控和日誌

## 🎯 使用場景

### 場景 1：新專案快速開始

```bash
# 1. 生成專案
python code_generator.py --project python-api --name myproject

# 2. 設定格式化規則
cp examples/formatter_examples/custom_formatter_config.yaml myproject/.formatter.yaml

# 3. 複製測試配置
cp examples/test_examples/pytest.ini myproject/
cp examples/test_examples/conftest.py myproject/

# 4. 設定部署配置
cp examples/deploy_examples/deploy_config.yaml myproject/
cp examples/deploy_examples/Dockerfile myproject/
```

### 場景 2：現有專案整合

```bash
# 1. 格式化現有程式碼
python code_formatter.py /path/to/project --fix

# 2. 檢查依賴問題
python dependency_checker.py --file /path/to/project/requirements.txt --all

# 3. 生成測試
python code_generator.py --test /path/to/project/src/ -o /path/to/project/tests/

# 4. 生成文檔
python doc_generator.py --input /path/to/project/src/ --output /path/to/project/docs/
```

### 場景 3：持續整合設置

```bash
# 在 CI 環境中使用
export CI=true

# 執行完整檢查
python code_formatter.py . --check
python test_runner.py --coverage --junit-xml junit.xml
python dependency_checker.py --security --report security.json

# 建構和部署
python deploy_helper.py --docker-build --tag $BUILD_TAG
python deploy_helper.py --env staging
```

## 💡 提示和技巧

### 提高效率

1. **使用配置檔**
   - 將常用選項放入配置檔
   - 團隊共用配置檔
   - 版本控制配置檔

2. **建立別名**
   ```bash
   alias fmt='python code_formatter.py . --fix'
   alias test='python test_runner.py --coverage'
   alias deps='python dependency_checker.py --all'
   ```

3. **整合 Git Hooks**
   ```bash
   # .git/hooks/pre-commit
   python code_formatter.py --staged --fix
   python test_runner.py --failed-only
   ```

### 避免常見錯誤

1. **備份重要檔案**
   ```bash
   # 格式化前先備份
   cp important_file.py important_file.py.bak
   python code_formatter.py important_file.py --fix
   ```

2. **先測試再部署**
   ```bash
   # 總是先部署到測試環境
   python deploy_helper.py --env staging
   python deploy_helper.py --health-check --env staging
   # 確認無誤後再部署到生產
   ```

3. **使用虛擬環境**
   ```bash
   # 避免依賴衝突
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

## 🔗 相關資源

- [主要 README](../README.md) - 工具總覽和安裝說明
- [配置檔範例](../configs/) - 各種配置檔範本
- [測試檔案](../tests/) - 工具本身的測試

## 📞 獲取幫助

每個工具都支援 `--help` 選項：

```bash
python code_formatter.py --help
python code_generator.py --help
python test_runner.py --help
python dependency_checker.py --help
python deploy_helper.py --help
python doc_generator.py --help
```

## 🤝 貢獻

歡迎提供更多範例！如果您有實用的使用案例，請：

1. Fork 專案
2. 建立範例檔案
3. 更新對應的 README
4. 提交 Pull Request

---

**最後更新：** 2024-11-17

**版本：** 1.0.0

**維護者：** Development Tools Team
