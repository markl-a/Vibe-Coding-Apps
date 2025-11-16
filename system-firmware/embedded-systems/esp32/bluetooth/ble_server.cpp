/**
 * ESP32 BLE Server 範例
 *
 * 功能：建立藍牙低功耗（BLE）伺服器並廣播服務
 * 平台：ESP32
 * 框架：Arduino
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// BLE 服務和特徵 UUID
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;
uint32_t value = 0;

// 伺服器回調
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        deviceConnected = true;
        Serial.println("客戶端已連接");
    }

    void onDisconnect(BLEServer* pServer) {
        deviceConnected = false;
        Serial.println("客戶端已斷開");
    }
};

// 特徵回調
class MyCharacteristicCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        std::string value = pCharacteristic->getValue();

        if (value.length() > 0) {
            Serial.print("接收到資料: ");
            for (int i = 0; i < value.length(); i++) {
                Serial.print(value[i]);
            }
            Serial.println();
        }
    }
};

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n=== ESP32 BLE Server 範例 ===");
    Serial.println("正在初始化 BLE...");

    // 建立 BLE 裝置
    BLEDevice::init("ESP32-BLE-Server");

    // 建立 BLE 伺服器
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    // 建立 BLE 服務
    BLEService *pService = pServer->createService(SERVICE_UUID);

    // 建立 BLE 特徵
    pCharacteristic = pService->createCharacteristic(
                        CHARACTERISTIC_UUID,
                        BLECharacteristic::PROPERTY_READ   |
                        BLECharacteristic::PROPERTY_WRITE  |
                        BLECharacteristic::PROPERTY_NOTIFY |
                        BLECharacteristic::PROPERTY_INDICATE
                      );

    // 設定特徵回調
    pCharacteristic->setCallbacks(new MyCharacteristicCallbacks());

    // 添加描述符（用於通知）
    pCharacteristic->addDescriptor(new BLE2902());

    // 啟動服務
    pService->start();

    // 開始廣播
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(false);
    pAdvertising->setMinPreferred(0x0);  // 設定 0x00，不指定偏好
    BLEDevice::startAdvertising();

    Serial.println("BLE 伺服器已啟動！");
    Serial.println("裝置名稱: ESP32-BLE-Server");
    Serial.println("等待客戶端連接...");
}

void loop() {
    // 通知連接的客戶端
    if (deviceConnected) {
        pCharacteristic->setValue((uint8_t*)&value, 4);
        pCharacteristic->notify();
        value++;

        Serial.print("已發送通知，值: ");
        Serial.println(value);

        delay(1000);  // 每秒發送一次通知
    }

    // 處理斷線重連
    if (!deviceConnected && oldDeviceConnected) {
        delay(500);  // 給藍牙堆疊時間準備
        pServer->startAdvertising();  // 重新開始廣播
        Serial.println("重新開始廣播");
        oldDeviceConnected = deviceConnected;
    }

    // 處理新連接
    if (deviceConnected && !oldDeviceConnected) {
        oldDeviceConnected = deviceConnected;
    }
}
