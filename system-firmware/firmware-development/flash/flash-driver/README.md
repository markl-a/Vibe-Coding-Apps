# 💾 Flash Driver - Flash 驅動程式

## 概述

通用 Flash 存儲驅動，支援內部 Flash、SPI Flash 和 QSPI Flash。提供統一的 HAL 抽象層，簡化多平台開發。

## 功能特點

- ✅ **Flash HAL 抽象層** - 統一的介面，支援多種 Flash 類型
- ✅ **內部 Flash 支援** - STM32F1/F4/L4 系列
- ✅ **SPI Flash 驅動** - W25Qxx 系列（W25Q16/32/64/128/256）
- ✅ **QSPI Flash 驅動** - 支援高速 Quad SPI 模式
- ✅ **記憶體映射模式** - QSPI XIP（Execute In Place）
- ✅ **完整的讀寫擦除** - 頁面編程、扇區擦除、塊擦除
- ✅ **多平台支援** - STM32、ESP32、nRF52
- ✅ **單元測試** - 完整的測試覆蓋

## 架構設計

```
flash-driver/
├── flash_hal.h/c           # HAL 抽象層
├── flash_driver.h/c        # 內部 Flash 驅動
├── spi_flash.h/c           # SPI Flash 驅動
├── qspi_flash.h/c          # QSPI Flash 驅動
├── test_flash.c            # 單元測試
├── Makefile                # 構建系統
└── README.md               # 本文件
```

## API 介面

### Flash HAL 抽象層

```c
// 註冊 Flash 設備
flash_status_t flash_hal_register(flash_device_t *device);

// 初始化 Flash
flash_status_t flash_hal_init(flash_device_t *device);

// 讀取數據
flash_status_t flash_hal_read(flash_device_t *device, uint32_t address,
                               uint8_t *data, uint32_t size);

// 寫入數據
flash_status_t flash_hal_write(flash_device_t *device, uint32_t address,
                                const uint8_t *data, uint32_t size);

// 擦除扇區
flash_status_t flash_hal_erase_sector(flash_device_t *device, uint32_t address);

// 擦除塊
flash_status_t flash_hal_erase_block(flash_device_t *device, uint32_t address);

// 擦除整個 Flash
flash_status_t flash_hal_erase_chip(flash_device_t *device);

// 獲取 Flash 資訊
flash_status_t flash_hal_get_info(flash_device_t *device, flash_info_t *info);
```

### 內部 Flash

```c
// 初始化
flash_status_t internal_flash_init(void);

// 解鎖 Flash
flash_status_t internal_flash_unlock(void);

// 鎖定 Flash
flash_status_t internal_flash_lock(void);

// 讀取
flash_status_t internal_flash_read(uint32_t address, uint8_t *data, uint32_t size);

// 寫入
flash_status_t internal_flash_write(uint32_t address, const uint8_t *data, uint32_t size);

// 擦除頁面
flash_status_t internal_flash_erase_page(uint32_t address);

// 批量擦除
flash_status_t internal_flash_mass_erase(void);
```

### SPI Flash

```c
// 初始化
flash_status_t spi_flash_init(const spi_flash_config_t *config);

// 讀取 JEDEC ID
flash_status_t spi_flash_read_id(uint8_t *manufacturer_id, uint16_t *device_id);

// 讀取數據
flash_status_t spi_flash_read(uint32_t address, uint8_t *data, uint32_t size);

// 寫入頁面
flash_status_t spi_flash_write_page(uint32_t address, const uint8_t *data, uint32_t size);

// 寫入數據（自動處理多頁）
flash_status_t spi_flash_write(uint32_t address, const uint8_t *data, uint32_t size);

// 擦除扇區（4KB）
flash_status_t spi_flash_erase_sector(uint32_t address);

// 擦除塊（64KB）
flash_status_t spi_flash_erase_block_64k(uint32_t address);

// 擦除整個芯片
flash_status_t spi_flash_erase_chip(void);

// 省電模式
flash_status_t spi_flash_power_down(void);
flash_status_t spi_flash_wake_up(void);
```

### QSPI Flash

```c
// 初始化
flash_status_t qspi_flash_init(const qspi_flash_config_t *config);

// 復位 Flash
flash_status_t qspi_flash_reset(void);

// 快速四線讀取
flash_status_t qspi_flash_fast_read_quad(uint32_t address, uint8_t *data, uint32_t size);

// 四線頁面編程
flash_status_t qspi_flash_quad_write_page(uint32_t address, const uint8_t *data, uint32_t size);

// 進入 QPI 模式（4-4-4）
flash_status_t qspi_flash_enter_qpi_mode(void);

// 退出 QPI 模式
flash_status_t qspi_flash_exit_qpi_mode(void);

// 啟用記憶體映射模式（XIP）
flash_status_t qspi_flash_enable_memory_mapped(void);

// 禁用記憶體映射模式
flash_status_t qspi_flash_disable_memory_mapped(void);
```

## 使用範例

### 內部 Flash 範例

```c
#include "flash_driver.h"
#include "flash_hal.h"

void internal_flash_example(void)
{
    uint8_t data[256];
    uint8_t read_buf[256];

    // 準備數據
    for (int i = 0; i < 256; i++) {
        data[i] = i;
    }

    // 獲取設備
    flash_device_t *device = internal_flash_get_device();

    // 註冊並初始化
    flash_hal_register(device);
    flash_hal_init(device);

    // 解鎖 Flash
    internal_flash_unlock();

    // 擦除扇區
    flash_hal_erase_sector(device, 0);

    // 寫入數據
    flash_hal_write(device, 0, data, 256);

    // 讀取數據
    flash_hal_read(device, 0, read_buf, 256);

    // 鎖定 Flash
    internal_flash_lock();

    // 清理
    flash_hal_deinit(device);
}
```

### SPI Flash 範例

```c
#include "spi_flash.h"

// 定義 SPI I/O 回調
static const spi_flash_io_t spi_io = {
    .init = my_spi_init,
    .deinit = my_spi_deinit,
    .cs_low = my_cs_low,
    .cs_high = my_cs_high,
    .transfer = my_spi_transfer,
    .delay_ms = my_delay_ms,
};

void spi_flash_example(void)
{
    // 配置 W25Q64（8MB）
    spi_flash_config_t config = {
        .device_id = W25Q64_ID,
        .total_size = 8 * 1024 * 1024,
        .io = &spi_io,
    };

    // 初始化
    spi_flash_init(&config);

    // 讀取設備 ID
    uint8_t mfr_id;
    uint16_t dev_id;
    spi_flash_read_id(&mfr_id, &dev_id);
    printf("Manufacturer: 0x%02X, Device: 0x%04X\n", mfr_id, dev_id);

    // 擦除扇區
    spi_flash_erase_sector(0);

    // 寫入數據
    uint8_t data[256] = "Hello SPI Flash!";
    spi_flash_write(0, data, 256);

    // 讀取數據
    uint8_t read_buf[256];
    spi_flash_read(0, read_buf, 256);

    // 清理
    spi_flash_deinit();
}
```

### QSPI Flash 範例

```c
#include "qspi_flash.h"

// 定義 QSPI I/O 回調
static const qspi_flash_io_t qspi_io = {
    .init = my_qspi_init,
    .deinit = my_qspi_deinit,
    .command = my_qspi_command,
    .read_indirect = my_qspi_read,
    .write_indirect = my_qspi_write,
    .memory_mapped_enable = my_qspi_mmap_enable,
    .memory_mapped_disable = my_qspi_mmap_disable,
    .delay_ms = my_delay_ms,
};

void qspi_flash_example(void)
{
    // 配置
    qspi_flash_config_t config = {
        .device_id = W25Q64_ID,
        .total_size = 8 * 1024 * 1024,
        .default_mode = QSPI_MODE_QUAD_OUT,
        .io = &qspi_io,
    };

    // 初始化
    qspi_flash_init(&config);

    // 復位設備
    qspi_flash_reset();

    // 使用快速四線讀取
    uint8_t data[1024];
    qspi_flash_fast_read_quad(0, data, 1024);

    // 啟用記憶體映射模式進行 XIP
    qspi_flash_enable_memory_mapped();

    // 現在可以直接訪問 Flash 地址
    // volatile uint8_t *flash_mem = (volatile uint8_t *)0x90000000;
    // uint8_t value = flash_mem[0];

    // 禁用記憶體映射模式
    qspi_flash_disable_memory_mapped();

    // 清理
    qspi_flash_deinit();
}
```

## 構建和測試

### 編譯庫

```bash
make
```

### 運行測試

```bash
make test
```

### 清理構建文件

```bash
make clean
```

### 安裝到系統

```bash
sudo make install
```

### 其他目標

```bash
make analyze    # 靜態分析
make format     # 格式化代碼
make docs       # 生成文檔
```

## 平台配置

### STM32F1

```bash
make CFLAGS+='-DSTM32F1'
```

### STM32F4

```bash
make CFLAGS+='-DSTM32F4'
```

### STM32L4

```bash
make CFLAGS+='-DSTM32L4'
```

## Flash 規格

### W25Qxx 系列

| 型號 | 容量 | JEDEC ID | 頁面大小 | 扇區大小 | 塊大小 |
|------|------|----------|---------|---------|--------|
| W25Q16 | 2MB | 0xEF4015 | 256B | 4KB | 64KB |
| W25Q32 | 4MB | 0xEF4016 | 256B | 4KB | 64KB |
| W25Q64 | 8MB | 0xEF4017 | 256B | 4KB | 64KB |
| W25Q128 | 16MB | 0xEF4018 | 256B | 4KB | 64KB |
| W25Q256 | 32MB | 0xEF4019 | 256B | 4KB | 64KB |

## 性能基準

典型性能數據（基於 STM32F4 @ 168MHz）：

- **內部 Flash**
  - 讀取速度: ~30 MB/s
  - 寫入速度: ~10 KB/s
  - 擦除時間: ~20ms/扇區

- **SPI Flash @ 42MHz**
  - 讀取速度: ~5 MB/s
  - 寫入速度: ~200 KB/s
  - 擦除時間: ~50ms/4KB 扇區

- **QSPI Flash @ 84MHz（Quad 模式）**
  - 讀取速度: ~20 MB/s
  - 寫入速度: ~800 KB/s
  - 擦除時間: ~50ms/4KB 扇區

## 注意事項

1. **寫入前必須擦除** - Flash 只能從 1 寫到 0，擦除會將所有位設為 1
2. **頁面對齊** - 寫入操作應該對齊頁面邊界以獲得最佳性能
3. **擦除次數限制** - Flash 有擦除次數限制（通常 10K-100K 次）
4. **電源穩定** - 寫入和擦除操作需要穩定的電源
5. **寫保護** - 某些區域可能被寫保護，需要先解除保護

## 故障排除

### 讀取全是 0xFF
- 檢查 SPI/QSPI 連接
- 驗證芯片選擇信號
- 確認時鐘配置正確

### 寫入失敗
- 確認已擦除目標區域
- 檢查寫保護狀態
- 驗證電源穩定

### 識別失敗
- 檢查 JEDEC ID 讀取
- 確認 SPI 模式配置
- 驗證時序參數

## 未來改進

- [ ] 支援更多 Flash 型號
- [ ] 添加 OTP（一次性可編程）支援
- [ ] 實現 Flash 加密
- [ ] 添加壞塊管理
- [ ] 支援 NAND Flash

## 相關模組

- **Wear Leveling** - 磨損平衡，延長 Flash 壽命
- **Partition Manager** - 分區管理，組織 Flash 空間
- **File System** - 文件系統支援（FatFS、LittleFS）

## 許可證

MIT License

**狀態**: ✅ 完成並經過測試
