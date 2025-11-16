# USB 串口驅動 (USB Serial Driver)

跨平台的 USB 串口通訊驅動程式，支援 Linux、Windows 和 macOS。

## 專案概述

本專案提供了一個通用的 USB 串口驅動實現，可以與各種 USB-to-Serial 轉換器（如 FTDI、CP210x、CH340 等）配合使用。

## 功能特色

### 🔌 設備支援
- **FTDI 晶片系列**
  - FT232R, FT232H
  - FT2232D, FT2232H
  - FT4232H, FT4232HL
- **Silabs CP210x 系列**
  - CP2102, CP2103
  - CP2104, CP2105
  - CP2108, CP2109
- **WCH CH340/CH341 系列**
  - CH340G, CH340C
  - CH341A, CH341T

### 📡 通訊功能
- **基本串口功能**
  - 資料發送和接收
  - 可配置鮑率 (300 ~ 921600 bps)
  - 資料位元 (5/6/7/8)
  - 停止位元 (1/1.5/2)
  - 奇偶校驗 (None/Odd/Even/Mark/Space)

- **流量控制**
  - 硬體流控 (RTS/CTS)
  - 軟體流控 (XON/XOFF)
  - DTR/DSR 控制

- **進階功能**
  - 非阻塞 I/O
  - 事件驅動回調
  - 緩衝區管理
  - 錯誤處理

## 平台支援

### Linux Kernel Driver
使用 Linux USB Serial 子系統開發，支援熱插拔和動態設備管理。

### Windows Driver
基於 WDF (Windows Driver Framework) 開發，支援 Windows 7 及以上版本。

### macOS Driver
使用 IOKit 框架，支援 macOS 10.12 及以上版本。

## 專案結構

```
usb-serial-driver/
├── README.md                    # 專案說明
├── linux/                       # Linux 驅動
│   ├── usb_serial.c            # 主驅動程式
│   ├── usb_serial.h            # 標頭檔
│   ├── Makefile                # 編譯配置
│   └── test_serial.c           # 測試程式
├── windows/                     # Windows 驅動
│   ├── driver.c                # WDF 驅動程式
│   ├── device.c                # 設備管理
│   ├── queue.c                 # I/O 佇列
│   └── driver.inf              # 驅動安裝檔
├── macos/                       # macOS 驅動
│   ├── USBSerial.cpp           # IOKit 驅動
│   ├── Info.plist              # 驅動資訊
│   └── USBSerial.h             # 標頭檔
├── userspace/                   # 使用者空間程式
│   ├── serial_comm.c           # 跨平台串口通訊庫
│   ├── serial_test.c           # 測試工具
│   └── Makefile                # 編譯配置
└── docs/                        # 文檔
    ├── api-reference.md        # API 參考
    ├── device-support.md       # 設備支援列表
    └── troubleshooting.md      # 故障排除
```

## Linux 驅動安裝

### 編譯驅動

```bash
cd linux/
make
```

### 載入驅動

```bash
# 載入模組
sudo insmod usb_serial.ko

# 查看驅動資訊
modinfo usb_serial.ko

# 檢查系統日誌
dmesg | tail -20
```

### 卸載驅動

```bash
sudo rmmod usb_serial
```

### 設備使用

```bash
# 插入 USB 串口設備後，設備節點會自動創建
ls -l /dev/ttyUSB*

# 使用 minicom 測試
sudo minicom -D /dev/ttyUSB0

# 或使用 screen
sudo screen /dev/ttyUSB0 115200
```

## Windows 驅動安裝

### 編譯驅動

需要安裝 Windows Driver Kit (WDK)：

```cmd
cd windows\
msbuild driver.sln /p:Configuration=Release /p:Platform=x64
```

### 安裝驅動

1. 使用設備管理員手動安裝
2. 或使用 `pnputil` 命令：

```cmd
pnputil /add-driver driver.inf /install
```

### 測試驅動

```cmd
# 查看 COM 埠
mode

# 使用測試程式
test_serial.exe COM3 115200
```

## macOS 驅動安裝

### 編譯驅動

需要 Xcode 和命令列工具：

```bash
cd macos/
xcodebuild -project USBSerial.xcodeproj -configuration Release
```

### 安裝驅動

```bash
# 複製到系統擴展目錄
sudo cp -R build/Release/USBSerial.kext /Library/Extensions/

# 設定權限
sudo chown -R root:wheel /Library/Extensions/USBSerial.kext
sudo chmod -R 755 /Library/Extensions/USBSerial.kext

# 載入驅動
sudo kextload /Library/Extensions/USBSerial.kext

# 重建快取
sudo kextcache -i /
```

### 設備使用

```bash
# 查看串口設備
ls -l /dev/tty.usbserial*

# 使用 screen 測試
screen /dev/tty.usbserial-* 115200
```

## 使用者空間程式

### 跨平台串口庫

提供統一的 API 介面，支援 Linux、Windows、macOS：

```c
#include "serial_comm.h"

int main() {
    serial_port_t port;

    // 開啟串口
    if (serial_open(&port, "/dev/ttyUSB0", 115200) != 0) {
        fprintf(stderr, "Failed to open serial port\n");
        return 1;
    }

    // 配置參數
    serial_config_t config = {
        .baudrate = 115200,
        .databits = 8,
        .stopbits = 1,
        .parity = SERIAL_PARITY_NONE,
        .flowcontrol = SERIAL_FLOW_NONE
    };
    serial_configure(&port, &config);

    // 發送資料
    const char *data = "Hello USB Serial!";
    serial_write(&port, data, strlen(data));

    // 接收資料
    char buffer[256];
    int bytes_read = serial_read(&port, buffer, sizeof(buffer), 1000);
    if (bytes_read > 0) {
        printf("Received: %.*s\n", bytes_read, buffer);
    }

    // 關閉串口
    serial_close(&port);

    return 0;
}
```

### 編譯測試程式

```bash
cd userspace/
make

# Linux
./serial_test /dev/ttyUSB0 115200

# macOS
./serial_test /dev/tty.usbserial-* 115200

# Windows
serial_test.exe COM3 115200
```

## API 參考

### 初始化函數

```c
// 開啟串口
int serial_open(serial_port_t *port, const char *device, int baudrate);

// 配置串口
int serial_configure(serial_port_t *port, const serial_config_t *config);

// 關閉串口
void serial_close(serial_port_t *port);
```

### I/O 函數

```c
// 寫入資料
int serial_write(serial_port_t *port, const void *data, size_t size);

// 讀取資料 (帶超時)
int serial_read(serial_port_t *port, void *buffer, size_t size, int timeout_ms);

// 刷新緩衝區
int serial_flush(serial_port_t *port);
```

### 控制函數

```c
// 設定 RTS 信號
int serial_set_rts(serial_port_t *port, int level);

// 設定 DTR 信號
int serial_set_dtr(serial_port_t *port, int level);

// 取得 CTS 狀態
int serial_get_cts(serial_port_t *port);

// 取得 DSR 狀態
int serial_get_dsr(serial_port_t *port);
```

## 除錯技巧

### Linux 除錯

```bash
# 啟用除錯輸出
echo 8 > /proc/sys/kernel/printk

# 查看 USB 設備資訊
lsusb -v

# 監控 USB 事件
sudo udevadm monitor --udev --property

# 查看驅動日誌
dmesg | grep -i usb
dmesg | grep -i serial
```

### Windows 除錯

```cmd
# 使用 WinDbg 核心除錯
# 啟用 Debug Print
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Debug Print Filter" /v DEFAULT /t REG_DWORD /d 0xf

# 使用 DebugView 查看輸出
# https://docs.microsoft.com/en-us/sysinternals/downloads/debugview
```

### macOS 除錯

```bash
# 查看核心日誌
sudo log show --predicate 'processID == 0' --last 5m

# 查看載入的驅動
kextstat | grep -i usb

# 查看 IOKit 註冊表
ioreg -l -w 0

# 卸載驅動
sudo kextunload /Library/Extensions/USBSerial.kext
```

## 常見問題

### Q1: 設備無法識別

**可能原因**：
- USB 線材品質不良
- 設備驅動未正確安裝
- VID/PID 不在支援列表中

**解決方法**：
```bash
# Linux: 檢查設備 VID/PID
lsusb
# 手動添加設備 ID
echo "1234 5678" | sudo tee /sys/bus/usb-serial/drivers/generic/new_id
```

### Q2: 資料傳輸錯誤

**可能原因**：
- 鮑率設定不正確
- 流控設定錯誤
- 緩衝區溢出

**解決方法**：
- 確認兩端鮑率一致
- 根據硬體支援調整流控
- 增大緩衝區大小

### Q3: 許可權不足

**Linux**：
```bash
# 將使用者加入 dialout 群組
sudo usermod -a -G dialout $USER
# 登出後重新登入生效
```

**macOS**：
```bash
# 修改設備權限
sudo chmod 666 /dev/tty.usbserial-*
```

## 支援的設備

| 晶片 | VID | PID | 支援狀態 |
|------|-----|-----|----------|
| FT232R | 0x0403 | 0x6001 | ✅ 完整支援 |
| FT232H | 0x0403 | 0x6014 | ✅ 完整支援 |
| CP2102 | 0x10C4 | 0xEA60 | ✅ 完整支援 |
| CP2104 | 0x10C4 | 0xEA63 | ✅ 完整支援 |
| CH340G | 0x1A86 | 0x7523 | ✅ 完整支援 |
| CH341A | 0x1A86 | 0x5523 | ✅ 完整支援 |
| PL2303 | 0x067B | 0x2303 | 🔶 基本支援 |

## 效能測試

### 吞吐量測試

```bash
# 發送 1MB 資料
./serial_test /dev/ttyUSB0 115200 --test throughput --size 1048576

# 典型結果 (115200 bps):
# Throughput: ~11.5 KB/s
# Latency: ~1ms
# Error rate: 0%
```

### 延遲測試

```bash
# Ping-pong 測試
./serial_test /dev/ttyUSB0 115200 --test latency --count 1000

# 典型結果:
# Min: 0.8ms
# Max: 2.5ms
# Avg: 1.2ms
```

## 授權

MIT License

## 貢獻指南

歡迎提交 Issue 和 Pull Request！

## 參考資源

- [Linux USB Serial Driver](https://www.kernel.org/doc/html/latest/driver-api/usb/usb.html)
- [Windows Serial Driver](https://docs.microsoft.com/en-us/windows-hardware/drivers/serports/)
- [IOKit Fundamentals](https://developer.apple.com/library/archive/documentation/DeviceDrivers/Conceptual/IOKitFundamentals/)

---

**最後更新**: 2025-11-16
**維護者**: AI-Assisted Development Team
