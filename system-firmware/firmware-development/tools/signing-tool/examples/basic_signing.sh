#!/bin/bash
# Basic Firmware Signing Example
# 基本韌體簽名示例

set -e

echo "=========================================="
echo "Basic Firmware Signing Example"
echo "=========================================="
echo ""

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOL_DIR="$(dirname "$SCRIPT_DIR")"
EXAMPLE_DIR="$SCRIPT_DIR/temp"
PRIVATE_KEY="$EXAMPLE_DIR/private_key.pem"
PUBLIC_KEY="$EXAMPLE_DIR/public_key.pem"
FIRMWARE="$EXAMPLE_DIR/firmware.bin"
SIGNED_FIRMWARE="$EXAMPLE_DIR/firmware_signed.bin"

# 創建臨時目錄
mkdir -p "$EXAMPLE_DIR"

# 步驟 1: 生成 RSA 密鑰對
echo "Step 1: Generating RSA-2048 key pair..."
if [ ! -f "$PRIVATE_KEY" ]; then
    openssl genrsa -out "$PRIVATE_KEY" 2048 2>/dev/null
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

# 步驟 2: 創建示例韌體
echo "Step 2: Creating sample firmware..."
if [ ! -f "$FIRMWARE" ]; then
    # 創建一個 64KB 的示例韌體
    dd if=/dev/urandom of="$FIRMWARE" bs=1024 count=64 2>/dev/null
    echo "✓ Sample firmware created: $FIRMWARE (64 KB)"
else
    echo "✓ Using existing firmware: $FIRMWARE"
fi
echo ""

# 步驟 3: 簽名韌體
echo "Step 3: Signing firmware..."
python3 "$TOOL_DIR/sign_firmware.py" \
    -i "$FIRMWARE" \
    -o "$SIGNED_FIRMWARE" \
    -k "$PRIVATE_KEY" \
    --version 1.0.0.0 \
    --hash sha256 \
    --key-size 2048
echo ""

# 步驟 4: 驗證簽名
echo "Step 4: Verifying signature..."
python3 "$TOOL_DIR/verify_signature.py" \
    -i "$SIGNED_FIRMWARE" \
    -k "$PUBLIC_KEY" \
    --verbose
echo ""

# 步驟 5: 查看文件大小
echo "Step 5: File sizes:"
echo "  Original firmware:  $(stat -c%s "$FIRMWARE") bytes"
echo "  Signed firmware:    $(stat -c%s "$SIGNED_FIRMWARE") bytes"
echo "  Overhead:           $(($(stat -c%s "$SIGNED_FIRMWARE") - $(stat -c%s "$FIRMWARE"))) bytes"
echo ""

echo "=========================================="
echo "Example completed successfully!"
echo "=========================================="
echo ""
echo "Files created in: $EXAMPLE_DIR"
echo "  - private_key.pem"
echo "  - public_key.pem"
echo "  - firmware.bin"
echo "  - firmware_signed.bin"
echo ""
echo "To clean up, run: rm -rf $EXAMPLE_DIR"
