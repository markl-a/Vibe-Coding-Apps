#!/bin/bash

# RAM 磁碟文件系統測試腳本

set -e

DEVICE="/dev/sramdisk"
MOUNT_POINT="/mnt/ramdisk_test"
DRIVER_DIR="../../block-device"

echo "==================================================="
echo "           RAM 磁碟文件系統測試"
echo "==================================================="
echo ""

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
    echo "錯誤: 請使用 sudo 執行此腳本"
    exit 1
fi

# 編譯並載入驅動
echo "步驟 1: 編譯並載入驅動"
echo "---------------------------------------------------"
cd "$DRIVER_DIR"
make clean
make

if lsmod | grep -q simple_ramdisk; then
    rmmod simple_ramdisk
fi

insmod simple_ramdisk.ko
echo "驅動載入成功!"
sleep 1
echo ""

# 檢查設備
echo "步驟 2: 檢查 RAM 磁碟設備"
echo "---------------------------------------------------"
if [ ! -e "$DEVICE" ]; then
    echo "錯誤: 設備 $DEVICE 不存在!"
    exit 1
fi

ls -l "$DEVICE"
blockdev --getsize64 "$DEVICE" | awk '{printf "磁碟大小: %d MB\n", $1/(1024*1024)}'
echo ""

# 創建文件系統
echo "步驟 3: 創建 ext4 文件系統"
echo "---------------------------------------------------"
mkfs.ext4 -F "$DEVICE"
echo ""

# 創建掛載點
echo "步驟 4: 創建掛載點"
echo "---------------------------------------------------"
mkdir -p "$MOUNT_POINT"
echo "掛載點: $MOUNT_POINT"
echo ""

# 掛載文件系統
echo "步驟 5: 掛載文件系統"
echo "---------------------------------------------------"
mount "$DEVICE" "$MOUNT_POINT"
echo "掛載成功!"
df -h "$MOUNT_POINT"
echo ""

# 文件操作測試
echo "步驟 6: 文件操作測試"
echo "---------------------------------------------------"

echo "創建測試文件..."
echo "Hello from RAM disk!" > "$MOUNT_POINT/test.txt"
echo "This is line 2" >> "$MOUNT_POINT/test.txt"
echo "This is line 3" >> "$MOUNT_POINT/test.txt"

echo "創建測試目錄..."
mkdir -p "$MOUNT_POINT/test_dir"

echo "複製文件..."
cp "$MOUNT_POINT/test.txt" "$MOUNT_POINT/test_dir/"

echo "列出文件:"
ls -lR "$MOUNT_POINT"
echo ""

echo "讀取文件內容:"
cat "$MOUNT_POINT/test.txt"
echo ""

# 性能測試
echo "步驟 7: 性能測試"
echo "---------------------------------------------------"
echo "寫入測試 (10MB)..."
dd if=/dev/zero of="$MOUNT_POINT/test_10mb.dat" bs=1M count=10 2>&1 | grep -E "copied|MB/s"

echo "讀取測試 (10MB)..."
dd if="$MOUNT_POINT/test_10mb.dat" of=/dev/null bs=1M 2>&1 | grep -E "copied|MB/s"
echo ""

# 檢查磁碟使用情況
echo "步驟 8: 磁碟使用情況"
echo "---------------------------------------------------"
df -h "$MOUNT_POINT"
echo ""

# 卸載並清理
echo "步驟 9: 卸載並清理"
echo "---------------------------------------------------"
umount "$MOUNT_POINT"
echo "文件系統已卸載"

rmdir "$MOUNT_POINT"
echo "掛載點已刪除"

rmmod simple_ramdisk
echo "驅動已卸載"
echo ""

echo "==================================================="
echo "               測試完成!"
echo "==================================================="
