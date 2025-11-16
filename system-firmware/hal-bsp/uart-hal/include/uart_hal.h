/**
 * @file uart_hal.h
 * @brief UART Hardware Abstraction Layer Interface
 * @version 1.0.0
 * @date 2025-11-16
 */

#ifndef UART_HAL_H
#define UART_HAL_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

/* ========== 型別定義 ========== */

/**
 * @brief UART 校驗位類型
 */
typedef enum {
    UART_PARITY_NONE = 0,   /**< 無校驗 */
    UART_PARITY_EVEN,       /**< 偶校驗 */
    UART_PARITY_ODD         /**< 奇校驗 */
} uart_parity_t;

/**
 * @brief UART 流控制類型
 */
typedef enum {
    UART_FLOW_CTRL_NONE = 0,  /**< 無流控 */
    UART_FLOW_CTRL_RTS,       /**< RTS 流控 */
    UART_FLOW_CTRL_CTS,       /**< CTS 流控 */
    UART_FLOW_CTRL_RTS_CTS    /**< RTS/CTS 流控 */
} uart_flow_ctrl_t;

/**
 * @brief UART DMA 模式
 */
typedef enum {
    UART_DMA_NONE = 0x00,   /**< 不使用 DMA */
    UART_DMA_TX = 0x01,     /**< TX DMA */
    UART_DMA_RX = 0x02,     /**< RX DMA */
    UART_DMA_BOTH = 0x03    /**< TX/RX DMA */
} uart_dma_mode_t;

/**
 * @brief UART 配置結構
 */
typedef struct {
    uint32_t baudrate;           /**< 波特率 (9600, 115200, ...) */
    uint8_t word_length;         /**< 資料位 (8, 9) */
    uint8_t stop_bits;           /**< 停止位 (1, 2) */
    uart_parity_t parity;        /**< 校驗位 */
    uart_flow_ctrl_t flow_control; /**< 流控制 */
} uart_config_t;

/**
 * @brief UART 句柄類型
 */
typedef void* uart_handle_t;

/**
 * @brief UART 回調函數類型
 */
typedef void (*uart_callback_t)(void);

/* ========== API 函數 ========== */

/**
 * @brief 初始化 UART
 *
 * @param uart_num UART 編號 (1, 2, 3, ...)
 * @param config UART 配置參數
 * @return uart_handle_t UART 句柄,失敗返回 NULL
 */
uart_handle_t uart_init(uint8_t uart_num, const uart_config_t *config);

/**
 * @brief 解初始化 UART
 *
 * @param handle UART 句柄
 * @return int 0: 成功, -1: 失敗
 */
int uart_deinit(uart_handle_t handle);

/**
 * @brief 阻塞發送數據
 *
 * @param handle UART 句柄
 * @param data 數據緩衝區
 * @param len 數據長度
 * @return int 實際發送的字節數,-1 表示失敗
 */
int uart_send(uart_handle_t handle, const uint8_t *data, size_t len);

/**
 * @brief 阻塞接收數據
 *
 * @param handle UART 句柄
 * @param data 接收緩衝區
 * @param len 期望接收長度
 * @param timeout 超時時間 (毫秒)
 * @return int 實際接收的字節數,-1 表示失敗/超時
 */
int uart_receive(uart_handle_t handle, uint8_t *data, size_t len, uint32_t timeout);

/**
 * @brief 中斷模式發送
 *
 * @param handle UART 句柄
 * @param data 數據緩衝區
 * @param len 數據長度
 * @return int 0: 成功, -1: 失敗
 */
int uart_send_it(uart_handle_t handle, const uint8_t *data, size_t len);

/**
 * @brief 中斷模式接收
 *
 * @param handle UART 句柄
 * @param data 接收緩衝區
 * @param len 期望接收長度
 * @return int 0: 成功, -1: 失敗
 */
int uart_receive_it(uart_handle_t handle, uint8_t *data, size_t len);

/**
 * @brief DMA 模式發送
 *
 * @param handle UART 句柄
 * @param data 數據緩衝區
 * @param len 數據長度
 * @return int 0: 成功, -1: 失敗
 */
int uart_send_dma(uart_handle_t handle, const uint8_t *data, size_t len);

/**
 * @brief DMA 模式接收
 *
 * @param handle UART 句柄
 * @param data 接收緩衝區
 * @param len 期望接收長度
 * @return int 0: 成功, -1: 失敗
 */
int uart_receive_dma(uart_handle_t handle, uint8_t *data, size_t len);

/**
 * @brief 設置回調函數
 *
 * @param handle UART 句柄
 * @param tx_callback 發送完成回調
 * @param rx_callback 接收完成回調
 * @return int 0: 成功, -1: 失敗
 */
int uart_set_callback(uart_handle_t handle,
                     uart_callback_t tx_callback,
                     uart_callback_t rx_callback);

/**
 * @brief 啟用 DMA
 *
 * @param handle UART 句柄
 * @param mode DMA 模式
 * @return int 0: 成功, -1: 失敗
 */
int uart_enable_dma(uart_handle_t handle, uart_dma_mode_t mode);

/**
 * @brief 禁用 DMA
 *
 * @param handle UART 句柄
 * @return int 0: 成功, -1: 失敗
 */
int uart_disable_dma(uart_handle_t handle);

/**
 * @brief 獲取可用數據量
 *
 * @param handle UART 句柄
 * @return int 可用字節數
 */
int uart_available(uart_handle_t handle);

/**
 * @brief 清空緩衝區
 *
 * @param handle UART 句柄
 * @return int 0: 成功, -1: 失敗
 */
int uart_flush(uart_handle_t handle);

/**
 * @brief 發送單個字符
 *
 * @param handle UART 句柄
 * @param ch 字符
 * @return int 0: 成功, -1: 失敗
 */
int uart_putchar(uart_handle_t handle, char ch);

/**
 * @brief 接收單個字符
 *
 * @param handle UART 句柄
 * @param timeout 超時時間 (毫秒)
 * @return int 字符值,失敗返回 -1
 */
int uart_getchar(uart_handle_t handle, uint32_t timeout);

/**
 * @brief 發送字符串
 *
 * @param handle UART 句柄
 * @param str 字符串
 * @return int 發送的字節數
 */
int uart_puts(uart_handle_t handle, const char *str);

/**
 * @brief 格式化輸出 (類似 printf)
 *
 * @param handle UART 句柄
 * @param format 格式字符串
 * @param ... 可變參數
 * @return int 發送的字節數
 */
int uart_printf(uart_handle_t handle, const char *format, ...);

#ifdef __cplusplus
}
#endif

#endif /* UART_HAL_H */
