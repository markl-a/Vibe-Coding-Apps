/**
 * @file memory_example.c
 * @brief FreeRTOS 記憶體管理範例
 * @author AI-Assisted Development Team
 * @date 2025-11-17
 *
 * 本範例展示：
 * 1. 動態記憶體分配 (pvPortMalloc/vPortFree)
 * 2. 記憶體池管理
 * 3. 堆記憶體監控
 * 4. 記憶體洩漏檢測
 * 5. 堆疊溢位檢查
 * 6. 不同的堆分配方案 (heap_1 ~ heap_5)
 */

#include "FreeRTOS.h"
#include "task.h"
#include "semphr.h"
#include <stdio.h>
#include <string.h>

/* 記憶體統計 */
static struct {
    uint32_t total_allocations;
    uint32_t total_frees;
    uint32_t current_allocations;
    uint32_t failed_allocations;
    size_t peak_usage;
} memory_stats = {0};

/* 記憶體塊結構（用於記憶體池） */
#define MEMORY_BLOCK_SIZE   64
#define MEMORY_POOL_SIZE    10

typedef struct {
    uint8_t data[MEMORY_BLOCK_SIZE];
    bool in_use;
    uint32_t alloc_time;
} MemoryBlock_t;

static MemoryBlock_t memory_pool[MEMORY_POOL_SIZE];
static SemaphoreHandle_t pool_mutex = NULL;

/**
 * @brief 初始化記憶體池
 */
void init_memory_pool(void)
{
    pool_mutex = xSemaphoreCreateMutex();

    for (int i = 0; i < MEMORY_POOL_SIZE; i++) {
        memory_pool[i].in_use = false;
        memory_pool[i].alloc_time = 0;
        memset(memory_pool[i].data, 0, MEMORY_BLOCK_SIZE);
    }

    printf("[MemoryPool] Initialized with %d blocks of %d bytes each\n",
           MEMORY_POOL_SIZE, MEMORY_BLOCK_SIZE);
}

/**
 * @brief 從記憶體池分配
 */
MemoryBlock_t* allocate_from_pool(void)
{
    MemoryBlock_t *block = NULL;

    xSemaphoreTake(pool_mutex, portMAX_DELAY);

    for (int i = 0; i < MEMORY_POOL_SIZE; i++) {
        if (!memory_pool[i].in_use) {
            memory_pool[i].in_use = true;
            memory_pool[i].alloc_time = xTaskGetTickCount();
            block = &memory_pool[i];
            printf("[MemoryPool] Allocated block #%d\n", i);
            break;
        }
    }

    if (block == NULL) {
        printf("[MemoryPool] No free blocks available!\n");
    }

    xSemaphoreGive(pool_mutex);

    return block;
}

/**
 * @brief 釋放記憶體池塊
 */
void free_to_pool(MemoryBlock_t *block)
{
    if (block == NULL) return;

    xSemaphoreTake(pool_mutex, portMAX_DELAY);

    int index = block - memory_pool;
    if (index >= 0 && index < MEMORY_POOL_SIZE) {
        memory_pool[index].in_use = false;
        memset(memory_pool[index].data, 0, MEMORY_BLOCK_SIZE);
        printf("[MemoryPool] Freed block #%d (was allocated for %lu ticks)\n",
               index,
               xTaskGetTickCount() - memory_pool[index].alloc_time);
    }

    xSemaphoreGive(pool_mutex);
}

/**
 * @brief 顯示記憶體池狀態
 */
void print_pool_status(void)
{
    int used_count = 0;

    xSemaphoreTake(pool_mutex, portMAX_DELAY);

    printf("\n[MemoryPool] Status:\n");
    for (int i = 0; i < MEMORY_POOL_SIZE; i++) {
        if (memory_pool[i].in_use) {
            printf("  Block #%d: IN USE (allocated at tick %lu)\n",
                   i, memory_pool[i].alloc_time);
            used_count++;
        }
    }

    printf("  Used: %d / %d blocks (%.1f%%)\n",
           used_count, MEMORY_POOL_SIZE,
           (float)used_count / MEMORY_POOL_SIZE * 100.0f);

    xSemaphoreGive(pool_mutex);
}

/**
 * @brief 動態記憶體分配範例任務
 */
void vDynamicAllocTask(void *pvParameters)
{
    printf("[DynamicAlloc] Started\n");

    vTaskDelay(pdMS_TO_TICKS(1000));

    while (1) {
        /* 分配不同大小的記憶體 */
        size_t sizes[] = {32, 64, 128, 256, 512};
        void *ptrs[5] = {NULL};

        printf("\n[DynamicAlloc] Allocating memory...\n");

        for (int i = 0; i < 5; i++) {
            ptrs[i] = pvPortMalloc(sizes[i]);

            if (ptrs[i] != NULL) {
                memory_stats.total_allocations++;
                memory_stats.current_allocations++;

                printf("  Allocated %u bytes at %p\n", sizes[i], ptrs[i]);

                /* 寫入資料 */
                memset(ptrs[i], 0xAA, sizes[i]);

                /* 更新峰值使用 */
                size_t current_free = xPortGetFreeHeapSize();
                size_t current_used = configTOTAL_HEAP_SIZE - current_free;
                if (current_used > memory_stats.peak_usage) {
                    memory_stats.peak_usage = current_used;
                }
            } else {
                memory_stats.failed_allocations++;
                printf("  Failed to allocate %u bytes!\n", sizes[i]);
            }

            vTaskDelay(pdMS_TO_TICKS(100));
        }

        printf("[DynamicAlloc] Free heap: %u bytes\n",
               xPortGetFreeHeapSize());

        vTaskDelay(pdMS_TO_TICKS(1000));

        /* 釋放記憶體 */
        printf("[DynamicAlloc] Freeing memory...\n");

        for (int i = 0; i < 5; i++) {
            if (ptrs[i] != NULL) {
                vPortFree(ptrs[i]);
                memory_stats.total_frees++;
                memory_stats.current_allocations--;
                printf("  Freed %u bytes\n", sizes[i]);
            }
        }

        printf("[DynamicAlloc] Free heap after free: %u bytes\n\n",
               xPortGetFreeHeapSize());

        vTaskDelay(pdMS_TO_TICKS(3000));
    }
}

/**
 * @brief 記憶體池使用範例任務
 */
void vMemoryPoolTask(void *pvParameters)
{
    printf("[MemoryPoolTask] Started\n");

    vTaskDelay(pdMS_TO_TICKS(2000));

    while (1) {
        /* 分配多個記憶體塊 */
        MemoryBlock_t *blocks[3];
        int allocated_count = 0;

        printf("\n[MemoryPoolTask] Allocating from pool...\n");

        for (int i = 0; i < 3; i++) {
            blocks[i] = allocate_from_pool();
            if (blocks[i] != NULL) {
                /* 寫入一些資料 */
                snprintf((char*)blocks[i]->data, MEMORY_BLOCK_SIZE,
                        "Block allocated at tick %lu", xTaskGetTickCount());
                allocated_count++;
            }
            vTaskDelay(pdMS_TO_TICKS(200));
        }

        /* 顯示記憶體池狀態 */
        print_pool_status();

        vTaskDelay(pdMS_TO_TICKS(2000));

        /* 釋放記憶體塊 */
        printf("[MemoryPoolTask] Freeing pool blocks...\n");
        for (int i = 0; i < allocated_count; i++) {
            free_to_pool(blocks[i]);
            vTaskDelay(pdMS_TO_TICKS(100));
        }

        vTaskDelay(pdMS_TO_TICKS(4000));
    }
}

/**
 * @brief 記憶體洩漏檢測範例（故意造成洩漏以演示）
 */
void vMemoryLeakDemoTask(void *pvParameters)
{
    printf("[MemoryLeakDemo] Started (WARNING: This task demonstrates memory leaks!)\n");

    vTaskDelay(pdMS_TO_TICKS(3000));

    uint32_t leak_count = 0;

    while (1) {
        /* 故意分配但不釋放（模擬記憶體洩漏） */
        void *leaked_ptr = pvPortMalloc(16);

        if (leaked_ptr != NULL) {
            leak_count++;
            memory_stats.total_allocations++;
            memory_stats.current_allocations++;

            printf("[MemoryLeakDemo] Leaked 16 bytes (total leaks: %lu)\n",
                   leak_count);

            /* 寫入一些資料 */
            memset(leaked_ptr, 0xBB, 16);

            /* 注意：我們故意不呼叫 vPortFree(leaked_ptr) */
        } else {
            printf("[MemoryLeakDemo] Allocation failed - heap exhausted!\n");
            printf("[MemoryLeakDemo] Task will suspend itself\n");
            vTaskSuspend(NULL);
        }

        vTaskDelay(pdMS_TO_TICKS(2000));

        /* 為了安全，只洩漏少量記憶體 */
        if (leak_count >= 50) {
            printf("[MemoryLeakDemo] Leak limit reached, suspending task\n");
            vTaskSuspend(NULL);
        }
    }
}

/**
 * @brief 堆疊使用監控任務
 */
void vStackMonitorTask(void *pvParameters)
{
    printf("[StackMonitor] Started\n");

    vTaskDelay(pdMS_TO_TICKS(5000));

    while (1) {
        printf("\n========== Stack Usage Monitor ==========\n");

        /* 遍歷所有任務並檢查堆疊使用情況 */
        TaskStatus_t *task_status_array;
        volatile UBaseType_t task_count;
        uint32_t total_runtime;

        /* 獲取任務數量 */
        task_count = uxTaskGetNumberOfTasks();

        /* 分配陣列 */
        task_status_array = pvPortMalloc(task_count * sizeof(TaskStatus_t));

        if (task_status_array != NULL) {
            /* 獲取任務狀態 */
            task_count = uxTaskGetSystemState(task_status_array,
                                             task_count,
                                             &total_runtime);

            printf("Task Name          Stack High Water Mark\n");
            printf("--------------------------------------------\n");

            for (UBaseType_t i = 0; i < task_count; i++) {
                UBaseType_t stack_remaining = task_status_array[i].usStackHighWaterMark;
                printf("%-18s %5u words",
                       task_status_array[i].pcTaskName,
                       stack_remaining);

                /* 警告：堆疊剩餘過少 */
                if (stack_remaining < 50) {
                    printf(" *** WARNING: Low stack! ***");
                }
                printf("\n");
            }

            vPortFree(task_status_array);
        }

        printf("=========================================\n\n");

        vTaskDelay(pdMS_TO_TICKS(8000));
    }
}

/**
 * @brief 記憶體統計任務
 */
void vMemoryStatsTask(void *pvParameters)
{
    printf("[MemoryStats] Started\n");

    vTaskDelay(pdMS_TO_TICKS(6000));

    while (1) {
        size_t free_heap = xPortGetFreeHeapSize();
        size_t min_free_heap = xPortGetMinimumEverFreeHeapSize();

        printf("\n========== Memory Statistics ==========\n");
        printf("Heap Information:\n");
        printf("  Total heap size:        %u bytes\n", configTOTAL_HEAP_SIZE);
        printf("  Current free heap:      %u bytes (%.1f%%)\n",
               free_heap,
               (float)free_heap / configTOTAL_HEAP_SIZE * 100.0f);
        printf("  Minimum ever free heap: %u bytes (%.1f%%)\n",
               min_free_heap,
               (float)min_free_heap / configTOTAL_HEAP_SIZE * 100.0f);
        printf("  Peak heap usage:        %u bytes\n", memory_stats.peak_usage);

        printf("\nAllocation Statistics:\n");
        printf("  Total allocations:      %lu\n", memory_stats.total_allocations);
        printf("  Total frees:            %lu\n", memory_stats.total_frees);
        printf("  Current allocations:    %lu\n", memory_stats.current_allocations);
        printf("  Failed allocations:     %lu\n", memory_stats.failed_allocations);
        printf("  Memory leaks:           %lu blocks\n",
               memory_stats.total_allocations - memory_stats.total_frees);

        /* 記憶體池狀態 */
        print_pool_status();

        printf("=======================================\n\n");

        vTaskDelay(pdMS_TO_TICKS(10000));
    }
}

/**
 * @brief 堆疊溢位鉤子函數
 */
void vApplicationStackOverflowHook(TaskHandle_t xTask, char *pcTaskName)
{
    printf("\n!!! STACK OVERFLOW DETECTED !!!\n");
    printf("Task: %s\n", pcTaskName);
    printf("Task handle: %p\n", (void*)xTask);

    /* 在實際應用中，這裡應該記錄錯誤並可能重置系統 */
    taskDISABLE_INTERRUPTS();
    for (;;) {
        /* 停止在這裡以便除錯 */
    }
}

/**
 * @brief 記憶體分配失敗鉤子函數
 */
void vApplicationMallocFailedHook(void)
{
    printf("\n!!! MALLOC FAILED !!!\n");
    printf("Free heap: %u bytes\n", xPortGetFreeHeapSize());

    /* 記錄失敗 */
    memory_stats.failed_allocations++;

    /* 在實際應用中，應該採取恢復措施 */
}

/**
 * @brief 應用程式入口
 */
void app_main(void)
{
    printf("\n");
    printf("==========================================\n");
    printf("  FreeRTOS Memory Management Example\n");
    printf("  Build: %s %s\n", __DATE__, __TIME__);
    printf("  Total Heap: %u bytes\n", configTOTAL_HEAP_SIZE);
    printf("==========================================\n\n");

    /* 初始化記憶體池 */
    init_memory_pool();

    /* 創建任務 */
    xTaskCreate(vDynamicAllocTask, "DynAlloc", 512, NULL, 2, NULL);
    xTaskCreate(vMemoryPoolTask, "PoolTask", 512, NULL, 2, NULL);
    xTaskCreate(vStackMonitorTask, "StackMon", 1024, NULL, 1, NULL);
    xTaskCreate(vMemoryStatsTask, "MemStats", 1024, NULL, 1, NULL);

    /* 創建記憶體洩漏演示任務（可選，用於演示） */
    // xTaskCreate(vMemoryLeakDemoTask, "LeakDemo", 256, NULL, 1, NULL);

    printf("\nAll tasks created! Starting scheduler...\n\n");
    printf("Initial free heap: %u bytes\n\n", xPortGetFreeHeapSize());

    /* 啟動排程器 */
    vTaskStartScheduler();

    printf("ERROR: Scheduler failed to start!\n");
}

int main(void)
{
    app_main();
    return 0;
}
