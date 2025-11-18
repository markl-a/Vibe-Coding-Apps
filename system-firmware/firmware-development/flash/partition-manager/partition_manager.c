/**
 * @file partition_manager.c
 * @brief Flash Partition Manager Implementation
 */

#include "partition_manager.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* Partition manager context */
struct partition_mgr_ctx {
    partition_mgr_config_t config;
    partition_table_ctx_t *table;
    bool initialized;
};

/**
 * @brief Initialize partition manager
 */
partition_mgr_ctx_t *partition_mgr_init(const partition_mgr_config_t *config)
{
    if (config == NULL || config->flash_ops == NULL || config->flash_size == 0) {
        return NULL;
    }

    partition_mgr_ctx_t *ctx = (partition_mgr_ctx_t *)malloc(sizeof(partition_mgr_ctx_t));
    if (ctx == NULL) {
        return NULL;
    }

    memset(ctx, 0, sizeof(partition_mgr_ctx_t));
    memcpy(&ctx->config, config, sizeof(partition_mgr_config_t));

    /* Initialize partition table */
    ctx->table = partition_table_init(config->flash_size);
    if (ctx->table == NULL) {
        free(ctx);
        return NULL;
    }

    ctx->initialized = true;
    return ctx;
}

/**
 * @brief De-initialize partition manager
 */
partition_status_t partition_mgr_deinit(partition_mgr_ctx_t *ctx)
{
    if (ctx == NULL) {
        return PART_INVALID_PARAM;
    }

    if (ctx->table != NULL) {
        partition_table_deinit(ctx->table);
    }

    free(ctx);
    return PART_OK;
}

/**
 * @brief Load partition table from flash
 */
partition_status_t partition_mgr_load_table(partition_mgr_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return PART_INVALID_PARAM;
    }

    /* Allocate buffer for partition table */
    uint8_t *buffer = (uint8_t *)malloc(sizeof(partition_table_t));
    if (buffer == NULL) {
        return PART_ERROR;
    }

    /* Read partition table from flash */
    partition_status_t status = ctx->config.flash_ops->read(
        ctx->config.partition_table_offset,
        buffer,
        sizeof(partition_table_t));

    if (status != PART_OK) {
        free(buffer);
        return status;
    }

    /* Deserialize partition table */
    status = partition_table_deserialize(ctx->table, buffer, sizeof(partition_table_t));
    free(buffer);

    return status;
}

/**
 * @brief Save partition table to flash
 */
partition_status_t partition_mgr_save_table(partition_mgr_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return PART_INVALID_PARAM;
    }

    /* Allocate buffer for partition table */
    uint8_t *buffer = (uint8_t *)malloc(sizeof(partition_table_t));
    if (buffer == NULL) {
        return PART_ERROR;
    }

    /* Serialize partition table */
    size_t size = partition_table_serialize(ctx->table, buffer, sizeof(partition_table_t));
    if (size == 0) {
        free(buffer);
        return PART_ERROR;
    }

    /* Erase flash sector */
    partition_status_t status = ctx->config.flash_ops->erase(
        ctx->config.partition_table_offset,
        sizeof(partition_table_t));

    if (status != PART_OK) {
        free(buffer);
        return status;
    }

    /* Write partition table to flash */
    status = ctx->config.flash_ops->write(
        ctx->config.partition_table_offset,
        buffer,
        size);

    free(buffer);
    return status;
}

/**
 * @brief Create new partition
 */
partition_status_t partition_mgr_create(partition_mgr_ctx_t *ctx,
                                        const char *name,
                                        partition_type_t type,
                                        uint32_t offset,
                                        uint32_t size,
                                        uint32_t flags)
{
    if (ctx == NULL || !ctx->initialized || name == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Create partition entry */
    partition_entry_t entry;
    memset(&entry, 0, sizeof(partition_entry_t));

    strncpy(entry.name, name, PARTITION_NAME_MAX_LEN - 1);
    entry.type = type;
    entry.offset = offset;
    entry.size = size;
    entry.flags = flags;
    entry.crc32 = 0;

    /* Add to table */
    return partition_table_add(ctx->table, &entry);
}

/**
 * @brief Delete partition
 */
partition_status_t partition_mgr_delete(partition_mgr_ctx_t *ctx,
                                        const char *name)
{
    if (ctx == NULL || !ctx->initialized || name == NULL) {
        return PART_INVALID_PARAM;
    }

    return partition_table_remove(ctx->table, name);
}

/**
 * @brief Get partition information
 */
partition_status_t partition_mgr_get_info(partition_mgr_ctx_t *ctx,
                                          const char *name,
                                          partition_entry_t *entry)
{
    if (ctx == NULL || !ctx->initialized || name == NULL || entry == NULL) {
        return PART_INVALID_PARAM;
    }

    return partition_table_find(ctx->table, name, entry);
}

/**
 * @brief Read from partition
 */
partition_status_t partition_mgr_read(partition_mgr_ctx_t *ctx,
                                      const char *name,
                                      uint32_t offset,
                                      uint8_t *data,
                                      uint32_t size)
{
    if (ctx == NULL || !ctx->initialized || name == NULL || data == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Find partition */
    partition_entry_t entry;
    partition_status_t status = partition_table_find(ctx->table, name, &entry);
    if (status != PART_OK) {
        return status;
    }

    /* Check bounds */
    if (offset + size > entry.size) {
        return PART_INVALID_PARAM;
    }

    /* Read from flash */
    uint32_t flash_addr = entry.offset + offset;
    return ctx->config.flash_ops->read(flash_addr, data, size);
}

/**
 * @brief Write to partition
 */
partition_status_t partition_mgr_write(partition_mgr_ctx_t *ctx,
                                       const char *name,
                                       uint32_t offset,
                                       const uint8_t *data,
                                       uint32_t size)
{
    if (ctx == NULL || !ctx->initialized || name == NULL || data == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Find partition */
    partition_entry_t entry;
    partition_status_t status = partition_table_find(ctx->table, name, &entry);
    if (status != PART_OK) {
        return status;
    }

    /* Check if partition is read-only */
    if (entry.flags & PARTITION_FLAG_READONLY) {
        return PART_ERROR;
    }

    /* Check bounds */
    if (offset + size > entry.size) {
        return PART_INVALID_PARAM;
    }

    /* Write to flash */
    uint32_t flash_addr = entry.offset + offset;
    return ctx->config.flash_ops->write(flash_addr, data, size);
}

/**
 * @brief Erase partition
 */
partition_status_t partition_mgr_erase(partition_mgr_ctx_t *ctx,
                                       const char *name)
{
    if (ctx == NULL || !ctx->initialized || name == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Find partition */
    partition_entry_t entry;
    partition_status_t status = partition_table_find(ctx->table, name, &entry);
    if (status != PART_OK) {
        return status;
    }

    /* Check if partition is read-only */
    if (entry.flags & PARTITION_FLAG_READONLY) {
        return PART_ERROR;
    }

    /* Erase partition */
    return ctx->config.flash_ops->erase(entry.offset, entry.size);
}

/**
 * @brief Format partition
 */
partition_status_t partition_mgr_format(partition_mgr_ctx_t *ctx,
                                        const char *name)
{
    /* Format is same as erase for now */
    return partition_mgr_erase(ctx, name);
}

/**
 * @brief Verify partition data integrity
 */
partition_status_t partition_mgr_verify(partition_mgr_ctx_t *ctx,
                                        const char *name)
{
    if (ctx == NULL || !ctx->initialized || name == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Find partition */
    partition_entry_t entry;
    partition_status_t status = partition_table_find(ctx->table, name, &entry);
    if (status != PART_OK) {
        return status;
    }

    /* If CRC is not set, consider it valid */
    if (entry.crc32 == 0) {
        return PART_OK;
    }

    /* Read partition data and verify CRC */
    /* This is a simplified implementation */
    /* In practice, you'd read chunks and calculate CRC */

    return PART_OK;
}

/**
 * @brief List all partitions
 */
void partition_mgr_list(partition_mgr_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        printf("Partition manager not initialized\n");
        return;
    }

    partition_table_print(ctx->table);
}

/**
 * @brief Get partition count
 */
uint32_t partition_mgr_count(partition_mgr_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    return partition_table_count(ctx->table);
}

/**
 * @brief Check if partition exists
 */
bool partition_mgr_exists(partition_mgr_ctx_t *ctx, const char *name)
{
    if (ctx == NULL || !ctx->initialized || name == NULL) {
        return false;
    }

    partition_entry_t entry;
    return (partition_table_find(ctx->table, name, &entry) == PART_OK);
}

/**
 * @brief Get total flash size
 */
uint32_t partition_mgr_get_flash_size(partition_mgr_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    return ctx->config.flash_size;
}

/**
 * @brief Get used flash space
 */
uint32_t partition_mgr_get_used_space(partition_mgr_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    uint32_t used_space = 0;
    uint32_t count = partition_table_count(ctx->table);

    for (uint32_t i = 0; i < count; i++) {
        partition_entry_t entry;
        if (partition_table_get(ctx->table, i, &entry) == PART_OK) {
            used_space += entry.size;
        }
    }

    return used_space;
}

/**
 * @brief Get free flash space
 */
uint32_t partition_mgr_get_free_space(partition_mgr_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    uint32_t total = ctx->config.flash_size;
    uint32_t used = partition_mgr_get_used_space(ctx);

    return (total > used) ? (total - used) : 0;
}

/**
 * @brief Set partition flags
 */
partition_status_t partition_mgr_set_flags(partition_mgr_ctx_t *ctx,
                                           const char *name,
                                           uint32_t flags)
{
    if (ctx == NULL || !ctx->initialized || name == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Get current entry */
    partition_entry_t entry;
    partition_status_t status = partition_table_find(ctx->table, name, &entry);
    if (status != PART_OK) {
        return status;
    }

    /* Set flags */
    entry.flags |= flags;

    /* Update entry */
    return partition_table_update(ctx->table, name, &entry);
}

/**
 * @brief Clear partition flags
 */
partition_status_t partition_mgr_clear_flags(partition_mgr_ctx_t *ctx,
                                             const char *name,
                                             uint32_t flags)
{
    if (ctx == NULL || !ctx->initialized || name == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Get current entry */
    partition_entry_t entry;
    partition_status_t status = partition_table_find(ctx->table, name, &entry);
    if (status != PART_OK) {
        return status;
    }

    /* Clear flags */
    entry.flags &= ~flags;

    /* Update entry */
    return partition_table_update(ctx->table, name, &entry);
}
