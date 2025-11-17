# ESP32 實用範例集

完整的 ESP32 開發範例，涵蓋基礎到進階的物聯網應用。

## 目錄結構

```
esp32/examples/
├── basic/                          # 基礎範例
│   ├── led_blink.cpp              # LED 閃爍
│   └── pwm_led.cpp                # PWM 呼吸燈
├── communication/                  # 通訊協議範例
│   ├── uart_communication.cpp     # UART 通訊
│   ├── i2c_scanner.cpp            # I2C 掃描器
│   └── spi_communication.cpp      # SPI 通訊
└── projects/                       # 實際應用專案
    └── smart_home_controller.cpp  # 智能家居控制系統
```

## 範例說明

### 1. 基礎範例

#### led_blink.cpp - LED 閃爍
**功能特點：**
- 最簡單的 ESP32 入門範例
- 控制內建 LED 閃爍
- 串口輸出除錯資訊

**使用方法：**
1. 使用 Arduino IDE 或 PlatformIO 開啟
2. 選擇正確的 ESP32 開發板
3. 上傳程式
4. 觀察 LED 閃爍

#### pwm_led.cpp - PWM 呼吸燈
**功能特點：**
- PWM（脈衝寬度調變）基礎
- LED 亮度漸變效果
- LEDC（LED 控制器）使用

**技術要點：**
- PWM 頻率：5kHz
- 解析度：8-bit (0-255)
- 漸變效果平滑

### 2. 通訊協議範例

#### uart_communication.cpp - UART 通訊
**功能特點：**
- 雙 UART 支援（UART0 和 UART2）
- 命令解析系統
- LED 控制介面
- 系統狀態查詢

**硬體連接：**
```
ESP32          USB-UART
GPIO16 (RX2)   --> TX
GPIO17 (TX2)   --> RX
GND            --> GND
```

**可用命令：**
- `LED ON` - 點亮 LED
- `LED OFF` - 關閉 LED
- `STATUS` - 顯示系統狀態
- `ECHO <msg>` - 回傳訊息
- `HELP` - 顯示幫助

**應用場景：**
- 串口除錯
- 模組間通訊
- AT 命令介面
- 數據傳輸

#### i2c_scanner.cpp - I2C 設備掃描器
**功能特點：**
- 自動掃描 I2C 位址（0x00-0x7F）
- 視覺化顯示掃描結果
- 常見設備位址參考
- 診斷工具

**輸出範例：**
```
     0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F
00: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
30: -- -- -- -- -- -- -- -- -- -- -- -- 3C -- -- --
40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
50: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
60: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
70: -- -- -- -- -- -- -- 77 -- -- -- -- -- -- -- --

✓ 找到 2 個 I2C 設備
```

**常見設備位址：**
| 位址 | 設備 |
|------|------|
| 0x3C, 0x3D | OLED 顯示器 (SSD1306) |
| 0x68, 0x69 | MPU6050 陀螺儀 |
| 0x76, 0x77 | BME280/BMP280 環境感測器 |
| 0x20-0x27 | PCF8574 I/O 擴展 |

#### spi_communication.cpp - SPI 通訊
**功能特點：**
- SPI 主機模式
- 多種傳輸方式示範
- 暫存器讀寫模擬
- 完整的通訊協議

**SPI 設定：**
- 頻率：1 MHz
- 模式：MODE0 (CPOL=0, CPHA=0)
- 位元順序：MSB First
- 使用 VSPI 介面

**硬體連接：**
```
ESP32    SPI 設備
GPIO23   --> MOSI
GPIO19   --> MISO
GPIO18   --> SCK
GPIO5    --> CS
3.3V     --> VCC
GND      --> GND
```

**應用範例：**
- SD 卡讀寫
- SPI Flash
- 顯示器驅動 (TFT, OLED)
- 感測器通訊

### 3. 實際應用專案

#### smart_home_controller.cpp - 智能家居控制系統
**完整功能：**

1. **網路連接**
   - Wi-Fi 連接管理
   - 自動重連機制
   - 狀態指示

2. **Web 控制介面**
   - 響應式網頁設計
   - 即時數據顯示
   - 設備遠端控制
   - 自動刷新

3. **MQTT 通訊**
   - 訂閱/發布訊息
   - JSON 格式數據
   - 遠端控制命令
   - 狀態同步

4. **環境監控**
   - DHT22 溫濕度感測器
   - 即時數據採集
   - 數據發布到雲端

5. **設備控制**
   - 3 路繼電器控制
   - 客廳燈控制
   - 臥室燈控制
   - 風扇控制

6. **自動化規則**
   - 溫度自動控制
   - 可配置閾值
   - 智能開關

**硬體需求：**
```
組件           GPIO   說明
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DHT22          4      溫濕度感測器
繼電器1        25     客廳燈控制
繼電器2        26     臥室燈控制
繼電器3        27     風扇控制
狀態LED        2      系統狀態指示
```

**系統架構：**
```
┌─────────────┐
│   DHT22     │
│  溫濕度感測  │
└──────┬──────┘
       │
┌──────▼──────────────────────┐
│      ESP32 主控制器          │
│  ┌────────────────────────┐ │
│  │   Wi-Fi 網路連接       │ │
│  ├────────────────────────┤ │
│  │   Web 伺服器           │ │
│  ├────────────────────────┤ │
│  │   MQTT 客戶端          │ │
│  ├────────────────────────┤ │
│  │   自動化控制邏輯       │ │
│  └────────────────────────┘ │
└───┬─────┬─────┬──────────────┘
    │     │     │
    │     │     └─> 繼電器3 (風扇)
    │     └────────> 繼電器2 (臥室燈)
    └──────────────> 繼電器1 (客廳燈)
```

**使用方式：**

1. **配置 Wi-Fi**
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

2. **配置 MQTT**
   ```cpp
   const char* mqtt_server = "broker.hivemq.com";
   ```

3. **上傳程式並開啟串口監視器**
   ```
   ✓ 硬體初始化完成
   ✓ Wi-Fi 連接成功！
   IP 位址: 192.168.1.100
   ✓ Web 伺服器已啟動
   ✓ MQTT 連接成功！
   ```

4. **開啟 Web 介面**
   - 瀏覽器輸入：`http://192.168.1.100`
   - 即可看到控制介面

5. **使用 MQTT 控制**
   ```json
   // 發布到 smarthome/control
   {
     "relay1": true,
     "relay2": false,
     "auto_mode": true
   }
   ```

**自動化規則：**
- 溫度 > 28°C：自動開啟風扇
- 溫度 < 26°C：自動關閉風扇
- 可透過 `auto_mode` 開關自動控制

**擴展功能：**
- 添加更多感測器
- 整合語音助手（Alexa, Google Home）
- 數據記錄到資料庫
- 手機 App 控制
- 定時任務
- 場景模式

## 編譯與上傳

### 使用 Arduino IDE

1. **安裝 ESP32 開發板支援**
   ```
   檔案 -> 偏好設定 -> 額外的開發板管理員網址:
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```

2. **安裝必要函式庫**
   ```
   工具 -> 管理程式庫
   搜尋並安裝：
   - DHT sensor library
   - Adafruit Unified Sensor
   - PubSubClient
   - ArduinoJson
   ```

3. **選擇開發板**
   ```
   工具 -> 開發板 -> ESP32 Dev Module
   ```

4. **上傳程式**
   ```
   草稿碼 -> 上傳
   或按 Ctrl+U
   ```

### 使用 PlatformIO

1. **platform platformio.ini 設定**
   ```ini
   [env:esp32dev]
   platform = espressif32
   board = esp32dev
   framework = arduino
   monitor_speed = 115200
   lib_deps =
       adafruit/DHT sensor library@^1.4.4
       adafruit/Adafruit Unified Sensor@^1.1.6
       knolleary/PubSubClient@^2.8
       bblanchon/ArduinoJson@^6.21.0
   ```

2. **編譯與上傳**
   ```bash
   pio run --target upload
   pio device monitor
   ```

## 除錯技巧

### 1. 串口除錯
```cpp
Serial.begin(115200);
Serial.println("除錯訊息");
Serial.printf("變數值: %d\n", value);
```

### 2. Wi-Fi 診斷
```cpp
Serial.print("RSSI: ");
Serial.println(WiFi.RSSI());
Serial.print("IP: ");
Serial.println(WiFi.localIP());
```

### 3. 記憶體監控
```cpp
Serial.print("Free Heap: ");
Serial.println(ESP.getFreeHeap());
```

### 4. 看門狗
```cpp
#include "esp_task_wdt.h"

void setup() {
    esp_task_wdt_init(30, true);  // 30秒超時
    esp_task_wdt_add(NULL);
}

void loop() {
    esp_task_wdt_reset();  // 餵狗
}
```

## 常見問題

**問題：上傳失敗**
- 檢查 USB 驅動程式
- 嘗試按住 BOOT 按鈕再上傳
- 檢查串口是否被其他程式佔用

**問題：Wi-Fi 無法連接**
- 確認 SSID 和密碼正確
- ESP32 只支援 2.4GHz Wi-Fi
- 檢查路由器設定

**問題：MQTT 連接失敗**
- 確認 Broker 位址正確
- 檢查網路連接
- 嘗試使用公共 Broker 測試

**問題：感測器讀取失敗**
- 檢查接線
- 確認電源電壓
- 增加延遲時間

## 進階功能

### OTA 更新
```cpp
#include <ArduinoOTA.h>

void setup() {
    ArduinoOTA.setHostname("esp32-smarthome");
    ArduinoOTA.begin();
}

void loop() {
    ArduinoOTA.handle();
}
```

### 深度睡眠
```cpp
// 睡眠 10 秒
esp_sleep_enable_timer_wakeup(10 * 1000000);
esp_deep_sleep_start();
```

### NVS 儲存
```cpp
#include <Preferences.h>

Preferences preferences;

void setup() {
    preferences.begin("my-app", false);
    int value = preferences.getInt("counter", 0);
    preferences.putInt("counter", value + 1);
    preferences.end();
}
```

## 學習資源

### 官方文件
- [ESP32 技術參考手冊](https://www.espressif.com/sites/default/files/documentation/esp32_technical_reference_manual_en.pdf)
- [ESP32 Arduino Core](https://github.com/espressif/arduino-esp32)
- [ESP-IDF 文件](https://docs.espressif.com/projects/esp-idf/)

### 推薦書籍
- "ESP32 Projects" by Agus Kurniawan
- "Internet of Things with ESP32" by Marco Schwartz

### 線上課程
- [ESP32 官方論壇](https://www.esp32.com/)
- [Random Nerd Tutorials](https://randomnerdtutorials.com/projects-esp32/)

## 授權

所有範例程式碼採用 MIT 授權。

---

**最後更新：** 2025-11-17
**維護者：** AI-Assisted Development Team
