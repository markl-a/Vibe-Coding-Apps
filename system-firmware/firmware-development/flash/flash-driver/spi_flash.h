/**
 * @file spi_flash.h
 * @brief SPI NOR Flash Driver (W25Qxx Series)
 * @details Supports W25Q16, W25Q32, W25Q64, W25Q128, W25Q256
 */

#ifndef SPI_FLASH_H
#define SPI_FLASH_H

#include "flash_hal.h"

#ifdef __cplusplus
extern "C" {
#endif

/* W25Qxx Command Definitions */
#define W25Q_CMD_WRITE_ENABLE           0x06
#define W25Q_CMD_WRITE_DISABLE          0x04
#define W25Q_CMD_READ_STATUS_REG1       0x05
#define W25Q_CMD_READ_STATUS_REG2       0x35
#define W25Q_CMD_WRITE_STATUS_REG       0x01
#define W25Q_CMD_PAGE_PROGRAM           0x02
#define W25Q_CMD_QUAD_PAGE_PROGRAM      0x32
#define W25Q_CMD_SECTOR_ERASE_4K        0x20
#define W25Q_CMD_BLOCK_ERASE_32K        0x52
#define W25Q_CMD_BLOCK_ERASE_64K        0xD8
#define W25Q_CMD_CHIP_ERASE             0xC7
#define W25Q_CMD_READ_DATA              0x03
#define W25Q_CMD_FAST_READ              0x0B
#define W25Q_CMD_READ_UNIQUE_ID         0x4B
#define W25Q_CMD_READ_JEDEC_ID          0x9F
#define W25Q_CMD_POWER_DOWN             0xB9
#define W25Q_CMD_RELEASE_POWER_DOWN     0xAB

/* Status Register Bits */
#define W25Q_SR_BUSY                    0x01    /* Write in progress */
#define W25Q_SR_WEL                     0x02    /* Write enable latch */
#define W25Q_SR_BP0                     0x04    /* Block protect bit 0 */
#define W25Q_SR_BP1                     0x08    /* Block protect bit 1 */
#define W25Q_SR_BP2                     0x10    /* Block protect bit 2 */
#define W25Q_SR_TB                      0x20    /* Top/bottom protect */
#define W25Q_SR_SEC                     0x40    /* Sector protect */
#define W25Q_SR_SRP0                    0x80    /* Status register protect 0 */

/* Flash sizes */
#define W25Q16_SIZE                     (2 * 1024 * 1024)   /* 2MB */
#define W25Q32_SIZE                     (4 * 1024 * 1024)   /* 4MB */
#define W25Q64_SIZE                     (8 * 1024 * 1024)   /* 8MB */
#define W25Q128_SIZE                    (16 * 1024 * 1024)  /* 16MB */
#define W25Q256_SIZE                    (32 * 1024 * 1024)  /* 32MB */

/* Flash parameters */
#define W25Q_PAGE_SIZE                  256
#define W25Q_SECTOR_SIZE                4096    /* 4KB */
#define W25Q_BLOCK_SIZE_32K             (32 * 1024)
#define W25Q_BLOCK_SIZE_64K             (64 * 1024)

/* Timeout values */
#define W25Q_TIMEOUT_PAGE_PROGRAM       5       /* ms */
#define W25Q_TIMEOUT_SECTOR_ERASE       400     /* ms */
#define W25Q_TIMEOUT_BLOCK_ERASE        2000    /* ms */
#define W25Q_TIMEOUT_CHIP_ERASE         200000  /* ms */

/* SPI Flash device IDs */
typedef enum {
    W25Q16_ID = 0xEF4015,
    W25Q32_ID = 0xEF4016,
    W25Q64_ID = 0xEF4017,
    W25Q128_ID = 0xEF4018,
    W25Q256_ID = 0xEF4019,
} w25q_device_id_t;

/* SPI interface callbacks */
typedef struct {
    /* Initialize SPI peripheral */
    flash_status_t (*init)(void);

    /* De-initialize SPI peripheral */
    flash_status_t (*deinit)(void);

    /* Chip select control */
    void (*cs_low)(void);
    void (*cs_high)(void);

    /* SPI transfer */
    flash_status_t (*transfer)(const uint8_t *tx_data, uint8_t *rx_data, uint32_t size);

    /* Delay function */
    void (*delay_ms)(uint32_t ms);
} spi_flash_io_t;

/* SPI Flash configuration */
typedef struct {
    uint32_t device_id;             /* Expected device ID */
    uint32_t total_size;            /* Total flash size */
    const spi_flash_io_t *io;       /* SPI I/O operations */
} spi_flash_config_t;

/**
 * @brief Initialize SPI flash driver
 * @param config Pointer to configuration
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_init(const spi_flash_config_t *config);

/**
 * @brief De-initialize SPI flash driver
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_deinit(void);

/**
 * @brief Read JEDEC ID
 * @param manufacturer_id Manufacturer ID
 * @param device_id Device ID (16-bit)
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_read_id(uint8_t *manufacturer_id, uint16_t *device_id);

/**
 * @brief Read status register
 * @param status Pointer to store status
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_read_status(uint8_t *status);

/**
 * @brief Write enable
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_write_enable(void);

/**
 * @brief Write disable
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_write_disable(void);

/**
 * @brief Wait until flash is ready
 * @param timeout_ms Timeout in milliseconds
 * @return FLASH_OK when ready
 */
flash_status_t spi_flash_wait_ready(uint32_t timeout_ms);

/**
 * @brief Read data from flash
 * @param address Address to read from
 * @param data Buffer to store data
 * @param size Number of bytes to read
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_read(uint32_t address, uint8_t *data, uint32_t size);

/**
 * @brief Write data to flash (page program)
 * @param address Address to write to
 * @param data Data to write
 * @param size Number of bytes to write (max 256)
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_write_page(uint32_t address, const uint8_t *data, uint32_t size);

/**
 * @brief Write data to flash (handles multiple pages)
 * @param address Address to write to
 * @param data Data to write
 * @param size Number of bytes to write
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_write(uint32_t address, const uint8_t *data, uint32_t size);

/**
 * @brief Erase 4KB sector
 * @param address Address in sector to erase
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_erase_sector(uint32_t address);

/**
 * @brief Erase 32KB block
 * @param address Address in block to erase
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_erase_block_32k(uint32_t address);

/**
 * @brief Erase 64KB block
 * @param address Address in block to erase
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_erase_block_64k(uint32_t address);

/**
 * @brief Erase entire chip
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_erase_chip(void);

/**
 * @brief Power down flash
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_power_down(void);

/**
 * @brief Wake up from power down
 * @return FLASH_OK on success
 */
flash_status_t spi_flash_wake_up(void);

/**
 * @brief Get SPI flash device
 * @return Pointer to flash device structure
 */
flash_device_t *spi_flash_get_device(void);

#ifdef __cplusplus
}
#endif

#endif /* SPI_FLASH_H */
