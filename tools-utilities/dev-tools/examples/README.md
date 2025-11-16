# Examples - 使用範例

這個目錄包含各種開發工具的使用範例。

## 目錄結構

```
examples/
├── generated_code/        # 程式碼生成範例
│   └── example_api.py    # 範例 API 程式碼
├── deployment_scripts/   # 部署腳本範例
│   └── deploy.sh        # 部署腳本
└── documentation/        # 文檔範例
    └── example_README.md # README 範例
```

## 使用範例

### 1. 程式碼生成範例

```bash
# 生成 Python API 專案
python code_generator.py --project python-api --name myapi -o /tmp/demo

# 生成 CRUD 程式碼
python code_generator.py --crud User --fields "name:str,email:str,age:int"

# 生成測試檔案
python code_generator.py --test user_service.py
```

生成的範例程式碼可參考: `generated_code/example_api.py`

### 2. 程式碼格式化範例

```bash
# 格式化單個檔案
python code_formatter.py examples/generated_code/example_api.py --diff

# 批次格式化
python code_formatter.py examples/generated_code/ --fix

# 只檢查不修改
python code_formatter.py examples/ --check
```

### 3. 測試執行範例

```bash
# 執行所有測試
python test_runner.py

# 平行執行測試
python test_runner.py --parallel 4

# 產生 HTML 報告
python test_runner.py --html test_report.html

# 只執行失敗的測試
python test_runner.py --failed-only
```

### 4. 依賴檢查範例

```bash
# 基本檢查
python dependency_checker.py

# 檢查過時依賴
python dependency_checker.py --outdated

# 安全漏洞掃描
python dependency_checker.py --security

# 完整檢查
python dependency_checker.py --all
```

### 5. 部署範例

```bash
# 建立 Docker 映像
python deploy_helper.py --docker-build

# 部署到測試環境
python deploy_helper.py --env staging

# 部署到生產環境
python deploy_helper.py --env production --tag v1.0.0

# 回滾
python deploy_helper.py --rollback --env production
```

範例部署腳本: `deployment_scripts/deploy.sh`

### 6. 文檔生成範例

```bash
# 生成 API 文檔
python doc_generator.py --api src/ --markdown docs/

# 生成 README
python doc_generator.py --readme --project-name "My App" -o README.md

# 從註解提取文檔
python doc_generator.py --from-comments src/
```

範例文檔: `documentation/example_README.md`

## 完整工作流程範例

以下是一個完整的開發到部署流程：

```bash
# 1. 建立專案
python code_generator.py --project python-api --name myapp

# 2. 生成 CRUD 程式碼
cd myapp
python ../code_generator.py --crud User --fields "name:str,email:str"

# 3. 格式化程式碼
python ../code_formatter.py . --fix

# 4. 執行測試
python ../test_runner.py --coverage

# 5. 檢查依賴
python ../dependency_checker.py --security

# 6. 生成文檔
python ../doc_generator.py --api . --markdown docs/

# 7. 部署
python ../deploy_helper.py --env staging
```

## 更多範例

查看每個工具的 `--help` 選項以獲取更多使用範例：

```bash
python code_generator.py --help
python code_formatter.py --help
python test_runner.py --help
python dependency_checker.py --help
python deploy_helper.py --help
python doc_generator.py --help
```
