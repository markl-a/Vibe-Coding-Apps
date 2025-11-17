# Makefile for Bootloader Examples
#
# Copyright (C) 2025 AI-Assisted Development Team
# SPDX-License-Identifier: MIT

CC = gcc
CFLAGS = -Wall -Wextra -O2 -g
LDFLAGS =

# 可選: 使用 mbedTLS 進行加密驗證
# 取消註釋以下行以啟用 mbedTLS 支持
# USE_MBEDTLS = 1

ifdef USE_MBEDTLS
CFLAGS += -DUSE_MBEDTLS
LDFLAGS += -lmbedtls -lmbedx509 -lmbedcrypto
endif

# 目標文件
TARGETS = firmware_verify_example

# 源文件
FIRMWARE_VERIFY_SRCS = firmware_verify_example.c \
                       ../mcu-bootloader/backend/common/crypto/firmware_verify.c

all: $(TARGETS)

firmware_verify_example: $(FIRMWARE_VERIFY_SRCS)
	@echo "Building firmware verification example..."
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)
	@echo "Done! Run with: ./firmware_verify_example"

# 清理
clean:
	rm -f $(TARGETS) *.o

# 執行範例
run: firmware_verify_example
	@echo "Running firmware verification example..."
	@./firmware_verify_example

# 安裝
install: $(TARGETS)
	@echo "Installing examples to /usr/local/bin..."
	@install -m 755 $(TARGETS) /usr/local/bin/

# 幫助
help:
	@echo "Bootloader Examples Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  all                - Build all examples (default)"
	@echo "  clean              - Remove built files"
	@echo "  run                - Build and run examples"
	@echo "  install            - Install examples to /usr/local/bin"
	@echo ""
	@echo "Options:"
	@echo "  USE_MBEDTLS=1      - Enable mbedTLS support for RSA verification"
	@echo ""
	@echo "Examples:"
	@echo "  make                           # Build examples"
	@echo "  make run                       # Build and run"
	@echo "  make USE_MBEDTLS=1             # Build with mbedTLS support"
	@echo "  make clean                     # Clean build files"

.PHONY: all clean run install help
