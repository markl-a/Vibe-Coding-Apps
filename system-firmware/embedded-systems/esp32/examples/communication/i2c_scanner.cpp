/**
 * ESP32 I2C 掃描器範例
 *
 * 功能：掃描 I2C 匯流排上的所有設備
 * 平台：ESP32
 * 框架：Arduino
 *
 * 硬體連接：
 * - SDA: GPIO21
 * - SCL: GPIO22
 */

#include <Wire.h>

// I2C 腳位定義（ESP32 預設）
#define SDA_PIN 21
#define SCL_PIN 22

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n╔══════════════════════════════════════╗");
    Serial.println("║   ESP32 I2C 掃描器                   ║");
    Serial.println("╚══════════════════════════════════════╝\n");

    // 初始化 I2C
    Wire.begin(SDA_PIN, SCL_PIN);

    Serial.println("I2C 掃描器啟動");
    Serial.printf("SDA: GPIO%d\n", SDA_PIN);
    Serial.printf("SCL: GPIO%d\n\n", SCL_PIN);

    scanI2C();
}

void loop()
{
    delay(5000);
    Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("重新掃描 I2C 設備...\n");
    scanI2C();
}

/**
 * 掃描 I2C 設備
 */
void scanI2C()
{
    byte error, address;
    int deviceCount = 0;

    Serial.println("掃描中...");
    Serial.println("     0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F");

    for (address = 0; address < 128; address++)
    {
        // 每行開始顯示行號
        if (address % 16 == 0)
        {
            Serial.printf("%02X: ", address);
        }

        // 嘗試與設備通訊
        Wire.beginTransmission(address);
        error = Wire.endTransmission();

        if (error == 0)
        {
            // 找到設備
            Serial.printf("%02X ", address);
            deviceCount++;
        }
        else if (error == 4)
        {
            // 未知錯誤
            Serial.print("?? ");
        }
        else
        {
            // 沒有設備
            Serial.print("-- ");
        }

        // 每 16 個位址換行
        if ((address + 1) % 16 == 0)
        {
            Serial.println();
        }
    }

    Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (deviceCount == 0)
    {
        Serial.println("❌ 未找到任何 I2C 設備");
        Serial.println("\n請檢查：");
        Serial.println("  1. I2C 設備是否正確連接");
        Serial.println("  2. SDA/SCL 上拉電阻（通常 4.7kΩ）");
        Serial.println("  3. 設備電源是否正常");
    }
    else if (deviceCount == 1)
    {
        Serial.println("✓ 找到 1 個 I2C 設備");
        printDeviceInfo();
    }
    else
    {
        Serial.printf("✓ 找到 %d 個 I2C 設備\n", deviceCount);
        printDeviceInfo();
    }
}

/**
 * 顯示常見 I2C 設備資訊
 */
void printDeviceInfo()
{
    Serial.println("\n常見 I2C 設備位址參考：");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("0x20-0x27  PCF8574 (I/O 擴展)");
    Serial.println("0x3C, 0x3D OLED 顯示器 (SSD1306)");
    Serial.println("0x48-0x4F  ADS1115 (ADC)");
    Serial.println("0x50-0x57  AT24Cxx (EEPROM)");
    Serial.println("0x68, 0x69 MPU6050 (陀螺儀/加速度計)");
    Serial.println("0x68       DS3231 (RTC)");
    Serial.println("0x76, 0x77 BME280/BMP280 (環境感測器)");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}
