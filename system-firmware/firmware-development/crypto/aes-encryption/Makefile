# Makefile for AES Encryption Module
# Version 1.0
# Date 2025-11-18

# ============================================================================
# Configuration
# ============================================================================

# Compiler
CC = gcc
AR = ar

# Compiler flags
CFLAGS = -Wall -Wextra -O2 -std=c99
CFLAGS += -DAES_HW_ACCEL=AES_HW_ACCEL_MBEDTLS

# Include paths
INCLUDES = -I. -I/usr/include

# Library paths and libraries
LDFLAGS = -L/usr/lib
LIBS = -lmbedtls -lmbedcrypto

# Debug flags (uncomment for debugging)
# CFLAGS += -g -DDEBUG

# ============================================================================
# Target Configuration
# ============================================================================

# Source files
SOURCES = aes_crypto.c
HEADERS = aes_crypto.h

# Object files
OBJECTS = $(SOURCES:.c=.o)

# Library output
LIBRARY = libaes_crypto.a

# Test executable
TEST_EXEC = test_aes
TEST_SRC = test_aes.c

# Example executables
EXAMPLE_CBC = examples/example_cbc
EXAMPLE_GCM = examples/example_gcm

# ============================================================================
# Build Targets
# ============================================================================

.PHONY: all clean test examples install help

# Default target
all: $(LIBRARY) $(TEST_EXEC)

# Build static library
$(LIBRARY): $(OBJECTS)
	@echo "Creating static library: $@"
	$(AR) rcs $@ $^

# Build object files
%.o: %.c $(HEADERS)
	@echo "Compiling: $<"
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

# Build test executable
$(TEST_EXEC): $(TEST_SRC) $(LIBRARY)
	@echo "Building test executable: $@"
	$(CC) $(CFLAGS) $(INCLUDES) $< -L. -laes_crypto $(LDFLAGS) $(LIBS) -o $@

# Build examples
examples: $(EXAMPLE_CBC) $(EXAMPLE_GCM)

$(EXAMPLE_CBC): examples/example_cbc.c $(LIBRARY)
	@echo "Building example: $@"
	$(CC) $(CFLAGS) $(INCLUDES) $< -L. -laes_crypto $(LDFLAGS) $(LIBS) -o $@

$(EXAMPLE_GCM): examples/example_gcm.c $(LIBRARY)
	@echo "Building example: $@"
	$(CC) $(CFLAGS) $(INCLUDES) $< -L. -laes_crypto $(LDFLAGS) $(LIBS) -o $@

# Run tests
test: $(TEST_EXEC)
	@echo ""
	@echo "Running unit tests..."
	@echo ""
	./$(TEST_EXEC)

# Install library and headers
install: $(LIBRARY)
	@echo "Installing library to /usr/local/lib"
	@sudo cp $(LIBRARY) /usr/local/lib/
	@echo "Installing header to /usr/local/include"
	@sudo cp $(HEADERS) /usr/local/include/
	@echo "Installation complete"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f $(OBJECTS) $(LIBRARY) $(TEST_EXEC)
	rm -f $(EXAMPLE_CBC) $(EXAMPLE_GCM)
	rm -f *.o *~ core

# ============================================================================
# Platform-Specific Targets
# ============================================================================

# Build for STM32 (requires STM32 HAL and toolchain)
stm32:
	@echo "Building for STM32..."
	$(MAKE) CC=arm-none-eabi-gcc \
		CFLAGS="-Wall -O2 -mcpu=cortex-m4 -mthumb -DAES_HW_ACCEL=AES_HW_ACCEL_STM32" \
		INCLUDES="-I. -I/path/to/stm32/hal/include" \
		LIBS=""

# Build for ESP32 (requires ESP-IDF)
esp32:
	@echo "Building for ESP32..."
	$(MAKE) CC=xtensa-esp32-elf-gcc \
		CFLAGS="-Wall -O2 -DAES_HW_ACCEL=AES_HW_ACCEL_ESP32" \
		INCLUDES="-I. -I$(IDF_PATH)/components/esp32/include" \
		LIBS="-lesp32"

# ============================================================================
# Benchmark and Analysis
# ============================================================================

# Run performance benchmark
benchmark: $(TEST_EXEC)
	@echo ""
	@echo "Running performance benchmark..."
	@echo ""
	./$(TEST_EXEC) | grep -A 10 "Performance Benchmark"

# Code coverage analysis (requires gcov)
coverage:
	$(MAKE) clean
	$(MAKE) CFLAGS="$(CFLAGS) -fprofile-arcs -ftest-coverage" test
	gcov $(SOURCES)
	@echo "Coverage report generated: *.gcov"

# Static analysis with cppcheck
analyze:
	@echo "Running static analysis..."
	cppcheck --enable=all --inconclusive --std=c99 $(SOURCES) $(TEST_SRC)

# ============================================================================
# Help
# ============================================================================

help:
	@echo "AES Encryption Module - Makefile Help"
	@echo "======================================"
	@echo ""
	@echo "Available targets:"
	@echo "  all       - Build library and tests (default)"
	@echo "  clean     - Remove build artifacts"
	@echo "  test      - Build and run unit tests"
	@echo "  examples  - Build example programs"
	@echo "  install   - Install library and headers"
	@echo "  stm32     - Build for STM32 platform"
	@echo "  esp32     - Build for ESP32 platform"
	@echo "  benchmark - Run performance benchmark"
	@echo "  coverage  - Generate code coverage report"
	@echo "  analyze   - Run static code analysis"
	@echo "  help      - Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make              # Build library and tests"
	@echo "  make test         # Run unit tests"
	@echo "  make examples     # Build examples"
	@echo "  make clean        # Clean build files"
	@echo ""

# ============================================================================
# Dependencies
# ============================================================================

aes_crypto.o: aes_crypto.c aes_crypto.h
test_aes.o: test_aes.c aes_crypto.h
