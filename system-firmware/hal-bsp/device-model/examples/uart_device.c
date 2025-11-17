/**
 * @file uart_device.c
 * @brief UART 設備模型範例
 *
 * 此範例示範如何使用統一設備模型封裝 UART
 */

#include "device_model.h"
#include "uart_hal.h"
#include <string.h>

/* UART 設備私有數據 */
typedef struct {
    uart_handle_t uart;
    uint8_t uart_num;
    uint32_t baudrate;
} uart_device_private_t;

/* UART 設備操作 */
static int uart_dev_open(device_t *dev)
{
    uart_device_private_t *priv = (uart_device_private_t *)dev->private_data;

    uart_config_t config = {
        .baudrate = priv->baudrate,
        .word_length = 8,
        .stop_bits = 1,
        .parity = UART_PARITY_NONE,
        .flow_control = UART_FLOW_CTRL_NONE
    };

    priv->uart = uart_init(priv->uart_num, &config);
    return (priv->uart != NULL) ? 0 : -1;
}

static int uart_dev_close(device_t *dev)
{
    uart_device_private_t *priv = (uart_device_private_t *)dev->private_data;
    return uart_deinit(priv->uart);
}

static int uart_dev_read(device_t *dev, void *buffer, size_t size)
{
    uart_device_private_t *priv = (uart_device_private_t *)dev->private_data;
    return uart_receive(priv->uart, (uint8_t *)buffer, size, 1000);
}

static int uart_dev_write(device_t *dev, const void *buffer, size_t size)
{
    uart_device_private_t *priv = (uart_device_private_t *)dev->private_data;
    return uart_send(priv->uart, (const uint8_t *)buffer, size);
}

static const device_ops_t uart_dev_ops = {
    .open = uart_dev_open,
    .close = uart_dev_close,
    .read = uart_dev_read,
    .write = uart_dev_write,
    .ioctl = NULL
};

/* 設備實例 */
static uart_device_private_t uart1_priv = {
    .uart_num = 1,
    .baudrate = 115200
};

static device_t uart1_device = {
    .name = "uart1",
    .type = DEVICE_TYPE_CHAR,
    .private_data = &uart1_priv,
    .ops = &uart_dev_ops
};

int main(void)
{
    /* 註冊設備 */
    device_register(&uart1_device);

    /* 打開設備 */
    device_t *dev = device_find("uart1");
    device_open(dev);

    /* 使用設備 */
    const char *msg = "Hello from UART device!\r\n";
    device_write(dev, msg, strlen(msg));

    device_close(dev);
    return 0;
}
