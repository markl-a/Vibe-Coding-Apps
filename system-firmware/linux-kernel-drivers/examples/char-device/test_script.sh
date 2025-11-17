#!/bin/bash

# 字元設備測試腳本

set -e

DEVICE="/dev/simple_char"
DRIVER_DIR="../../char-device"

echo "==================================================="
echo "           字元設備驅動測試腳本"
echo "==================================================="
echo ""

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
    echo "錯誤: 請使用 sudo 執行此腳本"
    exit 1
fi

# 編譯驅動
echo "步驟 1: 編譯驅動模組"
echo "---------------------------------------------------"
cd "$DRIVER_DIR"
make clean
make
echo ""

# 載入驅動
echo "步驟 2: 載入驅動模組"
echo "---------------------------------------------------"
if lsmod | grep -q simple_chardev; then
    echo "驅動已載入，先卸載..."
    rmmod simple_chardev
fi

insmod simple_chardev.ko
echo "驅動載入成功!"
sleep 1
echo ""

# 檢查設備節點
echo "步驟 3: 檢查設備節點"
echo "---------------------------------------------------"
if [ ! -e "$DEVICE" ]; then
    echo "錯誤: 設備節點 $DEVICE 不存在!"
    exit 1
fi

ls -l "$DEVICE"
echo "設備主設備號: $(stat -c %t $DEVICE)"
echo "設備次設備號: $(stat -c %T $DEVICE)"
echo ""

# 基本讀寫測試
echo "步驟 4: 基本讀寫測試"
echo "---------------------------------------------------"
echo "寫入測試數據..."
echo "Hello, Kernel!" > "$DEVICE"
echo "讀取數據..."
cat "$DEVICE"
echo ""

# 多次寫入測試
echo "步驟 5: 多次寫入測試"
echo "---------------------------------------------------"
for i in {1..3}; do
    echo "Test message $i" > "$DEVICE"
    echo "寫入: Test message $i"
done
echo "讀取最後的數據:"
cat "$DEVICE"
echo ""

# 使用 dd 測試
echo "步驟 6: 使用 dd 進行讀寫測試"
echo "---------------------------------------------------"
echo "寫入 512 字節..."
dd if=/dev/zero of="$DEVICE" bs=512 count=1 2>&1 | grep -v records
echo "讀取 512 字節..."
dd if="$DEVICE" of=/dev/null bs=512 count=1 2>&1 | grep -v records
echo ""

# 查看內核日誌
echo "步驟 7: 查看內核日誌（最後 20 行）"
echo "---------------------------------------------------"
dmesg | grep simple_char | tail -20
echo ""

# 卸載驅動
echo "步驟 8: 卸載驅動模組"
echo "---------------------------------------------------"
rmmod simple_chardev
echo "驅動卸載成功!"
echo ""

echo "==================================================="
echo "               測試完成!"
echo "==================================================="
