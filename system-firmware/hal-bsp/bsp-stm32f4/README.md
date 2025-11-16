# BSP-STM32F4 - STM32F4 Board Support Package

> STM32F4 系列板級支援包 - 完整的開發板初始化和驅動支援

## 📋 專案概述

BSP-STM32F4 提供 STM32F4 系列微控制器的完整板級支援,包括時鐘配置、外設初始化、啟動代碼和鏈接腳本。

## ✨ 特性

- **完整初始化**: 系統時鐘、外設、中斷配置
- **多板支援**: STM32F407 Discovery, Nucleo-F446RE 等
- **模組化設計**: 可選擇性啟用外設
- **啟動代碼**: 包含完整的啟動和初始化流程
- **鏈接腳本**: 優化的記憶體配置
- **調試支援**: SWD/JTAG 調試配置

## 🎯 支援的開發板

- ✅ STM32F407 Discovery
- ✅ STM32F429 Discovery
- ✅ Nucleo-F446RE
- ✅ Nucleo-F401RE
- 🚧 自定義板 (可配置)

## 🚀 快速開始

### 基本使用

```c
#include "bsp.h"

int main(void)
{
    // BSP 初始化
    bsp_init();

    // 系統時鐘已配置為 168MHz
    uint32_t sysclk = bsp_get_sysclk();
    printf("System Clock: %lu Hz\n", sysclk);

    // 外設已初始化,可直接使用
    LED_ON(GPIOA, GPIO_PIN_5);

    while (1) {
        bsp_delay_ms(1000);
        LED_TOGGLE(GPIOA, GPIO_PIN_5);
    }

    return 0;
}
```

### 時鐘配置

```c
// 配置系統時鐘為 168MHz
clock_config_t clock = {
    .sysclk_freq = 168000000,
    .hclk_freq = 168000000,
    .pclk1_freq = 42000000,
    .pclk2_freq = 84000000
};
bsp_clock_init(&clock);
```

## 📚 BSP 結構

```
bsp-stm32f4/
├── README.md
├── include/
│   ├── bsp.h              # BSP 主介面
│   ├── bsp_gpio.h         # GPIO 配置
│   ├── bsp_clock.h        # 時鐘配置
│   └── bsp_uart.h         # UART 配置
├── src/
│   ├── bsp.c              # BSP 實作
│   ├── bsp_gpio.c         # GPIO 初始化
│   ├── bsp_clock.c        # 時鐘配置
│   ├── bsp_uart.c         # UART 初始化
│   ├── startup_stm32f407.s # 啟動代碼
│   └── system_stm32f4xx.c  # 系統初始化
├── linker/
│   ├── STM32F407VGTx_FLASH.ld
│   └── STM32F429ZITx_FLASH.ld
└── examples/
    ├── minimal_bsp.c
    └── full_featured.c
```

## 🔧 API 參考

### 核心函數

| 函數 | 說明 |
|------|------|
| `bsp_init()` | BSP 總初始化 |
| `bsp_clock_init()` | 時鐘配置 |
| `bsp_gpio_init()` | GPIO 初始化 |
| `bsp_uart_init()` | UART 初始化 |
| `bsp_spi_init()` | SPI 初始化 |
| `bsp_i2c_init()` | I2C 初始化 |
| `bsp_delay_ms()` | 毫秒延遲 |
| `bsp_delay_us()` | 微秒延遲 |

### 時鐘配置

```c
typedef struct {
    uint32_t sysclk_freq;   // 系統時鐘頻率
    uint32_t hclk_freq;     // AHB 總線時鐘
    uint32_t pclk1_freq;    // APB1 總線時鐘
    uint32_t pclk2_freq;    // APB2 總線時鐘
} clock_config_t;
```

## 📊 時鐘樹配置

### STM32F407 (168MHz 最大)

```
HSE (8MHz)
  └─> /M (÷8) = 1MHz
      └─> ×N (×336) = 336MHz
          └─> /P (÷2) = 168MHz (SYSCLK)
              ├─> AHB (÷1) = 168MHz (HCLK)
              │   ├─> APB1 (÷4) = 42MHz (PCLK1, max 42MHz)
              │   └─> APB2 (÷2) = 84MHz (PCLK2, max 84MHz)
              └─> /Q (÷7) = 48MHz (USB, SDIO)
```

## 🧪 編譯和燒錄

### 使用 Make

```bash
# 編譯專案
make

# 清理
make clean

# 燒錄到開發板
make flash

# 調試
make debug
```

### 使用 CMake

```bash
mkdir build && cd build
cmake ..
make
make flash
```

## 🔬 外設配置

### GPIO 配置

開發板上的 LED 和按鈕已預配置:

- LED: PA5 (STM32F407 Discovery)
- Button: PC13 (User button)

### UART 配置

- USART2: PA2 (TX), PA3 (RX) - 115200 baud
- 用於 printf 重定向

### SPI 配置

- SPI1: PA5 (SCK), PA6 (MISO), PA7 (MOSI)
- SPI2: PB13 (SCK), PB14 (MISO), PB15 (MOSI)

### I2C 配置

- I2C1: PB6 (SCL), PB7 (SDA) - 400kHz

## 📖 記憶體配置

### STM32F407VGTx

- Flash: 1024KB (0x08000000 - 0x080FFFFF)
- SRAM: 192KB (0x20000000 - 0x2002FFFF)
- CCM RAM: 64KB (0x10000000 - 0x1000FFFF)

### 記憶體分區

```
Flash:
├── Vector Table (0x08000000)
├── .text (程式碼)
├── .rodata (唯讀數據)
└── .data (初始化數據)

SRAM:
├── .data (從 Flash 複製)
├── .bss (零初始化)
├── Heap
└── Stack
```

## 🐛 故障排除

**Q: 系統無法啟動?**
- 檢查 HSE 晶振是否正確
- 驗證 BOOT0 引腳狀態
- 確認鏈接腳本正確

**Q: printf 無輸出?**
- 確認 UART 已初始化
- 檢查 `_write()` 函數是否實作
- 驗證串口參數 (115200, 8N1)

**Q: 時鐘頻率不正確?**
- 檢查 HSE_VALUE 定義
- 驗證 PLL 配置參數
- 使用 MCO 引腳輸出時鐘測量

## 📄 授權

MIT License

---

**版本**: v1.0.0
**狀態**: ✅ 生產就緒
**支援**: STM32F4 全系列
