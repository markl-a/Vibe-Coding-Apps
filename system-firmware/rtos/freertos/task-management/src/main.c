/**
 * @file main.c
 * @brief FreeRTOS 任務管理範例 - 主程式
 * @author AI-Assisted Development Team
 * @date 2025-11-16
 */

#include "FreeRTOS.h"
#include "task.h"
#include "config.h"
#include "tasks.h"
#include "task_manager.h"
#include <stdio.h>

/* 任務句柄 */
TaskHandle_t led_task_handle = NULL;
TaskHandle_t data_task_handle = NULL;
TaskHandle_t monitor_task_handle = NULL;

/* 外部函數聲明 */
extern void SystemClock_Config(void);
extern void GPIO_Init(void);
extern void UART_Init(void);

/**
 * @brief LED 閃爍任務
 * @param pvParameters 任務參數（未使用）
 */
void vLEDTask(void *pvParameters)
{
    TickType_t last_wake_time;
    const TickType_t frequency = pdMS_TO_TICKS(LED_TOGGLE_DELAY_MS);
    uint32_t toggle_count = 0;

    /* 初始化 last_wake_time */
    last_wake_time = xTaskGetTickCount();

    printf("[LED Task] Started\n");

    for (;;) {
        /* LED 切換 */
        HAL_GPIO_TogglePin(LED_GPIO_PORT, LED_GPIO_PIN);
        toggle_count++;

        /* 每 10 次切換打印一次 */
        if (toggle_count % 10 == 0) {
            printf("[LED Task] Toggle count: %lu\n", toggle_count);

            /* 檢查堆疊使用情況 */
            UBaseType_t stack_remaining = uxTaskGetStackHighWaterMark(NULL);
            printf("[LED Task] Stack remaining: %u words\n", stack_remaining);
        }

        /* 週期性延遲 */
        vTaskDelayUntil(&last_wake_time, frequency);
    }
}

/**
 * @brief 數據處理任務
 * @param pvParameters 任務參數（未使用）
 */
void vDataProcessTask(void *pvParameters)
{
    uint32_t data_counter = 0;

    printf("[Data Task] Started\n");

    for (;;) {
        /* 模擬數據處理 */
        data_counter++;

        /* 簡單的數據處理計算 */
        volatile uint32_t result = 0;
        for (uint32_t i = 0; i < 1000; i++) {
            result += i * data_counter;
        }

        printf("[Data Task] Processed data #%lu, result: %lu\n",
               data_counter, result);

        /* 延遲 */
        vTaskDelay(pdMS_TO_TICKS(DATA_PROCESS_DELAY_MS));
    }
}

/**
 * @brief 系統監控任務
 * @param pvParameters 任務參數（未使用）
 */
void vMonitorTask(void *pvParameters)
{
    char task_list_buffer[256];
    char runtime_stats_buffer[256];

    printf("[Monitor Task] Started\n");

    /* 啟動延遲，讓其他任務先運行 */
    vTaskDelay(pdMS_TO_TICKS(2000));

    for (;;) {
        printf("\n========== System Monitor ==========\n");

        /* 獲取任務列表 */
        printf("Task List:\n");
        printf("Name\t\tState\tPrio\tStack\tNum\n");
        vTaskList(task_list_buffer);
        printf("%s\n", task_list_buffer);

        /* 獲取運行時統計 */
        #if (configGENERATE_RUN_TIME_STATS == 1)
        printf("Runtime Stats:\n");
        printf("Task\t\tAbs Time\t%%Time\n");
        vTaskGetRunTimeStats(runtime_stats_buffer);
        printf("%s\n", runtime_stats_buffer);
        #endif

        /* 系統堆記憶體資訊 */
        size_t free_heap = xPortGetFreeHeapSize();
        size_t min_free_heap = xPortGetMinimumEverFreeHeapSize();
        printf("Heap: Free=%u bytes, Min Ever Free=%u bytes\n",
               free_heap, min_free_heap);

        printf("====================================\n\n");

        /* 監控週期 */
        vTaskDelay(pdMS_TO_TICKS(MONITOR_DELAY_MS));
    }
}

/**
 * @brief 閒置任務鉤子
 */
void vApplicationIdleHook(void)
{
    /* 在閒置時可以進入低功耗模式 */
    /* 這裡只是計數示範 */
    static uint32_t idle_count = 0;
    idle_count++;
}

/**
 * @brief 滴答鉤子
 */
void vApplicationTickHook(void)
{
    /* 每個滴答調用一次 */
    /* 不要在這裡放太多程式碼 */
}

/**
 * @brief 堆疊溢位鉤子
 */
void vApplicationStackOverflowHook(TaskHandle_t xTask, char *pcTaskName)
{
    printf("ERROR: Stack overflow in task: %s\n", pcTaskName);

    /* 堆疊溢位是嚴重錯誤，應該停止系統 */
    taskDISABLE_INTERRUPTS();
    for (;;) {
        /* 停在這裡等待除錯 */
    }
}

/**
 * @brief 記憶體分配失敗鉤子
 */
void vApplicationMallocFailedHook(void)
{
    printf("ERROR: Memory allocation failed!\n");

    taskDISABLE_INTERRUPTS();
    for (;;) {
        /* 停在這裡等待除錯 */
    }
}

/**
 * @brief 任務管理示範函數
 */
void task_management_demo(void)
{
    printf("\n=== Task Management Demo ===\n");

    /* 示範 1: 掛起和恢復任務 */
    printf("Suspending LED task...\n");
    vTaskSuspend(led_task_handle);
    vTaskDelay(pdMS_TO_TICKS(3000));

    printf("Resuming LED task...\n");
    vTaskResume(led_task_handle);
    vTaskDelay(pdMS_TO_TICKS(2000));

    /* 示範 2: 改變任務優先權 */
    UBaseType_t current_priority = uxTaskPriorityGet(data_task_handle);
    printf("Data task current priority: %u\n", current_priority);

    printf("Increasing data task priority...\n");
    vTaskPrioritySet(data_task_handle, current_priority + 1);
    vTaskDelay(pdMS_TO_TICKS(2000));

    printf("Restoring data task priority...\n");
    vTaskPrioritySet(data_task_handle, current_priority);

    /* 示範 3: 查詢任務狀態 */
    eTaskState task_state = eTaskGetState(led_task_handle);
    printf("LED task state: ");
    switch (task_state) {
        case eRunning:   printf("Running\n"); break;
        case eReady:     printf("Ready\n"); break;
        case eBlocked:   printf("Blocked\n"); break;
        case eSuspended: printf("Suspended\n"); break;
        case eDeleted:   printf("Deleted\n"); break;
        default:         printf("Unknown\n"); break;
    }
}

/**
 * @brief 主程式入口
 */
int main(void)
{
    /* HAL 初始化 */
    HAL_Init();

    /* 配置系統時鐘 */
    SystemClock_Config();

    /* GPIO 初始化 */
    GPIO_Init();

    /* UART 初始化（用於 printf） */
    UART_Init();

    printf("\n");
    printf("===========================================\n");
    printf("  FreeRTOS Task Management Example\n");
    printf("  Build: %s %s\n", __DATE__, __TIME__);
    printf("===========================================\n\n");

    /* 創建 LED 任務 */
    BaseType_t result = xTaskCreate(
        vLEDTask,                   /* 任務函數 */
        "LED",                      /* 任務名稱 */
        LED_TASK_STACK_SIZE,        /* 堆疊大小 */
        NULL,                       /* 任務參數 */
        LED_TASK_PRIORITY,          /* 優先權 */
        &led_task_handle            /* 任務句柄 */
    );

    if (result != pdPASS) {
        printf("ERROR: Failed to create LED task\n");
        return -1;
    }

    /* 創建數據處理任務 */
    result = xTaskCreate(
        vDataProcessTask,
        "DataProc",
        DATA_TASK_STACK_SIZE,
        NULL,
        DATA_TASK_PRIORITY,
        &data_task_handle
    );

    if (result != pdPASS) {
        printf("ERROR: Failed to create data processing task\n");
        return -1;
    }

    /* 創建監控任務 */
    result = xTaskCreate(
        vMonitorTask,
        "Monitor",
        MONITOR_TASK_STACK_SIZE,
        NULL,
        MONITOR_TASK_PRIORITY,
        &monitor_task_handle
    );

    if (result != pdPASS) {
        printf("ERROR: Failed to create monitor task\n");
        return -1;
    }

    printf("All tasks created successfully!\n");
    printf("Starting FreeRTOS scheduler...\n\n");

    /* 啟動排程器 */
    vTaskStartScheduler();

    /* 永遠不應該到達這裡 */
    printf("ERROR: Scheduler failed to start!\n");

    for (;;) {
        /* 無限循環 */
    }

    return 0;
}
