/**
 * @file statistics.h
 * @brief Wear Leveling Statistics Collection
 * @details Tracks wear leveling metrics and performance
 */

#ifndef STATISTICS_H
#define STATISTICS_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Statistics structure */
typedef struct {
    /* Operation counters */
    uint64_t read_count;            /* Total read operations */
    uint64_t write_count;           /* Total write operations */
    uint64_t erase_count;           /* Total erase operations */
    uint64_t garbage_collect_count; /* Total garbage collections */
    uint64_t wear_level_count;      /* Total wear leveling operations */

    /* Data counters */
    uint64_t bytes_read;            /* Total bytes read */
    uint64_t bytes_written;         /* Total bytes written */

    /* Error counters */
    uint64_t read_errors;           /* Read error count */
    uint64_t write_errors;          /* Write error count */
    uint64_t erase_errors;          /* Erase error count */

    /* Wear leveling metrics */
    uint32_t min_erase_count;       /* Minimum erase count */
    uint32_t max_erase_count;       /* Maximum erase count */
    uint32_t avg_erase_count;       /* Average erase count */
    uint32_t erase_count_delta;     /* Difference between min and max */

    /* Block status */
    uint32_t total_blocks;          /* Total number of blocks */
    uint32_t free_blocks;           /* Number of free blocks */
    uint32_t dirty_blocks;          /* Number of dirty blocks */
    uint32_t bad_blocks;            /* Number of bad blocks */
    uint32_t active_blocks;         /* Number of active blocks */

    /* Performance metrics */
    uint32_t avg_gc_time_ms;        /* Average GC time in milliseconds */
    uint32_t max_gc_time_ms;        /* Maximum GC time in milliseconds */
    uint32_t last_gc_time_ms;       /* Last GC time in milliseconds */

    /* Timing */
    uint64_t uptime_seconds;        /* System uptime in seconds */
    uint64_t last_update_time;      /* Last statistics update time */
} wl_statistics_t;

/* Statistics context */
typedef struct wl_stats_ctx wl_stats_ctx_t;

/**
 * @brief Initialize statistics module
 * @param total_blocks Total number of blocks
 * @return Context pointer on success, NULL on error
 */
wl_stats_ctx_t *wl_stats_init(uint32_t total_blocks);

/**
 * @brief De-initialize statistics module
 * @param ctx Context pointer
 */
void wl_stats_deinit(wl_stats_ctx_t *ctx);

/**
 * @brief Reset all statistics
 * @param ctx Context pointer
 */
void wl_stats_reset(wl_stats_ctx_t *ctx);

/**
 * @brief Record read operation
 * @param ctx Context pointer
 * @param bytes Number of bytes read
 */
void wl_stats_record_read(wl_stats_ctx_t *ctx, uint32_t bytes);

/**
 * @brief Record write operation
 * @param ctx Context pointer
 * @param bytes Number of bytes written
 */
void wl_stats_record_write(wl_stats_ctx_t *ctx, uint32_t bytes);

/**
 * @brief Record erase operation
 * @param ctx Context pointer
 */
void wl_stats_record_erase(wl_stats_ctx_t *ctx);

/**
 * @brief Record garbage collection
 * @param ctx Context pointer
 * @param duration_ms Duration in milliseconds
 */
void wl_stats_record_gc(wl_stats_ctx_t *ctx, uint32_t duration_ms);

/**
 * @brief Record wear leveling operation
 * @param ctx Context pointer
 */
void wl_stats_record_wear_level(wl_stats_ctx_t *ctx);

/**
 * @brief Record read error
 * @param ctx Context pointer
 */
void wl_stats_record_read_error(wl_stats_ctx_t *ctx);

/**
 * @brief Record write error
 * @param ctx Context pointer
 */
void wl_stats_record_write_error(wl_stats_ctx_t *ctx);

/**
 * @brief Record erase error
 * @param ctx Context pointer
 */
void wl_stats_record_erase_error(wl_stats_ctx_t *ctx);

/**
 * @brief Update erase count statistics
 * @param ctx Context pointer
 * @param min_count Minimum erase count
 * @param max_count Maximum erase count
 * @param avg_count Average erase count
 */
void wl_stats_update_erase_counts(wl_stats_ctx_t *ctx,
                                  uint32_t min_count,
                                  uint32_t max_count,
                                  uint32_t avg_count);

/**
 * @brief Update block status
 * @param ctx Context pointer
 * @param free_blocks Number of free blocks
 * @param dirty_blocks Number of dirty blocks
 * @param bad_blocks Number of bad blocks
 * @param active_blocks Number of active blocks
 */
void wl_stats_update_blocks(wl_stats_ctx_t *ctx,
                            uint32_t free_blocks,
                            uint32_t dirty_blocks,
                            uint32_t bad_blocks,
                            uint32_t active_blocks);

/**
 * @brief Get current statistics
 * @param ctx Context pointer
 * @param stats Pointer to store statistics
 * @return true on success, false on error
 */
bool wl_stats_get(wl_stats_ctx_t *ctx, wl_statistics_t *stats);

/**
 * @brief Print statistics report
 * @param ctx Context pointer
 */
void wl_stats_print(wl_stats_ctx_t *ctx);

/**
 * @brief Calculate wear leveling efficiency
 * @param ctx Context pointer
 * @return Efficiency percentage (0-100)
 */
float wl_stats_calculate_efficiency(wl_stats_ctx_t *ctx);

/**
 * @brief Get estimated remaining lifetime
 * @param ctx Context pointer
 * @param max_erase_cycles Maximum erase cycles per block
 * @return Estimated remaining writes before wear out
 */
uint64_t wl_stats_estimate_lifetime(wl_stats_ctx_t *ctx, uint32_t max_erase_cycles);

#ifdef __cplusplus
}
#endif

#endif /* STATISTICS_H */
