#!/usr/bin/env python3
"""
code_generator.py - 程式碼生成器
使用 AI 輔助開發的程式碼生成和範本工具
"""

import os
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime


class CodeGenerator:
    """程式碼生成器類別"""

    def __init__(self, output_dir: str = '.'):
        self.output_dir = Path(output_dir)
        self.templates = {
            'python-api': self._template_python_api,
            'python-cli': self._template_python_cli,
            'crud': self._template_crud,
            'test': self._template_test,
            'api-endpoint': self._template_api_endpoint,
        }

    def generate_project(self, project_type: str, name: str,
                        **kwargs) -> Dict[str, str]:
        """生成專案結構"""
        if project_type not in self.templates:
            raise ValueError(f"不支援的專案類型: {project_type}")

        template_func = self.templates[project_type]
        files = template_func(name, **kwargs)

        # 建立檔案
        created_files = []
        for file_path, content in files.items():
            full_path = self.output_dir / file_path
            full_path.parent.mkdir(parents=True, exist_ok=True)

            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)

            created_files.append(str(full_path))

        return {
            'project_type': project_type,
            'name': name,
            'files': created_files
        }

    def _template_python_api(self, name: str, **kwargs) -> Dict[str, str]:
        """Python API 專案範本"""
        files = {}

        # 主程式
        files[f'{name}/main.py'] = f'''"""
{name} - API 服務
使用 AI 輔助開發
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="{name}",
    description="AI 輔助開發的 API 服務",
    version="1.0.0"
)

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """根路徑"""
    return {{"message": "Welcome to {name} API"}}


@app.get("/health")
async def health_check():
    """健康檢查"""
    return {{"status": "healthy"}}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
'''

        # requirements.txt
        files[f'{name}/requirements.txt'] = '''fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.5.0
python-dotenv>=1.0.0
pytest>=7.4.0
httpx>=0.25.0
'''

        # README.md
        files[f'{name}/README.md'] = f'''# {name}

AI 輔助開發的 API 服務

## 安裝

```bash
pip install -r requirements.txt
```

## 執行

```bash
python main.py
```

## API 文檔

啟動後訪問：http://localhost:8000/docs

## 測試

```bash
pytest
```
'''

        # .gitignore
        files[f'{name}/.gitignore'] = '''__pycache__/
*.py[cod]
*$py.class
.env
.venv
venv/
.pytest_cache/
.coverage
htmlcov/
'''

        # 測試檔案
        files[f'{name}/tests/__init__.py'] = ''
        files[f'{name}/tests/test_main.py'] = '''"""
測試主程式
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root():
    """測試根路徑"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health_check():
    """測試健康檢查"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
'''

        return files

    def _template_python_cli(self, name: str, **kwargs) -> Dict[str, str]:
        """Python CLI 專案範本"""
        files = {}

        files[f'{name}/cli.py'] = f'''#!/usr/bin/env python3
"""
{name} - 命令列工具
使用 AI 輔助開發
"""

import argparse


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="{name} - AI 輔助開發的命令列工具"
    )

    parser.add_argument('command', help='要執行的命令')
    parser.add_argument('-v', '--verbose', action='store_true',
                       help='詳細輸出')

    args = parser.parse_args()

    print(f"執行命令: {{args.command}}")

    if args.verbose:
        print("詳細模式已啟用")


if __name__ == '__main__':
    main()
'''

        files[f'{name}/README.md'] = f'''# {name}

AI 輔助開發的命令列工具

## 使用

```bash
python cli.py <command> [options]
```
'''

        return files

    def _template_crud(self, name: str, fields: str = '', **kwargs) -> Dict[str, str]:
        """CRUD 程式碼範本"""
        files = {}

        # 解析欄位
        field_list = []
        if fields:
            for field in fields.split(','):
                if ':' in field:
                    field_name, field_type = field.split(':')
                    field_list.append((field_name.strip(), field_type.strip()))
                else:
                    field_list.append((field.strip(), 'str'))

        # Pydantic 模型
        model_fields = '\n    '.join(
            f'{name}: {ftype}' for name, ftype in field_list
        )

        files[f'{name.lower()}_model.py'] = f'''"""
{name} 資料模型
"""

from pydantic import BaseModel
from typing import Optional


class {name}Base(BaseModel):
    """基礎模型"""
    {model_fields}


class {name}Create({name}Base):
    """建立模型"""
    pass


class {name}Update(BaseModel):
    """更新模型"""
    {chr(10).join(f'    {fname}: Optional[{ftype}] = None' for fname, ftype in field_list)}


class {name}({name}Base):
    """完整模型"""
    id: int

    class Config:
        from_attributes = True
'''

        # CRUD 操作
        files[f'{name.lower()}_crud.py'] = f'''"""
{name} CRUD 操作
"""

from typing import List, Optional
from {name.lower()}_model import {name}, {name}Create, {name}Update


class {name}CRUD:
    """CRUD 操作類別"""

    def __init__(self):
        self.items: List[{name}] = []
        self.next_id = 1

    def create(self, item: {name}Create) -> {name}:
        """建立項目"""
        new_item = {name}(id=self.next_id, **item.dict())
        self.items.append(new_item)
        self.next_id += 1
        return new_item

    def get(self, item_id: int) -> Optional[{name}]:
        """取得單一項目"""
        for item in self.items:
            if item.id == item_id:
                return item
        return None

    def get_all(self) -> List[{name}]:
        """取得所有項目"""
        return self.items

    def update(self, item_id: int, update_data: {name}Update) -> Optional[{name}]:
        """更新項目"""
        item = self.get(item_id)
        if item:
            update_dict = update_data.dict(exclude_unset=True)
            for key, value in update_dict.items():
                setattr(item, key, value)
            return item
        return None

    def delete(self, item_id: int) -> bool:
        """刪除項目"""
        for i, item in enumerate(self.items):
            if item.id == item_id:
                self.items.pop(i)
                return True
        return False
'''

        return files

    def _template_test(self, name: str, source_file: str = '', **kwargs) -> Dict[str, str]:
        """測試檔案範本"""
        files = {}

        module_name = Path(source_file).stem if source_file else 'module'
        test_file = f'test_{module_name}.py'

        files[test_file] = f'''"""
{module_name} 的測試
使用 AI 輔助開發
"""

import pytest


def test_example():
    """範例測試"""
    assert True


def test_another_example():
    """另一個範例測試"""
    result = 1 + 1
    assert result == 2


@pytest.fixture
def sample_data():
    """測試資料 fixture"""
    return {{"key": "value"}}


def test_with_fixture(sample_data):
    """使用 fixture 的測試"""
    assert sample_data["key"] == "value"
'''

        return files

    def _template_api_endpoint(self, name: str, methods: str = 'GET',
                               **kwargs) -> Dict[str, str]:
        """API 端點範本"""
        files = {}

        method_list = [m.strip().upper() for m in methods.split(',')]
        endpoint_name = name.lower()

        endpoints_code = []

        if 'GET' in method_list:
            endpoints_code.append(f'''
@app.get("/{endpoint_name}/{{{{item_id}}}}")
async def get_{endpoint_name}(item_id: int):
    """取得{name}"""
    # TODO: 實作取得邏輯
    return {{"id": item_id, "message": "Get {name}"}}


@app.get("/{endpoint_name}")
async def list_{endpoint_name}():
    """列出所有{name}"""
    # TODO: 實作列表邏輯
    return {{"items": []}}
''')

        if 'POST' in method_list:
            endpoints_code.append(f'''
@app.post("/{endpoint_name}")
async def create_{endpoint_name}(data: dict):
    """建立{name}"""
    # TODO: 實作建立邏輯
    return {{"message": "Created {name}", "data": data}}
''')

        if 'PUT' in method_list:
            endpoints_code.append(f'''
@app.put("/{endpoint_name}/{{{{item_id}}}}")
async def update_{endpoint_name}(item_id: int, data: dict):
    """更新{name}"""
    # TODO: 實作更新邏輯
    return {{"message": "Updated {name}", "id": item_id, "data": data}}
''')

        if 'DELETE' in method_list:
            endpoints_code.append(f'''
@app.delete("/{endpoint_name}/{{{{item_id}}}}")
async def delete_{endpoint_name}(item_id: int):
    """刪除{name}"""
    # TODO: 實作刪除邏輯
    return {{"message": "Deleted {name}", "id": item_id}}
''')

        files[f'{endpoint_name}_endpoints.py'] = f'''"""
{name} API 端點
使用 AI 輔助開發
"""

from fastapi import FastAPI, HTTPException

app = FastAPI()

{''.join(endpoints_code)}
'''

        return files


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="程式碼生成器 - AI 輔助開發",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s --project python-api --name myapi          # 生成 API 專案
  %(prog)s --project python-cli --name mytool         # 生成 CLI 專案
  %(prog)s --crud User --fields "name:str,age:int"    # 生成 CRUD 程式碼
  %(prog)s --test user_service.py                     # 生成測試檔案
  %(prog)s --api users --methods GET,POST,PUT,DELETE  # 生成 API 端點
        """
    )

    parser.add_argument('--project', choices=['python-api', 'python-cli'],
                       help='專案類型')
    parser.add_argument('--crud', metavar='MODEL',
                       help='生成 CRUD 程式碼')
    parser.add_argument('--test', metavar='FILE',
                       help='生成測試檔案')
    parser.add_argument('--api', metavar='RESOURCE',
                       help='生成 API 端點')

    parser.add_argument('--name', help='專案或模組名稱')
    parser.add_argument('--fields', help='模型欄位（逗號分隔，格式：name:type）')
    parser.add_argument('--methods', default='GET',
                       help='API 方法（逗號分隔）')
    parser.add_argument('-o', '--output', default='.',
                       help='輸出目錄（預設：當前目錄）')

    args = parser.parse_args()

    generator = CodeGenerator(output_dir=args.output)

    try:
        result = None

        if args.project:
            if not args.name:
                print("錯誤: --project 需要 --name 參數", file=sys.stderr)
                sys.exit(1)

            result = generator.generate_project(args.project, args.name)
            print(f"\n✓ 已生成 {args.project} 專案: {args.name}")

        elif args.crud:
            result = generator.generate_project('crud', args.crud,
                                               fields=args.fields or '')
            print(f"\n✓ 已生成 CRUD 程式碼: {args.crud}")

        elif args.test:
            result = generator.generate_project('test', 'test',
                                               source_file=args.test)
            print(f"\n✓ 已生成測試檔案: {args.test}")

        elif args.api:
            result = generator.generate_project('api-endpoint', args.api,
                                               methods=args.methods)
            print(f"\n✓ 已生成 API 端點: {args.api}")

        else:
            parser.print_help()
            sys.exit(1)

        if result and 'files' in result:
            print(f"\n已建立 {len(result['files'])} 個檔案:")
            for file in result['files']:
                print(f"  - {file}")

    except Exception as e:
        print(f"\n錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
