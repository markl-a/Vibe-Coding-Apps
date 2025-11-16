/**
 * STM32 FreeRTOS 多任務範例
 *
 * 功能：演示 FreeRTOS 基本任務建立和執行
 * 平台：STM32F4
 * RTOS：FreeRTOS
 */

#include "main.h"
#include "cmsis_os.h"
#include <stdio.h>

/* 任務句柄 */
osThreadId task1Handle;
osThreadId task2Handle;
osThreadId task3Handle;

/* 任務函數宣告 */
void Task1_LED_Blink(void const *argument);
void Task2_UART_Print(void const *argument);
void Task3_Sensor_Read(void const *argument);

/**
 * 主函數
 */
int main(void)
{
    /* HAL 初始化 */
    HAL_Init();
    SystemClock_Config();
    MX_GPIO_Init();
    MX_USART2_UART_Init();

    /* 建立任務 */
    osThreadDef(task1, Task1_LED_Blink, osPriorityNormal, 0, 128);
    task1Handle = osThreadCreate(osThread(task1), NULL);

    osThreadDef(task2, Task2_UART_Print, osPriorityNormal, 0, 128);
    task2Handle = osThreadCreate(osThread(task2), NULL);

    osThreadDef(task3, Task3_Sensor_Read, osPriorityHigh, 0, 128);
    task3Handle = osThreadCreate(osThread(task3), NULL);

    /* 啟動排程器 */
    osKernelStart();

    /* 不應該到達這裡 */
    while (1)
    {
    }
}

/**
 * 任務 1: LED 閃爍
 * 優先級：普通
 * 週期：1000ms
 */
void Task1_LED_Blink(void const *argument)
{
    for (;;)
    {
        HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
        osDelay(1000);
    }
}

/**
 * 任務 2: UART 訊息輸出
 * 優先級：普通
 * 週期：2000ms
 */
void Task2_UART_Print(void const *argument)
{
    uint32_t counter = 0;
    char msg[50];

    for (;;)
    {
        snprintf(msg, sizeof(msg), "FreeRTOS Task 2 - Count: %lu\r\n", counter++);
        HAL_UART_Transmit(&huart2, (uint8_t *)msg, strlen(msg), HAL_MAX_DELAY);
        osDelay(2000);
    }
}

/**
 * 任務 3: 感測器讀取（模擬）
 * 優先級：高
 * 週期：500ms
 */
void Task3_Sensor_Read(void const *argument)
{
    for (;;)
    {
        /* 模擬感測器讀取 */
        uint32_t sensor_value = HAL_GetTick() % 100;

        /* 這裡可以加入實際的感測器讀取程式碼 */

        osDelay(500);
    }
}
