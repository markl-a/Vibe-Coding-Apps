/**
 * @file test_framework.c
 * @brief Simple Test Framework Implementation
 */

#include "test_framework.h"

/* Global test results */
test_results_t g_test_results = {0};

/**
 * @brief Initialize test framework
 */
void test_framework_init(void)
{
    memset(&g_test_results, 0, sizeof(test_results_t));
}

/**
 * @brief Print test results
 */
void test_framework_print_results(void)
{
    printf("\n========================================\n");
    printf("Test Results Summary\n");
    printf("========================================\n");
    printf("Total Tests:   %d\n", g_test_results.total_tests);
    printf("Passed Tests:  %d\n", g_test_results.passed_tests);
    printf("Failed Tests:  %d\n", g_test_results.failed_tests);
    printf("Skipped Tests: %d\n", g_test_results.skipped_tests);
    printf("========================================\n");

    if (g_test_results.failed_tests == 0 && g_test_results.total_tests > 0) {
        printf("SUCCESS: All tests passed!\n");
    } else if (g_test_results.total_tests == 0) {
        printf("WARNING: No tests were run!\n");
    } else {
        printf("FAILURE: %d test(s) failed!\n", g_test_results.failed_tests);
    }
}

/**
 * @brief Get number of failed tests
 * @return Number of failed tests
 */
int test_framework_get_failed_count(void)
{
    return g_test_results.failed_tests;
}
