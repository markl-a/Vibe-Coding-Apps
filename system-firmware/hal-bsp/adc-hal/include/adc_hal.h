/**
 * @file adc_hal.h
 * @brief ADC Hardware Abstraction Layer Interface
 * @version 1.0.0
 * @date 2025-11-18
 *
 * 通用 ADC 硬體抽象層介面定義
 * 支援單次轉換、連續轉換、DMA 和中斷模式
 */

#ifndef ADC_HAL_H
#define ADC_HAL_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>

/* ========== 型別定義 ========== */

/**
 * @brief ADC 解析度
 */
typedef enum {
    ADC_RESOLUTION_12BIT,   /**< 12位元解析度 */
    ADC_RESOLUTION_10BIT,   /**< 10位元解析度 */
    ADC_RESOLUTION_8BIT,    /**< 8位元解析度 */
    ADC_RESOLUTION_6BIT     /**< 6位元解析度 */
} adc_resolution_t;

/**
 * @brief ADC 取樣時間
 */
typedef enum {
    ADC_SAMPLE_TIME_3_CYCLES,    /**< 3 個週期 */
    ADC_SAMPLE_TIME_15_CYCLES,   /**< 15 個週期 */
    ADC_SAMPLE_TIME_28_CYCLES,   /**< 28 個週期 */
    ADC_SAMPLE_TIME_56_CYCLES,   /**< 56 個週期 */
    ADC_SAMPLE_TIME_84_CYCLES,   /**< 84 個週期 */
    ADC_SAMPLE_TIME_112_CYCLES,  /**< 112 個週期 */
    ADC_SAMPLE_TIME_144_CYCLES,  /**< 144 個週期 */
    ADC_SAMPLE_TIME_480_CYCLES   /**< 480 個週期 */
} adc_sample_time_t;

/**
 * @brief ADC 對齊模式
 */
typedef enum {
    ADC_ALIGN_RIGHT,        /**< 右對齊 */
    ADC_ALIGN_LEFT          /**< 左對齊 */
} adc_align_t;

/**
 * @brief ADC 觸發源
 */
typedef enum {
    ADC_TRIGGER_SOFTWARE,   /**< 軟體觸發 */
    ADC_TRIGGER_TIMER1,     /**< Timer 1 觸發 */
    ADC_TRIGGER_TIMER2,     /**< Timer 2 觸發 */
    ADC_TRIGGER_TIMER3,     /**< Timer 3 觸發 */
    ADC_TRIGGER_EXTERNAL    /**< 外部觸發 */
} adc_trigger_t;

/**
 * @brief ADC 配置結構
 */
typedef struct {
    adc_resolution_t resolution;    /**< 解析度 */
    adc_sample_time_t sample_time;  /**< 取樣時間 */
    adc_align_t alignment;          /**< 數據對齊 */
    bool continuous_mode;           /**< 連續轉換模式 */
    bool dma_mode;                  /**< DMA 模式 */
    adc_trigger_t trigger;          /**< 觸發源 */
    uint8_t num_channels;           /**< 通道數量 */
} adc_config_t;

/**
 * @brief ADC 通道配置
 */
typedef struct {
    uint8_t channel;                /**< ADC 通道編號 */
    adc_sample_time_t sample_time;  /**< 取樣時間 */
    uint8_t rank;                   /**< 轉換順序 */
} adc_channel_config_t;

/**
 * @brief ADC 句柄類型
 */
typedef void* adc_handle_t;

/**
 * @brief ADC 轉換完成回調
 */
typedef void (*adc_callback_t)(void);

/**
 * @brief ADC 數據處理回調
 */
typedef void (*adc_data_callback_t)(uint32_t *data, size_t len);

/* ========== API 函數 ========== */

/**
 * @brief 初始化 ADC
 */
adc_handle_t adc_init(uint8_t adc_num, const adc_config_t *config);

/**
 * @brief 解初始化 ADC
 */
int adc_deinit(adc_handle_t handle);

/**
 * @brief 配置 ADC 通道
 */
int adc_config_channel(adc_handle_t handle, const adc_channel_config_t *config);

/**
 * @brief 啟動 ADC
 */
int adc_start(adc_handle_t handle);

/**
 * @brief 停止 ADC
 */
int adc_stop(adc_handle_t handle);

/**
 * @brief 讀取單個通道值（阻塞模式）
 */
uint32_t adc_read_channel(adc_handle_t handle, uint8_t channel);

/**
 * @brief 讀取多個通道值（阻塞模式）
 */
int adc_read_channels(adc_handle_t handle, uint8_t *channels,
                      uint32_t *values, size_t num_channels);

/**
 * @brief 獲取最後轉換值
 */
uint32_t adc_get_value(adc_handle_t handle);

/**
 * @brief 轉換為電壓值（毫伏）
 */
uint32_t adc_to_voltage_mv(adc_handle_t handle, uint32_t adc_value, uint32_t vref_mv);

/**
 * @brief 轉換為百分比
 */
float adc_to_percentage(adc_handle_t handle, uint32_t adc_value);

/* ========== 中斷模式 API ========== */

/**
 * @brief 啟動中斷模式 ADC
 */
int adc_start_it(adc_handle_t handle);

/**
 * @brief 停止中斷模式 ADC
 */
int adc_stop_it(adc_handle_t handle);

/**
 * @brief 設置轉換完成回調
 */
int adc_set_callback(adc_handle_t handle, adc_callback_t callback);

/* ========== DMA 模式 API ========== */

/**
 * @brief 啟動 DMA 模式 ADC
 */
int adc_start_dma(adc_handle_t handle, uint32_t *buffer, size_t length);

/**
 * @brief 停止 DMA 模式 ADC
 */
int adc_stop_dma(adc_handle_t handle);

/**
 * @brief 設置 DMA 完成回調
 */
int adc_set_dma_callback(adc_handle_t handle, adc_data_callback_t callback);

/* ========== 進階功能 ========== */

/**
 * @brief 校準 ADC
 */
int adc_calibrate(adc_handle_t handle);

/**
 * @brief 設置看門狗（監控電壓範圍）
 */
int adc_set_watchdog(adc_handle_t handle, uint8_t channel,
                     uint32_t low_threshold, uint32_t high_threshold);

/**
 * @brief 啟用溫度感測器
 */
int adc_enable_temperature_sensor(adc_handle_t handle);

/**
 * @brief 讀取內部溫度（攝氏度）
 */
float adc_read_temperature(adc_handle_t handle);

/**
 * @brief 讀取內部參考電壓（毫伏）
 */
uint32_t adc_read_vrefint(adc_handle_t handle);

/**
 * @brief 讀取電池電壓（毫伏）
 */
uint32_t adc_read_vbat(adc_handle_t handle);

/* ========== 便利函數 ========== */

/**
 * @brief 快速單次讀取（簡化版）
 */
uint32_t adc_quick_read(uint8_t adc_num, uint8_t channel);

/**
 * @brief 取得平均值（多次採樣）
 */
uint32_t adc_read_average(adc_handle_t handle, uint8_t channel, uint16_t samples);

/**
 * @brief 取得峰值
 */
uint32_t adc_read_peak(adc_handle_t handle, uint8_t channel, uint16_t samples);

#ifdef __cplusplus
}
#endif

#endif /* ADC_HAL_H */
