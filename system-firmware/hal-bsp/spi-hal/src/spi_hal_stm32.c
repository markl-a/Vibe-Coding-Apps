/**
 * @file spi_hal_stm32.c
 * @brief SPI HAL implementation for STM32F4xx
 * @version 1.0.0
 * @date 2025-11-18
 *
 * STM32F4 平台的 SPI HAL 實作
 * 支援阻塞、中斷和DMA三種傳輸模式
 */

#include "spi_hal.h"

#ifdef STM32F4

#include "stm32f4xx_hal.h"
#include <string.h>

/* ========== 私有定義 ========== */

#define MAX_SPI_INSTANCES  6    /**< STM32F4 最多支援 6 個 SPI */
#define SPI_TIMEOUT        1000  /**< 預設超時時間 (ms) */

/**
 * @brief SPI 內部上下文結構
 */
typedef struct {
    SPI_HandleTypeDef hspi;     /**< STM32 HAL SPI 句柄 */
    uint8_t spi_num;            /**< SPI 編號 */
    bool initialized;           /**< 初始化標誌 */
    spi_callback_t tx_callback; /**< 發送完成回調 */
    spi_callback_t rx_callback; /**< 接收完成回調 */
} spi_context_t;

/* ========== 私有變數 ========== */

static spi_context_t spi_contexts[MAX_SPI_INSTANCES] = {0};

/* ========== 私有函數聲明 ========== */

static SPI_TypeDef* spi_get_instance(uint8_t spi_num);
static void spi_enable_clock(uint8_t spi_num);
static spi_context_t* spi_get_context(spi_handle_t handle);
static uint32_t spi_convert_mode(spi_mode_t mode);
static uint32_t spi_convert_cpol(spi_cpol_t cpol);
static uint32_t spi_convert_cpha(spi_cpha_t cpha);
static uint32_t spi_convert_datasize(spi_datasize_t datasize);
static uint32_t spi_convert_firstbit(spi_firstbit_t firstbit);
static uint32_t spi_convert_prescaler(spi_baudrate_prescaler_t prescaler);

/* ========== API 實作 ========== */

/**
 * @brief 初始化 SPI
 */
spi_handle_t spi_init(uint8_t spi_num, const spi_config_t *config)
{
    if (spi_num == 0 || spi_num > MAX_SPI_INSTANCES || config == NULL) {
        return NULL;
    }

    spi_context_t *ctx = &spi_contexts[spi_num - 1];

    /* 檢查是否已初始化 */
    if (ctx->initialized) {
        return NULL;
    }

    /* 儲存配置 */
    ctx->spi_num = spi_num;
    ctx->tx_callback = NULL;
    ctx->rx_callback = NULL;

    /* 啟用時鐘 */
    spi_enable_clock(spi_num);

    /* 配置 SPI */
    ctx->hspi.Instance = spi_get_instance(spi_num);
    ctx->hspi.Init.Mode = spi_convert_mode(config->mode);
    ctx->hspi.Init.Direction = SPI_DIRECTION_2LINES;
    ctx->hspi.Init.DataSize = spi_convert_datasize(config->data_size);
    ctx->hspi.Init.CLKPolarity = spi_convert_cpol(config->clock_polarity);
    ctx->hspi.Init.CLKPhase = spi_convert_cpha(config->clock_phase);
    ctx->hspi.Init.NSS = SPI_NSS_SOFT;
    ctx->hspi.Init.BaudRatePrescaler = spi_convert_prescaler(config->baudrate_prescaler);
    ctx->hspi.Init.FirstBit = spi_convert_firstbit(config->first_bit);
    ctx->hspi.Init.TIMode = SPI_TIMODE_DISABLE;
    ctx->hspi.Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;
    ctx->hspi.Init.CRCPolynomial = 10;

    /* 初始化 SPI */
    if (HAL_SPI_Init(&ctx->hspi) != HAL_OK) {
        return NULL;
    }

    ctx->initialized = true;

    return (spi_handle_t)ctx;
}

/**
 * @brief 解初始化 SPI
 */
int spi_deinit(spi_handle_t handle)
{
    spi_context_t *ctx = spi_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_SPI_DeInit(&ctx->hspi);

    ctx->initialized = false;
    ctx->tx_callback = NULL;
    ctx->rx_callback = NULL;

    return 0;
}

/**
 * @brief 全雙工傳輸（同時發送和接收）
 */
int spi_transfer(spi_handle_t handle, const uint8_t *tx_data,
                 uint8_t *rx_data, size_t len)
{
    spi_context_t *ctx = spi_get_context(handle);

    if (ctx == NULL || !ctx->initialized || len == 0) {
        return -1;
    }

    HAL_StatusTypeDef status;

    if (tx_data != NULL && rx_data != NULL) {
        /* 全雙工傳輸 */
        status = HAL_SPI_TransmitReceive(&ctx->hspi, (uint8_t *)tx_data,
                                         rx_data, len, SPI_TIMEOUT);
    } else if (tx_data != NULL) {
        /* 僅發送 */
        status = HAL_SPI_Transmit(&ctx->hspi, (uint8_t *)tx_data,
                                  len, SPI_TIMEOUT);
    } else if (rx_data != NULL) {
        /* 僅接收 */
        status = HAL_SPI_Receive(&ctx->hspi, rx_data, len, SPI_TIMEOUT);
    } else {
        return -1;
    }

    return (status == HAL_OK) ? (int)len : -1;
}

/**
 * @brief 僅發送數據
 */
int spi_transmit(spi_handle_t handle, const uint8_t *data, size_t len)
{
    spi_context_t *ctx = spi_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_SPI_Transmit(&ctx->hspi, (uint8_t *)data,
                                                 len, SPI_TIMEOUT);

    return (status == HAL_OK) ? (int)len : -1;
}

/**
 * @brief 僅接收數據
 */
int spi_receive(spi_handle_t handle, uint8_t *data, size_t len)
{
    spi_context_t *ctx = spi_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_SPI_Receive(&ctx->hspi, data,
                                                len, SPI_TIMEOUT);

    return (status == HAL_OK) ? (int)len : -1;
}

/**
 * @brief DMA 模式全雙工傳輸
 */
int spi_transfer_dma(spi_handle_t handle, const uint8_t *tx_data,
                     uint8_t *rx_data, size_t len)
{
    spi_context_t *ctx = spi_get_context(handle);

    if (ctx == NULL || !ctx->initialized || len == 0) {
        return -1;
    }

    HAL_StatusTypeDef status;

    if (tx_data != NULL && rx_data != NULL) {
        /* 全雙工 DMA 傳輸 */
        status = HAL_SPI_TransmitReceive_DMA(&ctx->hspi, (uint8_t *)tx_data,
                                             rx_data, len);
    } else if (tx_data != NULL) {
        /* 僅發送 DMA */
        status = HAL_SPI_Transmit_DMA(&ctx->hspi, (uint8_t *)tx_data, len);
    } else if (rx_data != NULL) {
        /* 僅接收 DMA */
        status = HAL_SPI_Receive_DMA(&ctx->hspi, rx_data, len);
    } else {
        return -1;
    }

    return (status == HAL_OK) ? 0 : -1;
}

/* ========== 進階 API ========== */

/**
 * @brief 設置回調函數
 */
int spi_set_callback(spi_handle_t handle,
                     spi_callback_t tx_callback,
                     spi_callback_t rx_callback)
{
    spi_context_t *ctx = spi_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    ctx->tx_callback = tx_callback;
    ctx->rx_callback = rx_callback;

    return 0;
}

/**
 * @brief 中斷模式全雙工傳輸
 */
int spi_transfer_it(spi_handle_t handle, const uint8_t *tx_data,
                    uint8_t *rx_data, size_t len)
{
    spi_context_t *ctx = spi_get_context(handle);

    if (ctx == NULL || !ctx->initialized || len == 0) {
        return -1;
    }

    HAL_StatusTypeDef status;

    if (tx_data != NULL && rx_data != NULL) {
        status = HAL_SPI_TransmitReceive_IT(&ctx->hspi, (uint8_t *)tx_data,
                                            rx_data, len);
    } else if (tx_data != NULL) {
        status = HAL_SPI_Transmit_IT(&ctx->hspi, (uint8_t *)tx_data, len);
    } else if (rx_data != NULL) {
        status = HAL_SPI_Receive_IT(&ctx->hspi, rx_data, len);
    } else {
        return -1;
    }

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 寫入單個字節並讀取返回值
 */
uint8_t spi_transfer_byte(spi_handle_t handle, uint8_t data)
{
    uint8_t rx_data = 0;
    spi_transfer(handle, &data, &rx_data, 1);
    return rx_data;
}

/**
 * @brief 獲取 SPI 狀態
 */
int spi_get_state(spi_handle_t handle)
{
    spi_context_t *ctx = spi_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    return (int)HAL_SPI_GetState(&ctx->hspi);
}

/**
 * @brief 中止傳輸
 */
int spi_abort(spi_handle_t handle)
{
    spi_context_t *ctx = spi_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_SPI_Abort(&ctx->hspi);

    return (status == HAL_OK) ? 0 : -1;
}

/* ========== 私有函數實作 ========== */

/**
 * @brief 獲取 SPI 實例
 */
static SPI_TypeDef* spi_get_instance(uint8_t spi_num)
{
    switch (spi_num) {
        case 1:  return SPI1;
        case 2:  return SPI2;
        case 3:  return SPI3;
        case 4:  return SPI4;
        case 5:  return SPI5;
        case 6:  return SPI6;
        default: return NULL;
    }
}

/**
 * @brief 啟用 SPI 時鐘
 */
static void spi_enable_clock(uint8_t spi_num)
{
    switch (spi_num) {
        case 1:  __HAL_RCC_SPI1_CLK_ENABLE(); break;
        case 2:  __HAL_RCC_SPI2_CLK_ENABLE(); break;
        case 3:  __HAL_RCC_SPI3_CLK_ENABLE(); break;
        case 4:  __HAL_RCC_SPI4_CLK_ENABLE(); break;
        case 5:  __HAL_RCC_SPI5_CLK_ENABLE(); break;
        case 6:  __HAL_RCC_SPI6_CLK_ENABLE(); break;
    }
}

/**
 * @brief 從句柄獲取上下文
 */
static spi_context_t* spi_get_context(spi_handle_t handle)
{
    spi_context_t *ctx = (spi_context_t *)handle;

    /* 驗證句柄 */
    if (ctx < spi_contexts || ctx >= &spi_contexts[MAX_SPI_INSTANCES]) {
        return NULL;
    }

    return ctx;
}

/**
 * @brief 轉換模式到 STM32 定義
 */
static uint32_t spi_convert_mode(spi_mode_t mode)
{
    return (mode == SPI_MODE_MASTER) ? SPI_MODE_MASTER : SPI_MODE_SLAVE;
}

/**
 * @brief 轉換時鐘極性到 STM32 定義
 */
static uint32_t spi_convert_cpol(spi_cpol_t cpol)
{
    return (cpol == SPI_CPOL_HIGH) ? SPI_POLARITY_HIGH : SPI_POLARITY_LOW;
}

/**
 * @brief 轉換時鐘相位到 STM32 定義
 */
static uint32_t spi_convert_cpha(spi_cpha_t cpha)
{
    return (cpha == SPI_CPHA_2EDGE) ? SPI_PHASE_2EDGE : SPI_PHASE_1EDGE;
}

/**
 * @brief 轉換數據大小到 STM32 定義
 */
static uint32_t spi_convert_datasize(spi_datasize_t datasize)
{
    return (datasize == SPI_DATASIZE_16BIT) ? SPI_DATASIZE_16BIT : SPI_DATASIZE_8BIT;
}

/**
 * @brief 轉換首位順序到 STM32 定義
 */
static uint32_t spi_convert_firstbit(spi_firstbit_t firstbit)
{
    return (firstbit == SPI_FIRSTBIT_LSB) ? SPI_FIRSTBIT_LSB : SPI_FIRSTBIT_MSB;
}

/**
 * @brief 轉換波特率分頻到 STM32 定義
 */
static uint32_t spi_convert_prescaler(spi_baudrate_prescaler_t prescaler)
{
    switch (prescaler) {
        case SPI_BAUDRATE_PRESCALER_2:   return SPI_BAUDRATEPRESCALER_2;
        case SPI_BAUDRATE_PRESCALER_4:   return SPI_BAUDRATEPRESCALER_4;
        case SPI_BAUDRATE_PRESCALER_8:   return SPI_BAUDRATEPRESCALER_8;
        case SPI_BAUDRATE_PRESCALER_16:  return SPI_BAUDRATEPRESCALER_16;
        case SPI_BAUDRATE_PRESCALER_32:  return SPI_BAUDRATEPRESCALER_32;
        case SPI_BAUDRATE_PRESCALER_64:  return SPI_BAUDRATEPRESCALER_64;
        case SPI_BAUDRATE_PRESCALER_128: return SPI_BAUDRATEPRESCALER_128;
        case SPI_BAUDRATE_PRESCALER_256: return SPI_BAUDRATEPRESCALER_256;
        default:                         return SPI_BAUDRATEPRESCALER_2;
    }
}

/* ========== HAL 回調函數 ========== */

/**
 * @brief 發送完成回調
 */
void HAL_SPI_TxCpltCallback(SPI_HandleTypeDef *hspi)
{
    for (int i = 0; i < MAX_SPI_INSTANCES; i++) {
        if (&spi_contexts[i].hspi == hspi) {
            if (spi_contexts[i].tx_callback != NULL) {
                spi_contexts[i].tx_callback();
            }
            break;
        }
    }
}

/**
 * @brief 接收完成回調
 */
void HAL_SPI_RxCpltCallback(SPI_HandleTypeDef *hspi)
{
    for (int i = 0; i < MAX_SPI_INSTANCES; i++) {
        if (&spi_contexts[i].hspi == hspi) {
            if (spi_contexts[i].rx_callback != NULL) {
                spi_contexts[i].rx_callback();
            }
            break;
        }
    }
}

/**
 * @brief 全雙工傳輸完成回調
 */
void HAL_SPI_TxRxCpltCallback(SPI_HandleTypeDef *hspi)
{
    for (int i = 0; i < MAX_SPI_INSTANCES; i++) {
        if (&spi_contexts[i].hspi == hspi) {
            /* 兩個回調都調用 */
            if (spi_contexts[i].tx_callback != NULL) {
                spi_contexts[i].tx_callback();
            }
            if (spi_contexts[i].rx_callback != NULL) {
                spi_contexts[i].rx_callback();
            }
            break;
        }
    }
}

/**
 * @brief 錯誤回調
 */
void HAL_SPI_ErrorCallback(SPI_HandleTypeDef *hspi)
{
    /* 錯誤處理 - 可以在這裡添加錯誤日誌 */
    /* 重置 SPI */
    __HAL_SPI_DISABLE(hspi);
    __HAL_SPI_ENABLE(hspi);
}

#endif /* STM32F4 */
