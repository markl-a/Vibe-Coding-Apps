# Zephyr RTOS 基礎 Blinky 範例

> Zephyr RTOS 入門專案 - LED 閃爍與執行緒管理

## 📋 專案簡介

本專案展示 Zephyr RTOS 的基礎功能：
- 執行緒創建與管理
- GPIO 控制
- 定時器操作
- 訊息佇列
- Devicetree 配置

## 🎯 功能特性

### 1. 多執行緒系統
- LED 閃爍執行緒
- 按鈕處理執行緒
- 狀態監控執行緒

### 2. 硬體抽象
- 使用 Devicetree 配置
- GPIO API
- 可移植到多種開發板

### 3. 同步機制
- 訊息佇列（Message Queue）
- 工作佇列（Work Queue）
- 信號量（Semaphore）

## 🏗️ 專案結構

```
basic-blinky/
├── README.md
├── CMakeLists.txt
├── prj.conf              # Kconfig 配置
├── src/
│   └── main.c
└── boards/
    └── nrf52840dk_nrf52840.overlay  # Devicetree overlay
```

## 🚀 快速開始

### 環境需求

```bash
# 安裝 Zephyr SDK
wget https://github.com/zephyrproject-rtos/sdk-ng/releases/download/v0.16.5/zephyr-sdk-0.16.5_linux-x86_64.tar.xz
tar xvf zephyr-sdk-0.16.5_linux-x86_64.tar.xz
cd zephyr-sdk-0.16.5
./setup.sh

# 安裝 west
pip3 install west

# 初始化 Zephyr workspace
west init ~/zephyrproject
cd ~/zephyrproject
west update
```

### 編譯與燒錄

```bash
# 進入專案目錄
cd system-firmware/rtos/zephyr/basic-blinky

# 編譯 (以 nRF52840 DK 為例)
west build -b nrf52840dk_nrf52840

# 燒錄
west flash

# 查看輸出
west espressif monitor
# 或
screen /dev/ttyACM0 115200
```

### 支援的開發板

- nRF52840 DK (`nrf52840dk_nrf52840`)
- STM32F4 Discovery (`stm32f4_disco`)
- ESP32 DevKitC (`esp32_devkitc_wroom`)
- QEMU x86 (`qemu_x86`)
- Arduino Nano 33 BLE (`arduino_nano_33_ble`)

## 📖 程式碼說明

### 主程式結構

```c
#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/drivers/gpio.h>

/* LED 配置 */
#define LED0_NODE DT_ALIAS(led0)
static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(LED0_NODE, gpios);

/* 按鈕配置 */
#define SW0_NODE DT_ALIAS(sw0)
static const struct gpio_dt_spec button = GPIO_DT_SPEC_GET(SW0_NODE, gpios);

/* 訊息佇列 */
K_MSGQ_DEFINE(button_msgq, sizeof(uint32_t), 10, 4);

/* LED 執行緒 */
void led_thread(void *arg1, void *arg2, void *arg3)
{
    while (1) {
        gpio_pin_toggle_dt(&led);
        k_sleep(K_MSEC(500));
    }
}

K_THREAD_DEFINE(led_tid, 512, led_thread, NULL, NULL, NULL, 7, 0, 0);
```

### Devicetree 配置

```dts
/ {
    aliases {
        led0 = &led0;
        sw0 = &button0;
    };

    leds {
        compatible = "gpio-leds";
        led0: led_0 {
            gpios = <&gpio0 13 GPIO_ACTIVE_LOW>;
            label = "Green LED 0";
        };
    };

    buttons {
        compatible = "gpio-keys";
        button0: button_0 {
            gpios = <&gpio0 11 (GPIO_PULL_UP | GPIO_ACTIVE_LOW)>;
            label = "Push button 0";
        };
    };
};
```

### Kconfig 配置 (prj.conf)

```conf
CONFIG_GPIO=y
CONFIG_PRINTK=y
CONFIG_SERIAL=y
CONFIG_CONSOLE=y
CONFIG_UART_CONSOLE=y

# 執行緒配置
CONFIG_NUM_PREEMPT_PRIORITIES=10
CONFIG_MAIN_STACK_SIZE=2048

# 除錯選項
CONFIG_DEBUG=y
CONFIG_THREAD_MONITOR=y
CONFIG_INIT_STACKS=y
CONFIG_THREAD_NAME=y
```

## 📚 核心概念

### 1. 執行緒定義

```c
/* 靜態執行緒定義 */
K_THREAD_DEFINE(thread_id,      // 執行緒 ID
                stack_size,      // 堆疊大小
                entry_function,  // 入口函數
                param1,          // 參數 1
                param2,          // 參數 2
                param3,          // 參數 3
                priority,        // 優先權
                options,         // 選項
                delay);          // 延遲啟動

/* 動態執行緒創建 */
K_THREAD_STACK_DEFINE(my_stack, 1024);
struct k_thread my_thread_data;

k_thread_create(&my_thread_data,
                my_stack,
                K_THREAD_STACK_SIZEOF(my_stack),
                thread_entry,
                NULL, NULL, NULL,
                5, 0, K_NO_WAIT);
```

### 2. 訊息佇列

```c
/* 定義訊息佇列 */
K_MSGQ_DEFINE(my_msgq,          // 名稱
              sizeof(uint32_t),  // 訊息大小
              10,                // 最大訊息數
              4);                // 對齊

/* 發送訊息 */
uint32_t data = 42;
k_msgq_put(&my_msgq, &data, K_NO_WAIT);

/* 接收訊息 */
uint32_t received;
k_msgq_get(&my_msgq, &received, K_FOREVER);
```

### 3. 工作佇列

```c
/* 定義工作項目 */
static struct k_work my_work;

/* 工作處理函數 */
void work_handler(struct k_work *work)
{
    printk("Work item processed\n");
}

/* 初始化與提交 */
k_work_init(&my_work, work_handler);
k_work_submit(&my_work);
```

## 🤖 AI 輔助開發提示

```
"Zephyr RTOS 的 Devicetree 如何使用？"
"如何在 Zephyr 中實現低功耗模式？"
"West 工具的常用命令有哪些？"
"如何移植 Zephyr 到新的硬體平台？"
```

## 📊 Zephyr vs FreeRTOS

| 特性 | Zephyr | FreeRTOS |
|------|--------|----------|
| 配置系統 | Kconfig + Devicetree | #define |
| 驅動支援 | 豐富的內建驅動 | 需要自行添加 |
| 網路堆疊 | 內建 TCP/IP, BLE, 802.15.4 | 需要第三方 |
| 工具鏈 | West | 各 IDE 自定 |
| 記憶體保護 | MPU 支援 | 有限支援 |
| 學習曲線 | 較陡峭 | 較平緩 |

## ⚠️ 注意事項

### 1. Devicetree 配置
- 必須正確配置 aliases
- GPIO 配置要匹配硬體
- 不同板子的 overlay 文件不同

### 2. Kconfig 選項
- 必須啟用所需的驅動
- 注意記憶體配置
- 除錯選項會增加映像大小

### 3. 執行緒堆疊
- 堆疊不足會導致崩潰
- 使用 CONFIG_INIT_STACKS 檢測
- 預留足夠的餘量

## 🔧 常用 West 命令

```bash
# 建置
west build -b <board> -p auto

# 燒錄
west flash

# 除錯
west debug

# 清理
west build -t clean

# 查看配置
west build -t menuconfig

# 查看 devicetree
west build -t devicetree_info
```

## 🔗 相關資源

- [Zephyr 官方文檔](https://docs.zephyrproject.org/)
- [Devicetree Specification](https://www.devicetree.org/)
- [Zephyr Discord](https://chat.zephyrproject.org/)
- [支援的開發板](https://docs.zephyrproject.org/latest/boards/index.html)

## 📝 版本歷史

- v1.0.0 (2025-11-16) - 初始版本

## 📄 授權

Apache License 2.0
