/**
 * @file test_storage.c
 * @brief Unit tests for Secure Storage module
 */

#include "secure_storage.h"
#include "key_management.h"
#include <stdio.h>
#include <string.h>

static int test_count = 0;
static int test_passed = 0;
static int test_failed = 0;

#define TEST_START(name) \
    printf("\n[TEST %d] %s\n", ++test_count, name)

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

void test_key_derivation(void)
{
    TEST_START("Key Derivation");
    
    uint8_t device_uid[16] = {1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16};
    uint8_t master_key[32];
    
    int ret = key_derive_from_device_uid(device_uid, 16, master_key);
    TEST_ASSERT(ret == 0, "Derive master key from UID");
    TEST_ASSERT(!key_is_zero(master_key, 32), "Master key is not zero");
}

void test_storage_operations(void)
{
    TEST_START("Storage Operations");
    
    secure_storage_context_t ctx;
    int ret = secure_storage_init(&ctx);
    TEST_ASSERT(ret == STORAGE_OK, "Initialize storage");
    
    const char *test_data = "Secret API Key: sk-1234567890";
    size_t data_len = strlen(test_data);
    
    ret = secure_storage_write(&ctx, SLOT_API_KEY,
                               (const uint8_t *)test_data, data_len);
    TEST_ASSERT(ret == STORAGE_OK, "Write data to slot");
    
    uint8_t read_buffer[256];
    size_t read_len;
    ret = secure_storage_read(&ctx, SLOT_API_KEY,
                             read_buffer, sizeof(read_buffer), &read_len);
    TEST_ASSERT(ret == STORAGE_OK, "Read data from slot");
    TEST_ASSERT(read_len == data_len, "Data length matches");
    
    read_buffer[read_len] = '\0';
    TEST_ASSERT(strcmp((char *)read_buffer, test_data) == 0,
                "Data integrity verified");
    
    secure_storage_deinit(&ctx);
}

int main(void)
{
    printf("========================================\n");
    printf("Secure Storage - Unit Tests\n");
    printf("========================================\n");
    
    test_key_derivation();
    test_storage_operations();
    
    printf("\n========================================\n");
    printf("Test Summary\n");
    printf("========================================\n");
    printf("Total: %d  Passed: %d  Failed: %d\n",
           test_count, test_passed, test_failed);
    printf("========================================\n\n");
    
    return (test_failed == 0) ? 0 : 1;
}
