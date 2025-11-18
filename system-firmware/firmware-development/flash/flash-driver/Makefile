# Makefile for Flash Driver Module

# Compiler settings
CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2 -g
LDFLAGS =

# Platform-specific settings (uncomment as needed)
# STM32F1
# CFLAGS += -DSTM32F1 -mcpu=cortex-m3 -mthumb
# STM32F4
# CFLAGS += -DSTM32F4 -mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16
# STM32L4
# CFLAGS += -DSTM32L4 -mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16

# Include directories
INCLUDES = -I.

# Source files
SRCS = flash_hal.c \
       flash_driver.c \
       spi_flash.c \
       qspi_flash.c

# Object files
OBJS = $(SRCS:.c=.o)

# Test files
TEST_SRCS = test_flash.c
TEST_OBJS = $(TEST_SRCS:.c=.o)
TEST_TARGET = test_flash

# Library output
LIB_TARGET = libflash.a

# Default target
all: $(LIB_TARGET) $(TEST_TARGET)

# Build library
$(LIB_TARGET): $(OBJS)
	@echo "Creating library: $@"
	ar rcs $@ $^
	@echo "Library created successfully"

# Build test executable
$(TEST_TARGET): $(TEST_OBJS) $(LIB_TARGET)
	@echo "Building test: $@"
	$(CC) $(LDFLAGS) -o $@ $(TEST_OBJS) $(LIB_TARGET)
	@echo "Test built successfully"

# Compile source files
%.o: %.c
	@echo "Compiling: $<"
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

# Run tests
test: $(TEST_TARGET)
	@echo ""
	@echo "Running tests..."
	@echo ""
	./$(TEST_TARGET)

# Clean build artifacts
clean:
	@echo "Cleaning..."
	rm -f $(OBJS) $(TEST_OBJS) $(LIB_TARGET) $(TEST_TARGET)
	@echo "Clean complete"

# Clean and rebuild
rebuild: clean all

# Install library (optional)
install: $(LIB_TARGET)
	@echo "Installing library..."
	install -d /usr/local/lib
	install -m 644 $(LIB_TARGET) /usr/local/lib/
	install -d /usr/local/include/flash
	install -m 644 *.h /usr/local/include/flash/
	@echo "Installation complete"

# Uninstall library
uninstall:
	@echo "Uninstalling..."
	rm -f /usr/local/lib/$(LIB_TARGET)
	rm -rf /usr/local/include/flash
	@echo "Uninstall complete"

# Generate documentation (requires Doxygen)
docs:
	@echo "Generating documentation..."
	doxygen Doxyfile 2>/dev/null || echo "Doxygen not configured"

# Static analysis (requires cppcheck)
analyze:
	@echo "Running static analysis..."
	cppcheck --enable=all --suppress=missingIncludeSystem $(SRCS) 2>/dev/null || echo "cppcheck not installed"

# Format code (requires clang-format)
format:
	@echo "Formatting code..."
	clang-format -i *.c *.h 2>/dev/null || echo "clang-format not installed"

# Show help
help:
	@echo "Flash Driver Module Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  all        - Build library and tests (default)"
	@echo "  test       - Build and run tests"
	@echo "  clean      - Remove build artifacts"
	@echo "  rebuild    - Clean and rebuild"
	@echo "  install    - Install library to system"
	@echo "  uninstall  - Remove installed library"
	@echo "  docs       - Generate documentation"
	@echo "  analyze    - Run static analysis"
	@echo "  format     - Format source code"
	@echo "  help       - Show this help message"
	@echo ""
	@echo "Platform-specific builds:"
	@echo "  make CFLAGS+='-DSTM32F1' (for STM32F1)"
	@echo "  make CFLAGS+='-DSTM32F4' (for STM32F4)"
	@echo "  make CFLAGS+='-DSTM32L4' (for STM32L4)"

.PHONY: all test clean rebuild install uninstall docs analyze format help
