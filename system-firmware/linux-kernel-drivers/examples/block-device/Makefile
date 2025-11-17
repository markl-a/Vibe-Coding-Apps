# Makefile for block device examples

CC = gcc
CFLAGS = -Wall -O2

TARGETS = test_ramdisk

.PHONY: all clean test

all: $(TARGETS)

test_ramdisk: test_ramdisk.c
	$(CC) $(CFLAGS) -o $@ $<

test: all
	@echo "請先使用 sudo 載入驅動，然後執行:"
	@echo "  sudo ./test_ramdisk"
	@echo ""
	@echo "文件系統測試:"
	@echo "  sudo ./test_filesystem.sh"
	@echo ""
	@echo "性能測試:"
	@echo "  sudo ./benchmark.sh"

clean:
	rm -f $(TARGETS) *.o
