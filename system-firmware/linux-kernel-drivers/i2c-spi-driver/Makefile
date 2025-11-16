# Makefile for I2C/SPI Device Drivers

obj-m += i2c_dummy_device.o
obj-m += spi_dummy_device.o

KDIR ?= /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
	$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean

install-i2c:
	@echo "Loading I2C driver..."
	sudo insmod i2c_dummy_device.ko
	@echo "I2C driver loaded"
	@lsmod | grep i2c_dummy

install-spi:
	@echo "Loading SPI driver..."
	sudo insmod spi_dummy_device.ko
	@echo "SPI driver loaded"
	@lsmod | grep spi_dummy

install: install-i2c install-spi

uninstall:
	@echo "Unloading drivers..."
	-sudo rmmod i2c_dummy_device 2>/dev/null || true
	-sudo rmmod spi_dummy_device 2>/dev/null || true
	@echo "Drivers unloaded"

info:
	@echo "=== I2C Driver Info ==="
	@modinfo i2c_dummy_device.ko
	@echo ""
	@echo "=== SPI Driver Info ==="
	@modinfo spi_dummy_device.ko

dmesg:
	dmesg | tail -20

# 注意：實際使用需要通過設備樹或手動創建 I2C/SPI 設備
# 例如：echo i2c_dummy 0x50 > /sys/bus/i2c/devices/i2c-1/new_device

.PHONY: all clean install install-i2c install-spi uninstall info dmesg
