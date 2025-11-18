/**
 * @file test_utils.h
 * @brief Test Utility Functions
 */

#ifndef TEST_UTILS_H
#define TEST_UTILS_H

#include <stdint.h>
#include <stdbool.h>
#include <stdlib.h>

/* Timing utilities */
typedef struct {
    uint64_t start_time;
    uint64_t end_time;
} test_timer_t;

/* Test data generators */
void test_generate_random_data(uint8_t *buffer, size_t size);
void test_generate_pattern_data(uint8_t *buffer, size_t size, uint8_t pattern);
void test_generate_incremental_data(uint8_t *buffer, size_t size);

/* Memory utilities */
void test_dump_hex(const uint8_t *data, size_t size);
bool test_compare_buffers(const uint8_t *buf1, const uint8_t *buf2, size_t size);
void test_fill_buffer(uint8_t *buffer, size_t size, uint8_t value);

/* Timing utilities */
void test_timer_start(test_timer_t *timer);
void test_timer_stop(test_timer_t *timer);
uint64_t test_timer_get_elapsed_us(test_timer_t *timer);
uint64_t test_timer_get_elapsed_ms(test_timer_t *timer);

/* String utilities */
void test_print_banner(const char *text);
void test_print_separator(void);

/* File utilities */
bool test_file_exists(const char *path);
size_t test_file_size(const char *path);
bool test_read_file(const char *path, uint8_t *buffer, size_t size);
bool test_write_file(const char *path, const uint8_t *buffer, size_t size);

/* System utilities */
void test_delay_ms(uint32_t ms);
uint64_t test_get_timestamp_us(void);
uint32_t test_get_timestamp_ms(void);

/* Math utilities */
uint32_t test_calculate_crc32(const uint8_t *data, size_t size);
void test_calculate_sha256(const uint8_t *data, size_t size, uint8_t *hash);

#endif /* TEST_UTILS_H */
