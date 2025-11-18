/**
 * @file low_power_modes.c
 * @brief FreeRTOS 低功耗模式範例
 * @author AI-Assisted Development Team
 * @date 2025-11-18
 *
 * 本範例展示如何在 FreeRTOS 中實現低功耗模式：
 * 1. Tickless Idle 模式
 * 2. Sleep 模式（CPU 停止，外設運行）
 * 3. Stop 模式（CPU 和大部分外設停止）
 * 4. Standby 模式（最低功耗，僅保留後備域）
 * 5. 動態電壓和頻率調整（DVFS）
 * 6. 外設電源管理
 * 7. 喚醒源配置（RTC、GPIO、UART）
 *
 * 硬件平台: STM32F407VG
 * 預期功耗：
 * - 正常運行: ~100mA @ 168MHz
 * - Sleep 模式: ~50mA
 * - Stop 模式: ~200μA
 * - Standby 模式: ~2μA
 */

#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include "semphr.h"
#include "timers.h"
#include "stm32f4xx_hal.h"
#include <stdio.h>
#include <stdbool.h>

/* ==================== 配置參數 ==================== */

#define USE_TICKLESS_IDLE           1       /* 啟用 Tickless Idle */
#define LOW_POWER_TASK_PRIORITY     1
#define SENSOR_TASK_PRIORITY        2
#define WAKEUP_INTERVAL_MS          5000    /* 定期喚醒間隔 */

/* 低功耗模式定義 */
typedef enum {
    POWER_MODE_RUN,         /* 正常運行模式 */
    POWER_MODE_SLEEP,       /* Sleep 模式 */
    POWER_MODE_STOP,        /* Stop 模式 */
    POWER_MODE_STANDBY      /* Standby 模式 */
} PowerMode_t;

/* 系統狀態 */
typedef struct {
    PowerMode_t current_mode;
    uint32_t sleep_count;
    uint32_t wakeup_count;
    uint32_t total_sleep_time_ms;
    float average_current_ma;
    bool allow_deep_sleep;
} PowerStatus_t;

/* ==================== 全域變數 ==================== */

static PowerStatus_t power_status = {
    .current_mode = POWER_MODE_RUN,
    .sleep_count = 0,
    .wakeup_count = 0,
    .total_sleep_time_ms = 0,
    .average_current_ma = 0.0f,
    .allow_deep_sleep = true
};

static SemaphoreHandle_t power_mutex = NULL;
static TimerHandle_t wakeup_timer = NULL;
static QueueHandle_t sensor_queue = NULL;

/* RTC 句柄 */
static RTC_HandleTypeDef hrtc;

/* ==================== RTC 初始化 ==================== */

/**
 * @brief 初始化 RTC 用於 Tickless Idle
 */
static void RTC_Init(void)
{
    RTC_TimeTypeDef sTime = {0};
    RTC_DateTypeDef sDate = {0};

    /* RTC 時鐘配置 */
    hrtc.Instance = RTC;
    hrtc.Init.HourFormat = RTC_HOURFORMAT_24;
    hrtc.Init.AsynchPrediv = 127;   /* LSE (32.768kHz) / 128 = 256Hz */
    hrtc.Init.SynchPrediv = 255;    /* 256Hz / 256 = 1Hz */
    hrtc.Init.OutPut = RTC_OUTPUT_DISABLE;
    hrtc.Init.OutPutPolarity = RTC_OUTPUT_POLARITY_HIGH;
    hrtc.Init.OutPutType = RTC_OUTPUT_TYPE_OPENDRAIN;

    if (HAL_RTC_Init(&hrtc) != HAL_OK) {
        printf("RTC Init failed!\n");
        return;
    }

    /* 初始化時間 */
    sTime.Hours = 0;
    sTime.Minutes = 0;
    sTime.Seconds = 0;
    sTime.DayLightSaving = RTC_DAYLIGHTSAVING_NONE;
    sTime.StoreOperation = RTC_STOREOPERATION_RESET;
    HAL_RTC_SetTime(&hrtc, &sTime, RTC_FORMAT_BIN);

    /* 初始化日期 */
    sDate.WeekDay = RTC_WEEKDAY_MONDAY;
    sDate.Month = RTC_MONTH_JANUARY;
    sDate.Date = 1;
    sDate.Year = 0;
    HAL_RTC_SetDate(&hrtc, &sDate, RTC_FORMAT_BIN);

    printf("RTC initialized for Tickless Idle\n");
}

/**
 * @brief 配置 RTC 喚醒定時器
 * @param seconds 喚醒間隔（秒）
 */
static void RTC_ConfigureWakeup(uint32_t seconds)
{
    /* 禁用喚醒定時器 */
    HAL_RTCEx_DeactivateWakeUpTimer(&hrtc);

    /* 配置喚醒定時器 */
    /* RTC WakeUp = RTCCLK / (WakeUpCounter + 1)
     * 使用 1Hz 時鐘源 */
    if (HAL_RTCEx_SetWakeUpTimer_IT(&hrtc, seconds - 1,
                                     RTC_WAKEUPCLOCK_CK_SPRE_16BITS) != HAL_OK) {
        printf("RTC WakeUp Timer configuration failed!\n");
    }
}

/* ==================== 低功耗模式實現 ==================== */

/**
 * @brief 進入 Sleep 模式
 * @note CPU 停止，所有外設和 RAM 保持運行
 */
static void Enter_Sleep_Mode(void)
{
    printf("Entering Sleep mode...\n");

    /* 刷新 UART */
    HAL_Delay(10);

    /* 進入 Sleep 模式，等待任何中斷喚醒 */
    HAL_PWR_EnterSLEEPMode(PWR_MAINREGULATOR_ON, PWR_SLEEPENTRY_WFI);

    /* 從 Sleep 喚醒 */
    power_status.wakeup_count++;
    printf("Wakeup from Sleep mode\n");
}

/**
 * @brief 進入 Stop 模式
 * @note CPU 和大部分外設停止，RAM 保持
 */
static void Enter_Stop_Mode(void)
{
    printf("Entering Stop mode...\n");
    HAL_Delay(10);

    /* 禁用 SysTick 中斷 */
    HAL_SuspendTick();

    /* 進入 Stop 模式 */
    HAL_PWR_EnterSTOPMode(PWR_LOWPOWERREGULATOR_ON, PWR_STOPENTRY_WFI);

    /* 從 Stop 喚醒後，重新配置系統時鐘 */
    SystemClock_Config();
    HAL_ResumeTick();

    power_status.wakeup_count++;
    printf("Wakeup from Stop mode\n");
}

/**
 * @brief 進入 Standby 模式
 * @note 最低功耗，僅後備域保持，喚醒後完全重啟
 */
static void Enter_Standby_Mode(void)
{
    printf("Entering Standby mode...\n");
    printf("System will reset on wakeup!\n");
    HAL_Delay(100);

    /* 清除 Wakeup 標誌 */
    __HAL_PWR_CLEAR_FLAG(PWR_FLAG_WU);

    /* 啟用 Wakeup Pin (PA0) */
    HAL_PWR_EnableWakeUpPin(PWR_WAKEUP_PIN1);

    /* 進入 Standby 模式 */
    HAL_PWR_EnterSTANDBYMode();

    /* 永遠不會到達這裡 */
}

/* ==================== 動態電壓和頻率調整 (DVFS) ==================== */

/**
 * @brief 降低系統時鐘頻率以節省功耗
 */
static void DVFS_LowerFrequency(void)
{
    RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
    uint32_t pFLatency = 0;

    printf("Lowering system frequency to 84MHz...\n");

    /* 降頻到 84MHz (168MHz / 2) */
    RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK | RCC_CLOCKTYPE_SYSCLK |
                                  RCC_CLOCKTYPE_PCLK1 | RCC_CLOCKTYPE_PCLK2;
    RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
    RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV2;      /* 168MHz / 2 = 84MHz */
    RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;       /* 84MHz / 2 = 42MHz */
    RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;       /* 84MHz */

    if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_2) != HAL_OK) {
        printf("Failed to lower frequency!\n");
    }
}

/**
 * @brief 恢復正常系統時鐘頻率
 */
static void DVFS_RestoreFrequency(void)
{
    printf("Restoring system frequency to 168MHz...\n");
    SystemClock_Config();
}

/* ==================== 外設電源管理 ==================== */

/**
 * @brief 禁用未使用的外設以節省功耗
 */
static void Peripherals_Disable(void)
{
    /* 禁用未使用的 GPIO 時鐘 */
    __HAL_RCC_GPIOB_CLK_DISABLE();
    __HAL_RCC_GPIOC_CLK_DISABLE();
    __HAL_RCC_GPIOE_CLK_DISABLE();
    __HAL_RCC_GPIOH_CLK_DISABLE();

    /* 禁用未使用的外設時鐘 */
    __HAL_RCC_SPI1_CLK_DISABLE();
    __HAL_RCC_SPI2_CLK_DISABLE();
    __HAL_RCC_I2C1_CLK_DISABLE();
    __HAL_RCC_I2C2_CLK_DISABLE();

    /* 配置未使用的 GPIO 為模擬輸入（最低功耗） */
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Mode = GPIO_MODE_ANALOG;
    GPIO_InitStruct.Pull = GPIO_NOPULL;

    /* 示例：將 GPIOD 未使用的引腳設為模擬 */
    GPIO_InitStruct.Pin = GPIO_PIN_All & ~(GPIO_PIN_12);  /* 保留 LED */
    HAL_GPIO_Init(GPIOD, &GPIO_InitStruct);

    printf("Unused peripherals disabled\n");
}

/**
 * @brief 重新啟用外設
 */
static void Peripherals_Enable(void)
{
    /* 根據需要重新啟用外設 */
    __HAL_RCC_GPIOB_CLK_ENABLE();
    __HAL_RCC_GPIOC_CLK_ENABLE();

    printf("Peripherals re-enabled\n");
}

/* ==================== Tickless Idle 支援 ==================== */

#if (USE_TICKLESS_IDLE == 1)

/**
 * @brief FreeRTOS Tickless Idle 前置處理
 * @param xExpectedIdleTime 預期空閒時間（ticks）
 */
void vApplicationSleep(TickType_t xExpectedIdleTime)
{
    uint32_t sleep_time_ms = xExpectedIdleTime * portTICK_PERIOD_MS;

    /* 只有當預期睡眠時間 > 2ms 時才進入低功耗模式 */
    if (sleep_time_ms > 2) {
        /* 記錄進入睡眠 */
        power_status.sleep_count++;
        uint32_t before_sleep = HAL_GetTick();

        /* 配置 RTC 喚醒定時器 */
        RTC_ConfigureWakeup(sleep_time_ms / 1000);

        /* 根據配置選擇低功耗模式 */
        if (power_status.allow_deep_sleep && sleep_time_ms > 1000) {
            /* 長時間睡眠，使用 Stop 模式 */
            Enter_Stop_Mode();
        } else {
            /* 短時間睡眠，使用 Sleep 模式 */
            Enter_Sleep_Mode();
        }

        /* 計算實際睡眠時間 */
        uint32_t actual_sleep = HAL_GetTick() - before_sleep;
        power_status.total_sleep_time_ms += actual_sleep;
    }
}

#endif /* USE_TICKLESS_IDLE */

/* ==================== 任務實現 ==================== */

/**
 * @brief 電源管理任務
 * @details 監控系統狀態並管理電源模式
 */
void vPowerManagementTask(void *pvParameters)
{
    TickType_t last_wake_time = xTaskGetTickCount();
    uint32_t idle_count = 0;

    printf("[Power] Power Management Task started\n");

    while (1) {
        /* 獲取系統狀態 */
        xSemaphoreTake(power_mutex, portMAX_DELAY);

        /* 檢查系統是否長時間空閒 */
        if (uxTaskGetNumberOfTasks() <= 2) {  /* 只有 idle 和本任務 */
            idle_count++;
        } else {
            idle_count = 0;
        }

        /* 如果系統空閒超過 30 秒，進入深度睡眠 */
        if (idle_count > 30) {
            printf("[Power] System idle, entering deep sleep mode\n");
            power_status.allow_deep_sleep = true;
            idle_count = 0;
        }

        /* 打印電源統計 */
        if (power_status.sleep_count % 10 == 0 && power_status.sleep_count > 0) {
            printf("\n[Power] Statistics:\n");
            printf("  Sleep count: %lu\n", power_status.sleep_count);
            printf("  Wakeup count: %lu\n", power_status.wakeup_count);
            printf("  Total sleep time: %lu ms\n", power_status.total_sleep_time_ms);
            printf("  Current mode: %d\n", power_status.current_mode);
        }

        xSemaphoreGive(power_mutex);

        /* 每秒檢查一次 */
        vTaskDelayUntil(&last_wake_time, pdMS_TO_TICKS(1000));
    }
}

/**
 * @brief 模擬感測器任務
 * @details 週期性讀取感測器，然後睡眠
 */
void vSensorTask(void *pvParameters)
{
    uint32_t reading_count = 0;

    printf("[Sensor] Sensor Task started\n");

    while (1) {
        /* 模擬感測器讀取 */
        float temperature = 25.0f + (reading_count % 10);
        reading_count++;

        printf("[Sensor] Reading #%lu: %.1f°C\n", reading_count, temperature);

        /* 發送到佇列（如果需要） */
        if (sensor_queue != NULL) {
            xQueueSend(sensor_queue, &temperature, 0);
        }

        /* 長時間睡眠，讓系統進入低功耗模式 */
        vTaskDelay(pdMS_TO_TICKS(WAKEUP_INTERVAL_MS));
    }
}

/**
 * @brief 喚醒定時器回調
 */
void vWakeupTimerCallback(TimerHandle_t xTimer)
{
    printf("[Timer] Periodic wakeup triggered\n");
}

/* ==================== 中斷處理 ==================== */

/**
 * @brief RTC 喚醒中斷處理
 */
void RTC_WKUP_IRQHandler(void)
{
    HAL_RTCEx_WakeUpTimerIRQHandler(&hrtc);
}

/**
 * @brief RTC 喚醒回調
 */
void HAL_RTCEx_WakeUpTimerEventCallback(RTC_HandleTypeDef *hrtc)
{
    /* 從低功耗模式喚醒 */
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;

    /* 可以在這裡通知任務 */
    /* xSemaphoreGiveFromISR(wakeup_semaphore, &xHigherPriorityTaskWoken); */

    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}

/* ==================== 應用程式入口 ==================== */

/**
 * @brief 低功耗示範初始化
 */
void low_power_demo_init(void)
{
    printf("\n");
    printf("=================================================\n");
    printf("  FreeRTOS Low Power Management Demo\n");
    printf("  Tickless Idle: %s\n", USE_TICKLESS_IDLE ? "Enabled" : "Disabled");
    printf("=================================================\n\n");

    /* 初始化 RTC */
    RTC_Init();

    /* 禁用未使用的外設 */
    Peripherals_Disable();

    /* 創建互斥鎖 */
    power_mutex = xSemaphoreCreateMutex();

    /* 創建佇列 */
    sensor_queue = xQueueCreate(10, sizeof(float));

    /* 創建喚醒定時器 */
    wakeup_timer = xTimerCreate("WakeupTimer",
                                pdMS_TO_TICKS(WAKEUP_INTERVAL_MS),
                                pdTRUE,  /* 自動重載 */
                                NULL,
                                vWakeupTimerCallback);
    xTimerStart(wakeup_timer, 0);

    /* 創建電源管理任務 */
    xTaskCreate(vPowerManagementTask,
                "PowerMgmt",
                256,
                NULL,
                LOW_POWER_TASK_PRIORITY,
                NULL);

    /* 創建感測器任務 */
    xTaskCreate(vSensorTask,
                "Sensor",
                256,
                NULL,
                SENSOR_TASK_PRIORITY,
                NULL);

    printf("Low power demo initialized!\n");
    printf("System will enter low power mode when idle\n\n");
}

/* ==================== 測試函數 ==================== */

/**
 * @brief 測試所有低功耗模式
 */
void test_all_power_modes(void)
{
    printf("\n=== Testing All Power Modes ===\n\n");

    /* 測試 Sleep 模式 */
    printf("1. Testing Sleep Mode\n");
    vTaskDelay(pdMS_TO_TICKS(1000));
    Enter_Sleep_Mode();
    vTaskDelay(pdMS_TO_TICKS(1000));

    /* 測試 Stop 模式 */
    printf("2. Testing Stop Mode\n");
    vTaskDelay(pdMS_TO_TICKS(1000));
    Enter_Stop_Mode();
    vTaskDelay(pdMS_TO_TICKS(1000));

    /* 測試 DVFS */
    printf("3. Testing DVFS\n");
    DVFS_LowerFrequency();
    vTaskDelay(pdMS_TO_TICKS(3000));
    DVFS_RestoreFrequency();

    printf("\n=== Power Mode Tests Complete ===\n\n");
}

/**
 * @brief 主函數（用於獨立測試）
 */
int main(void)
{
    /* HAL 初始化 */
    HAL_Init();
    SystemClock_Config();

    /* 初始化 UART（用於 printf） */
    UART_Init();

    /* 初始化低功耗示範 */
    low_power_demo_init();

    /* 啟動 FreeRTOS 排程器 */
    vTaskStartScheduler();

    /* 不應該到達這裡 */
    while (1);

    return 0;
}
