# Makefile for USB Skeleton Driver

obj-m += usb_skeleton.o

# Kernel build directory
KDIR := /lib/modules/$(shell uname -r)/build

# Current directory
PWD := $(shell pwd)

# Default target
all:
	@echo "Building USB skeleton driver..."
	$(MAKE) -C $(KDIR) M=$(PWD) modules

# Clean target
clean:
	@echo "Cleaning USB skeleton driver..."
	$(MAKE) -C $(KDIR) M=$(PWD) clean

# Install module
install:
	@echo "Installing USB skeleton driver..."
	sudo insmod usb_skeleton.ko

# Uninstall module
uninstall:
	@echo "Uninstalling USB skeleton driver..."
	sudo rmmod usb_skeleton

# Show module info
info:
	@echo "Module information:"
	@modinfo usb_skeleton.ko

# Show kernel messages
log:
	@echo "Kernel messages (last 20 lines):"
	@dmesg | tail -20

# Test module load/unload
test:
	@echo "Testing USB skeleton driver..."
	@echo "1. Loading module..."
	@sudo insmod usb_skeleton.ko || true
	@sleep 1
	@echo "2. Checking if module is loaded..."
	@lsmod | grep usb_skeleton
	@echo "3. Checking kernel messages..."
	@dmesg | tail -10
	@echo "4. Unloading module..."
	@sudo rmmod usb_skeleton || true
	@echo "Test complete!"

.PHONY: all clean install uninstall info log test
