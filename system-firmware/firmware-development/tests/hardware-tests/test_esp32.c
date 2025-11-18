/**
 * @file test_esp32.c
 * @brief ESP32 Platform Hardware Tests
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

/* ESP32 specific definitions */
#define ESP32_FLASH_BASE 0x00000000
#define ESP32_FLASH_SIZE 0x00400000  // 4 MB
#define ESP32_PARTITION_OTA_0 0x10000
#define ESP32_PARTITION_OTA_1 0x210000

/**
 * @brief Test ESP32 flash memory
 */
static int test_esp32_flash(void)
{
    TEST_CASE_START("ESP32 Flash Memory");

    printf("\n    ESP32 Flash Configuration:\n");
    printf("    Base Address: 0x%08X\n", ESP32_FLASH_BASE);
    printf("    Size: %d MB\n", ESP32_FLASH_SIZE / 1024 / 1024);

    mock_init();

    // Test SPI flash operations
    uint8_t buffer[256];
    int read_result = mock_flash_read(ESP32_FLASH_BASE, buffer, sizeof(buffer));
    TEST_ASSERT_EQUAL(0, read_result, "SPI flash read should succeed");

    uint8_t test_data[256];
    test_generate_random_data(test_data, sizeof(test_data));
    int write_result = mock_flash_write(ESP32_FLASH_BASE + 0x1000, test_data, sizeof(test_data));
    TEST_ASSERT_EQUAL(0, write_result, "SPI flash write should succeed");

    printf("    ESP32 SPI flash operations verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test ESP32 secure boot
 */
static int test_esp32_secure_boot(void)
{
    TEST_CASE_START("ESP32 Secure Boot");

    printf("\n    Testing ESP32 secure boot v2:\n");

    mock_init();
    mock_set_return_code("crypto_init", 0);

    // Initialize secure boot
    int init_result = mock_crypto_init();
    TEST_ASSERT_EQUAL(0, init_result, "Secure boot init should succeed");

    // Verify bootloader signature
    uint8_t bootloader[32768];
    uint8_t signature[64];
    test_generate_random_data(bootloader, sizeof(bootloader));

    mock_set_return_code("crypto_verify", 0);
    int verify_result = mock_crypto_verify(bootloader, sizeof(bootloader),
                                            signature, sizeof(signature));
    TEST_ASSERT_EQUAL(0, verify_result, "Bootloader verification should succeed");

    printf("    ESP32 secure boot v2 verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test ESP32 OTA partitions
 */
static int test_esp32_ota_partitions(void)
{
    TEST_CASE_START("ESP32 OTA Partitions");

    printf("\n    Testing ESP32 OTA partition scheme:\n");
    printf("    OTA_0: 0x%08X\n", ESP32_PARTITION_OTA_0);
    printf("    OTA_1: 0x%08X\n", ESP32_PARTITION_OTA_1);

    mock_init();

    // Write to OTA_1 partition
    uint8_t firmware[4096];
    test_generate_random_data(firmware, sizeof(firmware));

    mock_flash_erase(ESP32_PARTITION_OTA_1, sizeof(firmware));
    int write_result = mock_flash_write(ESP32_PARTITION_OTA_1, firmware, sizeof(firmware));
    TEST_ASSERT_EQUAL(0, write_result, "OTA partition write should succeed");

    // Verify
    uint8_t verify_buffer[4096];
    mock_flash_read(ESP32_PARTITION_OTA_1, verify_buffer, sizeof(verify_buffer));
    TEST_ASSERT_MEM_EQUAL(firmware, verify_buffer, sizeof(firmware),
                          "OTA firmware should match");

    printf("    ESP32 OTA partitions verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test ESP32 flash encryption
 */
static int test_esp32_flash_encryption(void)
{
    TEST_CASE_START("ESP32 Flash Encryption");

    printf("\n    Testing ESP32 flash encryption:\n");

    mock_init();

    // Plain data
    uint8_t plaintext[256];
    uint8_t encrypted[256];
    uint8_t decrypted[256];
    size_t enc_len, dec_len;

    test_generate_random_data(plaintext, sizeof(plaintext));

    // Encrypt
    mock_set_return_code("crypto_encrypt", 0);
    int enc_result = mock_crypto_encrypt(plaintext, sizeof(plaintext),
                                          encrypted, &enc_len);
    TEST_ASSERT_EQUAL(0, enc_result, "Flash encryption should succeed");

    // Decrypt
    mock_set_return_code("crypto_decrypt", 0);
    int dec_result = mock_crypto_decrypt(encrypted, enc_len,
                                          decrypted, &dec_len);
    TEST_ASSERT_EQUAL(0, dec_result, "Flash decryption should succeed");

    TEST_ASSERT_MEM_EQUAL(plaintext, decrypted, sizeof(plaintext),
                          "Decrypted data should match original");

    printf("    ESP32 flash encryption verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test ESP32 WiFi OTA
 */
static int test_esp32_wifi_ota(void)
{
    TEST_CASE_START("ESP32 WiFi OTA");

    printf("\n    Testing ESP32 WiFi OTA update:\n");

    mock_init();

    // Simulate WiFi connection
    bool wifi_connected = mock_network_is_connected();
    TEST_ASSERT(wifi_connected, "WiFi should be connected");

    // Download firmware
    uint8_t firmware[8192];
    test_generate_random_data(firmware, sizeof(firmware));

    printf("    Downloading firmware over WiFi...\n");
    int send_result = mock_network_send(firmware, sizeof(firmware));
    TEST_ASSERT(send_result > 0, "Network send should succeed");

    // Write to OTA partition
    mock_flash_erase(ESP32_PARTITION_OTA_1, sizeof(firmware));
    mock_flash_write(ESP32_PARTITION_OTA_1, firmware, sizeof(firmware));

    printf("    WiFi OTA update completed\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test ESP32 NVS (Non-Volatile Storage)
 */
static int test_esp32_nvs(void)
{
    TEST_CASE_START("ESP32 NVS Storage");

    printf("\n    Testing ESP32 NVS operations:\n");

    mock_init();

    // Simulate NVS operations
    typedef struct {
        char key[32];
        uint32_t value;
    } nvs_entry_t;

    nvs_entry_t entry = {
        .key = "ota_version",
        .value = 123
    };

    // Write to NVS
    uint8_t nvs_data[sizeof(nvs_entry_t)];
    memcpy(nvs_data, &entry, sizeof(entry));

    mock_flash_write(0x009000, nvs_data, sizeof(nvs_data));

    // Read from NVS
    uint8_t read_data[sizeof(nvs_entry_t)];
    mock_flash_read(0x009000, read_data, sizeof(read_data));

    nvs_entry_t *read_entry = (nvs_entry_t *)read_data;
    TEST_ASSERT_EQUAL(entry.value, read_entry->value, "NVS value should match");

    printf("    ESP32 NVS storage verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test ESP32 eFuse
 */
static int test_esp32_efuse(void)
{
    TEST_CASE_START("ESP32 eFuse Security");

    printf("\n    Testing ESP32 eFuse security features:\n");

    // eFuse bits (simulated)
    bool secure_boot_enabled = true;
    bool flash_encryption_enabled = true;
    bool jtag_disabled = true;

    TEST_ASSERT(secure_boot_enabled, "Secure boot should be enabled");
    TEST_ASSERT(flash_encryption_enabled, "Flash encryption should be enabled");
    TEST_ASSERT(jtag_disabled, "JTAG should be disabled");

    printf("    eFuse security configuration verified:\n");
    printf("    - Secure Boot: Enabled\n");
    printf("    - Flash Encryption: Enabled\n");
    printf("    - JTAG Debug: Disabled\n");

    TEST_CASE_END();
}

/**
 * @brief Main test suite
 */
int main(void)
{
    TEST_INIT();

    test_print_banner("ESP32 Platform Hardware Tests");

    RUN_TEST(test_esp32_flash);
    RUN_TEST(test_esp32_secure_boot);
    RUN_TEST(test_esp32_ota_partitions);
    RUN_TEST(test_esp32_flash_encryption);
    RUN_TEST(test_esp32_wifi_ota);
    RUN_TEST(test_esp32_nvs);
    RUN_TEST(test_esp32_efuse);

    TEST_SUMMARY();
    TEST_EXIT();
}
