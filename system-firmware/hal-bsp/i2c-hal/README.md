# I2C HAL (Hardware Abstraction Layer)

> 通用 I2C 硬體抽象層 - 支援多平台的統一 I2C 通訊介面

## 📋 專案概述

I2C HAL 提供統一的 I2C (Inter-Integrated Circuit) 通訊介面,支援標準速度、快速模式、從設備地址掃描等功能。

## ✨ 特性

- **多速度模式**: 標準模式 (100kHz)、快速模式 (400kHz)、高速模式 (3.4MHz)
- **主/從模式**: 支援主設備和從設備
- **7/10位元地址**: 支援 7 位和 10 位從設備地址
- **記憶體操作**: 專用的記憶體讀寫函數
- **設備掃描**: 自動掃描總線上的設備
- **錯誤處理**: 完整的 ACK/NACK 處理

## 🚀 快速開始

```c
#include "i2c_hal.h"

// 配置 I2C
i2c_config_t i2c_config = {
    .mode = I2C_MODE_MASTER,
    .clock_speed = 400000,  // 400kHz
    .address_mode = I2C_ADDR_7BIT
};

i2c_handle_t i2c = i2c_init(1, &i2c_config);

// 讀取從設備
uint8_t slave_addr = 0x50;
uint8_t data[16];
i2c_master_read(i2c, slave_addr, data, sizeof(data));

// 寫入從設備
uint8_t write_data[] = {0x01, 0x02, 0x03};
i2c_master_write(i2c, slave_addr, write_data, sizeof(write_data));
```

## 📚 API 參考

- `i2c_init()` - 初始化 I2C
- `i2c_master_read()` - 主設備讀取
- `i2c_master_write()` - 主設備寫入
- `i2c_mem_read()` - 記憶體讀取
- `i2c_mem_write()` - 記憶體寫入
- `i2c_scan()` - 掃描 I2C 總線

## 🎯 支援的平台

- ✅ STM32F4xx
- ✅ ESP32
- 🚧 NRF52

---

**版本**: v1.0.0
**狀態**: ✅ 穩定
