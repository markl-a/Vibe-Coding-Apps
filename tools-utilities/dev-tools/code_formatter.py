#!/usr/bin/env python3
"""
code_formatter.py - 程式碼格式化工具
多語言程式碼格式化和美化工具
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path
from typing import List, Dict, Optional
import difflib


class CodeFormatter:
    """程式碼格式化器類別"""

    def __init__(self, config_file: Optional[str] = None):
        self.config_file = config_file
        self.supported_languages = {
            'python': self._format_python,
            'javascript': self._format_javascript,
            'typescript': self._format_typescript,
            'java': self._format_java,
            'go': self._format_go,
            'rust': self._format_rust,
        }

    def format_file(self, file_path: str, language: str = None,
                   fix: bool = False, show_diff: bool = False) -> Dict:
        """格式化單個檔案"""
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"檔案不存在: {file_path}")

        # 自動偵測語言
        if not language:
            language = self._detect_language(path)

        if language not in self.supported_languages:
            raise ValueError(f"不支援的語言: {language}")

        # 讀取原始內容
        with open(path, 'r', encoding='utf-8') as f:
            original_content = f.read()

        # 格式化
        formatter = self.supported_languages[language]
        formatted_content = formatter(original_content, path)

        result = {
            'file': str(path),
            'language': language,
            'changed': original_content != formatted_content,
            'original_lines': len(original_content.splitlines()),
            'formatted_lines': len(formatted_content.splitlines()),
        }

        # 顯示差異
        if show_diff and result['changed']:
            diff = self._generate_diff(original_content, formatted_content, str(path))
            result['diff'] = diff
            print(diff)

        # 修復檔案
        if fix and result['changed']:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(formatted_content)
            result['fixed'] = True

        return result

    def format_directory(self, directory: str, pattern: str = '*',
                        fix: bool = False, **kwargs) -> List[Dict]:
        """批次格式化目錄"""
        results = []
        path = Path(directory)

        if not path.is_dir():
            raise NotADirectoryError(f"不是目錄: {directory}")

        # 查找檔案
        for file_path in path.rglob(pattern):
            if file_path.is_file() and not self._should_ignore(file_path):
                try:
                    result = self.format_file(str(file_path), fix=fix, **kwargs)
                    results.append(result)
                except Exception as e:
                    results.append({
                        'file': str(file_path),
                        'error': str(e)
                    })

        return results

    def _detect_language(self, path: Path) -> str:
        """偵測程式語言"""
        ext_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
        }
        return ext_map.get(path.suffix, 'unknown')

    def _should_ignore(self, path: Path) -> bool:
        """檢查是否應該忽略此檔案"""
        ignore_patterns = [
            '__pycache__', 'node_modules', '.git', '.venv',
            'venv', 'dist', 'build', '.pytest_cache'
        ]
        return any(pattern in str(path) for pattern in ignore_patterns)

    def _format_python(self, content: str, path: Path) -> str:
        """格式化 Python 程式碼"""
        try:
            # 使用 black 格式化
            import black
            mode = black.Mode(
                target_versions={black.TargetVersion.PY38},
                line_length=88,
                string_normalization=True,
            )
            formatted = black.format_str(content, mode=mode)

            # 使用 isort 排序 imports
            try:
                import isort
                formatted = isort.code(formatted)
            except ImportError:
                pass

            return formatted
        except ImportError:
            # 如果 black 未安裝，使用 autopep8
            try:
                import autopep8
                return autopep8.fix_code(content)
            except ImportError:
                print("警告: 未安裝 black 或 autopep8，跳過格式化", file=sys.stderr)
                return content

    def _format_javascript(self, content: str, path: Path) -> str:
        """格式化 JavaScript 程式碼"""
        # 簡單的 JavaScript 格式化
        lines = content.split('\n')
        formatted_lines = []
        indent_level = 0

        for line in lines:
            stripped = line.strip()
            if not stripped:
                formatted_lines.append('')
                continue

            # 減少縮排
            if stripped.startswith('}') or stripped.startswith(']'):
                indent_level = max(0, indent_level - 1)

            # 添加縮排
            formatted_lines.append('  ' * indent_level + stripped)

            # 增加縮排
            if stripped.endswith('{') or stripped.endswith('['):
                indent_level += 1

        return '\n'.join(formatted_lines)

    def _format_typescript(self, content: str, path: Path) -> str:
        """格式化 TypeScript 程式碼"""
        return self._format_javascript(content, path)

    def _format_java(self, content: str, path: Path) -> str:
        """格式化 Java 程式碼"""
        # 簡單的 Java 格式化（類似 JavaScript）
        return self._format_javascript(content, path)

    def _format_go(self, content: str, path: Path) -> str:
        """格式化 Go 程式碼"""
        try:
            # 使用 gofmt
            result = subprocess.run(
                ['gofmt'],
                input=content.encode(),
                capture_output=True,
                timeout=10
            )
            if result.returncode == 0:
                return result.stdout.decode()
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        return content

    def _format_rust(self, content: str, path: Path) -> str:
        """格式化 Rust 程式碼"""
        try:
            # 使用 rustfmt
            result = subprocess.run(
                ['rustfmt', '--emit', 'stdout'],
                input=content.encode(),
                capture_output=True,
                timeout=10
            )
            if result.returncode == 0:
                return result.stdout.decode()
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        return content

    def _generate_diff(self, original: str, formatted: str, filename: str) -> str:
        """生成差異報告"""
        original_lines = original.splitlines(keepends=True)
        formatted_lines = formatted.splitlines(keepends=True)

        diff = difflib.unified_diff(
            original_lines,
            formatted_lines,
            fromfile=f'{filename} (原始)',
            tofile=f'{filename} (格式化)',
            lineterm=''
        )

        return ''.join(diff)


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="程式碼格式化工具 - 多語言支援",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s file.py --language python             # 檢查 Python 檔案
  %(prog)s file.py --fix                          # 格式化並修復
  %(prog)s src/ --fix                             # 批次格式化目錄
  %(prog)s file.js --diff                         # 顯示差異
  %(prog)s src/*.py --check                       # 只檢查不修改
  %(prog)s src/ --config .formatter.yaml          # 使用自訂配置
        """
    )

    parser.add_argument('path', help='檔案或目錄路徑')
    parser.add_argument('--language', '-l',
                       choices=['python', 'javascript', 'typescript', 'java', 'go', 'rust'],
                       help='程式語言（自動偵測）')
    parser.add_argument('--fix', action='store_true',
                       help='自動修復格式問題')
    parser.add_argument('--check', action='store_true',
                       help='只檢查不修改')
    parser.add_argument('--diff', action='store_true',
                       help='顯示差異')
    parser.add_argument('--config', help='配置檔案路徑')
    parser.add_argument('--pattern', default='*',
                       help='檔案匹配模式（目錄模式）')

    args = parser.parse_args()

    formatter = CodeFormatter(config_file=args.config)

    try:
        path = Path(args.path)

        if path.is_file():
            # 格式化單個檔案
            result = formatter.format_file(
                args.path,
                language=args.language,
                fix=args.fix and not args.check,
                show_diff=args.diff
            )

            if result['changed']:
                status = '✓ 已修復' if result.get('fixed') else '⚠ 需要格式化'
                print(f"\n{status}: {result['file']}")
            else:
                print(f"\n✓ 已格式化: {result['file']}")

        elif path.is_dir():
            # 批次格式化目錄
            results = formatter.format_directory(
                args.path,
                pattern=args.pattern,
                fix=args.fix and not args.check,
                show_diff=args.diff
            )

            # 統計
            total = len(results)
            changed = sum(1 for r in results if r.get('changed', False))
            errors = sum(1 for r in results if 'error' in r)
            fixed = sum(1 for r in results if r.get('fixed', False))

            print(f"\n處理了 {total} 個檔案:")
            print(f"  - 需要格式化: {changed}")
            print(f"  - 已修復: {fixed}")
            print(f"  - 錯誤: {errors}")

            if args.check and changed > 0:
                print("\n⚠ 有檔案需要格式化！")
                for result in results:
                    if result.get('changed'):
                        print(f"  - {result['file']}")
                sys.exit(1)

        else:
            print(f"錯誤: 路徑不存在: {args.path}", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"\n錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
