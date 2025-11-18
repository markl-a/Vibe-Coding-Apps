/**
 * @file benchmark_flash.c
 * @brief Flash Memory Performance Benchmark
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

#define BENCHMARK_ITERATIONS 1000
#define PAGE_SIZE 4096
#define SECTOR_SIZE 65536

/**
 * @brief Benchmark flash read
 */
static int benchmark_flash_read(void)
{
    TEST_CASE_START("Flash Read Benchmark");

    mock_init();

    // Prepare data
    uint8_t data[PAGE_SIZE];
    test_generate_random_data(data, sizeof(data));
    mock_flash_write(0x10000, data, sizeof(data));

    test_timer_t timer;
    uint8_t read_buffer[PAGE_SIZE];

    printf("\n    Running %d read operations...\n", BENCHMARK_ITERATIONS);

    test_timer_start(&timer);
    for (int i = 0; i < BENCHMARK_ITERATIONS; i++) {
        mock_flash_read(0x10000, read_buffer, sizeof(read_buffer));
    }
    test_timer_stop(&timer);

    uint64_t total_time = test_timer_get_elapsed_us(&timer);
    double avg_time = (double)total_time / BENCHMARK_ITERATIONS;
    double throughput = (sizeof(read_buffer) * BENCHMARK_ITERATIONS * 1000000.0) / total_time / 1024.0 / 1024.0;

    printf("    Total time: %lu us\n", (unsigned long)total_time);
    printf("    Average read time: %.2f us\n", avg_time);
    printf("    Read throughput: %.2f MB/s\n", throughput);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark flash write
 */
static int benchmark_flash_write(void)
{
    TEST_CASE_START("Flash Write Benchmark");

    mock_init();

    uint8_t data[PAGE_SIZE];
    test_generate_random_data(data, sizeof(data));

    test_timer_t timer;

    printf("\n    Running %d write operations...\n", BENCHMARK_ITERATIONS);

    test_timer_start(&timer);
    for (int i = 0; i < BENCHMARK_ITERATIONS; i++) {
        mock_flash_write(0x10000 + (i % 16) * PAGE_SIZE, data, sizeof(data));
    }
    test_timer_stop(&timer);

    uint64_t total_time = test_timer_get_elapsed_us(&timer);
    double avg_time = (double)total_time / BENCHMARK_ITERATIONS;
    double throughput = (sizeof(data) * BENCHMARK_ITERATIONS * 1000000.0) / total_time / 1024.0 / 1024.0;

    printf("    Total time: %lu us\n", (unsigned long)total_time);
    printf("    Average write time: %.2f us\n", avg_time);
    printf("    Write throughput: %.2f MB/s\n", throughput);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark flash erase
 */
static int benchmark_flash_erase(void)
{
    TEST_CASE_START("Flash Erase Benchmark");

    mock_init();

    test_timer_t timer;
    int iterations = 100;

    printf("\n    Running %d erase operations...\n", iterations);

    test_timer_start(&timer);
    for (int i = 0; i < iterations; i++) {
        mock_flash_erase(0x10000, SECTOR_SIZE);
    }
    test_timer_stop(&timer);

    uint64_t total_time = test_timer_get_elapsed_us(&timer);
    double avg_time = (double)total_time / iterations;

    printf("    Total time: %lu us\n", (unsigned long)total_time);
    printf("    Average erase time: %.2f us\n", avg_time);
    printf("    Erase time per sector: %.2f ms\n", avg_time / 1000.0);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark sequential read
 */
static int benchmark_sequential_read(void)
{
    TEST_CASE_START("Sequential Read Benchmark");

    mock_init();

    size_t total_size = 1024 * 1024; // 1 MB
    size_t chunk_size = PAGE_SIZE;
    uint8_t buffer[PAGE_SIZE];

    // Prepare data
    for (size_t offset = 0; offset < total_size; offset += chunk_size) {
        uint8_t data[PAGE_SIZE];
        test_generate_random_data(data, chunk_size);
        mock_flash_write(offset, data, chunk_size);
    }

    test_timer_t timer;

    printf("\n    Reading %zu bytes sequentially...\n", total_size);

    test_timer_start(&timer);
    for (size_t offset = 0; offset < total_size; offset += chunk_size) {
        mock_flash_read(offset, buffer, chunk_size);
    }
    test_timer_stop(&timer);

    uint64_t total_time = test_timer_get_elapsed_us(&timer);
    double throughput = (total_size * 1000000.0) / total_time / 1024.0 / 1024.0;

    printf("    Total time: %lu us\n", (unsigned long)total_time);
    printf("    Sequential read throughput: %.2f MB/s\n", throughput);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark random read
 */
static int benchmark_random_read(void)
{
    TEST_CASE_START("Random Read Benchmark");

    mock_init();

    uint8_t buffer[256];
    test_timer_t timer;
    int iterations = 10000;

    printf("\n    Running %d random reads...\n", iterations);

    test_timer_start(&timer);
    for (int i = 0; i < iterations; i++) {
        uint32_t address = (rand() % (1024 * 1024 - 256));
        mock_flash_read(address, buffer, sizeof(buffer));
    }
    test_timer_stop(&timer);

    uint64_t total_time = test_timer_get_elapsed_us(&timer);
    double avg_time = (double)total_time / iterations;
    double iops = 1000000.0 / avg_time;

    printf("    Total time: %lu us\n", (unsigned long)total_time);
    printf("    Average random read time: %.2f us\n", avg_time);
    printf("    Random read IOPS: %.0f\n", iops);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark variable block sizes
 */
static int benchmark_variable_block_sizes(void)
{
    TEST_CASE_START("Variable Block Size Benchmark");

    mock_init();

    size_t sizes[] = {256, 512, 1024, 2048, 4096, 8192};
    int num_sizes = sizeof(sizes) / sizeof(sizes[0]);

    printf("\n    Testing different block sizes:\n");

    for (int i = 0; i < num_sizes; i++) {
        size_t size = sizes[i];
        uint8_t *buffer = malloc(size);
        test_generate_random_data(buffer, size);

        test_timer_t timer;
        int iterations = 1000;

        // Write benchmark
        test_timer_start(&timer);
        for (int j = 0; j < iterations; j++) {
            mock_flash_write(0x10000, buffer, size);
        }
        test_timer_stop(&timer);

        double write_time = (double)test_timer_get_elapsed_us(&timer) / iterations;

        // Read benchmark
        test_timer_start(&timer);
        for (int j = 0; j < iterations; j++) {
            mock_flash_read(0x10000, buffer, size);
        }
        test_timer_stop(&timer);

        double read_time = (double)test_timer_get_elapsed_us(&timer) / iterations;

        printf("    Block size %5zu: Read %.2f us, Write %.2f us\n",
               size, read_time, write_time);

        free(buffer);
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

    test_print_banner("Flash Memory Performance Benchmark");

    RUN_TEST(benchmark_flash_read);
    RUN_TEST(benchmark_flash_write);
    RUN_TEST(benchmark_flash_erase);
    RUN_TEST(benchmark_sequential_read);
    RUN_TEST(benchmark_random_read);
    RUN_TEST(benchmark_variable_block_sizes);

    TEST_SUMMARY();
    TEST_EXIT();
}
