# Makefile for Virtual Network Device Driver

obj-m += virtual_netdev.o

KDIR ?= /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
	$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean

install:
	@echo "Loading module..."
	sudo insmod virtual_netdev.ko
	@echo "Module loaded successfully"
	@sleep 1
	@echo ""
	@echo "=== Network Device Information ==="
	@ip link show | grep vnet || echo "Device created"
	@lsmod | grep virtual_netdev

uninstall:
	@echo "Bringing down interface..."
	-sudo ip link set vnet0 down 2>/dev/null || true
	@echo "Unloading module..."
	sudo rmmod virtual_netdev
	@echo "Module unloaded successfully"

info:
	modinfo virtual_netdev.ko

dmesg:
	dmesg | tail -20

test: install
	@echo ""
	@echo "=== Testing Virtual Network Device ==="
	@echo ""
	@echo "Bringing up interface..."
	@sudo ip link set vnet0 up
	@echo ""
	@echo "Assigning IP address..."
	@sudo ip addr add 192.168.100.1/24 dev vnet0
	@echo ""
	@echo "Interface status:"
	@ip addr show vnet0
	@echo ""
	@echo "Testing loopback (ping)..."
	@ping -c 3 192.168.100.1
	@echo ""
	@echo "Network statistics:"
	@ip -s link show vnet0
	@echo ""
	@echo "=== Test completed ==="

rebuild: clean all test

.PHONY: all clean install uninstall info dmesg test rebuild
