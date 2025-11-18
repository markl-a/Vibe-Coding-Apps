/**
 * @file partition_table.c
 * @brief Flash Partition Table Implementation
 */

#include "partition_table.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* CRC32 lookup table */
static const uint32_t crc32_table[256] = {
    0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
    0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91,
    /* ... (full table omitted for brevity) ... */
};

/* Partition table context */
struct partition_table_ctx {
    partition_table_t table;
    uint32_t flash_size;
    bool initialized;
};

/* Helper function prototypes */
static uint32_t calculate_crc32(const uint8_t *data, size_t length);

/**
 * @brief Initialize partition table
 */
partition_table_ctx_t *partition_table_init(uint32_t flash_size)
{
    if (flash_size == 0) {
        return NULL;
    }

    partition_table_ctx_t *ctx = (partition_table_ctx_t *)malloc(sizeof(partition_table_ctx_t));
    if (ctx == NULL) {
        return NULL;
    }

    memset(ctx, 0, sizeof(partition_table_ctx_t));

    /* Initialize header */
    ctx->table.header.magic = PARTITION_TABLE_MAGIC;
    ctx->table.header.version = 1;
    ctx->table.header.num_partitions = 0;
    ctx->table.header.flash_size = flash_size;
    ctx->table.header.crc32 = 0;

    ctx->flash_size = flash_size;
    ctx->initialized = true;

    return ctx;
}

/**
 * @brief De-initialize partition table
 */
partition_status_t partition_table_deinit(partition_table_ctx_t *ctx)
{
    if (ctx == NULL) {
        return PART_INVALID_PARAM;
    }

    free(ctx);
    return PART_OK;
}

/**
 * @brief Add partition to table
 */
partition_status_t partition_table_add(partition_table_ctx_t *ctx,
                                       const partition_entry_t *entry)
{
    if (ctx == NULL || !ctx->initialized || entry == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Check if table is full */
    if (ctx->table.header.num_partitions >= PARTITION_MAX_COUNT) {
        return PART_TABLE_FULL;
    }

    /* Validate entry */
    if (entry->name[0] == '\0' || entry->size == 0) {
        return PART_INVALID_PARAM;
    }

    /* Check if partition fits in flash */
    if (entry->offset + entry->size > ctx->flash_size) {
        return PART_INVALID_PARAM;
    }

    /* Check for duplicate name */
    for (uint32_t i = 0; i < ctx->table.header.num_partitions; i++) {
        if (strcmp(ctx->table.entries[i].name, entry->name) == 0) {
            return PART_ALREADY_EXISTS;
        }
    }

    /* Check for overlaps with existing partitions */
    for (uint32_t i = 0; i < ctx->table.header.num_partitions; i++) {
        if (partition_table_check_overlap(&ctx->table.entries[i], entry)) {
            return PART_OVERLAP;
        }
    }

    /* Add partition */
    memcpy(&ctx->table.entries[ctx->table.header.num_partitions],
           entry,
           sizeof(partition_entry_t));
    ctx->table.header.num_partitions++;

    /* Update CRC */
    ctx->table.header.crc32 = partition_table_calculate_crc(ctx);

    return PART_OK;
}

/**
 * @brief Remove partition from table
 */
partition_status_t partition_table_remove(partition_table_ctx_t *ctx,
                                          const char *name)
{
    if (ctx == NULL || !ctx->initialized || name == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Find partition */
    int32_t index = -1;
    for (uint32_t i = 0; i < ctx->table.header.num_partitions; i++) {
        if (strcmp(ctx->table.entries[i].name, name) == 0) {
            index = i;
            break;
        }
    }

    if (index == -1) {
        return PART_NOT_FOUND;
    }

    /* Shift remaining entries */
    for (uint32_t i = index; i < ctx->table.header.num_partitions - 1; i++) {
        memcpy(&ctx->table.entries[i],
               &ctx->table.entries[i + 1],
               sizeof(partition_entry_t));
    }

    /* Clear last entry */
    memset(&ctx->table.entries[ctx->table.header.num_partitions - 1],
           0,
           sizeof(partition_entry_t));

    ctx->table.header.num_partitions--;

    /* Update CRC */
    ctx->table.header.crc32 = partition_table_calculate_crc(ctx);

    return PART_OK;
}

/**
 * @brief Find partition by name
 */
partition_status_t partition_table_find(partition_table_ctx_t *ctx,
                                        const char *name,
                                        partition_entry_t *entry)
{
    if (ctx == NULL || !ctx->initialized || name == NULL || entry == NULL) {
        return PART_INVALID_PARAM;
    }

    for (uint32_t i = 0; i < ctx->table.header.num_partitions; i++) {
        if (strcmp(ctx->table.entries[i].name, name) == 0) {
            memcpy(entry, &ctx->table.entries[i], sizeof(partition_entry_t));
            return PART_OK;
        }
    }

    return PART_NOT_FOUND;
}

/**
 * @brief Find partition by type
 */
partition_status_t partition_table_find_by_type(partition_table_ctx_t *ctx,
                                                partition_type_t type,
                                                partition_entry_t *entry)
{
    if (ctx == NULL || !ctx->initialized || entry == NULL) {
        return PART_INVALID_PARAM;
    }

    for (uint32_t i = 0; i < ctx->table.header.num_partitions; i++) {
        if (ctx->table.entries[i].type == type) {
            memcpy(entry, &ctx->table.entries[i], sizeof(partition_entry_t));
            return PART_OK;
        }
    }

    return PART_NOT_FOUND;
}

/**
 * @brief Get partition by index
 */
partition_status_t partition_table_get(partition_table_ctx_t *ctx,
                                       uint32_t index,
                                       partition_entry_t *entry)
{
    if (ctx == NULL || !ctx->initialized || entry == NULL) {
        return PART_INVALID_PARAM;
    }

    if (index >= ctx->table.header.num_partitions) {
        return PART_INVALID_PARAM;
    }

    memcpy(entry, &ctx->table.entries[index], sizeof(partition_entry_t));
    return PART_OK;
}

/**
 * @brief Get number of partitions
 */
uint32_t partition_table_count(partition_table_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    return ctx->table.header.num_partitions;
}

/**
 * @brief Update partition entry
 */
partition_status_t partition_table_update(partition_table_ctx_t *ctx,
                                          const char *name,
                                          const partition_entry_t *entry)
{
    if (ctx == NULL || !ctx->initialized || name == NULL || entry == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Find partition */
    int32_t index = -1;
    for (uint32_t i = 0; i < ctx->table.header.num_partitions; i++) {
        if (strcmp(ctx->table.entries[i].name, name) == 0) {
            index = i;
            break;
        }
    }

    if (index == -1) {
        return PART_NOT_FOUND;
    }

    /* Update entry */
    memcpy(&ctx->table.entries[index], entry, sizeof(partition_entry_t));

    /* Update CRC */
    ctx->table.header.crc32 = partition_table_calculate_crc(ctx);

    return PART_OK;
}

/**
 * @brief Validate partition table
 */
partition_status_t partition_table_validate(partition_table_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return PART_INVALID_PARAM;
    }

    /* Check magic number */
    if (ctx->table.header.magic != PARTITION_TABLE_MAGIC) {
        return PART_ERROR;
    }

    /* Check partition count */
    if (ctx->table.header.num_partitions > PARTITION_MAX_COUNT) {
        return PART_ERROR;
    }

    /* Validate each partition */
    for (uint32_t i = 0; i < ctx->table.header.num_partitions; i++) {
        partition_entry_t *entry = &ctx->table.entries[i];

        /* Check name */
        if (entry->name[0] == '\0') {
            return PART_ERROR;
        }

        /* Check size and offset */
        if (entry->size == 0 || entry->offset + entry->size > ctx->flash_size) {
            return PART_ERROR;
        }

        /* Check for overlaps */
        for (uint32_t j = i + 1; j < ctx->table.header.num_partitions; j++) {
            if (partition_table_check_overlap(entry, &ctx->table.entries[j])) {
                return PART_OVERLAP;
            }
        }
    }

    /* Verify CRC */
    uint32_t calculated_crc = partition_table_calculate_crc(ctx);
    if (calculated_crc != ctx->table.header.crc32) {
        return PART_ERROR;
    }

    return PART_OK;
}

/**
 * @brief Check if partitions overlap
 */
bool partition_table_check_overlap(const partition_entry_t *entry1,
                                   const partition_entry_t *entry2)
{
    if (entry1 == NULL || entry2 == NULL) {
        return false;
    }

    uint32_t end1 = entry1->offset + entry1->size;
    uint32_t end2 = entry2->offset + entry2->size;

    /* Check for overlap */
    if (entry1->offset < end2 && entry2->offset < end1) {
        return true;
    }

    return false;
}

/**
 * @brief Calculate table CRC32
 */
uint32_t partition_table_calculate_crc(partition_table_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    /* Calculate CRC over entries */
    return calculate_crc32((const uint8_t *)ctx->table.entries,
                          ctx->table.header.num_partitions * sizeof(partition_entry_t));
}

/**
 * @brief Serialize partition table to buffer
 */
size_t partition_table_serialize(partition_table_ctx_t *ctx,
                                 uint8_t *buffer,
                                 size_t size)
{
    if (ctx == NULL || !ctx->initialized || buffer == NULL) {
        return 0;
    }

    size_t required_size = sizeof(partition_table_t);
    if (size < required_size) {
        return 0;
    }

    /* Update CRC before serialization */
    ctx->table.header.crc32 = partition_table_calculate_crc(ctx);

    /* Copy table to buffer */
    memcpy(buffer, &ctx->table, required_size);

    return required_size;
}

/**
 * @brief Deserialize partition table from buffer
 */
partition_status_t partition_table_deserialize(partition_table_ctx_t *ctx,
                                               const uint8_t *buffer,
                                               size_t size)
{
    if (ctx == NULL || !ctx->initialized || buffer == NULL) {
        return PART_INVALID_PARAM;
    }

    if (size < sizeof(partition_table_t)) {
        return PART_INVALID_PARAM;
    }

    /* Copy buffer to table */
    memcpy(&ctx->table, buffer, sizeof(partition_table_t));

    /* Validate table */
    return partition_table_validate(ctx);
}

/**
 * @brief Print partition table
 */
void partition_table_print(partition_table_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        printf("Partition table not initialized\n");
        return;
    }

    printf("\n========================================\n");
    printf("  Partition Table\n");
    printf("========================================\n\n");

    printf("Magic:       0x%08X\n", ctx->table.header.magic);
    printf("Version:     %u\n", ctx->table.header.version);
    printf("Partitions:  %u / %u\n", ctx->table.header.num_partitions, PARTITION_MAX_COUNT);
    printf("Flash size:  %u bytes (%.2f MB)\n",
           ctx->table.header.flash_size,
           ctx->table.header.flash_size / (1024.0 * 1024.0));
    printf("CRC32:       0x%08X\n\n", ctx->table.header.crc32);

    if (ctx->table.header.num_partitions == 0) {
        printf("No partitions defined\n\n");
        return;
    }

    printf("%-16s %-12s %-10s %-10s %-8s\n",
           "Name", "Type", "Offset", "Size", "Flags");
    printf("%-16s %-12s %-10s %-10s %-8s\n",
           "----------------", "------------", "----------", "----------", "--------");

    for (uint32_t i = 0; i < ctx->table.header.num_partitions; i++) {
        partition_entry_t *entry = &ctx->table.entries[i];

        printf("%-16s %-12s 0x%08X %8u KB",
               entry->name,
               partition_type_to_string(entry->type),
               entry->offset,
               entry->size / 1024);

        /* Print flags */
        printf(" ");
        if (entry->flags & PARTITION_FLAG_READONLY) printf("R");
        if (entry->flags & PARTITION_FLAG_ENCRYPTED) printf("E");
        if (entry->flags & PARTITION_FLAG_COMPRESSED) printf("C");
        if (entry->flags & PARTITION_FLAG_BOOT) printf("B");
        if (entry->flags & PARTITION_FLAG_ACTIVE) printf("A");

        printf("\n");
    }

    printf("\n========================================\n\n");
}

/**
 * @brief Get partition type name
 */
const char *partition_type_to_string(partition_type_t type)
{
    switch (type) {
        case PARTITION_TYPE_DATA:       return "Data";
        case PARTITION_TYPE_APP:        return "Application";
        case PARTITION_TYPE_FS:         return "FileSystem";
        case PARTITION_TYPE_BOOTLOADER: return "Bootloader";
        case PARTITION_TYPE_CONFIG:     return "Config";
        case PARTITION_TYPE_LOG:        return "Log";
        case PARTITION_TYPE_OTA:        return "OTA";
        case PARTITION_TYPE_FACTORY:    return "Factory";
        case PARTITION_TYPE_USER:       return "User";
        default:                        return "Unknown";
    }
}

/* Helper functions */

/**
 * @brief Calculate CRC32
 */
static uint32_t calculate_crc32(const uint8_t *data, size_t length)
{
    uint32_t crc = 0xFFFFFFFF;

    for (size_t i = 0; i < length; i++) {
        uint8_t index = (crc ^ data[i]) & 0xFF;
        crc = (crc >> 8) ^ crc32_table[index];
    }

    return ~crc;
}
