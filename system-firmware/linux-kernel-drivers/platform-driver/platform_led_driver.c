/*
 * platform_led_driver.c - 平台設備驅動範例（LED 控制）
 *
 * 這是一個平台設備驅動範例，展示了：
 * - 平台設備驅動註冊
 * - 設備樹綁定
 * - GPIO 控制
 * - sysfs 接口
 * - 資源管理
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/platform_device.h>
#include <linux/of.h>
#include <linux/of_device.h>
#include <linux/gpio/consumer.h>
#include <linux/slab.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("AI-Assisted Developer");
MODULE_DESCRIPTION("Platform LED Device Driver");
MODULE_VERSION("1.0");

#define DRIVER_NAME "platform_led"

/* 設備私有數據 */
struct platform_led_data {
    struct platform_device *pdev;
    struct gpio_desc *gpio;
    bool led_on;
    int gpio_num;
};

/* sysfs 屬性：LED 狀態 */
static ssize_t led_state_show(struct device *dev,
                              struct device_attribute *attr, char *buf)
{
    struct platform_led_data *data = dev_get_drvdata(dev);
    return sprintf(buf, "%s\n", data->led_on ? "on" : "off");
}

static ssize_t led_state_store(struct device *dev,
                               struct device_attribute *attr,
                               const char *buf, size_t count)
{
    struct platform_led_data *data = dev_get_drvdata(dev);
    bool state;

    if (sysfs_streq(buf, "on") || sysfs_streq(buf, "1"))
        state = true;
    else if (sysfs_streq(buf, "off") || sysfs_streq(buf, "0"))
        state = false;
    else
        return -EINVAL;

    data->led_on = state;

    /* 在真實硬體上，這裡會控制 GPIO */
    /* gpiod_set_value(data->gpio, state); */

    dev_info(dev, "LED turned %s\n", state ? "on" : "off");

    return count;
}

static DEVICE_ATTR_RW(led_state);

static struct attribute *platform_led_attrs[] = {
    &dev_attr_led_state.attr,
    NULL,
};

static const struct attribute_group platform_led_attr_group = {
    .attrs = platform_led_attrs,
};

/*
 * platform_led_probe - 設備探測
 */
static int platform_led_probe(struct platform_device *pdev)
{
    struct platform_led_data *data;
    struct resource *res;
    int ret;

    dev_info(&pdev->dev, "Probing platform LED device\n");

    /* 分配設備私有數據 */
    data = devm_kzalloc(&pdev->dev, sizeof(*data), GFP_KERNEL);
    if (!data)
        return -ENOMEM;

    data->pdev = pdev;
    data->led_on = false;

    /* 獲取資源（示例）*/
    res = platform_get_resource(pdev, IORESOURCE_MEM, 0);
    if (res) {
        dev_info(&pdev->dev, "Memory resource: 0x%llx - 0x%llx\n",
                 (unsigned long long)res->start,
                 (unsigned long long)res->end);
    }

    /* 從設備樹獲取 GPIO（如果有）*/
    data->gpio = devm_gpiod_get_optional(&pdev->dev, "led", GPIOD_OUT_LOW);
    if (IS_ERR(data->gpio)) {
        dev_warn(&pdev->dev, "Failed to get GPIO, using virtual LED\n");
        data->gpio = NULL;
    } else if (data->gpio) {
        data->gpio_num = desc_to_gpio(data->gpio);
        dev_info(&pdev->dev, "Using GPIO %d for LED\n", data->gpio_num);
    }

    /* 儲存私有數據 */
    platform_set_drvdata(pdev, data);
    dev_set_drvdata(&pdev->dev, data);

    /* 創建 sysfs 屬性 */
    ret = sysfs_create_group(&pdev->dev.kobj, &platform_led_attr_group);
    if (ret) {
        dev_err(&pdev->dev, "Failed to create sysfs group\n");
        return ret;
    }

    dev_info(&pdev->dev, "Platform LED device probed successfully\n");

    return 0;
}

/*
 * platform_led_remove - 設備移除
 */
static int platform_led_remove(struct platform_device *pdev)
{
    struct platform_led_data *data = platform_get_drvdata(pdev);

    dev_info(&pdev->dev, "Removing platform LED device\n");

    sysfs_remove_group(&pdev->dev.kobj, &platform_led_attr_group);

    /* 關閉 LED */
    if (data->gpio)
        gpiod_set_value(data->gpio, 0);

    dev_info(&pdev->dev, "Platform LED device removed\n");

    return 0;
}

/* 設備樹匹配表 */
static const struct of_device_id platform_led_of_match[] = {
    { .compatible = "vendor,platform-led" },
    { }
};
MODULE_DEVICE_TABLE(of, platform_led_of_match);

/* 平台設備 ID 表 */
static const struct platform_device_id platform_led_ids[] = {
    { "platform_led", 0 },
    { }
};
MODULE_DEVICE_TABLE(platform, platform_led_ids);

/* 平台驅動結構 */
static struct platform_driver platform_led_driver = {
    .driver = {
        .name = DRIVER_NAME,
        .owner = THIS_MODULE,
        .of_match_table = platform_led_of_match,
    },
    .probe = platform_led_probe,
    .remove = platform_led_remove,
    .id_table = platform_led_ids,
};

/*
 * platform_led_init - 模組初始化
 */
static int __init platform_led_init(void)
{
    int ret;

    pr_info("%s: Initializing platform LED driver\n", DRIVER_NAME);

    /* 註冊平台驅動 */
    ret = platform_driver_register(&platform_led_driver);
    if (ret) {
        pr_err("%s: Failed to register platform driver\n", DRIVER_NAME);
        return ret;
    }

    pr_info("%s: Platform LED driver registered\n", DRIVER_NAME);

    return 0;
}

/*
 * platform_led_exit - 模組卸載
 */
static void __exit platform_led_exit(void)
{
    pr_info("%s: Unloading platform LED driver\n", DRIVER_NAME);

    platform_driver_unregister(&platform_led_driver);

    pr_info("%s: Platform LED driver unloaded\n", DRIVER_NAME);
}

module_init(platform_led_init);
module_exit(platform_led_exit);
