/**
 * Arduino 超音波距離感測器範例
 *
 * 功能：使用 HC-SR04 測量距離
 * 硬體：
 * - Arduino Uno/Nano
 * - HC-SR04 超音波感測器
 * - Trig: Pin 9
 * - Echo: Pin 10
 */

const int TRIG_PIN = 9;
const int ECHO_PIN = 10;
const int LED_PIN = 13;

void setup()
{
    Serial.begin(9600);
    Serial.println("=== HC-SR04 超音波距離感測器 ===\n");

    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    pinMode(LED_PIN, OUTPUT);
}

void loop()
{
    // 測量距離
    float distance = measureDistance();

    // 顯示結果
    Serial.print("距離: ");
    Serial.print(distance);
    Serial.println(" cm");

    // 根據距離控制 LED（距離 < 20cm 時點亮）
    if (distance < 20.0 && distance > 0)
    {
        digitalWrite(LED_PIN, HIGH);
        Serial.println("⚠️  物體靠近！");
    }
    else
    {
        digitalWrite(LED_PIN, LOW);
    }

    delay(500);
}

/**
 * 測量距離（公分）
 */
float measureDistance()
{
    // 發送 10us 脈衝
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    // 讀取回波時間
    long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // 30ms 超時

    // 計算距離（聲速 340m/s）
    // 距離 = (時間 * 速度) / 2
    float distance = duration * 0.034 / 2.0;

    // 有效範圍 2cm - 400cm
    if (distance < 2.0 || distance > 400.0)
    {
        return -1;  // 無效測量
    }

    return distance;
}
