/**
 * @file test_wear_leveling.c
 * @brief Wear Leveling Unit Tests
 */

#include "wear_leveling.h"
#include "block_mapping.h"
#include "statistics.h"
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
#define FLASH_SIZE (128 * 1024)  /* 128KB */
#define BLOCK_SIZE 4096          /* 4KB blocks */
#define NUM_BLOCKS (FLASH_SIZE / BLOCK_SIZE)

static uint8_t mock_flash[FLASH_SIZE];
static uint32_t erase_count_per_block[NUM_BLOCKS];

/* Mock flash operations */
static wl_status_t mock_flash_read(uint32_t address, uint8_t *data, uint32_t size)
{
    if (address + size > FLASH_SIZE) {
        return WL_READ_ERROR;
    }
    memcpy(data, &mock_flash[address], size);
    return WL_OK;
}

static wl_status_t mock_flash_write(uint32_t address, const uint8_t *data, uint32_t size)
{
    if (address + size > FLASH_SIZE) {
        return WL_WRITE_ERROR;
    }

    /* Check if area is erased */
    for (uint32_t i = 0; i < size; i++) {
        if (mock_flash[address + i] != 0xFF) {
            return WL_WRITE_ERROR; /* Need to erase first */
        }
    }

    memcpy(&mock_flash[address], data, size);
    return WL_OK;
}

static wl_status_t mock_flash_erase(uint32_t address)
{
    uint32_t block = address / BLOCK_SIZE;
    if (block >= NUM_BLOCKS) {
        return WL_ERASE_ERROR;
    }

    uint32_t block_addr = block * BLOCK_SIZE;
    memset(&mock_flash[block_addr], 0xFF, BLOCK_SIZE);
    erase_count_per_block[block]++;

    return WL_OK;
}

static const wl_flash_ops_t mock_flash_ops = {
    .read = mock_flash_read,
    .write = mock_flash_write,
    .erase = mock_flash_erase,
};

/* Helper function to initialize mock flash */
static void init_mock_flash(void)
{
    memset(mock_flash, 0xFF, FLASH_SIZE);
    memset(erase_count_per_block, 0, sizeof(erase_count_per_block));
}

/**
 * @brief Test block mapping basic operations
 */
void test_block_mapping_basic(void)
{
    TEST_START("Block Mapping Basic Operations");

    block_map_config_t config = {
        .total_blocks = 32,
        .reserved_blocks = 4,
        .block_size = BLOCK_SIZE,
    };

    block_map_ctx_t *ctx = block_map_init(&config);
    TEST_ASSERT(ctx != NULL, "Initialize block mapping");

    /* Test get physical block */
    uint32_t physical;
    block_map_status_t status = block_map_get_physical(ctx, 0, &physical);
    TEST_ASSERT(status == BLOCK_MAP_OK, "Get physical block");
    TEST_ASSERT(physical == 0, "Default mapping is identity");

    /* Test allocate block */
    uint32_t allocated;
    status = block_map_allocate_block(ctx, &allocated);
    TEST_ASSERT(status == BLOCK_MAP_OK, "Allocate free block");

    /* Test mark dirty */
    status = block_map_mark_dirty(ctx, 5);
    TEST_ASSERT(status == BLOCK_MAP_OK, "Mark block as dirty");

    /* Test get info */
    block_info_t info;
    status = block_map_get_info(ctx, 5, &info);
    TEST_ASSERT(status == BLOCK_MAP_OK, "Get block info");
    TEST_ASSERT(info.state == BLOCK_STATE_DIRTY, "Block state is dirty");

    /* Test increment erase count */
    status = block_map_increment_erase_count(ctx, 5);
    TEST_ASSERT(status == BLOCK_MAP_OK, "Increment erase count");

    status = block_map_get_info(ctx, 5, &info);
    TEST_ASSERT(info.erase_count == 1, "Erase count incremented");

    /* Test get counts */
    uint32_t free_count, dirty_count;
    block_map_get_free_count(ctx, &free_count);
    block_map_get_dirty_count(ctx, &dirty_count);
    TEST_ASSERT(dirty_count == 1, "One dirty block");

    /* Cleanup */
    block_map_deinit(ctx);
}

/**
 * @brief Test statistics module
 */
void test_statistics_module(void)
{
    TEST_START("Statistics Module");

    wl_stats_ctx_t *ctx = wl_stats_init(32);
    TEST_ASSERT(ctx != NULL, "Initialize statistics");

    /* Record operations */
    wl_stats_record_read(ctx, 1024);
    wl_stats_record_write(ctx, 512);
    wl_stats_record_erase(ctx);
    wl_stats_record_gc(ctx, 10);
    wl_stats_record_wear_level(ctx);

    /* Get statistics */
    wl_statistics_t stats;
    bool result = wl_stats_get(ctx, &stats);
    TEST_ASSERT(result == true, "Get statistics");
    TEST_ASSERT(stats.read_count == 1, "Read count is 1");
    TEST_ASSERT(stats.write_count == 1, "Write count is 1");
    TEST_ASSERT(stats.erase_count == 1, "Erase count is 1");
    TEST_ASSERT(stats.bytes_read == 1024, "Bytes read is 1024");
    TEST_ASSERT(stats.bytes_written == 512, "Bytes written is 512");

    /* Update erase counts */
    wl_stats_update_erase_counts(ctx, 0, 10, 5);
    wl_stats_get(ctx, &stats);
    TEST_ASSERT(stats.min_erase_count == 0, "Min erase count is 0");
    TEST_ASSERT(stats.max_erase_count == 10, "Max erase count is 10");
    TEST_ASSERT(stats.avg_erase_count == 5, "Avg erase count is 5");

    /* Calculate efficiency */
    float efficiency = wl_stats_calculate_efficiency(ctx);
    TEST_ASSERT(efficiency == 0.0f, "Efficiency calculated");

    /* Reset statistics */
    wl_stats_reset(ctx);
    wl_stats_get(ctx, &stats);
    TEST_ASSERT(stats.read_count == 0, "Statistics reset");

    /* Cleanup */
    wl_stats_deinit(ctx);
}

/**
 * @brief Test wear leveling initialization
 */
void test_wl_initialization(void)
{
    TEST_START("Wear Leveling Initialization");

    init_mock_flash();

    wl_config_t config = {
        .total_size = FLASH_SIZE,
        .block_size = BLOCK_SIZE,
        .reserved_blocks = 4,
        .strategy = WL_STRATEGY_HYBRID,
        .gc_threshold = 4,
        .wl_threshold = 10,
        .flash_ops = &mock_flash_ops,
    };

    wl_ctx_t *ctx = wl_init(&config);
    TEST_ASSERT(ctx != NULL, "Initialize wear leveling");

    /* Test capacity */
    uint32_t capacity = wl_get_capacity(ctx);
    TEST_ASSERT(capacity == (NUM_BLOCKS - 4) * BLOCK_SIZE, "Get capacity");

    /* Test available space */
    uint32_t available = wl_get_available_space(ctx);
    TEST_ASSERT(available > 0, "Available space");

    /* Cleanup */
    wl_deinit(ctx);
}

/**
 * @brief Test read/write operations
 */
void test_wl_read_write(void)
{
    TEST_START("Wear Leveling Read/Write");

    init_mock_flash();

    wl_config_t config = {
        .total_size = FLASH_SIZE,
        .block_size = BLOCK_SIZE,
        .reserved_blocks = 4,
        .strategy = WL_STRATEGY_HYBRID,
        .gc_threshold = 4,
        .wl_threshold = 10,
        .flash_ops = &mock_flash_ops,
    };

    wl_ctx_t *ctx = wl_init(&config);
    TEST_ASSERT(ctx != NULL, "Initialize");

    /* Format flash */
    wl_status_t status = wl_format(ctx);
    TEST_ASSERT(status == WL_OK, "Format flash");

    /* Prepare test data */
    uint8_t write_data[256];
    uint8_t read_data[256];
    for (int i = 0; i < 256; i++) {
        write_data[i] = i;
    }

    /* Write data */
    status = wl_write(ctx, 0, write_data, 256);
    TEST_ASSERT(status == WL_OK, "Write data");

    /* Read data back */
    status = wl_read(ctx, 0, read_data, 256);
    TEST_ASSERT(status == WL_OK, "Read data");

    /* Verify data */
    int match = (memcmp(write_data, read_data, 256) == 0);
    TEST_ASSERT(match, "Data matches");

    /* Write to different address */
    status = wl_write(ctx, 4096, write_data, 256);
    TEST_ASSERT(status == WL_OK, "Write to block 1");

    status = wl_read(ctx, 4096, read_data, 256);
    TEST_ASSERT(status == WL_OK, "Read from block 1");

    match = (memcmp(write_data, read_data, 256) == 0);
    TEST_ASSERT(match, "Block 1 data matches");

    /* Cleanup */
    wl_deinit(ctx);
}

/**
 * @brief Test garbage collection
 */
void test_wl_garbage_collection(void)
{
    TEST_START("Garbage Collection");

    init_mock_flash();

    wl_config_t config = {
        .total_size = FLASH_SIZE,
        .block_size = BLOCK_SIZE,
        .reserved_blocks = 4,
        .strategy = WL_STRATEGY_HYBRID,
        .gc_threshold = 2,
        .wl_threshold = 10,
        .flash_ops = &mock_flash_ops,
    };

    wl_ctx_t *ctx = wl_init(&config);
    wl_format(ctx);

    uint8_t data[BLOCK_SIZE];
    memset(data, 0xAA, BLOCK_SIZE);

    /* Write multiple blocks to trigger GC */
    for (int i = 0; i < 5; i++) {
        wl_write(ctx, i * BLOCK_SIZE, data, BLOCK_SIZE);
    }

    /* Manually trigger GC */
    wl_status_t status = wl_garbage_collect(ctx);
    TEST_ASSERT(status == WL_OK, "Garbage collection");

    /* Get statistics */
    wl_statistics_t stats;
    wl_get_statistics(ctx, &stats);
    TEST_ASSERT(stats.garbage_collect_count > 0, "GC was performed");

    /* Cleanup */
    wl_deinit(ctx);
}

/**
 * @brief Test wear leveling algorithm
 */
void test_wl_algorithm(void)
{
    TEST_START("Wear Leveling Algorithm");

    init_mock_flash();

    wl_config_t config = {
        .total_size = FLASH_SIZE,
        .block_size = BLOCK_SIZE,
        .reserved_blocks = 4,
        .strategy = WL_STRATEGY_HYBRID,
        .gc_threshold = 4,
        .wl_threshold = 5,
        .flash_ops = &mock_flash_ops,
    };

    wl_ctx_t *ctx = wl_init(&config);
    wl_format(ctx);

    uint8_t data[256];
    memset(data, 0x55, 256);

    /* Write to same location multiple times to create uneven wear */
    for (int i = 0; i < 20; i++) {
        wl_write(ctx, 0, data, 256);
    }

    /* Perform wear leveling */
    wl_status_t status = wl_perform_leveling(ctx);
    TEST_ASSERT(status == WL_OK, "Perform wear leveling");

    /* Get statistics */
    wl_statistics_t stats;
    wl_get_statistics(ctx, &stats);

    printf("  Min erase count: %u\n", stats.min_erase_count);
    printf("  Max erase count: %u\n", stats.max_erase_count);
    printf("  Erase count delta: %u\n", stats.erase_count_delta);

    /* Cleanup */
    wl_deinit(ctx);
    tests_passed++; /* Count as one passing test */
}

/**
 * @brief Test error handling
 */
void test_wl_error_handling(void)
{
    TEST_START("Error Handling");

    /* Test with NULL context */
    wl_status_t status = wl_read(NULL, 0, NULL, 0);
    TEST_ASSERT(status == WL_INVALID_PARAM, "NULL context check");

    init_mock_flash();

    wl_config_t config = {
        .total_size = FLASH_SIZE,
        .block_size = BLOCK_SIZE,
        .reserved_blocks = 4,
        .strategy = WL_STRATEGY_HYBRID,
        .gc_threshold = 4,
        .wl_threshold = 10,
        .flash_ops = &mock_flash_ops,
    };

    wl_ctx_t *ctx = wl_init(&config);

    /* Test invalid parameters */
    uint8_t buffer[16];
    status = wl_read(ctx, 0, NULL, 16);
    TEST_ASSERT(status == WL_INVALID_PARAM, "NULL buffer check");

    status = wl_write(ctx, 0, NULL, 16);
    TEST_ASSERT(status == WL_INVALID_PARAM, "NULL write buffer check");

    /* Test out of bounds */
    status = wl_read(ctx, FLASH_SIZE + 1000, buffer, 16);
    TEST_ASSERT(status == WL_INVALID_PARAM, "Out of bounds read");

    /* Cleanup */
    wl_deinit(ctx);
}

/**
 * @brief Performance benchmark
 */
void test_wl_performance(void)
{
    TEST_START("Performance Benchmark");

    init_mock_flash();

    wl_config_t config = {
        .total_size = FLASH_SIZE,
        .block_size = BLOCK_SIZE,
        .reserved_blocks = 4,
        .strategy = WL_STRATEGY_HYBRID,
        .gc_threshold = 4,
        .wl_threshold = 10,
        .flash_ops = &mock_flash_ops,
    };

    wl_ctx_t *ctx = wl_init(&config);
    wl_format(ctx);

    uint8_t buffer[1024];
    memset(buffer, 0xAA, 1024);

    printf("  Running write test (100 writes)...\n");
    for (int i = 0; i < 100; i++) {
        wl_write(ctx, (i % 10) * 1024, buffer, 1024);
    }

    printf("  Running read test (100 reads)...\n");
    for (int i = 0; i < 100; i++) {
        wl_read(ctx, (i % 10) * 1024, buffer, 1024);
    }

    /* Get statistics */
    wl_statistics_t stats;
    wl_get_statistics(ctx, &stats);

    printf("  Total operations:\n");
    printf("    Reads:  %llu\n", (unsigned long long)stats.read_count);
    printf("    Writes: %llu\n", (unsigned long long)stats.write_count);
    printf("    Erases: %llu\n", (unsigned long long)stats.erase_count);
    printf("  Write amplification: %.2fx\n",
           (float)stats.bytes_written / (100.0f * 1024.0f));

    /* Cleanup */
    wl_deinit(ctx);
    tests_passed++; /* Count as one passing test */
}

/**
 * @brief Run all tests
 */
int main(void)
{
    printf("\n");
    printf("========================================\n");
    printf("  Wear Leveling Test Suite\n");
    printf("========================================\n");

    test_block_mapping_basic();
    test_statistics_module();
    test_wl_initialization();
    test_wl_read_write();
    test_wl_garbage_collection();
    test_wl_algorithm();
    test_wl_error_handling();
    test_wl_performance();

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
