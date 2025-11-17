/**
 * @file button_interrupt.c
 * @brief GPIO 中斷與按鈕處理範例
 *
 * 此範例示範如何使用 GPIO HAL 的中斷功能處理按鈕輸入
 * 包括消抖動、長按檢測和多按鈕處理
 */

#include "gpio_hal.h"
#include <stdio.h>
#include <stdbool.h>

/* 平台相關的延遲函數 */
#ifdef STM32F4
    #include "stm32f4xx_hal.h"
    #define delay_ms(x) HAL_Delay(x)
    #define get_tick() HAL_GetTick()
#elif defined(ESP32)
    #include "freertos/FreeRTOS.h"
    #include "freertos/task.h"
    #include "esp_timer.h"
    #define delay_ms(x) vTaskDelay((x) / portTICK_PERIOD_MS)
    #define get_tick() (esp_timer_get_time() / 1000)
#else
    #define delay_ms(x) /* 需要實作 */
    #define get_tick() 0
#endif

/* 按鈕和 LED 配置 */
#ifdef STM32F4
    /* STM32F407 Discovery 板 */
    #define BUTTON_PORT     GPIO_PORT_A      /* User button */
    #define BUTTON_PIN      GPIO_PIN_0
    #define LED_PORT        GPIO_PORT_D
    #define LED_GREEN       GPIO_PIN_12
    #define LED_ORANGE      GPIO_PIN_13
    #define LED_RED         GPIO_PIN_14
    #define LED_BLUE        GPIO_PIN_15
#elif defined(ESP32)
    #define BUTTON_PORT     GPIO_PORT_0
    #define BUTTON_PIN      GPIO_PIN_0       /* GPIO0 = BOOT button */
    #define LED_PORT        GPIO_PORT_0
    #define LED_GREEN       GPIO_PIN_2
    #define LED_ORANGE      GPIO_PIN_4
    #define LED_RED         GPIO_PIN_5
    #define LED_BLUE        GPIO_PIN_18
#else
    #define BUTTON_PORT     GPIO_PORT_A
    #define BUTTON_PIN      GPIO_PIN_0
    #define LED_PORT        GPIO_PORT_B
    #define LED_GREEN       GPIO_PIN_0
    #define LED_ORANGE      GPIO_PIN_1
    #define LED_RED         GPIO_PIN_2
    #define LED_BLUE        GPIO_PIN_3
#endif

/* 消抖動參數 */
#define DEBOUNCE_TIME_MS    50      /* 消抖動時間 */
#define LONG_PRESS_TIME_MS  1000    /* 長按時間閾值 */

/* 按鈕狀態 */
typedef enum {
    BUTTON_STATE_RELEASED,
    BUTTON_STATE_PRESSED,
    BUTTON_STATE_LONG_PRESS
} button_state_t;

/* 按鈕事件 */
typedef enum {
    BUTTON_EVENT_NONE,
    BUTTON_EVENT_PRESS,
    BUTTON_EVENT_RELEASE,
    BUTTON_EVENT_CLICK,
    BUTTON_EVENT_DOUBLE_CLICK,
    BUTTON_EVENT_LONG_PRESS
} button_event_t;

/* 按鈕數據結構 */
typedef struct {
    button_state_t state;
    uint32_t last_change_time;
    uint32_t press_start_time;
    uint32_t last_click_time;
    uint8_t click_count;
    bool long_press_triggered;
} button_data_t;

/* 全局變量 */
static volatile button_data_t button_data = {0};
static volatile uint32_t interrupt_count = 0;
static volatile button_event_t last_event = BUTTON_EVENT_NONE;

/**
 * @brief 按鈕中斷回調函數
 *
 * 在中斷上下文中執行,應保持簡短
 */
static void button_irq_callback(void)
{
    interrupt_count++;

    /* 記錄中斷時間用於消抖動 */
    uint32_t now = get_tick();

    /* 簡單的消抖動: 忽略太快的中斷 */
    if (now - button_data.last_change_time < DEBOUNCE_TIME_MS) {
        return;
    }

    button_data.last_change_time = now;

    /* 讀取按鈕狀態 */
    bool pressed = !gpio_read(BUTTON_PORT, BUTTON_PIN);  /* 假設低電平有效 */

    if (pressed) {
        /* 按下 */
        button_data.state = BUTTON_STATE_PRESSED;
        button_data.press_start_time = now;
        button_data.long_press_triggered = false;
        last_event = BUTTON_EVENT_PRESS;

        /* LED 指示 */
        gpio_set(LED_PORT, LED_GREEN);
    } else {
        /* 釋放 */
        if (button_data.state == BUTTON_STATE_PRESSED ||
            button_data.state == BUTTON_STATE_LONG_PRESS) {

            button_data.state = BUTTON_STATE_RELEASED;
            last_event = BUTTON_EVENT_RELEASE;

            /* 檢測點擊 */
            uint32_t press_duration = now - button_data.press_start_time;

            if (press_duration < LONG_PRESS_TIME_MS && !button_data.long_press_triggered) {
                /* 短按 = 點擊 */
                if (now - button_data.last_click_time < 400) {
                    /* 雙擊 */
                    button_data.click_count++;
                    if (button_data.click_count >= 2) {
                        last_event = BUTTON_EVENT_DOUBLE_CLICK;
                        button_data.click_count = 0;
                    }
                } else {
                    /* 單擊 */
                    last_event = BUTTON_EVENT_CLICK;
                    button_data.click_count = 1;
                }

                button_data.last_click_time = now;
            }

            /* LED 指示 */
            gpio_reset(LED_PORT, LED_GREEN);
        }
    }
}

/**
 * @brief 檢測長按 (在主循環中調用)
 */
static void check_long_press(void)
{
    if (button_data.state == BUTTON_STATE_PRESSED &&
        !button_data.long_press_triggered) {

        uint32_t now = get_tick();
        uint32_t press_duration = now - button_data.press_start_time;

        if (press_duration >= LONG_PRESS_TIME_MS) {
            button_data.state = BUTTON_STATE_LONG_PRESS;
            button_data.long_press_triggered = true;
            last_event = BUTTON_EVENT_LONG_PRESS;

            /* LED 指示 */
            gpio_set(LED_PORT, LED_ORANGE);
        }
    }
}

/**
 * @brief 處理按鈕事件
 */
static void handle_button_event(button_event_t event)
{
    switch (event) {
        case BUTTON_EVENT_PRESS:
            printf("Button PRESSED\n");
            break;

        case BUTTON_EVENT_RELEASE:
            printf("Button RELEASED\n");
            gpio_reset(LED_PORT, LED_ORANGE);
            break;

        case BUTTON_EVENT_CLICK:
            printf("Button CLICKED\n");
            gpio_toggle(LED_PORT, LED_BLUE);
            break;

        case BUTTON_EVENT_DOUBLE_CLICK:
            printf("Button DOUBLE-CLICKED\n");
            gpio_toggle(LED_PORT, LED_RED);
            break;

        case BUTTON_EVENT_LONG_PRESS:
            printf("Button LONG-PRESSED\n");
            /* 長按效果: 所有 LED 閃爍 */
            for (int i = 0; i < 3; i++) {
                gpio_set(LED_PORT, LED_GREEN | LED_ORANGE | LED_RED | LED_BLUE);
                delay_ms(100);
                gpio_reset(LED_PORT, LED_GREEN | LED_ORANGE | LED_RED | LED_BLUE);
                delay_ms(100);
            }
            break;

        default:
            break;
    }
}

/**
 * @brief 初始化 LED
 */
static int init_leds(void)
{
    uint16_t led_pins[] = {LED_GREEN, LED_ORANGE, LED_RED, LED_BLUE};

    for (int i = 0; i < 4; i++) {
        gpio_config_t led_config = {
            .port = LED_PORT,
            .pin = led_pins[i],
            .mode = GPIO_MODE_OUTPUT_PP,
            .pull = GPIO_PULL_NONE,
            .speed = GPIO_SPEED_LOW
        };

        if (gpio_init(&led_config) != 0) {
            return -1;
        }

        /* 確保 LED 初始為熄滅 */
        gpio_reset(LED_PORT, led_pins[i]);
    }

    return 0;
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
    printf("GPIO HAL - Button Interrupt Example\n");
    printf("========================================\n\n");

    /* 初始化 LED */
    printf("Initializing LEDs...\n");
    if (init_leds() != 0) {
        printf("Error: Failed to initialize LEDs\n");
        return -1;
    }
    printf("LEDs initialized\n");

    /* 配置按鈕為輸入 */
    printf("Configuring button...\n");
    gpio_config_t button_config = {
        .port = BUTTON_PORT,
        .pin = BUTTON_PIN,
        .mode = GPIO_MODE_INPUT,
        .pull = GPIO_PULL_UP,  /* 內部上拉 */
        .speed = GPIO_SPEED_LOW
    };

    if (gpio_init(&button_config) != 0) {
        printf("Error: Failed to initialize button GPIO\n");
        return -1;
    }
    printf("Button GPIO initialized\n");

    /* 設置中斷 */
    printf("Setting up interrupt...\n");
    if (gpio_set_interrupt(BUTTON_PORT, BUTTON_PIN,
                          GPIO_IRQ_BOTH,  /* 雙邊沿觸發 */
                          button_irq_callback) != 0) {
        printf("Error: Failed to set interrupt\n");
        return -1;
    }

    if (gpio_enable_interrupt(BUTTON_PORT, BUTTON_PIN) != 0) {
        printf("Error: Failed to enable interrupt\n");
        return -1;
    }

    printf("Interrupt enabled!\n\n");

    printf("========================================\n");
    printf("Button Functions:\n");
    printf("  Single Click:  Toggle blue LED\n");
    printf("  Double Click:  Toggle red LED\n");
    printf("  Long Press:    Flash all LEDs\n");
    printf("========================================\n\n");

    printf("Press the button to test...\n");
    printf("(Press Ctrl+C to exit)\n\n");

    /* LED 啟動指示 */
    for (int i = 0; i < 2; i++) {
        gpio_set(LED_PORT, LED_GREEN);
        delay_ms(100);
        gpio_reset(LED_PORT, LED_GREEN);
        delay_ms(100);
    }

    /* 主循環 */
    button_event_t current_event;
    uint32_t last_stats_time = get_tick();

    while (1) {
        /* 檢測長按 */
        check_long_press();

        /* 處理事件 */
        current_event = last_event;
        if (current_event != BUTTON_EVENT_NONE) {
            handle_button_event(current_event);
            last_event = BUTTON_EVENT_NONE;
        }

        /* 每 5 秒顯示統計信息 */
        uint32_t now = get_tick();
        if (now - last_stats_time >= 5000) {
            printf("\n--- Statistics ---\n");
            printf("Interrupt count: %lu\n", interrupt_count);
            printf("Button state: %s\n",
                   button_data.state == BUTTON_STATE_RELEASED ? "Released" :
                   button_data.state == BUTTON_STATE_PRESSED ? "Pressed" :
                   "Long Pressed");
            printf("------------------\n\n");
            last_stats_time = now;
        }

        /* 短暫延遲 */
        delay_ms(10);
    }

    /* 清理 (永遠不會執行到這裡) */
    gpio_disable_interrupt(BUTTON_PORT, BUTTON_PIN);
    gpio_clear_interrupt(BUTTON_PORT, BUTTON_PIN);

    return 0;
}

/**
 * @brief 進階範例: 多按鈕處理
 */
void multi_button_example(void)
{
    /* 定義多個按鈕 */
    typedef struct {
        void *port;
        uint16_t pin;
        const char *name;
        button_data_t data;
    } multi_button_t;

    multi_button_t buttons[] = {
        {BUTTON_PORT, GPIO_PIN_0, "Button 1", {0}},
        {BUTTON_PORT, GPIO_PIN_1, "Button 2", {0}},
        {BUTTON_PORT, GPIO_PIN_2, "Button 3", {0}},
        {BUTTON_PORT, GPIO_PIN_3, "Button 4", {0}}
    };

    /* 為每個按鈕設置中斷 */
    for (int i = 0; i < 4; i++) {
        gpio_config_t config = {
            .port = buttons[i].port,
            .pin = buttons[i].pin,
            .mode = GPIO_MODE_INPUT,
            .pull = GPIO_PULL_UP,
            .speed = GPIO_SPEED_LOW
        };

        gpio_init(&config);

        /* 這裡需要為每個按鈕設置不同的回調 */
        /* 或者使用共享回調並在回調中識別按鈕 */
    }

    printf("Multi-button example initialized\n");
    printf("Each button controls a different function\n");
}
