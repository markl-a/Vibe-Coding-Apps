# Makefile for GPIO Controller Driver

obj-m += gpio_driver.o

KDIR := /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
	make -C $(KDIR) M=$(PWD) modules

clean:
	make -C $(KDIR) M=$(PWD) clean

install:
	sudo insmod gpio_driver.ko

uninstall:
	sudo rmmod gpio_driver

reload: uninstall install

test:
	@echo "Testing GPIO controller driver..."
	@echo "Checking for loaded module:"
	@lsmod | grep gpio_driver || echo "Module not loaded"
	@echo "\nChecking GPIO chips:"
	@ls -l /sys/class/gpio/ 2>/dev/null || echo "No GPIO class found"

info:
	modinfo gpio_driver.ko

.PHONY: all clean install uninstall reload test info
