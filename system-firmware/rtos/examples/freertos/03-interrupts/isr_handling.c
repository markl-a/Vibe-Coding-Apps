/**
 * @file isr_handling.c
 * @brief FreeRTOS 中斷處理範例
 * @author AI-Assisted Development Team
 * @date 2025-11-17
 *
 * 本範例展示：
 * 1. 中斷服務常式(ISR)與任務通訊
 * 2. 從 ISR 發送到佇列
 * 3. 從 ISR 釋放信號量
 * 4. 從 ISR 發送任務通知
 * 5. 中斷優先權管理
 * 6. 延遲中斷處理
 */

#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include "semphr.h"
#include <stdio.h>
#include <stdbool.h>

/* 同步物件 */
QueueHandle_t isr_queue = NULL;
SemaphoreHandle_t isr_binary_sem = NULL;
SemaphoreHandle_t isr_counting_sem = NULL;
TaskHandle_t notification_handler_task_handle = NULL;

/* 中斷統計 */
static struct {
    volatile uint32_t button_interrupts;
    volatile uint32_t timer_interrupts;
    volatile uint32_t uart_interrupts;
    volatile uint32_t total_interrupts;
} isr_stats = {0};

/* 資料結構 */
typedef struct {
    uint8_t interrupt_source;  /* 0=Button, 1=Timer, 2=UART */
    uint32_t timestamp;
    uint32_t data;
} ISRData_t;

/**
 * @brief 模擬按鈕中斷處理函數
 * @note 這是一個中斷服務常式 (ISR)
 */
void EXTI_Button_IRQHandler(void)
{
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    static uint32_t button_press_count = 0;

    /* 增加中斷計數 */
    isr_stats.button_interrupts++;
    isr_stats.total_interrupts++;
    button_press_count++;

    /* 準備資料 */
    ISRData_t isr_data;
    isr_data.interrupt_source = 0;  /* Button */
    isr_data.timestamp = xTaskGetTickCountFromISR();
    isr_data.data = button_press_count;

    /* 從 ISR 發送到佇列 */
    xQueueSendFromISR(isr_queue, &isr_data, &xHigherPriorityTaskWoken);

    /* 釋放二進制信號量 */
    xSemaphoreGiveFromISR(isr_binary_sem, &xHigherPriorityTaskWoken);

    /* 如果需要，執行上下文切換 */
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}

/**
 * @brief 模擬定時器中斷處理函數
 */
void TIM_Period_IRQHandler(void)
{
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    static uint32_t timer_tick_count = 0;

    isr_stats.timer_interrupts++;
    isr_stats.total_interrupts++;
    timer_tick_count++;

    /* 每 10 次定時器中斷才處理一次 */
    if (timer_tick_count % 10 == 0) {
        ISRData_t isr_data;
        isr_data.interrupt_source = 1;  /* Timer */
        isr_data.timestamp = xTaskGetTickCountFromISR();
        isr_data.data = timer_tick_count;

        /* 發送到佇列（使用 SendToBack） */
        xQueueSendToBackFromISR(isr_queue, &isr_data, &xHigherPriorityTaskWoken);

        /* 釋放計數信號量 */
        xSemaphoreGiveFromISR(isr_counting_sem, &xHigherPriorityTaskWoken);
    }

    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}

/**
 * @brief 模擬 UART 接收中斷處理函數
 */
void UART_RX_IRQHandler(void)
{
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    static uint32_t rx_byte_count = 0;

    isr_stats.uart_interrupts++;
    isr_stats.total_interrupts++;
    rx_byte_count++;

    /* 模擬接收到的資料 */
    uint8_t received_byte = 0xAA;  /* 模擬值 */

    /* 發送任務通知（最輕量的同步機制） */
    vTaskNotifyGiveFromISR(notification_handler_task_handle,
                          &xHigherPriorityTaskWoken);

    /* 高優先權資料，發送到佇列前端 */
    ISRData_t isr_data;
    isr_data.interrupt_source = 2;  /* UART */
    isr_data.timestamp = xTaskGetTickCountFromISR();
    isr_data.data = received_byte;

    xQueueSendToFrontFromISR(isr_queue, &isr_data, &xHigherPriorityTaskWoken);

    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}

/**
 * @brief 佇列處理任務 - 處理從 ISR 發送的資料
 */
void vISRQueueHandlerTask(void *pvParameters)
{
    ISRData_t received_data;

    printf("[ISRQueueHandler] Started\n");

    while (1) {
        /* 等待從 ISR 接收資料 */
        if (xQueueReceive(isr_queue, &received_data, portMAX_DELAY) == pdTRUE) {
            const char *source_name[] = {"Button", "Timer", "UART"};

            printf("[ISRQueueHandler] Interrupt from %s: data=0x%lX, time=%lu\n",
                   source_name[received_data.interrupt_source],
                   received_data.data,
                   received_data.timestamp);

            /* 根據中斷源進行處理 */
            switch (received_data.interrupt_source) {
                case 0:  /* Button */
                    printf("  -> Button pressed %lu times\n", received_data.data);
                    break;

                case 1:  /* Timer */
                    printf("  -> Timer tick count: %lu\n", received_data.data);
                    break;

                case 2:  /* UART */
                    printf("  -> UART received byte: 0x%02lX\n", received_data.data);
                    break;
            }
        }
    }
}

/**
 * @brief 二進制信號量處理任務
 */
void vBinarySemHandlerTask(void *pvParameters)
{
    uint32_t event_count = 0;

    printf("[BinarySemHandler] Started\n");

    while (1) {
        /* 等待二進制信號量 */
        if (xSemaphoreTake(isr_binary_sem, portMAX_DELAY) == pdTRUE) {
            event_count++;
            printf("[BinarySemHandler] Binary semaphore received! Event #%lu\n",
                   event_count);

            /* 處理事件 */
            vTaskDelay(pdMS_TO_TICKS(50));
        }
    }
}

/**
 * @brief 計數信號量處理任務
 */
void vCountingSemHandlerTask(void *pvParameters)
{
    uint32_t sem_count = 0;

    printf("[CountingSemHandler] Started\n");

    while (1) {
        /* 等待計數信號量 */
        if (xSemaphoreTake(isr_counting_sem, portMAX_DELAY) == pdTRUE) {
            sem_count++;
            printf("[CountingSemHandler] Counting semaphore taken! Count=%lu\n",
                   sem_count);

            /* 批次處理多個項目 */
            UBaseType_t items_available = uxSemaphoreGetCount(isr_counting_sem);
            if (items_available > 0) {
                printf("[CountingSemHandler] %u more items in queue\n",
                       items_available);
            }

            vTaskDelay(pdMS_TO_TICKS(100));
        }
    }
}

/**
 * @brief 任務通知處理任務
 */
void vNotificationHandlerTask(void *pvParameters)
{
    uint32_t notification_value;

    printf("[NotificationHandler] Started\n");

    while (1) {
        /* 等待任務通知 */
        notification_value = ulTaskNotifyTake(pdTRUE,  /* 清除計數 */
                                             portMAX_DELAY);

        if (notification_value > 0) {
            printf("[NotificationHandler] Received %lu notification(s)\n",
                   notification_value);

            /* 處理通知 */
            printf("  -> Processing UART interrupt notification\n");
        }
    }
}

/**
 * @brief 延遲中斷處理任務（Deferred Interrupt Handler）
 */
void vDeferredInterruptTask(void *pvParameters)
{
    printf("[DeferredInterrupt] Started (high priority)\n");

    while (1) {
        /* 等待信號量（由 ISR 釋放） */
        if (xSemaphoreTake(isr_binary_sem, portMAX_DELAY) == pdTRUE) {
            /* 這裡執行需要較長時間的中斷處理 */
            printf("[DeferredInterrupt] Performing time-consuming ISR work...\n");

            /* 模擬複雜處理 */
            volatile uint32_t calc = 0;
            for (uint32_t i = 0; i < 10000; i++) {
                calc += i;
            }

            printf("[DeferredInterrupt] Deferred processing complete (result=%lu)\n",
                   calc);
        }
    }
}

/**
 * @brief ISR 模擬任務 - 定期觸發模擬中斷
 */
void vISRSimulatorTask(void *pvParameters)
{
    uint32_t cycle = 0;

    printf("[ISRSimulator] Started (simulating interrupts)\n");

    vTaskDelay(pdMS_TO_TICKS(2000));

    while (1) {
        cycle++;

        printf("\n[ISRSimulator] === Cycle %lu ===\n", cycle);

        /* 模擬按鈕中斷 */
        if (cycle % 3 == 0) {
            printf("[ISRSimulator] Simulating button interrupt...\n");
            EXTI_Button_IRQHandler();
        }

        vTaskDelay(pdMS_TO_TICKS(500));

        /* 模擬定時器中斷 */
        if (cycle % 2 == 0) {
            printf("[ISRSimulator] Simulating timer interrupt...\n");
            TIM_Period_IRQHandler();
        }

        vTaskDelay(pdMS_TO_TICKS(500));

        /* 模擬 UART 中斷 */
        if (cycle % 5 == 0) {
            printf("[ISRSimulator] Simulating UART interrupt...\n");
            UART_RX_IRQHandler();
        }

        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

/**
 * @brief 統計任務 - 顯示中斷統計資訊
 */
void vISRStatsTask(void *pvParameters)
{
    printf("[ISRStats] Started\n");

    vTaskDelay(pdMS_TO_TICKS(5000));

    while (1) {
        printf("\n========== ISR Statistics ==========\n");
        printf("Button interrupts:  %lu\n", isr_stats.button_interrupts);
        printf("Timer interrupts:   %lu\n", isr_stats.timer_interrupts);
        printf("UART interrupts:    %lu\n", isr_stats.uart_interrupts);
        printf("Total interrupts:   %lu\n", isr_stats.total_interrupts);

        /* 佇列狀態 */
        UBaseType_t queue_waiting = uxQueueMessagesWaiting(isr_queue);
        printf("\nISR Queue status:\n");
        printf("  Messages waiting: %u\n", queue_waiting);

        /* 信號量狀態 */
        UBaseType_t counting_sem_count = uxSemaphoreGetCount(isr_counting_sem);
        printf("\nCounting Semaphore: %u\n", counting_sem_count);

        printf("====================================\n\n");

        vTaskDelay(pdMS_TO_TICKS(10000));
    }
}

/**
 * @brief 臨界區範例任務
 */
void vCriticalSectionTask(void *pvParameters)
{
    volatile uint32_t shared_counter = 0;

    printf("[CriticalSection] Started\n");

    while (1) {
        /* 方法 1: 使用 taskENTER_CRITICAL/taskEXIT_CRITICAL */
        taskENTER_CRITICAL();
        {
            shared_counter++;
            printf("[CriticalSection] In critical section, counter=%lu\n",
                   shared_counter);
            /* 這裡的程式碼不會被中斷打斷 */
        }
        taskEXIT_CRITICAL();

        vTaskDelay(pdMS_TO_TICKS(2000));

        /* 方法 2: 使用 taskDISABLE_INTERRUPTS/taskENABLE_INTERRUPTS */
        /* 注意：這會禁用所有可被遮蔽的中斷，應謹慎使用 */
        taskDISABLE_INTERRUPTS();
        {
            shared_counter += 10;
            /* 極短的臨界區 */
        }
        taskENABLE_INTERRUPTS();

        vTaskDelay(pdMS_TO_TICKS(3000));
    }
}

/**
 * @brief 應用程式入口
 */
void app_main(void)
{
    printf("\n");
    printf("==========================================\n");
    printf("  FreeRTOS ISR Handling Example\n");
    printf("  Build: %s %s\n", __DATE__, __TIME__);
    printf("==========================================\n\n");

    /* 創建佇列 */
    isr_queue = xQueueCreate(20, sizeof(ISRData_t));
    if (isr_queue == NULL) {
        printf("ERROR: Failed to create ISR queue\n");
        return;
    }
    printf("ISR queue created\n");

    /* 創建信號量 */
    isr_binary_sem = xSemaphoreCreateBinary();
    if (isr_binary_sem == NULL) {
        printf("ERROR: Failed to create binary semaphore\n");
        return;
    }
    printf("Binary semaphore created\n");

    isr_counting_sem = xSemaphoreCreateCounting(10, 0);
    if (isr_counting_sem == NULL) {
        printf("ERROR: Failed to create counting semaphore\n");
        return;
    }
    printf("Counting semaphore created\n\n");

    /* 創建處理任務 */
    xTaskCreate(vISRQueueHandlerTask, "ISRQueue", 512, NULL, 3, NULL);
    xTaskCreate(vBinarySemHandlerTask, "BinSem", 256, NULL, 2, NULL);
    xTaskCreate(vCountingSemHandlerTask, "CountSem", 256, NULL, 2, NULL);

    /* 創建任務通知處理任務 */
    xTaskCreate(vNotificationHandlerTask, "Notification", 256, NULL, 3,
                &notification_handler_task_handle);

    /* 創建延遲中斷處理任務 */
    xTaskCreate(vDeferredInterruptTask, "Deferred", 512, NULL, 4, NULL);

    /* 創建臨界區範例任務 */
    xTaskCreate(vCriticalSectionTask, "Critical", 256, NULL, 1, NULL);

    /* 創建 ISR 模擬任務 */
    xTaskCreate(vISRSimulatorTask, "ISRSim", 512, NULL, 2, NULL);

    /* 創建統計任務 */
    xTaskCreate(vISRStatsTask, "ISRStats", 512, NULL, 1, NULL);

    printf("All tasks created! Starting scheduler...\n\n");

    /* 啟動排程器 */
    vTaskStartScheduler();

    printf("ERROR: Scheduler failed to start!\n");
}

int main(void)
{
    app_main();
    return 0;
}
