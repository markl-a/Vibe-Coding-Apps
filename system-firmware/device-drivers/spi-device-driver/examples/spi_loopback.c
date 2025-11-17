/*
 * SPI 迴路測試
 */

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <linux/spi/spidev.h>
#include <sys/ioctl.h>
#include <string.h>

#define SPI_DEVICE "/dev/spidev0.0"

int main() {
    int fd;
    uint8_t tx[] = {0x01, 0x02, 0x03, 0x04, 0x05};
    uint8_t rx[sizeof(tx)] = {0};
    struct spi_ioc_transfer tr = {
        .tx_buf = (unsigned long)tx,
        .rx_buf = (unsigned long)rx,
        .len = sizeof(tx),
        .speed_hz = 500000,
        .bits_per_word = 8,
    };

    printf("SPI 迴路測試\n\n");

    fd = open(SPI_DEVICE, O_RDWR);
    if (fd < 0) {
        perror("無法打開 SPI 設備");
        return 1;
    }

    printf("發送: ");
    for (int i = 0; i < sizeof(tx); i++) {
        printf("0x%02X ", tx[i]);
    }
    printf("\n");

    if (ioctl(fd, SPI_IOC_MESSAGE(1), &tr) < 0) {
        perror("SPI 傳輸失敗");
        close(fd);
        return 1;
    }

    printf("接收: ");
    for (int i = 0; i < sizeof(rx); i++) {
        printf("0x%02X ", rx[i]);
    }
    printf("\n\n");

    /* 驗證迴路 */
    if (memcmp(tx, rx, sizeof(tx)) == 0) {
        printf("迴路測試通過！\n");
    } else {
        printf("迴路測試失敗！\n");
    }

    close(fd);
    return 0;
}
