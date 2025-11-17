/**
 * @file w25q_flash.c
 * @brief SPI Flash (W25Q128) 完整範例
 *
 * 此範例示範如何使用 SPI HAL 控制 W25Q128 Flash 芯片
 * 包括讀取 ID、擦除、寫入和讀取操作
 */

#include "spi_hal.h"
#include "gpio_hal.h"
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

/* 平台相關的延遲函數 */
#ifdef STM32F4
    #include "stm32f4xx_hal.h"
    #define delay_ms(x) HAL_Delay(x)
#elif defined(ESP32)
    #include "freertos/FreeRTOS.h"
    #include "freertos/task.h"
    #define delay_ms(x) vTaskDelay((x) / portTICK_PERIOD_MS)
#else
    #define delay_ms(x) /* 需要實作 */
#endif

/* CS 引腳配置 */
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

#define CS_LOW()    gpio_reset(CS_PORT, CS_PIN)
#define CS_HIGH()   gpio_set(CS_PORT, CS_PIN)

/* W25Q128 命令定義 */
#define W25Q_CMD_WRITE_ENABLE       0x06
#define W25Q_CMD_WRITE_DISABLE      0x04
#define W25Q_CMD_READ_STATUS_REG1   0x05
#define W25Q_CMD_READ_STATUS_REG2   0x35
#define W25Q_CMD_WRITE_STATUS_REG   0x01
#define W25Q_CMD_PAGE_PROGRAM       0x02
#define W25Q_CMD_QUAD_PAGE_PROGRAM  0x32
#define W25Q_CMD_BLOCK_ERASE_64K    0xD8
#define W25Q_CMD_BLOCK_ERASE_32K    0x52
#define W25Q_CMD_SECTOR_ERASE_4K    0x20
#define W25Q_CMD_CHIP_ERASE         0xC7
#define W25Q_CMD_READ_DATA          0x03
#define W25Q_CMD_FAST_READ          0x0B
#define W25Q_CMD_READ_JEDEC_ID      0x9F
#define W25Q_CMD_READ_UNIQUE_ID     0x4B
#define W25Q_CMD_POWER_DOWN         0xB9
#define W25Q_CMD_RELEASE_POWER_DOWN 0xAB

/* W25Q128 參數 */
#define W25Q_PAGE_SIZE              256
#define W25Q_SECTOR_SIZE            4096
#define W25Q_BLOCK_SIZE_32K         32768
#define W25Q_BLOCK_SIZE_64K         65536
#define W25Q_TOTAL_SIZE             (16 * 1024 * 1024)  /* 16MB */

/* 狀態寄存器位 */
#define W25Q_STATUS_BUSY            0x01
#define W25Q_STATUS_WEL             0x02

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
 * @brief 讀取狀態寄存器
 */
static uint8_t w25q_read_status_reg(void)
{
    uint8_t status;

    CS_LOW();
    spi_transfer_byte(W25Q_CMD_READ_STATUS_REG1);
    status = spi_transfer_byte(0xFF);
    CS_HIGH();

    return status;
}

/**
 * @brief 等待 Flash 操作完成
 */
static void w25q_wait_busy(void)
{
    while (w25q_read_status_reg() & W25Q_STATUS_BUSY) {
        delay_ms(1);
    }
}

/**
 * @brief 寫使能
 */
static void w25q_write_enable(void)
{
    CS_LOW();
    spi_transfer_byte(W25Q_CMD_WRITE_ENABLE);
    CS_HIGH();
}

/**
 * @brief 讀取 JEDEC ID
 */
static void w25q_read_jedec_id(uint8_t *manufacturer_id, uint16_t *device_id)
{
    CS_LOW();
    spi_transfer_byte(W25Q_CMD_READ_JEDEC_ID);
    *manufacturer_id = spi_transfer_byte(0xFF);
    *device_id = spi_transfer_byte(0xFF) << 8;
    *device_id |= spi_transfer_byte(0xFF);
    CS_HIGH();
}

/**
 * @brief 擦除 4KB 扇區
 */
static int w25q_erase_sector(uint32_t address)
{
    if (address >= W25Q_TOTAL_SIZE) {
        return -1;
    }

    w25q_write_enable();

    CS_LOW();
    spi_transfer_byte(W25Q_CMD_SECTOR_ERASE_4K);
    spi_transfer_byte((address >> 16) & 0xFF);
    spi_transfer_byte((address >> 8) & 0xFF);
    spi_transfer_byte(address & 0xFF);
    CS_HIGH();

    w25q_wait_busy();
    return 0;
}

/**
 * @brief 擦除 64KB 塊
 */
static int w25q_erase_block_64k(uint32_t address)
{
    if (address >= W25Q_TOTAL_SIZE) {
        return -1;
    }

    w25q_write_enable();

    CS_LOW();
    spi_transfer_byte(W25Q_CMD_BLOCK_ERASE_64K);
    spi_transfer_byte((address >> 16) & 0xFF);
    spi_transfer_byte((address >> 8) & 0xFF);
    spi_transfer_byte(address & 0xFF);
    CS_HIGH();

    w25q_wait_busy();
    return 0;
}

/**
 * @brief 頁編程 (最多 256 字節)
 */
static int w25q_page_program(uint32_t address, const uint8_t *data, size_t len)
{
    if (address >= W25Q_TOTAL_SIZE || len == 0 || len > W25Q_PAGE_SIZE) {
        return -1;
    }

    /* 確保不跨頁寫入 */
    if ((address % W25Q_PAGE_SIZE) + len > W25Q_PAGE_SIZE) {
        return -1;
    }

    w25q_write_enable();

    CS_LOW();
    spi_transfer_byte(W25Q_CMD_PAGE_PROGRAM);
    spi_transfer_byte((address >> 16) & 0xFF);
    spi_transfer_byte((address >> 8) & 0xFF);
    spi_transfer_byte(address & 0xFF);
    spi_transmit(spi, data, len);
    CS_HIGH();

    w25q_wait_busy();
    return 0;
}

/**
 * @brief 寫入數據 (自動處理跨頁)
 */
static int w25q_write(uint32_t address, const uint8_t *data, size_t len)
{
    size_t written = 0;

    while (written < len) {
        uint32_t page_offset = (address + written) % W25Q_PAGE_SIZE;
        size_t chunk_size = W25Q_PAGE_SIZE - page_offset;

        if (chunk_size > (len - written)) {
            chunk_size = len - written;
        }

        if (w25q_page_program(address + written, data + written, chunk_size) != 0) {
            return -1;
        }

        written += chunk_size;
    }

    return written;
}

/**
 * @brief 讀取數據
 */
static int w25q_read(uint32_t address, uint8_t *data, size_t len)
{
    if (address >= W25Q_TOTAL_SIZE || len == 0) {
        return -1;
    }

    CS_LOW();
    spi_transfer_byte(W25Q_CMD_READ_DATA);
    spi_transfer_byte((address >> 16) & 0xFF);
    spi_transfer_byte((address >> 8) & 0xFF);
    spi_transfer_byte(address & 0xFF);
    spi_receive(spi, data, len);
    CS_HIGH();

    return len;
}

/**
 * @brief 快速讀取數據
 */
static int w25q_fast_read(uint32_t address, uint8_t *data, size_t len)
{
    if (address >= W25Q_TOTAL_SIZE || len == 0) {
        return -1;
    }

    CS_LOW();
    spi_transfer_byte(W25Q_CMD_FAST_READ);
    spi_transfer_byte((address >> 16) & 0xFF);
    spi_transfer_byte((address >> 8) & 0xFF);
    spi_transfer_byte(address & 0xFF);
    spi_transfer_byte(0xFF);  /* Dummy byte */
    spi_receive(spi, data, len);
    CS_HIGH();

    return len;
}

/**
 * @brief 打印緩衝區內容 (十六進制)
 */
static void print_hex_dump(const uint8_t *data, size_t len, uint32_t base_addr)
{
    for (size_t i = 0; i < len; i += 16) {
        printf("%08lX: ", base_addr + i);

        /* 十六進制 */
        for (size_t j = 0; j < 16; j++) {
            if (i + j < len) {
                printf("%02X ", data[i + j]);
            } else {
                printf("   ");
            }
        }

        printf(" | ");

        /* ASCII */
        for (size_t j = 0; j < 16 && i + j < len; j++) {
            uint8_t c = data[i + j];
            printf("%c", (c >= 32 && c < 127) ? c : '.');
        }

        printf("\n");
    }
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
    printf("SPI HAL - W25Q128 Flash Example\n");
    printf("========================================\n\n");

    /* 初始化 CS 引腳 */
    if (init_cs_pin() != 0) {
        printf("Error: Failed to initialize CS pin\n");
        return -1;
    }
    CS_HIGH();

    /* 配置 SPI */
    spi_config_t spi_config = {
        .mode = SPI_MODE_MASTER,
        .clock_polarity = SPI_CPOL_LOW,
        .clock_phase = SPI_CPHA_1EDGE,
        .baudrate_prescaler = SPI_BAUDRATE_PRESCALER_4,  /* 高速模式 */
        .data_size = SPI_DATASIZE_8BIT,
        .first_bit = SPI_FIRSTBIT_MSB
    };

    spi = spi_init(1, &spi_config);
    if (!spi) {
        printf("Error: Failed to initialize SPI\n");
        return -1;
    }

    printf("SPI initialized successfully!\n\n");

    /* 讀取 Flash ID */
    printf("Reading Flash ID...\n");
    uint8_t manufacturer_id;
    uint16_t device_id;

    w25q_read_jedec_id(&manufacturer_id, &device_id);

    printf("Manufacturer ID: 0x%02X\n", manufacturer_id);
    printf("Device ID: 0x%04X\n", device_id);

    if (manufacturer_id == 0xEF && (device_id == 0x4018 || device_id == 0x6018)) {
        printf("✓ W25Q128 Flash detected!\n\n");
    } else {
        printf("⚠ Warning: Unknown Flash chip\n");
        printf("  Expected: Manufacturer=0xEF, Device=0x4018 or 0x6018\n\n");
    }

    /* ===== 測試 1: 扇區擦除和寫入 ===== */
    printf("========================================\n");
    printf("Test 1: Sector Erase and Write\n");
    printf("========================================\n\n");

    const uint32_t TEST_ADDR = 0x10000;  /* 64KB 地址 */
    const char *test_string = "Hello, W25Q128 Flash! This is a test message.";
    size_t test_len = strlen(test_string) + 1;

    printf("Erasing sector at 0x%08lX...\n", TEST_ADDR);
    if (w25q_erase_sector(TEST_ADDR) != 0) {
        printf("Error: Sector erase failed\n");
        goto cleanup;
    }
    printf("Sector erased successfully!\n");

    printf("Writing data to 0x%08lX...\n", TEST_ADDR);
    printf("Data: \"%s\"\n", test_string);

    if (w25q_write(TEST_ADDR, (const uint8_t *)test_string, test_len) < 0) {
        printf("Error: Write failed\n");
        goto cleanup;
    }
    printf("Write successful! (%d bytes)\n\n", test_len);

    /* 讀回並驗證 */
    char read_buffer[128] = {0};
    printf("Reading back data...\n");

    if (w25q_read(TEST_ADDR, (uint8_t *)read_buffer, test_len) < 0) {
        printf("Error: Read failed\n");
        goto cleanup;
    }

    printf("Read data: \"%s\"\n", read_buffer);

    if (strcmp(test_string, read_buffer) == 0) {
        printf("✓ Data verification PASSED\n\n");
    } else {
        printf("✗ Data verification FAILED\n\n");
    }

    /* ===== 測試 2: 跨頁寫入 ===== */
    printf("========================================\n");
    printf("Test 2: Cross-Page Write\n");
    printf("========================================\n\n");

    uint8_t large_buffer[512];
    for (int i = 0; i < 512; i++) {
        large_buffer[i] = i & 0xFF;
    }

    uint32_t cross_page_addr = 0x10100;  /* 從頁中間開始 */

    printf("Writing 512 bytes starting at 0x%08lX (crosses page boundary)...\n",
           cross_page_addr);

    if (w25q_write(cross_page_addr, large_buffer, 512) < 0) {
        printf("Error: Cross-page write failed\n");
        goto cleanup;
    }
    printf("Write successful!\n");

    /* 驗證 */
    uint8_t verify_buffer[512] = {0};
    w25q_read(cross_page_addr, verify_buffer, 512);

    bool match = true;
    for (int i = 0; i < 512; i++) {
        if (verify_buffer[i] != large_buffer[i]) {
            match = false;
            printf("Mismatch at byte %d: expected 0x%02X, got 0x%02X\n",
                   i, large_buffer[i], verify_buffer[i]);
            break;
        }
    }

    if (match) {
        printf("✓ Cross-page write test PASSED\n\n");
    } else {
        printf("✗ Cross-page write test FAILED\n\n");
    }

    /* ===== 測試 3: 快速讀取性能比較 ===== */
    printf("========================================\n");
    printf("Test 3: Read Performance Comparison\n");
    printf("========================================\n\n");

    const size_t PERF_SIZE = 4096;
    uint8_t *perf_buffer = (uint8_t *)read_buffer;  /* 重用緩衝區 */

    uint32_t start_tick, end_tick;

    /* 普通讀取 */
    printf("Normal read (%d bytes)...\n", PERF_SIZE);
#ifdef STM32F4
    start_tick = HAL_GetTick();
#endif
    w25q_read(TEST_ADDR, perf_buffer, 128);  /* 較小的測試 */
#ifdef STM32F4
    end_tick = HAL_GetTick();
    printf("Normal read time: %lu ms\n", end_tick - start_tick);
#endif

    /* 快速讀取 */
    printf("Fast read (%d bytes)...\n", 128);
#ifdef STM32F4
    start_tick = HAL_GetTick();
#endif
    w25q_fast_read(TEST_ADDR, perf_buffer, 128);
#ifdef STM32F4
    end_tick = HAL_GetTick();
    printf("Fast read time: %lu ms\n", end_tick - start_tick);
#endif

    /* ===== 測試 4: 十六進制 Dump ===== */
    printf("\n========================================\n");
    printf("Test 4: Hex Dump\n");
    printf("========================================\n\n");

    printf("Reading 128 bytes from 0x%08lX:\n\n", TEST_ADDR);
    w25q_read(TEST_ADDR, perf_buffer, 128);
    print_hex_dump(perf_buffer, 128, TEST_ADDR);

    printf("\n========================================\n");
    printf("All tests completed!\n");
    printf("========================================\n\n");

    printf("Flash Statistics:\n");
    printf("  Total Size: %d MB\n", W25Q_TOTAL_SIZE / (1024 * 1024));
    printf("  Page Size: %d bytes\n", W25Q_PAGE_SIZE);
    printf("  Sector Size: %d KB\n", W25Q_SECTOR_SIZE / 1024);
    printf("  Block Size (64K): %d KB\n", W25Q_BLOCK_SIZE_64K / 1024);

cleanup:
    /* 清理資源 */
    spi_deinit(spi);
    return 0;
}
