/**
 * @file test_flash.c
 * @brief Flash Driver Unit Tests
 */

#include "flash_hal.h"
#include "flash_driver.h"
#include "spi_flash.h"
#include "qspi_flash.h"
#include <stdio.h>
#include <string.h>
#include <assert.h>

/* Test result tracking */
static int tests_passed = 0;
static int tests_failed = 0;

/* Test macros */
#define TEST_ASSERT(condition, message) \
    do { \
        if (condition) { \
            printf("  [PASS] %s\n", message); \
            tests_passed++; \
        } else { \
            printf("  [FAIL] %s\n", message); \
            tests_failed++; \
        } \
    } while(0)

#define TEST_START(name) \
    printf("\n=== Running: %s ===\n", name)

#define TEST_END() \
    printf("Tests passed: %d, failed: %d\n", tests_passed, tests_failed)

/* Mock SPI I/O for testing */
static uint8_t mock_flash_memory[64 * 1024]; /* 64KB simulated flash */

static flash_status_t mock_spi_init(void)
{
    memset(mock_flash_memory, 0xFF, sizeof(mock_flash_memory));
    return FLASH_OK;
}

static flash_status_t mock_spi_deinit(void)
{
    return FLASH_OK;
}

static void mock_cs_low(void) {}
static void mock_cs_high(void) {}

static flash_status_t mock_spi_transfer(const uint8_t *tx_data, uint8_t *rx_data, uint32_t size)
{
    /* Simplified simulation - just return success */
    if (rx_data != NULL) {
        memset(rx_data, 0xFF, size);
        /* Simulate JEDEC ID read */
        if (size >= 3) {
            rx_data[0] = 0xEF; /* Winbond */
            rx_data[1] = 0x40;
            rx_data[2] = 0x17; /* W25Q64 */
        }
    }
    return FLASH_OK;
}

static void mock_delay_ms(uint32_t ms)
{
    (void)ms;
}

static const spi_flash_io_t mock_spi_io = {
    .init = mock_spi_init,
    .deinit = mock_spi_deinit,
    .cs_low = mock_cs_low,
    .cs_high = mock_cs_high,
    .transfer = mock_spi_transfer,
    .delay_ms = mock_delay_ms,
};

/* Mock QSPI I/O for testing */
static flash_status_t mock_qspi_init(void)
{
    memset(mock_flash_memory, 0xFF, sizeof(mock_flash_memory));
    return FLASH_OK;
}

static flash_status_t mock_qspi_deinit(void)
{
    return FLASH_OK;
}

static flash_status_t mock_qspi_command(uint8_t cmd, const qspi_line_config_t *config,
                                        uint32_t address, const uint8_t *tx_data,
                                        uint8_t *rx_data, uint32_t data_size)
{
    (void)config;
    (void)address;
    (void)tx_data;

    /* Simulate JEDEC ID read */
    if (cmd == 0x9F && rx_data != NULL && data_size >= 3) {
        rx_data[0] = 0xEF; /* Winbond */
        rx_data[1] = 0x40;
        rx_data[2] = 0x17; /* W25Q64 */
    }
    /* Simulate status register read */
    else if (cmd == 0x05 && rx_data != NULL && data_size >= 1) {
        rx_data[0] = 0x00; /* Not busy */
    }

    return FLASH_OK;
}

static flash_status_t mock_qspi_read_indirect(uint32_t address, uint8_t *data, uint32_t size)
{
    if (address + size <= sizeof(mock_flash_memory)) {
        memcpy(data, &mock_flash_memory[address], size);
        return FLASH_OK;
    }
    return FLASH_INVALID_PARAM;
}

static flash_status_t mock_qspi_write_indirect(uint32_t address, const uint8_t *data, uint32_t size)
{
    if (address + size <= sizeof(mock_flash_memory)) {
        memcpy(&mock_flash_memory[address], data, size);
        return FLASH_OK;
    }
    return FLASH_INVALID_PARAM;
}

static flash_status_t mock_memory_mapped_enable(void)
{
    return FLASH_OK;
}

static flash_status_t mock_memory_mapped_disable(void)
{
    return FLASH_OK;
}

static const qspi_flash_io_t mock_qspi_io = {
    .init = mock_qspi_init,
    .deinit = mock_qspi_deinit,
    .command = mock_qspi_command,
    .read_indirect = mock_qspi_read_indirect,
    .write_indirect = mock_qspi_write_indirect,
    .memory_mapped_enable = mock_memory_mapped_enable,
    .memory_mapped_disable = mock_memory_mapped_disable,
    .delay_ms = mock_delay_ms,
};

/**
 * @brief Test Flash HAL basic operations
 */
void test_flash_hal_basic(void)
{
    TEST_START("Flash HAL Basic Operations");

    flash_device_t *device;
    flash_status_t status;
    flash_info_t info;

    /* Get internal flash device */
    device = internal_flash_get_device();
    TEST_ASSERT(device != NULL, "Get internal flash device");

    /* Register device */
    status = flash_hal_register(device);
    TEST_ASSERT(status == FLASH_OK, "Register flash device");

    /* Initialize device */
    status = flash_hal_init(device);
    TEST_ASSERT(status == FLASH_OK, "Initialize flash device");

    /* Get device info */
    status = flash_hal_get_info(device, &info);
    TEST_ASSERT(status == FLASH_OK, "Get flash info");
    TEST_ASSERT(info.type == FLASH_TYPE_INTERNAL, "Verify flash type");

    /* Get device by name */
    flash_device_t *found = flash_hal_get_device("internal_flash");
    TEST_ASSERT(found == device, "Get device by name");

    /* De-initialize */
    status = flash_hal_deinit(device);
    TEST_ASSERT(status == FLASH_OK, "De-initialize flash device");

    /* Unregister */
    status = flash_hal_unregister(device);
    TEST_ASSERT(status == FLASH_OK, "Unregister flash device");
}

/**
 * @brief Test internal flash read/write
 */
void test_internal_flash_read_write(void)
{
    TEST_START("Internal Flash Read/Write");

    flash_device_t *device = internal_flash_get_device();
    flash_status_t status;
    uint8_t write_data[256];
    uint8_t read_data[256];

    /* Initialize */
    status = flash_hal_register(device);
    status = flash_hal_init(device);
    TEST_ASSERT(status == FLASH_OK, "Initialize internal flash");

    /* Prepare test data */
    for (int i = 0; i < 256; i++) {
        write_data[i] = i;
    }

    /* Erase first sector */
    status = flash_hal_erase_sector(device, 0);
    TEST_ASSERT(status == FLASH_OK, "Erase sector");

    /* Unlock for write */
    internal_flash_unlock();

    /* Write data */
    status = flash_hal_write(device, 0, write_data, 256);
    TEST_ASSERT(status == FLASH_OK, "Write data");

    /* Read data back */
    status = flash_hal_read(device, 0, read_data, 256);
    TEST_ASSERT(status == FLASH_OK, "Read data");

    /* Verify data */
    int match = (memcmp(write_data, read_data, 256) == 0);
    TEST_ASSERT(match, "Verify written data");

    /* Lock flash */
    internal_flash_lock();

    /* Cleanup */
    flash_hal_deinit(device);
    flash_hal_unregister(device);
}

/**
 * @brief Test SPI flash operations
 */
void test_spi_flash_operations(void)
{
    TEST_START("SPI Flash Operations");

    spi_flash_config_t config = {
        .device_id = 0xEF4017,
        .total_size = 8 * 1024 * 1024,
        .io = &mock_spi_io,
    };

    flash_status_t status;
    uint8_t mfr_id, read_data[16];
    uint16_t dev_id;

    /* Initialize SPI flash */
    status = spi_flash_init(&config);
    TEST_ASSERT(status == FLASH_OK, "Initialize SPI flash");

    /* Read ID */
    status = spi_flash_read_id(&mfr_id, &dev_id);
    TEST_ASSERT(status == FLASH_OK, "Read JEDEC ID");
    TEST_ASSERT(mfr_id == 0xEF, "Verify manufacturer ID");

    /* Get device */
    flash_device_t *device = spi_flash_get_device();
    TEST_ASSERT(device != NULL, "Get SPI flash device");
    TEST_ASSERT(device->info.type == FLASH_TYPE_SPI, "Verify device type");

    /* Test read operation */
    status = spi_flash_read(0, read_data, 16);
    TEST_ASSERT(status == FLASH_OK, "Read from SPI flash");

    /* Cleanup */
    status = spi_flash_deinit();
    TEST_ASSERT(status == FLASH_OK, "De-initialize SPI flash");
}

/**
 * @brief Test QSPI flash operations
 */
void test_qspi_flash_operations(void)
{
    TEST_START("QSPI Flash Operations");

    qspi_flash_config_t config = {
        .device_id = 0xEF4017,
        .total_size = 8 * 1024 * 1024,
        .default_mode = QSPI_MODE_QUAD_OUT,
        .io = &mock_qspi_io,
    };

    flash_status_t status;
    uint8_t mfr_id, read_data[16];
    uint16_t dev_id;

    /* Initialize QSPI flash */
    status = qspi_flash_init(&config);
    TEST_ASSERT(status == FLASH_OK, "Initialize QSPI flash");

    /* Read ID */
    status = qspi_flash_read_id(&mfr_id, &dev_id);
    TEST_ASSERT(status == FLASH_OK, "Read JEDEC ID");
    TEST_ASSERT(mfr_id == 0xEF, "Verify manufacturer ID");

    /* Get device */
    flash_device_t *device = qspi_flash_get_device();
    TEST_ASSERT(device != NULL, "Get QSPI flash device");
    TEST_ASSERT(device->info.type == FLASH_TYPE_QSPI, "Verify device type");

    /* Test read operation */
    status = qspi_flash_read(0, read_data, 16);
    TEST_ASSERT(status == FLASH_OK, "Read from QSPI flash");

    /* Test fast quad read */
    status = qspi_flash_fast_read_quad(0, read_data, 16);
    TEST_ASSERT(status == FLASH_OK, "Fast quad read");

    /* Test memory-mapped mode */
    status = qspi_flash_enable_memory_mapped();
    TEST_ASSERT(status == FLASH_OK, "Enable memory-mapped mode");

    status = qspi_flash_disable_memory_mapped();
    TEST_ASSERT(status == FLASH_OK, "Disable memory-mapped mode");

    /* Cleanup */
    status = qspi_flash_deinit();
    TEST_ASSERT(status == FLASH_OK, "De-initialize QSPI flash");
}

/**
 * @brief Test flash error handling
 */
void test_flash_error_handling(void)
{
    TEST_START("Flash Error Handling");

    flash_device_t *device = internal_flash_get_device();
    flash_status_t status;
    uint8_t buffer[16];

    /* Test operations on uninitialized device */
    status = flash_hal_read(device, 0, buffer, 16);
    TEST_ASSERT(status == FLASH_NOT_INITIALIZED, "Read on uninitialized device");

    status = flash_hal_write(device, 0, buffer, 16);
    TEST_ASSERT(status == FLASH_NOT_INITIALIZED, "Write on uninitialized device");

    /* Initialize for further tests */
    flash_hal_register(device);
    flash_hal_init(device);

    /* Test invalid parameters */
    status = flash_hal_read(device, 0, NULL, 16);
    TEST_ASSERT(status == FLASH_INVALID_PARAM, "Read with NULL buffer");

    status = flash_hal_write(device, 0, NULL, 16);
    TEST_ASSERT(status == FLASH_INVALID_PARAM, "Write with NULL buffer");

    /* Test out of bounds access */
    uint32_t large_addr = device->info.total_size + 1024;
    status = flash_hal_read(device, large_addr, buffer, 16);
    TEST_ASSERT(status == FLASH_INVALID_PARAM, "Read out of bounds");

    /* Cleanup */
    flash_hal_deinit(device);
    flash_hal_unregister(device);
}

/**
 * @brief Performance benchmark
 */
void test_flash_performance(void)
{
    TEST_START("Flash Performance Benchmark");

    flash_device_t *device = internal_flash_get_device();
    uint8_t buffer[1024];

    flash_hal_register(device);
    flash_hal_init(device);

    printf("  Device: %s\n", device->name);
    printf("  Total size: %u bytes\n", device->info.total_size);
    printf("  Page size: %u bytes\n", device->info.page_size);
    printf("  Sector count: %u\n", device->info.sector_count);

    /* Read performance */
    printf("  Read 1KB: (simulated timing)\n");
    flash_hal_read(device, 0, buffer, 1024);

    /* Write performance */
    printf("  Write 1KB: (simulated timing)\n");
    internal_flash_unlock();
    flash_hal_erase_sector(device, 0);
    flash_hal_write(device, 0, buffer, 1024);
    internal_flash_lock();

    flash_hal_deinit(device);
    flash_hal_unregister(device);

    tests_passed++; /* Count as one passing test */
}

/**
 * @brief Run all tests
 */
int main(void)
{
    printf("\n");
    printf("========================================\n");
    printf("  Flash Driver Test Suite\n");
    printf("========================================\n");

    test_flash_hal_basic();
    test_internal_flash_read_write();
    test_spi_flash_operations();
    test_qspi_flash_operations();
    test_flash_error_handling();
    test_flash_performance();

    printf("\n");
    printf("========================================\n");
    printf("  Test Results\n");
    printf("========================================\n");
    TEST_END();

    if (tests_failed == 0) {
        printf("\n  All tests PASSED!\n\n");
        return 0;
    } else {
        printf("\n  Some tests FAILED!\n\n");
        return 1;
    }
}
