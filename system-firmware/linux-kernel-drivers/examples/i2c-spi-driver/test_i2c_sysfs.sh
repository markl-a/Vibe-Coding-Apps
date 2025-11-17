#!/bin/bash

# I2C 虛擬設備 sysfs 測試腳本

DRIVER_DIR="../../i2c-spi-driver"
I2C_BUS="i2c-0"
DEVICE_ADDR="0x50"

echo "==================================================="
echo "         I2C 虛擬設備 sysfs 測試"
echo "==================================================="
echo ""

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
    echo "錯誤: 請使用 sudo 執行此腳本"
    exit 1
fi

# 編譯並載入驅動
echo "步驟 1: 編譯並載入 I2C 驅動"
echo "---------------------------------------------------"
cd "$DRIVER_DIR"
make clean
make

if lsmod | grep -q i2c_dummy_device; then
    rmmod i2c_dummy_device
fi

insmod i2c_dummy_device.ko
echo "驅動載入成功!"
sleep 1
echo ""

# 創建 I2C 設備實例
echo "步驟 2: 創建 I2C 設備實例"
echo "---------------------------------------------------"

# 檢查 i2c-0 總線是否存在
if [ ! -d "/sys/bus/i2c/devices/$I2C_BUS" ]; then
    echo "警告: I2C 總線 $I2C_BUS 不存在"
    echo "這是正常的，在沒有真實 I2C 硬體的系統上"
    echo "我們將跳過設備實例化步驟"
    echo ""
else
    # 實例化設備
    echo "在 $I2C_BUS 上創建設備 (地址: $DEVICE_ADDR)..."
    echo "i2c_dummy $DEVICE_ADDR" > /sys/bus/i2c/devices/$I2C_BUS/new_device
    echo "設備已創建"
    sleep 1
    echo ""

    # 查找設備 sysfs 路徑
    echo "步驟 3: 查找設備 sysfs 節點"
    echo "---------------------------------------------------"
    DEVICE_PATH=$(find /sys/bus/i2c/devices -name "$I2C_BUS-*" 2>/dev/null | head -1)

    if [ -n "$DEVICE_PATH" ]; then
        echo "設備路徑: $DEVICE_PATH"
        ls -l "$DEVICE_PATH"
        echo ""

        # 測試 sysfs 屬性
        echo "步驟 4: 測試 sysfs 屬性"
        echo "---------------------------------------------------"

        if [ -f "$DEVICE_PATH/reg_addr" ] && [ -f "$DEVICE_PATH/reg_value" ]; then
            # 設置寄存器地址
            echo "設置寄存器地址為 0x10..."
            echo "0x10" > "$DEVICE_PATH/reg_addr"
            echo "當前寄存器地址: $(cat $DEVICE_PATH/reg_addr)"

            # 寫入寄存器值
            echo "寫入值 0xAB 到寄存器 0x10..."
            echo "0xAB" > "$DEVICE_PATH/reg_value"

            # 讀取寄存器值
            echo "讀取寄存器值: $(cat $DEVICE_PATH/reg_value)"
            echo ""

            # 多個寄存器測試
            echo "測試多個寄存器..."
            for addr in 0x00 0x01 0x02 0x10 0x20; do
                echo "$addr" > "$DEVICE_PATH/reg_addr"
                value=$((RANDOM % 256))
                printf "寄存器 %s: 寫入 0x%02X... " "$addr" "$value"
                printf "0x%02X" "$value" > "$DEVICE_PATH/reg_value"
                read_val=$(cat "$DEVICE_PATH/reg_value")
                echo "讀取 $read_val"
            done
            echo ""
        fi

        # 清理 - 刪除設備
        echo "步驟 5: 刪除設備"
        echo "---------------------------------------------------"
        DEVICE_ADDR_NUM=$(basename "$DEVICE_PATH" | cut -d'-' -f2)
        echo "$DEVICE_ADDR_NUM" > /sys/bus/i2c/devices/$I2C_BUS/delete_device
        echo "設備已刪除"
    else
        echo "警告: 找不到設備節點"
    fi
fi

# 查看內核日誌
echo ""
echo "步驟 6: 查看內核日誌"
echo "---------------------------------------------------"
dmesg | grep -i "i2c_dummy" | tail -20
echo ""

# 卸載驅動
echo "步驟 7: 卸載驅動"
echo "---------------------------------------------------"
rmmod i2c_dummy_device
echo "驅動已卸載"
echo ""

echo "==================================================="
echo "               測試完成!"
echo "==================================================="
echo ""
echo "注意: 此為虛擬設備測試，不需要真實 I2C 硬體"
