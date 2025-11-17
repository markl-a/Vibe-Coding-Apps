#!/bin/bash

# SPI 虛擬設備 sysfs 測試腳本

DRIVER_DIR="../../i2c-spi-driver"
SPI_BUS="spi0"

echo "==================================================="
echo "         SPI 虛擬設備 sysfs 測試"
echo "==================================================="
echo ""

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
    echo "錯誤: 請使用 sudo 執行此腳本"
    exit 1
fi

# 編譯並載入驅動
echo "步驟 1: 編譯並載入 SPI 驅動"
echo "---------------------------------------------------"
cd "$DRIVER_DIR"
make clean
make

if lsmod | grep -q spi_dummy_device; then
    rmmod spi_dummy_device
fi

insmod spi_dummy_device.ko
echo "驅動載入成功!"
sleep 1
echo ""

# 檢查 SPI 總線
echo "步驟 2: 檢查 SPI 總線"
echo "---------------------------------------------------"

if [ -d "/sys/bus/spi/devices" ]; then
    echo "SPI 總線設備:"
    ls -l /sys/bus/spi/devices/
    echo ""

    # 查找 SPI 設備
    SPI_DEVICE=$(find /sys/bus/spi/devices -name "spi*.*" 2>/dev/null | head -1)

    if [ -n "$SPI_DEVICE" ]; then
        echo "找到 SPI 設備: $SPI_DEVICE"
        ls -l "$SPI_DEVICE"
        echo ""

        # 測試 sysfs 屬性
        echo "步驟 3: 測試 sysfs 屬性"
        echo "---------------------------------------------------"

        if [ -f "$SPI_DEVICE/data" ]; then
            # 寫入數據
            echo "寫入十六進制數據: AA BB CC DD EE FF"
            echo "AA BB CC DD EE FF" > "$SPI_DEVICE/data"

            # 讀取數據
            echo "讀取數據:"
            cat "$SPI_DEVICE/data"
            echo ""

            # 寫入不同的數據
            echo "寫入新數據: 01 02 03 04 05"
            echo "01 02 03 04 05" > "$SPI_DEVICE/data"
            echo "讀取數據:"
            cat "$SPI_DEVICE/data"
            echo ""
        fi

        # 查看設備屬性
        if [ -f "$SPI_DEVICE/modalias" ]; then
            echo "設備別名: $(cat $SPI_DEVICE/modalias)"
        fi
    else
        echo "警告: 找不到 SPI 設備節點"
        echo "這是正常的，在沒有真實 SPI 硬體的系統上"
    fi
else
    echo "警告: SPI 總線不存在"
    echo "這是正常的，在沒有真實 SPI 硬體的系統上"
fi
echo ""

# 查看內核日誌
echo "步驟 4: 查看內核日誌"
echo "---------------------------------------------------"
dmesg | grep -i "spi_dummy" | tail -20
echo ""

# 卸載驅動
echo "步驟 5: 卸載驅動"
echo "---------------------------------------------------"
rmmod spi_dummy_device
echo "驅動已卸載"
echo ""

echo "==================================================="
echo "               測試完成!"
echo "==================================================="
echo ""
echo "注意: 此為虛擬設備測試，不需要真實 SPI 硬體"
