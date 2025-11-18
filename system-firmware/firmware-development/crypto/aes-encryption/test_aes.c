/**
 * @file test_aes.c
 * @brief Unit tests for AES encryption module
 * @version 1.0
 * @date 2025-11-18
 */

#include "aes_crypto.h"
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
    for (size_t i = 0; i < len; i++) {
        printf("%02x", data[i]);
    }
    printf("\n");
}

/* ============================================================================
 * Test Cases
 * ========================================================================== */

/**
 * Test AES-128 ECB mode encryption/decryption
 */
void test_aes_128_ecb(void)
{
    TEST_START("AES-128 ECB Mode");

    aes_context_t ctx;
    uint8_t key[16] = {
        0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
        0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c
    };
    uint8_t plaintext[16] = {
        0x6b, 0xc1, 0xbe, 0xe2, 0x2e, 0x40, 0x9f, 0x96,
        0xe9, 0x3d, 0x7e, 0x11, 0x73, 0x93, 0x17, 0x2a
    };
    uint8_t expected_ciphertext[16] = {
        0x3a, 0xd7, 0x7b, 0xb4, 0x0d, 0x7a, 0x36, 0x60,
        0xa8, 0x9e, 0xca, 0xf3, 0x24, 0x66, 0xef, 0x97
    };
    uint8_t ciphertext[16];
    uint8_t decrypted[16];

    // Initialize
    int ret = aes_init(&ctx, AES_KEY_128, AES_MODE_ECB);
    TEST_ASSERT(ret == AES_OK, "Initialize AES-128 ECB context");

    // Set key
    ret = aes_set_key(&ctx, key, 16);
    TEST_ASSERT(ret == AES_OK, "Set encryption key");

    // Encrypt
    ret = aes_encrypt(&ctx, plaintext, ciphertext, 16);
    TEST_ASSERT(ret == AES_OK, "Encrypt data");

    print_hex("  Plaintext ", plaintext, 16);
    print_hex("  Ciphertext", ciphertext, 16);
    print_hex("  Expected  ", expected_ciphertext, 16);

    TEST_ASSERT(memcmp(ciphertext, expected_ciphertext, 16) == 0,
                "Ciphertext matches expected value");

    // Decrypt
    ret = aes_decrypt(&ctx, ciphertext, decrypted, 16);
    TEST_ASSERT(ret == AES_OK, "Decrypt data");

    TEST_ASSERT(memcmp(decrypted, plaintext, 16) == 0,
                "Decrypted plaintext matches original");

    // Cleanup
    aes_free(&ctx);
}

/**
 * Test AES-256 CBC mode encryption/decryption
 */
void test_aes_256_cbc(void)
{
    TEST_START("AES-256 CBC Mode");

    aes_context_t ctx;
    uint8_t key[32] = {
        0x60, 0x3d, 0xeb, 0x10, 0x15, 0xca, 0x71, 0xbe,
        0x2b, 0x73, 0xae, 0xf0, 0x85, 0x7d, 0x77, 0x81,
        0x1f, 0x35, 0x2c, 0x07, 0x3b, 0x61, 0x08, 0xd7,
        0x2d, 0x98, 0x10, 0xa3, 0x09, 0x14, 0xdf, 0xf4
    };
    uint8_t iv[16] = {
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f
    };
    uint8_t plaintext[32] = "This is a secret message!!!";
    uint8_t ciphertext[32];
    uint8_t decrypted[32];

    // Initialize
    int ret = aes_init(&ctx, AES_KEY_256, AES_MODE_CBC);
    TEST_ASSERT(ret == AES_OK, "Initialize AES-256 CBC context");

    // Set key and IV
    ret = aes_set_key(&ctx, key, 32);
    TEST_ASSERT(ret == AES_OK, "Set encryption key");

    ret = aes_set_iv(&ctx, iv, 16);
    TEST_ASSERT(ret == AES_OK, "Set initialization vector");

    // Encrypt
    ret = aes_encrypt(&ctx, plaintext, ciphertext, 32);
    TEST_ASSERT(ret == AES_OK, "Encrypt data");

    print_hex("  Plaintext ", plaintext, 32);
    print_hex("  Ciphertext", ciphertext, 32);

    // Decrypt (need to reset IV)
    aes_set_iv(&ctx, iv, 16);
    ret = aes_decrypt(&ctx, ciphertext, decrypted, 32);
    TEST_ASSERT(ret == AES_OK, "Decrypt data");

    TEST_ASSERT(memcmp(decrypted, plaintext, 32) == 0,
                "Decrypted plaintext matches original");

    // Cleanup
    aes_free(&ctx);
}

/**
 * Test AES-128 CTR mode encryption/decryption
 */
void test_aes_128_ctr(void)
{
    TEST_START("AES-128 CTR Mode");

    aes_context_t ctx;
    uint8_t key[16] = {
        0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
        0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c
    };
    uint8_t nonce[16] = {
        0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7,
        0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff
    };
    uint8_t plaintext[40] = "Hello, World! This is CTR mode test!";
    uint8_t ciphertext[40];
    uint8_t decrypted[40];

    // Initialize
    int ret = aes_init(&ctx, AES_KEY_128, AES_MODE_CTR);
    TEST_ASSERT(ret == AES_OK, "Initialize AES-128 CTR context");

    // Set key and nonce
    ret = aes_set_key(&ctx, key, 16);
    TEST_ASSERT(ret == AES_OK, "Set encryption key");

    ret = aes_set_nonce(&ctx, nonce, 16);
    TEST_ASSERT(ret == AES_OK, "Set nonce");

    // Encrypt
    ret = aes_encrypt(&ctx, plaintext, ciphertext, 40);
    TEST_ASSERT(ret == AES_OK, "Encrypt data (variable length)");

    // Decrypt (need to reset nonce)
    aes_set_nonce(&ctx, nonce, 16);
    ret = aes_decrypt(&ctx, ciphertext, decrypted, 40);
    TEST_ASSERT(ret == AES_OK, "Decrypt data");

    TEST_ASSERT(memcmp(decrypted, plaintext, 40) == 0,
                "Decrypted plaintext matches original");

    // Cleanup
    aes_free(&ctx);
}

/**
 * Test AES-256 GCM mode authenticated encryption
 */
void test_aes_256_gcm(void)
{
    TEST_START("AES-256 GCM Authenticated Encryption");

    aes_context_t ctx;
    uint8_t key[32] = {
        0xfe, 0xff, 0xe9, 0x92, 0x86, 0x65, 0x73, 0x1c,
        0x6d, 0x6a, 0x8f, 0x94, 0x67, 0x30, 0x83, 0x08,
        0xfe, 0xff, 0xe9, 0x92, 0x86, 0x65, 0x73, 0x1c,
        0x6d, 0x6a, 0x8f, 0x94, 0x67, 0x30, 0x83, 0x08
    };
    uint8_t nonce[12] = {
        0xca, 0xfe, 0xba, 0xbe, 0xfa, 0xce, 0xdb, 0xad,
        0xde, 0xca, 0xf8, 0x88
    };
    uint8_t aad_data[] = "Additional authenticated data";
    uint8_t plaintext[60] = "The quick brown fox jumps over the lazy dog!";
    uint8_t ciphertext[60];
    uint8_t decrypted[60];
    uint8_t tag[16];

    aes_aad_t aad = {
        .data = aad_data,
        .length = strlen((char *)aad_data)
    };

    // Initialize
    int ret = aes_init(&ctx, AES_KEY_256, AES_MODE_GCM);
    TEST_ASSERT(ret == AES_OK, "Initialize AES-256 GCM context");

    // Set key and nonce
    ret = aes_set_key(&ctx, key, 32);
    TEST_ASSERT(ret == AES_OK, "Set encryption key");

    ret = aes_set_nonce(&ctx, nonce, 12);
    TEST_ASSERT(ret == AES_OK, "Set nonce");

    // Encrypt and generate tag
    ret = aes_gcm_encrypt(&ctx, plaintext, strlen((char *)plaintext),
                         ciphertext, &aad, tag);
    TEST_ASSERT(ret == AES_OK, "Encrypt and authenticate data");

    print_hex("  Auth Tag  ", tag, 16);

    // Decrypt and verify tag
    aes_set_nonce(&ctx, nonce, 12);
    ret = aes_gcm_decrypt(&ctx, ciphertext, strlen((char *)plaintext),
                         decrypted, &aad, tag);
    TEST_ASSERT(ret == AES_OK, "Decrypt and verify authentication tag");

    TEST_ASSERT(memcmp(decrypted, plaintext, strlen((char *)plaintext)) == 0,
                "Decrypted plaintext matches original");

    // Test authentication failure with wrong tag
    uint8_t wrong_tag[16] = {0};
    aes_set_nonce(&ctx, nonce, 12);
    ret = aes_gcm_decrypt(&ctx, ciphertext, strlen((char *)plaintext),
                         decrypted, &aad, wrong_tag);
    TEST_ASSERT(ret == AES_ERR_AUTH_FAILED,
                "Authentication fails with wrong tag");

    // Cleanup
    aes_free(&ctx);
}

/**
 * Test PKCS#7 padding
 */
void test_pkcs7_padding(void)
{
    TEST_START("PKCS#7 Padding");

    uint8_t buffer[32];
    size_t padded_len, unpadded_len;

    // Test case 1: 13 bytes -> 16 bytes (pad with 3)
    uint8_t data1[13] = "Hello, World";
    memcpy(buffer, data1, 13);
    int ret = aes_pkcs7_pad(buffer, 13, 32, &padded_len);
    TEST_ASSERT(ret == AES_OK && padded_len == 16,
                "Pad 13 bytes to 16 bytes");
    TEST_ASSERT(buffer[15] == 3, "Padding value is 3");

    ret = aes_pkcs7_unpad(buffer, padded_len, &unpadded_len);
    TEST_ASSERT(ret == AES_OK && unpadded_len == 13,
                "Unpad 16 bytes to 13 bytes");

    // Test case 2: 16 bytes -> 32 bytes (pad with 16)
    uint8_t data2[16] = "1234567890123456";
    memcpy(buffer, data2, 16);
    ret = aes_pkcs7_pad(buffer, 16, 32, &padded_len);
    TEST_ASSERT(ret == AES_OK && padded_len == 32,
                "Pad 16 bytes to 32 bytes");
    TEST_ASSERT(buffer[31] == 16, "Padding value is 16");

    ret = aes_pkcs7_unpad(buffer, padded_len, &unpadded_len);
    TEST_ASSERT(ret == AES_OK && unpadded_len == 16,
                "Unpad 32 bytes to 16 bytes");
}

/**
 * Test secure memory zeroing
 */
void test_secure_memzero(void)
{
    TEST_START("Secure Memory Zeroing");

    uint8_t sensitive_data[32];
    memset(sensitive_data, 0xAA, 32);

    aes_secure_memzero(sensitive_data, 32);

    bool all_zero = true;
    for (int i = 0; i < 32; i++) {
        if (sensitive_data[i] != 0) {
            all_zero = false;
            break;
        }
    }

    TEST_ASSERT(all_zero, "Memory securely cleared to zero");
}

/**
 * Test error handling
 */
void test_error_handling(void)
{
    TEST_START("Error Handling");

    aes_context_t ctx;

    // Test invalid parameters
    int ret = aes_init(NULL, AES_KEY_128, AES_MODE_CBC);
    TEST_ASSERT(ret == AES_ERR_INVALID_PARAM,
                "Reject NULL context");

    // Test invalid key size
    ret = aes_init(&ctx, 999, AES_MODE_CBC);
    TEST_ASSERT(ret == AES_ERR_INVALID_KEY,
                "Reject invalid key size");

    // Test invalid mode
    ret = aes_init(&ctx, AES_KEY_128, 999);
    TEST_ASSERT(ret == AES_ERR_INVALID_MODE,
                "Reject invalid mode");

    // Test operation without initialization
    uint8_t buffer[16];
    ret = aes_encrypt(&ctx, buffer, buffer, 16);
    TEST_ASSERT(ret == AES_ERR_NOT_INITIALIZED,
                "Reject operation on uninitialized context");

    // Test error strings
    const char *err_str = aes_get_error_string(AES_ERR_AUTH_FAILED);
    TEST_ASSERT(strcmp(err_str, "Authentication failed") == 0,
                "Get correct error string");
}

/**
 * Performance benchmark test
 */
void test_performance(void)
{
    TEST_START("Performance Benchmark");

    printf("\n  Running performance tests...\n");

    // Benchmark AES-128 CBC
    uint32_t throughput = aes_benchmark(AES_KEY_128, AES_MODE_CBC, 1000, 1024);
    printf("  AES-128 CBC: %u bytes/sec\n", throughput);
    TEST_ASSERT(throughput > 0, "AES-128 CBC performance measurement");

    // Benchmark AES-256 CBC
    throughput = aes_benchmark(AES_KEY_256, AES_MODE_CBC, 1000, 1024);
    printf("  AES-256 CBC: %u bytes/sec\n", throughput);
    TEST_ASSERT(throughput > 0, "AES-256 CBC performance measurement");

    // Benchmark AES-128 CTR
    throughput = aes_benchmark(AES_KEY_128, AES_MODE_CTR, 1000, 1024);
    printf("  AES-128 CTR: %u bytes/sec\n", throughput);
    TEST_ASSERT(throughput > 0, "AES-128 CTR performance measurement");
}

/* ============================================================================
 * Main Test Runner
 * ========================================================================== */

int main(void)
{
    printf("========================================\n");
    printf("AES Crypto Module - Unit Tests\n");
    printf("========================================\n");

    test_aes_128_ecb();
    test_aes_256_cbc();
    test_aes_128_ctr();
    test_aes_256_gcm();
    test_pkcs7_padding();
    test_secure_memzero();
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
