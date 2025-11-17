/*
 * I2C 總線掃描工具
 */

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <linux/i2c-dev.h>
#include <sys/ioctl.h>
#include <errno.h>

#define I2C_DEVICE "/dev/i2c-1"

int main(int argc, char *argv[]) {
    int fd;
    int addr;
    int found = 0;

    printf("I2C 總線掃描工具\n");
    printf("================\n\n");

    fd = open(I2C_DEVICE, O_RDWR);
    if (fd < 0) {
        perror("無法打開 I2C 設備");
        return 1;
    }

    printf("掃描 I2C 地址 0x03-0x77...\n\n");
    printf("     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f\n");

    for (int row = 0; row < 8; row++) {
        printf("%02x: ", row * 16);

        for (int col = 0; col < 16; col++) {
            addr = row * 16 + col;

            if (addr < 0x03 || addr > 0x77) {
                printf("   ");
                continue;
            }

            if (ioctl(fd, I2C_SLAVE, addr) < 0) {
                printf("-- ");
                continue;
            }

            if (read(fd, NULL, 0) == 0) {
                printf("%02x ", addr);
                found++;
            } else {
                printf("-- ");
            }
        }
        printf("\n");
    }

    printf("\n找到 %d 個 I2C 設備\n", found);

    close(fd);
    return 0;
}
