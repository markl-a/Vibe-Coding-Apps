#!/bin/bash

# 使用 i2c-tools 測試 I2C 設備

echo "==================================================="
echo "      使用 i2c-tools 測試 I2C 設備"
echo "==================================================="
echo ""

# 檢查 i2c-tools 是否安裝
if ! command -v i2cdetect &>/dev/null; then
    echo "錯誤: i2c-tools 未安裝"
    echo ""
    echo "請先安裝 i2c-tools:"
    echo "  Ubuntu/Debian: sudo apt-get install i2c-tools"
    echo "  Fedora/RHEL:   sudo dnf install i2c-tools"
    echo "  Arch:          sudo pacman -S i2c-tools"
    exit 1
fi

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
    echo "錯誤: 請使用 sudo 執行此腳本"
    exit 1
fi

# 檢查可用的 I2C 總線
echo "可用的 I2C 總線:"
echo "---------------------------------------------------"
i2cdetect -l
echo ""

# 掃描 I2C 總線（如果存在）
if [ -e /dev/i2c-0 ]; then
    echo "掃描 I2C 總線 0:"
    echo "---------------------------------------------------"
    i2cdetect -y 0
    echo ""

    # 讀取設備（示例）
    echo "嘗試讀取設備 0x50 的寄存器 0x00:"
    echo "---------------------------------------------------"
    i2cget -y 0 0x50 0x00 || echo "讀取失敗（可能沒有真實設備）"
    echo ""

    # 寫入設備（示例）
    echo "嘗試寫入值 0xAB 到設備 0x50 的寄存器 0x10:"
    echo "---------------------------------------------------"
    i2cset -y 0 0x50 0x10 0xAB || echo "寫入失敗（可能沒有真實設備）"
    echo ""
else
    echo "警告: /dev/i2c-0 不存在"
    echo "這是正常的，在沒有真實 I2C 硬體的系統上"
    echo ""
fi

echo "==================================================="
echo "               測試完成!"
echo "==================================================="
