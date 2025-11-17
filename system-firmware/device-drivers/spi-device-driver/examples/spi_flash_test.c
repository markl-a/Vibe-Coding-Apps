/*
 * SPI Flash 讀取 ID 測試
 */

#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>
#include <linux/spi/spidev.h>
#include <sys/ioctl.h>

int main() {
    int fd;
    uint8_t tx[] = {0x9F, 0x00, 0x00, 0x00};  /* Read ID */
    uint8_t rx[4] = {0};
    struct spi_ioc_transfer tr = {
        .tx_buf = (unsigned long)tx,
        .rx_buf = (unsigned long)rx,
        .len = 4,
        .speed_hz = 1000000,
        .bits_per_word = 8,
    };

    printf("SPI Flash ID 讀取測試\n\n");

    fd = open("/dev/spidev0.0", O_RDWR);
    if (fd < 0) {
        perror("無法打開 SPI 設備");
        return 1;
    }

    if (ioctl(fd, SPI_IOC_MESSAGE(1), &tr) < 0) {
        perror("SPI 傳輸失敗");
        close(fd);
        return 1;
    }

    printf("Manufacturer ID: 0x%02X\n", rx[1]);
    printf("Device ID: 0x%02X%02X\n\n", rx[2], rx[3]);

    close(fd);
    return 0;
}
