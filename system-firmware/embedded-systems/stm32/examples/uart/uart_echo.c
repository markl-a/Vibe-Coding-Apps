/**
 * STM32 UART 回音範例
 *
 * 功能：接收串口數據並回傳（Echo）
 * 平台：STM32F4 (適用於大部分 STM32)
 * 開發環境：STM32CubeIDE
 *
 * 硬體連接：
 * - UART2: PA2 (TX), PA3 (RX)
 * - 波特率：115200
 */

#include "main.h"
#include <string.h>
#include <stdio.h>

/* UART 句柄 */
UART_HandleTypeDef huart2;

/* 緩衝區 */
uint8_t rxBuffer[100];
uint8_t txBuffer[100];
volatile uint8_t rxComplete = 0;

/* 函數原型 */
void SystemClock_Config(void);
static void UART2_Init(void);
static void GPIO_Init(void);

int main(void)
{
    /* 初始化 HAL */
    HAL_Init();

    /* 配置系統時鐘 */
    SystemClock_Config();

    /* 初始化 GPIO */
    GPIO_Init();

    /* 初始化 UART2 */
    UART2_Init();

    /* 歡迎訊息 */
    const char* welcome = "\r\n=== STM32 UART Echo 範例 ===\r\n";
    HAL_UART_Transmit(&huart2, (uint8_t*)welcome, strlen(welcome), HAL_MAX_DELAY);

    const char* instruction = "請輸入文字（按 Enter 結束）：\r\n";
    HAL_UART_Transmit(&huart2, (uint8_t*)instruction, strlen(instruction), HAL_MAX_DELAY);

    /* 主循環 */
    while (1)
    {
        /* 接收單個字元 */
        uint8_t receivedChar;
        if (HAL_UART_Receive(&huart2, &receivedChar, 1, 100) == HAL_OK)
        {
            /* 回傳接收到的字元 */
            HAL_UART_Transmit(&huart2, &receivedChar, 1, HAL_MAX_DELAY);

            /* 如果是換行符號，添加提示 */
            if (receivedChar == '\r' || receivedChar == '\n')
            {
                const char* prompt = "\r\n> ";
                HAL_UART_Transmit(&huart2, (uint8_t*)prompt, strlen(prompt), HAL_MAX_DELAY);
            }
        }
    }
}

/**
 * UART2 初始化函數
 * 配置為 115200 8N1
 */
static void UART2_Init(void)
{
    /* 啟用 USART2 時鐘 */
    __HAL_RCC_USART2_CLK_ENABLE();

    /* 配置 UART 參數 */
    huart2.Instance = USART2;
    huart2.Init.BaudRate = 115200;
    huart2.Init.WordLength = UART_WORDLENGTH_8B;
    huart2.Init.StopBits = UART_STOPBITS_1;
    huart2.Init.Parity = UART_PARITY_NONE;
    huart2.Init.Mode = UART_MODE_TX_RX;
    huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
    huart2.Init.OverSampling = UART_OVERSAMPLING_16;

    if (HAL_UART_Init(&huart2) != HAL_OK)
    {
        Error_Handler();
    }
}

/**
 * GPIO 初始化函數
 * 配置 UART2 的 GPIO 腳位
 */
static void GPIO_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    /* 啟用 GPIOA 時鐘 */
    __HAL_RCC_GPIOA_CLK_ENABLE();

    /* 配置 UART2 TX (PA2) 和 RX (PA3) */
    GPIO_InitStruct.Pin = GPIO_PIN_2 | GPIO_PIN_3;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF7_USART2;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);
}

/**
 * 錯誤處理函數
 */
void Error_Handler(void)
{
    /* 錯誤時無限循環 */
    __disable_irq();
    while (1)
    {
    }
}

#ifdef USE_FULL_ASSERT
/**
 * Assert 失敗回調函數
 */
void assert_failed(uint8_t *file, uint32_t line)
{
    /* 可以在這裡添加用戶程式碼來報告錯誤 */
}
#endif
