# GPIO HAL Makefile
# 支援多平台編譯

# 平台選擇 (可通過命令行指定: make PLATFORM=stm32)
PLATFORM ?= stm32

# 編譯器設置
ifeq ($(PLATFORM),stm32)
    CC = arm-none-eabi-gcc
    AR = arm-none-eabi-ar
    CFLAGS += -mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16
    CFLAGS += -DSTM32F4 -DSTM32F407xx -DUSE_HAL_DRIVER
    INC_DIRS += -I/path/to/stm32f4_hal/Inc
else ifeq ($(PLATFORM),esp32)
    CC = xtensa-esp32-elf-gcc
    AR = xtensa-esp32-elf-ar
    CFLAGS += -DESP32
    INC_DIRS += -I$(IDF_PATH)/components/driver/include
else
    CC = gcc
    AR = ar
    CFLAGS += -DGENERIC
endif

# 目錄設置
SRC_DIR = src
INC_DIR = include
EXAMPLE_DIR = examples
TEST_DIR = tests
BUILD_DIR = build
OBJ_DIR = $(BUILD_DIR)/obj
BIN_DIR = $(BUILD_DIR)/bin
LIB_DIR = $(BUILD_DIR)/lib

# 編譯選項
CFLAGS += -Wall -Wextra -O2 -g
CFLAGS += -I$(INC_DIR)
CFLAGS += $(INC_DIRS)

# 源文件
ifeq ($(PLATFORM),stm32)
    SRC_FILES = $(SRC_DIR)/gpio_hal_stm32.c
else ifeq ($(PLATFORM),esp32)
    SRC_FILES = $(SRC_DIR)/gpio_hal_esp32.c
else
    SRC_FILES = $(SRC_DIR)/gpio_hal_generic.c
endif

# 目標文件
OBJ_FILES = $(patsubst $(SRC_DIR)/%.c,$(OBJ_DIR)/%.o,$(SRC_FILES))

# 庫文件
LIB_NAME = libgpio_hal.a
LIB_TARGET = $(LIB_DIR)/$(LIB_NAME)

# 範例程式
EXAMPLES = led_blink button_input interrupt

# 測試程式
TESTS = test_gpio

# 目標
.PHONY: all lib examples tests clean help

all: lib

lib: $(LIB_TARGET)

examples: $(addprefix $(BIN_DIR)/,$(EXAMPLES))

tests: $(addprefix $(BIN_DIR)/,$(TESTS))

# 創建目錄
$(OBJ_DIR) $(BIN_DIR) $(LIB_DIR):
	@mkdir -p $@

# 編譯目標文件
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c | $(OBJ_DIR)
	@echo "Compiling $<..."
	@$(CC) $(CFLAGS) -c $< -o $@

# 創建靜態庫
$(LIB_TARGET): $(OBJ_FILES) | $(LIB_DIR)
	@echo "Creating library $@..."
	@$(AR) rcs $@ $^
	@echo "Library created successfully!"

# 編譯範例程式
$(BIN_DIR)/%: $(EXAMPLE_DIR)/%.c $(LIB_TARGET) | $(BIN_DIR)
	@echo "Building example $*..."
	@$(CC) $(CFLAGS) $< -L$(LIB_DIR) -lgpio_hal -o $@

# 編譯測試程式
$(BIN_DIR)/test_%: $(TEST_DIR)/test_%.c $(LIB_TARGET) | $(BIN_DIR)
	@echo "Building test $*..."
	@$(CC) $(CFLAGS) $< -L$(LIB_DIR) -lgpio_hal -o $@

# 清理
clean:
	@echo "Cleaning build files..."
	@rm -rf $(BUILD_DIR)
	@echo "Clean complete!"

# 安裝 (需要 root 權限)
install: lib
	@echo "Installing GPIO HAL..."
	@install -d /usr/local/include/gpio_hal
	@install -m 644 $(INC_DIR)/*.h /usr/local/include/gpio_hal/
	@install -d /usr/local/lib
	@install -m 644 $(LIB_TARGET) /usr/local/lib/
	@echo "Installation complete!"

# 卸載
uninstall:
	@echo "Uninstalling GPIO HAL..."
	@rm -rf /usr/local/include/gpio_hal
	@rm -f /usr/local/lib/$(LIB_NAME)
	@echo "Uninstallation complete!"

# 幫助信息
help:
	@echo "GPIO HAL Makefile"
	@echo "================="
	@echo ""
	@echo "Targets:"
	@echo "  all      - Build library (default)"
	@echo "  lib      - Build GPIO HAL library"
	@echo "  examples - Build example programs"
	@echo "  tests    - Build test programs"
	@echo "  clean    - Remove build files"
	@echo "  install  - Install library and headers"
	@echo "  uninstall- Uninstall library and headers"
	@echo "  help     - Show this help message"
	@echo ""
	@echo "Platform selection:"
	@echo "  make PLATFORM=stm32   - Build for STM32F4"
	@echo "  make PLATFORM=esp32   - Build for ESP32"
	@echo ""
	@echo "Examples:"
	@echo "  make                  - Build library for STM32 (default)"
	@echo "  make PLATFORM=esp32   - Build library for ESP32"
	@echo "  make examples         - Build example programs"
	@echo "  make clean            - Clean build files"

# 顯示配置
config:
	@echo "Build Configuration:"
	@echo "==================="
	@echo "Platform: $(PLATFORM)"
	@echo "Compiler: $(CC)"
	@echo "CFLAGS:   $(CFLAGS)"
	@echo "Sources:  $(SRC_FILES)"
	@echo "Objects:  $(OBJ_FILES)"
	@echo "Library:  $(LIB_TARGET)"
