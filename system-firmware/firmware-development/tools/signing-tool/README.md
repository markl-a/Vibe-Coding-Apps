# Firmware Signing Tool - 韌體簽名工具

完整的韌體數位簽名工具，支援 RSA-2048/4096 簽名、多種哈希算法、版本管理和批量處理。

## 功能特點

- RSA-2048/4096 數位簽名
- SHA-256/SHA-512 哈希算法
- 韌體頭部管理（magic、version、size、hash、signature）
- CRC32 校驗和計算
- 版本管理（major.minor.patch.build）
- 批量簽名和驗證
- 詳細的日誌輸出
- JSON 格式報告生成
- 命令行和 Python API 支援

## 安裝依賴

```bash
# 安裝 Python 加密庫
pip install cryptography

# 或使用 requirements.txt
pip install -r requirements.txt
```

## 韌體簽名格式

簽名後的韌體文件結構：

```
┌──────────────────┬───────────────┬─────────────────────────────────────┐
│ Firmware Header  │ 512 bytes     │ 包含所有元數據和哈希值               │
├──────────────────┼───────────────┼─────────────────────────────────────┤
│ Firmware Data    │ Variable      │ 原始韌體二進制數據                   │
├──────────────────┼───────────────┼─────────────────────────────────────┤
│ RSA Signature    │ 256/512 bytes │ 韌體數據的 RSA 簽名                  │
└──────────────────┴───────────────┴─────────────────────────────────────┘
```

### 韌體頭部結構 (512 bytes)

| 字段              | 大小 (bytes) | 偏移量 | 說明                                    |
|-------------------|--------------|--------|----------------------------------------|
| Magic             | 4            | 0      | 魔術字節: 'FWSV' (Firmware Signature Version) |
| Version           | 4            | 4      | 版本號 (major, minor, patch, build)    |
| Timestamp         | 8            | 8      | Unix 時間戳                            |
| Firmware Size     | 4            | 16     | 韌體數據大小                           |
| Hash Algorithm    | 2            | 20     | 哈希算法 ID (0x0001=SHA-256, 0x0002=SHA-512) |
| Signature Algorithm | 2          | 22     | 簽名算法 ID (0x0001=RSA-2048, 0x0002=RSA-4096) |
| Hash              | 64           | 24     | 韌體數據的哈希值                       |
| Signature Size    | 4            | 88     | 簽名大小                               |
| CRC32             | 4            | 92     | 韌體數據的 CRC32 校驗和                |
| Reserved          | 424          | 96     | 保留字段                               |

## 使用方法

### 1. 生成 RSA 密鑰對

```bash
# 生成 RSA-2048 私鑰
openssl genrsa -out private_key.pem 2048

# 生成 RSA-4096 私鑰
openssl genrsa -out private_key_4096.pem 4096

# 從私鑰提取公鑰
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

### 2. 簽名韌體

#### 基本簽名

```bash
# 使用 SHA-256 和 RSA-2048 簽名（默認）
python3 sign_firmware.py \
    -i firmware.bin \
    -o firmware_signed.bin \
    -k private_key.pem

# 使用 SHA-512 和 RSA-4096 簽名
python3 sign_firmware.py \
    -i firmware.bin \
    -o firmware_signed.bin \
    -k private_key_4096.pem \
    --hash sha512 \
    --key-size 4096
```

#### 指定版本號

```bash
# 版本格式: major.minor.patch.build
python3 sign_firmware.py \
    -i firmware.bin \
    -o firmware_signed.bin \
    -k private_key.pem \
    --version 2.1.3.1024
```

#### 生成簽名報告

```bash
python3 sign_firmware.py \
    -i firmware.bin \
    -o firmware_signed.bin \
    -k private_key.pem \
    --report signing_report.json
```

#### 批量簽名

```bash
# 簽名目錄中的所有 .bin 文件
python3 sign_firmware.py \
    --batch \
    -d build/ \
    --output-dir signed/ \
    -k private_key.pem \
    --version 1.0.0.0

# 使用自定義文件匹配模式
python3 sign_firmware.py \
    --batch \
    -d build/ \
    --output-dir signed/ \
    -k private_key.pem \
    --pattern "*.fw" \
    --report batch_report.json
```

### 3. 驗證簽名

#### 完整驗證（需要公鑰）

```bash
# 驗證簽名、哈希和 CRC32
python3 verify_signature.py \
    -i firmware_signed.bin \
    -k public_key.pem

# 詳細輸出
python3 verify_signature.py \
    -i firmware_signed.bin \
    -k public_key.pem \
    --verbose
```

#### 部分驗證（不需要公鑰）

```bash
# 僅驗證頭部、哈希和 CRC32（跳過簽名驗證）
python3 verify_signature.py \
    -i firmware_signed.bin
```

#### 批量驗證

```bash
# 驗證目錄中的所有簽名文件
python3 verify_signature.py \
    --batch \
    -d signed/ \
    -k public_key.pem \
    --pattern "*_signed.bin" \
    --report verification_report.json
```

### 4. 查看韌體信息

```bash
# 使用 verify_signature.py 查看頭部信息（無需公鑰）
python3 verify_signature.py -i firmware_signed.bin --verbose
```

## Python API 使用

### 簽名韌體

```python
from sign_firmware import FirmwareSigner

# 創建簽名器
signer = FirmwareSigner(
    private_key_path='private_key.pem',
    hash_algorithm='sha256',
    key_size=2048,
    log_level=logging.INFO
)

# 簽名單個文件
info = signer.sign_file(
    input_file='firmware.bin',
    output_file='firmware_signed.bin',
    version=(1, 0, 0, 0)
)

print(f"Signed firmware size: {info['output_size']} bytes")
print(f"Hash: {info['header']['hash']}")

# 批量簽名
results = signer.sign_batch(
    input_dir='build/',
    output_dir='signed/',
    pattern='*.bin',
    version=(1, 2, 3, 0)
)

print(f"Signed {len(results)} files")
```

### 驗證簽名

```python
from verify_signature import FirmwareVerifier

# 創建驗證器
verifier = FirmwareVerifier(
    public_key_path='public_key.pem',
    log_level=logging.INFO
)

# 驗證單個文件
result = verifier.verify_file(
    input_file='firmware_signed.bin',
    verbose=True
)

if result['overall_valid']:
    print("✓ Verification passed")
    print(f"Version: {result['header']['version']}")
    print(f"Firmware size: {result['header']['firmware_size']} bytes")
else:
    print("✗ Verification failed")

# 批量驗證
batch_result = verifier.verify_batch(
    input_dir='signed/',
    pattern='*_signed.bin',
    report_file='verification_report.json'
)

print(f"Passed: {batch_result['summary']['passed']}/{batch_result['summary']['total']}")
```

### 自定義簽名流程

```python
from sign_firmware import FirmwareSigner

signer = FirmwareSigner(
    private_key_path='private_key.pem',
    hash_algorithm='sha512',
    key_size=4096
)

# 讀取韌體
with open('firmware.bin', 'rb') as f:
    firmware_data = f.read()

# 簽名韌體（獲取詳細信息）
signed_firmware, header = signer.sign_firmware(
    firmware_data=firmware_data,
    version=(2, 0, 0, 1)
)

# 顯示簽名信息
print(f"Firmware hash: {header.hash.hex()}")
print(f"Signature size: {header.signature_size} bytes")
print(f"CRC32: 0x{header.crc32:08X}")

# 保存簽名韌體
with open('firmware_signed.bin', 'wb') as f:
    f.write(signed_firmware)
```

## 命令行選項

### sign_firmware.py

```
基本選項:
  -i, --input FILE          輸入韌體文件路徑
  -o, --output FILE         輸出簽名文件路徑
  -k, --key FILE            私鑰文件路徑 (PEM 格式)

批量簽名:
  --batch                   批量簽名模式
  -d, --input-dir DIR       輸入目錄
  --output-dir DIR          輸出目錄
  --pattern PATTERN         文件匹配模式（默認: *.bin）

算法選項:
  --hash {sha256,sha512}    哈希算法（默認: sha256）
  --key-size {2048,4096}    RSA 密鑰大小（默認: 2048）

版本選項:
  --version VERSION         韌體版本號（格式: major.minor.patch.build）

報告選項:
  --report FILE             生成簽名報告（JSON 格式）

日誌選項:
  -v, --verbose             詳細輸出
  -q, --quiet               安靜模式
```

### verify_signature.py

```
基本選項:
  -i, --input FILE          輸入簽名文件路徑
  -k, --key FILE            公鑰文件路徑 (PEM 格式，可選)

批量驗證:
  --batch                   批量驗證模式
  -d, --input-dir DIR       輸入目錄
  --pattern PATTERN         文件匹配模式（默認: *_signed.bin）

報告選項:
  --report FILE             生成驗證報告（JSON 格式）

日誌選項:
  --verbose                 詳細輸出
  -q, --quiet               安靜模式
```

## 報告格式

### 簽名報告 (JSON)

```json
{
  "input_file": "firmware.bin",
  "output_file": "firmware_signed.bin",
  "input_size": 524288,
  "output_size": 525056,
  "header": {
    "magic": "FWSV",
    "version": "1.0.0.0",
    "timestamp": "2025-11-18T14:30:00.123456",
    "firmware_size": 524288,
    "hash_algorithm": "0x0001",
    "signature_algorithm": "0x0001",
    "hash": "a1b2c3d4e5f6...",
    "signature_size": 256,
    "crc32": "0x12345678"
  },
  "timestamp": "2025-11-18T14:30:00.123456"
}
```

### 驗證報告 (JSON)

```json
{
  "file": "firmware_signed.bin",
  "file_size": 525056,
  "header": {
    "magic": "FWSV",
    "version": "1.0.0.0",
    "timestamp": "2025-11-18T14:30:00.123456",
    "firmware_size": 524288,
    "hash_algorithm": "0x0001",
    "signature_algorithm": "0x0001",
    "hash": "a1b2c3d4e5f6...",
    "signature_size": 256,
    "crc32": "0x12345678"
  },
  "header_valid": true,
  "hash_valid": true,
  "crc_valid": true,
  "signature_valid": true,
  "overall_valid": true,
  "timestamp": "2025-11-18T14:30:01.234567"
}
```

## 工作流程示例

### 開發環境簽名流程

```bash
# 1. 生成密鑰對（僅需執行一次）
openssl genrsa -out dev_private_key.pem 2048
openssl rsa -in dev_private_key.pem -pubout -out dev_public_key.pem

# 2. 編譯韌體
cd ../firmware-builder
make build TARGET=stm32f407

# 3. 簽名韌體
cd ../signing-tool
python3 sign_firmware.py \
    -i ../firmware-builder/build/firmware.bin \
    -o ../firmware-builder/build/firmware_signed.bin \
    -k dev_private_key.pem \
    --version 1.0.0.0 \
    --report signing_report.json

# 4. 驗證簽名
python3 verify_signature.py \
    -i ../firmware-builder/build/firmware_signed.bin \
    -k dev_public_key.pem \
    --verbose

# 5. 查看報告
cat signing_report.json | python3 -m json.tool
```

### 生產環境批量簽名流程

```bash
# 1. 使用生產環境密鑰（應安全存儲）
PROD_KEY="production_private_key.pem"

# 2. 批量簽名所有韌體
python3 sign_firmware.py \
    --batch \
    -d release/unsigned/ \
    --output-dir release/signed/ \
    -k $PROD_KEY \
    --hash sha512 \
    --key-size 4096 \
    --version 2.0.0.1 \
    --report release/batch_signing_report.json

# 3. 批量驗證
python3 verify_signature.py \
    --batch \
    -d release/signed/ \
    -k production_public_key.pem \
    --report release/batch_verification_report.json

# 4. 檢查驗證結果
if [ $? -eq 0 ]; then
    echo "✓ All firmwares verified successfully"
else
    echo "✗ Some firmwares failed verification"
    exit 1
fi
```

## 安全建議

1. **密鑰管理**
   - 私鑰應安全存儲，使用密碼保護
   - 生產環境私鑰應使用 HSM（Hardware Security Module）
   - 定期輪換密鑰
   - 不要將私鑰提交到版本控制系統

2. **簽名流程**
   - 生產環境使用 RSA-4096 和 SHA-512
   - 開發環境可使用 RSA-2048 和 SHA-256
   - 所有發布的韌體都必須簽名
   - 保留簽名日誌和報告

3. **驗證流程**
   - 設備啟動時必須驗證韌體簽名
   - 簽名驗證失敗應拒絕啟動
   - 公鑰應內嵌在 Bootloader 中
   - 支援多個公鑰以便密鑰輪換

4. **版本管理**
   - 使用語義化版本號
   - 版本號應與 Git 標籤同步
   - 記錄每個版本的簽名信息
   - 禁止簽名舊版本韌體

## 故障排除

### 問題：私鑰加載失敗

```bash
# 檢查私鑰格式
openssl rsa -in private_key.pem -text -noout

# 如果私鑰有密碼保護，需要先移除密碼
openssl rsa -in encrypted_key.pem -out private_key.pem
```

### 問題：簽名驗證失敗

```bash
# 1. 檢查公鑰是否匹配
openssl rsa -in private_key.pem -pubout | diff - public_key.pem

# 2. 查看韌體頭部信息
python3 verify_signature.py -i firmware_signed.bin --verbose

# 3. 檢查哈希算法和密鑰大小是否匹配
# 簽名時使用的算法必須與驗證時一致
```

### 問題：CRC32 校驗失敗

```bash
# CRC32 失敗通常表示韌體數據已損壞
# 重新簽名韌體
python3 sign_firmware.py -i firmware.bin -o firmware_signed.bin -k private_key.pem
```

## 相關工具

- **firmware-builder**: 韌體編譯工具
- **update-packager**: 韌體更新打包工具
- **bootloader**: 支援簽名驗證的 Bootloader

## 技術規格

- **支援的哈希算法**: SHA-256, SHA-512
- **支援的簽名算法**: RSA-2048, RSA-4096 with PSS padding
- **韌體頭部大小**: 512 bytes (固定)
- **最大韌體大小**: 4 GB (2^32 bytes)
- **版本號格式**: 4 個字節 (major.minor.patch.build)
- **CRC32 多項式**: 0x04C11DB7 (IEEE 802.3)

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request。

## 狀態

✅ **可用** - 已完成開發並通過測試
