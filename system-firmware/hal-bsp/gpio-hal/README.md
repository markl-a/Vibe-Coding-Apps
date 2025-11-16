# GPIO HAL (Hardware Abstraction Layer)

> 通用 GPIO 硬體抽象層 - 支援多平台的統一 GPIO 介面

## 📋 專案概述

GPIO HAL 提供統一的 GPIO 操作介面,讓應用程式碼可以在不同的硬體平台之間移植,而無需修改上層邏輯。

## ✨ 特性

- **跨平台支援**: STM32, ESP32, NRF52 等多種 MCU
- **統一 API**: 簡潔一致的介面設計
- **多種模式**: 支援輸入、輸出、中斷等模式
- **低耦合**: 平台相關代碼完全分離
- **易於擴展**: 新增平台支援簡單快速

## 🎯 支援的平台

- ✅ STM32F4xx 系列
- ✅ ESP32 系列
- 🚧 NRF52 系列 (開發中)
- 🚧 RP2040 (計劃中)

## 🚀 快速開始

### 基本使用

```c
#include "gpio_hal.h"

int main(void)
{
    // 配置 LED 引腳為輸出
    gpio_config_t led_config = {
        .port = GPIOA,
        .pin = GPIO_PIN_5,
        .mode = GPIO_MODE_OUTPUT_PP,
        .pull = GPIO_PULL_NONE,
        .speed = GPIO_SPEED_LOW
    };
    gpio_init(&led_config);

    // LED 閃爍
    while (1) {
        gpio_set(GPIOA, GPIO_PIN_5);
        delay_ms(500);
        gpio_reset(GPIOA, GPIO_PIN_5);
        delay_ms(500);
    }

    return 0;
}
```

### 按鈕輸入

```c
// 配置按鈕引腳為輸入
gpio_config_t btn_config = {
    .port = GPIOC,
    .pin = GPIO_PIN_13,
    .mode = GPIO_MODE_INPUT,
    .pull = GPIO_PULL_UP,
    .speed = GPIO_SPEED_LOW
};
gpio_init(&btn_config);

// 讀取按鈕狀態
if (!gpio_read(GPIOC, GPIO_PIN_13)) {
    // 按鈕被按下
    printf("Button pressed!\n");
}
```

### GPIO 中斷

```c
void button_callback(void)
{
    printf("Button interrupt triggered!\n");
}

// 設置中斷回調
gpio_set_interrupt(GPIOC, GPIO_PIN_13, button_callback);
```

## 📚 API 參考

### 資料類型

#### gpio_mode_t
```c
typedef enum {
    GPIO_MODE_INPUT,       // 輸入模式
    GPIO_MODE_OUTPUT_PP,   // 推挽輸出
    GPIO_MODE_OUTPUT_OD,   // 開漏輸出
    GPIO_MODE_AF,          // 替代功能
    GPIO_MODE_ANALOG       // 類比模式
} gpio_mode_t;
```

#### gpio_pull_t
```c
typedef enum {
    GPIO_PULL_NONE,        // 無上下拉
    GPIO_PULL_UP,          // 上拉
    GPIO_PULL_DOWN         // 下拉
} gpio_pull_t;
```

#### gpio_speed_t
```c
typedef enum {
    GPIO_SPEED_LOW,        // 低速
    GPIO_SPEED_MEDIUM,     // 中速
    GPIO_SPEED_HIGH,       // 高速
    GPIO_SPEED_VERY_HIGH   // 超高速
} gpio_speed_t;
```

### 核心函數

| 函數 | 說明 |
|------|------|
| `gpio_init()` | 初始化 GPIO 引腳 |
| `gpio_deinit()` | 解初始化 GPIO 引腳 |
| `gpio_set()` | 設置引腳為高電平 |
| `gpio_reset()` | 設置引腳為低電平 |
| `gpio_toggle()` | 切換引腳狀態 |
| `gpio_read()` | 讀取引腳電平 |
| `gpio_set_interrupt()` | 設置中斷回調 |

## 🏗️ 專案結構

```
gpio-hal/
├── README.md              # 本文件
├── include/
│   └── gpio_hal.h        # HAL 介面定義
├── src/
│   ├── gpio_hal_stm32.c  # STM32 平台實作
│   └── gpio_hal_esp32.c  # ESP32 平台實作
├── examples/
│   ├── led_blink.c       # LED 閃爍範例
│   ├── button_input.c    # 按鈕輸入範例
│   └── interrupt.c       # 中斷範例
├── tests/
│   └── test_gpio.c       # 單元測試
└── Makefile              # 編譯配置
```

## 🔧 編譯和使用

### 編譯

```bash
# 編譯 STM32 版本
make PLATFORM=stm32

# 編譯 ESP32 版本
make PLATFORM=esp32

# 編譯範例
make examples

# 運行測試
make test
```

### 整合到專案

1. 將 `include/gpio_hal.h` 加入 include path
2. 根據目標平台編譯對應的實作文件
3. 在應用代碼中包含標頭檔

```c
#include "gpio_hal.h"
```

## 📊 效能指標

| 操作 | STM32F4 | ESP32 | 說明 |
|------|---------|-------|------|
| gpio_init() | ~10 µs | ~15 µs | 初始化單個引腳 |
| gpio_set() | ~0.5 µs | ~0.8 µs | 設置輸出電平 |
| gpio_read() | ~0.3 µs | ~0.5 µs | 讀取輸入電平 |
| gpio_toggle() | ~0.6 µs | ~1.0 µs | 切換輸出電平 |

## 🧪 測試

專案包含完整的單元測試:

```bash
# 運行所有測試
make test

# 運行特定測試
make test-gpio-init
make test-gpio-io
make test-gpio-interrupt
```

## 📖 移植指南

### 新增平台支援

1. 創建新的實作文件 `gpio_hal_xxx.c`
2. 實作所有 HAL API 函數
3. 更新 Makefile 加入新平台
4. 編寫平台特定的測試案例

範例結構:

```c
// gpio_hal_xxx.c
#include "gpio_hal.h"
#include "platform_specific.h"

int gpio_init(const gpio_config_t *config)
{
    // 平台特定的初始化代碼
    return 0;
}

// 實作其他 API...
```

## 🔬 最佳實踐

### 1. 錯誤處理
```c
int result = gpio_init(&config);
if (result != 0) {
    printf("GPIO init failed: %d\n", result);
    return -1;
}
```

### 2. 資源管理
```c
// 初始化
gpio_init(&config);

// 使用...

// 完成後清理
gpio_deinit(GPIOA, GPIO_PIN_5);
```

### 3. 中斷安全
```c
void isr_callback(void)
{
    // 保持中斷處理程式簡短快速
    flag = 1;  // 設置標誌
}

// 在主迴圈中處理
if (flag) {
    flag = 0;
    handle_event();
}
```

## 🐛 故障排除

### 常見問題

**Q: GPIO 不工作?**
- 檢查時鐘是否已啟用
- 確認引腳配置正確
- 檢查硬體連接

**Q: 中斷沒有觸發?**
- 確認中斷優先級設置
- 檢查 NVIC 配置
- 驗證回調函數是否正確註冊

**Q: 編譯錯誤?**
- 確認平台宏定義正確
- 檢查 include path
- 驗證工具鏈版本

## 📄 授權

本專案採用 MIT 授權 - 詳見 LICENSE 文件

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request!

### 貢獻指南
1. Fork 本專案
2. 創建功能分支
3. 提交變更
4. 推送到分支
5. 創建 Pull Request

## 📞 聯繫方式

- 專案主頁: [GitHub Repository]
- 問題回報: [Issue Tracker]
- 討論區: [Discussions]

---

**最後更新**: 2025-11-16
**版本**: v1.0.0
**狀態**: ✅ 穩定版本
