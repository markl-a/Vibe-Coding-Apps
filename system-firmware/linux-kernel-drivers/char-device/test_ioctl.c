/*
 * test_ioctl.c - ioctl 测试程序
 */

#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <string.h>

#define DEVICE_PATH "/dev/echardev"

/* ioctl 命令定义（需与驱动保持一致） */
#define ECHARDEV_IOC_MAGIC 'E'
#define ECHARDEV_IOCRESET    _IO(ECHARDEV_IOC_MAGIC, 0)
#define ECHARDEV_IOCGSIZE    _IOR(ECHARDEV_IOC_MAGIC, 1, int)
#define ECHARDEV_IOCSSIZE    _IOW(ECHARDEV_IOC_MAGIC, 2, int)
#define ECHARDEV_IOCXSIZE    _IOWR(ECHARDEV_IOC_MAGIC, 3, int)

int main(int argc, char *argv[])
{
	int fd;
	int size, new_size;
	int ret;

	printf("Enhanced Character Device ioctl Test\n");
	printf("=====================================\n\n");

	/* 打开设备 */
	fd = open(DEVICE_PATH, O_RDWR);
	if (fd < 0) {
		perror("Failed to open device");
		return 1;
	}

	/* 测试 IOCGSIZE - 获取大小 */
	printf("1. Getting current buffer size...\n");
	ret = ioctl(fd, ECHARDEV_IOCGSIZE, &size);
	if (ret < 0) {
		perror("IOCGSIZE failed");
	} else {
		printf("   Current buffer size: %d bytes\n", size);
	}

	/* 测试 IOCSSIZE - 设置大小 */
	printf("\n2. Setting max size to 2048 bytes...\n");
	new_size = 2048;
	ret = ioctl(fd, ECHARDEV_IOCSSIZE, &new_size);
	if (ret < 0) {
		perror("IOCSSIZE failed");
	} else {
		printf("   Max size set successfully\n");
	}

	/* 测试 IOCXSIZE - 交换大小 */
	printf("\n3. Exchanging size (get current, set new)...\n");
	new_size = 1024;
	ret = ioctl(fd, ECHARDEV_IOCXSIZE, &new_size);
	if (ret < 0) {
		perror("IOCXSIZE failed");
	} else {
		printf("   Old size was: %d bytes\n", new_size);
	}

	/* 写入一些数据 */
	printf("\n4. Writing test data...\n");
	const char *msg = "Hello from ioctl test!";
	ssize_t written = write(fd, msg, strlen(msg));
	if (written < 0) {
		perror("Write failed");
	} else {
		printf("   Wrote %zd bytes\n", written);
	}

	/* 再次获取大小 */
	printf("\n5. Getting buffer size after write...\n");
	ret = ioctl(fd, ECHARDEV_IOCGSIZE, &size);
	if (ret < 0) {
		perror("IOCGSIZE failed");
	} else {
		printf("   Buffer size after write: %d bytes\n", size);
	}

	/* 测试 IOCRESET - 重置 */
	printf("\n6. Resetting device...\n");
	ret = ioctl(fd, ECHARDEV_IOCRESET);
	if (ret < 0) {
		perror("IOCRESET failed");
	} else {
		printf("   Device reset successfully\n");
	}

	/* 确认重置后的大小 */
	printf("\n7. Verifying reset...\n");
	ret = ioctl(fd, ECHARDEV_IOCGSIZE, &size);
	if (ret < 0) {
		perror("IOCGSIZE failed");
	} else {
		printf("   Buffer size after reset: %d bytes\n", size);
	}

	close(fd);

	printf("\n=====================================\n");
	printf("ioctl test completed!\n");

	return 0;
}
