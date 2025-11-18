/*
 * GPIO Interrupt Debouncing Support
 *
 * 為 GPIO 中斷添加軟體去抖動支援
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/gpio/driver.h>
#include <linux/interrupt.h>
#include <linux/timer.h>
#include <linux/workqueue.h>
#include <linux/slab.h>

#define DEFAULT_DEBOUNCE_MS 50

/* GPIO 去抖動結構 */
struct gpio_debounce {
    struct gpio_chip *chip;
    unsigned int gpio;
    unsigned int irq;

    /* 去抖動參數 */
    unsigned int debounce_ms;
    struct timer_list timer;
    struct work_struct work;

    /* 回調函數 */
    irq_handler_t handler;
    void *dev_id;

    /* 狀態追蹤 */
    int last_value;
    int stable_value;
    unsigned long last_change_jiffies;

    /* 統計資訊 */
    atomic_t bounce_count;
    atomic_t stable_count;

    /* 鏈表 */
    struct list_head list;
};

/* 全局去抖動列表 */
static LIST_HEAD(debounce_list);
static DEFINE_SPINLOCK(debounce_lock);

/* 計時器回調：檢查 GPIO 是否穩定 */
static void gpio_debounce_timer(struct timer_list *t)
{
    struct gpio_debounce *db = from_timer(db, t, timer);
    int current_value;
    unsigned long flags;

    /* 讀取當前 GPIO 值 */
    current_value = gpiod_get_value(gpio_to_desc(db->gpio));

    spin_lock_irqsave(&debounce_lock, flags);

    if (current_value == db->last_value) {
        /* 值已穩定 */
        if (current_value != db->stable_value) {
            db->stable_value = current_value;
            atomic_inc(&db->stable_count);

            /* 排程工作佇列執行回調 */
            schedule_work(&db->work);
        }
    } else {
        /* 值仍在變化，記錄抖動 */
        atomic_inc(&db->bounce_count);
        db->last_value = current_value;

        /* 重新啟動計時器 */
        mod_timer(&db->timer, jiffies + msecs_to_jiffies(db->debounce_ms));
    }

    spin_unlock_irqrestore(&debounce_lock, flags);
}

/* 工作佇列：執行使用者回調 */
static void gpio_debounce_work(struct work_struct *work)
{
    struct gpio_debounce *db = container_of(work, struct gpio_debounce, work);

    /* 呼叫原始中斷處理函數 */
    if (db->handler) {
        db->handler(db->irq, db->dev_id);
    }
}

/* 去抖動中斷處理函數 */
static irqreturn_t gpio_debounce_irq_handler(int irq, void *dev_id)
{
    struct gpio_debounce *db = dev_id;
    int current_value;
    unsigned long flags;

    /* 讀取當前值 */
    current_value = gpiod_get_value(gpio_to_desc(db->gpio));

    spin_lock_irqsave(&debounce_lock, flags);

    db->last_value = current_value;
    db->last_change_jiffies = jiffies;

    /* 啟動或重新啟動去抖動計時器 */
    mod_timer(&db->timer, jiffies + msecs_to_jiffies(db->debounce_ms));

    spin_unlock_irqrestore(&debounce_lock, flags);

    return IRQ_HANDLED;
}

/**
 * gpio_request_debounced_irq - 請求帶去抖動的 GPIO 中斷
 * @gpio: GPIO 編號
 * @handler: 中斷處理函數
 * @flags: 中斷標誌
 * @name: 中斷名稱
 * @dev_id: 設備 ID
 * @debounce_ms: 去抖動時間（毫秒）
 *
 * 返回: 0 表示成功，負數表示錯誤
 */
int gpio_request_debounced_irq(unsigned int gpio,
                               irq_handler_t handler,
                               unsigned long flags,
                               const char *name,
                               void *dev_id,
                               unsigned int debounce_ms)
{
    struct gpio_debounce *db;
    int irq;
    int ret;

    /* 獲取 IRQ 號碼 */
    irq = gpio_to_irq(gpio);
    if (irq < 0) {
        pr_err("Failed to get IRQ for GPIO %d\n", gpio);
        return irq;
    }

    /* 分配去抖動結構 */
    db = kzalloc(sizeof(*db), GFP_KERNEL);
    if (!db)
        return -ENOMEM;

    /* 初始化結構 */
    db->gpio = gpio;
    db->irq = irq;
    db->handler = handler;
    db->dev_id = dev_id;
    db->debounce_ms = debounce_ms ? debounce_ms : DEFAULT_DEBOUNCE_MS;
    db->last_value = -1;
    db->stable_value = -1;
    db->last_change_jiffies = jiffies;
    atomic_set(&db->bounce_count, 0);
    atomic_set(&db->stable_count, 0);

    /* 初始化計時器 */
    timer_setup(&db->timer, gpio_debounce_timer, 0);

    /* 初始化工作佇列 */
    INIT_WORK(&db->work, gpio_debounce_work);

    /* 請求 IRQ */
    ret = request_irq(irq, gpio_debounce_irq_handler, flags, name, db);
    if (ret) {
        pr_err("Failed to request IRQ %d: %d\n", irq, ret);
        kfree(db);
        return ret;
    }

    /* 添加到全局列表 */
    spin_lock(&debounce_lock);
    list_add(&db->list, &debounce_list);
    spin_unlock(&debounce_lock);

    pr_info("GPIO %d: debounced IRQ registered (debounce=%dms)\n",
            gpio, db->debounce_ms);

    return 0;
}
EXPORT_SYMBOL_GPL(gpio_request_debounced_irq);

/**
 * gpio_free_debounced_irq - 釋放帶去抖動的 GPIO 中斷
 * @gpio: GPIO 編號
 * @dev_id: 設備 ID
 */
void gpio_free_debounced_irq(unsigned int gpio, void *dev_id)
{
    struct gpio_debounce *db, *tmp;
    int irq;

    irq = gpio_to_irq(gpio);
    if (irq < 0)
        return;

    spin_lock(&debounce_lock);

    list_for_each_entry_safe(db, tmp, &debounce_list, list) {
        if (db->gpio == gpio && db->dev_id == dev_id) {
            list_del(&db->list);
            spin_unlock(&debounce_lock);

            /* 停止計時器 */
            del_timer_sync(&db->timer);

            /* 取消工作 */
            cancel_work_sync(&db->work);

            /* 釋放 IRQ */
            free_irq(irq, db);

            pr_info("GPIO %d: debounced IRQ freed (bounces=%d, stable=%d)\n",
                    gpio,
                    atomic_read(&db->bounce_count),
                    atomic_read(&db->stable_count));

            kfree(db);
            return;
        }
    }

    spin_unlock(&debounce_lock);
}
EXPORT_SYMBOL_GPL(gpio_free_debounced_irq);

/**
 * gpio_set_debounce_time - 設定去抖動時間
 * @gpio: GPIO 編號
 * @debounce_ms: 去抖動時間（毫秒）
 *
 * 返回: 0 表示成功，負數表示錯誤
 */
int gpio_set_debounce_time(unsigned int gpio, unsigned int debounce_ms)
{
    struct gpio_debounce *db;
    unsigned long flags;

    spin_lock_irqsave(&debounce_lock, flags);

    list_for_each_entry(db, &debounce_list, list) {
        if (db->gpio == gpio) {
            db->debounce_ms = debounce_ms;
            spin_unlock_irqrestore(&debounce_lock, flags);
            pr_debug("GPIO %d: debounce time set to %dms\n",
                    gpio, debounce_ms);
            return 0;
        }
    }

    spin_unlock_irqrestore(&debounce_lock, flags);
    return -ENODEV;
}
EXPORT_SYMBOL_GPL(gpio_set_debounce_time);

/**
 * gpio_get_debounce_stats - 獲取去抖動統計資訊
 * @gpio: GPIO 編號
 * @bounce_count: 輸出抖動計數
 * @stable_count: 輸出穩定計數
 *
 * 返回: 0 表示成功，負數表示錯誤
 */
int gpio_get_debounce_stats(unsigned int gpio,
                           unsigned int *bounce_count,
                           unsigned int *stable_count)
{
    struct gpio_debounce *db;
    unsigned long flags;

    spin_lock_irqsave(&debounce_lock, flags);

    list_for_each_entry(db, &debounce_list, list) {
        if (db->gpio == gpio) {
            if (bounce_count)
                *bounce_count = atomic_read(&db->bounce_count);
            if (stable_count)
                *stable_count = atomic_read(&db->stable_count);
            spin_unlock_irqrestore(&debounce_lock, flags);
            return 0;
        }
    }

    spin_unlock_irqrestore(&debounce_lock, flags);
    return -ENODEV;
}
EXPORT_SYMBOL_GPL(gpio_get_debounce_stats);

/* 模組清理 */
static void __exit gpio_debounce_exit(void)
{
    struct gpio_debounce *db, *tmp;

    spin_lock(&debounce_lock);

    list_for_each_entry_safe(db, tmp, &debounce_list, list) {
        list_del(&db->list);
        del_timer_sync(&db->timer);
        cancel_work_sync(&db->work);
        free_irq(db->irq, db);
        kfree(db);
    }

    spin_unlock(&debounce_lock);

    pr_info("GPIO debounce module unloaded\n");
}

module_exit(gpio_debounce_exit);

MODULE_AUTHOR("AI-Assisted Development Team");
MODULE_DESCRIPTION("GPIO Interrupt Debouncing Support");
MODULE_LICENSE("GPL");
MODULE_VERSION("1.0");
