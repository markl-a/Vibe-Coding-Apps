# ESP32 藍牙範例專案

這個專案包含 ESP32 藍牙低功耗（BLE）功能的實用範例。

## 📋 專案列表

### 1. BLE Server (ble_server.cpp)
建立藍牙 BLE 伺服器

**功能：**
- 建立 BLE GATT 伺服器
- 廣播 BLE 服務
- 處理客戶端連接
- 發送通知給連接的客戶端
- 接收客戶端寫入的資料

**特性：**
- 自動重新廣播（斷線後）
- 連接狀態監控
- 讀取/寫入/通知支援

### 2. BLE Client (ble_client.cpp)
掃描並連接到 BLE 伺服器

**功能：**
- 掃描附近的 BLE 裝置
- 連接到指定的 BLE 伺服器
- 讀取特徵值
- 寫入資料到伺服器
- 接收伺服器通知

**特性：**
- 自動重新掃描（斷線後）
- UUID 過濾
- 通知處理

## 🛠️ 硬體需求

- ESP32 開發板 x 2（一個當 Server，一個當 Client）
- USB 資料線
- 電腦（用於程式上傳）

## 📦 軟體需求

### Arduino IDE
1. 安裝 ESP32 開發板支援
2. 確認已安裝 BLE 函式庫（ESP32 內建）

### PlatformIO
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps =
    ESP32 BLE Arduino
```

## 🚀 快速開始

### 步驟 1: 上傳 BLE Server
1. 開啟 `ble_server.cpp`
2. 上傳到第一個 ESP32
3. 開啟序列埠監控視窗（115200 baud）
4. 確認看到 "BLE 伺服器已啟動！"

### 步驟 2: 上傳 BLE Client
1. 開啟 `ble_client.cpp`
2. 上傳到第二個 ESP32
3. 開啟序列埠監控視窗（115200 baud）
4. 應該會自動掃描並連接到 Server

### 步驟 3: 觀察通訊
- Server 會每秒發送遞增的數值
- Client 會接收並顯示這些通知
- Client 每 5 秒會寫入資料到 Server

## 📊 輸出範例

### BLE Server 輸出
```
=== ESP32 BLE Server 範例 ===
正在初始化 BLE...
BLE 伺服器已啟動！
裝置名稱: ESP32-BLE-Server
等待客戶端連接...
客戶端已連接
已發送通知，值: 1
已發送通知，值: 2
接收到資料: Hello from Client at 15234
已發送通知，值: 3
```

### BLE Client 輸出
```
=== ESP32 BLE Client 範例 ===
正在初始化 BLE...
開始掃描 BLE 裝置...
找到 BLE 裝置: Name: ESP32-BLE-Server
找到目標裝置！
正在連接到裝置: 24:0a:c4:xx:xx:xx
 - 已建立客戶端
 - 已連接到伺服器
 - 已找到服務
 - 已找到特徵
特徵值: 0
 - 已註冊通知
成功連接到 BLE 伺服器
收到通知，值: 01 00 00 00
寫入新值: Hello from Client at 15234
收到通知，值: 02 00 00 00
```

## 🔍 使用手機測試

### Android
使用 "nRF Connect" App：
1. 安裝 nRF Connect
2. 掃描附近的裝置
3. 找到 "ESP32-BLE-Server"
4. 連接並查看服務和特徵
5. 啟用通知以接收資料

### iOS
使用 "LightBlue" App：
1. 安裝 LightBlue
2. 掃描附近的裝置
3. 找到 "ESP32-BLE-Server"
4. 連接並查看 GATT 服務
5. 訂閱通知

## 🎯 UUID 說明

### Service UUID
```
4fafc201-1fb5-459e-8fcc-c5c9c331914b
```

### Characteristic UUID
```
beb5483e-36e1-4688-b7f5-ea07361b26a8
```

這些是自訂的 UUID，您可以使用線上 UUID 生成器建立自己的 UUID：
- https://www.uuidgenerator.net/

## 🔧 自訂化

### 修改裝置名稱
```cpp
BLEDevice::init("您的裝置名稱");
```

### 修改通知間隔
```cpp
delay(1000);  // 改為您想要的毫秒數
```

### 添加更多特徵
```cpp
BLECharacteristic *pCharacteristic2 = pService->createCharacteristic(
    CHARACTERISTIC_UUID_2,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE
);
```

## 📚 進階應用

- 建立複雜的 GATT 服務結構
- 實作安全連接（配對）
- 使用 BLE Beacon
- 建立 BLE Mesh 網路
- 實作 Nordic UART Service (NUS)
- 低功耗模式整合

## 🔍 故障排除

### 找不到裝置
1. 確認 UUID 正確
2. 檢查 BLE 是否已啟用
3. 重啟兩個 ESP32
4. 減少 ESP32 之間的距離

### 連接失敗
1. 檢查是否有其他裝置已連接
2. 確認韌體版本相容
3. 查看序列埠的錯誤訊息

### 通知未收到
1. 確認已註冊通知
2. 檢查特徵屬性是否包含 NOTIFY
3. 確認已添加 BLE2902 描述符

## 📖 BLE 基礎概念

### GATT (Generic Attribute Profile)
- **Service**: 服務，包含一組相關的特徵
- **Characteristic**: 特徵，實際的資料容器
- **Descriptor**: 描述符，描述特徵的額外資訊

### 角色
- **Server**: 廣播服務並提供資料
- **Client**: 掃描並連接到伺服器

### 屬性
- **Read**: 可讀取
- **Write**: 可寫入
- **Notify**: 可通知（單向）
- **Indicate**: 可指示（需確認）

## 🔗 相關資源

- [ESP32 BLE Arduino 文檔](https://github.com/nkolban/ESP32_BLE_Arduino)
- [藍牙 SIG 官網](https://www.bluetooth.com/)
- [GATT 規範](https://www.bluetooth.com/specifications/gatt/)
- [nRF Connect App](https://www.nordicsemi.com/Products/Development-tools/nRF-Connect-for-mobile)

## 📄 授權

MIT License
