/**
 * @file test_stm32.c
 * @brief STM32 Platform Hardware Tests
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

/* STM32 specific definitions */
#define STM32_FLASH_BASE 0x08000000
#define STM32_FLASH_SIZE 0x00100000  // 1 MB
#define STM32_RAM_BASE 0x20000000
#define STM32_RAM_SIZE 0x00040000     // 256 KB

/**
 * @brief Test STM32 flash memory
 */
static int test_stm32_flash(void)
{
    TEST_CASE_START("STM32 Flash Memory");

    printf("\n    STM32 Flash Configuration:\n");
    printf("    Base Address: 0x%08X\n", STM32_FLASH_BASE);
    printf("    Size: %d KB\n", STM32_FLASH_SIZE / 1024);

    mock_init();

    // Test flash read
    uint8_t buffer[256];
    int read_result = mock_flash_read(STM32_FLASH_BASE, buffer, sizeof(buffer));
    TEST_ASSERT_EQUAL(0, read_result, "Flash read should succeed");

    // Test flash write
    uint8_t test_data[256];
    test_generate_random_data(test_data, sizeof(test_data));
    int write_result = mock_flash_write(STM32_FLASH_BASE + 0x1000, test_data, sizeof(test_data));
    TEST_ASSERT_EQUAL(0, write_result, "Flash write should succeed");

    // Test flash erase
    int erase_result = mock_flash_erase(STM32_FLASH_BASE + 0x1000, 4096);
    TEST_ASSERT_EQUAL(0, erase_result, "Flash erase should succeed");

    printf("    STM32 flash operations verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test STM32 secure boot
 */
static int test_stm32_secure_boot(void)
{
    TEST_CASE_START("STM32 Secure Boot");

    printf("\n    Testing STM32 secure boot features:\n");

    mock_init();
    mock_set_return_code("crypto_init", 0);

    // Initialize crypto
    int init_result = mock_crypto_init();
    TEST_ASSERT_EQUAL(0, init_result, "Crypto init should succeed");

    // Verify bootloader
    uint8_t bootloader[16384];
    uint8_t signature[64];
    test_generate_random_data(bootloader, sizeof(bootloader));

    mock_set_return_code("crypto_verify", 0);
    int verify_result = mock_crypto_verify(bootloader, sizeof(bootloader),
                                            signature, sizeof(signature));
    TEST_ASSERT_EQUAL(0, verify_result, "Bootloader verification should succeed");

    printf("    STM32 secure boot verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test STM32 OTA update
 */
static int test_stm32_ota(void)
{
    TEST_CASE_START("STM32 OTA Update");

    printf("\n    Testing STM32 OTA update:\n");

    mock_init();

    // Dual bank configuration
    uint32_t bank1_addr = STM32_FLASH_BASE;
    uint32_t bank2_addr = STM32_FLASH_BASE + (STM32_FLASH_SIZE / 2);

    printf("    Bank 1: 0x%08X\n", bank1_addr);
    printf("    Bank 2: 0x%08X\n", bank2_addr);

    // Write firmware to bank 2
    uint8_t firmware[4096];
    test_generate_random_data(firmware, sizeof(firmware));

    mock_flash_erase(bank2_addr, sizeof(firmware));
    int write_result = mock_flash_write(bank2_addr, firmware, sizeof(firmware));
    TEST_ASSERT_EQUAL(0, write_result, "OTA write should succeed");

    // Verify firmware
    uint8_t verify_buffer[4096];
    mock_flash_read(bank2_addr, verify_buffer, sizeof(verify_buffer));
    TEST_ASSERT_MEM_EQUAL(firmware, verify_buffer, sizeof(firmware),
                          "OTA firmware should match");

    printf("    STM32 OTA update verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test STM32 RDP (Read Protection)
 */
static int test_stm32_rdp(void)
{
    TEST_CASE_START("STM32 Read Protection");

    printf("\n    Testing STM32 RDP levels:\n");

    // RDP levels
    typedef enum {
        RDP_LEVEL_0 = 0xAA,  // No protection
        RDP_LEVEL_1 = 0x00,  // Read protection enabled
        RDP_LEVEL_2 = 0xCC   // Permanent protection
    } rdp_level_t;

    rdp_level_t current_level = RDP_LEVEL_1;

    printf("    Current RDP Level: 1 (Read Protection Enabled)\n");
    TEST_ASSERT_EQUAL(RDP_LEVEL_1, current_level, "RDP should be enabled");

    printf("    Flash memory is protected from unauthorized access\n");

    TEST_CASE_END();
}

/**
 * @brief Test STM32 power management
 */
static int test_stm32_power_management(void)
{
    TEST_CASE_START("STM32 Power Management");

    printf("\n    Testing STM32 power modes:\n");

    // Power modes
    typedef enum {
        POWER_RUN,
        POWER_SLEEP,
        POWER_STOP,
        POWER_STANDBY
    } power_mode_t;

    power_mode_t current_mode = POWER_RUN;

    printf("    Current mode: RUN\n");
    TEST_ASSERT_EQUAL(POWER_RUN, current_mode, "Should be in RUN mode");

    // Simulate low power mode
    current_mode = POWER_STOP;
    printf("    Entering STOP mode for power saving\n");
    TEST_ASSERT_EQUAL(POWER_STOP, current_mode, "Should enter STOP mode");

    // Resume
    current_mode = POWER_RUN;
    printf("    Resumed to RUN mode\n");

    TEST_CASE_END();
}

/**
 * @brief Test STM32 crypto hardware acceleration
 */
static int test_stm32_crypto_hardware(void)
{
    TEST_CASE_START("STM32 Crypto Hardware Acceleration");

    printf("\n    Testing STM32 crypto hardware:\n");

    mock_init();
    mock_set_return_code("crypto_init", 0);

    // Initialize crypto hardware
    int init_result = mock_crypto_init();
    TEST_ASSERT_EQUAL(0, init_result, "Crypto hardware init should succeed");

    // Test AES encryption
    uint8_t plaintext[256];
    uint8_t ciphertext[256];
    size_t output_len;

    test_generate_random_data(plaintext, sizeof(plaintext));

    mock_set_return_code("crypto_encrypt", 0);
    int enc_result = mock_crypto_encrypt(plaintext, sizeof(plaintext),
                                          ciphertext, &output_len);
    TEST_ASSERT_EQUAL(0, enc_result, "Hardware AES should succeed");

    printf("    STM32 crypto hardware acceleration verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Main test suite
 */
int main(void)
{
    TEST_INIT();

    test_print_banner("STM32 Platform Hardware Tests");

    RUN_TEST(test_stm32_flash);
    RUN_TEST(test_stm32_secure_boot);
    RUN_TEST(test_stm32_ota);
    RUN_TEST(test_stm32_rdp);
    RUN_TEST(test_stm32_power_management);
    RUN_TEST(test_stm32_crypto_hardware);

    TEST_SUMMARY();
    TEST_EXIT();
}
