#!/usr/bin/env python3
"""
Firmware Builder Tool
====================
A comprehensive firmware building tool supporting multiple platforms (STM32, ESP32, nRF52)
with version management, signing, encryption, and CI/CD integration.

Author: Vibe Coding Apps
License: MIT
"""

import argparse
import json
import yaml
import os
import sys
import subprocess
import hashlib
import time
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import shutil
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from collections import defaultdict

# AI 輔助功能相關導入
try:
    import anthropic
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False


# ============================================================================
# 常量定義
# ============================================================================

class Platform(Enum):
    """支援的平台類型"""
    STM32 = "stm32"
    ESP32 = "esp32"
    NRF52 = "nrf52"


class BuildType(Enum):
    """構建類型"""
    DEBUG = "debug"
    RELEASE = "release"
    PRODUCTION = "production"


class OutputFormat(Enum):
    """輸出格式"""
    ELF = ".elf"
    BIN = ".bin"
    HEX = ".hex"


# 平台特定工具鏈配置
TOOLCHAIN_CONFIG = {
    Platform.STM32: {
        "compiler": "arm-none-eabi-gcc",
        "objcopy": "arm-none-eabi-objcopy",
        "size": "arm-none-eabi-size",
        "nm": "arm-none-eabi-nm",
        "readelf": "arm-none-eabi-readelf",
        "default_flags": [
            "-mcpu=cortex-m4",
            "-mthumb",
            "-mfloat-abi=hard",
            "-mfpu=fpv4-sp-d16"
        ]
    },
    Platform.ESP32: {
        "compiler": "xtensa-esp32-elf-gcc",
        "objcopy": "xtensa-esp32-elf-objcopy",
        "size": "xtensa-esp32-elf-size",
        "nm": "xtensa-esp32-elf-nm",
        "readelf": "xtensa-esp32-elf-readelf",
        "build_system": "idf.py",
        "default_flags": []
    },
    Platform.NRF52: {
        "compiler": "arm-none-eabi-gcc",
        "objcopy": "arm-none-eabi-objcopy",
        "size": "arm-none-eabi-size",
        "nm": "arm-none-eabi-nm",
        "readelf": "arm-none-eabi-readelf",
        "default_flags": [
            "-mcpu=cortex-m4",
            "-mthumb",
            "-mfloat-abi=hard",
            "-mfpu=fpv4-sp-d16"
        ]
    }
}


# ============================================================================
# 數據類定義
# ============================================================================

@dataclass
class BuildConfig:
    """構建配置"""
    platform: Platform
    build_type: BuildType
    version: str
    project_name: str
    source_dir: Path
    output_dir: Path
    formats: List[OutputFormat]
    enable_signing: bool = False
    enable_encryption: bool = False
    optimization_level: str = "O2"
    custom_flags: List[str] = None
    defines: Dict[str, str] = None
    include_paths: List[str] = None
    linker_script: Optional[str] = None

    def __post_init__(self):
        if self.custom_flags is None:
            self.custom_flags = []
        if self.defines is None:
            self.defines = {}
        if self.include_paths is None:
            self.include_paths = []


@dataclass
class BuildResult:
    """構建結果"""
    success: bool
    build_id: str
    version: str
    platform: str
    build_type: str
    timestamp: str
    duration_seconds: float
    output_files: Dict[str, str]
    size_info: Dict[str, int]
    memory_usage: Dict[str, Dict[str, int]]
    errors: List[str]
    warnings: List[str]
    manifest_path: Optional[str] = None
    signature: Optional[str] = None


# ============================================================================
# 日誌配置
# ============================================================================

def setup_logging(log_file: Optional[Path] = None, verbose: bool = False) -> logging.Logger:
    """配置日誌系統"""
    logger = logging.getLogger("FirmwareBuilder")
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)

    # 控制台處理器
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG if verbose else logging.INFO)
    console_format = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    )
    console_handler.setFormatter(console_format)
    logger.addHandler(console_handler)

    # 文件處理器
    if log_file:
        file_handler = logging.FileHandler(log_file, mode='w')
        file_handler.setLevel(logging.DEBUG)
        file_format = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)

    return logger


# ============================================================================
# 版本管理
# ============================================================================

class VersionManager:
    """版本管理器"""

    @staticmethod
    def generate_build_id() -> str:
        """生成唯一的構建 ID"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_hash = hashlib.sha256(
            f"{timestamp}{os.urandom(16).hex()}".encode()
        ).hexdigest()[:8]
        return f"{timestamp}-{random_hash}"

    @staticmethod
    def parse_version(version_str: str) -> Tuple[int, int, int]:
        """解析版本字符串 (major.minor.patch)"""
        try:
            parts = version_str.split('.')
            if len(parts) != 3:
                raise ValueError("版本格式應為 major.minor.patch")
            return tuple(map(int, parts))
        except Exception as e:
            raise ValueError(f"無效的版本格式: {version_str}") from e

    @staticmethod
    def get_version_from_git(source_dir: Path) -> Optional[str]:
        """從 Git 標籤獲取版本"""
        try:
            result = subprocess.run(
                ['git', 'describe', '--tags', '--abbrev=0'],
                cwd=source_dir,
                capture_output=True,
                text=True,
                check=True
            )
            version = result.stdout.strip()
            # 移除 'v' 前綴（如果存在）
            if version.startswith('v'):
                version = version[1:]
            return version
        except subprocess.CalledProcessError:
            return None

    @staticmethod
    def get_git_commit_hash(source_dir: Path) -> Optional[str]:
        """獲取當前 Git commit hash"""
        try:
            result = subprocess.run(
                ['git', 'rev-parse', '--short', 'HEAD'],
                cwd=source_dir,
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError:
            return None


# ============================================================================
# 編譯器管理
# ============================================================================

class Compiler:
    """編譯器管理類"""

    def __init__(self, config: BuildConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
        self.toolchain = TOOLCHAIN_CONFIG[config.platform]
        self.errors = []
        self.warnings = []

    def check_toolchain(self) -> bool:
        """檢查工具鏈是否可用"""
        self.logger.info(f"檢查 {self.config.platform.value} 工具鏈...")

        compiler = self.toolchain["compiler"]
        try:
            result = subprocess.run(
                [compiler, '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                version = result.stdout.split('\n')[0]
                self.logger.info(f"找到編譯器: {version}")
                return True
            else:
                self.logger.error(f"編譯器 {compiler} 不可用")
                return False
        except FileNotFoundError:
            self.logger.error(f"找不到編譯器: {compiler}")
            self.logger.info("請確保工具鏈已正確安裝並在 PATH 中")
            return False
        except subprocess.TimeoutExpired:
            self.logger.error("編譯器檢查超時")
            return False

    def build_compile_flags(self) -> List[str]:
        """構建編譯標誌"""
        flags = []

        # 平台特定標誌
        flags.extend(self.toolchain.get("default_flags", []))

        # 優化級別
        flags.append(f"-{self.config.optimization_level}")

        # 構建類型特定標誌
        if self.config.build_type == BuildType.DEBUG:
            flags.extend(["-g", "-DDEBUG"])
        elif self.config.build_type == BuildType.RELEASE:
            flags.extend(["-DNDEBUG"])
        elif self.config.build_type == BuildType.PRODUCTION:
            flags.extend(["-DNDEBUG", "-DPRODUCTION"])

        # 標準警告
        flags.extend([
            "-Wall",
            "-Wextra",
            "-Werror",
            "-Wno-unused-parameter"
        ])

        # 包含路徑
        for include_path in self.config.include_paths:
            flags.append(f"-I{include_path}")

        # 定義
        for key, value in self.config.defines.items():
            if value:
                flags.append(f"-D{key}={value}")
            else:
                flags.append(f"-D{key}")

        # 自定義標誌
        flags.extend(self.config.custom_flags)

        return flags

    def compile_sources(self, source_files: List[Path], output_dir: Path) -> List[Path]:
        """編譯源文件"""
        self.logger.info(f"編譯 {len(source_files)} 個源文件...")

        flags = self.build_compile_flags()
        object_files = []

        for source_file in source_files:
            obj_name = source_file.stem + ".o"
            obj_path = output_dir / obj_name

            cmd = [
                self.toolchain["compiler"],
                *flags,
                "-c",
                str(source_file),
                "-o",
                str(obj_path)
            ]

            self.logger.debug(f"編譯: {source_file.name}")

            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                # 收集警告
                if result.stderr:
                    warnings = [line for line in result.stderr.split('\n')
                              if 'warning:' in line.lower()]
                    self.warnings.extend(warnings)

                if result.returncode != 0:
                    error_msg = f"編譯失敗: {source_file.name}\n{result.stderr}"
                    self.logger.error(error_msg)
                    self.errors.append(error_msg)
                    return []

                object_files.append(obj_path)

            except subprocess.TimeoutExpired:
                error_msg = f"編譯超時: {source_file.name}"
                self.logger.error(error_msg)
                self.errors.append(error_msg)
                return []

        self.logger.info(f"成功編譯 {len(object_files)} 個目標文件")
        return object_files

    def link_executable(self, object_files: List[Path], output_elf: Path) -> bool:
        """鏈接可執行文件"""
        self.logger.info("鏈接可執行文件...")

        cmd = [
            self.toolchain["compiler"],
            *self.build_compile_flags(),
            *[str(obj) for obj in object_files],
            "-o",
            str(output_elf)
        ]

        # 添加鏈接腳本
        if self.config.linker_script:
            cmd.extend(["-T", self.config.linker_script])

        # 鏈接標誌
        cmd.extend([
            "-Wl,--gc-sections",
            "-Wl,--print-memory-usage",
            f"-Wl,-Map={output_elf.with_suffix('.map')}"
        ])

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode != 0:
                error_msg = f"鏈接失敗:\n{result.stderr}"
                self.logger.error(error_msg)
                self.errors.append(error_msg)
                return False

            # 記錄記憶體使用信息
            if result.stdout:
                self.logger.info("記憶體使用:")
                for line in result.stdout.split('\n'):
                    if line.strip():
                        self.logger.info(f"  {line}")

            self.logger.info(f"成功創建: {output_elf}")
            return True

        except subprocess.TimeoutExpired:
            error_msg = "鏈接超時"
            self.logger.error(error_msg)
            self.errors.append(error_msg)
            return False


# ============================================================================
# 輸出格式轉換
# ============================================================================

class FormatConverter:
    """輸出格式轉換器"""

    def __init__(self, toolchain: Dict, logger: logging.Logger):
        self.toolchain = toolchain
        self.logger = logger

    def convert_to_format(self, elf_file: Path, output_format: OutputFormat) -> Optional[Path]:
        """轉換 ELF 文件到指定格式"""
        output_file = elf_file.with_suffix(output_format.value)

        objcopy = self.toolchain["objcopy"]

        if output_format == OutputFormat.BIN:
            cmd = [objcopy, "-O", "binary", str(elf_file), str(output_file)]
        elif output_format == OutputFormat.HEX:
            cmd = [objcopy, "-O", "ihex", str(elf_file), str(output_file)]
        else:
            # ELF 格式已經存在
            return elf_file

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                self.logger.info(f"生成: {output_file.name}")
                return output_file
            else:
                self.logger.error(f"轉換失敗 ({output_format.value}): {result.stderr}")
                return None

        except subprocess.TimeoutExpired:
            self.logger.error(f"轉換超時 ({output_format.value})")
            return None
        except Exception as e:
            self.logger.error(f"轉換錯誤 ({output_format.value}): {e}")
            return None


# ============================================================================
# 大小分析
# ============================================================================

class SizeAnalyzer:
    """大小和記憶體分析器"""

    def __init__(self, toolchain: Dict, logger: logging.Logger):
        self.toolchain = toolchain
        self.logger = logger

    def analyze_elf(self, elf_file: Path) -> Dict[str, int]:
        """分析 ELF 文件大小"""
        self.logger.info("分析韌體大小...")

        size_tool = self.toolchain["size"]

        try:
            result = subprocess.run(
                [size_tool, "-A", str(elf_file)],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode != 0:
                self.logger.error("大小分析失敗")
                return {}

            # 解析輸出
            size_info = {}
            for line in result.stdout.split('\n'):
                parts = line.split()
                if len(parts) >= 2 and parts[0] in ['.text', '.data', '.bss', '.rodata']:
                    try:
                        size_info[parts[0]] = int(parts[1])
                    except ValueError:
                        pass

            # 計算總大小
            size_info['text'] = size_info.get('.text', 0)
            size_info['data'] = size_info.get('.data', 0)
            size_info['bss'] = size_info.get('.bss', 0)
            size_info['rodata'] = size_info.get('.rodata', 0)
            size_info['total'] = size_info['text'] + size_info['data'] + size_info['rodata']
            size_info['ram'] = size_info['data'] + size_info['bss']

            self.logger.info(f"  Flash: {size_info['total']:,} bytes")
            self.logger.info(f"  RAM:   {size_info['ram']:,} bytes")

            return size_info

        except subprocess.TimeoutExpired:
            self.logger.error("大小分析超時")
            return {}
        except Exception as e:
            self.logger.error(f"大小分析錯誤: {e}")
            return {}

    def analyze_memory_usage(self, elf_file: Path) -> Dict[str, Dict[str, int]]:
        """分析詳細記憶體使用"""
        self.logger.info("分析記憶體使用...")

        memory_usage = {
            "flash": {},
            "ram": {}
        }

        nm_tool = self.toolchain["nm"]

        try:
            result = subprocess.run(
                [nm_tool, "--print-size", "--size-sort", str(elf_file)],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode != 0:
                return memory_usage

            # 統計符號大小
            flash_total = 0
            ram_total = 0

            for line in result.stdout.split('\n'):
                parts = line.split()
                if len(parts) >= 4:
                    try:
                        size = int(parts[1], 16)
                        symbol_type = parts[2]
                        symbol_name = parts[3]

                        # 根據符號類型分類
                        if symbol_type in ['T', 't', 'R', 'r']:  # 代碼和只讀數據
                            flash_total += size
                        elif symbol_type in ['D', 'd', 'B', 'b']:  # 數據和 BSS
                            ram_total += size
                    except (ValueError, IndexError):
                        pass

            memory_usage["flash"]["total"] = flash_total
            memory_usage["ram"]["total"] = ram_total

            return memory_usage

        except subprocess.TimeoutExpired:
            self.logger.error("記憶體分析超時")
            return memory_usage
        except Exception as e:
            self.logger.error(f"記憶體分析錯誤: {e}")
            return memory_usage


# ============================================================================
# 簽名和加密
# ============================================================================

class SecurityHandler:
    """安全處理器（簽名和加密）"""

    def __init__(self, logger: logging.Logger):
        self.logger = logger

    def sign_firmware(self, firmware_file: Path, key_file: Optional[Path] = None) -> Optional[str]:
        """對韌體進行簽名"""
        self.logger.info("對韌體進行簽名...")

        try:
            # 計算 SHA-256 哈希
            with open(firmware_file, 'rb') as f:
                firmware_hash = hashlib.sha256(f.read()).hexdigest()

            # 如果提供了密鑰文件，使用它進行簽名
            if key_file and key_file.exists():
                # 這裡可以實現真正的簽名算法（例如 RSA、ECDSA）
                # 目前使用 HMAC 作為示例
                with open(key_file, 'rb') as f:
                    key = f.read()

                import hmac
                signature = hmac.new(
                    key,
                    firmware_hash.encode(),
                    hashlib.sha256
                ).hexdigest()

                self.logger.info(f"簽名: {signature[:16]}...")
                return signature
            else:
                # 沒有密鑰，僅返回哈希
                self.logger.info(f"哈希: {firmware_hash[:16]}...")
                return firmware_hash

        except Exception as e:
            self.logger.error(f"簽名失敗: {e}")
            return None

    def encrypt_firmware(self, firmware_file: Path, key: str) -> bool:
        """加密韌體（示例實現）"""
        self.logger.info("加密韌體...")

        try:
            # 這裡應該實現真正的加密算法（例如 AES）
            # 目前僅作為佔位符

            encrypted_file = firmware_file.with_suffix(firmware_file.suffix + '.enc')

            # 簡單的 XOR 加密作為示例（生產環境應使用 AES）
            with open(firmware_file, 'rb') as f:
                data = f.read()

            key_bytes = key.encode()
            encrypted_data = bytearray()

            for i, byte in enumerate(data):
                encrypted_data.append(byte ^ key_bytes[i % len(key_bytes)])

            with open(encrypted_file, 'wb') as f:
                f.write(encrypted_data)

            self.logger.info(f"加密完成: {encrypted_file}")
            return True

        except Exception as e:
            self.logger.error(f"加密失敗: {e}")
            return False


# ============================================================================
# AI 輔助功能
# ============================================================================

class AIAssistant:
    """AI 輔助分析器"""

    def __init__(self, logger: logging.Logger, api_key: Optional[str] = None):
        self.logger = logger
        self.available = AI_AVAILABLE and api_key is not None

        if self.available:
            self.client = anthropic.Anthropic(api_key=api_key)
        else:
            if not AI_AVAILABLE:
                self.logger.warning("Anthropic SDK 未安裝，AI 功能不可用")
            elif not api_key:
                self.logger.warning("未提供 API 密鑰，AI 功能不可用")

    def analyze_build_results(self, result: BuildResult) -> Optional[str]:
        """分析構建結果並提供優化建議"""
        if not self.available:
            return None

        self.logger.info("使用 AI 分析構建結果...")

        try:
            prompt = f"""
請分析以下韌體構建結果並提供優化建議：

平台: {result.platform}
構建類型: {result.build_type}
版本: {result.version}

大小信息:
- Flash 使用: {result.size_info.get('total', 0):,} bytes
- RAM 使用: {result.size_info.get('ram', 0):,} bytes
- Text 段: {result.size_info.get('text', 0):,} bytes
- Data 段: {result.size_info.get('data', 0):,} bytes
- BSS 段: {result.size_info.get('bss', 0):,} bytes

警告數量: {len(result.warnings)}
錯誤數量: {len(result.errors)}

構建時間: {result.duration_seconds:.2f} 秒

請提供：
1. 記憶體使用優化建議
2. 編譯警告和錯誤的分析
3. 構建性能改進建議
4. 代碼質量建議
"""

            message = self.client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            analysis = message.content[0].text
            self.logger.info("AI 分析完成")
            return analysis

        except Exception as e:
            self.logger.error(f"AI 分析失敗: {e}")
            return None

    def suggest_code_optimizations(self, source_dir: Path) -> Optional[str]:
        """分析源代碼並提供優化建議"""
        if not self.available:
            return None

        self.logger.info("使用 AI 分析源代碼...")

        try:
            # 收集源文件信息
            c_files = list(source_dir.rglob("*.c"))
            h_files = list(source_dir.rglob("*.h"))

            prompt = f"""
請分析以下嵌入式韌體項目結構並提供優化建議：

源文件統計:
- C 文件數量: {len(c_files)}
- 頭文件數量: {len(h_files)}

請提供：
1. 項目結構優化建議
2. 常見的嵌入式代碼優化技巧
3. 記憶體使用最佳實踐
4. 性能優化建議
"""

            message = self.client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            suggestions = message.content[0].text
            self.logger.info("代碼分析完成")
            return suggestions

        except Exception as e:
            self.logger.error(f"代碼分析失敗: {e}")
            return None


# ============================================================================
# 報告生成
# ============================================================================

class ReportGenerator:
    """構建報告生成器"""

    def __init__(self, logger: logging.Logger):
        self.logger = logger

    def generate_manifest(self, result: BuildResult, output_path: Path) -> bool:
        """生成 manifest.json"""
        self.logger.info("生成 manifest.json...")

        try:
            manifest = {
                "build_id": result.build_id,
                "version": result.version,
                "platform": result.platform,
                "build_type": result.build_type,
                "timestamp": result.timestamp,
                "duration_seconds": result.duration_seconds,
                "output_files": result.output_files,
                "size_info": result.size_info,
                "memory_usage": result.memory_usage,
                "signature": result.signature,
                "success": result.success,
                "error_count": len(result.errors),
                "warning_count": len(result.warnings)
            }

            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=2, ensure_ascii=False)

            self.logger.info(f"Manifest 已保存: {output_path}")
            return True

        except Exception as e:
            self.logger.error(f"生成 manifest 失敗: {e}")
            return False

    def generate_html_report(self, result: BuildResult, output_path: Path,
                           ai_analysis: Optional[str] = None) -> bool:
        """生成 HTML 格式的詳細報告"""
        self.logger.info("生成 HTML 報告...")

        try:
            html_content = f"""
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>韌體構建報告 - {result.build_id}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
        }}
        .status {{
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
        }}
        .status.success {{
            background-color: #4caf50;
        }}
        .status.failed {{
            background-color: #f44336;
        }}
        .section {{
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .section h2 {{
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        .info-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }}
        .info-item {{
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }}
        .info-label {{
            font-weight: bold;
            color: #666;
            font-size: 0.9em;
        }}
        .info-value {{
            font-size: 1.2em;
            color: #333;
            margin-top: 5px;
        }}
        .size-bar {{
            width: 100%;
            height: 30px;
            background-color: #e0e0e0;
            border-radius: 5px;
            overflow: hidden;
            margin-top: 10px;
        }}
        .size-bar-fill {{
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }}
        .warning {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px;
            margin: 5px 0;
        }}
        .error {{
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 10px;
            margin: 5px 0;
        }}
        .ai-analysis {{
            background-color: #e8f4f8;
            border-left: 4px solid #2196F3;
            padding: 20px;
            margin-top: 15px;
            border-radius: 5px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }}
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background-color: #667eea;
            color: white;
        }}
        tr:hover {{
            background-color: #f5f5f5;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>韌體構建報告</h1>
        <p><span class="status {'success' if result.success else 'failed'}">
            {'構建成功' if result.success else '構建失敗'}
        </span></p>
        <p>構建 ID: {result.build_id}</p>
    </div>

    <div class="section">
        <h2>基本信息</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">版本</div>
                <div class="info-value">{result.version}</div>
            </div>
            <div class="info-item">
                <div class="info-label">平台</div>
                <div class="info-value">{result.platform}</div>
            </div>
            <div class="info-item">
                <div class="info-label">構建類型</div>
                <div class="info-value">{result.build_type}</div>
            </div>
            <div class="info-item">
                <div class="info-label">構建時間</div>
                <div class="info-value">{result.timestamp}</div>
            </div>
            <div class="info-item">
                <div class="info-label">持續時間</div>
                <div class="info-value">{result.duration_seconds:.2f} 秒</div>
            </div>
            <div class="info-item">
                <div class="info-label">警告/錯誤</div>
                <div class="info-value">{len(result.warnings)} / {len(result.errors)}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>大小分析</h2>
        <table>
            <tr>
                <th>段</th>
                <th>大小 (bytes)</th>
                <th>大小 (KB)</th>
            </tr>
            <tr>
                <td>Text (代碼)</td>
                <td>{result.size_info.get('text', 0):,}</td>
                <td>{result.size_info.get('text', 0) / 1024:.2f}</td>
            </tr>
            <tr>
                <td>Data (已初始化數據)</td>
                <td>{result.size_info.get('data', 0):,}</td>
                <td>{result.size_info.get('data', 0) / 1024:.2f}</td>
            </tr>
            <tr>
                <td>BSS (未初始化數據)</td>
                <td>{result.size_info.get('bss', 0):,}</td>
                <td>{result.size_info.get('bss', 0) / 1024:.2f}</td>
            </tr>
            <tr>
                <td><strong>Flash 總使用</strong></td>
                <td><strong>{result.size_info.get('total', 0):,}</strong></td>
                <td><strong>{result.size_info.get('total', 0) / 1024:.2f}</strong></td>
            </tr>
            <tr>
                <td><strong>RAM 總使用</strong></td>
                <td><strong>{result.size_info.get('ram', 0):,}</strong></td>
                <td><strong>{result.size_info.get('ram', 0) / 1024:.2f}</strong></td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>輸出文件</h2>
        <table>
            <tr>
                <th>格式</th>
                <th>文件路徑</th>
            </tr>
"""

            for fmt, path in result.output_files.items():
                html_content += f"""
            <tr>
                <td>{fmt}</td>
                <td>{path}</td>
            </tr>
"""

            html_content += """
        </table>
    </div>
"""

            # 添加警告
            if result.warnings:
                html_content += """
    <div class="section">
        <h2>警告</h2>
"""
                for warning in result.warnings[:10]:  # 限制顯示前 10 個
                    html_content += f'        <div class="warning">{warning}</div>\n'

                if len(result.warnings) > 10:
                    html_content += f'        <p>...還有 {len(result.warnings) - 10} 個警告</p>\n'

                html_content += "    </div>\n"

            # 添加錯誤
            if result.errors:
                html_content += """
    <div class="section">
        <h2>錯誤</h2>
"""
                for error in result.errors:
                    html_content += f'        <div class="error">{error}</div>\n'

                html_content += "    </div>\n"

            # 添加 AI 分析
            if ai_analysis:
                html_content += f"""
    <div class="section">
        <h2>AI 分析與建議</h2>
        <div class="ai-analysis">
            <pre style="white-space: pre-wrap; font-family: inherit;">{ai_analysis}</pre>
        </div>
    </div>
"""

            html_content += """
</body>
</html>
"""

            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_content)

            self.logger.info(f"HTML 報告已保存: {output_path}")
            return True

        except Exception as e:
            self.logger.error(f"生成 HTML 報告失敗: {e}")
            return False


# ============================================================================
# 主構建器
# ============================================================================

class FirmwareBuilder:
    """主韌體構建器"""

    def __init__(self, config: BuildConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
        self.compiler = Compiler(config, logger)
        self.format_converter = FormatConverter(TOOLCHAIN_CONFIG[config.platform], logger)
        self.size_analyzer = SizeAnalyzer(TOOLCHAIN_CONFIG[config.platform], logger)
        self.security_handler = SecurityHandler(logger)
        self.report_generator = ReportGenerator(logger)
        self.version_manager = VersionManager()

    def prepare_build_directory(self) -> Path:
        """準備構建目錄"""
        build_dir = self.config.output_dir / "build"
        build_dir.mkdir(parents=True, exist_ok=True)
        return build_dir

    def find_source_files(self) -> List[Path]:
        """查找源文件"""
        self.logger.info(f"在 {self.config.source_dir} 中查找源文件...")

        source_files = []
        for ext in ['*.c', '*.cpp']:
            source_files.extend(self.config.source_dir.rglob(ext))

        self.logger.info(f"找到 {len(source_files)} 個源文件")
        return source_files

    def build(self) -> BuildResult:
        """執行完整構建流程"""
        start_time = time.time()
        build_id = self.version_manager.generate_build_id()

        self.logger.info("=" * 70)
        self.logger.info(f"開始韌體構建")
        self.logger.info(f"構建 ID: {build_id}")
        self.logger.info(f"平台: {self.config.platform.value}")
        self.logger.info(f"版本: {self.config.version}")
        self.logger.info("=" * 70)

        # 檢查工具鏈
        if not self.compiler.check_toolchain():
            return BuildResult(
                success=False,
                build_id=build_id,
                version=self.config.version,
                platform=self.config.platform.value,
                build_type=self.config.build_type.value,
                timestamp=datetime.now().isoformat(),
                duration_seconds=time.time() - start_time,
                output_files={},
                size_info={},
                memory_usage={},
                errors=["工具鏈檢查失敗"],
                warnings=[]
            )

        # 準備構建目錄
        build_dir = self.prepare_build_directory()

        # 查找源文件
        source_files = self.find_source_files()
        if not source_files:
            return BuildResult(
                success=False,
                build_id=build_id,
                version=self.config.version,
                platform=self.config.platform.value,
                build_type=self.config.build_type.value,
                timestamp=datetime.now().isoformat(),
                duration_seconds=time.time() - start_time,
                output_files={},
                size_info={},
                memory_usage={},
                errors=["未找到源文件"],
                warnings=[]
            )

        # 編譯源文件
        object_files = self.compiler.compile_sources(source_files, build_dir)
        if not object_files:
            return BuildResult(
                success=False,
                build_id=build_id,
                version=self.config.version,
                platform=self.config.platform.value,
                build_type=self.config.build_type.value,
                timestamp=datetime.now().isoformat(),
                duration_seconds=time.time() - start_time,
                output_files={},
                size_info={},
                memory_usage={},
                errors=self.compiler.errors,
                warnings=self.compiler.warnings
            )

        # 鏈接可執行文件
        output_name = f"{self.config.project_name}_v{self.config.version}_{build_id}"
        elf_file = self.config.output_dir / f"{output_name}.elf"

        if not self.compiler.link_executable(object_files, elf_file):
            return BuildResult(
                success=False,
                build_id=build_id,
                version=self.config.version,
                platform=self.config.platform.value,
                build_type=self.config.build_type.value,
                timestamp=datetime.now().isoformat(),
                duration_seconds=time.time() - start_time,
                output_files={},
                size_info={},
                memory_usage={},
                errors=self.compiler.errors,
                warnings=self.compiler.warnings
            )

        # 轉換輸出格式
        output_files = {"elf": str(elf_file)}
        for fmt in self.config.formats:
            if fmt != OutputFormat.ELF:
                converted_file = self.format_converter.convert_to_format(elf_file, fmt)
                if converted_file:
                    output_files[fmt.value[1:]] = str(converted_file)

        # 分析大小
        size_info = self.size_analyzer.analyze_elf(elf_file)
        memory_usage = self.size_analyzer.analyze_memory_usage(elf_file)

        # 簽名（如果啟用）
        signature = None
        if self.config.enable_signing:
            signature = self.security_handler.sign_firmware(elf_file)

        # 加密（如果啟用）
        if self.config.enable_encryption:
            # 使用構建 ID 作為加密密鑰（實際應用中應使用更安全的密鑰管理）
            self.security_handler.encrypt_firmware(elf_file, build_id)

        # 計算持續時間
        duration = time.time() - start_time

        # 創建構建結果
        result = BuildResult(
            success=True,
            build_id=build_id,
            version=self.config.version,
            platform=self.config.platform.value,
            build_type=self.config.build_type.value,
            timestamp=datetime.now().isoformat(),
            duration_seconds=duration,
            output_files=output_files,
            size_info=size_info,
            memory_usage=memory_usage,
            errors=self.compiler.errors,
            warnings=self.compiler.warnings,
            signature=signature
        )

        # 生成 manifest
        manifest_path = self.config.output_dir / f"{output_name}_manifest.json"
        if self.report_generator.generate_manifest(result, manifest_path):
            result.manifest_path = str(manifest_path)

        self.logger.info("=" * 70)
        self.logger.info(f"構建完成！")
        self.logger.info(f"持續時間: {duration:.2f} 秒")
        self.logger.info(f"輸出目錄: {self.config.output_dir}")
        self.logger.info("=" * 70)

        return result


# ============================================================================
# 配置加載
# ============================================================================

class ConfigLoader:
    """配置文件加載器"""

    @staticmethod
    def load_from_file(config_file: Path) -> Optional[Dict]:
        """從文件加載配置"""
        if not config_file.exists():
            return None

        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                if config_file.suffix in ['.yaml', '.yml']:
                    return yaml.safe_load(f)
                elif config_file.suffix == '.json':
                    return json.load(f)
                else:
                    return None
        except Exception as e:
            print(f"加載配置文件失敗: {e}")
            return None

    @staticmethod
    def create_build_config_from_dict(config_dict: Dict, args: argparse.Namespace) -> BuildConfig:
        """從字典創建構建配置"""
        # 從配置文件或命令行參數獲取值
        platform = Platform(args.platform or config_dict.get('platform', 'stm32'))
        build_type = BuildType(args.build_type or config_dict.get('build_type', 'debug'))
        version = args.version or config_dict.get('version', '1.0.0')
        project_name = args.project or config_dict.get('project_name', 'firmware')

        source_dir = Path(args.source_dir or config_dict.get('source_dir', '.'))
        output_dir = Path(args.output_dir or config_dict.get('output_dir', './output'))

        # 輸出格式
        formats = []
        format_list = args.formats or config_dict.get('formats', ['elf', 'bin', 'hex'])
        for fmt in format_list:
            if fmt == 'elf':
                formats.append(OutputFormat.ELF)
            elif fmt == 'bin':
                formats.append(OutputFormat.BIN)
            elif fmt == 'hex':
                formats.append(OutputFormat.HEX)

        return BuildConfig(
            platform=platform,
            build_type=build_type,
            version=version,
            project_name=project_name,
            source_dir=source_dir,
            output_dir=output_dir,
            formats=formats,
            enable_signing=args.sign or config_dict.get('enable_signing', False),
            enable_encryption=args.encrypt or config_dict.get('enable_encryption', False),
            optimization_level=args.optimization or config_dict.get('optimization_level', 'O2'),
            custom_flags=config_dict.get('custom_flags', []),
            defines=config_dict.get('defines', {}),
            include_paths=config_dict.get('include_paths', []),
            linker_script=config_dict.get('linker_script')
        )


# ============================================================================
# 命令行接口
# ============================================================================

def create_argument_parser() -> argparse.ArgumentParser:
    """創建命令行參數解析器"""
    parser = argparse.ArgumentParser(
        description='Firmware Builder - 多平台韌體構建工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 使用配置文件構建
  %(prog)s --config build_config.yaml

  # 命令行參數構建
  %(prog)s --platform stm32 --build-type release --version 1.2.3

  # 帶簽名和加密
  %(prog)s --config config.yaml --sign --encrypt

  # CI/CD 模式
  %(prog)s --config config.yaml --ci --output-dir ./artifacts

  # 啟用 AI 分析
  %(prog)s --config config.yaml --ai --api-key YOUR_API_KEY

支援的平台: stm32, esp32, nrf52
構建類型: debug, release, production
輸出格式: elf, bin, hex
        """
    )

    # 基本選項
    parser.add_argument(
        '--config', '-c',
        type=Path,
        help='配置文件路徑 (YAML 或 JSON)'
    )

    parser.add_argument(
        '--platform', '-p',
        choices=['stm32', 'esp32', 'nrf52'],
        help='目標平台'
    )

    parser.add_argument(
        '--build-type', '-b',
        choices=['debug', 'release', 'production'],
        help='構建類型'
    )

    parser.add_argument(
        '--version', '-v',
        help='韌體版本 (例如: 1.2.3)'
    )

    parser.add_argument(
        '--project',
        help='項目名稱'
    )

    # 路徑選項
    parser.add_argument(
        '--source-dir', '-s',
        type=Path,
        help='源代碼目錄'
    )

    parser.add_argument(
        '--output-dir', '-o',
        type=Path,
        help='輸出目錄'
    )

    # 輸出格式
    parser.add_argument(
        '--formats', '-f',
        nargs='+',
        choices=['elf', 'bin', 'hex'],
        help='輸出格式'
    )

    # 優化選項
    parser.add_argument(
        '--optimization',
        choices=['O0', 'O1', 'O2', 'O3', 'Os', 'Og'],
        help='優化級別'
    )

    # 安全選項
    parser.add_argument(
        '--sign',
        action='store_true',
        help='對韌體進行簽名'
    )

    parser.add_argument(
        '--encrypt',
        action='store_true',
        help='加密韌體'
    )

    # CI/CD 選項
    parser.add_argument(
        '--ci',
        action='store_true',
        help='CI/CD 模式（生成詳細報告）'
    )

    # AI 選項
    parser.add_argument(
        '--ai',
        action='store_true',
        help='啟用 AI 輔助分析'
    )

    parser.add_argument(
        '--api-key',
        help='Anthropic API 密鑰（用於 AI 功能）'
    )

    # 日誌選項
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='詳細輸出'
    )

    parser.add_argument(
        '--log-file',
        type=Path,
        help='日誌文件路徑'
    )

    # 清理選項
    parser.add_argument(
        '--clean',
        action='store_true',
        help='構建前清理輸出目錄'
    )

    return parser


def main():
    """主函數"""
    parser = create_argument_parser()
    args = parser.parse_args()

    # 設置日誌
    logger = setup_logging(args.log_file, args.verbose)

    try:
        # 加載配置
        config_dict = {}
        if args.config:
            config_dict = ConfigLoader.load_from_file(args.config)
            if config_dict is None:
                logger.error(f"無法加載配置文件: {args.config}")
                sys.exit(1)
            logger.info(f"已加載配置文件: {args.config}")

        # 創建構建配置
        build_config = ConfigLoader.create_build_config_from_dict(config_dict, args)

        # 清理輸出目錄（如果需要）
        if args.clean and build_config.output_dir.exists():
            logger.info(f"清理輸出目錄: {build_config.output_dir}")
            shutil.rmtree(build_config.output_dir)

        # 創建輸出目錄
        build_config.output_dir.mkdir(parents=True, exist_ok=True)

        # 創建構建器
        builder = FirmwareBuilder(build_config, logger)

        # 執行構建
        result = builder.build()

        # AI 分析（如果啟用）
        ai_analysis = None
        if args.ai:
            api_key = args.api_key or os.getenv('ANTHROPIC_API_KEY')
            if api_key:
                ai_assistant = AIAssistant(logger, api_key)
                ai_analysis = ai_assistant.analyze_build_results(result)

                # 同時分析源代碼
                code_suggestions = ai_assistant.suggest_code_optimizations(build_config.source_dir)
                if code_suggestions:
                    logger.info("\n=== AI 代碼優化建議 ===")
                    logger.info(code_suggestions)
            else:
                logger.warning("未提供 API 密鑰，跳過 AI 分析")

        # 生成報告（CI/CD 模式或明確要求）
        if args.ci or args.ai:
            report_path = build_config.output_dir / f"{result.build_id}_report.html"
            builder.report_generator.generate_html_report(result, report_path, ai_analysis)

        # 輸出構建摘要
        print("\n" + "=" * 70)
        print("構建摘要")
        print("=" * 70)
        print(f"狀態: {'成功' if result.success else '失敗'}")
        print(f"構建 ID: {result.build_id}")
        print(f"版本: {result.version}")
        print(f"平台: {result.platform}")
        print(f"持續時間: {result.duration_seconds:.2f} 秒")
        print(f"Flash 使用: {result.size_info.get('total', 0):,} bytes")
        print(f"RAM 使用: {result.size_info.get('ram', 0):,} bytes")
        print(f"警告: {len(result.warnings)}")
        print(f"錯誤: {len(result.errors)}")

        if result.manifest_path:
            print(f"Manifest: {result.manifest_path}")

        print("=" * 70)

        # 返回適當的退出代碼
        sys.exit(0 if result.success else 1)

    except KeyboardInterrupt:
        logger.warning("\n構建被用戶中斷")
        sys.exit(130)
    except Exception as e:
        logger.error(f"構建失敗: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
