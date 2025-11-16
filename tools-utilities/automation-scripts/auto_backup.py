#!/usr/bin/env python3
"""
auto_backup.py - 自動備份工具
使用 AI 輔助開發的智能備份腳本
"""

import os
import sys
import shutil
import argparse
from pathlib import Path
from datetime import datetime
import hashlib
import zipfile
import tarfile
from typing import List, Optional
import json


class BackupManager:
    """備份管理器類別"""

    def __init__(self, source: Path, destination: Path,
                 compress: Optional[str] = None,
                 incremental: bool = False,
                 exclude_patterns: Optional[List[str]] = None):
        self.source = source
        self.destination = destination
        self.compress = compress
        self.incremental = incremental
        self.exclude_patterns = exclude_patterns or []
        self.stats = {
            'files_copied': 0,
            'files_skipped': 0,
            'total_size': 0,
            'errors': []
        }

    def should_exclude(self, path: Path) -> bool:
        """檢查路徑是否應該被排除"""
        for pattern in self.exclude_patterns:
            if path.match(pattern):
                return True
        return False

    def calculate_checksum(self, file_path: Path) -> str:
        """計算檔案 MD5 校驗和"""
        md5 = hashlib.md5()
        try:
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b''):
                    md5.update(chunk)
            return md5.hexdigest()
        except Exception:
            return ''

    def needs_backup(self, src_file: Path, dst_file: Path) -> bool:
        """判斷檔案是否需要備份"""
        if not dst_file.exists():
            return True

        if not self.incremental:
            return True

        # 增量備份：比較修改時間
        src_mtime = src_file.stat().st_mtime
        dst_mtime = dst_file.stat().st_mtime

        if src_mtime > dst_mtime:
            return True

        # 可選：比較檔案大小
        if src_file.stat().st_size != dst_file.stat().st_size:
            return True

        return False

    def backup_files(self) -> dict:
        """執行檔案備份"""
        if not self.source.exists():
            raise FileNotFoundError(f"來源路徑不存在: {self.source}")

        # 建立目標目錄
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"{self.source.name}_{timestamp}"
        backup_dir = self.destination / backup_name

        if not self.compress:
            backup_dir.mkdir(parents=True, exist_ok=True)

        # 收集需要備份的檔案
        files_to_backup = []

        if self.source.is_file():
            files_to_backup.append((self.source, backup_dir / self.source.name))
        else:
            for item in self.source.rglob('*'):
                if item.is_file() and not self.should_exclude(item):
                    rel_path = item.relative_to(self.source)
                    dst_path = backup_dir / rel_path
                    files_to_backup.append((item, dst_path))

        # 執行備份
        for src_file, dst_file in files_to_backup:
            try:
                if self.needs_backup(src_file, dst_file):
                    if not self.compress:
                        dst_file.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(src_file, dst_file)

                    self.stats['files_copied'] += 1
                    self.stats['total_size'] += src_file.stat().st_size
                else:
                    self.stats['files_skipped'] += 1

            except Exception as e:
                self.stats['errors'].append({
                    'file': str(src_file),
                    'error': str(e)
                })

        # 壓縮備份
        if self.compress:
            archive_path = self._compress_backup(backup_dir, files_to_backup)
            backup_dir = archive_path

        return {
            'backup_path': str(backup_dir),
            'stats': self.stats,
            'timestamp': timestamp
        }

    def _compress_backup(self, backup_dir: Path,
                        files: List[tuple]) -> Path:
        """壓縮備份檔案"""
        if self.compress == 'zip':
            archive_path = backup_dir.with_suffix('.zip')
            with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for src_file, dst_file in files:
                    if self.needs_backup(src_file, dst_file):
                        arcname = src_file.relative_to(self.source)
                        zipf.write(src_file, arcname)

        elif self.compress in ['tar.gz', 'tgz']:
            archive_path = backup_dir.with_suffix('.tar.gz')
            with tarfile.open(archive_path, 'w:gz') as tar:
                for src_file, dst_file in files:
                    if self.needs_backup(src_file, dst_file):
                        arcname = src_file.relative_to(self.source)
                        tar.add(src_file, arcname=arcname)

        elif self.compress == 'tar':
            archive_path = backup_dir.with_suffix('.tar')
            with tarfile.open(archive_path, 'w') as tar:
                for src_file, dst_file in files:
                    if self.needs_backup(src_file, dst_file):
                        arcname = src_file.relative_to(self.source)
                        tar.add(src_file, arcname=arcname)
        else:
            raise ValueError(f"不支援的壓縮格式: {self.compress}")

        return archive_path

    def cleanup_old_backups(self, keep: int = 7):
        """清理舊備份，只保留最近 N 個"""
        if not self.destination.exists():
            return

        # 找出所有備份
        backups = []
        for item in self.destination.iterdir():
            if item.name.startswith(self.source.name):
                backups.append(item)

        # 按修改時間排序
        backups.sort(key=lambda x: x.stat().st_mtime, reverse=True)

        # 刪除舊備份
        for old_backup in backups[keep:]:
            try:
                if old_backup.is_dir():
                    shutil.rmtree(old_backup)
                else:
                    old_backup.unlink()
                print(f"已刪除舊備份: {old_backup}")
            except Exception as e:
                print(f"刪除失敗: {old_backup}: {e}", file=sys.stderr)

    def verify_backup(self, backup_path: Path) -> bool:
        """驗證備份完整性"""
        # 簡化版本：檢查檔案是否存在
        if backup_path.is_file():
            # 壓縮檔
            if backup_path.suffix == '.zip':
                try:
                    with zipfile.ZipFile(backup_path, 'r') as zipf:
                        return zipf.testzip() is None
                except:
                    return False
            elif backup_path.suffix in ['.tar', '.gz']:
                try:
                    with tarfile.open(backup_path, 'r') as tar:
                        tar.getmembers()
                        return True
                except:
                    return False
        elif backup_path.is_dir():
            # 目錄備份
            return backup_path.exists() and any(backup_path.iterdir())

        return False


def format_size(size: int) -> str:
    """格式化檔案大小"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} PB"


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="自動備份工具 - AI 輔助開發",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s /source /backup                           # 完整備份
  %(prog)s /source /backup --incremental             # 增量備份
  %(prog)s /source /backup --compress zip            # 壓縮備份
  %(prog)s /source /backup --keep 7                  # 保留最近 7 個
  %(prog)s /source /backup --exclude "*.tmp,*.log"   # 排除特定檔案
        """
    )

    parser.add_argument('source',
                       help='來源目錄或檔案')
    parser.add_argument('destination',
                       help='備份目標目錄')

    # 備份選項
    parser.add_argument('-i', '--incremental', action='store_true',
                       help='增量備份（只備份變更的檔案）')
    parser.add_argument('-c', '--compress',
                       choices=['zip', 'tar', 'tar.gz', 'tgz'],
                       help='壓縮格式')
    parser.add_argument('-k', '--keep', type=int, default=7,
                       help='保留最近 N 個備份（預設：7）')
    parser.add_argument('-e', '--exclude', metavar='PATTERNS',
                       help='排除模式（逗號分隔）')
    parser.add_argument('-v', '--verify', action='store_true',
                       help='驗證備份完整性')
    parser.add_argument('--dry-run', action='store_true',
                       help='模擬執行（不實際備份）')

    args = parser.parse_args()

    # 轉換路徑
    source = Path(args.source).resolve()
    destination = Path(args.destination).resolve()

    # 檢查來源
    if not source.exists():
        print(f"錯誤: 來源不存在: {source}", file=sys.stderr)
        sys.exit(1)

    # 解析排除模式
    exclude_patterns = []
    if args.exclude:
        exclude_patterns = [p.strip() for p in args.exclude.split(',')]

    # 建立備份管理器
    manager = BackupManager(
        source=source,
        destination=destination,
        compress=args.compress,
        incremental=args.incremental,
        exclude_patterns=exclude_patterns
    )

    # 執行備份
    print(f"開始備份: {source} -> {destination}")
    print(f"模式: {'增量' if args.incremental else '完整'}")
    if args.compress:
        print(f"壓縮: {args.compress}")
    print()

    if args.dry_run:
        print("=== 模擬執行模式 ===\n")

    try:
        if not args.dry_run:
            result = manager.backup_files()

            # 顯示結果
            print("\n=== 備份完成 ===")
            print(f"備份位置: {result['backup_path']}")
            print(f"已複製: {result['stats']['files_copied']} 個檔案")
            print(f"已跳過: {result['stats']['files_skipped']} 個檔案")
            print(f"總大小: {format_size(result['stats']['total_size'])}")

            if result['stats']['errors']:
                print(f"\n錯誤: {len(result['stats']['errors'])} 個")
                for error in result['stats']['errors'][:5]:  # 只顯示前 5 個
                    print(f"  {error['file']}: {error['error']}")

            # 驗證備份
            if args.verify:
                print("\n驗證備份...")
                backup_path = Path(result['backup_path'])
                if manager.verify_backup(backup_path):
                    print("✓ 備份驗證成功")
                else:
                    print("✗ 備份驗證失敗", file=sys.stderr)
                    sys.exit(1)

            # 清理舊備份
            if args.keep > 0:
                print(f"\n清理舊備份（保留最近 {args.keep} 個）...")
                manager.cleanup_old_backups(keep=args.keep)

        else:
            print("備份已取消（模擬執行模式）")

    except Exception as e:
        print(f"\n錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
