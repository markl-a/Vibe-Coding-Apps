/**
 * @file qspi_flash.h
 * @brief QSPI NOR Flash Driver
 * @details Supports high-speed QSPI flash with 4-bit data interface
 */

#ifndef QSPI_FLASH_H
#define QSPI_FLASH_H

#include "flash_hal.h"

#ifdef __cplusplus
extern "C" {
#endif

/* QSPI Commands (extended from SPI) */
#define QSPI_CMD_WRITE_ENABLE           0x06
#define QSPI_CMD_WRITE_DISABLE          0x04
#define QSPI_CMD_READ_STATUS_REG        0x05
#define QSPI_CMD_WRITE_STATUS_REG       0x01
#define QSPI_CMD_READ_DATA              0x03
#define QSPI_CMD_FAST_READ              0x0B
#define QSPI_CMD_FAST_READ_DUAL_OUT     0x3B
#define QSPI_CMD_FAST_READ_QUAD_OUT     0x6B
#define QSPI_CMD_FAST_READ_DUAL_IO      0xBB
#define QSPI_CMD_FAST_READ_QUAD_IO      0xEB
#define QSPI_CMD_PAGE_PROGRAM           0x02
#define QSPI_CMD_QUAD_PAGE_PROGRAM      0x32
#define QSPI_CMD_SECTOR_ERASE           0x20
#define QSPI_CMD_BLOCK_ERASE_32K        0x52
#define QSPI_CMD_BLOCK_ERASE_64K        0xD8
#define QSPI_CMD_CHIP_ERASE             0xC7
#define QSPI_CMD_READ_ID                0x9F
#define QSPI_CMD_ENABLE_RESET           0x66
#define QSPI_CMD_RESET_DEVICE           0x99
#define QSPI_CMD_ENTER_QPI_MODE         0x38
#define QSPI_CMD_EXIT_QPI_MODE          0xFF

/* QSPI modes */
typedef enum {
    QSPI_MODE_SPI = 0,          /* Standard SPI mode (1-1-1) */
    QSPI_MODE_DUAL_OUT,         /* Dual output (1-1-2) */
    QSPI_MODE_QUAD_OUT,         /* Quad output (1-1-4) */
    QSPI_MODE_DUAL_IO,          /* Dual I/O (1-2-2) */
    QSPI_MODE_QUAD_IO,          /* Quad I/O (1-4-4) */
    QSPI_MODE_QPI,              /* QPI mode (4-4-4) */
} qspi_mode_t;

/* QSPI line modes for different phases */
typedef struct {
    uint8_t instruction_lines;  /* Number of lines for instruction (1 or 4) */
    uint8_t address_lines;      /* Number of lines for address (1, 2, or 4) */
    uint8_t data_lines;         /* Number of lines for data (1, 2, or 4) */
    uint8_t alternate_lines;    /* Number of lines for alternate bytes */
    uint8_t dummy_cycles;       /* Number of dummy cycles */
} qspi_line_config_t;

/* QSPI interface callbacks */
typedef struct {
    /* Initialize QSPI peripheral */
    flash_status_t (*init)(void);

    /* De-initialize QSPI peripheral */
    flash_status_t (*deinit)(void);

    /* Send command with data */
    flash_status_t (*command)(uint8_t cmd, const qspi_line_config_t *config,
                              uint32_t address, const uint8_t *tx_data,
                              uint8_t *rx_data, uint32_t data_size);

    /* Indirect read mode */
    flash_status_t (*read_indirect)(uint32_t address, uint8_t *data, uint32_t size);

    /* Indirect write mode */
    flash_status_t (*write_indirect)(uint32_t address, const uint8_t *data, uint32_t size);

    /* Memory mapped mode enable/disable */
    flash_status_t (*memory_mapped_enable)(void);
    flash_status_t (*memory_mapped_disable)(void);

    /* Delay function */
    void (*delay_ms)(uint32_t ms);
} qspi_flash_io_t;

/* QSPI Flash configuration */
typedef struct {
    uint32_t device_id;         /* Expected device ID */
    uint32_t total_size;        /* Total flash size */
    qspi_mode_t default_mode;   /* Default QSPI mode */
    const qspi_flash_io_t *io;  /* QSPI I/O operations */
} qspi_flash_config_t;

/**
 * @brief Initialize QSPI flash driver
 * @param config Pointer to configuration
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_init(const qspi_flash_config_t *config);

/**
 * @brief De-initialize QSPI flash driver
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_deinit(void);

/**
 * @brief Reset QSPI flash
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_reset(void);

/**
 * @brief Read device ID
 * @param manufacturer_id Manufacturer ID
 * @param device_id Device ID (16-bit)
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_read_id(uint8_t *manufacturer_id, uint16_t *device_id);

/**
 * @brief Read status register
 * @param status Pointer to store status
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_read_status(uint8_t *status);

/**
 * @brief Write enable
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_write_enable(void);

/**
 * @brief Wait until ready
 * @param timeout_ms Timeout in milliseconds
 * @return FLASH_OK when ready
 */
flash_status_t qspi_flash_wait_ready(uint32_t timeout_ms);

/**
 * @brief Read data in standard SPI mode
 * @param address Address to read from
 * @param data Buffer to store data
 * @param size Number of bytes to read
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_read(uint32_t address, uint8_t *data, uint32_t size);

/**
 * @brief Fast read in quad mode
 * @param address Address to read from
 * @param data Buffer to store data
 * @param size Number of bytes to read
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_fast_read_quad(uint32_t address, uint8_t *data, uint32_t size);

/**
 * @brief Write page (standard mode)
 * @param address Address to write to
 * @param data Data to write
 * @param size Number of bytes to write
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_write_page(uint32_t address, const uint8_t *data, uint32_t size);

/**
 * @brief Write page (quad mode)
 * @param address Address to write to
 * @param data Data to write
 * @param size Number of bytes to write
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_quad_write_page(uint32_t address, const uint8_t *data, uint32_t size);

/**
 * @brief Write data (handles multiple pages)
 * @param address Address to write to
 * @param data Data to write
 * @param size Number of bytes to write
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_write(uint32_t address, const uint8_t *data, uint32_t size);

/**
 * @brief Erase sector
 * @param address Address in sector to erase
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_erase_sector(uint32_t address);

/**
 * @brief Erase 64KB block
 * @param address Address in block to erase
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_erase_block(uint32_t address);

/**
 * @brief Erase entire chip
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_erase_chip(void);

/**
 * @brief Enter QPI mode (4-4-4)
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_enter_qpi_mode(void);

/**
 * @brief Exit QPI mode to SPI mode
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_exit_qpi_mode(void);

/**
 * @brief Enable memory-mapped mode for XIP
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_enable_memory_mapped(void);

/**
 * @brief Disable memory-mapped mode
 * @return FLASH_OK on success
 */
flash_status_t qspi_flash_disable_memory_mapped(void);

/**
 * @brief Get QSPI flash device
 * @return Pointer to flash device structure
 */
flash_device_t *qspi_flash_get_device(void);

#ifdef __cplusplus
}
#endif

#endif /* QSPI_FLASH_H */
