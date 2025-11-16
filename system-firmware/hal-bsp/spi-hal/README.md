# SPI HAL (Hardware Abstraction Layer)

> 通用 SPI 硬體抽象層 - 支援多平台的統一 SPI 通訊介面

## 📋 專案概述

SPI HAL 提供統一的 SPI (Serial Peripheral Interface) 通訊介面,支援主/從模式、多種時鐘配置、DMA 傳輸等功能。

## ✨ 特性

- **主/從模式**: 支援 SPI 主設備和從設備模式
- **靈活配置**: 時鐘極性、相位、速度可調
- **多種傳輸**: 阻塞、中斷、DMA 模式
- **片選管理**: 靈活的 CS 引腳控制
- **跨平台**: STM32, ESP32 等多平台支援

## 🚀 快速開始

```c
#include "spi_hal.h"

// 配置 SPI
spi_config_t spi_config = {
    .mode = SPI_MODE_MASTER,
    .clock_polarity = SPI_CPOL_LOW,
    .clock_phase = SPI_CPHA_1EDGE,
    .baudrate_prescaler = SPI_BAUDRATE_PRESCALER_16,
    .data_size = SPI_DATASIZE_8BIT,
    .first_bit = SPI_FIRSTBIT_MSB
};

spi_handle_t spi = spi_init(1, &spi_config);

// 發送/接收數據
uint8_t tx_data[] = {0x01, 0x02, 0x03};
uint8_t rx_data[3];
spi_transfer(spi, tx_data, rx_data, 3);
```

## 📚 API 參考

- `spi_init()` - 初始化 SPI
- `spi_deinit()` - 解初始化
- `spi_transfer()` - 雙向傳輸
- `spi_transmit()` - 僅發送
- `spi_receive()` - 僅接收
- `spi_transfer_dma()` - DMA 傳輸

## 🎯 支援的平台

- ✅ STM32F4xx
- ✅ ESP32
- 🚧 NRF52

---

**版本**: v1.0.0
**狀態**: ✅ 穩定
