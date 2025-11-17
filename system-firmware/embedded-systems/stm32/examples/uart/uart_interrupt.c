/**
 * STM32 UART 中斷接收範例
 *
 * 功能：使用中斷方式接收 UART 數據並處理命令
 * 平台：STM32F4
 * 開發環境：STM32CubeIDE
 *
 * 命令：
 * - "LED ON"  : 點亮 LED
 * - "LED OFF" : 關閉 LED
 * - "STATUS"  : 查詢系統狀態
 */

#include "main.h"
#include <string.h>
#include <stdio.h>

/* UART 句柄 */
UART_HandleTypeDef huart2;

/* 接收緩衝區 */
#define RX_BUFFER_SIZE 100
uint8_t rxBuffer[RX_BUFFER_SIZE];
uint8_t rxIndex = 0;
uint8_t rxByte;
volatile uint8_t rxComplete = 0;

/* LED 狀態 */
volatile uint8_t ledState = 0;

/* 函數原型 */
void SystemClock_Config(void);
static void UART2_Init(void);
static void GPIO_Init(void);
static void ProcessCommand(void);
static void UART_SendString(const char* str);

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

    /* 發送歡迎訊息 */
    UART_SendString("\r\n=== STM32 UART 中斷命令範例 ===\r\n");
    UART_SendString("可用命令：\r\n");
    UART_SendString("  LED ON  - 點亮 LED\r\n");
    UART_SendString("  LED OFF - 關閉 LED\r\n");
    UART_SendString("  STATUS  - 查詢狀態\r\n");
    UART_SendString("\r\n> ");

    /* 啟動中斷接收 */
    HAL_UART_Receive_IT(&huart2, &rxByte, 1);

    /* 主循環 */
    while (1)
    {
        /* 處理接收完成的命令 */
        if (rxComplete)
        {
            rxComplete = 0;
            ProcessCommand();

            /* 顯示提示符 */
            UART_SendString("> ");
        }
    }
}

/**
 * UART2 初始化函數
 */
static void UART2_Init(void)
{
    __HAL_RCC_USART2_CLK_ENABLE();

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

    /* 啟用 UART 中斷 */
    HAL_NVIC_SetPriority(USART2_IRQn, 0, 0);
    HAL_NVIC_EnableIRQ(USART2_IRQn);
}

/**
 * GPIO 初始化函數
 */
static void GPIO_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    /* 啟用時鐘 */
    __HAL_RCC_GPIOA_CLK_ENABLE();

    /* 配置 UART TX/RX */
    GPIO_InitStruct.Pin = GPIO_PIN_2 | GPIO_PIN_3;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF7_USART2;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* 配置 LED (PA5) */
    GPIO_InitStruct.Pin = GPIO_PIN_5;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
    GPIO_InitStruct.Alternate = 0;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* LED 初始狀態為關閉 */
    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);
}

/**
 * 處理接收到的命令
 */
static void ProcessCommand(void)
{
    /* 字串結尾 */
    rxBuffer[rxIndex] = '\0';

    /* 處理命令 */
    if (strcmp((char*)rxBuffer, "LED ON") == 0)
    {
        HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);
        ledState = 1;
        UART_SendString("LED 已點亮\r\n");
    }
    else if (strcmp((char*)rxBuffer, "LED OFF") == 0)
    {
        HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);
        ledState = 0;
        UART_SendString("LED 已關閉\r\n");
    }
    else if (strcmp((char*)rxBuffer, "STATUS") == 0)
    {
        char statusMsg[100];
        snprintf(statusMsg, sizeof(statusMsg),
                "系統狀態：\r\n  LED: %s\r\n  運行時間: %lu ms\r\n",
                ledState ? "ON" : "OFF", HAL_GetTick());
        UART_SendString(statusMsg);
    }
    else if (rxIndex > 0)  // 忽略空白命令
    {
        UART_SendString("未知命令：");
        UART_SendString((char*)rxBuffer);
        UART_SendString("\r\n");
    }

    /* 重置緩衝區 */
    rxIndex = 0;
}

/**
 * 發送字串到 UART
 */
static void UART_SendString(const char* str)
{
    HAL_UART_Transmit(&huart2, (uint8_t*)str, strlen(str), HAL_MAX_DELAY);
}

/**
 * UART 接收完成回調函數
 */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart->Instance == USART2)
    {
        /* 回顯接收到的字元 */
        HAL_UART_Transmit(&huart2, &rxByte, 1, 10);

        /* 處理接收到的字元 */
        if (rxByte == '\r' || rxByte == '\n')
        {
            /* 換行符號，命令結束 */
            UART_SendString("\r\n");
            rxComplete = 1;
        }
        else if (rxByte == '\b' || rxByte == 127)  // Backspace
        {
            if (rxIndex > 0)
            {
                rxIndex--;
                UART_SendString(" \b");  // 清除字元
            }
        }
        else if (rxIndex < RX_BUFFER_SIZE - 1)
        {
            /* 儲存字元 */
            rxBuffer[rxIndex++] = rxByte;
        }

        /* 繼續接收下一個字元 */
        HAL_UART_Receive_IT(&huart2, &rxByte, 1);
    }
}

/**
 * USART2 中斷處理函數
 */
void USART2_IRQHandler(void)
{
    HAL_UART_IRQHandler(&huart2);
}

/**
 * 錯誤處理函數
 */
void Error_Handler(void)
{
    __disable_irq();
    while (1)
    {
    }
}
