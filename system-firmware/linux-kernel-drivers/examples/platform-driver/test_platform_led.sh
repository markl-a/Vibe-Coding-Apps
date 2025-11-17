#!/bin/bash

# 平台 LED 驅動測試腳本

DRIVER_DIR="../../platform-driver"

echo "==================================================="
echo "         平台 LED 驅動測試腳本"
echo "==================================================="
echo ""

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
    echo "錯誤: 請使用 sudo 執行此腳本"
    exit 1
fi

# 編譯驅動
echo "步驟 1: 編譯驅動"
echo "---------------------------------------------------"
cd "$DRIVER_DIR"
make clean
make
echo ""

# 載入驅動
echo "步驟 2: 載入驅動"
echo "---------------------------------------------------"
if lsmod | grep -q platform_led_driver; then
    rmmod platform_led_driver
fi

insmod platform_led_driver.ko
echo "驅動載入成功!"
sleep 1
echo ""

# 查看平台設備
echo "步驟 3: 查看平台設備"
echo "---------------------------------------------------"
DEVICE_PATH=$(find /sys/devices/platform -name "platform_led*" 2>/dev/null | head -1)

if [ -z "$DEVICE_PATH" ]; then
    echo "錯誤: 找不到平台設備"
    exit 1
fi

echo "設備路徑: $DEVICE_PATH"
ls -l "$DEVICE_PATH"
echo ""

# 查看設備屬性
echo "步驟 4: 查看設備屬性"
echo "---------------------------------------------------"
echo "設備名稱: $(cat $DEVICE_PATH/modalias 2>/dev/null || echo 'N/A')"
echo "驅動: $(readlink $DEVICE_PATH/driver 2>/dev/null | xargs basename || echo 'N/A')"
echo ""

# 測試 LED 控制
echo "步驟 5: 測試 LED 控制（sysfs）"
echo "---------------------------------------------------"

if [ -f "$DEVICE_PATH/led_state" ]; then
    echo "當前 LED 狀態: $(cat $DEVICE_PATH/led_state)"
    echo ""

    # 打開 LED
    echo "打開 LED..."
    echo "on" > "$DEVICE_PATH/led_state"
    sleep 1
    echo "LED 狀態: $(cat $DEVICE_PATH/led_state)"
    echo ""

    # 關閉 LED
    echo "關閉 LED..."
    echo "off" > "$DEVICE_PATH/led_state"
    sleep 1
    echo "LED 狀態: $(cat $DEVICE_PATH/led_state)"
    echo ""

    # LED 閃爍測試
    echo "LED 閃爍測試 (5次)..."
    for i in {1..5}; do
        echo "on" > "$DEVICE_PATH/led_state"
        echo -n "■ "
        sleep 0.5
        echo "off" > "$DEVICE_PATH/led_state"
        echo -n "□ "
        sleep 0.5
    done
    echo ""
    echo ""

    # 使用數字控制
    echo "使用數字控制 LED..."
    echo "1" > "$DEVICE_PATH/led_state"
    echo "LED 狀態: $(cat $DEVICE_PATH/led_state)"
    sleep 1

    echo "0" > "$DEVICE_PATH/led_state"
    echo "LED 狀態: $(cat $DEVICE_PATH/led_state)"
    echo ""
else
    echo "警告: led_state 屬性不存在"
fi

# 查看 uevent
echo "步驟 6: 查看設備 uevent"
echo "---------------------------------------------------"
if [ -f "$DEVICE_PATH/uevent" ]; then
    cat "$DEVICE_PATH/uevent"
fi
echo ""

# 查看內核日誌
echo "步驟 7: 查看內核日誌"
echo "---------------------------------------------------"
dmesg | grep platform_led | tail -20
echo ""

# 卸載驅動
echo "步驟 8: 卸載驅動"
echo "---------------------------------------------------"
rmmod platform_led_driver
echo "驅動已卸載"
echo ""

echo "==================================================="
echo "               測試完成!"
echo "==================================================="
echo ""
echo "說明:"
echo "- 這是一個虛擬 LED 驅動，不需要實際硬體"
echo "- 在真實硬體上，LED 會實際點亮/熄滅"
echo "- 可以通過 sysfs 控制 LED 狀態"
