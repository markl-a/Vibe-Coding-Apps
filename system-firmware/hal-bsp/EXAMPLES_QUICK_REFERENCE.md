# HAL-BSP 範例快速參考

## 範例總覽

本子專案現已包含 **16 個完整的使用範例**，涵蓋所有 HAL 模組。

---

## 📁 範例列表

### GPIO HAL (3 個範例)

| 範例文件 | 功能 | 難度 | 硬體需求 |
|---------|------|------|---------|
| `led_blink.c` | LED 閃爍、跑馬燈、軟體 PWM | ⭐ | 1-4 個 LED |
| `button_interrupt.c` | 按鈕中斷、消抖動、長按檢測 | ⭐⭐ | 按鈕 + LED |
| `parallel_interface.c` | 8/16 位元並行介面 | ⭐⭐⭐ | LCD/SRAM |

**關鍵技術**：
- ✅ GPIO 初始化和配置
- ✅ 數字輸入/輸出
- ✅ 中斷處理
- ✅ 消抖動算法
- ✅ 並行數據傳輸

---

### UART HAL (2 個範例)

| 範例文件 | 功能 | 難度 | 特點 |
|---------|------|------|------|
| `echo_server.c` | 串口回聲服務器 | ⭐ | 簡單易懂 |
| `dma_transfer.c` | DMA 高速數據傳輸 | ⭐⭐⭐ | 高性能 |

**關鍵技術**：
- ✅ 阻塞/非阻塞傳輸
- ✅ DMA 單/雙緩衝區
- ✅ 格式化輸出 (printf)
- ✅ 性能測試

---

### I2C HAL (4 個範例)

| 範例文件 | 功能 | 難度 | 設備 |
|---------|------|------|------|
| `i2c_scan.c` | 掃描 I2C 總線設備 | ⭐ | 任意 I2C 設備 |
| `eeprom_basic.c` | EEPROM 讀寫操作 | ⭐⭐ | AT24Cxx |
| `sensor_sht30.c` | 溫濕度傳感器 | ⭐⭐ | SHT30/SHT31 |
| `multi_platform.c` | 跨平台移植範例 | ⭐⭐⭐ | 通用 |

**關鍵技術**：
- ✅ I2C 設備掃描
- ✅ 記憶體讀寫
- ✅ CRC 校驗
- ✅ 多平台支持

**支持設備**：
- AT24C32/64/128 EEPROM
- SHT30/SHT31 溫濕度傳感器
- MPU6050 IMU
- SSD1306 OLED
- BME280 氣壓傳感器

---

### SPI HAL (3 個範例)

| 範例文件 | 功能 | 難度 | 設備 |
|---------|------|------|------|
| `spi_basic.c` | SPI 基本操作和測試 | ⭐ | 無（回環測試）|
| `w25q_flash.c` | Flash 存儲器完整操作 | ⭐⭐⭐ | W25Qxx |
| `nrf24l01_wireless.c` | 2.4GHz 無線通訊 | ⭐⭐⭐ | NRF24L01+ |

**關鍵技術**：
- ✅ 4 種 SPI 模式
- ✅ Flash 擦除/編程
- ✅ 無線收發
- ✅ DMA 傳輸

**支持設備**：
- W25Q32/64/128 Flash
- NRF24L01+ 無線模組
- SD 卡（可擴展）
- LCD 顯示器（可擴展）

---

### BSP (2 個範例)

| 範例文件 | 功能 | 難度 | 用途 |
|---------|------|------|------|
| `minimal_bsp.c` | BSP 基本使用 | ⭐ | 入門 |
| `full_system.c` | 完整系統整合 | ⭐⭐⭐ | 實際項目 |

**關鍵技術**：
- ✅ 系統初始化
- ✅ 時鐘配置
- ✅ 多周邊整合
- ✅ 任務調度

---

### Device Model (2 個範例)

| 範例文件 | 功能 | 難度 | 概念 |
|---------|------|------|------|
| `led_driver.c` | LED 設備驅動 | ⭐⭐ | 設備抽象 |
| `uart_device.c` | UART 設備封裝 | ⭐⭐ | 統一介面 |

**關鍵技術**：
- ✅ 設備註冊/註銷
- ✅ 統一操作介面
- ✅ ioctl 命令
- ✅ 設備管理

---

## 🎯 範例選擇指南

### 我該從哪個範例開始？

#### 完全新手
1. `gpio-hal/examples/led_blink.c`
2. `uart-hal/examples/echo_server.c`
3. `i2c-hal/examples/i2c_scan.c`

#### 有基礎想深入
1. `gpio-hal/examples/button_interrupt.c`
2. `i2c-hal/examples/eeprom_basic.c`
3. `spi-hal/examples/spi_basic.c`

#### 進階應用
1. `spi-hal/examples/w25q_flash.c`
2. `uart-hal/examples/dma_transfer.c`
3. `i2c-hal/examples/sensor_sht30.c`

#### 專案開發
1. `bsp-stm32f4/examples/full_system.c`
2. `i2c-hal/examples/multi_platform.c`
3. `device-model/examples/uart_device.c`

---

## 📊 範例統計

```
總計範例數: 16
├── GPIO HAL:      3 個
├── UART HAL:      2 個
├── I2C HAL:       4 個
├── SPI HAL:       3 個
├── BSP:           2 個
└── Device Model:  2 個

總代碼行數: ~3000 行
文檔頁數:   ~500 行
```

---

## 🚀 快速開始

### 1. 編譯單個範例

```bash
# 進入範例目錄
cd gpio-hal/examples

# 編譯（STM32F4）
make led_blink PLATFORM=STM32F4

# 燒錄
st-flash write led_blink.bin 0x8000000
```

### 2. 編譯所有範例

```bash
# 在 hal-bsp 根目錄
make examples

# 或指定模組
make gpio-examples
make uart-examples
make i2c-examples
make spi-examples
```

### 3. 清理

```bash
make clean-examples
```

---

## 📚 學習路徑

### 路徑 1: 基礎 GPIO 和通訊

```
led_blink.c
    ↓
echo_server.c
    ↓
i2c_scan.c
    ↓
spi_basic.c
    ↓
minimal_bsp.c
```

### 路徑 2: 中斷和高級功能

```
button_interrupt.c
    ↓
dma_transfer.c
    ↓
parallel_interface.c
```

### 路徑 3: 實際設備驅動

```
i2c_scan.c
    ↓
eeprom_basic.c
    ↓
sensor_sht30.c
    ↓
w25q_flash.c
    ↓
nrf24l01_wireless.c
```

### 路徑 4: 系統整合

```
minimal_bsp.c
    ↓
led_driver.c
    ↓
uart_device.c
    ↓
full_system.c
```

---

## 🔧 硬體清單

### 最小套件（適合入門）

- ✅ STM32F4 開發板
- ✅ USB-Serial 轉換器
- ✅ LED 和電阻
- ✅ 按鈕

**可運行範例**: 6 個

### 標準套件（適合學習）

最小套件 +
- ✅ AT24C32 EEPROM
- ✅ SHT30 溫濕度傳感器
- ✅ W25Q128 Flash

**可運行範例**: 12 個

### 完整套件（適合開發）

標準套件 +
- ✅ NRF24L01+ 無線模組
- ✅ LCD 顯示器
- ✅ 邏輯分析儀/示波器

**可運行範例**: 全部 16 個

---

## 💡 貼士和技巧

### 調試技巧

1. **使用 UART 輸出調試信息**
   ```c
   uart_printf(uart, "Value: %d\r\n", value);
   ```

2. **使用 LED 指示狀態**
   ```c
   gpio_set(LED_PORT, LED_GREEN);    // 成功
   gpio_set(LED_PORT, LED_RED);      // 錯誤
   ```

3. **檢查返回值**
   ```c
   if (i2c_init(...) != 0) {
       printf("Error: I2C init failed\n");
   }
   ```

### 常見陷阱

❌ 忘記啟用時鐘
❌ 引腳配置錯誤
❌ 中斷優先級衝突
❌ 緩衝區溢出
❌ 未初始化變量

✅ 使用 BSP 統一初始化
✅ 使用 HAL 統一介面
✅ 檢查所有返回值
✅ 使用邊界檢查

---

## 📖 延伸閱讀

- [EXAMPLES.md](EXAMPLES.md) - 完整範例文檔
- [README.md](README.md) - 專案總覽
- 各模組的 README.md - 詳細 API 文檔

---

## 🤝 貢獻新範例

想貢獻範例？太好了！請遵循：

1. **範例模板**：參考現有範例的結構
2. **註釋完整**：每個函數都要有說明
3. **包含測試**：確保範例可以運行
4. **更新文檔**：添加到 EXAMPLES.md

---

## 📞 獲取幫助

遇到問題？

1. 查看 [EXAMPLES.md](EXAMPLES.md) 的常見問題章節
2. 檢查範例代碼中的註釋
3. 提交 Issue 到 GitHub

---

**最後更新**: 2025-11-17
**範例版本**: 1.0.0
**維護者**: Vibe-Coding-Apps Team
