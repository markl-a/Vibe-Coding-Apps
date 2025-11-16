# Makefile for Simple RAM Disk Block Device Driver

# 模組名稱
obj-m += simple_ramdisk.o

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
	sudo insmod simple_ramdisk.ko
	@echo "Module loaded successfully"
	@sleep 1
	@echo ""
	@echo "=== RAM Disk Information ==="
	@lsblk | grep sramdisk || echo "Device created: /dev/sramdisk"
	@echo ""
	@lsmod | grep simple_ramdisk

# 卸載模組
uninstall:
	@echo "Unmounting if mounted..."
	-sudo umount /mnt/ramdisk 2>/dev/null || true
	@echo "Unloading module..."
	sudo rmmod simple_ramdisk
	@echo "Module unloaded successfully"

# 查看模組資訊
info:
	modinfo simple_ramdisk.ko

# 查看核心日誌
dmesg:
	dmesg | tail -20

# 格式化並掛載測試
test: install
	@echo ""
	@echo "=== Testing RAM Disk ==="
	@echo ""
	@echo "Creating filesystem on /dev/sramdisk..."
	@sudo mkfs.ext4 /dev/sramdisk
	@echo ""
	@echo "Creating mount point..."
	@sudo mkdir -p /mnt/ramdisk
	@echo ""
	@echo "Mounting RAM disk..."
	@sudo mount /dev/sramdisk /mnt/ramdisk
	@echo ""
	@echo "Creating test file..."
	@echo "Hello from RAM disk!" | sudo tee /mnt/ramdisk/test.txt
	@echo ""
	@echo "Reading test file..."
	@sudo cat /mnt/ramdisk/test.txt
	@echo ""
	@echo "Disk usage:"
	@df -h /mnt/ramdisk
	@echo ""
	@echo "=== Test completed ==="
	@echo ""
	@echo "To unmount: sudo umount /mnt/ramdisk"

# 分區測試
test-partition: install
	@echo ""
	@echo "=== Testing Partitioning ==="
	@echo ""
	@echo "Creating partition table..."
	@sudo parted /dev/sramdisk mklabel msdos
	@sudo parted /dev/sramdisk mkpart primary ext4 0% 50%
	@sudo parted /dev/sramdisk mkpart primary ext4 50% 100%
	@echo ""
	@echo "Partitions created:"
	@sudo parted /dev/sramdisk print
	@echo ""
	@echo "Formatting partitions..."
	@sudo mkfs.ext4 /dev/sramdisk1
	@sudo mkfs.ext4 /dev/sramdisk2
	@echo ""
	@echo "=== Partition test completed ==="

# 性能測試
test-performance: install
	@echo ""
	@echo "=== Performance Test ==="
	@echo ""
	@sudo mkfs.ext4 /dev/sramdisk >/dev/null 2>&1
	@sudo mkdir -p /mnt/ramdisk
	@sudo mount /dev/sramdisk /mnt/ramdisk
	@echo "Write performance test (100MB)..."
	@sudo dd if=/dev/zero of=/mnt/ramdisk/testfile bs=1M count=100 2>&1 | grep -E 'bytes|copied'
	@echo ""
	@echo "Read performance test..."
	@sudo dd if=/mnt/ramdisk/testfile of=/dev/null bs=1M 2>&1 | grep -E 'bytes|copied'
	@sudo umount /mnt/ramdisk
	@echo ""
	@echo "=== Performance test completed ==="

# 重新編譯並測試
rebuild: clean all test

.PHONY: all clean install uninstall info dmesg test test-partition test-performance rebuild
