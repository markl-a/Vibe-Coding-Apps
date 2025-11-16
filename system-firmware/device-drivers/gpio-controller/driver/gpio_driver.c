/*
 * GPIO Controller Driver
 *
 * 通用 GPIO 控制器驅動程式
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/platform_device.h>
#include <linux/gpio/driver.h>
#include <linux/of.h>
#include <linux/of_device.h>
#include <linux/interrupt.h>
#include <linux/irq.h>
#include <linux/spinlock.h>

#define DRIVER_NAME "gpio-controller"
#define MAX_GPIO 32

/* GPIO 控制器私有數據 */
struct custom_gpio_controller {
    struct gpio_chip chip;
    struct device *dev;
    void __iomem *base;
    spinlock_t lock;
    int irq;

    /* 暫存器偏移 */
    unsigned int reg_dir;    /* 方向暫存器 */
    unsigned int reg_out;    /* 輸出暫存器 */
    unsigned int reg_in;     /* 輸入暫存器 */
    unsigned int reg_irq_en; /* 中斷使能 */
    unsigned int reg_irq_st; /* 中斷狀態 */

    /* GPIO 狀態 */
    unsigned long direction;  /* 0=輸入, 1=輸出 */
    unsigned long output_val;

    /* 中斷相關 */
    unsigned int irq_enabled;
    unsigned int irq_type[MAX_GPIO];
};

/* 暫存器讀寫輔助函數 */
static inline u32 gpio_readl(struct custom_gpio_controller *ctrl, unsigned int offset)
{
    return readl(ctrl->base + offset);
}

static inline void gpio_writel(struct custom_gpio_controller *ctrl,
                              unsigned int offset, u32 value)
{
    writel(value, ctrl->base + offset);
}

/* GPIO 請求函數 */
static int custom_gpio_request(struct gpio_chip *chip, unsigned offset)
{
    struct custom_gpio_controller *ctrl = gpiochip_get_data(chip);

    dev_dbg(ctrl->dev, "Request GPIO %u\n", offset);

    if (offset >= chip->ngpio)
        return -EINVAL;

    return 0;
}

/* GPIO 釋放函數 */
static void custom_gpio_free(struct gpio_chip *chip, unsigned offset)
{
    struct custom_gpio_controller *ctrl = gpiochip_get_data(chip);

    dev_dbg(ctrl->dev, "Free GPIO %u\n", offset);
}

/* 獲取 GPIO 方向 */
static int custom_gpio_get_direction(struct gpio_chip *chip, unsigned offset)
{
    struct custom_gpio_controller *ctrl = gpiochip_get_data(chip);
    unsigned long flags;
    int direction;

    spin_lock_irqsave(&ctrl->lock, flags);
    direction = test_bit(offset, &ctrl->direction);
    spin_unlock_irqrestore(&ctrl->lock, flags);

    /* 0 = 輸出, 1 = 輸入 */
    return direction ? GPIO_LINE_DIRECTION_OUT : GPIO_LINE_DIRECTION_IN;
}

/* 設定 GPIO 為輸入 */
static int custom_gpio_direction_input(struct gpio_chip *chip, unsigned offset)
{
    struct custom_gpio_controller *ctrl = gpiochip_get_data(chip);
    unsigned long flags;
    u32 reg;

    dev_dbg(ctrl->dev, "Set GPIO %u as input\n", offset);

    spin_lock_irqsave(&ctrl->lock, flags);

    /* 更新方向位元圖 */
    clear_bit(offset, &ctrl->direction);

    /* 寫入暫存器 */
    reg = gpio_readl(ctrl, ctrl->reg_dir);
    reg &= ~BIT(offset);  /* 0 = 輸入 */
    gpio_writel(ctrl, ctrl->reg_dir, reg);

    spin_unlock_irqrestore(&ctrl->lock, flags);

    return 0;
}

/* 設定 GPIO 為輸出 */
static int custom_gpio_direction_output(struct gpio_chip *chip,
                                       unsigned offset, int value)
{
    struct custom_gpio_controller *ctrl = gpiochip_get_data(chip);
    unsigned long flags;
    u32 reg;

    dev_dbg(ctrl->dev, "Set GPIO %u as output, value=%d\n", offset, value);

    spin_lock_irqsave(&ctrl->lock, flags);

    /* 先設定輸出值 */
    if (value)
        set_bit(offset, &ctrl->output_val);
    else
        clear_bit(offset, &ctrl->output_val);

    reg = gpio_readl(ctrl, ctrl->reg_out);
    if (value)
        reg |= BIT(offset);
    else
        reg &= ~BIT(offset);
    gpio_writel(ctrl, ctrl->reg_out, reg);

    /* 再設定方向 */
    set_bit(offset, &ctrl->direction);

    reg = gpio_readl(ctrl, ctrl->reg_dir);
    reg |= BIT(offset);  /* 1 = 輸出 */
    gpio_writel(ctrl, ctrl->reg_dir, reg);

    spin_unlock_irqrestore(&ctrl->lock, flags);

    return 0;
}

/* 獲取 GPIO 值 */
static int custom_gpio_get(struct gpio_chip *chip, unsigned offset)
{
    struct custom_gpio_controller *ctrl = gpiochip_get_data(chip);
    unsigned long flags;
    u32 reg;
    int value;

    spin_lock_irqsave(&ctrl->lock, flags);

    reg = gpio_readl(ctrl, ctrl->reg_in);
    value = !!(reg & BIT(offset));

    spin_unlock_irqrestore(&ctrl->lock, flags);

    dev_dbg(ctrl->dev, "Get GPIO %u value: %d\n", offset, value);

    return value;
}

/* 設定 GPIO 值 */
static void custom_gpio_set(struct gpio_chip *chip, unsigned offset, int value)
{
    struct custom_gpio_controller *ctrl = gpiochip_get_data(chip);
    unsigned long flags;
    u32 reg;

    dev_dbg(ctrl->dev, "Set GPIO %u value: %d\n", offset, value);

    spin_lock_irqsave(&ctrl->lock, flags);

    if (value)
        set_bit(offset, &ctrl->output_val);
    else
        clear_bit(offset, &ctrl->output_val);

    reg = gpio_readl(ctrl, ctrl->reg_out);
    if (value)
        reg |= BIT(offset);
    else
        reg &= ~BIT(offset);
    gpio_writel(ctrl, ctrl->reg_out, reg);

    spin_unlock_irqrestore(&ctrl->lock, flags);
}

/* 批量設定 GPIO */
static void custom_gpio_set_multiple(struct gpio_chip *chip,
                                    unsigned long *mask,
                                    unsigned long *bits)
{
    struct custom_gpio_controller *ctrl = gpiochip_get_data(chip);
    unsigned long flags;
    u32 reg;

    spin_lock_irqsave(&ctrl->lock, flags);

    reg = gpio_readl(ctrl, ctrl->reg_out);
    reg = (reg & ~(*mask)) | (*bits & *mask);
    gpio_writel(ctrl, ctrl->reg_out, reg);

    spin_unlock_irqrestore(&ctrl->lock, flags);
}

/* GPIO 轉 IRQ */
static int custom_gpio_to_irq(struct gpio_chip *chip, unsigned offset)
{
    struct custom_gpio_controller *ctrl = gpiochip_get_data(chip);

    if (offset >= chip->ngpio)
        return -ENXIO;

    /* 返回 IRQ 域映射的 IRQ 號碼 */
    return irq_create_mapping(chip->irq.domain, offset);
}

/* GPIO chip 操作結構 */
static const struct gpio_chip custom_gpio_chip = {
    .label = DRIVER_NAME,
    .owner = THIS_MODULE,
    .request = custom_gpio_request,
    .free = custom_gpio_free,
    .get_direction = custom_gpio_get_direction,
    .direction_input = custom_gpio_direction_input,
    .direction_output = custom_gpio_direction_output,
    .get = custom_gpio_get,
    .set = custom_gpio_set,
    .set_multiple = custom_gpio_set_multiple,
    .to_irq = custom_gpio_to_irq,
    .base = -1,  /* 動態分配基礎編號 */
    .ngpio = MAX_GPIO,
    .can_sleep = false,
};

/* 中斷處理函數 */
static irqreturn_t custom_gpio_irq_handler(int irq, void *dev_id)
{
    struct custom_gpio_controller *ctrl = dev_id;
    u32 status;
    int i;

    status = gpio_readl(ctrl, ctrl->reg_irq_st);
    if (!status)
        return IRQ_NONE;

    /* 處理每個觸發的 GPIO 中斷 */
    for (i = 0; i < MAX_GPIO; i++) {
        if (status & BIT(i)) {
            unsigned int child_irq;

            child_irq = irq_find_mapping(ctrl->chip.irq.domain, i);
            if (child_irq)
                generic_handle_irq(child_irq);

            dev_dbg(ctrl->dev, "GPIO %d interrupt\n", i);
        }
    }

    /* 清除中斷狀態 */
    gpio_writel(ctrl, ctrl->reg_irq_st, status);

    return IRQ_HANDLED;
}

/* IRQ chip 操作 */
static void custom_gpio_irq_mask(struct irq_data *d)
{
    struct gpio_chip *chip = irq_data_get_irq_chip_data(d);
    struct custom_gpio_controller *ctrl = gpiochip_get_data(chip);
    unsigned long flags;
    u32 reg;

    spin_lock_irqsave(&ctrl->lock, flags);

    reg = gpio_readl(ctrl, ctrl->reg_irq_en);
    reg &= ~BIT(d->hwirq);
    gpio_writel(ctrl, ctrl->reg_irq_en, reg);

    spin_unlock_irqrestore(&ctrl->lock, flags);
}

static void custom_gpio_irq_unmask(struct irq_data *d)
{
    struct gpio_chip *chip = irq_data_get_irq_chip_data(d);
    struct custom_gpio_controller *ctrl = gpiochip_get_data(chip);
    unsigned long flags;
    u32 reg;

    spin_lock_irqsave(&ctrl->lock, flags);

    reg = gpio_readl(ctrl, ctrl->reg_irq_en);
    reg |= BIT(d->hwirq);
    gpio_writel(ctrl, ctrl->reg_irq_en, reg);

    spin_unlock_irqrestore(&ctrl->lock, flags);
}

static int custom_gpio_irq_set_type(struct irq_data *d, unsigned int type)
{
    struct gpio_chip *chip = irq_data_get_irq_chip_data(d);
    struct custom_gpio_controller *ctrl = gpiochip_get_data(chip);

    /* 儲存中斷類型 */
    ctrl->irq_type[d->hwirq] = type;

    /* 根據類型配置硬體暫存器 */
    switch (type) {
    case IRQ_TYPE_EDGE_RISING:
    case IRQ_TYPE_EDGE_FALLING:
    case IRQ_TYPE_EDGE_BOTH:
    case IRQ_TYPE_LEVEL_HIGH:
    case IRQ_TYPE_LEVEL_LOW:
        /* 配置相應的暫存器 */
        break;
    default:
        return -EINVAL;
    }

    return 0;
}

static struct irq_chip custom_gpio_irq_chip = {
    .name = DRIVER_NAME,
    .irq_mask = custom_gpio_irq_mask,
    .irq_unmask = custom_gpio_irq_unmask,
    .irq_set_type = custom_gpio_irq_set_type,
};

/* 平台設備探測 */
static int custom_gpio_probe(struct platform_device *pdev)
{
    struct custom_gpio_controller *ctrl;
    struct resource *res;
    int ret;

    dev_info(&pdev->dev, "Probing GPIO controller\n");

    /* 分配私有數據 */
    ctrl = devm_kzalloc(&pdev->dev, sizeof(*ctrl), GFP_KERNEL);
    if (!ctrl)
        return -ENOMEM;

    ctrl->dev = &pdev->dev;
    spin_lock_init(&ctrl->lock);

    /* 獲取記憶體資源 */
    res = platform_get_resource(pdev, IORESOURCE_MEM, 0);
    ctrl->base = devm_ioremap_resource(&pdev->dev, res);
    if (IS_ERR(ctrl->base))
        return PTR_ERR(ctrl->base);

    /* 設定暫存器偏移 (根據實際硬體調整) */
    ctrl->reg_dir = 0x00;
    ctrl->reg_out = 0x04;
    ctrl->reg_in = 0x08;
    ctrl->reg_irq_en = 0x0C;
    ctrl->reg_irq_st = 0x10;

    /* 複製 GPIO chip 模板 */
    ctrl->chip = custom_gpio_chip;
    ctrl->chip.parent = &pdev->dev;
    ctrl->chip.of_node = pdev->dev.of_node;

    /* 註冊 GPIO chip */
    ret = devm_gpiochip_add_data(&pdev->dev, &ctrl->chip, ctrl);
    if (ret) {
        dev_err(&pdev->dev, "Failed to register GPIO chip: %d\n", ret);
        return ret;
    }

    /* 獲取中斷號 */
    ctrl->irq = platform_get_irq(pdev, 0);
    if (ctrl->irq > 0) {
        struct gpio_irq_chip *girq;

        /* 設定 IRQ chip */
        girq = &ctrl->chip.irq;
        girq->chip = &custom_gpio_irq_chip;
        girq->parent_handler = NULL;
        girq->num_parents = 0;
        girq->parents = NULL;
        girq->default_type = IRQ_TYPE_NONE;
        girq->handler = handle_simple_irq;

        /* 請求中斷 */
        ret = devm_request_irq(&pdev->dev, ctrl->irq,
                              custom_gpio_irq_handler,
                              IRQF_SHARED, DRIVER_NAME, ctrl);
        if (ret) {
            dev_err(&pdev->dev, "Failed to request IRQ: %d\n", ret);
            /* 中斷失敗不影響 GPIO 基本功能 */
        } else {
            dev_info(&pdev->dev, "IRQ %d registered\n", ctrl->irq);
        }
    }

    platform_set_drvdata(pdev, ctrl);

    dev_info(&pdev->dev, "GPIO controller registered: %d GPIOs\n",
            ctrl->chip.ngpio);

    return 0;
}

/* 平台設備移除 */
static int custom_gpio_remove(struct platform_device *pdev)
{
    dev_info(&pdev->dev, "Removing GPIO controller\n");
    return 0;
}

/* 設備樹匹配表 */
static const struct of_device_id custom_gpio_of_match[] = {
    { .compatible = "custom,gpio-controller", },
    { /* sentinel */ }
};
MODULE_DEVICE_TABLE(of, custom_gpio_of_match);

/* 平台驅動結構 */
static struct platform_driver custom_gpio_driver = {
    .probe = custom_gpio_probe,
    .remove = custom_gpio_remove,
    .driver = {
        .name = DRIVER_NAME,
        .of_match_table = custom_gpio_of_match,
    },
};

module_platform_driver(custom_gpio_driver);

MODULE_AUTHOR("AI-Assisted Development Team");
MODULE_DESCRIPTION("Custom GPIO Controller Driver");
MODULE_LICENSE("GPL");
MODULE_VERSION("1.0");
