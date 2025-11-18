/**
 * @file test_rsa.c
 * @brief Unit tests for RSA signature module
 * @version 1.0
 * @date 2025-11-18
 */

#include "rsa_crypto.h"
#include <stdio.h>
#include <string.h>
#include <assert.h>

/* ============================================================================
 * Test Helper Functions
 * ========================================================================== */

static int test_count = 0;
static int test_passed = 0;
static int test_failed = 0;

#define TEST_START(name) \
    do { \
        printf("\n[TEST %d] %s\n", ++test_count, name); \
    } while(0)

#define TEST_ASSERT(condition, message) \
    do { \
        if (condition) { \
            printf("  [PASS] %s\n", message); \
            test_passed++; \
        } else { \
            printf("  [FAIL] %s\n", message); \
            test_failed++; \
        } \
    } while(0)

static void print_hex(const char *label, const uint8_t *data, size_t len)
{
    printf("%s: ", label);
    for (size_t i = 0; i < len && i < 32; i++) {
        printf("%02x", data[i]);
    }
    if (len > 32) {
        printf("...");
    }
    printf("\n");
}

/* ============================================================================
 * Test Cases
 * ========================================================================== */

/**
 * Test RSA key pair generation
 */
void test_key_generation(void)
{
    TEST_START("RSA Key Pair Generation");

    rsa_public_key_t pub_key;
    rsa_private_key_t priv_key;

    // Generate RSA-2048 key pair
    int ret = rsa_generate_keypair(&pub_key, &priv_key, RSA_KEY_2048, 65537);
    TEST_ASSERT(ret == RSA_OK, "Generate RSA-2048 key pair");

    TEST_ASSERT(pub_key.initialized, "Public key initialized");
    TEST_ASSERT(priv_key.initialized, "Private key initialized");

    TEST_ASSERT(pub_key.key_size == RSA_KEY_2048,
                "Public key size is 2048 bits");
    TEST_ASSERT(priv_key.key_size == RSA_KEY_2048,
                "Private key size is 2048 bits");

    print_hex("  Modulus (N)", pub_key.n, 32);
    print_hex("  Public Exp ", pub_key.e, pub_key.e_len);

    // Cleanup
    rsa_free_public_key(&pub_key);
    rsa_free_private_key(&priv_key);
}

/**
 * Test PKCS#1 v1.5 signature
 */
void test_pkcs1v15_signature(void)
{
    TEST_START("PKCS#1 v1.5 Signature");

    rsa_public_key_t pub_key;
    rsa_private_key_t priv_key;

    // Generate key pair
    int ret = rsa_generate_keypair(&pub_key, &priv_key, RSA_KEY_2048, 65537);
    TEST_ASSERT(ret == RSA_OK, "Generate key pair");

    // Test data
    const char *message = "This is a test message for RSA signature";
    uint8_t hash[32];
    size_t hash_len;

    // Compute hash
    ret = rsa_compute_hash(RSA_HASH_SHA256,
                          (const uint8_t *)message, strlen(message),
                          hash, &hash_len);
    TEST_ASSERT(ret == RSA_OK && hash_len == 32,
                "Compute SHA-256 hash");

    print_hex("  Hash      ", hash, hash_len);

    // Sign
    uint8_t signature[512];
    size_t sig_len;

    ret = rsa_sign_pkcs1v15(&priv_key, RSA_HASH_SHA256,
                           hash, hash_len, signature, &sig_len);
    TEST_ASSERT(ret == RSA_OK, "Sign with PKCS#1 v1.5");
    TEST_ASSERT(sig_len == 256, "Signature length is 256 bytes");

    print_hex("  Signature ", signature, sig_len);

    // Verify
    ret = rsa_verify_pkcs1v15(&pub_key, RSA_HASH_SHA256,
                             hash, hash_len, signature, sig_len);
    TEST_ASSERT(ret == RSA_OK, "Verify signature");

    // Test verification failure with wrong signature
    signature[0] ^= 0xFF;
    ret = rsa_verify_pkcs1v15(&pub_key, RSA_HASH_SHA256,
                             hash, hash_len, signature, sig_len);
    TEST_ASSERT(ret == RSA_ERR_VERIFICATION_FAILED,
                "Reject invalid signature");

    // Cleanup
    rsa_free_public_key(&pub_key);
    rsa_free_private_key(&priv_key);
}

/**
 * Test PSS signature
 */
void test_pss_signature(void)
{
    TEST_START("PSS Signature");

    rsa_public_key_t pub_key;
    rsa_private_key_t priv_key;

    // Generate key pair
    int ret = rsa_generate_keypair(&pub_key, &priv_key, RSA_KEY_2048, 65537);
    TEST_ASSERT(ret == RSA_OK, "Generate key pair");

    // Test data
    const char *message = "Test message for PSS signature";
    uint8_t hash[32];
    size_t hash_len;

    // Compute hash
    ret = rsa_compute_hash(RSA_HASH_SHA256,
                          (const uint8_t *)message, strlen(message),
                          hash, &hash_len);
    TEST_ASSERT(ret == RSA_OK, "Compute SHA-256 hash");

    // Sign with PSS
    uint8_t signature[512];
    size_t sig_len;

    ret = rsa_sign_pss(&priv_key, RSA_HASH_SHA256,
                      hash, hash_len, signature, &sig_len, 0);
    TEST_ASSERT(ret == RSA_OK, "Sign with PSS");

    print_hex("  PSS Sig   ", signature, sig_len);

    // Verify with PSS
    ret = rsa_verify_pss(&pub_key, RSA_HASH_SHA256,
                        hash, hash_len, signature, sig_len, 0);
    TEST_ASSERT(ret == RSA_OK, "Verify PSS signature");

    // Test verification failure
    signature[10] ^= 0xFF;
    ret = rsa_verify_pss(&pub_key, RSA_HASH_SHA256,
                        hash, hash_len, signature, sig_len, 0);
    TEST_ASSERT(ret == RSA_ERR_VERIFICATION_FAILED,
                "Reject tampered PSS signature");

    // Cleanup
    rsa_free_public_key(&pub_key);
    rsa_free_private_key(&priv_key);
}

/**
 * Test different hash algorithms
 */
void test_hash_algorithms(void)
{
    TEST_START("Hash Algorithms");

    rsa_public_key_t pub_key;
    rsa_private_key_t priv_key;

    // Generate key pair
    rsa_generate_keypair(&pub_key, &priv_key, RSA_KEY_2048, 65537);

    const char *message = "Test message";
    uint8_t signature[512];
    size_t sig_len;

    // Test SHA-256
    uint8_t hash256[32];
    size_t hash_len;
    rsa_compute_hash(RSA_HASH_SHA256, (const uint8_t *)message, strlen(message),
                    hash256, &hash_len);
    TEST_ASSERT(hash_len == 32, "SHA-256 hash length is 32 bytes");

    int ret = rsa_sign_pkcs1v15(&priv_key, RSA_HASH_SHA256,
                               hash256, hash_len, signature, &sig_len);
    TEST_ASSERT(ret == RSA_OK, "Sign with SHA-256");

    ret = rsa_verify_pkcs1v15(&pub_key, RSA_HASH_SHA256,
                             hash256, hash_len, signature, sig_len);
    TEST_ASSERT(ret == RSA_OK, "Verify SHA-256 signature");

    // Test SHA-384
    uint8_t hash384[48];
    rsa_compute_hash(RSA_HASH_SHA384, (const uint8_t *)message, strlen(message),
                    hash384, &hash_len);
    TEST_ASSERT(hash_len == 48, "SHA-384 hash length is 48 bytes");

    ret = rsa_sign_pkcs1v15(&priv_key, RSA_HASH_SHA384,
                           hash384, hash_len, signature, &sig_len);
    TEST_ASSERT(ret == RSA_OK, "Sign with SHA-384");

    ret = rsa_verify_pkcs1v15(&pub_key, RSA_HASH_SHA384,
                             hash384, hash_len, signature, sig_len);
    TEST_ASSERT(ret == RSA_OK, "Verify SHA-384 signature");

    // Test SHA-512
    uint8_t hash512[64];
    rsa_compute_hash(RSA_HASH_SHA512, (const uint8_t *)message, strlen(message),
                    hash512, &hash_len);
    TEST_ASSERT(hash_len == 64, "SHA-512 hash length is 64 bytes");

    ret = rsa_sign_pkcs1v15(&priv_key, RSA_HASH_SHA512,
                           hash512, hash_len, signature, &sig_len);
    TEST_ASSERT(ret == RSA_OK, "Sign with SHA-512");

    ret = rsa_verify_pkcs1v15(&pub_key, RSA_HASH_SHA512,
                             hash512, hash_len, signature, sig_len);
    TEST_ASSERT(ret == RSA_OK, "Verify SHA-512 signature");

    // Cleanup
    rsa_free_public_key(&pub_key);
    rsa_free_private_key(&priv_key);
}

/**
 * Test firmware signature (typical use case)
 */
void test_firmware_signature(void)
{
    TEST_START("Firmware Signature Verification");

    rsa_public_key_t pub_key;
    rsa_private_key_t priv_key;

    // Generate key pair
    rsa_generate_keypair(&pub_key, &priv_key, RSA_KEY_2048, 65537);

    // Simulate firmware data
    uint8_t firmware[1024];
    for (int i = 0; i < 1024; i++) {
        firmware[i] = (uint8_t)i;
    }

    printf("  Firmware Size: 1024 bytes\n");

    // Compute firmware hash
    uint8_t hash[32];
    size_t hash_len;
    rsa_compute_hash(RSA_HASH_SHA256, firmware, 1024, hash, &hash_len);

    print_hex("  FW Hash   ", hash, hash_len);

    // Sign firmware
    uint8_t signature[512];
    size_t sig_len;
    int ret = rsa_sign_pkcs1v15(&priv_key, RSA_HASH_SHA256,
                               hash, hash_len, signature, &sig_len);
    TEST_ASSERT(ret == RSA_OK, "Sign firmware");

    // Verify firmware signature
    ret = rsa_verify_pkcs1v15(&pub_key, RSA_HASH_SHA256,
                             hash, hash_len, signature, sig_len);
    TEST_ASSERT(ret == RSA_OK, "Verify firmware signature");

    // Test tampering detection
    firmware[500] ^= 0xFF; // Tamper with firmware
    rsa_compute_hash(RSA_HASH_SHA256, firmware, 1024, hash, &hash_len);

    ret = rsa_verify_pkcs1v15(&pub_key, RSA_HASH_SHA256,
                             hash, hash_len, signature, sig_len);
    TEST_ASSERT(ret == RSA_ERR_VERIFICATION_FAILED,
                "Detect tampered firmware");

    // Cleanup
    rsa_free_public_key(&pub_key);
    rsa_free_private_key(&priv_key);
}

/**
 * Test utility functions
 */
void test_utility_functions(void)
{
    TEST_START("Utility Functions");

    // Test hash length
    size_t len = rsa_get_hash_length(RSA_HASH_SHA256);
    TEST_ASSERT(len == 32, "SHA-256 hash length");

    len = rsa_get_hash_length(RSA_HASH_SHA384);
    TEST_ASSERT(len == 48, "SHA-384 hash length");

    len = rsa_get_hash_length(RSA_HASH_SHA512);
    TEST_ASSERT(len == 64, "SHA-512 hash length");

    // Test signature length
    len = rsa_get_signature_length(RSA_KEY_2048);
    TEST_ASSERT(len == 256, "RSA-2048 signature length");

    len = rsa_get_signature_length(RSA_KEY_4096);
    TEST_ASSERT(len == 512, "RSA-4096 signature length");

    // Test secure memzero
    uint8_t buffer[64];
    memset(buffer, 0xAA, 64);
    rsa_secure_memzero(buffer, 64);

    bool all_zero = true;
    for (int i = 0; i < 64; i++) {
        if (buffer[i] != 0) {
            all_zero = false;
            break;
        }
    }
    TEST_ASSERT(all_zero, "Secure memory zeroing");

    // Test error strings
    const char *err_str = rsa_get_error_string(RSA_ERR_VERIFICATION_FAILED);
    TEST_ASSERT(strcmp(err_str, "Verification failed") == 0,
                "Get error string");
}

/**
 * Test error handling
 */
void test_error_handling(void)
{
    TEST_START("Error Handling");

    rsa_public_key_t pub_key;
    rsa_private_key_t priv_key;

    // Test NULL parameters
    int ret = rsa_generate_keypair(NULL, &priv_key, RSA_KEY_2048, 65537);
    TEST_ASSERT(ret == RSA_ERR_INVALID_PARAM,
                "Reject NULL public key");

    ret = rsa_generate_keypair(&pub_key, NULL, RSA_KEY_2048, 65537);
    TEST_ASSERT(ret == RSA_ERR_INVALID_PARAM,
                "Reject NULL private key");

    // Test uninitialized key
    memset(&pub_key, 0, sizeof(pub_key));
    uint8_t hash[32] = {0};
    uint8_t signature[512];
    size_t sig_len = 512;

    ret = rsa_verify_pkcs1v15(&pub_key, RSA_HASH_SHA256,
                             hash, 32, signature, sig_len);
    TEST_ASSERT(ret == RSA_ERR_NOT_INITIALIZED,
                "Reject uninitialized key");
}

/**
 * Performance benchmark test
 */
void test_performance(void)
{
    TEST_START("Performance Benchmark");

    printf("\n  Running performance tests (this may take a while)...\n");

    // Benchmark RSA-2048 PKCS#1 v1.5 signing
    uint32_t ops = rsa_benchmark_sign(RSA_KEY_2048, RSA_PADDING_PKCS1_V15,
                                     RSA_HASH_SHA256, 10);
    printf("  RSA-2048 PKCS#1 Sign: %u ops/sec\n", ops);
    TEST_ASSERT(ops > 0, "RSA-2048 signing benchmark");

    // Benchmark RSA-2048 PKCS#1 v1.5 verification
    ops = rsa_benchmark_verify(RSA_KEY_2048, RSA_PADDING_PKCS1_V15,
                              RSA_HASH_SHA256, 100);
    printf("  RSA-2048 PKCS#1 Verify: %u ops/sec\n", ops);
    TEST_ASSERT(ops > 0, "RSA-2048 verification benchmark");

    // Benchmark RSA-2048 PSS signing
    ops = rsa_benchmark_sign(RSA_KEY_2048, RSA_PADDING_PSS,
                            RSA_HASH_SHA256, 10);
    printf("  RSA-2048 PSS Sign: %u ops/sec\n", ops);
    TEST_ASSERT(ops > 0, "RSA-2048 PSS signing benchmark");
}

/* ============================================================================
 * Main Test Runner
 * ========================================================================== */

int main(void)
{
    printf("========================================\n");
    printf("RSA Crypto Module - Unit Tests\n");
    printf("========================================\n");

    test_key_generation();
    test_pkcs1v15_signature();
    test_pss_signature();
    test_hash_algorithms();
    test_firmware_signature();
    test_utility_functions();
    test_error_handling();
    test_performance();

    printf("\n========================================\n");
    printf("Test Summary\n");
    printf("========================================\n");
    printf("Total Tests: %d\n", test_count);
    printf("Passed:      %d\n", test_passed);
    printf("Failed:      %d\n", test_failed);
    printf("========================================\n");

    if (test_failed == 0) {
        printf("\nAll tests PASSED!\n\n");
        return 0;
    } else {
        printf("\nSome tests FAILED!\n\n");
        return 1;
    }
}
