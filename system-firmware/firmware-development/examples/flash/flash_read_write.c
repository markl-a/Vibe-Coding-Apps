/**
 * @file flash_read_write.c
 * @brief Flash 讀寫操作範例
 * @description 展示內部 Flash 和 SPI Flash 的讀寫、擦除操作
 */

#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

// ============================================================================
// Flash 配置
// ============================================================================

// 內部 Flash (STM32F4 示例)
#define INTERNAL_FLASH_BASE    0x08000000
#define INTERNAL_FLASH_SIZE    (1024 * 1024)  // 1MB
#define SECTOR_SIZE            (128 * 1024)   // 128KB

// SPI Flash (W25Q64 示例)
#define SPI_FLASH_SIZE         (8 * 1024 * 1024)  // 8MB
#define SPI_PAGE_SIZE          256
#define SPI_SECTOR_SIZE        4096
#define SPI_BLOCK_SIZE         65536

// Flash 類型
typedef enum {
    FLASH_TYPE_INTERNAL = 0,
    FLASH_TYPE_SPI,
    FLASH_TYPE_QSPI
} flash_type_t;

// Flash 資訊
typedef struct {
    flash_type_t type;
    uint32_t base_address;
    uint32_t total_size;
    uint32_t sector_size;
    uint32_t page_size;
    uint32_t block_size;
    char manufacturer[32];
    char model[32];
} flash_info_t;

// Flash 統計
typedef struct {
    uint32_t read_count;
    uint32_t write_count;
    uint32_t erase_count;
    uint32_t error_count;
    uint32_t bytes_written;
    uint32_t bytes_read;
} flash_stats_t;

static flash_info_t flash_info;
static flash_stats_t flash_stats = {0};

// ============================================================================
// 內部 Flash 操作 (HAL 抽象)
// ============================================================================

int internal_flash_init(void) {
    printf("[Internal Flash] 初始化\n");

    flash_info.type = FLASH_TYPE_INTERNAL;
    flash_info.base_address = INTERNAL_FLASH_BASE;
    flash_info.total_size = INTERNAL_FLASH_SIZE;
    flash_info.sector_size = SECTOR_SIZE;
    flash_info.page_size = 2048;
    strcpy(flash_info.manufacturer, "STMicroelectronics");
    strcpy(flash_info.model, "STM32F407");

    return 0;
}

uint32_t get_sector_number(uint32_t address) {
    // 簡化的扇區計算 (實際 STM32 扇區大小不一)
    uint32_t offset = address - INTERNAL_FLASH_BASE;
    return offset / SECTOR_SIZE;
}

int internal_flash_erase_sector(uint32_t address) {
    uint32_t sector = get_sector_number(address);

    printf("[Internal Flash] 擦除扇區 %u @ 0x%08X\n", sector, address);

    // 實際實現:
    // HAL_FLASH_Unlock();
    // FLASH_EraseInitTypeDef erase_init;
    // erase_init.TypeErase = FLASH_TYPEERASE_SECTORS;
    // erase_init.Sector = sector;
    // erase_init.NbSectors = 1;
    // HAL_FLASHEx_Erase(&erase_init, &sector_error);
    // HAL_FLASH_Lock();

    flash_stats.erase_count++;
    return 0;
}

int internal_flash_write(uint32_t address, const uint8_t *data, uint32_t size) {
    printf("[Internal Flash] 寫入 %u 字節 @ 0x%08X\n", size, address);

    // 實際實現:
    // HAL_FLASH_Unlock();
    // for (uint32_t i = 0; i < size; i += 4) {
    //     uint32_t word = *(uint32_t *)(data + i);
    //     HAL_FLASH_Program(FLASH_TYPEPROGRAM_WORD, address + i, word);
    // }
    // HAL_FLASH_Lock();

    flash_stats.write_count++;
    flash_stats.bytes_written += size;
    return 0;
}

int internal_flash_read(uint32_t address, uint8_t *buffer, uint32_t size) {
    printf("[Internal Flash] 讀取 %u 字節 @ 0x%08X\n", size, address);

    // 實際實現:
    // memcpy(buffer, (void *)address, size);

    // 模擬讀取數據
    memset(buffer, 0x5A, size);

    flash_stats.read_count++;
    flash_stats.bytes_read += size;
    return 0;
}

// ============================================================================
// SPI Flash 操作
// ============================================================================

// SPI Flash 命令
#define CMD_WRITE_ENABLE    0x06
#define CMD_WRITE_DISABLE   0x04
#define CMD_READ_STATUS     0x05
#define CMD_PAGE_PROGRAM    0x02
#define CMD_SECTOR_ERASE    0x20
#define CMD_BLOCK_ERASE     0xD8
#define CMD_CHIP_ERASE      0xC7
#define CMD_READ_DATA       0x03
#define CMD_FAST_READ       0x0B
#define CMD_READ_ID         0x9F

typedef struct {
    uint8_t manufacturer_id;
    uint8_t device_id_1;
    uint8_t device_id_2;
} spi_flash_id_t;

void spi_send_byte(uint8_t byte) {
    // 實際會通過 SPI 發送
    // HAL_SPI_Transmit(&hspi1, &byte, 1, 100);
}

uint8_t spi_receive_byte(void) {
    // 實際會通過 SPI 接收
    // uint8_t data;
    // HAL_SPI_Receive(&hspi1, &data, 1, 100);
    // return data;
    return 0xFF;
}

void spi_flash_cs_low(void) {
    // HAL_GPIO_WritePin(SPI_CS_GPIO_Port, SPI_CS_Pin, GPIO_PIN_RESET);
}

void spi_flash_cs_high(void) {
    // HAL_GPIO_WritePin(SPI_CS_GPIO_Port, SPI_CS_Pin, GPIO_PIN_SET);
}

void spi_flash_wait_busy(void) {
    uint8_t status;
    do {
        spi_flash_cs_low();
        spi_send_byte(CMD_READ_STATUS);
        status = spi_receive_byte();
        spi_flash_cs_high();
    } while (status & 0x01); // WIP bit
}

void spi_flash_write_enable(void) {
    spi_flash_cs_low();
    spi_send_byte(CMD_WRITE_ENABLE);
    spi_flash_cs_high();
}

int spi_flash_init(void) {
    printf("[SPI Flash] 初始化\n");

    // 讀取 Flash ID
    spi_flash_id_t id;
    spi_flash_cs_low();
    spi_send_byte(CMD_READ_ID);
    id.manufacturer_id = spi_receive_byte();
    id.device_id_1 = spi_receive_byte();
    id.device_id_2 = spi_receive_byte();
    spi_flash_cs_high();

    printf("[SPI Flash] 製造商: 0x%02X, 設備 ID: 0x%02X%02X\n",
           id.manufacturer_id, id.device_id_1, id.device_id_2);

    flash_info.type = FLASH_TYPE_SPI;
    flash_info.base_address = 0;
    flash_info.total_size = SPI_FLASH_SIZE;
    flash_info.sector_size = SPI_SECTOR_SIZE;
    flash_info.page_size = SPI_PAGE_SIZE;
    flash_info.block_size = SPI_BLOCK_SIZE;
    strcpy(flash_info.manufacturer, "Winbond");
    strcpy(flash_info.model, "W25Q64");

    return 0;
}

int spi_flash_erase_sector(uint32_t address) {
    printf("[SPI Flash] 擦除扇區 @ 0x%06X\n", address);

    spi_flash_write_enable();

    spi_flash_cs_low();
    spi_send_byte(CMD_SECTOR_ERASE);
    spi_send_byte((address >> 16) & 0xFF);
    spi_send_byte((address >> 8) & 0xFF);
    spi_send_byte(address & 0xFF);
    spi_flash_cs_high();

    spi_flash_wait_busy();

    flash_stats.erase_count++;
    return 0;
}

int spi_flash_write_page(uint32_t address, const uint8_t *data, uint32_t size) {
    if (size > SPI_PAGE_SIZE) {
        printf("[SPI Flash] 錯誤：單次寫入不能超過 %d 字節\n", SPI_PAGE_SIZE);
        return -1;
    }

    printf("[SPI Flash] 寫入頁面 %u 字節 @ 0x%06X\n", size, address);

    spi_flash_write_enable();

    spi_flash_cs_low();
    spi_send_byte(CMD_PAGE_PROGRAM);
    spi_send_byte((address >> 16) & 0xFF);
    spi_send_byte((address >> 8) & 0xFF);
    spi_send_byte(address & 0xFF);

    for (uint32_t i = 0; i < size; i++) {
        spi_send_byte(data[i]);
    }

    spi_flash_cs_high();
    spi_flash_wait_busy();

    flash_stats.write_count++;
    flash_stats.bytes_written += size;
    return 0;
}

int spi_flash_read(uint32_t address, uint8_t *buffer, uint32_t size) {
    printf("[SPI Flash] 讀取 %u 字節 @ 0x%06X\n", size, address);

    spi_flash_cs_low();
    spi_send_byte(CMD_READ_DATA);
    spi_send_byte((address >> 16) & 0xFF);
    spi_send_byte((address >> 8) & 0xFF);
    spi_send_byte(address & 0xFF);

    for (uint32_t i = 0; i < size; i++) {
        buffer[i] = spi_receive_byte();
    }

    spi_flash_cs_high();

    flash_stats.read_count++;
    flash_stats.bytes_read += size;
    return 0;
}

// ============================================================================
// 通用 Flash API
// ============================================================================

int flash_init(flash_type_t type) {
    printf("\n[Flash] 初始化 Flash 驅動\n");

    memset(&flash_stats, 0, sizeof(flash_stats));

    if (type == FLASH_TYPE_INTERNAL) {
        return internal_flash_init();
    } else if (type == FLASH_TYPE_SPI) {
        return spi_flash_init();
    }

    return -1;
}

flash_info_t flash_get_info(void) {
    return flash_info;
}

void flash_print_info(void) {
    printf("\n========== Flash 資訊 ==========\n");
    printf("類型: %s\n",
           flash_info.type == FLASH_TYPE_INTERNAL ? "內部 Flash" :
           flash_info.type == FLASH_TYPE_SPI ? "SPI Flash" : "未知");
    printf("製造商: %s\n", flash_info.manufacturer);
    printf("型號: %s\n", flash_info.model);
    printf("基地址: 0x%08X\n", flash_info.base_address);
    printf("總容量: %u KB\n", flash_info.total_size / 1024);
    printf("扇區大小: %u KB\n", flash_info.sector_size / 1024);
    printf("頁面大小: %u 字節\n", flash_info.page_size);
    printf("================================\n\n");
}

void flash_print_stats(void) {
    printf("\n========== Flash 統計 ==========\n");
    printf("讀取次數: %u\n", flash_stats.read_count);
    printf("寫入次數: %u\n", flash_stats.write_count);
    printf("擦除次數: %u\n", flash_stats.erase_count);
    printf("錯誤次數: %u\n", flash_stats.error_count);
    printf("已寫入: %u 字節\n", flash_stats.bytes_written);
    printf("已讀取: %u 字節\n", flash_stats.bytes_read);
    printf("================================\n\n");
}

// ============================================================================
// CRC32 校驗
// ============================================================================

uint32_t crc32_calculate(const uint8_t *data, uint32_t length) {
    uint32_t crc = 0xFFFFFFFF;

    for (uint32_t i = 0; i < length; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            crc = (crc >> 1) ^ (0xEDB88320 & -(crc & 1));
        }
    }

    return ~crc;
}

// ============================================================================
// Flash 測試函數
// ============================================================================

void test_flash_write_read(uint32_t address, uint32_t size) {
    printf("\n========== Flash 讀寫測試 ==========\n");
    printf("測試地址: 0x%08X\n", address);
    printf("測試大小: %u 字節\n\n", size);

    // 準備測試數據
    uint8_t *write_buffer = (uint8_t *)malloc(size);
    uint8_t *read_buffer = (uint8_t *)malloc(size);

    // 生成測試數據
    for (uint32_t i = 0; i < size; i++) {
        write_buffer[i] = (uint8_t)(i & 0xFF);
    }

    uint32_t write_crc = crc32_calculate(write_buffer, size);
    printf("寫入數據 CRC32: 0x%08X\n\n", write_crc);

    // 擦除扇區
    if (flash_info.type == FLASH_TYPE_INTERNAL) {
        internal_flash_erase_sector(address);
    } else {
        spi_flash_erase_sector(address);
    }

    // 寫入數據
    if (flash_info.type == FLASH_TYPE_INTERNAL) {
        internal_flash_write(address, write_buffer, size);
    } else {
        // SPI Flash 需要按頁寫入
        for (uint32_t offset = 0; offset < size; offset += SPI_PAGE_SIZE) {
            uint32_t chunk_size = (size - offset) > SPI_PAGE_SIZE ?
                                  SPI_PAGE_SIZE : (size - offset);
            spi_flash_write_page(address + offset,
                                write_buffer + offset,
                                chunk_size);
        }
    }

    // 讀取數據
    if (flash_info.type == FLASH_TYPE_INTERNAL) {
        internal_flash_read(address, read_buffer, size);
    } else {
        spi_flash_read(address, read_buffer, size);
    }

    // 驗證數據
    uint32_t read_crc = crc32_calculate(read_buffer, size);
    printf("讀取數據 CRC32: 0x%08X\n\n", read_crc);

    if (write_crc == read_crc) {
        printf("✅ Flash 讀寫測試成功！\n");
    } else {
        printf("❌ Flash 讀寫測試失敗！\n");
        flash_stats.error_count++;
    }

    free(write_buffer);
    free(read_buffer);
}

void test_flash_performance(void) {
    printf("\n========== Flash 性能測試 ==========\n");

    const uint32_t test_size = 4096; // 4KB
    uint8_t *buffer = (uint8_t *)malloc(test_size);

    // 初始化測試數據
    for (uint32_t i = 0; i < test_size; i++) {
        buffer[i] = (uint8_t)(i & 0xFF);
    }

    // 寫入性能測試
    printf("\n寫入性能測試 (%u 字節)...\n", test_size);
    uint32_t start_time = 0; // 實際會用 HAL_GetTick()

    if (flash_info.type == FLASH_TYPE_SPI) {
        for (uint32_t offset = 0; offset < test_size; offset += SPI_PAGE_SIZE) {
            spi_flash_write_page(0x100000 + offset, buffer + offset, SPI_PAGE_SIZE);
        }
    }

    uint32_t end_time = 100; // 模擬耗時
    printf("寫入耗時: %u ms\n", end_time - start_time);
    printf("寫入速度: %.2f KB/s\n",
           (test_size / 1024.0) / ((end_time - start_time) / 1000.0));

    // 讀取性能測試
    printf("\n讀取性能測試 (%u 字節)...\n", test_size);
    start_time = 0;

    if (flash_info.type == FLASH_TYPE_SPI) {
        spi_flash_read(0x100000, buffer, test_size);
    }

    end_time = 10; // 模擬耗時
    printf("讀取耗時: %u ms\n", end_time - start_time);
    printf("讀取速度: %.2f KB/s\n",
           (test_size / 1024.0) / ((end_time - start_time) / 1000.0));

    free(buffer);
}

// ============================================================================
// 配置存儲範例
// ============================================================================

#define CONFIG_FLASH_ADDR   0x080E0000  // 內部 Flash 配置區
#define CONFIG_MAGIC        0x434F4E46  // "CONF"

typedef struct {
    uint32_t magic;
    uint32_t version;
    char device_name[32];
    uint8_t mac_address[6];
    uint32_t ip_address;
    uint16_t port;
    uint8_t flags;
    uint32_t crc32;
} device_config_t;

void example_config_storage(void) {
    printf("\n========== 配置存儲範例 ==========\n\n");

    device_config_t config = {
        .magic = CONFIG_MAGIC,
        .version = 1,
        .mac_address = {0x00, 0x11, 0x22, 0x33, 0x44, 0x55},
        .ip_address = 0xC0A80101, // 192.168.1.1
        .port = 8080,
        .flags = 0x01
    };

    strcpy(config.device_name, "ESP32_Device");

    // 計算 CRC
    config.crc32 = 0;
    config.crc32 = crc32_calculate((uint8_t *)&config, sizeof(config));

    printf("保存配置到 Flash...\n");
    printf("  設備名稱: %s\n", config.device_name);
    printf("  MAC 地址: %02X:%02X:%02X:%02X:%02X:%02X\n",
           config.mac_address[0], config.mac_address[1],
           config.mac_address[2], config.mac_address[3],
           config.mac_address[4], config.mac_address[5]);
    printf("  IP 地址: %d.%d.%d.%d\n",
           (config.ip_address >> 24) & 0xFF,
           (config.ip_address >> 16) & 0xFF,
           (config.ip_address >> 8) & 0xFF,
           config.ip_address & 0xFF);
    printf("  端口: %u\n", config.port);
    printf("  CRC32: 0x%08X\n\n", config.crc32);

    // 寫入配置
    internal_flash_erase_sector(CONFIG_FLASH_ADDR);
    internal_flash_write(CONFIG_FLASH_ADDR, (uint8_t *)&config, sizeof(config));

    // 讀取配置
    device_config_t read_config;
    internal_flash_read(CONFIG_FLASH_ADDR, (uint8_t *)&read_config, sizeof(read_config));

    // 驗證配置
    if (read_config.magic == CONFIG_MAGIC) {
        uint32_t saved_crc = read_config.crc32;
        read_config.crc32 = 0;
        uint32_t calculated_crc = crc32_calculate((uint8_t *)&read_config, sizeof(read_config));

        if (saved_crc == calculated_crc) {
            printf("✅ 配置讀取並驗證成功！\n");
        } else {
            printf("❌ 配置 CRC 驗證失敗！\n");
        }
    } else {
        printf("❌ 配置魔數無效！\n");
    }
}

// ============================================================================
// 主程式
// ============================================================================

int main(void) {
    printf("\n");
    printf("========================================\n");
    printf("  Flash 讀寫操作範例\n");
    printf("========================================\n");

    // 測試內部 Flash
    printf("\n--- 測試內部 Flash ---\n");
    flash_init(FLASH_TYPE_INTERNAL);
    flash_print_info();
    example_config_storage();
    test_flash_write_read(0x08080000, 1024);

    // 測試 SPI Flash
    printf("\n\n--- 測試 SPI Flash ---\n");
    flash_init(FLASH_TYPE_SPI);
    flash_print_info();
    test_flash_write_read(0x100000, 4096);
    test_flash_performance();

    // 顯示統計
    flash_print_stats();

    printf("\n========================================\n");
    printf("  Flash 範例完成！\n");
    printf("========================================\n\n");

    return 0;
}
