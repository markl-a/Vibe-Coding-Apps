#!/bin/bash

# RAM 磁碟性能基準測試

DEVICE="/dev/sramdisk"

echo "==================================================="
echo "           RAM 磁碟性能基準測試"
echo "==================================================="
echo ""

if [ ! -e "$DEVICE" ]; then
    echo "錯誤: 設備 $DEVICE 不存在!"
    echo "請先載入驅動: sudo insmod ../../block-device/simple_ramdisk.ko"
    exit 1
fi

# 測試不同的塊大小
echo "測試不同塊大小的寫入性能:"
echo "---------------------------------------------------"

for bs in 512 1024 4096 8192 16384; do
    echo -n "塊大小 ${bs} 字節: "
    dd if=/dev/zero of="$DEVICE" bs=$bs count=10000 2>&1 | \
        grep -o '[0-9.]* MB/s'
done
echo ""

echo "測試不同塊大小的讀取性能:"
echo "---------------------------------------------------"

for bs in 512 1024 4096 8192 16384; do
    echo -n "塊大小 ${bs} 字節: "
    dd if="$DEVICE" of=/dev/null bs=$bs count=10000 2>&1 | \
        grep -o '[0-9.]* MB/s'
done
echo ""

# 隨機訪問測試
echo "隨機訪問測試:"
echo "---------------------------------------------------"
echo "使用 dd 進行隨機 seek..."

for i in {1..10}; do
    offset=$((RANDOM % 100))
    dd if=/dev/urandom of="$DEVICE" bs=4096 count=1 seek=$offset 2>/dev/null
done
echo "完成 10 次隨機寫入"
echo ""

echo "==================================================="
echo "               基準測試完成!"
echo "==================================================="
