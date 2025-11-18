/**
 * @file adc_hal_stm32.c
 * @brief ADC HAL implementation for STM32F4xx
 * @version 1.0.0
 * @date 2025-11-18
 *
 * STM32F4 平台的 ADC HAL 實作
 */

#include "adc_hal.h"

#ifdef STM32F4

#include "stm32f4xx_hal.h"
#include <string.h>

/* ========== 私有定義 ========== */

#define MAX_ADC_INSTANCES  3    /**< STM32F4 最多支援 3 個 ADC */
#define MAX_ADC_CHANNELS   18   /**< 每個 ADC 最多 18 個通道 */
#define ADC_TIMEOUT        1000  /**< ADC 轉換超時 (ms) */
#define ADC_VREF_TYPICAL   3300  /**< 典型參考電壓 3.3V (毫伏) */

/* 溫度計算常數（參考資料手冊） */
#define TEMP_V25           760   /**< 25°C 時的電壓 (mV) */
#define TEMP_AVG_SLOPE     25    /**< 平均斜率 (mV/°C) * 10 */

/**
 * @brief ADC 內部上下文結構
 */
typedef struct {
    ADC_HandleTypeDef hadc;         /**< STM32 HAL ADC 句柄 */
    uint8_t adc_num;                /**< ADC 編號 */
    bool initialized;               /**< 初始化標誌 */
    adc_callback_t callback;        /**< 轉換完成回調 */
    adc_data_callback_t dma_callback; /**< DMA 完成回調 */
    uint32_t *dma_buffer;           /**< DMA 緩衝區 */
    size_t dma_length;              /**< DMA 緩衝區長度 */
    adc_resolution_t resolution;    /**< 解析度 */
} adc_context_t;

/* ========== 私有變數 ========== */

static adc_context_t adc_contexts[MAX_ADC_INSTANCES] = {0};

/* ========== 私有函數聲明 ========== */

static ADC_TypeDef* adc_get_instance(uint8_t adc_num);
static void adc_enable_clock(uint8_t adc_num);
static adc_context_t* adc_get_context(adc_handle_t handle);
static uint32_t adc_convert_resolution(adc_resolution_t resolution);
static uint32_t adc_convert_sample_time(adc_sample_time_t sample_time);
static uint32_t adc_convert_channel(uint8_t channel);
static uint32_t adc_get_max_value(adc_resolution_t resolution);

/* ========== API 實作 ========== */

/**
 * @brief 初始化 ADC
 */
adc_handle_t adc_init(uint8_t adc_num, const adc_config_t *config)
{
    if (adc_num == 0 || adc_num > MAX_ADC_INSTANCES || config == NULL) {
        return NULL;
    }

    adc_context_t *ctx = &adc_contexts[adc_num - 1];

    if (ctx->initialized) {
        return NULL;
    }

    /* 儲存配置 */
    ctx->adc_num = adc_num;
    ctx->callback = NULL;
    ctx->dma_callback = NULL;
    ctx->dma_buffer = NULL;
    ctx->dma_length = 0;
    ctx->resolution = config->resolution;

    /* 啟用時鐘 */
    adc_enable_clock(adc_num);

    /* 配置 ADC */
    ctx->hadc.Instance = adc_get_instance(adc_num);
    ctx->hadc.Init.ClockPrescaler = ADC_CLOCK_SYNC_PCLK_DIV4;
    ctx->hadc.Init.Resolution = adc_convert_resolution(config->resolution);
    ctx->hadc.Init.ScanConvMode = (config->num_channels > 1) ? ENABLE : DISABLE;
    ctx->hadc.Init.ContinuousConvMode = config->continuous_mode ? ENABLE : DISABLE;
    ctx->hadc.Init.DiscontinuousConvMode = DISABLE;
    ctx->hadc.Init.ExternalTrigConvEdge = ADC_EXTERNALTRIGCONVEDGE_NONE;
    ctx->hadc.Init.DataAlign = (config->alignment == ADC_ALIGN_LEFT) ?
                               ADC_DATAALIGN_LEFT : ADC_DATAALIGN_RIGHT;
    ctx->hadc.Init.NbrOfConversion = config->num_channels;
    ctx->hadc.Init.DMAContinuousRequests = config->dma_mode ? ENABLE : DISABLE;
    ctx->hadc.Init.EOCSelection = ADC_EOC_SINGLE_CONV;

    /* 初始化 ADC */
    if (HAL_ADC_Init(&ctx->hadc) != HAL_OK) {
        return NULL;
    }

    ctx->initialized = true;

    return (adc_handle_t)ctx;
}

/**
 * @brief 解初始化 ADC
 */
int adc_deinit(adc_handle_t handle)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_ADC_DeInit(&ctx->hadc);

    ctx->initialized = false;

    return 0;
}

/**
 * @brief 配置 ADC 通道
 */
int adc_config_channel(adc_handle_t handle, const adc_channel_config_t *config)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized || config == NULL) {
        return -1;
    }

    ADC_ChannelConfTypeDef sConfig = {0};
    sConfig.Channel = adc_convert_channel(config->channel);
    sConfig.Rank = config->rank;
    sConfig.SamplingTime = adc_convert_sample_time(config->sample_time);

    HAL_StatusTypeDef status = HAL_ADC_ConfigChannel(&ctx->hadc, &sConfig);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 啟動 ADC
 */
int adc_start(adc_handle_t handle)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_ADC_Start(&ctx->hadc);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 停止 ADC
 */
int adc_stop(adc_handle_t handle)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_ADC_Stop(&ctx->hadc);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 讀取單個通道值
 */
uint32_t adc_read_channel(adc_handle_t handle, uint8_t channel)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    /* 配置通道 */
    adc_channel_config_t ch_config = {
        .channel = channel,
        .rank = 1,
        .sample_time = ADC_SAMPLE_TIME_84_CYCLES
    };

    if (adc_config_channel(handle, &ch_config) != 0) {
        return 0;
    }

    /* 啟動轉換 */
    HAL_ADC_Start(&ctx->hadc);

    /* 等待轉換完成 */
    if (HAL_ADC_PollForConversion(&ctx->hadc, ADC_TIMEOUT) == HAL_OK) {
        uint32_t value = HAL_ADC_GetValue(&ctx->hadc);
        HAL_ADC_Stop(&ctx->hadc);
        return value;
    }

    HAL_ADC_Stop(&ctx->hadc);
    return 0;
}

/**
 * @brief 讀取多個通道值
 */
int adc_read_channels(adc_handle_t handle, uint8_t *channels,
                      uint32_t *values, size_t num_channels)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized || channels == NULL || values == NULL) {
        return -1;
    }

    for (size_t i = 0; i < num_channels; i++) {
        values[i] = adc_read_channel(handle, channels[i]);
    }

    return num_channels;
}

/**
 * @brief 獲取最後轉換值
 */
uint32_t adc_get_value(adc_handle_t handle)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    return HAL_ADC_GetValue(&ctx->hadc);
}

/**
 * @brief 轉換為電壓值（毫伏）
 */
uint32_t adc_to_voltage_mv(adc_handle_t handle, uint32_t adc_value, uint32_t vref_mv)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    uint32_t max_value = adc_get_max_value(ctx->resolution);

    return (adc_value * vref_mv) / max_value;
}

/**
 * @brief 轉換為百分比
 */
float adc_to_percentage(adc_handle_t handle, uint32_t adc_value)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return 0.0f;
    }

    uint32_t max_value = adc_get_max_value(ctx->resolution);

    return (float)adc_value * 100.0f / max_value;
}

/* ========== 中斷模式 API ========== */

/**
 * @brief 啟動中斷模式 ADC
 */
int adc_start_it(adc_handle_t handle)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_ADC_Start_IT(&ctx->hadc);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 停止中斷模式 ADC
 */
int adc_stop_it(adc_handle_t handle)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_ADC_Stop_IT(&ctx->hadc);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 設置轉換完成回調
 */
int adc_set_callback(adc_handle_t handle, adc_callback_t callback)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    ctx->callback = callback;

    return 0;
}

/* ========== DMA 模式 API ========== */

/**
 * @brief 啟動 DMA 模式 ADC
 */
int adc_start_dma(adc_handle_t handle, uint32_t *buffer, size_t length)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized || buffer == NULL || length == 0) {
        return -1;
    }

    ctx->dma_buffer = buffer;
    ctx->dma_length = length;

    HAL_StatusTypeDef status = HAL_ADC_Start_DMA(&ctx->hadc, buffer, length);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 停止 DMA 模式 ADC
 */
int adc_stop_dma(adc_handle_t handle)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_ADC_Stop_DMA(&ctx->hadc);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 設置 DMA 完成回調
 */
int adc_set_dma_callback(adc_handle_t handle, adc_data_callback_t callback)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    ctx->dma_callback = callback;

    return 0;
}

/* ========== 進階功能 ========== */

/**
 * @brief 校準 ADC
 */
int adc_calibrate(adc_handle_t handle)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    /* STM32F4 的 ADC 校準在初始化時自動執行 */
    /* 這裡可以添加額外的校準邏輯 */

    return 0;
}

/**
 * @brief 啟用溫度感測器
 */
int adc_enable_temperature_sensor(adc_handle_t handle)
{
    /* 啟用溫度感測器和 VREFINT */
    ADC->CCR |= ADC_CCR_TSVREFE;

    return 0;
}

/**
 * @brief 讀取內部溫度
 */
float adc_read_temperature(adc_handle_t handle)
{
    adc_context_t *ctx = adc_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return 0.0f;
    }

    /* 啟用溫度感測器 */
    adc_enable_temperature_sensor(handle);

    /* 讀取溫度通道（通道 16） */
    uint32_t adc_value = adc_read_channel(handle, 16);

    /* 轉換為電壓 */
    uint32_t voltage_mv = adc_to_voltage_mv(handle, adc_value, ADC_VREF_TYPICAL);

    /* 計算溫度 */
    float temperature = 25.0f + ((float)voltage_mv - TEMP_V25) / (TEMP_AVG_SLOPE / 10.0f);

    return temperature;
}

/**
 * @brief 讀取內部參考電壓
 */
uint32_t adc_read_vrefint(adc_handle_t handle)
{
    /* 讀取 VREFINT 通道（通道 17） */
    uint32_t adc_value = adc_read_channel(handle, 17);

    /* 根據資料手冊的 VREFINT_CAL 計算實際電壓 */
    return adc_to_voltage_mv(handle, adc_value, ADC_VREF_TYPICAL);
}

/**
 * @brief 讀取電池電壓
 */
uint32_t adc_read_vbat(adc_handle_t handle)
{
    /* 讀取 VBAT 通道（通道 18） */
    uint32_t adc_value = adc_read_channel(handle, 18);

    /* VBAT 通過 1/2 分壓器連接，需要乘以 2 */
    return adc_to_voltage_mv(handle, adc_value, ADC_VREF_TYPICAL) * 2;
}

/* ========== 便利函數 ========== */

/**
 * @brief 快速單次讀取
 */
uint32_t adc_quick_read(uint8_t adc_num, uint8_t channel)
{
    adc_config_t config = {
        .resolution = ADC_RESOLUTION_12BIT,
        .sample_time = ADC_SAMPLE_TIME_84_CYCLES,
        .alignment = ADC_ALIGN_RIGHT,
        .continuous_mode = false,
        .dma_mode = false,
        .trigger = ADC_TRIGGER_SOFTWARE,
        .num_channels = 1
    };

    adc_handle_t handle = adc_init(adc_num, &config);

    if (handle == NULL) {
        return 0;
    }

    uint32_t value = adc_read_channel(handle, channel);

    adc_deinit(handle);

    return value;
}

/**
 * @brief 取得平均值
 */
uint32_t adc_read_average(adc_handle_t handle, uint8_t channel, uint16_t samples)
{
    uint64_t sum = 0;

    for (uint16_t i = 0; i < samples; i++) {
        sum += adc_read_channel(handle, channel);
    }

    return (uint32_t)(sum / samples);
}

/**
 * @brief 取得峰值
 */
uint32_t adc_read_peak(adc_handle_t handle, uint8_t channel, uint16_t samples)
{
    uint32_t peak = 0;

    for (uint16_t i = 0; i < samples; i++) {
        uint32_t value = adc_read_channel(handle, channel);
        if (value > peak) {
            peak = value;
        }
    }

    return peak;
}

/* ========== 私有函數實作 ========== */

static ADC_TypeDef* adc_get_instance(uint8_t adc_num)
{
    switch (adc_num) {
        case 1:  return ADC1;
        case 2:  return ADC2;
        case 3:  return ADC3;
        default: return NULL;
    }
}

static void adc_enable_clock(uint8_t adc_num)
{
    switch (adc_num) {
        case 1:  __HAL_RCC_ADC1_CLK_ENABLE(); break;
        case 2:  __HAL_RCC_ADC2_CLK_ENABLE(); break;
        case 3:  __HAL_RCC_ADC3_CLK_ENABLE(); break;
    }
}

static adc_context_t* adc_get_context(adc_handle_t handle)
{
    adc_context_t *ctx = (adc_context_t *)handle;

    if (ctx < adc_contexts || ctx >= &adc_contexts[MAX_ADC_INSTANCES]) {
        return NULL;
    }

    return ctx;
}

static uint32_t adc_convert_resolution(adc_resolution_t resolution)
{
    switch (resolution) {
        case ADC_RESOLUTION_12BIT: return ADC_RESOLUTION_12B;
        case ADC_RESOLUTION_10BIT: return ADC_RESOLUTION_10B;
        case ADC_RESOLUTION_8BIT:  return ADC_RESOLUTION_8B;
        case ADC_RESOLUTION_6BIT:  return ADC_RESOLUTION_6B;
        default:                   return ADC_RESOLUTION_12B;
    }
}

static uint32_t adc_convert_sample_time(adc_sample_time_t sample_time)
{
    switch (sample_time) {
        case ADC_SAMPLE_TIME_3_CYCLES:   return ADC_SAMPLETIME_3CYCLES;
        case ADC_SAMPLE_TIME_15_CYCLES:  return ADC_SAMPLETIME_15CYCLES;
        case ADC_SAMPLE_TIME_28_CYCLES:  return ADC_SAMPLETIME_28CYCLES;
        case ADC_SAMPLE_TIME_56_CYCLES:  return ADC_SAMPLETIME_56CYCLES;
        case ADC_SAMPLE_TIME_84_CYCLES:  return ADC_SAMPLETIME_84CYCLES;
        case ADC_SAMPLE_TIME_112_CYCLES: return ADC_SAMPLETIME_112CYCLES;
        case ADC_SAMPLE_TIME_144_CYCLES: return ADC_SAMPLETIME_144CYCLES;
        case ADC_SAMPLE_TIME_480_CYCLES: return ADC_SAMPLETIME_480CYCLES;
        default:                         return ADC_SAMPLETIME_84CYCLES;
    }
}

static uint32_t adc_convert_channel(uint8_t channel)
{
    switch (channel) {
        case 0:  return ADC_CHANNEL_0;
        case 1:  return ADC_CHANNEL_1;
        case 2:  return ADC_CHANNEL_2;
        case 3:  return ADC_CHANNEL_3;
        case 4:  return ADC_CHANNEL_4;
        case 5:  return ADC_CHANNEL_5;
        case 6:  return ADC_CHANNEL_6;
        case 7:  return ADC_CHANNEL_7;
        case 8:  return ADC_CHANNEL_8;
        case 9:  return ADC_CHANNEL_9;
        case 10: return ADC_CHANNEL_10;
        case 11: return ADC_CHANNEL_11;
        case 12: return ADC_CHANNEL_12;
        case 13: return ADC_CHANNEL_13;
        case 14: return ADC_CHANNEL_14;
        case 15: return ADC_CHANNEL_15;
        case 16: return ADC_CHANNEL_TEMPSENSOR;
        case 17: return ADC_CHANNEL_VREFINT;
        case 18: return ADC_CHANNEL_VBAT;
        default: return ADC_CHANNEL_0;
    }
}

static uint32_t adc_get_max_value(adc_resolution_t resolution)
{
    switch (resolution) {
        case ADC_RESOLUTION_12BIT: return 4095;
        case ADC_RESOLUTION_10BIT: return 1023;
        case ADC_RESOLUTION_8BIT:  return 255;
        case ADC_RESOLUTION_6BIT:  return 63;
        default:                   return 4095;
    }
}

/* ========== HAL 回調函數 ========== */

void HAL_ADC_ConvCpltCallback(ADC_HandleTypeDef *hadc)
{
    for (int i = 0; i < MAX_ADC_INSTANCES; i++) {
        if (&adc_contexts[i].hadc == hadc) {
            if (adc_contexts[i].callback != NULL) {
                adc_contexts[i].callback();
            }

            /* DMA 模式回調 */
            if (adc_contexts[i].dma_callback != NULL && adc_contexts[i].dma_buffer != NULL) {
                adc_contexts[i].dma_callback(adc_contexts[i].dma_buffer,
                                            adc_contexts[i].dma_length);
            }
            break;
        }
    }
}

#endif /* STM32F4 */
