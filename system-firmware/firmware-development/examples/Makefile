# Makefile for Firmware Development Examples
# 用於編譯所有範例程序

CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2 -g
LDFLAGS = -lm

# 目錄定義
BASIC_DIR = basic
OTA_DIR = ota
CRYPTO_DIR = crypto
FLASH_DIR = flash
BOOTLOADER_DIR = bootloader
COMPLETE_DIR = complete-system

# 輸出目錄
BUILD_DIR = build

# 範例程序
EXAMPLES = \
	$(BUILD_DIR)/basic_firmware \
	$(BUILD_DIR)/ota_http_update \
	$(BUILD_DIR)/aes_encrypt_decrypt \
	$(BUILD_DIR)/rsa_signature_verify \
	$(BUILD_DIR)/flash_read_write \
	$(BUILD_DIR)/secure_boot_example \
	$(BUILD_DIR)/complete_firmware_system

# 默認目標
.PHONY: all
all: $(BUILD_DIR) $(EXAMPLES)

# 創建輸出目錄
$(BUILD_DIR):
	@echo "創建輸出目錄..."
	@mkdir -p $(BUILD_DIR)

# 編譯規則
$(BUILD_DIR)/basic_firmware: $(BASIC_DIR)/basic_firmware.c
	@echo "編譯 $<..."
	@$(CC) $(CFLAGS) $< -o $@ $(LDFLAGS)

$(BUILD_DIR)/ota_http_update: $(OTA_DIR)/ota_http_update.c
	@echo "編譯 $<..."
	@$(CC) $(CFLAGS) $< -o $@ $(LDFLAGS)

$(BUILD_DIR)/aes_encrypt_decrypt: $(CRYPTO_DIR)/aes_encrypt_decrypt.c
	@echo "編譯 $<..."
	@$(CC) $(CFLAGS) $< -o $@ $(LDFLAGS)

$(BUILD_DIR)/rsa_signature_verify: $(CRYPTO_DIR)/rsa_signature_verify.c
	@echo "編譯 $<..."
	@$(CC) $(CFLAGS) $< -o $@ $(LDFLAGS)

$(BUILD_DIR)/flash_read_write: $(FLASH_DIR)/flash_read_write.c
	@echo "編譯 $<..."
	@$(CC) $(CFLAGS) $< -o $@ $(LDFLAGS)

$(BUILD_DIR)/secure_boot_example: $(BOOTLOADER_DIR)/secure_boot_example.c
	@echo "編譯 $<..."
	@$(CC) $(CFLAGS) $< -o $@ $(LDFLAGS)

$(BUILD_DIR)/complete_firmware_system: $(COMPLETE_DIR)/complete_firmware_system.c
	@echo "編譯 $<..."
	@$(CC) $(CFLAGS) $< -o $@ $(LDFLAGS)

# 運行所有範例
.PHONY: run
run: all
	@echo ""
	@echo "=========================================="
	@echo "運行所有範例程序"
	@echo "=========================================="
	@echo ""
	@echo ">>> 1. 基本韌體範例 <<<"
	@./$(BUILD_DIR)/basic_firmware || true
	@echo ""
	@echo ">>> 2. OTA HTTP 更新範例 <<<"
	@./$(BUILD_DIR)/ota_http_update || true
	@echo ""
	@echo ">>> 3. AES 加密解密範例 <<<"
	@./$(BUILD_DIR)/aes_encrypt_decrypt || true
	@echo ""
	@echo ">>> 4. RSA 簽名驗證範例 <<<"
	@./$(BUILD_DIR)/rsa_signature_verify || true
	@echo ""
	@echo ">>> 5. Flash 讀寫範例 <<<"
	@./$(BUILD_DIR)/flash_read_write || true
	@echo ""
	@echo ">>> 6. 安全啟動範例 <<<"
	@./$(BUILD_DIR)/secure_boot_example || true
	@echo ""
	@echo ">>> 7. 完整韌體系統範例 <<<"
	@./$(BUILD_DIR)/complete_firmware_system || true

# 單獨運行各個範例
.PHONY: run-basic
run-basic: $(BUILD_DIR)/basic_firmware
	@echo "運行基本韌體範例..."
	@./$(BUILD_DIR)/basic_firmware

.PHONY: run-ota
run-ota: $(BUILD_DIR)/ota_http_update
	@echo "運行 OTA 更新範例..."
	@./$(BUILD_DIR)/ota_http_update

.PHONY: run-crypto
run-crypto: $(BUILD_DIR)/aes_encrypt_decrypt
	@echo "運行 AES 加密解密範例..."
	@./$(BUILD_DIR)/aes_encrypt_decrypt

.PHONY: run-rsa
run-rsa: $(BUILD_DIR)/rsa_signature_verify
	@echo "運行 RSA 簽名驗證範例..."
	@./$(BUILD_DIR)/rsa_signature_verify

.PHONY: run-flash
run-flash: $(BUILD_DIR)/flash_read_write
	@echo "運行 Flash 讀寫範例..."
	@./$(BUILD_DIR)/flash_read_write

.PHONY: run-boot
run-boot: $(BUILD_DIR)/secure_boot_example
	@echo "運行安全啟動範例..."
	@./$(BUILD_DIR)/secure_boot_example

.PHONY: run-complete
run-complete: $(BUILD_DIR)/complete_firmware_system
	@echo "運行完整系統範例..."
	@./$(BUILD_DIR)/complete_firmware_system

# 清理
.PHONY: clean
clean:
	@echo "清理編譯產物..."
	@rm -rf $(BUILD_DIR)

# 幫助
.PHONY: help
help:
	@echo "Firmware Development Examples - Makefile"
	@echo ""
	@echo "可用目標："
	@echo "  make all          - 編譯所有範例"
	@echo "  make run          - 運行所有範例"
	@echo "  make run-basic    - 運行基本韌體範例"
	@echo "  make run-ota      - 運行 OTA 更新範例"
	@echo "  make run-crypto   - 運行 AES 加密解密範例"
	@echo "  make run-rsa      - 運行 RSA 簽名驗證範例"
	@echo "  make run-flash    - 運行 Flash 讀寫範例"
	@echo "  make run-boot     - 運行安全啟動範例"
	@echo "  make run-complete - 運行完整系統範例"
	@echo "  make clean        - 清理編譯產物"
	@echo "  make help         - 顯示此幫助資訊"
	@echo ""
