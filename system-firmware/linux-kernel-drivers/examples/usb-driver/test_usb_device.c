/*
 * test_usb_device.c - USB 设备测试程序
 *
 * 用于测试 USB skeleton 驱动的用户空间程序
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <sys/ioctl.h>

#define DEVICE_PATH "/dev/usb/skel0"
#define BUFFER_SIZE 1024

void print_usage(const char *prog)
{
	printf("USB Device Test Program\n");
	printf("Usage:\n");
	printf("  %s read <count>         - Read <count> bytes from device\n", prog);
	printf("  %s write <data>         - Write <data> to device\n", prog);
	printf("  %s test                 - Run basic read/write test\n", prog);
	printf("  %s loop <iterations>    - Run loopback test\n", prog);
}

int test_read(const char *device, size_t count)
{
	int fd;
	char buffer[BUFFER_SIZE];
	ssize_t bytes_read;

	printf("Opening device: %s\n", device);
	fd = open(device, O_RDONLY);
	if (fd < 0) {
		perror("Failed to open device");
		return -1;
	}

	printf("Reading %zu bytes...\n", count);
	bytes_read = read(fd, buffer, count);
	if (bytes_read < 0) {
		perror("Failed to read from device");
		close(fd);
		return -1;
	}

	printf("Read %zd bytes: ", bytes_read);
	for (ssize_t i = 0; i < bytes_read && i < 32; i++) {
		printf("%02x ", (unsigned char)buffer[i]);
	}
	if (bytes_read > 32)
		printf("...");
	printf("\n");

	close(fd);
	return 0;
}

int test_write(const char *device, const char *data)
{
	int fd;
	ssize_t bytes_written;
	size_t len = strlen(data);

	printf("Opening device: %s\n", device);
	fd = open(device, O_WRONLY);
	if (fd < 0) {
		perror("Failed to open device");
		return -1;
	}

	printf("Writing %zu bytes: '%s'\n", len, data);
	bytes_written = write(fd, data, len);
	if (bytes_written < 0) {
		perror("Failed to write to device");
		close(fd);
		return -1;
	}

	printf("Wrote %zd bytes successfully\n", bytes_written);

	close(fd);
	return 0;
}

int test_basic(const char *device)
{
	int fd;
	char write_buf[] = "Hello USB Device!";
	char read_buf[BUFFER_SIZE] = {0};
	ssize_t bytes;

	printf("\n=== Basic Read/Write Test ===\n");

	/* 打开设备 */
	printf("1. Opening device: %s\n", device);
	fd = open(device, O_RDWR);
	if (fd < 0) {
		perror("Failed to open device");
		return -1;
	}

	/* 写入数据 */
	printf("2. Writing data: '%s'\n", write_buf);
	bytes = write(fd, write_buf, strlen(write_buf));
	if (bytes < 0) {
		perror("Write failed");
		close(fd);
		return -1;
	}
	printf("   Wrote %zd bytes\n", bytes);

	/* 等待一下 */
	usleep(100000);

	/* 读取数据 */
	printf("3. Reading data...\n");
	bytes = read(fd, read_buf, sizeof(read_buf));
	if (bytes < 0) {
		perror("Read failed");
		close(fd);
		return -1;
	}
	printf("   Read %zd bytes: '%s'\n", bytes, read_buf);

	/* 比较数据 */
	if (strncmp(write_buf, read_buf, strlen(write_buf)) == 0) {
		printf("✓ Data matches! Test PASSED\n");
	} else {
		printf("✗ Data mismatch! Test FAILED\n");
	}

	close(fd);
	return 0;
}

int test_loopback(const char *device, int iterations)
{
	int fd;
	char write_buf[256];
	char read_buf[256];
	int success = 0, failed = 0;

	printf("\n=== Loopback Test (%d iterations) ===\n", iterations);

	fd = open(device, O_RDWR);
	if (fd < 0) {
		perror("Failed to open device");
		return -1;
	}

	for (int i = 0; i < iterations; i++) {
		/* 准备测试数据 */
		snprintf(write_buf, sizeof(write_buf),
			 "Test iteration %d: %08x", i, i * 0x12345678);

		/* 写入 */
		if (write(fd, write_buf, strlen(write_buf)) < 0) {
			perror("Write failed");
			failed++;
			continue;
		}

		usleep(10000);

		/* 读取 */
		memset(read_buf, 0, sizeof(read_buf));
		if (read(fd, read_buf, sizeof(read_buf)) < 0) {
			perror("Read failed");
			failed++;
			continue;
		}

		/* 验证 */
		if (strcmp(write_buf, read_buf) == 0) {
			success++;
			if (i % 10 == 0)
				printf(".");
			fflush(stdout);
		} else {
			failed++;
			printf("\nIteration %d: Data mismatch\n", i);
			printf("  Expected: %s\n", write_buf);
			printf("  Got:      %s\n", read_buf);
		}
	}

	printf("\n\nResults:\n");
	printf("  Success: %d\n", success);
	printf("  Failed:  %d\n", failed);
	printf("  Success Rate: %.2f%%\n", (100.0 * success) / iterations);

	close(fd);
	return (failed == 0) ? 0 : -1;
}

int main(int argc, char *argv[])
{
	const char *device = DEVICE_PATH;

	if (argc < 2) {
		print_usage(argv[0]);
		return 1;
	}

	/* 检查是否指定了自定义设备路径 */
	if (getenv("USB_DEVICE"))
		device = getenv("USB_DEVICE");

	if (strcmp(argv[1], "read") == 0) {
		if (argc < 3) {
			fprintf(stderr, "Error: Missing count argument\n");
			print_usage(argv[0]);
			return 1;
		}
		return test_read(device, atoi(argv[2]));

	} else if (strcmp(argv[1], "write") == 0) {
		if (argc < 3) {
			fprintf(stderr, "Error: Missing data argument\n");
			print_usage(argv[0]);
			return 1;
		}
		return test_write(device, argv[2]);

	} else if (strcmp(argv[1], "test") == 0) {
		return test_basic(device);

	} else if (strcmp(argv[1], "loop") == 0) {
		int iterations = 100;
		if (argc >= 3)
			iterations = atoi(argv[2]);
		return test_loopback(device, iterations);

	} else {
		fprintf(stderr, "Error: Unknown command '%s'\n", argv[1]);
		print_usage(argv[0]);
		return 1;
	}

	return 0;
}
