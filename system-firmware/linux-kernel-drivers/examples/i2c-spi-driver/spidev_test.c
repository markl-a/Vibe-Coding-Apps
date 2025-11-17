/*
 * spidev_test.c - spidev 用戶空間測試程序
 *
 * 使用 spidev 接口測試 SPI 設備
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/spi/spidev.h>
#include <stdint.h>

#define SPI_DEVICE "/dev/spidev0.0"

static void print_buffer(const char *title, uint8_t *buf, int len)
{
    int i;
    printf("%s (%d bytes):\n  ", title, len);
    for (i = 0; i < len; i++) {
        printf("%02X ", buf[i]);
        if ((i + 1) % 16 == 0)
            printf("\n  ");
    }
    printf("\n");
}

int main(void)
{
    int fd;
    uint8_t mode = SPI_MODE_0;
    uint8_t bits = 8;
    uint32_t speed = 1000000;  /* 1 MHz */
    uint16_t delay = 0;
    uint8_t tx_buf[32];
    uint8_t rx_buf[32];
    struct spi_ioc_transfer xfer;
    int ret;
    int i;

    printf("=== SPI 用戶空間測試程序 ===\n\n");

    /* 打開 SPI 設備 */
    printf("1. 打開 SPI 設備 %s...\n", SPI_DEVICE);
    fd = open(SPI_DEVICE, O_RDWR);
    if (fd < 0) {
        perror("Failed to open SPI device");
        printf("   提示: 確保 spidev 模組已載入並且設備存在\n");
        printf("   modprobe spidev\n");
        return 1;
    }
    printf("   成功!\n\n");

    /* 設置 SPI 模式 */
    printf("2. 設置 SPI 模式...\n");
    ret = ioctl(fd, SPI_IOC_WR_MODE, &mode);
    if (ret < 0) {
        perror("Failed to set SPI mode");
        close(fd);
        return 1;
    }
    printf("   模式: %d\n\n", mode);

    /* 設置位數 */
    printf("3. 設置每字位數...\n");
    ret = ioctl(fd, SPI_IOC_WR_BITS_PER_WORD, &bits);
    if (ret < 0) {
        perror("Failed to set bits per word");
        close(fd);
        return 1;
    }
    printf("   位數: %d\n\n", bits);

    /* 設置速度 */
    printf("4. 設置傳輸速度...\n");
    ret = ioctl(fd, SPI_IOC_WR_MAX_SPEED_HZ, &speed);
    if (ret < 0) {
        perror("Failed to set speed");
        close(fd);
        return 1;
    }
    printf("   速度: %d Hz\n\n", speed);

    /* 準備測試數據 */
    printf("5. 準備測試數據...\n");
    for (i = 0; i < sizeof(tx_buf); i++) {
        tx_buf[i] = i;
    }
    memset(rx_buf, 0, sizeof(rx_buf));
    print_buffer("發送數據", tx_buf, 16);
    printf("\n");

    /* 執行 SPI 傳輸 */
    printf("6. 執行 SPI 傳輸...\n");
    memset(&xfer, 0, sizeof(xfer));
    xfer.tx_buf = (unsigned long)tx_buf;
    xfer.rx_buf = (unsigned long)rx_buf;
    xfer.len = 16;
    xfer.speed_hz = speed;
    xfer.bits_per_word = bits;
    xfer.delay_usecs = delay;

    ret = ioctl(fd, SPI_IOC_MESSAGE(1), &xfer);
    if (ret < 0) {
        perror("Failed to transfer SPI message");
        close(fd);
        return 1;
    }
    printf("   傳輸 %d 字節\n", ret);
    print_buffer("接收數據", rx_buf, ret);
    printf("\n");

    /* 多次傳輸測試 */
    printf("7. 多次傳輸測試...\n");
    for (i = 0; i < 3; i++) {
        tx_buf[0] = 0xA0 + i;
        memset(rx_buf, 0, sizeof(rx_buf));

        ret = write(fd, tx_buf, 8);
        if (ret > 0) {
            printf("   傳輸 #%d: 發送 %d 字節\n", i + 1, ret);
        }

        ret = read(fd, rx_buf, 8);
        if (ret > 0) {
            printf("   傳輸 #%d: 接收 %d 字節\n", i + 1, ret);
        }
    }
    printf("\n");

    /* 關閉設備 */
    printf("8. 關閉設備\n");
    close(fd);
    printf("   完成!\n\n");

    printf("=== 測試完成 ===\n");
    return 0;
}
