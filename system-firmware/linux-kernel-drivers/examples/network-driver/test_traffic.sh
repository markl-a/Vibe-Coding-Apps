#!/bin/bash

# 虛擬網路設備流量測試

INTERFACE="vnet0"

echo "==================================================="
echo "         虛擬網路設備流量測試"
echo "==================================================="
echo ""

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
    echo "錯誤: 請使用 sudo 執行此腳本"
    exit 1
fi

# 檢查接口
if ! ip link show "$INTERFACE" &>/dev/null; then
    echo "錯誤: 接口 $INTERFACE 不存在!"
    echo "請先執行: sudo ./test_ping.sh"
    exit 1
fi

# 啟動接口並配置 IP
echo "配置接口..."
ip link set "$INTERFACE" up
ip addr add 192.168.100.1/24 dev "$INTERFACE" 2>/dev/null || true
echo ""

# 使用 iperf3 測試（如果可用）
if command -v iperf3 &>/dev/null; then
    echo "使用 iperf3 進行性能測試"
    echo "---------------------------------------------------"

    # 啟動服務器
    iperf3 -s -B 192.168.100.1 -p 5201 &
    IPERF_PID=$!
    sleep 2

    # 運行客戶端
    echo "執行 TCP 測試..."
    iperf3 -c 192.168.100.1 -p 5201 -t 5

    kill $IPERF_PID 2>/dev/null
    wait $IPERF_PID 2>/dev/null || true
    echo ""
fi

# 使用 tcpdump 捕獲流量（如果可用）
if command -v tcpdump &>/dev/null; then
    echo "使用 tcpdump 捕獲流量 (10秒)"
    echo "---------------------------------------------------"

    # 在後台啟動 tcpdump
    tcpdump -i "$INTERFACE" -c 20 -nn &
    TCPDUMP_PID=$!

    # 生成一些流量
    sleep 1
    ping -c 5 -I "$INTERFACE" 192.168.100.1 &>/dev/null &

    # 等待 tcpdump
    wait $TCPDUMP_PID 2>/dev/null || true
    echo ""
fi

# 顯示統計信息
echo "網路統計信息"
echo "---------------------------------------------------"
ip -s link show "$INTERFACE"
echo ""

# 查看內核日誌
echo "內核日誌 (最後 15 行)"
echo "---------------------------------------------------"
dmesg | grep vnetdev | tail -15
echo ""

echo "==================================================="
echo "               測試完成!"
echo "==================================================="
