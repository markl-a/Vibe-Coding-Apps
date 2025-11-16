/**
 * ESP32 Wi-Fi Station 模式範例
 *
 * 功能：連接到指定的 Wi-Fi 網路並顯示 IP 位址
 * 平台：ESP32
 * 框架：Arduino
 */

#include <WiFi.h>

// Wi-Fi 認證資訊
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// 連接超時設定（毫秒）
const unsigned long CONNECT_TIMEOUT = 10000;

void setup() {
    Serial.begin(115200);
    delay(10);

    Serial.println("\n\n=== ESP32 Wi-Fi Station 範例 ===");
    Serial.print("正在連接到: ");
    Serial.println(ssid);

    // 設定 Wi-Fi 模式為 Station
    WiFi.mode(WIFI_STA);

    // 開始連接
    WiFi.begin(ssid, password);

    // 等待連接
    unsigned long startAttemptTime = millis();

    while (WiFi.status() != WL_CONNECTED &&
           millis() - startAttemptTime < CONNECT_TIMEOUT) {
        delay(500);
        Serial.print(".");
    }

    // 檢查連接狀態
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n連接成功！");
        printConnectionInfo();
    } else {
        Serial.println("\n連接失敗！");
        Serial.println("請檢查：");
        Serial.println("1. SSID 和密碼是否正確");
        Serial.println("2. 路由器是否正常運作");
        Serial.println("3. ESP32 是否在路由器訊號範圍內");
    }
}

void loop() {
    // 監控連接狀態
    static unsigned long lastCheck = 0;
    unsigned long now = millis();

    if (now - lastCheck >= 10000) {  // 每 10 秒檢查一次
        lastCheck = now;

        if (WiFi.status() == WL_CONNECTED) {
            Serial.print("連接正常 - RSSI: ");
            Serial.print(WiFi.RSSI());
            Serial.println(" dBm");
        } else {
            Serial.println("連接中斷，嘗試重新連接...");
            WiFi.reconnect();
        }
    }

    delay(100);
}

void printConnectionInfo() {
    Serial.println("\n=== 連接資訊 ===");
    Serial.print("IP 位址: ");
    Serial.println(WiFi.localIP());
    Serial.print("子網路遮罩: ");
    Serial.println(WiFi.subnetMask());
    Serial.print("閘道器: ");
    Serial.println(WiFi.gatewayIP());
    Serial.print("DNS: ");
    Serial.println(WiFi.dnsIP());
    Serial.print("MAC 位址: ");
    Serial.println(WiFi.macAddress());
    Serial.print("訊號強度 (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    Serial.println("================\n");
}
