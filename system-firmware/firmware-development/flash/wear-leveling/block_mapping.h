/**
 * @file block_mapping.h
 * @brief Block Mapping Table for Wear Leveling
 * @details Manages logical to physical block mapping
 */

#ifndef BLOCK_MAPPING_H
#define BLOCK_MAPPING_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Status codes */
typedef enum {
    BLOCK_MAP_OK = 0,
    BLOCK_MAP_ERROR,
    BLOCK_MAP_INVALID_PARAM,
    BLOCK_MAP_NO_FREE_BLOCKS,
    BLOCK_MAP_NOT_INITIALIZED,
} block_map_status_t;

/* Block states */
typedef enum {
    BLOCK_STATE_FREE = 0,       /* Block is erased and available */
    BLOCK_STATE_ACTIVE,         /* Block is currently in use */
    BLOCK_STATE_DIRTY,          /* Block contains outdated data */
    BLOCK_STATE_BAD,            /* Block is defective */
} block_state_t;

/* Block information */
typedef struct {
    uint32_t physical_block;    /* Physical block number */
    uint32_t erase_count;       /* Number of times erased */
    block_state_t state;        /* Current block state */
    uint32_t logical_block;     /* Mapped logical block (-1 if unmapped) */
} block_info_t;

/* Block mapping table configuration */
typedef struct {
    uint32_t total_blocks;      /* Total number of physical blocks */
    uint32_t reserved_blocks;   /* Number of reserved blocks for wear leveling */
    uint32_t block_size;        /* Size of each block in bytes */
} block_map_config_t;

/* Block mapping table context */
typedef struct block_map_ctx block_map_ctx_t;

/**
 * @brief Initialize block mapping table
 * @param config Pointer to configuration
 * @return Context pointer on success, NULL on error
 */
block_map_ctx_t *block_map_init(const block_map_config_t *config);

/**
 * @brief De-initialize block mapping table
 * @param ctx Context pointer
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_deinit(block_map_ctx_t *ctx);

/**
 * @brief Get physical block for logical block
 * @param ctx Context pointer
 * @param logical_block Logical block number
 * @param physical_block Pointer to store physical block number
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_get_physical(block_map_ctx_t *ctx,
                                          uint32_t logical_block,
                                          uint32_t *physical_block);

/**
 * @brief Map logical block to physical block
 * @param ctx Context pointer
 * @param logical_block Logical block number
 * @param physical_block Physical block number
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_set_mapping(block_map_ctx_t *ctx,
                                         uint32_t logical_block,
                                         uint32_t physical_block);

/**
 * @brief Allocate a free physical block
 * @param ctx Context pointer
 * @param physical_block Pointer to store allocated block number
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_allocate_block(block_map_ctx_t *ctx,
                                            uint32_t *physical_block);

/**
 * @brief Mark block as free
 * @param ctx Context pointer
 * @param physical_block Physical block number
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_free_block(block_map_ctx_t *ctx,
                                        uint32_t physical_block);

/**
 * @brief Mark block as dirty
 * @param ctx Context pointer
 * @param physical_block Physical block number
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_mark_dirty(block_map_ctx_t *ctx,
                                        uint32_t physical_block);

/**
 * @brief Mark block as bad
 * @param ctx Context pointer
 * @param physical_block Physical block number
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_mark_bad(block_map_ctx_t *ctx,
                                      uint32_t physical_block);

/**
 * @brief Get block information
 * @param ctx Context pointer
 * @param physical_block Physical block number
 * @param info Pointer to store block information
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_get_info(block_map_ctx_t *ctx,
                                      uint32_t physical_block,
                                      block_info_t *info);

/**
 * @brief Increment erase count for block
 * @param ctx Context pointer
 * @param physical_block Physical block number
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_increment_erase_count(block_map_ctx_t *ctx,
                                                   uint32_t physical_block);

/**
 * @brief Get block with minimum erase count
 * @param ctx Context pointer
 * @param physical_block Pointer to store block number
 * @param min_erase_count Pointer to store minimum erase count
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_get_min_erase_block(block_map_ctx_t *ctx,
                                                  uint32_t *physical_block,
                                                  uint32_t *min_erase_count);

/**
 * @brief Get block with maximum erase count
 * @param ctx Context pointer
 * @param physical_block Pointer to store block number
 * @param max_erase_count Pointer to store maximum erase count
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_get_max_erase_block(block_map_ctx_t *ctx,
                                                  uint32_t *physical_block,
                                                  uint32_t *max_erase_count);

/**
 * @brief Get number of free blocks
 * @param ctx Context pointer
 * @param count Pointer to store count
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_get_free_count(block_map_ctx_t *ctx,
                                            uint32_t *count);

/**
 * @brief Get number of dirty blocks
 * @param ctx Context pointer
 * @param count Pointer to store count
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_get_dirty_count(block_map_ctx_t *ctx,
                                             uint32_t *count);

/**
 * @brief Get number of bad blocks
 * @param ctx Context pointer
 * @param count Pointer to store count
 * @return BLOCK_MAP_OK on success
 */
block_map_status_t block_map_get_bad_count(block_map_ctx_t *ctx,
                                           uint32_t *count);

/**
 * @brief Print block mapping table (for debugging)
 * @param ctx Context pointer
 */
void block_map_print(block_map_ctx_t *ctx);

#ifdef __cplusplus
}
#endif

#endif /* BLOCK_MAPPING_H */
