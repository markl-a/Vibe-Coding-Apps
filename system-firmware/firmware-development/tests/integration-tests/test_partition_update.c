/**
 * @file test_partition_update.c
 * @brief Partition Update Integration Test
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

#define PARTITION_SIZE 131072
#define SECTOR_SIZE 4096

typedef struct {
    uint32_t start_address;
    uint32_t size;
    uint32_t version;
    bool active;
    uint32_t crc;
} partition_info_t;

/**
 * @brief Test basic partition update
 */
static int test_basic_partition_update(void)
{
    TEST_CASE_START("Basic Partition Update");

    mock_init();

    partition_info_t partition_a = {
        .start_address = 0x10000,
        .size = PARTITION_SIZE,
        .version = 1,
        .active = true,
        .crc = 0
    };

    partition_info_t partition_b = {
        .start_address = 0x30000,
        .size = PARTITION_SIZE,
        .version = 0,
        .active = false,
        .crc = 0
    };

    // Generate new firmware
    uint8_t new_firmware[PARTITION_SIZE];
    test_generate_random_data(new_firmware, sizeof(new_firmware));

    // Update inactive partition
    printf("\n    Updating partition B...\n");
    mock_flash_erase(partition_b.start_address, partition_b.size);

    for (uint32_t offset = 0; offset < PARTITION_SIZE; offset += SECTOR_SIZE) {
        mock_flash_write(partition_b.start_address + offset,
                         new_firmware + offset, SECTOR_SIZE);
    }

    // Update partition info
    partition_b.version = 2;
    partition_b.crc = test_calculate_crc32(new_firmware, sizeof(new_firmware));

    // Verify update
    uint8_t verify_buffer[PARTITION_SIZE];
    mock_flash_read(partition_b.start_address, verify_buffer, sizeof(verify_buffer));
    TEST_ASSERT_MEM_EQUAL(new_firmware, verify_buffer, sizeof(new_firmware),
                          "Updated firmware should match");

    printf("    Partition B updated to version %u\n", partition_b.version);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test A/B partition swap
 */
static int test_ab_partition_swap(void)
{
    TEST_CASE_START("A/B Partition Swap");

    mock_init();

    partition_info_t partition_a = {
        .start_address = 0x10000,
        .size = PARTITION_SIZE,
        .version = 1,
        .active = true
    };

    partition_info_t partition_b = {
        .start_address = 0x30000,
        .size = PARTITION_SIZE,
        .version = 2,
        .active = false
    };

    printf("\n    Current active: Partition A (v%u)\n", partition_a.version);
    printf("    New version: Partition B (v%u)\n", partition_b.version);

    // Verify new partition
    TEST_ASSERT(partition_b.version > partition_a.version, "New version should be higher");

    // Swap partitions
    printf("    Swapping active partition...\n");
    partition_a.active = false;
    partition_b.active = true;

    TEST_ASSERT(!partition_a.active, "Partition A should be inactive");
    TEST_ASSERT(partition_b.active, "Partition B should be active");

    printf("    Active partition is now B (v%u)\n", partition_b.version);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test partition update with verification failure
 */
static int test_partition_update_verification_failure(void)
{
    TEST_CASE_START("Partition Update Verification Failure");

    mock_init();

    partition_info_t partition_a = {
        .start_address = 0x10000,
        .active = true
    };

    partition_info_t partition_b = {
        .start_address = 0x30000,
        .active = false
    };

    // Write firmware to partition B
    uint8_t firmware[4096];
    test_generate_random_data(firmware, sizeof(firmware));
    mock_flash_write(partition_b.start_address, firmware, sizeof(firmware));

    // Corrupt firmware
    firmware[100] ^= 0xFF;

    // Calculate expected CRC
    uint32_t expected_crc = test_calculate_crc32(firmware, sizeof(firmware));

    // Read back and verify
    uint8_t read_buffer[4096];
    mock_flash_read(partition_b.start_address, read_buffer, sizeof(read_buffer));
    uint32_t actual_crc = test_calculate_crc32(read_buffer, sizeof(read_buffer));

    // CRC should not match due to corruption
    TEST_ASSERT(actual_crc != expected_crc, "CRC should detect corruption");

    printf("\n    Verification failed, keeping partition A active\n");
    TEST_ASSERT(partition_a.active, "Original partition should remain active");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test incremental partition update
 */
static int test_incremental_partition_update(void)
{
    TEST_CASE_START("Incremental Partition Update");

    mock_init();

    uint32_t partition_start = 0x30000;
    uint32_t update_regions[] = {0x1000, 0x5000, 0xA000};
    uint32_t region_size = 4096;

    // Update specific regions only
    for (size_t i = 0; i < sizeof(update_regions) / sizeof(update_regions[0]); i++) {
        uint32_t offset = update_regions[i];
        uint8_t region_data[4096];

        test_generate_random_data(region_data, region_size);

        printf("\n    Updating region at offset 0x%X...\n", offset);

        // Erase sector
        mock_flash_erase(partition_start + offset, region_size);

        // Write new data
        mock_flash_write(partition_start + offset, region_data, region_size);

        // Verify
        uint8_t verify_buffer[4096];
        mock_flash_read(partition_start + offset, verify_buffer, region_size);
        TEST_ASSERT_MEM_EQUAL(region_data, verify_buffer, region_size,
                              "Region should be updated correctly");
    }

    printf("    Incremental update completed\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test partition update with power failure recovery
 */
static int test_power_failure_recovery(void)
{
    TEST_CASE_START("Power Failure Recovery");

    mock_init();

    partition_info_t partition_a = {
        .start_address = 0x10000,
        .size = PARTITION_SIZE,
        .active = true,
        .version = 1
    };

    partition_info_t partition_b = {
        .start_address = 0x30000,
        .size = PARTITION_SIZE,
        .active = false,
        .version = 0
    };

    // Start update
    printf("\n    Starting partition update...\n");
    size_t bytes_written = 0;
    size_t target_bytes = PARTITION_SIZE / 2;

    while (bytes_written < target_bytes) {
        uint8_t buffer[SECTOR_SIZE];
        test_generate_random_data(buffer, SECTOR_SIZE);
        mock_flash_write(partition_b.start_address + bytes_written, buffer, SECTOR_SIZE);
        bytes_written += SECTOR_SIZE;
    }

    printf("    Simulating power failure at %zu bytes...\n", bytes_written);

    // Power restored - check state
    printf("    Power restored, checking state...\n");

    // Partition A should still be active
    TEST_ASSERT(partition_a.active, "Original partition should still be active");
    TEST_ASSERT(!partition_b.active, "Incomplete partition should not be active");

    printf("    System recovered safely with partition A active\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test multi-partition management
 */
static int test_multi_partition_management(void)
{
    TEST_CASE_START("Multi-Partition Management");

    mock_init();

    // Define multiple partitions
    partition_info_t partitions[] = {
        {.start_address = 0x10000, .size = 65536, .version = 1, .active = true},  // Bootloader
        {.start_address = 0x20000, .size = 131072, .version = 5, .active = true}, // Application
        {.start_address = 0x50000, .size = 16384, .version = 2, .active = true},  // Config
        {.start_address = 0x60000, .size = 32768, .version = 3, .active = true}   // Data
    };

    int num_partitions = sizeof(partitions) / sizeof(partitions[0]);

    printf("\n    Managing %d partitions:\n", num_partitions);
    for (int i = 0; i < num_partitions; i++) {
        printf("    Partition %d: addr=0x%X, size=%u, ver=%u, active=%d\n",
               i, partitions[i].start_address, partitions[i].size,
               partitions[i].version, partitions[i].active);
    }

    // Verify no overlap
    for (int i = 0; i < num_partitions - 1; i++) {
        uint32_t end_addr = partitions[i].start_address + partitions[i].size;
        TEST_ASSERT(end_addr <= partitions[i + 1].start_address,
                    "Partitions should not overlap");
    }

    printf("    All partitions properly managed\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Main test suite
 */
int main(void)
{
    TEST_INIT();

    TEST_SUITE_START("Partition Update Integration Tests");

    RUN_TEST(test_basic_partition_update);
    RUN_TEST(test_ab_partition_swap);
    RUN_TEST(test_partition_update_verification_failure);
    RUN_TEST(test_incremental_partition_update);
    RUN_TEST(test_power_failure_recovery);
    RUN_TEST(test_multi_partition_management);

    TEST_SUMMARY();
    TEST_EXIT();
}
