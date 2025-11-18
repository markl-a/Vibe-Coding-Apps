/**
 * @file benchmark_ota.c
 * @brief OTA Update Performance Benchmark
 */

#include "../test-framework/test_framework.h"
#include "../test-framework/test_utils.h"
#include "../test-framework/mock.h"

#define FIRMWARE_SIZE_SMALL 65536      // 64 KB
#define FIRMWARE_SIZE_MEDIUM 262144    // 256 KB
#define FIRMWARE_SIZE_LARGE 1048576    // 1 MB
#define CHUNK_SIZE 4096

/**
 * @brief Benchmark OTA download speed
 */
static int benchmark_ota_download(void)
{
    TEST_CASE_START("OTA Download Benchmark");

    mock_init();

    size_t firmware_size = FIRMWARE_SIZE_MEDIUM;
    size_t downloaded = 0;
    test_timer_t timer;

    printf("\n    Downloading %zu bytes firmware...\n", firmware_size);

    test_timer_start(&timer);

    while (downloaded < firmware_size) {
        size_t chunk = (firmware_size - downloaded > CHUNK_SIZE) ?
                       CHUNK_SIZE : (firmware_size - downloaded);

        uint8_t buffer[CHUNK_SIZE];
        test_generate_random_data(buffer, chunk);

        // Simulate network delay
        test_delay_ms(1);

        mock_flash_write(0x80000 + downloaded, buffer, chunk);
        downloaded += chunk;
    }

    test_timer_stop(&timer);

    uint64_t total_time = test_timer_get_elapsed_ms(&timer);
    double throughput = (firmware_size * 1000.0) / total_time / 1024.0;

    printf("    Download completed in %lu ms\n", (unsigned long)total_time);
    printf("    Download speed: %.2f KB/s\n", throughput);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark OTA verification
 */
static int benchmark_ota_verification(void)
{
    TEST_CASE_START("OTA Verification Benchmark");

    mock_init();

    size_t firmware_size = FIRMWARE_SIZE_MEDIUM;
    uint8_t *firmware = malloc(firmware_size);
    test_generate_random_data(firmware, firmware_size);

    test_timer_t timer;

    printf("\n    Verifying %zu bytes firmware...\n", firmware_size);

    // CRC verification
    test_timer_start(&timer);
    uint32_t crc = test_calculate_crc32(firmware, firmware_size);
    test_timer_stop(&timer);

    uint64_t crc_time = test_timer_get_elapsed_ms(&timer);
    printf("    CRC32 calculation: %lu ms (CRC: 0x%08X)\n",
           (unsigned long)crc_time, crc);

    // Signature verification
    mock_set_return_code("crypto_verify", 0);
    uint8_t signature[64];

    test_timer_start(&timer);
    mock_crypto_verify(firmware, firmware_size, signature, sizeof(signature));
    test_timer_stop(&timer);

    uint64_t sig_time = test_timer_get_elapsed_ms(&timer);
    printf("    Signature verification: %lu ms\n", (unsigned long)sig_time);

    free(firmware);
    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark OTA installation
 */
static int benchmark_ota_installation(void)
{
    TEST_CASE_START("OTA Installation Benchmark");

    mock_init();

    size_t firmware_size = FIRMWARE_SIZE_MEDIUM;
    test_timer_t timer;

    printf("\n    Installing %zu bytes firmware...\n", firmware_size);

    test_timer_start(&timer);

    // Erase partition
    mock_flash_erase(0x10000, firmware_size);

    // Write firmware
    for (size_t offset = 0; offset < firmware_size; offset += CHUNK_SIZE) {
        uint8_t buffer[CHUNK_SIZE];
        test_generate_random_data(buffer, CHUNK_SIZE);
        mock_flash_write(0x10000 + offset, buffer, CHUNK_SIZE);
    }

    test_timer_stop(&timer);

    uint64_t install_time = test_timer_get_elapsed_ms(&timer);
    double throughput = (firmware_size * 1000.0) / install_time / 1024.0;

    printf("    Installation completed in %lu ms\n", (unsigned long)install_time);
    printf("    Installation speed: %.2f KB/s\n", throughput);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark complete OTA process
 */
static int benchmark_complete_ota(void)
{
    TEST_CASE_START("Complete OTA Process Benchmark");

    mock_init();

    size_t firmware_size = FIRMWARE_SIZE_MEDIUM;
    test_timer_t total_timer;

    printf("\n    Running complete OTA process for %zu bytes...\n", firmware_size);

    test_timer_start(&total_timer);

    // Phase 1: Download
    test_timer_t phase_timer;
    test_timer_start(&phase_timer);

    size_t downloaded = 0;
    while (downloaded < firmware_size) {
        size_t chunk = (firmware_size - downloaded > CHUNK_SIZE) ?
                       CHUNK_SIZE : (firmware_size - downloaded);
        uint8_t buffer[CHUNK_SIZE];
        test_generate_random_data(buffer, chunk);
        mock_flash_write(0x80000 + downloaded, buffer, chunk);
        downloaded += chunk;
    }

    test_timer_stop(&phase_timer);
    printf("    [1] Download: %lu ms\n",
           (unsigned long)test_timer_get_elapsed_ms(&phase_timer));

    // Phase 2: Verify
    test_timer_start(&phase_timer);

    uint8_t *firmware = malloc(firmware_size);
    mock_flash_read(0x80000, firmware, firmware_size);
    uint32_t crc = test_calculate_crc32(firmware, firmware_size);

    mock_set_return_code("crypto_verify", 0);
    uint8_t signature[64];
    mock_crypto_verify(firmware, firmware_size, signature, sizeof(signature));

    test_timer_stop(&phase_timer);
    printf("    [2] Verify: %lu ms\n",
           (unsigned long)test_timer_get_elapsed_ms(&phase_timer));

    // Phase 3: Backup
    test_timer_start(&phase_timer);

    uint8_t backup[CHUNK_SIZE];
    mock_flash_read(0x10000, backup, sizeof(backup));

    test_timer_stop(&phase_timer);
    printf("    [3] Backup: %lu ms\n",
           (unsigned long)test_timer_get_elapsed_ms(&phase_timer));

    // Phase 4: Install
    test_timer_start(&phase_timer);

    mock_flash_erase(0x10000, firmware_size);
    for (size_t offset = 0; offset < firmware_size; offset += CHUNK_SIZE) {
        mock_flash_write(0x10000 + offset, firmware + offset, CHUNK_SIZE);
    }

    test_timer_stop(&phase_timer);
    printf("    [4] Install: %lu ms\n",
           (unsigned long)test_timer_get_elapsed_ms(&phase_timer));

    test_timer_stop(&total_timer);

    uint64_t total_time = test_timer_get_elapsed_ms(&total_timer);
    printf("    Total OTA time: %lu ms\n", (unsigned long)total_time);

    free(firmware);
    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark different firmware sizes
 */
static int benchmark_firmware_sizes(void)
{
    TEST_CASE_START("Different Firmware Size Benchmark");

    mock_init();

    size_t sizes[] = {
        FIRMWARE_SIZE_SMALL,
        FIRMWARE_SIZE_MEDIUM,
        FIRMWARE_SIZE_LARGE
    };
    const char *names[] = {"Small (64 KB)", "Medium (256 KB)", "Large (1 MB)"};
    int num_sizes = sizeof(sizes) / sizeof(sizes[0]);

    printf("\n    Testing different firmware sizes:\n");

    for (int i = 0; i < num_sizes; i++) {
        size_t size = sizes[i];
        test_timer_t timer;

        // Download
        test_timer_start(&timer);
        for (size_t offset = 0; offset < size; offset += CHUNK_SIZE) {
            uint8_t buffer[CHUNK_SIZE];
            test_generate_random_data(buffer, CHUNK_SIZE);
            mock_flash_write(0x80000 + offset, buffer, CHUNK_SIZE);
        }
        test_timer_stop(&timer);

        uint64_t time_ms = test_timer_get_elapsed_ms(&timer);

        printf("    %s: %lu ms\n", names[i], (unsigned long)time_ms);
    }

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Benchmark delta update
 */
static int benchmark_delta_update(void)
{
    TEST_CASE_START("Delta Update Benchmark");

    mock_init();

    size_t full_size = FIRMWARE_SIZE_MEDIUM;
    size_t delta_size = full_size / 10; // 10% delta

    test_timer_t full_timer, delta_timer;

    printf("\n    Comparing full vs delta update...\n");

    // Full update
    test_timer_start(&full_timer);
    for (size_t offset = 0; offset < full_size; offset += CHUNK_SIZE) {
        uint8_t buffer[CHUNK_SIZE];
        test_generate_random_data(buffer, CHUNK_SIZE);
        mock_flash_write(0x10000 + offset, buffer, CHUNK_SIZE);
    }
    test_timer_stop(&full_timer);

    // Delta update
    test_timer_start(&delta_timer);
    for (size_t offset = 0; offset < delta_size; offset += CHUNK_SIZE) {
        uint8_t buffer[CHUNK_SIZE];
        test_generate_random_data(buffer, CHUNK_SIZE);
        mock_flash_write(0x10000 + offset, buffer, CHUNK_SIZE);
    }
    test_timer_stop(&delta_timer);

    uint64_t full_time = test_timer_get_elapsed_ms(&full_timer);
    uint64_t delta_time = test_timer_get_elapsed_ms(&delta_timer);
    double improvement = (double)(full_time - delta_time) / full_time * 100.0;

    printf("    Full update: %lu ms\n", (unsigned long)full_time);
    printf("    Delta update: %lu ms\n", (unsigned long)delta_time);
    printf("    Time saved: %.1f%%\n", improvement);

    mock_cleanup();
    TEST_CASE_END();
}

/**
 * @brief Main benchmark suite
 */
int main(void)
{
    TEST_INIT();

    test_print_banner("OTA Update Performance Benchmark");

    RUN_TEST(benchmark_ota_download);
    RUN_TEST(benchmark_ota_verification);
    RUN_TEST(benchmark_ota_installation);
    RUN_TEST(benchmark_complete_ota);
    RUN_TEST(benchmark_firmware_sizes);
    RUN_TEST(benchmark_delta_update);

    TEST_SUMMARY();
    TEST_EXIT();
}
