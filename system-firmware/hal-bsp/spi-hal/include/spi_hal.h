/**
 * @file spi_hal.h
 * @brief SPI Hardware Abstraction Layer Interface
 * @version 1.0.0
 */

#ifndef SPI_HAL_H
#define SPI_HAL_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

/* SPI 模式 */
typedef enum {
    SPI_MODE_MASTER = 0,
    SPI_MODE_SLAVE
} spi_mode_t;

/* 時鐘極性 */
typedef enum {
    SPI_CPOL_LOW = 0,
    SPI_CPOL_HIGH
} spi_cpol_t;

/* 時鐘相位 */
typedef enum {
    SPI_CPHA_1EDGE = 0,
    SPI_CPHA_2EDGE
} spi_cpha_t;

/* 數據大小 */
typedef enum {
    SPI_DATASIZE_8BIT = 0,
    SPI_DATASIZE_16BIT
} spi_datasize_t;

/* 首位順序 */
typedef enum {
    SPI_FIRSTBIT_MSB = 0,
    SPI_FIRSTBIT_LSB
} spi_firstbit_t;

/* 波特率分頻 */
typedef enum {
    SPI_BAUDRATE_PRESCALER_2 = 0,
    SPI_BAUDRATE_PRESCALER_4,
    SPI_BAUDRATE_PRESCALER_8,
    SPI_BAUDRATE_PRESCALER_16,
    SPI_BAUDRATE_PRESCALER_32,
    SPI_BAUDRATE_PRESCALER_64,
    SPI_BAUDRATE_PRESCALER_128,
    SPI_BAUDRATE_PRESCALER_256
} spi_baudrate_prescaler_t;

/* SPI 配置 */
typedef struct {
    spi_mode_t mode;
    spi_cpol_t clock_polarity;
    spi_cpha_t clock_phase;
    spi_baudrate_prescaler_t baudrate_prescaler;
    spi_datasize_t data_size;
    spi_firstbit_t first_bit;
} spi_config_t;

/* SPI 句柄 */
typedef void* spi_handle_t;

/* API 函數 */
spi_handle_t spi_init(uint8_t spi_num, const spi_config_t *config);
int spi_deinit(spi_handle_t handle);
int spi_transfer(spi_handle_t handle, const uint8_t *tx_data, uint8_t *rx_data, size_t len);
int spi_transmit(spi_handle_t handle, const uint8_t *data, size_t len);
int spi_receive(spi_handle_t handle, uint8_t *data, size_t len);
int spi_transfer_dma(spi_handle_t handle, const uint8_t *tx_data, uint8_t *rx_data, size_t len);

#ifdef __cplusplus
}
#endif

#endif /* SPI_HAL_H */
