# 虛擬網卡驅動 (Virtual Network Driver)

Linux 虛擬網路設備驅動程式，用於學習網路驅動開發和網路測試。

## 專案概述

本專案提供一個完整的虛擬網卡驅動實現，模擬真實網卡的功能，支援資料包的發送和接收，適合用於網路驅動開發學習、網路協議測試和虛擬化環境。

## 功能特色

### 🌐 網路功能
- **基本網路操作**
  - 資料包發送和接收
  - 多播和廣播支援
  - VLAN 標記
  - MTU 配置

- **統計資訊**
  - 發送/接收位元組數
  - 發送/接收封包數
  - 錯誤計數
  - 丟包統計

### 🔧 進階功能
- **效能特性**
  - NAPI 輪詢機制
  - 多佇列支援
  - TCP 分段卸載 (TSO)
  - 校驗和卸載
  - 分散/聚集 DMA

- **虛擬化支援**
  - virtio-net 介面
  - 橋接模式
  - NAT 模式
  - 虛擬交換機

## 專案結構

```
virtual-network-driver/
├── README.md                    # 專案說明
├── driver/                      # 驅動程式
│   ├── vnet.c                  # 虛擬網卡驅動
│   ├── vnet_main.c             # 主要邏輯
│   ├── vnet_ethtool.c          # ethtool 支援
│   └── Makefile                # 編譯配置
├── userspace/                   # 使用者空間程式
│   ├── vnet_test.c             # 網路測試工具
│   ├── packet_gen.c            # 封包生成器
│   └── Makefile                # 編譯配置
├── scripts/                     # 腳本
│   ├── setup_vnet.sh           # 網卡設定腳本
│   ├── bridge_setup.sh         # 橋接設定
│   └── test_network.sh         # 網路測試
└── docs/                        # 文檔
    ├── architecture.md         # 架構說明
    ├── api-reference.md        # API 參考
    └── examples.md             # 使用範例
```

## 快速開始

### 編譯驅動

```bash
cd driver/
make
```

### 載入驅動

```bash
# 載入虛擬網卡驅動
sudo insmod vnet.ko

# 檢查網卡
ip link show

# 應該看到新的虛擬網卡 vnet0
```

### 配置網卡

```bash
# 啟用網卡
sudo ip link set vnet0 up

# 設定 IP 地址
sudo ip addr add 192.168.100.1/24 dev vnet0

# 檢查狀態
ip addr show vnet0

# 查看統計資訊
ip -s link show vnet0
```

### 創建虛擬網路對

```bash
# 載入兩個虛擬網卡實例
sudo insmod vnet.ko num_devices=2

# 配置第一個網卡
sudo ip link set vnet0 up
sudo ip addr add 192.168.100.1/24 dev vnet0

# 配置第二個網卡
sudo ip link set vnet1 up
sudo ip addr add 192.168.100.2/24 dev vnet1

# 測試連通性
ping -c 4 -I vnet0 192.168.100.2
```

## 驅動架構

### 網路設備結構

```c
/* 虛擬網卡私有資料 */
struct vnet_priv {
    struct net_device *dev;
    struct net_device *peer;  /* 對端網卡 */
    struct napi_struct napi;
    struct sk_buff_head tx_queue;
    spinlock_t lock;

    /* 統計資訊 */
    struct net_device_stats stats;

    /* 配置 */
    int mtu;
    u8 mac_addr[ETH_ALEN];
};
```

### 資料包發送

```c
/* 發送資料包 */
static netdev_tx_t vnet_start_xmit(struct sk_buff *skb,
                                   struct net_device *dev)
{
    struct vnet_priv *priv = netdev_priv(dev);
    struct vnet_priv *peer_priv;

    if (!priv->peer) {
        /* 沒有對端，直接丟棄 */
        dev_kfree_skb(skb);
        priv->stats.tx_dropped++;
        return NETDEV_TX_OK;
    }

    peer_priv = netdev_priv(priv->peer);

    /* 更新統計 */
    priv->stats.tx_packets++;
    priv->stats.tx_bytes += skb->len;

    /* 將封包加入對端接收佇列 */
    skb->dev = priv->peer;
    skb->protocol = eth_type_trans(skb, priv->peer);

    /* 觸發接收處理 */
    netif_rx(skb);

    /* 更新對端統計 */
    peer_priv->stats.rx_packets++;
    peer_priv->stats.rx_bytes += skb->len;

    return NETDEV_TX_OK;
}
```

### NAPI 輪詢

```c
/* NAPI 輪詢函數 */
static int vnet_poll(struct napi_struct *napi, int budget)
{
    struct vnet_priv *priv = container_of(napi, struct vnet_priv, napi);
    struct sk_buff *skb;
    int work_done = 0;

    while (work_done < budget) {
        spin_lock(&priv->lock);
        skb = skb_dequeue(&priv->tx_queue);
        spin_unlock(&priv->lock);

        if (!skb)
            break;

        /* 處理封包 */
        netif_receive_skb(skb);
        work_done++;
    }

    if (work_done < budget) {
        napi_complete(napi);
    }

    return work_done;
}
```

### ethtool 支援

```c
/* ethtool 操作 */
static const struct ethtool_ops vnet_ethtool_ops = {
    .get_drvinfo = vnet_get_drvinfo,
    .get_link = ethtool_op_get_link,
    .get_ts_info = ethtool_op_get_ts_info,
    .get_link_ksettings = vnet_get_link_ksettings,
};

static void vnet_get_drvinfo(struct net_device *dev,
                            struct ethtool_drvinfo *info)
{
    strlcpy(info->driver, "vnet", sizeof(info->driver));
    strlcpy(info->version, "1.0", sizeof(info->version));
    strlcpy(info->bus_info, "virtual", sizeof(info->bus_info));
}
```

## 使用範例

### 基本網路測試

```bash
# 使用 ping 測試
ping -c 4 -I vnet0 192.168.100.2

# 使用 iperf 測試頻寬
# 在一端啟動伺服器
iperf3 -s

# 在另一端啟動客戶端
iperf3 -c 192.168.100.2 -B 192.168.100.1

# TCP 測試
nc -l 192.168.100.2 8888  # 伺服器
echo "Hello" | nc 192.168.100.2 8888  # 客戶端
```

### 橋接配置

```bash
# 創建橋接
sudo ip link add name br0 type bridge

# 添加虛擬網卡到橋接
sudo ip link set vnet0 master br0
sudo ip link set vnet1 master br0

# 啟用橋接
sudo ip link set br0 up

# 配置橋接 IP
sudo ip addr add 192.168.100.254/24 dev br0
```

### 封包捕獲

```bash
# 使用 tcpdump 捕獲封包
sudo tcpdump -i vnet0 -n -v

# 捕獲到文件
sudo tcpdump -i vnet0 -w capture.pcap

# 使用 Wireshark 分析
wireshark capture.pcap
```

### 效能測試

```bash
# 查看網卡統計
ip -s link show vnet0

# 使用 ethtool 查看資訊
sudo ethtool vnet0
sudo ethtool -S vnet0  # 詳細統計

# 使用 netstat 查看連線
netstat -i vnet0
```

## 進階功能

### 多佇列支援

```c
/* 設定多佇列 */
static int vnet_set_channels(struct net_device *dev,
                            struct ethtool_channels *channels)
{
    struct vnet_priv *priv = netdev_priv(dev);
    int i;

    if (channels->rx_count > MAX_QUEUES ||
        channels->tx_count > MAX_QUEUES)
        return -EINVAL;

    /* 配置接收佇列 */
    for (i = 0; i < channels->rx_count; i++) {
        netif_napi_add(dev, &priv->napi[i],
                      vnet_poll, NAPI_POLL_WEIGHT);
    }

    return 0;
}
```

### VLAN 支援

```c
/* VLAN 接收 */
static rx_handler_result_t vnet_handle_frame(struct sk_buff **pskb)
{
    struct sk_buff *skb = *pskb;
    u16 vlan_id;

    if (skb_vlan_tag_present(skb)) {
        vlan_id = skb_vlan_tag_get(skb);
        pr_debug("Received VLAN packet, ID: %u\n", vlan_id);
    }

    return RX_HANDLER_PASS;
}
```

### TCP 分段卸載 (TSO)

```c
/* 啟用 TSO */
static int vnet_set_features(struct net_device *dev,
                            netdev_features_t features)
{
    netdev_features_t changed = dev->features ^ features;

    if (changed & NETIF_F_TSO) {
        if (features & NETIF_F_TSO)
            pr_info("TSO enabled\n");
        else
            pr_info("TSO disabled\n");
    }

    dev->features = features;
    return 0;
}
```

## 除錯技巧

### 核心日誌

```bash
# 查看驅動日誌
dmesg | grep vnet

# 啟用除錯訊息
echo 8 > /proc/sys/kernel/printk
echo "module vnet +p" > /sys/kernel/debug/dynamic_debug/control
```

### 網路追蹤

```bash
# 使用 trace-cmd 追蹤網路事件
sudo trace-cmd record -e net
sudo trace-cmd report

# 使用 perf 分析效能
sudo perf record -a -g -- sleep 10
sudo perf report
```

### 統計資訊

```bash
# /proc 介面
cat /proc/net/dev

# sysfs 介面
cat /sys/class/net/vnet0/statistics/rx_packets
cat /sys/class/net/vnet0/statistics/tx_packets
```

## 應用場景

### 1. 容器網路
```bash
# 為容器創建虛擬網卡
docker network create --driver vnet mynet
```

### 2. 網路測試
```bash
# 模擬網路延遲和丟包
tc qdisc add dev vnet0 root netem delay 100ms loss 1%
```

### 3. 防火牆測試
```bash
# 測試 iptables 規則
iptables -A FORWARD -i vnet0 -o vnet1 -j ACCEPT
```

### 4. VPN 隧道
```bash
# 創建 VPN 介面
ip tunnel add tun0 mode gre remote 192.168.100.2 local 192.168.100.1
```

## 效能優化

### NAPI 優化
- 合理設定 NAPI 權重
- 使用中斷合併
- 調整輪詢間隔

### 記憶體優化
- 使用 SKB 重用
- 優化緩衝區大小
- 減少記憶體複製

### 並發優化
- 使用 per-CPU 變數
- 減少鎖競爭
- 無鎖資料結構

## 授權

MIT License

## 參考資源

- [Linux Network Driver](https://www.kernel.org/doc/html/latest/networking/netdevices.html)
- [NAPI Documentation](https://www.kernel.org/doc/Documentation/networking/napi.txt)
- [virtio-net Specification](https://docs.oasis-open.org/virtio/virtio/v1.1/virtio-v1.1.html)

---

**最後更新**: 2025-11-16
**維護者**: AI-Assisted Development Team
