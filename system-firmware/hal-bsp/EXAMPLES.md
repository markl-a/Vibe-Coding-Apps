# HAL-BSP 範例使用指南

本文檔提供 hal-bsp 子專案所有範例的詳細說明和使用方法。

## 目錄

- [快速開始](#快速開始)
- [GPIO HAL 範例](#gpio-hal-範例)
- [UART HAL 範例](#uart-hal-範例)
- [I2C HAL 範例](#i2c-hal-範例)
- [SPI HAL 範例](#spi-hal-範例)
- [BSP 範例](#bsp-範例)
- [Device Model 範例](#device-model-範例)
- [編譯和運行](#編譯和運行)
- [常見問題](#常見問題)

---

## 快速開始

### 前置條件

1. **硬體平台**（支持以下平台之一）：
   - STM32F4 系列開發板
   - ESP32 開發板
   - NRF52 開發板

2. **開發工具**：
   - ARM GCC 工具鏈（STM32）
   - ESP-IDF（ESP32）
   - NRF5 SDK（NRF52）

3. **依賴庫**：
   - 對應平台的 HAL 庫
   - 標準 C 庫

### 基本編譯步驟

```bash
# STM32F4 平台
cd gpio-hal/examples
make PLATFORM=STM32F4

# ESP32 平台
cd gpio-hal/examples
idf.py build

# NRF52 平台
cd gpio-hal/examples
make PLATFORM=NRF52
```

---

## GPIO HAL 範例

### 1. LED 閃爍 (`led_blink.c`)

**功能**：基本的 GPIO 輸出控制，實現 LED 閃爍效果

**硬體需求**：
- 1 個 LED 連接到指定的 GPIO 引腳
- 限流電阻（通常 220Ω-1kΩ）

**引腳配置**：
| 平台 | LED 引腳 |
|------|---------|
| STM32F4 | PA5 |
| ESP32 | GPIO2 |
| NRF52 | P0.17 |

**主要功能**：
- GPIO 初始化和配置
- 數字輸出控制 (`gpio_set`, `gpio_reset`, `gpio_toggle`)
- 延遲控制
- 多 LED 跑馬燈效果
- 軟體 PWM 呼吸燈效果

**使用方法**：
```bash
# 編譯
make led_blink

# 燒錄（STM32）
st-flash write led_blink.bin 0x8000000

# 監控輸出
minicom -D /dev/ttyUSB0 -b 115200
```

**預期輸出**：
```
GPIO HAL - LED Blink Example
============================

LED initialized successfully!
LED will blink every 500ms

LED ON  (count: 0)
LED OFF (count: 0)
LED ON  (count: 1)
...
```

### 2. 按鈕中斷 (`button_interrupt.c`)

**功能**：GPIO 中斷處理、按鈕消抖動、長按檢測

**硬體需求**：
- 1 個按鈕（帶上拉電阻或使用內部上拉）
- 4 個 LED（可選，用於狀態指示）

**主要功能**：
- GPIO 中斷配置
- 按鈕消抖動算法
- 單擊、雙擊、長按檢測
- 中斷回調函數

**按鈕事件**：
| 事件 | 觸發條件 | LED 指示 |
|------|---------|---------|
| 按下 | 按鈕按下 | 綠色 LED 亮起 |
| 釋放 | 按鈕釋放 | 綠色 LED 熄滅 |
| 單擊 | 短按並釋放 | 藍色 LED 切換 |
| 雙擊 | 連續兩次單擊 | 紅色 LED 切換 |
| 長按 | 按住 > 1 秒 | 所有 LED 閃爍 |

**使用方法**：
```bash
make button_interrupt
st-flash write button_interrupt.bin 0x8000000
```

### 3. 並行介面 (`parallel_interface.c`)

**功能**：8/16 位元並行數據介面，用於 LCD、SRAM 等設備

**硬體需求**：
- 8 個 GPIO 作為數據總線（D0-D7）
- 4 個 GPIO 作為控制信號（WR, RD, CS, RS）

**引腳分配**：
```
數據總線: PB0-PB7 (D0-D7)
控制信號:
  PA0: WR (寫入使能，低電平有效)
  PA1: RD (讀取使能，低電平有效)
  PA2: CS (片選，低電平有效)
  PA3: RS (寄存器選擇，0=命令，1=數據)
```

**主要功能**：
- 並行數據讀寫
- 時序控制
- 批量數據傳輸
- 性能測試

**應用場景**：
- ILI9341/ILI9488 LCD 顯示器
- IS62WV51216 SRAM
- 並行 Flash 存儲器

---

## UART HAL 範例

### 1. 回聲服務器 (`echo_server.c`)

**功能**：簡單的 UART 回聲服務器

**硬體連接**：
- TX -> USB-Serial RX
- RX -> USB-Serial TX
- GND -> GND

**配置**：
- 波特率: 115200
- 數據位: 8
- 停止位: 1
- 校驗: 無

**使用方法**：
```bash
# 編譯並燒錄
make echo_server
st-flash write echo_server.bin 0x8000000

# 連接串口
minicom -D /dev/ttyUSB0 -b 115200

# 輸入任意字符，將會回顯
```

### 2. DMA 傳輸 (`dma_transfer.c`)

**功能**：高速 UART DMA 數據傳輸

**主要功能**：
- DMA 發送和接收
- 單緩衝區模式
- 雙緩衝區模式（避免數據丟失）
- 性能測試
- 阻塞模式 vs DMA 模式比較

**測試項目**：
1. **DMA 發送測試**：發送 4KB 數據，測量傳輸時間
2. **DMA 接收測試**：接收大量數據
3. **性能比較**：阻塞模式 vs DMA 模式
4. **連續傳輸**：持續發送數據流

**預期性能**（921600 波特率）：
- 阻塞模式: ~80 KB/s
- DMA 模式: ~110 KB/s

---

## I2C HAL 範例

### 1. I2C 掃描 (`i2c_scan.c`)

**功能**：掃描 I2C 總線上的所有設備

**硬體需求**：
- I2C 上拉電阻（通常 4.7kΩ）
- 至少一個 I2C 設備

**主要功能**：
- 掃描 7 位元地址（0x03-0x77）
- 識別常見設備
- 連續監控模式

**常見設備地址**：
| 地址 | 可能的設備 |
|------|-----------|
| 0x3C/0x3D | OLED 顯示器 (SSD1306) |
| 0x44/0x45 | 溫濕度傳感器 (SHT30) |
| 0x50-0x57 | EEPROM (AT24Cxx) |
| 0x68/0x69 | IMU/RTC (MPU6050/DS1307) |
| 0x76/0x77 | 氣壓傳感器 (BME280) |

**使用方法**：
```bash
make i2c_scan
st-flash write i2c_scan.bin 0x8000000
```

**預期輸出**：
```
     0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F
00:          -- -- -- -- -- -- -- -- -- -- -- -- --
10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
30: -- -- -- -- -- -- -- -- -- -- -- -- 3C -- -- --
40: -- -- -- -- 44 -- -- -- -- -- -- -- -- -- -- --
50: 50 -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
60: -- -- -- -- -- -- -- -- 68 -- -- -- -- -- -- --
70: -- -- -- -- -- -- 76 --

Found 4 device(s):
  0x3C - Possible OLED Display (SSD1306)
  0x44 - Possible Sensor (SHT30/SHT31)
  0x50 - Possible EEPROM (AT24Cxx)
  0x68 - Possible IMU/RTC (MPU6050/DS1307)
```

### 2. EEPROM 基本操作 (`eeprom_basic.c`)

**功能**：I2C EEPROM 讀寫操作

**支持的 EEPROM**：
- AT24C32 (4KB)
- AT24C64 (8KB)
- AT24C128 (16KB)
- AT24C256 (32KB)

**主要功能**：
- 單字節讀寫
- 多字節讀寫
- 頁寫入（32 字節頁）
- 字符串讀寫
- 跨頁寫入處理
- 數據驗證

**測試項目**：
1. 單字節讀寫測試
2. 多字節讀寫測試
3. 字符串讀寫測試
4. 邊界條件測試

### 3. SHT30 溫濕度傳感器 (`sensor_sht30.c`)

**功能**：讀取 SHT30/SHT31 溫濕度傳感器

**主要功能**：
- 單次測量模式
- 週期性測量模式
- CRC 校驗
- 溫度和濕度轉換
- 熱指數計算
- 警告檢測

**測量範圍**：
- 溫度: -40°C ~ +125°C (精度 ±0.2°C)
- 濕度: 0% ~ 100% RH (精度 ±2% RH)

**使用方法**：
```bash
make sensor_sht30
st-flash write sensor_sht30.bin 0x8000000
```

**預期輸出**：
```
Time (s) | Temperature (°C) | Humidity (%) | Heat Index
---------|------------------|--------------|------------
       0 |           25.32 |        55.12 |      25.50
       2 |           25.35 |        55.08 |      25.53
       4 |           25.33 |        55.15 |      25.51
...
```

### 4. 多平台移植 (`multi_platform.c`)

**功能**：展示 I2C HAL 的跨平台特性

**支持平台**：
- STM32F4
- ESP32
- NRF52

**主要功能**：
- 平台自動檢測
- 統一的應用層代碼
- 平台特定配置
- 性能測試

**特點**：
- 相同的應用代碼在不同平台上運行
- 自動適配平台差異
- 展示 HAL 抽象的優勢

---

## SPI HAL 範例

### 1. SPI 基本操作 (`spi_basic.c`)

**功能**：SPI 基本功能和配置

**主要功能**：
- SPI 初始化
- 單字節/多字節傳輸
- 回環測試（MOSI 短接 MISO）
- 速度測試
- 4 種 SPI 模式測試
- DMA 傳輸

**SPI 模式**：
| 模式 | CPOL | CPHA | 時鐘極性 | 採樣邊沿 |
|------|------|------|---------|---------|
| 0 | 0 | 0 | 空閒低電平 | 第一邊沿 |
| 1 | 0 | 1 | 空閒低電平 | 第二邊沿 |
| 2 | 1 | 0 | 空閒高電平 | 第一邊沿 |
| 3 | 1 | 1 | 空閒高電平 | 第二邊沿 |

### 2. W25Q128 Flash 存儲器 (`w25q_flash.c`)

**功能**：SPI Flash 芯片完整操作

**支持的 Flash**：
- W25Q128 (16MB)
- W25Q64 (8MB)
- W25Q32 (4MB)

**主要功能**：
- 讀取 JEDEC ID
- 扇區擦除（4KB）
- 塊擦除（64KB）
- 頁編程（256 字節）
- 數據讀取
- 快速讀取
- 跨頁寫入處理

**測試項目**：
1. **扇區擦除和寫入**：擦除 4KB 扇區，寫入並驗證數據
2. **跨頁寫入**：512 字節數據跨頁寫入測試
3. **讀取性能**：普通讀取 vs 快速讀取
4. **十六進制 Dump**：顯示 Flash 內容

**使用方法**：
```bash
make w25q_flash
st-flash write w25q_flash.bin 0x8000000
```

### 3. NRF24L01+ 無線模組 (`nrf24l01_wireless.c`)

**功能**：2.4GHz 無線收發通訊

**硬體連接**：
```
NRF24L01+ -> MCU
  VCC     -> 3.3V
  GND     -> GND
  CE      -> PA3
  CSN     -> PA4
  SCK     -> SPI SCK
  MOSI    -> SPI MOSI
  MISO    -> SPI MISO
  IRQ     -> (可選)
```

**主要功能**：
- NRF24L01+ 初始化
- 發送模式
- 接收模式
- 自動應答
- 自動重傳
- 數據包計數
- 統計信息

**配置參數**：
- 頻道: 40 (2440 MHz)
- 數據率: 1 Mbps
- 發射功率: 0 dBm
- 地址寬度: 5 字節
- 有效載荷: 32 字節

**使用方法**：
```bash
# 編譯發送端
make nrf24l01_wireless ROLE=TX

# 編譯接收端
make nrf24l01_wireless ROLE=RX
```

---

## BSP 範例

### 1. 最小 BSP (`minimal_bsp.c`)

**功能**：BSP 基本使用和系統初始化

**主要功能**：
- BSP 初始化
- 時鐘配置
- LED 流水燈
- 系統滴答計數
- 延遲函數

### 2. 完整系統 (`full_system.c`)

**功能**：整合所有周邊的完整系統

**主要功能**：
- 完整的 BSP 初始化
- UART 控制台
- I2C 設備管理
- SPI 設備管理
- 心跳任務
- 系統狀態監控

**系統架構**：
```
┌─────────────────────────────────┐
│        Application Layer         │
├─────────────────────────────────┤
│  UART   │   I2C   │    SPI      │
├─────────────────────────────────┤
│           GPIO HAL               │
├─────────────────────────────────┤
│        BSP (STM32F4)            │
├─────────────────────────────────┤
│         Hardware                 │
└─────────────────────────────────┘
```

---

## Device Model 範例

### 1. LED 驅動 (`led_driver.c`)

**功能**：使用統一設備模型實作 LED 驅動

**主要功能**：
- 設備註冊
- 設備打開/關閉
- 設備寫入操作
- ioctl 命令

**支持的 ioctl 命令**：
- `LED_IOCTL_ON`: 開啟 LED
- `LED_IOCTL_OFF`: 關閉 LED
- `LED_IOCTL_TOGGLE`: 切換 LED 狀態
- `LED_IOCTL_GET_STATE`: 獲取 LED 狀態

### 2. UART 設備 (`uart_device.c`)

**功能**：使用設備模型封裝 UART

**主要功能**：
- UART 設備註冊
- 統一的讀寫介面
- 設備查找和管理

**優勢**：
- 統一的 API
- 易於切換設備
- 簡化應用層代碼

---

## 編譯和運行

### STM32F4 平台

#### 使用 Makefile

```bash
cd <example_directory>
make PLATFORM=STM32F4
st-flash write output.bin 0x8000000
```

#### 使用 STM32CubeIDE

1. 創建新專案
2. 複製範例代碼到 `Src/` 目錄
3. 添加 HAL 庫路徑到 include paths
4. 編譯並下載

### ESP32 平台

```bash
cd <example_directory>
idf.py build
idf.py flash monitor
```

### NRF52 平台

```bash
cd <example_directory>
make PLATFORM=NRF52
nrfjprog --program output.hex --chiperase
nrfjprog --reset
```

---

## 常見問題

### Q1: 編譯錯誤 "undefined reference to HAL_xxx"

**A**: 確保已正確鏈接平台的 HAL 庫。檢查 Makefile 中的 `LDFLAGS` 和庫路徑。

### Q2: I2C 掃描找不到設備

**A**: 檢查以下項目：
1. 上拉電阻是否正確（通常 4.7kΩ）
2. SDA 和 SCL 連接是否正確
3. 設備是否有電源
4. I2C 時鐘速度是否過高

### Q3: SPI 通訊失敗

**A**: 檢查：
1. CS 引腳是否正確控制
2. SPI 模式（CPOL/CPHA）是否匹配設備
3. 時鐘速度是否在設備支持範圍內
4. MOSI/MISO 是否接對

### Q4: UART 亂碼

**A**: 確認：
1. 波特率設置是否一致
2. 數據位、停止位、校驗位配置
3. TX/RX 是否交叉連接（TX -> RX, RX -> TX）
4. 時鐘頻率是否正確

### Q5: GPIO 中斷不觸發

**A**: 檢查：
1. 中斷是否已啟用
2. NVIC 中斷優先級配置
3. 引腳是否正確配置為中斷模式
4. 上拉/下拉電阻配置

---

## 進階使用

### 多設備管理

```c
/* 註冊多個設備 */
device_register(&uart1_device);
device_register(&uart2_device);
device_register(&spi1_device);
device_register(&i2c1_device);

/* 列出所有設備 */
device_list_all();

/* 通過名稱查找設備 */
device_t *uart = device_find("uart1");
```

### DMA 優化

```c
/* 啟用 DMA */
uart_enable_dma(uart, UART_DMA_BOTH);

/* 使用 DMA 傳輸大數據 */
uart_send_dma(uart, large_buffer, LARGE_SIZE);
```

### 中斷處理

```c
/* 設置中斷回調 */
gpio_set_interrupt(BUTTON_PORT, BUTTON_PIN,
                  GPIO_IRQ_FALLING, button_callback);

/* 啟用中斷 */
gpio_enable_interrupt(BUTTON_PORT, BUTTON_PIN);
```

---

## 貢獻

歡迎貢獻新的範例或改進現有範例！

請遵循以下指南：
1. 代碼風格符合專案規範
2. 添加詳細的註釋
3. 提供測試結果
4. 更新相關文檔

---

## 授權

本專案採用 MIT 授權。詳見 LICENSE 文件。

---

## 聯絡方式

如有問題或建議，請提交 Issue 或 Pull Request。
