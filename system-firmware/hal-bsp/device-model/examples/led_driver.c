/**
 * @file led_driver.c
 * @brief LED 設備驅動範例
 *
 * 使用統一設備模型實作 LED 驅動
 */

#include "device_model.h"
#include "gpio_hal.h"
#include <string.h>

/* LED 私有數據 */
typedef struct {
    void *port;
    uint16_t pin;
    bool state;
} led_private_t;

/* LED ioctl 命令 */
#define LED_IOCTL_ON        0x01
#define LED_IOCTL_OFF       0x02
#define LED_IOCTL_TOGGLE    0x03
#define LED_IOCTL_GET_STATE 0x04

/* LED 設備操作 */
static int led_open(device_t *dev)
{
    led_private_t *priv = (led_private_t *)dev->private_data;

    /* 配置 GPIO */
    gpio_config_t config = {
        .port = priv->port,
        .pin = priv->pin,
        .mode = GPIO_MODE_OUTPUT_PP,
        .pull = GPIO_PULL_NONE,
        .speed = GPIO_SPEED_LOW
    };

    return gpio_init(&config);
}

static int led_close(device_t *dev)
{
    return 0;
}

static int led_write(device_t *dev, const void *buffer, size_t size)
{
    led_private_t *priv = (led_private_t *)dev->private_data;
    const uint8_t *data = (const uint8_t *)buffer;

    if (size > 0) {
        if (data[0]) {
            gpio_set(priv->port, priv->pin);
            priv->state = true;
        } else {
            gpio_reset(priv->port, priv->pin);
            priv->state = false;
        }
    }

    return size;
}

static int led_ioctl(device_t *dev, uint32_t cmd, void *arg)
{
    led_private_t *priv = (led_private_t *)dev->private_data;

    switch (cmd) {
        case LED_IOCTL_ON:
            gpio_set(priv->port, priv->pin);
            priv->state = true;
            break;

        case LED_IOCTL_OFF:
            gpio_reset(priv->port, priv->pin);
            priv->state = false;
            break;

        case LED_IOCTL_TOGGLE:
            gpio_toggle(priv->port, priv->pin);
            priv->state = !priv->state;
            break;

        case LED_IOCTL_GET_STATE:
            *(bool *)arg = priv->state;
            break;

        default:
            return -1;
    }

    return 0;
}

/* 設備操作表 */
static const device_ops_t led_ops = {
    .open = led_open,
    .close = led_close,
    .read = NULL,
    .write = led_write,
    .ioctl = led_ioctl
};

/* LED 私有數據實例 */
static led_private_t led0_priv = {
    .port = (void *)0x40020000,  // GPIOA
    .pin = (1 << 5),
    .state = false
};

/* LED 設備實例 */
static device_t led0_device = {
    .name = "led0",
    .type = DEVICE_TYPE_CHAR,
    .private_data = &led0_priv,
    .ops = &led_ops
};

/* 使用範例 */
int main(void)
{
    /* 註冊 LED 設備 */
    device_register(&led0_device);

    /* 打開設備 */
    device_t *led = device_find("led0");
    device_open(led);

    /* 使用 write 控制 */
    uint8_t on = 1;
    device_write(led, &on, 1);

    /* 使用 ioctl 控制 */
    device_ioctl(led, LED_IOCTL_TOGGLE, NULL);

    /* 獲取狀態 */
    bool state;
    device_ioctl(led, LED_IOCTL_GET_STATE, &state);

    /* 關閉設備 */
    device_close(led);

    return 0;
}
