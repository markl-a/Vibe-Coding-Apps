/*
 * GPIO 測試套件
 *
 * 自動化測試程序，用於驗證 GPIO 驅動的各項功能
 */

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <errno.h>
#include <sys/stat.h>
#include <time.h>

#define GPIO_PATH "/sys/class/gpio"
#define TEST_GPIO_OUTPUT 17
#define TEST_GPIO_INPUT 18

/* 測試結果統計 */
typedef struct {
    int total;
    int passed;
    int failed;
    int skipped;
} test_stats_t;

static test_stats_t stats = {0, 0, 0, 0};

/* 顏色輸出 */
#define COLOR_RED     "\x1b[31m"
#define COLOR_GREEN   "\x1b[32m"
#define COLOR_YELLOW  "\x1b[33m"
#define COLOR_BLUE    "\x1b[34m"
#define COLOR_RESET   "\x1b[0m"

/* 測試輔助宏 */
#define TEST_START(name) \
    do { \
        printf(COLOR_BLUE "[TEST] " COLOR_RESET "%s\n", name); \
        stats.total++; \
    } while(0)

#define TEST_PASS() \
    do { \
        printf(COLOR_GREEN "[PASS]" COLOR_RESET "\n\n"); \
        stats.passed++; \
    } while(0)

#define TEST_FAIL(reason) \
    do { \
        printf(COLOR_RED "[FAIL]" COLOR_RESET " %s\n\n", reason); \
        stats.failed++; \
    } while(0)

#define TEST_SKIP(reason) \
    do { \
        printf(COLOR_YELLOW "[SKIP]" COLOR_RESET " %s\n\n", reason); \
        stats.skipped++; \
    } while(0)

/* GPIO 輔助函數 */
int gpio_export(int gpio) {
    int fd, len;
    char buf[64];

    fd = open(GPIO_PATH "/export", O_WRONLY);
    if (fd < 0) return -1;

    len = snprintf(buf, sizeof(buf), "%d", gpio);
    if (write(fd, buf, len) < 0 && errno != EBUSY) {
        close(fd);
        return -1;
    }

    close(fd);
    usleep(100000);
    return 0;
}

int gpio_unexport(int gpio) {
    int fd, len;
    char buf[64];

    fd = open(GPIO_PATH "/unexport", O_WRONLY);
    if (fd < 0) return -1;

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
    if (fd < 0) return -1;

    if (write(fd, direction, strlen(direction)) < 0) {
        close(fd);
        return -1;
    }

    close(fd);
    return 0;
}

int gpio_get_direction(int gpio, char *direction, size_t size) {
    int fd;
    char path[128];

    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/direction", gpio);
    fd = open(path, O_RDONLY);
    if (fd < 0) return -1;

    if (read(fd, direction, size) < 0) {
        close(fd);
        return -1;
    }

    close(fd);
    return 0;
}

int gpio_set_value(int gpio, int value) {
    int fd;
    char path[128];
    char value_str[2];

    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/value", gpio);
    fd = open(path, O_WRONLY);
    if (fd < 0) return -1;

    snprintf(value_str, sizeof(value_str), "%d", value ? 1 : 0);
    if (write(fd, value_str, 1) < 0) {
        close(fd);
        return -1;
    }

    close(fd);
    return 0;
}

int gpio_get_value(int gpio) {
    int fd;
    char path[128];
    char value_str[3];

    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/value", gpio);
    fd = open(path, O_RDONLY);
    if (fd < 0) return -1;

    if (read(fd, value_str, sizeof(value_str)) < 0) {
        close(fd);
        return -1;
    }

    close(fd);
    return atoi(value_str);
}

int gpio_set_edge(int gpio, const char *edge) {
    int fd;
    char path[128];

    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/edge", gpio);
    fd = open(path, O_WRONLY);
    if (fd < 0) return -1;

    if (write(fd, edge, strlen(edge)) < 0) {
        close(fd);
        return -1;
    }

    close(fd);
    return 0;
}

/* 測試 1: GPIO 導出和取消導出 */
void test_export_unexport() {
    int gpio = TEST_GPIO_OUTPUT;
    char gpio_path[128];
    struct stat st;

    TEST_START("GPIO 導出和取消導出");

    /* 測試導出 */
    if (gpio_export(gpio) < 0) {
        TEST_FAIL("導出失敗");
        return;
    }

    /* 驗證 GPIO 目錄存在 */
    snprintf(gpio_path, sizeof(gpio_path), GPIO_PATH "/gpio%d", gpio);
    if (stat(gpio_path, &st) != 0) {
        TEST_FAIL("GPIO 目錄不存在");
        return;
    }

    /* 測試取消導出 */
    if (gpio_unexport(gpio) < 0) {
        TEST_FAIL("取消導出失敗");
        return;
    }

    /* 驗證 GPIO 目錄不存在 */
    usleep(100000);
    if (stat(gpio_path, &st) == 0) {
        TEST_FAIL("GPIO 目錄仍然存在");
        return;
    }

    TEST_PASS();
}

/* 測試 2: 設置和讀取方向 */
void test_direction() {
    int gpio = TEST_GPIO_OUTPUT;
    char direction[16];

    TEST_START("設置和讀取方向");

    if (gpio_export(gpio) < 0) {
        TEST_SKIP("無法導出 GPIO");
        return;
    }

    /* 測試設置為輸出 */
    if (gpio_set_direction(gpio, "out") < 0) {
        gpio_unexport(gpio);
        TEST_FAIL("設置輸出方向失敗");
        return;
    }

    /* 讀取方向 */
    if (gpio_get_direction(gpio, direction, sizeof(direction)) < 0) {
        gpio_unexport(gpio);
        TEST_FAIL("讀取方向失敗");
        return;
    }

    if (strncmp(direction, "out", 3) != 0) {
        gpio_unexport(gpio);
        TEST_FAIL("方向不匹配");
        return;
    }

    /* 測試設置為輸入 */
    if (gpio_set_direction(gpio, "in") < 0) {
        gpio_unexport(gpio);
        TEST_FAIL("設置輸入方向失敗");
        return;
    }

    /* 讀取方向 */
    if (gpio_get_direction(gpio, direction, sizeof(direction)) < 0) {
        gpio_unexport(gpio);
        TEST_FAIL("讀取方向失敗");
        return;
    }

    if (strncmp(direction, "in", 2) != 0) {
        gpio_unexport(gpio);
        TEST_FAIL("方向不匹配");
        return;
    }

    gpio_unexport(gpio);
    TEST_PASS();
}

/* 測試 3: 設置和讀取值 */
void test_value() {
    int gpio = TEST_GPIO_OUTPUT;
    int value;

    TEST_START("設置和讀取值");

    if (gpio_export(gpio) < 0) {
        TEST_SKIP("無法導出 GPIO");
        return;
    }

    if (gpio_set_direction(gpio, "out") < 0) {
        gpio_unexport(gpio);
        TEST_SKIP("無法設置方向");
        return;
    }

    /* 測試設置為高電平 */
    if (gpio_set_value(gpio, 1) < 0) {
        gpio_unexport(gpio);
        TEST_FAIL("設置值失敗");
        return;
    }

    value = gpio_get_value(gpio);
    if (value != 1) {
        gpio_unexport(gpio);
        TEST_FAIL("讀取的值不正確（期望 1）");
        return;
    }

    /* 測試設置為低電平 */
    if (gpio_set_value(gpio, 0) < 0) {
        gpio_unexport(gpio);
        TEST_FAIL("設置值失敗");
        return;
    }

    value = gpio_get_value(gpio);
    if (value != 0) {
        gpio_unexport(gpio);
        TEST_FAIL("讀取的值不正確（期望 0）");
        return;
    }

    gpio_unexport(gpio);
    TEST_PASS();
}

/* 測試 4: 快速切換 */
void test_fast_toggle() {
    int gpio = TEST_GPIO_OUTPUT;
    clock_t start, end;
    int iterations = 1000;
    double cpu_time_used;

    TEST_START("快速切換性能測試");

    if (gpio_export(gpio) < 0) {
        TEST_SKIP("無法導出 GPIO");
        return;
    }

    if (gpio_set_direction(gpio, "out") < 0) {
        gpio_unexport(gpio);
        TEST_SKIP("無法設置方向");
        return;
    }

    start = clock();

    for (int i = 0; i < iterations; i++) {
        gpio_set_value(gpio, 1);
        gpio_set_value(gpio, 0);
    }

    end = clock();
    cpu_time_used = ((double) (end - start)) / CLOCKS_PER_SEC;

    printf("  完成 %d 次切換，耗時 %.3f 秒\n", iterations * 2, cpu_time_used);
    printf("  平均切換速度: %.0f Hz\n", (iterations * 2) / cpu_time_used);

    gpio_unexport(gpio);
    TEST_PASS();
}

/* 測試 5: 中斷邊緣設置 */
void test_edge() {
    int gpio = TEST_GPIO_INPUT;
    const char *edges[] = {"none", "rising", "falling", "both"};
    int num_edges = sizeof(edges) / sizeof(edges[0]);

    TEST_START("中斷邊緣設置");

    if (gpio_export(gpio) < 0) {
        TEST_SKIP("無法導出 GPIO");
        return;
    }

    if (gpio_set_direction(gpio, "in") < 0) {
        gpio_unexport(gpio);
        TEST_SKIP("無法設置方向");
        return;
    }

    for (int i = 0; i < num_edges; i++) {
        if (gpio_set_edge(gpio, edges[i]) < 0) {
            gpio_unexport(gpio);
            TEST_FAIL("設置邊緣失敗");
            return;
        }
        printf("  設置邊緣: %s ✓\n", edges[i]);
    }

    gpio_unexport(gpio);
    TEST_PASS();
}

/* 測試 6: 並發導出測試 */
void test_concurrent_export() {
    int gpio = TEST_GPIO_OUTPUT;

    TEST_START("並發導出測試");

    /* 導出 GPIO */
    if (gpio_export(gpio) < 0) {
        TEST_SKIP("初始導出失敗");
        return;
    }

    /* 再次導出（應該成功或返回 EBUSY） */
    int ret = gpio_export(gpio);
    if (ret < 0 && errno != EBUSY) {
        gpio_unexport(gpio);
        TEST_FAIL("並發導出處理不正確");
        return;
    }

    printf("  並發導出處理正確\n");

    gpio_unexport(gpio);
    TEST_PASS();
}

/* 測試 7: 無效操作測試 */
void test_invalid_operations() {
    int invalid_gpio = 9999;

    TEST_START("無效操作測試");

    /* 嘗試導出無效的 GPIO */
    if (gpio_export(invalid_gpio) == 0) {
        gpio_unexport(invalid_gpio);
        TEST_FAIL("接受了無效的 GPIO 編號");
        return;
    }

    printf("  正確拒絕了無效 GPIO\n");

    TEST_PASS();
}

/* 測試 8: 資源泄漏測試 */
void test_resource_leak() {
    int gpio = TEST_GPIO_OUTPUT;
    int iterations = 100;

    TEST_START("資源泄漏測試");

    for (int i = 0; i < iterations; i++) {
        if (gpio_export(gpio) < 0 && errno != EBUSY) {
            TEST_FAIL("導出失敗");
            return;
        }

        if (gpio_unexport(gpio) < 0) {
            TEST_FAIL("取消導出失敗");
            return;
        }

        if (i % 25 == 24) {
            printf("  進度: %d/%d\n", i + 1, iterations);
        }
    }

    printf("  完成 %d 次導出/取消導出循環\n", iterations);

    TEST_PASS();
}

/* 打印測試報告 */
void print_test_report() {
    printf("\n");
    printf("==========================================\n");
    printf("測試報告\n");
    printf("==========================================\n");
    printf("總計: %d\n", stats.total);
    printf(COLOR_GREEN "通過: %d\n" COLOR_RESET, stats.passed);
    printf(COLOR_RED "失敗: %d\n" COLOR_RESET, stats.failed);
    printf(COLOR_YELLOW "跳過: %d\n" COLOR_RESET, stats.skipped);
    printf("------------------------------------------\n");

    if (stats.failed == 0) {
        printf(COLOR_GREEN "所有測試通過！\n" COLOR_RESET);
    } else {
        printf(COLOR_RED "有 %d 個測試失敗\n" COLOR_RESET, stats.failed);
    }

    double pass_rate = stats.total > 0 ?
        (double)stats.passed / (stats.total - stats.skipped) * 100 : 0;
    printf("通過率: %.1f%%\n", pass_rate);
    printf("==========================================\n");
}

int main(int argc, char *argv[]) {
    printf("\n");
    printf("==========================================\n");
    printf("GPIO 驅動測試套件\n");
    printf("==========================================\n");
    printf("\n");

    /* 檢查權限 */
    if (geteuid() != 0) {
        printf(COLOR_YELLOW "警告: 未以 root 運行，某些測試可能失敗\n" COLOR_RESET);
        printf("建議使用: sudo %s\n\n", argv[0]);
    }

    /* 執行所有測試 */
    test_export_unexport();
    test_direction();
    test_value();
    test_fast_toggle();
    test_edge();
    test_concurrent_export();
    test_invalid_operations();
    test_resource_leak();

    /* 打印報告 */
    print_test_report();

    return (stats.failed == 0) ? 0 : 1;
}
