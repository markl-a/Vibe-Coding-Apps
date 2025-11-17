/*
 * test_read_write.c - 字元設備讀寫測試程序
 *
 * 此程序示範如何使用字元設備進行讀寫操作
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>

#define DEVICE_PATH "/dev/simple_char"
#define BUFFER_SIZE 1024

int main(int argc, char *argv[])
{
    int fd;
    char write_buf[BUFFER_SIZE];
    char read_buf[BUFFER_SIZE];
    ssize_t ret;

    printf("=== 字元設備讀寫測試 ===\n\n");

    /* 打開設備 */
    printf("1. 打開設備 %s...\n", DEVICE_PATH);
    fd = open(DEVICE_PATH, O_RDWR);
    if (fd < 0) {
        perror("Failed to open device");
        printf("   提示: 請先執行 'sudo insmod simple_chardev.ko' 載入驅動\n");
        return 1;
    }
    printf("   成功! 文件描述符: %d\n\n", fd);

    /* 寫入數據 */
    printf("2. 寫入數據到設備...\n");
    snprintf(write_buf, BUFFER_SIZE, "Hello from userspace! Time: %ld", time(NULL));
    ret = write(fd, write_buf, strlen(write_buf));
    if (ret < 0) {
        perror("Failed to write");
        close(fd);
        return 1;
    }
    printf("   寫入 %zd 字節: \"%s\"\n\n", ret, write_buf);

    /* 重置文件偏移 */
    lseek(fd, 0, SEEK_SET);

    /* 讀取數據 */
    printf("3. 從設備讀取數據...\n");
    memset(read_buf, 0, BUFFER_SIZE);
    ret = read(fd, read_buf, BUFFER_SIZE);
    if (ret < 0) {
        perror("Failed to read");
        close(fd);
        return 1;
    }
    printf("   讀取 %zd 字節: \"%s\"\n\n", ret, read_buf);

    /* 驗證數據 */
    printf("4. 驗證數據...\n");
    if (strcmp(write_buf, read_buf) == 0) {
        printf("   ✓ 數據驗證成功!\n\n");
    } else {
        printf("   ✗ 數據不匹配!\n\n");
    }

    /* 測試 seek 操作 */
    printf("5. 測試 seek 操作...\n");
    lseek(fd, 5, SEEK_SET);
    memset(read_buf, 0, BUFFER_SIZE);
    ret = read(fd, read_buf, 10);
    printf("   從偏移 5 讀取 10 字節: \"%.*s\"\n\n", (int)ret, read_buf);

    /* 關閉設備 */
    printf("6. 關閉設備\n");
    close(fd);
    printf("   完成!\n\n");

    printf("=== 測試完成 ===\n");
    return 0;
}
