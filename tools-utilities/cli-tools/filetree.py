#!/usr/bin/env python3
"""
filetree.py - 智能目錄樹生成器
使用 AI 輔助開發的增強版目錄樹顯示工具
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Optional
import fnmatch

# 嘗試導入 colorama 以支援彩色輸出
try:
    from colorama import Fore, Style, init
    init(autoreset=True)
    COLORS_AVAILABLE = True
except ImportError:
    COLORS_AVAILABLE = False
    # 定義空的替代品
    class Fore:
        BLUE = CYAN = GREEN = YELLOW = RED = RESET = ""
    class Style:
        BRIGHT = RESET_ALL = ""


class FileTree:
    """目錄樹生成器類別"""

    def __init__(self, root_path: str, max_depth: Optional[int] = None,
                 dirs_only: bool = False, show_hidden: bool = False,
                 use_gitignore: bool = True):
        self.root_path = Path(root_path)
        self.max_depth = max_depth
        self.dirs_only = dirs_only
        self.show_hidden = show_hidden
        self.use_gitignore = use_gitignore
        self.gitignore_patterns = []

        if use_gitignore:
            self._load_gitignore()

    def _load_gitignore(self):
        """載入 .gitignore 規則"""
        gitignore_path = self.root_path / '.gitignore'
        if gitignore_path.exists():
            with open(gitignore_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        self.gitignore_patterns.append(line)

    def _should_ignore(self, path: Path) -> bool:
        """檢查路徑是否應該被忽略"""
        if not self.show_hidden and path.name.startswith('.'):
            return True

        if self.use_gitignore:
            rel_path = str(path.relative_to(self.root_path))
            for pattern in self.gitignore_patterns:
                if fnmatch.fnmatch(rel_path, pattern):
                    return True

        return False

    def _get_file_size(self, path: Path) -> str:
        """獲取檔案大小（人類可讀格式）"""
        try:
            size = path.stat().st_size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024.0:
                    return f"{size:.1f}{unit}"
                size /= 1024.0
            return f"{size:.1f}TB"
        except (OSError, IOError):
            return "N/A"

    def _get_tree_chars(self, is_last: bool) -> tuple:
        """獲取樹狀圖字元"""
        if is_last:
            return "└── ", "    "
        else:
            return "├── ", "│   "

    def _colorize(self, text: str, is_dir: bool) -> str:
        """為文字添加顏色"""
        if not COLORS_AVAILABLE:
            return text

        if is_dir:
            return f"{Fore.BLUE}{Style.BRIGHT}{text}{Style.RESET_ALL}"
        else:
            # 根據副檔名著色
            if text.endswith(('.py', '.js', '.go', '.rs')):
                return f"{Fore.GREEN}{text}{Style.RESET_ALL}"
            elif text.endswith(('.json', '.yaml', '.yml', '.toml')):
                return f"{Fore.CYAN}{text}{Style.RESET_ALL}"
            elif text.endswith(('.md', '.txt', '.rst')):
                return f"{Fore.YELLOW}{text}{Style.RESET_ALL}"
            else:
                return text

    def generate_tree(self, show_size: bool = False) -> str:
        """生成目錄樹字串"""
        lines = [self._colorize(self.root_path.name + "/", True)]
        self._build_tree(self.root_path, "", lines, 0, show_size)
        return "\n".join(lines)

    def _build_tree(self, directory: Path, prefix: str, lines: List[str],
                    depth: int, show_size: bool):
        """遞迴建構目錄樹"""
        if self.max_depth is not None and depth >= self.max_depth:
            return

        try:
            entries = sorted(directory.iterdir(),
                           key=lambda x: (not x.is_dir(), x.name.lower()))
        except PermissionError:
            return

        entries = [e for e in entries if not self._should_ignore(e)]

        for i, entry in enumerate(entries):
            is_last = (i == len(entries) - 1)

            if self.dirs_only and not entry.is_dir():
                continue

            # 獲取樹狀圖字元
            branch, extension = self._get_tree_chars(is_last)

            # 建構顯示名稱
            name = entry.name
            if entry.is_dir():
                name += "/"

            # 添加大小資訊
            size_info = ""
            if show_size and entry.is_file():
                size_info = f" ({self._get_file_size(entry)})"

            # 著色並添加到輸出
            colored_name = self._colorize(name, entry.is_dir())
            lines.append(f"{prefix}{branch}{colored_name}{size_info}")

            # 遞迴處理子目錄
            if entry.is_dir():
                self._build_tree(entry, prefix + extension, lines, depth + 1, show_size)

    def generate_json(self) -> Dict:
        """生成 JSON 格式的目錄結構"""
        def build_json_tree(directory: Path, depth: int = 0) -> Dict:
            if self.max_depth is not None and depth >= self.max_depth:
                return {}

            result = {
                "name": directory.name,
                "type": "directory",
                "children": []
            }

            try:
                entries = sorted(directory.iterdir(),
                               key=lambda x: (not x.is_dir(), x.name.lower()))
            except PermissionError:
                return result

            entries = [e for e in entries if not self._should_ignore(e)]

            for entry in entries:
                if self.dirs_only and not entry.is_dir():
                    continue

                if entry.is_dir():
                    result["children"].append(build_json_tree(entry, depth + 1))
                else:
                    result["children"].append({
                        "name": entry.name,
                        "type": "file",
                        "size": entry.stat().st_size
                    })

            return result

        return build_json_tree(self.root_path)

    def generate_markdown(self) -> str:
        """生成 Markdown 格式的目錄結構"""
        lines = [f"# Directory Structure: {self.root_path.name}\n"]
        self._build_markdown(self.root_path, "", lines, 0)
        return "\n".join(lines)

    def _build_markdown(self, directory: Path, prefix: str, lines: List[str], depth: int):
        """遞迴建構 Markdown 目錄樹"""
        if self.max_depth is not None and depth >= self.max_depth:
            return

        try:
            entries = sorted(directory.iterdir(),
                           key=lambda x: (not x.is_dir(), x.name.lower()))
        except PermissionError:
            return

        entries = [e for e in entries if not self._should_ignore(e)]

        for entry in entries:
            if self.dirs_only and not entry.is_dir():
                continue

            indent = "  " * depth
            if entry.is_dir():
                lines.append(f"{indent}- 📁 **{entry.name}/**")
                self._build_markdown(entry, prefix, lines, depth + 1)
            else:
                lines.append(f"{indent}- 📄 {entry.name}")


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="智能目錄樹生成器 - AI 輔助開發",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s                          # 顯示當前目錄樹
  %(prog)s /path/to/dir            # 顯示指定目錄樹
  %(prog)s --depth 3               # 限制深度為 3
  %(prog)s --dirs-only             # 只顯示目錄
  %(prog)s --output json           # 輸出為 JSON 格式
  %(prog)s --show-size             # 顯示檔案大小
        """
    )

    parser.add_argument('path', nargs='?', default='.',
                       help='要顯示的目錄路徑（預設：當前目錄）')
    parser.add_argument('-d', '--depth', type=int, metavar='N',
                       help='限制顯示深度')
    parser.add_argument('--dirs-only', action='store_true',
                       help='只顯示目錄')
    parser.add_argument('-a', '--all', action='store_true',
                       help='顯示隱藏檔案')
    parser.add_argument('--no-gitignore', action='store_true',
                       help='不使用 .gitignore 規則')
    parser.add_argument('-s', '--show-size', action='store_true',
                       help='顯示檔案大小')
    parser.add_argument('-o', '--output', choices=['tree', 'json', 'markdown'],
                       default='tree',
                       help='輸出格式（預設：tree）')

    args = parser.parse_args()

    # 檢查路徑是否存在
    path = Path(args.path)
    if not path.exists():
        print(f"錯誤: 路徑不存在: {args.path}", file=sys.stderr)
        sys.exit(1)

    if not path.is_dir():
        print(f"錯誤: 不是目錄: {args.path}", file=sys.stderr)
        sys.exit(1)

    # 建立 FileTree 物件
    tree = FileTree(
        root_path=str(path),
        max_depth=args.depth,
        dirs_only=args.dirs_only,
        show_hidden=args.all,
        use_gitignore=not args.no_gitignore
    )

    # 生成並輸出結果
    try:
        if args.output == 'json':
            result = tree.generate_json()
            print(json.dumps(result, indent=2, ensure_ascii=False))
        elif args.output == 'markdown':
            result = tree.generate_markdown()
            print(result)
        else:  # tree
            result = tree.generate_tree(show_size=args.show_size)
            print(result)
    except Exception as e:
        print(f"錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
