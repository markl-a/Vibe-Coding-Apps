/**
 * @file partition_table.h
 * @brief Flash Partition Table Management
 * @details Manages flash partitions with metadata
 */

#ifndef PARTITION_TABLE_H
#define PARTITION_TABLE_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Maximum partition name length */
#define PARTITION_NAME_MAX_LEN 16

/* Maximum number of partitions */
#define PARTITION_MAX_COUNT 16

/* Partition table magic number */
#define PARTITION_TABLE_MAGIC 0x50544231  /* "PTB1" */

/* Status codes */
typedef enum {
    PART_OK = 0,
    PART_ERROR,
    PART_INVALID_PARAM,
    PART_NOT_FOUND,
    PART_TABLE_FULL,
    PART_ALREADY_EXISTS,
    PART_OVERLAP,
    PART_NOT_INITIALIZED,
} partition_status_t;

/* Partition types */
typedef enum {
    PARTITION_TYPE_DATA = 0,    /* General data partition */
    PARTITION_TYPE_APP,         /* Application code */
    PARTITION_TYPE_FS,          /* File system */
    PARTITION_TYPE_BOOTLOADER,  /* Bootloader */
    PARTITION_TYPE_CONFIG,      /* Configuration */
    PARTITION_TYPE_LOG,         /* Log data */
    PARTITION_TYPE_OTA,         /* OTA update */
    PARTITION_TYPE_FACTORY,     /* Factory data */
    PARTITION_TYPE_USER,        /* User defined */
} partition_type_t;

/* Partition flags */
typedef enum {
    PARTITION_FLAG_NONE = 0,
    PARTITION_FLAG_READONLY = (1 << 0),     /* Read-only partition */
    PARTITION_FLAG_ENCRYPTED = (1 << 1),    /* Encrypted partition */
    PARTITION_FLAG_COMPRESSED = (1 << 2),   /* Compressed partition */
    PARTITION_FLAG_BOOT = (1 << 3),         /* Bootable partition */
    PARTITION_FLAG_ACTIVE = (1 << 4),       /* Active partition */
} partition_flags_t;

/* Partition entry */
typedef struct {
    char name[PARTITION_NAME_MAX_LEN];  /* Partition name */
    partition_type_t type;              /* Partition type */
    uint32_t offset;                    /* Offset from flash start */
    uint32_t size;                      /* Partition size in bytes */
    uint32_t flags;                     /* Partition flags */
    uint32_t crc32;                     /* CRC32 of partition data */
} partition_entry_t;

/* Partition table header */
typedef struct {
    uint32_t magic;                     /* Magic number */
    uint32_t version;                   /* Table version */
    uint32_t num_partitions;            /* Number of partitions */
    uint32_t flash_size;                /* Total flash size */
    uint32_t crc32;                     /* CRC32 of table */
} partition_table_header_t;

/* Partition table */
typedef struct {
    partition_table_header_t header;
    partition_entry_t entries[PARTITION_MAX_COUNT];
} partition_table_t;

/* Partition table context */
typedef struct partition_table_ctx partition_table_ctx_t;

/**
 * @brief Initialize partition table
 * @param flash_size Total flash size
 * @return Context pointer on success, NULL on error
 */
partition_table_ctx_t *partition_table_init(uint32_t flash_size);

/**
 * @brief De-initialize partition table
 * @param ctx Context pointer
 * @return PART_OK on success
 */
partition_status_t partition_table_deinit(partition_table_ctx_t *ctx);

/**
 * @brief Add partition to table
 * @param ctx Context pointer
 * @param entry Partition entry
 * @return PART_OK on success
 */
partition_status_t partition_table_add(partition_table_ctx_t *ctx,
                                       const partition_entry_t *entry);

/**
 * @brief Remove partition from table
 * @param ctx Context pointer
 * @param name Partition name
 * @return PART_OK on success
 */
partition_status_t partition_table_remove(partition_table_ctx_t *ctx,
                                          const char *name);

/**
 * @brief Find partition by name
 * @param ctx Context pointer
 * @param name Partition name
 * @param entry Pointer to store partition entry
 * @return PART_OK on success
 */
partition_status_t partition_table_find(partition_table_ctx_t *ctx,
                                        const char *name,
                                        partition_entry_t *entry);

/**
 * @brief Find partition by type
 * @param ctx Context pointer
 * @param type Partition type
 * @param entry Pointer to store partition entry
 * @return PART_OK on success (returns first match)
 */
partition_status_t partition_table_find_by_type(partition_table_ctx_t *ctx,
                                                partition_type_t type,
                                                partition_entry_t *entry);

/**
 * @brief Get partition by index
 * @param ctx Context pointer
 * @param index Partition index
 * @param entry Pointer to store partition entry
 * @return PART_OK on success
 */
partition_status_t partition_table_get(partition_table_ctx_t *ctx,
                                       uint32_t index,
                                       partition_entry_t *entry);

/**
 * @brief Get number of partitions
 * @param ctx Context pointer
 * @return Number of partitions
 */
uint32_t partition_table_count(partition_table_ctx_t *ctx);

/**
 * @brief Update partition entry
 * @param ctx Context pointer
 * @param name Partition name
 * @param entry New partition entry
 * @return PART_OK on success
 */
partition_status_t partition_table_update(partition_table_ctx_t *ctx,
                                          const char *name,
                                          const partition_entry_t *entry);

/**
 * @brief Validate partition table
 * @param ctx Context pointer
 * @return PART_OK if valid
 */
partition_status_t partition_table_validate(partition_table_ctx_t *ctx);

/**
 * @brief Check if partitions overlap
 * @param entry1 First partition entry
 * @param entry2 Second partition entry
 * @return true if partitions overlap
 */
bool partition_table_check_overlap(const partition_entry_t *entry1,
                                   const partition_entry_t *entry2);

/**
 * @brief Calculate table CRC32
 * @param ctx Context pointer
 * @return CRC32 value
 */
uint32_t partition_table_calculate_crc(partition_table_ctx_t *ctx);

/**
 * @brief Serialize partition table to buffer
 * @param ctx Context pointer
 * @param buffer Output buffer
 * @param size Buffer size
 * @return Number of bytes written, 0 on error
 */
size_t partition_table_serialize(partition_table_ctx_t *ctx,
                                 uint8_t *buffer,
                                 size_t size);

/**
 * @brief Deserialize partition table from buffer
 * @param ctx Context pointer
 * @param buffer Input buffer
 * @param size Buffer size
 * @return PART_OK on success
 */
partition_status_t partition_table_deserialize(partition_table_ctx_t *ctx,
                                               const uint8_t *buffer,
                                               size_t size);

/**
 * @brief Print partition table
 * @param ctx Context pointer
 */
void partition_table_print(partition_table_ctx_t *ctx);

/**
 * @brief Get partition type name
 * @param type Partition type
 * @return Type name string
 */
const char *partition_type_to_string(partition_type_t type);

#ifdef __cplusplus
}
#endif

#endif /* PARTITION_TABLE_H */
