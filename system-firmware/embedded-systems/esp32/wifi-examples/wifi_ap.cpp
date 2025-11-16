/**
 * ESP32 Wi-Fi Access Point 模式範例
 *
 * 功能：建立 Wi-Fi 熱點並顯示連接的客戶端
 * 平台：ESP32
 * 框架：Arduino
 */

#include <WiFi.h>
#include <WiFiAP.h>

// AP 設定
const char* ap_ssid = "ESP32-AP";
const char* ap_password = "12345678";  // 至少 8 個字元

// 網路設定
IPAddress local_ip(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

void setup() {
    Serial.begin(115200);
    delay(10);

    Serial.println("\n\n=== ESP32 Access Point 範例 ===");

    // 設定 Wi-Fi AP
    Serial.print("正在建立 AP: ");
    Serial.println(ap_ssid);

    // 配置 AP
    WiFi.softAPConfig(local_ip, gateway, subnet);

    // 開啟 AP
    bool result = WiFi.softAP(ap_ssid, ap_password);

    if (result) {
        Serial.println("AP 建立成功！");
        printAPInfo();
    } else {
        Serial.println("AP 建立失敗！");
        return;
    }
}

void loop() {
    // 定期顯示連接的客戶端數量
    static unsigned long lastCheck = 0;
    static int lastClientCount = 0;
    unsigned long now = millis();

    if (now - lastCheck >= 5000) {  // 每 5 秒檢查一次
        lastCheck = now;

        int clientCount = WiFi.softAPgetStationNum();

        if (clientCount != lastClientCount) {
            lastClientCount = clientCount;
            Serial.print("連接的客戶端數量: ");
            Serial.println(clientCount);
        }
    }

    delay(100);
}

void printAPInfo() {
    Serial.println("\n=== AP 資訊 ===");
    Serial.print("SSID: ");
    Serial.println(ap_ssid);
    Serial.print("IP 位址: ");
    Serial.println(WiFi.softAPIP());
    Serial.print("MAC 位址: ");
    Serial.println(WiFi.softAPmacAddress());
    Serial.println("================\n");
    Serial.println("客戶端可以使用以下資訊連接：");
    Serial.print("  SSID: ");
    Serial.println(ap_ssid);
    Serial.print("  密碼: ");
    Serial.println(ap_password);
    Serial.println();
}
