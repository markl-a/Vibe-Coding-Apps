# Makefile for SPI Device Driver

obj-m += spi_device.o

KDIR := /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
	make -C $(KDIR) M=$(PWD) modules

clean:
	make -C $(KDIR) M=$(PWD) clean

install:
	sudo insmod spi_device.ko

uninstall:
	sudo rmmod spi_device

test:
	@echo "Testing SPI device driver..."
	@lsmod | grep spi || echo "SPI modules not loaded"
	@ls -l /dev/spi* 2>/dev/null || echo "No SPI devices found"

.PHONY: all clean install uninstall test
