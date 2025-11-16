/**
 * @file led_blink.c
 * @brief LED 閃爍範例
 *
 * 此範例示範如何使用 GPIO HAL 控制 LED 閃爍
 */

#include "gpio_hal.h"
#include <stdio.h>

/* 平台相關的延遲函數 */
#ifdef STM32F4
    #include "stm32f4xx_hal.h"
    #define delay_ms(x) HAL_Delay(x)
#elif defined(ESP32)
    #include "freertos/FreeRTOS.h"
    #include "freertos/task.h"
    #define delay_ms(x) vTaskDelay((x) / portTICK_PERIOD_MS)
#else
    #define delay_ms(x) /* 需要實作 */
#endif

/* LED 配置 */
#ifdef STM32F4
    #define LED_PORT    GPIO_PORT_A
    #define LED_PIN     GPIO_PIN_5
#elif defined(ESP32)
    #define LED_PORT    GPIO_PORT_0
    #define LED_PIN     GPIO_PIN_2
#else
    #define LED_PORT    GPIO_PORT_A
    #define LED_PIN     GPIO_PIN_0
#endif

/**
 * @brief 主程式
 */
int main(void)
{
    /* 系統初始化 */
#ifdef STM32F4
    HAL_Init();
    SystemClock_Config();  /* 需要在專案中實作 */
#endif

    printf("GPIO HAL - LED Blink Example\n");
    printf("============================\n\n");

    /* 配置 LED 引腳為輸出 */
    gpio_config_t led_config = {
        .port = LED_PORT,
        .pin = LED_PIN,
        .mode = GPIO_MODE_OUTPUT_PP,
        .pull = GPIO_PULL_NONE,
        .speed = GPIO_SPEED_LOW
    };

    if (gpio_init(&led_config) != 0) {
        printf("Error: Failed to initialize LED GPIO\n");
        return -1;
    }

    printf("LED initialized successfully!\n");
    printf("LED will blink every 500ms\n\n");

    /* 主迴圈 - LED 閃爍 */
    uint32_t count = 0;
    while (1) {
        /* 方法 1: 使用 set/reset 函數 */
        gpio_set(LED_PORT, LED_PIN);
        printf("LED ON  (count: %lu)\n", count);
        delay_ms(500);

        gpio_reset(LED_PORT, LED_PIN);
        printf("LED OFF (count: %lu)\n", count);
        delay_ms(500);

        count++;

        /* 每 10 次使用 toggle 方法示範 */
        if (count % 10 == 0) {
            printf("\n--- Using toggle method ---\n");
            for (int i = 0; i < 5; i++) {
                gpio_toggle(LED_PORT, LED_PIN);
                delay_ms(200);
            }
            printf("--- Back to normal mode ---\n\n");
        }
    }

    return 0;
}

/**
 * @brief 進階範例 - 多個 LED
 */
void multi_led_example(void)
{
    /* 配置多個 LED */
    gpio_config_t leds[] = {
        {LED_PORT, GPIO_PIN_0, GPIO_MODE_OUTPUT_PP, GPIO_PULL_NONE, GPIO_SPEED_LOW, 0},
        {LED_PORT, GPIO_PIN_1, GPIO_MODE_OUTPUT_PP, GPIO_PULL_NONE, GPIO_SPEED_LOW, 0},
        {LED_PORT, GPIO_PIN_2, GPIO_MODE_OUTPUT_PP, GPIO_PULL_NONE, GPIO_SPEED_LOW, 0},
        {LED_PORT, GPIO_PIN_3, GPIO_MODE_OUTPUT_PP, GPIO_PULL_NONE, GPIO_SPEED_LOW, 0}
    };

    /* 初始化所有 LED */
    for (int i = 0; i < 4; i++) {
        gpio_init(&leds[i]);
    }

    printf("Multi-LED running light effect\n");

    /* 跑馬燈效果 */
    while (1) {
        for (int i = 0; i < 4; i++) {
            gpio_set(LED_PORT, leds[i].pin);
            delay_ms(200);
            gpio_reset(LED_PORT, leds[i].pin);
        }
    }
}

/**
 * @brief PWM 模擬範例 (軟體 PWM)
 */
void software_pwm_example(void)
{
    gpio_config_t led_config = {
        .port = LED_PORT,
        .pin = LED_PIN,
        .mode = GPIO_MODE_OUTPUT_PP,
        .pull = GPIO_PULL_NONE,
        .speed = GPIO_SPEED_VERY_HIGH  /* 需要高速以獲得更好的 PWM 效果 */
    };

    gpio_init(&led_config);

    printf("Software PWM LED brightness control\n");

    /* 呼吸燈效果 */
    while (1) {
        /* 亮度漸增 */
        for (int brightness = 0; brightness <= 100; brightness++) {
            for (int i = 0; i < 100; i++) {
                if (i < brightness) {
                    gpio_set(LED_PORT, LED_PIN);
                } else {
                    gpio_reset(LED_PORT, LED_PIN);
                }
                /* 微秒級延遲需要平台特定實作 */
            }
        }

        /* 亮度漸減 */
        for (int brightness = 100; brightness >= 0; brightness--) {
            for (int i = 0; i < 100; i++) {
                if (i < brightness) {
                    gpio_set(LED_PORT, LED_PIN);
                } else {
                    gpio_reset(LED_PORT, LED_PIN);
                }
            }
        }
    }
}
