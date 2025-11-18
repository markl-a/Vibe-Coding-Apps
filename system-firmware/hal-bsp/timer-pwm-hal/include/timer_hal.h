/**
 * @file timer_hal.h
 * @brief Timer/PWM Hardware Abstraction Layer Interface
 * @version 1.0.0
 * @date 2025-11-18
 *
 * 通用 Timer/PWM 硬體抽象層介面定義
 * 支援基本定時器、PWM 輸出、輸入捕獲和編碼器模式
 */

#ifndef TIMER_HAL_H
#define TIMER_HAL_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>

/* ========== 型別定義 ========== */

/**
 * @brief 定時器模式
 */
typedef enum {
    TIMER_MODE_BASE,        /**< 基本定時器模式 */
    TIMER_MODE_PWM,         /**< PWM 輸出模式 */
    TIMER_MODE_INPUT_CAPTURE, /**< 輸入捕獲模式 */
    TIMER_MODE_ENCODER      /**< 編碼器模式 */
} timer_mode_t;

/**
 * @brief PWM 極性
 */
typedef enum {
    PWM_POLARITY_HIGH,      /**< 高電平有效 */
    PWM_POLARITY_LOW        /**< 低電平有效 */
} pwm_polarity_t;

/**
 * @brief PWM 對齊模式
 */
typedef enum {
    PWM_ALIGNMENT_EDGE,     /**< 邊緣對齊 */
    PWM_ALIGNMENT_CENTER    /**< 中心對齊 */
} pwm_alignment_t;

/**
 * @brief 輸入捕獲極性
 */
typedef enum {
    IC_POLARITY_RISING,     /**< 上升沿 */
    IC_POLARITY_FALLING,    /**< 下降沿 */
    IC_POLARITY_BOTH        /**< 雙邊沿 */
} ic_polarity_t;

/**
 * @brief 定時器配置結構
 */
typedef struct {
    timer_mode_t mode;      /**< 定時器模式 */
    uint32_t frequency;     /**< 頻率 (Hz) */
    uint16_t prescaler;     /**< 預分頻器 */
    uint32_t period;        /**< 週期 */
    bool auto_reload;       /**< 自動重載 */
} timer_config_t;

/**
 * @brief PWM 配置結構
 */
typedef struct {
    uint8_t channel;        /**< PWM 通道 (1-4) */
    uint32_t frequency;     /**< PWM 頻率 (Hz) */
    float duty_cycle;       /**< 佔空比 (0.0-100.0) */
    pwm_polarity_t polarity; /**< 極性 */
    pwm_alignment_t alignment; /**< 對齊模式 */
} pwm_config_t;

/**
 * @brief 輸入捕獲配置結構
 */
typedef struct {
    uint8_t channel;        /**< 捕獲通道 (1-4) */
    ic_polarity_t polarity; /**< 捕獲極性 */
    uint16_t prescaler;     /**< 輸入分頻 */
    uint16_t filter;        /**< 輸入濾波器 */
} input_capture_config_t;

/**
 * @brief 定時器句柄類型
 */
typedef void* timer_handle_t;

/**
 * @brief 定時器回調函數類型
 */
typedef void (*timer_callback_t)(void);

/**
 * @brief 輸入捕獲回調函數類型
 * @param value 捕獲值
 */
typedef void (*input_capture_callback_t)(uint32_t value);

/* ========== 基本定時器 API ========== */

/**
 * @brief 初始化定時器
 */
timer_handle_t timer_init(uint8_t timer_num, const timer_config_t *config);

/**
 * @brief 解初始化定時器
 */
int timer_deinit(timer_handle_t handle);

/**
 * @brief 啟動定時器
 */
int timer_start(timer_handle_t handle);

/**
 * @brief 停止定時器
 */
int timer_stop(timer_handle_t handle);

/**
 * @brief 設置定時器週期
 */
int timer_set_period(timer_handle_t handle, uint32_t period);

/**
 * @brief 獲取定時器計數值
 */
uint32_t timer_get_counter(timer_handle_t handle);

/**
 * @brief 設置定時器計數值
 */
int timer_set_counter(timer_handle_t handle, uint32_t counter);

/**
 * @brief 設置定時器回調函數
 */
int timer_set_callback(timer_handle_t handle, timer_callback_t callback);

/**
 * @brief 啟用定時器中斷
 */
int timer_enable_interrupt(timer_handle_t handle);

/**
 * @brief 禁用定時器中斷
 */
int timer_disable_interrupt(timer_handle_t handle);

/* ========== PWM API ========== */

/**
 * @brief 初始化 PWM
 */
timer_handle_t pwm_init(uint8_t timer_num, const pwm_config_t *config);

/**
 * @brief 啟動 PWM 輸出
 */
int pwm_start(timer_handle_t handle, uint8_t channel);

/**
 * @brief 停止 PWM 輸出
 */
int pwm_stop(timer_handle_t handle, uint8_t channel);

/**
 * @brief 設置 PWM 佔空比
 * @param duty_cycle 佔空比 (0.0-100.0)
 */
int pwm_set_duty_cycle(timer_handle_t handle, uint8_t channel, float duty_cycle);

/**
 * @brief 設置 PWM 頻率
 */
int pwm_set_frequency(timer_handle_t handle, uint32_t frequency);

/**
 * @brief 設置 PWM 脈衝寬度（微秒）
 */
int pwm_set_pulse_width_us(timer_handle_t handle, uint8_t channel, uint32_t width_us);

/**
 * @brief 獲取當前佔空比
 */
float pwm_get_duty_cycle(timer_handle_t handle, uint8_t channel);

/* ========== 輸入捕獲 API ========== */

/**
 * @brief 初始化輸入捕獲
 */
timer_handle_t input_capture_init(uint8_t timer_num,
                                   const input_capture_config_t *config);

/**
 * @brief 啟動輸入捕獲
 */
int input_capture_start(timer_handle_t handle, uint8_t channel);

/**
 * @brief 停止輸入捕獲
 */
int input_capture_stop(timer_handle_t handle, uint8_t channel);

/**
 * @brief 獲取捕獲值
 */
uint32_t input_capture_get_value(timer_handle_t handle, uint8_t channel);

/**
 * @brief 設置輸入捕獲回調
 */
int input_capture_set_callback(timer_handle_t handle, uint8_t channel,
                               input_capture_callback_t callback);

/* ========== 編碼器 API ========== */

/**
 * @brief 初始化編碼器模式
 */
timer_handle_t encoder_init(uint8_t timer_num);

/**
 * @brief 啟動編碼器
 */
int encoder_start(timer_handle_t handle);

/**
 * @brief 停止編碼器
 */
int encoder_stop(timer_handle_t handle);

/**
 * @brief 獲取編碼器計數
 */
int32_t encoder_get_count(timer_handle_t handle);

/**
 * @brief 重置編碼器計數
 */
int encoder_reset_count(timer_handle_t handle);

/**
 * @brief 獲取編碼器方向
 * @return 1: 正向, -1: 反向, 0: 停止
 */
int encoder_get_direction(timer_handle_t handle);

/* ========== 進階功能 ========== */

/**
 * @brief 延遲微秒（使用定時器實現高精度延遲）
 */
void timer_delay_us(uint32_t us);

/**
 * @brief 延遲毫秒
 */
void timer_delay_ms(uint32_t ms);

/**
 * @brief 獲取微秒計數（用於時間測量）
 */
uint32_t timer_get_microseconds(void);

/**
 * @brief 獲取毫秒計數
 */
uint32_t timer_get_milliseconds(void);

#ifdef __cplusplus
}
#endif

#endif /* TIMER_HAL_H */
