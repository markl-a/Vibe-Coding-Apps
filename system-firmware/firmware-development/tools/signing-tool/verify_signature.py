#!/usr/bin/env python3
"""
Firmware Signature Verification Tool
韌體簽名驗證工具 - 驗證 RSA 簽名的完整性
"""

import os
import sys
import argparse
import hashlib
import binascii
import logging
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Tuple, Dict

try:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa, padding
    from cryptography.hazmat.backends import default_backend
    from cryptography.exceptions import InvalidSignature
except ImportError:
    print("Error: cryptography library not found")
    print("Install with: pip install cryptography")
    sys.exit(1)

# 導入簽名工具模組
try:
    from sign_firmware import (
        FirmwareHeader, FIRMWARE_MAGIC, HEADER_SIZE,
        HASH_ALGORITHMS, SIGNATURE_ALGORITHMS
    )
except ImportError:
    print("Error: Cannot import sign_firmware module")
    print("Make sure sign_firmware.py is in the same directory")
    sys.exit(1)


class FirmwareVerifier:
    """韌體簽名驗證器"""

    def __init__(self, public_key_path: Optional[str] = None, log_level: int = logging.INFO):
        """
        初始化驗證器

        Args:
            public_key_path: 公鑰文件路徑（PEM 格式）
            log_level: 日誌級別
        """
        self.logger = self._setup_logger(log_level)
        self.public_key_path = public_key_path
        self.public_key = None

        if public_key_path:
            self.public_key = self._load_public_key()
            self.logger.info(f"Initialized FirmwareVerifier with public key: {public_key_path}")
        else:
            self.logger.info("Initialized FirmwareVerifier without public key (header verification only)")

    def _setup_logger(self, level: int) -> logging.Logger:
        """設置日誌器"""
        logger = logging.getLogger('FirmwareVerifier')
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

    def _load_public_key(self) -> rsa.RSAPublicKey:
        """加載 PEM 格式的公鑰"""
        try:
            with open(self.public_key_path, 'rb') as f:
                public_key = serialization.load_pem_public_key(
                    f.read(),
                    backend=default_backend()
                )

            if not isinstance(public_key, rsa.RSAPublicKey):
                raise ValueError("Not an RSA public key")

            key_size = public_key.key_size
            self.logger.info(f"Loaded RSA public key: {key_size} bits")

            return public_key

        except FileNotFoundError:
            self.logger.error(f"Public key file not found: {self.public_key_path}")
            raise
        except Exception as e:
            self.logger.error(f"Failed to load public key: {e}")
            raise

    def get_hash_algorithm(self, algorithm_id: int):
        """根據算法 ID 獲取哈希算法"""
        for name, (algo, algo_id) in HASH_ALGORITHMS.items():
            if algo_id == algorithm_id:
                return name, algo
        raise ValueError(f"Unknown hash algorithm ID: 0x{algorithm_id:04X}")

    def compute_hash(self, data: bytes, algorithm_name: str) -> bytes:
        """計算數據的哈希值"""
        if algorithm_name == 'sha256':
            hasher = hashlib.sha256()
        elif algorithm_name == 'sha512':
            hasher = hashlib.sha512()
        else:
            raise ValueError(f"Unsupported hash algorithm: {algorithm_name}")

        hasher.update(data)
        return hasher.digest()

    def compute_crc32(self, data: bytes) -> int:
        """計算 CRC32 校驗和"""
        return binascii.crc32(data) & 0xFFFFFFFF

    def parse_signed_firmware(self, signed_firmware: bytes) -> Tuple[FirmwareHeader, bytes, bytes]:
        """
        解析簽名後的韌體

        Args:
            signed_firmware: 簽名後的韌體數據

        Returns:
            (頭部, 韌體數據, 簽名)
        """
        if len(signed_firmware) < HEADER_SIZE:
            raise ValueError(f"Data too short: {len(signed_firmware)} < {HEADER_SIZE}")

        # 解析頭部
        header = FirmwareHeader.unpack(signed_firmware[:HEADER_SIZE])

        # 提取韌體數據
        firmware_start = HEADER_SIZE
        firmware_end = firmware_start + header.firmware_size

        if firmware_end > len(signed_firmware):
            raise ValueError(f"Invalid firmware size: {header.firmware_size}")

        firmware_data = signed_firmware[firmware_start:firmware_end]

        # 提取簽名
        signature_start = firmware_end
        signature_end = signature_start + header.signature_size

        if signature_end > len(signed_firmware):
            raise ValueError(f"Invalid signature size: {header.signature_size}")

        signature = signed_firmware[signature_start:signature_end]

        self.logger.debug(f"Parsed firmware:")
        self.logger.debug(f"  - Header: {HEADER_SIZE} bytes")
        self.logger.debug(f"  - Firmware: {len(firmware_data)} bytes")
        self.logger.debug(f"  - Signature: {len(signature)} bytes")

        return header, firmware_data, signature

    def verify_header(self, header: FirmwareHeader) -> Dict[str, bool]:
        """
        驗證頭部信息

        Args:
            header: 韌體頭部

        Returns:
            驗證結果字典
        """
        results = {}

        # 驗證 Magic
        results['magic'] = (header.magic == FIRMWARE_MAGIC)
        if not results['magic']:
            self.logger.error(f"Invalid magic: {header.magic} (expected: {FIRMWARE_MAGIC})")

        # 驗證版本號
        results['version'] = all(0 <= v <= 255 for v in header.version)
        if not results['version']:
            self.logger.error(f"Invalid version: {header.version}")

        # 驗證時間戳
        results['timestamp'] = (header.timestamp > 0)
        if not results['timestamp']:
            self.logger.error(f"Invalid timestamp: {header.timestamp}")

        # 驗證韌體大小
        results['firmware_size'] = (header.firmware_size > 0)
        if not results['firmware_size']:
            self.logger.error(f"Invalid firmware size: {header.firmware_size}")

        # 驗證哈希算法
        try:
            self.get_hash_algorithm(header.hash_algorithm)
            results['hash_algorithm'] = True
        except ValueError as e:
            self.logger.error(str(e))
            results['hash_algorithm'] = False

        # 驗證簽名算法
        results['signature_algorithm'] = (header.signature_algorithm in SIGNATURE_ALGORITHMS.values())
        if not results['signature_algorithm']:
            self.logger.error(f"Unknown signature algorithm: 0x{header.signature_algorithm:04X}")

        # 驗證簽名大小
        results['signature_size'] = (header.signature_size > 0)
        if not results['signature_size']:
            self.logger.error(f"Invalid signature size: {header.signature_size}")

        return results

    def verify_firmware_hash(self, header: FirmwareHeader, firmware_data: bytes) -> bool:
        """
        驗證韌體哈希

        Args:
            header: 韌體頭部
            firmware_data: 韌體數據

        Returns:
            驗證結果
        """
        try:
            # 獲取哈希算法
            hash_algo_name, _ = self.get_hash_algorithm(header.hash_algorithm)

            # 計算韌體哈希
            computed_hash = self.compute_hash(firmware_data, hash_algo_name)

            # 比較哈希（只比較有效部分）
            hash_size = len(computed_hash)
            stored_hash = header.hash[:hash_size]

            if computed_hash == stored_hash:
                self.logger.info(f"✓ Firmware hash verified ({hash_algo_name.upper()})")
                self.logger.debug(f"  Hash: {binascii.hexlify(computed_hash).decode()}")
                return True
            else:
                self.logger.error(f"✗ Firmware hash mismatch")
                self.logger.error(f"  Expected: {binascii.hexlify(stored_hash).decode()}")
                self.logger.error(f"  Computed: {binascii.hexlify(computed_hash).decode()}")
                return False

        except Exception as e:
            self.logger.error(f"Failed to verify firmware hash: {e}")
            return False

    def verify_crc32(self, header: FirmwareHeader, firmware_data: bytes) -> bool:
        """
        驗證 CRC32 校驗和

        Args:
            header: 韌體頭部
            firmware_data: 韌體數據

        Returns:
            驗證結果
        """
        try:
            # 計算 CRC32
            computed_crc = self.compute_crc32(firmware_data)

            if computed_crc == header.crc32:
                self.logger.info(f"✓ CRC32 verified: 0x{computed_crc:08X}")
                return True
            else:
                self.logger.error(f"✗ CRC32 mismatch")
                self.logger.error(f"  Expected: 0x{header.crc32:08X}")
                self.logger.error(f"  Computed: 0x{computed_crc:08X}")
                return False

        except Exception as e:
            self.logger.error(f"Failed to verify CRC32: {e}")
            return False

    def verify_signature(self, firmware_data: bytes, signature: bytes, hash_algorithm) -> bool:
        """
        驗證 RSA 簽名

        Args:
            firmware_data: 韌體數據
            signature: 簽名數據
            hash_algorithm: 哈希算法

        Returns:
            驗證結果
        """
        if not self.public_key:
            self.logger.warning("No public key provided, skipping signature verification")
            return None

        try:
            self.public_key.verify(
                signature,
                firmware_data,
                padding.PSS(
                    mgf=padding.MGF1(hash_algorithm),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hash_algorithm
            )

            self.logger.info(f"✓ Signature verified")
            return True

        except InvalidSignature:
            self.logger.error(f"✗ Invalid signature")
            return False
        except Exception as e:
            self.logger.error(f"Failed to verify signature: {e}")
            return False

    def verify_file(self, input_file: str, verbose: bool = False) -> Dict:
        """
        驗證簽名韌體文件

        Args:
            input_file: 輸入簽名文件路徑
            verbose: 是否顯示詳細信息

        Returns:
            驗證結果字典
        """
        self.logger.info(f"Verifying file: {input_file}")

        try:
            # 讀取簽名文件
            with open(input_file, 'rb') as f:
                signed_firmware = f.read()

            self.logger.info(f"File size: {len(signed_firmware)} bytes")

            # 解析簽名韌體
            header, firmware_data, signature = self.parse_signed_firmware(signed_firmware)

            # 顯示頭部信息
            if verbose:
                self.logger.info("\nFirmware Header:")
                for key, value in header.to_dict().items():
                    self.logger.info(f"  {key}: {value}")

            # 驗證頭部
            self.logger.info("\nVerifying header...")
            header_results = self.verify_header(header)
            header_valid = all(header_results.values())

            if header_valid:
                self.logger.info("✓ Header validation passed")
            else:
                self.logger.error("✗ Header validation failed")
                for key, value in header_results.items():
                    if not value:
                        self.logger.error(f"  - {key}: FAILED")

            # 驗證韌體哈希
            self.logger.info("\nVerifying firmware hash...")
            hash_valid = self.verify_firmware_hash(header, firmware_data)

            # 驗證 CRC32
            self.logger.info("\nVerifying CRC32...")
            crc_valid = self.verify_crc32(header, firmware_data)

            # 驗證簽名
            signature_valid = None
            if self.public_key:
                self.logger.info("\nVerifying signature...")
                hash_algo_name, hash_algo = self.get_hash_algorithm(header.hash_algorithm)
                signature_valid = self.verify_signature(firmware_data, signature, hash_algo)

            # 總結結果
            self.logger.info("\n" + "=" * 60)
            overall_valid = header_valid and hash_valid and crc_valid
            if signature_valid is not None:
                overall_valid = overall_valid and signature_valid

            if overall_valid:
                self.logger.info("✓ VERIFICATION PASSED")
            else:
                self.logger.error("✗ VERIFICATION FAILED")

            self.logger.info("=" * 60)

            # 返回驗證結果
            result = {
                'file': input_file,
                'file_size': len(signed_firmware),
                'header': header.to_dict(),
                'header_valid': header_valid,
                'hash_valid': hash_valid,
                'crc_valid': crc_valid,
                'signature_valid': signature_valid,
                'overall_valid': overall_valid,
                'timestamp': datetime.now().isoformat(),
            }

            return result

        except FileNotFoundError:
            self.logger.error(f"File not found: {input_file}")
            raise
        except Exception as e:
            self.logger.error(f"Verification failed: {e}")
            if self.logger.level == logging.DEBUG:
                import traceback
                traceback.print_exc()
            raise

    def verify_batch(self, input_dir: str, pattern: str = "*.bin", report_file: Optional[str] = None) -> Dict:
        """
        批量驗證簽名韌體文件

        Args:
            input_dir: 輸入目錄
            pattern: 文件匹配模式
            report_file: 報告文件路徑

        Returns:
            批量驗證結果
        """
        self.logger.info(f"Batch verification: {input_dir}")
        self.logger.info(f"Pattern: {pattern}")

        input_path = Path(input_dir)

        # 查找匹配的文件
        files = list(input_path.glob(pattern))

        if not files:
            self.logger.warning(f"No files found matching pattern: {pattern}")
            return {'files': [], 'summary': {}}

        self.logger.info(f"Found {len(files)} file(s) to verify")

        # 批量驗證
        results = []
        passed = 0
        failed = 0

        for i, input_file in enumerate(files, 1):
            self.logger.info(f"\n{'=' * 60}")
            self.logger.info(f"[{i}/{len(files)}] {input_file.name}")
            self.logger.info(f"{'=' * 60}")

            try:
                result = self.verify_file(str(input_file), verbose=False)
                results.append(result)

                if result['overall_valid']:
                    passed += 1
                else:
                    failed += 1

            except Exception as e:
                self.logger.error(f"Failed to verify {input_file.name}: {e}")
                results.append({
                    'file': str(input_file),
                    'error': str(e),
                    'overall_valid': False,
                    'timestamp': datetime.now().isoformat(),
                })
                failed += 1

        # 生成摘要
        summary = {
            'total': len(files),
            'passed': passed,
            'failed': failed,
            'success_rate': f"{(passed / len(files) * 100):.1f}%" if files else "0%",
        }

        batch_result = {
            'files': results,
            'summary': summary,
            'timestamp': datetime.now().isoformat(),
        }

        # 顯示摘要
        self.logger.info(f"\n{'=' * 60}")
        self.logger.info("BATCH VERIFICATION SUMMARY")
        self.logger.info(f"{'=' * 60}")
        self.logger.info(f"Total files: {summary['total']}")
        self.logger.info(f"Passed: {summary['passed']}")
        self.logger.info(f"Failed: {summary['failed']}")
        self.logger.info(f"Success rate: {summary['success_rate']}")
        self.logger.info(f"{'=' * 60}")

        # 生成報告
        if report_file:
            with open(report_file, 'w') as f:
                json.dump(batch_result, f, indent=2)
            self.logger.info(f"\nReport saved to: {report_file}")

        return batch_result


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description='Firmware Signature Verification Tool - 韌體簽名驗證工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # 驗證簽名（需要公鑰）
  %(prog)s -i firmware_signed.bin -k public_key.pem

  # 僅驗證頭部和哈希（不需要公鑰）
  %(prog)s -i firmware_signed.bin

  # 批量驗證
  %(prog)s --batch -d signed/ -k public_key.pem

  # 生成驗證報告
  %(prog)s -i firmware_signed.bin -k public_key.pem --report report.json

  # 詳細輸出
  %(prog)s -i firmware_signed.bin -k public_key.pem --verbose
        """
    )

    # 基本參數
    parser.add_argument('-i', '--input', help='輸入簽名文件路徑')
    parser.add_argument('-k', '--key', help='公鑰文件路徑 (PEM 格式，可選)')

    # 批量驗證
    parser.add_argument('--batch', action='store_true', help='批量驗證模式')
    parser.add_argument('-d', '--input-dir', help='輸入目錄（批量模式）')
    parser.add_argument('--pattern', default='*_signed.bin', help='文件匹配模式（批量模式）')

    # 報告參數
    parser.add_argument('--report', help='生成驗證報告（JSON 格式）')

    # 日誌參數
    parser.add_argument('--verbose', action='store_true', help='詳細輸出')
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
        # 創建驗證器
        verifier = FirmwareVerifier(
            public_key_path=args.key,
            log_level=log_level
        )

        # 執行驗證
        if args.batch:
            # 批量驗證模式
            if not args.input_dir:
                parser.error("Batch mode requires --input-dir")

            result = verifier.verify_batch(
                input_dir=args.input_dir,
                pattern=args.pattern,
                report_file=args.report
            )

            # 返回狀態碼
            if result['summary']['failed'] == 0:
                return 0
            else:
                return 1

        else:
            # 單文件驗證模式
            if not args.input:
                parser.error("Single file mode requires --input")

            result = verifier.verify_file(
                input_file=args.input,
                verbose=args.verbose
            )

            # 生成報告
            if args.report:
                with open(args.report, 'w') as f:
                    json.dump(result, f, indent=2)
                verifier.logger.info(f"\nReport saved to: {args.report}")

            # 返回狀態碼
            if result['overall_valid']:
                return 0
            else:
                return 1

    except Exception as e:
        logging.error(f"\nVerification error: {e}")
        if log_level == logging.DEBUG:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
