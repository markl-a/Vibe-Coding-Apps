/**
 * @file wear_leveling.h
 * @brief Wear Leveling Algorithm
 * @details Implements dynamic and static wear leveling
 */

#ifndef WEAR_LEVELING_H
#define WEAR_LEVELING_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Status codes */
typedef enum {
    WL_OK = 0,
    WL_ERROR,
    WL_INVALID_PARAM,
    WL_NO_FREE_BLOCKS,
    WL_READ_ERROR,
    WL_WRITE_ERROR,
    WL_ERASE_ERROR,
    WL_NOT_INITIALIZED,
    WL_OUT_OF_MEMORY,
} wl_status_t;

/* Wear leveling strategy */
typedef enum {
    WL_STRATEGY_DYNAMIC = 0,    /* Dynamic wear leveling only */
    WL_STRATEGY_STATIC,         /* Static wear leveling only */
    WL_STRATEGY_HYBRID,         /* Both dynamic and static */
} wl_strategy_t;

/* Flash operations callbacks */
typedef struct {
    /* Read data from flash */
    wl_status_t (*read)(uint32_t address, uint8_t *data, uint32_t size);

    /* Write data to flash */
    wl_status_t (*write)(uint32_t address, const uint8_t *data, uint32_t size);

    /* Erase flash block */
    wl_status_t (*erase)(uint32_t address);
} wl_flash_ops_t;

/* Wear leveling configuration */
typedef struct {
    uint32_t total_size;            /* Total flash size in bytes */
    uint32_t block_size;            /* Block size in bytes */
    uint32_t reserved_blocks;       /* Number of reserved blocks */
    wl_strategy_t strategy;         /* Wear leveling strategy */
    uint32_t gc_threshold;          /* GC trigger threshold (dirty blocks) */
    uint32_t wl_threshold;          /* Wear level trigger threshold (erase delta) */
    const wl_flash_ops_t *flash_ops;/* Flash operations */
} wl_config_t;

/* Wear leveling context */
typedef struct wl_ctx wl_ctx_t;

/**
 * @brief Initialize wear leveling module
 * @param config Pointer to configuration
 * @return Context pointer on success, NULL on error
 */
wl_ctx_t *wl_init(const wl_config_t *config);

/**
 * @brief De-initialize wear leveling module
 * @param ctx Context pointer
 * @return WL_OK on success
 */
wl_status_t wl_deinit(wl_ctx_t *ctx);

/**
 * @brief Read data with wear leveling
 * @param ctx Context pointer
 * @param logical_addr Logical address
 * @param data Buffer to store data
 * @param size Number of bytes to read
 * @return WL_OK on success
 */
wl_status_t wl_read(wl_ctx_t *ctx, uint32_t logical_addr,
                    uint8_t *data, uint32_t size);

/**
 * @brief Write data with wear leveling
 * @param ctx Context pointer
 * @param logical_addr Logical address
 * @param data Data to write
 * @param size Number of bytes to write
 * @return WL_OK on success
 */
wl_status_t wl_write(wl_ctx_t *ctx, uint32_t logical_addr,
                     const uint8_t *data, uint32_t size);

/**
 * @brief Erase logical block
 * @param ctx Context pointer
 * @param logical_addr Logical address in block
 * @return WL_OK on success
 */
wl_status_t wl_erase(wl_ctx_t *ctx, uint32_t logical_addr);

/**
 * @brief Trigger garbage collection
 * @param ctx Context pointer
 * @return WL_OK on success
 */
wl_status_t wl_garbage_collect(wl_ctx_t *ctx);

/**
 * @brief Perform wear leveling
 * @param ctx Context pointer
 * @return WL_OK on success
 */
wl_status_t wl_perform_leveling(wl_ctx_t *ctx);

/**
 * @brief Check if garbage collection is needed
 * @param ctx Context pointer
 * @return true if GC is needed
 */
bool wl_needs_gc(wl_ctx_t *ctx);

/**
 * @brief Check if wear leveling is needed
 * @param ctx Context pointer
 * @return true if wear leveling is needed
 */
bool wl_needs_leveling(wl_ctx_t *ctx);

/**
 * @brief Get total capacity
 * @param ctx Context pointer
 * @return Total capacity in bytes
 */
uint32_t wl_get_capacity(wl_ctx_t *ctx);

/**
 * @brief Get available space
 * @param ctx Context pointer
 * @return Available space in bytes
 */
uint32_t wl_get_available_space(wl_ctx_t *ctx);

/**
 * @brief Get wear leveling statistics
 * @param ctx Context pointer
 * @param stats Pointer to store statistics
 * @return WL_OK on success
 */
wl_status_t wl_get_statistics(wl_ctx_t *ctx, void *stats);

/**
 * @brief Print wear leveling status
 * @param ctx Context pointer
 */
void wl_print_status(wl_ctx_t *ctx);

/**
 * @brief Format/initialize flash with wear leveling
 * @param ctx Context pointer
 * @return WL_OK on success
 */
wl_status_t wl_format(wl_ctx_t *ctx);

/**
 * @brief Sync wear leveling state to flash
 * @param ctx Context pointer
 * @return WL_OK on success
 */
wl_status_t wl_sync(wl_ctx_t *ctx);

#ifdef __cplusplus
}
#endif

#endif /* WEAR_LEVELING_H */
