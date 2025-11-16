/**
 * @file tasks.h
 * @brief FreeRTOS 任務聲明
 * @author AI-Assisted Development Team
 * @date 2025-11-16
 */

#ifndef TASKS_H
#define TASKS_H

#include "FreeRTOS.h"
#include "task.h"

/* ========== 任務函數聲明 ========== */

/**
 * @brief LED 閃爍任務
 * @param pvParameters 任務參數（未使用）
 */
void vLEDTask(void *pvParameters);

/**
 * @brief 數據處理任務
 * @param pvParameters 任務參數（未使用）
 */
void vDataProcessTask(void *pvParameters);

/**
 * @brief 系統監控任務
 * @param pvParameters 任務參數（未使用）
 */
void vMonitorTask(void *pvParameters);

/* ========== 任務句柄 ========== */

extern TaskHandle_t led_task_handle;
extern TaskHandle_t data_task_handle;
extern TaskHandle_t monitor_task_handle;

/* ========== 鉤子函數聲明 ========== */

/**
 * @brief 閒置任務鉤子
 * @note 在 FreeRTOSConfig.h 中需要設定 configUSE_IDLE_HOOK 為 1
 */
void vApplicationIdleHook(void);

/**
 * @brief 滴答鉤子
 * @note 在 FreeRTOSConfig.h 中需要設定 configUSE_TICK_HOOK 為 1
 */
void vApplicationTickHook(void);

/**
 * @brief 堆疊溢位鉤子
 * @param xTask 發生溢位的任務句柄
 * @param pcTaskName 發生溢位的任務名稱
 * @note 在 FreeRTOSConfig.h 中需要設定 configCHECK_FOR_STACK_OVERFLOW 為 1 或 2
 */
void vApplicationStackOverflowHook(TaskHandle_t xTask, char *pcTaskName);

/**
 * @brief 記憶體分配失敗鉤子
 * @note 在 FreeRTOSConfig.h 中需要設定 configUSE_MALLOC_FAILED_HOOK 為 1
 */
void vApplicationMallocFailedHook(void);

/* ========== 工具函數聲明 ========== */

/**
 * @brief 任務管理示範函數
 * @details 展示任務掛起、恢復、優先權修改等操作
 */
void task_management_demo(void);

#endif /* TASKS_H */
