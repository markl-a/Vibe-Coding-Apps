/**
 * STM32 ADC + DMA 高速採樣範例
 *
 * 功能：使用 DMA 進行 ADC 連續採樣，無需 CPU 干預
 * 平台：STM32F4
 * 外設：ADC1 + DMA2
 *
 * 特點：
 * - DMA 循環模式，自動採樣
 * - 多通道同時採樣
 * - 採樣完成中斷通知
 * - 數據平均濾波
 *
 * 接線：
 * - PA0: ADC1_IN0 (通道0)
 * - PA1: ADC1_IN1 (通道1)
 * - PA4: ADC1_IN4 (通道2)
 */

#include "stm32f4xx_hal.h"
#include <stdio.h>
#include <string.h>

/* ADC 配置 */
#define ADC_CHANNELS        3       // 採樣通道數
#define ADC_BUFFER_SIZE     300     // 緩衝區大小（每通道100個樣本）
#define SAMPLES_PER_CH      (ADC_BUFFER_SIZE / ADC_CHANNELS)

/* ADC 和 DMA 句柄 */
ADC_HandleTypeDef hadc1;
DMA_HandleTypeDef hdma_adc1;
UART_HandleTypeDef huart2;

/* DMA 緩衝區 */
__attribute__((aligned(4))) uint16_t adc_buffer[ADC_BUFFER_SIZE];

/* 採樣完成標誌 */
volatile uint8_t adc_conversion_complete = 0;

/* 函數聲明 */
void SystemClock_Config(void);
static void GPIO_Init(void);
static void UART_Init(void);
static void ADC_DMA_Init(void);
void Process_ADC_Data(void);

/**
 * 主函數
 */
int main(void)
{
    /* HAL 初始化 */
    HAL_Init();
    SystemClock_Config();

    /* 外設初始化 */
    GPIO_Init();
    UART_Init();
    ADC_DMA_Init();

    char msg[100];
    snprintf(msg, sizeof(msg), "\r\n=== STM32 ADC + DMA 採樣系統 ===\r\n");
    HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);

    snprintf(msg, sizeof(msg), "採樣通道數: %d\r\n", ADC_CHANNELS);
    HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);

    snprintf(msg, sizeof(msg), "每通道樣本數: %d\r\n", SAMPLES_PER_CH);
    HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);

    snprintf(msg, sizeof(msg), "開始 ADC + DMA 採樣...\r\n\r\n");
    HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);

    /* 啟動 ADC + DMA */
    if (HAL_ADC_Start_DMA(&hadc1, (uint32_t*)adc_buffer, ADC_BUFFER_SIZE) != HAL_OK)
    {
        snprintf(msg, sizeof(msg), "❌ ADC DMA 啟動失敗\r\n");
        HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);
        Error_Handler();
    }

    /* 主循環 */
    while (1)
    {
        /* 等待採樣完成 */
        if (adc_conversion_complete)
        {
            adc_conversion_complete = 0;

            /* 處理 ADC 數據 */
            Process_ADC_Data();

            /* LED 閃爍表示數據處理完成 */
            HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
        }

        /* 也可以在這裡執行其他任務，ADC 採樣不會阻塞 CPU */
        HAL_Delay(1000);
    }
}

/**
 * ADC + DMA 初始化
 */
static void ADC_DMA_Init(void)
{
    ADC_ChannelConfTypeDef sConfig = {0};

    /* 啟用時鐘 */
    __HAL_RCC_ADC1_CLK_ENABLE();
    __HAL_RCC_DMA2_CLK_ENABLE();
    __HAL_RCC_GPIOA_CLK_ENABLE();

    /* 配置 GPIO 為模擬輸入 */
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = GPIO_PIN_0 | GPIO_PIN_1 | GPIO_PIN_4;
    GPIO_InitStruct.Mode = GPIO_MODE_ANALOG;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* 配置 DMA */
    hdma_adc1.Instance = DMA2_Stream0;
    hdma_adc1.Init.Channel = DMA_CHANNEL_0;
    hdma_adc1.Init.Direction = DMA_PERIPH_TO_MEMORY;
    hdma_adc1.Init.PeriphInc = DMA_PINC_DISABLE;
    hdma_adc1.Init.MemInc = DMA_MINC_ENABLE;
    hdma_adc1.Init.PeriphDataAlignment = DMA_PDATAALIGN_HALFWORD;
    hdma_adc1.Init.MemDataAlignment = DMA_MDATAALIGN_HALFWORD;
    hdma_adc1.Init.Mode = DMA_CIRCULAR;  // 循環模式
    hdma_adc1.Init.Priority = DMA_PRIORITY_HIGH;
    hdma_adc1.Init.FIFOMode = DMA_FIFOMODE_DISABLE;

    if (HAL_DMA_Init(&hdma_adc1) != HAL_OK)
    {
        Error_Handler();
    }

    __HAL_LINKDMA(&hadc1, DMA_Handle, hdma_adc1);

    /* DMA 中斷配置 */
    HAL_NVIC_SetPriority(DMA2_Stream0_IRQn, 0, 0);
    HAL_NVIC_EnableIRQ(DMA2_Stream0_IRQn);

    /* 配置 ADC */
    hadc1.Instance = ADC1;
    hadc1.Init.ClockPrescaler = ADC_CLOCK_SYNC_PCLK_DIV4;
    hadc1.Init.Resolution = ADC_RESOLUTION_12B;
    hadc1.Init.ScanConvMode = ENABLE;  // 掃描模式
    hadc1.Init.ContinuousConvMode = ENABLE;  // 連續轉換
    hadc1.Init.DiscontinuousConvMode = DISABLE;
    hadc1.Init.ExternalTrigConvEdge = ADC_EXTERNALTRIGCONVEDGE_NONE;
    hadc1.Init.DataAlign = ADC_DATAALIGN_RIGHT;
    hadc1.Init.NbrOfConversion = ADC_CHANNELS;
    hadc1.Init.DMAContinuousRequests = ENABLE;  // DMA 連續請求
    hadc1.Init.EOCSelection = ADC_EOC_SEQ_CONV;

    if (HAL_ADC_Init(&hadc1) != HAL_OK)
    {
        Error_Handler();
    }

    /* 配置 ADC 通道 */
    // 通道 0 (PA0)
    sConfig.Channel = ADC_CHANNEL_0;
    sConfig.Rank = 1;
    sConfig.SamplingTime = ADC_SAMPLETIME_84CYCLES;
    HAL_ADC_ConfigChannel(&hadc1, &sConfig);

    // 通道 1 (PA1)
    sConfig.Channel = ADC_CHANNEL_1;
    sConfig.Rank = 2;
    HAL_ADC_ConfigChannel(&hadc1, &sConfig);

    // 通道 4 (PA4)
    sConfig.Channel = ADC_CHANNEL_4;
    sConfig.Rank = 3;
    HAL_ADC_ConfigChannel(&hadc1, &sConfig);
}

/**
 * 處理 ADC 數據
 */
void Process_ADC_Data(void)
{
    uint32_t sum_ch0 = 0, sum_ch1 = 0, sum_ch2 = 0;
    uint16_t avg_ch0, avg_ch1, avg_ch2;
    float voltage_ch0, voltage_ch1, voltage_ch2;

    /* 計算每個通道的平均值 */
    for (int i = 0; i < SAMPLES_PER_CH; i++)
    {
        sum_ch0 += adc_buffer[i * ADC_CHANNELS + 0];
        sum_ch1 += adc_buffer[i * ADC_CHANNELS + 1];
        sum_ch2 += adc_buffer[i * ADC_CHANNELS + 2];
    }

    avg_ch0 = sum_ch0 / SAMPLES_PER_CH;
    avg_ch1 = sum_ch1 / SAMPLES_PER_CH;
    avg_ch2 = sum_ch2 / SAMPLES_PER_CH;

    /* 轉換為電壓 (12-bit ADC, 3.3V 參考電壓) */
    voltage_ch0 = (avg_ch0 * 3.3f) / 4095.0f;
    voltage_ch1 = (avg_ch1 * 3.3f) / 4095.0f;
    voltage_ch2 = (avg_ch2 * 3.3f) / 4095.0f;

    /* 輸出結果 */
    char msg[200];
    snprintf(msg, sizeof(msg),
             "━━━━━━━━━━━━━━━━━━━━━━━━\r\n"
             "通道0 (PA0): ADC=%4u  電壓=%.3fV\r\n"
             "通道1 (PA1): ADC=%4u  電壓=%.3fV\r\n"
             "通道2 (PA4): ADC=%4u  電壓=%.3fV\r\n"
             "━━━━━━━━━━━━━━━━━━━━━━━━\r\n\r\n",
             avg_ch0, voltage_ch0,
             avg_ch1, voltage_ch1,
             avg_ch2, voltage_ch2);

    HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);
}

/**
 * ADC 轉換完成回調函數
 */
void HAL_ADC_ConvCpltCallback(ADC_HandleTypeDef* hadc)
{
    if (hadc->Instance == ADC1)
    {
        adc_conversion_complete = 1;
    }
}

/**
 * DMA 中斷服務程序
 */
void DMA2_Stream0_IRQHandler(void)
{
    HAL_DMA_IRQHandler(&hdma_adc1);
}

/**
 * GPIO 初始化（LED）
 */
static void GPIO_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    __HAL_RCC_GPIOA_CLK_ENABLE();

    /* LED (PA5) */
    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET);

    GPIO_InitStruct.Pin = GPIO_PIN_5;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);
}

/**
 * UART 初始化（用於調試輸出）
 */
static void UART_Init(void)
{
    __HAL_RCC_USART2_CLK_ENABLE();
    __HAL_RCC_GPIOA_CLK_ENABLE();

    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = GPIO_PIN_2 | GPIO_PIN_3;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF7_USART2;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

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
 * 系統時鐘配置（需要根據實際硬體調整）
 */
void SystemClock_Config(void)
{
    // 時鐘配置代碼（使用 STM32CubeMX 生成）
}

/**
 * 錯誤處理函數
 */
void Error_Handler(void)
{
    __disable_irq();
    while (1)
    {
        // LED 快速閃爍表示錯誤
        HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
        HAL_Delay(100);
    }
}

#ifdef USE_FULL_ASSERT
/**
 * Assert 失敗處理
 */
void assert_failed(uint8_t *file, uint32_t line)
{
    /* 可以在這裡輸出錯誤信息 */
}
#endif /* USE_FULL_ASSERT */
