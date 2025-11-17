# 快速開始指南

這是一個簡化的快速開始指南，幫助您快速測試各個驅動範例。

## 前置需求

```bash
# 安裝核心開發工具
sudo apt-get update
sudo apt-get install build-essential linux-headers-$(uname -r)
```

## 一鍵測試所有驅動

### 1. 字元設備驅動 (5分鐘)

```bash
# 進入範例目錄
cd examples/char-device

# 一鍵測試
sudo ./test_script.sh
```

**預期結果**: 看到設備創建、讀寫測試成功的訊息

---

### 2. 塊設備驅動 (5分鐘)

```bash
cd examples/block-device

# 基本測試
make
sudo ../../block-device/make
sudo insmod ../../block-device/simple_ramdisk.ko
sudo ./test_ramdisk

# 文件系統測試（自動化）
sudo ./test_filesystem.sh
```

**預期結果**: RAM 磁碟創建成功，文件系統正常讀寫

---

### 3. 網路設備驅動 (5分鐘)

```bash
cd examples/network-driver

# 一鍵測試
sudo ./test_ping.sh
```

**預期結果**: 虛擬網路接口啟動，ping 測試成功

---

### 4. I2C/SPI 驅動 (3分鐘)

```bash
cd examples/i2c-spi-driver

# I2C 測試
sudo ./test_i2c_sysfs.sh

# SPI 測試
sudo ./test_spi_sysfs.sh
```

**預期結果**: 虛擬設備載入，sysfs 讀寫正常

---

### 5. 中斷處理驅動 (3分鐘)

```bash
cd examples/interrupt-handler

# 基本測試
sudo ./test_interrupt.sh

# 監控系統中斷
sudo ./monitor_irq.sh
```

**預期結果**: 驅動載入成功，可以查看中斷統計

---

### 6. 平台驅動 (3分鐘)

```bash
cd examples/platform-driver

# 一鍵測試
sudo ./test_platform_led.sh

# 或使用控制程序
make
sudo ./led_control blink 5
```

**預期結果**: LED 驅動載入，可以控制 LED 狀態

---

## 常用命令速查

### 載入/卸載驅動

```bash
# 載入
sudo insmod driver_name.ko

# 卸載
sudo rmmod driver_name

# 查看已載入
lsmod | grep driver_name
```

### 查看內核日誌

```bash
# 即時日誌
sudo dmesg -w

# 過濾特定驅動
dmesg | grep driver_name | tail -20

# 清空日誌
sudo dmesg -C
```

### 設備檢查

```bash
# 字元設備
ls -l /dev/simple_char

# 塊設備
ls -l /dev/sramdisk
lsblk

# 網路設備
ip link show vnet0

# sysfs 設備
ls /sys/devices/platform/
```

---

## 快速故障排除

### 問題：權限拒絕
**解決**: 使用 `sudo`

### 問題：設備不存在
```bash
# 檢查驅動是否載入
lsmod | grep driver_name

# 重新載入
sudo rmmod driver_name
sudo insmod driver_name.ko
```

### 問題：編譯失敗
```bash
# 安裝核心頭文件
sudo apt-get install linux-headers-$(uname -r)

# 清理重編
make clean
make
```

### 問題：模組載入失敗
```bash
# 查看錯誤訊息
dmesg | tail -20

# 檢查核心版本
uname -r
modinfo driver.ko | grep vermagic
```

---

## 測試檢查清單

- [ ] 字元設備：讀寫測試通過
- [ ] 塊設備：文件系統可以掛載
- [ ] 網路設備：ping 測試成功
- [ ] I2C 驅動：sysfs 讀寫正常
- [ ] SPI 驅動：sysfs 讀寫正常
- [ ] 中斷驅動：驅動載入無錯誤
- [ ] 平台驅動：LED 控制正常

---

## 學習路徑建議

### 初學者
1. 從字元設備開始
2. 理解設備文件操作
3. 學習 sysfs 接口

### 中級
1. 塊設備和文件系統
2. 網路設備和協議棧
3. 中斷和同步機制

### 進階
1. I2C/SPI 總線驅動
2. 平台驅動和設備樹
3. DMA 和性能優化

---

## 下一步

1. 閱讀完整的 [README.md](README.md)
2. 研究各驅動的源碼
3. 修改代碼並實驗
4. 嘗試添加新功能

---

## 獲取幫助

- 查看 README.md 詳細文檔
- 檢查內核日誌: `dmesg`
- 參考 Linux 核心文檔
- 訪問 kernelnewbies.org

---

**提示**: 所有測試腳本都需要 root 權限。記得使用 `sudo`！
