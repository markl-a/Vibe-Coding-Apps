/**
 * STM32 高級定時器 PWM 控制範例
 *
 * 功能：
 * - 多通道 PWM 輸出
 * - 動態調整占空比和頻率
 * - 互補 PWM 輸出（用於馬達控制）
 * - 死區時間配置
 *
 * 平台：STM32F4
 * 定時器：TIM1 (高級定時器)
 *
 * 應用：
 * - 無刷馬達控制
 * - 伺服馬達控制
 * - LED 調光
 * - 電源轉換器
 */

#include "stm32f4xx_hal.h"
#include <stdio.h>

/* 定時器句柄 */
TIM_HandleTypeDef htim1;
TIM_HandleTypeDef htim2;

/* PWM 參數 */
#define PWM_FREQUENCY   1000    // PWM 頻率 (Hz)
#define TIMER_CLOCK     84000000 // 定時器時鐘 (84 MHz)

/* 函數聲明 */
void SystemClock_Config(void);
static void TIM1_PWM_Init(void);
static void TIM2_Encoder_Init(void);
void Set_PWM_DutyCycle(TIM_HandleTypeDef *htim, uint32_t channel, float duty);
void Set_PWM_Frequency(TIM_HandleTypeDef *htim, uint32_t frequency);

/**
 * 主函數
 */
int main(void)
{
    HAL_Init();
    SystemClock_Config();

    /* 初始化定時器 */
    TIM1_PWM_Init();

    printf("\r\n=== STM32 高級 PWM 控制 ===\r\n");
    printf("PWM 頻率: %u Hz\r\n", PWM_FREQUENCY);

    /* 啟動 PWM 輸出 */
    HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_1);
    HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_2);
    HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_3);

    /* 如果使用互補輸出（用於馬達驅動） */
    HAL_TIMEx_PWMN_Start(&htim1, TIM_CHANNEL_1);  // CH1N
    HAL_TIMEx_PWMN_Start(&htim1, TIM_CHANNEL_2);  // CH2N
    HAL_TIMEx_PWMN_Start(&htim1, TIM_CHANNEL_3);  // CH3N

    float duty = 0.0f;
    uint8_t direction = 1;

    /* 主循環 - PWM 漸變效果 */
    while (1)
    {
        /* 三相 PWM 控制（120度相位差） */
        Set_PWM_DutyCycle(&htim1, TIM_CHANNEL_1, duty);
        Set_PWM_DutyCycle(&htim1, TIM_CHANNEL_2, duty > 0.33f ? duty - 0.33f : duty + 0.67f);
        Set_PWM_DutyCycle(&htim1, TIM_CHANNEL_3, duty > 0.67f ? duty - 0.67f : duty + 0.33f);

        /* 漸變控制 */
        if (direction)
        {
            duty += 0.01f;
            if (duty >= 1.0f)
            {
                duty = 1.0f;
                direction = 0;
            }
        }
        else
        {
            duty -= 0.01f;
            if (duty <= 0.0f)
            {
                duty = 0.0f;
                direction = 1;
            }
        }

        printf("PWM 占空比: %.2f%%\r\n", duty * 100.0f);

        HAL_Delay(50);
    }
}

/**
 * TIM1 PWM 初始化（高級定時器）
 */
static void TIM1_PWM_Init(void)
{
    TIM_OC_InitTypeDef sConfigOC = {0};
    TIM_BreakDeadTimeConfigTypeDef sBreakDeadTimeConfig = {0};

    /* 啟用時鐘 */
    __HAL_RCC_TIM1_CLK_ENABLE();
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOE_CLK_ENABLE();

    /* 配置 GPIO */
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    /* TIM1 CH1/CH2/CH3 - PA8/PA9/PA10 */
    GPIO_InitStruct.Pin = GPIO_PIN_8 | GPIO_PIN_9 | GPIO_PIN_10;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF1_TIM1;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* TIM1 CH1N/CH2N/CH3N - PE8/PE10/PE12（互補輸出） */
    GPIO_InitStruct.Pin = GPIO_PIN_8 | GPIO_PIN_10 | GPIO_PIN_12;
    GPIO_InitStruct.Alternate = GPIO_AF1_TIM1;
    HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);

    /* 計算 PWM 參數 */
    uint32_t prescaler = 0;  // 84 MHz / (0+1) = 84 MHz
    uint32_t period = (TIMER_CLOCK / ((prescaler + 1) * PWM_FREQUENCY)) - 1;

    /* 配置定時器基本參數 */
    htim1.Instance = TIM1;
    htim1.Init.Prescaler = prescaler;
    htim1.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim1.Init.Period = period;
    htim1.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
    htim1.Init.RepetitionCounter = 0;
    htim1.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_ENABLE;

    if (HAL_TIM_PWM_Init(&htim1) != HAL_OK)
    {
        Error_Handler();
    }

    /* 配置 PWM 通道 */
    sConfigOC.OCMode = TIM_OCMODE_PWM1;
    sConfigOC.Pulse = 0;  // 初始占空比 0%
    sConfigOC.OCPolarity = TIM_OCPOLARITY_HIGH;
    sConfigOC.OCNPolarity = TIM_OCNPOLARITY_HIGH;  // 互補輸出極性
    sConfigOC.OCFastMode = TIM_OCFAST_DISABLE;
    sConfigOC.OCIdleState = TIM_OCIDLESTATE_RESET;
    sConfigOC.OCNIdleState = TIM_OCNIDLESTATE_RESET;

    /* 配置三個通道 */
    HAL_TIM_PWM_ConfigChannel(&htim1, &sConfigOC, TIM_CHANNEL_1);
    HAL_TIM_PWM_ConfigChannel(&htim1, &sConfigOC, TIM_CHANNEL_2);
    HAL_TIM_PWM_ConfigChannel(&htim1, &sConfigOC, TIM_CHANNEL_3);

    /* 配置死區時間和剎車功能（用於馬達保護） */
    sBreakDeadTimeConfig.OffStateRunMode = TIM_OSSR_DISABLE;
    sBreakDeadTimeConfig.OffStateIDLEMode = TIM_OSSI_DISABLE;
    sBreakDeadTimeConfig.LockLevel = TIM_LOCKLEVEL_OFF;
    sBreakDeadTimeConfig.DeadTime = 100;  // 死區時間（約 1.2 µs @ 84 MHz）
    sBreakDeadTimeConfig.BreakState = TIM_BREAK_DISABLE;
    sBreakDeadTimeConfig.BreakPolarity = TIM_BREAKPOLARITY_HIGH;
    sBreakDeadTimeConfig.AutomaticOutput = TIM_AUTOMATICOUTPUT_DISABLE;

    if (HAL_TIMEx_ConfigBreakDeadTime(&htim1, &sBreakDeadTimeConfig) != HAL_OK)
    {
        Error_Handler();
    }

    /* 啟用主輸出 */
    __HAL_TIM_MOE_ENABLE(&htim1);
}

/**
 * 設置 PWM 占空比
 * @param htim: 定時器句柄
 * @param channel: PWM 通道
 * @param duty: 占空比 (0.0 ~ 1.0)
 */
void Set_PWM_DutyCycle(TIM_HandleTypeDef *htim, uint32_t channel, float duty)
{
    /* 限制範圍 */
    if (duty < 0.0f) duty = 0.0f;
    if (duty > 1.0f) duty = 1.0f;

    /* 計算 CCR 值 */
    uint32_t pulse = (uint32_t)(htim->Init.Period * duty);

    /* 更新 CCR */
    switch (channel)
    {
        case TIM_CHANNEL_1:
            __HAL_TIM_SET_COMPARE(htim, TIM_CHANNEL_1, pulse);
            break;
        case TIM_CHANNEL_2:
            __HAL_TIM_SET_COMPARE(htim, TIM_CHANNEL_2, pulse);
            break;
        case TIM_CHANNEL_3:
            __HAL_TIM_SET_COMPARE(htim, TIM_CHANNEL_3, pulse);
            break;
        case TIM_CHANNEL_4:
            __HAL_TIM_SET_COMPARE(htim, TIM_CHANNEL_4, pulse);
            break;
    }
}

/**
 * 動態調整 PWM 頻率
 * @param htim: 定時器句柄
 * @param frequency: 新的 PWM 頻率 (Hz)
 */
void Set_PWM_Frequency(TIM_HandleTypeDef *htim, uint32_t frequency)
{
    uint32_t prescaler = htim->Init.Prescaler;
    uint32_t period = (TIMER_CLOCK / ((prescaler + 1) * frequency)) - 1;

    /* 更新 ARR */
    __HAL_TIM_SET_AUTORELOAD(htim, period);

    /* 生成更新事件以立即應用新參數 */
    HAL_TIM_GenerateEvent(htim, TIM_EVENTSOURCE_UPDATE);
}

/**
 * TIM2 編碼器模式初始化（用於讀取馬達位置）
 */
static void TIM2_Encoder_Init(void)
{
    TIM_Encoder_InitTypeDef sConfig = {0};

    __HAL_RCC_TIM2_CLK_ENABLE();
    __HAL_RCC_GPIOA_CLK_ENABLE();

    /* 配置編碼器輸入腳位 PA0/PA1 */
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = GPIO_PIN_0 | GPIO_PIN_1;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_PULLUP;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF1_TIM2;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* 配置編碼器模式 */
    htim2.Instance = TIM2;
    htim2.Init.Prescaler = 0;
    htim2.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim2.Init.Period = 0xFFFFFFFF;  // 32位計數器
    htim2.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;

    sConfig.EncoderMode = TIM_ENCODERMODE_TI12;  // 雙邊沿計數
    sConfig.IC1Polarity = TIM_ICPOLARITY_RISING;
    sConfig.IC1Selection = TIM_ICSELECTION_DIRECTTI;
    sConfig.IC1Prescaler = TIM_ICPSC_DIV1;
    sConfig.IC1Filter = 0x0F;  // 濾波器
    sConfig.IC2Polarity = TIM_ICPOLARITY_RISING;
    sConfig.IC2Selection = TIM_ICSELECTION_DIRECTTI;
    sConfig.IC2Prescaler = TIM_ICPSC_DIV1;
    sConfig.IC2Filter = 0x0F;

    if (HAL_TIM_Encoder_Init(&htim2, &sConfig) != HAL_OK)
    {
        Error_Handler();
    }

    /* 啟動編碼器 */
    HAL_TIM_Encoder_Start(&htim2, TIM_CHANNEL_ALL);
}

/**
 * 讀取編碼器計數值
 */
int32_t Get_Encoder_Count(void)
{
    return (int32_t)__HAL_TIM_GET_COUNTER(&htim2);
}

/**
 * 系統時鐘配置
 */
void SystemClock_Config(void)
{
    // 時鐘配置（由 CubeMX 生成）
}

/**
 * 錯誤處理
 */
void Error_Handler(void)
{
    __disable_irq();
    while (1)
    {
    }
}
