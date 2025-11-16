#!/usr/bin/env python3
"""
File Organizer - 智能檔案整理工具
根據文件類型自動整理文件到對應的資料夾
"""

import os
import shutil
import argparse
from pathlib import Path
from typing import Dict, List
from datetime import datetime

# 文件類型分類
FILE_CATEGORIES: Dict[str, List[str]] = {
    'Images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico'],
    'Videos': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
    'Audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
    'Documents': ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.pages'],
    'Spreadsheets': ['.xls', '.xlsx', '.csv', '.ods', '.numbers'],
    'Presentations': ['.ppt', '.pptx', '.key', '.odp'],
    'Archives': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
    'Code': ['.py', '.js', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs', '.swift'],
    'Web': ['.html', '.css', '.scss', '.sass', '.less', '.jsx', '.tsx', '.vue'],
    'Data': ['.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg'],
    'Executables': ['.exe', '.msi', '.app', '.deb', '.rpm', '.dmg', '.apk'],
    'Others': []  # 未分類的文件
}


class FileOrganizer:
    """文件整理器主類別"""

    def __init__(self, source_dir: str, dry_run: bool = False, verbose: bool = False):
        self.source_dir = Path(source_dir).resolve()
        self.dry_run = dry_run
        self.verbose = verbose
        self.stats = {
            'moved': 0,
            'skipped': 0,
            'errors': 0
        }

    def get_file_category(self, file_path: Path) -> str:
        """根據文件擴展名判斷文件類別"""
        ext = file_path.suffix.lower()

        for category, extensions in FILE_CATEGORIES.items():
            if ext in extensions:
                return category

        return 'Others'

    def organize(self) -> None:
        """執行文件整理"""
        if not self.source_dir.exists():
            print(f"❌ 錯誤: 目錄不存在: {self.source_dir}")
            return

        if not self.source_dir.is_dir():
            print(f"❌ 錯誤: 不是有效的目錄: {self.source_dir}")
            return

        print(f"📁 開始整理目錄: {self.source_dir}")
        if self.dry_run:
            print("🔍 模擬模式 (不會實際移動文件)")
        print()

        # 獲取所有文件
        files = [f for f in self.source_dir.iterdir() if f.is_file()]

        if not files:
            print("ℹ️  目錄中沒有文件需要整理")
            return

        print(f"找到 {len(files)} 個文件\n")

        # 整理每個文件
        for file_path in files:
            self._organize_file(file_path)

        # 顯示統計結果
        self._print_statistics()

    def _organize_file(self, file_path: Path) -> None:
        """整理單個文件"""
        try:
            # 判斷文件類別
            category = self.get_file_category(file_path)

            # 創建目標目錄
            target_dir = self.source_dir / category

            # 如果不是模擬模式，創建目錄
            if not self.dry_run:
                target_dir.mkdir(exist_ok=True)

            # 目標文件路徑
            target_path = target_dir / file_path.name

            # 如果目標文件已存在，添加時間戳
            if target_path.exists():
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                name_without_ext = file_path.stem
                ext = file_path.suffix
                target_path = target_dir / f"{name_without_ext}_{timestamp}{ext}"

            # 移動文件
            if not self.dry_run:
                shutil.move(str(file_path), str(target_path))

            # 輸出信息
            if self.verbose or self.dry_run:
                print(f"✅ [{category}] {file_path.name} -> {category}/")

            self.stats['moved'] += 1

        except Exception as e:
            print(f"❌ 錯誤處理文件 {file_path.name}: {e}")
            self.stats['errors'] += 1

    def organize_by_date(self) -> None:
        """按日期整理文件"""
        if not self.source_dir.exists():
            print(f"❌ 錯誤: 目錄不存在: {self.source_dir}")
            return

        print(f"📅 按日期整理目錄: {self.source_dir}")
        if self.dry_run:
            print("🔍 模擬模式 (不會實際移動文件)")
        print()

        files = [f for f in self.source_dir.iterdir() if f.is_file()]

        for file_path in files:
            try:
                # 獲取文件修改時間
                mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                year_month = mtime.strftime("%Y-%m")

                # 創建目標目錄
                target_dir = self.source_dir / year_month

                if not self.dry_run:
                    target_dir.mkdir(exist_ok=True)

                target_path = target_dir / file_path.name

                # 處理文件名衝突
                if target_path.exists():
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    name_without_ext = file_path.stem
                    ext = file_path.suffix
                    target_path = target_dir / f"{name_without_ext}_{timestamp}{ext}"

                if not self.dry_run:
                    shutil.move(str(file_path), str(target_path))

                if self.verbose or self.dry_run:
                    print(f"✅ [{year_month}] {file_path.name} -> {year_month}/")

                self.stats['moved'] += 1

            except Exception as e:
                print(f"❌ 錯誤處理文件 {file_path.name}: {e}")
                self.stats['errors'] += 1

        self._print_statistics()

    def _print_statistics(self) -> None:
        """顯示統計信息"""
        print("\n" + "=" * 50)
        print("📊 整理統計:")
        print(f"  ✅ 已移動: {self.stats['moved']} 個文件")
        print(f"  ⏭️  已跳過: {self.stats['skipped']} 個文件")
        print(f"  ❌ 錯誤: {self.stats['errors']} 個文件")
        print("=" * 50)


def main():
    """主程式入口"""
    parser = argparse.ArgumentParser(
        description='🗂️  File Organizer - 智能檔案整理工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
範例:
  # 整理當前目錄的文件
  python file_organizer.py .

  # 整理指定目錄
  python file_organizer.py /path/to/downloads

  # 模擬模式（不實際移動文件）
  python file_organizer.py . --dry-run

  # 按日期整理
  python file_organizer.py . --by-date

  # 顯示詳細信息
  python file_organizer.py . --verbose
        '''
    )

    parser.add_argument(
        'directory',
        nargs='?',
        default='.',
        help='要整理的目錄路徑（默認：當前目錄）'
    )

    parser.add_argument(
        '-d', '--dry-run',
        action='store_true',
        help='模擬模式，不實際移動文件'
    )

    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='顯示詳細信息'
    )

    parser.add_argument(
        '--by-date',
        action='store_true',
        help='按日期（年-月）整理文件'
    )

    parser.add_argument(
        '--version',
        action='version',
        version='File Organizer v1.0.0'
    )

    args = parser.parse_args()

    # 創建整理器實例
    organizer = FileOrganizer(
        source_dir=args.directory,
        dry_run=args.dry_run,
        verbose=args.verbose
    )

    # 執行整理
    if args.by_date:
        organizer.organize_by_date()
    else:
        organizer.organize()


if __name__ == '__main__':
    main()
