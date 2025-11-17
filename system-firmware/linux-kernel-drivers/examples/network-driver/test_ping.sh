#!/bin/bash

# 虛擬網路設備 ping 測試

INTERFACE="vnet0"
IP_ADDR="192.168.100.1"
NETMASK="255.255.255.0"
DRIVER_DIR="../../network-driver"

echo "==================================================="
echo "         虛擬網路設備 Ping 測試"
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

if lsmod | grep -q virtual_netdev; then
    rmmod virtual_netdev
fi

insmod virtual_netdev.ko
echo "驅動載入成功!"
sleep 1
echo ""

# 檢查接口
echo "步驟 2: 檢查網路接口"
echo "---------------------------------------------------"
if ! ip link show "$INTERFACE" &>/dev/null; then
    echo "錯誤: 接口 $INTERFACE 不存在!"
    exit 1
fi

ip link show "$INTERFACE"
echo ""

# 啟動接口
echo "步驟 3: 啟動網路接口"
echo "---------------------------------------------------"
ip link set "$INTERFACE" up
echo "接口已啟動"
ip link show "$INTERFACE"
echo ""

# 配置 IP 地址
echo "步驟 4: 配置 IP 地址"
echo "---------------------------------------------------"
ip addr add "$IP_ADDR/$NETMASK" dev "$INTERFACE"
echo "IP 地址: $IP_ADDR"
echo "子網掩碼: $NETMASK"
ip addr show "$INTERFACE"
echo ""

# 查看路由表
echo "步驟 5: 查看路由表"
echo "---------------------------------------------------"
ip route show dev "$INTERFACE"
echo ""

# Ping 測試（loopback）
echo "步驟 6: Ping 測試 (loopback)"
echo "---------------------------------------------------"
echo "Ping 自己的 IP ($IP_ADDR)..."
ping -c 3 -I "$INTERFACE" "$IP_ADDR"
echo ""

# 網路統計
echo "步驟 7: 網路接口統計"
echo "---------------------------------------------------"
ip -s link show "$INTERFACE"
echo ""

# ethtool 信息（如果可用）
if command -v ethtool &>/dev/null; then
    echo "步驟 8: ethtool 信息"
    echo "---------------------------------------------------"
    ethtool "$INTERFACE" || echo "部分 ethtool 功能不可用（虛擬設備）"
    echo ""
fi

# 使用 nc 測試（如果安裝）
if command -v nc &>/dev/null; then
    echo "步驟 9: TCP 連接測試"
    echo "---------------------------------------------------"
    echo "在後台啟動 netcat 服務器..."
    nc -l -p 12345 -s "$IP_ADDR" &
    NC_PID=$!
    sleep 1

    echo "發送測試數據..."
    echo "Hello from netcat!" | nc "$IP_ADDR" 12345 || true

    kill $NC_PID 2>/dev/null || true
    wait $NC_PID 2>/dev/null || true
    echo ""
fi

# 清理
echo "步驟 10: 清理"
echo "---------------------------------------------------"
ip addr del "$IP_ADDR/$NETMASK" dev "$INTERFACE" 2>/dev/null || true
ip link set "$INTERFACE" down
rmmod virtual_netdev
echo "清理完成"
echo ""

echo "==================================================="
echo "               測試完成!"
echo "==================================================="
