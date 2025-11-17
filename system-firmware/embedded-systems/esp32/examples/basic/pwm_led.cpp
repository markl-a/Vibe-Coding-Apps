/**
 * ESP32 PWM LED 呼吸燈範例
 *
 * 功能：使用 PWM 實現 LED 呼吸燈效果
 * 平台：ESP32
 * 框架：Arduino
 *
 * 硬體：
 * - ESP32 開發板
 * - LED (GPIO2)
 */

#define LED_PIN 2
#define PWM_CHANNEL 0      // PWM 通道
#define PWM_FREQ 5000      // PWM 頻率 5kHz
#define PWM_RESOLUTION 8   // PWM 解析度 8-bit (0-255)

void setup()
{
    Serial.begin(115200);
    delay(100);

    Serial.println("\n=== ESP32 PWM 呼吸燈範例 ===");

    // 配置 PWM 功能
    ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);

    // 將 PWM 通道綁定到 GPIO 腳位
    ledcAttachPin(LED_PIN, PWM_CHANNEL);

    Serial.println("PWM 配置完成");
    Serial.printf("頻率：%d Hz\n", PWM_FREQ);
    Serial.printf("解析度：%d-bit (0-%d)\n\n", PWM_RESOLUTION, (1 << PWM_RESOLUTION) - 1);
}

void loop()
{
    // 漸亮
    Serial.println("LED 漸亮...");
    for (int dutyCycle = 0; dutyCycle <= 255; dutyCycle++)
    {
        ledcWrite(PWM_CHANNEL, dutyCycle);
        delay(5);
    }

    // 延遲
    delay(500);

    // 漸暗
    Serial.println("LED 漸暗...");
    for (int dutyCycle = 255; dutyCycle >= 0; dutyCycle--)
    {
        ledcWrite(PWM_CHANNEL, dutyCycle);
        delay(5);
    }

    // 延遲
    delay(500);
}
