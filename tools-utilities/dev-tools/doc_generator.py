#!/usr/bin/env python3
"""
doc_generator.py - 文檔生成器
自動生成專案文檔的工具
"""

import os
import sys
import argparse
import ast
import re
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime


class DocGenerator:
    """文檔生成器類別"""

    def __init__(self, project_root: str = '.'):
        self.project_root = Path(project_root)
        self.documentation = {}

    def generate_api_docs(self, source_dir: str) -> Dict:
        """生成 API 文檔"""
        source_path = Path(source_dir)

        if not source_path.exists():
            raise FileNotFoundError(f"目錄不存在: {source_dir}")

        print(f"\n分析 Python 檔案...")

        modules = []
        for py_file in source_path.rglob('*.py'):
            if self._should_ignore(py_file):
                continue

            module_doc = self._parse_python_file(py_file)
            if module_doc:
                modules.append(module_doc)

        return {
            'modules': modules,
            'total': len(modules)
        }

    def generate_readme(self, project_info: Optional[Dict] = None) -> str:
        """生成 README.md"""
        project_name = project_info.get('name', 'My Project') if project_info else 'My Project'
        description = project_info.get('description', '專案描述') if project_info else '專案描述'

        readme = f"""# {project_name}

{description}

## 安裝

```bash
pip install -r requirements.txt
```

## 使用

```python
# 範例程式碼
from {project_name.lower().replace(' ', '_')} import main

main()
```

## 開發

### 環境設置

```bash
# 建立虛擬環境
python -m venv venv

# 啟動虛擬環境
source venv/bin/activate  # Linux/Mac
venv\\Scripts\\activate   # Windows

# 安裝依賴
pip install -r requirements.txt
```

### 測試

```bash
pytest tests/
```

### 程式碼格式化

```bash
black .
isort .
```

## 專案結構

```
{project_name}/
├── README.md
├── requirements.txt
├── setup.py
├── src/
│   └── main.py
└── tests/
    └── test_main.py
```

## 貢獻

歡迎提交 Pull Request！

## 授權

MIT License

## 聯絡

- 作者: {project_info.get('author', 'Author Name') if project_info else 'Author Name'}
- Email: {project_info.get('email', 'author@example.com') if project_info else 'author@example.com'}

---

生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        return readme

    def extract_from_comments(self, source_dir: str) -> Dict:
        """從註解提取文檔"""
        source_path = Path(source_dir)
        documentation = {}

        for py_file in source_path.rglob('*.py'):
            if self._should_ignore(py_file):
                continue

            with open(py_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # 提取文檔字串和註解
            docstrings = self._extract_docstrings(content)
            comments = self._extract_comments(content)

            if docstrings or comments:
                documentation[str(py_file)] = {
                    'docstrings': docstrings,
                    'comments': comments
                }

        return documentation

    def _parse_python_file(self, file_path: Path) -> Optional[Dict]:
        """解析 Python 檔案"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            tree = ast.parse(content)

            module_doc = {
                'file': str(file_path.relative_to(self.project_root)),
                'module_docstring': ast.get_docstring(tree),
                'classes': [],
                'functions': []
            }

            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    class_doc = self._parse_class(node)
                    module_doc['classes'].append(class_doc)

                elif isinstance(node, ast.FunctionDef):
                    # 只收集模組層級的函數
                    if isinstance(node, ast.FunctionDef):
                        func_doc = self._parse_function(node)
                        module_doc['functions'].append(func_doc)

            return module_doc

        except Exception as e:
            print(f"警告: 無法解析 {file_path}: {e}", file=sys.stderr)
            return None

    def _parse_class(self, node: ast.ClassDef) -> Dict:
        """解析類別"""
        methods = []

        for item in node.body:
            if isinstance(item, ast.FunctionDef):
                method_doc = self._parse_function(item)
                methods.append(method_doc)

        return {
            'name': node.name,
            'docstring': ast.get_docstring(node),
            'bases': [self._get_name(base) for base in node.bases],
            'methods': methods
        }

    def _parse_function(self, node: ast.FunctionDef) -> Dict:
        """解析函數"""
        args = []
        for arg in node.args.args:
            args.append(arg.arg)

        return {
            'name': node.name,
            'docstring': ast.get_docstring(node),
            'args': args,
            'returns': self._get_return_annotation(node)
        }

    def _get_name(self, node: Any) -> str:
        """取得節點名稱"""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_name(node.value)}.{node.attr}"
        return str(node)

    def _get_return_annotation(self, node: ast.FunctionDef) -> Optional[str]:
        """取得返回值註解"""
        if node.returns:
            return ast.unparse(node.returns)
        return None

    def _extract_docstrings(self, content: str) -> List[str]:
        """提取文檔字串"""
        docstrings = []
        pattern = r'"""(.*?)"""|\'\'\'(.*?)\'\'\''

        matches = re.findall(pattern, content, re.DOTALL)
        for match in matches:
            docstring = match[0] or match[1]
            if docstring.strip():
                docstrings.append(docstring.strip())

        return docstrings

    def _extract_comments(self, content: str) -> List[str]:
        """提取註解"""
        comments = []
        for line in content.split('\n'):
            line = line.strip()
            if line.startswith('#') and not line.startswith('#!'):
                comments.append(line[1:].strip())

        return comments

    def generate_markdown_docs(self, api_docs: Dict, output_dir: str = 'docs'):
        """生成 Markdown 文檔"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 生成索引
        index_lines = [
            "# API 文檔\n",
            f"生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
            "\n## 模組列表\n"
        ]

        for module in api_docs['modules']:
            module_name = Path(module['file']).stem
            index_lines.append(f"- [{module_name}]({module_name}.md)\n")

            # 生成模組文檔
            module_md = self._generate_module_markdown(module)
            module_file = output_path / f"{module_name}.md"

            with open(module_file, 'w', encoding='utf-8') as f:
                f.write(module_md)

        # 儲存索引
        index_file = output_path / 'index.md'
        with open(index_file, 'w', encoding='utf-8') as f:
            f.writelines(index_lines)

        print(f"\n✓ 文檔已生成到: {output_dir}/")

    def _generate_module_markdown(self, module: Dict) -> str:
        """生成模組的 Markdown 文檔"""
        lines = [
            f"# {module['file']}\n\n"
        ]

        if module['module_docstring']:
            lines.append(f"{module['module_docstring']}\n\n")

        # 類別
        if module['classes']:
            lines.append("## 類別\n\n")

            for cls in module['classes']:
                lines.append(f"### {cls['name']}\n\n")

                if cls['docstring']:
                    lines.append(f"{cls['docstring']}\n\n")

                if cls['bases']:
                    lines.append(f"**繼承:** {', '.join(cls['bases'])}\n\n")

                # 方法
                if cls['methods']:
                    lines.append("**方法:**\n\n")

                    for method in cls['methods']:
                        args_str = ', '.join(method['args'])
                        lines.append(f"- `{method['name']}({args_str})`")

                        if method['docstring']:
                            lines.append(f"\n  {method['docstring']}\n")

                        lines.append("\n")

        # 函數
        if module['functions']:
            lines.append("## 函數\n\n")

            for func in module['functions']:
                args_str = ', '.join(func['args'])
                lines.append(f"### {func['name']}({args_str})\n\n")

                if func['docstring']:
                    lines.append(f"{func['docstring']}\n\n")

                if func['returns']:
                    lines.append(f"**返回:** {func['returns']}\n\n")

        return ''.join(lines)

    def _should_ignore(self, path: Path) -> bool:
        """檢查是否應該忽略此檔案"""
        ignore_patterns = [
            '__pycache__', '.git', '.venv', 'venv',
            'node_modules', 'dist', 'build', '.pytest_cache'
        ]
        return any(pattern in str(path) for pattern in ignore_patterns)


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="文檔生成器 - 自動生成專案文檔",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s --api src/                       # 生成 API 文檔
  %(prog)s --readme                         # 生成 README
  %(prog)s --readme --project-name "My App" # 生成自訂 README
  %(prog)s --from-comments src/             # 從註解生成文檔
  %(prog)s --markdown docs/                 # 生成 Markdown 文檔
        """
    )

    parser.add_argument('--api', metavar='DIR',
                       help='生成 API 文檔（指定原始碼目錄）')
    parser.add_argument('--readme', action='store_true',
                       help='生成 README.md')
    parser.add_argument('--from-comments', metavar='DIR',
                       help='從註解提取文檔')
    parser.add_argument('--markdown', metavar='DIR',
                       help='生成 Markdown 文檔到指定目錄')

    parser.add_argument('--project-name', help='專案名稱')
    parser.add_argument('--project-description', help='專案描述')
    parser.add_argument('--author', help='作者名稱')
    parser.add_argument('--email', help='作者 Email')

    parser.add_argument('-o', '--output', help='輸出檔案路徑')

    args = parser.parse_args()

    generator = DocGenerator()

    try:
        if args.api:
            # 生成 API 文檔
            api_docs = generator.generate_api_docs(args.api)
            print(f"\n✓ 分析了 {api_docs['total']} 個模組")

            # 如果指定了 markdown 目錄，生成 Markdown
            if args.markdown:
                generator.generate_markdown_docs(api_docs, args.markdown)

        elif args.readme:
            # 生成 README
            project_info = {
                'name': args.project_name or 'My Project',
                'description': args.project_description or '專案描述',
                'author': args.author or 'Author Name',
                'email': args.email or 'author@example.com'
            }

            readme = generator.generate_readme(project_info)

            output_file = args.output or 'README.md'
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(readme)

            print(f"\n✓ README 已生成: {output_file}")

        elif args.from_comments:
            # 從註解提取文檔
            docs = generator.extract_from_comments(args.from_comments)

            print(f"\n✓ 從 {len(docs)} 個檔案提取文檔")

            for file, content in docs.items():
                print(f"\n{file}:")
                print(f"  - {len(content['docstrings'])} 個文檔字串")
                print(f"  - {len(content['comments'])} 個註解")

        else:
            parser.print_help()
            sys.exit(1)

    except Exception as e:
        print(f"\n錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
