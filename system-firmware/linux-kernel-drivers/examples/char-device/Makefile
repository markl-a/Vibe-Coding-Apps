# Makefile for character device examples

CC = gcc
CFLAGS = -Wall -O2

TARGETS = test_read_write test_concurrent

.PHONY: all clean test

all: $(TARGETS)

test_read_write: test_read_write.c
	$(CC) $(CFLAGS) -o $@ $<

test_concurrent: test_concurrent.c
	$(CC) $(CFLAGS) -o $@ $<

test: all
	@echo "請先使用 sudo 載入驅動，然後執行:"
	@echo "  sudo ./test_read_write"
	@echo "  sudo ./test_concurrent"
	@echo ""
	@echo "或使用自動化測試腳本:"
	@echo "  sudo ./test_script.sh"

clean:
	rm -f $(TARGETS) *.o
