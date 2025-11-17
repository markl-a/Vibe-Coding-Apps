/**
 * STM32 I2C BME280 感測器範例
 *
 * 功能：讀取 BME280 溫度、濕度和氣壓感測器
 * 平台：STM32F4
 * 開發環境：STM32CubeIDE
 *
 * 硬體連接：
 * - I2C1: PB8 (SCL), PB9 (SDA)
 * - BME280 I2C 位址: 0x76 或 0x77
 */

#include "main.h"
#include <stdio.h>
#include <string.h>

/* I2C 句柄 */
I2C_HandleTypeDef hi2c1;
UART_HandleTypeDef huart2;

/* BME280 I2C 位址 */
#define BME280_ADDR     (0x76 << 1)  // 7-bit 位址左移一位

/* BME280 暫存器位址 */
#define BME280_REG_ID           0xD0
#define BME280_REG_RESET        0xE0
#define BME280_REG_CTRL_HUM     0xF2
#define BME280_REG_STATUS       0xF3
#define BME280_REG_CTRL_MEAS    0xF4
#define BME280_REG_CONFIG       0xF5
#define BME280_REG_PRESS_MSB    0xF7
#define BME280_REG_TEMP_MSB     0xFA
#define BME280_REG_HUM_MSB      0xFD

/* 校準數據暫存器 */
#define BME280_REG_CALIB00      0x88
#define BME280_REG_CALIB26      0xE1

/* 校準參數結構 */
typedef struct {
    uint16_t dig_T1;
    int16_t  dig_T2;
    int16_t  dig_T3;
    uint16_t dig_P1;
    int16_t  dig_P2;
    int16_t  dig_P3;
    int16_t  dig_P4;
    int16_t  dig_P5;
    int16_t  dig_P6;
    int16_t  dig_P7;
    int16_t  dig_P8;
    int16_t  dig_P9;
    uint8_t  dig_H1;
    int16_t  dig_H2;
    uint8_t  dig_H3;
    int16_t  dig_H4;
    int16_t  dig_H5;
    int8_t   dig_H6;
} BME280_CalibData;

BME280_CalibData calib;
int32_t t_fine;

/* 函數原型 */
void SystemClock_Config(void);
static void I2C1_Init(void);
static void UART2_Init(void);
static void GPIO_Init(void);
static uint8_t BME280_Init(void);
static void BME280_ReadCalibrationData(void);
static void BME280_ReadData(float *temperature, float *pressure, float *humidity);
static void UART_Printf(const char* format, ...);

int main(void)
{
    /* 初始化 HAL */
    HAL_Init();

    /* 配置系統時鐘 */
    SystemClock_Config();

    /* 初始化外設 */
    GPIO_Init();
    I2C1_Init();
    UART2_Init();

    /* 初始化 BME280 */
    UART_Printf("\r\n=== STM32 BME280 感測器範例 ===\r\n");

    if (BME280_Init() != HAL_OK)
    {
        UART_Printf("錯誤：BME280 初始化失敗！\r\n");
        UART_Printf("請檢查：\r\n");
        UART_Printf("  1. I2C 接線是否正確\r\n");
        UART_Printf("  2. BME280 電源是否正常\r\n");
        UART_Printf("  3. I2C 位址是否正確 (0x76 或 0x77)\r\n");
        Error_Handler();
    }

    UART_Printf("BME280 初始化成功！\r\n\r\n");

    /* 主循環 */
    while (1)
    {
        float temperature, pressure, humidity;

        /* 讀取感測器數據 */
        BME280_ReadData(&temperature, &pressure, &humidity);

        /* 顯示數據 */
        UART_Printf("━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n");
        UART_Printf("溫度：%.2f °C\r\n", temperature);
        UART_Printf("濕度：%.2f %%\r\n", humidity);
        UART_Printf("氣壓：%.2f hPa\r\n", pressure / 100.0f);
        UART_Printf("海拔：%.1f m (估算)\r\n", 44330.0f * (1.0f - pow(pressure / 101325.0f, 0.1903f)));
        UART_Printf("\r\n");

        /* 延遲 2 秒 */
        HAL_Delay(2000);
    }
}

/**
 * I2C1 初始化
 */
static void I2C1_Init(void)
{
    __HAL_RCC_I2C1_CLK_ENABLE();

    hi2c1.Instance = I2C1;
    hi2c1.Init.ClockSpeed = 100000;  // 100 kHz
    hi2c1.Init.DutyCycle = I2C_DUTYCYCLE_2;
    hi2c1.Init.OwnAddress1 = 0;
    hi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
    hi2c1.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
    hi2c1.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
    hi2c1.Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;

    if (HAL_I2C_Init(&hi2c1) != HAL_OK)
    {
        Error_Handler();
    }
}

/**
 * UART2 初始化
 */
static void UART2_Init(void)
{
    __HAL_RCC_USART2_CLK_ENABLE();

    huart2.Instance = USART2;
    huart2.Init.BaudRate = 115200;
    huart2.Init.WordLength = UART_WORDLENGTH_8B;
    huart2.Init.StopBits = UART_STOPBITS_1;
    huart2.Init.Parity = UART_PARITY_NONE;
    huart2.Init.Mode = UART_MODE_TX_RX;
    huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
    huart2.Init.OverSampling = UART_OVERSAMPLING_16;

    if (HAL_UART_Init(&huart2) != HAL_OK)
    {
        Error_Handler();
    }
}

/**
 * GPIO 初始化
 */
static void GPIO_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();

    /* UART2 GPIO (PA2, PA3) */
    GPIO_InitStruct.Pin = GPIO_PIN_2 | GPIO_PIN_3;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF7_USART2;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* I2C1 GPIO (PB8: SCL, PB9: SDA) */
    GPIO_InitStruct.Pin = GPIO_PIN_8 | GPIO_PIN_9;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_OD;
    GPIO_InitStruct.Pull = GPIO_PULLUP;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF4_I2C1;
    HAL_GPIO_Init(GPIOB, &GPIO_InitStruct);
}

/**
 * BME280 初始化
 */
static uint8_t BME280_Init(void)
{
    uint8_t chipId;

    /* 讀取晶片 ID */
    if (HAL_I2C_Mem_Read(&hi2c1, BME280_ADDR, BME280_REG_ID, 1, &chipId, 1, 1000) != HAL_OK)
    {
        return HAL_ERROR;
    }

    if (chipId != 0x60)  // BME280 的 ID 應該是 0x60
    {
        return HAL_ERROR;
    }

    /* 讀取校準數據 */
    BME280_ReadCalibrationData();

    /* 配置感測器 */
    uint8_t ctrl_hum = 0x01;   // Humidity oversampling x1
    uint8_t ctrl_meas = 0x27;  // Temp/Press oversampling x1, Normal mode
    uint8_t config = 0xA0;     // Standby 1000ms, filter off

    HAL_I2C_Mem_Write(&hi2c1, BME280_ADDR, BME280_REG_CTRL_HUM, 1, &ctrl_hum, 1, 1000);
    HAL_I2C_Mem_Write(&hi2c1, BME280_ADDR, BME280_REG_CONFIG, 1, &config, 1, 1000);
    HAL_I2C_Mem_Write(&hi2c1, BME280_ADDR, BME280_REG_CTRL_MEAS, 1, &ctrl_meas, 1, 1000);

    return HAL_OK;
}

/**
 * 讀取校準數據
 */
static void BME280_ReadCalibrationData(void)
{
    uint8_t calib_data[32];

    /* 讀取溫度和壓力校準數據 */
    HAL_I2C_Mem_Read(&hi2c1, BME280_ADDR, BME280_REG_CALIB00, 1, calib_data, 26, 1000);

    calib.dig_T1 = (calib_data[1] << 8) | calib_data[0];
    calib.dig_T2 = (calib_data[3] << 8) | calib_data[2];
    calib.dig_T3 = (calib_data[5] << 8) | calib_data[4];
    calib.dig_P1 = (calib_data[7] << 8) | calib_data[6];
    calib.dig_P2 = (calib_data[9] << 8) | calib_data[8];
    calib.dig_P3 = (calib_data[11] << 8) | calib_data[10];
    calib.dig_P4 = (calib_data[13] << 8) | calib_data[12];
    calib.dig_P5 = (calib_data[15] << 8) | calib_data[14];
    calib.dig_P6 = (calib_data[17] << 8) | calib_data[16];
    calib.dig_P7 = (calib_data[19] << 8) | calib_data[18];
    calib.dig_P8 = (calib_data[21] << 8) | calib_data[20];
    calib.dig_P9 = (calib_data[23] << 8) | calib_data[22];
    calib.dig_H1 = calib_data[25];

    /* 讀取濕度校準數據 */
    HAL_I2C_Mem_Read(&hi2c1, BME280_ADDR, BME280_REG_CALIB26, 1, calib_data, 7, 1000);

    calib.dig_H2 = (calib_data[1] << 8) | calib_data[0];
    calib.dig_H3 = calib_data[2];
    calib.dig_H4 = (calib_data[3] << 4) | (calib_data[4] & 0x0F);
    calib.dig_H5 = (calib_data[5] << 4) | ((calib_data[4] >> 4) & 0x0F);
    calib.dig_H6 = calib_data[6];
}

/**
 * 讀取感測器數據
 */
static void BME280_ReadData(float *temperature, float *pressure, float *humidity)
{
    uint8_t data[8];
    int32_t adc_T, adc_P, adc_H;

    /* 讀取原始數據 */
    HAL_I2C_Mem_Read(&hi2c1, BME280_ADDR, BME280_REG_PRESS_MSB, 1, data, 8, 1000);

    /* 組合原始數據 */
    adc_P = (data[0] << 12) | (data[1] << 4) | (data[2] >> 4);
    adc_T = (data[3] << 12) | (data[4] << 4) | (data[5] >> 4);
    adc_H = (data[6] << 8) | data[7];

    /* 計算溫度（簡化版本） */
    int32_t var1 = ((((adc_T >> 3) - ((int32_t)calib.dig_T1 << 1))) * ((int32_t)calib.dig_T2)) >> 11;
    int32_t var2 = (((((adc_T >> 4) - ((int32_t)calib.dig_T1)) *
                    ((adc_T >> 4) - ((int32_t)calib.dig_T1))) >> 12) *
                    ((int32_t)calib.dig_T3)) >> 14;
    t_fine = var1 + var2;
    *temperature = ((t_fine * 5 + 128) >> 8) / 100.0f;

    /* 計算壓力 */
    int64_t var1_p = ((int64_t)t_fine) - 128000;
    int64_t var2_p = var1_p * var1_p * (int64_t)calib.dig_P6;
    var2_p = var2_p + ((var1_p * (int64_t)calib.dig_P5) << 17);
    var2_p = var2_p + (((int64_t)calib.dig_P4) << 35);
    var1_p = ((var1_p * var1_p * (int64_t)calib.dig_P3) >> 8) +
             ((var1_p * (int64_t)calib.dig_P2) << 12);
    var1_p = (((((int64_t)1) << 47) + var1_p)) * ((int64_t)calib.dig_P1) >> 33;

    if (var1_p != 0)
    {
        int64_t p = 1048576 - adc_P;
        p = (((p << 31) - var2_p) * 3125) / var1_p;
        var1_p = (((int64_t)calib.dig_P9) * (p >> 13) * (p >> 13)) >> 25;
        var2_p = (((int64_t)calib.dig_P8) * p) >> 19;
        p = ((p + var1_p + var2_p) >> 8) + (((int64_t)calib.dig_P7) << 4);
        *pressure = (float)p / 256.0f;
    }
    else
    {
        *pressure = 0;
    }

    /* 計算濕度 */
    int32_t v_x1_u32r = (t_fine - ((int32_t)76800));
    v_x1_u32r = (((((adc_H << 14) - (((int32_t)calib.dig_H4) << 20) -
                   (((int32_t)calib.dig_H5) * v_x1_u32r)) + ((int32_t)16384)) >> 15) *
                 (((((((v_x1_u32r * ((int32_t)calib.dig_H6)) >> 10) *
                     (((v_x1_u32r * ((int32_t)calib.dig_H3)) >> 11) + ((int32_t)32768))) >> 10) +
                   ((int32_t)2097152)) * ((int32_t)calib.dig_H2) + 8192) >> 14));
    v_x1_u32r = (v_x1_u32r - (((((v_x1_u32r >> 15) * (v_x1_u32r >> 15)) >> 7) *
                               ((int32_t)calib.dig_H1)) >> 4));
    v_x1_u32r = (v_x1_u32r < 0 ? 0 : v_x1_u32r);
    v_x1_u32r = (v_x1_u32r > 419430400 ? 419430400 : v_x1_u32r);
    *humidity = (float)(v_x1_u32r >> 12) / 1024.0f;
}

/**
 * UART Printf 函數
 */
static void UART_Printf(const char* format, ...)
{
    char buffer[256];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    HAL_UART_Transmit(&huart2, (uint8_t*)buffer, strlen(buffer), HAL_MAX_DELAY);
}

/**
 * 錯誤處理函數
 */
void Error_Handler(void)
{
    __disable_irq();
    while (1)
    {
    }
}
