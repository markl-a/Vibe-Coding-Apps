/*
 * GPIO 按鈕中斷範例
 *
 * 此範例展示如何使用 GPIO 中斷處理按鈕輸入：
 * - 邊緣觸發中斷
 * - poll() 監聽 GPIO 變化
 * - 防抖處理
 * - 按鈕事件計數
 */

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <errno.h>
#include <signal.h>
#include <poll.h>
#include <time.h>
#include <sys/time.h>

#define GPIO_PATH "/sys/class/gpio"
#define DEBOUNCE_TIME_MS 50  /* 防抖時間 50ms */

static int running = 1;
static unsigned int press_count = 0;
static unsigned int release_count = 0;

/* 信號處理 */
void signal_handler(int sig) {
    running = 0;
    printf("\n接收到信號，準備退出...\n");
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

int gpio_set_edge(int gpio, const char *edge) {
    int fd;
    char path[128];

    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/edge", gpio);
    fd = open(path, O_WRONLY);
    if (fd < 0) {
        perror("Failed to open edge");
        return -1;
    }

    if (write(fd, edge, strlen(edge)) < 0) {
        perror("Failed to set edge");
        close(fd);
        return -1;
    }

    close(fd);
    return 0;
}

int gpio_read_value(int gpio) {
    int fd;
    char path[128];
    char value_str[3];

    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/value", gpio);
    fd = open(path, O_RDONLY);
    if (fd < 0) {
        return -1;
    }

    if (read(fd, value_str, sizeof(value_str)) < 0) {
        close(fd);
        return -1;
    }

    close(fd);
    return atoi(value_str);
}

/* 獲取當前時間（毫秒） */
unsigned long long get_time_ms() {
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (unsigned long long)(tv.tv_sec) * 1000 + (tv.tv_usec / 1000);
}

/* 範例 1: 基本中斷處理 */
void example_basic_interrupt() {
    int gpio = 18;
    int fd;
    char path[128];
    struct pollfd pfd;
    char buf[8];
    int ret;

    printf("=== 基本中斷處理範例 ===\n");
    printf("使用 GPIO %d 檢測按鈕按下\n", gpio);
    printf("按下按鈕觸發中斷...\n\n");

    /* 導出 GPIO */
    if (gpio_export(gpio) < 0) {
        fprintf(stderr, "Failed to export GPIO %d\n", gpio);
        return;
    }

    usleep(100000);

    /* 設置為輸入 */
    if (gpio_set_direction(gpio, "in") < 0) {
        fprintf(stderr, "Failed to set direction\n");
        gpio_unexport(gpio);
        return;
    }

    /* 設置上升沿觸發 */
    if (gpio_set_edge(gpio, "rising") < 0) {
        fprintf(stderr, "Failed to set edge\n");
        gpio_unexport(gpio);
        return;
    }

    /* 打開 value 文件 */
    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/value", gpio);
    fd = open(path, O_RDONLY);
    if (fd < 0) {
        fprintf(stderr, "Failed to open value\n");
        gpio_unexport(gpio);
        return;
    }

    /* 清空初始事件 */
    read(fd, buf, sizeof(buf));

    /* 設置 poll */
    pfd.fd = fd;
    pfd.events = POLLPRI | POLLERR;

    printf("等待按鈕按下事件...\n");
    printf("按 Ctrl+C 退出\n\n");

    /* 監聽中斷 */
    while (running) {
        ret = poll(&pfd, 1, 1000);  /* 1 秒超時 */

        if (ret < 0) {
            if (errno == EINTR) continue;
            perror("poll failed");
            break;
        }

        if (ret == 0) {
            /* 超時，繼續等待 */
            continue;
        }

        if (pfd.revents & POLLPRI) {
            /* 中斷發生 */
            lseek(fd, 0, SEEK_SET);
            read(fd, buf, sizeof(buf));

            press_count++;
            printf("按鈕按下! (第 %u 次)\n", press_count);
        }
    }

    close(fd);
    gpio_unexport(gpio);
    printf("\n基本中斷處理範例完成\n\n");
}

/* 範例 2: 雙邊緣觸發（按下和釋放） */
void example_both_edges() {
    int gpio = 18;
    int fd;
    char path[128];
    struct pollfd pfd;
    char buf[8];
    int ret, value;
    int last_state = 0;

    printf("=== 雙邊緣觸發範例 ===\n");
    printf("檢測按鈕按下和釋放\n\n");

    /* 導出並配置 GPIO */
    if (gpio_export(gpio) < 0) {
        fprintf(stderr, "Failed to export GPIO\n");
        return;
    }

    usleep(100000);
    gpio_set_direction(gpio, "in");
    gpio_set_edge(gpio, "both");  /* 雙邊緣觸發 */

    /* 打開 value 文件 */
    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/value", gpio);
    fd = open(path, O_RDONLY);
    if (fd < 0) {
        gpio_unexport(gpio);
        return;
    }

    /* 讀取初始狀態 */
    read(fd, buf, sizeof(buf));
    last_state = atoi(buf);

    pfd.fd = fd;
    pfd.events = POLLPRI | POLLERR;

    printf("等待按鈕事件...\n");
    printf("按 Ctrl+C 退出\n\n");

    /* 監聽中斷 */
    while (running) {
        ret = poll(&pfd, 1, 1000);

        if (ret <= 0) continue;

        if (pfd.revents & POLLPRI) {
            lseek(fd, 0, SEEK_SET);
            read(fd, buf, sizeof(buf));
            value = atoi(buf);

            if (value != last_state) {
                if (value == 1) {
                    press_count++;
                    printf("按鈕按下 (按下次數: %u)\n", press_count);
                } else {
                    release_count++;
                    printf("按鈕釋放 (釋放次數: %u)\n", release_count);
                }
                last_state = value;
            }
        }
    }

    close(fd);
    gpio_unexport(gpio);

    printf("\n統計信息:\n");
    printf("  按下次數: %u\n", press_count);
    printf("  釋放次數: %u\n\n", release_count);
}

/* 範例 3: 防抖處理 */
void example_debounce() {
    int gpio = 18;
    int fd;
    char path[128];
    struct pollfd pfd;
    char buf[8];
    int ret, value;
    unsigned long long last_event_time = 0;
    unsigned long long current_time;
    unsigned int valid_events = 0;
    unsigned int ignored_events = 0;

    printf("=== 防抖處理範例 ===\n");
    printf("使用 %d ms 防抖時間\n", DEBOUNCE_TIME_MS);
    printf("快速按下按鈕測試防抖效果\n\n");

    /* 導出並配置 GPIO */
    if (gpio_export(gpio) < 0) {
        return;
    }

    usleep(100000);
    gpio_set_direction(gpio, "in");
    gpio_set_edge(gpio, "rising");

    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/value", gpio);
    fd = open(path, O_RDONLY);
    if (fd < 0) {
        gpio_unexport(gpio);
        return;
    }

    read(fd, buf, sizeof(buf));

    pfd.fd = fd;
    pfd.events = POLLPRI | POLLERR;

    printf("等待按鈕事件...\n");
    printf("按 Ctrl+C 退出\n\n");

    while (running) {
        ret = poll(&pfd, 1, 1000);

        if (ret <= 0) continue;

        if (pfd.revents & POLLPRI) {
            current_time = get_time_ms();

            lseek(fd, 0, SEEK_SET);
            read(fd, buf, sizeof(buf));
            value = atoi(buf);

            /* 檢查是否在防抖時間內 */
            if (current_time - last_event_time >= DEBOUNCE_TIME_MS) {
                /* 有效事件 */
                valid_events++;
                printf("[有效] 按鈕按下 (有效: %u, 忽略: %u)\n",
                       valid_events, ignored_events);
                last_event_time = current_time;
            } else {
                /* 在防抖時間內，忽略 */
                ignored_events++;
                printf("[忽略] 抖動信號 (間隔: %llu ms)\n",
                       current_time - last_event_time);
            }
        }
    }

    close(fd);
    gpio_unexport(gpio);

    printf("\n統計信息:\n");
    printf("  有效事件: %u\n", valid_events);
    printf("  忽略事件: %u\n", ignored_events);
    printf("  防抖率: %.1f%%\n\n",
           ignored_events * 100.0 / (valid_events + ignored_events));
}

/* 範例 4: 長按檢測 */
void example_long_press() {
    int gpio = 18;
    int fd;
    char path[128];
    struct pollfd pfd;
    char buf[8];
    int ret, value;
    unsigned long long press_time = 0;
    unsigned long long release_time;
    unsigned long long duration;
    int is_pressed = 0;

    #define LONG_PRESS_MS 1000  /* 長按閾值 1 秒 */

    printf("=== 長按檢測範例 ===\n");
    printf("檢測短按和長按（長按 > %d ms）\n\n", LONG_PRESS_MS);

    /* 導出並配置 GPIO */
    if (gpio_export(gpio) < 0) {
        return;
    }

    usleep(100000);
    gpio_set_direction(gpio, "in");
    gpio_set_edge(gpio, "both");

    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/value", gpio);
    fd = open(path, O_RDONLY);
    if (fd < 0) {
        gpio_unexport(gpio);
        return;
    }

    read(fd, buf, sizeof(buf));

    pfd.fd = fd;
    pfd.events = POLLPRI | POLLERR;

    printf("等待按鈕事件...\n");
    printf("  短按: < %d ms\n", LONG_PRESS_MS);
    printf("  長按: >= %d ms\n", LONG_PRESS_MS);
    printf("按 Ctrl+C 退出\n\n");

    while (running) {
        ret = poll(&pfd, 1, 100);  /* 100ms 超時，用於檢測長按 */

        if (ret < 0) continue;

        if (ret > 0 && (pfd.revents & POLLPRI)) {
            lseek(fd, 0, SEEK_SET);
            read(fd, buf, sizeof(buf));
            value = atoi(buf);

            if (value == 1 && !is_pressed) {
                /* 按下 */
                press_time = get_time_ms();
                is_pressed = 1;
                printf("按鈕按下...\n");
            } else if (value == 0 && is_pressed) {
                /* 釋放 */
                release_time = get_time_ms();
                duration = release_time - press_time;
                is_pressed = 0;

                if (duration >= LONG_PRESS_MS) {
                    printf("長按釋放 (持續 %llu ms)\n\n", duration);
                } else {
                    printf("短按釋放 (持續 %llu ms)\n\n", duration);
                }
            }
        }

        /* 檢測持續按下 */
        if (is_pressed) {
            duration = get_time_ms() - press_time;
            if (duration >= LONG_PRESS_MS) {
                printf("檢測到長按... (已持續 %llu ms)\r", duration);
                fflush(stdout);
            }
        }
    }

    close(fd);
    gpio_unexport(gpio);
    printf("\n長按檢測範例完成\n\n");
}

void print_usage(const char *prog) {
    printf("用法: %s [選項]\n", prog);
    printf("選項:\n");
    printf("  -b    基本中斷處理\n");
    printf("  -e    雙邊緣觸發（按下/釋放）\n");
    printf("  -d    防抖處理\n");
    printf("  -l    長按檢測\n");
    printf("  -a    執行所有範例 (預設)\n");
    printf("  -h    顯示此幫助信息\n");
}

int main(int argc, char *argv[]) {
    int opt;
    int run_all = 1;

    /* 設置信號處理 */
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);

    printf("GPIO 按鈕中斷範例程式\n");
    printf("======================\n\n");

    /* 解析命令行參數 */
    while ((opt = getopt(argc, argv, "bedlah")) != -1) {
        run_all = 0;
        switch (opt) {
            case 'b':
                example_basic_interrupt();
                break;
            case 'e':
                press_count = release_count = 0;
                example_both_edges();
                break;
            case 'd':
                example_debounce();
                break;
            case 'l':
                example_long_press();
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

    /* 如果沒有指定選項，顯示幫助 */
    if (run_all) {
        print_usage(argv[0]);
        printf("\n建議: 選擇單個範例執行以獲得最佳體驗\n");
    }

    return 0;
}
