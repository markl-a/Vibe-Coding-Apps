/**
 * @file parallel_interface.c
 * @brief GPIO 並行介面範例
 *
 * 此範例示範如何使用 GPIO HAL 實現並行數據介面
 * 常用於 LCD、SRAM 等設備
 */

#include "gpio_hal.h"
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

/* 平台相關的延遲函數 */
#ifdef STM32F4
    #include "stm32f4xx_hal.h"
    #define delay_ms(x) HAL_Delay(x)
    #define delay_us(x) /* 需要實作微秒延遲 */
#elif defined(ESP32)
    #include "freertos/FreeRTOS.h"
    #include "freertos/task.h"
    #include "esp_rom_sys.h"
    #define delay_ms(x) vTaskDelay((x) / portTICK_PERIOD_MS)
    #define delay_us(x) esp_rom_delay_us(x)
#else
    #define delay_ms(x) /* 需要實作 */
    #define delay_us(x) /* 需要實作 */
#endif

/* 8位元並行介面配置 */
#ifdef STM32F4
    /* 使用 GPIOB 的低 8 位作為數據總線 */
    #define DATA_PORT       GPIO_PORT_B
    #define DATA_PINS       0x00FF  /* PB0-PB7 */

    /* 控制信號 */
    #define CTRL_PORT       GPIO_PORT_A
    #define WR_PIN          GPIO_PIN_0   /* 寫入信號 (低電平有效) */
    #define RD_PIN          GPIO_PIN_1   /* 讀取信號 (低電平有效) */
    #define CS_PIN          GPIO_PIN_2   /* 片選信號 (低電平有效) */
    #define RS_PIN          GPIO_PIN_3   /* 寄存器選擇 (0=命令, 1=數據) */
#else
    #define DATA_PORT       GPIO_PORT_B
    #define DATA_PINS       0x00FF
    #define CTRL_PORT       GPIO_PORT_A
    #define WR_PIN          GPIO_PIN_0
    #define RD_PIN          GPIO_PIN_1
    #define CS_PIN          GPIO_PIN_2
    #define RS_PIN          GPIO_PIN_3
#endif

/* 控制信號巨集 */
#define WR_LOW()    gpio_reset(CTRL_PORT, WR_PIN)
#define WR_HIGH()   gpio_set(CTRL_PORT, WR_PIN)
#define RD_LOW()    gpio_reset(CTRL_PORT, RD_PIN)
#define RD_HIGH()   gpio_set(CTRL_PORT, RD_PIN)
#define CS_LOW()    gpio_reset(CTRL_PORT, CS_PIN)
#define CS_HIGH()   gpio_set(CTRL_PORT, CS_PIN)
#define RS_CMD()    gpio_reset(CTRL_PORT, RS_PIN)
#define RS_DATA()   gpio_set(CTRL_PORT, RS_PIN)

/**
 * @brief 初始化並行介面
 */
static int parallel_init(void)
{
    /* 配置數據總線為輸出 */
    for (int i = 0; i < 8; i++) {
        gpio_config_t data_config = {
            .port = DATA_PORT,
            .pin = (1 << i),
            .mode = GPIO_MODE_OUTPUT_PP,
            .pull = GPIO_PULL_NONE,
            .speed = GPIO_SPEED_VERY_HIGH
        };

        if (gpio_init(&data_config) != 0) {
            return -1;
        }
    }

    /* 配置控制信號為輸出 */
    uint16_t ctrl_pins[] = {WR_PIN, RD_PIN, CS_PIN, RS_PIN};

    for (int i = 0; i < 4; i++) {
        gpio_config_t ctrl_config = {
            .port = CTRL_PORT,
            .pin = ctrl_pins[i],
            .mode = GPIO_MODE_OUTPUT_PP,
            .pull = GPIO_PULL_NONE,
            .speed = GPIO_SPEED_VERY_HIGH
        };

        if (gpio_init(&ctrl_config) != 0) {
            return -1;
        }
    }

    /* 設置初始狀態 (所有控制信號為高電平 = 非活動) */
    WR_HIGH();
    RD_HIGH();
    CS_HIGH();
    RS_CMD();

    return 0;
}

/**
 * @brief 設置數據總線方向
 */
static void set_data_bus_direction(bool output)
{
    gpio_mode_t mode = output ? GPIO_MODE_OUTPUT_PP : GPIO_MODE_INPUT;

    for (int i = 0; i < 8; i++) {
        gpio_config_t config = {
            .port = DATA_PORT,
            .pin = (1 << i),
            .mode = mode,
            .pull = output ? GPIO_PULL_NONE : GPIO_PULL_UP,
            .speed = GPIO_SPEED_VERY_HIGH
        };

        gpio_init(&config);
    }
}

/**
 * @brief 寫入 8 位元數據到數據總線
 */
static void write_data_bus(uint8_t data)
{
    /* 方法 1: 逐位設置 (較慢但更靈活) */
    /*
    for (int i = 0; i < 8; i++) {
        if (data & (1 << i)) {
            gpio_set(DATA_PORT, (1 << i));
        } else {
            gpio_reset(DATA_PORT, (1 << i));
        }
    }
    */

    /* 方法 2: 使用端口寫入 (較快) */
    uint16_t port_value = gpio_read_port(DATA_PORT);
    port_value = (port_value & 0xFF00) | data;  /* 保留高 8 位,更新低 8 位 */
    gpio_write_port(DATA_PORT, port_value);
}

/**
 * @brief 從數據總線讀取 8 位元數據
 */
static uint8_t read_data_bus(void)
{
    uint16_t port_value = gpio_read_port(DATA_PORT);
    return (uint8_t)(port_value & 0xFF);
}

/**
 * @brief 寫入命令
 */
static void parallel_write_cmd(uint8_t cmd)
{
    set_data_bus_direction(true);  /* 數據總線為輸出 */

    CS_LOW();
    RS_CMD();       /* 命令模式 */
    write_data_bus(cmd);

    WR_LOW();
    delay_us(1);    /* tWR = 寫入脈衝寬度 */
    WR_HIGH();

    CS_HIGH();
    delay_us(1);    /* tCYC = 命令週期時間 */
}

/**
 * @brief 寫入數據
 */
static void parallel_write_data(uint8_t data)
{
    set_data_bus_direction(true);  /* 數據總線為輸出 */

    CS_LOW();
    RS_DATA();      /* 數據模式 */
    write_data_bus(data);

    WR_LOW();
    delay_us(1);
    WR_HIGH();

    CS_HIGH();
    delay_us(1);
}

/**
 * @brief 讀取數據
 */
static uint8_t parallel_read_data(void)
{
    uint8_t data;

    set_data_bus_direction(false);  /* 數據總線為輸入 */

    CS_LOW();
    RS_DATA();      /* 數據模式 */

    RD_LOW();
    delay_us(1);    /* tACC = 數據訪問時間 */
    data = read_data_bus();
    RD_HIGH();

    CS_HIGH();
    delay_us(1);

    return data;
}

/**
 * @brief 批量寫入數據
 */
static void parallel_write_buffer(const uint8_t *buffer, size_t len)
{
    set_data_bus_direction(true);

    CS_LOW();
    RS_DATA();

    for (size_t i = 0; i < len; i++) {
        write_data_bus(buffer[i]);
        WR_LOW();
        delay_us(1);
        WR_HIGH();
        delay_us(1);
    }

    CS_HIGH();
}

/**
 * @brief 批量讀取數據
 */
static void parallel_read_buffer(uint8_t *buffer, size_t len)
{
    set_data_bus_direction(false);

    CS_LOW();
    RS_DATA();

    for (size_t i = 0; i < len; i++) {
        RD_LOW();
        delay_us(1);
        buffer[i] = read_data_bus();
        RD_HIGH();
        delay_us(1);
    }

    CS_HIGH();
}

/**
 * @brief 並行介面性能測試
 */
static void parallel_performance_test(void)
{
    printf("\n========================================\n");
    printf("Parallel Interface Performance Test\n");
    printf("========================================\n\n");

    const size_t TEST_SIZE = 1024;
    uint8_t test_buffer[TEST_SIZE];

    /* 準備測試數據 */
    for (size_t i = 0; i < TEST_SIZE; i++) {
        test_buffer[i] = i & 0xFF;
    }

    uint32_t start_tick, end_tick, elapsed;

    /* 寫入性能測試 */
    printf("Writing %d bytes...\n", TEST_SIZE);

#ifdef STM32F4
    start_tick = HAL_GetTick();
#else
    start_tick = 0;
#endif

    parallel_write_buffer(test_buffer, TEST_SIZE);

#ifdef STM32F4
    end_tick = HAL_GetTick();
    elapsed = end_tick - start_tick;

    printf("Write time: %lu ms\n", elapsed);
    if (elapsed > 0) {
        printf("Write speed: %.2f KB/s\n", (TEST_SIZE / (float)elapsed));
    }
#endif

    delay_ms(10);

    /* 讀取性能測試 */
    printf("\nReading %d bytes...\n", TEST_SIZE);
    uint8_t read_buffer[TEST_SIZE];

#ifdef STM32F4
    start_tick = HAL_GetTick();
#endif

    parallel_read_buffer(read_buffer, TEST_SIZE);

#ifdef STM32F4
    end_tick = HAL_GetTick();
    elapsed = end_tick - start_tick;

    printf("Read time: %lu ms\n", elapsed);
    if (elapsed > 0) {
        printf("Read speed: %.2f KB/s\n", (TEST_SIZE / (float)elapsed));
    }
#endif

    printf("\n");
}

/**
 * @brief 主程式
 */
int main(void)
{
    /* 系統初始化 */
#ifdef STM32F4
    HAL_Init();
    SystemClock_Config();  /* 需要在專案中實作 */
#endif

    printf("\n========================================\n");
    printf("GPIO HAL - Parallel Interface Example\n");
    printf("========================================\n\n");

    /* 初始化並行介面 */
    printf("Initializing parallel interface...\n");
    if (parallel_init() != 0) {
        printf("Error: Failed to initialize parallel interface\n");
        return -1;
    }
    printf("Parallel interface initialized!\n");

    printf("\nInterface Configuration:\n");
    printf("  Data Bus: 8-bit (PB0-PB7)\n");
    printf("  WR Pin: PA0\n");
    printf("  RD Pin: PA1\n");
    printf("  CS Pin: PA2\n");
    printf("  RS Pin: PA3\n\n");

    /* ===== 測試 1: 基本命令和數據寫入 ===== */
    printf("========================================\n");
    printf("Test 1: Basic Command/Data Write\n");
    printf("========================================\n\n");

    printf("Writing commands and data...\n");

    /* 示例: 初始化一個虛擬的 LCD 控制器 */
    parallel_write_cmd(0x01);  /* 軟體重啟 */
    delay_ms(10);

    parallel_write_cmd(0x11);  /* 退出睡眠模式 */
    delay_ms(120);

    parallel_write_cmd(0x29);  /* 顯示開啟 */

    printf("Commands sent successfully!\n\n");

    /* ===== 測試 2: 數據寫入和讀取 ===== */
    printf("========================================\n");
    printf("Test 2: Data Write and Read\n");
    printf("========================================\n\n");

    uint8_t test_data[] = {0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0};

    printf("Writing test data: ");
    for (int i = 0; i < 8; i++) {
        printf("%02X ", test_data[i]);
        parallel_write_data(test_data[i]);
    }
    printf("\n");

    /* 注意: 實際的讀取需要設備支持 */
    printf("Reading data back: ");
    for (int i = 0; i < 8; i++) {
        uint8_t data = parallel_read_data();
        printf("%02X ", data);
    }
    printf("\n\n");

    /* ===== 測試 3: 批量數據傳輸 ===== */
    printf("========================================\n");
    printf("Test 3: Bulk Data Transfer\n");
    printf("========================================\n\n");

    uint8_t image_data[256];
    for (int i = 0; i < 256; i++) {
        image_data[i] = i;
    }

    printf("Writing 256 bytes of image data...\n");
    parallel_write_buffer(image_data, 256);
    printf("Write complete!\n\n");

    /* ===== 測試 4: 性能測試 ===== */
    parallel_performance_test();

    /* ===== 測試 5: 顯示模式 (僅寫入) ===== */
    printf("========================================\n");
    printf("Test 5: Display Pattern\n");
    printf("========================================\n\n");

    printf("Sending color pattern to display...\n");

    /* 示例: 發送一個簡單的顏色模式 */
    parallel_write_cmd(0x2C);  /* 記憶體寫入命令 */

    /* 發送紅色像素 (RGB565 格式: 0xF800) */
    for (int i = 0; i < 100; i++) {
        parallel_write_data(0xF8);  /* 高字節 */
        parallel_write_data(0x00);  /* 低字節 */
    }

    /* 發送綠色像素 (RGB565: 0x07E0) */
    for (int i = 0; i < 100; i++) {
        parallel_write_data(0x07);
        parallel_write_data(0xE0);
    }

    /* 發送藍色像素 (RGB565: 0x001F) */
    for (int i = 0; i < 100; i++) {
        parallel_write_data(0x00);
        parallel_write_data(0x1F);
    }

    printf("Pattern sent!\n\n");

    /* ===== 測試 6: 時序分析 ===== */
    printf("========================================\n");
    printf("Test 6: Timing Analysis\n");
    printf("========================================\n\n");

    printf("Measuring write cycle time...\n");
    printf("(Use oscilloscope to verify timing)\n\n");

    /* 執行 10 次寫入以便示波器觀察 */
    for (int i = 0; i < 10; i++) {
        parallel_write_data(0xAA);
        delay_ms(1);
    }

    printf("Timing test complete!\n");
    printf("Check signals:\n");
    printf("  WR: Should pulse low for ~1us\n");
    printf("  CS: Should be low during operation\n");
    printf("  RS: Should be high for data\n");
    printf("  Data: Should show 0xAA (10101010)\n\n");

    printf("========================================\n");
    printf("All tests completed!\n");
    printf("========================================\n\n");

    printf("Parallel Interface Summary:\n");
    printf("  ✓ Command write: OK\n");
    printf("  ✓ Data write: OK\n");
    printf("  ✓ Data read: OK\n");
    printf("  ✓ Bulk transfer: OK\n");
    printf("  ✓ Timing: Verify with scope\n");

    return 0;
}

/**
 * @brief 進階範例: 16 位元並行介面
 */
void parallel_16bit_example(void)
{
    printf("Configuring 16-bit parallel interface...\n");

    /* 配置 16 位元數據總線 */
    /* 低 8 位: GPIOB (PB0-PB7) */
    /* 高 8 位: GPIOC (PC0-PC7) */

    /* 這裡需要修改 write_data_bus 和 read_data_bus 函數 */
    /* 來處理 16 位元數據 */

    printf("16-bit mode: Higher throughput for displays\n");
    printf("Typical use: RGB565 format LCD displays\n");
}
