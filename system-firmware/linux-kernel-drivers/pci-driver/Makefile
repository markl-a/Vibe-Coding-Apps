# Makefile for PCI Skeleton Driver

obj-m += pci_skeleton.o

# Kernel build directory
KDIR := /lib/modules/$(shell uname -r)/build

# Current directory
PWD := $(shell pwd)

# Default target
all:
	@echo "Building PCI skeleton driver..."
	$(MAKE) -C $(KDIR) M=$(PWD) modules

# Clean target
clean:
	@echo "Cleaning PCI skeleton driver..."
	$(MAKE) -C $(KDIR) M=$(PWD) clean

# Install module
install:
	@echo "Installing PCI skeleton driver..."
	sudo insmod pci_skeleton.ko

# Uninstall module
uninstall:
	@echo "Uninstalling PCI skeleton driver..."
	sudo rmmod pci_skeleton

# Show module info
info:
	@echo "Module information:"
	@modinfo pci_skeleton.ko

# Show kernel messages
log:
	@echo "Kernel messages (last 20 lines):"
	@dmesg | tail -20

# Show PCI devices
lspci:
	@echo "PCI devices:"
	@lspci -v

# Test module load/unload
test:
	@echo "Testing PCI skeleton driver..."
	@echo "1. Showing PCI devices..."
	@lspci | head -10
	@echo ""
	@echo "2. Loading module..."
	@sudo insmod pci_skeleton.ko || true
	@sleep 1
	@echo "3. Checking if module is loaded..."
	@lsmod | grep pci_skeleton || echo "Module not loaded (no matching PCI device?)"
	@echo "4. Checking kernel messages..."
	@dmesg | tail -10
	@echo "5. Unloading module..."
	@sudo rmmod pci_skeleton 2>/dev/null || echo "Module not loaded"
	@echo "Test complete!"

.PHONY: all clean install uninstall info log lspci test
