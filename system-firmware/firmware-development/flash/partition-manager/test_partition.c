/**
 * @file test_partition.c
 * @brief Partition Manager Unit Tests
 */

#include "partition_manager.h"
#include "partition_table.h"
#include "mount.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

/* Test result tracking */
static int tests_passed = 0;
static int tests_failed = 0;

/* Test macros */
#define TEST_ASSERT(condition, message) \
    do { \
        if (condition) { \
            printf("  [PASS] %s\n", message); \
            tests_passed++; \
        } else { \
            printf("  [FAIL] %s\n", message); \
            tests_failed++; \
        } \
    } while(0)

#define TEST_START(name) \
    printf("\n=== Running: %s ===\n", name)

/* Mock flash memory */
#define FLASH_SIZE (1024 * 1024)  /* 1MB */
static uint8_t mock_flash[FLASH_SIZE];

/* Mock flash operations */
static partition_status_t mock_flash_read(uint32_t address, uint8_t *data, uint32_t size)
{
    if (address + size > FLASH_SIZE) {
        return PART_ERROR;
    }
    memcpy(data, &mock_flash[address], size);
    return PART_OK;
}

static partition_status_t mock_flash_write(uint32_t address, const uint8_t *data, uint32_t size)
{
    if (address + size > FLASH_SIZE) {
        return PART_ERROR;
    }
    memcpy(&mock_flash[address], data, size);
    return PART_OK;
}

static partition_status_t mock_flash_erase(uint32_t address, uint32_t size)
{
    if (address + size > FLASH_SIZE) {
        return PART_ERROR;
    }
    memset(&mock_flash[address], 0xFF, size);
    return PART_OK;
}

static const partition_flash_ops_t mock_flash_ops = {
    .read = mock_flash_read,
    .write = mock_flash_write,
    .erase = mock_flash_erase,
};

/* Helper function */
static void init_mock_flash(void)
{
    memset(mock_flash, 0xFF, FLASH_SIZE);
}

/**
 * @brief Test partition table basic operations
 */
void test_partition_table_basic(void)
{
    TEST_START("Partition Table Basic Operations");

    partition_table_ctx_t *ctx = partition_table_init(FLASH_SIZE);
    TEST_ASSERT(ctx != NULL, "Initialize partition table");

    /* Create partition entry */
    partition_entry_t entry1 = {
        .name = "boot",
        .type = PARTITION_TYPE_BOOTLOADER,
        .offset = 0,
        .size = 64 * 1024,
        .flags = PARTITION_FLAG_READONLY,
        .crc32 = 0,
    };

    /* Add partition */
    partition_status_t status = partition_table_add(ctx, &entry1);
    TEST_ASSERT(status == PART_OK, "Add partition");

    /* Get partition count */
    uint32_t count = partition_table_count(ctx);
    TEST_ASSERT(count == 1, "Partition count is 1");

    /* Find partition */
    partition_entry_t found;
    status = partition_table_find(ctx, "boot", &found);
    TEST_ASSERT(status == PART_OK, "Find partition by name");
    TEST_ASSERT(strcmp(found.name, "boot") == 0, "Partition name matches");

    /* Add another partition */
    partition_entry_t entry2 = {
        .name = "app",
        .type = PARTITION_TYPE_APP,
        .offset = 64 * 1024,
        .size = 256 * 1024,
        .flags = PARTITION_FLAG_NONE,
        .crc32 = 0,
    };

    status = partition_table_add(ctx, &entry2);
    TEST_ASSERT(status == PART_OK, "Add second partition");

    count = partition_table_count(ctx);
    TEST_ASSERT(count == 2, "Partition count is 2");

    /* Test duplicate detection */
    status = partition_table_add(ctx, &entry1);
    TEST_ASSERT(status == PART_ALREADY_EXISTS, "Duplicate partition detected");

    /* Test overlap detection */
    partition_entry_t entry3 = {
        .name = "overlap",
        .type = PARTITION_TYPE_DATA,
        .offset = 32 * 1024,  /* Overlaps with boot */
        .size = 64 * 1024,
        .flags = PARTITION_FLAG_NONE,
        .crc32 = 0,
    };

    status = partition_table_add(ctx, &entry3);
    TEST_ASSERT(status == PART_OVERLAP, "Overlap detected");

    /* Remove partition */
    status = partition_table_remove(ctx, "app");
    TEST_ASSERT(status == PART_OK, "Remove partition");

    count = partition_table_count(ctx);
    TEST_ASSERT(count == 1, "Partition count after removal");

    /* Cleanup */
    partition_table_deinit(ctx);
}

/**
 * @brief Test partition table serialization
 */
void test_partition_table_serialization(void)
{
    TEST_START("Partition Table Serialization");

    partition_table_ctx_t *ctx = partition_table_init(FLASH_SIZE);

    /* Add some partitions */
    partition_entry_t entry1 = {
        .name = "boot",
        .type = PARTITION_TYPE_BOOTLOADER,
        .offset = 0,
        .size = 64 * 1024,
        .flags = PARTITION_FLAG_READONLY,
        .crc32 = 0,
    };
    partition_table_add(ctx, &entry1);

    partition_entry_t entry2 = {
        .name = "data",
        .type = PARTITION_TYPE_DATA,
        .offset = 64 * 1024,
        .size = 128 * 1024,
        .flags = PARTITION_FLAG_NONE,
        .crc32 = 0,
    };
    partition_table_add(ctx, &entry2);

    /* Serialize */
    uint8_t buffer[4096];
    size_t size = partition_table_serialize(ctx, buffer, sizeof(buffer));
    TEST_ASSERT(size > 0, "Serialize partition table");

    /* Create new context and deserialize */
    partition_table_ctx_t *ctx2 = partition_table_init(FLASH_SIZE);
    partition_status_t status = partition_table_deserialize(ctx2, buffer, size);
    TEST_ASSERT(status == PART_OK, "Deserialize partition table");

    /* Verify partitions */
    uint32_t count = partition_table_count(ctx2);
    TEST_ASSERT(count == 2, "Partition count matches");

    partition_entry_t found;
    status = partition_table_find(ctx2, "boot", &found);
    TEST_ASSERT(status == PART_OK, "Find deserialized partition");
    TEST_ASSERT(found.size == 64 * 1024, "Partition size matches");

    /* Cleanup */
    partition_table_deinit(ctx);
    partition_table_deinit(ctx2);
}

/**
 * @brief Test partition manager
 */
void test_partition_manager(void)
{
    TEST_START("Partition Manager");

    init_mock_flash();

    partition_mgr_config_t config = {
        .flash_size = FLASH_SIZE,
        .partition_table_offset = 0,
        .flash_ops = &mock_flash_ops,
    };

    partition_mgr_ctx_t *ctx = partition_mgr_init(&config);
    TEST_ASSERT(ctx != NULL, "Initialize partition manager");

    /* Create partitions */
    partition_status_t status = partition_mgr_create(ctx, "boot",
                                                     PARTITION_TYPE_BOOTLOADER,
                                                     4096, 64 * 1024,
                                                     PARTITION_FLAG_READONLY);
    TEST_ASSERT(status == PART_OK, "Create boot partition");

    status = partition_mgr_create(ctx, "app",
                                  PARTITION_TYPE_APP,
                                  68 * 1024, 256 * 1024,
                                  PARTITION_FLAG_NONE);
    TEST_ASSERT(status == PART_OK, "Create app partition");

    status = partition_mgr_create(ctx, "data",
                                  PARTITION_TYPE_DATA,
                                  324 * 1024, 512 * 1024,
                                  PARTITION_FLAG_NONE);
    TEST_ASSERT(status == PART_OK, "Create data partition");

    /* Get partition count */
    uint32_t count = partition_mgr_count(ctx);
    TEST_ASSERT(count == 3, "Partition count is 3");

    /* Check existence */
    bool exists = partition_mgr_exists(ctx, "app");
    TEST_ASSERT(exists == true, "Partition exists");

    exists = partition_mgr_exists(ctx, "nonexistent");
    TEST_ASSERT(exists == false, "Non-existent partition");

    /* Get partition info */
    partition_entry_t entry;
    status = partition_mgr_get_info(ctx, "app", &entry);
    TEST_ASSERT(status == PART_OK, "Get partition info");
    TEST_ASSERT(entry.size == 256 * 1024, "Partition size correct");

    /* Write and read data */
    uint8_t write_data[256];
    uint8_t read_data[256];
    for (int i = 0; i < 256; i++) {
        write_data[i] = i;
    }

    status = partition_mgr_write(ctx, "data", 0, write_data, 256);
    TEST_ASSERT(status == PART_OK, "Write to partition");

    status = partition_mgr_read(ctx, "data", 0, read_data, 256);
    TEST_ASSERT(status == PART_OK, "Read from partition");

    int match = (memcmp(write_data, read_data, 256) == 0);
    TEST_ASSERT(match, "Data matches");

    /* Test read-only protection */
    status = partition_mgr_write(ctx, "boot", 0, write_data, 256);
    TEST_ASSERT(status == PART_ERROR, "Write to read-only partition blocked");

    /* Delete partition */
    status = partition_mgr_delete(ctx, "app");
    TEST_ASSERT(status == PART_OK, "Delete partition");

    count = partition_mgr_count(ctx);
    TEST_ASSERT(count == 2, "Partition count after deletion");

    /* Cleanup */
    partition_mgr_deinit(ctx);
}

/**
 * @brief Test partition save/load
 */
void test_partition_save_load(void)
{
    TEST_START("Partition Save/Load");

    init_mock_flash();

    partition_mgr_config_t config = {
        .flash_size = FLASH_SIZE,
        .partition_table_offset = 0,
        .flash_ops = &mock_flash_ops,
    };

    partition_mgr_ctx_t *ctx = partition_mgr_init(&config);

    /* Create partitions */
    partition_mgr_create(ctx, "boot", PARTITION_TYPE_BOOTLOADER,
                        4096, 64 * 1024, PARTITION_FLAG_READONLY);
    partition_mgr_create(ctx, "app", PARTITION_TYPE_APP,
                        68 * 1024, 256 * 1024, PARTITION_FLAG_NONE);

    /* Save table */
    partition_status_t status = partition_mgr_save_table(ctx);
    TEST_ASSERT(status == PART_OK, "Save partition table");

    partition_mgr_deinit(ctx);

    /* Create new manager and load table */
    partition_mgr_ctx_t *ctx2 = partition_mgr_init(&config);
    status = partition_mgr_load_table(ctx2);
    TEST_ASSERT(status == PART_OK, "Load partition table");

    /* Verify partitions */
    uint32_t count = partition_mgr_count(ctx2);
    TEST_ASSERT(count == 2, "Loaded partition count");

    bool exists = partition_mgr_exists(ctx2, "boot");
    TEST_ASSERT(exists == true, "Boot partition loaded");

    exists = partition_mgr_exists(ctx2, "app");
    TEST_ASSERT(exists == true, "App partition loaded");

    /* Cleanup */
    partition_mgr_deinit(ctx2);
}

/**
 * @brief Test mount manager
 */
void test_mount_manager(void)
{
    TEST_START("Mount Manager");

    mount_mgr_ctx_t *ctx = mount_mgr_init();
    TEST_ASSERT(ctx != NULL, "Initialize mount manager");

    /* Mount partitions */
    partition_status_t status = mount_partition(ctx, "boot", "/boot",
                                               MOUNT_FLAG_READONLY);
    TEST_ASSERT(status == PART_OK, "Mount boot partition");

    status = mount_partition(ctx, "data", "/data", MOUNT_FLAG_NONE);
    TEST_ASSERT(status == PART_OK, "Mount data partition");

    /* Get mount count */
    uint32_t count = get_mounted_count(ctx);
    TEST_ASSERT(count == 2, "Mount count is 2");

    /* Check if mounted */
    bool mounted = is_partition_mounted(ctx, "boot");
    TEST_ASSERT(mounted == true, "Boot partition is mounted");

    mounted = is_partition_mounted(ctx, "nonexistent");
    TEST_ASSERT(mounted == false, "Non-existent partition not mounted");

    /* Find mount point */
    char mount_path[MOUNT_PATH_MAX_LEN];
    status = find_mount_point(ctx, "data", mount_path, sizeof(mount_path));
    TEST_ASSERT(status == PART_OK, "Find mount point");
    TEST_ASSERT(strcmp(mount_path, "/data") == 0, "Mount path correct");

    /* Get mount info */
    mount_point_t mp;
    status = get_mount_info(ctx, "/boot", &mp);
    TEST_ASSERT(status == PART_OK, "Get mount info");
    TEST_ASSERT(mp.flags & MOUNT_FLAG_READONLY, "Read-only flag set");

    /* Update statistics */
    status = update_mount_stats(ctx, "/data", true);
    TEST_ASSERT(status == PART_OK, "Update mount stats");

    status = get_mount_info(ctx, "/data", &mp);
    TEST_ASSERT(mp.read_count == 1, "Read count updated");

    /* Test duplicate mount */
    status = mount_partition(ctx, "boot", "/boot2", MOUNT_FLAG_NONE);
    TEST_ASSERT(status == PART_ALREADY_EXISTS, "Duplicate mount detected");

    /* Unmount partition */
    status = unmount_partition(ctx, "/boot");
    TEST_ASSERT(status == PART_OK, "Unmount partition");

    count = get_mounted_count(ctx);
    TEST_ASSERT(count == 1, "Mount count after unmount");

    /* Unmount all */
    status = unmount_all(ctx);
    TEST_ASSERT(status == PART_OK, "Unmount all");

    count = get_mounted_count(ctx);
    TEST_ASSERT(count == 0, "No partitions mounted");

    /* Cleanup */
    mount_mgr_deinit(ctx);
}

/**
 * @brief Test error handling
 */
void test_error_handling(void)
{
    TEST_START("Error Handling");

    /* Test NULL parameters */
    partition_table_ctx_t *null_ctx = NULL;
    partition_status_t status = partition_table_add(null_ctx, NULL);
    TEST_ASSERT(status == PART_INVALID_PARAM, "NULL context check");

    partition_mgr_ctx_t *null_mgr = NULL;
    status = partition_mgr_read(null_mgr, "test", 0, NULL, 0);
    TEST_ASSERT(status == PART_INVALID_PARAM, "NULL manager check");

    mount_mgr_ctx_t *null_mount = NULL;
    bool result = is_partition_mounted(null_mount, "test");
    TEST_ASSERT(result == false, "NULL mount manager check");

    /* Test invalid mount paths */
    result = is_valid_mount_path(NULL);
    TEST_ASSERT(result == false, "NULL path");

    result = is_valid_mount_path("");
    TEST_ASSERT(result == false, "Empty path");

    result = is_valid_mount_path("relative/path");
    TEST_ASSERT(result == false, "Relative path");

    result = is_valid_mount_path("/valid/path");
    TEST_ASSERT(result == true, "Valid path");
}

/**
 * @brief Run all tests
 */
int main(void)
{
    printf("\n");
    printf("========================================\n");
    printf("  Partition Manager Test Suite\n");
    printf("========================================\n");

    test_partition_table_basic();
    test_partition_table_serialization();
    test_partition_manager();
    test_partition_save_load();
    test_mount_manager();
    test_error_handling();

    printf("\n");
    printf("========================================\n");
    printf("  Test Results\n");
    printf("========================================\n");
    printf("Tests passed: %d, failed: %d\n", tests_passed, tests_failed);

    if (tests_failed == 0) {
        printf("\n  All tests PASSED!\n\n");
        return 0;
    } else {
        printf("\n  Some tests FAILED!\n\n");
        return 1;
    }
}
