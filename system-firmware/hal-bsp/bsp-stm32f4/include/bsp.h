/**
 * @file bsp.h
 * @brief STM32F4 Board Support Package Interface
 * @version 1.0.0
 */

#ifndef BSP_H
#define BSP_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include "stm32f4xx_hal.h"

/* 時鐘配置結構 */
typedef struct {
    uint32_t sysclk_freq;   /**< 系統時鐘頻率 (Hz) */
    uint32_t hclk_freq;     /**< AHB 時鐘頻率 (Hz) */
    uint32_t pclk1_freq;    /**< APB1 時鐘頻率 (Hz) */
    uint32_t pclk2_freq;    /**< APB2 時鐘頻率 (Hz) */
} clock_config_t;

/* BSP 初始化標誌 */
#define BSP_INIT_GPIO   (1 << 0)
#define BSP_INIT_UART   (1 << 1)
#define BSP_INIT_SPI    (1 << 2)
#define BSP_INIT_I2C    (1 << 3)
#define BSP_INIT_ALL    (0xFF)

/* API 函數 */

/**
 * @brief BSP 總初始化
 * @return int 0: 成功, -1: 失敗
 */
int bsp_init(void);

/**
 * @brief BSP 選擇性初始化
 * @param flags 初始化標誌
 * @return int 0: 成功, -1: 失敗
 */
int bsp_init_ex(uint32_t flags);

/**
 * @brief 時鐘配置
 * @param config 時鐘配置參數
 * @return int 0: 成功, -1: 失敗
 */
int bsp_clock_init(const clock_config_t *config);

/**
 * @brief GPIO 初始化
 * @return int 0: 成功, -1: 失敗
 */
int bsp_gpio_init(void);

/**
 * @brief UART 初始化
 * @return int 0: 成功, -1: 失敗
 */
int bsp_uart_init(void);

/**
 * @brief SPI 初始化
 * @return int 0: 成功, -1: 失敗
 */
int bsp_spi_init(void);

/**
 * @brief I2C 初始化
 * @return int 0: 成功, -1: 失敗
 */
int bsp_i2c_init(void);

/**
 * @brief 獲取系統時鐘頻率
 * @return uint32_t 系統時鐘頻率 (Hz)
 */
uint32_t bsp_get_sysclk(void);

/**
 * @brief 毫秒延遲
 * @param ms 延遲時間 (毫秒)
 */
void bsp_delay_ms(uint32_t ms);

/**
 * @brief 微秒延遲
 * @param us 延遲時間 (微秒)
 */
void bsp_delay_us(uint32_t us);

/**
 * @brief 獲取系統滴答計數
 * @return uint32_t 滴答計數
 */
uint32_t bsp_get_tick(void);

#ifdef __cplusplus
}
#endif

#endif /* BSP_H */
