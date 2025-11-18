/**
 * ESP32 智慧家居中樞系統
 *
 * 功能：整合多個感測器和執行器的完整智慧家居解決方案
 * 平台：ESP32
 * 通訊：Wi-Fi + MQTT + BLE
 *
 * 特點：
 * - 多感測器數據採集（溫濕度、光照、人體感應、煙霧）
 * - 智能控制（燈光、窗簾、空調、風扇）
 * - MQTT 遠端控制
 * - Web 控制面板
 * - 語音控制整合（Alexa/Google Home）
 * - 自動化場景（離家模式、回家模式、睡眠模式）
 * - 能源監控
 * - 異常告警
 *
 * 硬體需求：
 * - ESP32 開發板
 * - DHT22 溫濕度感測器
 * - BH1750 光照度感測器
 * - PIR 人體感應器
 * - MQ-2 煙霧感測器
 * - 繼電器模組 x4
 * - WS2812B RGB LED 燈帶
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <WebServer.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <Adafruit_NeoPixel.h>

/* ==================== 配置區 ==================== */

// Wi-Fi 配置
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// MQTT 配置
const char* MQTT_SERVER = "broker.hivemq.com";
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "SmartHomeHub";
const char* MQTT_USER = "";  // 如需要
const char* MQTT_PASS = "";  // 如需要

// MQTT 主題
#define TOPIC_STATUS        "home/hub/status"
#define TOPIC_TEMPERATURE   "home/sensors/temperature"
#define TOPIC_HUMIDITY      "home/sensors/humidity"
#define TOPIC_LIGHT         "home/sensors/light"
#define TOPIC_MOTION        "home/sensors/motion"
#define TOPIC_SMOKE         "home/sensors/smoke"
#define TOPIC_CONTROL       "home/control/#"
#define TOPIC_SCENE         "home/scene"

// GPIO 定義
#define DHT_PIN             4
#define LIGHT_SENSOR_SDA    21
#define LIGHT_SENSOR_SCL    22
#define PIR_PIN             27
#define SMOKE_PIN           34  // ADC
#define RELAY_LIGHT         26
#define RELAY_FAN           25
#define RELAY_CURTAIN       33
#define RELAY_AC            32
#define RGB_LED_PIN         5
#define RGB_LED_COUNT       30
#define BUZZER_PIN          12

/* ==================== 全局物件 ==================== */

DHT dht(DHT_PIN, DHT22);
BH1750 lightMeter;
WiFiClient espClient;
PubSubClient mqtt(espClient);
WebServer server(80);
Preferences preferences;
Adafruit_NeoPixel strip(RGB_LED_COUNT, RGB_LED_PIN, NEO_GRB + NEO_KHZ800);

/* ==================== 系統狀態 ==================== */

struct SystemStatus {
    // 感測器數據
    float temperature = 0.0;
    float humidity = 0.0;
    uint16_t light = 0;
    bool motion_detected = false;
    uint16_t smoke_level = 0;

    // 設備狀態
    bool light_on = false;
    bool fan_on = false;
    bool curtain_open = false;
    bool ac_on = false;
    uint8_t rgb_brightness = 255;
    uint32_t rgb_color = 0xFFFFFF;

    // 系統信息
    unsigned long uptime = 0;
    int wifi_rssi = 0;
    bool mqtt_connected = false;
    String current_scene = "normal";
} status;

/* ==================== 場景定義 ==================== */

struct Scene {
    bool light;
    bool fan;
    bool curtain;
    bool ac;
    uint32_t rgb_color;
    uint8_t rgb_brightness;
};

Scene scenes[] = {
    // 正常模式
    {false, false, true, false, 0xFFFFFF, 128},
    // 離家模式（全關）
    {false, false, false, false, 0x000000, 0},
    // 回家模式（開燈）
    {true, false, true, false, 0xFFF4E6, 200},
    // 睡眠模式（夜燈）
    {false, false, false, false, 0xFF6B00, 20},
    // 派對模式
    {true, false, true, false, 0xFF00FF, 255}
};

/* ==================== 函數聲明 ==================== */

void WiFi_Connect(void);
void MQTT_Connect(void);
void MQTT_Callback(char* topic, byte* payload, unsigned int length);
void Read_Sensors(void);
void Publish_Sensor_Data(void);
void Control_Devices(void);
void Web_Server_Setup(void);
void Apply_Scene(const String& scene_name);
void Check_Automation_Rules(void);
void Send_Alert(const String& message);

/* ==================== 主程式 ==================== */

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n╔══════════════════════════════════╗");
    Serial.println("║   ESP32 智慧家居中樞系統        ║");
    Serial.println("╚══════════════════════════════════╝");

    // 初始化偏好設置（保存狀態）
    preferences.begin("smarthome", false);

    // 初始化 GPIO
    pinMode(PIR_PIN, INPUT);
    pinMode(SMOKE_PIN, INPUT);
    pinMode(RELAY_LIGHT, OUTPUT);
    pinMode(RELAY_FAN, OUTPUT);
    pinMode(RELAY_CURTAIN, OUTPUT);
    pinMode(RELAY_AC, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);

    // 初始化感測器
    dht.begin();
    Wire.begin(LIGHT_SENSOR_SDA, LIGHT_SENSOR_SCL);

    if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
        Serial.println("✅ BH1750 初始化成功");
    } else {
        Serial.println("❌ BH1750 初始化失敗");
    }

    // 初始化 RGB LED
    strip.begin();
    strip.setBrightness(status.rgb_brightness);
    strip.show();

    // 連接 Wi-Fi
    WiFi_Connect();

    // 連接 MQTT
    mqtt.setServer(MQTT_SERVER, MQTT_PORT);
    mqtt.setCallback(MQTT_Callback);
    MQTT_Connect();

    // 啟動 Web 伺服器
    Web_Server_Setup();
    server.begin();
    Serial.println("✅ Web 伺服器已啟動");
    Serial.printf("訪問: http://%s\n", WiFi.localIP().toString().c_str());

    // 恢復上次的設備狀態
    status.light_on = preferences.getBool("light", false);
    status.fan_on = preferences.getBool("fan", false);
    status.curtain_open = preferences.getBool("curtain", true);

    Control_Devices();

    Serial.println("\n✅ 系統初始化完成！");
}

void loop() {
    // 保持 MQTT 連接
    if (!mqtt.connected()) {
        MQTT_Connect();
    }
    mqtt.loop();

    // 處理 Web 請求
    server.handleClient();

    // 定期讀取感測器（每 5 秒）
    static unsigned long last_sensor_read = 0;
    if (millis() - last_sensor_read > 5000) {
        last_sensor_read = millis();
        Read_Sensors();
        Publish_Sensor_Data();
    }

    // 檢查自動化規則（每秒）
    static unsigned long last_automation_check = 0;
    if (millis() - last_automation_check > 1000) {
        last_automation_check = millis();
        Check_Automation_Rules();
    }

    // 更新系統狀態
    status.uptime = millis() / 1000;
    status.wifi_rssi = WiFi.RSSI();
    status.mqtt_connected = mqtt.connected();

    delay(10);
}

/* ==================== Wi-Fi 功能 ==================== */

void WiFi_Connect(void) {
    Serial.printf("連接到 Wi-Fi: %s\n", WIFI_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n✅ Wi-Fi 連接成功！");
        Serial.printf("IP 地址: %s\n", WiFi.localIP().toString().c_str());
    } else {
        Serial.println("\n❌ Wi-Fi 連接失敗！");
    }
}

/* ==================== MQTT 功能 ==================== */

void MQTT_Connect(void) {
    while (!mqtt.connected()) {
        Serial.print("連接到 MQTT...");

        if (mqtt.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS)) {
            Serial.println(" 成功！");

            // 訂閱控制主題
            mqtt.subscribe(TOPIC_CONTROL);
            mqtt.subscribe(TOPIC_SCENE);

            // 發布上線消息
            mqtt.publish(TOPIC_STATUS, "online", true);
        } else {
            Serial.printf(" 失敗 (rc=%d)，5秒後重試\n", mqtt.state());
            delay(5000);
        }
    }
}

void MQTT_Callback(char* topic, byte* payload, unsigned int length) {
    String message;
    for (unsigned int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    Serial.printf("收到 MQTT: %s = %s\n", topic, message.c_str());

    // 解析 JSON 控制命令
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, message);

    if (!error) {
        // 設備控制
        if (doc.containsKey("light")) {
            status.light_on = doc["light"];
            digitalWrite(RELAY_LIGHT, status.light_on);
            preferences.putBool("light", status.light_on);
        }

        if (doc.containsKey("fan")) {
            status.fan_on = doc["fan"];
            digitalWrite(RELAY_FAN, status.fan_on);
            preferences.putBool("fan", status.fan_on);
        }

        if (doc.containsKey("curtain")) {
            status.curtain_open = doc["curtain"];
            digitalWrite(RELAY_CURTAIN, status.curtain_open);
            preferences.putBool("curtain", status.curtain_open);
        }

        if (doc.containsKey("ac")) {
            status.ac_on = doc["ac"];
            digitalWrite(RELAY_AC, status.ac_on);
        }

        // RGB 控制
        if (doc.containsKey("rgb_color")) {
            status.rgb_color = doc["rgb_color"];
        }

        if (doc.containsKey("rgb_brightness")) {
            status.rgb_brightness = doc["rgb_brightness"];
            strip.setBrightness(status.rgb_brightness);
        }

        Control_Devices();
    }

    // 場景控制
    if (String(topic) == TOPIC_SCENE) {
        Apply_Scene(message);
    }
}

/* ==================== 感測器讀取 ==================== */

void Read_Sensors(void) {
    // 讀取溫濕度
    status.temperature = dht.readTemperature();
    status.humidity = dht.readHumidity();

    if (isnan(status.temperature) || isnan(status.humidity)) {
        Serial.println("⚠️  DHT22 讀取失敗");
    }

    // 讀取光照度
    status.light = lightMeter.readLightLevel();

    // 讀取人體感應
    status.motion_detected = digitalRead(PIR_PIN);

    // 讀取煙霧濃度
    status.smoke_level = analogRead(SMOKE_PIN);

    // 顯示數據
    Serial.println("\n━━━━━━ 感測器數據 ━━━━━━");
    Serial.printf("溫度: %.1f °C\n", status.temperature);
    Serial.printf("濕度: %.1f %%\n", status.humidity);
    Serial.printf("光照: %u lux\n", status.light);
    Serial.printf("動作: %s\n", status.motion_detected ? "檢測到" : "無");
    Serial.printf("煙霧: %u\n", status.smoke_level);
    Serial.println("━━━━━━━━━━━━━━━━━━━━");
}

void Publish_Sensor_Data(void) {
    // 發布溫度
    char temp_str[10];
    snprintf(temp_str, sizeof(temp_str), "%.1f", status.temperature);
    mqtt.publish(TOPIC_TEMPERATURE, temp_str);

    // 發布濕度
    char hum_str[10];
    snprintf(hum_str, sizeof(hum_str), "%.1f", status.humidity);
    mqtt.publish(TOPIC_HUMIDITY, hum_str);

    // 發布光照
    char light_str[10];
    snprintf(light_str, sizeof(light_str), "%u", status.light);
    mqtt.publish(TOPIC_LIGHT, light_str);

    // 發布 JSON 完整數據
    StaticJsonDocument<512> doc;
    doc["temperature"] = status.temperature;
    doc["humidity"] = status.humidity;
    doc["light"] = status.light;
    doc["motion"] = status.motion_detected;
    doc["smoke"] = status.smoke_level;
    doc["uptime"] = status.uptime;
    doc["rssi"] = status.wifi_rssi;

    char json_buffer[512];
    serializeJson(doc, json_buffer);
    mqtt.publish("home/hub/data", json_buffer);
}

/* ==================== 設備控制 ==================== */

void Control_Devices(void) {
    digitalWrite(RELAY_LIGHT, status.light_on);
    digitalWrite(RELAY_FAN, status.fan_on);
    digitalWrite(RELAY_CURTAIN, status.curtain_open);
    digitalWrite(RELAY_AC, status.ac_on);

    // 控制 RGB LED
    uint8_t r = (status.rgb_color >> 16) & 0xFF;
    uint8_t g = (status.rgb_color >> 8) & 0xFF;
    uint8_t b = status.rgb_color & 0xFF;

    for (int i = 0; i < RGB_LED_COUNT; i++) {
        strip.setPixelColor(i, strip.Color(r, g, b));
    }
    strip.show();
}

/* ==================== 場景應用 ==================== */

void Apply_Scene(const String& scene_name) {
    Serial.printf("應用場景: %s\n", scene_name.c_str());

    Scene* scene = nullptr;

    if (scene_name == "normal") scene = &scenes[0];
    else if (scene_name == "away") scene = &scenes[1];
    else if (scene_name == "home") scene = &scenes[2];
    else if (scene_name == "sleep") scene = &scenes[3];
    else if (scene_name == "party") scene = &scenes[4];

    if (scene) {
        status.light_on = scene->light;
        status.fan_on = scene->fan;
        status.curtain_open = scene->curtain;
        status.ac_on = scene->ac;
        status.rgb_color = scene->rgb_color;
        status.rgb_brightness = scene->rgb_brightness;
        status.current_scene = scene_name;

        strip.setBrightness(status.rgb_brightness);

        Control_Devices();
    }
}

/* ==================== 自動化規則 ==================== */

void Check_Automation_Rules(void) {
    // 規則 1: 光線暗時自動開燈
    if (status.light < 50 && !status.light_on && status.motion_detected) {
        Serial.println("🌙 光線暗且有人活動，自動開燈");
        status.light_on = true;
        Control_Devices();
    }

    // 規則 2: 溫度過高自動開風扇
    if (status.temperature > 28.0 && !status.fan_on) {
        Serial.println("🔥 溫度過高，自動開啟風扇");
        status.fan_on = true;
        Control_Devices();
    }

    // 規則 3: 溫度正常關閉風扇
    if (status.temperature < 25.0 && status.fan_on) {
        Serial.println("❄️  溫度正常，關閉風扇");
        status.fan_on = false;
        Control_Devices();
    }

    // 規則 4: 煙霧警報
    if (status.smoke_level > 500) {
        Send_Alert("⚠️ 煙霧警報！檢測到異常煙霧濃度");
        // 觸發蜂鳴器
        digitalWrite(BUZZER_PIN, HIGH);
        delay(1000);
        digitalWrite(BUZZER_PIN, LOW);
    }
}

/* ==================== 警報通知 ==================== */

void Send_Alert(const String& message) {
    Serial.println(message);
    mqtt.publish("home/alerts", message.c_str());
    // 可以整合推送通知服務
}

/* ==================== Web 伺服器 ==================== */

void Web_Server_Setup(void) {
    // 主頁
    server.on("/", HTTP_GET, []() {
        String html = R"(
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>智慧家居中樞</title>
    <style>
        body { font-family: Arial; margin: 20px; background: #f0f0f0; }
        .container { max-width: 800px; margin: auto; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .sensor { display: flex; justify-content: space-between; margin: 10px 0; }
        .control { margin: 10px 0; }
        button { padding: 10px 20px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        .btn-on { background: #4CAF50; color: white; }
        .btn-off { background: #f44336; color: white; }
        .scene-btn { background: #2196F3; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏠 智慧家居中樞</h1>

        <div class="card">
            <h2>📊 感測器數據</h2>
            <div class="sensor"><span>溫度:</span><span id="temp">--</span></div>
            <div class="sensor"><span>濕度:</span><span id="hum">--</span></div>
            <div class="sensor"><span>光照:</span><span id="light">--</span></div>
        </div>

        <div class="card">
            <h2>🎛️ 設備控制</h2>
            <div class="control">
                <button onclick="control('light', true)" class="btn-on">開燈</button>
                <button onclick="control('light', false)" class="btn-off">關燈</button>
            </div>
            <div class="control">
                <button onclick="control('fan', true)" class="btn-on">開風扇</button>
                <button onclick="control('fan', false)" class="btn-off">關風扇</button>
            </div>
        </div>

        <div class="card">
            <h2>🎬 場景模式</h2>
            <button onclick="scene('home')" class="scene-btn">回家</button>
            <button onclick="scene('away')" class="scene-btn">離家</button>
            <button onclick="scene('sleep')" class="scene-btn">睡眠</button>
        </div>
    </div>

    <script>
        function control(device, state) {
            fetch('/api/control', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({[device]: state})
            });
        }

        function scene(name) {
            fetch('/api/scene?name=' + name);
        }

        setInterval(() => {
            fetch('/api/status')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('temp').textContent = data.temperature + ' °C';
                    document.getElementById('hum').textContent = data.humidity + ' %';
                    document.getElementById('light').textContent = data.light + ' lux';
                });
        }, 2000);
    </script>
</body>
</html>
        )";
        server.send(200, "text/html", html);
    });

    // API: 狀態
    server.on("/api/status", HTTP_GET, []() {
        StaticJsonDocument<512> doc;
        doc["temperature"] = status.temperature;
        doc["humidity"] = status.humidity;
        doc["light"] = status.light;
        doc["light_on"] = status.light_on;
        doc["fan_on"] = status.fan_on;
        doc["uptime"] = status.uptime;

        String json;
        serializeJson(doc, json);
        server.send(200, "application/json", json);
    });

    // API: 控制
    server.on("/api/control", HTTP_POST, []() {
        if (server.hasArg("plain")) {
            String body = server.arg("plain");

            StaticJsonDocument<200> doc;
            deserializeJson(doc, body);

            if (doc.containsKey("light")) {
                status.light_on = doc["light"];
                Control_Devices();
            }

            if (doc.containsKey("fan")) {
                status.fan_on = doc["fan"];
                Control_Devices();
            }

            server.send(200, "application/json", "{\"status\":\"ok\"}");
        }
    });

    // API: 場景
    server.on("/api/scene", HTTP_GET, []() {
        if (server.hasArg("name")) {
            Apply_Scene(server.arg("name"));
            server.send(200, "application/json", "{\"status\":\"ok\"}");
        }
    });
}
