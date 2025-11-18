/**
 * @file flash_driver.h
 * @brief Internal Flash Driver for STM32
 * @details Supports STM32F1, STM32F4, STM32L4 series
 */

#ifndef FLASH_DRIVER_H
#define FLASH_DRIVER_H

#include "flash_hal.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Platform-specific definitions */
#if defined(STM32F1)
    #define FLASH_PAGE_SIZE         0x400       /* 1KB */
    #define FLASH_BASE_ADDR         0x08000000
    #define FLASH_SIZE              (128 * 1024) /* 128KB typical */
#elif defined(STM32F4)
    #define FLASH_PAGE_SIZE         0x4000      /* 16KB sector */
    #define FLASH_BASE_ADDR         0x08000000
    #define FLASH_SIZE              (512 * 1024) /* 512KB typical */
#elif defined(STM32L4)
    #define FLASH_PAGE_SIZE         0x800       /* 2KB */
    #define FLASH_BASE_ADDR         0x08000000
    #define FLASH_SIZE              (256 * 1024) /* 256KB typical */
#else
    /* Default values for testing */
    #define FLASH_PAGE_SIZE         0x1000      /* 4KB */
    #define FLASH_BASE_ADDR         0x08000000
    #define FLASH_SIZE              (128 * 1024)
#endif

/* Flash registers (generic) */
typedef struct {
    volatile uint32_t ACR;      /* Access control register */
    volatile uint32_t KEYR;     /* Key register */
    volatile uint32_t OPTKEYR;  /* Option key register */
    volatile uint32_t SR;       /* Status register */
    volatile uint32_t CR;       /* Control register */
} flash_regs_t;

/* Flash status register bits */
#define FLASH_SR_BSY            (1 << 0)    /* Busy */
#define FLASH_SR_EOP            (1 << 5)    /* End of operation */
#define FLASH_SR_WRPRTERR       (1 << 4)    /* Write protection error */
#define FLASH_SR_PGAERR         (1 << 7)    /* Programming alignment error */

/* Flash control register bits */
#define FLASH_CR_PG             (1 << 0)    /* Programming */
#define FLASH_CR_PER            (1 << 1)    /* Page erase */
#define FLASH_CR_MER            (1 << 2)    /* Mass erase */
#define FLASH_CR_STRT           (1 << 6)    /* Start */
#define FLASH_CR_LOCK           (1 << 7)    /* Lock */

/* Flash unlock keys */
#define FLASH_KEY1              0x45670123
#define FLASH_KEY2              0xCDEF89AB

/* Timeout values */
#define FLASH_TIMEOUT_MS        5000

/**
 * @brief Initialize internal flash driver
 * @return FLASH_OK on success
 */
flash_status_t internal_flash_init(void);

/**
 * @brief De-initialize internal flash driver
 * @return FLASH_OK on success
 */
flash_status_t internal_flash_deinit(void);

/**
 * @brief Unlock flash for write/erase operations
 * @return FLASH_OK on success
 */
flash_status_t internal_flash_unlock(void);

/**
 * @brief Lock flash
 * @return FLASH_OK on success
 */
flash_status_t internal_flash_lock(void);

/**
 * @brief Read data from internal flash
 * @param address Address to read from (absolute)
 * @param data Buffer to store data
 * @param size Number of bytes to read
 * @return FLASH_OK on success
 */
flash_status_t internal_flash_read(uint32_t address, uint8_t *data, uint32_t size);

/**
 * @brief Write data to internal flash
 * @param address Address to write to (absolute)
 * @param data Data to write
 * @param size Number of bytes to write
 * @return FLASH_OK on success
 */
flash_status_t internal_flash_write(uint32_t address, const uint8_t *data, uint32_t size);

/**
 * @brief Erase flash page
 * @param address Address in page to erase
 * @return FLASH_OK on success
 */
flash_status_t internal_flash_erase_page(uint32_t address);

/**
 * @brief Erase multiple pages
 * @param start_address Start address
 * @param num_pages Number of pages to erase
 * @return FLASH_OK on success
 */
flash_status_t internal_flash_erase_pages(uint32_t start_address, uint32_t num_pages);

/**
 * @brief Mass erase entire flash
 * @return FLASH_OK on success
 */
flash_status_t internal_flash_mass_erase(void);

/**
 * @brief Wait for flash operation to complete
 * @param timeout_ms Timeout in milliseconds
 * @return FLASH_OK when ready
 */
flash_status_t internal_flash_wait_ready(uint32_t timeout_ms);

/**
 * @brief Get flash status
 * @return Flash status
 */
flash_status_t internal_flash_get_status(void);

/**
 * @brief Get internal flash device
 * @return Pointer to flash device structure
 */
flash_device_t *internal_flash_get_device(void);

#ifdef __cplusplus
}
#endif

#endif /* FLASH_DRIVER_H */
