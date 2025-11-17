# GPIO 範例程式 Makefile

CC = gcc
CFLAGS = -Wall -Wextra -O2
LDFLAGS = -lm

# 目標文件
TARGETS = basic_usage led_control button_interrupt error_handling test_suite

# 所有目標
all: $(TARGETS)

# 基本使用範例
basic_usage: basic_usage.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

# LED 控制範例
led_control: led_control.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

# 按鈕中斷範例
button_interrupt: button_interrupt.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

# 錯誤處理範例
error_handling: error_handling.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

# 測試套件
test_suite: test_suite.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

# 清理
clean:
	rm -f $(TARGETS)

# 安裝
install: all
	mkdir -p /usr/local/bin/gpio-examples
	cp $(TARGETS) /usr/local/bin/gpio-examples/
	@echo "範例程式已安裝到 /usr/local/bin/gpio-examples/"

# 卸載
uninstall:
	rm -rf /usr/local/bin/gpio-examples
	@echo "範例程式已卸載"

# 測試
test: test_suite
	@echo "執行測試套件..."
	sudo ./test_suite

# 幫助
help:
	@echo "可用的目標:"
	@echo "  all         - 編譯所有範例程式（預設）"
	@echo "  basic_usage - 編譯基本使用範例"
	@echo "  led_control - 編譯 LED 控制範例"
	@echo "  button_interrupt - 編譯按鈕中斷範例"
	@echo "  error_handling - 編譯錯誤處理範例"
	@echo "  test_suite  - 編譯測試套件"
	@echo "  clean       - 清理編譯產物"
	@echo "  install     - 安裝範例程式"
	@echo "  uninstall   - 卸載範例程式"
	@echo "  test        - 執行測試套件"
	@echo "  help        - 顯示此幫助信息"

.PHONY: all clean install uninstall test help
