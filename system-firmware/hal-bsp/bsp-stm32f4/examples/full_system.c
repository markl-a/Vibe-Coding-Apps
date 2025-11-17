/**
 * @file full_system.c
 * @brief BSP 完整系統範例
 *
 * 此範例示範如何使用 BSP 建立一個完整的嵌入式系統
 * 整合 GPIO, UART, I2C, SPI 等所有周邊
 */

#include "bsp.h"
#include "gpio_hal.h"
#include "uart_hal.h"
#include "i2c_hal.h"
#include "spi_hal.h"
#include <stdio.h>
#include <string.h>

/* LED 定義 */
#define LED_GREEN   GPIO_PIN_12
#define LED_ORANGE  GPIO_PIN_13
#define LED_RED     GPIO_PIN_14
#define LED_BLUE    GPIO_PIN_15

/* 系統狀態 */
typedef struct {
    bool system_ready;
    uint32_t uptime_seconds;
    uint32_t error_count;
    uart_handle_t console_uart;
    i2c_handle_t i2c;
    spi_handle_t spi;
} system_state_t;

static system_state_t sys = {0};

/**
 * @brief 系統初始化
 */
static int system_init(void)
{
    printf("\n========================================\n");
    printf("System Initialization\n");
    printf("========================================\n\n");

    /* BSP 初始化 */
    printf("Initializing BSP...\n");
    if (bsp_init() != 0) {
        printf("✗ BSP init failed\n");
        return -1;
    }
    printf("✓ BSP initialized\n");

    /* 打印系統時鐘信息 */
    printf("\nSystem Clocks:\n");
    printf("  SYSCLK: %lu MHz\n", bsp_get_sysclk() / 1000000);

    /* 初始化 UART */
    printf("\nInitializing UART console...\n");
    uart_config_t uart_cfg = {
        .baudrate = 115200,
        .word_length = 8,
        .stop_bits = 1,
        .parity = UART_PARITY_NONE,
        .flow_control = UART_FLOW_CTRL_NONE
    };

    sys.console_uart = uart_init(2, &uart_cfg);  /* USART2 */
    if (!sys.console_uart) {
        printf("✗ UART init failed\n");
        return -1;
    }
    printf("✓ UART initialized (115200 bps)\n");

    /* 初始化 I2C */
    printf("\nInitializing I2C...\n");
    i2c_config_t i2c_cfg = {
        .mode = I2C_MODE_MASTER,
        .clock_speed = I2C_SPEED_STANDARD,
        .address_mode = I2C_ADDR_7BIT,
        .own_address = 0x00
    };

    sys.i2c = i2c_init(1, &i2c_cfg);
    if (!sys.i2c) {
        printf("✗ I2C init failed\n");
        return -1;
    }
    printf("✓ I2C initialized (100kHz)\n");

    /* 初始化 SPI */
    printf("\nInitializing SPI...\n");
    spi_config_t spi_cfg = {
        .mode = SPI_MODE_MASTER,
        .clock_polarity = SPI_CPOL_LOW,
        .clock_phase = SPI_CPHA_1EDGE,
        .baudrate_prescaler = SPI_BAUDRATE_PRESCALER_16,
        .data_size = SPI_DATASIZE_8BIT,
        .first_bit = SPI_FIRSTBIT_MSB
    };

    sys.spi = spi_init(1, &spi_cfg);
    if (!sys.spi) {
        printf("✗ SPI init failed\n");
        return -1;
    }
    printf("✓ SPI initialized\n");

    sys.system_ready = true;

    printf("\n========================================\n");
    printf("System Ready!\n");
    printf("========================================\n\n");

    /* LED 啟動序列 */
    uint16_t leds[] = {LED_GREEN, LED_ORANGE, LED_RED, LED_BLUE};
    for (int i = 0; i < 4; i++) {
        HAL_GPIO_WritePin(GPIOD, leds[i], GPIO_PIN_SET);
        bsp_delay_ms(100);
    }
    bsp_delay_ms(500);
    for (int i = 0; i < 4; i++) {
        HAL_GPIO_WritePin(GPIOD, leds[i], GPIO_PIN_RESET);
    }

    return 0;
}

/**
 * @brief 心跳任務
 */
static void heartbeat_task(void)
{
    static uint32_t last_tick = 0;
    uint32_t now = bsp_get_tick();

    if (now - last_tick >= 1000) {  /* 每秒 */
        last_tick = now;
        sys.uptime_seconds++;

        /* 切換綠色 LED */
        HAL_GPIO_TogglePin(GPIOD, LED_GREEN);

        /* 打印系統狀態 */
        if (sys.uptime_seconds % 10 == 0) {
            uart_printf(sys.console_uart,
                       "Uptime: %lu s | Errors: %lu\r\n",
                       sys.uptime_seconds, sys.error_count);
        }
    }
}

/**
 * @brief 主程式
 */
int main(void)
{
    /* 系統初始化 */
    if (system_init() != 0) {
        /* 錯誤指示: 紅色 LED 閃爍 */
        while (1) {
            HAL_GPIO_TogglePin(GPIOD, LED_RED);
            bsp_delay_ms(200);
        }
    }

    /* 主循環 */
    uart_puts(sys.console_uart, "Entering main loop...\r\n");

    while (1) {
        /* 心跳 */
        heartbeat_task();

        /* 處理 UART 命令 */
        /* 處理 I2C 設備 */
        /* 處理 SPI 設備 */

        bsp_delay_ms(10);
    }

    return 0;
}
