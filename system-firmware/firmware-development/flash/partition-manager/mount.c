/**
 * @file mount.c
 * @brief Partition Mount Management Implementation
 */

#include "mount.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <time.h>

/* Mount manager context */
struct mount_mgr_ctx {
    mount_point_t mount_points[MOUNT_MAX_POINTS];
    uint32_t mount_count;
    bool initialized;
};

/**
 * @brief Initialize mount manager
 */
mount_mgr_ctx_t *mount_mgr_init(void)
{
    mount_mgr_ctx_t *ctx = (mount_mgr_ctx_t *)malloc(sizeof(mount_mgr_ctx_t));
    if (ctx == NULL) {
        return NULL;
    }

    memset(ctx, 0, sizeof(mount_mgr_ctx_t));
    ctx->initialized = true;

    return ctx;
}

/**
 * @brief De-initialize mount manager
 */
partition_status_t mount_mgr_deinit(mount_mgr_ctx_t *ctx)
{
    if (ctx == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Unmount all partitions */
    unmount_all(ctx);

    free(ctx);
    return PART_OK;
}

/**
 * @brief Mount partition
 */
partition_status_t mount_partition(mount_mgr_ctx_t *ctx,
                                   const char *partition_name,
                                   const char *mount_path,
                                   uint32_t flags)
{
    if (ctx == NULL || !ctx->initialized ||
        partition_name == NULL || mount_path == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Check if mount table is full */
    if (ctx->mount_count >= MOUNT_MAX_POINTS) {
        return PART_TABLE_FULL;
    }

    /* Validate mount path */
    if (!is_valid_mount_path(mount_path)) {
        return PART_INVALID_PARAM;
    }

    /* Check if partition is already mounted */
    if (is_partition_mounted(ctx, partition_name)) {
        return PART_ALREADY_EXISTS;
    }

    /* Check if mount path is already used */
    for (uint32_t i = 0; i < ctx->mount_count; i++) {
        if (strcmp(ctx->mount_points[i].mount_path, mount_path) == 0) {
            return PART_ALREADY_EXISTS;
        }
    }

    /* Create new mount point */
    mount_point_t *mp = &ctx->mount_points[ctx->mount_count];

    strncpy(mp->partition_name, partition_name, PARTITION_NAME_MAX_LEN - 1);
    strncpy(mp->mount_path, mount_path, MOUNT_PATH_MAX_LEN - 1);
    mp->flags = flags;
    mp->mounted = true;
    mp->mount_time = (uint32_t)time(NULL);
    mp->read_count = 0;
    mp->write_count = 0;

    ctx->mount_count++;

    return PART_OK;
}

/**
 * @brief Unmount partition
 */
partition_status_t unmount_partition(mount_mgr_ctx_t *ctx,
                                     const char *mount_path)
{
    if (ctx == NULL || !ctx->initialized || mount_path == NULL) {
        return PART_INVALID_PARAM;
    }

    /* Find mount point */
    int32_t index = -1;
    for (uint32_t i = 0; i < ctx->mount_count; i++) {
        if (strcmp(ctx->mount_points[i].mount_path, mount_path) == 0) {
            index = i;
            break;
        }
    }

    if (index == -1) {
        return PART_NOT_FOUND;
    }

    /* Shift remaining mount points */
    for (uint32_t i = index; i < ctx->mount_count - 1; i++) {
        memcpy(&ctx->mount_points[i],
               &ctx->mount_points[i + 1],
               sizeof(mount_point_t));
    }

    /* Clear last mount point */
    memset(&ctx->mount_points[ctx->mount_count - 1], 0, sizeof(mount_point_t));
    ctx->mount_count--;

    return PART_OK;
}

/**
 * @brief Check if partition is mounted
 */
bool is_partition_mounted(mount_mgr_ctx_t *ctx,
                          const char *partition_name)
{
    if (ctx == NULL || !ctx->initialized || partition_name == NULL) {
        return false;
    }

    for (uint32_t i = 0; i < ctx->mount_count; i++) {
        if (strcmp(ctx->mount_points[i].partition_name, partition_name) == 0 &&
            ctx->mount_points[i].mounted) {
            return true;
        }
    }

    return false;
}

/**
 * @brief Get mount point information
 */
partition_status_t get_mount_info(mount_mgr_ctx_t *ctx,
                                  const char *mount_path,
                                  mount_point_t *mount_point)
{
    if (ctx == NULL || !ctx->initialized ||
        mount_path == NULL || mount_point == NULL) {
        return PART_INVALID_PARAM;
    }

    for (uint32_t i = 0; i < ctx->mount_count; i++) {
        if (strcmp(ctx->mount_points[i].mount_path, mount_path) == 0) {
            memcpy(mount_point, &ctx->mount_points[i], sizeof(mount_point_t));
            return PART_OK;
        }
    }

    return PART_NOT_FOUND;
}

/**
 * @brief Find mount point by partition name
 */
partition_status_t find_mount_point(mount_mgr_ctx_t *ctx,
                                    const char *partition_name,
                                    char *mount_path,
                                    size_t path_len)
{
    if (ctx == NULL || !ctx->initialized ||
        partition_name == NULL || mount_path == NULL) {
        return PART_INVALID_PARAM;
    }

    for (uint32_t i = 0; i < ctx->mount_count; i++) {
        if (strcmp(ctx->mount_points[i].partition_name, partition_name) == 0) {
            strncpy(mount_path, ctx->mount_points[i].mount_path, path_len - 1);
            mount_path[path_len - 1] = '\0';
            return PART_OK;
        }
    }

    return PART_NOT_FOUND;
}

/**
 * @brief Get number of mounted partitions
 */
uint32_t get_mounted_count(mount_mgr_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return 0;
    }

    return ctx->mount_count;
}

/**
 * @brief List all mount points
 */
void list_mount_points(mount_mgr_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        printf("Mount manager not initialized\n");
        return;
    }

    printf("\n========================================\n");
    printf("  Mount Points\n");
    printf("========================================\n\n");

    if (ctx->mount_count == 0) {
        printf("No partitions mounted\n\n");
        return;
    }

    printf("%-16s %-16s %-8s %-10s %-10s\n",
           "Partition", "Mount Path", "Flags", "Reads", "Writes");
    printf("%-16s %-16s %-8s %-10s %-10s\n",
           "----------------", "----------------", "--------", "----------", "----------");

    for (uint32_t i = 0; i < ctx->mount_count; i++) {
        mount_point_t *mp = &ctx->mount_points[i];

        /* Format flags */
        char flags_str[16] = "";
        if (mp->flags & MOUNT_FLAG_READONLY) strcat(flags_str, "RO,");
        if (mp->flags & MOUNT_FLAG_NOEXEC) strcat(flags_str, "NX,");
        if (mp->flags & MOUNT_FLAG_SYNC) strcat(flags_str, "SY,");
        if (mp->flags & MOUNT_FLAG_NOATIME) strcat(flags_str, "NA,");

        /* Remove trailing comma */
        size_t len = strlen(flags_str);
        if (len > 0 && flags_str[len - 1] == ',') {
            flags_str[len - 1] = '\0';
        }
        if (flags_str[0] == '\0') {
            strcpy(flags_str, "RW");
        }

        printf("%-16s %-16s %-8s %10llu %10llu\n",
               mp->partition_name,
               mp->mount_path,
               flags_str,
               (unsigned long long)mp->read_count,
               (unsigned long long)mp->write_count);
    }

    printf("\n========================================\n\n");
}

/**
 * @brief Unmount all partitions
 */
partition_status_t unmount_all(mount_mgr_ctx_t *ctx)
{
    if (ctx == NULL || !ctx->initialized) {
        return PART_INVALID_PARAM;
    }

    /* Clear all mount points */
    memset(ctx->mount_points, 0, sizeof(ctx->mount_points));
    ctx->mount_count = 0;

    return PART_OK;
}

/**
 * @brief Update mount statistics
 */
partition_status_t update_mount_stats(mount_mgr_ctx_t *ctx,
                                      const char *mount_path,
                                      bool read_op)
{
    if (ctx == NULL || !ctx->initialized || mount_path == NULL) {
        return PART_INVALID_PARAM;
    }

    for (uint32_t i = 0; i < ctx->mount_count; i++) {
        if (strcmp(ctx->mount_points[i].mount_path, mount_path) == 0) {
            if (read_op) {
                ctx->mount_points[i].read_count++;
            } else {
                ctx->mount_points[i].write_count++;
            }
            return PART_OK;
        }
    }

    return PART_NOT_FOUND;
}

/**
 * @brief Check mount path validity
 */
bool is_valid_mount_path(const char *path)
{
    if (path == NULL || path[0] == '\0') {
        return false;
    }

    /* Check if path starts with / */
    if (path[0] != '/') {
        return false;
    }

    /* Check length */
    if (strlen(path) >= MOUNT_PATH_MAX_LEN) {
        return false;
    }

    /* Check for invalid characters */
    for (const char *p = path; *p != '\0'; p++) {
        if (*p < 32 || *p > 126) {
            return false; /* Non-printable character */
        }
    }

    return true;
}

/**
 * @brief Remount partition with new flags
 */
partition_status_t remount_partition(mount_mgr_ctx_t *ctx,
                                     const char *mount_path,
                                     uint32_t flags)
{
    if (ctx == NULL || !ctx->initialized || mount_path == NULL) {
        return PART_INVALID_PARAM;
    }

    for (uint32_t i = 0; i < ctx->mount_count; i++) {
        if (strcmp(ctx->mount_points[i].mount_path, mount_path) == 0) {
            ctx->mount_points[i].flags = flags;
            return PART_OK;
        }
    }

    return PART_NOT_FOUND;
}
