/*
 * USB 串口回顯測試
 */

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <termios.h>
#include <string.h>

int main(int argc, char *argv[]) {
    int fd;
    struct termios tty;
    char buf[256];
    int n;
    const char *device = "/dev/ttyUSB0";

    if (argc > 1) {
        device = argv[1];
    }

    printf("USB 串口回顯測試\n");
    printf("設備: %s\n\n", device);

    fd = open(device, O_RDWR | O_NOCTTY);
    if (fd < 0) {
        perror("無法打開串口");
        return 1;
    }

    /* 配置串口 */
    tcgetattr(fd, &tty);
    cfsetospeed(&tty, B115200);
    cfsetispeed(&tty, B115200);
    tty.c_cflag = (tty.c_cflag & ~CSIZE) | CS8;
    tty.c_iflag &= ~IGNBRK;
    tty.c_lflag = 0;
    tty.c_oflag = 0;
    tty.c_cc[VMIN] = 0;
    tty.c_cc[VTIME] = 5;
    tcsetattr(fd, TCSANOW, &tty);

    printf("發送測試字串...\n");

    const char *test_str = "Hello USB Serial!\n";
    write(fd, test_str, strlen(test_str));

    usleep(100000);

    n = read(fd, buf, sizeof(buf) - 1);
    if (n > 0) {
        buf[n] = 0;
        printf("接收: %s\n", buf);
    }

    close(fd);
    return 0;
}
