#!/usr/bin/env python3
"""
batch_rename.py - 批次檔案重新命名工具
使用 AI 輔助開發的強大批次重新命名腳本
"""

import os
import sys
import re
import argparse
from pathlib import Path
from typing import List, Tuple, Optional
import json


class BatchRenamer:
    """批次重新命名器類別"""

    def __init__(self, preview: bool = True, recursive: bool = False):
        self.preview = preview
        self.recursive = recursive
        self.rename_history = []

    def add_prefix(self, files: List[Path], prefix: str) -> List[Tuple[Path, Path]]:
        """添加前綴"""
        renames = []
        for file_path in files:
            new_name = prefix + file_path.name
            new_path = file_path.parent / new_name
            renames.append((file_path, new_path))
        return renames

    def add_suffix(self, files: List[Path], suffix: str) -> List[Tuple[Path, Path]]:
        """添加後綴（在副檔名前）"""
        renames = []
        for file_path in files:
            stem = file_path.stem
            ext = file_path.suffix
            new_name = f"{stem}{suffix}{ext}"
            new_path = file_path.parent / new_name
            renames.append((file_path, new_path))
        return renames

    def replace_text(self, files: List[Path], old: str, new: str,
                     case_sensitive: bool = True) -> List[Tuple[Path, Path]]:
        """替換文字"""
        renames = []
        for file_path in files:
            if case_sensitive:
                new_name = file_path.name.replace(old, new)
            else:
                # 不區分大小寫的替換
                pattern = re.compile(re.escape(old), re.IGNORECASE)
                new_name = pattern.sub(new, file_path.name)

            new_path = file_path.parent / new_name
            if new_name != file_path.name:
                renames.append((file_path, new_path))
        return renames

    def add_numbering(self, files: List[Path], start: int = 1,
                     digits: int = 3, separator: str = "_") -> List[Tuple[Path, Path]]:
        """添加序號"""
        renames = []
        for i, file_path in enumerate(sorted(files), start=start):
            stem = file_path.stem
            ext = file_path.suffix
            number = str(i).zfill(digits)
            new_name = f"{stem}{separator}{number}{ext}"
            new_path = file_path.parent / new_name
            renames.append((file_path, new_path))
        return renames

    def regex_rename(self, files: List[Path], pattern: str,
                    replacement: str) -> List[Tuple[Path, Path]]:
        """使用正規表達式重新命名"""
        renames = []
        regex = re.compile(pattern)

        for file_path in files:
            new_name = regex.sub(replacement, file_path.name)
            if new_name != file_path.name:
                new_path = file_path.parent / new_name
                renames.append((file_path, new_path))

        return renames

    def lowercase(self, files: List[Path]) -> List[Tuple[Path, Path]]:
        """轉換為小寫"""
        renames = []
        for file_path in files:
            new_name = file_path.name.lower()
            if new_name != file_path.name:
                new_path = file_path.parent / new_name
                renames.append((file_path, new_path))
        return renames

    def uppercase(self, files: List[Path]) -> List[Tuple[Path, Path]]:
        """轉換為大寫"""
        renames = []
        for file_path in files:
            new_name = file_path.name.upper()
            if new_name != file_path.name:
                new_path = file_path.parent / new_name
                renames.append((file_path, new_path))
        return renames

    def execute_renames(self, renames: List[Tuple[Path, Path]]) -> dict:
        """執行重新命名操作"""
        results = {
            'success': [],
            'failed': [],
            'skipped': []
        }

        for old_path, new_path in renames:
            try:
                # 檢查目標檔案是否已存在
                if new_path.exists():
                    results['skipped'].append({
                        'file': str(old_path),
                        'reason': f'目標已存在: {new_path}'
                    })
                    continue

                # 執行重新命名
                if not self.preview:
                    old_path.rename(new_path)
                    self.rename_history.append((old_path, new_path))

                results['success'].append({
                    'old': str(old_path),
                    'new': str(new_path)
                })

            except Exception as e:
                results['failed'].append({
                    'file': str(old_path),
                    'error': str(e)
                })

        return results

    def undo_last(self) -> int:
        """撤銷上次操作"""
        count = 0
        for new_path, old_path in reversed(self.rename_history):
            try:
                if new_path.exists():
                    new_path.rename(old_path)
                    count += 1
            except Exception as e:
                print(f"撤銷失敗: {new_path} -> {old_path}: {e}", file=sys.stderr)

        self.rename_history.clear()
        return count

    def print_results(self, results: dict):
        """列印結果"""
        if self.preview:
            print("\n=== 預覽模式（不會實際重新命名） ===\n")

        if results['success']:
            print(f"✓ 成功: {len(results['success'])} 個檔案")
            for item in results['success']:
                print(f"  {item['old']}")
                print(f"  -> {item['new']}\n")

        if results['skipped']:
            print(f"\n⊘ 跳過: {len(results['skipped'])} 個檔案")
            for item in results['skipped']:
                print(f"  {item['file']}: {item['reason']}")

        if results['failed']:
            print(f"\n✗ 失敗: {len(results['failed'])} 個檔案", file=sys.stderr)
            for item in results['failed']:
                print(f"  {item['file']}: {item['error']}", file=sys.stderr)

        if self.preview:
            print("\n提示: 移除 --preview 參數以實際執行重新命名")


def collect_files(patterns: List[str], recursive: bool = False) -> List[Path]:
    """收集符合模式的檔案"""
    files = []

    for pattern in patterns:
        path = Path(pattern)

        if path.is_file():
            files.append(path)
        elif path.is_dir():
            if recursive:
                files.extend(path.rglob('*'))
            else:
                files.extend(path.glob('*'))
        else:
            # 處理 glob 模式
            parent = path.parent if path.parent.exists() else Path('.')
            if recursive:
                matched = parent.rglob(path.name)
            else:
                matched = parent.glob(path.name)
            files.extend(matched)

    # 只保留檔案（排除目錄）
    files = [f for f in files if f.is_file()]

    return files


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="批次檔案重新命名工具 - AI 輔助開發",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s --prefix "IMG_" *.jpg                    # 添加前綴
  %(prog)s --suffix "_backup" *.txt                 # 添加後綴
  %(prog)s --replace "old" "new" *                  # 替換文字
  %(prog)s --numbering --start 1 *.pdf              # 添加序號
  %(prog)s --regex "(\\d{4})-(\\d{2})" "\\2-\\1" *   # 正規表達式
  %(prog)s --lowercase *.TXT                        # 轉小寫
  %(prog)s --preview *.jpg                          # 預覽模式
        """
    )

    parser.add_argument('files', nargs='+',
                       help='要重新命名的檔案或模式')

    # 重新命名選項
    rename_group = parser.add_argument_group('重新命名選項')
    rename_group.add_argument('--prefix', metavar='TEXT',
                             help='添加前綴')
    rename_group.add_argument('--suffix', metavar='TEXT',
                             help='添加後綴（在副檔名前）')
    rename_group.add_argument('--replace', nargs=2, metavar=('OLD', 'NEW'),
                             help='替換文字')
    rename_group.add_argument('--numbering', action='store_true',
                             help='添加序號')
    rename_group.add_argument('--regex', nargs=2, metavar=('PATTERN', 'REPLACEMENT'),
                             help='使用正規表達式')
    rename_group.add_argument('--lowercase', action='store_true',
                             help='轉換為小寫')
    rename_group.add_argument('--uppercase', action='store_true',
                             help='轉換為大寫')

    # 序號選項
    number_group = parser.add_argument_group('序號選項')
    number_group.add_argument('--start', type=int, default=1,
                             help='起始數字（預設：1）')
    number_group.add_argument('--digits', type=int, default=3,
                             help='數字位數（預設：3）')
    number_group.add_argument('--separator', default='_',
                             help='分隔符（預設：_）')

    # 其他選項
    parser.add_argument('-r', '--recursive', action='store_true',
                       help='遞迴處理子目錄')
    parser.add_argument('-p', '--preview', action='store_true',
                       help='預覽模式（不實際重新命名）')
    parser.add_argument('-i', '--ignore-case', action='store_true',
                       help='替換時不區分大小寫')
    parser.add_argument('--undo', action='store_true',
                       help='撤銷上次操作')

    args = parser.parse_args()

    # 建立重新命名器
    renamer = BatchRenamer(preview=args.preview, recursive=args.recursive)

    # 處理撤銷
    if args.undo:
        print("撤銷上次操作...")
        count = renamer.undo_last()
        print(f"已撤銷 {count} 個檔案的重新命名")
        return

    # 收集檔案
    files = collect_files(args.files, recursive=args.recursive)

    if not files:
        print("錯誤: 沒有找到符合的檔案", file=sys.stderr)
        sys.exit(1)

    print(f"找到 {len(files)} 個檔案\n")

    # 執行重新命名操作
    renames = []

    if args.prefix:
        renames = renamer.add_prefix(files, args.prefix)
    elif args.suffix:
        renames = renamer.add_suffix(files, args.suffix)
    elif args.replace:
        renames = renamer.replace_text(files, args.replace[0], args.replace[1],
                                       case_sensitive=not args.ignore_case)
    elif args.numbering:
        renames = renamer.add_numbering(files, start=args.start,
                                       digits=args.digits,
                                       separator=args.separator)
    elif args.regex:
        renames = renamer.regex_rename(files, args.regex[0], args.regex[1])
    elif args.lowercase:
        renames = renamer.lowercase(files)
    elif args.uppercase:
        renames = renamer.uppercase(files)
    else:
        print("錯誤: 請指定至少一個重新命名選項", file=sys.stderr)
        parser.print_help()
        sys.exit(1)

    if not renames:
        print("沒有需要重新命名的檔案")
        sys.exit(0)

    # 執行重新命名
    results = renamer.execute_renames(renames)
    renamer.print_results(results)

    # 設定退出碼
    if results['failed']:
        sys.exit(1)


if __name__ == '__main__':
    main()
