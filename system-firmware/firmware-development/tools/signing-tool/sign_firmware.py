#!/usr/bin/env python3
"""
Firmware Signing Tool
韌體簽名工具 - 支援 RSA 簽名、多種哈希算法、版本管理
"""

import os
import sys
import argparse
import hashlib
import struct
import binascii
import logging
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Tuple, Dict, List

try:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa, padding
    from cryptography.hazmat.backends import default_backend
except ImportError:
    print("Error: cryptography library not found")
    print("Install with: pip install cryptography")
    sys.exit(1)


# 韌體頭部結構
# Magic: 4 bytes
# Version: 4 bytes (major.minor.patch.build)
# Timestamp: 8 bytes
# Firmware Size: 4 bytes
# Hash Algorithm: 2 bytes
# Signature Algorithm: 2 bytes
# Hash: 64 bytes (SHA-512 max)
# Signature Size: 4 bytes
# CRC32: 4 bytes
# Reserved: 424 bytes
# Total: 512 bytes

FIRMWARE_MAGIC = b'FWSV'  # Firmware Signature Version
HEADER_SIZE = 512
HASH_SIZE = 64
RESERVED_SIZE = 424

# 哈希算法映射
HASH_ALGORITHMS = {
    'sha256': (hashes.SHA256(), 0x0001),
    'sha512': (hashes.SHA512(), 0x0002),
}

# 簽名算法映射
SIGNATURE_ALGORITHMS = {
    'rsa2048': 0x0001,
    'rsa4096': 0x0002,
}


class FirmwareHeader:
    """韌體頭部結構"""

    def __init__(self):
        self.magic = FIRMWARE_MAGIC
        self.version = (1, 0, 0, 0)  # major, minor, patch, build
        self.timestamp = int(datetime.now().timestamp())
        self.firmware_size = 0
        self.hash_algorithm = 0x0001  # SHA-256
        self.signature_algorithm = 0x0001  # RSA-2048
        self.hash = b'\x00' * HASH_SIZE
        self.signature_size = 0
        self.crc32 = 0
        self.reserved = b'\x00' * RESERVED_SIZE

    def pack(self) -> bytes:
        """打包頭部為二進制數據"""
        header = bytearray()

        # Magic (4 bytes)
        header.extend(self.magic)

        # Version (4 bytes: major, minor, patch, build)
        for v in self.version:
            header.extend(struct.pack('<B', v))

        # Timestamp (8 bytes)
        header.extend(struct.pack('<Q', self.timestamp))

        # Firmware Size (4 bytes)
        header.extend(struct.pack('<I', self.firmware_size))

        # Hash Algorithm (2 bytes)
        header.extend(struct.pack('<H', self.hash_algorithm))

        # Signature Algorithm (2 bytes)
        header.extend(struct.pack('<H', self.signature_algorithm))

        # Hash (64 bytes)
        header.extend(self.hash[:HASH_SIZE])
        if len(self.hash) < HASH_SIZE:
            header.extend(b'\x00' * (HASH_SIZE - len(self.hash)))

        # Signature Size (4 bytes)
        header.extend(struct.pack('<I', self.signature_size))

        # CRC32 (4 bytes)
        header.extend(struct.pack('<I', self.crc32))

        # Reserved (424 bytes)
        header.extend(self.reserved[:RESERVED_SIZE])

        assert len(header) == HEADER_SIZE, f"Header size mismatch: {len(header)} != {HEADER_SIZE}"

        return bytes(header)

    @classmethod
    def unpack(cls, data: bytes) -> 'FirmwareHeader':
        """從二進制數據解包頭部"""
        if len(data) < HEADER_SIZE:
            raise ValueError(f"Data too short for header: {len(data)} < {HEADER_SIZE}")

        header = cls()
        offset = 0

        # Magic (4 bytes)
        header.magic = data[offset:offset+4]
        offset += 4

        if header.magic != FIRMWARE_MAGIC:
            raise ValueError(f"Invalid magic: {header.magic}")

        # Version (4 bytes)
        header.version = tuple(data[offset:offset+4])
        offset += 4

        # Timestamp (8 bytes)
        header.timestamp = struct.unpack('<Q', data[offset:offset+8])[0]
        offset += 8

        # Firmware Size (4 bytes)
        header.firmware_size = struct.unpack('<I', data[offset:offset+4])[0]
        offset += 4

        # Hash Algorithm (2 bytes)
        header.hash_algorithm = struct.unpack('<H', data[offset:offset+2])[0]
        offset += 2

        # Signature Algorithm (2 bytes)
        header.signature_algorithm = struct.unpack('<H', data[offset:offset+2])[0]
        offset += 2

        # Hash (64 bytes)
        header.hash = data[offset:offset+HASH_SIZE]
        offset += HASH_SIZE

        # Signature Size (4 bytes)
        header.signature_size = struct.unpack('<I', data[offset:offset+4])[0]
        offset += 4

        # CRC32 (4 bytes)
        header.crc32 = struct.unpack('<I', data[offset:offset+4])[0]
        offset += 4

        # Reserved (424 bytes)
        header.reserved = data[offset:offset+RESERVED_SIZE]
        offset += RESERVED_SIZE

        return header

    def to_dict(self) -> Dict:
        """轉換為字典"""
        return {
            'magic': self.magic.decode('ascii'),
            'version': f"{self.version[0]}.{self.version[1]}.{self.version[2]}.{self.version[3]}",
            'timestamp': datetime.fromtimestamp(self.timestamp).isoformat(),
            'firmware_size': self.firmware_size,
            'hash_algorithm': f"0x{self.hash_algorithm:04X}",
            'signature_algorithm': f"0x{self.signature_algorithm:04X}",
            'hash': binascii.hexlify(self.hash).decode('ascii'),
            'signature_size': self.signature_size,
            'crc32': f"0x{self.crc32:08X}",
        }


class FirmwareSigner:
    """韌體簽名器"""

    def __init__(self, private_key_path: str, hash_algorithm: str = 'sha256',
                 key_size: int = 2048, log_level: int = logging.INFO):
        """
        初始化簽名器

        Args:
            private_key_path: 私鑰文件路徑（PEM 格式）
            hash_algorithm: 哈希算法 (sha256, sha512)
            key_size: RSA 密鑰大小 (2048, 4096)
            log_level: 日誌級別
        """
        self.logger = self._setup_logger(log_level)
        self.private_key_path = private_key_path
        self.hash_algorithm_name = hash_algorithm
        self.key_size = key_size

        # 設置哈希算法
        if hash_algorithm not in HASH_ALGORITHMS:
            raise ValueError(f"Unsupported hash algorithm: {hash_algorithm}")

        self.hash_algorithm, self.hash_algorithm_id = HASH_ALGORITHMS[hash_algorithm]

        # 設置簽名算法
        sig_algo_key = f'rsa{key_size}'
        if sig_algo_key not in SIGNATURE_ALGORITHMS:
            raise ValueError(f"Unsupported key size: {key_size}")

        self.signature_algorithm_id = SIGNATURE_ALGORITHMS[sig_algo_key]

        # 加載私鑰
        self.private_key = self._load_private_key()

        self.logger.info(f"Initialized FirmwareSigner with {hash_algorithm.upper()} and RSA-{key_size}")

    def _setup_logger(self, level: int) -> logging.Logger:
        """設置日誌器"""
        logger = logging.getLogger('FirmwareSigner')
        logger.setLevel(level)

        if not logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setLevel(level)
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def _load_private_key(self) -> rsa.RSAPrivateKey:
        """加載 PEM 格式的私鑰"""
        try:
            with open(self.private_key_path, 'rb') as f:
                private_key = serialization.load_pem_private_key(
                    f.read(),
                    password=None,
                    backend=default_backend()
                )

            if not isinstance(private_key, rsa.RSAPrivateKey):
                raise ValueError("Not an RSA private key")

            key_size = private_key.key_size
            self.logger.info(f"Loaded RSA private key: {key_size} bits")

            return private_key

        except FileNotFoundError:
            self.logger.error(f"Private key file not found: {self.private_key_path}")
            raise
        except Exception as e:
            self.logger.error(f"Failed to load private key: {e}")
            raise

    def compute_hash(self, data: bytes) -> bytes:
        """計算數據的哈希值"""
        if self.hash_algorithm_name == 'sha256':
            hasher = hashlib.sha256()
        elif self.hash_algorithm_name == 'sha512':
            hasher = hashlib.sha512()
        else:
            raise ValueError(f"Unsupported hash algorithm: {self.hash_algorithm_name}")

        hasher.update(data)
        return hasher.digest()

    def compute_crc32(self, data: bytes) -> int:
        """計算 CRC32 校驗和"""
        return binascii.crc32(data) & 0xFFFFFFFF

    def sign_data(self, data: bytes) -> bytes:
        """使用 RSA 私鑰簽名數據"""
        try:
            signature = self.private_key.sign(
                data,
                padding.PSS(
                    mgf=padding.MGF1(self.hash_algorithm),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                self.hash_algorithm
            )

            self.logger.debug(f"Generated signature: {len(signature)} bytes")
            return signature

        except Exception as e:
            self.logger.error(f"Failed to sign data: {e}")
            raise

    def sign_firmware(self, firmware_data: bytes, version: Tuple[int, int, int, int] = (1, 0, 0, 0)) -> Tuple[bytes, FirmwareHeader]:
        """
        簽名韌體

        Args:
            firmware_data: 韌體二進制數據
            version: 版本號 (major, minor, patch, build)

        Returns:
            (簽名後的韌體, 韌體頭部)
        """
        self.logger.info(f"Signing firmware: {len(firmware_data)} bytes")

        # 計算韌體哈希
        firmware_hash = self.compute_hash(firmware_data)
        self.logger.info(f"Firmware hash ({self.hash_algorithm_name.upper()}): {binascii.hexlify(firmware_hash).decode()}")

        # 簽名韌體
        signature = self.sign_data(firmware_data)
        self.logger.info(f"Signature size: {len(signature)} bytes")

        # 計算 CRC32
        crc32 = self.compute_crc32(firmware_data)
        self.logger.info(f"CRC32: 0x{crc32:08X}")

        # 創建頭部
        header = FirmwareHeader()
        header.version = version
        header.firmware_size = len(firmware_data)
        header.hash_algorithm = self.hash_algorithm_id
        header.signature_algorithm = self.signature_algorithm_id
        header.hash = firmware_hash
        header.signature_size = len(signature)
        header.crc32 = crc32

        # 打包頭部
        header_data = header.pack()

        # 組合：頭部 + 韌體數據 + 簽名
        signed_firmware = header_data + firmware_data + signature

        self.logger.info(f"Signed firmware total size: {len(signed_firmware)} bytes")
        self.logger.info(f"  - Header: {len(header_data)} bytes")
        self.logger.info(f"  - Firmware: {len(firmware_data)} bytes")
        self.logger.info(f"  - Signature: {len(signature)} bytes")

        return signed_firmware, header

    def sign_file(self, input_file: str, output_file: str, version: Tuple[int, int, int, int] = (1, 0, 0, 0)) -> Dict:
        """
        簽名韌體文件

        Args:
            input_file: 輸入韌體文件路徑
            output_file: 輸出簽名文件路徑
            version: 版本號

        Returns:
            簽名信息字典
        """
        self.logger.info(f"Processing file: {input_file}")

        # 讀取韌體文件
        try:
            with open(input_file, 'rb') as f:
                firmware_data = f.read()
        except FileNotFoundError:
            self.logger.error(f"Input file not found: {input_file}")
            raise
        except Exception as e:
            self.logger.error(f"Failed to read input file: {e}")
            raise

        # 簽名韌體
        signed_firmware, header = self.sign_firmware(firmware_data, version)

        # 寫入輸出文件
        try:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_file, 'wb') as f:
                f.write(signed_firmware)

            self.logger.info(f"Signed firmware saved to: {output_file}")
        except Exception as e:
            self.logger.error(f"Failed to write output file: {e}")
            raise

        # 返回簽名信息
        info = {
            'input_file': input_file,
            'output_file': output_file,
            'input_size': len(firmware_data),
            'output_size': len(signed_firmware),
            'header': header.to_dict(),
            'timestamp': datetime.now().isoformat(),
        }

        return info

    def sign_batch(self, input_dir: str, output_dir: str, pattern: str = "*.bin",
                   version: Tuple[int, int, int, int] = (1, 0, 0, 0)) -> List[Dict]:
        """
        批量簽名韌體文件

        Args:
            input_dir: 輸入目錄
            output_dir: 輸出目錄
            pattern: 文件匹配模式
            version: 版本號

        Returns:
            簽名信息列表
        """
        self.logger.info(f"Batch signing: {input_dir} -> {output_dir}")
        self.logger.info(f"Pattern: {pattern}")

        input_path = Path(input_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 查找匹配的文件
        files = list(input_path.glob(pattern))

        if not files:
            self.logger.warning(f"No files found matching pattern: {pattern}")
            return []

        self.logger.info(f"Found {len(files)} file(s) to sign")

        # 批量簽名
        results = []
        for i, input_file in enumerate(files, 1):
            self.logger.info(f"\n[{i}/{len(files)}] Processing: {input_file.name}")

            output_file = output_path / f"{input_file.stem}_signed{input_file.suffix}"

            try:
                info = self.sign_file(str(input_file), str(output_file), version)
                results.append(info)
                self.logger.info(f"✓ Success: {input_file.name}")
            except Exception as e:
                self.logger.error(f"✗ Failed: {input_file.name} - {e}")
                results.append({
                    'input_file': str(input_file),
                    'error': str(e),
                    'timestamp': datetime.now().isoformat(),
                })

        self.logger.info(f"\nBatch signing completed: {len([r for r in results if 'error' not in r])}/{len(files)} successful")

        return results


def parse_version(version_str: str) -> Tuple[int, int, int, int]:
    """解析版本字符串"""
    parts = version_str.split('.')
    if len(parts) < 3:
        raise ValueError(f"Invalid version format: {version_str}")

    major = int(parts[0])
    minor = int(parts[1])
    patch = int(parts[2])
    build = int(parts[3]) if len(parts) > 3 else 0

    return (major, minor, patch, build)


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description='Firmware Signing Tool - 韌體簽名工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # 簽名單個文件
  %(prog)s -i firmware.bin -o firmware_signed.bin -k private_key.pem

  # 使用 SHA-512 和 RSA-4096
  %(prog)s -i firmware.bin -o firmware_signed.bin -k private_key.pem --hash sha512 --key-size 4096

  # 批量簽名
  %(prog)s --batch -d build/ -o signed/ -k private_key.pem

  # 指定版本號
  %(prog)s -i firmware.bin -o firmware_signed.bin -k private_key.pem --version 1.2.3.4

  # 生成簽名報告
  %(prog)s -i firmware.bin -o firmware_signed.bin -k private_key.pem --report report.json
        """
    )

    # 基本參數
    parser.add_argument('-i', '--input', help='輸入韌體文件路徑')
    parser.add_argument('-o', '--output', help='輸出簽名文件路徑')
    parser.add_argument('-k', '--key', required=True, help='私鑰文件路徑 (PEM 格式)')

    # 批量簽名
    parser.add_argument('--batch', action='store_true', help='批量簽名模式')
    parser.add_argument('-d', '--input-dir', help='輸入目錄（批量模式）')
    parser.add_argument('--output-dir', help='輸出目錄（批量模式）')
    parser.add_argument('--pattern', default='*.bin', help='文件匹配模式（批量模式）')

    # 算法參數
    parser.add_argument('--hash', choices=['sha256', 'sha512'], default='sha256',
                        help='哈希算法（默認: sha256）')
    parser.add_argument('--key-size', type=int, choices=[2048, 4096], default=2048,
                        help='RSA 密鑰大小（默認: 2048）')

    # 版本參數
    parser.add_argument('--version', default='1.0.0.0',
                        help='韌體版本號（格式: major.minor.patch.build）')

    # 報告參數
    parser.add_argument('--report', help='生成簽名報告（JSON 格式）')

    # 日誌參數
    parser.add_argument('-v', '--verbose', action='store_true', help='詳細輸出')
    parser.add_argument('-q', '--quiet', action='store_true', help='安靜模式')

    args = parser.parse_args()

    # 設置日誌級別
    if args.verbose:
        log_level = logging.DEBUG
    elif args.quiet:
        log_level = logging.WARNING
    else:
        log_level = logging.INFO

    try:
        # 解析版本號
        version = parse_version(args.version)

        # 創建簽名器
        signer = FirmwareSigner(
            private_key_path=args.key,
            hash_algorithm=args.hash,
            key_size=args.key_size,
            log_level=log_level
        )

        # 執行簽名
        if args.batch:
            # 批量簽名模式
            if not args.input_dir or not args.output_dir:
                parser.error("Batch mode requires --input-dir and --output-dir")

            results = signer.sign_batch(
                input_dir=args.input_dir,
                output_dir=args.output_dir,
                pattern=args.pattern,
                version=version
            )

            # 生成報告
            if args.report:
                with open(args.report, 'w') as f:
                    json.dump(results, f, indent=2)
                signer.logger.info(f"Report saved to: {args.report}")

        else:
            # 單文件簽名模式
            if not args.input or not args.output:
                parser.error("Single file mode requires --input and --output")

            info = signer.sign_file(
                input_file=args.input,
                output_file=args.output,
                version=version
            )

            # 生成報告
            if args.report:
                with open(args.report, 'w') as f:
                    json.dump(info, f, indent=2)
                signer.logger.info(f"Report saved to: {args.report}")

        signer.logger.info("\n✓ Signing completed successfully")
        return 0

    except Exception as e:
        logging.error(f"\n✗ Signing failed: {e}")
        if log_level == logging.DEBUG:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
