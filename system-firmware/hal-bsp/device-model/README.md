# Device Model - 統一設備模型

> 通用設備抽象框架 - 提供統一的設備訪問介面

## 📋 專案概述

Device Model 提供類似 Linux 的統一設備模型,讓所有硬體設備(GPIO、UART、SPI、I2C 等)都可以通過統一的 open/close/read/write/ioctl 介面訪問。

## ✨ 特性

- **統一介面**: 所有設備使用相同的操作介面
- **設備註冊**: 動態註冊和管理設備
- **設備樹**: 支援設備樹描述硬體配置
- **熱插拔**: 支援設備動態添加/移除
- **字符/塊設備**: 支援多種設備類型
- **驅動框架**: 簡化驅動開發

## 🚀 快速開始

### 設備操作

```c
#include "device_model.h"

int main(void)
{
    // 打開設備
    device_t *led = device_find("led0");
    device_open(led);

    // 寫入設備 (開啟 LED)
    uint8_t value = 1;
    device_write(led, &value, 1);

    // 使用 ioctl 控制
    device_ioctl(led, LED_IOCTL_TOGGLE, NULL);

    // 關閉設備
    device_close(led);

    return 0;
}
```

### 註冊新設備

```c
// 定義設備操作
static int led_open(device_t *dev) { return 0; }
static int led_close(device_t *dev) { return 0; }
static int led_write(device_t *dev, const void *buf, size_t size)
{
    // LED 控制邏輯
    return size;
}

// 設備操作表
static const device_ops_t led_ops = {
    .open = led_open,
    .close = led_close,
    .write = led_write
};

// 註冊設備
device_t led_device = {
    .name = "led0",
    .type = DEVICE_TYPE_CHAR,
    .ops = &led_ops
};

device_register(&led_device);
```

## 📚 核心組件

### 1. 設備結構
```c
typedef struct device {
    const char *name;
    uint8_t type;
    void *private_data;
    const device_ops_t *ops;
    struct device *next;
} device_t;
```

### 2. 設備操作
```c
typedef struct device_ops {
    int (*open)(device_t *dev);
    int (*close)(device_t *dev);
    int (*read)(device_t *dev, void *buf, size_t size);
    int (*write)(device_t *dev, const void *buf, size_t size);
    int (*ioctl)(device_t *dev, uint32_t cmd, void *arg);
} device_ops_t;
```

## 🎯 設備類型

- **字符設備**: UART, GPIO, ADC 等
- **塊設備**: Flash, SD卡, EEPROM 等
- **網路設備**: Ethernet, WiFi, BLE 等
- **特殊設備**: Timer, Watchdog, RTC 等

## 📖 使用範例

### LED 設備驅動

請參考 `examples/led_driver.c`

### UART 設備驅動

請參考 `examples/uart_driver.c`

### 感測器設備驅動

請參考 `examples/sensor_driver.c`

---

**版本**: v1.0.0
**狀態**: ✅ 穩定
