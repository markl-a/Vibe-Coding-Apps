# ESP32 感測器範例專案

這個專案包含各種常用感測器的 ESP32 範例程式。

## 📋 專案列表

### 1. DHT22 溫濕度感測器 (dht22_sensor.cpp)

**功能：**
- 讀取溫度（攝氏/華氏）
- 讀取相對濕度
- 計算體感溫度
- 溫濕度警告
- 舒適度評估

**接線：**
```
DHT22 VCC  -> ESP32 3.3V
DHT22 DATA -> ESP32 GPIO4
DHT22 GND  -> ESP32 GND
```

**所需函式庫：**
- DHT sensor library by Adafruit

### 2. BME280 環境感測器 (bme280_sensor.cpp)

**功能：**
- 讀取溫度
- 讀取濕度
- 讀取大氣壓力
- 計算海拔高度
- 天氣預測
- 統計資料

**接線：**
```
BME280 VCC -> ESP32 3.3V
BME280 GND -> ESP32 GND
BME280 SDA -> ESP32 GPIO21
BME280 SCL -> ESP32 GPIO22
```

**所需函式庫：**
- Adafruit BME280 Library
- Adafruit Unified Sensor

## 🛠️ 硬體需求

### 基本需求
- ESP32 開發板
- USB 資料線
- 麵包板
- 杜邦線

### 感測器

#### DHT22 (AM2302)
- **價格：** ¥15-30
- **精度：** ±0.5°C, ±2%RH
- **範圍：** -40~80°C, 0-100%RH

#### BME280
- **價格：** ¥20-40
- **精度：** ±1°C, ±3%RH, ±1hPa
- **範圍：** -40~85°C, 0-100%RH, 300-1100hPa
- **額外功能：** 氣壓測量

## 📦 軟體需求

### Arduino IDE

1. 安裝必要的函式庫：
   - 開啟「工具」>「管理函式庫」
   - 搜尋並安裝：
     - DHT sensor library
     - Adafruit BME280 Library
     - Adafruit Unified Sensor

### PlatformIO

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps =
    adafruit/DHT sensor library
    adafruit/Adafruit BME280 Library
    adafruit/Adafruit Unified Sensor
```

## 🚀 快速開始

### DHT22 範例

1. 按照接線圖連接 DHT22
2. 開啟 `dht22_sensor.cpp`
3. 確認接腳定義：
   ```cpp
   #define DHTPIN 4  // 根據實際接線修改
   ```
4. 上傳程式
5. 開啟序列埠監控視窗（115200 baud）

### BME280 範例

1. 按照接線圖連接 BME280
2. 開啟 `bme280_sensor.cpp`
3. 確認 I2C 位址（使用 I2C 掃描器確認）：
   ```cpp
   #define BME280_ADDRESS 0x76  // 或 0x77
   ```
4. 上傳程式
5. 開啟序列埠監控視窗（115200 baud）

## 📊 輸出範例

### DHT22 輸出
```
=== ESP32 DHT22 溫濕度感測器範例 ===
正在初始化 DHT22 感測器...
DHT22 已就緒！
每 2 秒讀取一次感測器資料

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
時間: 5 秒
🌡️  溫度: 25.30 °C (77.54 °F)
💧 濕度: 55.20 %
🔥 體感溫度: 25.89 °C (78.60 °F)
😊 舒適度: 非常舒適
```

### BME280 輸出
```
=== ESP32 BME280 環境感測器範例 ===
正在初始化 BME280...
✅ BME280 初始化成功！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  時間: 5 秒
🌡️  溫度: 24.87 °C
💧 濕度: 52.34 %
📊 氣壓: 1013.25 hPa
⛰️  海拔: 12.45 公尺
🌦️  天氣預測: 正常氣壓 - 晴朗
```

## 🔍 故障排除

### DHT22 問題

#### 讀取失敗
- 檢查接線，特別是資料線
- 確認電源穩定（建議使用 10K 上拉電阻）
- DHT22 需要 2 秒的初始化時間
- 最小讀取間隔為 2 秒

#### 數值異常
- 感測器可能損壞
- 環境溫度超出範圍
- 電源不穩定

### BME280 問題

#### 找不到感測器
1. 使用 I2C 掃描器確認位址：
   ```cpp
   Wire.begin();
   Wire.beginTransmission(0x76);
   if (Wire.endTransmission() == 0) {
       Serial.println("Found at 0x76");
   }
   ```
2. 檢查 SDA/SCL 接線
3. 確認電源連接

#### 數值不準確
- 等待感測器穩定（約 1 分鐘）
- 校準海平面氣壓值
- 檢查焊接品質

## 🎯 I2C 位址掃描程式

```cpp
#include <Wire.h>

void setup() {
    Serial.begin(115200);
    Wire.begin();
    Serial.println("\nI2C Scanner");
}

void loop() {
    byte error, address;
    int nDevices = 0;

    Serial.println("Scanning...");

    for(address = 1; address < 127; address++ ) {
        Wire.beginTransmission(address);
        error = Wire.endTransmission();

        if (error == 0) {
            Serial.print("Device found at 0x");
            if (address<16) Serial.print("0");
            Serial.println(address,HEX);
            nDevices++;
        }
    }

    if (nDevices == 0)
        Serial.println("No devices found\n");
    else
        Serial.println("done\n");

    delay(5000);
}
```

## 📚 進階應用

### 資料記錄
- 使用 SD 卡記錄歷史資料
- 上傳到雲端伺服器
- 建立本地資料庫

### 視覺化
- Web 介面顯示即時數據
- 繪製溫濕度曲線圖
- 手機 App 監控

### 整合應用
- 智慧溫控系統
- 氣象站
- 溫室監控
- 空調自動控制

## 🔗 相關資源

### 文檔
- [DHT22 數據手冊](https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf)
- [BME280 數據手冊](https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf)

### 函式庫
- [Adafruit DHT Library](https://github.com/adafruit/DHT-sensor-library)
- [Adafruit BME280 Library](https://github.com/adafruit/Adafruit_BME280_Library)

### 購買連結
- [DHT22 on Adafruit](https://www.adafruit.com/product/385)
- [BME280 on SparkFun](https://www.sparkfun.com/products/13676)

## 📄 授權

MIT License
