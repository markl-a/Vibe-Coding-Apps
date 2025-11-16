/*
 * i2c_dummy_device.c - I2C 虛擬設備驅動
 *
 * 這是一個 I2C 設備驅動範例，展示了：
 * - I2C 設備驅動註冊
 * - I2C 讀寫操作
 * - 設備樹（Device Tree）支援
 * - sysfs 接口
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/i2c.h>
#include <linux/slab.h>
#include <linux/device.h>
#include <linux/of.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("AI-Assisted Developer");
MODULE_DESCRIPTION("I2C Dummy Device Driver");
MODULE_VERSION("1.0");

#define DRIVER_NAME "i2c_dummy"
#define BUFFER_SIZE 256

/* 設備私有數據 */
struct i2c_dummy_data {
    struct i2c_client *client;
    struct device *dev;
    u8 buffer[BUFFER_SIZE];
    u8 reg_addr;
    struct mutex lock;
};

/*
 * i2c_dummy_read_byte - 從設備讀取一個字節
 */
static int i2c_dummy_read_byte(struct i2c_dummy_data *data, u8 reg, u8 *val)
{
    int ret;

    mutex_lock(&data->lock);

    /* 模擬從寄存器讀取 */
    if (reg >= BUFFER_SIZE) {
        mutex_unlock(&data->lock);
        return -EINVAL;
    }

    *val = data->buffer[reg];

    /* 在真實驅動中，這裡會執行實際的 I2C 讀取：
     * ret = i2c_smbus_read_byte_data(data->client, reg);
     */

    mutex_unlock(&data->lock);

    dev_dbg(data->dev, "Read reg 0x%02x = 0x%02x\n", reg, *val);

    return 0;
}

/*
 * i2c_dummy_write_byte - 向設備寫入一個字節
 */
static int i2c_dummy_write_byte(struct i2c_dummy_data *data, u8 reg, u8 val)
{
    int ret;

    mutex_lock(&data->lock);

    /* 模擬向寄存器寫入 */
    if (reg >= BUFFER_SIZE) {
        mutex_unlock(&data->lock);
        return -EINVAL;
    }

    data->buffer[reg] = val;

    /* 在真實驅動中，這裡會執行實際的 I2C 寫入：
     * ret = i2c_smbus_write_byte_data(data->client, reg, val);
     */

    mutex_unlock(&data->lock);

    dev_dbg(data->dev, "Write reg 0x%02x = 0x%02x\n", reg, val);

    return 0;
}

/* sysfs 屬性：讀取寄存器值 */
static ssize_t reg_value_show(struct device *dev,
                              struct device_attribute *attr, char *buf)
{
    struct i2c_dummy_data *data = dev_get_drvdata(dev);
    u8 val;
    int ret;

    ret = i2c_dummy_read_byte(data, data->reg_addr, &val);
    if (ret < 0)
        return ret;

    return sprintf(buf, "0x%02x\n", val);
}

/* sysfs 屬性：寫入寄存器值 */
static ssize_t reg_value_store(struct device *dev,
                               struct device_attribute *attr,
                               const char *buf, size_t count)
{
    struct i2c_dummy_data *data = dev_get_drvdata(dev);
    unsigned int val;
    int ret;

    ret = kstrtouint(buf, 0, &val);
    if (ret < 0)
        return ret;

    if (val > 0xFF)
        return -EINVAL;

    ret = i2c_dummy_write_byte(data, data->reg_addr, val);
    if (ret < 0)
        return ret;

    return count;
}

/* sysfs 屬性：設置寄存器地址 */
static ssize_t reg_addr_show(struct device *dev,
                             struct device_attribute *attr, char *buf)
{
    struct i2c_dummy_data *data = dev_get_drvdata(dev);
    return sprintf(buf, "0x%02x\n", data->reg_addr);
}

static ssize_t reg_addr_store(struct device *dev,
                              struct device_attribute *attr,
                              const char *buf, size_t count)
{
    struct i2c_dummy_data *data = dev_get_drvdata(dev);
    unsigned int addr;
    int ret;

    ret = kstrtouint(buf, 0, &addr);
    if (ret < 0)
        return ret;

    if (addr >= BUFFER_SIZE)
        return -EINVAL;

    data->reg_addr = addr;

    return count;
}

static DEVICE_ATTR_RW(reg_value);
static DEVICE_ATTR_RW(reg_addr);

static struct attribute *i2c_dummy_attrs[] = {
    &dev_attr_reg_value.attr,
    &dev_attr_reg_addr.attr,
    NULL,
};

static const struct attribute_group i2c_dummy_attr_group = {
    .attrs = i2c_dummy_attrs,
};

/*
 * i2c_dummy_probe - 設備探測
 */
static int i2c_dummy_probe(struct i2c_client *client,
                          const struct i2c_device_id *id)
{
    struct i2c_dummy_data *data;
    int ret;

    dev_info(&client->dev, "Probing I2C dummy device\n");

    /* 分配設備私有數據 */
    data = devm_kzalloc(&client->dev, sizeof(*data), GFP_KERNEL);
    if (!data)
        return -ENOMEM;

    data->client = client;
    data->dev = &client->dev;
    data->reg_addr = 0;
    mutex_init(&data->lock);

    /* 初始化緩衝區 */
    memset(data->buffer, 0, BUFFER_SIZE);

    /* 儲存私有數據 */
    i2c_set_clientdata(client, data);
    dev_set_drvdata(&client->dev, data);

    /* 創建 sysfs 屬性 */
    ret = sysfs_create_group(&client->dev.kobj, &i2c_dummy_attr_group);
    if (ret) {
        dev_err(&client->dev, "Failed to create sysfs group\n");
        return ret;
    }

    dev_info(&client->dev, "I2C dummy device probed successfully\n");
    dev_info(&client->dev, "Address: 0x%02x\n", client->addr);

    return 0;
}

/*
 * i2c_dummy_remove - 設備移除
 */
static void i2c_dummy_remove(struct i2c_client *client)
{
    struct i2c_dummy_data *data = i2c_get_clientdata(client);

    dev_info(&client->dev, "Removing I2C dummy device\n");

    sysfs_remove_group(&client->dev.kobj, &i2c_dummy_attr_group);

    dev_info(&client->dev, "I2C dummy device removed\n");
}

/* I2C 設備 ID 表 */
static const struct i2c_device_id i2c_dummy_id[] = {
    { "i2c_dummy", 0 },
    { }
};
MODULE_DEVICE_TABLE(i2c, i2c_dummy_id);

/* 設備樹匹配表 */
static const struct of_device_id i2c_dummy_of_match[] = {
    { .compatible = "vendor,i2c-dummy" },
    { }
};
MODULE_DEVICE_TABLE(of, i2c_dummy_of_match);

/* I2C 驅動結構 */
static struct i2c_driver i2c_dummy_driver = {
    .driver = {
        .name = DRIVER_NAME,
        .owner = THIS_MODULE,
        .of_match_table = i2c_dummy_of_match,
    },
    .probe = i2c_dummy_probe,
    .remove = i2c_dummy_remove,
    .id_table = i2c_dummy_id,
};

module_i2c_driver(i2c_dummy_driver);
