# Makefile for Simple Character Device Driver

# 模組名稱
obj-m += simple_chardev.o

# Kernel 建置目錄
KDIR ?= /lib/modules/$(shell uname -r)/build

# 當前目錄
PWD := $(shell pwd)

# 預設目標：編譯模組
all:
	$(MAKE) -C $(KDIR) M=$(PWD) modules

# 清理編譯產生的文件
clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean

# 安裝模組
install:
	@echo "Loading module..."
	sudo insmod simple_chardev.ko
	@echo "Module loaded successfully"
	@echo "Device node created at /dev/simple_char"
	@lsmod | grep simple_chardev

# 卸載模組
uninstall:
	@echo "Unloading module..."
	sudo rmmod simple_chardev
	@echo "Module unloaded successfully"

# 查看模組資訊
info:
	modinfo simple_chardev.ko

# 查看核心日誌
dmesg:
	dmesg | tail -20

# 測試驅動
test: install
	@echo ""
	@echo "=== Testing Character Device Driver ==="
	@echo ""
	@echo "Writing test data to device..."
	@echo "Hello from userspace!" | sudo tee /dev/simple_char
	@echo ""
	@echo "Reading data from device..."
	@sudo cat /dev/simple_char
	@echo ""
	@echo "=== Test completed ==="
	@echo ""

# 重新編譯並測試
rebuild: clean all test

.PHONY: all clean install uninstall info dmesg test rebuild
