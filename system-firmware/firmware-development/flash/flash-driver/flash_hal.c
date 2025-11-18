/**
 * @file flash_hal.c
 * @brief Flash Hardware Abstraction Layer Implementation
 */

#include "flash_hal.h"
#include <string.h>
#include <stdlib.h>

/* Maximum number of registered flash devices */
#define MAX_FLASH_DEVICES 4

/* Registered flash devices */
static flash_device_t *registered_devices[MAX_FLASH_DEVICES] = {NULL};
static uint8_t device_count = 0;

/**
 * @brief Register a flash device
 */
flash_status_t flash_hal_register(flash_device_t *device)
{
    if (device == NULL || device->name == NULL || device->ops == NULL) {
        return FLASH_INVALID_PARAM;
    }

    if (device_count >= MAX_FLASH_DEVICES) {
        return FLASH_ERROR;
    }

    /* Check if device already registered */
    for (uint8_t i = 0; i < device_count; i++) {
        if (registered_devices[i] == device) {
            return FLASH_ERROR;
        }
        if (strcmp(registered_devices[i]->name, device->name) == 0) {
            return FLASH_ERROR;
        }
    }

    registered_devices[device_count++] = device;
    return FLASH_OK;
}

/**
 * @brief Unregister a flash device
 */
flash_status_t flash_hal_unregister(flash_device_t *device)
{
    if (device == NULL) {
        return FLASH_INVALID_PARAM;
    }

    for (uint8_t i = 0; i < device_count; i++) {
        if (registered_devices[i] == device) {
            /* Shift remaining devices */
            for (uint8_t j = i; j < device_count - 1; j++) {
                registered_devices[j] = registered_devices[j + 1];
            }
            registered_devices[--device_count] = NULL;
            return FLASH_OK;
        }
    }

    return FLASH_ERROR;
}

/**
 * @brief Get registered flash device by name
 */
flash_device_t *flash_hal_get_device(const char *name)
{
    if (name == NULL) {
        return NULL;
    }

    for (uint8_t i = 0; i < device_count; i++) {
        if (strcmp(registered_devices[i]->name, name) == 0) {
            return registered_devices[i];
        }
    }

    return NULL;
}

/**
 * @brief Initialize flash device
 */
flash_status_t flash_hal_init(flash_device_t *device)
{
    if (device == NULL || device->ops == NULL) {
        return FLASH_INVALID_PARAM;
    }

    if (device->ops->init == NULL) {
        return FLASH_ERROR;
    }

    flash_status_t status = device->ops->init();
    if (status == FLASH_OK) {
        device->info.is_initialized = true;
    }

    return status;
}

/**
 * @brief De-initialize flash device
 */
flash_status_t flash_hal_deinit(flash_device_t *device)
{
    if (device == NULL || device->ops == NULL) {
        return FLASH_INVALID_PARAM;
    }

    if (device->ops->deinit == NULL) {
        return FLASH_ERROR;
    }

    flash_status_t status = device->ops->deinit();
    if (status == FLASH_OK) {
        device->info.is_initialized = false;
    }

    return status;
}

/**
 * @brief Read data from flash
 */
flash_status_t flash_hal_read(flash_device_t *device, uint32_t address,
                               uint8_t *data, uint32_t size)
{
    if (device == NULL || data == NULL || size == 0) {
        return FLASH_INVALID_PARAM;
    }

    if (!device->info.is_initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    if (device->ops == NULL || device->ops->read == NULL) {
        return FLASH_ERROR;
    }

    if (address + size > device->info.total_size) {
        return FLASH_INVALID_PARAM;
    }

    return device->ops->read(address, data, size);
}

/**
 * @brief Write data to flash
 */
flash_status_t flash_hal_write(flash_device_t *device, uint32_t address,
                                const uint8_t *data, uint32_t size)
{
    if (device == NULL || data == NULL || size == 0) {
        return FLASH_INVALID_PARAM;
    }

    if (!device->info.is_initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    if (device->ops == NULL || device->ops->write == NULL) {
        return FLASH_ERROR;
    }

    if (address + size > device->info.total_size) {
        return FLASH_INVALID_PARAM;
    }

    return device->ops->write(address, data, size);
}

/**
 * @brief Erase flash sector
 */
flash_status_t flash_hal_erase_sector(flash_device_t *device, uint32_t address)
{
    if (device == NULL) {
        return FLASH_INVALID_PARAM;
    }

    if (!device->info.is_initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    if (device->ops == NULL || device->ops->erase_sector == NULL) {
        return FLASH_ERROR;
    }

    if (address >= device->info.total_size) {
        return FLASH_INVALID_PARAM;
    }

    return device->ops->erase_sector(address);
}

/**
 * @brief Erase flash block
 */
flash_status_t flash_hal_erase_block(flash_device_t *device, uint32_t address)
{
    if (device == NULL) {
        return FLASH_INVALID_PARAM;
    }

    if (!device->info.is_initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    if (device->ops == NULL || device->ops->erase_block == NULL) {
        return FLASH_ERROR;
    }

    if (address >= device->info.total_size) {
        return FLASH_INVALID_PARAM;
    }

    return device->ops->erase_block(address);
}

/**
 * @brief Erase entire flash chip
 */
flash_status_t flash_hal_erase_chip(flash_device_t *device)
{
    if (device == NULL) {
        return FLASH_INVALID_PARAM;
    }

    if (!device->info.is_initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    if (device->ops == NULL || device->ops->erase_chip == NULL) {
        return FLASH_ERROR;
    }

    return device->ops->erase_chip();
}

/**
 * @brief Get flash device information
 */
flash_status_t flash_hal_get_info(flash_device_t *device, flash_info_t *info)
{
    if (device == NULL || info == NULL) {
        return FLASH_INVALID_PARAM;
    }

    if (device->ops != NULL && device->ops->get_info != NULL) {
        return device->ops->get_info(info);
    }

    /* Copy cached info */
    memcpy(info, &device->info, sizeof(flash_info_t));
    return FLASH_OK;
}

/**
 * @brief Wait for flash to be ready
 */
flash_status_t flash_hal_wait_ready(flash_device_t *device, uint32_t timeout_ms)
{
    if (device == NULL) {
        return FLASH_INVALID_PARAM;
    }

    if (!device->info.is_initialized) {
        return FLASH_NOT_INITIALIZED;
    }

    if (device->ops == NULL || device->ops->wait_ready == NULL) {
        return FLASH_ERROR;
    }

    return device->ops->wait_ready(timeout_ms);
}
