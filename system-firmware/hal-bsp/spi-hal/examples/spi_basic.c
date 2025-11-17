/**
 * @file spi_basic.c
 * @brief SPI HAL 基本使用範例
 *
 * 此範例示範 SPI HAL 的基本功能
 * 包括初始化、數據傳輸和配置
 */

#include "spi_hal.h"
#include "gpio_hal.h"
#include <stdio.h>
#include <string.h>

/* 平台相關的延遲函數 */
#ifdef STM32F4
    #include "stm32f4xx_hal.h"
    #define delay_ms(x) HAL_Delay(x)
    #define delay_us(x) /* 需要實作微秒延遲 */
#elif defined(ESP32)
    #include "freertos/FreeRTOS.h"
    #include "freertos/task.h"
    #include "esp_rom_sys.h"
    #define delay_ms(x) vTaskDelay((x) / portTICK_PERIOD_MS)
    #define delay_us(x) esp_rom_delay_us(x)
#else
    #define delay_ms(x) /* 需要實作 */
    #define delay_us(x) /* 需要實作 */
#endif

/* CS (Chip Select) 引腳配置 */
#ifdef STM32F4
    #define CS_PORT     GPIO_PORT_A
    #define CS_PIN      GPIO_PIN_4
#elif defined(ESP32)
    #define CS_PORT     GPIO_PORT_0
    #define CS_PIN      GPIO_PIN_5
#else
    #define CS_PORT     GPIO_PORT_A
    #define CS_PIN      GPIO_PIN_0
#endif

/* CS 控制巨集 */
#define CS_LOW()    gpio_reset(CS_PORT, CS_PIN)
#define CS_HIGH()   gpio_set(CS_PORT, CS_PIN)

/* SPI 句柄 */
static spi_handle_t spi;

/**
 * @brief 初始化 CS 引腳
 */
static int init_cs_pin(void)
{
    gpio_config_t cs_config = {
        .port = CS_PORT,
        .pin = CS_PIN,
        .mode = GPIO_MODE_OUTPUT_PP,
        .pull = GPIO_PULL_UP,
        .speed = GPIO_SPEED_VERY_HIGH
    };

    return gpio_init(&cs_config);
}

/**
 * @brief SPI 傳輸單個字節
 */
static uint8_t spi_transfer_byte(uint8_t data)
{
    uint8_t rx_data = 0;
    spi_transfer(spi, &data, &rx_data, 1);
    return rx_data;
}

/**
 * @brief SPI 回環測試
 *
 * 將 MOSI 和 MISO 短接進行測試
 */
static void spi_loopback_test(void)
{
    printf("\n========================================\n");
    printf("SPI Loopback Test\n");
    printf("========================================\n");
    printf("Please connect MOSI to MISO for this test\n\n");

    uint8_t test_data[] = {0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0};
    uint8_t read_data[8] = {0};

    printf("Sending: ");
    for (int i = 0; i < 8; i++) {
        printf("%02X ", test_data[i]);
    }
    printf("\n");

    /* 傳輸數據 */
    int result = spi_transfer(spi, test_data, read_data, sizeof(test_data));

    if (result != 0) {
        printf("Error: SPI transfer failed\n");
        return;
    }

    printf("Received: ");
    for (int i = 0; i < 8; i++) {
        printf("%02X ", read_data[i]);
    }
    printf("\n");

    /* 驗證數據 */
    bool match = true;
    for (int i = 0; i < 8; i++) {
        if (test_data[i] != read_data[i]) {
            match = false;
            break;
        }
    }

    if (match) {
        printf("✓ Loopback test PASSED\n");
    } else {
        printf("✗ Loopback test FAILED\n");
        printf("Note: Make sure MOSI and MISO are connected\n");
    }
}

/**
 * @brief SPI 速度測試
 */
static void spi_speed_test(void)
{
    printf("\n========================================\n");
    printf("SPI Speed Test\n");
    printf("========================================\n\n");

    const size_t TEST_SIZE = 1024;  /* 1KB */
    uint8_t tx_buffer[TEST_SIZE];
    uint8_t rx_buffer[TEST_SIZE];

    /* 準備測試數據 */
    for (size_t i = 0; i < TEST_SIZE; i++) {
        tx_buffer[i] = i & 0xFF;
    }

    /* 測試不同的傳輸方式 */
    uint32_t start_tick, end_tick, elapsed;

    /* 1. 阻塞傳輸 */
    printf("Testing blocking transfer (%d bytes)...\n", TEST_SIZE);

#ifdef STM32F4
    start_tick = HAL_GetTick();
#else
    start_tick = 0;
#endif

    int result = spi_transfer(spi, tx_buffer, rx_buffer, TEST_SIZE);

#ifdef STM32F4
    end_tick = HAL_GetTick();
    elapsed = end_tick - start_tick;
#else
    elapsed = 1;  /* 避免除以零 */
#endif

    if (result == 0) {
        printf("Transfer time: %lu ms\n", elapsed);
        if (elapsed > 0) {
            printf("Transfer speed: %.2f KB/s\n", (TEST_SIZE / (float)elapsed));
        }
    } else {
        printf("Transfer failed\n");
    }

    delay_ms(100);

    /* 2. DMA 傳輸 (如果支持) */
    printf("\nTesting DMA transfer (%d bytes)...\n", TEST_SIZE);

#ifdef STM32F4
    start_tick = HAL_GetTick();
#endif

    result = spi_transfer_dma(spi, tx_buffer, rx_buffer, TEST_SIZE);

    if (result == 0) {
        /* 等待 DMA 完成 */
        delay_ms(10);

#ifdef STM32F4
        end_tick = HAL_GetTick();
        elapsed = end_tick - start_tick;
#endif

        printf("DMA transfer time: %lu ms\n", elapsed);
        if (elapsed > 0) {
            printf("DMA transfer speed: %.2f KB/s\n", (TEST_SIZE / (float)elapsed));
        }
    } else {
        printf("DMA transfer not supported or failed\n");
    }
}

/**
 * @brief SPI 模式測試
 */
static void spi_mode_test(void)
{
    printf("\n========================================\n");
    printf("SPI Mode Configuration Test\n");
    printf("========================================\n\n");

    /* 定義 4 種 SPI 模式 */
    struct {
        spi_cpol_t cpol;
        spi_cpha_t cpha;
        const char *name;
    } modes[] = {
        {SPI_CPOL_LOW,  SPI_CPHA_1EDGE, "Mode 0 (CPOL=0, CPHA=0)"},
        {SPI_CPOL_LOW,  SPI_CPHA_2EDGE, "Mode 1 (CPOL=0, CPHA=1)"},
        {SPI_CPOL_HIGH, SPI_CPHA_1EDGE, "Mode 2 (CPOL=1, CPHA=0)"},
        {SPI_CPOL_HIGH, SPI_CPHA_2EDGE, "Mode 3 (CPOL=1, CPHA=1)"}
    };

    for (int i = 0; i < 4; i++) {
        printf("Testing %s\n", modes[i].name);

        /* 重新配置 SPI */
        spi_deinit(spi);

        spi_config_t config = {
            .mode = SPI_MODE_MASTER,
            .clock_polarity = modes[i].cpol,
            .clock_phase = modes[i].cpha,
            .baudrate_prescaler = SPI_BAUDRATE_PRESCALER_16,
            .data_size = SPI_DATASIZE_8BIT,
            .first_bit = SPI_FIRSTBIT_MSB
        };

        spi = spi_init(1, &config);
        if (!spi) {
            printf("  Error: Failed to initialize SPI\n");
            continue;
        }

        /* 簡單的傳輸測試 */
        uint8_t test_byte = 0xA5;
        uint8_t rx_byte = 0;

        CS_LOW();
        spi_transfer(spi, &test_byte, &rx_byte, 1);
        CS_HIGH();

        printf("  Sent: 0x%02X, Received: 0x%02X\n", test_byte, rx_byte);
        delay_ms(10);
    }

    printf("\nNote: Different devices require different SPI modes.\n");
    printf("      Check device datasheet for correct mode.\n");
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
    printf("SPI HAL - Basic Example\n");
    printf("========================================\n\n");

    /* 初始化 CS 引腳 */
    if (init_cs_pin() != 0) {
        printf("Error: Failed to initialize CS pin\n");
        return -1;
    }
    CS_HIGH();  /* CS 預設為高電平(未選中) */
    printf("CS pin initialized\n");

    /* 配置 SPI */
    spi_config_t spi_config = {
        .mode = SPI_MODE_MASTER,
        .clock_polarity = SPI_CPOL_LOW,
        .clock_phase = SPI_CPHA_1EDGE,
        .baudrate_prescaler = SPI_BAUDRATE_PRESCALER_16,  /* 根據系統時鐘調整 */
        .data_size = SPI_DATASIZE_8BIT,
        .first_bit = SPI_FIRSTBIT_MSB
    };

    /* 初始化 SPI */
    spi = spi_init(1, &spi_config);
    if (!spi) {
        printf("Error: Failed to initialize SPI\n");
        return -1;
    }

    printf("SPI initialized successfully!\n");
    printf("Configuration:\n");
    printf("  Mode: Master\n");
    printf("  Clock Polarity: %s\n",
           spi_config.clock_polarity == SPI_CPOL_LOW ? "Low" : "High");
    printf("  Clock Phase: %s\n",
           spi_config.clock_phase == SPI_CPHA_1EDGE ? "1st Edge" : "2nd Edge");
    printf("  Data Size: 8-bit\n");
    printf("  First Bit: MSB\n");

    /* 執行測試 */
    delay_ms(1000);

    /* 測試 1: 回環測試 */
    spi_loopback_test();
    delay_ms(1000);

    /* 測試 2: 速度測試 */
    spi_speed_test();
    delay_ms(1000);

    /* 測試 3: 模式測試 */
    spi_mode_test();

    /* 示範基本的 SPI 操作 */
    printf("\n========================================\n");
    printf("Basic SPI Operations Demo\n");
    printf("========================================\n\n");

    printf("Example 1: Single byte transfer\n");
    CS_LOW();
    uint8_t cmd = 0x9F;  /* 常見的讀取 ID 命令 */
    uint8_t response = spi_transfer_byte(cmd);
    CS_HIGH();
    printf("  Sent: 0x%02X, Received: 0x%02X\n", cmd, response);

    delay_ms(10);

    printf("\nExample 2: Multi-byte transfer\n");
    uint8_t tx_data[] = {0x03, 0x00, 0x00, 0x00};  /* 讀取命令 + 地址 */
    uint8_t rx_data[4] = {0};

    CS_LOW();
    spi_transfer(spi, tx_data, rx_data, 4);
    CS_HIGH();

    printf("  TX: ");
    for (int i = 0; i < 4; i++) printf("%02X ", tx_data[i]);
    printf("\n  RX: ");
    for (int i = 0; i < 4; i++) printf("%02X ", rx_data[i]);
    printf("\n");

    printf("\nExample 3: Transmit only\n");
    uint8_t dummy_data[] = {0x00, 0x00, 0x00, 0x00};
    CS_LOW();
    spi_transmit(spi, dummy_data, 4);
    CS_HIGH();
    printf("  Transmitted 4 dummy bytes\n");

    printf("\nExample 4: Receive only\n");
    uint8_t received[4] = {0};
    CS_LOW();
    spi_receive(spi, received, 4);
    CS_HIGH();
    printf("  Received: ");
    for (int i = 0; i < 4; i++) printf("%02X ", received[i]);
    printf("\n");

    printf("\n========================================\n");
    printf("All examples completed!\n");
    printf("========================================\n");

    /* 清理 */
    spi_deinit(spi);
    return 0;
}
