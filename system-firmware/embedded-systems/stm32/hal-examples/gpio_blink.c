/**
 * STM32 HAL GPIO LED 閃爍範例
 *
 * 功能：使用 HAL 函式庫控制 LED 閃爍
 * 平台：STM32F4 (適用於大部分 STM32)
 * 開發環境：STM32CubeIDE
 */

#include "main.h"

/* 使用 STM32CubeMX 生成的初始化函數 */
void SystemClock_Config(void);
static void MX_GPIO_Init(void);

int main(void)
{
    /* 初始化 HAL 函式庫 */
    HAL_Init();

    /* 配置系統時鐘 */
    SystemClock_Config();

    /* 初始化 GPIO */
    MX_GPIO_Init();

    /* 主循環 */
    while (1)
    {
        /* 切換 LED 狀態 (PA5 for STM32F4 Nucleo) */
        HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);

        /* 延遲 500ms */
        HAL_Delay(500);
    }
}

/**
 * GPIO 初始化函數
 * 配置 PA5 為輸出（LED）
 */
static void MX_GPIO_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    /* 啟用 GPIOA 時鐘 */
    __HAL_RCC_GPIOA_CLK_ENABLE();

    /* 設定 PA5 為低電平 */
    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);

    /* 配置 PA5 為推挽輸出 */
    GPIO_InitStruct.Pin = GPIO_PIN_5;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);
}

/**
 * 錯誤處理函數
 */
void Error_Handler(void)
{
    /* 錯誤時無限循環 */
    while (1)
    {
        /* 可以在這裡加入錯誤指示，例如快速閃爍 LED */
    }
}
