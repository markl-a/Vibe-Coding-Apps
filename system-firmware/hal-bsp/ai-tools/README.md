# AI 輔助工具

這個目錄包含用於 HAL/BSP 開發的 AI 輔助工具，可以幫助您快速生成配置代碼和初始化代碼。

## 工具列表

### 1. HAL 代碼生成器 (`hal_code_generator.py`)

自動生成 HAL 初始化代碼、配置代碼和使用示例。

#### 使用方法

```bash
python3 hal_code_generator.py --peripheral <類型> --config '<JSON配置>' [--output 輸出文件]
```

#### 支持的外設類型

- `gpio` - GPIO 引腳
- `uart` - 串口通訊
- `i2c` - I2C 總線
- `spi` - SPI 總線
- `timer` - 定時器/PWM
- `adc` - ADC 模數轉換

#### 示例

**生成 GPIO 代碼:**
```bash
python3 hal_code_generator.py --peripheral gpio \
  --config '{"port":"GPIOA","pin":"5","mode":"OUTPUT_PP","pull":"NONE","speed":"LOW"}'
```

**生成 UART 代碼:**
```bash
python3 hal_code_generator.py --peripheral uart \
  --config '{"uart_num":"2","baudrate":"115200","word_length":"8","stop_bits":"1","parity":"NONE"}'
```

**生成 PWM 代碼:**
```bash
python3 hal_code_generator.py --peripheral timer \
  --config '{"timer_num":"3","mode":"pwm","channel":"1","frequency":"1000","duty_cycle":"50"}'
```

**生成 I2C 代碼:**
```bash
python3 hal_code_generator.py --peripheral i2c \
  --config '{"i2c_num":"1","clock_speed":"100000","device_addr":"0x50"}'
```

**生成 SPI 代碼:**
```bash
python3 hal_code_generator.py --peripheral spi \
  --config '{"spi_num":"1","mode":"0","prescaler":"16"}'
```

**生成 ADC 代碼:**
```bash
python3 hal_code_generator.py --peripheral adc \
  --config '{"adc_num":"1","channel":"0","resolution":"12BIT"}'
```

### 2. 配置向導 (`config_wizard.py`)

交互式配置向導，通過問答形式幫助您配置 HAL 外設。

#### 使用方法

```bash
python3 config_wizard.py
```

向導會引導您：
1. 選擇外設類型
2. 配置具體參數
3. 生成配置 JSON
4. 可選擇直接生成代碼

#### 示例

```bash
$ python3 config_wizard.py

============================================================
HAL 配置向導 - AI 輔助工具
============================================================

請選擇外設類型:
1. GPIO    - 通用輸入輸出
2. UART    - 串口通訊
3. I2C     - I2C 總線
4. SPI     - SPI 總線
5. Timer   - 定時器/PWM
6. ADC     - 模數轉換器

請輸入選項 (1-6): 2

--- UART 配置 ---

UART 編號 (1-6): [默認: 2]
波特率:
1. 9600
2. 115200
3. 921600
4. 自定義
選擇波特率 (1-4): 2
...

配置完成！
生成的配置:
{
  "peripheral": "uart",
  "config": {
    "uart_num": "2",
    "baudrate": "115200",
    ...
  }
}

是否生成代碼？(y/n) [y]: y

運行以下命令生成代碼:
python3 hal_code_generator.py --peripheral uart --config '{"uart_num":"2",...}'
```

## 配置參數說明

### GPIO 配置

| 參數 | 說明 | 可選值 |
|------|------|--------|
| port | GPIO 端口 | GPIOA, GPIOB, GPIOC, GPIOD |
| pin | 引腳編號 | 0-15 |
| mode | 引腳模式 | INPUT, OUTPUT_PP, OUTPUT_OD |
| pull | 上拉/下拉 | NONE, UP, DOWN |
| speed | 輸出速度 | LOW, MEDIUM, HIGH, VERY_HIGH |

### UART 配置

| 參數 | 說明 | 可選值 |
|------|------|--------|
| uart_num | UART 編號 | 1-6 |
| baudrate | 波特率 | 9600, 115200, 921600, 自定義 |
| word_length | 數據位 | 8, 9 |
| stop_bits | 停止位 | 1, 2 |
| parity | 校驗位 | NONE, EVEN, ODD |

### I2C 配置

| 參數 | 說明 | 可選值 |
|------|------|--------|
| i2c_num | I2C 編號 | 1-3 |
| clock_speed | 時鐘速度 | 100000 (標準), 400000 (快速) |
| device_addr | 設備地址 | 0x00-0x7F (7位地址) |

### SPI 配置

| 參數 | 說明 | 可選值 |
|------|------|--------|
| spi_num | SPI 編號 | 1-6 |
| mode | SPI 模式 | 0, 1, 2, 3 |
| prescaler | 波特率分頻 | 2, 4, 8, 16, 32, 64, 128, 256 |

### Timer/PWM 配置

| 參數 | 說明 | 可選值 |
|------|------|--------|
| timer_num | Timer 編號 | 1-14 |
| mode | 模式 | timer, pwm |
| frequency | 頻率 (Hz) | 任意正整數 |
| channel | PWM 通道 | 1-4 (僅 PWM 模式) |
| duty_cycle | 占空比 (%) | 0-100 (僅 PWM 模式) |

### ADC 配置

| 參數 | 說明 | 可選值 |
|------|------|--------|
| adc_num | ADC 編號 | 1-3 |
| channel | 通道編號 | 0-18 |
| resolution | 解析度 | 12BIT, 10BIT, 8BIT, 6BIT |

## 生成的代碼特點

生成的代碼包含：

1. **完整的初始化函數**
   - 參數配置
   - 錯誤處理
   - 註釋說明

2. **使用示例**
   - 基本操作示例
   - 進階用法示例
   - 常見場景代碼

3. **最佳實踐**
   - 遵循 HAL 設計規範
   - 包含錯誤檢查
   - 註釋清晰

## 集成到項目

生成的代碼可以直接集成到您的項目中：

1. 複製生成的代碼到您的源文件
2. 根據實際硬體調整引腳配置
3. 添加必要的頭文件包含
4. 在主程序中調用初始化函數

## 常見問題

### Q: 如何保存生成的代碼？

A: 使用 `--output` 參數：
```bash
python3 hal_code_generator.py --peripheral gpio --config '...' --output gpio_init.c
```

### Q: 可以批量生成多個外設的代碼嗎？

A: 可以使用腳本循環調用：
```bash
#!/bin/bash
python3 hal_code_generator.py --peripheral gpio --config '...' --output gpio.c
python3 hal_code_generator.py --peripheral uart --config '...' --output uart.c
python3 hal_code_generator.py --peripheral i2c --config '...' --output i2c.c
```

### Q: 生成的代碼是否可以直接編譯？

A: 生成的代碼需要：
1. 包含正確的 HAL 頭文件
2. 鏈接 HAL 庫
3. 配置正確的編譯環境

## 未來計劃

- [ ] 添加設備樹 (Device Tree) 生成
- [ ] 支持更多外設類型
- [ ] 添加配置文件導入/導出
- [ ] 集成到 IDE 插件
- [ ] 添加圖形化配置界面

## 貢獻

歡迎提交問題和改進建議！

## 許可證

MIT License
