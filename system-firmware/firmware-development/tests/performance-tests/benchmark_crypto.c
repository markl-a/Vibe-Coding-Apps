/**
 * @file benchmark_crypto.c
 * @brief Cryptography Performance Benchmark
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

#define BENCHMARK_ITERATIONS 1000
#define SMALL_DATA_SIZE 256
#define MEDIUM_DATA_SIZE 4096
#define LARGE_DATA_SIZE 65536

/**
 * @brief Benchmark AES encryption
 */
static int benchmark_aes_encryption(void)
{
    TEST_CASE_START("AES Encryption Benchmark");

    mock_init();
    mock_set_return_code("crypto_encrypt", 0);

    test_timer_t timer;
    uint8_t input[MEDIUM_DATA_SIZE];
    uint8_t output[MEDIUM_DATA_SIZE];
    size_t output_len;

    test_generate_random_data(input, sizeof(input));

    printf("\n    Running %d iterations...\n", BENCHMARK_ITERATIONS);

    test_timer_start(&timer);
    for (int i = 0; i < BENCHMARK_ITERATIONS; i++) {
        mock_crypto_encrypt(input, sizeof(input), output, &output_len);
    }
    test_timer_stop(&timer);

    uint64_t total_time = test_timer_get_elapsed_us(&timer);
    double avg_time = (double)total_time / BENCHMARK_ITERATIONS;
    double throughput = (sizeof(input) * BENCHMARK_ITERATIONS * 1000000.0) / total_time / 1024.0 / 1024.0;

    printf("    Total time: %lu us\n", (unsigned long)total_time);
    printf("    Average time per operation: %.2f us\n", avg_time);
    printf("    Throughput: %.2f MB/s\n", throughput);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark AES decryption
 */
static int benchmark_aes_decryption(void)
{
    TEST_CASE_START("AES Decryption Benchmark");

    mock_init();
    mock_set_return_code("crypto_decrypt", 0);

    test_timer_t timer;
    uint8_t input[MEDIUM_DATA_SIZE];
    uint8_t output[MEDIUM_DATA_SIZE];
    size_t output_len;

    test_generate_random_data(input, sizeof(input));

    printf("\n    Running %d iterations...\n", BENCHMARK_ITERATIONS);

    test_timer_start(&timer);
    for (int i = 0; i < BENCHMARK_ITERATIONS; i++) {
        mock_crypto_decrypt(input, sizeof(input), output, &output_len);
    }
    test_timer_stop(&timer);

    uint64_t total_time = test_timer_get_elapsed_us(&timer);
    double avg_time = (double)total_time / BENCHMARK_ITERATIONS;
    double throughput = (sizeof(input) * BENCHMARK_ITERATIONS * 1000000.0) / total_time / 1024.0 / 1024.0;

    printf("    Total time: %lu us\n", (unsigned long)total_time);
    printf("    Average time per operation: %.2f us\n", avg_time);
    printf("    Throughput: %.2f MB/s\n", throughput);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark SHA256 hashing
 */
static int benchmark_sha256(void)
{
    TEST_CASE_START("SHA256 Hash Benchmark");

    test_timer_t timer;
    uint8_t input[MEDIUM_DATA_SIZE];
    uint8_t hash[32];

    test_generate_random_data(input, sizeof(input));

    printf("\n    Running %d iterations...\n", BENCHMARK_ITERATIONS);

    test_timer_start(&timer);
    for (int i = 0; i < BENCHMARK_ITERATIONS; i++) {
        test_calculate_sha256(input, sizeof(input), hash);
    }
    test_timer_stop(&timer);

    uint64_t total_time = test_timer_get_elapsed_us(&timer);
    double avg_time = (double)total_time / BENCHMARK_ITERATIONS;
    double throughput = (sizeof(input) * BENCHMARK_ITERATIONS * 1000000.0) / total_time / 1024.0 / 1024.0;

    printf("    Total time: %lu us\n", (unsigned long)total_time);
    printf("    Average time per operation: %.2f us\n", avg_time);
    printf("    Throughput: %.2f MB/s\n", throughput);

    TEST_CASE_END();
}

/**
 * @brief Benchmark digital signature
 */
static int benchmark_signature(void)
{
    TEST_CASE_START("Digital Signature Benchmark");

    mock_init();
    mock_set_return_code("crypto_sign", 0);

    test_timer_t timer;
    uint8_t data[SMALL_DATA_SIZE];
    uint8_t signature[64];
    size_t sig_len = 64;

    test_generate_random_data(data, sizeof(data));

    printf("\n    Running %d iterations...\n", BENCHMARK_ITERATIONS);

    test_timer_start(&timer);
    for (int i = 0; i < BENCHMARK_ITERATIONS; i++) {
        mock_crypto_sign(data, sizeof(data), signature, &sig_len);
    }
    test_timer_stop(&timer);

    uint64_t total_time = test_timer_get_elapsed_us(&timer);
    double avg_time = (double)total_time / BENCHMARK_ITERATIONS;

    printf("    Total time: %lu us\n", (unsigned long)total_time);
    printf("    Average time per signature: %.2f us\n", avg_time);
    printf("    Signatures per second: %.0f\n", 1000000.0 / avg_time);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark signature verification
 */
static int benchmark_verification(void)
{
    TEST_CASE_START("Signature Verification Benchmark");

    mock_init();
    mock_set_return_code("crypto_verify", 0);

    test_timer_t timer;
    uint8_t data[SMALL_DATA_SIZE];
    uint8_t signature[64];

    test_generate_random_data(data, sizeof(data));
    test_generate_random_data(signature, sizeof(signature));

    printf("\n    Running %d iterations...\n", BENCHMARK_ITERATIONS);

    test_timer_start(&timer);
    for (int i = 0; i < BENCHMARK_ITERATIONS; i++) {
        mock_crypto_verify(data, sizeof(data), signature, sizeof(signature));
    }
    test_timer_stop(&timer);

    uint64_t total_time = test_timer_get_elapsed_us(&timer);
    double avg_time = (double)total_time / BENCHMARK_ITERATIONS;

    printf("    Total time: %lu us\n", (unsigned long)total_time);
    printf("    Average time per verification: %.2f us\n", avg_time);
    printf("    Verifications per second: %.0f\n", 1000000.0 / avg_time);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark variable data sizes
 */
static int benchmark_variable_sizes(void)
{
    TEST_CASE_START("Variable Data Size Benchmark");

    mock_init();
    mock_set_return_code("crypto_encrypt", 0);

    size_t sizes[] = {256, 512, 1024, 2048, 4096, 8192, 16384};
    int num_sizes = sizeof(sizes) / sizeof(sizes[0]);

    printf("\n    Testing different data sizes:\n");

    for (int i = 0; i < num_sizes; i++) {
        size_t size = sizes[i];
        uint8_t *input = malloc(size);
        uint8_t *output = malloc(size);
        size_t output_len;

        test_generate_random_data(input, size);

        test_timer_t timer;
        test_timer_start(&timer);

        for (int j = 0; j < 100; j++) {
            mock_crypto_encrypt(input, size, output, &output_len);
        }

        test_timer_stop(&timer);
        uint64_t elapsed = test_timer_get_elapsed_us(&timer);
        double avg_time = (double)elapsed / 100;

        printf("    Size %6zu bytes: %.2f us/op\n", size, avg_time);

        free(input);
        free(output);
    }

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Main benchmark suite
 */
int main(void)
{
    TEST_INIT();

    test_print_banner("Cryptography Performance Benchmark");

    RUN_TEST(benchmark_aes_encryption);
    RUN_TEST(benchmark_aes_decryption);
    RUN_TEST(benchmark_sha256);
    RUN_TEST(benchmark_signature);
    RUN_TEST(benchmark_verification);
    RUN_TEST(benchmark_variable_sizes);

    TEST_SUMMARY();
    TEST_EXIT();
}
