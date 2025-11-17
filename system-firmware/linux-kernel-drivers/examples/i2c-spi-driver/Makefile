# Makefile for I2C/SPI driver examples

CC = gcc
CFLAGS = -Wall -O2

TARGETS = spidev_test

.PHONY: all clean test

all: $(TARGETS)

spidev_test: spidev_test.c
	$(CC) $(CFLAGS) -o $@ $<

test: all
	@echo "I2C 測試:"
	@echo "  sudo ./test_i2c_sysfs.sh"
	@echo "  sudo ./test_i2c_tools.sh"
	@echo ""
	@echo "SPI 測試:"
	@echo "  sudo ./test_spi_sysfs.sh"
	@echo "  sudo ./spidev_test (需要 spidev 設備)"

clean:
	rm -f $(TARGETS) *.o
