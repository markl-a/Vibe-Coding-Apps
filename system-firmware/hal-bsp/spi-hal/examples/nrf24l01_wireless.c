/**
 * @file nrf24l01_wireless.c
 * @brief SPI 無線模組 (NRF24L01+) 範例
 *
 * 此範例示範如何使用 SPI HAL 控制 NRF24L01+ 無線收發模組
 * 包括初始化、發送和接收數據
 */

#include "spi_hal.h"
#include "gpio_hal.h"
#include <stdio.h>
#include <string.h>

/* 平台相關的延遲函數 */
#ifdef STM32F4
    #include "stm32f4xx_hal.h"
    #define delay_ms(x) HAL_Delay(x)
    #define delay_us(x) /* 需要實作 */
#elif defined(ESP32)
    #include "freertos/FreeRTOS.h"
    #include "freertos/task.h"
    #include "esp_rom_sys.h"
    #define delay_ms(x) vTaskDelay((x) / portTICK_PERIOD_MS)
    #define delay_us(x) esp_rom_delay_us(x)
#else
    #define delay_ms(x) /* 需要實作 */
    #define delay_us(x) /* 需要實作 */
#endif

/* NRF24L01+ 引腳定義 */
#ifdef STM32F4
    #define NRF_CSN_PORT    GPIO_PORT_A
    #define NRF_CSN_PIN     GPIO_PIN_4
    #define NRF_CE_PORT     GPIO_PORT_A
    #define NRF_CE_PIN      GPIO_PIN_3
#else
    #define NRF_CSN_PORT    GPIO_PORT_A
    #define NRF_CSN_PIN     GPIO_PIN_4
    #define NRF_CE_PORT     GPIO_PORT_A
    #define NRF_CE_PIN      GPIO_PIN_3
#endif

#define CSN_LOW()   gpio_reset(NRF_CSN_PORT, NRF_CSN_PIN)
#define CSN_HIGH()  gpio_set(NRF_CSN_PORT, NRF_CSN_PIN)
#define CE_LOW()    gpio_reset(NRF_CE_PORT, NRF_CE_PIN)
#define CE_HIGH()   gpio_set(NRF_CE_PORT, NRF_CE_PIN)

/* NRF24L01+ 寄存器地址 */
#define NRF_REG_CONFIG          0x00
#define NRF_REG_EN_AA           0x01
#define NRF_REG_EN_RXADDR       0x02
#define NRF_REG_SETUP_AW        0x03
#define NRF_REG_SETUP_RETR      0x04
#define NRF_REG_RF_CH           0x05
#define NRF_REG_RF_SETUP        0x06
#define NRF_REG_STATUS          0x07
#define NRF_REG_OBSERVE_TX      0x08
#define NRF_REG_RPD             0x09
#define NRF_REG_RX_ADDR_P0      0x0A
#define NRF_REG_RX_ADDR_P1      0x0B
#define NRF_REG_TX_ADDR         0x10
#define NRF_REG_RX_PW_P0        0x11
#define NRF_REG_RX_PW_P1        0x12
#define NRF_REG_FIFO_STATUS     0x17
#define NRF_REG_DYNPD           0x1C
#define NRF_REG_FEATURE         0x1D

/* NRF24L01+ 命令 */
#define NRF_CMD_R_REGISTER      0x00
#define NRF_CMD_W_REGISTER      0x20
#define NRF_CMD_R_RX_PAYLOAD    0x61
#define NRF_CMD_W_TX_PAYLOAD    0xA0
#define NRF_CMD_FLUSH_TX        0xE1
#define NRF_CMD_FLUSH_RX        0xE2
#define NRF_CMD_REUSE_TX_PL     0xE3
#define NRF_CMD_NOP             0xFF

/* CONFIG 寄存器位 */
#define NRF_CONFIG_MASK_RX_DR   (1 << 6)
#define NRF_CONFIG_MASK_TX_DS   (1 << 5)
#define NRF_CONFIG_MASK_MAX_RT  (1 << 4)
#define NRF_CONFIG_EN_CRC       (1 << 3)
#define NRF_CONFIG_CRCO         (1 << 2)
#define NRF_CONFIG_PWR_UP       (1 << 1)
#define NRF_CONFIG_PRIM_RX      (1 << 0)

/* 狀態寄存器位 */
#define NRF_STATUS_RX_DR        (1 << 6)
#define NRF_STATUS_TX_DS        (1 << 5)
#define NRF_STATUS_MAX_RT       (1 << 4)

/* 參數 */
#define NRF_PAYLOAD_SIZE        32
#define NRF_ADDR_WIDTH          5

/* SPI 句柄 */
static spi_handle_t spi;

/**
 * @brief 初始化 GPIO 引腳
 */
static int init_nrf_pins(void)
{
    gpio_config_t csn_config = {
        .port = NRF_CSN_PORT,
        .pin = NRF_CSN_PIN,
        .mode = GPIO_MODE_OUTPUT_PP,
        .pull = GPIO_PULL_UP,
        .speed = GPIO_SPEED_VERY_HIGH
    };

    gpio_config_t ce_config = {
        .port = NRF_CE_PORT,
        .pin = NRF_CE_PIN,
        .mode = GPIO_MODE_OUTPUT_PP,
        .pull = GPIO_PULL_NONE,
        .speed = GPIO_SPEED_VERY_HIGH
    };

    if (gpio_init(&csn_config) != 0 || gpio_init(&ce_config) != 0) {
        return -1;
    }

    CSN_HIGH();
    CE_LOW();

    return 0;
}

/**
 * @brief SPI 傳輸單個字節
 */
static uint8_t spi_transfer_byte(uint8_t data)
{
    uint8_t rx_data = 0;
    spi_transfer(spi, &data, &rx_data, 1);
    return rx_data;
}

/**
 * @brief 讀取寄存器
 */
static uint8_t nrf_read_reg(uint8_t reg)
{
    uint8_t value;

    CSN_LOW();
    spi_transfer_byte(NRF_CMD_R_REGISTER | reg);
    value = spi_transfer_byte(0xFF);
    CSN_HIGH();

    return value;
}

/**
 * @brief 寫入寄存器
 */
static void nrf_write_reg(uint8_t reg, uint8_t value)
{
    CSN_LOW();
    spi_transfer_byte(NRF_CMD_W_REGISTER | reg);
    spi_transfer_byte(value);
    CSN_HIGH();
}

/**
 * @brief 讀取多字節寄存器
 */
static void nrf_read_buf(uint8_t reg, uint8_t *buf, size_t len)
{
    CSN_LOW();
    spi_transfer_byte(NRF_CMD_R_REGISTER | reg);
    spi_receive(spi, buf, len);
    CSN_HIGH();
}

/**
 * @brief 寫入多字節寄存器
 */
static void nrf_write_buf(uint8_t reg, const uint8_t *buf, size_t len)
{
    CSN_LOW();
    spi_transfer_byte(NRF_CMD_W_REGISTER | reg);
    spi_transmit(spi, buf, len);
    CSN_HIGH();
}

/**
 * @brief 清除 TX FIFO
 */
static void nrf_flush_tx(void)
{
    CSN_LOW();
    spi_transfer_byte(NRF_CMD_FLUSH_TX);
    CSN_HIGH();
}

/**
 * @brief 清除 RX FIFO
 */
static void nrf_flush_rx(void)
{
    CSN_LOW();
    spi_transfer_byte(NRF_CMD_FLUSH_RX);
    CSN_HIGH();
}

/**
 * @brief 初始化 NRF24L01+
 */
static int nrf_init(void)
{
    CE_LOW();
    delay_ms(5);  /* 等待上電穩定 */

    /* 配置基本參數 */
    nrf_write_reg(NRF_REG_CONFIG, 0x0E);  /* CRC 啟用, Power Up, PTX */
    nrf_write_reg(NRF_REG_EN_AA, 0x01);   /* 啟用自動應答 pipe 0 */
    nrf_write_reg(NRF_REG_EN_RXADDR, 0x01);  /* 啟用接收 pipe 0 */
    nrf_write_reg(NRF_REG_SETUP_AW, 0x03);   /* 地址寬度 5 字節 */
    nrf_write_reg(NRF_REG_SETUP_RETR, 0x1A); /* 自動重傳: 500us, 10 次 */
    nrf_write_reg(NRF_REG_RF_CH, 40);        /* 頻道 40 (2440 MHz) */
    nrf_write_reg(NRF_REG_RF_SETUP, 0x07);   /* 1Mbps, 0dBm */
    nrf_write_reg(NRF_REG_RX_PW_P0, NRF_PAYLOAD_SIZE);

    /* 設置地址 */
    uint8_t addr[5] = {0xE7, 0xE7, 0xE7, 0xE7, 0xE7};
    nrf_write_buf(NRF_REG_RX_ADDR_P0, addr, 5);
    nrf_write_buf(NRF_REG_TX_ADDR, addr, 5);

    /* 清除 FIFO */
    nrf_flush_tx();
    nrf_flush_rx();

    /* 清除狀態 */
    nrf_write_reg(NRF_REG_STATUS, 0x70);

    delay_ms(2);  /* 等待上電 */

    return 0;
}

/**
 * @brief 設置為發送模式
 */
static void nrf_set_tx_mode(void)
{
    CE_LOW();
    uint8_t config = nrf_read_reg(NRF_REG_CONFIG);
    config &= ~NRF_CONFIG_PRIM_RX;  /* 清除 PRIM_RX 位 */
    nrf_write_reg(NRF_REG_CONFIG, config);
    delay_us(150);
}

/**
 * @brief 設置為接收模式
 */
static void nrf_set_rx_mode(void)
{
    CE_LOW();
    uint8_t config = nrf_read_reg(NRF_REG_CONFIG);
    config |= NRF_CONFIG_PRIM_RX;  /* 設置 PRIM_RX 位 */
    nrf_write_reg(NRF_REG_CONFIG, config);
    CE_HIGH();
    delay_us(150);
}

/**
 * @brief 發送數據包
 */
static int nrf_send_packet(const uint8_t *data, size_t len)
{
    if (len > NRF_PAYLOAD_SIZE) {
        len = NRF_PAYLOAD_SIZE;
    }

    nrf_set_tx_mode();

    /* 清除狀態 */
    nrf_write_reg(NRF_REG_STATUS, 0x70);

    /* 寫入 TX FIFO */
    CSN_LOW();
    spi_transfer_byte(NRF_CMD_W_TX_PAYLOAD);
    spi_transmit(spi, data, len);
    CSN_HIGH();

    /* 啟動發送 */
    CE_HIGH();
    delay_us(15);  /* 至少 10us */
    CE_LOW();

    /* 等待發送完成 */
    uint32_t timeout = 100;  /* 100ms 超時 */
    while (timeout--) {
        uint8_t status = nrf_read_reg(NRF_REG_STATUS);

        if (status & NRF_STATUS_TX_DS) {
            /* 發送成功 */
            nrf_write_reg(NRF_REG_STATUS, NRF_STATUS_TX_DS);
            return 0;
        }

        if (status & NRF_STATUS_MAX_RT) {
            /* 達到最大重傳次數 */
            nrf_write_reg(NRF_REG_STATUS, NRF_STATUS_MAX_RT);
            nrf_flush_tx();
            return -1;
        }

        delay_ms(1);
    }

    return -1;  /* 超時 */
}

/**
 * @brief 接收數據包
 */
static int nrf_receive_packet(uint8_t *data, size_t max_len)
{
    uint8_t status = nrf_read_reg(NRF_REG_STATUS);

    if (status & NRF_STATUS_RX_DR) {
        /* 有數據可用 */
        size_t len = (max_len < NRF_PAYLOAD_SIZE) ? max_len : NRF_PAYLOAD_SIZE;

        CSN_LOW();
        spi_transfer_byte(NRF_CMD_R_RX_PAYLOAD);
        spi_receive(spi, data, len);
        CSN_HIGH();

        /* 清除 RX_DR 標誌 */
        nrf_write_reg(NRF_REG_STATUS, NRF_STATUS_RX_DR);

        return len;
    }

    return 0;  /* 無數據 */
}

/**
 * @brief 打印寄存器值
 */
static void nrf_print_registers(void)
{
    printf("\nNRF24L01+ Registers:\n");
    printf("CONFIG:      0x%02X\n", nrf_read_reg(NRF_REG_CONFIG));
    printf("EN_AA:       0x%02X\n", nrf_read_reg(NRF_REG_EN_AA));
    printf("EN_RXADDR:   0x%02X\n", nrf_read_reg(NRF_REG_EN_RXADDR));
    printf("SETUP_AW:    0x%02X\n", nrf_read_reg(NRF_REG_SETUP_AW));
    printf("SETUP_RETR:  0x%02X\n", nrf_read_reg(NRF_REG_SETUP_RETR));
    printf("RF_CH:       0x%02X\n", nrf_read_reg(NRF_REG_RF_CH));
    printf("RF_SETUP:    0x%02X\n", nrf_read_reg(NRF_REG_RF_SETUP));
    printf("STATUS:      0x%02X\n", nrf_read_reg(NRF_REG_STATUS));
    printf("FIFO_STATUS: 0x%02X\n", nrf_read_reg(NRF_REG_FIFO_STATUS));

    uint8_t addr[5];
    nrf_read_buf(NRF_REG_TX_ADDR, addr, 5);
    printf("TX_ADDR:     %02X:%02X:%02X:%02X:%02X\n",
           addr[0], addr[1], addr[2], addr[3], addr[4]);
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
    printf("SPI HAL - NRF24L01+ Wireless Example\n");
    printf("========================================\n\n");

    /* 初始化 GPIO */
    if (init_nrf_pins() != 0) {
        printf("Error: Failed to initialize GPIO pins\n");
        return -1;
    }
    printf("GPIO pins initialized\n");

    /* 配置 SPI */
    spi_config_t spi_config = {
        .mode = SPI_MODE_MASTER,
        .clock_polarity = SPI_CPOL_LOW,
        .clock_phase = SPI_CPHA_1EDGE,
        .baudrate_prescaler = SPI_BAUDRATE_PRESCALER_16,
        .data_size = SPI_DATASIZE_8BIT,
        .first_bit = SPI_FIRSTBIT_MSB
    };

    spi = spi_init(1, &spi_config);
    if (!spi) {
        printf("Error: Failed to initialize SPI\n");
        return -1;
    }
    printf("SPI initialized\n");

    /* 初始化 NRF24L01+ */
    printf("Initializing NRF24L01+...\n");
    if (nrf_init() != 0) {
        printf("Error: NRF24L01+ initialization failed\n");
        goto cleanup;
    }
    printf("NRF24L01+ initialized successfully!\n");

    /* 打印配置 */
    nrf_print_registers();

    /* 選擇模式 */
    printf("\n========================================\n");
    printf("Select mode:\n");
    printf("  1. Transmitter\n");
    printf("  2. Receiver\n");
    printf("========================================\n");
    printf("Enter mode (1 or 2): ");

    /* 簡化版: 這裡使用發送模式示範 */
    int mode = 1;  /* 1=TX, 2=RX */

    if (mode == 1) {
        /* 發送模式 */
        printf("\n--- Transmitter Mode ---\n");
        printf("Sending packets every second...\n\n");

        uint32_t packet_count = 0;
        uint32_t success_count = 0;

        while (1) {
            char message[32];
            snprintf(message, sizeof(message), "Packet #%lu", packet_count);

            printf("Sending: \"%s\"... ", message);

            if (nrf_send_packet((const uint8_t *)message, strlen(message) + 1) == 0) {
                printf("✓ Success\n");
                success_count++;
            } else {
                printf("✗ Failed (no ACK)\n");
            }

            packet_count++;

            if (packet_count % 10 == 0) {
                printf("\nStatistics:\n");
                printf("  Total packets: %lu\n", packet_count);
                printf("  Success: %lu (%.1f%%)\n",
                       success_count,
                       (success_count * 100.0f) / packet_count);
                printf("  Failed: %lu\n\n", packet_count - success_count);
            }

            delay_ms(1000);
        }

    } else {
        /* 接收模式 */
        printf("\n--- Receiver Mode ---\n");
        printf("Waiting for packets...\n\n");

        nrf_set_rx_mode();

        while (1) {
            uint8_t buffer[NRF_PAYLOAD_SIZE];

            int len = nrf_receive_packet(buffer, sizeof(buffer));

            if (len > 0) {
                buffer[len - 1] = '\0';  /* 確保字符串終止 */
                printf("Received (%d bytes): \"%s\"\n", len, buffer);

                /* 打印十六進制 */
                printf("  Hex: ");
                for (int i = 0; i < len; i++) {
                    printf("%02X ", buffer[i]);
                }
                printf("\n");
            }

            delay_ms(10);
        }
    }

cleanup:
    spi_deinit(spi);
    return 0;
}
