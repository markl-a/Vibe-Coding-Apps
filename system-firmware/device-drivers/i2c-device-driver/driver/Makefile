# Makefile for I2C Device Driver

obj-m += i2c_sensor.o

KDIR := /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
	make -C $(KDIR) M=$(PWD) modules

clean:
	make -C $(KDIR) M=$(PWD) clean

install:
	sudo insmod i2c_sensor.ko

uninstall:
	sudo rmmod i2c_sensor

test:
	@echo "Testing I2C device driver..."
	@lsmod | grep i2c || echo "I2C modules not loaded"
	@ls -l /dev/i2c-* 2>/dev/null || echo "No I2C devices found"

.PHONY: all clean install uninstall test
