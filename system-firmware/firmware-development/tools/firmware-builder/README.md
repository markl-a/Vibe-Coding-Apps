# 🔨 Firmware Builder - 韌體構建工具

## 概述

自動化韌體構建工具，支援多平台、多配置的韌體編譯和打包。

## 功能特點

- ✅ 自動化編譯流程
- ✅ 多平台支援 (STM32, ESP32, nRF52等)
- ✅ 版本管理
- ✅ 簽名和加密
- ✅ OTA 包生成
- ✅ CI/CD 整合

## 使用方法

```bash
# 基本編譯
./build_firmware.py --target stm32f407 --config release

# 生成 OTA 包
./build_firmware.py --target esp32 --ota

# 簽名韌體
./build_firmware.py --target stm32 --sign --key private_key.pem

# 批量構建
./build_firmware.py --batch --targets stm32,esp32,nrf52
```

## 配置文件

```yaml
# firmware_config.yaml
project:
  name: MyFirmware
  version: 1.2.3

targets:
  stm32f407:
    toolchain: arm-none-eabi
    mcu: STM32F407VGT6
    flash_size: 1024K
    ram_size: 192K

  esp32:
    toolchain: xtensa-esp32
    chip: ESP32-WROOM-32
    flash_size: 4MB
    partition_table: partitions.csv

build:
  optimization: -O2
  defines:
    - USE_HAL_DRIVER
    - DEBUG_ENABLED
  includes:
    - ./include
    - ./lib
```

## 輸出文件

```
build/
├── stm32f407/
│   ├── firmware.elf
│   ├── firmware.bin
│   ├── firmware.hex
│   └── firmware_signed.bin
├── esp32/
│   ├── firmware.bin
│   ├── firmware_ota.bin
│   └── bootloader.bin
└── manifest.json
```

**狀態**: ✅ 可用
