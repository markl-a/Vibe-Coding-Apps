# OTA Update Packager

完整的 OTA (Over-The-Air) 固件更新打包工具套件，支援完整更新、差分更新、A/B 分區更新、簽名、加密等功能。

## 目錄

- [概述](#概述)
- [功能特性](#功能特性)
- [安裝](#安裝)
- [工具說明](#工具說明)
  - [package_update.py](#package_updatepy)
  - [create_delta.py](#create_deltapy)
- [使用指南](#使用指南)
- [Manifest 格式](#manifest-格式)
- [安全性](#安全性)
- [最佳實踐](#最佳實踐)
- [故障排除](#故障排除)

## 概述

OTA Update Packager 是一套完整的固件更新打包工具，專為嵌入式系統和 IoT 設備設計。支援：

- **完整更新包**：包含完整固件映像的更新包
- **差分更新包**：僅包含變更部分的增量更新（節省帶寬）
- **A/B 分區更新**：支援 A/B 雙分區無縫更新和回滾
- **安全保護**：數位簽名、加密、校驗和驗證
- **版本控制**：版本管理和回滾保護
- **壓縮優化**：支援多種壓縮算法（gzip、zlib、lzma、bzip2）

## 功能特性

### 核心功能

- ✅ **完整更新包生成**：打包完整固件映像
- ✅ **差分更新包生成**：使用 bsdiff、xdelta3 等算法
- ✅ **A/B 分區更新**：無縫更新，失敗自動回滾
- ✅ **多文件支援**：一個更新包可包含多個文件
- ✅ **版本控制**：語義化版本管理（major.minor.patch.build）
- ✅ **元數據管理**：完整的 manifest.json 元數據

### 壓縮支援

- `none` - 無壓縮
- `gzip` - GZIP 壓縮（預設，兼容性最好）
- `zlib` - Zlib 壓縮
- `lzma` - LZMA 壓縮（最高壓縮率）
- `bzip2` - BZip2 壓縮

### 安全功能

- ✅ **數位簽名**：RSA-2048、RSA-4096、ECDSA
- ✅ **加密**：AES-128/256（CBC、GCM、CTR 模式）
- ✅ **校驗和驗證**：SHA-256、SHA-512
- ✅ **回滾保護**：防止降級到不安全版本
- ✅ **完整性檢查**：多層次的完整性驗證

### 差分更新算法

- **bsdiff**：二進制差分算法，適合小型更新
- **xdelta3**：高效的增量差分算法
- **custom**：自定義塊差分算法

## 安裝

### 系統要求

- Python 3.8+
- Linux、macOS 或 Windows

### Python 依賴

```bash
# 基本依賴（已內建）
# - json
# - gzip
# - zlib
# - hashlib
# - tarfile

# 可選依賴（增強功能）
pip install cryptography  # 用於加密功能

# 差分更新工具（可選）
# Ubuntu/Debian
sudo apt-get install bsdiff

# macOS
brew install bsdiff

# xdelta3（可選）
sudo apt-get install xdelta3  # Ubuntu/Debian
brew install xdelta           # macOS
```

### 設置

```bash
# 給予執行權限
chmod +x package_update.py
chmod +x create_delta.py

# 驗證安裝
python3 package_update.py --help
python3 create_delta.py --help
```

## 工具說明

### package_update.py

主打包工具，用於創建完整或增量 OTA 更新包。

#### 基本用法

```bash
# 創建簡單的完整更新包
python3 package_update.py \
  -o firmware_v1.0.0.ota \
  -v 1.0.0.0 \
  -m ESP32 \
  -f firmware.bin:firmware:system

# 創建多文件更新包
python3 package_update.py \
  -o update_v2.0.0.ota \
  -v 2.0.0.0 \
  -m ESP32-S3 \
  -f bootloader.bin:bootloader:boot \
  -f firmware.bin:firmware:system \
  -f rootfs.img:rootfs:data

# 創建簽名的更新包
python3 package_update.py \
  -o signed_update.ota \
  -v 1.1.0.0 \
  -f firmware.bin:firmware:system \
  --sign \
  -k /path/to/private_key.pem \
  --sign-algorithm rsa2048

# 創建加密和簽名的更新包
python3 package_update.py \
  -o secure_update.ota \
  -v 1.2.0.0 \
  -f firmware.bin:firmware:system \
  --sign -k private_key.pem \
  --encrypt --encryption-key 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# 啟用 A/B 分區更新
python3 package_update.py \
  -o ab_update.ota \
  -v 2.0.0.0 \
  -f firmware.bin:firmware:system \
  --ab-update \
  --target-slot auto

# 創建差分更新包
python3 package_update.py \
  -o delta_update.ota \
  -v 1.0.1.0 \
  -t delta \
  -f patch.delta:patch:system \
  --min-version 1.0.0.0
```

#### 參數說明

##### 必需參數

- `-o, --output <file>` - 輸出更新包文件路徑
- `-v, --version <version>` - 固件版本（格式：major.minor.patch.build）
- `-f, --file <spec>` - 添加文件（格式：路徑:類型:分區）

##### 可選參數

**基本配置：**
- `-m, --model <model>` - 目標設備型號（預設：unknown）
- `-hw, --hardware-version <version>` - 硬體版本（預設：1.0）
- `-t, --type <type>` - 更新包類型：full、delta、incremental（預設：full）

**A/B 更新：**
- `--ab-update` - 啟用 A/B 分區更新
- `--target-slot <slot>` - 目標槽位：auto、A、B（預設：auto）

**壓縮：**
- `-c, --compression <algo>` - 壓縮算法：none、gzip、zlib、lzma、bzip2（預設：gzip）

**簽名：**
- `--sign` - 簽名更新包
- `-k, --private-key <file>` - 私鑰文件
- `--sign-algorithm <algo>` - 簽名算法：rsa2048、rsa4096、ecdsa（預設：rsa2048）

**加密：**
- `--encrypt` - 加密更新包
- `--encryption-key <key>` - 加密密鑰（十六進制字符串）
- `--encryption-algorithm <algo>` - 加密算法：aes128、aes256（預設：aes256）

**回滾保護：**
- `--rollback-protection` - 啟用回滾保護（預設：啟用）
- `--min-version <version>` - 最低允許固件版本
- `--security-level <level>` - 安全補丁級別（預設：1）

**元數據：**
- `--author <name>` - 作者名稱
- `--description <text>` - 更新包描述
- `--changelog <entry>` - 變更日誌條目（可多次使用）
- `--tag <tag>` - 標籤（可多次使用）

#### 文件類型

在 `-f` 參數中使用的文件類型：

- `firmware` - 固件映像
- `bootloader` - 引導加載程序
- `kernel` - 內核映像
- `rootfs` - 根文件系統
- `data` - 數據文件
- `patch` - 差分補丁

### create_delta.py

差分更新生成工具，用於創建增量更新補丁。

#### 基本用法

```bash
# 生成 bsdiff 差分補丁
python3 create_delta.py generate \
  -s old_firmware.bin \
  -t new_firmware.bin \
  -o firmware.delta

# 使用 xdelta3 算法
python3 create_delta.py generate \
  -s old_firmware.bin \
  -t new_firmware.bin \
  -o firmware.delta \
  -a xdelta3

# 生成並保存統計信息
python3 create_delta.py generate \
  -s old_firmware.bin \
  -t new_firmware.bin \
  -o firmware.delta \
  --stats delta_stats.json

# 應用差分補丁
python3 create_delta.py apply \
  -s old_firmware.bin \
  -p firmware.delta \
  -o new_firmware.bin

# 使用自定義算法
python3 create_delta.py generate \
  -s old.bin \
  -t new.bin \
  -o patch.delta \
  -a custom
```

#### 參數說明

##### generate 命令

- `-s, --source <file>` - 源（舊）固件文件
- `-t, --target <file>` - 目標（新）固件文件
- `-o, --output <file>` - 輸出補丁文件
- `-a, --algorithm <algo>` - 差分算法：bsdiff、xdelta3、custom（預設：bsdiff）
- `-c, --compression <algo>` - 壓縮算法：bz2、gz、none（預設：bz2）
- `--stats <file>` - 保存統計信息到 JSON 文件

##### apply 命令

- `-s, --source <file>` - 源（舊）固件文件
- `-p, --patch <file>` - 補丁文件
- `-o, --output <file>` - 輸出（新）固件文件
- `-a, --algorithm <algo>` - 差分算法（預設：bsdiff）
- `--no-verify` - 跳過輸出驗證

## 使用指南

### 完整更新工作流程

#### 1. 準備固件文件

```bash
# 確保固件文件存在
ls -lh firmware.bin
ls -lh bootloader.bin
```

#### 2. 創建更新包

```bash
# 基本更新包
python3 package_update.py \
  -o firmware_v1.0.0.ota \
  -v 1.0.0.0 \
  -m ESP32-DevKit \
  -hw 1.0 \
  -f firmware.bin:firmware:system \
  --author "開發團隊" \
  --description "初始版本發布" \
  --changelog "新增：基本功能實現" \
  --changelog "修復：已知問題"
```

#### 3. 驗證更新包

```bash
# 檢查生成的文件
ls -lh firmware_v1.0.0.ota
cat firmware_v1.0.0.manifest.json | jq .
```

#### 4. 部署更新包

將 `.ota` 文件上傳到 OTA 服務器供設備下載。

### 差分更新工作流程

#### 1. 生成差分補丁

```bash
# 創建從 v1.0.0 到 v1.0.1 的差分補丁
python3 create_delta.py generate \
  -s firmware_v1.0.0.bin \
  -t firmware_v1.0.1.bin \
  -o firmware_v1.0.0_to_v1.0.1.delta \
  --stats delta_stats.json

# 查看統計信息
cat delta_stats.json | jq .
```

#### 2. 創建差分更新包

```bash
python3 package_update.py \
  -o delta_v1.0.1.ota \
  -v 1.0.1.0 \
  -t delta \
  -m ESP32-DevKit \
  -f firmware_v1.0.0_to_v1.0.1.delta:patch:system \
  --min-version 1.0.0.0 \
  --description "增量更新到 v1.0.1" \
  --changelog "修復：記憶體洩漏問題"
```

#### 3. 測試差分補丁

```bash
# 驗證補丁可以正確應用
python3 create_delta.py apply \
  -s firmware_v1.0.0.bin \
  -p firmware_v1.0.0_to_v1.0.1.delta \
  -o firmware_v1.0.1_restored.bin

# 比較還原的文件與原始文件
diff firmware_v1.0.1.bin firmware_v1.0.1_restored.bin
sha256sum firmware_v1.0.1.bin firmware_v1.0.1_restored.bin
```

### 安全更新工作流程

#### 1. 生成密鑰對（如果尚未生成）

```bash
# 使用簽名工具生成密鑰對
cd ../signing-tool
python3 sign_firmware.py keygen -o update_keys

# 生成加密密鑰
python3 -c "import secrets; print(secrets.token_hex(32))" > encryption.key
```

#### 2. 創建安全更新包

```bash
cd ../update-packager

# 讀取加密密鑰
ENCRYPT_KEY=$(cat ../signing-tool/encryption.key)

# 創建簽名和加密的更新包
python3 package_update.py \
  -o secure_firmware_v2.0.0.ota \
  -v 2.0.0.0 \
  -m ESP32-DevKit \
  -f firmware.bin:firmware:system \
  --sign \
  -k ../signing-tool/update_keys_private.pem \
  --sign-algorithm rsa2048 \
  --encrypt \
  --encryption-key $ENCRYPT_KEY \
  --encryption-algorithm aes256 \
  --rollback-protection \
  --min-version 1.0.0.0 \
  --security-level 2
```

#### 3. 分發公鑰

```bash
# 將公鑰嵌入到設備固件中
cp ../signing-tool/update_keys_public.pem /path/to/device/firmware/keys/
```

### A/B 分區更新工作流程

```bash
# 創建 A/B 更新包
python3 package_update.py \
  -o ab_firmware_v3.0.0.ota \
  -v 3.0.0.0 \
  -m ESP32-S3 \
  -f firmware.bin:firmware:system \
  --ab-update \
  --target-slot auto \
  --sign -k ../signing-tool/private.pem \
  --description "支援 A/B 無縫更新"
```

## Manifest 格式

更新包的 `manifest.json` 包含所有元數據信息。

### 基本結構

```json
{
  "version": "1.0.0",
  "package_type": "full",
  "firmware_version": {
    "major": 1,
    "minor": 0,
    "patch": 0,
    "build": 0,
    "version_string": "1.0.0.0"
  },
  "build_date": "2025-11-18T10:30:00Z",
  "target_device": {
    "model": "ESP32-DevKit",
    "hardware_version": "1.0",
    "min_firmware_version": "1.0.0.0"
  },
  "ab_update": {
    "enabled": true,
    "target_slot": "auto",
    "verify_before_reboot": true,
    "fallback_enabled": true
  },
  "files": [
    {
      "name": "firmware.bin",
      "path": "/system/firmware.bin",
      "size": 1048576,
      "compressed_size": 524288,
      "checksum": "sha256_checksum_here...",
      "type": "firmware",
      "compression": "gzip",
      "partition": "system",
      "offset": 0
    }
  ],
  "checksums": {
    "algorithm": "sha256",
    "package_checksum": "package_sha256_here...",
    "manifest_checksum": "manifest_sha256_here..."
  },
  "signature": {
    "algorithm": "rsa2048",
    "signature": "base64_signature_here...",
    "public_key_fingerprint": "key_fingerprint_here...",
    "signing_date": "2025-11-18T10:30:00Z"
  },
  "rollback_protection": {
    "enabled": true,
    "minimum_version": "1.0.0.0",
    "security_patch_level": 1
  },
  "metadata": {
    "author": "Development Team",
    "description": "Firmware update package",
    "changelog": [
      "Added new feature X",
      "Fixed bug Y"
    ],
    "tags": ["stable", "production"]
  }
}
```

### Manifest Schema

完整的 JSON Schema 定義請參考 `manifest_schema.json`。

## 安全性

### 簽名驗證流程

1. **設備端**接收更新包
2. 使用內嵌的公鑰驗證簽名
3. 驗證成功後才解包
4. 驗證每個文件的校驗和
5. 驗證版本是否允許（回滾保護）
6. 應用更新

### 加密說明

- 使用 AES-256-GCM（預設）提供加密和認證
- IV（初始化向量）存儲在加密文件開頭
- GCM 模式的認證標籤存儲在文件末尾

### 回滾保護

回滾保護防止設備被降級到不安全的版本：

```python
# 設備端檢查邏輯
if update_version < minimum_allowed_version:
    reject_update("Version too old")

if update_security_level < current_security_level:
    reject_update("Security patch level too low")
```

### 最佳安全實踐

1. **始終簽名生產更新包**
2. **保護私鑰安全**：使用硬體安全模組（HSM）或安全密鑰管理
3. **啟用回滾保護**：防止降級攻擊
4. **使用 HTTPS**：傳輸更新包時使用安全連接
5. **驗證校驗和**：多層次驗證文件完整性
6. **啟用 A/B 更新**：確保更新失敗時可以回滾

## 最佳實踐

### 版本命名

使用語義化版本：

- **Major**：重大變更、不兼容 API 變更
- **Minor**：新功能、向後兼容
- **Patch**：錯誤修復
- **Build**：構建編號

範例：
- `1.0.0.0` - 初始發布
- `1.1.0.0` - 新增功能
- `1.1.1.0` - 錯誤修復
- `2.0.0.0` - 重大變更

### 更新包大小優化

1. **使用差分更新**：對於小改動，差分包可能小 90%+
2. **選擇合適的壓縮**：
   - LZMA：最高壓縮率，但較慢
   - GZIP：平衡性能和壓縮率（推薦）
   - None：最快，但包最大
3. **移除調試符號**：發布前 strip 二進制文件
4. **優化資源**：壓縮圖片、優化數據文件

### 測試流程

```bash
# 1. 創建測試更新包
python3 package_update.py -o test.ota -v 1.0.0.1 -f test_firmware.bin:firmware:system

# 2. 驗證 manifest
cat test.manifest.json | jq .

# 3. 解包驗證
mkdir test_extract
tar -xvf test.ota -C test_extract/

# 4. 驗證校驗和
sha256sum test_extract/firmware.bin.compressed

# 5. 在測試設備上測試

# 6. 驗證回滾功能
```

### 發布流程

1. **開發階段**：創建未簽名的測試包
2. **測試階段**：在測試設備上驗證
3. **預發布**：創建簽名包，內部測試
4. **生產發布**：創建簽名+加密包
5. **灰度發布**：先發布給部分設備
6. **全量發布**：確認無問題後全量推送

## 故障排除

### 常見問題

#### 1. 簽名失敗

```
錯誤: Signing tool not found
```

**解決方案：**
```bash
# 確保簽名工具存在
ls -la ../signing-tool/sign_firmware.py

# 或使用絕對路徑指定私鑰
python3 package_update.py --sign -k /absolute/path/to/private.pem ...
```

#### 2. 加密庫未安裝

```
錯誤: cryptography library not available
```

**解決方案：**
```bash
pip install cryptography
```

#### 3. bsdiff 未安裝

```
警告: bsdiff not found, using custom implementation
```

**解決方案：**
```bash
# Ubuntu/Debian
sudo apt-get install bsdiff

# macOS
brew install bsdiff
```

#### 4. 文件過大

```
錯誤: Package too large
```

**解決方案：**
- 使用差分更新代替完整更新
- 使用更高壓縮率（lzma）
- 分割成多個更新包

#### 5. 版本格式錯誤

```
錯誤: Version must be in format: major.minor.patch.build
```

**解決方案：**
```bash
# 錯誤
-v 1.0.0

# 正確
-v 1.0.0.0
```

### 調試模式

```bash
# 啟用詳細日誌
export PYTHONVERBOSE=1
python3 package_update.py ...

# 查看 manifest 詳情
cat output.manifest.json | jq .

# 驗證包內容
tar -tvf output.ota
```

### 獲取幫助

```bash
# 顯示完整幫助
python3 package_update.py --help
python3 create_delta.py --help

# 查看示例
python3 package_update.py --help | grep -A 20 "Examples:"
```

## 高級功能

### 自定義 Manifest

```python
import json

# 加載並修改 manifest
with open('firmware.manifest.json', 'r') as f:
    manifest = json.load(f)

# 添加自定義字段
manifest['metadata']['custom_field'] = 'custom_value'
manifest['metadata']['build_server'] = 'jenkins-01'

# 保存
with open('firmware.manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)
```

### 批量生成更新包

```bash
#!/bin/bash
# batch_build.sh

VERSIONS=("1.0.0.0" "1.0.1.0" "1.1.0.0" "2.0.0.0")

for ver in "${VERSIONS[@]}"; do
    echo "Building version $ver..."
    python3 package_update.py \
        -o "firmware_v${ver}.ota" \
        -v "$ver" \
        -m ESP32 \
        -f "binaries/firmware_${ver}.bin:firmware:system" \
        --sign -k keys/private.pem
done
```

### 差分鏈

```bash
# 創建差分鏈：v1.0.0 -> v1.0.1 -> v1.0.2

# v1.0.0 到 v1.0.1
python3 create_delta.py generate \
    -s firmware_v1.0.0.bin \
    -t firmware_v1.0.1.bin \
    -o delta_1.0.0_to_1.0.1.patch

# v1.0.1 到 v1.0.2
python3 create_delta.py generate \
    -s firmware_v1.0.1.bin \
    -t firmware_v1.0.2.bin \
    -o delta_1.0.1_to_1.0.2.patch

# 設備可以逐步更新：1.0.0 -> 1.0.1 -> 1.0.2
```

## 相關文檔

- [OTA 更新服務器配置](../../docs/ota-server-setup.md)
- [設備端 OTA 客戶端實現](../../docs/ota-client-implementation.md)
- [固件簽名工具](../signing-tool/README.md)
- [Manifest Schema 規範](manifest_schema.json)

## 許可證

本工具為 Vibe Coding Apps 項目的一部分。

## 貢獻

歡迎提交問題和改進建議！

---

**狀態**: ✅ 完成
**版本**: 1.0.0
**最後更新**: 2025-11-18
**維護者**: Development Team
