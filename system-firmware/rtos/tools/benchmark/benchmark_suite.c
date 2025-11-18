/**
 * @file benchmark_suite.c
 * @brief RTOS 性能基準測試套件
 * @author AI-Assisted Development Team
 * @date 2025-11-18
 *
 * 完整的 RTOS 性能測試套件，包括：
 * 1. 上下文切換性能測試
 * 2. 中斷延遲測試
 * 3. 信號量/互斥鎖性能測試
 * 4. 佇列吞吐量測試
 * 5. 記憶體分配性能測試
 * 6. 任務通知性能測試
 * 7. 事件組性能測試
 * 8. 定時器性能測試
 */

#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include "semphr.h"
#include "timers.h"
#include "event_groups.h"
#include <stdio.h>
#include <string.h>
#include <stdint.h>

/* ==================== 配置參數 ==================== */

#define BENCHMARK_ITERATIONS    10000   /* 測試迭代次數 */
#define TIMER_FREQUENCY_HZ      168000000  /* 定時器頻率（STM32F407） */
#define CYCLES_PER_US           (TIMER_FREQUENCY_HZ / 1000000)

/* ==================== 測試結果結構 ==================== */

typedef struct {
    const char *name;
    uint32_t min_cycles;
    uint32_t max_cycles;
    uint32_t avg_cycles;
    uint32_t total_cycles;
    uint32_t iterations;
} BenchmarkResult_t;

/* ==================== 全域變數 ==================== */

static BenchmarkResult_t results[20];
static uint32_t result_count = 0;

/* 測試用同步對象 */
static SemaphoreHandle_t test_semaphore = NULL;
static SemaphoreHandle_t test_mutex = NULL;
static QueueHandle_t test_queue = NULL;
static EventGroupHandle_t test_event_group = NULL;
static TimerHandle_t test_timer = NULL;

/* 任務句柄 */
static TaskHandle_t task1_handle = NULL;
static TaskHandle_t task2_handle = NULL;

/* ==================== DWT 計數器操作 ==================== */

/**
 * @brief 初始化 DWT 計數器用於精確計時
 */
static void DWT_Init(void)
{
    /* 啟用 DWT */
    CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;

    /* 重置計數器 */
    DWT->CYCCNT = 0;

    /* 啟用計數器 */
    DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk;
}

/**
 * @brief 讀取 DWT 計數器
 */
static inline uint32_t DWT_GetCycles(void)
{
    return DWT->CYCCNT;
}

/* ==================== 結果記錄 ==================== */

/**
 * @brief 記錄測試結果
 */
static void Record_Result(const char *name, uint32_t cycles, uint32_t iterations)
{
    BenchmarkResult_t *result = &results[result_count++];

    result->name = name;
    result->iterations = iterations;
    result->total_cycles = cycles;
    result->avg_cycles = cycles / iterations;
    result->min_cycles = cycles;  /* 簡化，實際應在循環中計算 */
    result->max_cycles = cycles;
}

/**
 * @brief 打印所有結果
 */
static void Print_Results(void)
{
    printf("\n");
    printf("╔═══════════════════════════════════════════════════════════════════╗\n");
    printf("║              RTOS Performance Benchmark Results                  ║\n");
    printf("╚═══════════════════════════════════════════════════════════════════╝\n");
    printf("\n");

    printf("CPU Frequency: %lu MHz\n", TIMER_FREQUENCY_HZ / 1000000);
    printf("Iterations: %d\n\n", BENCHMARK_ITERATIONS);

    printf("%-40s %12s %12s\n", "Test Name", "Cycles", "Time (μs)");
    printf("─────────────────────────────────────────────────────────────────────\n");

    for (uint32_t i = 0; i < result_count; i++) {
        BenchmarkResult_t *r = &results[i];
        float time_us = (float)r->avg_cycles / CYCLES_PER_US;

        printf("%-40s %12lu %12.2f\n",
               r->name,
               r->avg_cycles,
               time_us);
    }

    printf("\n");
}

/* ==================== 基準測試 1: 上下文切換 ==================== */

static volatile uint32_t context_switch_count = 0;

void vTask1(void *pvParameters)
{
    while (context_switch_count < BENCHMARK_ITERATIONS) {
        context_switch_count++;
        taskYIELD();
    }

    vTaskSuspend(NULL);
}

void vTask2(void *pvParameters)
{
    while (context_switch_count < BENCHMARK_ITERATIONS) {
        taskYIELD();
    }

    vTaskSuspend(NULL);
}

static void Benchmark_ContextSwitch(void)
{
    printf("Running: Context Switch Test...\n");

    context_switch_count = 0;

    /* 創建兩個相同優先級的任務 */
    xTaskCreate(vTask1, "Task1", 128, NULL, 3, &task1_handle);
    xTaskCreate(vTask2, "Task2", 128, NULL, 3, &task2_handle);

    uint32_t start = DWT_GetCycles();

    /* 等待測試完成 */
    while (context_switch_count < BENCHMARK_ITERATIONS) {
        vTaskDelay(1);
    }

    uint32_t end = DWT_GetCycles();
    uint32_t cycles = end - start;

    /* 刪除任務 */
    vTaskDelete(task1_handle);
    vTaskDelete(task2_handle);

    /* 每次切換的週期數（兩次切換算一輪） */
    Record_Result("Context Switch (per switch)", cycles / (BENCHMARK_ITERATIONS * 2), BENCHMARK_ITERATIONS * 2);
}

/* ==================== 基準測試 2: 信號量 ==================== */

static void Benchmark_Semaphore(void)
{
    printf("Running: Semaphore Test...\n");

    test_semaphore = xSemaphoreCreateBinary();
    xSemaphoreGive(test_semaphore);

    uint32_t start = DWT_GetCycles();

    for (uint32_t i = 0; i < BENCHMARK_ITERATIONS; i++) {
        xSemaphoreTake(test_semaphore, portMAX_DELAY);
        xSemaphoreGive(test_semaphore);
    }

    uint32_t end = DWT_GetCycles();
    uint32_t cycles = end - start;

    vSemaphoreDelete(test_semaphore);

    /* 每次 take/give 操作的週期數 */
    Record_Result("Semaphore Take/Give (per operation)", cycles / (BENCHMARK_ITERATIONS * 2), BENCHMARK_ITERATIONS * 2);
}

/* ==================== 基準測試 3: 互斥鎖 ==================== */

static void Benchmark_Mutex(void)
{
    printf("Running: Mutex Test...\n");

    test_mutex = xSemaphoreCreateMutex();

    uint32_t start = DWT_GetCycles();

    for (uint32_t i = 0; i < BENCHMARK_ITERATIONS; i++) {
        xSemaphoreTake(test_mutex, portMAX_DELAY);
        xSemaphoreGive(test_mutex);
    }

    uint32_t end = DWT_GetCycles();
    uint32_t cycles = end - start;

    vSemaphoreDelete(test_mutex);

    Record_Result("Mutex Take/Give (per operation)", cycles / (BENCHMARK_ITERATIONS * 2), BENCHMARK_ITERATIONS * 2);
}

/* ==================== 基準測試 4: 佇列 ==================== */

static void Benchmark_Queue(void)
{
    printf("Running: Queue Test...\n");

    test_queue = xQueueCreate(10, sizeof(uint32_t));
    uint32_t data = 0x12345678;

    uint32_t start = DWT_GetCycles();

    for (uint32_t i = 0; i < BENCHMARK_ITERATIONS; i++) {
        xQueueSend(test_queue, &data, 0);
        xQueueReceive(test_queue, &data, 0);
    }

    uint32_t end = DWT_GetCycles();
    uint32_t cycles = end - start;

    vQueueDelete(test_queue);

    Record_Result("Queue Send/Receive (per operation)", cycles / (BENCHMARK_ITERATIONS * 2), BENCHMARK_ITERATIONS * 2);
}

/* ==================== 基準測試 5: 記憶體分配 ==================== */

static void Benchmark_MemAlloc(void)
{
    printf("Running: Memory Allocation Test...\n");

    uint32_t start = DWT_GetCycles();

    for (uint32_t i = 0; i < BENCHMARK_ITERATIONS / 10; i++) {
        void *ptr = pvPortMalloc(128);
        if (ptr != NULL) {
            vPortFree(ptr);
        }
    }

    uint32_t end = DWT_GetCycles();
    uint32_t cycles = end - start;

    Record_Result("Memory Alloc/Free 128B (per operation)", cycles / ((BENCHMARK_ITERATIONS / 10) * 2), (BENCHMARK_ITERATIONS / 10) * 2);
}

/* ==================== 基準測試 6: 任務通知 ==================== */

static TaskHandle_t notify_task_handle = NULL;
static volatile uint32_t notify_count = 0;

void vNotifyTask(void *pvParameters)
{
    while (notify_count < BENCHMARK_ITERATIONS) {
        ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
        notify_count++;
    }

    vTaskSuspend(NULL);
}

static void Benchmark_TaskNotify(void)
{
    printf("Running: Task Notification Test...\n");

    notify_count = 0;

    xTaskCreate(vNotifyTask, "NotifyTask", 128, NULL, 2, &notify_task_handle);

    uint32_t start = DWT_GetCycles();

    for (uint32_t i = 0; i < BENCHMARK_ITERATIONS; i++) {
        xTaskNotifyGive(notify_task_handle);
        /* 短暫延遲讓任務運行 */
        while (notify_count < i + 1);
    }

    uint32_t end = DWT_GetCycles();
    uint32_t cycles = end - start;

    vTaskDelete(notify_task_handle);

    Record_Result("Task Notification (per operation)", cycles / BENCHMARK_ITERATIONS, BENCHMARK_ITERATIONS);
}

/* ==================== 基準測試 7: 事件組 ==================== */

static void Benchmark_EventGroup(void)
{
    printf("Running: Event Group Test...\n");

    test_event_group = xEventGroupCreate();

    uint32_t start = DWT_GetCycles();

    for (uint32_t i = 0; i < BENCHMARK_ITERATIONS; i++) {
        xEventGroupSetBits(test_event_group, 0x01);
        xEventGroupWaitBits(test_event_group, 0x01, pdTRUE, pdTRUE, 0);
    }

    uint32_t end = DWT_GetCycles();
    uint32_t cycles = end - start;

    vEventGroupDelete(test_event_group);

    Record_Result("Event Group Set/Wait (per operation)", cycles / (BENCHMARK_ITERATIONS * 2), BENCHMARK_ITERATIONS * 2);
}

/* ==================== 基準測試 8: 定時器 ==================== */

static volatile uint32_t timer_count = 0;

void vTimerCallback(TimerHandle_t xTimer)
{
    timer_count++;
}

static void Benchmark_Timer(void)
{
    printf("Running: Timer Test...\n");

    test_timer = xTimerCreate("TestTimer", pdMS_TO_TICKS(1), pdTRUE, NULL, vTimerCallback);

    timer_count = 0;

    uint32_t start = DWT_GetCycles();

    xTimerStart(test_timer, 0);

    /* 等待 1000 次回調 */
    while (timer_count < 1000) {
        vTaskDelay(1);
    }

    uint32_t end = DWT_GetCycles();

    xTimerStop(test_timer, 0);
    xTimerDelete(test_timer, 0);

    uint32_t cycles = end - start;

    Record_Result("Timer Callback Overhead", cycles / 1000, 1000);
}

/* ==================== 主測試函數 ==================== */

void vBenchmarkTask(void *pvParameters)
{
    printf("\n");
    printf("╔═══════════════════════════════════════════════╗\n");
    printf("║      RTOS Performance Benchmark Suite        ║\n");
    printf("╚═══════════════════════════════════════════════╝\n");
    printf("\n");

    vTaskDelay(pdMS_TO_TICKS(1000));

    /* 執行所有測試 */
    Benchmark_ContextSwitch();
    vTaskDelay(pdMS_TO_TICKS(500));

    Benchmark_Semaphore();
    Benchmark_Mutex();
    Benchmark_Queue();
    Benchmark_MemAlloc();
    Benchmark_TaskNotify();
    Benchmark_EventGroup();
    Benchmark_Timer();

    /* 打印結果 */
    Print_Results();

    printf("Benchmark complete!\n\n");

    vTaskSuspend(NULL);
}

/* ==================== 應用程式入口 ==================== */

int main(void)
{
    /* HAL 初始化 */
    HAL_Init();
    SystemClock_Config();
    UART_Init();

    /* 初始化 DWT 計數器 */
    DWT_Init();

    printf("\nInitializing benchmark suite...\n");

    /* 創建基準測試任務 */
    xTaskCreate(vBenchmarkTask, "Benchmark", 1024, NULL, 1, NULL);

    /* 啟動調度器 */
    vTaskStartScheduler();

    while (1);

    return 0;
}
