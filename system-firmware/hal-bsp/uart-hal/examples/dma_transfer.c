/**
 * @file dma_transfer.c
 * @brief UART DMA 高速數據傳輸範例
 *
 * 此範例示範如何使用 UART HAL 的 DMA 功能進行高速數據傳輸
 * 包括單緩衝區和雙緩衝區 DMA 操作
 */

#include "uart_hal.h"
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

/* 平台相關的延遲函數 */
#ifdef STM32F4
    #include "stm32f4xx_hal.h"
    #define delay_ms(x) HAL_Delay(x)
    #define get_tick() HAL_GetTick()
#elif defined(ESP32)
    #include "freertos/FreeRTOS.h"
    #include "freertos/task.h"
    #include "esp_timer.h"
    #define delay_ms(x) vTaskDelay((x) / portTICK_PERIOD_MS)
    #define get_tick() (esp_timer_get_time() / 1000)
#else
    #define delay_ms(x) /* 需要實作 */
    #define get_tick() 0
#endif

/* DMA 緩衝區大小 */
#define DMA_BUFFER_SIZE     1024
#define TX_BUFFER_SIZE      4096
#define RX_BUFFER_SIZE      4096

/* DMA 緩衝區 */
static uint8_t tx_dma_buffer[DMA_BUFFER_SIZE];
static uint8_t rx_dma_buffer[DMA_BUFFER_SIZE];

/* 雙緩衝區 DMA */
static uint8_t rx_buffer_0[DMA_BUFFER_SIZE];
static uint8_t rx_buffer_1[DMA_BUFFER_SIZE];
static volatile uint8_t active_rx_buffer = 0;

/* 傳輸統計 */
static volatile uint32_t tx_complete_count = 0;
static volatile uint32_t rx_complete_count = 0;
static volatile uint32_t tx_error_count = 0;
static volatile uint32_t rx_error_count = 0;

/* UART 句柄 */
static uart_handle_t uart;

/**
 * @brief TX DMA 完成回調
 */
static void tx_dma_callback(void)
{
    tx_complete_count++;
}

/**
 * @brief RX DMA 完成回調
 */
static void rx_dma_callback(void)
{
    rx_complete_count++;

    /* 切換緩衝區 (雙緩衝區模式) */
    active_rx_buffer = (active_rx_buffer + 1) % 2;
}

/**
 * @brief 發送大量數據 (DMA 模式)
 */
static int send_large_data_dma(const uint8_t *data, size_t total_len)
{
    size_t sent = 0;

    printf("Sending %d bytes using DMA...\n", total_len);

    uint32_t start_time = get_tick();

    while (sent < total_len) {
        size_t chunk_size = (total_len - sent > DMA_BUFFER_SIZE) ?
                           DMA_BUFFER_SIZE : (total_len - sent);

        /* 複製數據到 DMA 緩衝區 */
        memcpy(tx_dma_buffer, data + sent, chunk_size);

        /* 啟動 DMA 傳輸 */
        uint32_t tx_before = tx_complete_count;

        if (uart_send_dma(uart, tx_dma_buffer, chunk_size) != 0) {
            printf("Error: DMA send failed\n");
            return -1;
        }

        /* 等待傳輸完成 */
        uint32_t timeout = 1000;  /* 1 秒超時 */
        while (tx_complete_count == tx_before && timeout-- > 0) {
            delay_ms(1);
        }

        if (timeout == 0) {
            printf("Error: DMA transfer timeout\n");
            return -1;
        }

        sent += chunk_size;

        /* 顯示進度 */
        if (sent % (DMA_BUFFER_SIZE * 10) == 0 || sent == total_len) {
            printf("Progress: %d/%d bytes (%.1f%%)\r",
                   sent, total_len, (sent * 100.0f) / total_len);
            fflush(stdout);
        }
    }

    uint32_t end_time = get_tick();
    uint32_t elapsed = end_time - start_time;

    printf("\nTransfer complete!\n");
    printf("Time: %lu ms\n", elapsed);
    if (elapsed > 0) {
        printf("Speed: %.2f KB/s\n", (total_len / (float)elapsed));
    }

    return 0;
}

/**
 * @brief 接收大量數據 (DMA 模式)
 */
static int receive_large_data_dma(uint8_t *buffer, size_t expected_len)
{
    size_t received = 0;

    printf("Receiving %d bytes using DMA...\n", expected_len);

    uint32_t start_time = get_tick();

    while (received < expected_len) {
        size_t chunk_size = (expected_len - received > DMA_BUFFER_SIZE) ?
                           DMA_BUFFER_SIZE : (expected_len - received);

        /* 啟動 DMA 接收 */
        uint32_t rx_before = rx_complete_count;

        if (uart_receive_dma(uart, rx_dma_buffer, chunk_size) != 0) {
            printf("Error: DMA receive failed\n");
            return -1;
        }

        /* 等待接收完成 */
        uint32_t timeout = 5000;  /* 5 秒超時 */
        while (rx_complete_count == rx_before && timeout-- > 0) {
            delay_ms(1);
        }

        if (timeout == 0) {
            printf("Error: DMA receive timeout\n");
            return -1;
        }

        /* 複製接收到的數據 */
        memcpy(buffer + received, rx_dma_buffer, chunk_size);
        received += chunk_size;

        /* 顯示進度 */
        if (received % (DMA_BUFFER_SIZE * 10) == 0 || received == expected_len) {
            printf("Progress: %d/%d bytes (%.1f%%)\r",
                   received, expected_len, (received * 100.0f) / expected_len);
            fflush(stdout);
        }
    }

    uint32_t end_time = get_tick();
    uint32_t elapsed = end_time - start_time;

    printf("\nReceive complete!\n");
    printf("Time: %lu ms\n", elapsed);
    if (elapsed > 0) {
        printf("Speed: %.2f KB/s\n", (expected_len / (float)elapsed));
    }

    return 0;
}

/**
 * @brief 主程式
 */
int main(void)
{
    /* 系統初始化 */
#ifdef STM32F4
    HAL_Init();
    SystemClock_Config();  /* 需要在專案中實作 */
#endif

    printf("\n========================================\n");
    printf("UART HAL - DMA Transfer Example\n");
    printf("========================================\n\n");

    /* 配置 UART (高波特率) */
    uart_config_t uart_config = {
        .baudrate = 921600,  /* 高速模式 */
        .word_length = 8,
        .stop_bits = 1,
        .parity = UART_PARITY_NONE,
        .flow_control = UART_FLOW_CTRL_NONE
    };

    /* 初始化 UART */
    uart = uart_init(1, &uart_config);
    if (!uart) {
        printf("Error: Failed to initialize UART\n");
        return -1;
    }

    printf("UART initialized!\n");
    printf("Baudrate: %lu\n", uart_config.baudrate);
    printf("DMA buffer size: %d bytes\n\n", DMA_BUFFER_SIZE);

    /* 啟用 DMA */
    printf("Enabling DMA...\n");
    if (uart_enable_dma(uart, UART_DMA_BOTH) != 0) {
        printf("Error: Failed to enable DMA\n");
        goto cleanup;
    }
    printf("DMA enabled!\n\n");

    /* 設置回調函數 */
    uart_set_callback(uart, tx_dma_callback, rx_dma_callback);

    /* ===== 測試 1: DMA 發送測試 ===== */
    printf("========================================\n");
    printf("Test 1: DMA Transmit\n");
    printf("========================================\n\n");

    /* 準備測試數據 */
    uint8_t tx_test_data[TX_BUFFER_SIZE];
    for (size_t i = 0; i < TX_BUFFER_SIZE; i++) {
        tx_test_data[i] = i & 0xFF;
    }

    /* 發送數據 */
    if (send_large_data_dma(tx_test_data, TX_BUFFER_SIZE) == 0) {
        printf("✓ DMA transmit test PASSED\n\n");
    } else {
        printf("✗ DMA transmit test FAILED\n\n");
    }

    delay_ms(1000);

    /* ===== 測試 2: DMA 接收測試 ===== */
    printf("========================================\n");
    printf("Test 2: DMA Receive\n");
    printf("========================================\n\n");

    printf("Waiting for incoming data...\n");
    printf("Please send data from another device\n\n");

    uint8_t rx_test_data[RX_BUFFER_SIZE];

    /* 這裡簡化為回環測試 */
    printf("(Loopback test: Connect TX to RX)\n");

    /* 同時啟動發送和接收 */
    /* 實際應用中,接收和發送通常是獨立的 */

    delay_ms(1000);

    /* ===== 測試 3: 性能比較 ===== */
    printf("========================================\n");
    printf("Test 3: Performance Comparison\n");
    printf("========================================\n\n");

    const size_t PERF_SIZE = 2048;
    uint8_t perf_data[PERF_SIZE];

    for (size_t i = 0; i < PERF_SIZE; i++) {
        perf_data[i] = i & 0xFF;
    }

    /* 阻塞模式 */
    printf("Blocking mode:\n");
    uint32_t start = get_tick();
    uart_send(uart, perf_data, PERF_SIZE);
    uint32_t end = get_tick();
    printf("  Time: %lu ms\n", end - start);

    delay_ms(100);

    /* DMA 模式 */
    printf("\nDMA mode:\n");
    start = get_tick();
    send_large_data_dma(perf_data, PERF_SIZE);
    end = get_tick();
    printf("  Time: %lu ms\n", end - start);

    /* ===== 測試 4: 連續 DMA 傳輸 ===== */
    printf("\n========================================\n");
    printf("Test 4: Continuous DMA Transfer\n");
    printf("========================================\n\n");

    printf("Sending continuous data stream...\n");
    printf("Press Ctrl+C to stop\n\n");

    uint32_t packet_count = 0;
    uint32_t last_stats_time = get_tick();

    for (int cycle = 0; cycle < 10; cycle++) {  /* 限制為 10 個循環用於演示 */
        char message[DMA_BUFFER_SIZE];
        snprintf(message, sizeof(message),
                "DMA Packet #%lu - Timestamp: %lu ms\n",
                packet_count, get_tick());

        if (uart_send_dma(uart, (const uint8_t *)message, strlen(message)) == 0) {
            packet_count++;
        }

        /* 每秒顯示統計 */
        uint32_t now = get_tick();
        if (now - last_stats_time >= 1000) {
            printf("\nStatistics:\n");
            printf("  Packets sent: %lu\n", packet_count);
            printf("  TX complete: %lu\n", tx_complete_count);
            printf("  RX complete: %lu\n", rx_complete_count);
            printf("  TX errors: %lu\n", tx_error_count);
            printf("  RX errors: %lu\n\n", rx_error_count);

            last_stats_time = now;
        }

        delay_ms(100);
    }

    printf("\n========================================\n");
    printf("All tests completed!\n");
    printf("========================================\n\n");

    printf("Final Statistics:\n");
    printf("  Total TX complete: %lu\n", tx_complete_count);
    printf("  Total RX complete: %lu\n", rx_complete_count);
    printf("  Total TX errors: %lu\n", tx_error_count);
    printf("  Total RX errors: %lu\n", rx_error_count);

cleanup:
    /* 禁用 DMA */
    uart_disable_dma(uart);

    /* 清理資源 */
    uart_deinit(uart);

    return 0;
}

/**
 * @brief 進階範例: 雙緩衝區 DMA 接收
 *
 * 使用雙緩衝區避免數據丟失
 */
void double_buffer_rx_example(void)
{
    printf("Initializing double-buffer DMA receive...\n");

    /* 配置第一個緩衝區 */
    uart_receive_dma(uart, rx_buffer_0, DMA_BUFFER_SIZE);

    while (1) {
        /* 等待當前緩衝區填滿 */
        uint32_t last_rx_count = rx_complete_count;

        while (rx_complete_count == last_rx_count) {
            delay_ms(1);
        }

        /* 處理接收到的數據 */
        uint8_t *current_buffer = (active_rx_buffer == 0) ? rx_buffer_1 : rx_buffer_0;

        printf("Processing %d bytes from buffer %d\n",
               DMA_BUFFER_SIZE, (active_rx_buffer == 0) ? 1 : 0);

        /* 處理數據 */
        /* ... */

        /* 啟動下一個緩衝區的接收 */
        uint8_t *next_buffer = (active_rx_buffer == 0) ? rx_buffer_0 : rx_buffer_1;
        uart_receive_dma(uart, next_buffer, DMA_BUFFER_SIZE);
    }
}
