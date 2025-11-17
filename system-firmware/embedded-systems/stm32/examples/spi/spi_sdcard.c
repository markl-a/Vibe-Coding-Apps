/**
 * STM32 SPI SD 卡讀寫範例
 *
 * 功能：使用 SPI 介面讀寫 SD 卡
 * 平台：STM32F4
 * 開發環境：STM32CubeIDE
 *
 * 硬體連接：
 * - SPI1: PA5 (SCK), PA6 (MISO), PA7 (MOSI)
 * - CS: PA4
 */

#include "main.h"
#include <string.h>
#include <stdio.h>

/* SPI 句柄 */
SPI_HandleTypeDef hspi1;
UART_HandleTypeDef huart2;

/* SD 卡 CS 腳位 */
#define SD_CS_PIN       GPIO_PIN_4
#define SD_CS_PORT      GPIOA

/* SD 卡命令 */
#define CMD0    0       // GO_IDLE_STATE
#define CMD8    8       // SEND_IF_COND
#define CMD55   55      // APP_CMD
#define ACMD41  41      // SD_SEND_OP_COND
#define CMD58   58      // READ_OCR
#define CMD17   17      // READ_SINGLE_BLOCK
#define CMD24   24      // WRITE_BLOCK

/* SD 卡回應 */
#define R1_READY_STATE  0x00
#define R1_IDLE_STATE   0x01

/* 函數原型 */
void SystemClock_Config(void);
static void SPI1_Init(void);
static void UART2_Init(void);
static void GPIO_Init(void);
static void SD_CS_Low(void);
static void SD_CS_High(void);
static uint8_t SD_SendCommand(uint8_t cmd, uint32_t arg);
static uint8_t SD_Init(void);
static uint8_t SD_ReadBlock(uint32_t blockNum, uint8_t *buffer);
static uint8_t SD_WriteBlock(uint32_t blockNum, uint8_t *buffer);
static void UART_Printf(const char* format, ...);

int main(void)
{
    /* 初始化 HAL */
    HAL_Init();

    /* 配置系統時鐘 */
    SystemClock_Config();

    /* 初始化外設 */
    GPIO_Init();
    SPI1_Init();
    UART2_Init();

    UART_Printf("\r\n=== STM32 SPI SD 卡範例 ===\r\n");

    /* 初始化 SD 卡 */
    UART_Printf("正在初始化 SD 卡...\r\n");

    if (SD_Init() != HAL_OK)
    {
        UART_Printf("錯誤：SD 卡初始化失敗！\r\n");
        UART_Printf("請檢查：\r\n");
        UART_Printf("  1. SD 卡是否正確插入\r\n");
        UART_Printf("  2. SPI 接線是否正確\r\n");
        UART_Printf("  3. SD 卡格式是否支援\r\n");
        Error_Handler();
    }

    UART_Printf("SD 卡初始化成功！\r\n\r\n");

    /* 測試數據 */
    uint8_t writeBuffer[512];
    uint8_t readBuffer[512];

    /* 準備寫入數據 */
    for (int i = 0; i < 512; i++)
    {
        writeBuffer[i] = i & 0xFF;
    }

    /* 寫入數據到區塊 0 */
    UART_Printf("寫入測試數據到區塊 0...\r\n");
    if (SD_WriteBlock(0, writeBuffer) == HAL_OK)
    {
        UART_Printf("寫入成功！\r\n");
    }
    else
    {
        UART_Printf("寫入失敗！\r\n");
    }

    /* 讀取數據 */
    UART_Printf("讀取區塊 0 的數據...\r\n");
    if (SD_ReadBlock(0, readBuffer) == HAL_OK)
    {
        UART_Printf("讀取成功！\r\n");

        /* 驗證數據 */
        uint8_t errors = 0;
        for (int i = 0; i < 512; i++)
        {
            if (readBuffer[i] != writeBuffer[i])
            {
                errors++;
            }
        }

        if (errors == 0)
        {
            UART_Printf("數據驗證成功！讀寫完全一致。\r\n");
        }
        else
        {
            UART_Printf("數據驗證失敗！發現 %d 個錯誤。\r\n", errors);
        }

        /* 顯示前 64 個字節 */
        UART_Printf("\r\n前 64 個字節：\r\n");
        for (int i = 0; i < 64; i++)
        {
            UART_Printf("%02X ", readBuffer[i]);
            if ((i + 1) % 16 == 0)
            {
                UART_Printf("\r\n");
            }
        }
    }
    else
    {
        UART_Printf("讀取失敗！\r\n");
    }

    UART_Printf("\r\n測試完成！\r\n");

    /* 主循環 */
    while (1)
    {
        HAL_Delay(1000);
    }
}

/**
 * SPI1 初始化
 */
static void SPI1_Init(void)
{
    __HAL_RCC_SPI1_CLK_ENABLE();

    hspi1.Instance = SPI1;
    hspi1.Init.Mode = SPI_MODE_MASTER;
    hspi1.Init.Direction = SPI_DIRECTION_2LINES;
    hspi1.Init.DataSize = SPI_DATASIZE_8BIT;
    hspi1.Init.CLKPolarity = SPI_POLARITY_LOW;
    hspi1.Init.CLKPhase = SPI_PHASE_1EDGE;
    hspi1.Init.NSS = SPI_NSS_SOFT;
    hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_128;  // 低速初始化
    hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;
    hspi1.Init.TIMode = SPI_TIMODE_DISABLE;
    hspi1.Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;

    if (HAL_SPI_Init(&hspi1) != HAL_OK)
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

    /* UART2 GPIO */
    GPIO_InitStruct.Pin = GPIO_PIN_2 | GPIO_PIN_3;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF7_USART2;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* SPI1 GPIO (PA5: SCK, PA6: MISO, PA7: MOSI) */
    GPIO_InitStruct.Pin = GPIO_PIN_5 | GPIO_PIN_6 | GPIO_PIN_7;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF5_SPI1;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* CS 腳位 (PA4) */
    GPIO_InitStruct.Pin = SD_CS_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(SD_CS_PORT, &GPIO_InitStruct);

    SD_CS_High();  // CS 初始為高電平
}

/**
 * SD 卡 CS 控制
 */
static void SD_CS_Low(void)
{
    HAL_GPIO_WritePin(SD_CS_PORT, SD_CS_PIN, GPIO_PIN_RESET);
}

static void SD_CS_High(void)
{
    HAL_GPIO_WritePin(SD_CS_PORT, SD_CS_PIN, GPIO_PIN_SET);
}

/**
 * 發送命令到 SD 卡
 */
static uint8_t SD_SendCommand(uint8_t cmd, uint32_t arg)
{
    uint8_t buffer[6];
    uint8_t response;
    uint8_t retry = 0;

    /* 構建命令 */
    buffer[0] = cmd | 0x40;
    buffer[1] = (arg >> 24) & 0xFF;
    buffer[2] = (arg >> 16) & 0xFF;
    buffer[3] = (arg >> 8) & 0xFF;
    buffer[4] = arg & 0xFF;
    buffer[5] = 0x95;  // CRC (只對 CMD0 和 CMD8 必要)

    /* 發送命令 */
    SD_CS_Low();
    HAL_SPI_Transmit(&hspi1, buffer, 6, 100);

    /* 等待回應 */
    do {
        HAL_SPI_Receive(&hspi1, &response, 1, 100);
        retry++;
    } while ((response & 0x80) && (retry < 8));

    return response;
}

/**
 * 初始化 SD 卡
 */
static uint8_t SD_Init(void)
{
    uint8_t response;
    uint8_t dummy = 0xFF;
    uint16_t retry;

    /* 發送至少 74 個時鐘脈衝 */
    SD_CS_High();
    for (int i = 0; i < 10; i++)
    {
        HAL_SPI_Transmit(&hspi1, &dummy, 1, 100);
    }

    /* 發送 CMD0 進入 IDLE 狀態 */
    retry = 0;
    do {
        response = SD_SendCommand(CMD0, 0);
        retry++;
    } while ((response != R1_IDLE_STATE) && (retry < 255));

    if (response != R1_IDLE_STATE)
    {
        SD_CS_High();
        return HAL_ERROR;
    }

    /* 發送 CMD8 檢查 SD 卡版本 */
    response = SD_SendCommand(CMD8, 0x1AA);
    if (response == R1_IDLE_STATE)
    {
        /* SD Ver 2.0 或更高 */
        uint8_t ocr[4];
        HAL_SPI_Receive(&hspi1, ocr, 4, 100);
    }

    /* 等待 SD 卡就緒 */
    retry = 0;
    do {
        SD_SendCommand(CMD55, 0);
        response = SD_SendCommand(ACMD41, 0x40000000);
        retry++;
    } while ((response != R1_READY_STATE) && (retry < 255));

    SD_CS_High();

    if (response != R1_READY_STATE)
    {
        return HAL_ERROR;
    }

    return HAL_OK;
}

/**
 * 讀取單個區塊
 */
static uint8_t SD_ReadBlock(uint32_t blockNum, uint8_t *buffer)
{
    uint8_t response;
    uint16_t retry = 0;

    /* 發送 CMD17 */
    response = SD_SendCommand(CMD17, blockNum);
    if (response != 0x00)
    {
        SD_CS_High();
        return HAL_ERROR;
    }

    /* 等待數據令牌 0xFE */
    do {
        HAL_SPI_Receive(&hspi1, &response, 1, 100);
        retry++;
    } while ((response != 0xFE) && (retry < 65535));

    if (response != 0xFE)
    {
        SD_CS_High();
        return HAL_ERROR;
    }

    /* 接收 512 字節數據 */
    HAL_SPI_Receive(&hspi1, buffer, 512, 1000);

    /* 接收並丟棄 CRC */
    uint8_t crc[2];
    HAL_SPI_Receive(&hspi1, crc, 2, 100);

    SD_CS_High();
    return HAL_OK;
}

/**
 * 寫入單個區塊
 */
static uint8_t SD_WriteBlock(uint32_t blockNum, uint8_t *buffer)
{
    uint8_t response;
    uint8_t dataToken = 0xFE;

    /* 發送 CMD24 */
    response = SD_SendCommand(CMD24, blockNum);
    if (response != 0x00)
    {
        SD_CS_High();
        return HAL_ERROR;
    }

    /* 發送數據令牌 */
    HAL_SPI_Transmit(&hspi1, &dataToken, 1, 100);

    /* 發送 512 字節數據 */
    HAL_SPI_Transmit(&hspi1, buffer, 512, 1000);

    /* 發送虛擬 CRC */
    uint8_t crc[2] = {0xFF, 0xFF};
    HAL_SPI_Transmit(&hspi1, crc, 2, 100);

    /* 接收數據回應 */
    HAL_SPI_Receive(&hspi1, &response, 1, 100);

    SD_CS_High();

    /* 檢查回應 */
    if ((response & 0x1F) != 0x05)
    {
        return HAL_ERROR;
    }

    return HAL_OK;
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
