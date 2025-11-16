# Makefile for Platform LED Driver

obj-m += platform_led_driver.o

KDIR ?= /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
	$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean

install:
	@echo "Loading platform driver..."
	sudo insmod platform_led_driver.ko
	@echo "Driver loaded"
	@lsmod | grep platform_led

uninstall:
	@echo "Unloading driver..."
	sudo rmmod platform_led_driver
	@echo "Driver unloaded"

info:
	modinfo platform_led_driver.ko

dmesg:
	dmesg | tail -20

.PHONY: all clean install uninstall info dmesg
