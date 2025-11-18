/**
 * @file flash_hal.h
 * @brief Flash Hardware Abstraction Layer
 * @details Provides unified interface for different flash types
 *
 * Supported platforms: STM32, ESP32, nRF52
 * Supported flash types: Internal Flash, SPI Flash, QSPI Flash
 */

#ifndef FLASH_HAL_H
#define FLASH_HAL_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Flash types */
typedef enum {
    FLASH_TYPE_INTERNAL = 0,    /* Internal MCU flash */
    FLASH_TYPE_SPI,             /* SPI NOR flash */
    FLASH_TYPE_QSPI,            /* QSPI NOR flash */
    FLASH_TYPE_NAND,            /* NAND flash */
} flash_type_t;

/* Flash status codes */
typedef enum {
    FLASH_OK = 0,
    FLASH_ERROR,
    FLASH_TIMEOUT,
    FLASH_BUSY,
    FLASH_WRITE_PROTECTED,
    FLASH_INVALID_PARAM,
    FLASH_NOT_INITIALIZED,
} flash_status_t;

/* Flash information structure */
typedef struct {
    flash_type_t type;          /* Flash type */
    uint32_t total_size;        /* Total size in bytes */
    uint32_t page_size;         /* Page/sector size in bytes */
    uint32_t block_size;        /* Block size in bytes */
    uint32_t sector_count;      /* Number of sectors */
    uint8_t  manufacturer_id;   /* Manufacturer ID */
    uint16_t device_id;         /* Device ID */
    bool     is_initialized;    /* Initialization status */
} flash_info_t;

/* Flash operations structure (function pointers) */
typedef struct {
    /* Initialization */
    flash_status_t (*init)(void);
    flash_status_t (*deinit)(void);

    /* Read operations */
    flash_status_t (*read)(uint32_t address, uint8_t *data, uint32_t size);

    /* Write operations */
    flash_status_t (*write)(uint32_t address, const uint8_t *data, uint32_t size);
    flash_status_t (*write_page)(uint32_t address, const uint8_t *data, uint32_t size);

    /* Erase operations */
    flash_status_t (*erase_sector)(uint32_t address);
    flash_status_t (*erase_block)(uint32_t address);
    flash_status_t (*erase_chip)(void);

    /* Status operations */
    flash_status_t (*get_status)(void);
    flash_status_t (*wait_ready)(uint32_t timeout_ms);

    /* Information */
    flash_status_t (*get_info)(flash_info_t *info);
} flash_ops_t;

/* Flash device structure */
typedef struct {
    const char *name;           /* Device name */
    flash_info_t info;          /* Flash information */
    const flash_ops_t *ops;     /* Operation functions */
    void *priv;                 /* Private data */
} flash_device_t;

/* HAL API functions */

/**
 * @brief Register a flash device
 * @param device Pointer to flash device structure
 * @return FLASH_OK on success
 */
flash_status_t flash_hal_register(flash_device_t *device);

/**
 * @brief Unregister a flash device
 * @param device Pointer to flash device structure
 * @return FLASH_OK on success
 */
flash_status_t flash_hal_unregister(flash_device_t *device);

/**
 * @brief Get registered flash device by name
 * @param name Device name
 * @return Pointer to device or NULL if not found
 */
flash_device_t *flash_hal_get_device(const char *name);

/**
 * @brief Initialize flash device
 * @param device Pointer to flash device
 * @return FLASH_OK on success
 */
flash_status_t flash_hal_init(flash_device_t *device);

/**
 * @brief De-initialize flash device
 * @param device Pointer to flash device
 * @return FLASH_OK on success
 */
flash_status_t flash_hal_deinit(flash_device_t *device);

/**
 * @brief Read data from flash
 * @param device Pointer to flash device
 * @param address Address to read from
 * @param data Buffer to store read data
 * @param size Number of bytes to read
 * @return FLASH_OK on success
 */
flash_status_t flash_hal_read(flash_device_t *device, uint32_t address,
                               uint8_t *data, uint32_t size);

/**
 * @brief Write data to flash
 * @param device Pointer to flash device
 * @param address Address to write to
 * @param data Data to write
 * @param size Number of bytes to write
 * @return FLASH_OK on success
 */
flash_status_t flash_hal_write(flash_device_t *device, uint32_t address,
                                const uint8_t *data, uint32_t size);

/**
 * @brief Erase flash sector
 * @param device Pointer to flash device
 * @param address Address in sector to erase
 * @return FLASH_OK on success
 */
flash_status_t flash_hal_erase_sector(flash_device_t *device, uint32_t address);

/**
 * @brief Erase flash block
 * @param device Pointer to flash device
 * @param address Address in block to erase
 * @return FLASH_OK on success
 */
flash_status_t flash_hal_erase_block(flash_device_t *device, uint32_t address);

/**
 * @brief Erase entire flash chip
 * @param device Pointer to flash device
 * @return FLASH_OK on success
 */
flash_status_t flash_hal_erase_chip(flash_device_t *device);

/**
 * @brief Get flash device information
 * @param device Pointer to flash device
 * @param info Pointer to store information
 * @return FLASH_OK on success
 */
flash_status_t flash_hal_get_info(flash_device_t *device, flash_info_t *info);

/**
 * @brief Wait for flash to be ready
 * @param device Pointer to flash device
 * @param timeout_ms Timeout in milliseconds
 * @return FLASH_OK when ready
 */
flash_status_t flash_hal_wait_ready(flash_device_t *device, uint32_t timeout_ms);

#ifdef __cplusplus
}
#endif

#endif /* FLASH_HAL_H */
