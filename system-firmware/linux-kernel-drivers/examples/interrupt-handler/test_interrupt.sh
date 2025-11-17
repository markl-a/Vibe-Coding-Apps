#!/bin/bash

# 中斷處理器測試腳本

DRIVER_DIR="../../interrupt-handler"

echo "==================================================="
echo "           中斷處理器測試腳本"
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

# 載入驅動（不指定 IRQ）
echo "步驟 2: 載入驅動（演示模式，無實際 IRQ）"
echo "---------------------------------------------------"
if lsmod | grep -q interrupt_example; then
    rmmod interrupt_example
fi

insmod interrupt_example.ko
echo "驅動載入成功（演示模式）"
sleep 1
echo ""

# 查看設備
echo "步驟 3: 查看平台設備"
echo "---------------------------------------------------"
ls -l /sys/devices/platform/irq_example* 2>/dev/null || echo "設備節點未找到"
echo ""

# 查看 sysfs 屬性
echo "步驟 4: 查看 sysfs 屬性"
echo "---------------------------------------------------"
DEVICE_PATH=$(find /sys/devices/platform -name "irq_example*" 2>/dev/null | head -1)

if [ -n "$DEVICE_PATH" ]; then
    echo "設備路徑: $DEVICE_PATH"

    if [ -f "$DEVICE_PATH/irq_count" ]; then
        echo "中斷計數: $(cat $DEVICE_PATH/irq_count)"
    fi

    echo ""
    echo "設備屬性:"
    ls -l "$DEVICE_PATH/"
fi
echo ""

# 查看中斷統計
echo "步驟 5: 系統中斷統計"
echo "---------------------------------------------------"
echo "前 20 行 /proc/interrupts:"
head -20 /proc/interrupts
echo ""

# 查看內核日誌
echo "步驟 6: 查看內核日誌"
echo "---------------------------------------------------"
dmesg | grep irq_example | tail -20
echo ""

# 卸載驅動
echo "步驟 7: 卸載驅動"
echo "---------------------------------------------------"
rmmod interrupt_example
echo "驅動已卸載"
echo ""

# 使用指定的 IRQ 重新載入（示例）
echo "步驟 8: 使用指定 IRQ 重新載入（示例）"
echo "---------------------------------------------------"
echo "注意: 以下命令僅為示例，需要有效的 IRQ 號"
echo ""
echo "載入命令示例:"
echo "  sudo insmod interrupt_example.ko irq_number=1"
echo ""
echo "查看可用的 IRQ:"
cat /proc/interrupts | head -10
echo ""

echo "==================================================="
echo "               測試完成!"
echo "==================================================="
echo ""
echo "說明:"
echo "- 此驅動在演示模式下運行（無實際中斷）"
echo "- 要測試真實中斷，需要指定有效的 IRQ 號"
echo "- 查看 /proc/interrupts 了解系統中斷信息"
