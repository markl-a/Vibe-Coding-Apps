# Makefile for GPIO Controller Driver

obj-m += gpio_driver.o
obj-m += gpio_pwm.o
obj-m += gpio_debounce.o

KDIR := /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

# 編譯標誌
ccflags-y := -DDEBUG

all:
	make -C $(KDIR) M=$(PWD) modules

clean:
	make -C $(KDIR) M=$(PWD) clean

install:
	sudo insmod gpio_driver.ko
	sudo insmod gpio_pwm.ko
	sudo insmod gpio_debounce.ko
	@echo "All GPIO modules loaded"

uninstall:
	sudo rmmod gpio_debounce || true
	sudo rmmod gpio_pwm || true
	sudo rmmod gpio_driver || true
	@echo "All GPIO modules unloaded"

reload: uninstall all install

test:
	@echo "Testing GPIO controller driver..."
	@echo "Checking for loaded module:"
	@lsmod | grep gpio_driver || echo "Module not loaded"
	@echo "\nChecking GPIO chips:"
	@ls -l /sys/class/gpio/ 2>/dev/null || echo "No GPIO class found"

info:
	modinfo gpio_driver.ko

.PHONY: all clean install uninstall reload test info
