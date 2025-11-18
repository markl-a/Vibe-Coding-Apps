/**
 * @file spi_flash.c
 * @brief SPI NOR Flash Driver Implementation
 */

#include "spi_flash.h"
#include <string.h>

/* Private variables */
static const spi_flash_io_t *spi_io = NULL;
static uint32_t flash_size = 0;
static bool initialized = false;

/* Forward declarations */
static flash_status_t spi_flash_ops_init(void);
static flash_status_t spi_flash_ops_deinit(void);
static flash_status_t spi_flash_ops_read(uint32_t address, uint8_t *data, uint32_t size);
static flash_status_t spi_flash_ops_write(uint32_t address, const uint8_t *data, uint32_t size);
static flash_status_t spi_flash_ops_write_page(uint32_t address, const uint8_t *data, uint32_t size);
static flash_status_t spi_flash_ops_erase_sector(uint32_t address);
static flash_status_t spi_flash_ops_erase_block(uint32_t address);
static flash_status_t spi_flash_ops_erase_chip(void);
static flash_status_t spi_flash_ops_wait_ready(uint32_t timeout_ms);
static flash_status_t spi_flash_ops_get_info(flash_info_t *info);

/* Flash operations structure */
static const flash_ops_t spi_flash_ops = {
    .init = spi_flash_ops_init,
    .deinit = spi_flash_ops_deinit,
    .read = spi_flash_ops_read,
    .write = spi_flash_ops_write,
    .write_page = spi_flash_ops_write_page,
    .erase_sector = spi_flash_ops_erase_sector,
    .erase_block = spi_flash_ops_erase_block,
    .erase_chip = spi_flash_ops_erase_chip,
    .get_status = NULL,
    .wait_ready = spi_flash_ops_wait_ready,
    .get_info = spi_flash_ops_get_info,
};

/* Flash device structure */
static flash_device_t spi_flash_device = {
    .name = "spi_flash",
    .info = {
        .type = FLASH_TYPE_SPI,
        .total_size = 0,
        .page_size = W25Q_PAGE_SIZE,
        .block_size = W25Q_BLOCK_SIZE_64K,
        .sector_count = 0,
        .manufacturer_id = 0,
        .device_id = 0,
        .is_initialized = false,
    },
    .ops = &spi_flash_ops,
    .priv = NULL,
};

/**
 * @brief Initialize SPI flash
 */
flash_status_t spi_flash_init(const spi_flash_config_t *config)
{
    if (config == NULL || config->io == NULL) {
        return FLASH_INVALID_PARAM;
    }

    spi_io = config->io;
    flash_size = config->total_size;

    /* Initialize SPI peripheral */
    if (spi_io->init != NULL) {
        flash_status_t status = spi_io->init();
        if (status != FLASH_OK) {
            return status;
        }
    }

    /* Read and verify device ID */
    uint8_t mfr_id;
    uint16_t dev_id;
    flash_status_t status = spi_flash_read_id(&mfr_id, &dev_id);
    if (status != FLASH_OK) {
        return status;
    }

    /* Update device info */
    spi_flash_device.info.manufacturer_id = mfr_id;
    spi_flash_device.info.device_id = dev_id;
    spi_flash_device.info.total_size = flash_size;
    spi_flash_device.info.sector_count = flash_size / W25Q_SECTOR_SIZE;
    spi_flash_device.info.is_initialized = true;

    initialized = true;
    return FLASH_OK;
}

/**
 * @brief De-initialize SPI flash
 */
flash_status_t spi_flash_deinit(void)
{
    if (spi_io != NULL && spi_io->deinit != NULL) {
        spi_io->deinit();
    }

    initialized = false;
    spi_flash_device.info.is_initialized = false;
    return FLASH_OK;
}

/**
 * @brief Read JEDEC ID
 */
flash_status_t spi_flash_read_id(uint8_t *manufacturer_id, uint16_t *device_id)
{
    if (spi_io == NULL || manufacturer_id == NULL || device_id == NULL) {
        return FLASH_INVALID_PARAM;
    }

    uint8_t cmd = W25Q_CMD_READ_JEDEC_ID;
    uint8_t id_buffer[3] = {0};

    spi_io->cs_low();
    spi_io->transfer(&cmd, NULL, 1);
    spi_io->transfer(NULL, id_buffer, 3);
    spi_io->cs_high();

    *manufacturer_id = id_buffer[0];
    *device_id = (id_buffer[1] << 8) | id_buffer[2];

    return FLASH_OK;
}

/**
 * @brief Read status register
 */
flash_status_t spi_flash_read_status(uint8_t *status)
{
    if (spi_io == NULL || status == NULL) {
        return FLASH_INVALID_PARAM;
    }

    uint8_t cmd = W25Q_CMD_READ_STATUS_REG1;

    spi_io->cs_low();
    spi_io->transfer(&cmd, NULL, 1);
    spi_io->transfer(NULL, status, 1);
    spi_io->cs_high();

    return FLASH_OK;
}

/**
 * @brief Write enable
 */
flash_status_t spi_flash_write_enable(void)
{
    if (spi_io == NULL) {
        return FLASH_NOT_INITIALIZED;
    }

    uint8_t cmd = W25Q_CMD_WRITE_ENABLE;

    spi_io->cs_low();
    spi_io->transfer(&cmd, NULL, 1);
    spi_io->cs_high();

    return FLASH_OK;
}

/**
 * @brief Write disable
 */
flash_status_t spi_flash_write_disable(void)
{
    if (spi_io == NULL) {
        return FLASH_NOT_INITIALIZED;
    }

    uint8_t cmd = W25Q_CMD_WRITE_DISABLE;

    spi_io->cs_low();
    spi_io->transfer(&cmd, NULL, 1);
    spi_io->cs_high();

    return FLASH_OK;
}

/**
 * @brief Wait until flash is ready
 */
flash_status_t spi_flash_wait_ready(uint32_t timeout_ms)
{
    if (spi_io == NULL) {
        return FLASH_NOT_INITIALIZED;
    }

    uint32_t start_time = 0; /* Should use actual timer */
    uint8_t status;

    while (1) {
        flash_status_t result = spi_flash_read_status(&status);
        if (result != FLASH_OK) {
            return result;
        }

        if (!(status & W25Q_SR_BUSY)) {
            return FLASH_OK;
        }

        /* Simple timeout check (should be improved with real timer) */
        if (++start_time > timeout_ms) {
            return FLASH_TIMEOUT;
        }

        if (spi_io->delay_ms != NULL) {
            spi_io->delay_ms(1);
        }
    }
}

/**
 * @brief Read data from flash
 */
flash_status_t spi_flash_read(uint32_t address, uint8_t *data, uint32_t size)
{
    if (spi_io == NULL || data == NULL || size == 0) {
        return FLASH_INVALID_PARAM;
    }

    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    if (address + size > flash_size) {
        return FLASH_INVALID_PARAM;
    }

    uint8_t cmd[4];
    cmd[0] = W25Q_CMD_READ_DATA;
    cmd[1] = (address >> 16) & 0xFF;
    cmd[2] = (address >> 8) & 0xFF;
    cmd[3] = address & 0xFF;

    spi_io->cs_low();
    spi_io->transfer(cmd, NULL, 4);
    spi_io->transfer(NULL, data, size);
    spi_io->cs_high();

    return FLASH_OK;
}

/**
 * @brief Write page (up to 256 bytes)
 */
flash_status_t spi_flash_write_page(uint32_t address, const uint8_t *data, uint32_t size)
{
    if (spi_io == NULL || data == NULL || size == 0 || size > W25Q_PAGE_SIZE) {
        return FLASH_INVALID_PARAM;
    }

    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    if (address + size > flash_size) {
        return FLASH_INVALID_PARAM;
    }

    /* Write enable */
    flash_status_t status = spi_flash_write_enable();
    if (status != FLASH_OK) {
        return status;
    }

    /* Page program command */
    uint8_t cmd[4];
    cmd[0] = W25Q_CMD_PAGE_PROGRAM;
    cmd[1] = (address >> 16) & 0xFF;
    cmd[2] = (address >> 8) & 0xFF;
    cmd[3] = address & 0xFF;

    spi_io->cs_low();
    spi_io->transfer(cmd, NULL, 4);
    spi_io->transfer(data, NULL, size);
    spi_io->cs_high();

    /* Wait for completion */
    return spi_flash_wait_ready(W25Q_TIMEOUT_PAGE_PROGRAM);
}

/**
 * @brief Write data (handles multiple pages)
 */
flash_status_t spi_flash_write(uint32_t address, const uint8_t *data, uint32_t size)
{
    if (data == NULL || size == 0) {
        return FLASH_INVALID_PARAM;
    }

    uint32_t remaining = size;
    uint32_t current_addr = address;
    const uint8_t *current_data = data;

    while (remaining > 0) {
        /* Calculate bytes to write in this page */
        uint32_t page_offset = current_addr % W25Q_PAGE_SIZE;
        uint32_t page_remaining = W25Q_PAGE_SIZE - page_offset;
        uint32_t write_size = (remaining < page_remaining) ? remaining : page_remaining;

        /* Write page */
        flash_status_t status = spi_flash_write_page(current_addr, current_data, write_size);
        if (status != FLASH_OK) {
            return status;
        }

        /* Update for next iteration */
        current_addr += write_size;
        current_data += write_size;
        remaining -= write_size;
    }

    return FLASH_OK;
}

/**
 * @brief Erase 4KB sector
 */
flash_status_t spi_flash_erase_sector(uint32_t address)
{
    if (spi_io == NULL) {
        return FLASH_NOT_INITIALIZED;
    }

    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    if (address >= flash_size) {
        return FLASH_INVALID_PARAM;
    }

    /* Write enable */
    flash_status_t status = spi_flash_write_enable();
    if (status != FLASH_OK) {
        return status;
    }

    /* Sector erase command */
    uint8_t cmd[4];
    cmd[0] = W25Q_CMD_SECTOR_ERASE_4K;
    cmd[1] = (address >> 16) & 0xFF;
    cmd[2] = (address >> 8) & 0xFF;
    cmd[3] = address & 0xFF;

    spi_io->cs_low();
    spi_io->transfer(cmd, NULL, 4);
    spi_io->cs_high();

    /* Wait for completion */
    return spi_flash_wait_ready(W25Q_TIMEOUT_SECTOR_ERASE);
}

/**
 * @brief Erase 32KB block
 */
flash_status_t spi_flash_erase_block_32k(uint32_t address)
{
    if (spi_io == NULL || !initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    /* Write enable */
    flash_status_t status = spi_flash_write_enable();
    if (status != FLASH_OK) {
        return status;
    }

    /* Block erase command */
    uint8_t cmd[4];
    cmd[0] = W25Q_CMD_BLOCK_ERASE_32K;
    cmd[1] = (address >> 16) & 0xFF;
    cmd[2] = (address >> 8) & 0xFF;
    cmd[3] = address & 0xFF;

    spi_io->cs_low();
    spi_io->transfer(cmd, NULL, 4);
    spi_io->cs_high();

    /* Wait for completion */
    return spi_flash_wait_ready(W25Q_TIMEOUT_BLOCK_ERASE);
}

/**
 * @brief Erase 64KB block
 */
flash_status_t spi_flash_erase_block_64k(uint32_t address)
{
    if (spi_io == NULL || !initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    /* Write enable */
    flash_status_t status = spi_flash_write_enable();
    if (status != FLASH_OK) {
        return status;
    }

    /* Block erase command */
    uint8_t cmd[4];
    cmd[0] = W25Q_CMD_BLOCK_ERASE_64K;
    cmd[1] = (address >> 16) & 0xFF;
    cmd[2] = (address >> 8) & 0xFF;
    cmd[3] = address & 0xFF;

    spi_io->cs_low();
    spi_io->transfer(cmd, NULL, 4);
    spi_io->cs_high();

    /* Wait for completion */
    return spi_flash_wait_ready(W25Q_TIMEOUT_BLOCK_ERASE);
}

/**
 * @brief Erase entire chip
 */
flash_status_t spi_flash_erase_chip(void)
{
    if (spi_io == NULL || !initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    /* Write enable */
    flash_status_t status = spi_flash_write_enable();
    if (status != FLASH_OK) {
        return status;
    }

    /* Chip erase command */
    uint8_t cmd = W25Q_CMD_CHIP_ERASE;

    spi_io->cs_low();
    spi_io->transfer(&cmd, NULL, 1);
    spi_io->cs_high();

    /* Wait for completion (this takes a long time) */
    return spi_flash_wait_ready(W25Q_TIMEOUT_CHIP_ERASE);
}

/**
 * @brief Power down flash
 */
flash_status_t spi_flash_power_down(void)
{
    if (spi_io == NULL) {
        return FLASH_NOT_INITIALIZED;
    }

    uint8_t cmd = W25Q_CMD_POWER_DOWN;

    spi_io->cs_low();
    spi_io->transfer(&cmd, NULL, 1);
    spi_io->cs_high();

    return FLASH_OK;
}

/**
 * @brief Wake up from power down
 */
flash_status_t spi_flash_wake_up(void)
{
    if (spi_io == NULL) {
        return FLASH_NOT_INITIALIZED;
    }

    uint8_t cmd = W25Q_CMD_RELEASE_POWER_DOWN;

    spi_io->cs_low();
    spi_io->transfer(&cmd, NULL, 1);
    spi_io->cs_high();

    /* Wait for wake up */
    if (spi_io->delay_ms != NULL) {
        spi_io->delay_ms(1);
    }

    return FLASH_OK;
}

/**
 * @brief Get SPI flash device
 */
flash_device_t *spi_flash_get_device(void)
{
    return &spi_flash_device;
}

/* HAL operations implementation */

static flash_status_t spi_flash_ops_init(void)
{
    /* Initialization handled by spi_flash_init() */
    return FLASH_OK;
}

static flash_status_t spi_flash_ops_deinit(void)
{
    return spi_flash_deinit();
}

static flash_status_t spi_flash_ops_read(uint32_t address, uint8_t *data, uint32_t size)
{
    return spi_flash_read(address, data, size);
}

static flash_status_t spi_flash_ops_write(uint32_t address, const uint8_t *data, uint32_t size)
{
    return spi_flash_write(address, data, size);
}

static flash_status_t spi_flash_ops_write_page(uint32_t address, const uint8_t *data, uint32_t size)
{
    return spi_flash_write_page(address, data, size);
}

static flash_status_t spi_flash_ops_erase_sector(uint32_t address)
{
    return spi_flash_erase_sector(address);
}

static flash_status_t spi_flash_ops_erase_block(uint32_t address)
{
    return spi_flash_erase_block_64k(address);
}

static flash_status_t spi_flash_ops_erase_chip(void)
{
    return spi_flash_erase_chip();
}

static flash_status_t spi_flash_ops_wait_ready(uint32_t timeout_ms)
{
    return spi_flash_wait_ready(timeout_ms);
}

static flash_status_t spi_flash_ops_get_info(flash_info_t *info)
{
    if (info == NULL) {
        return FLASH_INVALID_PARAM;
    }

    memcpy(info, &spi_flash_device.info, sizeof(flash_info_t));
    return FLASH_OK;
}
