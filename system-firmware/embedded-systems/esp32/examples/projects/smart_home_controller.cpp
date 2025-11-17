/**
 * ESP32 智能家居控制系統
 *
 * 功能：
 * - Wi-Fi 連接
 * - Web 伺服器控制介面
 * - MQTT 訊息訂閱/發布
 * - DHT22 溫濕度監控
 * - 繼電器控制（燈光、電器）
 * - 自動化規則（溫度觸發）
 *
 * 平台：ESP32
 * 框架：Arduino
 *
 * 硬體需求：
 * - ESP32 開發板
 * - DHT22 溫濕度感測器 (GPIO4)
 * - 繼電器模組 (GPIO25, GPIO26, GPIO27)
 * - LED 指示燈 (GPIO2)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Wi-Fi 設定
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT 設定
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_client_id = "ESP32_SmartHome";
const char* mqtt_topic_temp = "smarthome/temperature";
const char* mqtt_topic_humidity = "smarthome/humidity";
const char* mqtt_topic_control = "smarthome/control";

// 硬體腳位定義
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define LED_PIN 2
#define RELAY1_PIN 25  // 客廳燈
#define RELAY2_PIN 26  // 臥室燈
#define RELAY3_PIN 27  // 風扇

// 物件實例
DHT dht(DHT_PIN, DHT_TYPE);
WebServer server(80);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// 系統狀態
struct SystemState {
    float temperature;
    float humidity;
    bool relay1_state;  // 客廳燈
    bool relay2_state;  // 臥室燈
    bool relay3_state;  // 風扇
    bool auto_mode;     // 自動模式
    float auto_temp_threshold;  // 自動開風扇溫度
} state;

// 計時器
unsigned long lastSensorRead = 0;
unsigned long lastMqttPublish = 0;
const unsigned long sensorInterval = 2000;    // 2秒
const unsigned long mqttInterval = 5000;      // 5秒

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n╔══════════════════════════════════════════╗");
    Serial.println("║   ESP32 智能家居控制系統 v1.0            ║");
    Serial.println("╚══════════════════════════════════════════╝\n");

    // 初始化硬體
    initHardware();

    // 初始化系統狀態
    state.relay1_state = false;
    state.relay2_state = false;
    state.relay3_state = false;
    state.auto_mode = false;
    state.auto_temp_threshold = 28.0;

    // 連接 Wi-Fi
    connectWiFi();

    // 初始化 Web 伺服器
    initWebServer();

    // 連接 MQTT
    mqttClient.setServer(mqtt_server, mqtt_port);
    mqttClient.setCallback(mqttCallback);
    connectMQTT();

    // 啟動 DHT22
    dht.begin();

    Serial.println("\n✓ 系統啟動完成！");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.print("Web 介面: http://");
    Serial.println(WiFi.localIP());
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

void loop()
{
    // 處理 Web 請求
    server.handleClient();

    // 處理 MQTT
    if (!mqttClient.connected())
    {
        connectMQTT();
    }
    mqttClient.loop();

    // 讀取感測器
    unsigned long currentMillis = millis();
    if (currentMillis - lastSensorRead >= sensorInterval)
    {
        lastSensorRead = currentMillis;
        readSensors();
        autoControl();  // 自動控制邏輯
    }

    // 發布 MQTT 數據
    if (currentMillis - lastMqttPublish >= mqttInterval)
    {
        lastMqttPublish = currentMillis;
        publishSensorData();
    }

    // 更新 LED 指示（Wi-Fi 狀態）
    updateStatusLED();
}

/**
 * 初始化硬體
 */
void initHardware()
{
    // LED
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    // 繼電器
    pinMode(RELAY1_PIN, OUTPUT);
    pinMode(RELAY2_PIN, OUTPUT);
    pinMode(RELAY3_PIN, OUTPUT);

    // 初始狀態：全部關閉
    digitalWrite(RELAY1_PIN, LOW);
    digitalWrite(RELAY2_PIN, LOW);
    digitalWrite(RELAY3_PIN, LOW);

    Serial.println("✓ 硬體初始化完成");
}

/**
 * 連接 Wi-Fi
 */
void connectWiFi()
{
    Serial.print("正在連接 Wi-Fi: ");
    Serial.println(ssid);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20)
    {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("\n✓ Wi-Fi 連接成功！");
        Serial.print("IP 位址: ");
        Serial.println(WiFi.localIP());
    }
    else
    {
        Serial.println("\n❌ Wi-Fi 連接失敗！");
    }
}

/**
 * 連接 MQTT
 */
void connectMQTT()
{
    while (!mqttClient.connected())
    {
        Serial.print("正在連接 MQTT...");

        if (mqttClient.connect(mqtt_client_id))
        {
            Serial.println(" 成功！");

            // 訂閱控制主題
            mqttClient.subscribe(mqtt_topic_control);
            Serial.printf("已訂閱主題: %s\n", mqtt_topic_control);
        }
        else
        {
            Serial.print(" 失敗，狀態碼=");
            Serial.println(mqttClient.state());
            delay(5000);
        }
    }
}

/**
 * MQTT 回調函數
 */
void mqttCallback(char* topic, byte* payload, unsigned int length)
{
    Serial.print("收到 MQTT 訊息 [");
    Serial.print(topic);
    Serial.print("]: ");

    String message = "";
    for (unsigned int i = 0; i < length; i++)
    {
        message += (char)payload[i];
    }
    Serial.println(message);

    // 解析 JSON 命令
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, message);

    if (!error)
    {
        if (doc.containsKey("relay1"))
        {
            setRelay(1, doc["relay1"]);
        }
        if (doc.containsKey("relay2"))
        {
            setRelay(2, doc["relay2"]);
        }
        if (doc.containsKey("relay3"))
        {
            setRelay(3, doc["relay3"]);
        }
        if (doc.containsKey("auto_mode"))
        {
            state.auto_mode = doc["auto_mode"];
        }
    }
}

/**
 * 初始化 Web 伺服器
 */
void initWebServer()
{
    // 主頁
    server.on("/", handleRoot);

    // API 端點
    server.on("/api/status", handleAPIStatus);
    server.on("/api/control", HTTP_POST, handleAPIControl);

    server.begin();
    Serial.println("✓ Web 伺服器已啟動");
}

/**
 * Web 主頁處理
 */
void handleRoot()
{
    String html = "<!DOCTYPE html><html><head>";
    html += "<meta charset='UTF-8'>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
    html += "<title>智能家居控制</title>";
    html += "<style>";
    html += "body { font-family: Arial; margin: 20px; background: #f0f0f0; }";
    html += ".container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }";
    html += "h1 { color: #333; text-align: center; }";
    html += ".sensor { background: #e3f2fd; padding: 15px; margin: 10px 0; border-radius: 5px; }";
    html += ".control { background: #fff3e0; padding: 15px; margin: 10px 0; border-radius: 5px; }";
    html += "button { background: #2196F3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }";
    html += "button:hover { background: #0b7dda; }";
    html += ".status { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-left: 10px; }";
    html += ".on { background: #4caf50; }";
    html += ".off { background: #f44336; }";
    html += "</style></head><body>";
    html += "<div class='container'>";
    html += "<h1>🏠 智能家居控制系統</h1>";

    // 感測器數據
    html += "<div class='sensor'>";
    html += "<h2>📊 環境監控</h2>";
    html += "<p>🌡️ 溫度: <b>" + String(state.temperature, 1) + " °C</b></p>";
    html += "<p>💧 濕度: <b>" + String(state.humidity, 1) + " %</b></p>";
    html += "</div>";

    // 控制面板
    html += "<div class='control'>";
    html += "<h2>🎛️ 設備控制</h2>";

    html += "<p>客廳燈 <span class='status " + String(state.relay1_state ? "on" : "off") + "'></span></p>";
    html += "<button onclick=\"control(1, " + String(!state.relay1_state) + ")\">";
    html += state.relay1_state ? "關閉" : "開啟";
    html += "</button>";

    html += "<p>臥室燈 <span class='status " + String(state.relay2_state ? "on" : "off") + "'></span></p>";
    html += "<button onclick=\"control(2, " + String(!state.relay2_state) + ")\">";
    html += state.relay2_state ? "關閉" : "開啟";
    html += "</button>";

    html += "<p>風扇 <span class='status " + String(state.relay3_state ? "on" : "off") + "'></span></p>";
    html += "<button onclick=\"control(3, " + String(!state.relay3_state) + ")\">";
    html += state.relay3_state ? "關閉" : "開啟";
    html += "</button>";

    html += "<p>自動模式: <b>" + String(state.auto_mode ? "開啟" : "關閉") + "</b></p>";
    html += "<button onclick=\"toggleAuto()\">" + String(state.auto_mode ? "關閉自動" : "開啟自動") + "</button>";

    html += "</div></div>";

    // JavaScript
    html += "<script>";
    html += "function control(relay, state) {";
    html += "  fetch('/api/control', {";
    html += "    method: 'POST',";
    html += "    headers: {'Content-Type': 'application/json'},";
    html += "    body: JSON.stringify({relay: relay, state: state})";
    html += "  }).then(() => location.reload());";
    html += "}";
    html += "function toggleAuto() {";
    html += "  fetch('/api/control', {";
    html += "    method: 'POST',";
    html += "    headers: {'Content-Type': 'application/json'},";
    html += "    body: JSON.stringify({auto: !" + String(state.auto_mode) + "})";
    html += "  }).then(() => location.reload());";
    html += "}";
    html += "setTimeout(() => location.reload(), 10000);";  // 10秒自動刷新
    html += "</script>";

    html += "</body></html>";

    server.send(200, "text/html", html);
}

/**
 * API 狀態查詢
 */
void handleAPIStatus()
{
    DynamicJsonDocument doc(512);

    doc["temperature"] = state.temperature;
    doc["humidity"] = state.humidity;
    doc["relay1"] = state.relay1_state;
    doc["relay2"] = state.relay2_state;
    doc["relay3"] = state.relay3_state;
    doc["auto_mode"] = state.auto_mode;

    String json;
    serializeJson(doc, json);
    server.send(200, "application/json", json);
}

/**
 * API 控制處理
 */
void handleAPIControl()
{
    if (server.hasArg("plain"))
    {
        String body = server.arg("plain");
        DynamicJsonDocument doc(256);

        DeserializationError error = deserializeJson(doc, body);
        if (!error)
        {
            if (doc.containsKey("relay") && doc.containsKey("state"))
            {
                int relay = doc["relay"];
                bool state_val = doc["state"];
                setRelay(relay, state_val);
            }

            if (doc.containsKey("auto"))
            {
                state.auto_mode = doc["auto"];
            }

            server.send(200, "application/json", "{\"success\": true}");
            return;
        }
    }

    server.send(400, "application/json", "{\"success\": false}");
}

/**
 * 設定繼電器狀態
 */
void setRelay(int relay, bool state_val)
{
    switch (relay)
    {
        case 1:
            state.relay1_state = state_val;
            digitalWrite(RELAY1_PIN, state_val ? HIGH : LOW);
            Serial.printf("客廳燈: %s\n", state_val ? "開" : "關");
            break;
        case 2:
            state.relay2_state = state_val;
            digitalWrite(RELAY2_PIN, state_val ? HIGH : LOW);
            Serial.printf("臥室燈: %s\n", state_val ? "開" : "關");
            break;
        case 3:
            state.relay3_state = state_val;
            digitalWrite(RELAY3_PIN, state_val ? HIGH : LOW);
            Serial.printf("風扇: %s\n", state_val ? "開" : "關");
            break;
    }
}

/**
 * 讀取感測器
 */
void readSensors()
{
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (!isnan(h) && !isnan(t))
    {
        state.temperature = t;
        state.humidity = h;

        Serial.printf("溫度: %.1f°C | 濕度: %.1f%%\n", t, h);
    }
}

/**
 * 自動控制邏輯
 */
void autoControl()
{
    if (state.auto_mode)
    {
        // 溫度過高自動開風扇
        if (state.temperature > state.auto_temp_threshold && !state.relay3_state)
        {
            setRelay(3, true);
            Serial.println("🌡️ 溫度過高，自動開啟風扇");
        }
        // 溫度正常自動關風扇
        else if (state.temperature < state.auto_temp_threshold - 2 && state.relay3_state)
        {
            setRelay(3, false);
            Serial.println("🌡️ 溫度恢復正常，自動關閉風扇");
        }
    }
}

/**
 * 發布感測器數據到 MQTT
 */
void publishSensorData()
{
    if (mqttClient.connected())
    {
        char tempStr[8];
        char humStr[8];

        dtostrf(state.temperature, 4, 1, tempStr);
        dtostrf(state.humidity, 4, 1, humStr);

        mqttClient.publish(mqtt_topic_temp, tempStr);
        mqttClient.publish(mqtt_topic_humidity, humStr);
    }
}

/**
 * 更新狀態 LED
 */
void updateStatusLED()
{
    static unsigned long lastBlink = 0;
    static bool ledState = false;

    if (WiFi.status() == WL_CONNECTED)
    {
        // Wi-Fi 已連接：常亮
        digitalWrite(LED_PIN, HIGH);
    }
    else
    {
        // Wi-Fi 未連接：閃爍
        if (millis() - lastBlink > 500)
        {
            lastBlink = millis();
            ledState = !ledState;
            digitalWrite(LED_PIN, ledState);
        }
    }
}
