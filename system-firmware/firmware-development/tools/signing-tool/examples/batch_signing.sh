#!/bin/bash
# Batch Firmware Signing Example
# 批量韌體簽名示例

set -e

echo "=========================================="
echo "Batch Firmware Signing Example"
echo "=========================================="
echo ""

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOL_DIR="$(dirname "$SCRIPT_DIR")"
EXAMPLE_DIR="$SCRIPT_DIR/temp_batch"
PRIVATE_KEY="$EXAMPLE_DIR/private_key.pem"
PUBLIC_KEY="$EXAMPLE_DIR/public_key.pem"
UNSIGNED_DIR="$EXAMPLE_DIR/unsigned"
SIGNED_DIR="$EXAMPLE_DIR/signed"

# 創建目錄
mkdir -p "$UNSIGNED_DIR"
mkdir -p "$SIGNED_DIR"

# 步驟 1: 生成 RSA 密鑰對
echo "Step 1: Generating RSA-4096 key pair..."
if [ ! -f "$PRIVATE_KEY" ]; then
    openssl genrsa -out "$PRIVATE_KEY" 4096 2>/dev/null
    echo "✓ Private key generated: $PRIVATE_KEY"
else
    echo "✓ Using existing private key: $PRIVATE_KEY"
fi

if [ ! -f "$PUBLIC_KEY" ]; then
    openssl rsa -in "$PRIVATE_KEY" -pubout -out "$PUBLIC_KEY" 2>/dev/null
    echo "✓ Public key extracted: $PUBLIC_KEY"
else
    echo "✓ Using existing public key: $PUBLIC_KEY"
fi
echo ""

# 步驟 2: 創建多個示例韌體
echo "Step 2: Creating sample firmwares..."
for i in {1..5}; do
    FIRMWARE="$UNSIGNED_DIR/firmware_v${i}.bin"
    if [ ! -f "$FIRMWARE" ]; then
        # 創建不同大小的韌體（32KB, 48KB, 64KB, 80KB, 96KB）
        SIZE=$((32 + (i-1) * 16))
        dd if=/dev/urandom of="$FIRMWARE" bs=1024 count=$SIZE 2>/dev/null
        echo "  ✓ Created: firmware_v${i}.bin ($SIZE KB)"
    fi
done
echo ""

# 步驟 3: 批量簽名韌體
echo "Step 3: Batch signing firmwares..."
python3 "$TOOL_DIR/sign_firmware.py" \
    --batch \
    -d "$UNSIGNED_DIR" \
    --output-dir "$SIGNED_DIR" \
    -k "$PRIVATE_KEY" \
    --hash sha512 \
    --key-size 4096 \
    --version 2.0.0.1 \
    --pattern "*.bin" \
    --report "$EXAMPLE_DIR/batch_signing_report.json"
echo ""

# 步驟 4: 批量驗證簽名
echo "Step 4: Batch verifying signatures..."
python3 "$TOOL_DIR/verify_signature.py" \
    --batch \
    -d "$SIGNED_DIR" \
    -k "$PUBLIC_KEY" \
    --pattern "*_signed.bin" \
    --report "$EXAMPLE_DIR/batch_verification_report.json"
echo ""

# 步驟 5: 顯示統計信息
echo "Step 5: Statistics:"
echo "  Unsigned firmwares: $(ls -1 "$UNSIGNED_DIR"/*.bin 2>/dev/null | wc -l)"
echo "  Signed firmwares:   $(ls -1 "$SIGNED_DIR"/*_signed.bin 2>/dev/null | wc -l)"
echo ""

# 步驟 6: 顯示報告摘要
echo "Step 6: Signing report summary:"
if [ -f "$EXAMPLE_DIR/batch_signing_report.json" ]; then
    python3 -c "
import json
import sys

with open('$EXAMPLE_DIR/batch_signing_report.json', 'r') as f:
    data = json.load(f)

print(f'  Total files processed: {len(data)}')
successful = len([r for r in data if 'error' not in r])
print(f'  Successful: {successful}')
print(f'  Failed: {len(data) - successful}')

if successful > 0:
    total_input = sum(r['input_size'] for r in data if 'error' not in r)
    total_output = sum(r['output_size'] for r in data if 'error' not in r)
    print(f'  Total input size: {total_input:,} bytes')
    print(f'  Total output size: {total_output:,} bytes')
    print(f'  Total overhead: {total_output - total_input:,} bytes')
"
fi
echo ""

echo "=========================================="
echo "Batch example completed successfully!"
echo "=========================================="
echo ""
echo "Files created in: $EXAMPLE_DIR"
echo "  - unsigned/     (5 firmware files)"
echo "  - signed/       (5 signed firmware files)"
echo "  - batch_signing_report.json"
echo "  - batch_verification_report.json"
echo ""
echo "To view reports:"
echo "  cat $EXAMPLE_DIR/batch_signing_report.json | python3 -m json.tool"
echo "  cat $EXAMPLE_DIR/batch_verification_report.json | python3 -m json.tool"
echo ""
echo "To clean up, run: rm -rf $EXAMPLE_DIR"
