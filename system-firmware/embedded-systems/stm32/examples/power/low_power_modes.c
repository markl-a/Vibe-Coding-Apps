/**
 * STM32 低功耗模式範例
 *
 * 功能：演示各種低功耗模式的使用
 * 平台：STM32L4（低功耗系列）/ STM32F4
 *
 * 低功耗模式：
 * 1. Sleep Mode - CPU 停止，外設繼續運行
 * 2. Stop Mode - CPU 和大部分外設停止，保持 RAM 數據
 * 3. Standby Mode - 最低功耗，僅保持備份域
 *
 * 喚醒方式：
 * - 外部中斷（按鍵）
 * - RTC 鬧鐘
 * - UART 接收
 * - WDG 超時
 *
 * 功耗對比（STM32L4）：
 * - Run Mode: ~80 µA/MHz
 * - Sleep Mode: ~50 µA/MHz
 * - Stop 2 Mode: ~1.28 µA
 * - Standby Mode: ~0.4 µA
 */

#include "stm32f4xx_hal.h"
#include <stdio.h>
#include <string.h>

/* 低功耗模式選擇 */
typedef enum {
    MODE_RUN = 0,
    MODE_SLEEP,
    MODE_STOP,
    MODE_STANDBY
} PowerMode_t;

/* RTC 句柄 */
RTC_HandleTypeDef hrtc;
UART_HandleTypeDef huart2;

/* 喚醒計數器（保存在備份寄存器） */
#define WAKEUP_COUNTER_REG  RTC_BKP_DR0

/* 函數聲明 */
void SystemClock_Config(void);
static void GPIO_Init(void);
static void RTC_Init(void);
static void UART_Init(void);
void Enter_Sleep_Mode(void);
void Enter_Stop_Mode(void);
void Enter_Standby_Mode(void);
void Configure_WakeUp_Sources(void);

/**
 * 主函數
 */
int main(void)
{
    /* HAL 初始化 */
    HAL_Init();
    SystemClock_Config();

    /* 外設初始化 */
    GPIO_Init();
    UART_Init();
    RTC_Init();

    /* 配置喚醒源 */
    Configure_WakeUp_Sources();

    char msg[100];
    snprintf(msg, sizeof(msg), "\r\n=== STM32 低功耗模式演示 ===\r\n");
    HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);

    /* 檢查復位原因 */
    if (__HAL_RCC_GET_FLAG(RCC_FLAG_SFTRST))
    {
        snprintf(msg, sizeof(msg), "復位原因: 軟體復位\r\n");
    }
    else if (__HAL_RCC_GET_FLAG(RCC_FLAG_PORRST))
    {
        snprintf(msg, sizeof(msg), "復位原因: 上電復位\r\n");
    }
    else if (__HAL_RCC_GET_FLAG(RCC_FLAG_PINRST))
    {
        snprintf(msg, sizeof(msg), "復位原因: 外部復位\r\n");
    }
    else if (__HAL_PWR_GET_FLAG(PWR_FLAG_SB))
    {
        snprintf(msg, sizeof(msg), "從 Standby 模式喚醒\r\n");
        __HAL_PWR_CLEAR_FLAG(PWR_FLAG_SB);
    }
    HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);

    /* 清除復位標誌 */
    __HAL_RCC_CLEAR_RESET_FLAGS();

    /* 讀取喚醒計數器 */
    uint32_t wakeup_count = HAL_RTCEx_BKUPRead(&hrtc, WAKEUP_COUNTER_REG);
    snprintf(msg, sizeof(msg), "喚醒次數: %lu\r\n\r\n", wakeup_count);
    HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);

    /* 主循環 */
    uint8_t mode_select = MODE_SLEEP;

    while (1)
    {
        snprintf(msg, sizeof(msg),
                 "選擇低功耗模式:\r\n"
                 "1 - Sleep Mode\r\n"
                 "2 - Stop Mode\r\n"
                 "3 - Standby Mode\r\n"
                 "按任意鍵進入模式...\r\n");
        HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);

        /* 等待用戶輸入 */
        uint8_t rx_data;
        HAL_UART_Receive(&huart2, &rx_data, 1, HAL_MAX_DELAY);

        if (rx_data >= '1' && rx_data <= '3')
        {
            mode_select = rx_data - '1' + 1;
        }

        /* LED 閃爍指示即將進入低功耗模式 */
        for (int i = 0; i < 5; i++)
        {
            HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
            HAL_Delay(200);
        }

        /* 進入低功耗模式 */
        switch (mode_select)
        {
            case MODE_SLEEP:
                snprintf(msg, sizeof(msg), "進入 Sleep Mode...\r\n");
                HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);
                HAL_Delay(100);  // 等待 UART 發送完成
                Enter_Sleep_Mode();
                snprintf(msg, sizeof(msg), "從 Sleep Mode 喚醒！\r\n\r\n");
                HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);
                break;

            case MODE_STOP:
                snprintf(msg, sizeof(msg), "進入 Stop Mode...\r\n");
                HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);
                HAL_Delay(100);
                Enter_Stop_Mode();
                /* 從 Stop 模式喚醒後需要重新配置時鐘 */
                SystemClock_Config();
                snprintf(msg, sizeof(msg), "從 Stop Mode 喚醒！\r\n\r\n");
                HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);
                break;

            case MODE_STANDBY:
                snprintf(msg, sizeof(msg), "進入 Standby Mode...\r\n");
                HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);
                HAL_Delay(100);

                /* 增加喚醒計數器 */
                wakeup_count++;
                HAL_RTCEx_BKUPWrite(&hrtc, WAKEUP_COUNTER_REG, wakeup_count);

                Enter_Standby_Mode();
                /* 從 Standby 喚醒後會復位，不會執行到這裡 */
                break;
        }

        HAL_Delay(1000);
    }
}

/**
 * 進入 Sleep 模式
 * 功耗：約 50 µA/MHz
 * 喚醒：任何中斷
 * 恢復：立即，不需要重新初始化
 */
void Enter_Sleep_Mode(void)
{
    /* 掛起 SysTick 中斷（可選） */
    HAL_SuspendTick();

    /* 進入 Sleep 模式 */
    HAL_PWR_EnterSLEEPMode(PWR_MAINREGULATOR_ON, PWR_SLEEPENTRY_WFI);

    /* 從 Sleep 模式喚醒後立即執行這裡 */
    HAL_ResumeTick();
}

/**
 * 進入 Stop 模式
 * 功耗：約 1-10 µA
 * 喚醒：外部中斷、RTC、UART
 * 恢復：需要重新配置時鐘
 */
void Enter_Stop_Mode(void)
{
    /* 掛起 SysTick */
    HAL_SuspendTick();

    /* 清除喚醒標誌 */
    __HAL_PWR_CLEAR_FLAG(PWR_FLAG_WU);

    /* 進入 Stop 模式 */
    HAL_PWR_EnterSTOPMode(PWR_LOWPOWERREGULATOR_ON, PWR_STOPENTRY_WFI);

    /* 喚醒後從這裡繼續執行 */
    /* 注意：需要重新配置時鐘，因為 PLL 已關閉 */
    HAL_ResumeTick();
}

/**
 * 進入 Standby 模式
 * 功耗：約 0.4 µA
 * 喚醒：WKUP 腳位、RTC 鬧鐘、外部復位
 * 恢復：系統復位，RAM 數據丟失（備份域除外）
 */
void Enter_Standby_Mode(void)
{
    /* 清除喚醒標誌 */
    __HAL_PWR_CLEAR_FLAG(PWR_FLAG_WU);

    /* 啟用 WKUP 腳位（PA0） */
    HAL_PWR_EnableWakeUpPin(PWR_WAKEUP_PIN1);

    /* 進入 Standby 模式 */
    HAL_PWR_EnterSTANDBYMode();

    /* 不會執行到這裡，從 Standby 喚醒後會復位 */
}

/**
 * 配置喚醒源
 */
void Configure_WakeUp_Sources(void)
{
    /* 配置 RTC 喚醒定時器 */
    // 設置 10 秒後喚醒
    // HAL_RTCEx_SetWakeUpTimer_IT(&hrtc, 10, RTC_WAKEUPCLOCK_CK_SPRE_16BITS);

    /* 配置外部中斷喚醒（按鍵） */
    __HAL_RCC_GPIOC_CLK_ENABLE();

    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = GPIO_PIN_13;  // USER 按鍵
    GPIO_InitStruct.Mode = GPIO_MODE_IT_FALLING;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);

    /* 啟用中斷 */
    HAL_NVIC_SetPriority(EXTI15_10_IRQn, 0, 0);
    HAL_NVIC_EnableIRQ(EXTI15_10_IRQn);
}

/**
 * 外部中斷回調（按鍵喚醒）
 */
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    if (GPIO_Pin == GPIO_PIN_13)
    {
        /* 從低功耗模式喚醒 */
        HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
    }
}

/**
 * EXTI 中斷服務程序
 */
void EXTI15_10_IRQHandler(void)
{
    HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_13);
}

/**
 * RTC 初始化
 */
static void RTC_Init(void)
{
    __HAL_RCC_PWR_CLK_ENABLE();
    HAL_PWR_EnableBkUpAccess();

    /* 啟用 LSE 時鐘 */
    __HAL_RCC_LSE_CONFIG(RCC_LSE_ON);
    while (__HAL_RCC_GET_FLAG(RCC_FLAG_LSERDY) == RESET);

    /* 選擇 RTC 時鐘源 */
    __HAL_RCC_RTC_CONFIG(RCC_RTCCLKSOURCE_LSE);
    __HAL_RCC_RTC_ENABLE();

    /* 配置 RTC */
    hrtc.Instance = RTC;
    hrtc.Init.HourFormat = RTC_HOURFORMAT_24;
    hrtc.Init.AsynchPrediv = 127;
    hrtc.Init.SynchPrediv = 255;
    hrtc.Init.OutPut = RTC_OUTPUT_DISABLE;
    hrtc.Init.OutPutPolarity = RTC_OUTPUT_POLARITY_HIGH;
    hrtc.Init.OutPutType = RTC_OUTPUT_TYPE_OPENDRAIN;

    HAL_RTC_Init(&hrtc);
}

/**
 * GPIO 初始化
 */
static void GPIO_Init(void)
{
    __HAL_RCC_GPIOA_CLK_ENABLE();

    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = GPIO_PIN_5;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);
}

/**
 * UART 初始化
 */
static void UART_Init(void)
{
    __HAL_RCC_USART2_CLK_ENABLE();
    __HAL_RCC_GPIOA_CLK_ENABLE();

    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = GPIO_PIN_2 | GPIO_PIN_3;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF7_USART2;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    huart2.Instance = USART2;
    huart2.Init.BaudRate = 115200;
    huart2.Init.WordLength = UART_WORDLENGTH_8B;
    huart2.Init.StopBits = UART_STOPBITS_1;
    huart2.Init.Parity = UART_PARITY_NONE;
    huart2.Init.Mode = UART_MODE_TX_RX;
    huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;

    HAL_UART_Init(&huart2);
}

/**
 * 系統時鐘配置
 */
void SystemClock_Config(void)
{
    // 時鐘配置代碼
}

/**
 * 錯誤處理
 */
void Error_Handler(void)
{
    __disable_irq();
    while (1) {}
}
