# Makefile for Rollback System

CC = gcc
CFLAGS = -Wall -Wextra -O2 -g -I.
LDFLAGS =

# Source files
SRCS = rollback.c boot_flag.c version_check.c
OBJS = $(SRCS:.c=.o)

# Test files
TEST_SRCS = test_rollback.c
TEST_OBJS = $(TEST_SRCS:.c=.o)

# Targets
TARGET = librollback.a
TEST_TARGET = test_rollback

.PHONY: all clean test install

all: $(TARGET) $(TEST_TARGET)

# Build static library
$(TARGET): $(OBJS)
	@echo "Creating static library: $@"
	ar rcs $@ $^
	@echo "Library created successfully"

# Build test executable
$(TEST_TARGET): $(TEST_OBJS) $(TARGET)
	@echo "Building test executable: $@"
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)
	@echo "Test executable built successfully"

# Compile source files
%.o: %.c
	@echo "Compiling: $<"
	$(CC) $(CFLAGS) -c $< -o $@

# Run tests
test: $(TEST_TARGET)
	@echo ""
	@echo "Running rollback system tests..."
	@echo ""
	./$(TEST_TARGET)

# Install library and headers
install: $(TARGET)
	@echo "Installing library and headers..."
	install -d /usr/local/lib
	install -d /usr/local/include/ota
	install -m 644 $(TARGET) /usr/local/lib/
	install -m 644 rollback.h /usr/local/include/ota/
	install -m 644 boot_flag.h /usr/local/include/ota/
	install -m 644 version_check.h /usr/local/include/ota/
	@echo "Installation complete"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f $(OBJS) $(TEST_OBJS) $(TARGET) $(TEST_TARGET)
	rm -f /tmp/test_boot_flag.bin /tmp/test_partition_*.bin
	@echo "Clean complete"

# Dependencies
rollback.o: rollback.c rollback.h boot_flag.h version_check.h
boot_flag.o: boot_flag.c boot_flag.h rollback.h
version_check.o: version_check.c version_check.h
test_rollback.o: test_rollback.c rollback.h boot_flag.h version_check.h

# Help
help:
	@echo "Available targets:"
	@echo "  all      - Build library and tests (default)"
	@echo "  test     - Build and run tests"
	@echo "  install  - Install library and headers"
	@echo "  clean    - Remove build artifacts"
	@echo "  help     - Show this help message"
