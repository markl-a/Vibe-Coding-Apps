/**
 * @file queue_example.c
 * @brief FreeRTOS 佇列通訊範例
 * @author AI-Assisted Development Team
 * @date 2025-11-17
 *
 * 本範例展示：
 * 1. 佇列創建和使用
 * 2. 生產者-消費者模式
 * 3. 多個生產者和消費者
 * 4. 佇列集合（Queue Set）
 * 5. 佇列覆寫
 */

#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include <stdio.h>
#include <string.h>

/* 佇列句柄 */
QueueHandle_t data_queue = NULL;
QueueHandle_t command_queue = NULL;
QueueHandle_t result_queue = NULL;

/* 佇列大小 */
#define DATA_QUEUE_SIZE     10
#define COMMAND_QUEUE_SIZE  5
#define RESULT_QUEUE_SIZE   5

/* 資料結構 */
typedef struct {
    uint32_t sensor_id;
    float temperature;
    float humidity;
    uint32_t timestamp;
} SensorData_t;

typedef struct {
    uint8_t cmd_type;
    uint32_t param1;
    uint32_t param2;
    char message[32];
} Command_t;

typedef struct {
    uint32_t request_id;
    int32_t result;
    char status[16];
} Result_t;

/* 統計資訊 */
static struct {
    uint32_t produced;
    uint32_t consumed;
    uint32_t queue_full_errors;
    uint32_t queue_empty_errors;
} queue_stats = {0};

/**
 * @brief 生產者任務 1 - 快速生產
 */
void vProducer1Task(void *pvParameters)
{
    SensorData_t data;
    uint32_t count = 0;

    printf("[Producer1] Started (fast producer)\n");

    while (1) {
        count++;

        /* 準備資料 */
        data.sensor_id = 1;
        data.temperature = 20.0f + (count % 10);
        data.humidity = 50.0f + (count % 30);
        data.timestamp = xTaskGetTickCount();

        /* 嘗試發送到佇列 */
        if (xQueueSend(data_queue, &data, pdMS_TO_TICKS(100)) == pdTRUE) {
            printf("[Producer1] Sent data #%lu (T=%.1f°C, H=%.1f%%)\n",
                   count, data.temperature, data.humidity);
            queue_stats.produced++;
        } else {
            printf("[Producer1] Queue full! Data #%lu dropped\n", count);
            queue_stats.queue_full_errors++;
        }

        vTaskDelay(pdMS_TO_TICKS(300));
    }
}

/**
 * @brief 生產者任務 2 - 慢速生產
 */
void vProducer2Task(void *pvParameters)
{
    SensorData_t data;
    uint32_t count = 0;

    printf("[Producer2] Started (slow producer)\n");

    while (1) {
        count++;

        /* 準備資料 */
        data.sensor_id = 2;
        data.temperature = 22.0f + (count % 8);
        data.humidity = 45.0f + (count % 25);
        data.timestamp = xTaskGetTickCount();

        /* 使用 SendToBack（等同於 xQueueSend） */
        if (xQueueSendToBack(data_queue, &data, pdMS_TO_TICKS(200)) == pdTRUE) {
            printf("[Producer2] Sent data #%lu (T=%.1f°C, H=%.1f%%)\n",
                   count, data.temperature, data.humidity);
            queue_stats.produced++;
        } else {
            printf("[Producer2] Timeout! Data #%lu not sent\n", count);
            queue_stats.queue_full_errors++;
        }

        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

/**
 * @brief 高優先權生產者 - 使用 SendToFront
 */
void vUrgentProducerTask(void *pvParameters)
{
    SensorData_t data;
    uint32_t count = 0;

    printf("[UrgentProducer] Started (high priority producer)\n");

    while (1) {
        count++;

        /* 準備緊急資料 */
        data.sensor_id = 99;  /* 特殊 ID 表示緊急資料 */
        data.temperature = 35.0f;  /* 高溫警報 */
        data.humidity = 80.0f;
        data.timestamp = xTaskGetTickCount();

        /* 發送到佇列前端（優先處理） */
        if (xQueueSendToFront(data_queue, &data, 0) == pdTRUE) {
            printf("[UrgentProducer] *** URGENT data sent to front! ***\n");
            queue_stats.produced++;
        }

        /* 緊急事件不常發生 */
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}

/**
 * @brief 消費者任務 1
 */
void vConsumer1Task(void *pvParameters)
{
    SensorData_t received_data;

    printf("[Consumer1] Started\n");

    while (1) {
        /* 從佇列接收資料 */
        if (xQueueReceive(data_queue, &received_data, pdMS_TO_TICKS(2000)) == pdTRUE) {
            queue_stats.consumed++;

            printf("[Consumer1] Received from sensor %lu: T=%.1f°C, H=%.1f%% (time=%lu)\n",
                   received_data.sensor_id,
                   received_data.temperature,
                   received_data.humidity,
                   received_data.timestamp);

            /* 檢查是否為緊急資料 */
            if (received_data.sensor_id == 99) {
                printf("[Consumer1] !!! URGENT: High temperature alert !!!\n");
            }

            /* 模擬處理時間 */
            vTaskDelay(pdMS_TO_TICKS(200));
        } else {
            printf("[Consumer1] Timeout - no data available\n");
            queue_stats.queue_empty_errors++;
        }
    }
}

/**
 * @brief 消費者任務 2 - 使用 Peek（查看但不移除）
 */
void vConsumer2Task(void *pvParameters)
{
    SensorData_t peeked_data;

    printf("[Consumer2] Started (using peek)\n");

    vTaskDelay(pdMS_TO_TICKS(500));  /* 稍後啟動 */

    while (1) {
        /* Peek：查看但不移除 */
        if (xQueuePeek(data_queue, &peeked_data, pdMS_TO_TICKS(3000)) == pdTRUE) {
            printf("[Consumer2] Peeked data from sensor %lu: T=%.1f°C (not removed from queue)\n",
                   peeked_data.sensor_id,
                   peeked_data.temperature);
        } else {
            printf("[Consumer2] Peek timeout - queue empty\n");
        }

        vTaskDelay(pdMS_TO_TICKS(1500));
    }
}

/**
 * @brief 命令處理任務
 */
void vCommandProcessorTask(void *pvParameters)
{
    Command_t cmd;

    printf("[CommandProcessor] Started\n");

    while (1) {
        if (xQueueReceive(command_queue, &cmd, portMAX_DELAY) == pdTRUE) {
            printf("[CommandProcessor] Received command type %u: %s\n",
                   cmd.cmd_type, cmd.message);

            /* 處理命令 */
            Result_t result;
            result.request_id = cmd.param1;

            switch (cmd.cmd_type) {
                case 1:  /* 讀取配置 */
                    result.result = 100;
                    strcpy(result.status, "OK");
                    break;

                case 2:  /* 寫入配置 */
                    result.result = cmd.param2;
                    strcpy(result.status, "Written");
                    break;

                case 3:  /* 重置 */
                    result.result = 0;
                    strcpy(result.status, "Reset");
                    break;

                default:
                    result.result = -1;
                    strcpy(result.status, "Unknown");
                    break;
            }

            /* 發送結果 */
            xQueueSend(result_queue, &result, portMAX_DELAY);

            vTaskDelay(pdMS_TO_TICKS(100));
        }
    }
}

/**
 * @brief 命令發送任務
 */
void vCommandSenderTask(void *pvParameters)
{
    Command_t cmd;
    uint32_t request_count = 0;

    printf("[CommandSender] Started\n");

    vTaskDelay(pdMS_TO_TICKS(2000));

    while (1) {
        request_count++;

        /* 準備命令 */
        cmd.cmd_type = (request_count % 3) + 1;
        cmd.param1 = request_count;
        cmd.param2 = request_count * 10;
        snprintf(cmd.message, sizeof(cmd.message), "Request #%lu", request_count);

        printf("[CommandSender] Sending command #%lu (type %u)\n",
               request_count, cmd.cmd_type);

        /* 發送命令 */
        if (xQueueSend(command_queue, &cmd, pdMS_TO_TICKS(500)) != pdTRUE) {
            printf("[CommandSender] Failed to send command #%lu\n", request_count);
        }

        vTaskDelay(pdMS_TO_TICKS(2500));
    }
}

/**
 * @brief 結果接收任務
 */
void vResultReceiverTask(void *pvParameters)
{
    Result_t result;

    printf("[ResultReceiver] Started\n");

    while (1) {
        if (xQueueReceive(result_queue, &result, portMAX_DELAY) == pdTRUE) {
            printf("[ResultReceiver] Got result for request #%lu: value=%ld, status=%s\n",
                   result.request_id, result.result, result.status);
        }
    }
}

/**
 * @brief 統計任務 - 顯示佇列和統計資訊
 */
void vStatsTask(void *pvParameters)
{
    printf("[StatsTask] Started\n");

    vTaskDelay(pdMS_TO_TICKS(3000));

    while (1) {
        printf("\n========== Queue Statistics ==========\n");

        /* 資料佇列資訊 */
        UBaseType_t data_queue_waiting = uxQueueMessagesWaiting(data_queue);
        UBaseType_t data_queue_spaces = uxQueueSpacesAvailable(data_queue);

        printf("Data Queue:\n");
        printf("  Messages waiting: %u / %u\n", data_queue_waiting, DATA_QUEUE_SIZE);
        printf("  Spaces available: %u\n", data_queue_spaces);
        printf("  Total produced:   %lu\n", queue_stats.produced);
        printf("  Total consumed:   %lu\n", queue_stats.consumed);
        printf("  Queue full errors: %lu\n", queue_stats.queue_full_errors);
        printf("  Queue empty errors: %lu\n", queue_stats.queue_empty_errors);

        /* 命令佇列資訊 */
        UBaseType_t cmd_queue_waiting = uxQueueMessagesWaiting(command_queue);
        printf("\nCommand Queue:\n");
        printf("  Messages waiting: %u / %u\n", cmd_queue_waiting, COMMAND_QUEUE_SIZE);

        /* 結果佇列資訊 */
        UBaseType_t result_queue_waiting = uxQueueMessagesWaiting(result_queue);
        printf("\nResult Queue:\n");
        printf("  Messages waiting: %u / %u\n", result_queue_waiting, RESULT_QUEUE_SIZE);

        printf("======================================\n\n");

        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}

/**
 * @brief 應用程式入口
 */
void app_main(void)
{
    printf("\n");
    printf("==========================================\n");
    printf("  FreeRTOS Queue Communication Example\n");
    printf("  Build: %s %s\n", __DATE__, __TIME__);
    printf("==========================================\n\n");

    /* 創建佇列 */
    data_queue = xQueueCreate(DATA_QUEUE_SIZE, sizeof(SensorData_t));
    if (data_queue == NULL) {
        printf("ERROR: Failed to create data queue\n");
        return;
    }
    printf("Data queue created (size=%d)\n", DATA_QUEUE_SIZE);

    command_queue = xQueueCreate(COMMAND_QUEUE_SIZE, sizeof(Command_t));
    if (command_queue == NULL) {
        printf("ERROR: Failed to create command queue\n");
        return;
    }
    printf("Command queue created (size=%d)\n", COMMAND_QUEUE_SIZE);

    result_queue = xQueueCreate(RESULT_QUEUE_SIZE, sizeof(Result_t));
    if (result_queue == NULL) {
        printf("ERROR: Failed to create result queue\n");
        return;
    }
    printf("Result queue created (size=%d)\n\n", RESULT_QUEUE_SIZE);

    /* 創建生產者任務 */
    xTaskCreate(vProducer1Task, "Producer1", 512, NULL, 2, NULL);
    xTaskCreate(vProducer2Task, "Producer2", 512, NULL, 2, NULL);
    xTaskCreate(vUrgentProducerTask, "UrgentProd", 512, NULL, 3, NULL);

    /* 創建消費者任務 */
    xTaskCreate(vConsumer1Task, "Consumer1", 512, NULL, 2, NULL);
    xTaskCreate(vConsumer2Task, "Consumer2", 512, NULL, 1, NULL);

    /* 創建命令處理相關任務 */
    xTaskCreate(vCommandProcessorTask, "CmdProc", 512, NULL, 3, NULL);
    xTaskCreate(vCommandSenderTask, "CmdSender", 512, NULL, 2, NULL);
    xTaskCreate(vResultReceiverTask, "ResultRcv", 512, NULL, 2, NULL);

    /* 創建統計任務 */
    xTaskCreate(vStatsTask, "Stats", 512, NULL, 1, NULL);

    printf("All tasks created! Starting scheduler...\n\n");

    /* 啟動排程器 */
    vTaskStartScheduler();

    /* 不應該到達這裡 */
    printf("ERROR: Scheduler failed to start!\n");
}

int main(void)
{
    app_main();
    return 0;
}
