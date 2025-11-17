/**
 * @file eeprom_basic.c
 * @brief I2C EEPROM 基本讀寫範例
 *
 * 此範例示範如何使用 I2C HAL 與 EEPROM (如 AT24C32) 進行通訊
 * 包括單字節、多字節讀寫操作
 */

#include "i2c_hal.h"
#include <stdio.h>
#include <string.h>

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

/* EEPROM 配置 */
#define EEPROM_ADDR         0x50    /* AT24C32 的標準地址 (7-bit) */
#define EEPROM_PAGE_SIZE    32      /* AT24C32 頁大小為 32 字節 */
#define EEPROM_SIZE         4096    /* AT24C32 總容量 4KB */
#define EEPROM_WRITE_DELAY  5       /* 寫入後延遲時間 (ms) */

/* I2C 句柄 */
static i2c_handle_t i2c;

/**
 * @brief 等待 EEPROM 寫入完成
 *
 * EEPROM 寫入後需要時間來完成內部編程
 * 使用輪詢方式檢測是否完成
 */
static void eeprom_wait_ready(void)
{
    uint8_t dummy;
    int retry = 100;

    /* 嘗試讀取，直到 EEPROM 響應 */
    while (retry-- > 0) {
        if (i2c_master_read(i2c, EEPROM_ADDR, &dummy, 1) == 0) {
            return;  /* EEPROM 已就緒 */
        }
        delay_ms(1);
    }
}

/**
 * @brief 寫入單個字節到 EEPROM
 *
 * @param mem_addr 記憶體地址 (0-4095)
 * @param data 要寫入的數據
 * @return int 0: 成功, -1: 失敗
 */
int eeprom_write_byte(uint16_t mem_addr, uint8_t data)
{
    if (mem_addr >= EEPROM_SIZE) {
        return -1;
    }

    int result = i2c_mem_write(i2c, EEPROM_ADDR, mem_addr, &data, 1);

    if (result == 0) {
        eeprom_wait_ready();
    }

    return result;
}

/**
 * @brief 從 EEPROM 讀取單個字節
 *
 * @param mem_addr 記憶體地址 (0-4095)
 * @param data 讀取緩衝區
 * @return int 0: 成功, -1: 失敗
 */
int eeprom_read_byte(uint16_t mem_addr, uint8_t *data)
{
    if (mem_addr >= EEPROM_SIZE) {
        return -1;
    }

    return i2c_mem_read(i2c, EEPROM_ADDR, mem_addr, data, 1);
}

/**
 * @brief 寫入多個字節到 EEPROM (頁寫入)
 *
 * @param mem_addr 起始記憶體地址
 * @param data 數據緩衝區
 * @param len 數據長度
 * @return int 實際寫入的字節數, -1: 失敗
 */
int eeprom_write_page(uint16_t mem_addr, const uint8_t *data, size_t len)
{
    if (mem_addr >= EEPROM_SIZE || len == 0) {
        return -1;
    }

    /* 確保不跨頁寫入 */
    uint16_t page_offset = mem_addr % EEPROM_PAGE_SIZE;
    size_t write_len = (len > (EEPROM_PAGE_SIZE - page_offset)) ?
                       (EEPROM_PAGE_SIZE - page_offset) : len;

    int result = i2c_mem_write(i2c, EEPROM_ADDR, mem_addr, data, write_len);

    if (result == 0) {
        eeprom_wait_ready();
        return write_len;
    }

    return -1;
}

/**
 * @brief 從 EEPROM 讀取多個字節
 *
 * @param mem_addr 起始記憶體地址
 * @param data 讀取緩衝區
 * @param len 要讀取的長度
 * @return int 實際讀取的字節數, -1: 失敗
 */
int eeprom_read_bytes(uint16_t mem_addr, uint8_t *data, size_t len)
{
    if (mem_addr >= EEPROM_SIZE || len == 0) {
        return -1;
    }

    /* 限制讀取長度不超過 EEPROM 大小 */
    if (mem_addr + len > EEPROM_SIZE) {
        len = EEPROM_SIZE - mem_addr;
    }

    int result = i2c_mem_read(i2c, EEPROM_ADDR, mem_addr, data, len);

    return (result == 0) ? len : -1;
}

/**
 * @brief 寫入字符串到 EEPROM
 *
 * @param mem_addr 起始地址
 * @param str 字符串
 * @return int 寫入的字節數 (包括 null 終止符)
 */
int eeprom_write_string(uint16_t mem_addr, const char *str)
{
    size_t len = strlen(str) + 1;  /* 包括 null 終止符 */
    uint16_t addr = mem_addr;
    size_t written = 0;

    while (written < len) {
        size_t chunk = (len - written > EEPROM_PAGE_SIZE) ?
                       EEPROM_PAGE_SIZE : (len - written);

        int result = eeprom_write_page(addr, (const uint8_t *)(str + written), chunk);
        if (result < 0) {
            return -1;
        }

        written += result;
        addr += result;

        /* 如果還有數據要寫，等待頁寫入完成 */
        if (written < len) {
            delay_ms(EEPROM_WRITE_DELAY);
        }
    }

    return written;
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
    printf("I2C HAL - EEPROM Basic Example\n");
    printf("========================================\n\n");

    /* 配置 I2C */
    i2c_config_t i2c_config = {
        .mode = I2C_MODE_MASTER,
        .clock_speed = I2C_SPEED_STANDARD,
        .address_mode = I2C_ADDR_7BIT,
        .own_address = 0x00
    };

    /* 初始化 I2C */
    i2c = i2c_init(1, &i2c_config);
    if (!i2c) {
        printf("Error: Failed to initialize I2C\n");
        return -1;
    }

    printf("I2C initialized successfully!\n");
    printf("EEPROM Address: 0x%02X\n", EEPROM_ADDR);
    printf("EEPROM Size: %d bytes\n", EEPROM_SIZE);
    printf("Page Size: %d bytes\n\n", EEPROM_PAGE_SIZE);

    /* ===== 測試 1: 單字節讀寫 ===== */
    printf("Test 1: Single Byte Write/Read\n");
    printf("--------------------------------\n");

    uint8_t write_value = 0xAB;
    uint16_t test_addr = 0x0010;

    printf("Writing 0x%02X to address 0x%04X...\n", write_value, test_addr);
    if (eeprom_write_byte(test_addr, write_value) != 0) {
        printf("Error: Write failed\n");
        goto cleanup;
    }
    printf("Write successful!\n");

    uint8_t read_value = 0;
    printf("Reading from address 0x%04X...\n", test_addr);
    if (eeprom_read_byte(test_addr, &read_value) != 0) {
        printf("Error: Read failed\n");
        goto cleanup;
    }

    printf("Read value: 0x%02X\n", read_value);
    if (read_value == write_value) {
        printf("✓ Single byte test PASSED\n\n");
    } else {
        printf("✗ Single byte test FAILED (expected 0x%02X, got 0x%02X)\n\n",
               write_value, read_value);
    }

    /* ===== 測試 2: 多字節讀寫 ===== */
    printf("Test 2: Multi-Byte Write/Read\n");
    printf("-------------------------------\n");

    uint8_t write_buffer[16] = {
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10
    };
    uint8_t read_buffer[16] = {0};
    test_addr = 0x0020;

    printf("Writing 16 bytes to address 0x%04X...\n", test_addr);
    int written = eeprom_write_page(test_addr, write_buffer, sizeof(write_buffer));
    if (written < 0) {
        printf("Error: Write failed\n");
        goto cleanup;
    }
    printf("Written %d bytes\n", written);

    printf("Reading 16 bytes from address 0x%04X...\n", test_addr);
    int read_count = eeprom_read_bytes(test_addr, read_buffer, sizeof(read_buffer));
    if (read_count < 0) {
        printf("Error: Read failed\n");
        goto cleanup;
    }
    printf("Read %d bytes\n", read_count);

    /* 驗證數據 */
    bool match = true;
    for (int i = 0; i < 16; i++) {
        if (read_buffer[i] != write_buffer[i]) {
            match = false;
            break;
        }
    }

    if (match) {
        printf("✓ Multi-byte test PASSED\n\n");
    } else {
        printf("✗ Multi-byte test FAILED\n");
        printf("Expected: ");
        for (int i = 0; i < 16; i++) printf("%02X ", write_buffer[i]);
        printf("\nGot:      ");
        for (int i = 0; i < 16; i++) printf("%02X ", read_buffer[i]);
        printf("\n\n");
    }

    /* ===== 測試 3: 字符串讀寫 ===== */
    printf("Test 3: String Write/Read\n");
    printf("--------------------------\n");

    const char *test_string = "Hello, I2C EEPROM!";
    char read_string[64] = {0};
    test_addr = 0x0100;

    printf("Writing string: \"%s\"\n", test_string);
    printf("To address: 0x%04X\n", test_addr);

    int str_len = eeprom_write_string(test_addr, test_string);
    if (str_len < 0) {
        printf("Error: String write failed\n");
        goto cleanup;
    }
    printf("Written %d bytes (including null terminator)\n", str_len);

    printf("Reading string from address 0x%04X...\n", test_addr);
    if (eeprom_read_bytes(test_addr, (uint8_t *)read_string, str_len) < 0) {
        printf("Error: String read failed\n");
        goto cleanup;
    }

    printf("Read string: \"%s\"\n", read_string);

    if (strcmp(test_string, read_string) == 0) {
        printf("✓ String test PASSED\n\n");
    } else {
        printf("✗ String test FAILED\n\n");
    }

    /* ===== 測試 4: 邊界條件測試 ===== */
    printf("Test 4: Boundary Conditions\n");
    printf("----------------------------\n");

    /* 測試頁邊界寫入 */
    printf("Testing page boundary write...\n");
    uint8_t boundary_data[40];
    for (int i = 0; i < 40; i++) {
        boundary_data[i] = i;
    }

    test_addr = 0x01F0;  /* 靠近頁邊界 */
    printf("Writing 40 bytes starting at 0x%04X (crosses page boundary)\n", test_addr);

    /* 分頁寫入 */
    int total_written = 0;
    while (total_written < 40) {
        int chunk = eeprom_write_page(test_addr + total_written,
                                      boundary_data + total_written,
                                      40 - total_written);
        if (chunk < 0) {
            printf("Error: Boundary write failed\n");
            goto cleanup;
        }
        total_written += chunk;
        delay_ms(EEPROM_WRITE_DELAY);
    }
    printf("Written %d bytes across page boundaries\n", total_written);

    /* 驗證 */
    uint8_t boundary_read[40] = {0};
    if (eeprom_read_bytes(test_addr, boundary_read, 40) < 0) {
        printf("Error: Boundary read failed\n");
        goto cleanup;
    }

    match = true;
    for (int i = 0; i < 40; i++) {
        if (boundary_read[i] != boundary_data[i]) {
            match = false;
            break;
        }
    }

    if (match) {
        printf("✓ Boundary test PASSED\n\n");
    } else {
        printf("✗ Boundary test FAILED\n\n");
    }

    printf("========================================\n");
    printf("All tests completed!\n");
    printf("========================================\n");

cleanup:
    /* 清理資源 */
    i2c_deinit(i2c);
    return 0;
}
