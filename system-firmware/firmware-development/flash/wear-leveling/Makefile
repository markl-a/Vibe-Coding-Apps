# Makefile for Wear Leveling Module

# Compiler settings
CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2 -g
LDFLAGS = -lm

# Include directories
INCLUDES = -I.

# Source files
SRCS = wear_leveling.c \
       block_mapping.c \
       statistics.c

# Object files
OBJS = $(SRCS:.c=.o)

# Test files
TEST_SRCS = test_wear_leveling.c
TEST_OBJS = $(TEST_SRCS:.c=.o)
TEST_TARGET = test_wear_leveling

# Library output
LIB_TARGET = libwear_leveling.a

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
	install -d /usr/local/include/wear_leveling
	install -m 644 *.h /usr/local/include/wear_leveling/
	@echo "Installation complete"

# Uninstall library
uninstall:
	@echo "Uninstalling..."
	rm -f /usr/local/lib/$(LIB_TARGET)
	rm -rf /usr/local/include/wear_leveling
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

# Memory leak check (requires valgrind)
memcheck: $(TEST_TARGET)
	@echo "Running memory leak check..."
	valgrind --leak-check=full --show-leak-kinds=all ./$(TEST_TARGET) 2>/dev/null || echo "valgrind not installed"

# Coverage analysis (requires gcov)
coverage:
	@echo "Building with coverage..."
	$(CC) $(CFLAGS) -fprofile-arcs -ftest-coverage $(INCLUDES) -c $(SRCS)
	$(CC) $(CFLAGS) -fprofile-arcs -ftest-coverage $(INCLUDES) -c $(TEST_SRCS)
	$(CC) $(LDFLAGS) -fprofile-arcs -ftest-coverage -o $(TEST_TARGET) $(OBJS) $(TEST_OBJS)
	./$(TEST_TARGET)
	gcov $(SRCS) 2>/dev/null || echo "gcov not installed"
	@echo "Coverage analysis complete"

# Show help
help:
	@echo "Wear Leveling Module Makefile"
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
	@echo "  memcheck   - Run memory leak check"
	@echo "  coverage   - Generate coverage report"
	@echo "  help       - Show this help message"

.PHONY: all test clean rebuild install uninstall docs analyze format memcheck coverage help
