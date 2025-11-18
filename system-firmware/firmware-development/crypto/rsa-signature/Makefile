# Makefile for RSA Signature Module
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
CFLAGS += -DRSA_HW_ACCEL=RSA_HW_ACCEL_MBEDTLS

# Include paths
INCLUDES = -I. -I/usr/include

# Library paths and libraries
LDFLAGS = -L/usr/lib
LIBS = -lmbedtls -lmbedcrypto -lmbedx509

# Debug flags (uncomment for debugging)
# CFLAGS += -g -DDEBUG

# ============================================================================
# Target Configuration
# ============================================================================

# Source files
SOURCES = rsa_crypto.c
HEADERS = rsa_crypto.h

# Object files
OBJECTS = $(SOURCES:.c=.o)

# Library output
LIBRARY = librsa_crypto.a

# Test executable
TEST_EXEC = test_rsa
TEST_SRC = test_rsa.c

# Example executables
EXAMPLE_FIRMWARE = examples/example_firmware_sign
EXAMPLE_PSS = examples/example_pss

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
	$(CC) $(CFLAGS) $(INCLUDES) $< -L. -lrsa_crypto $(LDFLAGS) $(LIBS) -o $@

# Build examples
examples: $(EXAMPLE_FIRMWARE) $(EXAMPLE_PSS)

$(EXAMPLE_FIRMWARE): examples/example_firmware_sign.c $(LIBRARY)
	@echo "Building example: $@"
	$(CC) $(CFLAGS) $(INCLUDES) $< -L. -lrsa_crypto $(LDFLAGS) $(LIBS) -o $@

$(EXAMPLE_PSS): examples/example_pss.c $(LIBRARY)
	@echo "Building example: $@"
	$(CC) $(CFLAGS) $(INCLUDES) $< -L. -lrsa_crypto $(LDFLAGS) $(LIBS) -o $@

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
	rm -f $(EXAMPLE_FIRMWARE) $(EXAMPLE_PSS)
	rm -f *.o *~ core

# ============================================================================
# Key Generation Tools
# ============================================================================

# Generate RSA key pair using OpenSSL
keygen:
	@echo "Generating RSA-2048 key pair..."
	openssl genrsa -out private_key.pem 2048
	openssl rsa -in private_key.pem -pubout -out public_key.pem
	@echo "Keys generated:"
	@echo "  Private key: private_key.pem"
	@echo "  Public key: public_key.pem"

# Generate RSA-4096 key pair
keygen4096:
	@echo "Generating RSA-4096 key pair..."
	openssl genrsa -out private_key_4096.pem 4096
	openssl rsa -in private_key_4096.pem -pubout -out public_key_4096.pem
	@echo "Keys generated:"
	@echo "  Private key: private_key_4096.pem"
	@echo "  Public key: public_key_4096.pem"

# Display key information
keyinfo:
	@echo "Private key information:"
	@openssl rsa -in private_key.pem -text -noout
	@echo ""
	@echo "Public key information:"
	@openssl rsa -in public_key.pem -pubin -text -noout

# ============================================================================
# Platform-Specific Targets
# ============================================================================

# Build for STM32 (requires STM32 HAL and toolchain)
stm32:
	@echo "Building for STM32..."
	$(MAKE) CC=arm-none-eabi-gcc \
		CFLAGS="-Wall -O2 -mcpu=cortex-m4 -mthumb -DRSA_HW_ACCEL=RSA_HW_ACCEL_STM32" \
		INCLUDES="-I. -I/path/to/stm32/hal/include" \
		LIBS=""

# Build for ESP32 (requires ESP-IDF)
esp32:
	@echo "Building for ESP32..."
	$(MAKE) CC=xtensa-esp32-elf-gcc \
		CFLAGS="-Wall -O2 -DRSA_HW_ACCEL=RSA_HW_ACCEL_ESP32" \
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
	./$(TEST_EXEC) | grep -A 20 "Performance Benchmark"

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

# Memory leak check with valgrind
memcheck: $(TEST_EXEC)
	@echo "Running memory leak check..."
	valgrind --leak-check=full --show-leak-kinds=all ./$(TEST_EXEC)

# ============================================================================
# Documentation
# ============================================================================

# Generate documentation with Doxygen
docs:
	@echo "Generating documentation..."
	@if [ -f Doxyfile ]; then \
		doxygen Doxyfile; \
	else \
		echo "Doxyfile not found. Creating default..."; \
		doxygen -g; \
		doxygen Doxyfile; \
	fi
	@echo "Documentation generated in html/ directory"

# ============================================================================
# Help
# ============================================================================

help:
	@echo "RSA Signature Module - Makefile Help"
	@echo "====================================="
	@echo ""
	@echo "Build targets:"
	@echo "  all       - Build library and tests (default)"
	@echo "  clean     - Remove build artifacts"
	@echo "  test      - Build and run unit tests"
	@echo "  examples  - Build example programs"
	@echo "  install   - Install library and headers"
	@echo ""
	@echo "Key management:"
	@echo "  keygen    - Generate RSA-2048 key pair"
	@echo "  keygen4096- Generate RSA-4096 key pair"
	@echo "  keyinfo   - Display key information"
	@echo ""
	@echo "Platform-specific:"
	@echo "  stm32     - Build for STM32 platform"
	@echo "  esp32     - Build for ESP32 platform"
	@echo ""
	@echo "Analysis and testing:"
	@echo "  benchmark - Run performance benchmark"
	@echo "  coverage  - Generate code coverage report"
	@echo "  analyze   - Run static code analysis"
	@echo "  memcheck  - Run memory leak check"
	@echo "  docs      - Generate documentation"
	@echo ""
	@echo "Examples:"
	@echo "  make              # Build library and tests"
	@echo "  make test         # Run unit tests"
	@echo "  make examples     # Build examples"
	@echo "  make keygen       # Generate key pair"
	@echo "  make clean        # Clean build files"
	@echo ""

# ============================================================================
# Dependencies
# ============================================================================

rsa_crypto.o: rsa_crypto.c rsa_crypto.h
test_rsa.o: test_rsa.c rsa_crypto.h
