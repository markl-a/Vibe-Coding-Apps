/*
 * USB 串口迴路測試
 */

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <termios.h>
#include <string.h>

int main() {
    int fd;
    struct termios tty;
    char tx_buf[] = "USB Serial Loopback Test";
    char rx_buf[256] = {0};

    fd = open("/dev/ttyUSB0", O_RDWR);
    if (fd < 0) {
        perror("無法打開串口");
        return 1;
    }

    tcgetattr(fd, &tty);
    cfsetspeed(&tty, B115200);
    tty.c_cflag = CS8 | CREAD | CLOCAL;
    tty.c_iflag = 0;
    tty.c_oflag = 0;
    tty.c_lflag = 0;
    tcsetattr(fd, TCSANOW, &tty);

    printf("USB 串口迴路測試\n");
    printf("發送: %s\n", tx_buf);

    write(fd, tx_buf, strlen(tx_buf));
    usleep(100000);

    int n = read(fd, rx_buf, sizeof(rx_buf) - 1);
    if (n > 0) {
        rx_buf[n] = 0;
        printf("接收: %s\n", rx_buf);
        printf("測試%s\n", strcmp(tx_buf, rx_buf) == 0 ? "通過" : "失敗");
    }

    close(fd);
    return 0;
}
