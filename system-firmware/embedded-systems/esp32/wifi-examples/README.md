# ESP32 Wi-Fi 範例專案

這個專案包含 ESP32 Wi-Fi 功能的實用範例。

## 📋 專案列表

### 1. Wi-Fi Station 模式 (wifi_station.cpp)
連接到現有的 Wi-Fi 網路

**功能：**
- 連接到指定的 Wi-Fi AP
- 顯示網路連接資訊
- 監控連接狀態
- 自動重新連接

**使用方法：**
```cpp
// 修改以下變數
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. Wi-Fi Access Point 模式 (wifi_ap.cpp)
建立 Wi-Fi 熱點

**功能：**
- 建立自己的 Wi-Fi 熱點
- 允許其他裝置連接
- 監控連接的客戶端數量
- 自訂 IP 位址配置

**預設設定：**
- SSID: ESP32-AP
- 密碼: 12345678
- IP: 192.168.4.1

## 🛠️ 硬體需求

- ESP32 開發板（任何型號）
- USB 資料線
- 電腦（用於程式上傳）

## 📦 軟體需求

### Arduino IDE
1. 安裝 Arduino IDE
2. 安裝 ESP32 開發板支援
   - 在 Arduino IDE 中，開啟「檔案」>「偏好設定」
   - 在「額外的開發板管理員網址」中加入：
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - 開啟「工具」>「開發板」>「開發板管理員」
   - 搜尋「ESP32」並安裝

### PlatformIO
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
```

## 🚀 快速開始

### 使用 Arduino IDE

1. 開啟範例檔案（.cpp）
2. 修改 Wi-Fi 認證資訊
3. 選擇正確的開發板：「工具」>「開發板」>「ESP32 Dev Module」
4. 選擇正確的連接埠
5. 按下「上傳」按鈕
6. 開啟序列埠監控視窗（115200 baud）

### 使用 PlatformIO

1. 建立新專案
2. 複製程式碼到 `src/main.cpp`
3. 執行 `pio run -t upload`
4. 執行 `pio device monitor` 查看輸出

## 📊 輸出範例

### Station 模式
```
=== ESP32 Wi-Fi Station 範例 ===
正在連接到: MyWiFi
.....
連接成功！

=== 連接資訊 ===
IP 位址: 192.168.1.100
子網路遮罩: 255.255.255.0
閘道器: 192.168.1.1
DNS: 192.168.1.1
MAC 位址: 24:0A:C4:XX:XX:XX
訊號強度 (RSSI): -45 dBm
================
```

### AP 模式
```
=== ESP32 Access Point 範例 ===
正在建立 AP: ESP32-AP
AP 建立成功！

=== AP 資訊 ===
SSID: ESP32-AP
IP 位址: 192.168.4.1
MAC 位址: 24:0A:C4:XX:XX:XX
================

客戶端可以使用以下資訊連接：
  SSID: ESP32-AP
  密碼: 12345678

連接的客戶端數量: 1
```

## 🔍 故障排除

### 連接失敗
1. 檢查 SSID 和密碼是否正確
2. 確認路由器支援 2.4GHz（ESP32 不支援 5GHz）
3. 檢查訊號強度
4. 重啟 ESP32 和路由器

### 編譯錯誤
1. 確認已安裝 ESP32 開發板支援
2. 檢查 Arduino 函式庫版本
3. 清除快取重新編譯

## 📚 進階應用

- 結合 Web Server 建立配置介面
- 使用 mDNS 進行裝置發現
- 實作 SmartConfig 或 WPS
- OTA (Over-The-Air) 韌體更新
- Wi-Fi 掃描功能

## 🔗 相關資源

- [ESP32 Arduino 核心文檔](https://docs.espressif.com/projects/arduino-esp32/)
- [ESP32 Wi-Fi API 參考](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/network/esp_wifi.html)
- [ESP32 技術規格](https://www.espressif.com/en/products/socs/esp32)

## 📄 授權

MIT License
