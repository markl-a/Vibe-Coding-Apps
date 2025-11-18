/**
 * @file wear_leveling.c
 * @brief Wear Leveling Algorithm Implementation
 */

#include "wear_leveling.h"
#include "block_mapping.h"
#include "statistics.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* Wear leveling context structure */
struct wl_ctx {
    wl_config_t config;             /* Configuration */
    block_map_ctx_t *block_map;     /* Block mapping context */
    wl_stats_ctx_t *stats;          /* Statistics context */
    uint32_t total_blocks;          /* Total number of blocks */
    uint32_t logical_blocks;        /* Number of logical blocks */
    bool initialized;               /* Initialization status */
};

/* Helper function prototypes */
static wl_status_t wl_read_block(wl_ctx_t *ctx, uint32_t physical_block,
                                 uint8_t *data, uint32_t size);
static wl_status_t wl_write_block(wl_ctx_t *ctx, uint32_t physical_block,
                                  const uint8_t *data, uint32_t size);
static wl_status_t wl_erase_block(wl_ctx_t *ctx, uint32_t physical_block);
static wl_status_t wl_copy_block(wl_ctx_t *ctx, uint32_t src_block, uint32_t dst_block);
static wl_status_t wl_remap_block(wl_ctx_t *ctx, uint32_t logical_block, uint32_t new_physical_block);
static void wl_update_statistics(wl_ctx_t *ctx);

/**
 * @brief Initialize wear leveling module
 */
wl_ctx_t *wl_init(const wl_config_t *config)
{
    if (config == NULL || config->flash_ops == NULL || config->block_size == 0) {
        return NULL;
    }

    /* Allocate context */
    wl_ctx_t *ctx = (wl_ctx_t *)malloc(sizeof(wl_ctx_t));
    if (ctx == NULL) {
        return NULL;
    }

    memset(ctx, 0, sizeof(wl_ctx_t));
    memcpy(&ctx->config, config, sizeof(wl_config_t));

    /* Calculate block counts */
    ctx->total_blocks = config->total_size / config->block_size;
    ctx->logical_blocks = ctx->total_blocks - config->reserved_blocks;

    /* Initialize block mapping */
    block_map_config_t map_config = {
        .total_blocks = ctx->total_blocks,
        .reserved_blocks = config->reserved_blocks,
        .block_size = config->block_size,
    };

    ctx->block_map = block_map_init(&map_config);
    if (ctx->block_map == NULL) {
        free(ctx);
        return NULL;
    }

    /* Initialize statistics */
    ctx->stats = wl_stats_init(ctx->total_blocks);
    if (ctx->stats == NULL) {
        block_map_deinit(ctx->block_map);
        free(ctx);
        return NULL;
    }

    ctx->initialized = true;
    return ctx;
}

/**
 * @brief De-initialize wear leveling module
 */
wl_status_t wl_deinit(wl_ctx_t *ctx)
{
    if (ctx == NULL) {
        return WL_INVALID_PARAM;
    }

    if (ctx->block_map != NULL) {
        block_map_deinit(ctx->block_map);
    }

    if (ctx->stats != NULL) {
        wl_stats_deinit(ctx->stats);
    }

    free(ctx);
    return WL_OK;
}

/**
 * @brief Read data with wear leveling
 */
wl_status_t wl_read(wl_ctx_t *ctx, uint32_t logical_addr,
                    uint8_t *data, uint32_t size)
{
    if (ctx == NULL || !ctx->initialized || data == NULL || size == 0) {
        return WL_INVALID_PARAM;
    }

    /* Calculate logical block and offset */
    uint32_t logical_block = logical_addr / ctx->config.block_size;
    uint32_t offset = logical_addr % ctx->config.block_size;

    if (logical_block >= ctx->logical_blocks) {
        return WL_INVALID_PARAM;
    }

    /* Get physical block */
    uint32_t physical_block;
    block_map_status_t status = block_map_get_physical(ctx->block_map,
                                                        logical_block,
                                                        &physical_block);
    if (status != BLOCK_MAP_OK) {
        wl_stats_record_read_error(ctx->stats);
        return WL_ERROR;
    }

    /* Calculate physical address */
    uint32_t physical_addr = physical_block * ctx->config.block_size + offset;

    /* Read from flash */
    wl_status_t read_status = ctx->config.flash_ops->read(physical_addr, data, size);
    if (read_status == WL_OK) {
        wl_stats_record_read(ctx->stats, size);
    } else {
        wl_stats_record_read_error(ctx->stats);
    }

    return read_status;
}

/**
 * @brief Write data with wear leveling
 */
wl_status_t wl_write(wl_ctx_t *ctx, uint32_t logical_addr,
                     const uint8_t *data, uint32_t size)
{
    if (ctx == NULL || !ctx->initialized || data == NULL || size == 0) {
        return WL_INVALID_PARAM;
    }

    /* Calculate logical block and offset */
    uint32_t logical_block = logical_addr / ctx->config.block_size;
    uint32_t offset = logical_addr % ctx->config.block_size;

    if (logical_block >= ctx->logical_blocks) {
        return WL_INVALID_PARAM;
    }

    /* Get physical block */
    uint32_t physical_block;
    block_map_status_t status = block_map_get_physical(ctx->block_map,
                                                        logical_block,
                                                        &physical_block);
    if (status != BLOCK_MAP_OK) {
        wl_stats_record_write_error(ctx->stats);
        return WL_ERROR;
    }

    /* For out-of-place writes, allocate new block */
    if (offset != 0 || size != ctx->config.block_size) {
        /* Need to read-modify-write */
        uint8_t *block_buffer = (uint8_t *)malloc(ctx->config.block_size);
        if (block_buffer == NULL) {
            return WL_OUT_OF_MEMORY;
        }

        /* Read current block content */
        wl_status_t read_status = wl_read_block(ctx, physical_block,
                                                block_buffer,
                                                ctx->config.block_size);
        if (read_status != WL_OK) {
            free(block_buffer);
            return read_status;
        }

        /* Modify buffer */
        memcpy(block_buffer + offset, data, size);

        /* Allocate new block */
        uint32_t new_physical_block;
        if (block_map_allocate_block(ctx->block_map, &new_physical_block) != BLOCK_MAP_OK) {
            free(block_buffer);
            return WL_NO_FREE_BLOCKS;
        }

        /* Erase new block */
        wl_erase_block(ctx, new_physical_block);

        /* Write modified data to new block */
        wl_status_t write_status = wl_write_block(ctx, new_physical_block,
                                                  block_buffer,
                                                  ctx->config.block_size);
        free(block_buffer);

        if (write_status != WL_OK) {
            wl_stats_record_write_error(ctx->stats);
            return write_status;
        }

        /* Update mapping */
        wl_remap_block(ctx, logical_block, new_physical_block);

        /* Mark old block as dirty */
        block_map_mark_dirty(ctx->block_map, physical_block);

        wl_stats_record_write(ctx->stats, size);

        /* Check if garbage collection is needed */
        if (wl_needs_gc(ctx)) {
            wl_garbage_collect(ctx);
        }

    } else {
        /* Full block write */
        uint32_t physical_addr = physical_block * ctx->config.block_size;

        wl_status_t write_status = ctx->config.flash_ops->write(physical_addr, data, size);
        if (write_status == WL_OK) {
            wl_stats_record_write(ctx->stats, size);
        } else {
            wl_stats_record_write_error(ctx->stats);
            return write_status;
        }
    }

    /* Check if wear leveling is needed */
    if (wl_needs_leveling(ctx)) {
        wl_perform_leveling(ctx);
    }

    return WL_OK;
}

/**
 * @brief Erase logical block
 */
wl_status_t wl_erase(wl_ctx_t *ctx, uint32_t logical_addr)
{
    if (ctx == NULL || !ctx->initialized) {
        return WL_INVALID_PARAM;
    }

    uint32_t logical_block = logical_addr / ctx->config.block_size;

    if (logical_block >= ctx->logical_blocks) {
        return WL_INVALID_PARAM;
    }

    /* Get physical block */
    uint32_t physical_block;
    if (block_map_get_physical(ctx->block_map, logical_block, &physical_block) != BLOCK_MAP_OK) {
        return WL_ERROR;
    }

    /* Erase physical block */
    wl_status_t status = wl_erase_block(ctx, physical_block);
    if (status == WL_OK) {
        block_map_increment_erase_count(ctx->block_map, physical_block);
        wl_update_statistics(ctx);
    }

    return status;
}

/**
 * @brief Trigger garbage collection
 */
wl_status_t wl_garbage_collect(wl_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return WL_INVALID_PARAM;
    }

    uint32_t dirty_count;
    if (block_map_get_dirty_count(ctx->block_map, &dirty_count) != BLOCK_MAP_OK) {
        return WL_ERROR;
    }

    if (dirty_count == 0) {
        return WL_OK; /* Nothing to collect */
    }

    /* Simple GC: Erase all dirty blocks */
    for (uint32_t i = 0; i < ctx->total_blocks && dirty_count > 0; i++) {
        block_info_t info;
        if (block_map_get_info(ctx->block_map, i, &info) == BLOCK_MAP_OK) {
            if (info.state == BLOCK_STATE_DIRTY) {
                wl_erase_block(ctx, i);
                block_map_free_block(ctx->block_map, i);
                block_map_increment_erase_count(ctx->block_map, i);
                dirty_count--;
            }
        }
    }

    wl_stats_record_gc(ctx->stats, 0); /* Duration not measured */
    wl_update_statistics(ctx);

    return WL_OK;
}

/**
 * @brief Perform wear leveling
 */
wl_status_t wl_perform_leveling(wl_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return WL_INVALID_PARAM;
    }

    /* Get block with minimum and maximum erase counts */
    uint32_t min_block, max_block;
    uint32_t min_count, max_count;

    if (block_map_get_min_erase_block(ctx->block_map, &min_block, &min_count) != BLOCK_MAP_OK ||
        block_map_get_max_erase_block(ctx->block_map, &max_block, &max_count) != BLOCK_MAP_OK) {
        return WL_ERROR;
    }

    /* Check if leveling is really needed */
    if (max_count - min_count < ctx->config.wl_threshold) {
        return WL_OK;
    }

    /* Find an active block with high erase count */
    uint32_t src_block = (uint32_t)-1;
    for (uint32_t i = 0; i < ctx->total_blocks; i++) {
        block_info_t info;
        if (block_map_get_info(ctx->block_map, i, &info) == BLOCK_MAP_OK) {
            if (info.state == BLOCK_STATE_ACTIVE && info.erase_count >= max_count) {
                src_block = i;
                break;
            }
        }
    }

    if (src_block == (uint32_t)-1) {
        return WL_OK; /* No suitable block found */
    }

    /* Find free block with low erase count */
    uint32_t dst_block;
    if (block_map_allocate_block(ctx->block_map, &dst_block) != BLOCK_MAP_OK) {
        return WL_NO_FREE_BLOCKS;
    }

    /* Copy data from high-wear block to low-wear block */
    wl_status_t status = wl_copy_block(ctx, src_block, dst_block);
    if (status != WL_OK) {
        return status;
    }

    /* Update mapping */
    block_info_t src_info;
    block_map_get_info(ctx->block_map, src_block, &src_info);

    if (src_info.logical_block != (uint32_t)-1) {
        wl_remap_block(ctx, src_info.logical_block, dst_block);
    }

    /* Mark old block as dirty */
    block_map_mark_dirty(ctx->block_map, src_block);

    wl_stats_record_wear_level(ctx->stats);
    wl_update_statistics(ctx);

    return WL_OK;
}

/**
 * @brief Check if garbage collection is needed
 */
bool wl_needs_gc(wl_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return false;
    }

    uint32_t dirty_count;
    if (block_map_get_dirty_count(ctx->block_map, &dirty_count) != BLOCK_MAP_OK) {
        return false;
    }

    return (dirty_count >= ctx->config.gc_threshold);
}

/**
 * @brief Check if wear leveling is needed
 */
bool wl_needs_leveling(wl_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return false;
    }

    uint32_t min_block, max_block;
    uint32_t min_count, max_count;

    if (block_map_get_min_erase_block(ctx->block_map, &min_block, &min_count) != BLOCK_MAP_OK ||
        block_map_get_max_erase_block(ctx->block_map, &max_block, &max_count) != BLOCK_MAP_OK) {
        return false;
    }

    return ((max_count - min_count) >= ctx->config.wl_threshold);
}

/**
 * @brief Get total capacity
 */
uint32_t wl_get_capacity(wl_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    return ctx->logical_blocks * ctx->config.block_size;
}

/**
 * @brief Get available space
 */
uint32_t wl_get_available_space(wl_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    uint32_t free_count;
    if (block_map_get_free_count(ctx->block_map, &free_count) != BLOCK_MAP_OK) {
        return 0;
    }

    return free_count * ctx->config.block_size;
}

/**
 * @brief Get wear leveling statistics
 */
wl_status_t wl_get_statistics(wl_ctx_t *ctx, void *stats)
{
    if (ctx == NULL || !ctx->initialized || stats == NULL) {
        return WL_INVALID_PARAM;
    }

    wl_update_statistics(ctx);
    return wl_stats_get(ctx->stats, (wl_statistics_t *)stats) ? WL_OK : WL_ERROR;
}

/**
 * @brief Print wear leveling status
 */
void wl_print_status(wl_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        printf("Wear leveling not initialized\n");
        return;
    }

    wl_update_statistics(ctx);
    wl_stats_print(ctx->stats);
    block_map_print(ctx->block_map);
}

/**
 * @brief Format flash with wear leveling
 */
wl_status_t wl_format(wl_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return WL_INVALID_PARAM;
    }

    /* Erase all blocks */
    for (uint32_t i = 0; i < ctx->total_blocks; i++) {
        wl_erase_block(ctx, i);
        block_map_free_block(ctx->block_map, i);
    }

    wl_stats_reset(ctx->stats);
    return WL_OK;
}

/**
 * @brief Sync wear leveling state to flash
 */
wl_status_t wl_sync(wl_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return WL_INVALID_PARAM;
    }

    /* In a real implementation, this would save the mapping table to flash */
    return WL_OK;
}

/* Helper functions implementation */

static wl_status_t wl_read_block(wl_ctx_t *ctx, uint32_t physical_block,
                                 uint8_t *data, uint32_t size)
{
    uint32_t physical_addr = physical_block * ctx->config.block_size;
    return ctx->config.flash_ops->read(physical_addr, data, size);
}

static wl_status_t wl_write_block(wl_ctx_t *ctx, uint32_t physical_block,
                                  const uint8_t *data, uint32_t size)
{
    uint32_t physical_addr = physical_block * ctx->config.block_size;
    return ctx->config.flash_ops->write(physical_addr, data, size);
}

static wl_status_t wl_erase_block(wl_ctx_t *ctx, uint32_t physical_block)
{
    uint32_t physical_addr = physical_block * ctx->config.block_size;
    wl_status_t status = ctx->config.flash_ops->erase(physical_addr);

    if (status == WL_OK) {
        wl_stats_record_erase(ctx->stats);
    } else {
        wl_stats_record_erase_error(ctx->stats);
    }

    return status;
}

static wl_status_t wl_copy_block(wl_ctx_t *ctx, uint32_t src_block, uint32_t dst_block)
{
    uint8_t *buffer = (uint8_t *)malloc(ctx->config.block_size);
    if (buffer == NULL) {
        return WL_OUT_OF_MEMORY;
    }

    /* Read from source */
    wl_status_t status = wl_read_block(ctx, src_block, buffer, ctx->config.block_size);
    if (status != WL_OK) {
        free(buffer);
        return status;
    }

    /* Erase destination */
    status = wl_erase_block(ctx, dst_block);
    if (status != WL_OK) {
        free(buffer);
        return status;
    }

    /* Write to destination */
    status = wl_write_block(ctx, dst_block, buffer, ctx->config.block_size);
    free(buffer);

    return status;
}

static wl_status_t wl_remap_block(wl_ctx_t *ctx, uint32_t logical_block,
                                  uint32_t new_physical_block)
{
    block_map_status_t status = block_map_set_mapping(ctx->block_map,
                                                       logical_block,
                                                       new_physical_block);
    return (status == BLOCK_MAP_OK) ? WL_OK : WL_ERROR;
}

static void wl_update_statistics(wl_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return;
    }

    /* Update erase counts */
    uint32_t min_block, max_block;
    uint32_t min_count, max_count;

    block_map_get_min_erase_block(ctx->block_map, &min_block, &min_count);
    block_map_get_max_erase_block(ctx->block_map, &max_block, &max_count);

    /* Calculate average */
    uint64_t total_count = 0;
    for (uint32_t i = 0; i < ctx->total_blocks; i++) {
        block_info_t info;
        if (block_map_get_info(ctx->block_map, i, &info) == BLOCK_MAP_OK) {
            total_count += info.erase_count;
        }
    }
    uint32_t avg_count = (uint32_t)(total_count / ctx->total_blocks);

    wl_stats_update_erase_counts(ctx->stats, min_count, max_count, avg_count);

    /* Update block counts */
    uint32_t free_count, dirty_count, bad_count;
    block_map_get_free_count(ctx->block_map, &free_count);
    block_map_get_dirty_count(ctx->block_map, &dirty_count);
    block_map_get_bad_count(ctx->block_map, &bad_count);

    uint32_t active_count = ctx->total_blocks - free_count - dirty_count - bad_count;

    wl_stats_update_blocks(ctx->stats, free_count, dirty_count, bad_count, active_count);
}
