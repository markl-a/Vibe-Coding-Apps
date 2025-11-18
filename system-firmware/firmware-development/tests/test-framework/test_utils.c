/**
 * @file test_utils.c
 * @brief Test Utility Functions Implementation
 */

#include "test_utils.h"
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <sys/time.h>
#include <sys/stat.h>
#include <unistd.h>

/**
 * @brief Generate random data
 */
void test_generate_random_data(uint8_t *buffer, size_t size)
{
    for (size_t i = 0; i < size; i++) {
        buffer[i] = (uint8_t)(rand() % 256);
    }
}

/**
 * @brief Generate pattern data
 */
void test_generate_pattern_data(uint8_t *buffer, size_t size, uint8_t pattern)
{
    memset(buffer, pattern, size);
}

/**
 * @brief Generate incremental data
 */
void test_generate_incremental_data(uint8_t *buffer, size_t size)
{
    for (size_t i = 0; i < size; i++) {
        buffer[i] = (uint8_t)(i % 256);
    }
}

/**
 * @brief Dump data in hex format
 */
void test_dump_hex(const uint8_t *data, size_t size)
{
    printf("Hex Dump (%zu bytes):\n", size);
    for (size_t i = 0; i < size; i++) {
        if (i % 16 == 0) {
            printf("\n%04zx: ", i);
        }
        printf("%02x ", data[i]);
    }
    printf("\n");
}

/**
 * @brief Compare two buffers
 */
bool test_compare_buffers(const uint8_t *buf1, const uint8_t *buf2, size_t size)
{
    return memcmp(buf1, buf2, size) == 0;
}

/**
 * @brief Fill buffer with value
 */
void test_fill_buffer(uint8_t *buffer, size_t size, uint8_t value)
{
    memset(buffer, value, size);
}

/**
 * @brief Start timer
 */
void test_timer_start(test_timer_t *timer)
{
    struct timeval tv;
    gettimeofday(&tv, NULL);
    timer->start_time = (uint64_t)tv.tv_sec * 1000000ULL + (uint64_t)tv.tv_usec;
}

/**
 * @brief Stop timer
 */
void test_timer_stop(test_timer_t *timer)
{
    struct timeval tv;
    gettimeofday(&tv, NULL);
    timer->end_time = (uint64_t)tv.tv_sec * 1000000ULL + (uint64_t)tv.tv_usec;
}

/**
 * @brief Get elapsed time in microseconds
 */
uint64_t test_timer_get_elapsed_us(test_timer_t *timer)
{
    return timer->end_time - timer->start_time;
}

/**
 * @brief Get elapsed time in milliseconds
 */
uint64_t test_timer_get_elapsed_ms(test_timer_t *timer)
{
    return (timer->end_time - timer->start_time) / 1000;
}

/**
 * @brief Print banner
 */
void test_print_banner(const char *text)
{
    int len = strlen(text);
    printf("\n");
    for (int i = 0; i < len + 4; i++) printf("=");
    printf("\n  %s\n", text);
    for (int i = 0; i < len + 4; i++) printf("=");
    printf("\n");
}

/**
 * @brief Print separator
 */
void test_print_separator(void)
{
    printf("----------------------------------------\n");
}

/**
 * @brief Check if file exists
 */
bool test_file_exists(const char *path)
{
    struct stat st;
    return (stat(path, &st) == 0);
}

/**
 * @brief Get file size
 */
size_t test_file_size(const char *path)
{
    struct stat st;
    if (stat(path, &st) == 0) {
        return st.st_size;
    }
    return 0;
}

/**
 * @brief Read file
 */
bool test_read_file(const char *path, uint8_t *buffer, size_t size)
{
    FILE *fp = fopen(path, "rb");
    if (!fp) return false;

    size_t read = fread(buffer, 1, size, fp);
    fclose(fp);

    return (read == size);
}

/**
 * @brief Write file
 */
bool test_write_file(const char *path, const uint8_t *buffer, size_t size)
{
    FILE *fp = fopen(path, "wb");
    if (!fp) return false;

    size_t written = fwrite(buffer, 1, size, fp);
    fclose(fp);

    return (written == size);
}

/**
 * @brief Delay in milliseconds
 */
void test_delay_ms(uint32_t ms)
{
    usleep(ms * 1000);
}

/**
 * @brief Get timestamp in microseconds
 */
uint64_t test_get_timestamp_us(void)
{
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (uint64_t)tv.tv_sec * 1000000ULL + (uint64_t)tv.tv_usec;
}

/**
 * @brief Get timestamp in milliseconds
 */
uint32_t test_get_timestamp_ms(void)
{
    return (uint32_t)(test_get_timestamp_us() / 1000);
}

/**
 * @brief Calculate CRC32
 */
uint32_t test_calculate_crc32(const uint8_t *data, size_t size)
{
    uint32_t crc = 0xFFFFFFFF;

    for (size_t i = 0; i < size; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            crc = (crc >> 1) ^ (0xEDB88320 & -(crc & 1));
        }
    }

    return ~crc;
}

/**
 * @brief Calculate SHA256 (simplified stub - use real crypto library in production)
 */
void test_calculate_sha256(const uint8_t *data, size_t size, uint8_t *hash)
{
    // Simplified stub - in production, use mbedtls or openssl
    memset(hash, 0, 32);
    for (size_t i = 0; i < size; i++) {
        hash[i % 32] ^= data[i];
    }
}
