/**
 * @file main.c
 * @brief FreeRTOS 同步機制範例 - 主程式
 * @author AI-Assisted Development Team
 * @date 2025-11-16
 */

#include "FreeRTOS.h"
#include "task.h"
#include "semphr.h"
#include "event_groups.h"
#include <stdio.h>
#include <string.h>

/* ========== 同步物件 ========== */

/* 信號量 */
SemaphoreHandle_t binary_semaphore;
SemaphoreHandle_t counting_semaphore;
SemaphoreHandle_t mutex;
SemaphoreHandle_t recursive_mutex;

/* 事件組 */
EventGroupHandle_t event_group;

/* 事件位定義 */
#define EVENT_BIT_0     (1 << 0)
#define EVENT_BIT_1     (1 << 1)
#define EVENT_BIT_2     (1 << 2)

/* ========== 共享資源 ========== */

typedef struct {
    uint32_t counter;
    char message[64];
} SharedResource_t;

static SharedResource_t shared_resource = {0};

/* ========== 生產者-消費者範例 ========== */

#define MAX_ITEMS 5

void producer_task(void *pvParameters)
{
    uint32_t item = 0;

    printf("[Producer] Task started\n");

    for (;;) {
        /* 生產資料 */
        vTaskDelay(pdMS_TO_TICKS(300));
        item++;

        /* 嘗試放入項目 */
        if (xSemaphoreGive(counting_semaphore) == pdTRUE) {
            printf("[Producer] Produced item #%lu\n", item);
        } else {
            printf("[Producer] Buffer full, item #%lu dropped\n", item);
        }
    }
}

void consumer_task(void *pvParameters)
{
    uint32_t consumed = 0;

    printf("[Consumer] Task started\n");

    for (;;) {
        /* 等待項目 */
        if (xSemaphoreTake(counting_semaphore, pdMS_TO_TICKS(2000)) == pdTRUE) {
            consumed++;
            printf("[Consumer] Consumed item (total: %lu)\n", consumed);

            /* 模擬處理時間 */
            vTaskDelay(pdMS_TO_TICKS(500));
        } else {
            printf("[Consumer] Timeout, no items available\n");
        }
    }
}

/* ========== 互斥鎖保護範例 ========== */

void writer_task_1(void *pvParameters)
{
    printf("[Writer1] Task started\n");

    for (;;) {
        /* 獲取互斥鎖 */
        if (xSemaphoreTake(mutex, portMAX_DELAY) == pdTRUE) {
            /* 臨界區 - 修改共享資源 */
            shared_resource.counter++;
            snprintf(shared_resource.message,
                     sizeof(shared_resource.message),
                     "Updated by Writer1, count=%lu",
                     shared_resource.counter);

            printf("[Writer1] %s\n", shared_resource.message);

            /* 模擬處理 */
            vTaskDelay(pdMS_TO_TICKS(100));

            /* 釋放互斥鎖 */
            xSemaphoreGive(mutex);
        }

        vTaskDelay(pdMS_TO_TICKS(400));
    }
}

void writer_task_2(void *pvParameters)
{
    printf("[Writer2] Task started\n");

    for (;;) {
        /* 獲取互斥鎖 */
        if (xSemaphoreTake(mutex, portMAX_DELAY) == pdTRUE) {
            /* 臨界區 - 修改共享資源 */
            shared_resource.counter++;
            snprintf(shared_resource.message,
                     sizeof(shared_resource.message),
                     "Updated by Writer2, count=%lu",
                     shared_resource.counter);

            printf("[Writer2] %s\n", shared_resource.message);

            /* 模擬處理 */
            vTaskDelay(pdMS_TO_TICKS(100));

            /* 釋放互斥鎖 */
            xSemaphoreGive(mutex);
        }

        vTaskDelay(pdMS_TO_TICKS(600));
    }
}

void reader_task(void *pvParameters)
{
    printf("[Reader] Task started\n");

    for (;;) {
        /* 讀取共享資源 */
        if (xSemaphoreTake(mutex, portMAX_DELAY) == pdTRUE) {
            printf("[Reader] Reading: %s\n", shared_resource.message);
            xSemaphoreGive(mutex);
        }

        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

/* ========== 遞迴互斥鎖範例 ========== */

uint32_t recursive_function(uint32_t level)
{
    uint32_t result = 0;

    /* 獲取遞迴互斥鎖 */
    xSemaphoreTakeRecursive(recursive_mutex, portMAX_DELAY);

    printf("  Recursive level: %lu\n", level);

    if (level > 0) {
        result = level + recursive_function(level - 1);
    }

    /* 釋放遞迴互斥鎖 */
    xSemaphoreGiveRecursive(recursive_mutex);

    return result;
}

void recursive_task(void *pvParameters)
{
    printf("[Recursive] Task started\n");

    for (;;) {
        printf("[Recursive] Calling recursive function...\n");
        uint32_t result = recursive_function(3);
        printf("[Recursive] Result: %lu\n\n", result);

        vTaskDelay(pdMS_TO_TICKS(3000));
    }
}

/* ========== 事件組範例 ========== */

void event_setter_task(void *pvParameters)
{
    printf("[EventSetter] Task started\n");

    for (;;) {
        vTaskDelay(pdMS_TO_TICKS(1000));

        /* 設定 BIT_0 */
        printf("[EventSetter] Setting BIT_0\n");
        xEventGroupSetBits(event_group, EVENT_BIT_0);

        vTaskDelay(pdMS_TO_TICKS(1500));

        /* 設定 BIT_1 */
        printf("[EventSetter] Setting BIT_1\n");
        xEventGroupSetBits(event_group, EVENT_BIT_1);

        vTaskDelay(pdMS_TO_TICKS(2000));

        /* 設定 BIT_2 */
        printf("[EventSetter] Setting BIT_2\n");
        xEventGroupSetBits(event_group, EVENT_BIT_2);
    }
}

void event_waiter_any_task(void *pvParameters)
{
    const EventBits_t bits_to_wait = EVENT_BIT_0 | EVENT_BIT_1;

    printf("[EventWaiter-ANY] Task started\n");

    for (;;) {
        /* 等待任一事件（OR） */
        EventBits_t bits = xEventGroupWaitBits(
            event_group,
            bits_to_wait,
            pdTRUE,         /* 清除位 */
            pdFALSE,        /* 等待任一位 */
            portMAX_DELAY
        );

        if (bits & EVENT_BIT_0) {
            printf("[EventWaiter-ANY] BIT_0 occurred!\n");
        }
        if (bits & EVENT_BIT_1) {
            printf("[EventWaiter-ANY] BIT_1 occurred!\n");
        }
    }
}

void event_waiter_all_task(void *pvParameters)
{
    const EventBits_t all_bits = EVENT_BIT_0 | EVENT_BIT_1 | EVENT_BIT_2;

    printf("[EventWaiter-ALL] Task started\n");

    for (;;) {
        /* 等待所有事件（AND） */
        printf("[EventWaiter-ALL] Waiting for all events...\n");

        xEventGroupWaitBits(
            event_group,
            all_bits,
            pdTRUE,         /* 清除位 */
            pdTRUE,         /* 等待所有位 */
            portMAX_DELAY
        );

        printf("[EventWaiter-ALL] All events occurred!\n\n");
    }
}

/* ========== 二進制信號量 ISR 範例 ========== */

void interrupt_handler_task(void *pvParameters)
{
    printf("[ISR Handler] Task started\n");

    for (;;) {
        /* 等待 ISR 信號量 */
        if (xSemaphoreTake(binary_semaphore, portMAX_DELAY) == pdTRUE) {
            printf("[ISR Handler] Interrupt occurred, processing...\n");

            /* 處理中斷事件 */
            vTaskDelay(pdMS_TO_TICKS(100));
        }
    }
}

/* 模擬 ISR 觸發任務 */
void isr_trigger_task(void *pvParameters)
{
    printf("[ISR Trigger] Task started (simulating interrupts)\n");

    for (;;) {
        vTaskDelay(pdMS_TO_TICKS(2500));

        /* 模擬 ISR 釋放信號量 */
        printf("[ISR Trigger] Simulating interrupt...\n");
        xSemaphoreGive(binary_semaphore);
    }
}

/* ========== 主程式 ========== */

int main(void)
{
    printf("\n");
    printf("===========================================\n");
    printf("  FreeRTOS Synchronization Examples\n");
    printf("  Build: %s %s\n", __DATE__, __TIME__);
    printf("===========================================\n\n");

    /* 創建同步物件 */
    printf("Creating synchronization objects...\n");

    binary_semaphore = xSemaphoreCreateBinary();
    counting_semaphore = xSemaphoreCreateCounting(MAX_ITEMS, 0);
    mutex = xSemaphoreCreateMutex();
    recursive_mutex = xSemaphoreCreateRecursiveMutex();
    event_group = xEventGroupCreate();

    if (!binary_semaphore || !counting_semaphore || !mutex ||
        !recursive_mutex || !event_group) {
        printf("ERROR: Failed to create synchronization objects\n");
        return -1;
    }

    printf("All synchronization objects created successfully!\n\n");

    /* 創建生產者-消費者任務 */
    printf("=== Producer-Consumer Demo ===\n");
    xTaskCreate(producer_task, "Producer", 256, NULL, 2, NULL);
    xTaskCreate(consumer_task, "Consumer", 256, NULL, 2, NULL);

    /* 創建互斥鎖保護任務 */
    printf("\n=== Mutex Protection Demo ===\n");
    xTaskCreate(writer_task_1, "Writer1", 256, NULL, 2, NULL);
    xTaskCreate(writer_task_2, "Writer2", 256, NULL, 2, NULL);
    xTaskCreate(reader_task, "Reader", 256, NULL, 1, NULL);

    /* 創建遞迴互斥鎖任務 */
    printf("\n=== Recursive Mutex Demo ===\n");
    xTaskCreate(recursive_task, "Recursive", 512, NULL, 2, NULL);

    /* 創建事件組任務 */
    printf("\n=== Event Group Demo ===\n");
    xTaskCreate(event_setter_task, "EventSetter", 256, NULL, 2, NULL);
    xTaskCreate(event_waiter_any_task, "WaiterANY", 256, NULL, 2, NULL);
    xTaskCreate(event_waiter_all_task, "WaiterALL", 256, NULL, 2, NULL);

    /* 創建 ISR 處理任務 */
    printf("\n=== Binary Semaphore (ISR) Demo ===\n");
    xTaskCreate(interrupt_handler_task, "ISRHandler", 256, NULL, 3, NULL);
    xTaskCreate(isr_trigger_task, "ISRTrigger", 256, NULL, 1, NULL);

    printf("\nStarting FreeRTOS scheduler...\n\n");

    /* 啟動排程器 */
    vTaskStartScheduler();

    /* 永遠不應該到達這裡 */
    printf("ERROR: Scheduler failed to start!\n");
    return 0;
}
