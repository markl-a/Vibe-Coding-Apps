/**
 * @file uart_hal_stm32.c
 * @brief UART HAL implementation for STM32F4xx
 * @version 1.0.0
 * @date 2025-11-18
 *
 * STM32F4 平台的 UART HAL 實作
 * 支援阻塞、中斷和DMA三種傳輸模式
 */

#include "uart_hal.h"

#ifdef STM32F4

#include "stm32f4xx_hal.h"
#include <string.h>
#include <stdarg.h>
#include <stdio.h>

/* ========== 私有定義 ========== */

#define MAX_UART_INSTANCES  6    /**< STM32F4 最多支援 6 個 USART */
#define UART_TX_BUFFER_SIZE 256  /**< 發送緩衝區大小 */
#define UART_RX_BUFFER_SIZE 256  /**< 接收緩衝區大小 */

/**
 * @brief UART 內部上下文結構
 */
typedef struct {
    UART_HandleTypeDef huart;           /**< STM32 HAL UART 句柄 */
    uint8_t uart_num;                   /**< UART 編號 */
    uart_callback_t tx_callback;        /**< 發送完成回調 */
    uart_callback_t rx_callback;        /**< 接收完成回調 */
    uart_dma_mode_t dma_mode;           /**< DMA 模式 */
    bool initialized;                   /**< 初始化標誌 */

    /* 循環緩衝區 */
    uint8_t tx_buffer[UART_TX_BUFFER_SIZE];
    uint8_t rx_buffer[UART_RX_BUFFER_SIZE];
    volatile uint16_t rx_head;          /**< 接收緩衝區頭指標 */
    volatile uint16_t rx_tail;          /**< 接收緩衝區尾指標 */
} uart_context_t;

/* ========== 私有變數 ========== */

static uart_context_t uart_contexts[MAX_UART_INSTANCES] = {0};

/* ========== 私有函數聲明 ========== */

static USART_TypeDef* uart_get_instance(uint8_t uart_num);
static void uart_enable_clock(uint8_t uart_num);
static IRQn_Type uart_get_irq_number(uint8_t uart_num);
static uart_context_t* uart_get_context(uart_handle_t handle);

/* ========== API 實作 ========== */

/**
 * @brief 初始化 UART
 */
uart_handle_t uart_init(uint8_t uart_num, const uart_config_t *config)
{
    if (uart_num == 0 || uart_num > MAX_UART_INSTANCES || config == NULL) {
        return NULL;
    }

    uart_context_t *ctx = &uart_contexts[uart_num - 1];

    /* 檢查是否已初始化 */
    if (ctx->initialized) {
        return NULL;
    }

    /* 儲存配置 */
    ctx->uart_num = uart_num;
    ctx->tx_callback = NULL;
    ctx->rx_callback = NULL;
    ctx->dma_mode = UART_DMA_NONE;
    ctx->rx_head = 0;
    ctx->rx_tail = 0;

    /* 啟用時鐘 */
    uart_enable_clock(uart_num);

    /* 配置 UART */
    ctx->huart.Instance = uart_get_instance(uart_num);
    ctx->huart.Init.BaudRate = config->baudrate;

    /* 數據位配置 */
    ctx->huart.Init.WordLength = (config->word_length == 9) ?
                                 UART_WORDLENGTH_9B : UART_WORDLENGTH_8B;

    /* 停止位配置 */
    ctx->huart.Init.StopBits = (config->stop_bits == 2) ?
                               UART_STOPBITS_2 : UART_STOPBITS_1;

    /* 校驗位配置 */
    switch (config->parity) {
        case UART_PARITY_EVEN:
            ctx->huart.Init.Parity = UART_PARITY_EVEN;
            break;
        case UART_PARITY_ODD:
            ctx->huart.Init.Parity = UART_PARITY_ODD;
            break;
        default:
            ctx->huart.Init.Parity = UART_PARITY_NONE;
            break;
    }

    /* 模式設置 */
    ctx->huart.Init.Mode = UART_MODE_TX_RX;
    ctx->huart.Init.OverSampling = UART_OVERSAMPLING_16;

    /* 流控制配置 */
    switch (config->flow_control) {
        case UART_FLOW_CTRL_RTS:
            ctx->huart.Init.HwFlowCtl = UART_HWCONTROL_RTS;
            break;
        case UART_FLOW_CTRL_CTS:
            ctx->huart.Init.HwFlowCtl = UART_HWCONTROL_CTS;
            break;
        case UART_FLOW_CTRL_RTS_CTS:
            ctx->huart.Init.HwFlowCtl = UART_HWCONTROL_RTS_CTS;
            break;
        default:
            ctx->huart.Init.HwFlowCtl = UART_HWCONTROL_NONE;
            break;
    }

    /* 初始化 UART */
    if (HAL_UART_Init(&ctx->huart) != HAL_OK) {
        return NULL;
    }

    ctx->initialized = true;

    return (uart_handle_t)ctx;
}

/**
 * @brief 解初始化 UART
 */
int uart_deinit(uart_handle_t handle)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_UART_DeInit(&ctx->huart);

    ctx->initialized = false;
    ctx->tx_callback = NULL;
    ctx->rx_callback = NULL;

    return 0;
}

/**
 * @brief 阻塞模式發送數據
 */
int uart_send(uart_handle_t handle, const uint8_t *data, size_t len)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_UART_Transmit(&ctx->huart, (uint8_t *)data,
                                                  len, HAL_MAX_DELAY);

    return (status == HAL_OK) ? (int)len : -1;
}

/**
 * @brief 阻塞模式接收數據
 */
int uart_receive(uart_handle_t handle, uint8_t *data, size_t len, uint32_t timeout)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_UART_Receive(&ctx->huart, data, len, timeout);

    return (status == HAL_OK) ? (int)len : -1;
}

/**
 * @brief 中斷模式發送
 */
int uart_send_it(uart_handle_t handle, const uint8_t *data, size_t len)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_UART_Transmit_IT(&ctx->huart, (uint8_t *)data, len);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 中斷模式接收
 */
int uart_receive_it(uart_handle_t handle, uint8_t *data, size_t len)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_UART_Receive_IT(&ctx->huart, data, len);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief DMA 模式發送
 */
int uart_send_dma(uart_handle_t handle, const uint8_t *data, size_t len)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_UART_Transmit_DMA(&ctx->huart, (uint8_t *)data, len);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief DMA 模式接收
 */
int uart_receive_dma(uart_handle_t handle, uint8_t *data, size_t len)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    HAL_StatusTypeDef status = HAL_UART_Receive_DMA(&ctx->huart, data, len);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 設置回調函數
 */
int uart_set_callback(uart_handle_t handle,
                     uart_callback_t tx_callback,
                     uart_callback_t rx_callback)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    ctx->tx_callback = tx_callback;
    ctx->rx_callback = rx_callback;

    return 0;
}

/**
 * @brief 啟用 DMA
 */
int uart_enable_dma(uart_handle_t handle, uart_dma_mode_t mode)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    ctx->dma_mode = mode;

    /* DMA 初始化需要在硬體配置中完成 */
    /* 這裡只是記錄模式 */

    return 0;
}

/**
 * @brief 禁用 DMA
 */
int uart_disable_dma(uart_handle_t handle)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    ctx->dma_mode = UART_DMA_NONE;

    return 0;
}

/**
 * @brief 獲取可用數據量
 */
int uart_available(uart_handle_t handle)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    /* 計算環形緩衝區中的數據量 */
    int available = (int)(ctx->rx_head - ctx->rx_tail);
    if (available < 0) {
        available += UART_RX_BUFFER_SIZE;
    }

    return available;
}

/**
 * @brief 清空緩衝區
 */
int uart_flush(uart_handle_t handle)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    /* 等待發送完成 */
    while (__HAL_UART_GET_FLAG(&ctx->huart, UART_FLAG_TC) == RESET) {
        /* 等待 */
    }

    /* 清空接收緩衝區 */
    ctx->rx_head = 0;
    ctx->rx_tail = 0;

    return 0;
}

/**
 * @brief 發送單個字符
 */
int uart_putchar(uart_handle_t handle, char ch)
{
    return uart_send(handle, (uint8_t *)&ch, 1);
}

/**
 * @brief 接收單個字符
 */
int uart_getchar(uart_handle_t handle, uint32_t timeout)
{
    uint8_t ch;
    int result = uart_receive(handle, &ch, 1, timeout);

    return (result > 0) ? ch : -1;
}

/**
 * @brief 發送字符串
 */
int uart_puts(uart_handle_t handle, const char *str)
{
    if (str == NULL) {
        return -1;
    }

    size_t len = strlen(str);
    return uart_send(handle, (const uint8_t *)str, len);
}

/**
 * @brief 格式化輸出
 */
int uart_printf(uart_handle_t handle, const char *format, ...)
{
    uart_context_t *ctx = uart_get_context(handle);

    if (ctx == NULL || !ctx->initialized || format == NULL) {
        return -1;
    }

    va_list args;
    va_start(args, format);

    /* 使用緩衝區格式化字符串 */
    int len = vsnprintf((char *)ctx->tx_buffer, UART_TX_BUFFER_SIZE, format, args);

    va_end(args);

    if (len > 0 && len < UART_TX_BUFFER_SIZE) {
        return uart_send(handle, ctx->tx_buffer, len);
    }

    return -1;
}

/* ========== 私有函數實作 ========== */

/**
 * @brief 獲取 UART 實例
 */
static USART_TypeDef* uart_get_instance(uint8_t uart_num)
{
    switch (uart_num) {
        case 1:  return USART1;
        case 2:  return USART2;
        case 3:  return USART3;
        case 4:  return UART4;
        case 5:  return UART5;
        case 6:  return USART6;
        default: return NULL;
    }
}

/**
 * @brief 啟用 UART 時鐘
 */
static void uart_enable_clock(uint8_t uart_num)
{
    switch (uart_num) {
        case 1:  __HAL_RCC_USART1_CLK_ENABLE(); break;
        case 2:  __HAL_RCC_USART2_CLK_ENABLE(); break;
        case 3:  __HAL_RCC_USART3_CLK_ENABLE(); break;
        case 4:  __HAL_RCC_UART4_CLK_ENABLE();  break;
        case 5:  __HAL_RCC_UART5_CLK_ENABLE();  break;
        case 6:  __HAL_RCC_USART6_CLK_ENABLE(); break;
    }
}

/**
 * @brief 獲取中斷號
 */
static IRQn_Type uart_get_irq_number(uint8_t uart_num)
{
    switch (uart_num) {
        case 1:  return USART1_IRQn;
        case 2:  return USART2_IRQn;
        case 3:  return USART3_IRQn;
        case 4:  return UART4_IRQn;
        case 5:  return UART5_IRQn;
        case 6:  return USART6_IRQn;
        default: return (IRQn_Type)0;
    }
}

/**
 * @brief 從句柄獲取上下文
 */
static uart_context_t* uart_get_context(uart_handle_t handle)
{
    uart_context_t *ctx = (uart_context_t *)handle;

    /* 驗證句柄 */
    if (ctx < uart_contexts || ctx >= &uart_contexts[MAX_UART_INSTANCES]) {
        return NULL;
    }

    return ctx;
}

/* ========== HAL 回調函數 ========== */

/**
 * @brief 發送完成回調
 */
void HAL_UART_TxCpltCallback(UART_HandleTypeDef *huart)
{
    /* 查找對應的上下文 */
    for (int i = 0; i < MAX_UART_INSTANCES; i++) {
        if (&uart_contexts[i].huart == huart) {
            if (uart_contexts[i].tx_callback != NULL) {
                uart_contexts[i].tx_callback();
            }
            break;
        }
    }
}

/**
 * @brief 接收完成回調
 */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    /* 查找對應的上下文 */
    for (int i = 0; i < MAX_UART_INSTANCES; i++) {
        if (&uart_contexts[i].huart == huart) {
            if (uart_contexts[i].rx_callback != NULL) {
                uart_contexts[i].rx_callback();
            }
            break;
        }
    }
}

/**
 * @brief 錯誤回調
 */
void HAL_UART_ErrorCallback(UART_HandleTypeDef *huart)
{
    /* 錯誤處理 - 可以在這裡添加錯誤日誌 */
    __HAL_UART_CLEAR_FLAG(huart, UART_CLEAR_OREF | UART_CLEAR_NEF |
                          UART_CLEAR_PEF | UART_CLEAR_FEF);
}

#endif /* STM32F4 */
