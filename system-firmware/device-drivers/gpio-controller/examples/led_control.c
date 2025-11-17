/*
 * GPIO LED 控制範例
 *
 * 此範例展示如何使用 GPIO 控制 LED，包括：
 * - LED 閃爍
 * - PWM 模擬（亮度控制）
 * - 多 LED 模式
 * - 呼吸燈效果
 */

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <errno.h>
#include <signal.h>
#include <time.h>

#define GPIO_PATH "/sys/class/gpio"
#define MAX_LEDS 4

/* LED 配置結構 */
typedef struct {
    int gpio;
    int fd;
    int state;
} led_t;

static int running = 1;

/* 信號處理 */
void signal_handler(int sig) {
    running = 0;
}

/* GPIO 輔助函數 */
int gpio_export(int gpio) {
    int fd, len;
    char buf[64];

    fd = open(GPIO_PATH "/export", O_WRONLY);
    if (fd < 0) {
        return -1;
    }

    len = snprintf(buf, sizeof(buf), "%d", gpio);
    if (write(fd, buf, len) < 0) {
        if (errno != EBUSY) {
            close(fd);
            return -1;
        }
    }

    close(fd);
    return 0;
}

int gpio_unexport(int gpio) {
    int fd, len;
    char buf[64];

    fd = open(GPIO_PATH "/unexport", O_WRONLY);
    if (fd < 0) {
        return -1;
    }

    len = snprintf(buf, sizeof(buf), "%d", gpio);
    write(fd, buf, len);
    close(fd);
    return 0;
}

int gpio_set_direction(int gpio, const char *direction) {
    int fd;
    char path[128];

    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/direction", gpio);
    fd = open(path, O_WRONLY);
    if (fd < 0) {
        return -1;
    }

    write(fd, direction, strlen(direction));
    close(fd);
    return 0;
}

/* LED 初始化 */
int led_init(led_t *led, int gpio) {
    char path[128];

    led->gpio = gpio;
    led->state = 0;

    /* 導出 GPIO */
    if (gpio_export(gpio) < 0) {
        fprintf(stderr, "Failed to export GPIO %d\n", gpio);
        return -1;
    }

    usleep(100000);

    /* 設置為輸出 */
    if (gpio_set_direction(gpio, "out") < 0) {
        fprintf(stderr, "Failed to set direction for GPIO %d\n", gpio);
        return -1;
    }

    /* 打開 value 文件以便快速訪問 */
    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/value", gpio);
    led->fd = open(path, O_WRONLY);
    if (led->fd < 0) {
        fprintf(stderr, "Failed to open value for GPIO %d\n", gpio);
        return -1;
    }

    return 0;
}

/* LED 清理 */
void led_cleanup(led_t *led) {
    if (led->fd >= 0) {
        close(led->fd);
    }
    gpio_unexport(led->gpio);
}

/* LED 開關 */
void led_set(led_t *led, int state) {
    char value = state ? '1' : '0';
    if (led->fd >= 0) {
        lseek(led->fd, 0, SEEK_SET);
        write(led->fd, &value, 1);
        led->state = state;
    }
}

/* LED 切換 */
void led_toggle(led_t *led) {
    led_set(led, !led->state);
}

/* 範例 1: LED 簡單閃爍 */
void example_blink() {
    led_t led;
    int count = 10;

    printf("=== LED 閃爍範例 ===\n");
    printf("LED 將閃爍 %d 次\n", count);

    if (led_init(&led, 17) < 0) {
        fprintf(stderr, "Failed to initialize LED\n");
        return;
    }

    for (int i = 0; i < count && running; i++) {
        printf("閃爍 %d/%d\n", i + 1, count);
        led_set(&led, 1);
        usleep(500000);  /* 500ms */
        led_set(&led, 0);
        usleep(500000);
    }

    led_cleanup(&led);
    printf("LED 閃爍範例完成\n\n");
}

/* 範例 2: PWM 軟體模擬（亮度控制） */
void example_pwm() {
    led_t led;
    int duty_cycle;
    int period_us = 2000;  /* 2ms 周期 = 500Hz */

    printf("=== LED PWM 亮度控制範例 ===\n");
    printf("使用軟體 PWM 控制 LED 亮度\n");

    if (led_init(&led, 17) < 0) {
        fprintf(stderr, "Failed to initialize LED\n");
        return;
    }

    /* 從暗到亮 */
    printf("從暗到亮...\n");
    for (duty_cycle = 0; duty_cycle <= 100 && running; duty_cycle += 5) {
        int on_time = (period_us * duty_cycle) / 100;
        int off_time = period_us - on_time;

        for (int i = 0; i < 100 && running; i++) {  /* 持續 0.2 秒 */
            if (on_time > 0) {
                led_set(&led, 1);
                usleep(on_time);
            }
            if (off_time > 0) {
                led_set(&led, 0);
                usleep(off_time);
            }
        }
    }

    /* 從亮到暗 */
    printf("從亮到暗...\n");
    for (duty_cycle = 100; duty_cycle >= 0 && running; duty_cycle -= 5) {
        int on_time = (period_us * duty_cycle) / 100;
        int off_time = period_us - on_time;

        for (int i = 0; i < 100 && running; i++) {
            if (on_time > 0) {
                led_set(&led, 1);
                usleep(on_time);
            }
            if (off_time > 0) {
                led_set(&led, 0);
                usleep(off_time);
            }
        }
    }

    led_set(&led, 0);
    led_cleanup(&led);
    printf("PWM 範例完成\n\n");
}

/* 範例 3: 多 LED 流水燈 */
void example_multi_led() {
    led_t leds[MAX_LEDS];
    int led_gpios[MAX_LEDS] = {17, 18, 19, 20};
    int i, j;

    printf("=== 多 LED 流水燈範例 ===\n");
    printf("使用 %d 個 LED 顯示流水燈效果\n", MAX_LEDS);

    /* 初始化所有 LED */
    for (i = 0; i < MAX_LEDS; i++) {
        if (led_init(&leds[i], led_gpios[i]) < 0) {
            fprintf(stderr, "Failed to initialize LED %d\n", i);
            /* 清理已初始化的 LED */
            for (j = 0; j < i; j++) {
                led_cleanup(&leds[j]);
            }
            return;
        }
    }

    /* 流水燈效果 - 順序點亮 */
    printf("順序點亮...\n");
    for (int cycle = 0; cycle < 3 && running; cycle++) {
        for (i = 0; i < MAX_LEDS && running; i++) {
            led_set(&leds[i], 1);
            usleep(200000);  /* 200ms */
            led_set(&leds[i], 0);
        }
    }

    /* 流水燈效果 - 反向點亮 */
    printf("反向點亮...\n");
    for (int cycle = 0; cycle < 3 && running; cycle++) {
        for (i = MAX_LEDS - 1; i >= 0 && running; i--) {
            led_set(&leds[i], 1);
            usleep(200000);
            led_set(&leds[i], 0);
        }
    }

    /* 全部閃爍 */
    printf("全部閃爍...\n");
    for (int cycle = 0; cycle < 5 && running; cycle++) {
        for (i = 0; i < MAX_LEDS; i++) {
            led_set(&leds[i], 1);
        }
        usleep(300000);
        for (i = 0; i < MAX_LEDS; i++) {
            led_set(&leds[i], 0);
        }
        usleep(300000);
    }

    /* 清理所有 LED */
    for (i = 0; i < MAX_LEDS; i++) {
        led_cleanup(&leds[i]);
    }

    printf("多 LED 流水燈範例完成\n\n");
}

/* 範例 4: 呼吸燈效果 */
void example_breathing() {
    led_t led;
    int brightness;
    int period_us = 1000;
    double phase;

    printf("=== LED 呼吸燈範例 ===\n");
    printf("使用正弦波模擬呼吸燈效果\n");

    if (led_init(&led, 17) < 0) {
        fprintf(stderr, "Failed to initialize LED\n");
        return;
    }

    /* 呼吸 5 個周期 */
    for (int cycle = 0; cycle < 5 && running; cycle++) {
        printf("呼吸周期 %d/5\n", cycle + 1);

        /* 一個完整的呼吸周期 */
        for (phase = 0; phase < 360 && running; phase += 1) {
            /* 使用正弦波計算亮度 (0-100%) */
            brightness = (int)((sin(phase * 3.14159 / 180.0) + 1) * 50);

            int on_time = (period_us * brightness) / 100;
            int off_time = period_us - on_time;

            /* PWM 輸出 */
            for (int i = 0; i < 5 && running; i++) {
                if (on_time > 0) {
                    led_set(&led, 1);
                    usleep(on_time);
                }
                if (off_time > 0) {
                    led_set(&led, 0);
                    usleep(off_time);
                }
            }
        }
    }

    led_set(&led, 0);
    led_cleanup(&led);
    printf("呼吸燈範例完成\n\n");
}

/* 範例 5: SOS 莫爾斯電碼 */
void example_sos() {
    led_t led;
    int dot_duration = 200000;   /* 短信號 200ms */
    int dash_duration = 600000;  /* 長信號 600ms */
    int gap_duration = 200000;   /* 間隔 200ms */

    printf("=== LED SOS 信號範例 ===\n");
    printf("使用莫爾斯電碼發送 SOS 信號\n");

    if (led_init(&led, 17) < 0) {
        fprintf(stderr, "Failed to initialize LED\n");
        return;
    }

    for (int i = 0; i < 3 && running; i++) {
        printf("發送 SOS 信號 %d/3\n", i + 1);

        /* S: ... (3 個短信號) */
        for (int j = 0; j < 3; j++) {
            led_set(&led, 1);
            usleep(dot_duration);
            led_set(&led, 0);
            usleep(gap_duration);
        }
        usleep(gap_duration * 2);

        /* O: --- (3 個長信號) */
        for (int j = 0; j < 3; j++) {
            led_set(&led, 1);
            usleep(dash_duration);
            led_set(&led, 0);
            usleep(gap_duration);
        }
        usleep(gap_duration * 2);

        /* S: ... (3 個短信號) */
        for (int j = 0; j < 3; j++) {
            led_set(&led, 1);
            usleep(dot_duration);
            led_set(&led, 0);
            usleep(gap_duration);
        }

        /* 字母間隔 */
        usleep(gap_duration * 6);
    }

    led_cleanup(&led);
    printf("SOS 信號範例完成\n\n");
}

void print_usage(const char *prog) {
    printf("用法: %s [選項]\n", prog);
    printf("選項:\n");
    printf("  -b    LED 閃爍範例\n");
    printf("  -p    PWM 亮度控制範例\n");
    printf("  -m    多 LED 流水燈範例\n");
    printf("  -r    呼吸燈範例\n");
    printf("  -s    SOS 信號範例\n");
    printf("  -a    執行所有範例 (預設)\n");
    printf("  -h    顯示此幫助信息\n");
}

int main(int argc, char *argv[]) {
    int opt;
    int run_all = 1;

    /* 設置信號處理 */
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);

    printf("GPIO LED 控制範例程式\n");
    printf("======================\n");
    printf("按 Ctrl+C 可以隨時停止\n\n");

    /* 解析命令行參數 */
    while ((opt = getopt(argc, argv, "bpmrsah")) != -1) {
        run_all = 0;
        switch (opt) {
            case 'b':
                example_blink();
                break;
            case 'p':
                example_pwm();
                break;
            case 'm':
                example_multi_led();
                break;
            case 'r':
                example_breathing();
                break;
            case 's':
                example_sos();
                break;
            case 'a':
                run_all = 1;
                break;
            case 'h':
            default:
                print_usage(argv[0]);
                return 0;
        }
    }

    /* 如果沒有指定選項，執行所有範例 */
    if (run_all) {
        example_blink();
        if (running) example_pwm();
        if (running) example_multi_led();
        if (running) example_breathing();
        if (running) example_sos();
    }

    printf("程式結束\n");
    return 0;
}
