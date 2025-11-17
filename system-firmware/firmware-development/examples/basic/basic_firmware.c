/**
 * @file basic_firmware.c
 * @brief 基本韌體框架範例
 * @description 展示基本的韌體結構，包含初始化、主循環和任務調度
 */

#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>

// ============================================================================
// 韌體版本資訊
// ============================================================================
#define FW_VERSION_MAJOR    1
#define FW_VERSION_MINOR    0
#define FW_VERSION_PATCH    0
#define FW_BUILD_NUMBER     100

typedef struct {
    uint8_t major;
    uint8_t minor;
    uint8_t patch;
    uint16_t build;
    char git_hash[8];
    uint32_t build_timestamp;
} firmware_version_t;

const firmware_version_t firmware_version = {
    .major = FW_VERSION_MAJOR,
    .minor = FW_VERSION_MINOR,
    .patch = FW_VERSION_PATCH,
    .build = FW_BUILD_NUMBER,
    .git_hash = "a1b2c3d",
    .build_timestamp = 1700000000  // Unix timestamp
};

// ============================================================================
// 硬體抽象層
// ============================================================================

// GPIO 配置
typedef enum {
    GPIO_LED_STATUS = 0,
    GPIO_LED_ERROR,
    GPIO_BUTTON_USER,
    GPIO_MAX
} gpio_pin_t;

void gpio_init(void) {
    printf("[HAL] GPIO 初始化完成\n");
    // 實際硬體上會配置 GPIO 引腳
}

void gpio_set(gpio_pin_t pin, bool state) {
    printf("[HAL] GPIO %d 設置為 %d\n", pin, state);
}

bool gpio_read(gpio_pin_t pin) {
    // 實際讀取 GPIO 狀態
    return false;
}

// 時鐘配置
void clock_init(void) {
    printf("[HAL] 系統時鐘初始化 (168MHz)\n");
    // 配置系統時鐘到 168MHz (例如 STM32F4)
}

// UART 配置
void uart_init(void) {
    printf("[HAL] UART 初始化 (115200 8N1)\n");
}

void uart_send(const char *data, uint32_t len) {
    printf("[UART] TX: %.*s", len, data);
}

// 看門狗配置
void watchdog_init(void) {
    printf("[HAL] 看門狗初始化 (5秒超時)\n");
}

void watchdog_refresh(void) {
    // 餵狗操作
    static uint32_t feed_count = 0;
    feed_count++;
    if (feed_count % 1000 == 0) {
        printf("[WDT] 看門狗餵食 (%u)\n", feed_count);
    }
}

// 定時器
uint32_t get_tick_count(void) {
    static uint32_t tick = 0;
    return tick++;
}

void delay_ms(uint32_t ms) {
    uint32_t start = get_tick_count();
    while ((get_tick_count() - start) < ms);
}

// ============================================================================
// 任務調度器
// ============================================================================

typedef void (*task_func_t)(void);

typedef struct {
    task_func_t func;
    uint32_t period_ms;
    uint32_t last_run;
    bool enabled;
    const char *name;
} task_t;

// 任務函數定義
void task_led_blink(void) {
    static bool led_state = false;
    led_state = !led_state;
    gpio_set(GPIO_LED_STATUS, led_state);
}

void task_status_report(void) {
    printf("[STATUS] 系統運行正常 - Uptime: %u ms\n", get_tick_count());
    printf("         韌體版本: v%d.%d.%d (Build %d)\n",
           firmware_version.major,
           firmware_version.minor,
           firmware_version.patch,
           firmware_version.build);
}

void task_button_check(void) {
    static bool last_button_state = false;
    bool current_state = gpio_read(GPIO_BUTTON_USER);

    if (current_state && !last_button_state) {
        printf("[BUTTON] 用戶按鈕按下\n");
        // 處理按鈕事件
    }

    last_button_state = current_state;
}

void task_system_monitor(void) {
    // 監控系統狀態
    uint32_t stack_usage = 1024; // 模擬堆疊使用量
    uint32_t heap_free = 32768;  // 模擬堆積空閒空間

    printf("[MONITOR] Stack: %u bytes, Heap Free: %u bytes\n",
           stack_usage, heap_free);
}

// 任務列表
task_t task_list[] = {
    { task_led_blink,     500,  0, true,  "LED Blink" },
    { task_status_report, 5000, 0, true,  "Status Report" },
    { task_button_check,  50,   0, true,  "Button Check" },
    { task_system_monitor, 10000, 0, true, "System Monitor" },
};

#define TASK_COUNT (sizeof(task_list) / sizeof(task_t))

void task_scheduler_init(void) {
    printf("[SCHEDULER] 任務調度器初始化 (%d 個任務)\n", TASK_COUNT);
    for (uint32_t i = 0; i < TASK_COUNT; i++) {
        printf("  - Task %u: %s (Period: %u ms)\n",
               i, task_list[i].name, task_list[i].period_ms);
    }
}

void task_scheduler_run(void) {
    uint32_t current_time = get_tick_count();

    for (uint32_t i = 0; i < TASK_COUNT; i++) {
        if (!task_list[i].enabled) {
            continue;
        }

        if ((current_time - task_list[i].last_run) >= task_list[i].period_ms) {
            task_list[i].func();
            task_list[i].last_run = current_time;
        }
    }
}

// ============================================================================
// 韌體初始化
// ============================================================================

void firmware_init(void) {
    printf("\n");
    printf("========================================\n");
    printf("  韌體啟動中...\n");
    printf("  版本: v%d.%d.%d (Build %d)\n",
           firmware_version.major,
           firmware_version.minor,
           firmware_version.patch,
           firmware_version.build);
    printf("  Git: %s\n", firmware_version.git_hash);
    printf("========================================\n\n");

    // 1. 時鐘初始化
    clock_init();

    // 2. GPIO 初始化
    gpio_init();

    // 3. UART 初始化
    uart_init();

    // 4. 看門狗初始化
    watchdog_init();

    // 5. 任務調度器初始化
    task_scheduler_init();

    printf("\n[INIT] 系統初始化完成！\n\n");
}

// ============================================================================
// 低功耗模式
// ============================================================================

void enter_sleep_mode(void) {
    // 進入淺睡眠模式
    // 實際硬體上會配置 CPU 進入睡眠
    // __WFI(); // Wait For Interrupt
}

// ============================================================================
// 主程式
// ============================================================================

int main(void) {
    // 系統初始化
    firmware_init();

    // 主循環
    uint32_t loop_count = 0;
    while (1) {
        // 餵狗
        watchdog_refresh();

        // 執行任務調度
        task_scheduler_run();

        // 低功耗模式 (可選)
        // enter_sleep_mode();

        // 簡單延遲 (實際應用中會用中斷喚醒)
        delay_ms(1);

        loop_count++;

        // 示例：運行一段時間後退出 (實際韌體會一直運行)
        if (loop_count > 30000) {
            printf("\n[DEMO] 範例運行完成\n");
            break;
        }
    }

    return 0;
}

// ============================================================================
// 中斷處理函數 (範例)
// ============================================================================

void SysTick_Handler(void) {
    // 系統滴答中斷
    // 每 1ms 調用一次
}

void EXTI0_IRQHandler(void) {
    // 外部中斷處理
    printf("[IRQ] 外部中斷觸發\n");
}

void HardFault_Handler(void) {
    // 硬體故障處理
    printf("[FAULT] 硬體故障！系統停止\n");
    while (1) {
        gpio_set(GPIO_LED_ERROR, true);
        delay_ms(100);
        gpio_set(GPIO_LED_ERROR, false);
        delay_ms(100);
    }
}
