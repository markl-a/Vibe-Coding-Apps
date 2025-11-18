/**
 * @file test_crypto.c
 * @brief Cryptography Unit Tests
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

#define AES_BLOCK_SIZE 16
#define SHA256_HASH_SIZE 32

/**
 * @brief Test AES encryption
 */
static int test_aes_encryption(void)
{
    TEST_CASE_START("AES Encryption");

    mock_init();
    mock_set_return_code("crypto_encrypt", 0);

    uint8_t plaintext[AES_BLOCK_SIZE * 4];
    uint8_t ciphertext[AES_BLOCK_SIZE * 4];
    size_t output_len;

    test_generate_random_data(plaintext, sizeof(plaintext));

    int result = mock_crypto_encrypt(plaintext, sizeof(plaintext),
                                      ciphertext, &output_len);

    TEST_ASSERT_EQUAL(0, result, "Encryption should succeed");
    TEST_ASSERT_EQUAL(sizeof(plaintext), output_len, "Output length should match input");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test AES decryption
 */
static int test_aes_decryption(void)
{
    TEST_CASE_START("AES Decryption");

    mock_init();

    uint8_t plaintext[AES_BLOCK_SIZE * 4];
    uint8_t ciphertext[AES_BLOCK_SIZE * 4];
    uint8_t decrypted[AES_BLOCK_SIZE * 4];
    size_t enc_len, dec_len;

    test_generate_random_data(plaintext, sizeof(plaintext));

    // Encrypt
    mock_set_return_code("crypto_encrypt", 0);
    mock_crypto_encrypt(plaintext, sizeof(plaintext), ciphertext, &enc_len);

    // Decrypt
    mock_set_return_code("crypto_decrypt", 0);
    int result = mock_crypto_decrypt(ciphertext, enc_len, decrypted, &dec_len);

    TEST_ASSERT_EQUAL(0, result, "Decryption should succeed");
    TEST_ASSERT_EQUAL(sizeof(plaintext), dec_len, "Decrypted length should match original");
    TEST_ASSERT_MEM_EQUAL(plaintext, decrypted, sizeof(plaintext), "Decrypted data should match original");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test SHA256 hashing
 */
static int test_sha256_hash(void)
{
    TEST_CASE_START("SHA256 Hash");

    uint8_t data[256];
    uint8_t hash1[SHA256_HASH_SIZE];
    uint8_t hash2[SHA256_HASH_SIZE];

    test_generate_random_data(data, sizeof(data));

    // Calculate hash twice
    test_calculate_sha256(data, sizeof(data), hash1);
    test_calculate_sha256(data, sizeof(data), hash2);

    // Hashes should be identical for same data
    TEST_ASSERT_MEM_EQUAL(hash1, hash2, SHA256_HASH_SIZE, "Hash should be deterministic");

    TEST_CASE_END();
}

/**
 * @brief Test digital signature
 */
static int test_digital_signature(void)
{
    TEST_CASE_START("Digital Signature");

    mock_init();

    uint8_t message[512];
    uint8_t signature[64];
    size_t sig_len = 64;

    test_generate_random_data(message, sizeof(message));

    // Sign message
    mock_set_return_code("crypto_sign", 0);
    int sign_result = mock_crypto_sign(message, sizeof(message), signature, &sig_len);
    TEST_ASSERT_EQUAL(0, sign_result, "Signing should succeed");
    TEST_ASSERT_EQUAL(64, sig_len, "Signature length should be 64 bytes");

    // Verify signature
    mock_set_return_code("crypto_verify", 0);
    int verify_result = mock_crypto_verify(message, sizeof(message), signature, sig_len);
    TEST_ASSERT_EQUAL(0, verify_result, "Signature verification should succeed");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test random number generation
 */
static int test_random_generation(void)
{
    TEST_CASE_START("Random Number Generation");

    uint8_t random1[32];
    uint8_t random2[32];

    test_generate_random_data(random1, sizeof(random1));
    test_generate_random_data(random2, sizeof(random2));

    // Random data should be different (with very high probability)
    bool all_same = true;
    for (size_t i = 0; i < sizeof(random1); i++) {
        if (random1[i] != random2[i]) {
            all_same = false;
            break;
        }
    }

    TEST_ASSERT(!all_same, "Random data should be different");

    TEST_CASE_END();
}

/**
 * @brief Test key derivation
 */
static int test_key_derivation(void)
{
    TEST_CASE_START("Key Derivation");

    uint8_t master_key[32];
    uint8_t derived_key1[32];
    uint8_t derived_key2[32];

    test_generate_random_data(master_key, sizeof(master_key));

    // Derive keys with different salts
    test_calculate_sha256(master_key, sizeof(master_key), derived_key1);

    // Modify input slightly
    master_key[0] ^= 1;
    test_calculate_sha256(master_key, sizeof(master_key), derived_key2);

    // Derived keys should be different
    bool keys_different = false;
    for (size_t i = 0; i < sizeof(derived_key1); i++) {
        if (derived_key1[i] != derived_key2[i]) {
            keys_different = true;
            break;
        }
    }

    TEST_ASSERT(keys_different, "Derived keys should be different");

    TEST_CASE_END();
}

/**
 * @brief Test crypto initialization
 */
static int test_crypto_init(void)
{
    TEST_CASE_START("Crypto Initialization");

    mock_init();
    mock_set_return_code("crypto_init", 0);

    int result = mock_crypto_init();

    TEST_ASSERT_EQUAL(0, result, "Crypto init should succeed");
    TEST_ASSERT_EQUAL(1, mock_get_call_count("crypto_init"), "Init should be called once");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Main test suite
 */
int main(void)
{
    TEST_INIT();

    TEST_SUITE_START("Cryptography Tests");

    RUN_TEST(test_crypto_init);
    RUN_TEST(test_aes_encryption);
    RUN_TEST(test_aes_decryption);
    RUN_TEST(test_sha256_hash);
    RUN_TEST(test_digital_signature);
    RUN_TEST(test_random_generation);
    RUN_TEST(test_key_derivation);

    TEST_SUMMARY();
    TEST_EXIT();
}
