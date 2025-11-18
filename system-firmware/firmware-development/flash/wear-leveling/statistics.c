/**
 * @file statistics.c
 * @brief Wear Leveling Statistics Implementation
 */

#include "statistics.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* Statistics context structure */
struct wl_stats_ctx {
    wl_statistics_t stats;
    bool initialized;
};

/**
 * @brief Initialize statistics module
 */
wl_stats_ctx_t *wl_stats_init(uint32_t total_blocks)
{
    wl_stats_ctx_t *ctx = (wl_stats_ctx_t *)malloc(sizeof(wl_stats_ctx_t));
    if (ctx == NULL) {
        return NULL;
    }

    memset(&ctx->stats, 0, sizeof(wl_statistics_t));
    ctx->stats.total_blocks = total_blocks;
    ctx->initialized = true;

    return ctx;
}

/**
 * @brief De-initialize statistics module
 */
void wl_stats_deinit(wl_stats_ctx_t *ctx)
{
    if (ctx != NULL) {
        free(ctx);
    }
}

/**
 * @brief Reset all statistics
 */
void wl_stats_reset(wl_stats_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return;
    }

    uint32_t total_blocks = ctx->stats.total_blocks;
    memset(&ctx->stats, 0, sizeof(wl_statistics_t));
    ctx->stats.total_blocks = total_blocks;
}

/**
 * @brief Record read operation
 */
void wl_stats_record_read(wl_stats_ctx_t *ctx, uint32_t bytes)
{
    if (ctx == NULL || !ctx->initialized) {
        return;
    }

    ctx->stats.read_count++;
    ctx->stats.bytes_read += bytes;
}

/**
 * @brief Record write operation
 */
void wl_stats_record_write(wl_stats_ctx_t *ctx, uint32_t bytes)
{
    if (ctx == NULL || !ctx->initialized) {
        return;
    }

    ctx->stats.write_count++;
    ctx->stats.bytes_written += bytes;
}

/**
 * @brief Record erase operation
 */
void wl_stats_record_erase(wl_stats_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return;
    }

    ctx->stats.erase_count++;
}

/**
 * @brief Record garbage collection
 */
void wl_stats_record_gc(wl_stats_ctx_t *ctx, uint32_t duration_ms)
{
    if (ctx == NULL || !ctx->initialized) {
        return;
    }

    ctx->stats.garbage_collect_count++;
    ctx->stats.last_gc_time_ms = duration_ms;

    /* Update average GC time */
    if (ctx->stats.garbage_collect_count == 1) {
        ctx->stats.avg_gc_time_ms = duration_ms;
    } else {
        /* Running average */
        ctx->stats.avg_gc_time_ms =
            (ctx->stats.avg_gc_time_ms * (ctx->stats.garbage_collect_count - 1) + duration_ms)
            / ctx->stats.garbage_collect_count;
    }

    /* Update max GC time */
    if (duration_ms > ctx->stats.max_gc_time_ms) {
        ctx->stats.max_gc_time_ms = duration_ms;
    }
}

/**
 * @brief Record wear leveling operation
 */
void wl_stats_record_wear_level(wl_stats_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return;
    }

    ctx->stats.wear_level_count++;
}

/**
 * @brief Record read error
 */
void wl_stats_record_read_error(wl_stats_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return;
    }

    ctx->stats.read_errors++;
}

/**
 * @brief Record write error
 */
void wl_stats_record_write_error(wl_stats_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return;
    }

    ctx->stats.write_errors++;
}

/**
 * @brief Record erase error
 */
void wl_stats_record_erase_error(wl_stats_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return;
    }

    ctx->stats.erase_errors++;
}

/**
 * @brief Update erase count statistics
 */
void wl_stats_update_erase_counts(wl_stats_ctx_t *ctx,
                                  uint32_t min_count,
                                  uint32_t max_count,
                                  uint32_t avg_count)
{
    if (ctx == NULL || !ctx->initialized) {
        return;
    }

    ctx->stats.min_erase_count = min_count;
    ctx->stats.max_erase_count = max_count;
    ctx->stats.avg_erase_count = avg_count;
    ctx->stats.erase_count_delta = max_count - min_count;
}

/**
 * @brief Update block status
 */
void wl_stats_update_blocks(wl_stats_ctx_t *ctx,
                            uint32_t free_blocks,
                            uint32_t dirty_blocks,
                            uint32_t bad_blocks,
                            uint32_t active_blocks)
{
    if (ctx == NULL || !ctx->initialized) {
        return;
    }

    ctx->stats.free_blocks = free_blocks;
    ctx->stats.dirty_blocks = dirty_blocks;
    ctx->stats.bad_blocks = bad_blocks;
    ctx->stats.active_blocks = active_blocks;
}

/**
 * @brief Get current statistics
 */
bool wl_stats_get(wl_stats_ctx_t *ctx, wl_statistics_t *stats)
{
    if (ctx == NULL || !ctx->initialized || stats == NULL) {
        return false;
    }

    memcpy(stats, &ctx->stats, sizeof(wl_statistics_t));
    return true;
}

/**
 * @brief Print statistics report
 */
void wl_stats_print(wl_stats_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        printf("Statistics not initialized\n");
        return;
    }

    wl_statistics_t *stats = &ctx->stats;

    printf("\n========================================\n");
    printf("  Wear Leveling Statistics\n");
    printf("========================================\n\n");

    printf("Operation Counters:\n");
    printf("  Read operations:      %llu\n", (unsigned long long)stats->read_count);
    printf("  Write operations:     %llu\n", (unsigned long long)stats->write_count);
    printf("  Erase operations:     %llu\n", (unsigned long long)stats->erase_count);
    printf("  Garbage collections:  %llu\n", (unsigned long long)stats->garbage_collect_count);
    printf("  Wear level ops:       %llu\n", (unsigned long long)stats->wear_level_count);
    printf("\n");

    printf("Data Transfer:\n");
    printf("  Bytes read:           %llu (%.2f MB)\n",
           (unsigned long long)stats->bytes_read,
           stats->bytes_read / (1024.0 * 1024.0));
    printf("  Bytes written:        %llu (%.2f MB)\n",
           (unsigned long long)stats->bytes_written,
           stats->bytes_written / (1024.0 * 1024.0));
    printf("\n");

    printf("Error Counters:\n");
    printf("  Read errors:          %llu\n", (unsigned long long)stats->read_errors);
    printf("  Write errors:         %llu\n", (unsigned long long)stats->write_errors);
    printf("  Erase errors:         %llu\n", (unsigned long long)stats->erase_errors);
    printf("\n");

    printf("Erase Count Statistics:\n");
    printf("  Minimum:              %u\n", stats->min_erase_count);
    printf("  Maximum:              %u\n", stats->max_erase_count);
    printf("  Average:              %u\n", stats->avg_erase_count);
    printf("  Delta (max - min):    %u\n", stats->erase_count_delta);
    printf("\n");

    printf("Block Status:\n");
    printf("  Total blocks:         %u\n", stats->total_blocks);
    printf("  Free blocks:          %u (%.1f%%)\n",
           stats->free_blocks,
           (float)stats->free_blocks * 100.0f / stats->total_blocks);
    printf("  Active blocks:        %u (%.1f%%)\n",
           stats->active_blocks,
           (float)stats->active_blocks * 100.0f / stats->total_blocks);
    printf("  Dirty blocks:         %u (%.1f%%)\n",
           stats->dirty_blocks,
           (float)stats->dirty_blocks * 100.0f / stats->total_blocks);
    printf("  Bad blocks:           %u (%.1f%%)\n",
           stats->bad_blocks,
           (float)stats->bad_blocks * 100.0f / stats->total_blocks);
    printf("\n");

    printf("Performance Metrics:\n");
    printf("  Avg GC time:          %u ms\n", stats->avg_gc_time_ms);
    printf("  Max GC time:          %u ms\n", stats->max_gc_time_ms);
    printf("  Last GC time:         %u ms\n", stats->last_gc_time_ms);
    printf("\n");

    printf("Wear Leveling Efficiency:\n");
    float efficiency = wl_stats_calculate_efficiency(ctx);
    printf("  Efficiency:           %.2f%%\n", efficiency);
    printf("\n");

    printf("========================================\n\n");
}

/**
 * @brief Calculate wear leveling efficiency
 */
float wl_stats_calculate_efficiency(wl_stats_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return 0.0f;
    }

    wl_statistics_t *stats = &ctx->stats;

    /* Efficiency based on erase count distribution */
    /* Perfect efficiency = 100% (all blocks have same erase count) */
    /* Poor efficiency = 0% (large delta between min and max) */

    if (stats->max_erase_count == 0) {
        return 100.0f; /* No wear yet */
    }

    float delta_ratio = (float)stats->erase_count_delta / (float)stats->max_erase_count;
    float efficiency = (1.0f - delta_ratio) * 100.0f;

    /* Clamp to 0-100 range */
    if (efficiency < 0.0f) efficiency = 0.0f;
    if (efficiency > 100.0f) efficiency = 100.0f;

    return efficiency;
}

/**
 * @brief Get estimated remaining lifetime
 */
uint64_t wl_stats_estimate_lifetime(wl_stats_ctx_t *ctx, uint32_t max_erase_cycles)
{
    if (ctx == NULL || !ctx->initialized || max_erase_cycles == 0) {
        return 0;
    }

    wl_statistics_t *stats = &ctx->stats;

    /* Calculate remaining erase cycles */
    if (stats->avg_erase_count >= max_erase_cycles) {
        return 0; /* Already worn out */
    }

    uint32_t remaining_cycles = max_erase_cycles - stats->avg_erase_count;

    /* Calculate number of active blocks */
    uint32_t usable_blocks = stats->total_blocks - stats->bad_blocks;
    if (usable_blocks == 0) {
        return 0;
    }

    /* Estimate remaining writes (assuming uniform distribution) */
    /* This is a simplified estimation */
    uint64_t remaining_writes = (uint64_t)remaining_cycles * (uint64_t)usable_blocks;

    return remaining_writes;
}
