/**
 * Arduino LED 閃爍與串口通訊範例
 *
 * 功能：
 * - LED 閃爍
 * - 串口輸出訊息
 * - 按鈕控制 LED
 *
 * 硬體：
 * - Arduino Uno/Nano
 * - 內建 LED (Pin 13)
 * - 按鈕 (Pin 2)
 */

const int LED_PIN = 13;      // 內建 LED
const int BUTTON_PIN = 2;    // 按鈕腳位

bool ledState = false;
bool lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 50;

void setup()
{
    // 初始化串口
    Serial.begin(9600);
    while (!Serial) {
        ; // 等待串口連接
    }

    Serial.println("=== Arduino LED 控制範例 ===");

    // 配置腳位
    pinMode(LED_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    digitalWrite(LED_PIN, LOW);

    Serial.println("系統就緒");
    Serial.println("按下按鈕切換 LED 狀態\n");
}

void loop()
{
    // 讀取按鈕狀態
    bool buttonState = digitalRead(BUTTON_PIN);

    // 按鈕消抖動
    if (buttonState != lastButtonState)
    {
        lastDebounceTime = millis();
    }

    if ((millis() - lastDebounceTime) > debounceDelay)
    {
        if (buttonState == LOW && lastButtonState == HIGH)
        {
            // 按鈕被按下
            ledState = !ledState;
            digitalWrite(LED_PIN, ledState);

            Serial.print("LED 狀態: ");
            Serial.println(ledState ? "ON" : "OFF");
        }
    }

    lastButtonState = buttonState;

    // 定期輸出狀態
    static unsigned long lastPrint = 0;
    if (millis() - lastPrint > 5000)
    {
        lastPrint = millis();

        Serial.println("━━━━━━━━━━━━━━━━━━━━");
        Serial.print("運行時間: ");
        Serial.print(millis() / 1000);
        Serial.println(" 秒");
        Serial.print("LED: ");
        Serial.println(ledState ? "開啟" : "關閉");
    }
}
