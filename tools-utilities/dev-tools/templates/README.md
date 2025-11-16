# Templates - 程式碼範本

這個目錄包含各種程式碼生成範本。

## 目錄結構

```
templates/
├── python/
│   ├── api_project/       # Python API 專案範本
│   │   └── main.py.template
│   └── cli_project/       # Python CLI 專案範本
│       └── cli.py.template
├── javascript/
│   └── react_app/         # React 應用範本
└── custom/                # 自訂範本
```

## 使用方式

範本檔案使用 Jinja2 語法，可以透過 code_generator.py 使用這些範本。

### 範例

```python
from jinja2 import Template

with open('templates/python/api_project/main.py.template') as f:
    template = Template(f.read())

code = template.render(
    project_name="MyAPI",
    description="我的 API 服務",
    version="1.0.0"
)

print(code)
```

## 變數

範本中可用的變數：
- `{{ project_name }}` - 專案名稱
- `{{ description }}` - 專案描述
- `{{ version }}` - 版本號
- `{{ author }}` - 作者名稱

## 新增自訂範本

1. 在適當的目錄下建立 `.template` 檔案
2. 使用 Jinja2 語法定義變數
3. 在 code_generator.py 中註冊範本
