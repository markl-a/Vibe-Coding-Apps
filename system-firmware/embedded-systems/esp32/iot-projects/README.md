# ESP32 物聯網專案範例

這個專案包含實用的 ESP32 物聯網應用範例。

## 📋 專案列表

### 1. MQTT 溫度監控系統 (mqtt_temperature_monitor.cpp)

建立一個完整的 MQTT 溫度監控系統，可以遠端監控溫濕度並控制設備。

**功能：**
- Wi-Fi 連接
- MQTT 連接與通訊
- 定期發布溫濕度資料
- 遠端控制命令處理
- JSON 格式資料傳輸
- 自動重連機制

**MQTT 主題：**
```
home/bedroom/temperature  - 溫度資料
home/bedroom/humidity     - 濕度資料
home/bedroom/status       - 狀態訊息
home/bedroom/control      - 控制命令
home/bedroom/data         - JSON 格式完整資料
```

**支援的控制命令：**
- `LED_ON` - 開啟 LED
- `LED_OFF` - 關閉 LED
- `READ` - 立即讀取感測器
- `RESTART` - 重啟 ESP32

### 2. Web Server 控制面板 (web_server.cpp)

建立一個美觀的 Web 控制面板，透過瀏覽器控制 ESP32。

**功能：**
- 響應式 Web 介面
- 即時顯示溫濕度
- LED 控制按鈕
- RESTful API
- 自動資料更新
- 系統資訊顯示

**API 端點：**
```
GET  /                 - 控制面板首頁
GET  /api/sensor       - 獲取感測器資料
GET  /api/led1/on      - 開啟 LED1
GET  /api/led1/off     - 關閉 LED1
GET  /api/led2/on      - 開啟 LED2
GET  /api/led2/off     - 關閉 LED2
GET  /api/status       - 獲取系統狀態
```

## 🛠️ 硬體需求

- ESP32 開發板
- DHT22 溫濕度感測器
- LED x 2（或使用內建 LED）
- USB 資料線
- 麵包板和跳線

## 📦 軟體需求

### Arduino IDE

安裝以下函式庫：
- PubSubClient（MQTT）
- ArduinoJson
- DHT sensor library
- WebServer（ESP32 內建）

### PlatformIO

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps =
    knolleary/PubSubClient
    bblanchon/ArduinoJson
    adafruit/DHT sensor library
```

## 🚀 快速開始

### MQTT 專案

#### 1. 修改配置
```cpp
const char* ssid = "你的WiFi名稱";
const char* password = "你的WiFi密碼";
const char* mqtt_server = "broker.hivemq.com";  // 或其他 MQTT Broker
```

#### 2. 上傳程式
- 連接 ESP32
- 選擇正確的開發板和埠
- 上傳程式

#### 3. 測試 MQTT 通訊

使用 MQTT 客戶端測試（如 MQTT Explorer、mosquitto）：

**訂閱主題以接收資料：**
```bash
mosquitto_sub -h broker.hivemq.com -t "home/bedroom/#"
```

**發送控制命令：**
```bash
mosquitto_pub -h broker.hivemq.com -t "home/bedroom/control" -m "LED_ON"
mosquitto_pub -h broker.hivemq.com -t "home/bedroom/control" -m "LED_OFF"
mosquitto_pub -h broker.hivemq.com -t "home/bedroom/control" -m "READ"
```

### Web Server 專案

#### 1. 修改配置
```cpp
const char* ssid = "你的WiFi名稱";
const char* password = "你的WiFi密碼";
```

#### 2. 上傳程式並獲取 IP
- 上傳程式到 ESP32
- 開啟序列埠監控視窗
- 記下顯示的 IP 位址

#### 3. 訪問控制面板
- 在瀏覽器中輸入 ESP32 的 IP 位址
- 例如：`http://192.168.1.100`
- 享受控制面板！

## 📊 輸出範例

### MQTT 專案輸出
```
=== ESP32 MQTT 溫度監控系統 ===
初始化 DHT22 感測器...
連接到 Wi-Fi: MyWiFi
......
Wi-Fi 連接成功！
IP 位址: 192.168.1.100
訊號強度: -45 dBm
嘗試 MQTT 連接... 已連接！
已訂閱控制主題
━━━━━━━━━━━━━━━━━━━━
溫度: 25.30 °C
濕度: 55.20 %
已發布溫度: 25.30
已發布濕度: 55.20
已發布 JSON: {"device":"ESP32_TempMonitor","temperature":25.3,"humidity":55.2,"timestamp":15,"rssi":-45}
```

### Web Server 專案輸出
```
=== ESP32 Web Server 物聯網專案 ===
連接到 Wi-Fi: MyWiFi
.....
Wi-Fi 連接成功！
IP 位址: 192.168.1.100
HTTP 伺服器已啟動
請訪問: http://192.168.1.100
```

## 🔧 接線圖

### 基本接線
```
DHT22:
  VCC  -> ESP32 3.3V
  DATA -> ESP32 GPIO4
  GND  -> ESP32 GND

LED1:
  + -> ESP32 GPIO2 -> 220Ω 電阻
  - -> GND

LED2:
  + -> ESP32 GPIO15 -> 220Ω 電阻
  - -> GND
```

## 🌐 MQTT Broker 選項

### 公開測試 Broker
- **HiveMQ**: broker.hivemq.com
- **Eclipse**: mqtt.eclipseprojects.io
- **Mosquitto**: test.mosquitto.org

### 自架 Broker
```bash
# 安裝 Mosquitto (Ubuntu/Debian)
sudo apt-get install mosquitto mosquitto-clients

# 啟動服務
sudo systemctl start mosquitto

# 使用本地 Broker
const char* mqtt_server = "192.168.1.X";  // 你的伺服器 IP
```

### 雲端服務
- **AWS IoT Core**
- **Azure IoT Hub**
- **Google Cloud IoT**
- **CloudMQTT**

## 📱 手機控制

### MQTT 控制 App
- **Android**: MQTT Dash, IoT MQTT Panel
- **iOS**: MQTTool, MQTT Explorer

### Web 控制
- 直接在手機瀏覽器訪問 ESP32 IP
- 響應式設計，自動適應螢幕

## 📚 進階應用

### 資料持久化
```cpp
// 使用 SPIFFS 儲存資料
#include <SPIFFS.h>

void saveData(float temp, float hum) {
    File file = SPIFFS.open("/data.txt", FILE_APPEND);
    if (file) {
        file.printf("%.2f,%.2f,%lu\n", temp, hum, millis());
        file.close();
    }
}
```

### OTA 更新
```cpp
#include <ArduinoOTA.h>

void setup() {
    // ... 其他設定
    ArduinoOTA.begin();
}

void loop() {
    ArduinoOTA.handle();
    // ... 其他程式碼
}
```

### 整合 Home Assistant
```yaml
# configuration.yaml
sensor:
  - platform: mqtt
    name: "Bedroom Temperature"
    state_topic: "home/bedroom/temperature"
    unit_of_measurement: "°C"

  - platform: mqtt
    name: "Bedroom Humidity"
    state_topic: "home/bedroom/humidity"
    unit_of_measurement: "%"
```

## 🔍 故障排除

### MQTT 連接失敗
1. 檢查 Broker 位址和埠
2. 確認防火牆設定
3. 測試 Broker 是否在線
4. 檢查客戶端 ID 是否衝突

### Web Server 無法訪問
1. 確認 ESP32 和電腦在同一網路
2. 檢查防火牆設定
3. 確認 IP 位址正確
4. 嘗試重啟路由器

### 感測器無資料
1. 檢查接線
2. 確認感測器型號
3. 檢查電源穩定性
4. 延長讀取間隔

## 🔐 安全性建議

1. **不要在程式碼中硬編碼密碼**
   - 使用配置文件
   - 實作 Wi-Fi 配置介面

2. **使用 MQTT 認證**
   ```cpp
   client.connect(clientId, "username", "password");
   ```

3. **啟用 SSL/TLS**
   ```cpp
   WiFiClientSecure espClient;
   // 設定憑證
   ```

4. **Web Server 認證**
   ```cpp
   if (!server.authenticate("admin", "password")) {
       return server.requestAuthentication();
   }
   ```

## 🔗 相關資源

- [PubSubClient 文檔](https://pubsubclient.knolleary.net/)
- [ArduinoJson 文檔](https://arduinojson.org/)
- [MQTT 協議規範](https://mqtt.org/)
- [ESP32 Web Server 教程](https://randomnerdtutorials.com/esp32-web-server-arduino-ide/)

## 📄 授權

MIT License
