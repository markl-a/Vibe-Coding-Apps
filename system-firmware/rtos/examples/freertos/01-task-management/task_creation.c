/**
 * @file task_creation.c
 * @brief FreeRTOS 任務創建與管理範例
 * @author AI-Assisted Development Team
 * @date 2025-11-17
 *
 * 本範例展示：
 * 1. 基本任務創建
 * 2. 任務參數傳遞
 * 3. 任務優先權設置
 * 4. 任務掛起和恢復
 * 5. 任務刪除
 * 6. 任務狀態查詢
 */

#include "FreeRTOS.h"
#include "task.h"
#include <stdio.h>
#include <string.h>

/* 任務句柄 */
TaskHandle_t task1_handle = NULL;
TaskHandle_t task2_handle = NULL;
TaskHandle_t task3_handle = NULL;
TaskHandle_t control_task_handle = NULL;

/* 任務參數結構 */
typedef struct {
    const char *name;
    uint32_t delay_ms;
    uint32_t counter;
} TaskParams_t;

/**
 * @brief 基本任務 1 - 使用任務參數
 */
void vTask1(void *pvParameters)
{
    TaskParams_t *params = (TaskParams_t *)pvParameters;

    printf("[Task1] Started with params: name=%s, delay=%lu ms\n",
           params->name, params->delay_ms);

    while (1) {
        params->counter++;
        printf("[Task1] Running... Counter=%lu (Priority=%u)\n",
               params->counter,
               uxTaskPriorityGet(NULL));

        /* 延遲 */
        vTaskDelay(pdMS_TO_TICKS(params->delay_ms));

        /* 每 5 次讓出一次 CPU */
        if (params->counter % 5 == 0) {
            printf("[Task1] Yielding CPU...\n");
            taskYIELD();
        }
    }
}

/**
 * @brief 基本任務 2 - 週期性任務
 */
void vTask2(void *pvParameters)
{
    TickType_t xLastWakeTime;
    const TickType_t xFrequency = pdMS_TO_TICKS(1000);
    uint32_t execution_count = 0;

    /* 初始化 last wake time */
    xLastWakeTime = xTaskGetTickCount();

    printf("[Task2] Started (Periodic task)\n");

    while (1) {
        execution_count++;

        /* 檢查堆疊使用情況 */
        UBaseType_t stack_remaining = uxTaskGetStackHighWaterMark(NULL);

        printf("[Task2] Execution #%lu, Stack remaining: %u words\n",
               execution_count, stack_remaining);

        /* 精確的週期性延遲 */
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

/**
 * @brief 任務 3 - 可被控制的任務（掛起/恢復/刪除）
 */
void vTask3(void *pvParameters)
{
    uint32_t count = 0;

    printf("[Task3] Started (Controllable task)\n");

    while (1) {
        count++;
        printf("[Task3] Running... Count=%lu\n", count);

        vTaskDelay(pdMS_TO_TICKS(800));

        /* 模擬：在 count=10 時自願刪除 */
        if (count >= 20) {
            printf("[Task3] Self-deleting after 20 iterations\n");
            task3_handle = NULL;  /* 清除句柄 */
            vTaskDelete(NULL);    /* 刪除自己 */
        }
    }
}

/**
 * @brief 控制任務 - 展示任務管理操作
 */
void vControlTask(void *pvParameters)
{
    printf("[ControlTask] Started\n");

    vTaskDelay(pdMS_TO_TICKS(3000));

    while (1) {
        printf("\n=== Control Task Actions ===\n");

        /* 操作 1: 暫停 Task1 */
        if (task1_handle != NULL) {
            printf("[ControlTask] Suspending Task1...\n");
            vTaskSuspend(task1_handle);
            vTaskDelay(pdMS_TO_TICKS(2000));

            /* 檢查任務狀態 */
            eTaskState state = eTaskGetState(task1_handle);
            printf("[ControlTask] Task1 state: ");
            switch (state) {
                case eRunning:   printf("Running\n"); break;
                case eReady:     printf("Ready\n"); break;
                case eBlocked:   printf("Blocked\n"); break;
                case eSuspended: printf("Suspended\n"); break;
                case eDeleted:   printf("Deleted\n"); break;
                default:         printf("Unknown\n"); break;
            }

            printf("[ControlTask] Resuming Task1...\n");
            vTaskResume(task1_handle);
        }

        vTaskDelay(pdMS_TO_TICKS(2000));

        /* 操作 2: 改變 Task2 優先權 */
        if (task2_handle != NULL) {
            UBaseType_t current_priority = uxTaskPriorityGet(task2_handle);
            printf("[ControlTask] Task2 current priority: %u\n", current_priority);

            printf("[ControlTask] Increasing Task2 priority temporarily...\n");
            vTaskPrioritySet(task2_handle, current_priority + 1);
            vTaskDelay(pdMS_TO_TICKS(2000));

            printf("[ControlTask] Restoring Task2 priority...\n");
            vTaskPrioritySet(task2_handle, current_priority);
        }

        vTaskDelay(pdMS_TO_TICKS(3000));

        /* 操作 3: 檢查 Task3 是否還存在 */
        if (task3_handle != NULL) {
            printf("[ControlTask] Task3 is still running\n");
        } else {
            printf("[ControlTask] Task3 has been deleted\n");
        }

        printf("=== End of Control Cycle ===\n\n");

        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}

/**
 * @brief 列出所有任務資訊
 */
void print_task_list(void)
{
    char task_list_buffer[512];

    printf("\n========== Task List ==========\n");
    printf("Name\t\tState\tPrio\tStack\tNum\n");
    printf("--------------------------------------\n");

    vTaskList(task_list_buffer);
    printf("%s", task_list_buffer);
    printf("===============================\n\n");
}

/**
 * @brief 列出任務運行時統計
 */
void print_runtime_stats(void)
{
#if (configGENERATE_RUN_TIME_STATS == 1)
    char runtime_stats_buffer[512];

    printf("\n========== Runtime Stats ==========\n");
    printf("Task\t\tAbs Time\t%%Time\n");
    printf("--------------------------------------\n");

    vTaskGetRunTimeStats(runtime_stats_buffer);
    printf("%s", runtime_stats_buffer);
    printf("===================================\n\n");
#else
    printf("Runtime stats not enabled (configGENERATE_RUN_TIME_STATS)\n");
#endif
}

/**
 * @brief 監控任務 - 定期打印系統資訊
 */
void vMonitorTask(void *pvParameters)
{
    printf("[MonitorTask] Started\n");

    vTaskDelay(pdMS_TO_TICKS(5000));

    while (1) {
        /* 打印任務列表 */
        print_task_list();

        /* 打印運行時統計 */
        print_runtime_stats();

        /* 打印堆記憶體資訊 */
        size_t free_heap = xPortGetFreeHeapSize();
        size_t min_free_heap = xPortGetMinimumEverFreeHeapSize();
        printf("Heap: Free=%u bytes, Min Ever Free=%u bytes\n\n",
               free_heap, min_free_heap);

        vTaskDelay(pdMS_TO_TICKS(10000));
    }
}

/**
 * @brief 應用程式入口
 */
void app_main(void)
{
    printf("\n");
    printf("==========================================\n");
    printf("  FreeRTOS Task Management Example\n");
    printf("  Build: %s %s\n", __DATE__, __TIME__);
    printf("==========================================\n\n");

    /* 準備任務參數 */
    static TaskParams_t task1_params = {
        .name = "Task1",
        .delay_ms = 500,
        .counter = 0
    };

    /* 創建任務 1 - 帶參數 */
    BaseType_t result = xTaskCreate(
        vTask1,                 /* 任務函數 */
        "Task1",                /* 任務名稱 */
        256,                    /* 堆疊大小 */
        &task1_params,          /* 任務參數 */
        2,                      /* 優先權 */
        &task1_handle           /* 任務句柄 */
    );

    if (result != pdPASS) {
        printf("ERROR: Failed to create Task1\n");
        return;
    }
    printf("Task1 created successfully\n");

    /* 創建任務 2 - 週期性任務 */
    result = xTaskCreate(
        vTask2,
        "Task2",
        256,
        NULL,
        2,
        &task2_handle
    );

    if (result != pdPASS) {
        printf("ERROR: Failed to create Task2\n");
        return;
    }
    printf("Task2 created successfully\n");

    /* 創建任務 3 - 可控制任務 */
    result = xTaskCreate(
        vTask3,
        "Task3",
        256,
        NULL,
        1,
        &task3_handle
    );

    if (result != pdPASS) {
        printf("ERROR: Failed to create Task3\n");
        return;
    }
    printf("Task3 created successfully\n");

    /* 創建控制任務 */
    result = xTaskCreate(
        vControlTask,
        "Control",
        512,
        NULL,
        3,
        &control_task_handle
    );

    if (result != pdPASS) {
        printf("ERROR: Failed to create Control Task\n");
        return;
    }
    printf("Control Task created successfully\n");

    /* 創建監控任務 */
    result = xTaskCreate(
        vMonitorTask,
        "Monitor",
        512,
        NULL,
        1,
        NULL
    );

    if (result != pdPASS) {
        printf("ERROR: Failed to create Monitor Task\n");
        return;
    }
    printf("Monitor Task created successfully\n");

    printf("\nAll tasks created! Starting scheduler...\n\n");

    /* 啟動排程器 */
    vTaskStartScheduler();

    /* 不應該到達這裡 */
    printf("ERROR: Scheduler failed to start!\n");
}

/**
 * @brief 主函數（可選）
 */
int main(void)
{
    /* 硬體初始化（根據平台） */
    // HAL_Init();
    // SystemClock_Config();

    /* 啟動應用程式 */
    app_main();

    return 0;
}
