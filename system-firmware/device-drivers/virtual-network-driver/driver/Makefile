# Makefile for Virtual Network Driver

obj-m += vnet.o

KDIR := /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
	make -C $(KDIR) M=$(PWD) modules

clean:
	make -C $(KDIR) M=$(PWD) clean

install:
	sudo insmod vnet.ko

uninstall:
	sudo rmmod vnet

test:
	@echo "Testing virtual network driver..."
	@lsmod | grep vnet || echo "Module not loaded"
	@ip link show | grep vnet || echo "No virtual network interfaces found"

.PHONY: all clean install uninstall test
