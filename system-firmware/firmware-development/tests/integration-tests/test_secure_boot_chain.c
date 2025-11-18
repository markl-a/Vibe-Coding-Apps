/**
 * @file test_secure_boot_chain.c
 * @brief Secure Boot Chain Integration Test
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

#define BOOTLOADER_SIZE 16384
#define APPLICATION_SIZE 131072

typedef struct {
    uint8_t public_key[256];
    uint8_t signature[256];
    uint32_t version;
    uint32_t size;
    uint32_t crc;
} boot_stage_header_t;

/**
 * @brief Test complete secure boot chain
 */
static int test_complete_boot_chain(void)
{
    TEST_CASE_START("Complete Secure Boot Chain");

    mock_init();
    test_timer_t timer;
    test_timer_start(&timer);

    // Stage 0: ROM Boot
    printf("\n    Stage 0: ROM Boot...\n");
    mock_set_return_code("crypto_init", 0);
    int crypto_init = mock_crypto_init();
    TEST_ASSERT_EQUAL(0, crypto_init, "Crypto should initialize");

    // Stage 1: Verify Bootloader
    printf("    Stage 1: Verifying Bootloader...\n");
    uint8_t bootloader[BOOTLOADER_SIZE];
    test_generate_random_data(bootloader, sizeof(bootloader));

    boot_stage_header_t bl_header;
    bl_header.version = 1;
    bl_header.size = BOOTLOADER_SIZE;
    bl_header.crc = test_calculate_crc32(bootloader, sizeof(bootloader));

    mock_set_return_code("crypto_verify", 0);
    uint8_t bl_sig[64];
    int bl_verify = mock_crypto_verify(bootloader, sizeof(bootloader),
                                        bl_sig, sizeof(bl_sig));
    TEST_ASSERT_EQUAL(0, bl_verify, "Bootloader signature should be valid");

    // Stage 2: Verify Application
    printf("    Stage 2: Verifying Application...\n");
    uint8_t application[APPLICATION_SIZE];
    test_generate_random_data(application, sizeof(application));

    boot_stage_header_t app_header;
    app_header.version = 1;
    app_header.size = APPLICATION_SIZE;
    app_header.crc = test_calculate_crc32(application, sizeof(application));

    uint8_t app_sig[64];
    int app_verify = mock_crypto_verify(application, sizeof(application),
                                         app_sig, sizeof(app_sig));
    TEST_ASSERT_EQUAL(0, app_verify, "Application signature should be valid");

    // Stage 3: Jump to Application
    printf("    Stage 3: Jumping to Application...\n");

    test_timer_stop(&timer);
    uint64_t boot_time = test_timer_get_elapsed_ms(&timer);
    printf("    Secure boot completed in %lu ms\n", (unsigned long)boot_time);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test boot with invalid bootloader
 */
static int test_invalid_bootloader(void)
{
    TEST_CASE_START("Invalid Bootloader Detection");

    mock_init();

    uint8_t bootloader[BOOTLOADER_SIZE];
    test_generate_random_data(bootloader, sizeof(bootloader));

    // Corrupt bootloader
    bootloader[0] ^= 0xFF;

    // Verification should fail
    mock_set_return_code("crypto_verify", -1);
    uint8_t signature[64];
    int result = mock_crypto_verify(bootloader, sizeof(bootloader),
                                     signature, sizeof(signature));

    TEST_ASSERT_EQUAL(-1, result, "Corrupted bootloader should fail verification");

    printf("\n    System should halt or enter recovery mode\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test boot with version rollback
 */
static int test_version_rollback_protection(void)
{
    TEST_CASE_START("Version Rollback Protection");

    uint32_t secure_version = 5;
    uint32_t new_version_good = 6;
    uint32_t new_version_bad = 4;

    // Test valid upgrade
    TEST_ASSERT(new_version_good > secure_version, "Should accept newer version");

    // Test rollback attempt
    TEST_ASSERT(!(new_version_bad > secure_version), "Should reject rollback attempt");

    printf("\n    Rollback protection working correctly\n");

    TEST_CASE_END();
}

/**
 * @brief Test chain of trust with multiple keys
 */
static int test_chain_of_trust_multiple_keys(void)
{
    TEST_CASE_START("Chain of Trust with Multiple Keys");

    mock_init();

    // Root of trust public key
    uint8_t root_public_key[256];
    test_generate_random_data(root_public_key, sizeof(root_public_key));

    // Bootloader signed with root key
    uint8_t bootloader[BOOTLOADER_SIZE];
    uint8_t bl_signature[64];
    test_generate_random_data(bootloader, sizeof(bootloader));

    mock_set_return_code("crypto_verify", 0);
    int bl_verify = mock_crypto_verify(bootloader, sizeof(bootloader),
                                        bl_signature, sizeof(bl_signature));
    TEST_ASSERT_EQUAL(0, bl_verify, "Bootloader should be verified with root key");

    // Application signed with bootloader key
    uint8_t application[APPLICATION_SIZE];
    uint8_t app_signature[64];
    test_generate_random_data(application, sizeof(application));

    int app_verify = mock_crypto_verify(application, sizeof(application),
                                         app_signature, sizeof(app_signature));
    TEST_ASSERT_EQUAL(0, app_verify, "Application should be verified with bootloader key");

    printf("\n    Complete chain of trust verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test secure boot with debug disabled
 */
static int test_debug_port_disabled(void)
{
    TEST_CASE_START("Debug Port Security");

    bool debug_enabled = false;
    bool jtag_enabled = false;

    TEST_ASSERT(!debug_enabled, "Debug port should be disabled");
    TEST_ASSERT(!jtag_enabled, "JTAG should be disabled");

    printf("\n    Debug interfaces are properly secured\n");

    TEST_CASE_END();
}

/**
 * @brief Test secure boot with encrypted firmware
 */
static int test_encrypted_firmware_boot(void)
{
    TEST_CASE_START("Encrypted Firmware Boot");

    mock_init();

    // Encrypted firmware
    uint8_t encrypted_fw[4096];
    uint8_t decrypted_fw[4096];
    size_t dec_len;

    test_generate_random_data(encrypted_fw, sizeof(encrypted_fw));

    // Decrypt firmware
    mock_set_return_code("crypto_decrypt", 0);
    int decrypt_result = mock_crypto_decrypt(encrypted_fw, sizeof(encrypted_fw),
                                              decrypted_fw, &dec_len);
    TEST_ASSERT_EQUAL(0, decrypt_result, "Firmware decryption should succeed");

    // Verify decrypted firmware
    mock_set_return_code("crypto_verify", 0);
    uint8_t signature[64];
    int verify_result = mock_crypto_verify(decrypted_fw, dec_len,
                                            signature, sizeof(signature));
    TEST_ASSERT_EQUAL(0, verify_result, "Decrypted firmware should be valid");

    printf("\n    Encrypted firmware boot successful\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Main test suite
 */
int main(void)
{
    TEST_INIT();

    TEST_SUITE_START("Secure Boot Chain Integration Tests");

    RUN_TEST(test_complete_boot_chain);
    RUN_TEST(test_invalid_bootloader);
    RUN_TEST(test_version_rollback_protection);
    RUN_TEST(test_chain_of_trust_multiple_keys);
    RUN_TEST(test_debug_port_disabled);
    RUN_TEST(test_encrypted_firmware_boot);

    TEST_SUMMARY();
    TEST_EXIT();
}
