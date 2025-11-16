#!/usr/bin/env python3
"""
log_rotator.py - 日誌輪替工具

自動化日誌檔案管理和輪替，支援基於大小和時間的輪替策略。
"""

import os
import sys
import argparse
import gzip
import shutil
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Optional
import re

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_size(size_str: str) -> int:
    """
    解析大小字符串為字節數

    Args:
        size_str: 大小字符串（如 "10M", "1G"）

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


def compress_file(source: Path, delete_source: bool = True) -> Optional[Path]:
    """
    壓縮檔案為 gzip 格式

    Args:
        source: 源檔案路徑
        delete_source: 是否刪除源檔案

    Returns:
        Optional[Path]: 壓縮後的檔案路徑，失敗則返回 None
    """
    try:
        dest = Path(f"{source}.gz")
        logger.info(f"壓縮檔案: {source} -> {dest}")

        with open(source, 'rb') as f_in:
            with gzip.open(dest, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)

        if delete_source:
            source.unlink()
            logger.info(f"已刪除源檔案: {source}")

        return dest
    except Exception as e:
        logger.error(f"壓縮檔案失敗 {source}: {e}")
        return None


def rotate_log(
    log_file: Path,
    max_backups: int = 7,
    compress: bool = False
) -> bool:
    """
    輪替日誌檔案

    Args:
        log_file: 日誌檔案路徑
        max_backups: 保留的備份數量
        compress: 是否壓縮舊日誌

    Returns:
        bool: 是否成功
    """
    try:
        if not log_file.exists():
            logger.warning(f"日誌檔案不存在: {log_file}")
            return False

        # 生成備份檔案名稱（帶時間戳）
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"{log_file.stem}.{timestamp}{log_file.suffix}"
        backup_path = log_file.parent / backup_name

        # 移動當前日誌為備份
        logger.info(f"輪替日誌: {log_file} -> {backup_path}")
        shutil.move(str(log_file), str(backup_path))

        # 創建新的空日誌檔案
        log_file.touch()
        logger.info(f"創建新日誌檔案: {log_file}")

        # 壓縮備份（如果啟用）
        if compress:
            compressed = compress_file(backup_path)
            if compressed:
                backup_path = compressed

        # 清理舊備份
        cleanup_old_backups(log_file, max_backups, compress)

        return True
    except Exception as e:
        logger.error(f"輪替日誌失敗: {e}")
        return False


def get_backup_files(log_file: Path, compressed: bool = False) -> List[Path]:
    """
    獲取日誌的備份檔案列表

    Args:
        log_file: 日誌檔案路徑
        compressed: 是否包含壓縮檔案

    Returns:
        List[Path]: 備份檔案列表（按修改時間排序）
    """
    pattern = f"{log_file.stem}.*{log_file.suffix}"
    if compressed:
        pattern += "*"  # 包含 .gz 檔案

    backup_files = []
    for file in log_file.parent.glob(pattern):
        if file != log_file and file.is_file():
            # 檢查是否符合備份檔案名稱格式
            if re.match(rf"{re.escape(log_file.stem)}\.\d{{8}}_\d{{6}}{re.escape(log_file.suffix)}(\.gz)?$", file.name):
                backup_files.append(file)

    # 按修改時間排序（新到舊）
    backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    return backup_files


def cleanup_old_backups(log_file: Path, max_backups: int, compressed: bool = False):
    """
    清理超過保留數量的舊備份

    Args:
        log_file: 日誌檔案路徑
        max_backups: 保留的備份數量
        compressed: 是否包含壓縮檔案
    """
    backup_files = get_backup_files(log_file, compressed=True)

    if len(backup_files) <= max_backups:
        return

    # 刪除多餘的舊備份
    files_to_delete = backup_files[max_backups:]
    for file in files_to_delete:
        try:
            file.unlink()
            logger.info(f"刪除舊備份: {file}")
        except Exception as e:
            logger.error(f"刪除備份失敗 {file}: {e}")


def rotate_by_size(
    log_file: Path,
    max_size: int,
    max_backups: int = 7,
    compress: bool = False
) -> bool:
    """
    基於大小輪替日誌

    Args:
        log_file: 日誌檔案路徑
        max_size: 最大檔案大小（字節）
        max_backups: 保留的備份數量
        compress: 是否壓縮

    Returns:
        bool: 是否進行了輪替
    """
    try:
        if not log_file.exists():
            logger.warning(f"日誌檔案不存在: {log_file}")
            return False

        current_size = log_file.stat().st_size

        if current_size >= max_size:
            logger.info(
                f"日誌檔案大小 ({get_file_size_str(current_size)}) "
                f"超過閾值 ({get_file_size_str(max_size)})，開始輪替"
            )
            return rotate_log(log_file, max_backups, compress)
        else:
            logger.info(
                f"日誌檔案大小 ({get_file_size_str(current_size)}) "
                f"未超過閾值 ({get_file_size_str(max_size)})，不需要輪替"
            )
            return False
    except Exception as e:
        logger.error(f"檢查日誌大小失敗: {e}")
        return False


def rotate_by_time(
    log_file: Path,
    period: str,
    max_backups: int = 30,
    compress: bool = False
) -> bool:
    """
    基於時間輪替日誌

    Args:
        log_file: 日誌檔案路徑
        period: 輪替週期（daily, weekly, monthly）
        max_backups: 保留的備份數量
        compress: 是否壓縮

    Returns:
        bool: 是否進行了輪替
    """
    try:
        if not log_file.exists():
            logger.warning(f"日誌檔案不存在: {log_file}")
            return False

        # 檢查是否需要輪替
        should_rotate = False
        mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
        now = datetime.now()

        if period == 'daily':
            should_rotate = mtime.date() < now.date()
        elif period == 'weekly':
            should_rotate = (now - mtime).days >= 7
        elif period == 'monthly':
            should_rotate = mtime.month != now.month or mtime.year != now.year

        if should_rotate:
            logger.info(f"日誌檔案需要 {period} 輪替")
            return rotate_log(log_file, max_backups, compress)
        else:
            logger.info(f"日誌檔案不需要 {period} 輪替")
            return False
    except Exception as e:
        logger.error(f"時間檢查失敗: {e}")
        return False


def force_rotate(
    log_file: Path,
    max_backups: int = 7,
    compress: bool = False
) -> bool:
    """
    強制輪替日誌

    Args:
        log_file: 日誌檔案路徑
        max_backups: 保留的備份數量
        compress: 是否壓縮

    Returns:
        bool: 是否成功
    """
    logger.info("強制輪替日誌")
    return rotate_log(log_file, max_backups, compress)


def list_backups(log_file: Path):
    """
    列出所有備份檔案

    Args:
        log_file: 日誌檔案路徑
    """
    backup_files = get_backup_files(log_file, compressed=True)

    if not backup_files:
        print(f"沒有找到 {log_file} 的備份檔案")
        return

    print(f"\n{log_file} 的備份檔案:")
    print("-" * 80)
    total_size = 0
    for i, file in enumerate(backup_files, 1):
        size = file.stat().st_size
        mtime = datetime.fromtimestamp(file.stat().st_mtime)
        total_size += size
        print(f"{i}. {file.name}")
        print(f"   大小: {get_file_size_str(size)}")
        print(f"   修改時間: {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 80)
    print(f"總計: {len(backup_files)} 個備份, {get_file_size_str(total_size)}")


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description='日誌輪替工具 - 自動化日誌檔案管理和輪替',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用範例:
  # 基於大小輪替（超過 10MB）
  %(prog)s /var/log/app.log --max-size 10M

  # 每日輪替
  %(prog)s /var/log/app.log --daily

  # 每週輪替並壓縮
  %(prog)s /var/log/app.log --weekly --compress

  # 保留最近 30 個備份
  %(prog)s /var/log/app.log --daily --keep 30

  # 強制輪替
  %(prog)s /var/log/app.log --force

  # 列出所有備份
  %(prog)s /var/log/app.log --list
        """
    )

    parser.add_argument(
        'log_file',
        help='日誌檔案路徑'
    )

    # 輪替策略
    strategy_group = parser.add_mutually_exclusive_group()
    strategy_group.add_argument(
        '--max-size',
        help='基於大小輪替（如 10M, 100M, 1G）'
    )
    strategy_group.add_argument(
        '--daily',
        action='store_true',
        help='每日輪替'
    )
    strategy_group.add_argument(
        '--weekly',
        action='store_true',
        help='每週輪替'
    )
    strategy_group.add_argument(
        '--monthly',
        action='store_true',
        help='每月輪替'
    )
    strategy_group.add_argument(
        '--force',
        action='store_true',
        help='強制輪替'
    )

    parser.add_argument(
        '--compress',
        action='store_true',
        help='壓縮舊日誌（使用 gzip）'
    )

    parser.add_argument(
        '--keep',
        type=int,
        default=7,
        help='保留的備份數量（預設: 7）'
    )

    parser.add_argument(
        '--list',
        action='store_true',
        help='列出所有備份檔案'
    )

    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='顯示詳細資訊'
    )

    args = parser.parse_args()

    # 設定日誌級別
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    log_file = Path(args.log_file).resolve()

    # 列出備份
    if args.list:
        list_backups(log_file)
        return

    # 執行輪替
    try:
        if args.force:
            success = force_rotate(log_file, args.keep, args.compress)
        elif args.max_size:
            max_size = parse_size(args.max_size)
            success = rotate_by_size(log_file, max_size, args.keep, args.compress)
        elif args.daily:
            success = rotate_by_time(log_file, 'daily', args.keep, args.compress)
        elif args.weekly:
            success = rotate_by_time(log_file, 'weekly', args.keep, args.compress)
        elif args.monthly:
            success = rotate_by_time(log_file, 'monthly', args.keep, args.compress)
        else:
            parser.error('請指定輪替策略：--max-size, --daily, --weekly, --monthly, 或 --force')

        if success:
            logger.info("日誌輪替完成")
            sys.exit(0)
        else:
            logger.info("未進行日誌輪替")
            sys.exit(0)
    except KeyboardInterrupt:
        logger.info("\n操作已被用戶中斷")
        sys.exit(0)
    except Exception as e:
        logger.error(f"發生錯誤: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
