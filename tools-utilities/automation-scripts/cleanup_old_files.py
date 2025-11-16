#!/usr/bin/env python3
"""
cleanup_old_files.py - 舊檔案清理工具

自動清理指定目錄中的舊檔案，支援多種過濾條件。
"""

import os
import sys
import argparse
import shutil
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Tuple
import fnmatch

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_size(size_str: str) -> int:
    """
    解析大小字符串（如 100M, 1G）為字節數

    Args:
        size_str: 大小字符串（如 "100M", "1.5G", "500K"）

    Returns:
        int: 字節數
    """
    units = {
        'K': 1024,
        'M': 1024 ** 2,
        'G': 1024 ** 3,
        'T': 1024 ** 4
    }

    size_str = size_str.upper().strip()
    if size_str[-1] in units:
        return int(float(size_str[:-1]) * units[size_str[-1]])
    return int(size_str)


def get_file_size_str(size_bytes: int) -> str:
    """
    將字節數轉換為人類可讀的格式

    Args:
        size_bytes: 字節數

    Returns:
        str: 格式化的大小字符串
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"


def should_delete_file(
    file_path: Path,
    days: int = None,
    size_gt: int = None,
    size_lt: int = None,
    pattern: str = None
) -> bool:
    """
    判斷檔案是否應該被刪除

    Args:
        file_path: 檔案路徑
        days: 天數閾值（刪除 N 天前的檔案）
        size_gt: 大小上限（刪除大於此大小的檔案）
        size_lt: 大小下限（刪除小於此大小的檔案）
        pattern: 檔案名稱模式

    Returns:
        bool: 是否應該刪除
    """
    try:
        # 檢查檔案名稱模式
        if pattern and not fnmatch.fnmatch(file_path.name, pattern):
            return False

        stat = file_path.stat()

        # 檢查修改時間
        if days is not None:
            mtime = datetime.fromtimestamp(stat.st_mtime)
            cutoff_date = datetime.now() - timedelta(days=days)
            if mtime > cutoff_date:
                return False

        # 檢查檔案大小
        if size_gt is not None and stat.st_size <= size_gt:
            return False

        if size_lt is not None and stat.st_size >= size_lt:
            return False

        return True
    except Exception as e:
        logger.warning(f"檢查檔案時出錯 {file_path}: {e}")
        return False


def find_files_to_delete(
    directory: Path,
    days: int = None,
    size_gt: int = None,
    size_lt: int = None,
    pattern: str = None,
    recursive: bool = False
) -> List[Path]:
    """
    查找需要刪除的檔案

    Args:
        directory: 搜索目錄
        days: 天數閾值
        size_gt: 大小上限
        size_lt: 大小下限
        pattern: 檔案名稱模式
        recursive: 是否遞迴搜索

    Returns:
        List[Path]: 需要刪除的檔案列表
    """
    files_to_delete = []

    try:
        if recursive:
            iterator = directory.rglob('*')
        else:
            iterator = directory.glob('*')

        for item in iterator:
            if item.is_file():
                if should_delete_file(item, days, size_gt, size_lt, pattern):
                    files_to_delete.append(item)
    except Exception as e:
        logger.error(f"搜索檔案時出錯: {e}")

    return files_to_delete


def delete_files(
    files: List[Path],
    safe_mode: bool = False,
    trash_dir: Path = None
) -> Tuple[int, int, int]:
    """
    刪除檔案

    Args:
        files: 要刪除的檔案列表
        safe_mode: 安全模式（移到垃圾桶而非永久刪除）
        trash_dir: 垃圾桶目錄

    Returns:
        Tuple[int, int, int]: (成功數, 失敗數, 總大小)
    """
    success_count = 0
    fail_count = 0
    total_size = 0

    for file_path in files:
        try:
            file_size = file_path.stat().st_size

            if safe_mode and trash_dir:
                # 安全模式：移動到垃圾桶
                trash_dir.mkdir(parents=True, exist_ok=True)
                dest = trash_dir / file_path.name

                # 處理重名檔案
                counter = 1
                while dest.exists():
                    dest = trash_dir / f"{file_path.stem}_{counter}{file_path.suffix}"
                    counter += 1

                shutil.move(str(file_path), str(dest))
                logger.info(f"已移動到垃圾桶: {file_path} -> {dest}")
            else:
                # 永久刪除
                file_path.unlink()
                logger.info(f"已刪除: {file_path}")

            success_count += 1
            total_size += file_size
        except Exception as e:
            logger.error(f"刪除檔案失敗 {file_path}: {e}")
            fail_count += 1

    return success_count, fail_count, total_size


def cleanup_old_files(args):
    """
    主要清理函數

    Args:
        args: 命令列參數
    """
    directory = Path(args.directory).resolve()

    # 驗證目錄
    if not directory.exists():
        logger.error(f"目錄不存在: {directory}")
        sys.exit(1)

    if not directory.is_dir():
        logger.error(f"路徑不是目錄: {directory}")
        sys.exit(1)

    # 解析大小參數
    size_gt = parse_size(args.size_gt) if args.size_gt else None
    size_lt = parse_size(args.size_lt) if args.size_lt else None

    logger.info(f"開始掃描目錄: {directory}")
    logger.info(f"遞迴搜索: {args.recursive}")
    if args.days:
        logger.info(f"刪除 {args.days} 天前的檔案")
    if size_gt:
        logger.info(f"刪除大於 {get_file_size_str(size_gt)} 的檔案")
    if size_lt:
        logger.info(f"刪除小於 {get_file_size_str(size_lt)} 的檔案")
    if args.pattern:
        logger.info(f"檔案模式: {args.pattern}")

    # 查找要刪除的檔案
    files_to_delete = find_files_to_delete(
        directory,
        days=args.days,
        size_gt=size_gt,
        size_lt=size_lt,
        pattern=args.pattern,
        recursive=args.recursive
    )

    if not files_to_delete:
        logger.info("沒有找到符合條件的檔案")
        return

    logger.info(f"找到 {len(files_to_delete)} 個符合條件的檔案")

    # 顯示將要刪除的檔案
    if args.verbose or args.dry_run:
        print("\n將要刪除的檔案：")
        print("-" * 80)
        total_size = 0
        for i, file_path in enumerate(files_to_delete, 1):
            size = file_path.stat().st_size
            mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
            total_size += size
            print(f"{i}. {file_path}")
            print(f"   大小: {get_file_size_str(size)}")
            print(f"   修改時間: {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 80)
        print(f"總計: {len(files_to_delete)} 個檔案, {get_file_size_str(total_size)}")
        print()

    # Dry run 模式：只顯示不刪除
    if args.dry_run:
        logger.info("Dry run 模式：不會實際刪除檔案")
        return

    # 確認刪除
    if not args.force:
        response = input(f"確定要刪除這 {len(files_to_delete)} 個檔案嗎？ (y/N): ")
        if response.lower() != 'y':
            logger.info("操作已取消")
            return

    # 準備垃圾桶目錄（如果使用安全模式）
    trash_dir = None
    if args.safe_mode:
        trash_dir = Path(args.trash_dir or (directory / ".trash"))
        logger.info(f"安全模式：檔案將移動到 {trash_dir}")

    # 刪除檔案
    logger.info("開始刪除檔案...")
    success, fail, total_size = delete_files(
        files_to_delete,
        safe_mode=args.safe_mode,
        trash_dir=trash_dir
    )

    # 顯示結果
    print("\n清理結果：")
    print("-" * 80)
    print(f"成功: {success} 個檔案")
    print(f"失敗: {fail} 個檔案")
    print(f"釋放空間: {get_file_size_str(total_size)}")
    print("-" * 80)

    if args.safe_mode and trash_dir:
        print(f"\n垃圾桶位置: {trash_dir}")
        print("若要永久刪除，請手動清空垃圾桶")


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description='舊檔案清理工具 - 自動清理指定目錄中的舊檔案',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用範例:
  # 刪除 30 天前的檔案
  %(prog)s /tmp --days 30

  # 清理大於 100MB 的檔案
  %(prog)s /downloads --size-gt 100M

  # 只清理 .log 檔案
  %(prog)s /var/log --pattern "*.log"

  # 安全模式（移至垃圾桶）
  %(prog)s /temp --days 7 --safe-mode

  # 預覽模式（不實際刪除）
  %(prog)s /data --days 90 --dry-run

  # 遞迴清理子目錄
  %(prog)s /projects --days 180 --recursive
        """
    )

    parser.add_argument(
        'directory',
        help='要清理的目錄路徑'
    )

    parser.add_argument(
        '--days',
        type=int,
        help='刪除 N 天前的檔案'
    )

    parser.add_argument(
        '--size-gt',
        help='刪除大於此大小的檔案（如 100M, 1G）'
    )

    parser.add_argument(
        '--size-lt',
        help='刪除小於此大小的檔案（如 10K, 1M）'
    )

    parser.add_argument(
        '--pattern',
        help='檔案名稱模式（如 "*.log", "temp_*"）'
    )

    parser.add_argument(
        '--recursive', '-r',
        action='store_true',
        help='遞迴處理子目錄'
    )

    parser.add_argument(
        '--safe-mode',
        action='store_true',
        help='安全模式：移動檔案到垃圾桶而非刪除'
    )

    parser.add_argument(
        '--trash-dir',
        help='垃圾桶目錄路徑（預設為 <directory>/.trash）'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='預覽模式：只顯示將要刪除的檔案，不實際刪除'
    )

    parser.add_argument(
        '--force', '-f',
        action='store_true',
        help='強制刪除，不需要確認'
    )

    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='顯示詳細資訊'
    )

    args = parser.parse_args()

    # 至少要有一個過濾條件
    if not any([args.days, args.size_gt, args.size_lt, args.pattern]):
        parser.error('至少需要一個過濾條件：--days, --size-gt, --size-lt, 或 --pattern')

    try:
        cleanup_old_files(args)
    except KeyboardInterrupt:
        logger.info("\n操作已被用戶中斷")
        sys.exit(0)
    except Exception as e:
        logger.error(f"發生錯誤: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
