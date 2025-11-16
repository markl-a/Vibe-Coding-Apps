# Makefile for USB Serial Driver

obj-m += usb_serial.o

KDIR := /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
	make -C $(KDIR) M=$(PWD) modules

clean:
	make -C $(KDIR) M=$(PWD) clean

install:
	sudo insmod usb_serial.ko

uninstall:
	sudo rmmod usb_serial

reload: uninstall install

test:
	@echo "Testing USB serial driver..."
	@echo "Checking for loaded module:"
	@lsmod | grep usb_serial || echo "Module not loaded"
	@echo "\nChecking for USB serial devices:"
	@ls -l /dev/ttyUSB* 2>/dev/null || echo "No USB serial devices found"

info:
	modinfo usb_serial.ko

.PHONY: all clean install uninstall reload test info
