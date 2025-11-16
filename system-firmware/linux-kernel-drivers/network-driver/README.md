# 虛擬網路設備驅動 (Virtual Network Device Driver)

這是一個完整的 Linux 網路設備驅動範例，實現了虛擬以太網設備。

## 📋 專案簡介

此專案實現了一個功能完整的虛擬網路設備驅動，特性包括：
- 標準以太網設備接口
- 數據包發送和接收（loopback 模式）
- 網路統計資訊
- MAC 地址設定
- MTU 修改
- ethtool 支援

## 🎯 學習目標

- 理解 Linux 網路設備驅動架構
- 掌握 `net_device` 結構和操作
- 學習 sk_buff（socket buffer）處理
- 了解網路協定棧接口
- 實踐網路統計和 ethtool

## 🛠️ 編譯與安裝

### 編譯模組

```bash
make
```

### 載入模組

```bash
make install
```

### 查看網路設備

```bash
ip link show
ifconfig -a
```

### 卸載模組

```bash
make uninstall
```

## 🧪 測試驅動

### 自動測試

```bash
make test
```

### 手動測試

1. **啟動網路介面**

```bash
sudo ip link set vnet0 up
```

2. **配置 IP 地址**

```bash
sudo ip addr add 192.168.100.1/24 dev vnet0
```

3. **測試連通性**

```bash
# Ping 自己（loopback）
ping -c 5 192.168.100.1

# 查看路由
ip route

# 查看 ARP 緩存
ip neigh
```

4. **查看統計資訊**

```bash
# 查看網路統計
ip -s link show vnet0

# 使用 ethtool
sudo ethtool vnet0
sudo ethtool -i vnet0  # 驅動資訊
```

5. **修改 MTU**

```bash
sudo ip link set vnet0 mtu 1400
ip link show vnet0
```

6. **修改 MAC 地址**

```bash
# 先停用介面
sudo ip link set vnet0 down

# 修改 MAC
sudo ip link set vnet0 address 02:01:02:03:04:05

# 重新啟用
sudo ip link set vnet0 up
```

### 進階測試

**使用 tcpdump 抓包**

```bash
# 在一個終端
sudo tcpdump -i vnet0 -n -v

# 在另一個終端發送數據
ping -c 3 192.168.100.1
```

**使用 netcat 測試**

```bash
# 啟動伺服器
nc -l 12345 &

# 發送數據（同一主機）
echo "Hello" | nc 192.168.100.1 12345
```

## 📊 代碼結構

```
virtual_netdev.c
├── 數據結構
│   └── vnet_priv - 設備私有數據
├── 網路操作
│   ├── vnet_open() - 打開設備
│   ├── vnet_stop() - 關閉設備
│   ├── vnet_start_xmit() - 發送數據包
│   ├── vnet_get_stats() - 獲取統計
│   ├── vnet_set_mac_address() - 設置 MAC
│   ├── vnet_tx_timeout() - 傳輸超時
│   └── vnet_change_mtu() - 改變 MTU
├── ethtool 操作
│   ├── vnet_get_drvinfo() - 驅動資訊
│   └── vnet_get_link() - 連接狀態
└── 模組操作
    ├── vnet_init() - 模組初始化
    └── vnet_exit() - 模組卸載
```

## 🔍 核心概念解析

### 1. 網路設備分配

```c
vnet_dev = alloc_netdev(sizeof(struct vnet_priv), "vnet%d",
                       NET_NAME_UNKNOWN, vnet_setup);
```

- `sizeof(struct vnet_priv)` - 私有數據大小
- `"vnet%d"` - 設備名稱模板
- `vnet_setup` - 設備初始化函數

### 2. 數據包發送

```c
static netdev_tx_t vnet_start_xmit(struct sk_buff *skb,
                                   struct net_device *dev)
{
    // 處理數據包
    dev_kfree_skb(skb);  // 釋放 sk_buff
    return NETDEV_TX_OK;
}
```

- `sk_buff` 是 Linux 網路子系統的核心數據結構
- 包含數據包內容和元數據
- 發送完成後必須釋放

### 3. 數據包接收

```c
rx_skb = dev_alloc_skb(len + 2);
skb_reserve(rx_skb, 2);  // IP 標頭對齊
memcpy(skb_put(rx_skb, len), data, len);
rx_skb->protocol = eth_type_trans(rx_skb, dev);
netif_rx(rx_skb);  // 傳遞給協定棧
```

- 分配新的 sk_buff
- 填充數據
- 設置協定類型
- 傳遞給上層

### 4. 網路統計

```c
priv->stats.tx_packets++;
priv->stats.tx_bytes += skb->len;
priv->stats.rx_packets++;
priv->stats.rx_bytes += rx_skb->len;
```

- 追蹤發送/接收的數據包和字節數
- 可通過 `ip -s link` 查看

### 5. MAC 地址處理

```c
eth_hw_addr_random(dev);  // 生成隨機 MAC
is_valid_ether_addr(addr);  // 驗證 MAC 地址
```

## 📈 進階擴展

### 添加 NAPI 支援

NAPI（New API）是高效的數據包接收機制：

```c
static int vnet_poll(struct napi_struct *napi, int budget)
{
    int work_done = 0;

    while (work_done < budget) {
        // 接收數據包
        work_done++;
    }

    if (work_done < budget) {
        napi_complete(napi);
        // 重新啟用中斷
    }

    return work_done;
}
```

### 添加多佇列支援

```c
static int vnet_select_queue(struct net_device *dev,
                             struct sk_buff *skb,
                             struct net_device *sb_dev)
{
    // 選擇傳輸佇列
    return skb_tx_hash(dev, skb);
}
```

### 實現 VLAN 支援

```c
dev->features |= NETIF_F_HW_VLAN_CTAG_TX;
dev->features |= NETIF_F_HW_VLAN_CTAG_RX;
```

### 添加統計計數器

```c
struct vnet_stats {
    u64 tx_packets;
    u64 tx_bytes;
    u64 rx_packets;
    u64 rx_bytes;
    u64 tx_errors;
    u64 rx_errors;
    u64 tx_dropped;
    u64 rx_dropped;
};
```

## 🐛 常見問題

### 1. 介面無法啟動

**問題**: `RTNETLINK answers: No such device`

**解決方案**:
```bash
# 檢查模組是否載入
lsmod | grep virtual_netdev

# 查看核心日誌
dmesg | grep vnet
```

### 2. 無法 ping 通

**問題**: `ping: sendmsg: Network is unreachable`

**解決方案**:
```bash
# 確認介面已啟動
ip link show vnet0

# 確認 IP 地址已配置
ip addr show vnet0

# 啟動介面
sudo ip link set vnet0 up
```

### 3. MAC 地址無法修改

**問題**: `SIOCSIFHWADDR: Device or resource busy`

**解決方案**:
```bash
# 必須先停用介面
sudo ip link set vnet0 down
sudo ip link set vnet0 address xx:xx:xx:xx:xx:xx
sudo ip link set vnet0 up
```

## 🔬 實際應用場景

### 1. 網路隔離測試

```bash
# 創建網路命名空間
sudo ip netns add testns

# 將虛擬設備移到命名空間
sudo ip link set vnet0 netns testns

# 在命名空間中配置
sudo ip netns exec testns ip addr add 10.0.0.1/24 dev vnet0
sudo ip netns exec testns ip link set vnet0 up
```

### 2. 橋接配置

```bash
# 創建橋接
sudo brctl addbr br0
sudo brctl addif br0 vnet0

# 配置橋接
sudo ip link set br0 up
sudo ip addr add 192.168.200.1/24 dev br0
```

### 3. 虛擬網路拓撲

```bash
# 載入多個虛擬設備（需修改代碼支援）
# 用於模擬複雜網路拓撲
```

## 📚 延伸閱讀

- [Linux Device Drivers, 3rd Edition](https://lwn.net/Kernel/LDD3/) - Chapter 17: Network Drivers
- [Understanding Linux Network Internals](http://shop.oreilly.com/product/9780596002558.do)
- [Linux Kernel Networking Documentation](https://www.kernel.org/doc/html/latest/networking/index.html)

## 🔄 網路設備類型比較

| 類型 | 用途 | 範例 |
|------|------|------|
| 以太網 | 有線網路 | eth0, ens33 |
| 無線 | Wi-Fi | wlan0 |
| 虛擬 | 測試、隧道 | vnet0, tap0 |
| 迴環 | 本地通信 | lo |
| 橋接 | 網路橋接 | br0 |

## 📝 授權

GPL v2

## 👨‍💻 貢獻者

AI-Assisted Development Team
