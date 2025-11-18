#!/usr/bin/env python3
"""
Python API Example for Firmware Signing Tool
使用 Python API 的簽名工具示例
"""

import os
import sys
import logging
import tempfile
from pathlib import Path

# 添加父目錄到路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from sign_firmware import FirmwareSigner
from verify_signature import FirmwareVerifier


def setup_example_environment():
    """設置示例環境"""
    # 創建臨時目錄
    temp_dir = Path(tempfile.mkdtemp(prefix='fw_signing_example_'))

    print(f"Created temporary directory: {temp_dir}")

    # 生成密鑰對
    private_key = temp_dir / 'private_key.pem'
    public_key = temp_dir / 'public_key.pem'

    print("\nGenerating RSA-2048 key pair...")
    os.system(f'openssl genrsa -out {private_key} 2048 2>/dev/null')
    os.system(f'openssl rsa -in {private_key} -pubout -out {public_key} 2>/dev/null')
    print(f"✓ Private key: {private_key}")
    print(f"✓ Public key: {public_key}")

    # 創建示例韌體
    firmware = temp_dir / 'firmware.bin'
    print(f"\nCreating sample firmware...")
    os.system(f'dd if=/dev/urandom of={firmware} bs=1024 count=128 2>/dev/null')
    print(f"✓ Firmware: {firmware} (128 KB)")

    return temp_dir, private_key, public_key, firmware


def example_1_basic_signing(private_key, public_key, firmware, temp_dir):
    """示例 1: 基本簽名和驗證"""
    print("\n" + "=" * 60)
    print("Example 1: Basic Signing and Verification")
    print("=" * 60)

    # 創建簽名器
    print("\nCreating signer with SHA-256 and RSA-2048...")
    signer = FirmwareSigner(
        private_key_path=str(private_key),
        hash_algorithm='sha256',
        key_size=2048,
        log_level=logging.INFO
    )

    # 簽名韌體
    signed_firmware = temp_dir / 'firmware_signed.bin'
    print(f"\nSigning firmware...")
    info = signer.sign_file(
        input_file=str(firmware),
        output_file=str(signed_firmware),
        version=(1, 0, 0, 0)
    )

    print(f"\n✓ Signing completed:")
    print(f"  Input size:  {info['input_size']:,} bytes")
    print(f"  Output size: {info['output_size']:,} bytes")
    print(f"  Overhead:    {info['output_size'] - info['input_size']:,} bytes")
    print(f"  Version:     {info['header']['version']}")
    print(f"  Hash:        {info['header']['hash'][:32]}...")
    print(f"  CRC32:       {info['header']['crc32']}")

    # 創建驗證器
    print(f"\nCreating verifier...")
    verifier = FirmwareVerifier(
        public_key_path=str(public_key),
        log_level=logging.WARNING  # 減少輸出
    )

    # 驗證簽名
    print(f"\nVerifying signature...")
    result = verifier.verify_file(
        input_file=str(signed_firmware),
        verbose=False
    )

    print(f"\n✓ Verification result:")
    print(f"  Header valid:    {result['header_valid']}")
    print(f"  Hash valid:      {result['hash_valid']}")
    print(f"  CRC valid:       {result['crc_valid']}")
    print(f"  Signature valid: {result['signature_valid']}")
    print(f"  Overall valid:   {result['overall_valid']}")

    return signed_firmware


def example_2_advanced_signing(private_key, firmware, temp_dir):
    """示例 2: 高級簽名（SHA-512 + RSA-4096）"""
    print("\n" + "=" * 60)
    print("Example 2: Advanced Signing (SHA-512 + RSA-4096)")
    print("=" * 60)

    # 生成 RSA-4096 密鑰
    private_key_4096 = temp_dir / 'private_key_4096.pem'
    public_key_4096 = temp_dir / 'public_key_4096.pem'

    print("\nGenerating RSA-4096 key pair...")
    os.system(f'openssl genrsa -out {private_key_4096} 4096 2>/dev/null')
    os.system(f'openssl rsa -in {private_key_4096} -pubout -out {public_key_4096} 2>/dev/null')
    print(f"✓ RSA-4096 keys generated")

    # 創建簽名器
    print("\nCreating signer with SHA-512 and RSA-4096...")
    signer = FirmwareSigner(
        private_key_path=str(private_key_4096),
        hash_algorithm='sha512',
        key_size=4096,
        log_level=logging.WARNING
    )

    # 讀取韌體
    with open(firmware, 'rb') as f:
        firmware_data = f.read()

    # 簽名韌體（使用低級 API）
    print(f"\nSigning firmware using low-level API...")
    signed_firmware_data, header = signer.sign_firmware(
        firmware_data=firmware_data,
        version=(2, 1, 3, 1024)
    )

    print(f"\n✓ Signing details:")
    print(f"  Magic:            {header.magic.decode('ascii')}")
    print(f"  Version:          {header.version[0]}.{header.version[1]}.{header.version[2]}.{header.version[3]}")
    print(f"  Firmware size:    {header.firmware_size:,} bytes")
    print(f"  Hash algorithm:   0x{header.hash_algorithm:04X} (SHA-512)")
    print(f"  Signature algo:   0x{header.signature_algorithm:04X} (RSA-4096)")
    print(f"  Signature size:   {header.signature_size} bytes")
    print(f"  Hash (first 32):  {header.hash[:32].hex()}")
    print(f"  CRC32:            0x{header.crc32:08X}")

    # 保存簽名韌體
    signed_firmware = temp_dir / 'firmware_signed_advanced.bin'
    with open(signed_firmware, 'wb') as f:
        f.write(signed_firmware_data)

    print(f"\n✓ Signed firmware saved: {signed_firmware}")

    # 驗證簽名
    print(f"\nVerifying with RSA-4096...")
    verifier = FirmwareVerifier(
        public_key_path=str(public_key_4096),
        log_level=logging.WARNING
    )

    result = verifier.verify_file(
        input_file=str(signed_firmware),
        verbose=False
    )

    print(f"✓ Verification: {'PASSED' if result['overall_valid'] else 'FAILED'}")


def example_3_batch_operations(private_key, public_key, temp_dir):
    """示例 3: 批量操作"""
    print("\n" + "=" * 60)
    print("Example 3: Batch Signing and Verification")
    print("=" * 60)

    # 創建多個韌體文件
    unsigned_dir = temp_dir / 'unsigned'
    signed_dir = temp_dir / 'signed'
    unsigned_dir.mkdir(exist_ok=True)
    signed_dir.mkdir(exist_ok=True)

    print(f"\nCreating 3 sample firmwares...")
    for i in range(1, 4):
        firmware_file = unsigned_dir / f'app_{i}.bin'
        size = 32 + i * 16  # 48, 64, 80 KB
        os.system(f'dd if=/dev/urandom of={firmware_file} bs=1024 count={size} 2>/dev/null')
        print(f"  ✓ Created: app_{i}.bin ({size} KB)")

    # 創建簽名器
    print(f"\nCreating signer...")
    signer = FirmwareSigner(
        private_key_path=str(private_key),
        hash_algorithm='sha256',
        key_size=2048,
        log_level=logging.WARNING
    )

    # 批量簽名
    print(f"\nBatch signing...")
    results = signer.sign_batch(
        input_dir=str(unsigned_dir),
        output_dir=str(signed_dir),
        pattern='*.bin',
        version=(3, 0, 0, 0)
    )

    print(f"\n✓ Batch signing results:")
    successful = len([r for r in results if 'error' not in r])
    print(f"  Total:      {len(results)}")
    print(f"  Successful: {successful}")
    print(f"  Failed:     {len(results) - successful}")

    # 批量驗證
    print(f"\nBatch verification...")
    verifier = FirmwareVerifier(
        public_key_path=str(public_key),
        log_level=logging.WARNING
    )

    batch_result = verifier.verify_batch(
        input_dir=str(signed_dir),
        pattern='*_signed.bin',
        report_file=str(temp_dir / 'batch_report.json')
    )

    print(f"\n✓ Batch verification summary:")
    print(f"  Total:        {batch_result['summary']['total']}")
    print(f"  Passed:       {batch_result['summary']['passed']}")
    print(f"  Failed:       {batch_result['summary']['failed']}")
    print(f"  Success rate: {batch_result['summary']['success_rate']}")
    print(f"\n✓ Report saved: {temp_dir / 'batch_report.json'}")


def example_4_error_handling(private_key, public_key, temp_dir):
    """示例 4: 錯誤處理"""
    print("\n" + "=" * 60)
    print("Example 4: Error Handling")
    print("=" * 60)

    # 創建損壞的簽名文件
    damaged_firmware = temp_dir / 'damaged_signed.bin'

    # 首先創建一個正常的簽名文件
    print(f"\nCreating a properly signed firmware...")
    firmware = temp_dir / 'firmware.bin'

    signer = FirmwareSigner(
        private_key_path=str(private_key),
        hash_algorithm='sha256',
        key_size=2048,
        log_level=logging.WARNING
    )

    with open(firmware, 'rb') as f:
        firmware_data = f.read()

    signed_data, _ = signer.sign_firmware(firmware_data)

    # 損壞簽名（修改中間的幾個字節）
    print(f"Creating damaged firmware (corrupting signature)...")
    damaged_data = bytearray(signed_data)
    # 修改簽名部分的幾個字節
    damaged_data[-100] ^= 0xFF
    damaged_data[-50] ^= 0xFF

    with open(damaged_firmware, 'wb') as f:
        f.write(bytes(damaged_data))

    print(f"✓ Damaged firmware created")

    # 嘗試驗證損壞的文件
    print(f"\nVerifying damaged firmware...")
    verifier = FirmwareVerifier(
        public_key_path=str(public_key),
        log_level=logging.WARNING
    )

    result = verifier.verify_file(
        input_file=str(damaged_firmware),
        verbose=False
    )

    print(f"\n✓ Verification result (should fail):")
    print(f"  Header valid:    {result['header_valid']}")
    print(f"  Hash valid:      {result['hash_valid']}")
    print(f"  CRC valid:       {result['crc_valid']}")
    print(f"  Signature valid: {result['signature_valid']}")
    print(f"  Overall valid:   {result['overall_valid']}")

    if not result['overall_valid']:
        print(f"\n✓ Correctly detected damaged firmware!")
    else:
        print(f"\n✗ Failed to detect damaged firmware!")


def main():
    """主函數"""
    print("=" * 60)
    print("Firmware Signing Tool - Python API Examples")
    print("=" * 60)

    # 設置環境
    temp_dir, private_key, public_key, firmware = setup_example_environment()

    try:
        # 運行示例
        example_1_basic_signing(private_key, public_key, firmware, temp_dir)
        example_2_advanced_signing(private_key, firmware, temp_dir)
        example_3_batch_operations(private_key, public_key, temp_dir)
        example_4_error_handling(private_key, public_key, temp_dir)

        # 完成
        print("\n" + "=" * 60)
        print("All examples completed successfully!")
        print("=" * 60)
        print(f"\nAll files are in: {temp_dir}")
        print(f"To clean up, run: rm -rf {temp_dir}")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == '__main__':
    sys.exit(main())
