/**
 * @file multi_platform.c
 * @brief I2C HAL 多平台移植範例
 *
 * 此範例展示 I2C HAL 的跨平台特性
 * 相同的應用代碼可以在不同的硬體平台上運行
 * 支持: STM32F4, ESP32, NRF52
 */

#include "i2c_hal.h"
#include <stdio.h>
#include <string.h>

/* ===== 平台檢測和配置 ===== */

#if defined(STM32F4)
    #define PLATFORM_NAME   "STM32F4"
    #include "stm32f4xx_hal.h"
    #define delay_ms(x)     HAL_Delay(x)
    #define get_tick()      HAL_GetTick()

    /* STM32F4 I2C 引腳配置 */
    #define I2C_NUM         1
    #define I2C_SDA_PIN     GPIO_PIN_7
    #define I2C_SDA_PORT    GPIOB
    #define I2C_SCL_PIN     GPIO_PIN_6
    #define I2C_SCL_PORT    GPIOB

#elif defined(ESP32)
    #define PLATFORM_NAME   "ESP32"
    #include "freertos/FreeRTOS.h"
    #include "freertos/task.h"
    #include "esp_timer.h"
    #define delay_ms(x)     vTaskDelay((x) / portTICK_PERIOD_MS)
    #define get_tick()      (esp_timer_get_time() / 1000)

    /* ESP32 I2C 引腳配置 */
    #define I2C_NUM         0
    #define I2C_SDA_PIN     21
    #define I2C_SCL_PIN     22

#elif defined(NRF52)
    #define PLATFORM_NAME   "NRF52"
    #include "nrf_delay.h"
    #include "app_timer.h"
    #define delay_ms(x)     nrf_delay_ms(x)
    #define get_tick()      app_timer_cnt_get()

    /* NRF52 I2C 引腳配置 */
    #define I2C_NUM         0
    #define I2C_SDA_PIN     26
    #define I2C_SCL_PIN     27

#else
    #define PLATFORM_NAME   "Generic"
    #warning "Unknown platform, using generic configuration"
    #define delay_ms(x)     /* 需要實作 */
    #define get_tick()      0
    #define I2C_NUM         1

#endif

/* ===== 應用層代碼 (平台無關) ===== */

/**
 * @brief I2C 設備掃描 (跨平台)
 */
static void i2c_scan_devices(i2c_handle_t i2c)
{
    printf("\nScanning I2C bus...\n");
    printf("Platform: %s\n\n", PLATFORM_NAME);

    uint16_t devices[128];
    int count = i2c_scan(i2c, devices, 128);

    if (count > 0) {
        printf("Found %d device(s):\n", count);
        for (int i = 0; i < count; i++) {
            printf("  0x%02X", devices[i]);

            /* 平台特定的附加信息 */
#ifdef STM32F4
            printf(" (STM32 I2C%d)", I2C_NUM);
#elif defined(ESP32)
            printf(" (ESP32 I2C%d)", I2C_NUM);
#elif defined(NRF52)
            printf(" (NRF52 TWI%d)", I2C_NUM);
#endif
            printf("\n");
        }
    } else {
        printf("No devices found.\n");
    }
}

/**
 * @brief EEPROM 讀寫測試 (跨平台)
 */
static int eeprom_test(i2c_handle_t i2c)
{
    const uint16_t EEPROM_ADDR = 0x50;
    const uint16_t TEST_ADDR = 0x0000;

    printf("\n========================================\n");
    printf("EEPROM Test (%s Platform)\n", PLATFORM_NAME);
    printf("========================================\n\n");

    /* 寫入測試數據 */
    uint8_t write_data[8] = {0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88};

    printf("Writing test data to EEPROM...\n");
    int result = i2c_mem_write(i2c, EEPROM_ADDR, TEST_ADDR, write_data, sizeof(write_data));

    if (result != 0) {
        printf("Error: EEPROM write failed\n");
        return -1;
    }

    delay_ms(10);  /* 等待 EEPROM 寫入完成 */
    printf("Write successful!\n");

    /* 讀取並驗證 */
    uint8_t read_data[8] = {0};

    printf("Reading back data...\n");
    result = i2c_mem_read(i2c, EEPROM_ADDR, TEST_ADDR, read_data, sizeof(read_data));

    if (result != 0) {
        printf("Error: EEPROM read failed\n");
        return -1;
    }

    /* 比較數據 */
    bool match = true;
    for (int i = 0; i < 8; i++) {
        if (read_data[i] != write_data[i]) {
            match = false;
            break;
        }
    }

    if (match) {
        printf("✓ EEPROM test PASSED\n");
        return 0;
    } else {
        printf("✗ EEPROM test FAILED\n");
        printf("Expected: ");
        for (int i = 0; i < 8; i++) printf("%02X ", write_data[i]);
        printf("\nGot:      ");
        for (int i = 0; i < 8; i++) printf("%02X ", read_data[i]);
        printf("\n");
        return -1;
    }
}

/**
 * @brief 性能測試 (跨平台)
 */
static void i2c_performance_test(i2c_handle_t i2c)
{
    const uint16_t EEPROM_ADDR = 0x50;
    const size_t TEST_SIZE = 64;

    printf("\n========================================\n");
    printf("I2C Performance Test (%s)\n", PLATFORM_NAME);
    printf("========================================\n\n");

    uint8_t data[TEST_SIZE];
    for (size_t i = 0; i < TEST_SIZE; i++) {
        data[i] = i & 0xFF;
    }

    /* 寫入性能測試 */
    printf("Write performance test (%d bytes)...\n", TEST_SIZE);
    uint32_t start_tick = get_tick();

    int result = i2c_mem_write(i2c, EEPROM_ADDR, 0x0100, data, TEST_SIZE);

    uint32_t end_tick = get_tick();
    uint32_t elapsed = end_tick - start_tick;

    if (result == 0) {
        printf("Write time: %lu ms\n", elapsed);
        printf("Write speed: %.2f KB/s\n", (TEST_SIZE / (float)elapsed));
    } else {
        printf("Write failed\n");
    }

    delay_ms(10);

    /* 讀取性能測試 */
    printf("\nRead performance test (%d bytes)...\n", TEST_SIZE);
    start_tick = get_tick();

    result = i2c_mem_read(i2c, EEPROM_ADDR, 0x0100, data, TEST_SIZE);

    end_tick = get_tick();
    elapsed = end_tick - start_tick;

    if (result == 0) {
        printf("Read time: %lu ms\n", elapsed);
        printf("Read speed: %.2f KB/s\n", (TEST_SIZE / (float)elapsed));
    } else {
        printf("Read failed\n");
    }
}

/**
 * @brief 平台信息打印
 */
static void print_platform_info(void)
{
    printf("\n========================================\n");
    printf("I2C HAL Multi-Platform Example\n");
    printf("========================================\n\n");

    printf("Platform: %s\n", PLATFORM_NAME);

#if defined(STM32F4)
    printf("MCU: STM32F4xx Series\n");
    printf("I2C Instance: I2C%d\n", I2C_NUM);
    printf("SDA Pin: PB%d\n", 7);
    printf("SCL Pin: PB%d\n", 6);
    printf("System Clock: %lu Hz\n", HAL_RCC_GetSysClockFreq());

#elif defined(ESP32)
    printf("MCU: ESP32\n");
    printf("I2C Port: %d\n", I2C_NUM);
    printf("SDA Pin: GPIO%d\n", I2C_SDA_PIN);
    printf("SCL Pin: GPIO%d\n", I2C_SCL_PIN);
    printf("FreeRTOS: Yes\n");

#elif defined(NRF52)
    printf("MCU: NRF52 Series\n");
    printf("TWI Instance: %d\n", I2C_NUM);
    printf("SDA Pin: P0.%d\n", I2C_SDA_PIN);
    printf("SCL Pin: P0.%d\n", I2C_SCL_PIN);

#endif

    printf("\n");
}

/**
 * @brief 主程式
 */
int main(void)
{
    /* 平台特定初始化 */
#if defined(STM32F4)
    HAL_Init();
    SystemClock_Config();  /* 需要在專案中實作 */

#elif defined(ESP32)
    /* ESP32 初始化通常在 app_main 中完成 */

#elif defined(NRF52)
    /* NRF52 初始化 */
    app_timer_init();

#endif

    /* 打印平台信息 */
    print_platform_info();

    /* 配置 I2C (跨平台統一配置) */
    i2c_config_t i2c_config = {
        .mode = I2C_MODE_MASTER,
        .clock_speed = I2C_SPEED_STANDARD,  /* 100kHz - 所有平台都支持 */
        .address_mode = I2C_ADDR_7BIT,
        .own_address = 0x00
    };

    /* 初始化 I2C */
    i2c_handle_t i2c = i2c_init(I2C_NUM, &i2c_config);
    if (!i2c) {
        printf("Error: Failed to initialize I2C\n");
        printf("\nPlatform-specific troubleshooting:\n");

#if defined(STM32F4)
        printf("  - Check RCC clock enable\n");
        printf("  - Verify GPIO alternate function\n");
        printf("  - Check I2C peripheral reset\n");

#elif defined(ESP32)
        printf("  - Check I2C driver installation\n");
        printf("  - Verify pin configuration\n");
        printf("  - Check pull-up resistors\n");

#elif defined(NRF52)
        printf("  - Check TWI pin configuration\n");
        printf("  - Verify GPIOTE initialization\n");
        printf("  - Check power management\n");
#endif

        return -1;
    }

    printf("I2C initialized successfully!\n");
    printf("Clock speed: %lu Hz\n", i2c_config.clock_speed);

    /* 執行跨平台測試 */
    i2c_scan_devices(i2c);
    delay_ms(1000);

    eeprom_test(i2c);
    delay_ms(1000);

    i2c_performance_test(i2c);

    printf("\n========================================\n");
    printf("All tests completed on %s platform\n", PLATFORM_NAME);
    printf("========================================\n");

    /* 主循環 */
    printf("\nEntering monitoring mode...\n");
    while (1) {
        delay_ms(5000);

        /* 定期掃描 */
        uint16_t devices[128];
        int count = i2c_scan(i2c, devices, 128);

        printf("[%lu ms] Active devices: %d\n", get_tick(), count);
    }

    /* 清理 */
    i2c_deinit(i2c);
    return 0;
}

/**
 * @brief 平台特定的時鐘配置
 */
#if defined(STM32F4)
void SystemClock_Config(void)
{
    /* 配置系統時鐘到 168 MHz */
    RCC_OscInitTypeDef RCC_OscInitStruct = {0};
    RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

    __HAL_RCC_PWR_CLK_ENABLE();
    __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE1);

    RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;
    RCC_OscInitStruct.HSEState = RCC_HSE_ON;
    RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
    RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
    RCC_OscInitStruct.PLL.PLLM = 8;
    RCC_OscInitStruct.PLL.PLLN = 336;
    RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV2;
    RCC_OscInitStruct.PLL.PLLQ = 7;

    if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK) {
        /* 錯誤處理 */
        while(1);
    }

    RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK | RCC_CLOCKTYPE_SYSCLK |
                                  RCC_CLOCKTYPE_PCLK1 | RCC_CLOCKTYPE_PCLK2;
    RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
    RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
    RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV4;
    RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV2;

    if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_5) != HAL_OK) {
        /* 錯誤處理 */
        while(1);
    }
}
#endif
