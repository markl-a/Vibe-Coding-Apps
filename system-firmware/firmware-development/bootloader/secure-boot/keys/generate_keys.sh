#!/bin/bash

# RSA 金鑰生成腳本
# 用於生成安全啟動所需的 RSA 密鑰對

set -e

KEY_SIZE=2048
PRIVATE_KEY="private_key.pem"
PUBLIC_KEY="public_key.pem"
PUBLIC_KEY_C="public_key.c"
PUBLIC_KEY_BIN="public_key.bin"

echo "========================================="
echo "  Secure Boot Key Generation Tool"
echo "========================================="
echo ""

# 檢查 OpenSSL
if ! command -v openssl &> /dev/null; then
    echo "Error: OpenSSL is not installed!"
    exit 1
fi

# 生成私鑰
echo "[1/5] Generating RSA-${KEY_SIZE} private key..."
openssl genrsa -out ${PRIVATE_KEY} ${KEY_SIZE}

# 生成公鑰
echo "[2/5] Extracting public key..."
openssl rsa -in ${PRIVATE_KEY} -pubout -out ${PUBLIC_KEY}

# 提取模數和指數
echo "[3/5] Extracting modulus and exponent..."
openssl rsa -in ${PRIVATE_KEY} -noout -modulus > modulus.txt

# 生成 C 頭文件
echo "[4/5] Generating C header file..."
cat > ${PUBLIC_KEY_C} << 'EOF'
// Auto-generated public key
// DO NOT EDIT MANUALLY

#include <stdint.h>
#include "secure_boot.h"

// RSA-2048 Public Key
const public_key_t embedded_public_key __attribute__((section(".public_key"))) = {
    .magic = PUBLIC_KEY_MAGIC,
    .key_size = RSA_KEY_SIZE,
EOF

# 添加模數
python3 << 'PYTHON'
import sys

with open('modulus.txt', 'r') as f:
    mod = f.read().strip().split('=')[1]

# 轉換為字節數組
mod_bytes = bytes.fromhex(mod)

print("    .modulus = {", file=sys.stdout, end='')
for i, byte in enumerate(mod_bytes):
    if i % 16 == 0:
        print("\n        ", file=sys.stdout, end='')
    print(f"0x{byte:02x},", file=sys.stdout, end=' ')
print("\n    },", file=sys.stdout)

# RSA 指數通常是 65537 (0x010001)
print("    .exponent = {0x01, 0x00, 0x01, 0x00},", file=sys.stdout)

PYTHON
>> ${PUBLIC_KEY_C}

echo "    .crc32 = 0  // Will be calculated at build time" >> ${PUBLIC_KEY_C}
echo "};" >> ${PUBLIC_KEY_C}

# 生成二進制格式
echo "[5/5] Generating binary format..."
python3 << 'PYTHON'
import struct

with open('modulus.txt', 'r') as f:
    mod = f.read().strip().split('=')[1]

mod_bytes = bytes.fromhex(mod)

# 計算 CRC32
def crc32(data):
    crc = 0xFFFFFFFF
    for byte in data:
        crc ^= byte
        for _ in range(8):
            crc = (crc >> 1) ^ (0xEDB88320 if crc & 1 else 0)
    return ~crc & 0xFFFFFFFF

# 構建公鑰結構
magic = 0x50554B59  # "PUKY"
key_size = 2048
exponent = bytes([0x01, 0x00, 0x01, 0x00])

# 打包數據
data = struct.pack('<I', magic)
data += struct.pack('<I', key_size)
data += mod_bytes
data += exponent

# 計算 CRC
crc = crc32(data)
data += struct.pack('<I', crc)

with open('public_key.bin', 'wb') as f:
    f.write(data)

print(f"Binary size: {len(data)} bytes")
PYTHON

echo ""
echo "========================================="
echo "  Key Generation Complete!"
echo "========================================="
echo ""
echo "Files generated:"
echo "  - ${PRIVATE_KEY}  (Keep this SECRET!)"
echo "  - ${PUBLIC_KEY}   (Public key)"
echo "  - ${PUBLIC_KEY_C} (C header file)"
echo "  - ${PUBLIC_KEY_BIN} (Binary format)"
echo ""
echo "IMPORTANT:"
echo "  1. Store ${PRIVATE_KEY} in a secure location"
echo "  2. NEVER commit ${PRIVATE_KEY} to version control"
echo "  3. Use ${PUBLIC_KEY_BIN} to flash to device"
echo ""
echo "Next steps:"
echo "  1. Flash ${PUBLIC_KEY_BIN} to 0x08010000"
echo "  2. Use tools/sign_firmware.py to sign firmware"
echo ""
