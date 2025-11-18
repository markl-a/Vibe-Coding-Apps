/**
 * @file power_profile.c
 * @brief 電源分析和性能剖析工具
 * @author AI-Assisted Development Team
 * @date 2025-11-18
 *
 * 本文件提供完整的電源分析工具，用於：
 * 1. 實時功耗監測
 * 2. 電源模式統計
 * 3. 任務功耗分析
 * 4. 電池壽命預測
 * 5. 功耗報告生成
 */

#include "FreeRTOS.h"
#include "task.h"
#include "timers.h"
#include "stm32f4xx_hal.h"
#include <stdio.h>
#include <string.h>
#include <math.h>

/* ==================== 配置參數 ==================== */

#define MAX_POWER_SAMPLES       1000    /* 最大功耗樣本數 */
#define SAMPLE_INTERVAL_MS      100     /* 採樣間隔 */
#define BATTERY_CAPACITY_MAH    2000    /* 電池容量（mAh） */
#define ADC_RESOLUTION          4096    /* ADC 解析度（12-bit） */
#define CURRENT_SENSE_GAIN      100     /* 電流感測增益（mV/mA） */

/* 功耗常數（STM32F407 典型值） */
#define POWER_RUN_168MHZ_MA     100.0f  /* 168MHz 運行功耗 */
#define POWER_RUN_84MHZ_MA      50.0f   /* 84MHz 運行功耗 */
#define POWER_SLEEP_MA          50.0f   /* Sleep 模式功耗 */
#define POWER_STOP_UA           200.0f  /* Stop 模式功耗（μA） */
#define POWER_STANDBY_UA        2.0f    /* Standby 模式功耗（μA） */

/* ==================== 數據結構 ==================== */

/* 電源模式枚舉 */
typedef enum {
    PMODE_RUN_168MHZ,
    PMODE_RUN_84MHZ,
    PMODE_SLEEP,
    PMODE_STOP,
    PMODE_STANDBY,
    PMODE_COUNT
} PowerMode_t;

/* 電源樣本 */
typedef struct {
    uint32_t timestamp_ms;      /* 時間戳 */
    float current_ma;           /* 電流（mA） */
    float voltage_v;            /* 電壓（V） */
    float power_mw;             /* 功率（mW） */
    PowerMode_t mode;           /* 電源模式 */
} PowerSample_t;

/* 電源統計 */
typedef struct {
    /* 模式統計 */
    uint32_t mode_count[PMODE_COUNT];       /* 各模式計數 */
    uint32_t mode_time_ms[PMODE_COUNT];     /* 各模式時間 */
    float mode_energy_mwh[PMODE_COUNT];     /* 各模式能量 */

    /* 總體統計 */
    uint32_t total_samples;                 /* 總樣本數 */
    float total_energy_mwh;                 /* 總能量（mWh） */
    float average_current_ma;               /* 平均電流 */
    float peak_current_ma;                  /* 峰值電流 */
    float min_current_ma;                   /* 最小電流 */

    /* 電池壽命預測 */
    float predicted_runtime_hours;          /* 預測運行時間 */
    float battery_soc_percent;              /* 電池電量百分比 */
} PowerStats_t;

/* ==================== 全域變數 ==================== */

static PowerSample_t power_samples[MAX_POWER_SAMPLES];
static uint32_t sample_index = 0;
static uint32_t sample_count = 0;

static PowerStats_t power_stats = {0};
static PowerMode_t current_power_mode = PMODE_RUN_168MHZ;

static ADC_HandleTypeDef hadc1;
static TIM_HandleTypeDef htim2;

/* ==================== ADC 初始化 ==================== */

/**
 * @brief 初始化 ADC 用於電流/電壓測量
 */
static void ADC_PowerMeter_Init(void)
{
    ADC_ChannelConfTypeDef sConfig = {0};

    /* ADC1 配置 */
    hadc1.Instance = ADC1;
    hadc1.Init.ClockPrescaler = ADC_CLOCK_SYNC_PCLK_DIV4;
    hadc1.Init.Resolution = ADC_RESOLUTION_12B;
    hadc1.Init.ScanConvMode = ENABLE;
    hadc1.Init.ContinuousConvMode = DISABLE;
    hadc1.Init.DiscontinuousConvMode = DISABLE;
    hadc1.Init.ExternalTrigConvEdge = ADC_EXTERNALTRIGCONVEDGE_NONE;
    hadc1.Init.DataAlign = ADC_DATAALIGN_RIGHT;
    hadc1.Init.NbrOfConversion = 2;  /* 電流 + 電壓 */
    hadc1.Init.DMAContinuousRequests = DISABLE;
    hadc1.Init.EOCSelection = ADC_EOC_SINGLE_CONV;

    if (HAL_ADC_Init(&hadc1) != HAL_OK) {
        printf("ADC Init failed!\n");
        return;
    }

    /* 配置通道 1: 電流測量（PA0） */
    sConfig.Channel = ADC_CHANNEL_0;
    sConfig.Rank = 1;
    sConfig.SamplingTime = ADC_SAMPLETIME_84CYCLES;
    HAL_ADC_ConfigChannel(&hadc1, &sConfig);

    /* 配置通道 2: 電壓測量（PA1） */
    sConfig.Channel = ADC_CHANNEL_1;
    sConfig.Rank = 2;
    HAL_ADC_ConfigChannel(&hadc1, &sConfig);

    printf("ADC Power Meter initialized\n");
}

/* ==================== 功耗測量 ==================== */

/**
 * @brief 讀取電流（mA）
 * @return 電流值（mA）
 */
static float Read_Current_mA(void)
{
    uint32_t adc_value;

    /* 啟動 ADC 轉換 */
    HAL_ADC_Start(&hadc1);
    HAL_ADC_PollForConversion(&hadc1, 100);
    adc_value = HAL_ADC_GetValue(&hadc1);
    HAL_ADC_Stop(&hadc1);

    /* 轉換為電流值 */
    /* 假設: ADC 輸入 = 電流 * 感測電阻 * 增益 */
    float voltage_mv = (adc_value * 3300.0f) / ADC_RESOLUTION;
    float current_ma = voltage_mv / CURRENT_SENSE_GAIN;

    return current_ma;
}

/**
 * @brief 讀取電壓（V）
 * @return 電壓值（V）
 */
static float Read_Voltage_V(void)
{
    uint32_t adc_value;

    /* 啟動 ADC 轉換（通道 2） */
    HAL_ADC_Start(&hadc1);
    /* 跳過第一次轉換（電流） */
    HAL_ADC_PollForConversion(&hadc1, 100);
    HAL_ADC_PollForConversion(&hadc1, 100);
    adc_value = HAL_ADC_GetValue(&hadc1);
    HAL_ADC_Stop(&hadc1);

    /* 轉換為電壓值（考慮分壓電阻） */
    /* 假設: 分壓比 1:2 */
    float voltage_v = ((adc_value * 3.3f) / ADC_RESOLUTION) * 2.0f;

    return voltage_v;
}

/**
 * @brief 估算當前功耗
 * @param mode 電源模式
 * @return 估算電流（mA）
 */
static float Estimate_Current(PowerMode_t mode)
{
    switch (mode) {
        case PMODE_RUN_168MHZ:
            return POWER_RUN_168MHZ_MA;
        case PMODE_RUN_84MHZ:
            return POWER_RUN_84MHZ_MA;
        case PMODE_SLEEP:
            return POWER_SLEEP_MA;
        case PMODE_STOP:
            return POWER_STOP_UA / 1000.0f;
        case PMODE_STANDBY:
            return POWER_STANDBY_UA / 1000.0f;
        default:
            return 0.0f;
    }
}

/* ==================== 數據採集 ==================== */

/**
 * @brief 採集一個功耗樣本
 */
static void Collect_Power_Sample(void)
{
    PowerSample_t *sample = &power_samples[sample_index];

    /* 時間戳 */
    sample->timestamp_ms = HAL_GetTick();

    /* 測量電流和電壓 */
    #ifdef USE_HARDWARE_POWER_METER
    sample->current_ma = Read_Current_mA();
    sample->voltage_v = Read_Voltage_V();
    #else
    /* 使用估算值（無硬件功耗計） */
    sample->current_ma = Estimate_Current(current_power_mode);
    sample->voltage_v = 3.3f;  /* 假設 3.3V */
    #endif

    /* 計算功率 */
    sample->power_mw = sample->current_ma * sample->voltage_v;

    /* 記錄模式 */
    sample->mode = current_power_mode;

    /* 更新索引 */
    sample_index = (sample_index + 1) % MAX_POWER_SAMPLES;
    if (sample_count < MAX_POWER_SAMPLES) {
        sample_count++;
    }

    /* 更新統計 */
    Update_Power_Statistics(sample);
}

/* ==================== 統計計算 ==================== */

/**
 * @brief 更新功耗統計
 * @param sample 新樣本
 */
static void Update_Power_Statistics(PowerSample_t *sample)
{
    /* 更新模式統計 */
    power_stats.mode_count[sample->mode]++;
    power_stats.mode_time_ms[sample->mode] += SAMPLE_INTERVAL_MS;
    power_stats.mode_energy_mwh[sample->mode] +=
        (sample->power_mw * SAMPLE_INTERVAL_MS) / 3600000.0f;

    /* 更新總體統計 */
    power_stats.total_samples++;
    power_stats.total_energy_mwh +=
        (sample->power_mw * SAMPLE_INTERVAL_MS) / 3600000.0f;

    /* 更新電流統計 */
    float total_current = power_stats.average_current_ma * (power_stats.total_samples - 1);
    power_stats.average_current_ma =
        (total_current + sample->current_ma) / power_stats.total_samples;

    if (sample->current_ma > power_stats.peak_current_ma) {
        power_stats.peak_current_ma = sample->current_ma;
    }

    if (power_stats.total_samples == 1 || sample->current_ma < power_stats.min_current_ma) {
        power_stats.min_current_ma = sample->current_ma;
    }

    /* 計算電池壽命預測 */
    if (power_stats.average_current_ma > 0) {
        power_stats.predicted_runtime_hours =
            BATTERY_CAPACITY_MAH / power_stats.average_current_ma;
    }
}

/**
 * @brief 計算模式分佈百分比
 */
static void Calculate_Mode_Distribution(float distribution[])
{
    uint32_t total_time = 0;

    /* 計算總時間 */
    for (int i = 0; i < PMODE_COUNT; i++) {
        total_time += power_stats.mode_time_ms[i];
    }

    /* 計算百分比 */
    if (total_time > 0) {
        for (int i = 0; i < PMODE_COUNT; i++) {
            distribution[i] = (float)power_stats.mode_time_ms[i] / total_time * 100.0f;
        }
    }
}

/* ==================== 報告生成 ==================== */

/**
 * @brief 生成功耗報告
 */
void Generate_Power_Report(void)
{
    const char *mode_names[] = {
        "RUN 168MHz", "RUN 84MHz", "SLEEP", "STOP", "STANDBY"
    };

    float mode_distribution[PMODE_COUNT];
    Calculate_Mode_Distribution(mode_distribution);

    printf("\n");
    printf("╔═══════════════════════════════════════════════════════╗\n");
    printf("║           POWER CONSUMPTION REPORT                    ║\n");
    printf("╚═══════════════════════════════════════════════════════╝\n");
    printf("\n");

    /* 總體統計 */
    printf("Overall Statistics:\n");
    printf("─────────────────────────────────────────────────────────\n");
    printf("  Total Samples:        %lu\n", power_stats.total_samples);
    printf("  Total Runtime:        %.2f hours\n",
           power_stats.total_samples * SAMPLE_INTERVAL_MS / 3600000.0f);
    printf("  Total Energy:         %.3f mWh\n", power_stats.total_energy_mwh);
    printf("  Average Current:      %.2f mA\n", power_stats.average_current_ma);
    printf("  Peak Current:         %.2f mA\n", power_stats.peak_current_ma);
    printf("  Min Current:          %.2f mA\n", power_stats.min_current_ma);
    printf("\n");

    /* 模式統計 */
    printf("Power Mode Distribution:\n");
    printf("─────────────────────────────────────────────────────────\n");
    printf("  Mode          Count    Time(ms)  Energy(mWh)  Percent\n");
    for (int i = 0; i < PMODE_COUNT; i++) {
        printf("  %-12s  %6lu   %8lu   %10.3f    %5.1f%%\n",
               mode_names[i],
               power_stats.mode_count[i],
               power_stats.mode_time_ms[i],
               power_stats.mode_energy_mwh[i],
               mode_distribution[i]);
    }
    printf("\n");

    /* 電池壽命 */
    printf("Battery Life Prediction:\n");
    printf("─────────────────────────────────────────────────────────\n");
    printf("  Battery Capacity:     %d mAh\n", BATTERY_CAPACITY_MAH);
    printf("  Average Current:      %.2f mA\n", power_stats.average_current_ma);
    printf("  Predicted Runtime:    %.1f hours (%.1f days)\n",
           power_stats.predicted_runtime_hours,
           power_stats.predicted_runtime_hours / 24.0f);
    printf("\n");

    /* 優化建議 */
    printf("Optimization Recommendations:\n");
    printf("─────────────────────────────────────────────────────────\n");

    if (mode_distribution[PMODE_RUN_168MHZ] > 50.0f) {
        printf("  ⚠ System spends >50%% time at 168MHz\n");
        printf("    → Consider using lower frequency when possible\n");
    }

    if (mode_distribution[PMODE_SLEEP] + mode_distribution[PMODE_STOP] +
        mode_distribution[PMODE_STANDBY] < 50.0f) {
        printf("  ⚠ Low power modes used <50%% of time\n");
        printf("    → Review task design for longer sleep periods\n");
    }

    if (power_stats.average_current_ma > 50.0f) {
        printf("  ⚠ Average current >50mA\n");
        printf("    → Check for always-on peripherals\n");
        printf("    → Consider disabling unused clocks\n");
    }

    printf("\n");
}

/**
 * @brief 導出功耗數據為 CSV 格式
 */
void Export_Power_Data_CSV(void)
{
    printf("\n");
    printf("Power Data CSV Export:\n");
    printf("timestamp_ms,current_ma,voltage_v,power_mw,mode\n");

    for (uint32_t i = 0; i < sample_count; i++) {
        PowerSample_t *s = &power_samples[i];
        printf("%lu,%.3f,%.3f,%.3f,%d\n",
               s->timestamp_ms,
               s->current_ma,
               s->voltage_v,
               s->power_mw,
               s->mode);
    }

    printf("\n");
}

/* ==================== 可視化 ==================== */

/**
 * @brief 生成簡單的 ASCII 功耗圖表
 */
void Plot_Power_Graph(void)
{
    const int graph_height = 20;
    const int graph_width = 60;
    char graph[graph_height][graph_width + 1];

    /* 初始化圖表 */
    for (int y = 0; y < graph_height; y++) {
        for (int x = 0; x < graph_width; x++) {
            graph[y][x] = ' ';
        }
        graph[y][graph_width] = '\0';
    }

    /* 找出最大功率 */
    float max_power = 0.0f;
    uint32_t samples_to_plot = (sample_count < graph_width) ? sample_count : graph_width;

    for (uint32_t i = 0; i < samples_to_plot; i++) {
        if (power_samples[i].power_mw > max_power) {
            max_power = power_samples[i].power_mw;
        }
    }

    /* 繪製數據點 */
    for (uint32_t i = 0; i < samples_to_plot; i++) {
        int x = i;
        int y = graph_height - 1 -
                (int)((power_samples[i].power_mw / max_power) * (graph_height - 1));

        if (y >= 0 && y < graph_height) {
            graph[y][x] = '*';
        }
    }

    /* 打印圖表 */
    printf("\n");
    printf("Power Consumption Over Time (Max: %.1f mW):\n", max_power);
    printf("╔");
    for (int i = 0; i < graph_width; i++) printf("═");
    printf("╗\n");

    for (int y = 0; y < graph_height; y++) {
        printf("║%s║\n", graph[y]);
    }

    printf("╚");
    for (int i = 0; i < graph_width; i++) printf("═");
    printf("╝\n");
    printf("\n");
}

/* ==================== 任務實現 ==================== */

/**
 * @brief 功耗監控任務
 */
void vPowerMonitorTask(void *pvParameters)
{
    TickType_t last_wake_time = xTaskGetTickCount();

    printf("[PowerMonitor] Task started\n");

    while (1) {
        /* 採集功耗樣本 */
        Collect_Power_Sample();

        /* 每 100 個樣本生成一次報告 */
        if (power_stats.total_samples % 100 == 0 && power_stats.total_samples > 0) {
            Generate_Power_Report();
            Plot_Power_Graph();
        }

        /* 週期性採樣 */
        vTaskDelayUntil(&last_wake_time, pdMS_TO_TICKS(SAMPLE_INTERVAL_MS));
    }
}

/* ==================== API 函數 ==================== */

/**
 * @brief 設置當前電源模式
 * @param mode 電源模式
 */
void PowerProfile_SetMode(PowerMode_t mode)
{
    current_power_mode = mode;
}

/**
 * @brief 重置統計數據
 */
void PowerProfile_Reset(void)
{
    memset(&power_stats, 0, sizeof(power_stats));
    sample_index = 0;
    sample_count = 0;
    power_stats.min_current_ma = 999999.0f;

    printf("Power statistics reset\n");
}

/**
 * @brief 初始化功耗分析器
 */
void PowerProfile_Init(void)
{
    printf("\n");
    printf("═══════════════════════════════════════════\n");
    printf("  Power Profiler Initialized\n");
    printf("  Sample Rate: %d ms\n", SAMPLE_INTERVAL_MS);
    printf("  Max Samples: %d\n", MAX_POWER_SAMPLES);
    printf("  Battery Capacity: %d mAh\n", BATTERY_CAPACITY_MAH);
    printf("═══════════════════════════════════════════\n");
    printf("\n");

    /* 初始化 ADC */
    #ifdef USE_HARDWARE_POWER_METER
    ADC_PowerMeter_Init();
    #else
    printf("Using estimated power values (no hardware meter)\n");
    #endif

    /* 重置統計 */
    PowerProfile_Reset();

    /* 創建監控任務 */
    xTaskCreate(vPowerMonitorTask,
                "PowerMonitor",
                512,
                NULL,
                1,
                NULL);
}

/**
 * @brief 主函數（用於獨立測試）
 */
int main(void)
{
    /* HAL 初始化 */
    HAL_Init();
    SystemClock_Config();
    UART_Init();

    /* 初始化功耗分析器 */
    PowerProfile_Init();

    /* 啟動 FreeRTOS */
    vTaskStartScheduler();

    while (1);
    return 0;
}
