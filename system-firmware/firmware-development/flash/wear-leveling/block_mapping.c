/**
 * @file block_mapping.c
 * @brief Block Mapping Table Implementation
 */

#include "block_mapping.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* Block mapping context structure */
struct block_map_ctx {
    block_map_config_t config;      /* Configuration */
    block_info_t *blocks;           /* Array of block information */
    uint32_t *logical_to_physical;  /* Logical to physical mapping */
    uint32_t num_logical_blocks;    /* Number of logical blocks */
    bool initialized;               /* Initialization status */
};

/**
 * @brief Initialize block mapping table
 */
block_map_ctx_t *block_map_init(const block_map_config_t *config)
{
    if (config == NULL || config->total_blocks == 0) {
        return NULL;
    }

    /* Allocate context */
    block_map_ctx_t *ctx = (block_map_ctx_t *)malloc(sizeof(block_map_ctx_t));
    if (ctx == NULL) {
        return NULL;
    }

    /* Copy configuration */
    memcpy(&ctx->config, config, sizeof(block_map_config_t));

    /* Calculate number of logical blocks */
    ctx->num_logical_blocks = config->total_blocks - config->reserved_blocks;

    /* Allocate block information array */
    ctx->blocks = (block_info_t *)malloc(config->total_blocks * sizeof(block_info_t));
    if (ctx->blocks == NULL) {
        free(ctx);
        return NULL;
    }

    /* Allocate logical to physical mapping table */
    ctx->logical_to_physical = (uint32_t *)malloc(ctx->num_logical_blocks * sizeof(uint32_t));
    if (ctx->logical_to_physical == NULL) {
        free(ctx->blocks);
        free(ctx);
        return NULL;
    }

    /* Initialize block information */
    for (uint32_t i = 0; i < config->total_blocks; i++) {
        ctx->blocks[i].physical_block = i;
        ctx->blocks[i].erase_count = 0;
        ctx->blocks[i].state = BLOCK_STATE_FREE;
        ctx->blocks[i].logical_block = (uint32_t)-1;
    }

    /* Initialize logical to physical mapping (identity mapping) */
    for (uint32_t i = 0; i < ctx->num_logical_blocks; i++) {
        ctx->logical_to_physical[i] = i;
        ctx->blocks[i].logical_block = i;
        ctx->blocks[i].state = BLOCK_STATE_ACTIVE;
    }

    ctx->initialized = true;
    return ctx;
}

/**
 * @brief De-initialize block mapping table
 */
block_map_status_t block_map_deinit(block_map_ctx_t *ctx)
{
    if (ctx == NULL) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    if (ctx->blocks != NULL) {
        free(ctx->blocks);
    }

    if (ctx->logical_to_physical != NULL) {
        free(ctx->logical_to_physical);
    }

    free(ctx);
    return BLOCK_MAP_OK;
}

/**
 * @brief Get physical block for logical block
 */
block_map_status_t block_map_get_physical(block_map_ctx_t *ctx,
                                          uint32_t logical_block,
                                          uint32_t *physical_block)
{
    if (ctx == NULL || !ctx->initialized || physical_block == NULL) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    if (logical_block >= ctx->num_logical_blocks) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    *physical_block = ctx->logical_to_physical[logical_block];
    return BLOCK_MAP_OK;
}

/**
 * @brief Map logical block to physical block
 */
block_map_status_t block_map_set_mapping(block_map_ctx_t *ctx,
                                         uint32_t logical_block,
                                         uint32_t physical_block)
{
    if (ctx == NULL || !ctx->initialized) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    if (logical_block >= ctx->num_logical_blocks ||
        physical_block >= ctx->config.total_blocks) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    /* Update mapping */
    uint32_t old_physical = ctx->logical_to_physical[logical_block];

    /* Clear old mapping */
    if (old_physical < ctx->config.total_blocks) {
        ctx->blocks[old_physical].logical_block = (uint32_t)-1;
    }

    /* Set new mapping */
    ctx->logical_to_physical[logical_block] = physical_block;
    ctx->blocks[physical_block].logical_block = logical_block;
    ctx->blocks[physical_block].state = BLOCK_STATE_ACTIVE;

    return BLOCK_MAP_OK;
}

/**
 * @brief Allocate a free physical block
 */
block_map_status_t block_map_allocate_block(block_map_ctx_t *ctx,
                                            uint32_t *physical_block)
{
    if (ctx == NULL || !ctx->initialized || physical_block == NULL) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    /* Find free block with minimum erase count */
    uint32_t min_erase_count = UINT32_MAX;
    uint32_t best_block = (uint32_t)-1;

    for (uint32_t i = 0; i < ctx->config.total_blocks; i++) {
        if (ctx->blocks[i].state == BLOCK_STATE_FREE) {
            if (ctx->blocks[i].erase_count < min_erase_count) {
                min_erase_count = ctx->blocks[i].erase_count;
                best_block = i;
            }
        }
    }

    if (best_block == (uint32_t)-1) {
        return BLOCK_MAP_NO_FREE_BLOCKS;
    }

    *physical_block = best_block;
    ctx->blocks[best_block].state = BLOCK_STATE_ACTIVE;

    return BLOCK_MAP_OK;
}

/**
 * @brief Mark block as free
 */
block_map_status_t block_map_free_block(block_map_ctx_t *ctx,
                                        uint32_t physical_block)
{
    if (ctx == NULL || !ctx->initialized) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    if (physical_block >= ctx->config.total_blocks) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    /* Clear logical mapping */
    uint32_t logical = ctx->blocks[physical_block].logical_block;
    if (logical < ctx->num_logical_blocks) {
        if (ctx->logical_to_physical[logical] == physical_block) {
            ctx->logical_to_physical[logical] = (uint32_t)-1;
        }
    }

    ctx->blocks[physical_block].state = BLOCK_STATE_FREE;
    ctx->blocks[physical_block].logical_block = (uint32_t)-1;

    return BLOCK_MAP_OK;
}

/**
 * @brief Mark block as dirty
 */
block_map_status_t block_map_mark_dirty(block_map_ctx_t *ctx,
                                        uint32_t physical_block)
{
    if (ctx == NULL || !ctx->initialized) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    if (physical_block >= ctx->config.total_blocks) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    ctx->blocks[physical_block].state = BLOCK_STATE_DIRTY;
    return BLOCK_MAP_OK;
}

/**
 * @brief Mark block as bad
 */
block_map_status_t block_map_mark_bad(block_map_ctx_t *ctx,
                                      uint32_t physical_block)
{
    if (ctx == NULL || !ctx->initialized) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    if (physical_block >= ctx->config.total_blocks) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    /* Clear logical mapping */
    uint32_t logical = ctx->blocks[physical_block].logical_block;
    if (logical < ctx->num_logical_blocks) {
        if (ctx->logical_to_physical[logical] == physical_block) {
            ctx->logical_to_physical[logical] = (uint32_t)-1;
        }
    }

    ctx->blocks[physical_block].state = BLOCK_STATE_BAD;
    ctx->blocks[physical_block].logical_block = (uint32_t)-1;

    return BLOCK_MAP_OK;
}

/**
 * @brief Get block information
 */
block_map_status_t block_map_get_info(block_map_ctx_t *ctx,
                                      uint32_t physical_block,
                                      block_info_t *info)
{
    if (ctx == NULL || !ctx->initialized || info == NULL) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    if (physical_block >= ctx->config.total_blocks) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    memcpy(info, &ctx->blocks[physical_block], sizeof(block_info_t));
    return BLOCK_MAP_OK;
}

/**
 * @brief Increment erase count for block
 */
block_map_status_t block_map_increment_erase_count(block_map_ctx_t *ctx,
                                                   uint32_t physical_block)
{
    if (ctx == NULL || !ctx->initialized) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    if (physical_block >= ctx->config.total_blocks) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    /* Check for overflow */
    if (ctx->blocks[physical_block].erase_count < UINT32_MAX) {
        ctx->blocks[physical_block].erase_count++;
    }

    return BLOCK_MAP_OK;
}

/**
 * @brief Get block with minimum erase count
 */
block_map_status_t block_map_get_min_erase_block(block_map_ctx_t *ctx,
                                                  uint32_t *physical_block,
                                                  uint32_t *min_erase_count)
{
    if (ctx == NULL || !ctx->initialized || physical_block == NULL) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    uint32_t min_count = UINT32_MAX;
    uint32_t min_block = (uint32_t)-1;

    for (uint32_t i = 0; i < ctx->config.total_blocks; i++) {
        if (ctx->blocks[i].state != BLOCK_STATE_BAD &&
            ctx->blocks[i].erase_count < min_count) {
            min_count = ctx->blocks[i].erase_count;
            min_block = i;
        }
    }

    if (min_block == (uint32_t)-1) {
        return BLOCK_MAP_ERROR;
    }

    *physical_block = min_block;
    if (min_erase_count != NULL) {
        *min_erase_count = min_count;
    }

    return BLOCK_MAP_OK;
}

/**
 * @brief Get block with maximum erase count
 */
block_map_status_t block_map_get_max_erase_block(block_map_ctx_t *ctx,
                                                  uint32_t *physical_block,
                                                  uint32_t *max_erase_count)
{
    if (ctx == NULL || !ctx->initialized || physical_block == NULL) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    uint32_t max_count = 0;
    uint32_t max_block = (uint32_t)-1;

    for (uint32_t i = 0; i < ctx->config.total_blocks; i++) {
        if (ctx->blocks[i].state != BLOCK_STATE_BAD &&
            ctx->blocks[i].erase_count > max_count) {
            max_count = ctx->blocks[i].erase_count;
            max_block = i;
        }
    }

    if (max_block == (uint32_t)-1) {
        return BLOCK_MAP_ERROR;
    }

    *physical_block = max_block;
    if (max_erase_count != NULL) {
        *max_erase_count = max_count;
    }

    return BLOCK_MAP_OK;
}

/**
 * @brief Get number of free blocks
 */
block_map_status_t block_map_get_free_count(block_map_ctx_t *ctx,
                                            uint32_t *count)
{
    if (ctx == NULL || !ctx->initialized || count == NULL) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    uint32_t free_count = 0;
    for (uint32_t i = 0; i < ctx->config.total_blocks; i++) {
        if (ctx->blocks[i].state == BLOCK_STATE_FREE) {
            free_count++;
        }
    }

    *count = free_count;
    return BLOCK_MAP_OK;
}

/**
 * @brief Get number of dirty blocks
 */
block_map_status_t block_map_get_dirty_count(block_map_ctx_t *ctx,
                                             uint32_t *count)
{
    if (ctx == NULL || !ctx->initialized || count == NULL) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    uint32_t dirty_count = 0;
    for (uint32_t i = 0; i < ctx->config.total_blocks; i++) {
        if (ctx->blocks[i].state == BLOCK_STATE_DIRTY) {
            dirty_count++;
        }
    }

    *count = dirty_count;
    return BLOCK_MAP_OK;
}

/**
 * @brief Get number of bad blocks
 */
block_map_status_t block_map_get_bad_count(block_map_ctx_t *ctx,
                                           uint32_t *count)
{
    if (ctx == NULL || !ctx->initialized || count == NULL) {
        return BLOCK_MAP_INVALID_PARAM;
    }

    uint32_t bad_count = 0;
    for (uint32_t i = 0; i < ctx->config.total_blocks; i++) {
        if (ctx->blocks[i].state == BLOCK_STATE_BAD) {
            bad_count++;
        }
    }

    *count = bad_count;
    return BLOCK_MAP_OK;
}

/**
 * @brief Print block mapping table
 */
void block_map_print(block_map_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        printf("Block mapping not initialized\n");
        return;
    }

    printf("\n=== Block Mapping Table ===\n");
    printf("Total blocks: %u\n", ctx->config.total_blocks);
    printf("Reserved blocks: %u\n", ctx->config.reserved_blocks);
    printf("Logical blocks: %u\n", ctx->num_logical_blocks);
    printf("Block size: %u bytes\n\n", ctx->config.block_size);

    printf("Physical | Logical | State  | Erase Count\n");
    printf("---------|---------|--------|-------------\n");

    for (uint32_t i = 0; i < ctx->config.total_blocks; i++) {
        const char *state_str;
        switch (ctx->blocks[i].state) {
            case BLOCK_STATE_FREE:   state_str = "FREE  "; break;
            case BLOCK_STATE_ACTIVE: state_str = "ACTIVE"; break;
            case BLOCK_STATE_DIRTY:  state_str = "DIRTY "; break;
            case BLOCK_STATE_BAD:    state_str = "BAD   "; break;
            default:                 state_str = "UNKN  "; break;
        }

        printf("  %5u  | ", i);

        if (ctx->blocks[i].logical_block == (uint32_t)-1) {
            printf("   -    ");
        } else {
            printf(" %5u  ", ctx->blocks[i].logical_block);
        }

        printf("| %s | %10u\n", state_str, ctx->blocks[i].erase_count);
    }

    /* Print statistics */
    uint32_t free_count, dirty_count, bad_count;
    block_map_get_free_count(ctx, &free_count);
    block_map_get_dirty_count(ctx, &dirty_count);
    block_map_get_bad_count(ctx, &bad_count);

    printf("\n");
    printf("Free blocks:  %u\n", free_count);
    printf("Dirty blocks: %u\n", dirty_count);
    printf("Bad blocks:   %u\n", bad_count);

    uint32_t min_block, max_block, min_count, max_count;
    if (block_map_get_min_erase_block(ctx, &min_block, &min_count) == BLOCK_MAP_OK) {
        printf("Min erase count: %u (block %u)\n", min_count, min_block);
    }
    if (block_map_get_max_erase_block(ctx, &max_block, &max_count) == BLOCK_MAP_OK) {
        printf("Max erase count: %u (block %u)\n", max_count, max_block);
    }
    printf("\n");
}
