/**
 * @file sensor_sht30.c
 * @brief I2C 溫濕度傳感器 (SHT30) 範例
 *
 * 此範例示範如何使用 I2C HAL 與 SHT30 溫濕度傳感器進行通訊
 * 包括單次測量、週期性測量和數據讀取
 */

#include "i2c_hal.h"
#include <stdio.h>
#include <stdint.h>

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

/* SHT30 I2C 地址 */
#define SHT30_ADDR_1    0x44  /* ADDR pin = LOW */
#define SHT30_ADDR_2    0x45  /* ADDR pin = HIGH */
#define SHT30_ADDR      SHT30_ADDR_1

/* SHT30 命令 */
#define SHT30_CMD_MEASURE_HIGH_REP      0x2C06  /* 高重複性單次測量 */
#define SHT30_CMD_MEASURE_MEDIUM_REP    0x2C0D  /* 中重複性單次測量 */
#define SHT30_CMD_MEASURE_LOW_REP       0x2C10  /* 低重複性單次測量 */
#define SHT30_CMD_SOFT_RESET            0x30A2  /* 軟體重啟 */
#define SHT30_CMD_STATUS                0xF32D  /* 讀取狀態 */
#define SHT30_CMD_CLEAR_STATUS          0x3041  /* 清除狀態 */

/* I2C 句柄 */
static i2c_handle_t i2c;

/**
 * @brief 計算 CRC-8 校驗和
 *
 * SHT30 使用 CRC-8 (polynomial 0x31, init 0xFF)
 */
static uint8_t calculate_crc(const uint8_t *data, size_t len)
{
    uint8_t crc = 0xFF;

    for (size_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (int bit = 8; bit > 0; --bit) {
            if (crc & 0x80) {
                crc = (crc << 1) ^ 0x31;
            } else {
                crc = (crc << 1);
            }
        }
    }

    return crc;
}

/**
 * @brief 發送 SHT30 命令
 */
static int sht30_send_command(uint16_t command)
{
    uint8_t cmd[2] = {
        (command >> 8) & 0xFF,
        command & 0xFF
    };

    return i2c_master_write(i2c, SHT30_ADDR, cmd, 2);
}

/**
 * @brief 軟體重啟 SHT30
 */
int sht30_soft_reset(void)
{
    int result = sht30_send_command(SHT30_CMD_SOFT_RESET);
    if (result == 0) {
        delay_ms(2);  /* 等待重啟完成 */
    }
    return result;
}

/**
 * @brief 讀取溫濕度數據
 *
 * @param temperature 溫度輸出 (°C)
 * @param humidity 濕度輸出 (%)
 * @return int 0: 成功, -1: 失敗
 */
int sht30_read_data(float *temperature, float *humidity)
{
    /* 發送測量命令 */
    if (sht30_send_command(SHT30_CMD_MEASURE_HIGH_REP) != 0) {
        return -1;
    }

    /* 等待測量完成 */
    delay_ms(20);  /* 高重複性測量需要約 15ms */

    /* 讀取 6 字節數據 */
    uint8_t data[6];
    if (i2c_master_read(i2c, SHT30_ADDR, data, 6) != 0) {
        return -1;
    }

    /* 驗證 CRC */
    uint8_t temp_crc = calculate_crc(&data[0], 2);
    uint8_t hum_crc = calculate_crc(&data[3], 2);

    if (temp_crc != data[2] || hum_crc != data[5]) {
        printf("Warning: CRC check failed\n");
        return -1;
    }

    /* 轉換溫度 */
    uint16_t temp_raw = (data[0] << 8) | data[1];
    *temperature = -45.0f + 175.0f * (temp_raw / 65535.0f);

    /* 轉換濕度 */
    uint16_t hum_raw = (data[3] << 8) | data[4];
    *humidity = 100.0f * (hum_raw / 65535.0f);

    return 0;
}

/**
 * @brief 讀取狀態寄存器
 */
int sht30_read_status(uint16_t *status)
{
    /* 發送狀態讀取命令 */
    if (sht30_send_command(SHT30_CMD_STATUS) != 0) {
        return -1;
    }

    delay_ms(1);

    /* 讀取 3 字節 (2 字節狀態 + 1 字節 CRC) */
    uint8_t data[3];
    if (i2c_master_read(i2c, SHT30_ADDR, data, 3) != 0) {
        return -1;
    }

    /* 驗證 CRC */
    uint8_t crc = calculate_crc(&data[0], 2);
    if (crc != data[2]) {
        return -1;
    }

    *status = (data[0] << 8) | data[1];
    return 0;
}

/**
 * @brief 打印狀態資訊
 */
static void print_status(uint16_t status)
{
    printf("Status Register: 0x%04X\n", status);
    printf("  Alert pending:      %s\n", (status & (1 << 15)) ? "Yes" : "No");
    printf("  Heater enabled:     %s\n", (status & (1 << 13)) ? "Yes" : "No");
    printf("  RH alert:           %s\n", (status & (1 << 11)) ? "Yes" : "No");
    printf("  Temp alert:         %s\n", (status & (1 << 10)) ? "Yes" : "No");
    printf("  System reset:       %s\n", (status & (1 << 4)) ? "Yes" : "No");
    printf("  Command status:     %s\n", (status & (1 << 1)) ? "Failed" : "OK");
    printf("  Checksum status:    %s\n", (status & (1 << 0)) ? "Failed" : "OK");
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
    printf("I2C HAL - SHT30 Sensor Example\n");
    printf("========================================\n\n");

    /* 配置 I2C */
    i2c_config_t i2c_config = {
        .mode = I2C_MODE_MASTER,
        .clock_speed = I2C_SPEED_STANDARD,
        .address_mode = I2C_ADDR_7BIT,
        .own_address = 0x00
    };

    /* 初始化 I2C */
    i2c = i2c_init(1, &i2c_config);
    if (!i2c) {
        printf("Error: Failed to initialize I2C\n");
        return -1;
    }

    printf("I2C initialized successfully!\n");
    printf("SHT30 Address: 0x%02X\n\n", SHT30_ADDR);

    /* 軟體重啟傳感器 */
    printf("Resetting SHT30 sensor...\n");
    if (sht30_soft_reset() != 0) {
        printf("Error: Failed to reset sensor\n");
        printf("Please check:\n");
        printf("  - I2C connections (SDA, SCL)\n");
        printf("  - Pull-up resistors\n");
        printf("  - Power supply\n");
        goto cleanup;
    }
    printf("Sensor reset successful!\n\n");

    /* 讀取狀態 */
    printf("Reading sensor status...\n");
    uint16_t status;
    if (sht30_read_status(&status) == 0) {
        print_status(status);
        printf("\n");
    } else {
        printf("Warning: Failed to read status\n\n");
    }

    /* 連續測量模式 */
    printf("========================================\n");
    printf("Starting continuous measurement\n");
    printf("Press Ctrl+C to exit\n");
    printf("========================================\n\n");

    printf("Time (s) | Temperature (°C) | Humidity (%%) | Heat Index\n");
    printf("---------|------------------|--------------|------------\n");

    float temp_sum = 0, hum_sum = 0;
    int sample_count = 0;
    uint32_t start_time = 0;

#ifdef STM32F4
    start_time = HAL_GetTick();
#endif

    while (1) {
        float temperature, humidity;

        /* 讀取溫濕度 */
        if (sht30_read_data(&temperature, &humidity) == 0) {
            sample_count++;
            temp_sum += temperature;
            hum_sum += humidity;

            /* 計算體感溫度 (簡化版熱指數) */
            float heat_index = temperature;
            if (temperature >= 27.0f) {
                heat_index = -8.78469475556f +
                            1.61139411f * temperature +
                            2.33854883889f * humidity +
                            -0.14611605f * temperature * humidity;
            }

            /* 打印數據 */
            uint32_t elapsed = 0;
#ifdef STM32F4
            elapsed = (HAL_GetTick() - start_time) / 1000;
#endif

            printf("%8lu | %15.2f | %11.2f | %10.2f\n",
                   elapsed, temperature, humidity, heat_index);

            /* 每 10 次測量顯示平均值 */
            if (sample_count % 10 == 0) {
                printf("\n--- Statistics (last 10 samples) ---\n");
                printf("Average Temperature: %.2f °C\n", temp_sum / 10);
                printf("Average Humidity:    %.2f %%\n", hum_sum / 10);
                printf("------------------------------------\n\n");
                temp_sum = 0;
                hum_sum = 0;
            }

            /* 警告檢測 */
            if (temperature > 40.0f) {
                printf("⚠ Warning: High temperature detected!\n");
            }
            if (humidity > 80.0f) {
                printf("⚠ Warning: High humidity detected!\n");
            }
            if (humidity < 20.0f) {
                printf("⚠ Warning: Low humidity detected!\n");
            }

        } else {
            printf("Error: Failed to read sensor data\n");
        }

        /* 每 2 秒測量一次 */
        delay_ms(2000);
    }

cleanup:
    /* 清理資源 */
    i2c_deinit(i2c);
    return 0;
}

/**
 * @brief 高級範例: 週期性測量模式
 *
 * SHT30 支持週期性測量模式，可以降低功耗
 * 此函數示範如何啟用和使用週期性測量
 */
void sht30_periodic_mode_example(void)
{
    /* 啟用週期性測量 (1 mps, 高重複性) */
    uint8_t cmd[] = {0x21, 0x30};
    i2c_master_write(i2c, SHT30_ADDR, cmd, 2);

    printf("Periodic measurement mode enabled\n");
    printf("Measurement rate: 1 per second\n\n");

    while (1) {
        /* 發送讀取數據命令 */
        uint8_t fetch_cmd[] = {0xE0, 0x00};
        i2c_master_write(i2c, SHT30_ADDR, fetch_cmd, 2);

        delay_ms(10);

        /* 讀取數據 */
        uint8_t data[6];
        if (i2c_master_read(i2c, SHT30_ADDR, data, 6) == 0) {
            /* 解析數據 */
            uint16_t temp_raw = (data[0] << 8) | data[1];
            uint16_t hum_raw = (data[3] << 8) | data[4];

            float temperature = -45.0f + 175.0f * (temp_raw / 65535.0f);
            float humidity = 100.0f * (hum_raw / 65535.0f);

            printf("T: %.2f °C, H: %.2f %%\n", temperature, humidity);
        }

        delay_ms(1000);
    }
}
