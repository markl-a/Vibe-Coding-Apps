/**
 * @file test_framework.h
 * @brief Simple Test Framework for Firmware Testing
 * @version 1.0
 */

#ifndef TEST_FRAMEWORK_H
#define TEST_FRAMEWORK_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>

/* Test result tracking */
typedef struct {
    int total_tests;
    int passed_tests;
    int failed_tests;
    int skipped_tests;
} test_results_t;

/* Global test results */
extern test_results_t g_test_results;

/* Color codes for output */
#define COLOR_RESET   "\x1b[0m"
#define COLOR_RED     "\x1b[31m"
#define COLOR_GREEN   "\x1b[32m"
#define COLOR_YELLOW  "\x1b[33m"
#define COLOR_BLUE    "\x1b[34m"
#define COLOR_MAGENTA "\x1b[35m"
#define COLOR_CYAN    "\x1b[36m"

/* Test macros */
#define TEST_INIT() \
    do { \
        memset(&g_test_results, 0, sizeof(test_results_t)); \
        printf(COLOR_CYAN "========================================\n" COLOR_RESET); \
        printf(COLOR_CYAN "Starting Test Suite: %s\n", __FILE__); \
        printf(COLOR_CYAN "========================================\n" COLOR_RESET); \
    } while(0)

#define TEST_SUITE_START(name) \
    do { \
        printf(COLOR_BLUE "\n[TEST SUITE] %s\n" COLOR_RESET, name); \
    } while(0)

#define TEST_CASE_START(name) \
    do { \
        printf(COLOR_MAGENTA "  [TEST] %s ... " COLOR_RESET, name); \
        g_test_results.total_tests++; \
    } while(0)

#define TEST_ASSERT(condition, message) \
    do { \
        if (!(condition)) { \
            printf(COLOR_RED "FAILED\n" COLOR_RESET); \
            printf(COLOR_RED "    Assertion failed: %s\n" COLOR_RESET, message); \
            printf(COLOR_RED "    File: %s, Line: %d\n" COLOR_RESET, __FILE__, __LINE__); \
            g_test_results.failed_tests++; \
            return -1; \
        } \
    } while(0)

#define TEST_ASSERT_EQUAL(expected, actual, message) \
    do { \
        if ((expected) != (actual)) { \
            printf(COLOR_RED "FAILED\n" COLOR_RESET); \
            printf(COLOR_RED "    %s\n" COLOR_RESET, message); \
            printf(COLOR_RED "    Expected: %d, Actual: %d\n" COLOR_RESET, (int)(expected), (int)(actual)); \
            printf(COLOR_RED "    File: %s, Line: %d\n" COLOR_RESET, __FILE__, __LINE__); \
            g_test_results.failed_tests++; \
            return -1; \
        } \
    } while(0)

#define TEST_ASSERT_NOT_NULL(ptr, message) \
    do { \
        if ((ptr) == NULL) { \
            printf(COLOR_RED "FAILED\n" COLOR_RESET); \
            printf(COLOR_RED "    %s\n" COLOR_RESET, message); \
            printf(COLOR_RED "    Pointer is NULL\n" COLOR_RESET); \
            printf(COLOR_RED "    File: %s, Line: %d\n" COLOR_RESET, __FILE__, __LINE__); \
            g_test_results.failed_tests++; \
            return -1; \
        } \
    } while(0)

#define TEST_ASSERT_MEM_EQUAL(expected, actual, size, message) \
    do { \
        if (memcmp(expected, actual, size) != 0) { \
            printf(COLOR_RED "FAILED\n" COLOR_RESET); \
            printf(COLOR_RED "    %s\n" COLOR_RESET, message); \
            printf(COLOR_RED "    Memory comparison failed\n" COLOR_RESET); \
            printf(COLOR_RED "    File: %s, Line: %d\n" COLOR_RESET, __FILE__, __LINE__); \
            g_test_results.failed_tests++; \
            return -1; \
        } \
    } while(0)

#define TEST_CASE_END() \
    do { \
        printf(COLOR_GREEN "PASSED\n" COLOR_RESET); \
        g_test_results.passed_tests++; \
        return 0; \
    } while(0)

#define TEST_SKIP(reason) \
    do { \
        printf(COLOR_YELLOW "SKIPPED\n" COLOR_RESET); \
        printf(COLOR_YELLOW "    Reason: %s\n" COLOR_RESET, reason); \
        g_test_results.skipped_tests++; \
        return 0; \
    } while(0)

#define RUN_TEST(test_func) \
    do { \
        test_func(); \
    } while(0)

#define TEST_SUMMARY() \
    do { \
        printf(COLOR_CYAN "\n========================================\n" COLOR_RESET); \
        printf(COLOR_CYAN "Test Summary\n" COLOR_RESET); \
        printf(COLOR_CYAN "========================================\n" COLOR_RESET); \
        printf("Total Tests:   %d\n", g_test_results.total_tests); \
        printf(COLOR_GREEN "Passed Tests:  %d\n" COLOR_RESET, g_test_results.passed_tests); \
        printf(COLOR_RED "Failed Tests:  %d\n" COLOR_RESET, g_test_results.failed_tests); \
        printf(COLOR_YELLOW "Skipped Tests: %d\n" COLOR_RESET, g_test_results.skipped_tests); \
        printf(COLOR_CYAN "========================================\n" COLOR_RESET); \
        if (g_test_results.failed_tests == 0) { \
            printf(COLOR_GREEN "All tests passed!\n" COLOR_RESET); \
        } else { \
            printf(COLOR_RED "Some tests failed!\n" COLOR_RESET); \
        } \
    } while(0)

#define TEST_EXIT() \
    do { \
        return (g_test_results.failed_tests == 0) ? 0 : 1; \
    } while(0)

/* Function prototypes */
void test_framework_init(void);
void test_framework_print_results(void);
int test_framework_get_failed_count(void);

#endif /* TEST_FRAMEWORK_H */
