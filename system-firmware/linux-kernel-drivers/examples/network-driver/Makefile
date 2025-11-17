# Makefile for network driver examples

CC = gcc
CFLAGS = -Wall -O2

TARGETS = test_network

.PHONY: all clean test

all: $(TARGETS)

test_network: test_network.c
	$(CC) $(CFLAGS) -o $@ $<

test: all
	@echo "請先使用 sudo 載入驅動並配置接口:"
	@echo "  sudo insmod ../../network-driver/virtual_netdev.ko"
	@echo "  sudo ip link set vnet0 up"
	@echo ""
	@echo "然後執行測試:"
	@echo "  sudo ./test_network"
	@echo ""
	@echo "自動化測試:"
	@echo "  sudo ./test_ping.sh"
	@echo "  sudo ./test_traffic.sh"

clean:
	rm -f $(TARGETS) *.o
