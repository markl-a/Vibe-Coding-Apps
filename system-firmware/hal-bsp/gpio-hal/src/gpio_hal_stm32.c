/**
 * @file gpio_hal_stm32.c
 * @brief GPIO HAL implementation for STM32F4xx
 * @version 1.0.0
 * @date 2025-11-16
 *
 * STM32F4 平台的 GPIO HAL 實作
 */

#include "gpio_hal.h"

#ifdef STM32F4

#include "stm32f4xx_hal.h"
#include <string.h>

/* ========== 私有定義 ========== */

#define MAX_GPIO_INTERRUPTS   16    /**< 最大中斷數量 */

/**
 * @brief 中斷回調函數表
 */
static gpio_irq_callback_t irq_callbacks[MAX_GPIO_INTERRUPTS] = {NULL};

/* ========== 私有函數聲明 ========== */

static uint32_t gpio_convert_mode(gpio_mode_t mode);
static uint32_t gpio_convert_pull(gpio_pull_t pull);
static uint32_t gpio_convert_speed(gpio_speed_t speed);
static void gpio_enable_clock(void *port);
static uint8_t gpio_get_pin_number(uint16_t pin);
static IRQn_Type gpio_get_irq_number(uint16_t pin);

/* ========== API 實作 ========== */

/**
 * @brief 初始化 GPIO 引腳
 */
int gpio_init(const gpio_config_t *config)
{
    if (config == NULL) {
        return -1;
    }

    GPIO_TypeDef *gpio_port = (GPIO_TypeDef *)config->port;
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    /* 啟用 GPIO 時鐘 */
    gpio_enable_clock(config->port);

    /* 配置 GPIO */
    GPIO_InitStruct.Pin = config->pin;
    GPIO_InitStruct.Mode = gpio_convert_mode(config->mode);
    GPIO_InitStruct.Pull = gpio_convert_pull(config->pull);
    GPIO_InitStruct.Speed = gpio_convert_speed(config->speed);

    if (config->mode == GPIO_MODE_AF) {
        GPIO_InitStruct.Alternate = config->alternate;
    }

    HAL_GPIO_Init(gpio_port, &GPIO_InitStruct);

    return 0;
}

/**
 * @brief 解初始化 GPIO 引腳
 */
int gpio_deinit(void *port, uint16_t pin)
{
    if (port == NULL) {
        return -1;
    }

    GPIO_TypeDef *gpio_port = (GPIO_TypeDef *)port;
    HAL_GPIO_DeInit(gpio_port, pin);

    return 0;
}

/**
 * @brief 設置 GPIO 為高電平
 */
void gpio_set(void *port, uint16_t pin)
{
    GPIO_TypeDef *gpio_port = (GPIO_TypeDef *)port;
    HAL_GPIO_WritePin(gpio_port, pin, GPIO_PIN_SET);
}

/**
 * @brief 設置 GPIO 為低電平
 */
void gpio_reset(void *port, uint16_t pin)
{
    GPIO_TypeDef *gpio_port = (GPIO_TypeDef *)port;
    HAL_GPIO_WritePin(gpio_port, pin, GPIO_PIN_RESET);
}

/**
 * @brief 切換 GPIO 電平
 */
void gpio_toggle(void *port, uint16_t pin)
{
    GPIO_TypeDef *gpio_port = (GPIO_TypeDef *)port;
    HAL_GPIO_TogglePin(gpio_port, pin);
}

/**
 * @brief 讀取 GPIO 電平
 */
bool gpio_read(void *port, uint16_t pin)
{
    GPIO_TypeDef *gpio_port = (GPIO_TypeDef *)port;
    GPIO_PinState state = HAL_GPIO_ReadPin(gpio_port, pin);
    return (state == GPIO_PIN_SET);
}

/**
 * @brief 設置 GPIO 中斷
 */
int gpio_set_interrupt(void *port, uint16_t pin,
                       gpio_irq_trigger_t trigger,
                       gpio_irq_callback_t callback)
{
    if (port == NULL || callback == NULL) {
        return -1;
    }

    GPIO_TypeDef *gpio_port = (GPIO_TypeDef *)port;
    uint8_t pin_num = gpio_get_pin_number(pin);

    if (pin_num >= MAX_GPIO_INTERRUPTS) {
        return -1;
    }

    /* 儲存回調函數 */
    irq_callbacks[pin_num] = callback;

    /* 配置中斷 */
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = pin;
    GPIO_InitStruct.Pull = GPIO_NOPULL;

    switch (trigger) {
        case GPIO_IRQ_RISING:
            GPIO_InitStruct.Mode = GPIO_MODE_IT_RISING;
            break;
        case GPIO_IRQ_FALLING:
            GPIO_InitStruct.Mode = GPIO_MODE_IT_FALLING;
            break;
        case GPIO_IRQ_BOTH:
            GPIO_InitStruct.Mode = GPIO_MODE_IT_RISING_FALLING;
            break;
        default:
            return -1;
    }

    HAL_GPIO_Init(gpio_port, &GPIO_InitStruct);

    /* 啟用 NVIC 中斷 */
    IRQn_Type irq_num = gpio_get_irq_number(pin);
    HAL_NVIC_SetPriority(irq_num, 5, 0);
    HAL_NVIC_EnableIRQ(irq_num);

    return 0;
}

/**
 * @brief 清除 GPIO 中斷
 */
int gpio_clear_interrupt(void *port, uint16_t pin)
{
    uint8_t pin_num = gpio_get_pin_number(pin);

    if (pin_num >= MAX_GPIO_INTERRUPTS) {
        return -1;
    }

    /* 清除回調函數 */
    irq_callbacks[pin_num] = NULL;

    /* 禁用中斷 */
    IRQn_Type irq_num = gpio_get_irq_number(pin);
    HAL_NVIC_DisableIRQ(irq_num);

    return 0;
}

/**
 * @brief 啟用 GPIO 中斷
 */
int gpio_enable_interrupt(void *port, uint16_t pin)
{
    IRQn_Type irq_num = gpio_get_irq_number(pin);
    HAL_NVIC_EnableIRQ(irq_num);
    return 0;
}

/**
 * @brief 禁用 GPIO 中斷
 */
int gpio_disable_interrupt(void *port, uint16_t pin)
{
    IRQn_Type irq_num = gpio_get_irq_number(pin);
    HAL_NVIC_DisableIRQ(irq_num);
    return 0;
}

/**
 * @brief 寫入整個端口
 */
void gpio_write_port(void *port, uint16_t value)
{
    GPIO_TypeDef *gpio_port = (GPIO_TypeDef *)port;
    gpio_port->ODR = value;
}

/**
 * @brief 讀取整個端口
 */
uint16_t gpio_read_port(void *port)
{
    GPIO_TypeDef *gpio_port = (GPIO_TypeDef *)port;
    return (uint16_t)gpio_port->IDR;
}

/**
 * @brief 鎖定 GPIO 配置
 */
int gpio_lock(void *port, uint16_t pin)
{
    GPIO_TypeDef *gpio_port = (GPIO_TypeDef *)port;
    HAL_StatusTypeDef status = HAL_GPIO_LockPin(gpio_port, pin);
    return (status == HAL_OK) ? 0 : -1;
}

/* ========== 私有函數實作 ========== */

/**
 * @brief 轉換模式到 STM32 定義
 */
static uint32_t gpio_convert_mode(gpio_mode_t mode)
{
    switch (mode) {
        case GPIO_MODE_INPUT:      return GPIO_MODE_INPUT;
        case GPIO_MODE_OUTPUT_PP:  return GPIO_MODE_OUTPUT_PP;
        case GPIO_MODE_OUTPUT_OD:  return GPIO_MODE_OUTPUT_OD;
        case GPIO_MODE_AF:         return GPIO_MODE_AF_PP;
        case GPIO_MODE_ANALOG:     return GPIO_MODE_ANALOG;
        default:                   return GPIO_MODE_INPUT;
    }
}

/**
 * @brief 轉換上下拉到 STM32 定義
 */
static uint32_t gpio_convert_pull(gpio_pull_t pull)
{
    switch (pull) {
        case GPIO_PULL_NONE:   return GPIO_NOPULL;
        case GPIO_PULL_UP:     return GPIO_PULLUP;
        case GPIO_PULL_DOWN:   return GPIO_PULLDOWN;
        default:               return GPIO_NOPULL;
    }
}

/**
 * @brief 轉換速度到 STM32 定義
 */
static uint32_t gpio_convert_speed(gpio_speed_t speed)
{
    switch (speed) {
        case GPIO_SPEED_LOW:       return GPIO_SPEED_FREQ_LOW;
        case GPIO_SPEED_MEDIUM:    return GPIO_SPEED_FREQ_MEDIUM;
        case GPIO_SPEED_HIGH:      return GPIO_SPEED_FREQ_HIGH;
        case GPIO_SPEED_VERY_HIGH: return GPIO_SPEED_FREQ_VERY_HIGH;
        default:                   return GPIO_SPEED_FREQ_LOW;
    }
}

/**
 * @brief 啟用 GPIO 時鐘
 */
static void gpio_enable_clock(void *port)
{
    if (port == GPIOA) {
        __HAL_RCC_GPIOA_CLK_ENABLE();
    } else if (port == GPIOB) {
        __HAL_RCC_GPIOB_CLK_ENABLE();
    } else if (port == GPIOC) {
        __HAL_RCC_GPIOC_CLK_ENABLE();
    } else if (port == GPIOD) {
        __HAL_RCC_GPIOD_CLK_ENABLE();
    } else if (port == GPIOE) {
        __HAL_RCC_GPIOE_CLK_ENABLE();
    } else if (port == GPIOF) {
        __HAL_RCC_GPIOF_CLK_ENABLE();
    } else if (port == GPIOG) {
        __HAL_RCC_GPIOG_CLK_ENABLE();
    } else if (port == GPIOH) {
        __HAL_RCC_GPIOH_CLK_ENABLE();
    }
}

/**
 * @brief 獲取引腳編號
 */
static uint8_t gpio_get_pin_number(uint16_t pin)
{
    uint8_t pin_num = 0;
    uint16_t temp = pin;

    while (temp >>= 1) {
        pin_num++;
    }

    return pin_num;
}

/**
 * @brief 獲取中斷號
 */
static IRQn_Type gpio_get_irq_number(uint16_t pin)
{
    uint8_t pin_num = gpio_get_pin_number(pin);

    if (pin_num == 0) {
        return EXTI0_IRQn;
    } else if (pin_num == 1) {
        return EXTI1_IRQn;
    } else if (pin_num == 2) {
        return EXTI2_IRQn;
    } else if (pin_num == 3) {
        return EXTI3_IRQn;
    } else if (pin_num == 4) {
        return EXTI4_IRQn;
    } else if (pin_num >= 5 && pin_num <= 9) {
        return EXTI9_5_IRQn;
    } else {
        return EXTI15_10_IRQn;
    }
}

/* ========== 中斷處理 ========== */

/**
 * @brief EXTI 中斷回調 (由 HAL 調用)
 */
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    uint8_t pin_num = gpio_get_pin_number(GPIO_Pin);

    if (pin_num < MAX_GPIO_INTERRUPTS && irq_callbacks[pin_num] != NULL) {
        irq_callbacks[pin_num]();
    }
}

#endif /* STM32F4 */
