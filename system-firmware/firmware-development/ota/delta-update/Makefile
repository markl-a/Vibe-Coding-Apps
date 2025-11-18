# Makefile for Delta Update

CC = gcc
CFLAGS = -Wall -Wextra -O2 -g -I.
LDFLAGS = -lssl -lcrypto

# Source files
SRCS = delta_updater.c patch_generator.c block_diff.c
OBJS = $(SRCS:.c=.o)

# Test files
TEST_SRCS = test_delta.c
TEST_OBJS = $(TEST_SRCS:.c=.o)

# Targets
TARGET = libdelta_update.a
TEST_TARGET = test_delta

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
	@echo "Running delta update tests..."
	@echo ""
	./$(TEST_TARGET)

# Install library and headers
install: $(TARGET)
	@echo "Installing library and headers..."
	install -d /usr/local/lib
	install -d /usr/local/include/ota
	install -m 644 $(TARGET) /usr/local/lib/
	install -m 644 delta_updater.h /usr/local/include/ota/
	install -m 644 patch_generator.h /usr/local/include/ota/
	install -m 644 block_diff.h /usr/local/include/ota/
	@echo "Installation complete"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f $(OBJS) $(TEST_OBJS) $(TARGET) $(TEST_TARGET)
	rm -f /tmp/test_*.bin /tmp/test_*.patch
	@echo "Clean complete"

# Dependencies
delta_updater.o: delta_updater.c delta_updater.h block_diff.h
patch_generator.o: patch_generator.c patch_generator.h delta_updater.h block_diff.h
block_diff.o: block_diff.c block_diff.h delta_updater.h
test_delta.o: test_delta.c delta_updater.h patch_generator.h block_diff.h

# Help
help:
	@echo "Available targets:"
	@echo "  all      - Build library and tests (default)"
	@echo "  test     - Build and run tests"
	@echo "  install  - Install library and headers"
	@echo "  clean    - Remove build artifacts"
	@echo "  help     - Show this help message"
