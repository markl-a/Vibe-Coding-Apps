/**
 * @file config.h
 * @brief FreeRTOS 任務管理配置文件
 * @author AI-Assisted Development Team
 * @date 2025-11-16
 */

#ifndef CONFIG_H
#define CONFIG_H

#include "stm32f4xx_hal.h"

/* ========== 任務配置 ========== */

/* LED 任務配置 */
#define LED_TASK_STACK_SIZE         128     /* 堆疊大小（words） */
#define LED_TASK_PRIORITY           1       /* 任務優先權 */
#define LED_TOGGLE_DELAY_MS         500     /* LED 切換延遲（ms） */

/* 數據處理任務配置 */
#define DATA_TASK_STACK_SIZE        256     /* 堆疊大小（words） */
#define DATA_TASK_PRIORITY          2       /* 任務優先權 */
#define DATA_PROCESS_DELAY_MS       1000    /* 處理延遲（ms） */

/* 監控任務配置 */
#define MONITOR_TASK_STACK_SIZE     512     /* 堆疊大小（words） */
#define MONITOR_TASK_PRIORITY       3       /* 任務優先權 */
#define MONITOR_DELAY_MS            5000    /* 監控週期（ms） */

/* ========== GPIO 配置 ========== */

/* LED GPIO 配置（以 STM32F4 Discovery 板為例） */
#define LED_GPIO_PORT               GPIOD
#define LED_GPIO_PIN                GPIO_PIN_12  /* 綠色 LED */
#define LED_GPIO_CLOCK_ENABLE()     __HAL_RCC_GPIOD_CLK_ENABLE()

/* ========== UART 配置 ========== */

/* UART 用於 printf 輸出 */
#define DEBUG_UART                  USART2
#define DEBUG_UART_BAUDRATE         115200
#define DEBUG_UART_TX_PIN           GPIO_PIN_2
#define DEBUG_UART_RX_PIN           GPIO_PIN_3
#define DEBUG_UART_GPIO_PORT        GPIOA
#define DEBUG_UART_GPIO_AF          GPIO_AF7_USART2
#define DEBUG_UART_CLOCK_ENABLE()   __HAL_RCC_USART2_CLK_ENABLE()
#define DEBUG_UART_GPIO_CLOCK_ENABLE() __HAL_RCC_GPIOA_CLK_ENABLE()

/* ========== 系統配置 ========== */

/* 系統時鐘頻率（Hz） */
#define SYSTEM_CLOCK_FREQ           168000000

/* FreeRTOS 滴答率（Hz） */
#define TICK_RATE_HZ                1000

/* ========== 除錯配置 ========== */

/* 啟用堆疊檢查 */
#define ENABLE_STACK_CHECK          1

/* 啟用任務統計 */
#define ENABLE_TASK_STATS           1

/* 啟用運行時統計 */
#define ENABLE_RUNTIME_STATS        1

/* ========== 記憶體配置 ========== */

/* FreeRTOS 堆大小（bytes） */
#define TOTAL_HEAP_SIZE             (20 * 1024)  /* 20 KB */

/* ========== 應用程式版本 ========== */

#define APP_VERSION_MAJOR           1
#define APP_VERSION_MINOR           0
#define APP_VERSION_PATCH           0

#endif /* CONFIG_H */
