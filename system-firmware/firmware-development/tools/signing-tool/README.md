# ✒️ Signing Tool - 簽名工具

## 概述

韌體簽名工具，用於生成和驗證 RSA/ECDSA 數位簽名。

## 功能特點

- ✅ RSA-2048/4096 簽名
- ✅ ECDSA P-256/P-384 簽名
- ✅ 批量簽名
- ✅ 簽名驗證
- ✅ 密鑰管理
- ✅ HSM 支援

## 使用方法

### 簽名韌體

```bash
# RSA 簽名
python3 sign_firmware.py \
    --input firmware.bin \
    --output firmware_signed.bin \
    --key private_key.pem \
    --algorithm rsa-sha256

# ECDSA 簽名
python3 sign_firmware.py \
    --input firmware.bin \
    --output firmware_signed.bin \
    --key ec_private_key.pem \
    --algorithm ecdsa-sha256
```

### 驗證簽名

```bash
python3 verify_signature.py \
    --input firmware_signed.bin \
    --key public_key.pem
```

### 批量簽名

```bash
python3 sign_firmware.py \
    --batch \
    --input-dir build/ \
    --output-dir signed/ \
    --key private_key.pem
```

## Python API

```python
from signing_tool import FirmwareSigner

signer = FirmwareSigner('private_key.pem', algorithm='rsa-sha256')

# 簽名
signature = signer.sign_file('firmware.bin')

# 生成簽名文件
signer.sign_and_package('firmware.bin', 'firmware_signed.bin')

# 驗證
if signer.verify('firmware_signed.bin', 'public_key.pem'):
    print("Signature valid!")
```

## 簽名格式

```
┌─────────────────┬──────────────┐
│ Firmware Header │ 512 bytes    │
├─────────────────┼──────────────┤
│ Firmware Data   │ Variable     │
├─────────────────┼──────────────┤
│ RSA Signature   │ 256/512 bytes│
└─────────────────┴──────────────┘
```

**狀態**: ✅ 可用
