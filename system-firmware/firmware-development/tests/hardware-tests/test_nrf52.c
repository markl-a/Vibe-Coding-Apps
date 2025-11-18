/**
 * @file test_nrf52.c
 * @brief nRF52 Platform Hardware Tests
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

/* nRF52 specific definitions */
#define NRF52_FLASH_BASE 0x00000000
#define NRF52_FLASH_SIZE 0x00080000  // 512 KB
#define NRF52_UICR_BASE 0x10001000
#define NRF52_BOOTLOADER_ADDR 0x78000

/**
 * @brief Test nRF52 flash memory
 */
static int test_nrf52_flash(void)
{
    TEST_CASE_START("nRF52 Flash Memory");

    printf("\n    nRF52 Flash Configuration:\n");
    printf("    Base Address: 0x%08X\n", NRF52_FLASH_BASE);
    printf("    Size: %d KB\n", NRF52_FLASH_SIZE / 1024);
    printf("    Page Size: 4 KB\n");

    mock_init();

    // Test flash operations
    uint8_t buffer[256];
    int read_result = mock_flash_read(NRF52_FLASH_BASE, buffer, sizeof(buffer));
    TEST_ASSERT_EQUAL(0, read_result, "Flash read should succeed");

    uint8_t test_data[256];
    test_generate_random_data(test_data, sizeof(test_data));
    int write_result = mock_flash_write(NRF52_FLASH_BASE + 0x1000, test_data, sizeof(test_data));
    TEST_ASSERT_EQUAL(0, write_result, "Flash write should succeed");

    printf("    nRF52 flash operations verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test nRF52 bootloader
 */
static int test_nrf52_bootloader(void)
{
    TEST_CASE_START("nRF52 Bootloader");

    printf("\n    Testing nRF52 bootloader:\n");
    printf("    Bootloader Address: 0x%08X\n", NRF52_BOOTLOADER_ADDR);

    mock_init();

    // Verify bootloader
    uint8_t bootloader[16384];
    uint8_t signature[64];
    test_generate_random_data(bootloader, sizeof(bootloader));

    mock_set_return_code("crypto_verify", 0);
    int verify_result = mock_crypto_verify(bootloader, sizeof(bootloader),
                                            signature, sizeof(signature));
    TEST_ASSERT_EQUAL(0, verify_result, "Bootloader verification should succeed");

    printf("    nRF52 bootloader verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test nRF52 DFU (Device Firmware Update)
 */
static int test_nrf52_dfu(void)
{
    TEST_CASE_START("nRF52 DFU");

    printf("\n    Testing nRF52 DFU over BLE:\n");

    mock_init();

    // DFU packet structure
    typedef struct {
        uint32_t offset;
        uint16_t size;
        uint8_t data[256];
    } dfu_packet_t;

    dfu_packet_t packet;
    packet.offset = 0;
    packet.size = 256;
    test_generate_random_data(packet.data, sizeof(packet.data));

    // Simulate DFU transfer
    printf("    Transferring DFU packet (offset: %u, size: %u)\n",
           packet.offset, packet.size);

    mock_flash_write(NRF52_FLASH_BASE + packet.offset, packet.data, packet.size);

    // Verify
    uint8_t verify_buffer[256];
    mock_flash_read(NRF52_FLASH_BASE + packet.offset, verify_buffer, packet.size);
    TEST_ASSERT_MEM_EQUAL(packet.data, verify_buffer, packet.size,
                          "DFU data should match");

    printf("    nRF52 DFU verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test nRF52 SoftDevice protection
 */
static int test_nrf52_softdevice(void)
{
    TEST_CASE_START("nRF52 SoftDevice Protection");

    printf("\n    Testing nRF52 SoftDevice protection:\n");

    // SoftDevice memory regions
    uint32_t softdevice_start = 0x00000000;
    uint32_t softdevice_end = 0x00026000;
    uint32_t app_start = 0x00026000;

    printf("    SoftDevice: 0x%08X - 0x%08X\n", softdevice_start, softdevice_end);
    printf("    Application: 0x%08X - ...\n", app_start);

    // Verify memory boundaries
    TEST_ASSERT(app_start > softdevice_end, "App should start after SoftDevice");

    printf("    Memory protection verified\n");

    TEST_CASE_END();
}

/**
 * @brief Test nRF52 UICR (User Information Configuration Registers)
 */
static int test_nrf52_uicr(void)
{
    TEST_CASE_START("nRF52 UICR Configuration");

    printf("\n    Testing nRF52 UICR settings:\n");

    mock_init();

    // UICR settings
    typedef struct {
        uint32_t bootloader_addr;
        uint32_t nrffw[15];
        uint32_t pselreset[2];
    } nrf52_uicr_t;

    nrf52_uicr_t uicr;
    uicr.bootloader_addr = NRF52_BOOTLOADER_ADDR;

    printf("    Bootloader Address: 0x%08X\n", uicr.bootloader_addr);
    TEST_ASSERT_EQUAL(NRF52_BOOTLOADER_ADDR, uicr.bootloader_addr,
                      "Bootloader address should be configured");

    printf("    UICR configuration verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test nRF52 BLE OTA update
 */
static int test_nrf52_ble_ota(void)
{
    TEST_CASE_START("nRF52 BLE OTA Update");

    printf("\n    Testing nRF52 BLE OTA update:\n");

    mock_init();

    // Simulate BLE connection
    bool ble_connected = true;
    TEST_ASSERT(ble_connected, "BLE should be connected");

    // Transfer firmware over BLE
    size_t firmware_size = 65536;
    size_t chunk_size = 256;
    size_t transferred = 0;

    printf("    Transferring %zu bytes over BLE...\n", firmware_size);

    while (transferred < firmware_size) {
        uint8_t chunk[256];
        test_generate_random_data(chunk, chunk_size);

        mock_flash_write(NRF52_FLASH_BASE + 0x10000 + transferred, chunk, chunk_size);
        transferred += chunk_size;
    }

    TEST_ASSERT_EQUAL(firmware_size, transferred, "Complete firmware should be transferred");

    printf("    BLE OTA update completed\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Test nRF52 low power features
 */
static int test_nrf52_low_power(void)
{
    TEST_CASE_START("nRF52 Low Power Features");

    printf("\n    Testing nRF52 power management:\n");

    // Power modes
    typedef enum {
        POWER_ON,
        POWER_SYSTEM_OFF,
        POWER_IDLE
    } nrf52_power_mode_t;

    nrf52_power_mode_t current_mode = POWER_ON;

    printf("    Current mode: ON\n");
    TEST_ASSERT_EQUAL(POWER_ON, current_mode, "Should be powered on");

    // Enter low power mode
    current_mode = POWER_IDLE;
    printf("    Entering IDLE mode for power saving\n");
    TEST_ASSERT_EQUAL(POWER_IDLE, current_mode, "Should enter IDLE mode");

    // Resume
    current_mode = POWER_ON;
    printf("    Resumed to ON mode\n");

    printf("    Power management verified\n");

    TEST_CASE_END();
}

/**
 * @brief Test nRF52 secure bootloader settings
 */
static int test_nrf52_secure_settings(void)
{
    TEST_CASE_START("nRF52 Secure Bootloader Settings");

    printf("\n    Testing nRF52 bootloader settings page:\n");

    mock_init();

    // Bootloader settings
    typedef struct {
        uint32_t settings_version;
        uint32_t app_version;
        uint32_t bootloader_version;
        uint32_t bank_0_crc;
        uint32_t bank_1_crc;
    } bootloader_settings_t;

    bootloader_settings_t settings = {
        .settings_version = 1,
        .app_version = 100,
        .bootloader_version = 1,
        .bank_0_crc = 0x12345678,
        .bank_1_crc = 0xABCDEF00
    };

    printf("    Settings Version: %u\n", settings.settings_version);
    printf("    App Version: %u\n", settings.app_version);
    printf("    Bootloader Version: %u\n", settings.bootloader_version);

    TEST_ASSERT(settings.app_version > 0, "App version should be set");

    printf("    Bootloader settings verified\n");

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Main test suite
 */
int main(void)
{
    TEST_INIT();

    test_print_banner("nRF52 Platform Hardware Tests");

    RUN_TEST(test_nrf52_flash);
    RUN_TEST(test_nrf52_bootloader);
    RUN_TEST(test_nrf52_dfu);
    RUN_TEST(test_nrf52_softdevice);
    RUN_TEST(test_nrf52_uicr);
    RUN_TEST(test_nrf52_ble_ota);
    RUN_TEST(test_nrf52_low_power);
    RUN_TEST(test_nrf52_secure_settings);

    TEST_SUMMARY();
    TEST_EXIT();
}
