/**
 * ESP32 DHT22 溫濕度感測器範例
 *
 * 功能：讀取 DHT22 溫濕度感測器資料
 * 平台：ESP32
 * 框架：Arduino
 * 感測器：DHT22 (AM2302)
 */

#include <DHT.h>

// 定義 DHT22 接腳和類型
#define DHTPIN 4        // DHT22 資料腳位連接到 GPIO4
#define DHTTYPE DHT22   // DHT 22 (AM2302)

// 建立 DHT 物件
DHT dht(DHTPIN, DHTTYPE);

// 溫濕度閾值設定
const float TEMP_HIGH_THRESHOLD = 30.0;  // 高溫警告
const float TEMP_LOW_THRESHOLD = 10.0;   // 低溫警告
const float HUMIDITY_HIGH_THRESHOLD = 80.0;  // 高濕度警告
const float HUMIDITY_LOW_THRESHOLD = 30.0;   // 低濕度警告

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n=== ESP32 DHT22 溫濕度感測器範例 ===");
    Serial.println("正在初始化 DHT22 感測器...");

    dht.begin();

    Serial.println("DHT22 已就緒！");
    Serial.println("每 2 秒讀取一次感測器資料\n");
}

void loop() {
    // 讀取感測器資料（讀取需要約 250 毫秒）
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    float fahrenheit = dht.readTemperature(true);

    // 檢查是否讀取失敗
    if (isnan(humidity) || isnan(temperature) || isnan(fahrenheit)) {
        Serial.println("❌ 讀取 DHT22 感測器失敗！");
        Serial.println("請檢查：");
        Serial.println("  1. 接線是否正確");
        Serial.println("  2. 感測器是否損壞");
        Serial.println("  3. 電源是否穩定");
        delay(2000);
        return;
    }

    // 計算體感溫度（Heat Index）
    float heatIndex = dht.computeHeatIndex(fahrenheit, humidity);
    float heatIndexC = dht.computeHeatIndex(temperature, humidity, false);

    // 顯示分隔線
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // 顯示時間戳記
    Serial.print("時間: ");
    Serial.print(millis() / 1000);
    Serial.println(" 秒");

    // 顯示溫度
    Serial.print("🌡️  溫度: ");
    Serial.print(temperature);
    Serial.print(" °C (");
    Serial.print(fahrenheit);
    Serial.println(" °F)");

    // 顯示濕度
    Serial.print("💧 濕度: ");
    Serial.print(humidity);
    Serial.println(" %");

    // 顯示體感溫度
    Serial.print("🔥 體感溫度: ");
    Serial.print(heatIndexC);
    Serial.print(" °C (");
    Serial.print(heatIndex);
    Serial.println(" °F)");

    // 溫度警告
    checkTemperatureWarning(temperature);

    // 濕度警告
    checkHumidityWarning(humidity);

    // 舒適度評估
    assessComfortLevel(temperature, humidity);

    Serial.println();

    // 每 2 秒讀取一次（DHT22 最小取樣間隔）
    delay(2000);
}

void checkTemperatureWarning(float temp) {
    if (temp > TEMP_HIGH_THRESHOLD) {
        Serial.println("⚠️  警告：溫度過高！");
    } else if (temp < TEMP_LOW_THRESHOLD) {
        Serial.println("⚠️  警告：溫度過低！");
    }
}

void checkHumidityWarning(float humidity) {
    if (humidity > HUMIDITY_HIGH_THRESHOLD) {
        Serial.println("⚠️  警告：濕度過高！");
    } else if (humidity < HUMIDITY_LOW_THRESHOLD) {
        Serial.println("⚠️  警告：濕度過低！");
    }
}

void assessComfortLevel(float temp, float humidity) {
    Serial.print("😊 舒適度: ");

    // 舒適度判斷邏輯
    if (temp >= 20 && temp <= 26 && humidity >= 40 && humidity <= 60) {
        Serial.println("非常舒適");
    } else if (temp >= 18 && temp <= 28 && humidity >= 30 && humidity <= 70) {
        Serial.println("舒適");
    } else if (temp > 28 || humidity > 70) {
        Serial.println("悶熱");
    } else if (temp < 18 || humidity < 30) {
        Serial.println("乾冷");
    } else {
        Serial.println("一般");
    }
}
