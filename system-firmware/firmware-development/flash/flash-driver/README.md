# 💾 Flash Driver - Flash 驅動程式

## 概述

通用 Flash 存儲驅動，支援內部 Flash 和外部 SPI Flash。

## 功能特點

- ✅ 內部 Flash 支援 (STM32, ESP32等)
- ✅ 外部 SPI Flash (W25Q, MX25等)
- ✅ 扇區/頁面擦除
- ✅ 頁面編程
- ✅ 讀取操作
- ✅ 寫保護管理

## API 介面

```c
// 初始化
int flash_init(flash_type_t type);

// 擦除扇區
int flash_erase_sector(uint32_t address);

// 擦除多個扇區
int flash_erase_range(uint32_t start, uint32_t size);

// 寫入
int flash_write(uint32_t address, const uint8_t *data, uint32_t size);

// 讀取
int flash_read(uint32_t address, uint8_t *buffer, uint32_t size);

// 獲取資訊
flash_info_t flash_get_info(void);
```

## 使用範例

```c
#include "flash_driver.h"

void flash_example(void)
{
    uint8_t data[256] = "Test data";
    uint8_t read_buf[256];

    // 初始化
    flash_init(FLASH_TYPE_INTERNAL);

    // 擦除扇區
    flash_erase_sector(0x08080000);

    // 寫入數據
    flash_write(0x08080000, data, 256);

    // 讀取數據
    flash_read(0x08080000, read_buf, 256);

    // 驗證
    if (memcmp(data, read_buf, 256) == 0) {
        printf("Flash write/read OK\n");
    }
}
```

## SPI Flash 支援

```c
// W25Q64 配置
spi_flash_config_t config = {
    .spi_port = SPI1,
    .cs_pin = GPIO_PIN_4,
    .size = 8 * 1024 * 1024,  // 8MB
    .page_size = 256,
    .sector_size = 4096,
};

spi_flash_init(&config);
```

**狀態**: ✅ 可用
