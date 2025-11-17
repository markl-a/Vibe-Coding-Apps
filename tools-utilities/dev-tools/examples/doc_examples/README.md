# Doc Generator 範例

這個目錄包含文檔生成的範例，展示 `doc_generator.py` 的功能。

## 檔案說明

- `sample_module.py` - 包含詳細 docstring 的範例模組
- `api_example.py` - API 端點文檔範例
- `generated_api_docs.md` - 生成的 API 文檔範例
- `generated_module_docs.md` - 生成的模組文檔範例

## 使用範例

### 1. 生成模組文檔

```bash
cd /home/user/Vibe-Coding-Apps/tools-utilities/dev-tools

# 從單個模組生成文檔
python doc_generator.py \
    --input examples/doc_examples/sample_module.py \
    --output docs/module.md

# 從整個目錄生成文檔
python doc_generator.py \
    --input src/ \
    --output docs/ \
    --recursive
```

### 2. 生成 API 文檔

```bash
# 生成 API 文檔
python doc_generator.py \
    --api examples/doc_examples/api_example.py \
    --output docs/api.md

# 生成 OpenAPI/Swagger 文檔
python doc_generator.py \
    --api src/api/ \
    --openapi docs/openapi.json

# 生成互動式 API 文檔
python doc_generator.py \
    --api src/api/ \
    --format swagger \
    --output docs/api.html
```

### 3. 生成專案 README

```bash
# 生成基本 README
python doc_generator.py \
    --readme \
    --project-name "My Project" \
    --output README.md

# 包含詳細資訊
python doc_generator.py \
    --readme \
    --project-name "My Project" \
    --description "專案描述" \
    --author "Your Name" \
    --license MIT \
    --output README.md
```

### 4. 從註解提取文檔

```bash
# 從程式碼註解提取文檔
python doc_generator.py \
    --from-comments src/ \
    --output docs/

# 指定註解風格
python doc_generator.py \
    --from-comments src/ \
    --style google \
    --output docs/
```

### 5. 生成不同格式的文檔

```bash
# Markdown 格式
python doc_generator.py \
    --input src/ \
    --format markdown \
    --output docs/

# HTML 格式
python doc_generator.py \
    --input src/ \
    --format html \
    --output docs/

# reStructuredText 格式（Sphinx）
python doc_generator.py \
    --input src/ \
    --format rst \
    --output docs/

# PDF 格式
python doc_generator.py \
    --input src/ \
    --format pdf \
    --output docs/manual.pdf
```

### 6. 生成變更日誌

```bash
# 從 Git 提交生成變更日誌
python doc_generator.py \
    --changelog \
    --output CHANGELOG.md

# 指定版本範圍
python doc_generator.py \
    --changelog \
    --from-tag v1.0.0 \
    --to-tag v2.0.0 \
    --output CHANGELOG.md
```

## Docstring 風格

### Google 風格（推薦）

```python
def function_name(param1: str, param2: int) -> bool:
    """簡短描述

    詳細描述（可選）

    Args:
        param1: 第一個參數的描述
        param2: 第二個參數的描述

    Returns:
        返回值的描述

    Raises:
        ValueError: 在什麼情況下拋出異常

    Example:
        >>> function_name("test", 42)
        True
    """
    pass
```

### NumPy 風格

```python
def function_name(param1, param2):
    """
    簡短描述

    詳細描述（可選）

    Parameters
    ----------
    param1 : str
        第一個參數的描述
    param2 : int
        第二個參數的描述

    Returns
    -------
    bool
        返回值的描述

    Examples
    --------
    >>> function_name("test", 42)
    True
    """
    pass
```

### Sphinx 風格

```python
def function_name(param1, param2):
    """
    簡短描述

    :param param1: 第一個參數的描述
    :type param1: str
    :param param2: 第二個參數的描述
    :type param2: int
    :return: 返回值的描述
    :rtype: bool
    :raises ValueError: 在什麼情況下拋出異常

    Example::

        >>> function_name("test", 42)
        True
    """
    pass
```

## API 文檔範例

### REST API 端點

```python
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    """取得使用者資訊

    取得指定 ID 的使用者詳細資訊。

    Args:
        user_id: 使用者 ID

    Returns:
        User: 使用者物件

    Raises:
        HTTPException: 404 - 使用者不存在

    Example Response:
        ```json
        {
            "id": 1,
            "username": "john",
            "email": "john@example.com"
        }
        ```
    """
    pass
```

### GraphQL API

```python
class Query(graphene.ObjectType):
    """GraphQL 查詢

    提供所有可用的 GraphQL 查詢操作。
    """

    user = graphene.Field(UserType, id=graphene.Int())

    def resolve_user(self, info, id):
        """解析使用者查詢

        Args:
            info: GraphQL 查詢資訊
            id: 使用者 ID

        Returns:
            User: 使用者物件
        """
        pass
```

## 文檔結構範例

### 專案文檔結構

```
docs/
├── index.md              # 首頁
├── getting-started.md    # 入門指南
├── api/
│   ├── users.md         # 使用者 API
│   ├── posts.md         # 文章 API
│   └── auth.md          # 認證 API
├── guides/
│   ├── installation.md  # 安裝指南
│   ├── configuration.md # 配置指南
│   └── deployment.md    # 部署指南
├── reference/
│   ├── models.md        # 資料模型
│   ├── utils.md         # 工具函數
│   └── constants.md     # 常數定義
└── changelog.md         # 變更日誌
```

### 自動生成文檔

```bash
# 生成完整的專案文檔
python doc_generator.py \
    --project src/ \
    --output docs/ \
    --include-api \
    --include-examples \
    --include-changelog
```

## Sphinx 整合

### 設定 Sphinx

```bash
# 安裝 Sphinx
pip install sphinx sphinx-rtd-theme

# 初始化 Sphinx
cd docs
sphinx-quickstart

# 使用 doc_generator.py 生成 RST 檔案
python doc_generator.py \
    --input src/ \
    --format rst \
    --output docs/source/

# 建構文檔
cd docs
make html
```

### conf.py 配置

```python
# Sphinx 配置範例
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'sphinx.ext.viewcode',
]

napoleon_google_docstring = True
napoleon_numpy_docstring = False
```

## MkDocs 整合

### 設定 MkDocs

```bash
# 安裝 MkDocs
pip install mkdocs mkdocs-material

# 初始化 MkDocs
mkdocs new my-project
cd my-project

# 使用 doc_generator.py 生成 Markdown 檔案
python doc_generator.py \
    --input src/ \
    --format markdown \
    --output docs/

# 本地預覽
mkdocs serve

# 建構文檔
mkdocs build
```

### mkdocs.yml 配置

```yaml
site_name: My Project
theme:
  name: material
  palette:
    primary: indigo
    accent: indigo

nav:
  - 首頁: index.md
  - 入門:
    - 安裝: getting-started/installation.md
    - 快速開始: getting-started/quickstart.md
  - API 參考:
    - 使用者: api/users.md
    - 認證: api/auth.md
  - 指南:
    - 配置: guides/configuration.md
    - 部署: guides/deployment.md
```

## 自動化文檔生成

### Git Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# 在提交前生成文檔
python doc_generator.py --input src/ --output docs/

# 將生成的文檔加入提交
git add docs/
```

### CI/CD Pipeline

```yaml
# .github/workflows/docs.yml
name: Generate Documentation

on:
  push:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Generate docs
        run: |
          python doc_generator.py --input src/ --output docs/

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

## 最佳實踐

### 1. Docstring 規範

- 所有公開的類別和函數都應該有 docstring
- 使用一致的風格（Google、NumPy 或 Sphinx）
- 包含參數、返回值和異常的描述
- 提供使用範例

### 2. 文檔組織

- 按功能模組組織文檔
- 提供清晰的導航結構
- 包含搜尋功能
- 保持文檔與程式碼同步

### 3. 範例程式碼

- 提供完整、可執行的範例
- 涵蓋常見使用情境
- 包含錯誤處理範例
- 使用真實的業務場景

### 4. 版本管理

- 記錄每個版本的變更
- 標記過時的 API
- 提供遷移指南
- 保留舊版本文檔

## 常用命令組合

### 完整文檔生成

```bash
# 生成所有文檔
python doc_generator.py \
    --input src/ \
    --output docs/ \
    --format markdown \
    --include-api \
    --include-examples \
    --include-tests \
    --recursive
```

### API 文檔 + Swagger

```bash
# 生成 API 文檔和 Swagger UI
python doc_generator.py \
    --api src/api/ \
    --openapi docs/openapi.json \
    --swagger docs/swagger.html
```

### 多語言文檔

```bash
# 生成中文文檔
python doc_generator.py \
    --input src/ \
    --output docs/zh-TW/ \
    --language zh-TW

# 生成英文文檔
python doc_generator.py \
    --input src/ \
    --output docs/en/ \
    --language en
```

## 故障排除

### 文檔未生成

```bash
# 檢查輸入路徑
python doc_generator.py --input src/ --validate

# 顯示詳細輸出
python doc_generator.py --input src/ --output docs/ --verbose
```

### 格式錯誤

```bash
# 驗證 docstring 格式
python doc_generator.py --lint src/

# 修復常見格式問題
python doc_generator.py --lint src/ --fix
```
