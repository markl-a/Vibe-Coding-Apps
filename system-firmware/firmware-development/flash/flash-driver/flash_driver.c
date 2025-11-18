/**
 * @file flash_driver.c
 * @brief Internal Flash Driver Implementation for STM32
 */

#include "flash_driver.h"
#include <string.h>

/* Simulated flash memory for testing (when not on real hardware) */
#ifndef REAL_HARDWARE
static uint8_t simulated_flash[FLASH_SIZE];
static bool flash_locked = true;
static bool flash_busy = false;
#endif

/* Flash operations implementation */
static flash_status_t internal_flash_ops_init(void);
static flash_status_t internal_flash_ops_deinit(void);
static flash_status_t internal_flash_ops_read(uint32_t address, uint8_t *data, uint32_t size);
static flash_status_t internal_flash_ops_write(uint32_t address, const uint8_t *data, uint32_t size);
static flash_status_t internal_flash_ops_erase_sector(uint32_t address);
static flash_status_t internal_flash_ops_erase_chip(void);
static flash_status_t internal_flash_ops_get_status(void);
static flash_status_t internal_flash_ops_wait_ready(uint32_t timeout_ms);
static flash_status_t internal_flash_ops_get_info(flash_info_t *info);

/* Flash operations structure */
static const flash_ops_t internal_flash_ops = {
    .init = internal_flash_ops_init,
    .deinit = internal_flash_ops_deinit,
    .read = internal_flash_ops_read,
    .write = internal_flash_ops_write,
    .write_page = NULL,
    .erase_sector = internal_flash_ops_erase_sector,
    .erase_block = internal_flash_ops_erase_sector,
    .erase_chip = internal_flash_ops_erase_chip,
    .get_status = internal_flash_ops_get_status,
    .wait_ready = internal_flash_ops_wait_ready,
    .get_info = internal_flash_ops_get_info,
};

/* Flash device structure */
static flash_device_t internal_flash_device = {
    .name = "internal_flash",
    .info = {
        .type = FLASH_TYPE_INTERNAL,
        .total_size = FLASH_SIZE,
        .page_size = FLASH_PAGE_SIZE,
        .block_size = FLASH_PAGE_SIZE,
        .sector_count = FLASH_SIZE / FLASH_PAGE_SIZE,
        .manufacturer_id = 0x00,
        .device_id = 0x0000,
        .is_initialized = false,
    },
    .ops = &internal_flash_ops,
    .priv = NULL,
};

/**
 * @brief Initialize internal flash
 */
flash_status_t internal_flash_init(void)
{
    return internal_flash_ops_init();
}

/**
 * @brief De-initialize internal flash
 */
flash_status_t internal_flash_deinit(void)
{
    return internal_flash_ops_deinit();
}

/**
 * @brief Unlock flash
 */
flash_status_t internal_flash_unlock(void)
{
#ifdef REAL_HARDWARE
    flash_regs_t *flash = (flash_regs_t *)0x40022000; /* STM32 FLASH base */

    /* Check if already unlocked */
    if (!(flash->CR & FLASH_CR_LOCK)) {
        return FLASH_OK;
    }

    /* Unlock sequence */
    flash->KEYR = FLASH_KEY1;
    flash->KEYR = FLASH_KEY2;

    /* Verify unlock */
    if (flash->CR & FLASH_CR_LOCK) {
        return FLASH_ERROR;
    }

    return FLASH_OK;
#else
    flash_locked = false;
    return FLASH_OK;
#endif
}

/**
 * @brief Lock flash
 */
flash_status_t internal_flash_lock(void)
{
#ifdef REAL_HARDWARE
    flash_regs_t *flash = (flash_regs_t *)0x40022000;
    flash->CR |= FLASH_CR_LOCK;
    return FLASH_OK;
#else
    flash_locked = true;
    return FLASH_OK;
#endif
}

/**
 * @brief Read from internal flash
 */
flash_status_t internal_flash_read(uint32_t address, uint8_t *data, uint32_t size)
{
    if (data == NULL || size == 0) {
        return FLASH_INVALID_PARAM;
    }

    if (address < FLASH_BASE_ADDR || address + size > FLASH_BASE_ADDR + FLASH_SIZE) {
        return FLASH_INVALID_PARAM;
    }

#ifdef REAL_HARDWARE
    /* Direct memory read */
    memcpy(data, (void *)address, size);
#else
    /* Simulated read */
    uint32_t offset = address - FLASH_BASE_ADDR;
    memcpy(data, &simulated_flash[offset], size);
#endif

    return FLASH_OK;
}

/**
 * @brief Write to internal flash
 */
flash_status_t internal_flash_write(uint32_t address, const uint8_t *data, uint32_t size)
{
    if (data == NULL || size == 0) {
        return FLASH_INVALID_PARAM;
    }

    if (address < FLASH_BASE_ADDR || address + size > FLASH_BASE_ADDR + FLASH_SIZE) {
        return FLASH_INVALID_PARAM;
    }

#ifdef REAL_HARDWARE
    flash_regs_t *flash = (flash_regs_t *)0x40022000;
    flash_status_t status;

    /* Unlock flash */
    status = internal_flash_unlock();
    if (status != FLASH_OK) {
        return status;
    }

    /* Enable programming */
    flash->CR |= FLASH_CR_PG;

    /* Write data (halfword by halfword for STM32) */
    volatile uint16_t *flash_addr = (volatile uint16_t *)address;
    const uint16_t *data_ptr = (const uint16_t *)data;
    uint32_t count = (size + 1) / 2;

    for (uint32_t i = 0; i < count; i++) {
        *flash_addr++ = *data_ptr++;

        /* Wait for operation to complete */
        status = internal_flash_wait_ready(FLASH_TIMEOUT_MS);
        if (status != FLASH_OK) {
            flash->CR &= ~FLASH_CR_PG;
            internal_flash_lock();
            return status;
        }
    }

    /* Disable programming */
    flash->CR &= ~FLASH_CR_PG;

    /* Lock flash */
    internal_flash_lock();

    return FLASH_OK;
#else
    /* Simulated write */
    if (flash_locked) {
        return FLASH_WRITE_PROTECTED;
    }

    uint32_t offset = address - FLASH_BASE_ADDR;

    /* Check if area is erased (all 0xFF) */
    for (uint32_t i = 0; i < size; i++) {
        if (simulated_flash[offset + i] != 0xFF) {
            return FLASH_ERROR; /* Need to erase first */
        }
    }

    flash_busy = true;
    memcpy(&simulated_flash[offset], data, size);
    flash_busy = false;

    return FLASH_OK;
#endif
}

/**
 * @brief Erase flash page
 */
flash_status_t internal_flash_erase_page(uint32_t address)
{
    if (address < FLASH_BASE_ADDR || address >= FLASH_BASE_ADDR + FLASH_SIZE) {
        return FLASH_INVALID_PARAM;
    }

#ifdef REAL_HARDWARE
    flash_regs_t *flash = (flash_regs_t *)0x40022000;
    flash_status_t status;

    /* Unlock flash */
    status = internal_flash_unlock();
    if (status != FLASH_OK) {
        return status;
    }

    /* Enable page erase */
    flash->CR |= FLASH_CR_PER;

    /* Set page address */
    flash->AR = address;

    /* Start erase */
    flash->CR |= FLASH_CR_STRT;

    /* Wait for completion */
    status = internal_flash_wait_ready(FLASH_TIMEOUT_MS);

    /* Disable page erase */
    flash->CR &= ~FLASH_CR_PER;

    /* Lock flash */
    internal_flash_lock();

    return status;
#else
    /* Simulated erase */
    if (flash_locked) {
        return FLASH_WRITE_PROTECTED;
    }

    uint32_t page_offset = (address - FLASH_BASE_ADDR) / FLASH_PAGE_SIZE * FLASH_PAGE_SIZE;

    flash_busy = true;
    memset(&simulated_flash[page_offset], 0xFF, FLASH_PAGE_SIZE);
    flash_busy = false;

    return FLASH_OK;
#endif
}

/**
 * @brief Erase multiple pages
 */
flash_status_t internal_flash_erase_pages(uint32_t start_address, uint32_t num_pages)
{
    flash_status_t status;

    for (uint32_t i = 0; i < num_pages; i++) {
        uint32_t page_addr = start_address + (i * FLASH_PAGE_SIZE);
        status = internal_flash_erase_page(page_addr);
        if (status != FLASH_OK) {
            return status;
        }
    }

    return FLASH_OK;
}

/**
 * @brief Mass erase entire flash
 */
flash_status_t internal_flash_mass_erase(void)
{
#ifdef REAL_HARDWARE
    flash_regs_t *flash = (flash_regs_t *)0x40022000;
    flash_status_t status;

    /* Unlock flash */
    status = internal_flash_unlock();
    if (status != FLASH_OK) {
        return status;
    }

    /* Enable mass erase */
    flash->CR |= FLASH_CR_MER;

    /* Start erase */
    flash->CR |= FLASH_CR_STRT;

    /* Wait for completion */
    status = internal_flash_wait_ready(FLASH_TIMEOUT_MS);

    /* Disable mass erase */
    flash->CR &= ~FLASH_CR_MER;

    /* Lock flash */
    internal_flash_lock();

    return status;
#else
    if (flash_locked) {
        return FLASH_WRITE_PROTECTED;
    }

    flash_busy = true;
    memset(simulated_flash, 0xFF, FLASH_SIZE);
    flash_busy = false;

    return FLASH_OK;
#endif
}

/**
 * @brief Wait for flash ready
 */
flash_status_t internal_flash_wait_ready(uint32_t timeout_ms)
{
#ifdef REAL_HARDWARE
    flash_regs_t *flash = (flash_regs_t *)0x40022000;
    uint32_t timeout_count = timeout_ms * 1000; /* Approximate */

    while (flash->SR & FLASH_SR_BSY) {
        if (--timeout_count == 0) {
            return FLASH_TIMEOUT;
        }
    }

    /* Check for errors */
    if (flash->SR & (FLASH_SR_WRPRTERR | FLASH_SR_PGAERR)) {
        return FLASH_ERROR;
    }

    return FLASH_OK;
#else
    /* Simulated wait */
    if (flash_busy) {
        return FLASH_BUSY;
    }
    return FLASH_OK;
#endif
}

/**
 * @brief Get flash status
 */
flash_status_t internal_flash_get_status(void)
{
#ifdef REAL_HARDWARE
    flash_regs_t *flash = (flash_regs_t *)0x40022000;

    if (flash->SR & FLASH_SR_BSY) {
        return FLASH_BUSY;
    }

    if (flash->SR & (FLASH_SR_WRPRTERR | FLASH_SR_PGAERR)) {
        return FLASH_ERROR;
    }

    return FLASH_OK;
#else
    return flash_busy ? FLASH_BUSY : FLASH_OK;
#endif
}

/**
 * @brief Get internal flash device
 */
flash_device_t *internal_flash_get_device(void)
{
    return &internal_flash_device;
}

/* HAL operations implementation */

static flash_status_t internal_flash_ops_init(void)
{
#ifndef REAL_HARDWARE
    /* Initialize simulated flash to erased state */
    memset(simulated_flash, 0xFF, FLASH_SIZE);
    flash_locked = true;
    flash_busy = false;
#endif

    internal_flash_device.info.is_initialized = true;
    return FLASH_OK;
}

static flash_status_t internal_flash_ops_deinit(void)
{
    internal_flash_device.info.is_initialized = false;
    return internal_flash_lock();
}

static flash_status_t internal_flash_ops_read(uint32_t address, uint8_t *data, uint32_t size)
{
    return internal_flash_read(FLASH_BASE_ADDR + address, data, size);
}

static flash_status_t internal_flash_ops_write(uint32_t address, const uint8_t *data, uint32_t size)
{
    return internal_flash_write(FLASH_BASE_ADDR + address, data, size);
}

static flash_status_t internal_flash_ops_erase_sector(uint32_t address)
{
    return internal_flash_erase_page(FLASH_BASE_ADDR + address);
}

static flash_status_t internal_flash_ops_erase_chip(void)
{
    return internal_flash_mass_erase();
}

static flash_status_t internal_flash_ops_get_status(void)
{
    return internal_flash_get_status();
}

static flash_status_t internal_flash_ops_wait_ready(uint32_t timeout_ms)
{
    return internal_flash_wait_ready(timeout_ms);
}

static flash_status_t internal_flash_ops_get_info(flash_info_t *info)
{
    if (info == NULL) {
        return FLASH_INVALID_PARAM;
    }

    memcpy(info, &internal_flash_device.info, sizeof(flash_info_t));
    return FLASH_OK;
}
