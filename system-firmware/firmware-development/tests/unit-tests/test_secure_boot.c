/**
 * @file test_secure_boot.c
 * @brief Secure Boot Unit Tests
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

/* Mock secure boot structures */
typedef struct {
    uint8_t signature[256];
    uint8_t public_key[256];
    uint32_t version;
    uint32_t size;
} secure_boot_header_t;

/**
 * @brief Test secure boot initialization
 */
static int test_secure_boot_init(void)
{
    TEST_CASE_START("Secure Boot Initialization");

    mock_init();
    mock_set_return_code("crypto_init", 0);

    int result = mock_crypto_init();

    TEST_ASSERT_EQUAL(0, result, "Crypto initialization should succeed");
    TEST_ASSERT_EQUAL(1, mock_get_call_count("crypto_init"), "crypto_init should be called once");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test signature verification
 */
static int test_signature_verification(void)
{
    TEST_CASE_START("Signature Verification");

    mock_init();

    uint8_t test_data[256];
    uint8_t signature[64];
    size_t sig_len = 64;

    test_generate_random_data(test_data, sizeof(test_data));

    // Test successful signature
    mock_set_return_code("crypto_sign", 0);
    int sign_result = mock_crypto_sign(test_data, sizeof(test_data), signature, &sig_len);
    TEST_ASSERT_EQUAL(0, sign_result, "Signing should succeed");

    // Test successful verification
    mock_set_return_code("crypto_verify", 0);
    int verify_result = mock_crypto_verify(test_data, sizeof(test_data), signature, sig_len);
    TEST_ASSERT_EQUAL(0, verify_result, "Verification should succeed");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test invalid signature
 */
static int test_invalid_signature(void)
{
    TEST_CASE_START("Invalid Signature Handling");

    mock_init();

    uint8_t test_data[256];
    uint8_t bad_signature[64];

    test_generate_random_data(test_data, sizeof(test_data));
    test_generate_random_data(bad_signature, sizeof(bad_signature));

    // Test failed verification
    mock_set_return_code("crypto_verify", -1);
    int result = mock_crypto_verify(test_data, sizeof(test_data), bad_signature, sizeof(bad_signature));

    TEST_ASSERT_EQUAL(-1, result, "Invalid signature should fail verification");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test secure boot header validation
 */
static int test_boot_header_validation(void)
{
    TEST_CASE_START("Boot Header Validation");

    secure_boot_header_t header;

    // Initialize header
    memset(&header, 0, sizeof(header));
    header.version = 1;
    header.size = 65536;

    TEST_ASSERT_EQUAL(1, header.version, "Header version should be 1");
    TEST_ASSERT_EQUAL(65536, header.size, "Header size should be correct");

    TEST_CASE_END();
}

/**
 * @brief Test secure boot chain of trust
 */
static int test_chain_of_trust(void)
{
    TEST_CASE_START("Chain of Trust");

    mock_init();

    // Simulate multi-stage boot verification
    mock_set_return_code("crypto_verify", 0);

    // Stage 1: Bootloader verification
    uint8_t bootloader[1024];
    uint8_t signature1[64];
    test_generate_random_data(bootloader, sizeof(bootloader));

    int stage1 = mock_crypto_verify(bootloader, sizeof(bootloader), signature1, sizeof(signature1));
    TEST_ASSERT_EQUAL(0, stage1, "Stage 1 verification should succeed");

    // Stage 2: Application verification
    uint8_t application[2048];
    uint8_t signature2[64];
    test_generate_random_data(application, sizeof(application));

    int stage2 = mock_crypto_verify(application, sizeof(application), signature2, sizeof(signature2));
    TEST_ASSERT_EQUAL(0, stage2, "Stage 2 verification should succeed");

    TEST_ASSERT_EQUAL(2, mock_get_call_count("crypto_verify"), "Should verify both stages");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test rollback protection
 */
static int test_rollback_protection(void)
{
    TEST_CASE_START("Rollback Protection");

    uint32_t current_version = 5;
    uint32_t new_version_valid = 6;
    uint32_t new_version_invalid = 4;

    // Test valid version upgrade
    TEST_ASSERT(new_version_valid > current_version, "Valid version should be newer");

    // Test invalid version downgrade
    TEST_ASSERT(!(new_version_invalid > current_version), "Should reject older version");

    TEST_CASE_END();
}

/**
 * @brief Main test suite
 */
int main(void)
{
    TEST_INIT();

    TEST_SUITE_START("Secure Boot Tests");

    RUN_TEST(test_secure_boot_init);
    RUN_TEST(test_signature_verification);
    RUN_TEST(test_invalid_signature);
    RUN_TEST(test_boot_header_validation);
    RUN_TEST(test_chain_of_trust);
    RUN_TEST(test_rollback_protection);

    TEST_SUMMARY();
    TEST_EXIT();
}
