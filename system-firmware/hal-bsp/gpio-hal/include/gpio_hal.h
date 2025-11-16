/**
 * @file gpio_hal.h
 * @brief GPIO Hardware Abstraction Layer Interface
 * @version 1.0.0
 * @date 2025-11-16
 *
 * 通用 GPIO 硬體抽象層介面定義
 * 提供跨平台的統一 GPIO 操作 API
 */

#ifndef GPIO_HAL_H
#define GPIO_HAL_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>

/* ========== 型別定義 ========== */

/**
 * @brief GPIO 模式列舉
 */
typedef enum {
    GPIO_MODE_INPUT,        /**< 輸入模式 */
    GPIO_MODE_OUTPUT_PP,    /**< 推挽輸出模式 (Push-Pull) */
    GPIO_MODE_OUTPUT_OD,    /**< 開漏輸出模式 (Open-Drain) */
    GPIO_MODE_AF,           /**< 替代功能模式 (Alternate Function) */
    GPIO_MODE_ANALOG        /**< 類比模式 */
} gpio_mode_t;

/**
 * @brief GPIO 上拉/下拉配置
 */
typedef enum {
    GPIO_PULL_NONE,         /**< 無上下拉 */
    GPIO_PULL_UP,           /**< 上拉 */
    GPIO_PULL_DOWN          /**< 下拉 */
} gpio_pull_t;

/**
 * @brief GPIO 速度等級
 */
typedef enum {
    GPIO_SPEED_LOW,         /**< 低速 (2MHz) */
    GPIO_SPEED_MEDIUM,      /**< 中速 (25MHz) */
    GPIO_SPEED_HIGH,        /**< 高速 (50MHz) */
    GPIO_SPEED_VERY_HIGH    /**< 超高速 (100MHz) */
} gpio_speed_t;

/**
 * @brief GPIO 中斷觸發方式
 */
typedef enum {
    GPIO_IRQ_RISING,        /**< 上升沿觸發 */
    GPIO_IRQ_FALLING,       /**< 下降沿觸發 */
    GPIO_IRQ_BOTH           /**< 雙邊沿觸發 */
} gpio_irq_trigger_t;

/**
 * @brief GPIO 配置結構體
 */
typedef struct {
    void *port;             /**< GPIO 端口指標 */
    uint16_t pin;           /**< GPIO 引腳編號 */
    gpio_mode_t mode;       /**< GPIO 模式 */
    gpio_pull_t pull;       /**< 上拉/下拉配置 */
    gpio_speed_t speed;     /**< 輸出速度 */
    uint8_t alternate;      /**< 替代功能編號 (僅 AF 模式使用) */
} gpio_config_t;

/**
 * @brief GPIO 中斷回調函數類型
 */
typedef void (*gpio_irq_callback_t)(void);

/* ========== 平台相關定義 ========== */

#if defined(STM32F4)
    #include "stm32f4xx_hal.h"
    /* STM32F4 平台特定定義 */
    #define GPIO_PORT_A     GPIOA
    #define GPIO_PORT_B     GPIOB
    #define GPIO_PORT_C     GPIOC
    #define GPIO_PORT_D     GPIOD
    #define GPIO_PORT_E     GPIOE
    #define GPIO_PORT_F     GPIOF
    #define GPIO_PORT_G     GPIOG
    #define GPIO_PORT_H     GPIOH

#elif defined(ESP32)
    #include "driver/gpio.h"
    /* ESP32 平台特定定義 */
    #define GPIO_PORT_0     ((void*)0)

#elif defined(NRF52)
    #include "nrf_gpio.h"
    /* NRF52 平台特定定義 */
    #define GPIO_PORT_0     ((void*)0)

#else
    /* 通用定義 */
    #define GPIO_PORT_A     ((void*)0)
    #define GPIO_PORT_B     ((void*)1)
    #define GPIO_PORT_C     ((void*)2)
    #define GPIO_PORT_D     ((void*)3)
#endif

/* ========== 引腳定義 ========== */

#define GPIO_PIN_0      (1U << 0)
#define GPIO_PIN_1      (1U << 1)
#define GPIO_PIN_2      (1U << 2)
#define GPIO_PIN_3      (1U << 3)
#define GPIO_PIN_4      (1U << 4)
#define GPIO_PIN_5      (1U << 5)
#define GPIO_PIN_6      (1U << 6)
#define GPIO_PIN_7      (1U << 7)
#define GPIO_PIN_8      (1U << 8)
#define GPIO_PIN_9      (1U << 9)
#define GPIO_PIN_10     (1U << 10)
#define GPIO_PIN_11     (1U << 11)
#define GPIO_PIN_12     (1U << 12)
#define GPIO_PIN_13     (1U << 13)
#define GPIO_PIN_14     (1U << 14)
#define GPIO_PIN_15     (1U << 15)

/* ========== API 函數 ========== */

/**
 * @brief 初始化 GPIO 引腳
 *
 * @param config GPIO 配置參數
 * @return int 0: 成功, -1: 失敗
 *
 * @note 此函數會自動啟用對應端口的時鐘
 *
 * @example
 * gpio_config_t led_config = {
 *     .port = GPIO_PORT_A,
 *     .pin = GPIO_PIN_5,
 *     .mode = GPIO_MODE_OUTPUT_PP,
 *     .pull = GPIO_PULL_NONE,
 *     .speed = GPIO_SPEED_LOW
 * };
 * gpio_init(&led_config);
 */
int gpio_init(const gpio_config_t *config);

/**
 * @brief 解初始化 GPIO 引腳
 *
 * @param port GPIO 端口
 * @param pin GPIO 引腳
 * @return int 0: 成功, -1: 失敗
 *
 * @note 將引腳恢復為預設狀態
 */
int gpio_deinit(void *port, uint16_t pin);

/**
 * @brief 設置 GPIO 引腳為高電平
 *
 * @param port GPIO 端口
 * @param pin GPIO 引腳
 *
 * @note 僅對輸出引腳有效
 */
void gpio_set(void *port, uint16_t pin);

/**
 * @brief 設置 GPIO 引腳為低電平
 *
 * @param port GPIO 端口
 * @param pin GPIO 引腳
 *
 * @note 僅對輸出引腳有效
 */
void gpio_reset(void *port, uint16_t pin);

/**
 * @brief 切換 GPIO 引腳電平
 *
 * @param port GPIO 端口
 * @param pin GPIO 引腳
 *
 * @note 僅對輸出引腳有效
 */
void gpio_toggle(void *port, uint16_t pin);

/**
 * @brief 讀取 GPIO 引腳電平
 *
 * @param port GPIO 端口
 * @param pin GPIO 引腳
 * @return bool true: 高電平, false: 低電平
 */
bool gpio_read(void *port, uint16_t pin);

/**
 * @brief 設置 GPIO 中斷回調函數
 *
 * @param port GPIO 端口
 * @param pin GPIO 引腳
 * @param trigger 觸發方式
 * @param callback 回調函數
 * @return int 0: 成功, -1: 失敗
 *
 * @note 回調函數在中斷上下文中執行,應保持簡短
 */
int gpio_set_interrupt(void *port, uint16_t pin,
                       gpio_irq_trigger_t trigger,
                       gpio_irq_callback_t callback);

/**
 * @brief 清除 GPIO 中斷回調函數
 *
 * @param port GPIO 端口
 * @param pin GPIO 引腳
 * @return int 0: 成功, -1: 失敗
 */
int gpio_clear_interrupt(void *port, uint16_t pin);

/**
 * @brief 啟用 GPIO 中斷
 *
 * @param port GPIO 端口
 * @param pin GPIO 引腳
 * @return int 0: 成功, -1: 失敗
 */
int gpio_enable_interrupt(void *port, uint16_t pin);

/**
 * @brief 禁用 GPIO 中斷
 *
 * @param port GPIO 端口
 * @param pin GPIO 引腳
 * @return int 0: 成功, -1: 失敗
 */
int gpio_disable_interrupt(void *port, uint16_t pin);

/**
 * @brief 寫入多個引腳 (端口寫入)
 *
 * @param port GPIO 端口
 * @param value 16位元的引腳值
 *
 * @note 同時更新整個端口的輸出,適合並行介面
 */
void gpio_write_port(void *port, uint16_t value);

/**
 * @brief 讀取多個引腳 (端口讀取)
 *
 * @param port GPIO 端口
 * @return uint16_t 16位元的引腳值
 */
uint16_t gpio_read_port(void *port);

/**
 * @brief 鎖定 GPIO 配置
 *
 * @param port GPIO 端口
 * @param pin GPIO 引腳
 * @return int 0: 成功, -1: 失敗
 *
 * @note 鎖定後配置無法修改,直到系統重啟
 */
int gpio_lock(void *port, uint16_t pin);

/* ========== 便利巨集 ========== */

/**
 * @brief LED 開啟巨集
 */
#define LED_ON(port, pin)   gpio_set(port, pin)

/**
 * @brief LED 關閉巨集
 */
#define LED_OFF(port, pin)  gpio_reset(port, pin)

/**
 * @brief LED 切換巨集
 */
#define LED_TOGGLE(port, pin) gpio_toggle(port, pin)

/**
 * @brief 讀取按鈕狀態巨集 (假設低電平有效)
 */
#define BUTTON_PRESSED(port, pin) (!gpio_read(port, pin))

#ifdef __cplusplus
}
#endif

#endif /* GPIO_HAL_H */
