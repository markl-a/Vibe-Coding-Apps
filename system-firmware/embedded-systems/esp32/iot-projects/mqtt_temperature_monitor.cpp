/**
 * ESP32 MQTT 溫度監控物聯網專案
 *
 * 功能：讀取溫濕度感測器並透過 MQTT 發布資料
 * 平台：ESP32
 * 框架：Arduino
 * 協議：MQTT
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Wi-Fi 設定
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT 伺服器設定
const char* mqtt_server = "broker.hivemq.com";  // 公開測試伺服器
const int mqtt_port = 1883;
const char* mqtt_client_id = "ESP32_TempMonitor";

// MQTT 主題
const char* topic_temperature = "home/bedroom/temperature";
const char* topic_humidity = "home/bedroom/humidity";
const char* topic_status = "home/bedroom/status";
const char* topic_control = "home/bedroom/control";

// DHT22 設定
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// LED 指示燈
#define LED_PIN 2

// MQTT 客戶端
WiFiClient espClient;
PubSubClient client(espClient);

// 發布間隔
unsigned long lastPublish = 0;
const long publishInterval = 10000;  // 10 秒

// 重連計數
int reconnectCount = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n=== ESP32 MQTT 溫度監控系統 ===");

    // 初始化 LED
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    // 初始化 DHT22
    Serial.println("初始化 DHT22 感測器...");
    dht.begin();

    // 連接 Wi-Fi
    setupWiFi();

    // 設定 MQTT
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(mqttCallback);

    Serial.println("系統就緒！");
}

void loop() {
    // 確保 MQTT 連接
    if (!client.connected()) {
        reconnectMQTT();
    }
    client.loop();

    // 定期發布感測器資料
    unsigned long now = millis();
    if (now - lastPublish >= publishInterval) {
        lastPublish = now;
        publishSensorData();
    }
}

void setupWiFi() {
    Serial.print("連接到 Wi-Fi: ");
    Serial.println(ssid);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWi-Fi 連接成功！");
        Serial.print("IP 位址: ");
        Serial.println(WiFi.localIP());
        Serial.print("訊號強度: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");
    } else {
        Serial.println("\nWi-Fi 連接失敗！");
    }
}

void reconnectMQTT() {
    while (!client.connected()) {
        Serial.print("嘗試 MQTT 連接... ");

        // 生成唯一的客戶端 ID
        String clientId = String(mqtt_client_id) + "_" + String(random(0xffff), HEX);

        if (client.connect(clientId.c_str())) {
            Serial.println("已連接！");
            reconnectCount = 0;

            // 發布上線訊息
            client.publish(topic_status, "online", true);

            // 訂閱控制主題
            client.subscribe(topic_control);
            Serial.println("已訂閱控制主題");

            // LED 常亮表示已連接
            digitalWrite(LED_PIN, HIGH);

        } else {
            Serial.print("失敗，rc=");
            Serial.print(client.state());
            Serial.println(" 5 秒後重試");

            reconnectCount++;
            if (reconnectCount > 10) {
                Serial.println("重連次數過多，重啟 ESP32");
                ESP.restart();
            }

            delay(5000);
        }
    }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    Serial.print("收到訊息 [");
    Serial.print(topic);
    Serial.print("]: ");

    String message;
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    Serial.println(message);

    // 處理控制命令
    if (String(topic) == topic_control) {
        handleControlCommand(message);
    }
}

void handleControlCommand(String command) {
    if (command == "LED_ON") {
        digitalWrite(LED_PIN, HIGH);
        Serial.println("LED 已開啟");
        client.publish(topic_status, "LED ON");
    }
    else if (command == "LED_OFF") {
        digitalWrite(LED_PIN, LOW);
        Serial.println("LED 已關閉");
        client.publish(topic_status, "LED OFF");
    }
    else if (command == "READ") {
        Serial.println("立即讀取感測器");
        publishSensorData();
    }
    else if (command == "RESTART") {
        Serial.println("重啟 ESP32");
        client.publish(topic_status, "Restarting...");
        delay(1000);
        ESP.restart();
    }
}

void publishSensorData() {
    // 讀取感測器
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
        Serial.println("❌ 讀取感測器失敗");
        client.publish(topic_status, "Sensor read error");
        return;
    }

    // 顯示讀數
    Serial.println("━━━━━━━━━━━━━━━━━━━━");
    Serial.print("溫度: ");
    Serial.print(temperature);
    Serial.println(" °C");
    Serial.print("濕度: ");
    Serial.print(humidity);
    Serial.println(" %");

    // 發布溫度
    char tempStr[8];
    dtostrf(temperature, 1, 2, tempStr);
    client.publish(topic_temperature, tempStr);
    Serial.print("已發布溫度: ");
    Serial.println(tempStr);

    // 發布濕度
    char humStr[8];
    dtostrf(humidity, 1, 2, humStr);
    client.publish(topic_humidity, humStr);
    Serial.print("已發布濕度: ");
    Serial.println(humStr);

    // 發布 JSON 格式的完整資料
    publishJsonData(temperature, humidity);

    // LED 閃爍表示已發布
    digitalWrite(LED_PIN, LOW);
    delay(100);
    digitalWrite(LED_PIN, HIGH);
}

void publishJsonData(float temp, float hum) {
    // 建立 JSON 文檔
    StaticJsonDocument<200> doc;

    doc["device"] = mqtt_client_id;
    doc["temperature"] = round(temp * 100) / 100.0;
    doc["humidity"] = round(hum * 100) / 100.0;
    doc["timestamp"] = millis() / 1000;
    doc["rssi"] = WiFi.RSSI();

    // 序列化 JSON
    char jsonBuffer[200];
    serializeJson(doc, jsonBuffer);

    // 發布 JSON 資料
    const char* topic_json = "home/bedroom/data";
    client.publish(topic_json, jsonBuffer);

    Serial.print("已發布 JSON: ");
    Serial.println(jsonBuffer);
    Serial.println();
}
