/*
 * GPIO PWM Support
 *
 * 為 GPIO 控制器添加 PWM 功能支援
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/pwm.h>
#include <linux/gpio/driver.h>
#include <linux/platform_device.h>
#include <linux/of.h>
#include <linux/hrtimer.h>
#include <linux/ktime.h>

#define MAX_PWM_CHANNELS 8
#define PWM_PERIOD_NS_DEFAULT 1000000  /* 1ms = 1kHz */

/* GPIO PWM 通道結構 */
struct gpio_pwm_channel {
    struct hrtimer timer;
    struct gpio_desc *gpio;
    unsigned int gpio_num;
    u64 period_ns;
    u64 duty_ns;
    bool enabled;
    bool polarity;  /* 0 = normal, 1 = inversed */
    ktime_t next_toggle;
};

/* GPIO PWM 控制器結構 */
struct gpio_pwm_chip {
    struct pwm_chip chip;
    struct device *dev;
    struct gpio_chip *gpio_chip;
    struct gpio_pwm_channel channels[MAX_PWM_CHANNELS];
    spinlock_t lock;
};

static inline struct gpio_pwm_chip *to_gpio_pwm_chip(struct pwm_chip *chip)
{
    return container_of(chip, struct gpio_pwm_chip, chip);
}

/* 高解析度計時器回調函數 */
static enum hrtimer_restart gpio_pwm_timer_callback(struct hrtimer *timer)
{
    struct gpio_pwm_channel *chan = container_of(timer,
                                                  struct gpio_pwm_channel,
                                                  timer);
    static bool output_state = false;
    ktime_t now, next_interval;

    if (!chan->enabled)
        return HRTIMER_NORESTART;

    now = ktime_get();

    /* 切換 GPIO 輸出 */
    if (output_state) {
        /* 當前為高電平，切換到低電平 */
        gpiod_set_value(chan->gpio, chan->polarity ? 1 : 0);
        next_interval = ktime_set(0, chan->period_ns - chan->duty_ns);
        output_state = false;
    } else {
        /* 當前為低電平，切換到高電平 */
        gpiod_set_value(chan->gpio, chan->polarity ? 0 : 1);
        next_interval = ktime_set(0, chan->duty_ns);
        output_state = true;
    }

    /* 設定下次觸發時間 */
    hrtimer_forward(&chan->timer, now, next_interval);

    return HRTIMER_RESTART;
}

/* PWM 配置函數 */
static int gpio_pwm_config(struct pwm_chip *chip, struct pwm_device *pwm,
                          int duty_ns, int period_ns)
{
    struct gpio_pwm_chip *pc = to_gpio_pwm_chip(chip);
    struct gpio_pwm_channel *chan = &pc->channels[pwm->hwpwm];
    unsigned long flags;

    if (pwm->hwpwm >= MAX_PWM_CHANNELS)
        return -EINVAL;

    if (period_ns <= 0 || duty_ns < 0 || duty_ns > period_ns)
        return -EINVAL;

    spin_lock_irqsave(&pc->lock, flags);

    chan->period_ns = period_ns;
    chan->duty_ns = duty_ns;

    dev_dbg(pc->dev, "PWM%d: period=%dns, duty=%dns\n",
            pwm->hwpwm, period_ns, duty_ns);

    spin_unlock_irqrestore(&pc->lock, flags);

    return 0;
}

/* PWM 啟用函數 */
static int gpio_pwm_enable(struct pwm_chip *chip, struct pwm_device *pwm)
{
    struct gpio_pwm_chip *pc = to_gpio_pwm_chip(chip);
    struct gpio_pwm_channel *chan = &pc->channels[pwm->hwpwm];
    unsigned long flags;
    ktime_t interval;

    if (pwm->hwpwm >= MAX_PWM_CHANNELS)
        return -EINVAL;

    spin_lock_irqsave(&pc->lock, flags);

    if (!chan->enabled) {
        /* 設定 GPIO 為輸出模式 */
        gpiod_direction_output(chan->gpio, chan->polarity ? 1 : 0);

        /* 啟動高解析度計時器 */
        interval = ktime_set(0, chan->duty_ns);
        hrtimer_start(&chan->timer, interval, HRTIMER_MODE_REL);

        chan->enabled = true;
        dev_info(pc->dev, "PWM%d enabled\n", pwm->hwpwm);
    }

    spin_unlock_irqrestore(&pc->lock, flags);

    return 0;
}

/* PWM 禁用函數 */
static void gpio_pwm_disable(struct pwm_chip *chip, struct pwm_device *pwm)
{
    struct gpio_pwm_chip *pc = to_gpio_pwm_chip(chip);
    struct gpio_pwm_channel *chan = &pc->channels[pwm->hwpwm];
    unsigned long flags;

    if (pwm->hwpwm >= MAX_PWM_CHANNELS)
        return;

    spin_lock_irqsave(&pc->lock, flags);

    if (chan->enabled) {
        /* 停止計時器 */
        hrtimer_cancel(&chan->timer);

        /* 設定 GPIO 為低電平 */
        gpiod_set_value(chan->gpio, chan->polarity ? 1 : 0);

        chan->enabled = false;
        dev_info(pc->dev, "PWM%d disabled\n", pwm->hwpwm);
    }

    spin_unlock_irqrestore(&pc->lock, flags);
}

/* PWM 設定極性 */
static int gpio_pwm_set_polarity(struct pwm_chip *chip, struct pwm_device *pwm,
                                enum pwm_polarity polarity)
{
    struct gpio_pwm_chip *pc = to_gpio_pwm_chip(chip);
    struct gpio_pwm_channel *chan = &pc->channels[pwm->hwpwm];
    unsigned long flags;

    if (pwm->hwpwm >= MAX_PWM_CHANNELS)
        return -EINVAL;

    spin_lock_irqsave(&pc->lock, flags);

    chan->polarity = (polarity == PWM_POLARITY_INVERSED);

    dev_dbg(pc->dev, "PWM%d: polarity=%s\n", pwm->hwpwm,
            chan->polarity ? "inversed" : "normal");

    spin_unlock_irqrestore(&pc->lock, flags);

    return 0;
}

/* PWM 申請函數 */
static int gpio_pwm_request(struct pwm_chip *chip, struct pwm_device *pwm)
{
    struct gpio_pwm_chip *pc = to_gpio_pwm_chip(chip);
    struct gpio_pwm_channel *chan = &pc->channels[pwm->hwpwm];
    char label[32];

    if (pwm->hwpwm >= MAX_PWM_CHANNELS)
        return -EINVAL;

    /* 請求 GPIO */
    snprintf(label, sizeof(label), "pwm%d", pwm->hwpwm);
    chan->gpio = gpiochip_request_own_desc(pc->gpio_chip,
                                           chan->gpio_num,
                                           label,
                                           GPIO_ACTIVE_HIGH,
                                           GPIOD_OUT_LOW);
    if (IS_ERR(chan->gpio)) {
        dev_err(pc->dev, "Failed to request GPIO %d for PWM%d\n",
                chan->gpio_num, pwm->hwpwm);
        return PTR_ERR(chan->gpio);
    }

    dev_info(pc->dev, "PWM%d requested (GPIO %d)\n",
             pwm->hwpwm, chan->gpio_num);

    return 0;
}

/* PWM 釋放函數 */
static void gpio_pwm_free(struct pwm_chip *chip, struct pwm_device *pwm)
{
    struct gpio_pwm_chip *pc = to_gpio_pwm_chip(chip);
    struct gpio_pwm_channel *chan = &pc->channels[pwm->hwpwm];

    if (pwm->hwpwm >= MAX_PWM_CHANNELS)
        return;

    /* 確保 PWM 已停止 */
    if (chan->enabled)
        gpio_pwm_disable(chip, pwm);

    /* 釋放 GPIO */
    if (chan->gpio) {
        gpiochip_free_own_desc(chan->gpio);
        chan->gpio = NULL;
    }

    dev_info(pc->dev, "PWM%d freed\n", pwm->hwpwm);
}

/* PWM chip 操作 */
static const struct pwm_ops gpio_pwm_ops = {
    .request = gpio_pwm_request,
    .free = gpio_pwm_free,
    .config = gpio_pwm_config,
    .enable = gpio_pwm_enable,
    .disable = gpio_pwm_disable,
    .set_polarity = gpio_pwm_set_polarity,
    .owner = THIS_MODULE,
};

/* 初始化 GPIO PWM 通道 */
static void gpio_pwm_init_channel(struct gpio_pwm_channel *chan,
                                 unsigned int gpio_num)
{
    chan->gpio_num = gpio_num;
    chan->period_ns = PWM_PERIOD_NS_DEFAULT;
    chan->duty_ns = 0;
    chan->enabled = false;
    chan->polarity = false;
    chan->gpio = NULL;

    /* 初始化高解析度計時器 */
    hrtimer_init(&chan->timer, CLOCK_MONOTONIC, HRTIMER_MODE_REL);
    chan->timer.function = gpio_pwm_timer_callback;
}

/* 註冊 GPIO PWM chip */
int gpio_pwm_register(struct device *dev, struct gpio_chip *gpio_chip)
{
    struct gpio_pwm_chip *pc;
    int i, ret;

    pc = devm_kzalloc(dev, sizeof(*pc), GFP_KERNEL);
    if (!pc)
        return -ENOMEM;

    pc->dev = dev;
    pc->gpio_chip = gpio_chip;
    spin_lock_init(&pc->lock);

    /* 設定 PWM chip */
    pc->chip.dev = dev;
    pc->chip.ops = &gpio_pwm_ops;
    pc->chip.base = -1;  /* 動態分配 */
    pc->chip.npwm = MAX_PWM_CHANNELS;

    /* 初始化所有通道 */
    for (i = 0; i < MAX_PWM_CHANNELS; i++) {
        gpio_pwm_init_channel(&pc->channels[i], i);
    }

    /* 註冊 PWM chip */
    ret = pwmchip_add(&pc->chip);
    if (ret) {
        dev_err(dev, "Failed to register PWM chip: %d\n", ret);
        return ret;
    }

    dev_info(dev, "GPIO PWM registered: %d channels\n", MAX_PWM_CHANNELS);

    return 0;
}
EXPORT_SYMBOL_GPL(gpio_pwm_register);

/* 註銷 GPIO PWM chip */
void gpio_pwm_unregister(struct pwm_chip *chip)
{
    struct gpio_pwm_chip *pc = to_gpio_pwm_chip(chip);
    int i;

    /* 停止所有通道 */
    for (i = 0; i < MAX_PWM_CHANNELS; i++) {
        struct gpio_pwm_channel *chan = &pc->channels[i];
        if (chan->enabled) {
            hrtimer_cancel(&chan->timer);
        }
    }

    pwmchip_remove(chip);
    dev_info(pc->dev, "GPIO PWM unregistered\n");
}
EXPORT_SYMBOL_GPL(gpio_pwm_unregister);

MODULE_AUTHOR("AI-Assisted Development Team");
MODULE_DESCRIPTION("GPIO PWM Support");
MODULE_LICENSE("GPL");
