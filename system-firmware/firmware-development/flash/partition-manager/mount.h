/**
 * @file mount.h
 * @brief Partition Mount Management
 * @details Manages mounting and unmounting of partitions
 */

#ifndef MOUNT_H
#define MOUNT_H

#include "partition_table.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Maximum mount points */
#define MOUNT_MAX_POINTS 8

/* Mount point path length */
#define MOUNT_PATH_MAX_LEN 32

/* Mount flags */
typedef enum {
    MOUNT_FLAG_NONE = 0,
    MOUNT_FLAG_READONLY = (1 << 0),     /* Mount as read-only */
    MOUNT_FLAG_NOEXEC = (1 << 1),       /* No execution */
    MOUNT_FLAG_SYNC = (1 << 2),         /* Synchronous I/O */
    MOUNT_FLAG_NOATIME = (1 << 3),      /* No access time update */
} mount_flags_t;

/* Mount point information */
typedef struct {
    char partition_name[PARTITION_NAME_MAX_LEN];
    char mount_path[MOUNT_PATH_MAX_LEN];
    uint32_t flags;
    bool mounted;
    uint32_t mount_time;        /* Timestamp when mounted */
    uint64_t read_count;        /* Number of read operations */
    uint64_t write_count;       /* Number of write operations */
} mount_point_t;

/* Mount manager context */
typedef struct mount_mgr_ctx mount_mgr_ctx_t;

/**
 * @brief Initialize mount manager
 * @return Context pointer on success, NULL on error
 */
mount_mgr_ctx_t *mount_mgr_init(void);

/**
 * @brief De-initialize mount manager
 * @param ctx Context pointer
 * @return PART_OK on success
 */
partition_status_t mount_mgr_deinit(mount_mgr_ctx_t *ctx);

/**
 * @brief Mount partition
 * @param ctx Context pointer
 * @param partition_name Partition name
 * @param mount_path Mount path
 * @param flags Mount flags
 * @return PART_OK on success
 */
partition_status_t mount_partition(mount_mgr_ctx_t *ctx,
                                   const char *partition_name,
                                   const char *mount_path,
                                   uint32_t flags);

/**
 * @brief Unmount partition
 * @param ctx Context pointer
 * @param mount_path Mount path
 * @return PART_OK on success
 */
partition_status_t unmount_partition(mount_mgr_ctx_t *ctx,
                                     const char *mount_path);

/**
 * @brief Check if partition is mounted
 * @param ctx Context pointer
 * @param partition_name Partition name
 * @return true if mounted
 */
bool is_partition_mounted(mount_mgr_ctx_t *ctx,
                          const char *partition_name);

/**
 * @brief Get mount point information
 * @param ctx Context pointer
 * @param mount_path Mount path
 * @param mount_point Pointer to store mount point info
 * @return PART_OK on success
 */
partition_status_t get_mount_info(mount_mgr_ctx_t *ctx,
                                  const char *mount_path,
                                  mount_point_t *mount_point);

/**
 * @brief Find mount point by partition name
 * @param ctx Context pointer
 * @param partition_name Partition name
 * @param mount_path Buffer to store mount path
 * @param path_len Buffer size
 * @return PART_OK on success
 */
partition_status_t find_mount_point(mount_mgr_ctx_t *ctx,
                                    const char *partition_name,
                                    char *mount_path,
                                    size_t path_len);

/**
 * @brief Get number of mounted partitions
 * @param ctx Context pointer
 * @return Number of mounted partitions
 */
uint32_t get_mounted_count(mount_mgr_ctx_t *ctx);

/**
 * @brief List all mount points
 * @param ctx Context pointer
 */
void list_mount_points(mount_mgr_ctx_t *ctx);

/**
 * @brief Unmount all partitions
 * @param ctx Context pointer
 * @return PART_OK on success
 */
partition_status_t unmount_all(mount_mgr_ctx_t *ctx);

/**
 * @brief Update mount statistics
 * @param ctx Context pointer
 * @param mount_path Mount path
 * @param read_op true for read, false for write
 * @return PART_OK on success
 */
partition_status_t update_mount_stats(mount_mgr_ctx_t *ctx,
                                      const char *mount_path,
                                      bool read_op);

/**
 * @brief Check mount path validity
 * @param path Mount path to check
 * @return true if valid
 */
bool is_valid_mount_path(const char *path);

/**
 * @brief Remount partition with new flags
 * @param ctx Context pointer
 * @param mount_path Mount path
 * @param flags New mount flags
 * @return PART_OK on success
 */
partition_status_t remount_partition(mount_mgr_ctx_t *ctx,
                                     const char *mount_path,
                                     uint32_t flags);

#ifdef __cplusplus
}
#endif

#endif /* MOUNT_H */
