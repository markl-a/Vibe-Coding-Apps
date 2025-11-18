"""
日志系统

提供统一的日志记录功能，支持文件和控制台输出
"""

import logging
import sys
from pathlib import Path
from typing import Optional
from datetime import datetime


class ColoredFormatter(logging.Formatter):
    """带颜色的日志格式化器"""

    # ANSI颜色代码
    COLORS = {
        'DEBUG': '\033[36m',     # 青色
        'INFO': '\033[32m',      # 绿色
        'WARNING': '\033[33m',   # 黄色
        'ERROR': '\033[31m',     # 红色
        'CRITICAL': '\033[35m',  # 紫色
        'RESET': '\033[0m'       # 重置
    }

    def format(self, record):
        """格式化日志记录"""
        # 添加颜色
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = f"{self.COLORS[levelname]}{levelname}{self.COLORS['RESET']}"

        # 调用父类格式化
        return super().format(record)


class LoggerManager:
    """日志管理器"""

    def __init__(self, name: str = 'ai_pcb_layout',
                 level: str = 'INFO',
                 log_file: Optional[str] = None,
                 console_output: bool = True,
                 file_output: bool = True):
        """
        初始化日志管理器

        Args:
            name: 日志器名称
            level: 日志级别 ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')
            log_file: 日志文件路径
            console_output: 是否输出到控制台
            file_output: 是否输出到文件
        """
        self.name = name
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level.upper()))

        # 避免重复添加处理器
        if self.logger.handlers:
            self.logger.handlers.clear()

        # 控制台处理器
        if console_output:
            self._add_console_handler()

        # 文件处理器
        if file_output:
            if log_file is None:
                # 默认日志文件
                log_dir = Path('logs')
                log_dir.mkdir(exist_ok=True)
                log_file = log_dir / f'{name}_{datetime.now().strftime("%Y%m%d")}.log'

            self._add_file_handler(str(log_file))

    def _add_console_handler(self):
        """添加控制台处理器"""
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)

        # 使用彩色格式化器
        formatter = ColoredFormatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)

    def _add_file_handler(self, log_file: str):
        """添加文件处理器"""
        # 确保日志目录存在
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)

        # 文件使用普通格式化器（不带颜色）
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)

    def get_logger(self) -> logging.Logger:
        """获取logger实例"""
        return self.logger

    def debug(self, message: str):
        """记录调试信息"""
        self.logger.debug(message)

    def info(self, message: str):
        """记录信息"""
        self.logger.info(message)

    def warning(self, message: str):
        """记录警告"""
        self.logger.warning(message)

    def error(self, message: str):
        """记录错误"""
        self.logger.error(message)

    def critical(self, message: str):
        """记录严重错误"""
        self.logger.critical(message)

    def exception(self, message: str):
        """记录异常"""
        self.logger.exception(message)

    def set_level(self, level: str):
        """
        设置日志级别

        Args:
            level: 日志级别
        """
        self.logger.setLevel(getattr(logging, level.upper()))


# 全局日志器实例
_global_logger = None


def get_logger(name: Optional[str] = None,
               level: str = 'INFO',
               log_file: Optional[str] = None,
               console_output: bool = True,
               file_output: bool = True) -> LoggerManager:
    """
    获取日志器实例

    Args:
        name: 日志器名称
        level: 日志级别
        log_file: 日志文件路径
        console_output: 是否输出到控制台
        file_output: 是否输出到文件

    Returns:
        LoggerManager实例
    """
    global _global_logger

    if _global_logger is None or name is not None:
        logger_name = name or 'ai_pcb_layout'
        _global_logger = LoggerManager(
            name=logger_name,
            level=level,
            log_file=log_file,
            console_output=console_output,
            file_output=file_output
        )

    return _global_logger


def setup_logging_from_config(config):
    """
    从配置文件设置日志

    Args:
        config: 配置管理器实例
    """
    logging_config = config.get_section('logging')

    global _global_logger
    _global_logger = LoggerManager(
        name='ai_pcb_layout',
        level=logging_config.get('level', 'INFO'),
        log_file=logging_config.get('file'),
        console_output=logging_config.get('console_output', True),
        file_output=True
    )


# 便捷函数
def debug(message: str):
    """记录调试信息"""
    get_logger().debug(message)


def info(message: str):
    """记录信息"""
    get_logger().info(message)


def warning(message: str):
    """记录警告"""
    get_logger().warning(message)


def error(message: str):
    """记录错误"""
    get_logger().error(message)


def critical(message: str):
    """记录严重错误"""
    get_logger().critical(message)


def exception(message: str):
    """记录异常"""
    get_logger().exception(message)


class ProgressLogger:
    """进度日志器"""

    def __init__(self, total: int, desc: str = "Processing"):
        """
        初始化进度日志器

        Args:
            total: 总数
            desc: 描述
        """
        self.total = total
        self.current = 0
        self.desc = desc
        self.logger = get_logger()

    def update(self, n: int = 1):
        """
        更新进度

        Args:
            n: 增量
        """
        self.current += n
        percentage = (self.current / self.total) * 100

        if self.current % max(1, self.total // 10) == 0 or self.current == self.total:
            self.logger.info(f"{self.desc}: {self.current}/{self.total} ({percentage:.1f}%)")

    def finish(self):
        """完成进度"""
        self.logger.info(f"{self.desc}: 完成! ({self.total}/{self.total})")


def log_function_call(func):
    """
    装饰器：记录函数调用

    Args:
        func: 被装饰的函数
    """
    def wrapper(*args, **kwargs):
        logger = get_logger()
        logger.debug(f"调用函数: {func.__name__}")

        try:
            result = func(*args, **kwargs)
            logger.debug(f"函数 {func.__name__} 执行成功")
            return result
        except Exception as e:
            logger.error(f"函数 {func.__name__} 执行失败: {str(e)}")
            raise

    return wrapper
