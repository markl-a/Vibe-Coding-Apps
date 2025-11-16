# Makefile for Interrupt Handler Example

obj-m += interrupt_example.o

KDIR ?= /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
	$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean

install:
	@echo "Loading interrupt example driver..."
	sudo insmod interrupt_example.ko
	@echo "Driver loaded (demo mode - no actual IRQ)"
	@lsmod | grep interrupt_example

# 載入並指定 IRQ 號（請根據系統實際情況修改）
install-with-irq:
	@echo "Loading with IRQ number..."
	@echo "WARNING: Make sure the IRQ number is valid and not in use!"
	sudo insmod interrupt_example.ko irq_number=5
	@lsmod | grep interrupt_example

uninstall:
	@echo "Unloading driver..."
	sudo rmmod interrupt_example
	@echo "Driver unloaded"

info:
	modinfo interrupt_example.ko

dmesg:
	dmesg | tail -20

# 查看中斷統計
show-stats:
	@echo "=== Interrupt Statistics ==="
	@cat /sys/devices/platform/irq_example/irq_count 2>/dev/null || echo "Driver not loaded"
	@echo ""
	@echo "=== System Interrupts ==="
	@cat /proc/interrupts | head -20

.PHONY: all clean install install-with-irq uninstall info dmesg show-stats
