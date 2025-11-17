/*
 * GPIO 錯誤處理範例
 *
 * 此範例展示各種錯誤情況的處理：
 * - GPIO 不存在
 * - 權限不足
 * - GPIO 已被占用
 * - 操作超時
 * - 資源清理
 */

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <errno.h>
#include <sys/stat.h>

#define GPIO_PATH "/sys/class/gpio"
#define MAX_RETRY 3

/* 錯誤代碼 */
typedef enum {
    ERR_OK = 0,
    ERR_EXPORT_FAILED,
    ERR_UNEXPORT_FAILED,
    ERR_DIRECTION_FAILED,
    ERR_VALUE_FAILED,
    ERR_EDGE_FAILED,
    ERR_PERMISSION_DENIED,
    ERR_GPIO_BUSY,
    ERR_INVALID_GPIO,
    ERR_TIMEOUT
} error_code_t;

/* 錯誤信息 */
const char* error_strings[] = {
    "Success",
    "Failed to export GPIO",
    "Failed to unexport GPIO",
    "Failed to set direction",
    "Failed to set/get value",
    "Failed to set edge",
    "Permission denied",
    "GPIO is busy",
    "Invalid GPIO number",
    "Operation timeout"
};

/* 打印錯誤信息 */
void print_error(error_code_t code, const char *details) {
    fprintf(stderr, "錯誤: %s", error_strings[code]);
    if (details) {
        fprintf(stderr, " (%s)", details);
    }
    if (errno != 0) {
        fprintf(stderr, " - %s", strerror(errno));
    }
    fprintf(stderr, "\n");
}

/* 安全的 GPIO 導出（帶錯誤處理） */
error_code_t safe_gpio_export(int gpio) {
    int fd, len;
    char buf[64];
    char gpio_path[128];
    struct stat st;

    printf("嘗試導出 GPIO %d...\n", gpio);

    /* 檢查 GPIO 是否已經導出 */
    snprintf(gpio_path, sizeof(gpio_path), GPIO_PATH "/gpio%d", gpio);
    if (stat(gpio_path, &st) == 0) {
        printf("  GPIO %d 已經導出\n", gpio);
        return ERR_OK;
    }

    /* 打開 export 文件 */
    fd = open(GPIO_PATH "/export", O_WRONLY);
    if (fd < 0) {
        if (errno == EACCES) {
            print_error(ERR_PERMISSION_DENIED, "無法打開 export");
            return ERR_PERMISSION_DENIED;
        }
        print_error(ERR_EXPORT_FAILED, "無法打開 export");
        return ERR_EXPORT_FAILED;
    }

    /* 寫入 GPIO 編號 */
    len = snprintf(buf, sizeof(buf), "%d", gpio);
    if (write(fd, buf, len) < 0) {
        close(fd);

        if (errno == EBUSY) {
            printf("  GPIO %d 已被其他程序占用\n", gpio);
            return ERR_GPIO_BUSY;
        } else if (errno == EINVAL) {
            print_error(ERR_INVALID_GPIO, "無效的 GPIO 編號");
            return ERR_INVALID_GPIO;
        }

        print_error(ERR_EXPORT_FAILED, "寫入失敗");
        return ERR_EXPORT_FAILED;
    }

    close(fd);

    /* 等待 sysfs 文件創建 */
    for (int i = 0; i < 10; i++) {
        if (stat(gpio_path, &st) == 0) {
            printf("  GPIO %d 導出成功\n", gpio);
            return ERR_OK;
        }
        usleep(10000);  /* 10ms */
    }

    print_error(ERR_TIMEOUT, "等待 sysfs 文件創建超時");
    return ERR_TIMEOUT;
}

/* 安全的 GPIO 取消導出 */
error_code_t safe_gpio_unexport(int gpio) {
    int fd, len;
    char buf[64];
    char gpio_path[128];
    struct stat st;

    printf("嘗試取消導出 GPIO %d...\n", gpio);

    /* 檢查 GPIO 是否已導出 */
    snprintf(gpio_path, sizeof(gpio_path), GPIO_PATH "/gpio%d", gpio);
    if (stat(gpio_path, &st) != 0) {
        printf("  GPIO %d 未導出，無需操作\n", gpio);
        return ERR_OK;
    }

    fd = open(GPIO_PATH "/unexport", O_WRONLY);
    if (fd < 0) {
        print_error(ERR_UNEXPORT_FAILED, "無法打開 unexport");
        return ERR_UNEXPORT_FAILED;
    }

    len = snprintf(buf, sizeof(buf), "%d", gpio);
    if (write(fd, buf, len) < 0) {
        close(fd);
        print_error(ERR_UNEXPORT_FAILED, "寫入失敗");
        return ERR_UNEXPORT_FAILED;
    }

    close(fd);

    /* 驗證取消導出 */
    for (int i = 0; i < 10; i++) {
        if (stat(gpio_path, &st) != 0) {
            printf("  GPIO %d 取消導出成功\n", gpio);
            return ERR_OK;
        }
        usleep(10000);
    }

    print_error(ERR_TIMEOUT, "等待 sysfs 文件刪除超時");
    return ERR_TIMEOUT;
}

/* 安全的設置方向（帶重試） */
error_code_t safe_gpio_set_direction(int gpio, const char *direction) {
    int fd;
    char path[128];
    int retry;

    printf("設置 GPIO %d 方向為 %s...\n", gpio, direction);

    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/direction", gpio);

    for (retry = 0; retry < MAX_RETRY; retry++) {
        fd = open(path, O_WRONLY);
        if (fd < 0) {
            if (errno == EACCES) {
                print_error(ERR_PERMISSION_DENIED, "無法打開 direction");
                return ERR_PERMISSION_DENIED;
            }
            if (retry < MAX_RETRY - 1) {
                printf("  重試 %d/%d...\n", retry + 1, MAX_RETRY);
                usleep(100000);  /* 100ms */
                continue;
            }
            print_error(ERR_DIRECTION_FAILED, "無法打開 direction");
            return ERR_DIRECTION_FAILED;
        }

        if (write(fd, direction, strlen(direction)) < 0) {
            close(fd);
            if (retry < MAX_RETRY - 1) {
                printf("  寫入失敗，重試 %d/%d...\n", retry + 1, MAX_RETRY);
                usleep(100000);
                continue;
            }
            print_error(ERR_DIRECTION_FAILED, "寫入失敗");
            return ERR_DIRECTION_FAILED;
        }

        close(fd);
        printf("  方向設置成功\n");
        return ERR_OK;
    }

    return ERR_DIRECTION_FAILED;
}

/* 範例 1: 處理無效的 GPIO */
void example_invalid_gpio() {
    error_code_t err;

    printf("\n=== 範例 1: 處理無效的 GPIO ===\n");

    /* 嘗試使用不存在的 GPIO（通常超出範圍） */
    int invalid_gpio = 9999;
    err = safe_gpio_export(invalid_gpio);

    if (err != ERR_OK) {
        printf("正確處理了無效 GPIO 的錯誤\n");
    }
}

/* 範例 2: 處理權限錯誤 */
void example_permission_error() {
    printf("\n=== 範例 2: 處理權限錯誤 ===\n");
    printf("注意: 此範例需要非 root 權限運行才能看到權限錯誤\n");

    /* 檢查當前用戶權限 */
    if (geteuid() == 0) {
        printf("當前以 root 運行，跳過權限測試\n");
        return;
    }

    int gpio = 17;
    error_code_t err = safe_gpio_export(gpio);

    if (err == ERR_PERMISSION_DENIED) {
        printf("檢測到權限不足\n");
        printf("建議解決方法:\n");
        printf("  1. 使用 sudo 運行程序\n");
        printf("  2. 將用戶添加到 gpio 組\n");
        printf("  3. 配置 udev 規則\n");
    }
}

/* 範例 3: 處理 GPIO 占用 */
void example_gpio_busy() {
    int gpio = 17;
    error_code_t err;

    printf("\n=== 範例 3: 處理 GPIO 占用 ===\n");

    /* 第一次導出 */
    err = safe_gpio_export(gpio);
    if (err != ERR_OK && err != ERR_GPIO_BUSY) {
        printf("跳過此測試（導出失敗）\n");
        return;
    }

    /* 模擬另一個程序嘗試使用同一 GPIO */
    printf("\n模擬另一個程序嘗試使用 GPIO %d...\n", gpio);
    err = safe_gpio_export(gpio);

    if (err == ERR_OK) {
        printf("GPIO 已導出，可以繼續使用\n");
    }

    /* 清理 */
    safe_gpio_unexport(gpio);
}

/* 範例 4: 資源清理 */
void example_resource_cleanup() {
    int gpios[] = {17, 18, 19, 20};
    int num_gpios = sizeof(gpios) / sizeof(gpios[0]);
    error_code_t err;
    int i;

    printf("\n=== 範例 4: 資源清理 ===\n");

    /* 導出多個 GPIO */
    printf("導出 %d 個 GPIO...\n", num_gpios);
    for (i = 0; i < num_gpios; i++) {
        err = safe_gpio_export(gpios[i]);
        if (err != ERR_OK) {
            printf("GPIO %d 導出失敗，清理已分配的資源\n", gpios[i]);
            /* 清理已成功導出的 GPIO */
            for (int j = 0; j < i; j++) {
                safe_gpio_unexport(gpios[j]);
            }
            return;
        }
    }

    printf("\n所有 GPIO 導出成功\n");

    /* 模擬某些操作... */
    printf("執行 GPIO 操作...\n");
    sleep(1);

    /* 清理所有資源 */
    printf("\n清理所有 GPIO...\n");
    for (i = 0; i < num_gpios; i++) {
        safe_gpio_unexport(gpios[i]);
    }

    printf("資源清理完成\n");
}

/* 範例 5: 錯誤恢復 */
void example_error_recovery() {
    int gpio = 17;
    error_code_t err;

    printf("\n=== 範例 5: 錯誤恢復 ===\n");

    /* 導出 GPIO */
    err = safe_gpio_export(gpio);
    if (err != ERR_OK) {
        printf("跳過此測試（導出失敗）\n");
        return;
    }

    /* 嘗試設置方向（可能失敗） */
    printf("\n嘗試設置方向（帶重試機制）...\n");
    err = safe_gpio_set_direction(gpio, "out");

    if (err == ERR_OK) {
        printf("方向設置成功\n");

        /* 嘗試寫入值 */
        printf("\n嘗試寫入值...\n");
        char path[128];
        int fd;

        snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/value", gpio);
        fd = open(path, O_WRONLY);

        if (fd >= 0) {
            if (write(fd, "1", 1) > 0) {
                printf("  值寫入成功\n");
            } else {
                print_error(ERR_VALUE_FAILED, "寫入值失敗");
            }
            close(fd);
        } else {
            print_error(ERR_VALUE_FAILED, "打開 value 失敗");
        }
    } else {
        printf("方向設置失敗，執行恢復操作...\n");
        /* 可以在這裡執行恢復操作 */
    }

    /* 清理 */
    safe_gpio_unexport(gpio);
}

/* 範例 6: 完整的錯誤處理流程 */
void example_complete_error_handling() {
    int gpio = 21;
    error_code_t err;
    int fd = -1;
    char path[128];

    printf("\n=== 範例 6: 完整的錯誤處理流程 ===\n");

    /* 步驟 1: 導出 GPIO */
    err = safe_gpio_export(gpio);
    if (err != ERR_OK) {
        printf("導出失敗，程序終止\n");
        return;
    }

    /* 步驟 2: 設置方向 */
    err = safe_gpio_set_direction(gpio, "out");
    if (err != ERR_OK) {
        printf("設置方向失敗，清理並退出\n");
        goto cleanup;
    }

    /* 步驟 3: 打開 value 文件 */
    snprintf(path, sizeof(path), GPIO_PATH "/gpio%d/value", gpio);
    fd = open(path, O_WRONLY);
    if (fd < 0) {
        print_error(ERR_VALUE_FAILED, "打開 value 文件失敗");
        goto cleanup;
    }

    /* 步驟 4: 執行操作 */
    printf("執行 GPIO 操作...\n");
    for (int i = 0; i < 5; i++) {
        char value = (i % 2) ? '1' : '0';
        if (write(fd, &value, 1) < 0) {
            print_error(ERR_VALUE_FAILED, "寫入值失敗");
            break;
        }
        printf("  寫入 %c\n", value);
        usleep(500000);
    }

    printf("操作完成\n");

cleanup:
    /* 清理資源 */
    printf("\n清理資源...\n");
    if (fd >= 0) {
        close(fd);
        printf("  關閉文件描述符\n");
    }
    safe_gpio_unexport(gpio);
    printf("清理完成\n");
}

int main(int argc, char *argv[]) {
    printf("GPIO 錯誤處理範例程式\n");
    printf("========================\n");

    /* 執行所有範例 */
    example_invalid_gpio();
    example_permission_error();
    example_gpio_busy();
    example_resource_cleanup();
    example_error_recovery();
    example_complete_error_handling();

    printf("\n所有範例執行完成！\n");
    printf("\n錯誤處理最佳實踐:\n");
    printf("  1. 始終檢查函數返回值\n");
    printf("  2. 使用 errno 獲取詳細錯誤信息\n");
    printf("  3. 實現重試機制處理暫時性錯誤\n");
    printf("  4. 確保資源正確清理\n");
    printf("  5. 提供有意義的錯誤消息\n");
    printf("  6. 使用 goto 或異常處理進行清理\n");

    return 0;
}
