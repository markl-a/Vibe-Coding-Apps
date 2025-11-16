# 📦 Update Packager - 更新打包工具

## 概述

OTA 更新包生成工具，支援完整更新和差分更新包的創建。

## 功能特點

- ✅ 完整更新包生成
- ✅ 差分更新包生成
- ✅ 壓縮支援
- ✅ 多文件打包
- ✅ 元數據管理
- ✅ 簽名整合

## 使用方法

### 生成完整更新包

```bash
python3 create_ota_package.py \
    --type full \
    --firmware firmware.bin \
    --version 1.2.3 \
    --output firmware_v1.2.3.ota \
    --sign --key private_key.pem
```

### 生成差分更新包

```bash
python3 create_ota_package.py \
    --type delta \
    --old-firmware firmware_v1.2.2.bin \
    --new-firmware firmware_v1.2.3.bin \
    --output delta_1.2.2_to_1.2.3.ota \
    --compress gzip \
    --sign --key private_key.pem
```

### 生成元數據

```bash
python3 create_ota_package.py \
    --metadata-only \
    --version 1.2.3 \
    --url https://ota.example.com/firmware_v1.2.3.ota \
    --size 524288 \
    --output metadata.json
```

## 更新包格式

```json
{
    "header": {
        "magic": "OTA_PKG",
        "version": "1.2.3",
        "type": "full",
        "size": 524288,
        "timestamp": 1699000000,
        "compression": "gzip"
    },
    "firmware": {
        "offset": 512,
        "size": 512000,
        "checksum": "sha256:abcd1234..."
    },
    "signature": {
        "algorithm": "rsa-sha256",
        "value": "base64_signature"
    }
}
```

## 目錄結構

```
ota_packages/
├── v1.2.3/
│   ├── firmware_full.ota
│   ├── metadata.json
│   └── changelog.md
├── delta/
│   ├── 1.2.2_to_1.2.3.ota
│   └── 1.2.1_to_1.2.3.ota
└── manifest.json
```

**狀態**: ✅ 可用

---

**最後更新**: 2025-11-16
