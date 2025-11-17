/**
 * @file i2c_scan.c
 * @brief I2C 設備掃描範例
 *
 * 此範例示範如何使用 I2C HAL 掃描總線上的所有設備
 * 並顯示它們的 7 位元地址
 */

#include "i2c_hal.h"
#include <stdio.h>
#include <stdbool.h>

/* 平台相關的延遲函數 */
#ifdef STM32F4
    #include "stm32f4xx_hal.h"
    #define delay_ms(x) HAL_Delay(x)
#elif defined(ESP32)
    #include "freertos/FreeRTOS.h"
    #include "freertos/task.h"
    #define delay_ms(x) vTaskDelay((x) / portTICK_PERIOD_MS)
#else
    #define delay_ms(x) /* 需要實作 */
#endif

/**
 * @brief 打印掃描結果表格
 */
static void print_scan_table(bool devices[128])
{
    printf("\n     0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F\n");
    printf("00:          ");

    for (int addr = 3; addr < 0x78; addr++) {
        if (addr % 16 == 0) {
            printf("\n%02X: ", addr);
        }

        if (devices[addr]) {
            printf("%02X ", addr);
        } else {
            printf("-- ");
        }
    }
    printf("\n\n");
}

/**
 * @brief 主程式
 */
int main(void)
{
    /* 系統初始化 */
#ifdef STM32F4
    HAL_Init();
    SystemClock_Config();  /* 需要在專案中實作 */
#endif

    printf("\n========================================\n");
    printf("I2C HAL - Device Scanner Example\n");
    printf("========================================\n\n");

    /* 配置 I2C 為主模式 */
    i2c_config_t i2c_config = {
        .mode = I2C_MODE_MASTER,
        .clock_speed = I2C_SPEED_STANDARD,  /* 100kHz */
        .address_mode = I2C_ADDR_7BIT,
        .own_address = 0x00  /* 主模式不需要 */
    };

    /* 初始化 I2C1 */
    i2c_handle_t i2c = i2c_init(1, &i2c_config);
    if (!i2c) {
        printf("Error: Failed to initialize I2C\n");
        return -1;
    }

    printf("I2C initialized successfully!\n");
    printf("Clock Speed: %lu Hz\n", i2c_config.clock_speed);
    printf("\nScanning I2C bus...\n");

    /* 掃描 I2C 總線 */
    uint16_t found_devices[128];
    bool device_map[128] = {false};

    int device_count = i2c_scan(i2c, found_devices, 128);

    if (device_count < 0) {
        printf("Error: I2C scan failed\n");
        i2c_deinit(i2c);
        return -1;
    }

    /* 建立設備映射 */
    for (int i = 0; i < device_count; i++) {
        device_map[found_devices[i]] = true;
    }

    /* 打印結果 */
    printf("\nFound %d device(s):\n", device_count);
    print_scan_table(device_map);

    /* 列出找到的設備地址 */
    if (device_count > 0) {
        printf("Device addresses (7-bit):\n");
        for (int i = 0; i < device_count; i++) {
            printf("  0x%02X (%d)", found_devices[i], found_devices[i]);

            /* 識別常見設備 */
            switch (found_devices[i]) {
                case 0x3C:
                case 0x3D:
                    printf(" - Possible OLED Display (SSD1306)");
                    break;
                case 0x44:
                case 0x45:
                    printf(" - Possible Sensor (SHT30/SHT31)");
                    break;
                case 0x48:
                case 0x49:
                case 0x4A:
                case 0x4B:
                    printf(" - Possible ADC/Sensor (ADS1115/LM75)");
                    break;
                case 0x50:
                case 0x51:
                case 0x52:
                case 0x53:
                case 0x54:
                case 0x55:
                case 0x56:
                case 0x57:
                    printf(" - Possible EEPROM (AT24Cxx)");
                    break;
                case 0x68:
                case 0x69:
                    printf(" - Possible IMU/RTC (MPU6050/DS1307)");
                    break;
                case 0x76:
                case 0x77:
                    printf(" - Possible Sensor (BME280/BMP280)");
                    break;
            }
            printf("\n");
        }
    } else {
        printf("No I2C devices found on the bus.\n");
        printf("\nTroubleshooting tips:\n");
        printf("  - Check I2C pull-up resistors (typically 4.7kΩ)\n");
        printf("  - Verify SDA and SCL connections\n");
        printf("  - Ensure devices are powered\n");
        printf("  - Check device addresses in datasheets\n");
    }

    /* 連續掃描模式 (可選) */
    printf("\n========================================\n");
    printf("Entering continuous scan mode...\n");
    printf("Press Ctrl+C to exit\n");
    printf("========================================\n\n");

    while (1) {
        delay_ms(5000);  /* 每 5 秒掃描一次 */

        int new_count = i2c_scan(i2c, found_devices, 128);

        if (new_count != device_count) {
            printf("\n[%lu ms] Device count changed: %d -> %d\n",
                   HAL_GetTick(), device_count, new_count);

            device_count = new_count;

            /* 更新設備映射 */
            for (int i = 0; i < 128; i++) {
                device_map[i] = false;
            }
            for (int i = 0; i < device_count; i++) {
                device_map[found_devices[i]] = true;
            }

            print_scan_table(device_map);
        } else {
            printf(".");  /* 表示正在掃描 */
        }
    }

    /* 清理 (永遠不會執行到這裡) */
    i2c_deinit(i2c);
    return 0;
}
