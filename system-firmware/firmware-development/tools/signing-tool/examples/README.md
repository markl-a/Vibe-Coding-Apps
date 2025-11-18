# Signing Tool Examples - 簽名工具示例

本目錄包含韌體簽名工具的使用示例。

## 示例列表

### 1. basic_signing.sh - 基本簽名示例

展示基本的簽名和驗證流程：
- 生成 RSA-2048 密鑰對
- 創建示例韌體
- 簽名韌體
- 驗證簽名

**運行方式：**
```bash
cd examples
chmod +x basic_signing.sh
./basic_signing.sh
```

**輸出：**
- `temp/private_key.pem` - RSA 私鑰
- `temp/public_key.pem` - RSA 公鑰
- `temp/firmware.bin` - 示例韌體（64 KB）
- `temp/firmware_signed.bin` - 簽名後的韌體

---

### 2. batch_signing.sh - 批量簽名示例

展示批量簽名和驗證流程：
- 生成 RSA-4096 密鑰對
- 創建 5 個不同大小的韌體
- 批量簽名所有韌體
- 批量驗證所有簽名
- 生成 JSON 報告

**運行方式：**
```bash
cd examples
chmod +x batch_signing.sh
./batch_signing.sh
```

**輸出：**
- `temp_batch/unsigned/` - 5 個未簽名韌體
- `temp_batch/signed/` - 5 個簽名後的韌體
- `temp_batch/batch_signing_report.json` - 簽名報告
- `temp_batch/batch_verification_report.json` - 驗證報告

---

### 3. python_api_example.py - Python API 示例

展示如何使用 Python API：
- 基本簽名和驗證
- 高級簽名（SHA-512 + RSA-4096）
- 批量操作
- 錯誤處理

**運行方式：**
```bash
cd examples
python3 python_api_example.py
```

**示例內容：**

#### Example 1: 基本簽名和驗證
```python
from sign_firmware import FirmwareSigner
from verify_signature import FirmwareVerifier

# 創建簽名器
signer = FirmwareSigner(
    private_key_path='private_key.pem',
    hash_algorithm='sha256',
    key_size=2048
)

# 簽名韌體
info = signer.sign_file(
    input_file='firmware.bin',
    output_file='firmware_signed.bin',
    version=(1, 0, 0, 0)
)

# 驗證簽名
verifier = FirmwareVerifier(public_key_path='public_key.pem')
result = verifier.verify_file('firmware_signed.bin')

print(f"Valid: {result['overall_valid']}")
```

#### Example 2: 高級簽名
```python
# 使用 SHA-512 和 RSA-4096
signer = FirmwareSigner(
    private_key_path='private_key_4096.pem',
    hash_algorithm='sha512',
    key_size=4096
)

# 使用低級 API 獲取詳細信息
signed_data, header = signer.sign_firmware(
    firmware_data=firmware_bytes,
    version=(2, 1, 3, 1024)
)

print(f"Hash: {header.hash.hex()}")
print(f"CRC32: 0x{header.crc32:08X}")
```

#### Example 3: 批量操作
```python
# 批量簽名
results = signer.sign_batch(
    input_dir='unsigned/',
    output_dir='signed/',
    pattern='*.bin',
    version=(3, 0, 0, 0)
)

# 批量驗證
batch_result = verifier.verify_batch(
    input_dir='signed/',
    pattern='*_signed.bin',
    report_file='report.json'
)

print(f"Success rate: {batch_result['summary']['success_rate']}")
```

#### Example 4: 錯誤處理
```python
# 驗證損壞的韌體
result = verifier.verify_file('damaged_firmware.bin')

if not result['overall_valid']:
    print("Firmware is corrupted!")
    if not result['hash_valid']:
        print("  - Hash verification failed")
    if not result['signature_valid']:
        print("  - Signature verification failed")
```

---

## 快速開始

### 1. 安裝依賴

```bash
pip install cryptography
```

### 2. 運行所有示例

```bash
# 基本簽名
./examples/basic_signing.sh

# 批量簽名
./examples/batch_signing.sh

# Python API
python3 examples/python_api_example.py
```

### 3. 清理臨時文件

```bash
rm -rf examples/temp*
```

## 自定義示例

### 創建自己的簽名腳本

```bash
#!/bin/bash

# 1. 生成密鑰（如果還沒有）
if [ ! -f my_key.pem ]; then
    openssl genrsa -out my_key.pem 2048
    openssl rsa -in my_key.pem -pubout -out my_key_pub.pem
fi

# 2. 簽名韌體
python3 ../sign_firmware.py \
    -i my_firmware.bin \
    -o my_firmware_signed.bin \
    -k my_key.pem \
    --version 1.0.0.0 \
    --report signing_report.json

# 3. 驗證簽名
python3 ../verify_signature.py \
    -i my_firmware_signed.bin \
    -k my_key_pub.pem \
    --verbose
```

### 創建自己的 Python 腳本

```python
#!/usr/bin/env python3
import sys
from pathlib import Path

# 添加工具路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from sign_firmware import FirmwareSigner

def main():
    # 創建簽名器
    signer = FirmwareSigner(
        private_key_path='my_key.pem',
        hash_algorithm='sha256',
        key_size=2048
    )

    # 簽名韌體
    info = signer.sign_file(
        input_file='my_firmware.bin',
        output_file='my_firmware_signed.bin',
        version=(1, 0, 0, 0)
    )

    print(f"Signed: {info['output_file']}")
    print(f"Size: {info['output_size']} bytes")

    return 0

if __name__ == '__main__':
    sys.exit(main())
```

## 常見問題

### Q: 如何生成不同大小的 RSA 密鑰？

```bash
# RSA-2048
openssl genrsa -out key_2048.pem 2048

# RSA-4096
openssl genrsa -out key_4096.pem 4096
```

### Q: 如何使用密碼保護私鑰？

```bash
# 生成帶密碼的私鑰
openssl genrsa -aes256 -out encrypted_key.pem 2048

# 移除密碼
openssl rsa -in encrypted_key.pem -out key.pem
```

### Q: 如何查看簽名韌體的信息？

```bash
# 使用驗證工具查看（無需公鑰）
python3 ../verify_signature.py -i firmware_signed.bin --verbose
```

### Q: 簽名失敗怎麼辦？

檢查：
1. 私鑰格式是否正確（PEM 格式）
2. 私鑰權限是否正確（600）
3. 韌體文件是否存在且可讀
4. 輸出目錄是否有寫入權限

```bash
# 檢查私鑰
openssl rsa -in private_key.pem -check -noout

# 檢查文件權限
ls -l private_key.pem firmware.bin

# 設置正確的權限
chmod 600 private_key.pem
chmod 644 firmware.bin
```

## 性能測試

測試不同大小韌體的簽名性能：

```bash
#!/bin/bash

for size in 32 64 128 256 512 1024; do
    echo "Testing ${size}KB firmware..."

    # 創建測試韌體
    dd if=/dev/urandom of=test_${size}k.bin bs=1024 count=$size 2>/dev/null

    # 測量簽名時間
    time python3 ../sign_firmware.py \
        -i test_${size}k.bin \
        -o test_${size}k_signed.bin \
        -k private_key.pem \
        -q

    # 測量驗證時間
    time python3 ../verify_signature.py \
        -i test_${size}k_signed.bin \
        -k public_key.pem \
        -q

    echo ""
done

# 清理
rm -f test_*.bin
```

## 集成到 CI/CD

### GitHub Actions 示例

```yaml
name: Sign Firmware

on:
  push:
    tags:
      - 'v*'

jobs:
  sign:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install dependencies
        run: pip install cryptography

      - name: Sign firmware
        env:
          SIGNING_KEY: ${{ secrets.SIGNING_KEY }}
        run: |
          echo "$SIGNING_KEY" > private_key.pem
          chmod 600 private_key.pem

          python3 tools/signing-tool/sign_firmware.py \
            -i build/firmware.bin \
            -o release/firmware_signed.bin \
            -k private_key.pem \
            --version ${GITHUB_REF#refs/tags/v}

          rm private_key.pem

      - name: Upload signed firmware
        uses: actions/upload-artifact@v2
        with:
          name: firmware-signed
          path: release/firmware_signed.bin
```

## 相關資源

- [主 README](../README.md) - 完整文檔
- [sign_firmware.py](../sign_firmware.py) - 簽名工具源碼
- [verify_signature.py](../verify_signature.py) - 驗證工具源碼

## 支援

如有問題，請查看主 README 的故障排除部分，或提交 Issue。
