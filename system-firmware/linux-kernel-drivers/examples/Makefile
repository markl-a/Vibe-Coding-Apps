# 主 Makefile - 編譯所有範例

SUBDIRS = char-device block-device network-driver i2c-spi-driver \
          interrupt-handler platform-driver

.PHONY: all clean test help $(SUBDIRS)

all: $(SUBDIRS)

$(SUBDIRS):
	@echo "========================================"
	@echo "編譯 $@ 範例..."
	@echo "========================================"
	$(MAKE) -C $@
	@echo ""

clean:
	@for dir in $(SUBDIRS); do \
		echo "清理 $$dir..."; \
		$(MAKE) -C $$dir clean; \
	done
	@echo "清理完成!"

test:
	@echo "========================================"
	@echo "        可用的測試命令"
	@echo "========================================"
	@echo ""
	@echo "字元設備:"
	@echo "  cd char-device && sudo ./test_script.sh"
	@echo ""
	@echo "塊設備:"
	@echo "  cd block-device && sudo ./test_filesystem.sh"
	@echo ""
	@echo "網路設備:"
	@echo "  cd network-driver && sudo ./test_ping.sh"
	@echo ""
	@echo "I2C/SPI:"
	@echo "  cd i2c-spi-driver && sudo ./test_i2c_sysfs.sh"
	@echo ""
	@echo "中斷處理:"
	@echo "  cd interrupt-handler && sudo ./test_interrupt.sh"
	@echo ""
	@echo "平台驅動:"
	@echo "  cd platform-driver && sudo ./test_platform_led.sh"
	@echo ""

help:
	@echo "========================================"
	@echo "   Linux 核心驅動範例 - 使用幫助"
	@echo "========================================"
	@echo ""
	@echo "可用命令:"
	@echo "  make         - 編譯所有範例程序"
	@echo "  make clean   - 清理所有編譯產物"
	@echo "  make test    - 顯示測試命令列表"
	@echo "  make help    - 顯示此幫助信息"
	@echo ""
	@echo "編譯單個範例:"
	@echo "  make char-device"
	@echo "  make block-device"
	@echo "  make network-driver"
	@echo "  make i2c-spi-driver"
	@echo "  make interrupt-handler"
	@echo "  make platform-driver"
	@echo ""
	@echo "詳細使用說明請查看 README.md"
	@echo ""
