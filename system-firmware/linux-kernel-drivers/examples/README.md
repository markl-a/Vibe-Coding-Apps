# Linux 核心驅動範例使用指南

本目錄包含了 linux-kernel-drivers 專案中所有驅動程式的實際可用範例和測試程序。

## 目錄結構

```
examples/
├── char-device/          # 字元設備驅動範例
├── block-device/         # 塊設備驅動範例
├── network-driver/       # 網路設備驅動範例
├── i2c-spi-driver/      # I2C/SPI 驅動範例
├── interrupt-handler/   # 中斷處理範例
├── platform-driver/     # 平台驅動範例
└── README.md            # 本文件
```

## 快速開始

### 系統需求

- Linux 核心開發環境（kernel headers）
- GCC 編譯器
- root 權限（用於載入驅動模組）

### 安裝核心開發工具

```bash
# Ubuntu/Debian
sudo apt-get install build-essential linux-headers-$(uname -r)

# Fedora/RHEL
sudo dnf install kernel-devel kernel-headers gcc make

# Arch Linux
sudo pacman -S linux-headers base-devel
```

## 各驅動類型使用說明

### 1. 字元設備驅動（char-device）

字元設備驅動提供簡單的讀寫接口，適用於序列設備、感測器等。

#### 功能特性
- 基本的讀/寫操作
- seek 定位支援
- 並發訪問保護（mutex）
- 自動創建設備節點

#### 範例程序
- `test_read_write.c` - 基本讀寫測試
- `test_concurrent.c` - 並發訪問測試
- `test_script.sh` - 自動化測試腳本

#### 使用步驟

```bash
cd examples/char-device

# 1. 編譯測試程序
make

# 2. 編譯並載入驅動
cd ../../char-device
make
sudo insmod simple_chardev.ko

# 3. 驗證設備節點
ls -l /dev/simple_char

# 4. 執行測試
cd ../examples/char-device
sudo ./test_read_write

# 5. 執行並發測試
sudo ./test_concurrent

# 6. 或使用自動化腳本
sudo ./test_script.sh
```

#### 預期輸出
```
=== 字元設備讀寫測試 ===

1. 打開設備 /dev/simple_char...
   成功! 文件描述符: 3

2. 寫入數據到設備...
   寫入 42 字節: "Hello from userspace! Time: 1234567890"

3. 從設備讀取數據...
   讀取 42 字節: "Hello from userspace! Time: 1234567890"

4. 驗證數據...
   ✓ 數據驗證成功!
```

---

### 2. 塊設備驅動（block-device）

RAM 磁碟塊設備驅動，模擬一個基於記憶體的磁碟。

#### 功能特性
- 100MB RAM 磁碟
- 支援文件系統（ext4, ext3, vfat 等）
- 分區支援（最多 16 個分區）
- 高速讀寫性能

#### 範例程序
- `test_ramdisk.c` - RAM 磁碟基本測試
- `test_filesystem.sh` - 文件系統測試
- `benchmark.sh` - 性能基準測試

#### 使用步驟

```bash
cd examples/block-device

# 1. 編譯測試程序
make

# 2. 編譯並載入驅動
cd ../../block-device
make
sudo insmod simple_ramdisk.ko

# 3. 查看塊設備
ls -l /dev/sramdisk
lsblk | grep sramdisk

# 4. 基本測試
cd ../examples/block-device
sudo ./test_ramdisk

# 5. 文件系統測試（創建 ext4 並掛載）
sudo ./test_filesystem.sh

# 6. 性能測試
sudo ./benchmark.sh
```

#### 文件系統使用範例

```bash
# 創建文件系統
sudo mkfs.ext4 /dev/sramdisk

# 掛載
sudo mkdir -p /mnt/ramdisk
sudo mount /dev/sramdisk /mnt/ramdisk

# 使用
echo "Hello RAM disk!" | sudo tee /mnt/ramdisk/test.txt
cat /mnt/ramdisk/test.txt

# 卸載
sudo umount /mnt/ramdisk
```

---

### 3. 網路設備驅動（network-driver）

虛擬網路設備驅動，實現一個 loopback 網路接口。

#### 功能特性
- 虛擬以太網設備
- 數據包發送和接收（loopback）
- 網路統計資訊
- ethtool 支援

#### 範例程序
- `test_network.c` - 原始 socket 測試
- `test_ping.sh` - Ping 和網路配置測試
- `test_traffic.sh` - 流量測試

#### 使用步驟

```bash
cd examples/network-driver

# 1. 編譯測試程序
make

# 2. 編譯並載入驅動
cd ../../network-driver
make
sudo insmod virtual_netdev.ko

# 3. 查看網路接口
ip link show vnet0

# 4. 配置並啟動接口
sudo ip link set vnet0 up
sudo ip addr add 192.168.100.1/24 dev vnet0

# 5. 測試網路連接
ping -c 3 -I vnet0 192.168.100.1

# 6. 執行測試程序
cd ../examples/network-driver
sudo ./test_network

# 7. 自動化測試
sudo ./test_ping.sh
sudo ./test_traffic.sh
```

#### 網路工具測試

```bash
# 查看接口統計
ip -s link show vnet0

# 使用 tcpdump 抓包
sudo tcpdump -i vnet0 -n

# ethtool 信息
sudo ethtool vnet0
```

---

### 4. I2C/SPI 驅動（i2c-spi-driver）

I2C 和 SPI 虛擬設備驅動，展示總線設備驅動的實現。

#### 功能特性
- 虛擬 I2C 設備（模擬 EEPROM）
- 虛擬 SPI 設備
- sysfs 接口訪問
- 設備樹支援

#### 範例程序
- `test_i2c_sysfs.sh` - I2C sysfs 測試
- `test_i2c_tools.sh` - 使用 i2c-tools 測試
- `test_spi_sysfs.sh` - SPI sysfs 測試
- `spidev_test.c` - spidev 接口測試

#### I2C 測試步驟

```bash
cd examples/i2c-spi-driver

# 1. 編譯測試程序
make

# 2. I2C 驅動測試
sudo ./test_i2c_sysfs.sh

# 3. 使用 i2c-tools（需要先安裝）
sudo apt-get install i2c-tools
sudo ./test_i2c_tools.sh
```

#### I2C sysfs 手動操作

```bash
# 載入驅動
sudo insmod ../../i2c-spi-driver/i2c_dummy_device.ko

# 創建設備實例（如果有 I2C 總線）
echo "i2c_dummy 0x50" | sudo tee /sys/bus/i2c/devices/i2c-0/new_device

# 通過 sysfs 讀寫
# 設置寄存器地址
echo "0x10" | sudo tee /sys/bus/i2c/devices/0-0050/reg_addr

# 寫入值
echo "0xAB" | sudo tee /sys/bus/i2c/devices/0-0050/reg_value

# 讀取值
cat /sys/bus/i2c/devices/0-0050/reg_value
```

#### SPI 測試步驟

```bash
# SPI 驅動測試
sudo ./test_spi_sysfs.sh

# spidev 測試（需要 spidev 設備）
sudo ./spidev_test
```

---

### 5. 中斷處理（interrupt-handler）

中斷處理驅動範例，展示中斷的請求、處理和底半部機制。

#### 功能特性
- 中斷處理（頂半部和底半部）
- Tasklet 使用
- Workqueue 使用
- 中斷統計

#### 範例程序
- `test_interrupt.sh` - 中斷驅動測試
- `monitor_irq.sh` - 系統中斷監控工具
- `simulate_irq.c` - 中斷模擬器（演示）

#### 使用步驟

```bash
cd examples/interrupt-handler

# 1. 編譯測試程序
make

# 2. 測試驅動（演示模式）
sudo ./test_interrupt.sh

# 3. 監控系統中斷
sudo ./monitor_irq.sh

# 4. 持續監控
sudo ./monitor_irq.sh -w

# 5. 監控特定 IRQ
sudo ./monitor_irq.sh -i 1
```

#### 使用真實 IRQ

```bash
# 查看可用的 IRQ
cat /proc/interrupts

# 載入驅動並指定 IRQ（例如 IRQ 1 - 鍵盤）
sudo insmod ../../interrupt-handler/interrupt_example.ko irq_number=1

# 查看中斷計數
cat /sys/devices/platform/irq_example*/irq_count

# 觸發中斷（按鍵盤）
# 查看計數變化
watch -n 1 cat /sys/devices/platform/irq_example*/irq_count
```

---

### 6. 平台驅動（platform-driver）

平台設備驅動範例，模擬 LED 控制。

#### 功能特性
- 平台設備和驅動匹配
- 設備樹綁定
- GPIO 控制（虛擬）
- sysfs 接口

#### 範例程序
- `test_platform_led.sh` - LED 驅動測試
- `led_control.c` - LED 控制程序
- `device_tree_example.dts` - 設備樹範例

#### 使用步驟

```bash
cd examples/platform-driver

# 1. 編譯測試程序
make

# 2. 自動化測試
sudo ./test_platform_led.sh

# 3. 使用 LED 控制程序
sudo ./led_control on      # 打開 LED
sudo ./led_control off     # 關閉 LED
sudo ./led_control toggle  # 切換狀態
sudo ./led_control status  # 查看狀態
sudo ./led_control blink 10  # 閃爍 10 次
```

#### sysfs 手動控制

```bash
# 載入驅動
sudo insmod ../../platform-driver/platform_led_driver.ko

# 查找設備
DEVICE=$(find /sys/devices/platform -name "platform_led*" | head -1)

# 控制 LED
echo "on" | sudo tee $DEVICE/led_state
echo "off" | sudo tee $DEVICE/led_state

# 查看狀態
cat $DEVICE/led_state
```

#### 設備樹編譯（可選）

```bash
# 安裝設備樹編譯器
sudo apt-get install device-tree-compiler

# 編譯設備樹
make dtb

# 這會生成 device_tree_example.dtb
```

---

## 通用操作指南

### 查看內核日誌

所有驅動都會輸出詳細的內核日誌，使用以下命令查看：

```bash
# 即時查看內核日誌
sudo dmesg -w

# 查看特定驅動的日誌
dmesg | grep simple_char
dmesg | grep sramdisk
dmesg | grep vnetdev
dmesg | grep i2c_dummy
dmesg | grep spi_dummy
dmesg | grep irq_example
dmesg | grep platform_led
```

### 載入和卸載模組

```bash
# 載入模組
sudo insmod driver_name.ko

# 查看已載入模組
lsmod | grep driver_name

# 查看模組信息
modinfo driver_name.ko

# 卸載模組
sudo rmmod driver_name

# 強制卸載（不建議）
sudo rmmod -f driver_name
```

### 模組參數

某些驅動支援參數，例如：

```bash
# 中斷驅動指定 IRQ
sudo insmod interrupt_example.ko irq_number=5

# 查看模組參數
modinfo interrupt_example.ko | grep parm
```

### 除錯技巧

```bash
# 啟用詳細日誌
echo 8 | sudo tee /proc/sys/kernel/printk

# 清空內核日誌緩衝區
sudo dmesg -C

# 載入驅動並立即查看日誌
sudo insmod driver.ko && dmesg | tail -20

# 使用 strace 追蹤系統調用
sudo strace -e trace=open,read,write,ioctl ./test_program
```

---

## 故障排除

### 問題：設備節點未創建

```bash
# 檢查 udev 規則
sudo udevadm control --reload-rules
sudo udevadm trigger

# 手動創建設備節點（字元設備）
sudo mknod /dev/device_name c MAJOR MINOR

# 查看主設備號
cat /proc/devices | grep device_name
```

### 問題：模組載入失敗

```bash
# 查看詳細錯誤
sudo insmod driver.ko
dmesg | tail -20

# 檢查核心版本匹配
modinfo driver.ko | grep vermagic
uname -r

# 檢查依賴
modprobe --show-depends driver_name
```

### 問題：權限拒絕

```bash
# 確保使用 root 權限
sudo -i

# 檢查 SELinux 狀態（如果適用）
getenforce

# 暫時禁用 SELinux
sudo setenforce 0
```

### 問題：編譯錯誤

```bash
# 確保安裝了正確的核心頭文件
sudo apt-get install linux-headers-$(uname -r)

# 清理並重新編譯
make clean
make
```

---

## 效能測試

### 塊設備性能

```bash
# 使用 dd 測試
sudo dd if=/dev/zero of=/dev/sramdisk bs=1M count=100

# 使用 hdparm 測試
sudo hdparm -tT /dev/sramdisk

# 使用 fio 基準測試（如果安裝）
sudo fio --name=test --filename=/dev/sramdisk --size=50M \
    --rw=randwrite --bs=4k --direct=1
```

### 網路性能

```bash
# 使用 iperf3
sudo iperf3 -s -B 192.168.100.1 &
sudo iperf3 -c 192.168.100.1 -t 10

# 使用 netperf（如果安裝）
netserver
netperf -H 192.168.100.1
```

---

## 學習資源

### 推薦閱讀
1. Linux Device Drivers (3rd Edition) - O'Reilly
2. Linux Kernel Development - Robert Love
3. Understanding the Linux Kernel - O'Reilly

### 線上資源
- [The Linux Kernel documentation](https://www.kernel.org/doc/html/latest/)
- [Linux Driver Tutorial](https://linux-kernel-labs.github.io/)
- [Bootlin kernel training](https://bootlin.com/training/kernel/)

### 核心郵件列表
- [Linux Kernel Mailing List](https://lkml.org/)
- [Kernelnewbies](https://kernelnewbies.org/)

---

## 貢獻指南

如果您發現問題或有改進建議：

1. 檢查現有的 issues
2. 創建新的 issue 描述問題
3. 提交 pull request 與改進

---

## 許可證

本專案使用 GPL v2 授權。詳見各驅動源碼中的授權聲明。

---

## 聯絡方式

如有問題或建議，請通過以下方式聯絡：

- 提交 GitHub Issue
- 查看專案文檔
- 參考內核文檔

---

## 版本歷史

- v1.0 (2025) - 初始版本，包含所有基本驅動範例

---

**注意：這些驅動僅用於學習和測試目的。在生產環境中使用前，請進行充分的測試和驗證。**
