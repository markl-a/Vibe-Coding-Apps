/**
 * @file test_flash.c
 * @brief Flash Memory Operations Unit Tests
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

#define FLASH_PAGE_SIZE 4096
#define FLASH_SECTOR_SIZE 65536

/**
 * @brief Test flash read operation
 */
static int test_flash_read(void)
{
    TEST_CASE_START("Flash Read");

    mock_init();

    uint8_t test_data[256];
    uint8_t read_buffer[256];

    test_generate_random_data(test_data, sizeof(test_data));

    // Write test data to flash
    int write_result = mock_flash_write(0x1000, test_data, sizeof(test_data));
    TEST_ASSERT_EQUAL(0, write_result, "Flash write should succeed");

    // Read back
    int read_result = mock_flash_read(0x1000, read_buffer, sizeof(read_buffer));
    TEST_ASSERT_EQUAL(0, read_result, "Flash read should succeed");

    // Verify data
    TEST_ASSERT_MEM_EQUAL(test_data, read_buffer, sizeof(test_data), "Read data should match written data");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test flash write operation
 */
static int test_flash_write(void)
{
    TEST_CASE_START("Flash Write");

    mock_init();

    uint8_t test_data[128];
    test_generate_incremental_data(test_data, sizeof(test_data));

    int result = mock_flash_write(0x2000, test_data, sizeof(test_data));

    TEST_ASSERT_EQUAL(0, result, "Flash write should succeed");
    TEST_ASSERT_EQUAL(1, mock_get_call_count("flash_write"), "flash_write should be called once");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test flash erase operation
 */
static int test_flash_erase(void)
{
    TEST_CASE_START("Flash Erase");

    mock_init();

    uint8_t test_data[FLASH_PAGE_SIZE];
    uint8_t verify_buffer[FLASH_PAGE_SIZE];

    // Write data
    test_generate_pattern_data(test_data, sizeof(test_data), 0xAA);
    mock_flash_write(0x0, test_data, sizeof(test_data));

    // Erase
    int erase_result = mock_flash_erase(0x0, FLASH_PAGE_SIZE);
    TEST_ASSERT_EQUAL(0, erase_result, "Flash erase should succeed");

    // Verify erased (should be 0xFF)
    mock_flash_read(0x0, verify_buffer, sizeof(verify_buffer));

    bool all_erased = true;
    for (size_t i = 0; i < sizeof(verify_buffer); i++) {
        if (verify_buffer[i] != 0xFF) {
            all_erased = false;
            break;
        }
    }

    TEST_ASSERT(all_erased, "Flash should be erased to 0xFF");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test flash page boundary
 */
static int test_flash_page_boundary(void)
{
    TEST_CASE_START("Flash Page Boundary");

    mock_init();

    // Test write crossing page boundary
    uint8_t large_data[FLASH_PAGE_SIZE * 2];
    test_generate_incremental_data(large_data, sizeof(large_data));

    int result = mock_flash_write(0x0, large_data, sizeof(large_data));
    TEST_ASSERT_EQUAL(0, result, "Write across pages should succeed");

    // Verify
    uint8_t verify_buffer[FLASH_PAGE_SIZE * 2];
    mock_flash_read(0x0, verify_buffer, sizeof(verify_buffer));

    TEST_ASSERT_MEM_EQUAL(large_data, verify_buffer, sizeof(large_data),
                          "Data across pages should be correct");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test flash alignment
 */
static int test_flash_alignment(void)
{
    TEST_CASE_START("Flash Alignment");

    mock_init();

    uint8_t test_data[64];
    test_generate_random_data(test_data, sizeof(test_data));

    // Test aligned write
    int aligned_result = mock_flash_write(0x1000, test_data, sizeof(test_data));
    TEST_ASSERT_EQUAL(0, aligned_result, "Aligned write should succeed");

    // Test unaligned write (still should work in this mock)
    int unaligned_result = mock_flash_write(0x1001, test_data, sizeof(test_data));
    TEST_ASSERT_EQUAL(0, unaligned_result, "Unaligned write should succeed");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test flash bounds checking
 */
static int test_flash_bounds(void)
{
    TEST_CASE_START("Flash Bounds Checking");

    mock_init();

    uint8_t test_data[256];
    test_generate_random_data(test_data, sizeof(test_data));

    // Try to write beyond flash size
    uint32_t invalid_address = 0xFFFFFFFF;
    int result = mock_flash_write(invalid_address, test_data, sizeof(test_data));

    TEST_ASSERT_EQUAL(-1, result, "Out of bounds write should fail");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test flash wear leveling simulation
 */
static int test_flash_wear_leveling(void)
{
    TEST_CASE_START("Flash Wear Leveling");

    mock_init();

    uint8_t test_data[256];

    // Simulate multiple writes to same location
    for (int i = 0; i < 10; i++) {
        test_generate_random_data(test_data, sizeof(test_data));

        // Erase before write
        mock_flash_erase(0x10000, FLASH_PAGE_SIZE);

        // Write
        int result = mock_flash_write(0x10000, test_data, sizeof(test_data));
        TEST_ASSERT_EQUAL(0, result, "Repeated write should succeed");
    }

    TEST_ASSERT_EQUAL(10, mock_get_call_count("flash_write"),
                      "Should have 10 write operations");
    TEST_ASSERT_EQUAL(10, mock_get_call_count("flash_erase"),
                      "Should have 10 erase operations");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Main test suite
 */
int main(void)
{
    TEST_INIT();

    TEST_SUITE_START("Flash Memory Tests");

    RUN_TEST(test_flash_read);
    RUN_TEST(test_flash_write);
    RUN_TEST(test_flash_erase);
    RUN_TEST(test_flash_page_boundary);
    RUN_TEST(test_flash_alignment);
    RUN_TEST(test_flash_bounds);
    RUN_TEST(test_flash_wear_leveling);

    TEST_SUMMARY();
    TEST_EXIT();
}
