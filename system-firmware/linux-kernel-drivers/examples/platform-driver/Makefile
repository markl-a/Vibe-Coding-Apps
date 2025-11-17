# Makefile for platform driver examples

CC = gcc
CFLAGS = -Wall -O2
DTC = dtc

TARGETS = led_control
DTS_FILES = device_tree_example.dts
DTB_FILES = $(DTS_FILES:.dts=.dtb)

.PHONY: all clean test dtb

all: $(TARGETS)

led_control: led_control.c
	$(CC) $(CFLAGS) -o $@ $<

# 編譯設備樹（如果 dtc 可用）
dtb: $(DTB_FILES)

%.dtb: %.dts
	@if command -v $(DTC) >/dev/null 2>&1; then \
		echo "編譯設備樹: $< -> $@"; \
		$(DTC) -I dts -O dtb -o $@ $<; \
	else \
		echo "警告: dtc 未安裝，跳過設備樹編譯"; \
		echo "安裝方法: sudo apt-get install device-tree-compiler"; \
	fi

test: all
	@echo "測試腳本:"
	@echo "  sudo ./test_platform_led.sh"
	@echo ""
	@echo "LED 控制程序:"
	@echo "  sudo ./led_control on"
	@echo "  sudo ./led_control off"
	@echo "  sudo ./led_control toggle"
	@echo "  sudo ./led_control status"
	@echo "  sudo ./led_control blink [次數]"

clean:
	rm -f $(TARGETS) $(DTB_FILES) *.o
