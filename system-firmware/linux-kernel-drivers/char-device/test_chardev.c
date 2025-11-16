/*
 * test_chardev.c - 字元設備驅動測試程式
 *
 * 這個程式用於測試 simple_chardev 驅動的功能
 */

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <errno.h>

#define DEVICE_PATH "/dev/simple_char"
#define BUFFER_SIZE 1024

void print_usage(const char *prog_name)
{
    printf("Usage: %s [option]\n", prog_name);
    printf("Options:\n");
    printf("  -w <text>    Write text to device\n");
    printf("  -r           Read from device\n");
    printf("  -t           Run all tests\n");
    printf("  -h           Show this help\n");
}

int test_write(int fd, const char *data)
{
    ssize_t ret;
    size_t len = strlen(data);

    printf("Writing %zu bytes: \"%s\"\n", len, data);

    ret = write(fd, data, len);
    if (ret < 0) {
        perror("write failed");
        return -1;
    }

    printf("Successfully wrote %zd bytes\n", ret);
    return 0;
}

int test_read(int fd)
{
    char buffer[BUFFER_SIZE];
    ssize_t ret;

    /* 重新定位到開頭 */
    lseek(fd, 0, SEEK_SET);

    printf("Reading from device...\n");

    ret = read(fd, buffer, sizeof(buffer) - 1);
    if (ret < 0) {
        perror("read failed");
        return -1;
    }

    buffer[ret] = '\0';
    printf("Successfully read %zd bytes: \"%s\"\n", ret, buffer);
    return 0;
}

int test_seek(int fd)
{
    off_t pos;
    char buffer[64];
    ssize_t ret;

    printf("\n=== Testing lseek ===\n");

    /* 寫入一些測試數據 */
    lseek(fd, 0, SEEK_SET);
    write(fd, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 36);

    /* 測試 SEEK_SET */
    printf("Testing SEEK_SET to position 10...\n");
    pos = lseek(fd, 10, SEEK_SET);
    printf("Current position: %ld\n", (long)pos);

    ret = read(fd, buffer, 5);
    buffer[ret] = '\0';
    printf("Read from position 10: \"%s\"\n", buffer);

    /* 測試 SEEK_CUR */
    printf("\nTesting SEEK_CUR +5...\n");
    pos = lseek(fd, 5, SEEK_CUR);
    printf("Current position: %ld\n", (long)pos);

    ret = read(fd, buffer, 5);
    buffer[ret] = '\0';
    printf("Read data: \"%s\"\n", buffer);

    /* 測試 SEEK_END */
    printf("\nTesting SEEK_END -5...\n");
    pos = lseek(fd, -5, SEEK_END);
    printf("Current position: %ld\n", (long)pos);

    ret = read(fd, buffer, 5);
    buffer[ret] = '\0';
    printf("Read data: \"%s\"\n", buffer);

    return 0;
}

int run_all_tests(void)
{
    int fd;
    int ret = 0;

    printf("=== Simple Character Device Driver Test Suite ===\n\n");

    /* 打開設備 */
    printf("Opening device %s...\n", DEVICE_PATH);
    fd = open(DEVICE_PATH, O_RDWR);
    if (fd < 0) {
        perror("Failed to open device");
        printf("\nMake sure the driver is loaded with: sudo insmod simple_chardev.ko\n");
        return 1;
    }
    printf("Device opened successfully (fd=%d)\n\n", fd);

    /* 測試寫入 */
    printf("=== Test 1: Write Operation ===\n");
    if (test_write(fd, "Hello, Kernel World!") < 0) {
        ret = 1;
        goto cleanup;
    }
    printf("\n");

    /* 測試讀取 */
    printf("=== Test 2: Read Operation ===\n");
    if (test_read(fd) < 0) {
        ret = 1;
        goto cleanup;
    }
    printf("\n");

    /* 測試定位 */
    printf("=== Test 3: Seek Operations ===\n");
    if (test_seek(fd) < 0) {
        ret = 1;
        goto cleanup;
    }
    printf("\n");

    /* 測試多次寫入 */
    printf("=== Test 4: Multiple Write Operations ===\n");
    lseek(fd, 0, SEEK_SET);
    test_write(fd, "First write. ");
    test_write(fd, "Second write. ");
    test_write(fd, "Third write.");
    printf("\nReading all data:\n");
    test_read(fd);
    printf("\n");

    printf("=== All tests completed successfully! ===\n");

cleanup:
    close(fd);
    printf("\nDevice closed\n");
    return ret;
}

int main(int argc, char *argv[])
{
    int fd;
    int opt;
    int ret = 0;

    if (argc < 2) {
        run_all_tests();
        return 0;
    }

    while ((opt = getopt(argc, argv, "w:rth")) != -1) {
        switch (opt) {
        case 'w': {
            /* 寫入模式 */
            fd = open(DEVICE_PATH, O_WRONLY);
            if (fd < 0) {
                perror("Failed to open device");
                return 1;
            }

            if (test_write(fd, optarg) < 0)
                ret = 1;

            close(fd);
            break;
        }

        case 'r': {
            /* 讀取模式 */
            fd = open(DEVICE_PATH, O_RDONLY);
            if (fd < 0) {
                perror("Failed to open device");
                return 1;
            }

            if (test_read(fd) < 0)
                ret = 1;

            close(fd);
            break;
        }

        case 't':
            /* 運行所有測試 */
            return run_all_tests();

        case 'h':
        default:
            print_usage(argv[0]);
            return 0;
        }
    }

    return ret;
}
