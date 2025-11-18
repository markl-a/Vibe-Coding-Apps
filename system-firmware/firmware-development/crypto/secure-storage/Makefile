# Makefile for Secure Storage Module

CC = gcc
AR = ar
CFLAGS = -Wall -Wextra -O2 -std=c99 -DUSE_MBEDTLS
INCLUDES = -I. -I/usr/include
LDFLAGS = -L/usr/lib
LIBS = -lmbedtls -lmbedcrypto

SOURCES = secure_storage.c key_management.c
HEADERS = secure_storage.h key_management.h
OBJECTS = $(SOURCES:.c=.o)
LIBRARY = libsecure_storage.a

TEST_EXEC = test_storage
TEST_SRC = test_storage.c

EXAMPLE_EXEC = examples/example_secure_storage

.PHONY: all clean test examples

all: $(LIBRARY) $(TEST_EXEC)

$(LIBRARY): $(OBJECTS)
	@echo "Creating library: $@"
	$(AR) rcs $@ $^

%.o: %.c $(HEADERS)
	@echo "Compiling: $<"
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

$(TEST_EXEC): $(TEST_SRC) $(LIBRARY)
	@echo "Building test: $@"
	$(CC) $(CFLAGS) $(INCLUDES) $< -L. -lsecure_storage $(LDFLAGS) $(LIBS) -o $@

examples: $(EXAMPLE_EXEC)

$(EXAMPLE_EXEC): examples/example_secure_storage.c $(LIBRARY)
	@echo "Building example: $@"
	$(CC) $(CFLAGS) $(INCLUDES) $< -L. -lsecure_storage $(LDFLAGS) $(LIBS) -o $@

test: $(TEST_EXEC)
	@echo "\nRunning tests...\n"
	./$(TEST_EXEC)

clean:
	rm -f $(OBJECTS) $(LIBRARY) $(TEST_EXEC) $(EXAMPLE_EXEC)

help:
	@echo "Secure Storage Module - Makefile"
	@echo "================================"
	@echo "Targets:"
	@echo "  all      - Build library and tests"
	@echo "  test     - Run unit tests"
	@echo "  examples - Build examples"
	@echo "  clean    - Clean build artifacts"
