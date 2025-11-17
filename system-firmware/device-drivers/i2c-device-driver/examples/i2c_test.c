/*
 * I2C 基本讀寫測試
 */

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <linux/i2c-dev.h>
#include <sys/ioctl.h>
#include <string.h>

int main(int argc, char *argv[]) {
    int fd;
    uint8_t addr = 0x50;  /* 預設 EEPROM 地址 */
    uint8_t reg = 0x00;
    uint8_t value;

    if (argc > 1) {
        addr = (uint8_t)strtol(argv[1], NULL, 16);
    }

    printf("I2C 讀寫測試 (地址: 0x%02X)\n\n", addr);

    fd = open("/dev/i2c-1", O_RDWR);
    if (fd < 0) {
        perror("無法打開 I2C 設備");
        return 1;
    }

    if (ioctl(fd, I2C_SLAVE, addr) < 0) {
        perror("無法設置從機地址");
        close(fd);
        return 1;
    }

    /* 讀取測試 */
    if (write(fd, &reg, 1) == 1 && read(fd, &value, 1) == 1) {
        printf("讀取寄存器 0x%02X: 0x%02X\n", reg, value);
    } else {
        printf("讀取失敗\n");
    }

    close(fd);
    return 0;
}
