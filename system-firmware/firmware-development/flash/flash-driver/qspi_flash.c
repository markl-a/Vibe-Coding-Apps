/**
 * @file qspi_flash.c
 * @brief QSPI NOR Flash Driver Implementation
 */

#include "qspi_flash.h"
#include <string.h>

/* Flash parameters */
#define QSPI_PAGE_SIZE          256
#define QSPI_SECTOR_SIZE        4096
#define QSPI_BLOCK_SIZE         65536
#define QSPI_DUMMY_CYCLES       6

/* Status register bits */
#define QSPI_SR_BUSY            0x01

/* Timeout values */
#define QSPI_TIMEOUT_PROGRAM    5
#define QSPI_TIMEOUT_ERASE      400
#define QSPI_TIMEOUT_CHIP_ERASE 200000

/* Private variables */
static const qspi_flash_io_t *qspi_io = NULL;
static uint32_t flash_size = 0;
static qspi_mode_t current_mode = QSPI_MODE_SPI;
static bool initialized = false;
static bool memory_mapped_mode = false;

/* Forward declarations */
static flash_status_t qspi_flash_ops_init(void);
static flash_status_t qspi_flash_ops_deinit(void);
static flash_status_t qspi_flash_ops_read(uint32_t address, uint8_t *data, uint32_t size);
static flash_status_t qspi_flash_ops_write(uint32_t address, const uint8_t *data, uint32_t size);
static flash_status_t qspi_flash_ops_erase_sector(uint32_t address);
static flash_status_t qspi_flash_ops_erase_block(uint32_t address);
static flash_status_t qspi_flash_ops_erase_chip(void);
static flash_status_t qspi_flash_ops_wait_ready(uint32_t timeout_ms);
static flash_status_t qspi_flash_ops_get_info(flash_info_t *info);

/* Flash operations structure */
static const flash_ops_t qspi_flash_ops = {
    .init = qspi_flash_ops_init,
    .deinit = qspi_flash_ops_deinit,
    .read = qspi_flash_ops_read,
    .write = qspi_flash_ops_write,
    .write_page = NULL,
    .erase_sector = qspi_flash_ops_erase_sector,
    .erase_block = qspi_flash_ops_erase_block,
    .erase_chip = qspi_flash_ops_erase_chip,
    .get_status = NULL,
    .wait_ready = qspi_flash_ops_wait_ready,
    .get_info = qspi_flash_ops_get_info,
};

/* Flash device structure */
static flash_device_t qspi_flash_device = {
    .name = "qspi_flash",
    .info = {
        .type = FLASH_TYPE_QSPI,
        .total_size = 0,
        .page_size = QSPI_PAGE_SIZE,
        .block_size = QSPI_BLOCK_SIZE,
        .sector_count = 0,
        .manufacturer_id = 0,
        .device_id = 0,
        .is_initialized = false,
    },
    .ops = &qspi_flash_ops,
    .priv = NULL,
};

/**
 * @brief Initialize QSPI flash
 */
flash_status_t qspi_flash_init(const qspi_flash_config_t *config)
{
    if (config == NULL || config->io == NULL) {
        return FLASH_INVALID_PARAM;
    }

    qspi_io = config->io;
    flash_size = config->total_size;
    current_mode = config->default_mode;

    /* Initialize QSPI peripheral */
    if (qspi_io->init != NULL) {
        flash_status_t status = qspi_io->init();
        if (status != FLASH_OK) {
            return status;
        }
    }

    /* Reset flash to known state */
    qspi_flash_reset();

    /* Read and verify device ID */
    uint8_t mfr_id;
    uint16_t dev_id;
    flash_status_t status = qspi_flash_read_id(&mfr_id, &dev_id);
    if (status != FLASH_OK) {
        return status;
    }

    /* Update device info */
    qspi_flash_device.info.manufacturer_id = mfr_id;
    qspi_flash_device.info.device_id = dev_id;
    qspi_flash_device.info.total_size = flash_size;
    qspi_flash_device.info.sector_count = flash_size / QSPI_SECTOR_SIZE;
    qspi_flash_device.info.is_initialized = true;

    initialized = true;
    return FLASH_OK;
}

/**
 * @brief De-initialize QSPI flash
 */
flash_status_t qspi_flash_deinit(void)
{
    if (memory_mapped_mode && qspi_io != NULL && qspi_io->memory_mapped_disable != NULL) {
        qspi_io->memory_mapped_disable();
        memory_mapped_mode = false;
    }

    if (qspi_io != NULL && qspi_io->deinit != NULL) {
        qspi_io->deinit();
    }

    initialized = false;
    qspi_flash_device.info.is_initialized = false;
    return FLASH_OK;
}

/**
 * @brief Reset QSPI flash
 */
flash_status_t qspi_flash_reset(void)
{
    if (qspi_io == NULL || qspi_io->command == NULL) {
        return FLASH_NOT_INITIALIZED;
    }

    qspi_line_config_t config = {
        .instruction_lines = 1,
        .address_lines = 0,
        .data_lines = 0,
        .alternate_lines = 0,
        .dummy_cycles = 0,
    };

    /* Enable reset */
    qspi_io->command(QSPI_CMD_ENABLE_RESET, &config, 0, NULL, NULL, 0);

    /* Small delay */
    if (qspi_io->delay_ms != NULL) {
        qspi_io->delay_ms(1);
    }

    /* Reset device */
    qspi_io->command(QSPI_CMD_RESET_DEVICE, &config, 0, NULL, NULL, 0);

    /* Wait for reset to complete */
    if (qspi_io->delay_ms != NULL) {
        qspi_io->delay_ms(1);
    }

    return FLASH_OK;
}

/**
 * @brief Read device ID
 */
flash_status_t qspi_flash_read_id(uint8_t *manufacturer_id, uint16_t *device_id)
{
    if (qspi_io == NULL || manufacturer_id == NULL || device_id == NULL) {
        return FLASH_INVALID_PARAM;
    }

    qspi_line_config_t config = {
        .instruction_lines = 1,
        .address_lines = 0,
        .data_lines = 1,
        .alternate_lines = 0,
        .dummy_cycles = 0,
    };

    uint8_t id_buffer[3] = {0};
    flash_status_t status = qspi_io->command(QSPI_CMD_READ_ID, &config, 0,
                                             NULL, id_buffer, 3);
    if (status != FLASH_OK) {
        return status;
    }

    *manufacturer_id = id_buffer[0];
    *device_id = (id_buffer[1] << 8) | id_buffer[2];

    return FLASH_OK;
}

/**
 * @brief Read status register
 */
flash_status_t qspi_flash_read_status(uint8_t *status)
{
    if (qspi_io == NULL || status == NULL) {
        return FLASH_INVALID_PARAM;
    }

    qspi_line_config_t config = {
        .instruction_lines = 1,
        .address_lines = 0,
        .data_lines = 1,
        .alternate_lines = 0,
        .dummy_cycles = 0,
    };

    return qspi_io->command(QSPI_CMD_READ_STATUS_REG, &config, 0,
                            NULL, status, 1);
}

/**
 * @brief Write enable
 */
flash_status_t qspi_flash_write_enable(void)
{
    if (qspi_io == NULL) {
        return FLASH_NOT_INITIALIZED;
    }

    qspi_line_config_t config = {
        .instruction_lines = 1,
        .address_lines = 0,
        .data_lines = 0,
        .alternate_lines = 0,
        .dummy_cycles = 0,
    };

    return qspi_io->command(QSPI_CMD_WRITE_ENABLE, &config, 0, NULL, NULL, 0);
}

/**
 * @brief Wait until ready
 */
flash_status_t qspi_flash_wait_ready(uint32_t timeout_ms)
{
    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    uint32_t count = 0;
    uint8_t status;

    while (1) {
        flash_status_t result = qspi_flash_read_status(&status);
        if (result != FLASH_OK) {
            return result;
        }

        if (!(status & QSPI_SR_BUSY)) {
            return FLASH_OK;
        }

        if (++count > timeout_ms) {
            return FLASH_TIMEOUT;
        }

        if (qspi_io->delay_ms != NULL) {
            qspi_io->delay_ms(1);
        }
    }
}

/**
 * @brief Read data in standard mode
 */
flash_status_t qspi_flash_read(uint32_t address, uint8_t *data, uint32_t size)
{
    if (qspi_io == NULL || data == NULL || size == 0) {
        return FLASH_INVALID_PARAM;
    }

    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    if (address + size > flash_size) {
        return FLASH_INVALID_PARAM;
    }

    qspi_line_config_t config = {
        .instruction_lines = 1,
        .address_lines = 1,
        .data_lines = 1,
        .alternate_lines = 0,
        .dummy_cycles = 0,
    };

    return qspi_io->command(QSPI_CMD_READ_DATA, &config, address,
                            NULL, data, size);
}

/**
 * @brief Fast read in quad mode
 */
flash_status_t qspi_flash_fast_read_quad(uint32_t address, uint8_t *data, uint32_t size)
{
    if (qspi_io == NULL || data == NULL || size == 0) {
        return FLASH_INVALID_PARAM;
    }

    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    if (address + size > flash_size) {
        return FLASH_INVALID_PARAM;
    }

    qspi_line_config_t config = {
        .instruction_lines = 1,
        .address_lines = 1,
        .data_lines = 4,
        .alternate_lines = 0,
        .dummy_cycles = QSPI_DUMMY_CYCLES,
    };

    return qspi_io->command(QSPI_CMD_FAST_READ_QUAD_OUT, &config, address,
                            NULL, data, size);
}

/**
 * @brief Write page in standard mode
 */
flash_status_t qspi_flash_write_page(uint32_t address, const uint8_t *data, uint32_t size)
{
    if (qspi_io == NULL || data == NULL || size == 0 || size > QSPI_PAGE_SIZE) {
        return FLASH_INVALID_PARAM;
    }

    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    /* Write enable */
    flash_status_t status = qspi_flash_write_enable();
    if (status != FLASH_OK) {
        return status;
    }

    qspi_line_config_t config = {
        .instruction_lines = 1,
        .address_lines = 1,
        .data_lines = 1,
        .alternate_lines = 0,
        .dummy_cycles = 0,
    };

    status = qspi_io->command(QSPI_CMD_PAGE_PROGRAM, &config, address,
                              data, NULL, size);
    if (status != FLASH_OK) {
        return status;
    }

    /* Wait for completion */
    return qspi_flash_wait_ready(QSPI_TIMEOUT_PROGRAM);
}

/**
 * @brief Write page in quad mode
 */
flash_status_t qspi_flash_quad_write_page(uint32_t address, const uint8_t *data, uint32_t size)
{
    if (qspi_io == NULL || data == NULL || size == 0 || size > QSPI_PAGE_SIZE) {
        return FLASH_INVALID_PARAM;
    }

    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    /* Write enable */
    flash_status_t status = qspi_flash_write_enable();
    if (status != FLASH_OK) {
        return status;
    }

    qspi_line_config_t config = {
        .instruction_lines = 1,
        .address_lines = 1,
        .data_lines = 4,
        .alternate_lines = 0,
        .dummy_cycles = 0,
    };

    status = qspi_io->command(QSPI_CMD_QUAD_PAGE_PROGRAM, &config, address,
                              data, NULL, size);
    if (status != FLASH_OK) {
        return status;
    }

    /* Wait for completion */
    return qspi_flash_wait_ready(QSPI_TIMEOUT_PROGRAM);
}

/**
 * @brief Write data (handles multiple pages)
 */
flash_status_t qspi_flash_write(uint32_t address, const uint8_t *data, uint32_t size)
{
    if (data == NULL || size == 0) {
        return FLASH_INVALID_PARAM;
    }

    uint32_t remaining = size;
    uint32_t current_addr = address;
    const uint8_t *current_data = data;

    while (remaining > 0) {
        /* Calculate bytes to write in this page */
        uint32_t page_offset = current_addr % QSPI_PAGE_SIZE;
        uint32_t page_remaining = QSPI_PAGE_SIZE - page_offset;
        uint32_t write_size = (remaining < page_remaining) ? remaining : page_remaining;

        /* Write page (use quad mode if enabled) */
        flash_status_t status;
        if (current_mode >= QSPI_MODE_QUAD_OUT) {
            status = qspi_flash_quad_write_page(current_addr, current_data, write_size);
        } else {
            status = qspi_flash_write_page(current_addr, current_data, write_size);
        }

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
 * @brief Erase sector
 */
flash_status_t qspi_flash_erase_sector(uint32_t address)
{
    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    if (address >= flash_size) {
        return FLASH_INVALID_PARAM;
    }

    /* Write enable */
    flash_status_t status = qspi_flash_write_enable();
    if (status != FLASH_OK) {
        return status;
    }

    qspi_line_config_t config = {
        .instruction_lines = 1,
        .address_lines = 1,
        .data_lines = 0,
        .alternate_lines = 0,
        .dummy_cycles = 0,
    };

    status = qspi_io->command(QSPI_CMD_SECTOR_ERASE, &config, address,
                              NULL, NULL, 0);
    if (status != FLASH_OK) {
        return status;
    }

    /* Wait for completion */
    return qspi_flash_wait_ready(QSPI_TIMEOUT_ERASE);
}

/**
 * @brief Erase 64KB block
 */
flash_status_t qspi_flash_erase_block(uint32_t address)
{
    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    /* Write enable */
    flash_status_t status = qspi_flash_write_enable();
    if (status != FLASH_OK) {
        return status;
    }

    qspi_line_config_t config = {
        .instruction_lines = 1,
        .address_lines = 1,
        .data_lines = 0,
        .alternate_lines = 0,
        .dummy_cycles = 0,
    };

    status = qspi_io->command(QSPI_CMD_BLOCK_ERASE_64K, &config, address,
                              NULL, NULL, 0);
    if (status != FLASH_OK) {
        return status;
    }

    /* Wait for completion */
    return qspi_flash_wait_ready(QSPI_TIMEOUT_ERASE * 10);
}

/**
 * @brief Erase entire chip
 */
flash_status_t qspi_flash_erase_chip(void)
{
    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    /* Write enable */
    flash_status_t status = qspi_flash_write_enable();
    if (status != FLASH_OK) {
        return status;
    }

    qspi_line_config_t config = {
        .instruction_lines = 1,
        .address_lines = 0,
        .data_lines = 0,
        .alternate_lines = 0,
        .dummy_cycles = 0,
    };

    status = qspi_io->command(QSPI_CMD_CHIP_ERASE, &config, 0,
                              NULL, NULL, 0);
    if (status != FLASH_OK) {
        return status;
    }

    /* Wait for completion */
    return qspi_flash_wait_ready(QSPI_TIMEOUT_CHIP_ERASE);
}

/**
 * @brief Enter QPI mode
 */
flash_status_t qspi_flash_enter_qpi_mode(void)
{
    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    qspi_line_config_t config = {
        .instruction_lines = 1,
        .address_lines = 0,
        .data_lines = 0,
        .alternate_lines = 0,
        .dummy_cycles = 0,
    };

    flash_status_t status = qspi_io->command(QSPI_CMD_ENTER_QPI_MODE, &config, 0,
                                             NULL, NULL, 0);
    if (status == FLASH_OK) {
        current_mode = QSPI_MODE_QPI;
    }

    return status;
}

/**
 * @brief Exit QPI mode
 */
flash_status_t qspi_flash_exit_qpi_mode(void)
{
    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    qspi_line_config_t config = {
        .instruction_lines = 4,
        .address_lines = 0,
        .data_lines = 0,
        .alternate_lines = 0,
        .dummy_cycles = 0,
    };

    flash_status_t status = qspi_io->command(QSPI_CMD_EXIT_QPI_MODE, &config, 0,
                                             NULL, NULL, 0);
    if (status == FLASH_OK) {
        current_mode = QSPI_MODE_SPI;
    }

    return status;
}

/**
 * @brief Enable memory-mapped mode
 */
flash_status_t qspi_flash_enable_memory_mapped(void)
{
    if (qspi_io == NULL || qspi_io->memory_mapped_enable == NULL) {
        return FLASH_ERROR;
    }

    if (!initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    flash_status_t status = qspi_io->memory_mapped_enable();
    if (status == FLASH_OK) {
        memory_mapped_mode = true;
    }

    return status;
}

/**
 * @brief Disable memory-mapped mode
 */
flash_status_t qspi_flash_disable_memory_mapped(void)
{
    if (qspi_io == NULL || qspi_io->memory_mapped_disable == NULL) {
        return FLASH_ERROR;
    }

    flash_status_t status = qspi_io->memory_mapped_disable();
    if (status == FLASH_OK) {
        memory_mapped_mode = false;
    }

    return status;
}

/**
 * @brief Get QSPI flash device
 */
flash_device_t *qspi_flash_get_device(void)
{
    return &qspi_flash_device;
}

/* HAL operations implementation */

static flash_status_t qspi_flash_ops_init(void)
{
    /* Initialization handled by qspi_flash_init() */
    return FLASH_OK;
}

static flash_status_t qspi_flash_ops_deinit(void)
{
    return qspi_flash_deinit();
}

static flash_status_t qspi_flash_ops_read(uint32_t address, uint8_t *data, uint32_t size)
{
    /* Use fast quad read if available */
    if (current_mode >= QSPI_MODE_QUAD_OUT) {
        return qspi_flash_fast_read_quad(address, data, size);
    } else {
        return qspi_flash_read(address, data, size);
    }
}

static flash_status_t qspi_flash_ops_write(uint32_t address, const uint8_t *data, uint32_t size)
{
    return qspi_flash_write(address, data, size);
}

static flash_status_t qspi_flash_ops_erase_sector(uint32_t address)
{
    return qspi_flash_erase_sector(address);
}

static flash_status_t qspi_flash_ops_erase_block(uint32_t address)
{
    return qspi_flash_erase_block(address);
}

static flash_status_t qspi_flash_ops_erase_chip(void)
{
    return qspi_flash_erase_chip();
}

static flash_status_t qspi_flash_ops_wait_ready(uint32_t timeout_ms)
{
    return qspi_flash_wait_ready(timeout_ms);
}

static flash_status_t qspi_flash_ops_get_info(flash_info_t *info)
{
    if (info == NULL) {
        return FLASH_INVALID_PARAM;
    }

    memcpy(info, &qspi_flash_device.info, sizeof(flash_info_t));
    return FLASH_OK;
}
