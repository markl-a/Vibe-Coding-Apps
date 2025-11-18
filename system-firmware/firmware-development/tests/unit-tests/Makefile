# Unit Tests Makefile

CC = gcc
CFLAGS = -Wall -Wextra -g -std=c11 -I../test-framework
LDFLAGS = -lm

TEST_FRAMEWORK = ../test-framework
TEST_FRAMEWORK_OBJS = $(TEST_FRAMEWORK)/test_framework.o \
                      $(TEST_FRAMEWORK)/test_utils.o \
                      $(TEST_FRAMEWORK)/mock.o

TEST_SOURCES = test_secure_boot.c test_crypto.c test_flash.c test_ota.c
TEST_TARGETS = $(TEST_SOURCES:.c=)

.PHONY: all clean test run

all: $(TEST_TARGETS)

# Build test framework
$(TEST_FRAMEWORK)/%.o: $(TEST_FRAMEWORK)/%.c
	$(CC) $(CFLAGS) -c $< -o $@

# Build test executables
test_secure_boot: test_secure_boot.c $(TEST_FRAMEWORK_OBJS)
	$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS)

test_crypto: test_crypto.c $(TEST_FRAMEWORK_OBJS)
	$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS)

test_flash: test_flash.c $(TEST_FRAMEWORK_OBJS)
	$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS)

test_ota: test_ota.c $(TEST_FRAMEWORK_OBJS)
	$(CC) $(CFLAGS) $^ -o $@ $(LDFLAGS)

# Run all tests
test: all
	@echo "================================"
	@echo "Running Unit Tests"
	@echo "================================"
	@./test_all.sh

run: test

clean:
	rm -f $(TEST_TARGETS)
	rm -f $(TEST_FRAMEWORK_OBJS)
	rm -f *.o
	@echo "Clean complete"
