/**
 * ESP32 BLE Client 範例
 *
 * 功能：掃描並連接到 BLE 伺服器
 * 平台：ESP32
 * 框架：Arduino
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>

// 目標伺服器的 UUID（需與 BLE Server 相同）
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

static boolean doConnect = false;
static boolean connected = false;
static boolean doScan = false;
static BLERemoteCharacteristic* pRemoteCharacteristic;
static BLEAdvertisedDevice* myDevice;

// 通知回調函數
static void notifyCallback(
    BLERemoteCharacteristic* pBLERemoteCharacteristic,
    uint8_t* pData,
    size_t length,
    bool isNotify) {

    Serial.print("收到通知，值: ");
    for (int i = 0; i < length; i++) {
        Serial.print(pData[i], HEX);
        Serial.print(" ");
    }
    Serial.println();
}

// 連接到伺服器
bool connectToServer() {
    Serial.print("正在連接到裝置: ");
    Serial.println(myDevice->getAddress().toString().c_str());

    BLEClient* pClient = BLEDevice::createClient();
    Serial.println(" - 已建立客戶端");

    // 連接到遠端 BLE 伺服器
    pClient->connect(myDevice);
    Serial.println(" - 已連接到伺服器");

    // 取得服務參考
    BLERemoteService* pRemoteService = pClient->getService(SERVICE_UUID);
    if (pRemoteService == nullptr) {
        Serial.print("找不到服務 UUID: ");
        Serial.println(SERVICE_UUID);
        pClient->disconnect();
        return false;
    }
    Serial.println(" - 已找到服務");

    // 取得特徵參考
    pRemoteCharacteristic = pRemoteService->getCharacteristic(CHARACTERISTIC_UUID);
    if (pRemoteCharacteristic == nullptr) {
        Serial.print("找不到特徵 UUID: ");
        Serial.println(CHARACTERISTIC_UUID);
        pClient->disconnect();
        return false;
    }
    Serial.println(" - 已找到特徵");

    // 讀取特徵值
    if(pRemoteCharacteristic->canRead()) {
        std::string value = pRemoteCharacteristic->readValue();
        Serial.print("特徵值: ");
        Serial.println(value.c_str());
    }

    // 註冊通知
    if(pRemoteCharacteristic->canNotify()) {
        pRemoteCharacteristic->registerForNotify(notifyCallback);
        Serial.println(" - 已註冊通知");
    }

    connected = true;
    return true;
}

// 掃描回調
class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
        Serial.print("找到 BLE 裝置: ");
        Serial.println(advertisedDevice.toString().c_str());

        // 檢查是否為目標裝置
        if (advertisedDevice.haveServiceUUID() &&
            advertisedDevice.isAdvertisingService(BLEUUID(SERVICE_UUID))) {

            BLEDevice::getScan()->stop();
            myDevice = new BLEAdvertisedDevice(advertisedDevice);
            doConnect = true;
            doScan = true;
            Serial.println("找到目標裝置！");
        }
    }
};

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n=== ESP32 BLE Client 範例 ===");
    Serial.println("正在初始化 BLE...");

    BLEDevice::init("ESP32-BLE-Client");

    // 建立 BLE 掃描器
    BLEScan* pBLEScan = BLEDevice::getScan();
    pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
    pBLEScan->setInterval(1349);
    pBLEScan->setWindow(449);
    pBLEScan->setActiveScan(true);

    Serial.println("開始掃描 BLE 裝置...");
    pBLEScan->start(5, false);
}

void loop() {
    // 如果找到目標裝置，嘗試連接
    if (doConnect) {
        if (connectToServer()) {
            Serial.println("成功連接到 BLE 伺服器");
        } else {
            Serial.println("連接失敗");
        }
        doConnect = false;
    }

    // 如果已連接，可以在這裡讀取或寫入資料
    if (connected) {
        // 示範：每 5 秒寫入一次資料
        static unsigned long lastWrite = 0;
        if (millis() - lastWrite > 5000) {
            lastWrite = millis();

            String newValue = "Hello from Client at " + String(millis());
            Serial.print("寫入新值: ");
            Serial.println(newValue);

            pRemoteCharacteristic->writeValue(newValue.c_str(), newValue.length());
        }
    } else if (doScan) {
        // 如果斷線，重新掃描
        BLEDevice::getScan()->start(0);
    }

    delay(1000);
}
