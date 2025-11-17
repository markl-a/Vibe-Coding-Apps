/**
 * ESP32 LED 閃爍範例
 *
 * 功能：控制 ESP32 內建 LED 閃爍
 * 平台：ESP32
 * 框架：Arduino
 *
 * 硬體：
 * - ESP32 開發板
 * - 內建 LED (GPIO2)
 */

#define LED_PIN 2  // ESP32 內建 LED

void setup()
{
    // 初始化串口（除錯用）
    Serial.begin(115200);
    delay(100);

    Serial.println("\n=== ESP32 LED 閃爍範例 ===");

    // 配置 LED 腳位為輸出
    pinMode(LED_PIN, OUTPUT);

    Serial.println("LED 腳位已配置完成");
    Serial.println("LED 將開始閃爍...\n");
}

void loop()
{
    // 點亮 LED
    digitalWrite(LED_PIN, HIGH);
    Serial.println("LED ON");

    // 延遲 1 秒
    delay(1000);

    // 關閉 LED
    digitalWrite(LED_PIN, LOW);
    Serial.println("LED OFF");

    // 延遲 1 秒
    delay(1000);
}
