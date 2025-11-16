# GPIO 控制驅動 (GPIO Controller Driver)

通用 GPIO (General Purpose Input/Output) 控制器驅動程式，支援嵌入式 Linux 系統的 GPIO 操作。

## 專案概述

本專案提供完整的 GPIO 控制器驅動實現，支援 GPIO 輸入/輸出、中斷處理、sysfs 介面等功能，適用於 Raspberry Pi、BeagleBone、嵌入式 Linux 等平台。

## 功能特色

### 📌 基本 GPIO 功能
- **方向控制**
  - 設定 GPIO 為輸入模式
  - 設定 GPIO 為輸出模式
  - 動態切換方向

- **電平控制**
  - 讀取 GPIO 電平狀態
  - 設定 GPIO 輸出高/低電平
  - 支援上拉/下拉電阻配置

### ⚡ 中斷功能
- **邊緣觸發**
  - 上升緣觸發
  - 下降緣觸發
  - 雙邊緣觸發

- **電平觸發**
  - 高電平觸發
  - 低電平觸發

- **中斷處理**
  - Threaded IRQ 處理
  - 去抖動支援
  - 中斷計數統計

### 🔧 使用者介面
- **sysfs 介面**
  - /sys/class/gpio/export
  - /sys/class/gpio/unexport
  - /sys/class/gpio/gpioN/direction
  - /sys/class/gpio/gpioN/value
  - /sys/class/gpio/gpioN/edge

- **字元設備介面**
  - ioctl 控制命令
  - 讀寫操作
  - poll/select 支援

- **設備樹支援**
  - GPIO 控制器綁定
  - GPIO 消費者綁定
  - pinctrl 整合

## 專案結構

```
gpio-controller/
├── README.md                    # 專案說明
├── driver/                      # 驅動程式
│   ├── gpio_driver.c           # GPIO 驅動主程式
│   ├── gpio_sysfs.c            # sysfs 介面實現
│   ├── gpio_irq.c              # 中斷處理
│   ├── gpio_driver.h           # 標頭檔
│   └── Makefile                # 編譯配置
├── devicetree/                  # 設備樹範例
│   ├── gpio-controller.dts     # GPIO 控制器節點
│   └── gpio-consumer.dts       # GPIO 使用範例
├── userspace/                   # 使用者空間程式
│   ├── gpio_test.c             # GPIO 測試程式
│   ├── gpio_interrupt_test.c   # 中斷測試程式
│   └── Makefile                # 編譯配置
└── docs/                        # 文檔
    ├── api-reference.md        # API 參考
    ├── devicetree-binding.md   # 設備樹綁定文檔
    └── examples.md             # 使用範例
```

## 硬體支援

### 支援的平台
- **Raspberry Pi** (BCM2835/BCM2836/BCM2837/BCM2711)
- **BeagleBone Black** (AM335x)
- **i.MX6/i.MX8** (NXP)
- **Rockchip RK3399/RK3588**
- **AllWinner H3/H5/H6**
- **STM32MP1** (STMicroelectronics)
- **其他支援 GPIO 子系統的 Linux 平台**

## 快速開始

### 編譯驅動

```bash
cd driver/
make
```

### 載入驅動

```bash
# 載入模組
sudo insmod gpio_driver.ko

# 查看驅動資訊
dmesg | tail -20

# 檢查 GPIO 控制器
ls -l /sys/class/gpio/
```

### sysfs 使用範例

```bash
# 匯出 GPIO 17
echo 17 > /sys/class/gpio/export

# 設定為輸出模式
echo out > /sys/class/gpio/gpio17/direction

# 設定輸出高電平
echo 1 > /sys/class/gpio/gpio17/value

# 讀取 GPIO 狀態
cat /sys/class/gpio/gpio17/value

# 設定為輸入模式
echo in > /sys/class/gpio/gpio17/direction

# 配置中斷觸發
echo rising > /sys/class/gpio/gpio17/edge

# 取消匯出
echo 17 > /sys/class/gpio/unexport
```

### 設備樹配置

```dts
/* gpio-controller.dts */
&gpio1 {
    compatible = "custom,gpio-controller";
    reg = <0x209C000 0x4000>;
    interrupts = <GIC_SPI 66 IRQ_TYPE_LEVEL_HIGH>;
    gpio-controller;
    #gpio-cells = <2>;
    interrupt-controller;
    #interrupt-cells = <2>;
    status = "okay";
};

/* GPIO 使用範例 */
&my_device {
    reset-gpios = <&gpio1 17 GPIO_ACTIVE_LOW>;
    enable-gpios = <&gpio1 18 GPIO_ACTIVE_HIGH>;
};
```

### C 語言 API 使用

```c
#include <linux/gpio.h>
#include <linux/of_gpio.h>

/* 從設備樹獲取 GPIO */
int reset_gpio = of_get_named_gpio(node, "reset-gpios", 0);
if (!gpio_is_valid(reset_gpio)) {
    pr_err("Failed to get reset GPIO\n");
    return -EINVAL;
}

/* 請求 GPIO */
ret = gpio_request(reset_gpio, "reset-gpio");
if (ret) {
    pr_err("Failed to request GPIO %d\n", reset_gpio);
    return ret;
}

/* 設定為輸出並設定初始值 */
gpio_direction_output(reset_gpio, 0);

/* 延遲後拉高 */
msleep(10);
gpio_set_value(reset_gpio, 1);

/* 釋放 GPIO */
gpio_free(reset_gpio);
```

### GPIO 中斷使用

```c
#include <linux/interrupt.h>
#include <linux/gpio.h>

static irqreturn_t gpio_irq_handler(int irq, void *dev_id)
{
    pr_info("GPIO interrupt triggered!\n");
    return IRQ_HANDLED;
}

int gpio_pin = 17;
int irq_number;

/* 請求 GPIO */
gpio_request(gpio_pin, "gpio-interrupt");
gpio_direction_input(gpio_pin);

/* 獲取 IRQ 號碼 */
irq_number = gpio_to_irq(gpio_pin);

/* 請求中斷 */
ret = request_irq(irq_number, gpio_irq_handler,
                 IRQF_TRIGGER_RISING,
                 "gpio-interrupt", NULL);

/* 釋放中斷 */
free_irq(irq_number, NULL);
gpio_free(gpio_pin);
```

## 驅動架構

### GPIO 控制器結構

```c
struct gpio_controller {
    struct gpio_chip chip;
    void __iomem *base;
    struct device *dev;
    spinlock_t lock;
    int irq;

    /* GPIO 狀態 */
    unsigned long direction;  /* 方向位元圖 */
    unsigned long output;     /* 輸出值位元圖 */

    /* 中斷相關 */
    unsigned int irq_enabled;
    unsigned int irq_type[MAX_GPIO];
    irq_handler_t handlers[MAX_GPIO];
};
```

### GPIO Chip 操作

```c
static struct gpio_chip gpio_chip_template = {
    .label = "custom-gpio",
    .owner = THIS_MODULE,
    .request = gpio_request_impl,
    .free = gpio_free_impl,
    .direction_input = gpio_direction_input_impl,
    .direction_output = gpio_direction_output_impl,
    .get = gpio_get_value_impl,
    .set = gpio_set_value_impl,
    .to_irq = gpio_to_irq_impl,
    .base = -1,  /* 自動分配 */
    .ngpio = 32,
};
```

## 測試程式

### 基本 GPIO 測試

```bash
cd userspace/
make

# 測試 GPIO 輸出
sudo ./gpio_test output 17 1    # GPIO 17 輸出高電平
sudo ./gpio_test output 17 0    # GPIO 17 輸出低電平

# 測試 GPIO 輸入
sudo ./gpio_test input 18       # 讀取 GPIO 18 狀態

# 閃爍 LED
sudo ./gpio_test blink 17 500   # GPIO 17 閃爍，間隔 500ms
```

### 中斷測試

```bash
# 測試 GPIO 中斷
sudo ./gpio_interrupt_test 18 rising

# 輸出示例:
# Waiting for interrupt on GPIO 18 (rising edge)...
# Interrupt detected! Count: 1
# Interrupt detected! Count: 2
# ...
```

## 效能特性

### GPIO 切換速度
- **直接暫存器訪問**: ~1 MHz
- **GPIO 子系統**: ~100 kHz
- **sysfs 介面**: ~1 kHz

### 中斷延遲
- **硬體中斷延遲**: < 10 μs
- **Threaded IRQ 延遲**: < 100 μs
- **使用者空間通知**: < 1 ms

## 除錯技巧

### 檢查 GPIO 狀態

```bash
# 查看 GPIO 控制器
cat /sys/kernel/debug/gpio

# 輸出示例:
# gpiochip0: GPIOs 0-31, parent: platform/gpio-controller:
#  gpio-17  (                    |reset-gpio          ) out hi
#  gpio-18  (                    |sysfs               ) in  lo IRQ
```

### 使用 gpioinfo 工具

```bash
# 安裝 libgpiod
sudo apt-get install gpiod

# 列出所有 GPIO 晶片
gpiodetect

# 顯示 GPIO 資訊
gpioinfo gpiochip0

# 讀取 GPIO
gpioget gpiochip0 17

# 設定 GPIO
gpioset gpiochip0 17=1
```

### 核心除錯

```bash
# 啟用 GPIO 除錯訊息
echo 8 > /proc/sys/kernel/printk
echo "file drivers/gpio/* +p" > /sys/kernel/debug/dynamic_debug/control

# 查看 GPIO 驅動日誌
dmesg | grep -i gpio
```

## 常見應用場景

### LED 控制

```c
/* LED 驅動範例 */
#define LED_GPIO 17

gpio_request(LED_GPIO, "led");
gpio_direction_output(LED_GPIO, 0);

/* 閃爍 LED */
for (i = 0; i < 10; i++) {
    gpio_set_value(LED_GPIO, 1);
    msleep(500);
    gpio_set_value(LED_GPIO, 0);
    msleep(500);
}

gpio_free(LED_GPIO);
```

### 按鈕輸入

```c
/* 按鈕驅動範例 */
#define BUTTON_GPIO 18

gpio_request(BUTTON_GPIO, "button");
gpio_direction_input(BUTTON_GPIO);

/* 讀取按鈕狀態 */
int button_state = gpio_get_value(BUTTON_GPIO);
pr_info("Button state: %d\n", button_state);

/* 設定中斷 */
int irq = gpio_to_irq(BUTTON_GPIO);
request_irq(irq, button_irq_handler, IRQF_TRIGGER_FALLING,
           "button", NULL);
```

### 繼電器控制

```c
/* 繼電器控制範例 */
#define RELAY_GPIO 19

gpio_request(RELAY_GPIO, "relay");
gpio_direction_output(RELAY_GPIO, 0);

/* 開啟繼電器 */
gpio_set_value(RELAY_GPIO, 1);

/* 關閉繼電器 */
gpio_set_value(RELAY_GPIO, 0);

gpio_free(RELAY_GPIO);
```

### 步進馬達控制

```c
/* 步進馬達驅動範例 */
#define STEP_GPIO 20
#define DIR_GPIO  21
#define ENABLE_GPIO 22

/* 初始化 GPIO */
gpio_request(STEP_GPIO, "step");
gpio_request(DIR_GPIO, "direction");
gpio_request(ENABLE_GPIO, "enable");

gpio_direction_output(STEP_GPIO, 0);
gpio_direction_output(DIR_GPIO, 0);
gpio_direction_output(ENABLE_GPIO, 1);

/* 旋轉馬達 */
gpio_set_value(DIR_GPIO, 1);  /* 設定方向 */
for (i = 0; i < 200; i++) {
    gpio_set_value(STEP_GPIO, 1);
    udelay(1000);
    gpio_set_value(STEP_GPIO, 0);
    udelay(1000);
}
```

## 注意事項

### 電氣特性
⚠️ **重要警告**：
- 確認 GPIO 電壓等級 (通常 3.3V 或 5V)
- 不要超過最大電流限制 (通常 4-16 mA)
- 使用外部驅動電路控制大功率負載
- 添加適當的保護電路 (限流電阻、二極體等)

### 軟體注意
- 使用前檢查 GPIO 是否已被其他驅動佔用
- 正確處理錯誤和資源釋放
- 注意 GPIO 編號的平台差異
- 避免在中斷上下文執行耗時操作

## 相容性

### Linux Kernel 版本
- **最低支援**: Linux 4.4
- **建議版本**: Linux 5.10+
- **測試版本**: Linux 6.1

### 設備樹
- 符合 Linux GPIO 子系統規範
- 支援新版 GPIO 描述符 API
- 向後相容舊版 GPIO API

## 授權

MIT License

## 參考資源

- [Linux GPIO Subsystem](https://www.kernel.org/doc/html/latest/driver-api/gpio/)
- [GPIO Device Tree Bindings](https://www.kernel.org/doc/Documentation/devicetree/bindings/gpio/)
- [libgpiod Library](https://git.kernel.org/pub/scm/libs/libgpiod/libgpiod.git/)

---

**最後更新**: 2025-11-16
**維護者**: AI-Assisted Development Team
