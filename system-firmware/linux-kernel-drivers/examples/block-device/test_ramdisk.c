/*
 * test_ramdisk.c - RAM 磁碟測試程序
 *
 * 測試 RAM 磁碟的基本讀寫功能
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/fs.h>

#define DEVICE_PATH "/dev/sramdisk"
#define SECTOR_SIZE 512
#define TEST_SECTORS 10

int main(void)
{
    int fd;
    unsigned char write_buf[SECTOR_SIZE * TEST_SECTORS];
    unsigned char read_buf[SECTOR_SIZE * TEST_SECTORS];
    ssize_t ret;
    unsigned long long size;
    int i;

    printf("=== RAM 磁碟測試程序 ===\n\n");

    /* 打開設備 */
    printf("1. 打開 RAM 磁碟 %s...\n", DEVICE_PATH);
    fd = open(DEVICE_PATH, O_RDWR);
    if (fd < 0) {
        perror("Failed to open device");
        printf("   提示: 請先執行 'sudo insmod simple_ramdisk.ko' 載入驅動\n");
        return 1;
    }
    printf("   成功!\n\n");

    /* 獲取磁碟大小 */
    printf("2. 獲取磁碟大小...\n");
    if (ioctl(fd, BLKGETSIZE64, &size) < 0) {
        perror("Failed to get disk size");
    } else {
        printf("   磁碟大小: %llu 字節 (%llu MB)\n\n",
               size, size / (1024 * 1024));
    }

    /* 準備測試數據 */
    printf("3. 準備測試數據 (%d 扇區)...\n", TEST_SECTORS);
    for (i = 0; i < SECTOR_SIZE * TEST_SECTORS; i++) {
        write_buf[i] = i % 256;
    }
    printf("   完成!\n\n");

    /* 寫入數據 */
    printf("4. 寫入數據到磁碟...\n");
    ret = write(fd, write_buf, sizeof(write_buf));
    if (ret < 0) {
        perror("Failed to write");
        close(fd);
        return 1;
    }
    printf("   寫入 %zd 字節\n\n", ret);

    /* 重置位置 */
    lseek(fd, 0, SEEK_SET);

    /* 讀取數據 */
    printf("5. 讀取數據...\n");
    memset(read_buf, 0, sizeof(read_buf));
    ret = read(fd, read_buf, sizeof(read_buf));
    if (ret < 0) {
        perror("Failed to read");
        close(fd);
        return 1;
    }
    printf("   讀取 %zd 字節\n\n", ret);

    /* 驗證數據 */
    printf("6. 驗證數據完整性...\n");
    if (memcmp(write_buf, read_buf, sizeof(write_buf)) == 0) {
        printf("   ✓ 數據驗證成功!\n\n");
    } else {
        printf("   ✗ 數據不匹配!\n");
        for (i = 0; i < sizeof(write_buf); i++) {
            if (write_buf[i] != read_buf[i]) {
                printf("   第一個不匹配位置: 字節 %d (寫入: 0x%02x, 讀取: 0x%02x)\n",
                       i, write_buf[i], read_buf[i]);
                break;
            }
        }
        printf("\n");
    }

    /* 測試隨機訪問 */
    printf("7. 測試隨機位置訪問...\n");
    off_t offset = 50 * SECTOR_SIZE;
    lseek(fd, offset, SEEK_SET);

    unsigned char pattern = 0xAA;
    memset(write_buf, pattern, SECTOR_SIZE);
    write(fd, write_buf, SECTOR_SIZE);

    lseek(fd, offset, SEEK_SET);
    memset(read_buf, 0, SECTOR_SIZE);
    read(fd, read_buf, SECTOR_SIZE);

    if (read_buf[0] == pattern && read_buf[SECTOR_SIZE-1] == pattern) {
        printf("   ✓ 隨機訪問測試成功!\n\n");
    } else {
        printf("   ✗ 隨機訪問測試失敗!\n\n");
    }

    /* 關閉設備 */
    printf("8. 關閉設備\n");
    close(fd);
    printf("   完成!\n\n");

    printf("=== 測試完成 ===\n");
    return 0;
}
