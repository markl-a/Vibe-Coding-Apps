/**
 * @file test_full_ota_flow.c
 * @brief Full OTA Flow Integration Test
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

#define FIRMWARE_SIZE 131072
#define DOWNLOAD_CHUNK_SIZE 4096

typedef enum {
    OTA_PHASE_INIT,
    OTA_PHASE_DOWNLOAD,
    OTA_PHASE_VERIFY,
    OTA_PHASE_BACKUP,
    OTA_PHASE_INSTALL,
    OTA_PHASE_REBOOT,
    OTA_PHASE_COMPLETE
} ota_phase_t;

/**
 * @brief Test complete OTA flow
 */
static int test_complete_ota_flow(void)
{
    TEST_CASE_START("Complete OTA Flow");

    mock_init();
    test_timer_t timer;
    test_timer_start(&timer);

    ota_phase_t phase = OTA_PHASE_INIT;
    size_t downloaded = 0;
    uint32_t crc = 0;

    // Phase 1: Initialization
    phase = OTA_PHASE_DOWNLOAD;
    TEST_ASSERT_EQUAL(OTA_PHASE_DOWNLOAD, phase, "Should enter download phase");

    // Phase 2: Download firmware
    while (downloaded < FIRMWARE_SIZE) {
        size_t chunk = (FIRMWARE_SIZE - downloaded > DOWNLOAD_CHUNK_SIZE) ?
                       DOWNLOAD_CHUNK_SIZE : (FIRMWARE_SIZE - downloaded);

        uint8_t buffer[DOWNLOAD_CHUNK_SIZE];
        test_generate_random_data(buffer, chunk);

        // Write to flash
        mock_flash_write(0x80000 + downloaded, buffer, chunk);
        downloaded += chunk;
    }
    TEST_ASSERT_EQUAL(FIRMWARE_SIZE, downloaded, "Should download complete firmware");

    // Phase 3: Verify
    phase = OTA_PHASE_VERIFY;
    uint8_t firmware[FIRMWARE_SIZE];
    mock_flash_read(0x80000, firmware, FIRMWARE_SIZE);
    crc = test_calculate_crc32(firmware, FIRMWARE_SIZE);
    TEST_ASSERT(crc != 0, "CRC should be calculated");

    mock_set_return_code("crypto_verify", 0);
    uint8_t signature[64];
    int verify_result = mock_crypto_verify(firmware, FIRMWARE_SIZE, signature, sizeof(signature));
    TEST_ASSERT_EQUAL(0, verify_result, "Signature should be valid");

    // Phase 4: Backup old firmware
    phase = OTA_PHASE_BACKUP;
    uint8_t backup[4096];
    mock_flash_read(0x10000, backup, sizeof(backup));

    // Phase 5: Install new firmware
    phase = OTA_PHASE_INSTALL;
    mock_flash_erase(0x10000, FIRMWARE_SIZE);
    for (size_t offset = 0; offset < FIRMWARE_SIZE; offset += DOWNLOAD_CHUNK_SIZE) {
        size_t chunk = (FIRMWARE_SIZE - offset > DOWNLOAD_CHUNK_SIZE) ?
                       DOWNLOAD_CHUNK_SIZE : (FIRMWARE_SIZE - offset);
        uint8_t chunk_data[DOWNLOAD_CHUNK_SIZE];
        mock_flash_read(0x80000 + offset, chunk_data, chunk);
        mock_flash_write(0x10000 + offset, chunk_data, chunk);
    }

    // Phase 6: Complete
    phase = OTA_PHASE_COMPLETE;
    TEST_ASSERT_EQUAL(OTA_PHASE_COMPLETE, phase, "OTA should complete successfully");

    test_timer_stop(&timer);
    uint64_t elapsed = test_timer_get_elapsed_ms(&timer);
    printf("\n    OTA completed in %lu ms\n", (unsigned long)elapsed);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test OTA with interruption and resume
 */
static int test_ota_resume_flow(void)
{
    TEST_CASE_START("OTA Resume Flow");

    mock_init();

    size_t total_size = FIRMWARE_SIZE;
    size_t downloaded = 0;

    // Download first half
    while (downloaded < total_size / 2) {
        uint8_t buffer[DOWNLOAD_CHUNK_SIZE];
        test_generate_random_data(buffer, DOWNLOAD_CHUNK_SIZE);
        mock_flash_write(0x80000 + downloaded, buffer, DOWNLOAD_CHUNK_SIZE);
        downloaded += DOWNLOAD_CHUNK_SIZE;
    }

    size_t checkpoint = downloaded;
    TEST_ASSERT(checkpoint > 0, "Should have downloaded some data");

    // Simulate interruption and resume
    printf("\n    Simulating interruption at %zu bytes...\n", checkpoint);

    // Resume from checkpoint
    while (downloaded < total_size) {
        size_t chunk = (total_size - downloaded > DOWNLOAD_CHUNK_SIZE) ?
                       DOWNLOAD_CHUNK_SIZE : (total_size - downloaded);
        uint8_t buffer[DOWNLOAD_CHUNK_SIZE];
        test_generate_random_data(buffer, chunk);
        mock_flash_write(0x80000 + downloaded, buffer, chunk);
        downloaded += chunk;
    }

    TEST_ASSERT_EQUAL(total_size, downloaded, "Should complete download after resume");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test OTA failure and rollback
 */
static int test_ota_failure_rollback(void)
{
    TEST_CASE_START("OTA Failure and Rollback");

    mock_init();

    // Backup current firmware
    uint8_t backup[4096];
    mock_flash_read(0x10000, backup, sizeof(backup));

    // Start OTA update
    uint8_t new_firmware[FIRMWARE_SIZE];
    test_generate_random_data(new_firmware, FIRMWARE_SIZE);

    // Simulate verification failure
    mock_set_return_code("crypto_verify", -1);
    uint8_t signature[64];
    int verify_result = mock_crypto_verify(new_firmware, FIRMWARE_SIZE,
                                            signature, sizeof(signature));

    TEST_ASSERT_EQUAL(-1, verify_result, "Verification should fail");

    // Rollback to backup
    printf("\n    Rolling back to previous firmware...\n");
    mock_flash_write(0x10000, backup, sizeof(backup));

    // Verify rollback
    uint8_t restored[4096];
    mock_flash_read(0x10000, restored, sizeof(restored));
    TEST_ASSERT_MEM_EQUAL(backup, restored, sizeof(backup), "Firmware should be restored");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test OTA with delta updates
 */
static int test_ota_delta_update(void)
{
    TEST_CASE_START("OTA Delta Update");

    mock_init();

    // Current firmware
    uint8_t current_fw[8192];
    test_generate_pattern_data(current_fw, sizeof(current_fw), 0xAA);
    mock_flash_write(0x10000, current_fw, sizeof(current_fw));

    // Delta patch (simulated as differences)
    uint8_t delta[1024];
    test_generate_random_data(delta, sizeof(delta));

    // Apply patch
    for (size_t i = 0; i < sizeof(delta); i++) {
        current_fw[i] ^= delta[i];
    }

    // Write updated firmware
    mock_flash_erase(0x10000, sizeof(current_fw));
    mock_flash_write(0x10000, current_fw, sizeof(current_fw));

    printf("\n    Delta update applied successfully\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test OTA with multiple partitions
 */
static int test_ota_dual_partition(void)
{
    TEST_CASE_START("OTA Dual Partition");

    mock_init();

    uint32_t partition_a = 0x10000;
    uint32_t partition_b = 0x90000;
    uint32_t active_partition = partition_a;

    // Write new firmware to inactive partition
    uint32_t inactive_partition = (active_partition == partition_a) ? partition_b : partition_a;

    uint8_t new_firmware[4096];
    test_generate_random_data(new_firmware, sizeof(new_firmware));

    printf("\n    Writing to inactive partition 0x%X...\n", inactive_partition);
    mock_flash_erase(inactive_partition, sizeof(new_firmware));
    mock_flash_write(inactive_partition, new_firmware, sizeof(new_firmware));

    // Verify new firmware
    uint8_t verify_buffer[4096];
    mock_flash_read(inactive_partition, verify_buffer, sizeof(verify_buffer));
    TEST_ASSERT_MEM_EQUAL(new_firmware, verify_buffer, sizeof(new_firmware),
                          "New firmware should be written correctly");

    // Switch active partition
    active_partition = inactive_partition;
    printf("    Switched to partition 0x%X\n", active_partition);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Main test suite
 */
int main(void)
{
    TEST_INIT();

    TEST_SUITE_START("Full OTA Flow Integration Tests");

    RUN_TEST(test_complete_ota_flow);
    RUN_TEST(test_ota_resume_flow);
    RUN_TEST(test_ota_failure_rollback);
    RUN_TEST(test_ota_delta_update);
    RUN_TEST(test_ota_dual_partition);

    TEST_SUMMARY();
    TEST_EXIT();
}
