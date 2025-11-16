/**
 * ESP32 Web Server 物聯網專案
 *
 * 功能：建立 Web 伺服器控制 GPIO 並顯示感測器資料
 * 平台：ESP32
 * 框架：Arduino
 */

#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>

// Wi-Fi 設定
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// DHT22 設定
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// LED 控制
#define LED1_PIN 2
#define LED2_PIN 15

// Web 伺服器（使用 80 port）
WebServer server(80);

// LED 狀態
bool led1State = false;
bool led2State = false;

// 感測器資料
float currentTemp = 0;
float currentHum = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n=== ESP32 Web Server 物聯網專案 ===");

    // 初始化 GPIO
    pinMode(LED1_PIN, OUTPUT);
    pinMode(LED2_PIN, OUTPUT);
    digitalWrite(LED1_PIN, LOW);
    digitalWrite(LED2_PIN, LOW);

    // 初始化 DHT22
    dht.begin();

    // 連接 Wi-Fi
    setupWiFi();

    // 設定路由
    setupRoutes();

    // 啟動伺服器
    server.begin();
    Serial.println("HTTP 伺服器已啟動");
    Serial.print("請訪問: http://");
    Serial.println(WiFi.localIP());
}

void loop() {
    server.handleClient();

    // 定期更新感測器資料
    static unsigned long lastUpdate = 0;
    if (millis() - lastUpdate > 2000) {
        lastUpdate = millis();
        updateSensorData();
    }
}

void setupWiFi() {
    Serial.print("連接到 Wi-Fi: ");
    Serial.println(ssid);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\nWi-Fi 連接成功！");
    Serial.print("IP 位址: ");
    Serial.println(WiFi.localIP());
}

void setupRoutes() {
    // 首頁
    server.on("/", handleRoot);

    // API 端點
    server.on("/api/sensor", handleSensorAPI);
    server.on("/api/led1/on", handleLED1On);
    server.on("/api/led1/off", handleLED1Off);
    server.on("/api/led2/on", handleLED2On);
    server.on("/api/led2/off", handleLED2Off);
    server.on("/api/status", handleStatus);

    // 404 處理
    server.onNotFound(handleNotFound);
}

void handleRoot() {
    String html = getHTML();
    server.send(200, "text/html", html);
}

void handleSensorAPI() {
    String json = "{";
    json += "\"temperature\":" + String(currentTemp, 2) + ",";
    json += "\"humidity\":" + String(currentHum, 2);
    json += "}";

    server.send(200, "application/json", json);
}

void handleLED1On() {
    led1State = true;
    digitalWrite(LED1_PIN, HIGH);
    server.send(200, "text/plain", "LED1 ON");
    Serial.println("LED1 已開啟");
}

void handleLED1Off() {
    led1State = false;
    digitalWrite(LED1_PIN, LOW);
    server.send(200, "text/plain", "LED1 OFF");
    Serial.println("LED1 已關閉");
}

void handleLED2On() {
    led2State = true;
    digitalWrite(LED2_PIN, HIGH);
    server.send(200, "text/plain", "LED2 ON");
    Serial.println("LED2 已開啟");
}

void handleLED2Off() {
    led2State = false;
    digitalWrite(LED2_PIN, LOW);
    server.send(200, "text/plain", "LED2 OFF");
    Serial.println("LED2 已關閉");
}

void handleStatus() {
    String json = "{";
    json += "\"led1\":" + String(led1State ? "true" : "false") + ",";
    json += "\"led2\":" + String(led2State ? "true" : "false") + ",";
    json += "\"temperature\":" + String(currentTemp, 2) + ",";
    json += "\"humidity\":" + String(currentHum, 2) + ",";
    json += "\"uptime\":" + String(millis() / 1000) + ",";
    json += "\"rssi\":" + String(WiFi.RSSI());
    json += "}";

    server.send(200, "application/json", json);
}

void handleNotFound() {
    server.send(404, "text/plain", "404: Not Found");
}

void updateSensorData() {
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    if (!isnan(temp) && !isnan(hum)) {
        currentTemp = temp;
        currentHum = hum;
    }
}

String getHTML() {
    String html = "<!DOCTYPE html><html lang='zh-TW'>";
    html += "<head>";
    html += "<meta charset='UTF-8'>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
    html += "<title>ESP32 物聯網控制面板</title>";
    html += "<style>";
    html += "body{font-family:Arial,sans-serif;max-width:800px;margin:50px auto;padding:20px;background:#f0f0f0}";
    html += ".container{background:white;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}";
    html += "h1{color:#333;text-align:center;margin-bottom:30px}";
    html += ".sensor-panel{background:#e3f2fd;padding:20px;border-radius:8px;margin-bottom:20px}";
    html += ".sensor-data{display:flex;justify-content:space-around;font-size:24px;font-weight:bold}";
    html += ".temp{color:#f44336}.hum{color:#2196f3}";
    html += ".control-panel{background:#fff3e0;padding:20px;border-radius:8px}";
    html += ".led-control{margin:15px 0;display:flex;justify-content:space-between;align-items:center}";
    html += "button{padding:10px 30px;font-size:16px;border:none;border-radius:5px;cursor:pointer;transition:all 0.3s}";
    html += ".btn-on{background:#4caf50;color:white}.btn-on:hover{background:#45a049}";
    html += ".btn-off{background:#f44336;color:white}.btn-off:hover{background:#da190b}";
    html += ".status{display:inline-block;width:20px;height:20px;border-radius:50%;margin-left:10px}";
    html += ".status-on{background:#4caf50}.status-off{background:#ccc}";
    html += ".info{background:#e8f5e9;padding:15px;border-radius:8px;margin-top:20px;font-size:14px}";
    html += "</style>";
    html += "</head>";
    html += "<body>";
    html += "<div class='container'>";
    html += "<h1>🌡️ ESP32 物聯網控制面板</h1>";

    // 感測器面板
    html += "<div class='sensor-panel'>";
    html += "<h2>📊 環境資訊</h2>";
    html += "<div class='sensor-data'>";
    html += "<div class='temp'>🌡️ " + String(currentTemp, 1) + "°C</div>";
    html += "<div class='hum'>💧 " + String(currentHum, 1) + "%</div>";
    html += "</div>";
    html += "</div>";

    // 控制面板
    html += "<div class='control-panel'>";
    html += "<h2>🎛️ LED 控制</h2>";

    // LED1
    html += "<div class='led-control'>";
    html += "<span>LED 1 <span class='status " + String(led1State ? "status-on" : "status-off") + "'></span></span>";
    html += "<div>";
    html += "<button class='btn-on' onclick='control(\"led1/on\")'>開啟</button> ";
    html += "<button class='btn-off' onclick='control(\"led1/off\")'>關閉</button>";
    html += "</div></div>";

    // LED2
    html += "<div class='led-control'>";
    html += "<span>LED 2 <span class='status " + String(led2State ? "status-on" : "status-off") + "'></span></span>";
    html += "<div>";
    html += "<button class='btn-on' onclick='control(\"led2/on\")'>開啟</button> ";
    html += "<button class='btn-off' onclick='control(\"led2/off\")'>關閉</button>";
    html += "</div></div>";
    html += "</div>";

    // 系統資訊
    html += "<div class='info'>";
    html += "<strong>系統資訊：</strong><br>";
    html += "運行時間: " + String(millis() / 1000) + " 秒<br>";
    html += "Wi-Fi 訊號: " + String(WiFi.RSSI()) + " dBm<br>";
    html += "IP 位址: " + WiFi.localIP().toString();
    html += "</div>";

    html += "</div>";

    // JavaScript
    html += "<script>";
    html += "function control(action){";
    html += "fetch('/api/'+action).then(r=>r.text()).then(d=>{console.log(d);setTimeout(()=>location.reload(),300)});";
    html += "}";
    html += "setInterval(()=>{";
    html += "fetch('/api/sensor').then(r=>r.json()).then(d=>{";
    html += "document.querySelector('.temp').innerHTML='🌡️ '+d.temperature.toFixed(1)+'°C';";
    html += "document.querySelector('.hum').innerHTML='💧 '+d.humidity.toFixed(1)+'%';";
    html += "});";
    html += "},2000);";
    html += "</script>";

    html += "</body></html>";

    return html;
}
