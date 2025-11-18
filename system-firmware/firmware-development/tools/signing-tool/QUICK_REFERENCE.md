# Firmware Signing Tool - Quick Reference
# 韌體簽名工具 - 快速參考

## 快速開始

### 1. 安裝依賴
```bash
pip install cryptography
```

### 2. 生成密鑰對
```bash
# RSA-2048 (開發環境)
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem

# RSA-4096 (生產環境)
openssl genrsa -out private_key.pem 4096
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

### 3. 簽名韌體
```bash
python3 sign_firmware.py -i firmware.bin -o firmware_signed.bin -k private_key.pem
```

### 4. 驗證簽名
```bash
python3 verify_signature.py -i firmware_signed.bin -k public_key.pem
```

---

## 常用命令

### 簽名相關

```bash
# 基本簽名（SHA-256 + RSA-2048）
python3 sign_firmware.py -i INPUT.bin -o OUTPUT.bin -k KEY.pem

# 使用 SHA-512 + RSA-4096
python3 sign_firmware.py -i INPUT.bin -o OUTPUT.bin -k KEY.pem \
    --hash sha512 --key-size 4096

# 指定版本號
python3 sign_firmware.py -i INPUT.bin -o OUTPUT.bin -k KEY.pem \
    --version 1.2.3.4

# 生成報告
python3 sign_firmware.py -i INPUT.bin -o OUTPUT.bin -k KEY.pem \
    --report report.json

# 批量簽名
python3 sign_firmware.py --batch -d INPUT_DIR/ --output-dir OUTPUT_DIR/ \
    -k KEY.pem --pattern "*.bin"
```

### 驗證相關

```bash
# 完整驗證（含簽名）
python3 verify_signature.py -i SIGNED.bin -k PUBLIC_KEY.pem

# 僅驗證頭部和哈希（無需公鑰）
python3 verify_signature.py -i SIGNED.bin

# 詳細輸出
python3 verify_signature.py -i SIGNED.bin -k PUBLIC_KEY.pem --verbose

# 批量驗證
python3 verify_signature.py --batch -d DIR/ -k PUBLIC_KEY.pem

# 生成報告
python3 verify_signature.py -i SIGNED.bin -k PUBLIC_KEY.pem \
    --report report.json
```

---

## 參數速查

### sign_firmware.py

| 參數 | 說明 | 默認值 |
|------|------|--------|
| `-i, --input` | 輸入韌體文件 | 必需 |
| `-o, --output` | 輸出簽名文件 | 必需 |
| `-k, --key` | 私鑰文件（PEM） | 必需 |
| `--hash` | 哈希算法（sha256/sha512） | sha256 |
| `--key-size` | RSA 密鑰大小（2048/4096） | 2048 |
| `--version` | 版本號（x.y.z.b） | 1.0.0.0 |
| `--batch` | 批量簽名模式 | - |
| `-d, --input-dir` | 輸入目錄（批量） | - |
| `--output-dir` | 輸出目錄（批量） | - |
| `--pattern` | 文件匹配模式 | *.bin |
| `--report` | 報告文件路徑 | - |
| `-v, --verbose` | 詳細輸出 | - |
| `-q, --quiet` | 安靜模式 | - |

### verify_signature.py

| 參數 | 說明 | 默認值 |
|------|------|--------|
| `-i, --input` | 輸入簽名文件 | 必需 |
| `-k, --key` | 公鑰文件（PEM，可選） | - |
| `--batch` | 批量驗證模式 | - |
| `-d, --input-dir` | 輸入目錄（批量） | - |
| `--pattern` | 文件匹配模式 | *_signed.bin |
| `--report` | 報告文件路徑 | - |
| `--verbose` | 詳細輸出 | - |
| `-q, --quiet` | 安靜模式 | - |

---

## Python API 速查

### 簽名 API

```python
from sign_firmware import FirmwareSigner

# 創建簽名器
signer = FirmwareSigner(
    private_key_path='key.pem',
    hash_algorithm='sha256',  # sha256, sha512
    key_size=2048,            # 2048, 4096
    log_level=logging.INFO
)

# 簽名單個文件
info = signer.sign_file(
    input_file='firmware.bin',
    output_file='firmware_signed.bin',
    version=(1, 0, 0, 0)  # major, minor, patch, build
)

# 批量簽名
results = signer.sign_batch(
    input_dir='build/',
    output_dir='signed/',
    pattern='*.bin',
    version=(1, 0, 0, 0)
)

# 低級 API
with open('firmware.bin', 'rb') as f:
    firmware_data = f.read()

signed_data, header = signer.sign_firmware(
    firmware_data=firmware_data,
    version=(1, 0, 0, 0)
)
```

### 驗證 API

```python
from verify_signature import FirmwareVerifier

# 創建驗證器
verifier = FirmwareVerifier(
    public_key_path='public_key.pem',  # 可選
    log_level=logging.INFO
)

# 驗證單個文件
result = verifier.verify_file(
    input_file='firmware_signed.bin',
    verbose=True
)

# 檢查結果
if result['overall_valid']:
    print("✓ Valid")
else:
    print("✗ Invalid")

# 批量驗證
batch_result = verifier.verify_batch(
    input_dir='signed/',
    pattern='*_signed.bin',
    report_file='report.json'
)

print(f"Success rate: {batch_result['summary']['success_rate']}")
```

---

## 韌體頭部結構

| 偏移量 | 大小 | 字段 | 說明 |
|--------|------|------|------|
| 0 | 4 | Magic | 'FWSV' |
| 4 | 4 | Version | major.minor.patch.build |
| 8 | 8 | Timestamp | Unix 時間戳 |
| 16 | 4 | Firmware Size | 韌體大小（字節） |
| 20 | 2 | Hash Algorithm | 0x0001=SHA-256, 0x0002=SHA-512 |
| 22 | 2 | Signature Algorithm | 0x0001=RSA-2048, 0x0002=RSA-4096 |
| 24 | 64 | Hash | 韌體哈希值 |
| 88 | 4 | Signature Size | 簽名大小 |
| 92 | 4 | CRC32 | CRC32 校驗和 |
| 96 | 424 | Reserved | 保留字段 |

**總大小：512 字節**

---

## 文件格式

```
簽名韌體文件 = 頭部 (512 bytes) + 韌體數據 (N bytes) + 簽名 (256/512 bytes)
```

### 大小計算

- RSA-2048: 簽名韌體 = 原始韌體 + 768 字節（512 + 256）
- RSA-4096: 簽名韌體 = 原始韌體 + 1024 字節（512 + 512）

---

## 工作流程

### 開發環境

```bash
# 1. 生成開發密鑰（一次性）
openssl genrsa -out dev_key.pem 2048
openssl rsa -in dev_key.pem -pubout -out dev_key_pub.pem

# 2. 編譯韌體
make build

# 3. 簽名
python3 sign_firmware.py -i build/firmware.bin \
    -o build/firmware_signed.bin -k dev_key.pem --version 1.0.0.0

# 4. 驗證
python3 verify_signature.py -i build/firmware_signed.bin \
    -k dev_key_pub.pem
```

### 生產環境

```bash
# 1. 使用安全存儲的生產密鑰
PROD_KEY="/secure/production_key.pem"

# 2. 批量簽名（SHA-512 + RSA-4096）
python3 sign_firmware.py --batch \
    -d release/unsigned/ --output-dir release/signed/ \
    -k $PROD_KEY --hash sha512 --key-size 4096 \
    --version 2.0.0.1 --report release/signing_report.json

# 3. 批量驗證
python3 verify_signature.py --batch \
    -d release/signed/ -k /secure/production_key_pub.pem \
    --report release/verification_report.json

# 4. 檢查驗證結果
if [ $? -eq 0 ]; then
    echo "✓ All verified"
else
    echo "✗ Verification failed"
    exit 1
fi
```

---

## 密鑰管理最佳實踐

### 生成密鑰

```bash
# 開發環境: RSA-2048
openssl genrsa -out dev_key.pem 2048
chmod 600 dev_key.pem

# 生產環境: RSA-4096 + 密碼保護
openssl genrsa -aes256 -out prod_key.pem 4096
chmod 400 prod_key.pem
```

### 密鑰存儲

- 開發密鑰: 本地文件系統（不提交到 Git）
- 生產密鑰: HSM 或安全保管庫
- 備份密鑰: 離線加密存儲

### 密鑰輪換

```bash
# 1. 生成新密鑰
openssl genrsa -out new_key.pem 2048

# 2. 提取公鑰
openssl rsa -in new_key.pem -pubout -out new_key_pub.pem

# 3. 使用新密鑰簽名
python3 sign_firmware.py -i firmware.bin -o firmware_signed.bin -k new_key.pem

# 4. 更新設備公鑰（通過韌體更新）
# 5. 停用舊密鑰
```

---

## 故障排除

### 私鑰加載失敗

```bash
# 檢查私鑰格式
openssl rsa -in private_key.pem -check -noout

# 檢查權限
ls -l private_key.pem
chmod 600 private_key.pem

# 移除密碼保護
openssl rsa -in encrypted_key.pem -out key.pem
```

### 簽名驗證失敗

```bash
# 檢查公鑰是否匹配
openssl rsa -in private_key.pem -pubout | diff - public_key.pem

# 查看韌體信息
python3 verify_signature.py -i firmware_signed.bin --verbose

# 檢查算法是否一致
# 簽名時使用的 --hash 和 --key-size 必須與私鑰匹配
```

### CRC32 校驗失敗

```bash
# CRC32 失敗表示數據損壞
# 重新簽名韌體
python3 sign_firmware.py -i firmware.bin -o firmware_signed.bin -k key.pem
```

---

## 示例文件

```bash
# 運行基本示例
./examples/basic_signing.sh

# 運行批量示例
./examples/batch_signing.sh

# 運行 Python API 示例
python3 examples/python_api_example.py

# 快速測試工具
./test_tool.sh
```

---

## 更多信息

- **完整文檔**: [README.md](README.md)
- **示例文檔**: [examples/README.md](examples/README.md)
- **源碼**: sign_firmware.py, verify_signature.py

---

## 許可證

MIT License
