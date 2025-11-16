/*
 * virtual_netdev.c - 虛擬網路設備驅動
 *
 * 這是一個虛擬網路設備驅動範例，展示了：
 * - 網路設備註冊
 * - 數據包發送和接收
 * - 網路統計資訊
 * - ethtool 支援
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/netdevice.h>
#include <linux/etherdevice.h>
#include <linux/ip.h>
#include <linux/tcp.h>
#include <linux/skbuff.h>
#include <linux/ethtool.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("AI-Assisted Developer");
MODULE_DESCRIPTION("Virtual Network Device Driver");
MODULE_VERSION("1.0");

#define DRV_NAME "vnetdev"
#define TX_TIMEOUT (5 * HZ)

/* 設備私有數據 */
struct vnet_priv {
    struct net_device *dev;
    struct net_device_stats stats;
    spinlock_t lock;
    struct sk_buff *tx_skb;
    int tx_queue_len;
};

/*
 * vnet_open - 打開網路設備
 */
static int vnet_open(struct net_device *dev)
{
    pr_info("%s: Device opened\n", DRV_NAME);

    /* 啟動傳輸佇列 */
    netif_start_queue(dev);

    return 0;
}

/*
 * vnet_stop - 關閉網路設備
 */
static int vnet_stop(struct net_device *dev)
{
    pr_info("%s: Device stopped\n", DRV_NAME);

    /* 停止傳輸佇列 */
    netif_stop_queue(dev);

    return 0;
}

/*
 * vnet_start_xmit - 發送數據包
 */
static netdev_tx_t vnet_start_xmit(struct sk_buff *skb, struct net_device *dev)
{
    struct vnet_priv *priv = netdev_priv(dev);
    unsigned long flags;

    spin_lock_irqsave(&priv->lock, flags);

    /* 更新統計資訊 */
    priv->stats.tx_packets++;
    priv->stats.tx_bytes += skb->len;

    /* 模擬數據包傳輸 */
    pr_info("%s: Transmitting packet (%u bytes)\n", DRV_NAME, skb->len);

    /* 在真實驅動中，這裡會將數據包發送到硬體
     * 在這個虛擬設備中，我們模擬接收發送的數據包（loopback）
     */

    /* 創建接收數據包 */
    if (skb) {
        struct sk_buff *rx_skb;

        /* 分配新的 sk_buff 用於接收 */
        rx_skb = dev_alloc_skb(skb->len + 2);
        if (rx_skb) {
            skb_reserve(rx_skb, 2);  /* 對齊 IP 標頭 */

            /* 複製數據 */
            memcpy(skb_put(rx_skb, skb->len), skb->data, skb->len);

            /* 設置接收數據包屬性 */
            rx_skb->dev = dev;
            rx_skb->protocol = eth_type_trans(rx_skb, dev);
            rx_skb->ip_summed = CHECKSUM_UNNECESSARY;

            /* 更新接收統計 */
            priv->stats.rx_packets++;
            priv->stats.rx_bytes += rx_skb->len;

            /* 將數據包傳遞給上層協定棧 */
            netif_rx(rx_skb);

            pr_info("%s: Received packet (%u bytes)\n", DRV_NAME, rx_skb->len);
        }
    }

    /* 釋放傳輸的 sk_buff */
    dev_kfree_skb(skb);

    spin_unlock_irqrestore(&priv->lock, flags);

    return NETDEV_TX_OK;
}

/*
 * vnet_get_stats - 獲取網路統計資訊
 */
static struct net_device_stats *vnet_get_stats(struct net_device *dev)
{
    struct vnet_priv *priv = netdev_priv(dev);
    return &priv->stats;
}

/*
 * vnet_set_mac_address - 設置 MAC 地址
 */
static int vnet_set_mac_address(struct net_device *dev, void *addr)
{
    struct sockaddr *sa = addr;

    if (!is_valid_ether_addr(sa->sa_data))
        return -EADDRNOTAVAIL;

    memcpy(dev->dev_addr, sa->sa_data, ETH_ALEN);

    pr_info("%s: MAC address changed to %pM\n", DRV_NAME, dev->dev_addr);

    return 0;
}

/*
 * vnet_tx_timeout - 傳輸超時處理
 */
static void vnet_tx_timeout(struct net_device *dev, unsigned int txqueue)
{
    struct vnet_priv *priv = netdev_priv(dev);

    pr_warning("%s: Transmit timeout\n", DRV_NAME);

    priv->stats.tx_errors++;

    /* 重新啟動傳輸佇列 */
    netif_wake_queue(dev);
}

/*
 * vnet_change_mtu - 改變 MTU
 */
static int vnet_change_mtu(struct net_device *dev, int new_mtu)
{
    pr_info("%s: Changing MTU from %d to %d\n", DRV_NAME, dev->mtu, new_mtu);

    dev->mtu = new_mtu;

    return 0;
}

/* 網路設備操作 */
static const struct net_device_ops vnet_netdev_ops = {
    .ndo_open = vnet_open,
    .ndo_stop = vnet_stop,
    .ndo_start_xmit = vnet_start_xmit,
    .ndo_get_stats = vnet_get_stats,
    .ndo_set_mac_address = vnet_set_mac_address,
    .ndo_tx_timeout = vnet_tx_timeout,
    .ndo_change_mtu = vnet_change_mtu,
};

/*
 * vnet_get_drvinfo - 獲取驅動資訊（ethtool）
 */
static void vnet_get_drvinfo(struct net_device *dev,
                            struct ethtool_drvinfo *info)
{
    strlcpy(info->driver, DRV_NAME, sizeof(info->driver));
    strlcpy(info->version, "1.0", sizeof(info->version));
    strlcpy(info->bus_info, "virtual", sizeof(info->bus_info));
}

/*
 * vnet_get_link - 獲取連接狀態（ethtool）
 */
static u32 vnet_get_link(struct net_device *dev)
{
    /* 虛擬設備始終連接 */
    return 1;
}

/* ethtool 操作 */
static const struct ethtool_ops vnet_ethtool_ops = {
    .get_drvinfo = vnet_get_drvinfo,
    .get_link = vnet_get_link,
};

/*
 * vnet_setup - 設置網路設備
 */
static void vnet_setup(struct net_device *dev)
{
    struct vnet_priv *priv;

    /* 使用 ether_setup 設置以太網設備默認值 */
    ether_setup(dev);

    /* 設置網路設備操作 */
    dev->netdev_ops = &vnet_netdev_ops;
    dev->ethtool_ops = &vnet_ethtool_ops;

    /* 設置設備屬性 */
    dev->watchdog_timeo = TX_TIMEOUT;
    dev->flags |= IFF_NOARP;
    dev->features |= NETIF_F_HW_CSUM;

    /* 初始化私有數據 */
    priv = netdev_priv(dev);
    memset(priv, 0, sizeof(struct vnet_priv));
    spin_lock_init(&priv->lock);
    priv->dev = dev;

    /* 生成隨機 MAC 地址 */
    eth_hw_addr_random(dev);

    pr_info("%s: Device setup complete, MAC: %pM\n", DRV_NAME, dev->dev_addr);
}

static struct net_device *vnet_dev;

/*
 * vnet_init - 模組初始化
 */
static int __init vnet_init(void)
{
    int ret;

    pr_info("%s: Initializing virtual network device\n", DRV_NAME);

    /* 分配網路設備 */
    vnet_dev = alloc_netdev(sizeof(struct vnet_priv), "vnet%d",
                           NET_NAME_UNKNOWN, vnet_setup);
    if (!vnet_dev) {
        pr_err("%s: Failed to allocate network device\n", DRV_NAME);
        return -ENOMEM;
    }

    /* 註冊網路設備 */
    ret = register_netdev(vnet_dev);
    if (ret) {
        pr_err("%s: Failed to register network device\n", DRV_NAME);
        free_netdev(vnet_dev);
        return ret;
    }

    pr_info("%s: Network device registered as %s\n", DRV_NAME, vnet_dev->name);
    pr_info("%s: Use 'ip link set %s up' to activate\n", DRV_NAME, vnet_dev->name);

    return 0;
}

/*
 * vnet_exit - 模組卸載
 */
static void __exit vnet_exit(void)
{
    pr_info("%s: Unloading virtual network device\n", DRV_NAME);

    if (vnet_dev) {
        unregister_netdev(vnet_dev);
        free_netdev(vnet_dev);
    }

    pr_info("%s: Module unloaded successfully\n", DRV_NAME);
}

module_init(vnet_init);
module_exit(vnet_exit);
