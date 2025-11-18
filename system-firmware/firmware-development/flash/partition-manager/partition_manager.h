/**
 * @file partition_manager.h
 * @brief Flash Partition Manager
 * @details High-level partition management API
 */

#ifndef PARTITION_MANAGER_H
#define PARTITION_MANAGER_H

#include "partition_table.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Flash operations callbacks */
typedef struct {
    /* Read data from flash */
    partition_status_t (*read)(uint32_t address, uint8_t *data, uint32_t size);

    /* Write data to flash */
    partition_status_t (*write)(uint32_t address, const uint8_t *data, uint32_t size);

    /* Erase flash sector */
    partition_status_t (*erase)(uint32_t address, uint32_t size);
} partition_flash_ops_t;

/* Partition manager configuration */
typedef struct {
    uint32_t flash_size;                        /* Total flash size */
    uint32_t partition_table_offset;            /* Partition table location */
    const partition_flash_ops_t *flash_ops;     /* Flash operations */
} partition_mgr_config_t;

/* Partition manager context */
typedef struct partition_mgr_ctx partition_mgr_ctx_t;

/**
 * @brief Initialize partition manager
 * @param config Pointer to configuration
 * @return Context pointer on success, NULL on error
 */
partition_mgr_ctx_t *partition_mgr_init(const partition_mgr_config_t *config);

/**
 * @brief De-initialize partition manager
 * @param ctx Context pointer
 * @return PART_OK on success
 */
partition_status_t partition_mgr_deinit(partition_mgr_ctx_t *ctx);

/**
 * @brief Load partition table from flash
 * @param ctx Context pointer
 * @return PART_OK on success
 */
partition_status_t partition_mgr_load_table(partition_mgr_ctx_t *ctx);

/**
 * @brief Save partition table to flash
 * @param ctx Context pointer
 * @return PART_OK on success
 */
partition_status_t partition_mgr_save_table(partition_mgr_ctx_t *ctx);

/**
 * @brief Create new partition
 * @param ctx Context pointer
 * @param name Partition name
 * @param type Partition type
 * @param offset Partition offset
 * @param size Partition size
 * @param flags Partition flags
 * @return PART_OK on success
 */
partition_status_t partition_mgr_create(partition_mgr_ctx_t *ctx,
                                        const char *name,
                                        partition_type_t type,
                                        uint32_t offset,
                                        uint32_t size,
                                        uint32_t flags);

/**
 * @brief Delete partition
 * @param ctx Context pointer
 * @param name Partition name
 * @return PART_OK on success
 */
partition_status_t partition_mgr_delete(partition_mgr_ctx_t *ctx,
                                        const char *name);

/**
 * @brief Get partition information
 * @param ctx Context pointer
 * @param name Partition name
 * @param entry Pointer to store partition entry
 * @return PART_OK on success
 */
partition_status_t partition_mgr_get_info(partition_mgr_ctx_t *ctx,
                                          const char *name,
                                          partition_entry_t *entry);

/**
 * @brief Read from partition
 * @param ctx Context pointer
 * @param name Partition name
 * @param offset Offset within partition
 * @param data Buffer to store data
 * @param size Number of bytes to read
 * @return PART_OK on success
 */
partition_status_t partition_mgr_read(partition_mgr_ctx_t *ctx,
                                      const char *name,
                                      uint32_t offset,
                                      uint8_t *data,
                                      uint32_t size);

/**
 * @brief Write to partition
 * @param ctx Context pointer
 * @param name Partition name
 * @param offset Offset within partition
 * @param data Data to write
 * @param size Number of bytes to write
 * @return PART_OK on success
 */
partition_status_t partition_mgr_write(partition_mgr_ctx_t *ctx,
                                       const char *name,
                                       uint32_t offset,
                                       const uint8_t *data,
                                       uint32_t size);

/**
 * @brief Erase partition
 * @param ctx Context pointer
 * @param name Partition name
 * @return PART_OK on success
 */
partition_status_t partition_mgr_erase(partition_mgr_ctx_t *ctx,
                                       const char *name);

/**
 * @brief Format partition (erase and initialize)
 * @param ctx Context pointer
 * @param name Partition name
 * @return PART_OK on success
 */
partition_status_t partition_mgr_format(partition_mgr_ctx_t *ctx,
                                        const char *name);

/**
 * @brief Verify partition data integrity
 * @param ctx Context pointer
 * @param name Partition name
 * @return PART_OK if valid
 */
partition_status_t partition_mgr_verify(partition_mgr_ctx_t *ctx,
                                        const char *name);

/**
 * @brief List all partitions
 * @param ctx Context pointer
 */
void partition_mgr_list(partition_mgr_ctx_t *ctx);

/**
 * @brief Get partition count
 * @param ctx Context pointer
 * @return Number of partitions
 */
uint32_t partition_mgr_count(partition_mgr_ctx_t *ctx);

/**
 * @brief Check if partition exists
 * @param ctx Context pointer
 * @param name Partition name
 * @return true if exists
 */
bool partition_mgr_exists(partition_mgr_ctx_t *ctx, const char *name);

/**
 * @brief Get total flash size
 * @param ctx Context pointer
 * @return Flash size in bytes
 */
uint32_t partition_mgr_get_flash_size(partition_mgr_ctx_t *ctx);

/**
 * @brief Get used flash space
 * @param ctx Context pointer
 * @return Used space in bytes
 */
uint32_t partition_mgr_get_used_space(partition_mgr_ctx_t *ctx);

/**
 * @brief Get free flash space
 * @param ctx Context pointer
 * @return Free space in bytes
 */
uint32_t partition_mgr_get_free_space(partition_mgr_ctx_t *ctx);

/**
 * @brief Set partition flags
 * @param ctx Context pointer
 * @param name Partition name
 * @param flags Flags to set
 * @return PART_OK on success
 */
partition_status_t partition_mgr_set_flags(partition_mgr_ctx_t *ctx,
                                           const char *name,
                                           uint32_t flags);

/**
 * @brief Clear partition flags
 * @param ctx Context pointer
 * @param name Partition name
 * @param flags Flags to clear
 * @return PART_OK on success
 */
partition_status_t partition_mgr_clear_flags(partition_mgr_ctx_t *ctx,
                                             const char *name,
                                             uint32_t flags);

#ifdef __cplusplus
}
#endif

#endif /* PARTITION_MANAGER_H */
