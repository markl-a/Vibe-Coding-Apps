#!/bin/bash
# Quick Test Script for Firmware Signing Tool
# 韌體簽名工具快速測試腳本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$SCRIPT_DIR/.test_temp"

echo "=========================================="
echo "Firmware Signing Tool - Quick Test"
echo "=========================================="
echo ""

# 清理舊的測試目錄
if [ -d "$TEST_DIR" ]; then
    echo "Cleaning up old test directory..."
    rm -rf "$TEST_DIR"
fi

# 創建測試目錄
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# 檢查依賴
echo "Checking dependencies..."
python3 -c "import cryptography" 2>/dev/null || {
    echo "Error: cryptography library not found"
    echo "Install with: pip install cryptography"
    exit 1
}
echo "✓ Dependencies OK"
echo ""

# 生成測試密鑰
echo "Generating test RSA key pair..."
openssl genrsa -out test_key.pem 2048 2>/dev/null
openssl rsa -in test_key.pem -pubout -out test_key_pub.pem 2>/dev/null
echo "✓ Keys generated"
echo ""

# 創建測試韌體
echo "Creating test firmware (16 KB)..."
dd if=/dev/urandom of=test_firmware.bin bs=1024 count=16 2>/dev/null
echo "✓ Firmware created"
echo ""

# 測試簽名
echo "Testing sign_firmware.py..."
python3 "$SCRIPT_DIR/sign_firmware.py" \
    -i test_firmware.bin \
    -o test_firmware_signed.bin \
    -k test_key.pem \
    --version 1.0.0.0 \
    -q

if [ -f test_firmware_signed.bin ]; then
    echo "✓ Signing successful"
else
    echo "✗ Signing failed"
    exit 1
fi
echo ""

# 測試驗證
echo "Testing verify_signature.py..."
python3 "$SCRIPT_DIR/verify_signature.py" \
    -i test_firmware_signed.bin \
    -k test_key_pub.pem \
    -q

if [ $? -eq 0 ]; then
    echo "✓ Verification successful"
else
    echo "✗ Verification failed"
    exit 1
fi
echo ""

# 顯示文件大小
echo "File sizes:"
echo "  Original:  $(stat -c%s test_firmware.bin) bytes"
echo "  Signed:    $(stat -c%s test_firmware_signed.bin) bytes"
echo "  Overhead:  $(($(stat -c%s test_firmware_signed.bin) - $(stat -c%s test_firmware.bin))) bytes"
echo ""

# 清理
cd "$SCRIPT_DIR"
rm -rf "$TEST_DIR"

echo "=========================================="
echo "✓ All tests passed!"
echo "=========================================="
echo ""
echo "The tool is ready to use."
echo ""
echo "Next steps:"
echo "  1. Read the README.md for detailed usage"
echo "  2. Try examples in the examples/ directory"
echo "  3. Generate your own RSA keys for production use"
