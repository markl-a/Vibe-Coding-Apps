/*
 * GPIO 基本使用範例
 *
 * 此範例展示如何使用 GPIO 驅動進行基本的輸入輸出操作
 */

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <errno.h>

#define GPIO_PATH "/sys/class/gpio"

/* GPIO 操作輔助函數 */
int gpio_export(int gpio) {
    int fd, len;
    char buf[64];

    fd = open(GPIO_PATH "/export", O_WRONLY);
    if (fd < 0) {
        perror("Failed to open export");
        return -1;
    }

    len = snprintf(buf, sizeof(buf), "%d", gpio);
    if (write(fd, buf, len) < 0) {
        if (errno != EBUSY) {  /* 已經導出則忽略 */
            perror("Failed to export GPIO");
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
        perror("Failed to open unexport");
        return -1;
    }

    len = snprintf(buf, sizeof(buf), "%d", gpio);
    if (write(fd, buf, len) < 0) {
        perror("Failed to unexport GPIO");
        close(fd);
        return -1;
    }

    close(fd);
    return 0;
}

int gpio_set_direction(int gpio, const char *direction) {
    int fd;
    char path[128];

    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/direction", gpio);
    fd = open(path, O_WRONLY);
    if (fd < 0) {
        perror("Failed to open direction");
        return -1;
    }

    if (write(fd, direction, strlen(direction)) < 0) {
        perror("Failed to set direction");
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
    if (fd < 0) {
        perror("Failed to open value for writing");
        return -1;
    }

    snprintf(value_str, sizeof(value_str), "%d", value ? 1 : 0);
    if (write(fd, value_str, 1) < 0) {
        perror("Failed to write value");
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
    if (fd < 0) {
        perror("Failed to open value for reading");
        return -1;
    }

    if (read(fd, value_str, sizeof(value_str)) < 0) {
        perror("Failed to read value");
        close(fd);
        return -1;
    }

    close(fd);
    return atoi(value_str);
}

/* 範例 1: GPIO 輸出控制 */
void example_output() {
    int gpio = 17;

    printf("=== GPIO 輸出範例 ===\n");
    printf("使用 GPIO %d 進行輸出控制\n\n", gpio);

    /* 導出 GPIO */
    if (gpio_export(gpio) < 0) {
        fprintf(stderr, "Failed to export GPIO %d\n", gpio);
        return;
    }

    /* 等待 sysfs 文件創建 */
    usleep(100000);

    /* 設置為輸出模式 */
    if (gpio_set_direction(gpio, "out") < 0) {
        fprintf(stderr, "Failed to set direction\n");
        gpio_unexport(gpio);
        return;
    }

    /* 輸出高電平 */
    printf("設置 GPIO %d 為高電平\n", gpio);
    if (gpio_set_value(gpio, 1) < 0) {
        fprintf(stderr, "Failed to set value\n");
        gpio_unexport(gpio);
        return;
    }
    sleep(2);

    /* 輸出低電平 */
    printf("設置 GPIO %d 為低電平\n", gpio);
    if (gpio_set_value(gpio, 0) < 0) {
        fprintf(stderr, "Failed to set value\n");
        gpio_unexport(gpio);
        return;
    }
    sleep(2);

    /* 取消導出 */
    gpio_unexport(gpio);
    printf("GPIO %d 輸出範例完成\n\n", gpio);
}

/* 範例 2: GPIO 輸入讀取 */
void example_input() {
    int gpio = 18;
    int value;

    printf("=== GPIO 輸入範例 ===\n");
    printf("使用 GPIO %d 進行輸入讀取\n\n", gpio);

    /* 導出 GPIO */
    if (gpio_export(gpio) < 0) {
        fprintf(stderr, "Failed to export GPIO %d\n", gpio);
        return;
    }

    /* 等待 sysfs 文件創建 */
    usleep(100000);

    /* 設置為輸入模式 */
    if (gpio_set_direction(gpio, "in") < 0) {
        fprintf(stderr, "Failed to set direction\n");
        gpio_unexport(gpio);
        return;
    }

    /* 讀取 GPIO 值 */
    for (int i = 0; i < 5; i++) {
        value = gpio_get_value(gpio);
        if (value < 0) {
            fprintf(stderr, "Failed to read value\n");
            break;
        }
        printf("GPIO %d 當前值: %d\n", gpio, value);
        sleep(1);
    }

    /* 取消導出 */
    gpio_unexport(gpio);
    printf("GPIO %d 輸入範例完成\n\n", gpio);
}

/* 範例 3: GPIO 方向切換 */
void example_direction_switch() {
    int gpio = 19;

    printf("=== GPIO 方向切換範例 ===\n");
    printf("使用 GPIO %d 進行方向切換\n\n", gpio);

    /* 導出 GPIO */
    if (gpio_export(gpio) < 0) {
        fprintf(stderr, "Failed to export GPIO %d\n", gpio);
        return;
    }

    usleep(100000);

    /* 切換為輸出模式並設置值 */
    printf("設置為輸出模式\n");
    gpio_set_direction(gpio, "out");
    gpio_set_value(gpio, 1);
    printf("輸出值: 1\n");
    sleep(1);

    /* 切換為輸入模式並讀取 */
    printf("切換為輸入模式\n");
    gpio_set_direction(gpio, "in");
    int value = gpio_get_value(gpio);
    printf("讀取值: %d\n", value);
    sleep(1);

    /* 再次切換為輸出 */
    printf("再次切換為輸出模式\n");
    gpio_set_direction(gpio, "out");
    gpio_set_value(gpio, 0);
    printf("輸出值: 0\n");

    /* 取消導出 */
    gpio_unexport(gpio);
    printf("GPIO %d 方向切換範例完成\n\n", gpio);
}

int main(int argc, char *argv[]) {
    printf("GPIO 基本使用範例程式\n");
    printf("========================\n\n");

    /* 執行各個範例 */
    example_output();
    example_input();
    example_direction_switch();

    printf("所有範例執行完成！\n");
    return 0;
}
