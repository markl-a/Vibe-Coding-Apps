# Makefile for USB Driver Test Programs

CC = gcc
CFLAGS = -Wall -Wextra -O2

TARGETS = test_usb_device

all: $(TARGETS)

test_usb_device: test_usb_device.c
	$(CC) $(CFLAGS) -o $@ $<

clean:
	rm -f $(TARGETS) *.o

test: all
	@echo "请使用 sudo ./test_usb.sh test 运行完整测试"

.PHONY: all clean test
