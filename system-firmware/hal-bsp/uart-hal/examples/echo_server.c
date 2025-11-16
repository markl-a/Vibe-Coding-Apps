/**
 * @file echo_server.c
 * @brief UART 回聲服務器範例
 */

#include "uart_hal.h"
#include <string.h>

#define RX_BUFFER_SIZE  256

int main(void)
{
    // 初始化 UART
    uart_config_t config = {
        .baudrate = 115200,
        .word_length = 8,
        .stop_bits = 1,
        .parity = UART_PARITY_NONE,
        .flow_control = UART_FLOW_CTRL_NONE
    };

    uart_handle_t uart = uart_init(1, &config);
    if (!uart) {
        return -1;
    }

    uart_puts(uart, "UART Echo Server\r\n");
    uart_puts(uart, "================\r\n");
    uart_puts(uart, "Type something and press Enter\r\n\r\n");

    uint8_t rx_buffer[RX_BUFFER_SIZE];

    while (1) {
        // 接收數據
        int len = uart_receive(uart, rx_buffer, sizeof(rx_buffer) - 1, 1000);

        if (len > 0) {
            // 回傳接收到的數據
            rx_buffer[len] = '\0';
            uart_printf(uart, "Echo: %s\r\n", rx_buffer);
        }
    }

    return 0;
}
