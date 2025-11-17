/*
 * led_control.c - LED 控制用戶空間程序
 *
 * 通過 sysfs 控制平台 LED 設備
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <dirent.h>
#include <errno.h>

#define SYSFS_PLATFORM_PATH "/sys/devices/platform"
#define LED_STATE_FILE "led_state"

/* 查找 LED 設備 */
char *find_led_device(void)
{
    DIR *dir;
    struct dirent *entry;
    static char device_path[512];

    dir = opendir(SYSFS_PLATFORM_PATH);
    if (!dir) {
        perror("Failed to open platform directory");
        return NULL;
    }

    while ((entry = readdir(dir)) != NULL) {
        if (strncmp(entry->d_name, "platform_led", 12) == 0) {
            snprintf(device_path, sizeof(device_path),
                     "%s/%s", SYSFS_PLATFORM_PATH, entry->d_name);
            closedir(dir);
            return device_path;
        }
    }

    closedir(dir);
    return NULL;
}

/* 讀取 LED 狀態 */
int read_led_state(const char *device_path)
{
    char path[512];
    char state[16];
    int fd;
    ssize_t ret;

    snprintf(path, sizeof(path), "%s/%s", device_path, LED_STATE_FILE);

    fd = open(path, O_RDONLY);
    if (fd < 0) {
        perror("Failed to open led_state");
        return -1;
    }

    ret = read(fd, state, sizeof(state) - 1);
    close(fd);

    if (ret < 0) {
        perror("Failed to read led_state");
        return -1;
    }

    state[ret] = '\0';

    /* 移除換行符 */
    if (state[ret - 1] == '\n')
        state[ret - 1] = '\0';

    printf("當前 LED 狀態: %s\n", state);

    return strcmp(state, "on") == 0 ? 1 : 0;
}

/* 設置 LED 狀態 */
int write_led_state(const char *device_path, const char *state)
{
    char path[512];
    int fd;
    ssize_t ret;

    snprintf(path, sizeof(path), "%s/%s", device_path, LED_STATE_FILE);

    fd = open(path, O_WRONLY);
    if (fd < 0) {
        perror("Failed to open led_state");
        return -1;
    }

    ret = write(fd, state, strlen(state));
    close(fd);

    if (ret < 0) {
        perror("Failed to write led_state");
        return -1;
    }

    printf("設置 LED 狀態: %s\n", state);

    return 0;
}

/* LED 閃爍 */
void blink_led(const char *device_path, int times, int delay_ms)
{
    int i;

    printf("LED 閃爍 %d 次...\n", times);

    for (i = 0; i < times; i++) {
        write_led_state(device_path, "on");
        printf("■ ");
        fflush(stdout);
        usleep(delay_ms * 1000);

        write_led_state(device_path, "off");
        printf("□ ");
        fflush(stdout);
        usleep(delay_ms * 1000);
    }
    printf("\n");
}

/* 顯示幫助 */
void show_help(const char *prog)
{
    printf("用法: %s [命令]\n\n", prog);
    printf("命令:\n");
    printf("  on              打開 LED\n");
    printf("  off             關閉 LED\n");
    printf("  toggle          切換 LED 狀態\n");
    printf("  status          顯示 LED 狀態\n");
    printf("  blink [次數]    LED 閃爍（默認 5 次）\n");
    printf("  help            顯示此幫助信息\n");
    printf("\n");
}

int main(int argc, char *argv[])
{
    char *device_path;
    int current_state;

    printf("=== LED 控制程序 ===\n\n");

    /* 查找 LED 設備 */
    device_path = find_led_device();
    if (!device_path) {
        fprintf(stderr, "錯誤: 找不到 LED 設備\n");
        fprintf(stderr, "請確保驅動已載入: sudo insmod platform_led_driver.ko\n");
        return 1;
    }

    printf("找到 LED 設備: %s\n\n", device_path);

    /* 解析命令 */
    if (argc < 2) {
        show_help(argv[0]);
        return 0;
    }

    if (strcmp(argv[1], "on") == 0) {
        write_led_state(device_path, "on");
    }
    else if (strcmp(argv[1], "off") == 0) {
        write_led_state(device_path, "off");
    }
    else if (strcmp(argv[1], "toggle") == 0) {
        current_state = read_led_state(device_path);
        if (current_state >= 0) {
            write_led_state(device_path, current_state ? "off" : "on");
        }
    }
    else if (strcmp(argv[1], "status") == 0) {
        read_led_state(device_path);
    }
    else if (strcmp(argv[1], "blink") == 0) {
        int times = 5;
        if (argc > 2) {
            times = atoi(argv[2]);
            if (times <= 0) times = 5;
        }
        blink_led(device_path, times, 500);
    }
    else if (strcmp(argv[1], "help") == 0) {
        show_help(argv[0]);
    }
    else {
        fprintf(stderr, "錯誤: 未知命令 '%s'\n\n", argv[1]);
        show_help(argv[0]);
        return 1;
    }

    return 0;
}
