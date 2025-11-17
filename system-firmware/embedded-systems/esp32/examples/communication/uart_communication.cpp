/**
 * ESP32 UART 通訊範例
 *
 * 功能：
 * - UART 數據收發
 * - 命令處理系統
 * - 多串口支援
 *
 * 平台：ESP32
 * 框架：Arduino
 *
 * 硬體連接：
 * - UART0: USB (除錯用)
 * - UART2: GPIO16 (RX), GPIO17 (TX)
 */

#include <HardwareSerial.h>

// 使用 UART2
HardwareSerial SerialPort(2);

// 命令緩衝區
String commandBuffer = "";
bool commandReady = false;

// LED 狀態
bool ledState = false;
#define LED_PIN 2

void setup()
{
    // 初始化 UART0 (USB)
    Serial.begin(115200);
    delay(100);

    // 初始化 UART2 (GPIO16: RX, GPIO17: TX)
    SerialPort.begin(9600, SERIAL_8N1, 16, 17);

    // 初始化 LED
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    Serial.println("\n╔══════════════════════════════════════╗");
    Serial.println("║   ESP32 UART 通訊範例                ║");
    Serial.println("╚══════════════════════════════════════╝");
    Serial.println("\nUART 配置：");
    Serial.println("  UART0 (USB): 115200 bps");
    Serial.println("  UART2: 9600 bps, GPIO16(RX), GPIO17(TX)");
    Serial.println("\n可用命令：");
    Serial.println("  LED ON  - 點亮 LED");
    Serial.println("  LED OFF - 關閉 LED");
    Serial.println("  STATUS  - 查詢狀態");
    Serial.println("  ECHO <msg> - 回傳訊息");
    Serial.println("\n請輸入命令：");
}

void loop()
{
    // 從 UART0 (USB) 讀取數據
    while (Serial.available() > 0)
    {
        char inChar = (char)Serial.read();

        if (inChar == '\n' || inChar == '\r')
        {
            if (commandBuffer.length() > 0)
            {
                commandReady = true;
            }
        }
        else
        {
            commandBuffer += inChar;
        }
    }

    // 從 UART2 讀取數據並轉發到 UART0
    while (SerialPort.available() > 0)
    {
        char inChar = (char)SerialPort.read();
        Serial.print("UART2 收到: ");
        Serial.println(inChar);
    }

    // 處理命令
    if (commandReady)
    {
        processCommand(commandBuffer);
        commandBuffer = "";
        commandReady = false;
        Serial.println("\n請輸入命令：");
    }
}

/**
 * 處理命令
 */
void processCommand(String cmd)
{
    cmd.trim();
    cmd.toUpperCase();

    Serial.print("\n收到命令：");
    Serial.println(cmd);
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━");

    if (cmd == "LED ON")
    {
        digitalWrite(LED_PIN, HIGH);
        ledState = true;
        Serial.println("✓ LED 已點亮");

        // 同時發送到 UART2
        SerialPort.println("LED ON");
    }
    else if (cmd == "LED OFF")
    {
        digitalWrite(LED_PIN, LOW);
        ledState = false;
        Serial.println("✓ LED 已關閉");

        SerialPort.println("LED OFF");
    }
    else if (cmd == "STATUS")
    {
        printStatus();
    }
    else if (cmd.startsWith("ECHO "))
    {
        String message = cmd.substring(5);
        Serial.print("回音：");
        Serial.println(message);

        SerialPort.print("ECHO: ");
        SerialPort.println(message);
    }
    else if (cmd == "HELP")
    {
        printHelp();
    }
    else
    {
        Serial.println("❌ 未知命令：" + cmd);
        Serial.println("輸入 'HELP' 查看可用命令");
    }
}

/**
 * 顯示系統狀態
 */
void printStatus()
{
    Serial.println("系統狀態：");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━");
    Serial.print("LED 狀態：");
    Serial.println(ledState ? "ON" : "OFF");
    Serial.print("運行時間：");
    Serial.print(millis() / 1000);
    Serial.println(" 秒");
    Serial.print("Free Heap：");
    Serial.print(ESP.getFreeHeap());
    Serial.println(" bytes");
    Serial.print("Chip ID：");
    Serial.println(ESP.getEfuseMac(), HEX);
}

/**
 * 顯示幫助資訊
 */
void printHelp()
{
    Serial.println("可用命令列表：");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("LED ON      - 點亮 LED");
    Serial.println("LED OFF     - 關閉 LED");
    Serial.println("STATUS      - 顯示系統狀態");
    Serial.println("ECHO <msg>  - 回傳訊息");
    Serial.println("HELP        - 顯示此幫助");
}
