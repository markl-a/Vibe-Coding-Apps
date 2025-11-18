# Makefile for OTA Update Protocol

CC = gcc
CFLAGS = -Wall -Wextra -O2 -g -I. -pthread
LDFLAGS = -pthread -lcurl -lssl -lcrypto

# Source files
SRCS = ota_protocol.c download_manager.c progress_tracker.c
OBJS = $(SRCS:.c=.o)

# Test files
TEST_SRCS = test_protocol.c
TEST_OBJS = $(TEST_SRCS:.c=.o)

# Targets
TARGET = libota_protocol.a
TEST_TARGET = test_protocol

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
	@echo "Running OTA protocol tests..."
	@echo ""
	./$(TEST_TARGET)

# Install library and headers
install: $(TARGET)
	@echo "Installing library and headers..."
	install -d /usr/local/lib
	install -d /usr/local/include/ota
	install -m 644 $(TARGET) /usr/local/lib/
	install -m 644 ota_protocol.h /usr/local/include/ota/
	install -m 644 download_manager.h /usr/local/include/ota/
	install -m 644 progress_tracker.h /usr/local/include/ota/
	@echo "Installation complete"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f $(OBJS) $(TEST_OBJS) $(TARGET) $(TEST_TARGET)
	rm -f /tmp/test_firmware.bin
	@echo "Clean complete"

# Dependencies
ota_protocol.o: ota_protocol.c ota_protocol.h download_manager.h progress_tracker.h
download_manager.o: download_manager.c download_manager.h progress_tracker.h
progress_tracker.o: progress_tracker.c progress_tracker.h
test_protocol.o: test_protocol.c ota_protocol.h download_manager.h progress_tracker.h

# Help
help:
	@echo "Available targets:"
	@echo "  all      - Build library and tests (default)"
	@echo "  test     - Build and run tests"
	@echo "  install  - Install library and headers"
	@echo "  clean    - Remove build artifacts"
	@echo "  help     - Show this help message"
