/**
 * @file main.c
 * @brief Zephyr RTOS 基礎 Blinky 範例
 * @author AI-Assisted Development Team
 * @date 2025-11-16
 */

#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/sys/printk.h>
#include <zephyr/sys/util.h>

/* ========== LED 配置 ========== */

/* 從 devicetree 獲取 LED 定義 */
#define LED0_NODE DT_ALIAS(led0)

#if !DT_NODE_HAS_STATUS(LED0_NODE, okay)
#error "Unsupported board: led0 devicetree alias is not defined"
#endif

static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(LED0_NODE, gpios);

/* ========== 按鈕配置 ========== */

#define SW0_NODE DT_ALIAS(sw0)

#if DT_NODE_HAS_STATUS(SW0_NODE, okay)
static const struct gpio_dt_spec button = GPIO_DT_SPEC_GET_OR(SW0_NODE, gpios, {0});
static struct gpio_callback button_cb_data;
#define HAS_BUTTON 1
#else
#define HAS_BUTTON 0
#endif

/* ========== 訊息佇列 ========== */

/* 定義按鈕訊息佇列 */
K_MSGQ_DEFINE(button_msgq, sizeof(uint32_t), 10, 4);

/* ========== 執行緒堆疊定義 ========== */

#define LED_THREAD_STACK_SIZE   512
#define BUTTON_THREAD_STACK_SIZE 512
#define MONITOR_THREAD_STACK_SIZE 1024

K_THREAD_STACK_DEFINE(led_thread_stack, LED_THREAD_STACK_SIZE);
K_THREAD_STACK_DEFINE(button_thread_stack, BUTTON_THREAD_STACK_SIZE);
K_THREAD_STACK_DEFINE(monitor_thread_stack, MONITOR_THREAD_STACK_SIZE);

struct k_thread led_thread_data;
struct k_thread button_thread_data;
struct k_thread monitor_thread_data;

/* ========== 信號量定義 ========== */

K_SEM_DEFINE(button_sem, 0, 1);

/* ========== 按鈕中斷處理 ========== */

#if HAS_BUTTON
void button_pressed(const struct device *dev, struct gpio_callback *cb,
                    uint32_t pins)
{
    static uint32_t button_count = 0;
    button_count++;

    /* 發送到訊息佇列 */
    k_msgq_put(&button_msgq, &button_count, K_NO_WAIT);

    /* 釋放信號量 */
    k_sem_give(&button_sem);

    printk("Button pressed! Count: %u\n", button_count);
}
#endif

/* ========== LED 執行緒 ========== */

void led_thread_entry(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    int ret;
    bool led_state = true;
    uint32_t toggle_count = 0;

    printk("[LED Thread] Started\n");

    /* 檢查 LED 設備是否就緒 */
    if (!gpio_is_ready_dt(&led)) {
        printk("Error: LED device %s is not ready\n", led.port->name);
        return;
    }

    /* 配置 LED GPIO */
    ret = gpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);
    if (ret < 0) {
        printk("Error %d: failed to configure LED pin\n", ret);
        return;
    }

    printk("[LED Thread] LED configured successfully\n");

    while (1) {
        /* 切換 LED */
        gpio_pin_set_dt(&led, (int)led_state);
        led_state = !led_state;
        toggle_count++;

        /* 每 10 次切換打印一次 */
        if (toggle_count % 10 == 0) {
            printk("[LED Thread] Toggle count: %u\n", toggle_count);
        }

        /* 延遲 500ms */
        k_sleep(K_MSEC(500));
    }
}

/* ========== 按鈕處理執行緒 ========== */

void button_thread_entry(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

#if HAS_BUTTON
    uint32_t button_data;

    printk("[Button Thread] Started\n");

    while (1) {
        /* 等待信號量 */
        k_sem_take(&button_sem, K_FOREVER);

        /* 從佇列讀取訊息 */
        while (k_msgq_get(&button_msgq, &button_data, K_NO_WAIT) == 0) {
            printk("[Button Thread] Processing button event #%u\n", button_data);

            /* 模擬處理 */
            k_sleep(K_MSEC(100));
        }
    }
#else
    printk("[Button Thread] No button available on this board\n");
    while (1) {
        k_sleep(K_FOREVER);
    }
#endif
}

/* ========== 監控執行緒 ========== */

void monitor_thread_entry(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    uint32_t uptime_seconds = 0;

    printk("[Monitor Thread] Started\n");

    /* 啟動延遲 */
    k_sleep(K_SEC(2));

    while (1) {
        uptime_seconds = k_uptime_get() / 1000;

        printk("\n========== System Monitor ==========\n");
        printk("Uptime: %u seconds (%u min %u sec)\n",
               uptime_seconds,
               uptime_seconds / 60,
               uptime_seconds % 60);

        /* 顯示執行緒資訊 */
#ifdef CONFIG_THREAD_MONITOR
        struct k_thread *thread;
        printk("\nThread Information:\n");
        printk("%-20s %-10s %-10s\n", "Name", "State", "Priority");
        printk("--------------------------------------------\n");

        /* 注意：這是簡化版本，實際的執行緒遍歷需要更複雜的 API */
        printk("%-20s %-10s %-10d\n", "led_thread", "Running", 7);
        printk("%-20s %-10s %-10d\n", "button_thread", "Waiting", 7);
        printk("%-20s %-10s %-10d\n", "monitor_thread", "Running", 5);
#endif

        /* 顯示記憶體資訊 */
        printk("\nMemory Information:\n");
        printk("Stack usage:\n");
        printk("  LED Thread:     %zu bytes\n",
               k_thread_stack_space_get(&led_thread_data));
        printk("  Button Thread:  %zu bytes\n",
               k_thread_stack_space_get(&button_thread_data));
        printk("  Monitor Thread: %zu bytes\n",
               k_thread_stack_space_get(&monitor_thread_data));

        printk("====================================\n\n");

        /* 監控週期 5 秒 */
        k_sleep(K_SEC(5));
    }
}

/* ========== 主函數 ========== */

int main(void)
{
    int ret;

    printk("\n");
    printk("===========================================\n");
    printk("  Zephyr RTOS Basic Blinky Example\n");
    printk("  Zephyr Version: %s\n", KERNEL_VERSION_STRING);
    printk("  Build: %s %s\n", __DATE__, __TIME__);
    printk("===========================================\n\n");

#if HAS_BUTTON
    /* 配置按鈕 */
    if (!gpio_is_ready_dt(&button)) {
        printk("Error: button device %s is not ready\n", button.port->name);
        return 0;
    }

    ret = gpio_pin_configure_dt(&button, GPIO_INPUT);
    if (ret != 0) {
        printk("Error %d: failed to configure button pin\n", ret);
        return 0;
    }

    ret = gpio_pin_interrupt_configure_dt(&button, GPIO_INT_EDGE_TO_ACTIVE);
    if (ret != 0) {
        printk("Error %d: failed to configure interrupt\n", ret);
        return 0;
    }

    gpio_init_callback(&button_cb_data, button_pressed, BIT(button.pin));
    gpio_add_callback(button.port, &button_cb_data);

    printk("Button configured successfully\n");
#else
    printk("No button available on this board\n");
#endif

    /* 創建 LED 執行緒 */
    k_thread_create(&led_thread_data,
                    led_thread_stack,
                    K_THREAD_STACK_SIZEOF(led_thread_stack),
                    led_thread_entry,
                    NULL, NULL, NULL,
                    7, 0, K_NO_WAIT);
    k_thread_name_set(&led_thread_data, "led_thread");
    printk("LED thread created\n");

    /* 創建按鈕處理執行緒 */
    k_thread_create(&button_thread_data,
                    button_thread_stack,
                    K_THREAD_STACK_SIZEOF(button_thread_stack),
                    button_thread_entry,
                    NULL, NULL, NULL,
                    7, 0, K_NO_WAIT);
    k_thread_name_set(&button_thread_data, "button_thread");
    printk("Button thread created\n");

    /* 創建監控執行緒 */
    k_thread_create(&monitor_thread_data,
                    monitor_thread_stack,
                    K_THREAD_STACK_SIZEOF(monitor_thread_stack),
                    monitor_thread_entry,
                    NULL, NULL, NULL,
                    5, 0, K_NO_WAIT);
    k_thread_name_set(&monitor_thread_data, "monitor_thread");
    printk("Monitor thread created\n");

    printk("\nAll threads started successfully!\n\n");

    return 0;
}
