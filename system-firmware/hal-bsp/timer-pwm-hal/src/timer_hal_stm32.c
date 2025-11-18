/**
 * @file timer_hal_stm32.c
 * @brief Timer/PWM HAL implementation for STM32F4xx
 * @version 1.0.0
 * @date 2025-11-18
 *
 * STM32F4 平台的 Timer/PWM HAL 實作
 */

#include "timer_hal.h"

#ifdef STM32F4

#include "stm32f4xx_hal.h"
#include <string.h>

/* ========== 私有定義 ========== */

#define MAX_TIMER_INSTANCES  14   /**< STM32F4 最多支援 14 個定時器 */
#define MAX_CHANNELS         4    /**< 每個定時器最多 4 個通道 */
#define SYSTEM_CLOCK         84000000  /**< 系統時鐘 84MHz (根據實際配置調整) */

/**
 * @brief 定時器內部上下文結構
 */
typedef struct {
    TIM_HandleTypeDef htim;                  /**< STM32 HAL 定時器句柄 */
    uint8_t timer_num;                       /**< 定時器編號 */
    timer_mode_t mode;                       /**< 定時器模式 */
    bool initialized;                        /**< 初始化標誌 */
    timer_callback_t callback;               /**< 定時器回調 */
    input_capture_callback_t ic_callbacks[MAX_CHANNELS]; /**< 輸入捕獲回調 */
    uint32_t pwm_frequency;                  /**< PWM 頻率 */
} timer_context_t;

/* ========== 私有變數 ========== */

static timer_context_t timer_contexts[MAX_TIMER_INSTANCES] = {0};

/* ========== 私有函數聲明 ========== */

static TIM_TypeDef* timer_get_instance(uint8_t timer_num);
static void timer_enable_clock(uint8_t timer_num);
static timer_context_t* timer_get_context(timer_handle_t handle);
static IRQn_Type timer_get_irq_number(uint8_t timer_num);
static uint32_t timer_get_channel_constant(uint8_t channel);

/* ========== 基本定時器 API 實作 ========== */

/**
 * @brief 初始化定時器
 */
timer_handle_t timer_init(uint8_t timer_num, const timer_config_t *config)
{
    if (timer_num == 0 || timer_num > MAX_TIMER_INSTANCES || config == NULL) {
        return NULL;
    }

    timer_context_t *ctx = &timer_contexts[timer_num - 1];

    if (ctx->initialized) {
        return NULL;
    }

    /* 儲存配置 */
    ctx->timer_num = timer_num;
    ctx->mode = config->mode;
    ctx->callback = NULL;
    memset(ctx->ic_callbacks, 0, sizeof(ctx->ic_callbacks));

    /* 啟用時鐘 */
    timer_enable_clock(timer_num);

    /* 配置定時器 */
    ctx->htim.Instance = timer_get_instance(timer_num);
    ctx->htim.Init.Prescaler = config->prescaler;
    ctx->htim.Init.CounterMode = TIM_COUNTERMODE_UP;
    ctx->htim.Init.Period = config->period;
    ctx->htim.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
    ctx->htim.Init.AutoReloadPreload = config->auto_reload ?
                                       TIM_AUTORELOAD_PRELOAD_ENABLE :
                                       TIM_AUTORELOAD_PRELOAD_DISABLE;

    /* 初始化定時器 */
    if (HAL_TIM_Base_Init(&ctx->htim) != HAL_OK) {
        return NULL;
    }

    ctx->initialized = true;

    return (timer_handle_t)ctx;
}

/**
 * @brief 解初始化定時器
 */
int timer_deinit(timer_handle_t handle)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_TIM_Base_DeInit(&ctx->htim);

    ctx->initialized = false;

    return 0;
}

/**
 * @brief 啟動定時器
 */
int timer_start(timer_handle_t handle)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_TIM_Base_Start(&ctx->htim);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 停止定時器
 */
int timer_stop(timer_handle_t handle)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_TIM_Base_Stop(&ctx->htim);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 設置定時器週期
 */
int timer_set_period(timer_handle_t handle, uint32_t period)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    __HAL_TIM_SET_AUTORELOAD(&ctx->htim, period);

    return 0;
}

/**
 * @brief 獲取定時器計數值
 */
uint32_t timer_get_counter(timer_handle_t handle)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    return __HAL_TIM_GET_COUNTER(&ctx->htim);
}

/**
 * @brief 設置定時器計數值
 */
int timer_set_counter(timer_handle_t handle, uint32_t counter)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    __HAL_TIM_SET_COUNTER(&ctx->htim, counter);

    return 0;
}

/**
 * @brief 設置定時器回調函數
 */
int timer_set_callback(timer_handle_t handle, timer_callback_t callback)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    ctx->callback = callback;

    return 0;
}

/**
 * @brief 啟用定時器中斷
 */
int timer_enable_interrupt(timer_handle_t handle)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    /* 啟用 NVIC 中斷 */
    IRQn_Type irq = timer_get_irq_number(ctx->timer_num);
    HAL_NVIC_SetPriority(irq, 5, 0);
    HAL_NVIC_EnableIRQ(irq);

    /* 啟動中斷模式定時器 */
    HAL_StatusTypeDef status = HAL_TIM_Base_Start_IT(&ctx->htim);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 禁用定時器中斷
 */
int timer_disable_interrupt(timer_handle_t handle)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_TIM_Base_Stop_IT(&ctx->htim);

    return (status == HAL_OK) ? 0 : -1;
}

/* ========== PWM API 實作 ========== */

/**
 * @brief 初始化 PWM
 */
timer_handle_t pwm_init(uint8_t timer_num, const pwm_config_t *config)
{
    if (timer_num == 0 || timer_num > MAX_TIMER_INSTANCES || config == NULL) {
        return NULL;
    }

    timer_context_t *ctx = &timer_contexts[timer_num - 1];

    if (ctx->initialized) {
        return NULL;
    }

    /* 儲存配置 */
    ctx->timer_num = timer_num;
    ctx->mode = TIMER_MODE_PWM;
    ctx->pwm_frequency = config->frequency;

    /* 啟用時鐘 */
    timer_enable_clock(timer_num);

    /* 計算 prescaler 和 period */
    uint32_t timer_clock = SYSTEM_CLOCK;
    uint32_t prescaler = 0;
    uint32_t period = (timer_clock / config->frequency) - 1;

    /* 如果 period 超過 16 位元，調整 prescaler */
    while (period > 0xFFFF) {
        prescaler++;
        period = (timer_clock / ((prescaler + 1) * config->frequency)) - 1;
    }

    /* 配置定時器 */
    ctx->htim.Instance = timer_get_instance(timer_num);
    ctx->htim.Init.Prescaler = prescaler;
    ctx->htim.Init.CounterMode = (config->alignment == PWM_ALIGNMENT_CENTER) ?
                                 TIM_COUNTERMODE_CENTERALIGNED1 :
                                 TIM_COUNTERMODE_UP;
    ctx->htim.Init.Period = period;
    ctx->htim.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
    ctx->htim.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_ENABLE;

    /* 初始化 PWM */
    if (HAL_TIM_PWM_Init(&ctx->htim) != HAL_OK) {
        return NULL;
    }

    /* 配置 PWM 通道 */
    TIM_OC_InitTypeDef sConfigOC = {0};
    sConfigOC.OCMode = TIM_OCMODE_PWM1;
    sConfigOC.Pulse = (uint32_t)((period + 1) * config->duty_cycle / 100.0f);
    sConfigOC.OCPolarity = (config->polarity == PWM_POLARITY_HIGH) ?
                           TIM_OCPOLARITY_HIGH : TIM_OCPOLARITY_LOW;
    sConfigOC.OCFastMode = TIM_OCFAST_DISABLE;

    uint32_t channel = timer_get_channel_constant(config->channel);

    if (HAL_TIM_PWM_ConfigChannel(&ctx->htim, &sConfigOC, channel) != HAL_OK) {
        return NULL;
    }

    ctx->initialized = true;

    return (timer_handle_t)ctx;
}

/**
 * @brief 啟動 PWM 輸出
 */
int pwm_start(timer_handle_t handle, uint8_t channel)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized || ctx->mode != TIMER_MODE_PWM) {
        return -1;
    }

    uint32_t tim_channel = timer_get_channel_constant(channel);

    HAL_StatusTypeDef status = HAL_TIM_PWM_Start(&ctx->htim, tim_channel);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 停止 PWM 輸出
 */
int pwm_stop(timer_handle_t handle, uint8_t channel)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized || ctx->mode != TIMER_MODE_PWM) {
        return -1;
    }

    uint32_t tim_channel = timer_get_channel_constant(channel);

    HAL_StatusTypeDef status = HAL_TIM_PWM_Stop(&ctx->htim, tim_channel);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 設置 PWM 佔空比
 */
int pwm_set_duty_cycle(timer_handle_t handle, uint8_t channel, float duty_cycle)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized || ctx->mode != TIMER_MODE_PWM) {
        return -1;
    }

    if (duty_cycle < 0.0f) duty_cycle = 0.0f;
    if (duty_cycle > 100.0f) duty_cycle = 100.0f;

    uint32_t period = __HAL_TIM_GET_AUTORELOAD(&ctx->htim);
    uint32_t pulse = (uint32_t)((period + 1) * duty_cycle / 100.0f);

    uint32_t tim_channel = timer_get_channel_constant(channel);

    __HAL_TIM_SET_COMPARE(&ctx->htim, tim_channel, pulse);

    return 0;
}

/**
 * @brief 設置 PWM 頻率
 */
int pwm_set_frequency(timer_handle_t handle, uint32_t frequency)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized || ctx->mode != TIMER_MODE_PWM) {
        return -1;
    }

    uint32_t timer_clock = SYSTEM_CLOCK;
    uint32_t prescaler = ctx->htim.Init.Prescaler;
    uint32_t period = (timer_clock / ((prescaler + 1) * frequency)) - 1;

    if (period > 0xFFFF) {
        return -1;  /* 頻率太低 */
    }

    __HAL_TIM_SET_AUTORELOAD(&ctx->htim, period);
    ctx->pwm_frequency = frequency;

    return 0;
}

/**
 * @brief 設置 PWM 脈衝寬度（微秒）
 */
int pwm_set_pulse_width_us(timer_handle_t handle, uint8_t channel, uint32_t width_us)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized || ctx->mode != TIMER_MODE_PWM) {
        return -1;
    }

    /* 計算對應的 pulse 值 */
    uint32_t period_us = 1000000 / ctx->pwm_frequency;
    float duty = (float)width_us * 100.0f / period_us;

    return pwm_set_duty_cycle(handle, channel, duty);
}

/**
 * @brief 獲取當前佔空比
 */
float pwm_get_duty_cycle(timer_handle_t handle, uint8_t channel)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized || ctx->mode != TIMER_MODE_PWM) {
        return 0.0f;
    }

    uint32_t tim_channel = timer_get_channel_constant(channel);
    uint32_t pulse = __HAL_TIM_GET_COMPARE(&ctx->htim, tim_channel);
    uint32_t period = __HAL_TIM_GET_AUTORELOAD(&ctx->htim);

    return (float)pulse * 100.0f / (period + 1);
}

/* ========== 輸入捕獲 API 實作 ========== */

/**
 * @brief 初始化輸入捕獲
 */
timer_handle_t input_capture_init(uint8_t timer_num,
                                   const input_capture_config_t *config)
{
    if (timer_num == 0 || timer_num > MAX_TIMER_INSTANCES || config == NULL) {
        return NULL;
    }

    timer_context_t *ctx = &timer_contexts[timer_num - 1];

    if (ctx->initialized) {
        return NULL;
    }

    ctx->timer_num = timer_num;
    ctx->mode = TIMER_MODE_INPUT_CAPTURE;

    timer_enable_clock(timer_num);

    /* 配置定時器基本參數 */
    ctx->htim.Instance = timer_get_instance(timer_num);
    ctx->htim.Init.Prescaler = 0;
    ctx->htim.Init.CounterMode = TIM_COUNTERMODE_UP;
    ctx->htim.Init.Period = 0xFFFF;
    ctx->htim.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;

    if (HAL_TIM_IC_Init(&ctx->htim) != HAL_OK) {
        return NULL;
    }

    /* 配置輸入捕獲通道 */
    TIM_IC_InitTypeDef sConfigIC = {0};
    sConfigIC.ICPrescaler = config->prescaler;
    sConfigIC.ICFilter = config->filter;

    switch (config->polarity) {
        case IC_POLARITY_RISING:
            sConfigIC.ICPolarity = TIM_ICPOLARITY_RISING;
            break;
        case IC_POLARITY_FALLING:
            sConfigIC.ICPolarity = TIM_ICPOLARITY_FALLING;
            break;
        case IC_POLARITY_BOTH:
            sConfigIC.ICPolarity = TIM_ICPOLARITY_BOTHEDGE;
            break;
    }

    sConfigIC.ICSelection = TIM_ICSELECTION_DIRECTTI;

    uint32_t channel = timer_get_channel_constant(config->channel);

    if (HAL_TIM_IC_ConfigChannel(&ctx->htim, &sConfigIC, channel) != HAL_OK) {
        return NULL;
    }

    ctx->initialized = true;

    return (timer_handle_t)ctx;
}

/**
 * @brief 啟動輸入捕獲
 */
int input_capture_start(timer_handle_t handle, uint8_t channel)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    uint32_t tim_channel = timer_get_channel_constant(channel);

    HAL_StatusTypeDef status = HAL_TIM_IC_Start_IT(&ctx->htim, tim_channel);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 停止輸入捕獲
 */
int input_capture_stop(timer_handle_t handle, uint8_t channel)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    uint32_t tim_channel = timer_get_channel_constant(channel);

    HAL_StatusTypeDef status = HAL_TIM_IC_Stop_IT(&ctx->htim, tim_channel);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 獲取捕獲值
 */
uint32_t input_capture_get_value(timer_handle_t handle, uint8_t channel)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    uint32_t tim_channel = timer_get_channel_constant(channel);

    return HAL_TIM_ReadCapturedValue(&ctx->htim, tim_channel);
}

/**
 * @brief 設置輸入捕獲回調
 */
int input_capture_set_callback(timer_handle_t handle, uint8_t channel,
                               input_capture_callback_t callback)
{
    timer_context_t *ctx = timer_get_context(handle);

    if (ctx == NULL || !ctx->initialized || channel == 0 || channel > MAX_CHANNELS) {
        return -1;
    }

    ctx->ic_callbacks[channel - 1] = callback;

    return 0;
}

/* ========== 私有函數實作 ========== */

static TIM_TypeDef* timer_get_instance(uint8_t timer_num)
{
    switch (timer_num) {
        case 1:  return TIM1;
        case 2:  return TIM2;
        case 3:  return TIM3;
        case 4:  return TIM4;
        case 5:  return TIM5;
        case 6:  return TIM6;
        case 7:  return TIM7;
        case 8:  return TIM8;
        case 9:  return TIM9;
        case 10: return TIM10;
        case 11: return TIM11;
        case 12: return TIM12;
        case 13: return TIM13;
        case 14: return TIM14;
        default: return NULL;
    }
}

static void timer_enable_clock(uint8_t timer_num)
{
    switch (timer_num) {
        case 1:  __HAL_RCC_TIM1_CLK_ENABLE(); break;
        case 2:  __HAL_RCC_TIM2_CLK_ENABLE(); break;
        case 3:  __HAL_RCC_TIM3_CLK_ENABLE(); break;
        case 4:  __HAL_RCC_TIM4_CLK_ENABLE(); break;
        case 5:  __HAL_RCC_TIM5_CLK_ENABLE(); break;
        case 6:  __HAL_RCC_TIM6_CLK_ENABLE(); break;
        case 7:  __HAL_RCC_TIM7_CLK_ENABLE(); break;
        case 8:  __HAL_RCC_TIM8_CLK_ENABLE(); break;
        case 9:  __HAL_RCC_TIM9_CLK_ENABLE(); break;
        case 10: __HAL_RCC_TIM10_CLK_ENABLE(); break;
        case 11: __HAL_RCC_TIM11_CLK_ENABLE(); break;
        case 12: __HAL_RCC_TIM12_CLK_ENABLE(); break;
        case 13: __HAL_RCC_TIM13_CLK_ENABLE(); break;
        case 14: __HAL_RCC_TIM14_CLK_ENABLE(); break;
    }
}

static timer_context_t* timer_get_context(timer_handle_t handle)
{
    timer_context_t *ctx = (timer_context_t *)handle;

    if (ctx < timer_contexts || ctx >= &timer_contexts[MAX_TIMER_INSTANCES]) {
        return NULL;
    }

    return ctx;
}

static IRQn_Type timer_get_irq_number(uint8_t timer_num)
{
    switch (timer_num) {
        case 1:  return TIM1_UP_TIM10_IRQn;
        case 2:  return TIM2_IRQn;
        case 3:  return TIM3_IRQn;
        case 4:  return TIM4_IRQn;
        case 5:  return TIM5_IRQn;
        case 6:  return TIM6_DAC_IRQn;
        case 7:  return TIM7_IRQn;
        case 8:  return TIM8_UP_TIM13_IRQn;
        default: return (IRQn_Type)0;
    }
}

static uint32_t timer_get_channel_constant(uint8_t channel)
{
    switch (channel) {
        case 1:  return TIM_CHANNEL_1;
        case 2:  return TIM_CHANNEL_2;
        case 3:  return TIM_CHANNEL_3;
        case 4:  return TIM_CHANNEL_4;
        default: return TIM_CHANNEL_1;
    }
}

/* ========== HAL 回調函數 ========== */

void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
    for (int i = 0; i < MAX_TIMER_INSTANCES; i++) {
        if (&timer_contexts[i].htim == htim) {
            if (timer_contexts[i].callback != NULL) {
                timer_contexts[i].callback();
            }
            break;
        }
    }
}

void HAL_TIM_IC_CaptureCallback(TIM_HandleTypeDef *htim)
{
    for (int i = 0; i < MAX_TIMER_INSTANCES; i++) {
        if (&timer_contexts[i].htim == htim) {
            /* 判斷是哪個通道觸發的中斷 */
            if (htim->Channel == HAL_TIM_ACTIVE_CHANNEL_1) {
                if (timer_contexts[i].ic_callbacks[0] != NULL) {
                    uint32_t value = HAL_TIM_ReadCapturedValue(htim, TIM_CHANNEL_1);
                    timer_contexts[i].ic_callbacks[0](value);
                }
            } else if (htim->Channel == HAL_TIM_ACTIVE_CHANNEL_2) {
                if (timer_contexts[i].ic_callbacks[1] != NULL) {
                    uint32_t value = HAL_TIM_ReadCapturedValue(htim, TIM_CHANNEL_2);
                    timer_contexts[i].ic_callbacks[1](value);
                }
            }
            break;
        }
    }
}

#endif /* STM32F4 */
