/**
 * ESP32 BME280 環境感測器範例
 *
 * 功能：讀取 BME280 溫度、濕度、氣壓資料
 * 平台：ESP32
 * 框架：Arduino
 * 感測器：BME280 (I2C)
 */

#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

// I2C 位址（0x76 或 0x77）
#define BME280_ADDRESS 0x76

// 海平面氣壓（用於計算海拔高度，單位：hPa）
#define SEALEVELPRESSURE_HPA (1013.25)

// 建立 BME280 物件
Adafruit_BME280 bme;

// 資料記錄
struct SensorData {
    float temperature;
    float humidity;
    float pressure;
    float altitude;
    unsigned long timestamp;
};

SensorData currentData;
SensorData minData;
SensorData maxData;
bool firstReading = true;

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n=== ESP32 BME280 環境感測器範例 ===");
    Serial.println("正在初始化 BME280...");

    // 初始化 I2C
    Wire.begin();

    // 初始化 BME280
    if (!bme.begin(BME280_ADDRESS)) {
        Serial.println("❌ 找不到 BME280 感測器！");
        Serial.println("請檢查：");
        Serial.println("  1. I2C 接線（SDA: GPIO21, SCL: GPIO22）");
        Serial.println("  2. I2C 位址（0x76 或 0x77）");
        Serial.println("  3. 感測器電源");
        while (1) delay(10);
    }

    Serial.println("✅ BME280 初始化成功！");
    Serial.println("\n感測器資訊：");
    Serial.println("  - 溫度範圍: -40°C ~ +85°C");
    Serial.println("  - 濕度範圍: 0% ~ 100%");
    Serial.println("  - 氣壓範圍: 300 ~ 1100 hPa");
    Serial.println();

    // 設定採樣參數
    bme.setSampling(Adafruit_BME280::MODE_NORMAL,
                    Adafruit_BME280::SAMPLING_X2,  // 溫度過採樣 x2
                    Adafruit_BME280::SAMPLING_X16, // 氣壓過採樣 x16
                    Adafruit_BME280::SAMPLING_X1,  // 濕度過採樣 x1
                    Adafruit_BME280::FILTER_X16,   // 濾波器係數 x16
                    Adafruit_BME280::STANDBY_MS_500); // 待機時間 500ms

    Serial.println("開始讀取資料...\n");
}

void loop() {
    // 讀取感測器資料
    readSensorData();

    // 顯示當前資料
    displayCurrentData();

    // 更新最大最小值
    updateMinMax();

    // 每 10 次讀取顯示一次統計資料
    static int readCount = 0;
    readCount++;
    if (readCount >= 10) {
        displayStatistics();
        readCount = 0;
    }

    delay(2000);
}

void readSensorData() {
    currentData.temperature = bme.readTemperature();
    currentData.humidity = bme.readHumidity();
    currentData.pressure = bme.readPressure() / 100.0F;  // 轉換為 hPa
    currentData.altitude = bme.readAltitude(SEALEVELPRESSURE_HPA);
    currentData.timestamp = millis();
}

void displayCurrentData() {
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.print("⏱️  時間: ");
    Serial.print(currentData.timestamp / 1000);
    Serial.println(" 秒");

    Serial.print("🌡️  溫度: ");
    Serial.print(currentData.temperature, 2);
    Serial.println(" °C");

    Serial.print("💧 濕度: ");
    Serial.print(currentData.humidity, 2);
    Serial.println(" %");

    Serial.print("📊 氣壓: ");
    Serial.print(currentData.pressure, 2);
    Serial.println(" hPa");

    Serial.print("⛰️  海拔: ");
    Serial.print(currentData.altitude, 2);
    Serial.println(" 公尺");

    // 天氣預測（基於氣壓變化）
    predictWeather(currentData.pressure);

    Serial.println();
}

void updateMinMax() {
    if (firstReading) {
        minData = currentData;
        maxData = currentData;
        firstReading = false;
        return;
    }

    // 更新最小值
    if (currentData.temperature < minData.temperature) minData.temperature = currentData.temperature;
    if (currentData.humidity < minData.humidity) minData.humidity = currentData.humidity;
    if (currentData.pressure < minData.pressure) minData.pressure = currentData.pressure;

    // 更新最大值
    if (currentData.temperature > maxData.temperature) maxData.temperature = currentData.temperature;
    if (currentData.humidity > maxData.humidity) maxData.humidity = currentData.humidity;
    if (currentData.pressure > maxData.pressure) maxData.pressure = currentData.pressure;
}

void displayStatistics() {
    Serial.println("╔════════════════════════════════════╗");
    Serial.println("║        統計資料（本次執行）        ║");
    Serial.println("╠════════════════════════════════════╣");

    Serial.println("║ 溫度：");
    Serial.print("║   最小: ");
    Serial.print(minData.temperature, 2);
    Serial.print(" °C  |  最大: ");
    Serial.print(maxData.temperature, 2);
    Serial.println(" °C");

    Serial.println("║ 濕度：");
    Serial.print("║   最小: ");
    Serial.print(minData.humidity, 2);
    Serial.print(" %   |  最大: ");
    Serial.print(maxData.humidity, 2);
    Serial.println(" %");

    Serial.println("║ 氣壓：");
    Serial.print("║   最小: ");
    Serial.print(minData.pressure, 2);
    Serial.print(" hPa |  最大: ");
    Serial.print(maxData.pressure, 2);
    Serial.println(" hPa");

    Serial.println("╚════════════════════════════════════╝");
    Serial.println();
}

void predictWeather(float pressure) {
    Serial.print("🌦️  天氣預測: ");

    if (pressure < 1000) {
        Serial.println("低氣壓 - 可能下雨");
    } else if (pressure < 1013) {
        Serial.println("偏低氣壓 - 多雲");
    } else if (pressure < 1020) {
        Serial.println("正常氣壓 - 晴朗");
    } else {
        Serial.println("高氣壓 - 晴朗穩定");
    }
}
