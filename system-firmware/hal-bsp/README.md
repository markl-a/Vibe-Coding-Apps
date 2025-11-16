# 🔧 HAL & BSP 開發
> 硬體抽象層 (HAL) 與板級支援包 (BSP) 開發

⚠️ **驗證階段專案** - 此領域目前處於研究與開發階段

## 📋 專案概述

硬體抽象層 (Hardware Abstraction Layer, HAL) 和板級支援包 (Board Support Package, BSP) 是嵌入式系統開發的基礎,提供硬體和軟體之間的抽象介面,使上層應用能夠獨立於具體硬體平台。

## 🎯 核心概念

### 1. HAL (Hardware Abstraction Layer)
- **定義**
  - 硬體和軟體之間的介面層
  - 統一的 API 抽象
  - 隱藏硬體實作細節
  - 提高代碼可移植性

- **常見 HAL 類型**
  - GPIO HAL
  - UART HAL
  - SPI/I2C HAL
  - Timer HAL
  - ADC/DAC HAL
  - PWM HAL

### 2. BSP (Board Support Package)
- **組成部分**
  - 啟動代碼 (Startup Code)
  - 時鐘配置
  - 記憶體配置
  - 外設初始化
  - 驅動程式
  - 鏈接腳本

- **BSP 層次**
  - Bootloader BSP
  - RTOS BSP
  - 驅動 BSP
  - 應用 BSP

### 3. 設備抽象模型
- **統一設備介面**
  - 設備註冊
  - 設備打開/關閉
  - 讀寫操作
  - 控制命令 (ioctl)

- **設備樹 (Device Tree)**
  - DTS/DTB 格式
  - 硬體描述
  - 動態配置
  - Linux/Zephyr 支援

## 🛠️ 技術棧

### 開發語言
- **C** - HAL/BSP 主要語言
- **Assembly** - 啟動代碼
- **DTS** - 設備樹描述
- **Python** - 配置生成工具

### 開發工具
- **STM32CubeMX** - STM32 HAL 生成
- **MCUXpresso** - NXP BSP 工具
- **Zephyr West** - Zephyr BSP 管理
- **Device Tree Compiler** - DTS 編譯

## 🚀 快速開始

### 1. 簡單 GPIO HAL 設計

```c
// gpio_hal.h - GPIO 硬體抽象層介面
#ifndef GPIO_HAL_H
#define GPIO_HAL_H

#include <stdint.h>
#include <stdbool.h>

// GPIO 模式
typedef enum {
    GPIO_MODE_INPUT,
    GPIO_MODE_OUTPUT_PP,  // Push-Pull
    GPIO_MODE_OUTPUT_OD,  // Open-Drain
    GPIO_MODE_AF,         // Alternate Function
    GPIO_MODE_ANALOG
} gpio_mode_t;

// GPIO 上拉/下拉
typedef enum {
    GPIO_PULL_NONE,
    GPIO_PULL_UP,
    GPIO_PULL_DOWN
} gpio_pull_t;

// GPIO 速度
typedef enum {
    GPIO_SPEED_LOW,
    GPIO_SPEED_MEDIUM,
    GPIO_SPEED_HIGH,
    GPIO_SPEED_VERY_HIGH
} gpio_speed_t;

// GPIO 配置結構
typedef struct {
    void *port;           // GPIO 端口
    uint16_t pin;         // GPIO 引腳
    gpio_mode_t mode;     // 模式
    gpio_pull_t pull;     // 上拉/下拉
    gpio_speed_t speed;   // 速度
    uint8_t alternate;    // 替代功能
} gpio_config_t;

// HAL API
int gpio_init(const gpio_config_t *config);
int gpio_deinit(void *port, uint16_t pin);
void gpio_set(void *port, uint16_t pin);
void gpio_reset(void *port, uint16_t pin);
void gpio_toggle(void *port, uint16_t pin);
bool gpio_read(void *port, uint16_t pin);
int gpio_set_interrupt(void *port, uint16_t pin, void (*callback)(void));

#endif // GPIO_HAL_H
```

```c
// gpio_hal_stm32.c - STM32 平台實作
#include "gpio_hal.h"
#include "stm32f4xx_hal.h"

// 轉換 HAL 模式到 STM32 模式
static uint32_t convert_mode(gpio_mode_t mode)
{
    switch (mode) {
        case GPIO_MODE_INPUT:      return GPIO_MODE_INPUT;
        case GPIO_MODE_OUTPUT_PP:  return GPIO_MODE_OUTPUT_PP;
        case GPIO_MODE_OUTPUT_OD:  return GPIO_MODE_OUTPUT_OD;
        case GPIO_MODE_AF:         return GPIO_MODE_AF_PP;
        case GPIO_MODE_ANALOG:     return GPIO_MODE_ANALOG;
        default:                   return GPIO_MODE_INPUT;
    }
}

// 初始化 GPIO
int gpio_init(const gpio_config_t *config)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    // 啟用時鐘
    if (config->port == GPIOA) {
        __HAL_RCC_GPIOA_CLK_ENABLE();
    } else if (config->port == GPIOB) {
        __HAL_RCC_GPIOB_CLK_ENABLE();
    }
    // ... 其他端口

    // 配置 GPIO
    GPIO_InitStruct.Pin = config->pin;
    GPIO_InitStruct.Mode = convert_mode(config->mode);
    GPIO_InitStruct.Pull = config->pull;
    GPIO_InitStruct.Speed = config->speed;
    GPIO_InitStruct.Alternate = config->alternate;

    HAL_GPIO_Init((GPIO_TypeDef *)config->port, &GPIO_InitStruct);

    return 0;
}

// 設置引腳
void gpio_set(void *port, uint16_t pin)
{
    HAL_GPIO_WritePin((GPIO_TypeDef *)port, pin, GPIO_PIN_SET);
}

// 重置引腳
void gpio_reset(void *port, uint16_t pin)
{
    HAL_GPIO_WritePin((GPIO_TypeDef *)port, pin, GPIO_PIN_RESET);
}

// 切換引腳
void gpio_toggle(void *port, uint16_t pin)
{
    HAL_GPIO_TogglePin((GPIO_TypeDef *)port, pin);
}

// 讀取引腳
bool gpio_read(void *port, uint16_t pin)
{
    return HAL_GPIO_ReadPin((GPIO_TypeDef *)port, pin) == GPIO_PIN_SET;
}
```

### 2. UART HAL 設計

```c
// uart_hal.h - UART 硬體抽象層
#ifndef UART_HAL_H
#define UART_HAL_H

#include <stdint.h>
#include <stddef.h>

// UART 配置
typedef struct {
    uint32_t baudrate;
    uint8_t word_length;  // 8, 9
    uint8_t stop_bits;    // 1, 2
    uint8_t parity;       // 0=None, 1=Even, 2=Odd
    uint8_t flow_control; // 0=None, 1=RTS/CTS
} uart_config_t;

// UART 句柄
typedef void* uart_handle_t;

// HAL API
uart_handle_t uart_init(uint8_t uart_num, const uart_config_t *config);
int uart_deinit(uart_handle_t handle);
int uart_send(uart_handle_t handle, const uint8_t *data, size_t len);
int uart_receive(uart_handle_t handle, uint8_t *data, size_t len, uint32_t timeout);
int uart_send_it(uart_handle_t handle, const uint8_t *data, size_t len);
int uart_receive_it(uart_handle_t handle, uint8_t *data, size_t len);
int uart_set_callback(uart_handle_t handle,
                     void (*tx_callback)(void),
                     void (*rx_callback)(void));

#endif // UART_HAL_H
```

```c
// uart_hal_stm32.c
#include "uart_hal.h"
#include "stm32f4xx_hal.h"

typedef struct {
    UART_HandleTypeDef huart;
    void (*tx_callback)(void);
    void (*rx_callback)(void);
} uart_context_t;

static uart_context_t uart_contexts[6] = {0};  // STM32F4 有 6 個 USART

uart_handle_t uart_init(uint8_t uart_num, const uart_config_t *config)
{
    if (uart_num >= 6) {
        return NULL;
    }

    uart_context_t *ctx = &uart_contexts[uart_num];

    // 配置 UART
    switch (uart_num) {
        case 0:
            ctx->huart.Instance = USART1;
            __HAL_RCC_USART1_CLK_ENABLE();
            break;
        case 1:
            ctx->huart.Instance = USART2;
            __HAL_RCC_USART2_CLK_ENABLE();
            break;
        // ... 其他 UART
    }

    ctx->huart.Init.BaudRate = config->baudrate;
    ctx->huart.Init.WordLength = (config->word_length == 9) ?
                                 UART_WORDLENGTH_9B : UART_WORDLENGTH_8B;
    ctx->huart.Init.StopBits = (config->stop_bits == 2) ?
                               UART_STOPBITS_2 : UART_STOPBITS_1;

    switch (config->parity) {
        case 1:  ctx->huart.Init.Parity = UART_PARITY_EVEN; break;
        case 2:  ctx->huart.Init.Parity = UART_PARITY_ODD; break;
        default: ctx->huart.Init.Parity = UART_PARITY_NONE; break;
    }

    ctx->huart.Init.Mode = UART_MODE_TX_RX;
    ctx->huart.Init.HwFlowCtl = (config->flow_control) ?
                                UART_HWCONTROL_RTS_CTS : UART_HWCONTROL_NONE;

    if (HAL_UART_Init(&ctx->huart) != HAL_OK) {
        return NULL;
    }

    return (uart_handle_t)ctx;
}

int uart_send(uart_handle_t handle, const uint8_t *data, size_t len)
{
    uart_context_t *ctx = (uart_context_t *)handle;
    HAL_StatusTypeDef status;

    status = HAL_UART_Transmit(&ctx->huart, (uint8_t *)data, len, HAL_MAX_DELAY);

    return (status == HAL_OK) ? len : -1;
}

int uart_receive(uart_handle_t handle, uint8_t *data, size_t len, uint32_t timeout)
{
    uart_context_t *ctx = (uart_context_t *)handle;
    HAL_StatusTypeDef status;

    status = HAL_UART_Receive(&ctx->huart, data, len, timeout);

    return (status == HAL_OK) ? len : -1;
}
```

### 3. BSP 初始化框架

```c
// bsp.h - 板級支援包介面
#ifndef BSP_H
#define BSP_H

#include <stdint.h>

// 時鐘配置
typedef struct {
    uint32_t sysclk_freq;   // 系統時鐘頻率
    uint32_t hclk_freq;     // AHB 時鐘
    uint32_t pclk1_freq;    // APB1 時鐘
    uint32_t pclk2_freq;    // APB2 時鐘
} clock_config_t;

// BSP API
int bsp_init(void);
int bsp_clock_init(const clock_config_t *config);
int bsp_gpio_init(void);
int bsp_uart_init(void);
int bsp_spi_init(void);
int bsp_i2c_init(void);
uint32_t bsp_get_sysclk(void);
void bsp_delay_ms(uint32_t ms);
void bsp_delay_us(uint32_t us);

#endif // BSP_H
```

```c
// bsp.c - BSP 實作
#include "bsp.h"
#include "gpio_hal.h"
#include "uart_hal.h"
#include "stm32f4xx_hal.h"

static clock_config_t current_clock = {0};

// BSP 總初始化
int bsp_init(void)
{
    // 1. HAL 庫初始化
    HAL_Init();

    // 2. 配置系統時鐘
    clock_config_t clock = {
        .sysclk_freq = 168000000,  // 168 MHz
        .hclk_freq = 168000000,
        .pclk1_freq = 42000000,
        .pclk2_freq = 84000000
    };
    bsp_clock_init(&clock);

    // 3. 初始化外設
    bsp_gpio_init();
    bsp_uart_init();
    bsp_spi_init();
    bsp_i2c_init();

    return 0;
}

// 時鐘配置
int bsp_clock_init(const clock_config_t *config)
{
    RCC_OscInitTypeDef RCC_OscInitStruct = {0};
    RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

    // 配置 HSE 和 PLL
    RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;
    RCC_OscInitStruct.HSEState = RCC_HSE_ON;
    RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
    RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
    RCC_OscInitStruct.PLL.PLLM = 8;
    RCC_OscInitStruct.PLL.PLLN = 336;
    RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV2;
    RCC_OscInitStruct.PLL.PLLQ = 7;

    if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK) {
        return -1;
    }

    // 配置系統時鐘
    RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK | RCC_CLOCKTYPE_SYSCLK |
                                  RCC_CLOCKTYPE_PCLK1 | RCC_CLOCKTYPE_PCLK2;
    RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
    RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
    RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV4;
    RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV2;

    if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_5) != HAL_OK) {
        return -1;
    }

    current_clock = *config;
    return 0;
}

// GPIO 初始化
int bsp_gpio_init(void)
{
    // LED 引腳配置
    gpio_config_t led_config = {
        .port = GPIOA,
        .pin = GPIO_PIN_5,
        .mode = GPIO_MODE_OUTPUT_PP,
        .pull = GPIO_PULL_NONE,
        .speed = GPIO_SPEED_LOW
    };
    gpio_init(&led_config);

    // 按鈕引腳配置
    gpio_config_t btn_config = {
        .port = GPIOC,
        .pin = GPIO_PIN_13,
        .mode = GPIO_MODE_INPUT,
        .pull = GPIO_PULL_UP,
        .speed = GPIO_SPEED_LOW
    };
    gpio_init(&btn_config);

    return 0;
}

// UART 初始化
int bsp_uart_init(void)
{
    uart_config_t uart_config = {
        .baudrate = 115200,
        .word_length = 8,
        .stop_bits = 1,
        .parity = 0,
        .flow_control = 0
    };

    uart_handle_t uart = uart_init(1, &uart_config);  // USART2
    return (uart != NULL) ? 0 : -1;
}

uint32_t bsp_get_sysclk(void)
{
    return current_clock.sysclk_freq;
}

void bsp_delay_ms(uint32_t ms)
{
    HAL_Delay(ms);
}
```

### 4. 設備樹範例 (Zephyr)

```dts
// custom_board.dts - 自定義板子設備樹
/dts-v1/;

#include <st/f4/stm32f407Xg.dtsi>
#include <st/f4/stm32f407v(e-g)tx-pinctrl.dtsi>

/ {
    model = "Custom STM32F407 Board";
    compatible = "st,stm32f407";

    chosen {
        zephyr,console = &usart2;
        zephyr,shell-uart = &usart2;
        zephyr,sram = &sram0;
        zephyr,flash = &flash0;
    };

    leds {
        compatible = "gpio-leds";
        led0: led_0 {
            gpios = <&gpioa 5 GPIO_ACTIVE_HIGH>;
            label = "User LED";
        };
    };

    buttons {
        compatible = "gpio-keys";
        button0: button_0 {
            gpios = <&gpioc 13 (GPIO_PULL_UP | GPIO_ACTIVE_LOW)>;
            label = "User Button";
        };
    };

    aliases {
        led0 = &led0;
        sw0 = &button0;
    };
};

&usart2 {
    pinctrl-0 = <&usart2_tx_pa2 &usart2_rx_pa3>;
    pinctrl-names = "default";
    current-speed = <115200>;
    status = "okay";
};

&spi1 {
    pinctrl-0 = <&spi1_sck_pa5 &spi1_miso_pa6 &spi1_mosi_pa7>;
    pinctrl-names = "default";
    cs-gpios = <&gpioa 4 GPIO_ACTIVE_LOW>;
    status = "okay";
};

&i2c1 {
    pinctrl-0 = <&i2c1_scl_pb6 &i2c1_sda_pb7>;
    pinctrl-names = "default";
    clock-frequency = <I2C_BITRATE_FAST>;
    status = "okay";

    sensor@48 {
        compatible = "ti,tmp102";
        reg = <0x48>;
    };
};
```

## 📚 開發範例

### 範例 1: 統一設備模型

```c
// device_model.h - 統一設備模型
#ifndef DEVICE_MODEL_H
#define DEVICE_MODEL_H

#include <stdint.h>
#include <stddef.h>

// 設備操作介面
typedef struct device_ops {
    int (*open)(void *device);
    int (*close)(void *device);
    int (*read)(void *device, void *buffer, size_t size);
    int (*write)(void *device, const void *buffer, size_t size);
    int (*ioctl)(void *device, uint32_t cmd, void *arg);
} device_ops_t;

// 設備結構
typedef struct device {
    const char *name;
    uint8_t type;
    void *private_data;
    const device_ops_t *ops;
    struct device *next;
} device_t;

// 設備管理 API
int device_register(device_t *device);
int device_unregister(const char *name);
device_t *device_find(const char *name);
int device_open(const char *name);
int device_close(const char *name);
int device_read(const char *name, void *buffer, size_t size);
int device_write(const char *name, const void *buffer, size_t size);
int device_ioctl(const char *name, uint32_t cmd, void *arg);

#endif // DEVICE_MODEL_H
```

```c
// led_device.c - LED 設備實作
#include "device_model.h"
#include "gpio_hal.h"

typedef struct {
    void *port;
    uint16_t pin;
    bool state;
} led_private_t;

static int led_open(void *device)
{
    return 0;
}

static int led_close(void *device)
{
    return 0;
}

static int led_write(void *device, const void *buffer, size_t size)
{
    device_t *dev = (device_t *)device;
    led_private_t *priv = (led_private_t *)dev->private_data;
    const uint8_t *data = (const uint8_t *)buffer;

    if (size > 0) {
        if (data[0]) {
            gpio_set(priv->port, priv->pin);
            priv->state = true;
        } else {
            gpio_reset(priv->port, priv->pin);
            priv->state = false;
        }
    }

    return size;
}

#define LED_IOCTL_TOGGLE  0x01
#define LED_IOCTL_GET_STATE  0x02

static int led_ioctl(void *device, uint32_t cmd, void *arg)
{
    device_t *dev = (device_t *)device;
    led_private_t *priv = (led_private_t *)dev->private_data;

    switch (cmd) {
        case LED_IOCTL_TOGGLE:
            gpio_toggle(priv->port, priv->pin);
            priv->state = !priv->state;
            break;

        case LED_IOCTL_GET_STATE:
            *(bool *)arg = priv->state;
            break;

        default:
            return -1;
    }

    return 0;
}

static const device_ops_t led_ops = {
    .open = led_open,
    .close = led_close,
    .read = NULL,
    .write = led_write,
    .ioctl = led_ioctl
};

static led_private_t led_priv = {
    .port = GPIOA,
    .pin = GPIO_PIN_5,
    .state = false
};

static device_t led_device = {
    .name = "led0",
    .type = 0,
    .private_data = &led_priv,
    .ops = &led_ops
};

void led_device_init(void)
{
    device_register(&led_device);
}
```

## 🤖 AI 輔助開發策略

### 1. HAL 設計
```
"設計一個通用的 SPI HAL 介面"
"如何實作平台無關的 ADC 抽象層?"
"HAL 層的錯誤處理最佳實踐"
```

### 2. BSP 開發
```
"生成 STM32F4 的 BSP 初始化代碼"
"如何移植 BSP 到新的硬體平台?"
"設備樹如何描述自定義硬體?"
```

### 3. 代碼生成
```
"根據引腳配置生成 GPIO 初始化代碼"
"自動生成設備驅動註冊代碼"
"從設備樹生成 C 結構體"
```

## 📊 專案結構

```
hal-bsp/
├── README.md
├── hal/
│   ├── gpio/
│   ├── uart/
│   ├── spi/
│   ├── i2c/
│   ├── adc/
│   └── pwm/
├── bsp/
│   ├── stm32f4/
│   ├── esp32/
│   ├── nrf52/
│   └── custom-board/
├── device-model/
│   ├── core/
│   └── drivers/
└── docs/
    ├── hal-design.md
    ├── bsp-porting.md
    └── device-tree.md
```

## 🧪 開發路線圖

### Phase 1: HAL 基礎 ✅
- [x] GPIO HAL
- [x] UART HAL
- [x] 基本 BSP
- [x] 時鐘配置

### Phase 2: 完整 HAL
- [ ] SPI/I2C HAL
- [ ] ADC/DAC HAL
- [ ] Timer/PWM HAL
- [ ] DMA HAL

### Phase 3: 設備模型
- [ ] 統一設備介面
- [ ] 設備註冊機制
- [ ] 驅動框架
- [ ] 熱插拔支援

### Phase 4: 進階功能
- [ ] 設備樹支援
- [ ] 電源管理
- [ ] 時鐘管理
- [ ] 多平台移植

## 🔬 學習資源

### 書籍推薦
1. **Embedded Systems Architecture** - Daniele Lacamera
2. **Making Embedded Systems** - Elecia White

### 線上資源
- [STM32 HAL Documentation](https://www.st.com/en/embedded-software/stm32cube-mcu-mpu-packages.html)
- [Zephyr Device Tree Guide](https://docs.zephyrproject.org/latest/build/dts/index.html)
- [Linux Device Tree](https://www.devicetree.org/)

## ⚙️ 開發最佳實踐

### 1. HAL 設計原則
- 介面簡潔明確
- 平台無關
- 性能開銷最小
- 完整錯誤處理

### 2. BSP 移植步驟
1. 時鐘配置
2. 記憶體映射
3. 啟動代碼
4. 外設初始化
5. 中斷向量表
6. 鏈接腳本

### 3. 設備樹使用
- 硬體描述分離
- 動態配置
- 可維護性高
- 標準化描述

## ⚠️ 注意事項

### 設計考慮
- **抽象層次**: 適當的抽象,避免過度設計
- **性能**: HAL 不應成為性能瓶頸
- **可移植性**: 便於移植到不同平台
- **向後兼容**: API 穩定性

## 📄 授權

範例代碼採用 MIT 授權

---

**最後更新**: 2025-11-16
**狀態**: 🚧 研究與開發中
**維護者**: AI-Assisted Development Team
