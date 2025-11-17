# STM32 實用範例集

完整的 STM32 開發範例，涵蓋從基礎到進階的各種應用。

## 目錄結構

```
stm32/examples/
├── uart/                    # UART 串口通訊範例
│   ├── uart_echo.c         # 基礎回音範例
│   └── uart_interrupt.c    # 中斷接收與命令處理
├── i2c/                     # I2C 通訊範例
│   └── i2c_bme280.c        # BME280 溫濕度感測器
├── spi/                     # SPI 通訊範例
│   └── spi_sdcard.c        # SD 卡讀寫
└── projects/                # 實際應用專案
    └── temperature_monitoring_system.c  # 溫度監控系統
```

## 範例說明

### 1. UART 通訊範例

#### uart_echo.c - UART 回音範例
**功能特點：**
- 基本 UART 初始化
- 接收並回傳字元
- 適合初學者理解 UART 通訊原理

**硬體需求：**
- STM32F4 開發板
- USB-UART 轉接器

**使用方法：**
1. 編譯並燒錄程式到 STM32
2. 使用串口終端（如 PuTTY、TeraTerm）連接
3. 波特率設定為 115200
4. 輸入文字即可看到回顯

#### uart_interrupt.c - UART 中斷命令處理
**功能特點：**
- 使用中斷方式接收數據
- 命令解析與處理
- LED 控制命令範例
- 系統狀態查詢

**可用命令：**
- `LED ON` - 點亮 LED
- `LED OFF` - 關閉 LED
- `STATUS` - 查詢系統狀態

**應用場景：**
- 遠端控制系統
- 除錯介面
- 人機互動

### 2. I2C 通訊範例

#### i2c_bme280.c - BME280 環境感測器
**功能特點：**
- I2C 主機模式配置
- BME280 感測器初始化
- 讀取溫度、濕度、氣壓
- 數據補償計算
- 海拔高度估算

**硬體連接：**
```
STM32F4          BME280
PB8 (SCL)   -->  SCL
PB9 (SDA)   -->  SDA
3.3V        -->  VCC
GND         -->  GND
```

**注意事項：**
- BME280 I2C 位址可能是 0x76 或 0x77
- 需要上拉電阻（通常模組已內建）
- 電源電壓：1.8V - 3.6V

**輸出範例：**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━
溫度：23.45 °C
濕度：55.20 %
氣壓：1013.25 hPa
海拔：120.5 m (估算)
```

### 3. SPI 通訊範例

#### spi_sdcard.c - SD 卡讀寫
**功能特點：**
- SPI 主機模式配置
- SD 卡初始化協議
- 單區塊讀寫
- 數據驗證

**硬體連接：**
```
STM32F4          SD Card
PA5 (SCK)   -->  CLK
PA6 (MISO)  -->  DO (MISO)
PA7 (MOSI)  -->  DI (MOSI)
PA4 (CS)    -->  CS
3.3V        -->  VCC
GND         -->  GND
```

**支援功能：**
- SD Card V1.x / V2.0
- SDHC (High Capacity)
- FAT16/FAT32 檔案系統（需額外程式庫）

**應用場景：**
- 數據記錄器
- 配置檔案儲存
- 韌體更新

### 4. 實際應用專案

#### temperature_monitoring_system.c - 溫度監控系統
**完整功能：**
1. **感測器監控**
   - BME280 溫濕度感測器
   - 可配置採樣間隔
   - 即時數據顯示

2. **警告系統**
   - 溫度過高/過低警告
   - 濕度過高/過低警告
   - LED 視覺警告指示

3. **UART 命令介面**
   - `help` - 顯示幫助
   - `status` - 系統狀態
   - `start/stop` - 啟動/停止監控
   - `interval <ms>` - 設定採樣間隔

4. **數據處理**
   - 時間戳記記錄
   - 狀態管理
   - 可擴展 SD 卡記錄功能

**硬體需求：**
- STM32F4 開發板
- BME280 感測器（I2C）
- LED（PA5）
- UART 連接（PA2/PA3）
- 可選：SD 卡模組

**系統架構：**
```
┌─────────────┐
│  BME280     │
│  感測器     │
└──────┬──────┘
       │ I2C
┌──────▼──────────────┐
│   STM32F4 MCU      │
│  ┌──────────────┐  │
│  │ 監控系統核心 │  │
│  ├──────────────┤  │
│  │ 警告判斷邏輯 │  │
│  ├──────────────┤  │
│  │ 命令處理器   │  │
│  └──────────────┘  │
└────┬────────┬───────┘
     │        │
   UART      LED
     │      (警告)
   電腦終端
```

**實際應用場景：**
- 機房溫濕度監控
- 溫室環境控制
- 倉庫環境監測
- 實驗室數據採集

## 編譯與燒錄

### 使用 STM32CubeIDE

1. **建立新專案**
   ```
   File -> New -> STM32 Project
   選擇您的 MCU 型號（如 STM32F407VGT6）
   ```

2. **配置時鐘和外設**
   ```
   使用 STM32CubeMX 配置：
   - 系統時鐘（通常 168 MHz）
   - 所需外設（UART, I2C, SPI 等）
   - GPIO 腳位
   ```

3. **加入範例程式碼**
   ```
   將範例程式碼複製到 main.c
   或建立新的 .c 和 .h 檔案
   ```

4. **編譯**
   ```
   Project -> Build Project
   或按 Ctrl+B
   ```

5. **燒錄**
   ```
   Run -> Debug
   或按 F11
   ```

### 使用命令列（ARM GCC）

```bash
# 編譯
arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16 \
  -DSTM32F407xx -DUSE_HAL_DRIVER \
  -I./Inc -I./Drivers/STM32F4xx_HAL_Driver/Inc \
  -O2 -Wall -fdata-sections -ffunction-sections \
  -o build/main.elf \
  Src/main.c \
  Src/system_stm32f4xx.c \
  Drivers/STM32F4xx_HAL_Driver/Src/*.c \
  startup_stm32f407xx.s \
  -T STM32F407VGTx_FLASH.ld \
  --specs=nosys.specs -Wl,--gc-sections

# 生成 binary
arm-none-eabi-objcopy -O binary build/main.elf build/main.bin

# 燒錄（使用 st-flash）
st-flash write build/main.bin 0x8000000
```

## 除錯技巧

### 1. UART 除錯
```c
// 添加除錯輸出
UART_Printf("DEBUG: 變數值 = %d\r\n", value);
UART_Printf("DEBUG: 進入函數 %s\r\n", __FUNCTION__);
```

### 2. LED 指示
```c
// 使用 LED 指示程式執行位置
HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);  // 進入函數
// ... 程式碼 ...
HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);  // 離開函數
```

### 3. 使用 SWD 除錯
- 設定中斷點
- 監看變數
- 單步執行
- 檢視暫存器

### 4. 常見問題排除

**問題：UART 無輸出**
- 檢查波特率設定
- 確認 TX/RX 腳位正確
- 檢查時鐘配置
- 確認 GPIO 複用功能設定

**問題：I2C 無法通訊**
- 檢查上拉電阻
- 確認 I2C 位址正確
- 使用邏輯分析儀檢查波形
- 確認時鐘速度不要太快

**問題：SPI 讀寫錯誤**
- 檢查時鐘極性和相位
- 確認 CS 腳位控制正確
- 檢查 MISO/MOSI 接線
- 降低 SPI 時鐘速度測試

## 進階功能

### 添加 FreeRTOS
```c
// 建立任務
xTaskCreate(vTaskSensor, "Sensor", 128, NULL, 1, NULL);
xTaskCreate(vTaskUART, "UART", 128, NULL, 2, NULL);

// 啟動排程器
vTaskStartScheduler();
```

### 添加低功耗模式
```c
// 進入 STOP 模式
HAL_PWR_EnterSTOPMode(PWR_LOWPOWERREGULATOR_ON, PWR_STOPENTRY_WFI);

// 進入 STANDBY 模式
HAL_PWR_EnterSTANDBYMode();
```

### 添加看門狗
```c
// 初始化獨立看門狗
IWDG_HandleTypeDef hiwdg;
hiwdg.Instance = IWDG;
hiwdg.Init.Prescaler = IWDG_PRESCALER_64;
hiwdg.Init.Reload = 4095;
HAL_IWDG_Init(&hiwdg);

// 在主循環中餵狗
HAL_IWDG_Refresh(&hiwdg);
```

## 學習資源

### 官方文件
- [STM32F4 參考手冊](https://www.st.com/resource/en/reference_manual/dm00031020.pdf)
- [HAL 庫使用手冊](https://www.st.com/resource/en/user_manual/dm00105879.pdf)
- [STM32CubeIDE 使用指南](https://www.st.com/en/development-tools/stm32cubeide.html)

### 推薦書籍
- "Mastering STM32" by Carmine Noviello
- "The Definitive Guide to ARM Cortex-M3 and Cortex-M4 Processors"

### 線上資源
- [STM32 社群論壇](https://community.st.com/)
- [STM32 Wiki](https://wiki.st.com/)

## 授權

所有範例程式碼採用 MIT 授權，可自由用於商業和個人專案。

## 貢獻

歡迎提交問題報告和改進建議！

---

**最後更新：** 2025-11-17
**維護者：** AI-Assisted Development Team
