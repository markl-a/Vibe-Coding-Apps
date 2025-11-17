/**
 * ESP32 SPI 通訊範例
 *
 * 功能：SPI 主機模式通訊示範
 * 平台：ESP32
 * 框架：Arduino
 *
 * 硬體連接：
 * - MOSI: GPIO23
 * - MISO: GPIO19
 * - SCK:  GPIO18
 * - CS:   GPIO5
 */

#include <SPI.h>

// SPI 腳位定義
#define SPI_MOSI 23
#define SPI_MISO 19
#define SPI_SCK  18
#define SPI_CS   5

// SPI 設定
SPIClass spi(VSPI);  // 使用 VSPI
SPISettings spiSettings(1000000, MSBFIRST, SPI_MODE0);  // 1MHz, MSB first, Mode 0

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n╔══════════════════════════════════════╗");
    Serial.println("║   ESP32 SPI 通訊範例                 ║");
    Serial.println("╚══════════════════════════════════════╝\n");

    // 配置 CS 腳位
    pinMode(SPI_CS, OUTPUT);
    digitalWrite(SPI_CS, HIGH);  // CS 初始為高電平（未選中）

    // 初始化 SPI
    spi.begin(SPI_SCK, SPI_MISO, SPI_MOSI, SPI_CS);

    Serial.println("SPI 配置：");
    Serial.printf("  MOSI: GPIO%d\n", SPI_MOSI);
    Serial.printf("  MISO: GPIO%d\n", SPI_MISO);
    Serial.printf("  SCK:  GPIO%d\n", SPI_SCK);
    Serial.printf("  CS:   GPIO%d\n", SPI_CS);
    Serial.printf("  頻率: 1 MHz\n");
    Serial.printf("  模式: SPI_MODE0\n\n");

    demonstrateSPI();
}

void loop()
{
    delay(5000);
    Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("重複測試...\n");
    demonstrateSPI();
}

/**
 * 示範 SPI 通訊
 */
void demonstrateSPI()
{
    Serial.println("SPI 通訊測試");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 測試 1: 發送單個字節
    Serial.println("測試 1: 發送單個字節");
    uint8_t txByte = 0xAA;
    uint8_t rxByte = spiTransfer(txByte);
    Serial.printf("  發送: 0x%02X\n", txByte);
    Serial.printf("  接收: 0x%02X\n\n", rxByte);

    // 測試 2: 發送多個字節
    Serial.println("測試 2: 發送/接收數據陣列");
    uint8_t txData[] = {0x01, 0x02, 0x03, 0x04, 0x05};
    uint8_t rxData[5];

    spiTransferBuffer(txData, rxData, 5);

    Serial.print("  發送: ");
    printHexArray(txData, 5);
    Serial.print("  接收: ");
    printHexArray(rxData, 5);
    Serial.println();

    // 測試 3: 讀取暫存器模擬
    Serial.println("測試 3: 讀取暫存器（模擬）");
    uint8_t regAddr = 0x00;
    uint8_t regValue = spiReadRegister(regAddr);
    Serial.printf("  暫存器 0x%02X 的值: 0x%02X\n\n", regAddr, regValue);

    // 測試 4: 寫入暫存器模擬
    Serial.println("測試 4: 寫入暫存器（模擬）");
    regAddr = 0x01;
    uint8_t writeValue = 0x55;
    spiWriteRegister(regAddr, writeValue);
    Serial.printf("  寫入暫存器 0x%02X: 0x%02X\n\n", regAddr, writeValue);

    Serial.println("✓ SPI 測試完成");
}

/**
 * SPI 傳輸單個字節
 */
uint8_t spiTransfer(uint8_t data)
{
    uint8_t result;

    digitalWrite(SPI_CS, LOW);  // 選中設備
    spi.beginTransaction(spiSettings);

    result = spi.transfer(data);

    spi.endTransaction();
    digitalWrite(SPI_CS, HIGH);  // 取消選中

    return result;
}

/**
 * SPI 傳輸緩衝區
 */
void spiTransferBuffer(uint8_t *txBuffer, uint8_t *rxBuffer, size_t length)
{
    digitalWrite(SPI_CS, LOW);
    spi.beginTransaction(spiSettings);

    for (size_t i = 0; i < length; i++)
    {
        rxBuffer[i] = spi.transfer(txBuffer[i]);
    }

    spi.endTransaction();
    digitalWrite(SPI_CS, HIGH);
}

/**
 * SPI 讀取暫存器
 */
uint8_t spiReadRegister(uint8_t regAddr)
{
    uint8_t value;

    digitalWrite(SPI_CS, LOW);
    spi.beginTransaction(spiSettings);

    spi.transfer(0x80 | regAddr);  // 讀取命令 (MSB=1)
    value = spi.transfer(0x00);    // 讀取數據

    spi.endTransaction();
    digitalWrite(SPI_CS, HIGH);

    return value;
}

/**
 * SPI 寫入暫存器
 */
void spiWriteRegister(uint8_t regAddr, uint8_t value)
{
    digitalWrite(SPI_CS, LOW);
    spi.beginTransaction(spiSettings);

    spi.transfer(regAddr);  // 寫入命令 (MSB=0)
    spi.transfer(value);    // 寫入數據

    spi.endTransaction();
    digitalWrite(SPI_CS, HIGH);
}

/**
 * 顯示十六進位陣列
 */
void printHexArray(uint8_t *data, size_t length)
{
    for (size_t i = 0; i < length; i++)
    {
        Serial.printf("0x%02X ", data[i]);
    }
    Serial.println();
}
