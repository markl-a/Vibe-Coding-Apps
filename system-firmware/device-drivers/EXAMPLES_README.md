# Device Drivers 範例程式總覽

本文檔提供 device-drivers 子專案所有驅動程式範例的使用指南。每個驅動都包含完整的、可編譯的範例代碼，涵蓋基本使用、實際應用、錯誤處理和測試程序。

## 目錄結構

```
device-drivers/
├── EXAMPLES_README.md                    # 本文件
├── gpio-controller/examples/             # GPIO 控制器範例
│   ├── basic_usage.c                     # 基本使用
│   ├── led_control.c                     # LED 控制（閃爍、PWM、流水燈等）
│   ├── button_interrupt.c                # 按鈕中斷處理
│   ├── error_handling.c                  # 錯誤處理
│   ├── test_suite.c                      # 自動化測試套件
│   ├── Makefile                          # 編譯配置
│   └── README.md                         # 詳細說明
│
├── i2c-device-driver/examples/           # I2C 設備驅動範例
│   ├── bme280_example.c                  # BME280 溫濕度氣壓感測器
│   ├── i2c_scan.c                        # I2C 總線掃描工具
│   ├── i2c_test.c                        # 基本讀寫測試
│   ├── Makefile                          # 編譯配置
│   └── README.md                         # 詳細說明
│
├── spi-device-driver/examples/           # SPI 設備驅動範例
│   ├── spi_loopback.c                    # SPI 迴路測試
│   ├── spi_flash_test.c                  # SPI Flash ID 讀取
│   ├── Makefile                          # 編譯配置
│   └── README.md                         # 詳細說明
│
├── usb-serial-driver/examples/           # USB 串口驅動範例
│   ├── serial_echo.c                     # 串口回顯測試
│   ├── serial_loopback.c                 # 串口迴路測試
│   ├── Makefile                          # 編譯配置
│   └── README.md                         # 詳細說明
│
└── virtual-network-driver/examples/      # 虛擬網卡驅動範例
    ├── packet_send.c                     # 數據包發送
    ├── packet_capture.c                  # 數據包接收
    ├── network_test.c                    # 連通性測試
    ├── Makefile                          # 編譯配置
    └── README.md                         # 詳細說明
```

## 快速開始

### 編譯所有範例

```bash
# 編譯所有驅動的範例程式
for dir in gpio-controller i2c-device-driver spi-device-driver usb-serial-driver virtual-network-driver; do
    cd /home/user/Vibe-Coding-Apps/system-firmware/device-drivers/$dir/examples
    make
done
```

### 編譯單個驅動的範例

```bash
# 以 GPIO 為例
cd /home/user/Vibe-Coding-Apps/system-firmware/device-drivers/gpio-controller/examples
make
```

## 各驅動範例概覽

### 1. GPIO 控制器 (gpio-controller)

最完整的範例集，包含 5 個程式和完整的測試套件。

**範例程式：**
- **basic_usage** - GPIO 基本操作（導出、方向設置、讀寫）
- **led_control** - LED 控制應用（閃爍、PWM、流水燈、呼吸燈、SOS）
- **button_interrupt** - 按鈕中斷處理（邊緣觸發、防抖、長按檢測）
- **error_handling** - 錯誤處理和資源管理
- **test_suite** - 自動化測試程序

**適用場景：**
- 學習 GPIO sysfs 介面
- LED 指示燈控制
- 按鈕輸入檢測
- 驅動開發測試

**運行範例：**
```bash
cd gpio-controller/examples
sudo ./basic_usage           # 基本使用
sudo ./led_control -b        # LED 閃爍
sudo ./button_interrupt -d   # 防抖測試
sudo ./error_handling        # 錯誤處理
sudo ./test_suite            # 運行測試
```

---

### 2. I2C 設備驅動 (i2c-device-driver)

專注於 I2C 感測器和設備的操作。

**範例程式：**
- **bme280_example** - BME280 溫濕度氣壓感測器完整範例
- **i2c_scan** - 掃描 I2C 總線上的所有設備
- **i2c_test** - 基本的 I2C 讀寫操作

**適用場景：**
- 環境監測（溫度、濕度、氣壓）
- I2C 設備除錯
- 感測器數據採集

**運行範例：**
```bash
cd i2c-device-driver/examples
sudo ./i2c_scan              # 掃描 I2C 設備
sudo ./bme280_example        # 讀取 BME280 數據
sudo ./i2c_test 0x76         # 測試特定地址
```

**硬體需求：**
- I2C 總線（/dev/i2c-1）
- BME280 感測器（地址 0x76 或 0x77）
- 4.7kΩ 上拉電阻（SDA、SCL）

---

### 3. SPI 設備驅動 (spi-device-driver)

展示 SPI 通信和 Flash 存儲操作。

**範例程式：**
- **spi_loopback** - SPI 迴路測試（MOSI→MISO）
- **spi_flash_test** - 讀取 SPI Flash 晶片 ID

**適用場景：**
- SPI 通信測試
- Flash 記憶體操作
- SPI 設備開發

**運行範例：**
```bash
cd spi-device-driver/examples
sudo ./spi_loopback          # 迴路測試
sudo ./spi_flash_test        # Flash ID 讀取
```

**硬體需求：**
- SPI 總線（/dev/spidev0.0）
- 迴路測試：MOSI 連接到 MISO
- Flash 測試：W25Q 系列 SPI Flash

---

### 4. USB 串口驅動 (usb-serial-driver)

USB 轉串口設備的通信測試。

**範例程式：**
- **serial_echo** - 串口回顯測試
- **serial_loopback** - 串口迴路測試

**適用場景：**
- 串口通信測試
- USB 轉串口設備驗證
- 數據傳輸測試

**運行範例：**
```bash
cd usb-serial-driver/examples
sudo ./serial_echo           # 回顯測試
sudo ./serial_loopback       # 迴路測試
```

**硬體需求：**
- USB 轉串口設備（FTDI、CP210x、CH340 等）
- 迴路測試：TX 連接到 RX

---

### 5. 虛擬網卡驅動 (virtual-network-driver)

虛擬網路設備的數據包傳輸測試。

**範例程式：**
- **packet_send** - UDP 數據包發送
- **packet_capture** - 數據包接收監聽
- **network_test** - 網路連通性測試

**適用場景：**
- 網路驅動學習
- 虛擬化環境測試
- 網路協議開發

**運行範例：**
```bash
cd virtual-network-driver/examples

# 準備虛擬網卡
sudo ip link set vnet0 up
sudo ip addr add 192.168.100.1/24 dev vnet0

# 運行測試
./packet_send                # 發送測試
./packet_capture             # 接收測試
./network_test               # 連通性測試
```

---

## 使用前準備

### 1. 系統要求

- Linux 內核 4.4+ （推薦 5.10+）
- GCC 編譯器
- root 權限或相應的設備訪問權限
- make 工具

### 2. 安裝必要工具

```bash
# 安裝編譯工具
sudo apt-get update
sudo apt-get install build-essential

# 安裝 I2C 工具（可選）
sudo apt-get install i2c-tools

# 安裝網路工具（可選）
sudo apt-get install net-tools iproute2
```

### 3. 權限配置

```bash
# 方法 1: 使用 sudo 運行（推薦用於測試）
sudo ./program_name

# 方法 2: 添加用戶到相應組
sudo usermod -a -G gpio $USER      # GPIO 訪問
sudo usermod -a -G i2c $USER       # I2C 訪問
sudo usermod -a -G dialout $USER   # 串口訪問
# 登出後重新登入生效

# 方法 3: 配置 udev 規則（永久解決方案）
sudo nano /etc/udev/rules.d/99-gpio.rules
# 添加相應規則
sudo udevadm control --reload-rules
```

### 4. 載入驅動

```bash
# 載入 GPIO 驅動
cd gpio-controller/driver
make
sudo insmod gpio_driver.ko

# 載入 USB 串口驅動
cd usb-serial-driver/linux
make
sudo insmod usb_serial.ko

# 驗證驅動載入
lsmod | grep gpio
lsmod | grep usb_serial
```

## 範例特色

### 1. 完整性
- 每個範例都是完整的、可獨立編譯運行的程式
- 包含所有必要的頭文件和錯誤處理
- 提供詳細的註釋說明

### 2. 實用性
- 基於真實硬體和實際應用場景
- 包含常見問題的解決方案
- 提供性能測試和優化建議

### 3. 教育性
- 由簡入繁，循序漸進
- 展示最佳實踐和常見陷阱
- 包含豐富的註釋和文檔

### 4. 可擴展性
- 代碼結構清晰，易於修改
- 可作為其他項目的起點
- 支持客製化和擴展

## 常見應用場景

### 場景 1: 嵌入式設備控制
```bash
# GPIO LED 控制 + 按鈕輸入
sudo ./gpio-controller/examples/led_control &
sudo ./gpio-controller/examples/button_interrupt
```

### 場景 2: 環境監測系統
```bash
# I2C 溫濕度感測器
sudo ./i2c-device-driver/examples/bme280_example

# 持續監測（每秒讀取一次）
while true; do
    sudo ./i2c-device-driver/examples/bme280_example
    sleep 1
done
```

### 場景 3: 數據記錄器
```bash
# USB 串口 + 感測器數據
sudo ./usb-serial-driver/examples/serial_echo &
sudo ./i2c-device-driver/examples/bme280_example > /dev/ttyUSB0
```

### 場景 4: 網路測試
```bash
# 虛擬網卡通信測試
# 終端 1
./virtual-network-driver/examples/packet_capture

# 終端 2
./virtual-network-driver/examples/packet_send
```

## 除錯技巧

### 1. GPIO 除錯

```bash
# 檢查 GPIO 狀態
cat /sys/kernel/debug/gpio

# 查看 GPIO 導出狀態
ls -l /sys/class/gpio/

# 監控 GPIO 日誌
dmesg | grep -i gpio
```

### 2. I2C 除錯

```bash
# 掃描 I2C 總線
sudo i2cdetect -y 1

# 讀取寄存器
sudo i2cget -y 1 0x76 0xD0

# 寫入寄存器
sudo i2cset -y 1 0x76 0xF4 0x27
```

### 3. SPI 除錯

```bash
# 檢查 SPI 設備
ls -l /dev/spidev*

# 查看 SPI 配置
cat /sys/bus/spi/devices/spi0.0/mode
cat /sys/bus/spi/devices/spi0.0/max_speed_hz
```

### 4. USB 串口除錯

```bash
# 查看 USB 設備
lsusb

# 監控串口
sudo cat /dev/ttyUSB0

# 查看串口配置
stty -F /dev/ttyUSB0
```

### 5. 網路驅動除錯

```bash
# 查看網卡狀態
ip link show vnet0
ip addr show vnet0

# 監控網路流量
sudo tcpdump -i vnet0

# 查看統計
ip -s link show vnet0
```

## 效能測試

### GPIO 切換速度測試
```bash
sudo ./gpio-controller/examples/test_suite
# 查看 "快速切換性能測試" 結果
```

### I2C 讀取速度測試
```bash
time sudo ./i2c-device-driver/examples/bme280_example
# 測量讀取 10 次的時間
```

### 網路吞吐量測試
```bash
# 使用 iperf
iperf3 -s -B 192.168.100.2 &
iperf3 -c 192.168.100.2 -B 192.168.100.1
```

## 常見問題解決

### Q1: 編譯錯誤

**問題**: `fatal error: linux/gpio.h: No such file or directory`

**解決**:
```bash
# 安裝內核標頭
sudo apt-get install linux-headers-$(uname -r)
```

### Q2: 權限被拒

**問題**: `Permission denied` 錯誤

**解決**:
```bash
# 使用 sudo
sudo ./program_name

# 或添加用戶到組
sudo usermod -a -G gpio,i2c,dialout $USER
```

### Q3: 設備不存在

**問題**: `/dev/i2c-1: No such file or directory`

**解決**:
```bash
# 載入 I2C 驅動
sudo modprobe i2c-dev

# 檢查設備樹配置
dtc -I fs /sys/firmware/devicetree/base | grep -A 10 i2c
```

### Q4: GPIO 已被占用

**問題**: `Device or resource busy`

**解決**:
```bash
# 檢查哪個程序占用
lsof | grep gpio

# 取消導出
echo 17 > /sys/class/gpio/unexport
```

### Q5: I2C 通信失敗

**問題**: 讀寫 I2C 設備失敗

**檢查清單**:
1. 確認設備地址正確（使用 i2cdetect）
2. 檢查上拉電阻（4.7kΩ）
3. 降低時鐘頻率
4. 檢查電源供應
5. 確認接線正確

## 最佳實踐

### 1. 錯誤處理
```c
// 總是檢查返回值
if (gpio_export(gpio) < 0) {
    fprintf(stderr, "Failed to export GPIO: %s\n", strerror(errno));
    return -1;
}

// 使用 errno 獲取詳細錯誤
if (open(path, O_RDWR) < 0) {
    switch (errno) {
        case EACCES:
            // 權限問題
            break;
        case ENOENT:
            // 文件不存在
            break;
    }
}
```

### 2. 資源管理
```c
// 使用 goto 清理資源
int fd = -1;
if (init() < 0)
    goto cleanup;

fd = open(...);
if (fd < 0)
    goto cleanup;

// ... 使用資源 ...

cleanup:
    if (fd >= 0) close(fd);
    cleanup_resources();
```

### 3. 信號處理
```c
// 優雅退出
static volatile int running = 1;

void signal_handler(int sig) {
    running = 0;
}

signal(SIGINT, signal_handler);

while (running) {
    // 主循環
}
// 清理資源
```

### 4. 防抖處理
```c
// 按鈕防抖
#define DEBOUNCE_MS 50
unsigned long long last_time = get_time_ms();

if (get_time_ms() - last_time < DEBOUNCE_MS) {
    return;  // 忽略抖動
}
```

## 進階主題

### 使用 libgpiod（GPIO）
```bash
# 現代 GPIO 訪問方式
sudo apt-get install gpiod libgpiod-dev

# 命令行工具
gpiodetect
gpioinfo gpiochip0
gpioget gpiochip0 17
gpioset gpiochip0 17=1
```

### 使用 Python（快速原型）
```python
# I2C 範例
import smbus
bus = smbus.SMBus(1)
chip_id = bus.read_byte_data(0x76, 0xD0)
print(f"Chip ID: 0x{chip_id:02X}")
```

### 實時性優化
```c
// 設置進程優先級
struct sched_param param;
param.sched_priority = 99;
sched_setscheduler(0, SCHED_FIFO, &param);

// 鎖定記憶體
mlockall(MCL_CURRENT | MCL_FUTURE);
```

## 參考資源

### 官方文檔
- [Linux GPIO Subsystem](https://www.kernel.org/doc/html/latest/driver-api/gpio/)
- [Linux I2C Subsystem](https://www.kernel.org/doc/html/latest/i2c/)
- [Linux SPI Subsystem](https://www.kernel.org/doc/html/latest/spi/)
- [Linux USB Serial](https://www.kernel.org/doc/html/latest/usb/)
- [Linux Network Driver](https://www.kernel.org/doc/html/latest/networking/)

### 工具和庫
- [libgpiod](https://git.kernel.org/pub/scm/libs/libgpiod/libgpiod.git/)
- [i2c-tools](https://i2c.wiki.kernel.org/index.php/I2C_Tools)
- [spidev](https://www.kernel.org/doc/Documentation/spi/spidev)

### 硬體規格
- [I2C Specification](https://www.nxp.com/docs/en/user-guide/UM10204.pdf)
- [SPI Protocol](https://www.analog.com/en/analog-dialogue/articles/introduction-to-spi-interface.html)
- [BME280 Datasheet](https://www.bosch-sensortec.com/products/environmental-sensors/humidity-sensors-bme280/)

## 貢獻

歡迎貢獻新的範例、改進現有代碼或報告問題！

## 授權

MIT License

## 聯繫方式

如有問題或建議，請提交 Issue 或 Pull Request。

---

**最後更新**: 2025-11-17
**維護者**: AI-Assisted Development Team
**版本**: 1.0

---

## 附錄：完整範例列表

| 驅動 | 範例程式 | 功能描述 | 硬體需求 |
|------|----------|----------|----------|
| **GPIO** | basic_usage | 基本操作 | GPIO 引腳 |
| | led_control | LED 控制 | LED + 電阻 |
| | button_interrupt | 按鈕中斷 | 按鈕 + 上拉電阻 |
| | error_handling | 錯誤處理 | - |
| | test_suite | 自動化測試 | GPIO 引腳 |
| **I2C** | bme280_example | BME280 感測器 | BME280 模組 |
| | i2c_scan | 總線掃描 | I2C 總線 |
| | i2c_test | 讀寫測試 | I2C 設備 |
| **SPI** | spi_loopback | 迴路測試 | MOSI→MISO 短接 |
| | spi_flash_test | Flash 測試 | SPI Flash |
| **USB Serial** | serial_echo | 回顯測試 | USB 轉串口 |
| | serial_loopback | 迴路測試 | TX→RX 短接 |
| **Virtual Network** | packet_send | 發送測試 | 虛擬網卡 |
| | packet_capture | 接收測試 | 虛擬網卡 |
| | network_test | 連通性測試 | 虛擬網卡 |

總計：**15 個範例程式**，涵蓋 **5 個驅動類別**
