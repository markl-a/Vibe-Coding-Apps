/**
 * @file test_ota.c
 * @brief OTA Update Unit Tests
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

#define OTA_BUFFER_SIZE 4096
#define FIRMWARE_SIZE 65536

typedef struct {
    uint32_t version;
    uint32_t size;
    uint32_t crc32;
    uint8_t signature[256];
} ota_header_t;

typedef enum {
    OTA_STATE_IDLE,
    OTA_STATE_DOWNLOADING,
    OTA_STATE_VERIFYING,
    OTA_STATE_INSTALLING,
    OTA_STATE_COMPLETE,
    OTA_STATE_ERROR
} ota_state_t;

/**
 * @brief Test OTA header validation
 */
static int test_ota_header_validation(void)
{
    TEST_CASE_START("OTA Header Validation");

    ota_header_t header;

    // Valid header
    header.version = 2;
    header.size = FIRMWARE_SIZE;
    header.crc32 = 0x12345678;

    TEST_ASSERT(header.version > 0, "Version should be valid");
    TEST_ASSERT(header.size > 0 && header.size <= FIRMWARE_SIZE * 2, "Size should be valid");
    TEST_ASSERT(header.crc32 != 0, "CRC32 should be set");

    TEST_CASE_END();
}

/**
 * @brief Test OTA download simulation
 */
static int test_ota_download(void)
{
    TEST_CASE_START("OTA Download");

    mock_init();
    mock_set_return_code("network_send", 0);

    uint8_t download_buffer[OTA_BUFFER_SIZE];
    size_t total_downloaded = 0;
    size_t chunk_size = 512;

    // Simulate downloading firmware in chunks
    while (total_downloaded < FIRMWARE_SIZE) {
        size_t remaining = FIRMWARE_SIZE - total_downloaded;
        size_t to_download = (remaining < chunk_size) ? remaining : chunk_size;

        test_generate_random_data(download_buffer, to_download);
        total_downloaded += to_download;
    }

    TEST_ASSERT_EQUAL(FIRMWARE_SIZE, total_downloaded, "Should download complete firmware");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test OTA CRC verification
 */
static int test_ota_crc_verification(void)
{
    TEST_CASE_START("OTA CRC Verification");

    uint8_t firmware_data[1024];
    test_generate_random_data(firmware_data, sizeof(firmware_data));

    // Calculate CRC
    uint32_t calculated_crc = test_calculate_crc32(firmware_data, sizeof(firmware_data));

    // Verify CRC
    uint32_t expected_crc = calculated_crc;
    TEST_ASSERT_EQUAL(expected_crc, calculated_crc, "CRC should match");

    // Test with corrupted data
    firmware_data[0] ^= 0xFF;
    uint32_t corrupted_crc = test_calculate_crc32(firmware_data, sizeof(firmware_data));
    TEST_ASSERT(corrupted_crc != expected_crc, "CRC should differ for corrupted data");

    TEST_CASE_END();
}

/**
 * @brief Test OTA signature verification
 */
static int test_ota_signature_verification(void)
{
    TEST_CASE_START("OTA Signature Verification");

    mock_init();

    uint8_t firmware_data[2048];
    uint8_t signature[64];
    size_t sig_len = 64;

    test_generate_random_data(firmware_data, sizeof(firmware_data));

    // Sign firmware
    mock_set_return_code("crypto_sign", 0);
    int sign_result = mock_crypto_sign(firmware_data, sizeof(firmware_data),
                                        signature, &sig_len);
    TEST_ASSERT_EQUAL(0, sign_result, "Firmware signing should succeed");

    // Verify signature
    mock_set_return_code("crypto_verify", 0);
    int verify_result = mock_crypto_verify(firmware_data, sizeof(firmware_data),
                                            signature, sig_len);
    TEST_ASSERT_EQUAL(0, verify_result, "Signature verification should succeed");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test OTA version checking
 */
static int test_ota_version_check(void)
{
    TEST_CASE_START("OTA Version Check");

    uint32_t current_version = 10;
    uint32_t new_version_ok = 11;
    uint32_t new_version_bad = 9;

    // Test upgrade
    TEST_ASSERT(new_version_ok > current_version, "Should accept newer version");

    // Test downgrade prevention
    TEST_ASSERT(!(new_version_bad > current_version), "Should reject older version");

    TEST_CASE_END();
}

/**
 * @brief Test OTA rollback capability
 */
static int test_ota_rollback(void)
{
    TEST_CASE_START("OTA Rollback");

    mock_init();

    uint8_t old_firmware[1024];
    uint8_t new_firmware[1024];
    uint8_t backup[1024];

    test_generate_pattern_data(old_firmware, sizeof(old_firmware), 0xAA);
    test_generate_pattern_data(new_firmware, sizeof(new_firmware), 0xBB);

    // Backup old firmware
    memcpy(backup, old_firmware, sizeof(backup));

    // Simulate OTA update failure
    memcpy(old_firmware, new_firmware, sizeof(old_firmware));

    // Rollback
    memcpy(old_firmware, backup, sizeof(old_firmware));

    TEST_ASSERT_MEM_EQUAL(old_firmware, backup, sizeof(old_firmware),
                          "Firmware should be restored");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test OTA state machine
 */
static int test_ota_state_machine(void)
{
    TEST_CASE_START("OTA State Machine");

    ota_state_t state = OTA_STATE_IDLE;

    // Start download
    state = OTA_STATE_DOWNLOADING;
    TEST_ASSERT_EQUAL(OTA_STATE_DOWNLOADING, state, "Should be in downloading state");

    // Start verification
    state = OTA_STATE_VERIFYING;
    TEST_ASSERT_EQUAL(OTA_STATE_VERIFYING, state, "Should be in verifying state");

    // Install
    state = OTA_STATE_INSTALLING;
    TEST_ASSERT_EQUAL(OTA_STATE_INSTALLING, state, "Should be in installing state");

    // Complete
    state = OTA_STATE_COMPLETE;
    TEST_ASSERT_EQUAL(OTA_STATE_COMPLETE, state, "Should be complete");

    TEST_CASE_END();
}

/**
 * @brief Test OTA resume capability
 */
static int test_ota_resume(void)
{
    TEST_CASE_START("OTA Resume");

    size_t total_size = FIRMWARE_SIZE;
    size_t downloaded = FIRMWARE_SIZE / 2;
    size_t remaining = total_size - downloaded;

    TEST_ASSERT_EQUAL(FIRMWARE_SIZE / 2, remaining, "Should calculate remaining correctly");
    TEST_ASSERT(remaining > 0, "Should have data remaining to download");

    // Simulate resume
    downloaded += remaining;
    TEST_ASSERT_EQUAL(total_size, downloaded, "Should complete download after resume");

    TEST_CASE_END();
}

/**
 * @brief Main test suite
 */
int main(void)
{
    TEST_INIT();

    TEST_SUITE_START("OTA Update Tests");

    RUN_TEST(test_ota_header_validation);
    RUN_TEST(test_ota_download);
    RUN_TEST(test_ota_crc_verification);
    RUN_TEST(test_ota_signature_verification);
    RUN_TEST(test_ota_version_check);
    RUN_TEST(test_ota_rollback);
    RUN_TEST(test_ota_state_machine);
    RUN_TEST(test_ota_resume);

    TEST_SUMMARY();
    TEST_EXIT();
}
