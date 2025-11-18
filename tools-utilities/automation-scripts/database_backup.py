#!/usr/bin/env python3
"""
database_backup.py - 數據庫備份工具
使用 AI 輔助開發的智能數據庫備份腳本

支援的數據庫：
- MySQL / MariaDB
- PostgreSQL
- MongoDB
- SQLite
"""

import os
import sys
import argparse
import logging
import subprocess
import gzip
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, List
import json

try:
    from utils import Notifier, format_size, ProgressBar
except ImportError:
    Notifier = None
    ProgressBar = None
    def format_size(size):
        return f"{size} bytes"

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseBackup:
    """數據庫備份基類"""

    def __init__(
        self,
        backup_dir: Path,
        compress: bool = True,
        keep_backups: int = 7
    ):
        """
        初始化備份器

        Args:
            backup_dir: 備份目錄
            compress: 是否壓縮
            keep_backups: 保留備份數量
        """
        self.backup_dir = backup_dir
        self.compress = compress
        self.keep_backups = keep_backups
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def cleanup_old_backups(self, prefix: str):
        """
        清理舊備份

        Args:
            prefix: 備份文件前綴
        """
        try:
            # 找出所有備份文件
            backups = sorted(
                [f for f in self.backup_dir.glob(f"{prefix}*") if f.is_file()],
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )

            # 刪除多餘的備份
            for old_backup in backups[self.keep_backups:]:
                logger.info(f"刪除舊備份: {old_backup.name}")
                old_backup.unlink()

        except Exception as e:
            logger.error(f"清理舊備份失敗: {e}")

    def compress_file(self, file_path: Path) -> Optional[Path]:
        """
        壓縮文件

        Args:
            file_path: 要壓縮的文件

        Returns:
            Optional[Path]: 壓縮後的文件路徑
        """
        try:
            gz_path = Path(f"{file_path}.gz")
            logger.info(f"壓縮備份: {file_path.name}")

            with open(file_path, 'rb') as f_in:
                with gzip.open(gz_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)

            # 刪除原文件
            file_path.unlink()

            return gz_path

        except Exception as e:
            logger.error(f"壓縮失敗: {e}")
            return None


class MySQLBackup(DatabaseBackup):
    """MySQL/MariaDB 備份器"""

    def __init__(
        self,
        host: str,
        user: str,
        password: str,
        database: str,
        port: int = 3306,
        **kwargs
    ):
        """初始化 MySQL 備份器"""
        super().__init__(**kwargs)
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.port = port

    def backup(self) -> Optional[Path]:
        """
        執行備份

        Returns:
            Optional[Path]: 備份文件路徑
        """
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"mysql_{self.database}_{timestamp}.sql"
            backup_file = self.backup_dir / filename

            logger.info(f"開始備份 MySQL 數據庫: {self.database}")

            # 構建 mysqldump 命令
            cmd = [
                'mysqldump',
                f'--host={self.host}',
                f'--port={self.port}',
                f'--user={self.user}',
                f'--password={self.password}',
                '--single-transaction',
                '--quick',
                '--lock-tables=false',
                self.database
            ]

            # 執行備份
            with open(backup_file, 'w') as f:
                result = subprocess.run(
                    cmd,
                    stdout=f,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=3600
                )

            if result.returncode != 0:
                logger.error(f"備份失敗: {result.stderr}")
                if backup_file.exists():
                    backup_file.unlink()
                return None

            file_size = backup_file.stat().st_size
            logger.info(f"備份完成: {backup_file.name} ({format_size(file_size)})")

            # 壓縮
            if self.compress:
                compressed_file = self.compress_file(backup_file)
                if compressed_file:
                    backup_file = compressed_file

            # 清理舊備份
            self.cleanup_old_backups(f"mysql_{self.database}_")

            return backup_file

        except subprocess.TimeoutExpired:
            logger.error("備份超時")
            return None
        except Exception as e:
            logger.error(f"備份失敗: {e}")
            return None


class PostgreSQLBackup(DatabaseBackup):
    """PostgreSQL 備份器"""

    def __init__(
        self,
        host: str,
        user: str,
        password: str,
        database: str,
        port: int = 5432,
        **kwargs
    ):
        """初始化 PostgreSQL 備份器"""
        super().__init__(**kwargs)
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.port = port

    def backup(self) -> Optional[Path]:
        """執行備份"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"postgresql_{self.database}_{timestamp}.sql"
            backup_file = self.backup_dir / filename

            logger.info(f"開始備份 PostgreSQL 數據庫: {self.database}")

            # 設定環境變數
            env = os.environ.copy()
            env['PGPASSWORD'] = self.password

            # 構建 pg_dump 命令
            cmd = [
                'pg_dump',
                f'--host={self.host}',
                f'--port={self.port}',
                f'--username={self.user}',
                '--no-password',
                '--clean',
                '--if-exists',
                self.database
            ]

            # 執行備份
            with open(backup_file, 'w') as f:
                result = subprocess.run(
                    cmd,
                    stdout=f,
                    stderr=subprocess.PIPE,
                    text=True,
                    env=env,
                    timeout=3600
                )

            if result.returncode != 0:
                logger.error(f"備份失敗: {result.stderr}")
                if backup_file.exists():
                    backup_file.unlink()
                return None

            file_size = backup_file.stat().st_size
            logger.info(f"備份完成: {backup_file.name} ({format_size(file_size)})")

            # 壓縮
            if self.compress:
                compressed_file = self.compress_file(backup_file)
                if compressed_file:
                    backup_file = compressed_file

            # 清理舊備份
            self.cleanup_old_backups(f"postgresql_{self.database}_")

            return backup_file

        except Exception as e:
            logger.error(f"備份失敗: {e}")
            return None


class MongoDBBackup(DatabaseBackup):
    """MongoDB 備份器"""

    def __init__(
        self,
        host: str,
        database: str,
        user: Optional[str] = None,
        password: Optional[str] = None,
        port: int = 27017,
        **kwargs
    ):
        """初始化 MongoDB 備份器"""
        super().__init__(**kwargs)
        self.host = host
        self.database = database
        self.user = user
        self.password = password
        self.port = port

    def backup(self) -> Optional[Path]:
        """執行備份"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            dirname = f"mongodb_{self.database}_{timestamp}"
            backup_path = self.backup_dir / dirname

            logger.info(f"開始備份 MongoDB 數據庫: {self.database}")

            # 構建 mongodump 命令
            cmd = [
                'mongodump',
                f'--host={self.host}',
                f'--port={self.port}',
                f'--db={self.database}',
                f'--out={backup_path}'
            ]

            if self.user and self.password:
                cmd.extend([
                    f'--username={self.user}',
                    f'--password={self.password}',
                    '--authenticationDatabase=admin'
                ])

            # 執行備份
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=3600
            )

            if result.returncode != 0:
                logger.error(f"備份失敗: {result.stderr}")
                if backup_path.exists():
                    shutil.rmtree(backup_path)
                return None

            logger.info(f"備份完成: {dirname}")

            # 壓縮整個目錄
            if self.compress:
                archive_path = self.backup_dir / f"{dirname}.tar.gz"
                logger.info(f"壓縮備份: {dirname}")

                subprocess.run(
                    ['tar', '-czf', str(archive_path), '-C', str(self.backup_dir), dirname],
                    check=True
                )

                # 刪除原目錄
                shutil.rmtree(backup_path)
                backup_path = archive_path

            # 清理舊備份
            self.cleanup_old_backups(f"mongodb_{self.database}_")

            return backup_path

        except Exception as e:
            logger.error(f"備份失敗: {e}")
            return None


class SQLiteBackup(DatabaseBackup):
    """SQLite 備份器"""

    def __init__(
        self,
        database_file: Path,
        **kwargs
    ):
        """初始化 SQLite 備份器"""
        super().__init__(**kwargs)
        self.database_file = Path(database_file)

    def backup(self) -> Optional[Path]:
        """執行備份"""
        try:
            if not self.database_file.exists():
                logger.error(f"數據庫文件不存在: {self.database_file}")
                return None

            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            db_name = self.database_file.stem
            filename = f"sqlite_{db_name}_{timestamp}.db"
            backup_file = self.backup_dir / filename

            logger.info(f"開始備份 SQLite 數據庫: {self.database_file}")

            # 複製數據庫文件
            shutil.copy2(self.database_file, backup_file)

            file_size = backup_file.stat().st_size
            logger.info(f"備份完成: {backup_file.name} ({format_size(file_size)})")

            # 壓縮
            if self.compress:
                compressed_file = self.compress_file(backup_file)
                if compressed_file:
                    backup_file = compressed_file

            # 清理舊備份
            self.cleanup_old_backups(f"sqlite_{db_name}_")

            return backup_file

        except Exception as e:
            logger.error(f"備份失敗: {e}")
            return None


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description='數據庫備份工具 - 支援 MySQL、PostgreSQL、MongoDB、SQLite',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用範例:
  # 備份 MySQL 數據庫
  %(prog)s --type mysql --host localhost --user root --password secret --database mydb

  # 備份 PostgreSQL 數據庫
  %(prog)s --type postgresql --host localhost --user postgres --password secret --database mydb

  # 備份 MongoDB 數據庫
  %(prog)s --type mongodb --host localhost --database mydb

  # 備份 SQLite 數據庫
  %(prog)s --type sqlite --file /path/to/database.db

  # 使用配置文件
  %(prog)s --config db_backup_config.json

配置文件格式 (JSON):
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": "secret",
  "database": "mydb",
  "backup_dir": "/backups",
  "compress": true,
  "keep_backups": 7
}
        """
    )

    parser.add_argument(
        '--config',
        help='配置文件路徑'
    )

    parser.add_argument(
        '--type',
        choices=['mysql', 'postgresql', 'mongodb', 'sqlite'],
        help='數據庫類型'
    )

    parser.add_argument(
        '--host',
        default='localhost',
        help='數據庫主機（預設: localhost）'
    )

    parser.add_argument(
        '--port',
        type=int,
        help='數據庫端口'
    )

    parser.add_argument(
        '--user',
        help='數據庫用戶名'
    )

    parser.add_argument(
        '--password',
        help='數據庫密碼'
    )

    parser.add_argument(
        '--database',
        help='數據庫名稱'
    )

    parser.add_argument(
        '--file',
        help='SQLite 數據庫文件路徑'
    )

    parser.add_argument(
        '--backup-dir',
        default='./backups',
        help='備份目錄（預設: ./backups）'
    )

    parser.add_argument(
        '--no-compress',
        action='store_true',
        help='不壓縮備份文件'
    )

    parser.add_argument(
        '--keep',
        type=int,
        default=7,
        help='保留備份數量（預設: 7）'
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

    # 載入配置
    config = {}
    if args.config:
        try:
            with open(args.config, 'r') as f:
                config = json.load(f)
        except Exception as e:
            logger.error(f"載入配置文件失敗: {e}")
            sys.exit(1)

    # 合併命令列參數和配置文件
    db_type = args.type or config.get('type')
    host = args.host or config.get('host', 'localhost')
    port = args.port or config.get('port')
    user = args.user or config.get('user')
    password = args.password or config.get('password')
    database = args.database or config.get('database')
    db_file = args.file or config.get('file')
    backup_dir = Path(args.backup_dir or config.get('backup_dir', './backups'))
    compress = not args.no_compress and config.get('compress', True)
    keep_backups = args.keep or config.get('keep_backups', 7)

    # 驗證參數
    if not db_type:
        parser.error('請指定數據庫類型（--type 或配置文件）')

    # 創建備份器
    try:
        backup_kwargs = {
            'backup_dir': backup_dir,
            'compress': compress,
            'keep_backups': keep_backups
        }

        if db_type == 'mysql':
            if not all([host, user, password, database]):
                parser.error('MySQL 需要指定: host, user, password, database')

            if not port:
                port = 3306

            backup_handler = MySQLBackup(
                host=host,
                user=user,
                password=password,
                database=database,
                port=port,
                **backup_kwargs
            )

        elif db_type == 'postgresql':
            if not all([host, user, password, database]):
                parser.error('PostgreSQL 需要指定: host, user, password, database')

            if not port:
                port = 5432

            backup_handler = PostgreSQLBackup(
                host=host,
                user=user,
                password=password,
                database=database,
                port=port,
                **backup_kwargs
            )

        elif db_type == 'mongodb':
            if not database:
                parser.error('MongoDB 需要指定: database')

            if not port:
                port = 27017

            backup_handler = MongoDBBackup(
                host=host,
                database=database,
                user=user,
                password=password,
                port=port,
                **backup_kwargs
            )

        elif db_type == 'sqlite':
            if not db_file:
                parser.error('SQLite 需要指定: --file')

            backup_handler = SQLiteBackup(
                database_file=db_file,
                **backup_kwargs
            )

        else:
            parser.error(f'不支援的數據庫類型: {db_type}')
            return

        # 執行備份
        backup_file = backup_handler.backup()

        if backup_file:
            print("\n" + "=" * 80)
            print("備份完成")
            print("=" * 80)
            print(f"備份文件: {backup_file}")
            print(f"文件大小: {format_size(backup_file.stat().st_size)}")
            print("=" * 80)
            sys.exit(0)
        else:
            logger.error("備份失敗")
            sys.exit(1)

    except Exception as e:
        logger.error(f"發生錯誤: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
