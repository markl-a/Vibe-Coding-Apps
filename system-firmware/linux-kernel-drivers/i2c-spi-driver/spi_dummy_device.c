/*
 * spi_dummy_device.c - SPI 虛擬設備驅動
 *
 * 這是一個 SPI 設備驅動範例，展示了：
 * - SPI 設備驅動註冊
 * - SPI 傳輸操作
 * - 設備樹（Device Tree）支援
 * - sysfs 接口
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/spi/spi.h>
#include <linux/slab.h>
#include <linux/device.h>
#include <linux/of.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("AI-Assisted Developer");
MODULE_DESCRIPTION("SPI Dummy Device Driver");
MODULE_VERSION("1.0");

#define DRIVER_NAME "spi_dummy"
#define BUFFER_SIZE 256

/* 設備私有數據 */
struct spi_dummy_data {
    struct spi_device *spi;
    struct device *dev;
    u8 tx_buffer[BUFFER_SIZE];
    u8 rx_buffer[BUFFER_SIZE];
    struct mutex lock;
};

/*
 * spi_dummy_read - 從 SPI 設備讀取數據
 */
static int spi_dummy_read(struct spi_dummy_data *data, u8 *buf, size_t len)
{
    struct spi_transfer xfer = {
        .rx_buf = buf,
        .len = len,
    };
    struct spi_message msg;
    int ret;

    if (len > BUFFER_SIZE)
        return -EINVAL;

    mutex_lock(&data->lock);

    /* 初始化 SPI 消息 */
    spi_message_init(&msg);
    spi_message_add_tail(&xfer, &msg);

    /* 執行 SPI 傳輸 */
    /* 在虛擬設備中，我們模擬讀取 */
    memcpy(buf, data->rx_buffer, len);

    /* 在真實驅動中，這裡會執行實際的 SPI 傳輸：
     * ret = spi_sync(data->spi, &msg);
     */
    ret = 0;

    mutex_unlock(&data->lock);

    dev_dbg(data->dev, "SPI read %zu bytes\n", len);

    return ret;
}

/*
 * spi_dummy_write - 向 SPI 設備寫入數據
 */
static int spi_dummy_write(struct spi_dummy_data *data, const u8 *buf, size_t len)
{
    struct spi_transfer xfer = {
        .tx_buf = buf,
        .len = len,
    };
    struct spi_message msg;
    int ret;

    if (len > BUFFER_SIZE)
        return -EINVAL;

    mutex_lock(&data->lock);

    /* 初始化 SPI 消息 */
    spi_message_init(&msg);
    spi_message_add_tail(&xfer, &msg);

    /* 執行 SPI 傳輸 */
    /* 在虛擬設備中，我們模擬寫入 */
    memcpy(data->tx_buffer, buf, len);

    /* 在真實驅動中，這裡會執行實際的 SPI 傳輸：
     * ret = spi_sync(data->spi, &msg);
     */
    ret = 0;

    mutex_unlock(&data->lock);

    dev_dbg(data->dev, "SPI write %zu bytes\n", len);

    return ret;
}

/*
 * spi_dummy_transfer - SPI 全雙工傳輸
 */
static int spi_dummy_transfer(struct spi_dummy_data *data,
                             const u8 *tx_buf, u8 *rx_buf, size_t len)
{
    struct spi_transfer xfer = {
        .tx_buf = tx_buf,
        .rx_buf = rx_buf,
        .len = len,
    };
    struct spi_message msg;
    int ret;

    if (len > BUFFER_SIZE)
        return -EINVAL;

    mutex_lock(&data->lock);

    spi_message_init(&msg);
    spi_message_add_tail(&xfer, &msg);

    /* 模擬全雙工傳輸 */
    if (tx_buf)
        memcpy(data->tx_buffer, tx_buf, len);
    if (rx_buf)
        memcpy(rx_buf, data->rx_buffer, len);

    /* 真實驅動：ret = spi_sync(data->spi, &msg); */
    ret = 0;

    mutex_unlock(&data->lock);

    dev_dbg(data->dev, "SPI transfer %zu bytes\n", len);

    return ret;
}

/* sysfs 屬性：讀取數據 */
static ssize_t data_show(struct device *dev,
                        struct device_attribute *attr, char *buf)
{
    struct spi_dummy_data *data = dev_get_drvdata(dev);
    int i, len = 0;

    mutex_lock(&data->lock);

    for (i = 0; i < 16 && i < BUFFER_SIZE; i++)
        len += sprintf(buf + len, "%02x ", data->rx_buffer[i]);

    len += sprintf(buf + len, "\n");

    mutex_unlock(&data->lock);

    return len;
}

/* sysfs 屬性：寫入數據 */
static ssize_t data_store(struct device *dev,
                         struct device_attribute *attr,
                         const char *buf, size_t count)
{
    struct spi_dummy_data *data = dev_get_drvdata(dev);
    u8 tx_data[16];
    int i, ret;
    unsigned int val;
    char *token, *str, *str_copy;

    str_copy = kstrdup(buf, GFP_KERNEL);
    if (!str_copy)
        return -ENOMEM;

    str = str_copy;
    i = 0;

    while ((token = strsep(&str, " \n")) != NULL && i < 16) {
        if (*token == '\0')
            continue;

        ret = kstrtouint(token, 16, &val);
        if (ret < 0) {
            kfree(str_copy);
            return ret;
        }

        tx_data[i++] = val & 0xFF;
    }

    kfree(str_copy);

    if (i > 0) {
        ret = spi_dummy_write(data, tx_data, i);
        if (ret < 0)
            return ret;
    }

    return count;
}

static DEVICE_ATTR_RW(data);

static struct attribute *spi_dummy_attrs[] = {
    &dev_attr_data.attr,
    NULL,
};

static const struct attribute_group spi_dummy_attr_group = {
    .attrs = spi_dummy_attrs,
};

/*
 * spi_dummy_probe - 設備探測
 */
static int spi_dummy_probe(struct spi_device *spi)
{
    struct spi_dummy_data *data;
    int ret;

    dev_info(&spi->dev, "Probing SPI dummy device\n");

    /* 分配設備私有數據 */
    data = devm_kzalloc(&spi->dev, sizeof(*data), GFP_KERNEL);
    if (!data)
        return -ENOMEM;

    data->spi = spi;
    data->dev = &spi->dev;
    mutex_init(&data->lock);

    /* 初始化緩衝區 */
    memset(data->tx_buffer, 0, BUFFER_SIZE);
    memset(data->rx_buffer, 0, BUFFER_SIZE);

    /* 設置 SPI 模式和速度 */
    spi->mode = SPI_MODE_0;
    spi->bits_per_word = 8;

    ret = spi_setup(spi);
    if (ret < 0) {
        dev_err(&spi->dev, "SPI setup failed\n");
        return ret;
    }

    /* 儲存私有數據 */
    spi_set_drvdata(spi, data);
    dev_set_drvdata(&spi->dev, data);

    /* 創建 sysfs 屬性 */
    ret = sysfs_create_group(&spi->dev.kobj, &spi_dummy_attr_group);
    if (ret) {
        dev_err(&spi->dev, "Failed to create sysfs group\n");
        return ret;
    }

    dev_info(&spi->dev, "SPI dummy device probed successfully\n");
    dev_info(&spi->dev, "Mode: %d, Speed: %d Hz, BPW: %d\n",
             spi->mode, spi->max_speed_hz, spi->bits_per_word);

    return 0;
}

/*
 * spi_dummy_remove - 設備移除
 */
static void spi_dummy_remove(struct spi_device *spi)
{
    struct spi_dummy_data *data = spi_get_drvdata(spi);

    dev_info(&spi->dev, "Removing SPI dummy device\n");

    sysfs_remove_group(&spi->dev.kobj, &spi_dummy_attr_group);

    dev_info(&spi->dev, "SPI dummy device removed\n");
}

/* SPI 設備 ID 表 */
static const struct spi_device_id spi_dummy_id[] = {
    { "spi_dummy", 0 },
    { }
};
MODULE_DEVICE_TABLE(spi, spi_dummy_id);

/* 設備樹匹配表 */
static const struct of_device_id spi_dummy_of_match[] = {
    { .compatible = "vendor,spi-dummy" },
    { }
};
MODULE_DEVICE_TABLE(of, spi_dummy_of_match);

/* SPI 驅動結構 */
static struct spi_driver spi_dummy_driver = {
    .driver = {
        .name = DRIVER_NAME,
        .owner = THIS_MODULE,
        .of_match_table = spi_dummy_of_match,
    },
    .probe = spi_dummy_probe,
    .remove = spi_dummy_remove,
    .id_table = spi_dummy_id,
};

module_spi_driver(spi_dummy_driver);
