/**
 * @file minimal_bsp.c
 * @brief 最小 BSP 使用範例
 *
 * 此範例示範如何使用 BSP 進行基本的系統初始化和 LED 控制
 */

#include "bsp.h"
#include <stdio.h>

/* LED 引腳定義 (STM32F407 Discovery) */
#define LED_PORT    GPIOD
#define LED_GREEN   GPIO_PIN_12
#define LED_ORANGE  GPIO_PIN_13
#define LED_RED     GPIO_PIN_14
#define LED_BLUE    GPIO_PIN_15

/**
 * @brief 主程式
 */
int main(void)
{
    /* BSP 初始化 */
    if (bsp_init() != 0) {
        /* 初始化失敗 */
        while (1);
    }

    /* 打印系統資訊 */
    uint32_t sysclk = bsp_get_sysclk();
    printf("\n========================================\n");
    printf("STM32F4 BSP Minimal Example\n");
    printf("========================================\n");
    printf("System Clock: %lu Hz\n", sysclk);
    printf("Tick: %lu ms\n", bsp_get_tick());
    printf("========================================\n\n");

    /* 主迴圈 - 四個 LED 流水燈效果 */
    uint8_t led_index = 0;
    uint16_t leds[] = {LED_GREEN, LED_ORANGE, LED_RED, LED_BLUE};

    while (1) {
        /* 熄滅所有 LED */
        HAL_GPIO_WritePin(LED_PORT, LED_GREEN | LED_ORANGE | LED_RED | LED_BLUE, GPIO_PIN_RESET);

        /* 點亮當前 LED */
        HAL_GPIO_WritePin(LED_PORT, leds[led_index], GPIO_PIN_SET);

        /* 延遲 */
        bsp_delay_ms(200);

        /* 切換到下一個 LED */
        led_index = (led_index + 1) % 4;

        /* 每秒打印一次 tick */
        if (bsp_get_tick() % 1000 == 0) {
            printf("Running... Tick: %lu ms\n", bsp_get_tick());
        }
    }

    return 0;
}

/**
 * @brief SysTick 中斷處理 (可選)
 */
void SysTick_Handler(void)
{
    HAL_IncTick();
}
