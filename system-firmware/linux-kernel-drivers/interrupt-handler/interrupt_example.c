/*
 * interrupt_example.c - 中斷處理範例
 *
 * 這是一個中斷處理驅動範例，展示了：
 * - 中斷請求和釋放
 * - 頂半部和底半部處理
 * - Tasklet 使用
 * - Workqueue 使用
 * - 中斷統計
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/interrupt.h>
#include <linux/platform_device.h>
#include <linux/slab.h>
#include <linux/ktime.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("AI-Assisted Developer");
MODULE_DESCRIPTION("Interrupt Handler Example Driver");
MODULE_VERSION("1.0");

#define DRIVER_NAME "irq_example"

/* 模擬使用的 IRQ 號（注意：實際使用時需要真實的 IRQ）*/
static int irq_number = -1;
module_param(irq_number, int, 0644);
MODULE_PARM_DESC(irq_number, "IRQ number to use (default: none)");

/* 設備私有數據 */
struct irq_example_data {
    struct platform_device *pdev;
    int irq;
    unsigned long irq_count;
    ktime_t last_irq_time;
    struct tasklet_struct tasklet;
    struct work_struct work;
    spinlock_t lock;
};

static struct irq_example_data *irq_data;

/*
 * tasklet_handler - Tasklet 處理函數（底半部）
 */
static void tasklet_handler(unsigned long data)
{
    struct irq_example_data *dev_data = (struct irq_example_data *)data;

    pr_info("%s: Tasklet executed (count: %lu)\n",
            DRIVER_NAME, dev_data->irq_count);

    /* 在這裡執行不能在中斷上下文中執行的耗時操作 */
}

/*
 * work_handler - Work queue 處理函數
 */
static void work_handler(struct work_struct *work)
{
    struct irq_example_data *dev_data =
        container_of(work, struct irq_example_data, work);

    pr_info("%s: Work queue executed (count: %lu)\n",
            DRIVER_NAME, dev_data->irq_count);

    /* 在這裡可以執行可睡眠的操作 */
    /* 例如：msleep(100); */
}

/*
 * irq_handler - 中斷處理函數（頂半部）
 */
static irqreturn_t irq_handler(int irq, void *dev_id)
{
    struct irq_example_data *dev_data = dev_id;
    unsigned long flags;
    ktime_t current_time;
    s64 delta_us;

    spin_lock_irqsave(&dev_data->lock, flags);

    /* 記錄中斷次數 */
    dev_data->irq_count++;

    /* 計算距離上次中斷的時間 */
    current_time = ktime_get();
    delta_us = ktime_us_delta(current_time, dev_data->last_irq_time);
    dev_data->last_irq_time = current_time;

    pr_info("%s: Interrupt %d occurred (count: %lu, delta: %lld us)\n",
            DRIVER_NAME, irq, dev_data->irq_count, delta_us);

    spin_unlock_irqrestore(&dev_data->lock, flags);

    /* 調度 tasklet */
    tasklet_schedule(&dev_data->tasklet);

    /* 或調度工作佇列 */
    /* schedule_work(&dev_data->work); */

    return IRQ_HANDLED;
}

/*
 * irq_threaded_handler - 線程化中斷處理函數
 */
static irqreturn_t irq_threaded_handler(int irq, void *dev_id)
{
    struct irq_example_data *dev_data = dev_id;

    pr_info("%s: Threaded interrupt handler (count: %lu)\n",
            DRIVER_NAME, dev_data->irq_count);

    /* 在這裡可以執行較耗時的操作，因為運行在內核線程中 */

    return IRQ_HANDLED;
}

/* sysfs 屬性：中斷計數 */
static ssize_t irq_count_show(struct device *dev,
                              struct device_attribute *attr, char *buf)
{
    struct irq_example_data *data = dev_get_drvdata(dev);
    unsigned long count;
    unsigned long flags;

    spin_lock_irqsave(&data->lock, flags);
    count = data->irq_count;
    spin_unlock_irqrestore(&data->lock, flags);

    return sprintf(buf, "%lu\n", count);
}

static DEVICE_ATTR_RO(irq_count);

static struct attribute *irq_example_attrs[] = {
    &dev_attr_irq_count.attr,
    NULL,
};

static const struct attribute_group irq_example_attr_group = {
    .attrs = irq_example_attrs,
};

/*
 * irq_example_probe - 設備探測
 */
static int irq_example_probe(struct platform_device *pdev)
{
    int ret;

    dev_info(&pdev->dev, "Probing interrupt example device\n");

    /* 分配設備私有數據 */
    irq_data = devm_kzalloc(&pdev->dev, sizeof(*irq_data), GFP_KERNEL);
    if (!irq_data)
        return -ENOMEM;

    irq_data->pdev = pdev;
    irq_data->irq_count = 0;
    irq_data->last_irq_time = ktime_get();
    spin_lock_init(&irq_data->lock);

    /* 初始化 tasklet */
    tasklet_init(&irq_data->tasklet, tasklet_handler,
                (unsigned long)irq_data);

    /* 初始化 work queue */
    INIT_WORK(&irq_data->work, work_handler);

    platform_set_drvdata(pdev, irq_data);
    dev_set_drvdata(&pdev->dev, irq_data);

    /* 創建 sysfs 屬性 */
    ret = sysfs_create_group(&pdev->dev.kobj, &irq_example_attr_group);
    if (ret) {
        dev_err(&pdev->dev, "Failed to create sysfs group\n");
        goto err_tasklet;
    }

    /* 請求中斷（如果提供了 IRQ 號）*/
    if (irq_number >= 0) {
        irq_data->irq = irq_number;

        /* 方法 1: 標準中斷處理 */
        ret = request_irq(irq_data->irq, irq_handler,
                         IRQF_SHARED, DRIVER_NAME, irq_data);

        /* 方法 2: 線程化中斷處理（可選）
        ret = request_threaded_irq(irq_data->irq, irq_handler,
                                   irq_threaded_handler,
                                   IRQF_SHARED, DRIVER_NAME, irq_data);
        */

        if (ret) {
            dev_err(&pdev->dev, "Failed to request IRQ %d: %d\n",
                   irq_data->irq, ret);
            goto err_sysfs;
        }

        dev_info(&pdev->dev, "Registered IRQ %d handler\n", irq_data->irq);
    } else {
        dev_info(&pdev->dev, "No IRQ specified, driver loaded in demo mode\n");
    }

    dev_info(&pdev->dev, "Interrupt example device probed successfully\n");

    return 0;

err_sysfs:
    sysfs_remove_group(&pdev->dev.kobj, &irq_example_attr_group);
err_tasklet:
    tasklet_kill(&irq_data->tasklet);
    return ret;
}

/*
 * irq_example_remove - 設備移除
 */
static int irq_example_remove(struct platform_device *pdev)
{
    struct irq_example_data *data = platform_get_drvdata(pdev);

    dev_info(&pdev->dev, "Removing interrupt example device\n");

    /* 釋放中斷 */
    if (data->irq >= 0) {
        free_irq(data->irq, data);
        dev_info(&pdev->dev, "Freed IRQ %d\n", data->irq);
    }

    /* 移除 sysfs */
    sysfs_remove_group(&pdev->dev.kobj, &irq_example_attr_group);

    /* 清理 tasklet 和 work queue */
    tasklet_kill(&data->tasklet);
    cancel_work_sync(&data->work);

    dev_info(&pdev->dev, "Interrupt example device removed (total IRQs: %lu)\n",
             data->irq_count);

    return 0;
}

/* 平台驅動結構 */
static struct platform_driver irq_example_driver = {
    .driver = {
        .name = DRIVER_NAME,
        .owner = THIS_MODULE,
    },
    .probe = irq_example_probe,
    .remove = irq_example_remove,
};

/* 平台設備（用於示例）*/
static struct platform_device *irq_example_pdev;

/*
 * irq_example_init - 模組初始化
 */
static int __init irq_example_init(void)
{
    int ret;

    pr_info("%s: Initializing interrupt example driver\n", DRIVER_NAME);

    /* 註冊平台驅動 */
    ret = platform_driver_register(&irq_example_driver);
    if (ret) {
        pr_err("%s: Failed to register platform driver\n", DRIVER_NAME);
        return ret;
    }

    /* 創建平台設備（僅用於示例）*/
    irq_example_pdev = platform_device_register_simple(DRIVER_NAME, -1,
                                                       NULL, 0);
    if (IS_ERR(irq_example_pdev)) {
        pr_err("%s: Failed to register platform device\n", DRIVER_NAME);
        platform_driver_unregister(&irq_example_driver);
        return PTR_ERR(irq_example_pdev);
    }

    pr_info("%s: Interrupt example driver initialized\n", DRIVER_NAME);

    return 0;
}

/*
 * irq_example_exit - 模組卸載
 */
static void __exit irq_example_exit(void)
{
    pr_info("%s: Unloading interrupt example driver\n", DRIVER_NAME);

    platform_device_unregister(irq_example_pdev);
    platform_driver_unregister(&irq_example_driver);

    pr_info("%s: Interrupt example driver unloaded\n", DRIVER_NAME);
}

module_init(irq_example_init);
module_exit(irq_example_exit);
