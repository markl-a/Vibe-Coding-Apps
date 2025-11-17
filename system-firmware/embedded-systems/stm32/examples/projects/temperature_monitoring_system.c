/**
 * STM32 溫度監控系統實際專案
 *
 * 功能：完整的溫度監控系統，具備以下特性：
 * - 使用 BME280 感測器讀取溫度、濕度、氣壓
 * - 透過 UART 輸出監控數據
 * - 溫度過高/過低時 LED 警告
 * - 數據記錄到 SD 卡（可選）
 * - 支援 UART 命令控制
 *
 * 平台：STM32F4
 * 開發環境：STM32CubeIDE
 *
 * 硬體需求：
 * - BME280 感測器 (I2C)
 * - LED (PA5)
 * - UART (PA2/PA3)
 * - 可選：SD 卡 (SPI)
 */

#include "main.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <math.h>

/* 外設句柄 */
I2C_HandleTypeDef hi2c1;
UART_HandleTypeDef huart2;
TIM_HandleTypeDef htim2;

/* BME280 相關定義 */
#define BME280_ADDR         (0x76 << 1)
#define BME280_REG_TEMP_MSB 0xFA
#define BME280_REG_ID       0xD0

/* 溫度閾值設定 */
#define TEMP_HIGH_THRESHOLD 30.0f
#define TEMP_LOW_THRESHOLD  15.0f
#define HUM_HIGH_THRESHOLD  80.0f
#define HUM_LOW_THRESHOLD   30.0f

/* 系統狀態 */
typedef enum {
    SYS_NORMAL,
    SYS_TEMP_HIGH,
    SYS_TEMP_LOW,
    SYS_HUM_HIGH,
    SYS_HUM_LOW,
    SYS_ERROR
} SystemStatus_t;

/* 感測器數據結構 */
typedef struct {
    float temperature;
    float humidity;
    float pressure;
    uint32_t timestamp;
} SensorData_t;

/* 全域變數 */
SystemStatus_t systemStatus = SYS_NORMAL;
SensorData_t currentData;
uint8_t monitoringEnabled = 1;
uint8_t loggingEnabled = 0;
uint32_t sampleInterval = 2000;  // 採樣間隔（毫秒）

/* UART 接收緩衝區 */
uint8_t rxBuffer[100];
uint8_t rxIndex = 0;
uint8_t rxByte;
volatile uint8_t cmdReady = 0;

/* BME280 校準數據（簡化版） */
typedef struct {
    uint16_t dig_T1;
    int16_t  dig_T2;
    int16_t  dig_T3;
} BME280_CalibData;
BME280_CalibData calib;
int32_t t_fine;

/* 函數原型 */
void SystemClock_Config(void);
static void I2C1_Init(void);
static void UART2_Init(void);
static void TIM2_Init(void);
static void GPIO_Init(void);
static uint8_t BME280_Init(void);
static void BME280_ReadData(SensorData_t *data);
static void UpdateSystemStatus(void);
static void UpdateLED(void);
static void ProcessCommand(void);
static void PrintHelp(void);
static void PrintStatus(void);
static void LogDataToSD(void);
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
    TIM2_Init();

    /* 歡迎訊息 */
    UART_Printf("\r\n");
    UART_Printf("╔══════════════════════════════════════════╗\r\n");
    UART_Printf("║   STM32 溫度監控系統 v1.0                ║\r\n");
    UART_Printf("║   Temperature Monitoring System          ║\r\n");
    UART_Printf("╚══════════════════════════════════════════╝\r\n");
    UART_Printf("\r\n");

    /* 初始化 BME280 */
    UART_Printf("正在初始化 BME280 感測器...\r\n");
    if (BME280_Init() != HAL_OK)
    {
        UART_Printf("❌ 錯誤：感測器初始化失敗！\r\n");
        systemStatus = SYS_ERROR;
    }
    else
    {
        UART_Printf("✓ 感測器初始化成功\r\n");
    }

    /* 顯示系統資訊 */
    UART_Printf("\r\n系統資訊：\r\n");
    UART_Printf("  處理器：STM32F4\r\n");
    UART_Printf("  時鐘：%lu MHz\r\n", HAL_RCC_GetSysClockFreq() / 1000000);
    UART_Printf("  採樣間隔：%lu ms\r\n", sampleInterval);
    UART_Printf("  溫度閾值：%.1f°C ~ %.1f°C\r\n",
                TEMP_LOW_THRESHOLD, TEMP_HIGH_THRESHOLD);
    UART_Printf("\r\n輸入 'help' 查看可用命令\r\n\r\n");

    /* 啟動 UART 中斷接收 */
    HAL_UART_Receive_IT(&huart2, &rxByte, 1);

    /* 啟動定時器 */
    HAL_TIM_Base_Start_IT(&htim2);

    uint32_t lastSampleTime = 0;
    uint32_t sampleCount = 0;

    /* 主循環 */
    while (1)
    {
        uint32_t currentTime = HAL_GetTick();

        /* 處理命令 */
        if (cmdReady)
        {
            cmdReady = 0;
            ProcessCommand();
        }

        /* 定期採樣 */
        if (monitoringEnabled && (currentTime - lastSampleTime >= sampleInterval))
        {
            lastSampleTime = currentTime;
            sampleCount++;

            /* 讀取感測器數據 */
            BME280_ReadData(&currentData);
            currentData.timestamp = currentTime / 1000;

            /* 更新系統狀態 */
            UpdateSystemStatus();

            /* 更新 LED 指示 */
            UpdateLED();

            /* 顯示數據 */
            UART_Printf("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\r\n");
            UART_Printf("樣本 #%lu | 時間: %lu 秒\r\n", sampleCount, currentData.timestamp);
            UART_Printf("溫度：%.2f °C", currentData.temperature);

            /* 溫度警告 */
            if (currentData.temperature > TEMP_HIGH_THRESHOLD)
            {
                UART_Printf(" ⚠️ 過高！");
            }
            else if (currentData.temperature < TEMP_LOW_THRESHOLD)
            {
                UART_Printf(" ⚠️ 過低！");
            }
            else
            {
                UART_Printf(" ✓");
            }
            UART_Printf("\r\n");

            UART_Printf("濕度：%.2f %%", currentData.humidity);
            if (currentData.humidity > HUM_HIGH_THRESHOLD)
            {
                UART_Printf(" ⚠️ 過濕！");
            }
            else if (currentData.humidity < HUM_LOW_THRESHOLD)
            {
                UART_Printf(" ⚠️ 過乾！");
            }
            else
            {
                UART_Printf(" ✓");
            }
            UART_Printf("\r\n");

            UART_Printf("氣壓：%.2f hPa\r\n", currentData.pressure / 100.0f);
            UART_Printf("狀態：");

            switch (systemStatus)
            {
                case SYS_NORMAL:
                    UART_Printf("正常運行");
                    break;
                case SYS_TEMP_HIGH:
                    UART_Printf("溫度過高警告");
                    break;
                case SYS_TEMP_LOW:
                    UART_Printf("溫度過低警告");
                    break;
                case SYS_HUM_HIGH:
                    UART_Printf("濕度過高警告");
                    break;
                case SYS_HUM_LOW:
                    UART_Printf("濕度過低警告");
                    break;
                default:
                    UART_Printf("系統錯誤");
                    break;
            }
            UART_Printf("\r\n");

            /* 記錄數據到 SD 卡 */
            if (loggingEnabled)
            {
                LogDataToSD();
            }
        }

        /* 省電模式 */
        __WFI();
    }
}

/**
 * I2C1 初始化
 */
static void I2C1_Init(void)
{
    __HAL_RCC_I2C1_CLK_ENABLE();

    hi2c1.Instance = I2C1;
    hi2c1.Init.ClockSpeed = 100000;
    hi2c1.Init.DutyCycle = I2C_DUTYCYCLE_2;
    hi2c1.Init.OwnAddress1 = 0;
    hi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
    hi2c1.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
    hi2c1.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
    hi2c1.Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;

    HAL_I2C_Init(&hi2c1);
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

    HAL_UART_Init(&huart2);

    /* 啟用中斷 */
    HAL_NVIC_SetPriority(USART2_IRQn, 5, 0);
    HAL_NVIC_EnableIRQ(USART2_IRQn);
}

/**
 * TIM2 初始化（用於 LED 閃爍）
 */
static void TIM2_Init(void)
{
    __HAL_RCC_TIM2_CLK_ENABLE();

    htim2.Instance = TIM2;
    htim2.Init.Prescaler = 16000 - 1;  // 假設 84MHz / 16000 = 5.25kHz
    htim2.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim2.Init.Period = 5250 - 1;      // 1 Hz (1秒)
    htim2.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;

    HAL_TIM_Base_Init(&htim2);

    HAL_NVIC_SetPriority(TIM2_IRQn, 10, 0);
    HAL_NVIC_EnableIRQ(TIM2_IRQn);
}

/**
 * GPIO 初始化
 */
static void GPIO_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();

    /* LED (PA5) */
    GPIO_InitStruct.Pin = GPIO_PIN_5;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* UART2 (PA2, PA3) */
    GPIO_InitStruct.Pin = GPIO_PIN_2 | GPIO_PIN_3;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF7_USART2;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* I2C1 (PB8, PB9) */
    GPIO_InitStruct.Pin = GPIO_PIN_8 | GPIO_PIN_9;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_OD;
    GPIO_InitStruct.Pull = GPIO_PULLUP;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF4_I2C1;
    HAL_GPIO_Init(GPIOB, &GPIO_InitStruct);
}

/**
 * BME280 初始化（簡化版）
 */
static uint8_t BME280_Init(void)
{
    uint8_t chipId;

    /* 讀取晶片 ID */
    if (HAL_I2C_Mem_Read(&hi2c1, BME280_ADDR, BME280_REG_ID, 1,
                         &chipId, 1, 1000) != HAL_OK)
    {
        return HAL_ERROR;
    }

    if (chipId != 0x60)
    {
        return HAL_ERROR;
    }

    /* 配置感測器（簡化） */
    uint8_t config[] = {0x01, 0x27, 0xA0};
    HAL_I2C_Mem_Write(&hi2c1, BME280_ADDR, 0xF2, 1, &config[0], 1, 1000);
    HAL_I2C_Mem_Write(&hi2c1, BME280_ADDR, 0xF4, 1, &config[1], 1, 1000);
    HAL_I2C_Mem_Write(&hi2c1, BME280_ADDR, 0xF5, 1, &config[2], 1, 1000);

    return HAL_OK;
}

/**
 * 讀取 BME280 數據（簡化版）
 */
static void BME280_ReadData(SensorData_t *data)
{
    uint8_t rawData[8];

    /* 讀取原始數據 */
    HAL_I2C_Mem_Read(&hi2c1, BME280_ADDR, 0xF7, 1, rawData, 8, 1000);

    /* 簡化的數據轉換（實際應使用校準參數） */
    int32_t adc_T = (rawData[3] << 12) | (rawData[4] << 4) | (rawData[5] >> 4);
    int32_t adc_P = (rawData[0] << 12) | (rawData[1] << 4) | (rawData[2] >> 4);
    int32_t adc_H = (rawData[6] << 8) | rawData[7];

    /* 簡化計算（實際應使用 Bosch 的補償公式） */
    data->temperature = (float)adc_T / 5242.88f;
    data->pressure = (float)adc_P / 256.0f;
    data->humidity = (float)adc_H / 1024.0f;
}

/**
 * 更新系統狀態
 */
static void UpdateSystemStatus(void)
{
    if (currentData.temperature > TEMP_HIGH_THRESHOLD)
    {
        systemStatus = SYS_TEMP_HIGH;
    }
    else if (currentData.temperature < TEMP_LOW_THRESHOLD)
    {
        systemStatus = SYS_TEMP_LOW;
    }
    else if (currentData.humidity > HUM_HIGH_THRESHOLD)
    {
        systemStatus = SYS_HUM_HIGH;
    }
    else if (currentData.humidity < HUM_LOW_THRESHOLD)
    {
        systemStatus = SYS_HUM_LOW;
    }
    else
    {
        systemStatus = SYS_NORMAL;
    }
}

/**
 * 更新 LED 警告指示
 */
static void UpdateLED(void)
{
    if (systemStatus == SYS_NORMAL)
    {
        /* 正常：LED 常亮 */
        HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);
    }
    else
    {
        /* 警告：LED 會在定時器中斷中閃爍 */
    }
}

/**
 * 處理 UART 命令
 */
static void ProcessCommand(void)
{
    rxBuffer[rxIndex] = '\0';

    if (strcmp((char*)rxBuffer, "help") == 0)
    {
        PrintHelp();
    }
    else if (strcmp((char*)rxBuffer, "status") == 0)
    {
        PrintStatus();
    }
    else if (strcmp((char*)rxBuffer, "start") == 0)
    {
        monitoringEnabled = 1;
        UART_Printf("監控已啟動\r\n");
    }
    else if (strcmp((char*)rxBuffer, "stop") == 0)
    {
        monitoringEnabled = 0;
        UART_Printf("監控已停止\r\n");
    }
    else if (strncmp((char*)rxBuffer, "interval ", 9) == 0)
    {
        uint32_t newInterval = atoi((char*)&rxBuffer[9]);
        if (newInterval >= 100 && newInterval <= 60000)
        {
            sampleInterval = newInterval;
            UART_Printf("採樣間隔已設定為 %lu ms\r\n", sampleInterval);
        }
        else
        {
            UART_Printf("錯誤：間隔必須在 100-60000 ms 之間\r\n");
        }
    }
    else if (rxIndex > 0)
    {
        UART_Printf("未知命令：%s\r\n", rxBuffer);
    }

    rxIndex = 0;
    UART_Printf("> ");
}

/**
 * 顯示幫助資訊
 */
static void PrintHelp(void)
{
    UART_Printf("\r\n可用命令：\r\n");
    UART_Printf("  help              - 顯示此幫助訊息\r\n");
    UART_Printf("  status            - 顯示系統狀態\r\n");
    UART_Printf("  start             - 啟動監控\r\n");
    UART_Printf("  stop              - 停止監控\r\n");
    UART_Printf("  interval <ms>     - 設定採樣間隔（100-60000ms）\r\n");
    UART_Printf("\r\n");
}

/**
 * 顯示系統狀態
 */
static void PrintStatus(void)
{
    UART_Printf("\r\n系統狀態報告：\r\n");
    UART_Printf("  監控狀態：%s\r\n", monitoringEnabled ? "運行中" : "已停止");
    UART_Printf("  採樣間隔：%lu ms\r\n", sampleInterval);
    UART_Printf("  運行時間：%lu 秒\r\n", HAL_GetTick() / 1000);
    UART_Printf("  最新溫度：%.2f °C\r\n", currentData.temperature);
    UART_Printf("  最新濕度：%.2f %%\r\n", currentData.humidity);
    UART_Printf("  最新氣壓：%.2f hPa\r\n", currentData.pressure / 100.0f);
    UART_Printf("\r\n");
}

/**
 * 記錄數據到 SD 卡（預留功能）
 */
static void LogDataToSD(void)
{
    /* TODO: 實作 SD 卡數據記錄 */
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
 * UART 接收完成回調
 */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart->Instance == USART2)
    {
        HAL_UART_Transmit(&huart2, &rxByte, 1, 10);

        if (rxByte == '\r' || rxByte == '\n')
        {
            UART_Printf("\r\n");
            cmdReady = 1;
        }
        else if (rxIndex < sizeof(rxBuffer) - 1)
        {
            rxBuffer[rxIndex++] = rxByte;
        }

        HAL_UART_Receive_IT(&huart2, &rxByte, 1);
    }
}

/**
 * 定時器中斷回調（LED 閃爍）
 */
void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
    if (htim->Instance == TIM2)
    {
        if (systemStatus != SYS_NORMAL)
        {
            HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
        }
    }
}

/**
 * USART2 中斷處理
 */
void USART2_IRQHandler(void)
{
    HAL_UART_IRQHandler(&huart2);
}

/**
 * TIM2 中斷處理
 */
void TIM2_IRQHandler(void)
{
    HAL_TIM_IRQHandler(&htim2);
}

/**
 * 錯誤處理
 */
void Error_Handler(void)
{
    __disable_irq();
    while (1)
    {
        HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
        HAL_Delay(100);
    }
}
