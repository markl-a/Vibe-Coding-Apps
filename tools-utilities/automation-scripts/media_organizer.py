#!/usr/bin/env python3
"""
media_organizer.py - 媒體檔案智能整理工具
使用 AI 輔助開發的智能媒體檔案整理腳本

功能：
- 按日期/類型自動分類
- 提取照片 EXIF 數據
- 智能重命名
- 去重檢測
- 支援圖片、影片、音訊
"""

import os
import sys
import argparse
import logging
import hashlib
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import json

try:
    from PIL import Image
    from PIL.ExifTags import TAGS
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    logger = logging.getLogger(__name__)
    logger.warning("未安裝 Pillow，EXIF 功能將不可用")

try:
    from utils import ProgressBar, format_size
except ImportError:
    ProgressBar = None
    def format_size(size):
        return f"{size} bytes"

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# 媒體類型定義
MEDIA_TYPES = {
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.heic'],
    'video': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'],
    'audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma']
}


class MediaFile:
    """媒體檔案類"""

    def __init__(self, file_path: Path):
        """
        初始化媒體檔案

        Args:
            file_path: 檔案路徑
        """
        self.path = file_path
        self.name = file_path.name
        self.suffix = file_path.suffix.lower()
        self.size = file_path.stat().st_size
        self.mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
        self.media_type = self._detect_media_type()
        self.hash = None
        self.exif = None

    def _detect_media_type(self) -> Optional[str]:
        """檢測媒體類型"""
        for media_type, extensions in MEDIA_TYPES.items():
            if self.suffix in extensions:
                return media_type
        return None

    def calculate_hash(self) -> str:
        """計算檔案 MD5 雜湊值"""
        if self.hash:
            return self.hash

        try:
            md5 = hashlib.md5()
            with open(self.path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b''):
                    md5.update(chunk)
            self.hash = md5.hexdigest()
            return self.hash
        except Exception as e:
            logger.error(f"計算雜湊值失敗 {self.path}: {e}")
            return ""

    def extract_exif(self) -> Optional[Dict]:
        """提取 EXIF 數據"""
        if not HAS_PIL or self.media_type != 'image':
            return None

        try:
            image = Image.open(self.path)
            exif_data = image._getexif()

            if not exif_data:
                return None

            exif = {}
            for tag_id, value in exif_data.items():
                tag = TAGS.get(tag_id, tag_id)
                exif[tag] = value

            self.exif = exif
            return exif

        except Exception as e:
            logger.debug(f"提取 EXIF 失敗 {self.path}: {e}")
            return None

    def get_capture_date(self) -> Optional[datetime]:
        """
        獲取拍攝日期

        Returns:
            Optional[datetime]: 拍攝日期
        """
        # 優先使用 EXIF 數據
        if self.exif:
            for date_tag in ['DateTimeOriginal', 'DateTime', 'DateTimeDigitized']:
                if date_tag in self.exif:
                    try:
                        date_str = self.exif[date_tag]
                        return datetime.strptime(date_str, '%Y:%m:%d %H:%M:%S')
                    except:
                        pass

        # 使用檔案修改時間
        return self.mtime


class MediaOrganizer:
    """媒體檔案整理器"""

    def __init__(
        self,
        source_dir: Path,
        target_dir: Path,
        organize_by: str = 'date',
        dry_run: bool = False,
        move_files: bool = False,
        remove_duplicates: bool = False
    ):
        """
        初始化整理器

        Args:
            source_dir: 源目錄
            target_dir: 目標目錄
            organize_by: 整理方式 (date, type, date_type)
            dry_run: 模擬執行
            move_files: 移動檔案（而非複製）
            remove_duplicates: 移除重複檔案
        """
        self.source_dir = source_dir
        self.target_dir = target_dir
        self.organize_by = organize_by
        self.dry_run = dry_run
        self.move_files = move_files
        self.remove_duplicates = remove_duplicates

        self.stats = {
            'total_files': 0,
            'processed': 0,
            'skipped': 0,
            'duplicates': 0,
            'errors': 0,
            'total_size': 0
        }

        self.file_hashes = {}  # 用於去重

    def scan_media_files(self) -> List[MediaFile]:
        """
        掃描媒體檔案

        Returns:
            List[MediaFile]: 媒體檔案列表
        """
        logger.info(f"掃描目錄: {self.source_dir}")

        media_files = []
        all_extensions = [ext for exts in MEDIA_TYPES.values() for ext in exts]

        for file_path in self.source_dir.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in all_extensions:
                try:
                    media_file = MediaFile(file_path)
                    media_files.append(media_file)
                    self.stats['total_size'] += media_file.size
                except Exception as e:
                    logger.error(f"處理檔案失敗 {file_path}: {e}")

        self.stats['total_files'] = len(media_files)
        logger.info(f"找到 {len(media_files)} 個媒體檔案")

        return media_files

    def get_target_path(self, media_file: MediaFile) -> Path:
        """
        根據整理方式決定目標路徑

        Args:
            media_file: 媒體檔案

        Returns:
            Path: 目標路徑
        """
        # 提取 EXIF（如果是圖片）
        if media_file.media_type == 'image' and not media_file.exif:
            media_file.extract_exif()

        # 獲取日期
        date = media_file.get_capture_date()

        if self.organize_by == 'date':
            # 按日期整理: YYYY/MM
            folder = self.target_dir / date.strftime('%Y') / date.strftime('%m')

        elif self.organize_by == 'type':
            # 按類型整理: images/videos/audio
            folder = self.target_dir / f"{media_file.media_type}s"

        elif self.organize_by == 'date_type':
            # 按日期和類型整理: YYYY/MM/images
            folder = (
                self.target_dir /
                date.strftime('%Y') /
                date.strftime('%m') /
                f"{media_file.media_type}s"
            )

        else:
            # 預設：直接放在目標目錄
            folder = self.target_dir

        return folder / media_file.name

    def is_duplicate(self, media_file: MediaFile) -> bool:
        """
        檢查是否為重複檔案

        Args:
            media_file: 媒體檔案

        Returns:
            bool: 是否重複
        """
        if not self.remove_duplicates:
            return False

        file_hash = media_file.calculate_hash()

        if file_hash in self.file_hashes:
            return True

        self.file_hashes[file_hash] = media_file.path
        return False

    def organize(self):
        """執行整理"""
        logger.info(f"開始整理媒體檔案...")
        logger.info(f"整理方式: {self.organize_by}")
        logger.info(f"模式: {'模擬' if self.dry_run else ('移動' if self.move_files else '複製')}")

        # 掃描檔案
        media_files = self.scan_media_files()

        if not media_files:
            logger.warning("沒有找到媒體檔案")
            return

        # 建立進度條
        pbar_class = ProgressBar if ProgressBar else None

        if pbar_class:
            pbar = pbar_class(len(media_files), desc="整理檔案")
        else:
            pbar = None

        # 處理每個檔案
        for media_file in media_files:
            try:
                # 檢查是否重複
                if self.is_duplicate(media_file):
                    logger.info(f"跳過重複檔案: {media_file.name}")
                    self.stats['duplicates'] += 1
                    self.stats['skipped'] += 1
                    if pbar:
                        pbar.update(1)
                    continue

                # 獲取目標路徑
                target_path = self.get_target_path(media_file)

                # 如果目標檔案已存在，添加序號
                if target_path.exists() and not self.dry_run:
                    counter = 1
                    while target_path.exists():
                        new_name = f"{target_path.stem}_{counter}{target_path.suffix}"
                        target_path = target_path.parent / new_name
                        counter += 1

                # 執行操作
                if not self.dry_run:
                    # 創建目標目錄
                    target_path.parent.mkdir(parents=True, exist_ok=True)

                    # 移動或複製
                    if self.move_files:
                        shutil.move(str(media_file.path), str(target_path))
                        logger.debug(f"移動: {media_file.path} -> {target_path}")
                    else:
                        shutil.copy2(str(media_file.path), str(target_path))
                        logger.debug(f"複製: {media_file.path} -> {target_path}")

                    self.stats['processed'] += 1
                else:
                    logger.info(f"[模擬] {media_file.path} -> {target_path}")
                    self.stats['processed'] += 1

            except Exception as e:
                logger.error(f"處理檔案失敗 {media_file.path}: {e}")
                self.stats['errors'] += 1

            if pbar:
                pbar.update(1)

        if pbar:
            pbar.close()

    def print_summary(self):
        """列印摘要"""
        print("\n" + "=" * 80)
        print("媒體檔案整理報告")
        print("=" * 80)

        if self.dry_run:
            print("⚠️  模擬模式：未實際移動/複製檔案\n")

        print(f"總檔案數: {self.stats['total_files']}")
        print(f"已處理: {self.stats['processed']}")
        print(f"已跳過: {self.stats['skipped']}")
        print(f"重複檔案: {self.stats['duplicates']}")
        print(f"錯誤: {self.stats['errors']}")
        print(f"總大小: {format_size(self.stats['total_size'])}")

        print("=" * 80)


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description='媒體檔案智能整理工具 - 自動分類和整理照片、影片、音訊',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用範例:
  # 按日期整理（複製模式）
  %(prog)s /source/photos /organized/photos --by date

  # 按類型整理（移動模式）
  %(prog)s /source/media /organized/media --by type --move

  # 按日期和類型整理
  %(prog)s /source /target --by date_type

  # 移除重複檔案
  %(prog)s /source /target --remove-duplicates

  # 模擬執行（預覽）
  %(prog)s /source /target --dry-run

整理方式:
  - date: 按拍攝/修改日期 (YYYY/MM/)
  - type: 按媒體類型 (images/, videos/, audio/)
  - date_type: 按日期和類型 (YYYY/MM/images/)
        """
    )

    parser.add_argument(
        'source',
        help='源目錄'
    )

    parser.add_argument(
        'target',
        help='目標目錄'
    )

    parser.add_argument(
        '--by',
        choices=['date', 'type', 'date_type'],
        default='date',
        help='整理方式（預設: date）'
    )

    parser.add_argument(
        '--move',
        action='store_true',
        help='移動檔案（而非複製）'
    )

    parser.add_argument(
        '--remove-duplicates',
        action='store_true',
        help='移除重複檔案'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='模擬執行（不實際移動/複製檔案）'
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

    # 驗證路徑
    source_dir = Path(args.source).resolve()
    target_dir = Path(args.target).resolve()

    if not source_dir.exists():
        logger.error(f"源目錄不存在: {source_dir}")
        sys.exit(1)

    if not source_dir.is_dir():
        logger.error(f"源路徑不是目錄: {source_dir}")
        sys.exit(1)

    # 創建整理器
    organizer = MediaOrganizer(
        source_dir=source_dir,
        target_dir=target_dir,
        organize_by=args.by,
        dry_run=args.dry_run,
        move_files=args.move,
        remove_duplicates=args.remove_duplicates
    )

    try:
        # 執行整理
        organizer.organize()

        # 列印摘要
        organizer.print_summary()

        # 設定退出碼
        if organizer.stats['errors'] > 0:
            sys.exit(1)
        else:
            sys.exit(0)

    except KeyboardInterrupt:
        logger.info("\n整理已中斷")
        sys.exit(0)
    except Exception as e:
        logger.error(f"發生錯誤: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
