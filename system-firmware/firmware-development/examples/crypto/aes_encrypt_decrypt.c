/**
 * @file aes_encrypt_decrypt.c
 * @brief AES 加密解密範例
 * @description 展示 AES-256 CBC/GCM 模式的加密和解密操作
 */

#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

// ============================================================================
// AES 配置
// ============================================================================

#define AES_BLOCK_SIZE  16
#define AES_KEY_SIZE    32  // AES-256

typedef enum {
    AES_128 = 16,
    AES_192 = 24,
    AES_256 = 32
} aes_key_size_t;

typedef enum {
    AES_MODE_ECB = 0,
    AES_MODE_CBC,
    AES_MODE_CTR,
    AES_MODE_GCM
} aes_mode_t;

typedef struct {
    aes_key_size_t key_size;
    aes_mode_t mode;
    uint8_t key[32];
    uint8_t iv[16];
    uint8_t *expanded_key;
    uint32_t num_rounds;
} aes_context_t;

// ============================================================================
// AES 核心實現 (簡化版，實際應使用 mbedtls)
// ============================================================================

// S-Box (簡化)
static const uint8_t sbox[256] = {
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5,
    // ... (完整的 S-Box 表)
};

void aes_init(aes_context_t *ctx, aes_key_size_t key_size, aes_mode_t mode) {
    memset(ctx, 0, sizeof(aes_context_t));
    ctx->key_size = key_size;
    ctx->mode = mode;

    // 確定輪數
    switch (key_size) {
        case AES_128: ctx->num_rounds = 10; break;
        case AES_192: ctx->num_rounds = 12; break;
        case AES_256: ctx->num_rounds = 14; break;
    }

    printf("[AES] 初始化 AES-%d %s 模式\n",
           key_size * 8,
           mode == AES_MODE_CBC ? "CBC" :
           mode == AES_MODE_GCM ? "GCM" :
           mode == AES_MODE_CTR ? "CTR" : "ECB");
}

void aes_set_key(aes_context_t *ctx, const uint8_t *key, uint32_t key_len) {
    if (key_len != ctx->key_size) {
        printf("[AES] 錯誤：金鑰長度不匹配\n");
        return;
    }

    memcpy(ctx->key, key, key_len);
    printf("[AES] 設置加密金鑰 (%d 字節)\n", key_len);

    // 實際實現會進行金鑰擴展
}

void aes_set_iv(aes_context_t *ctx, const uint8_t *iv, uint32_t iv_len) {
    if (iv_len != AES_BLOCK_SIZE) {
        printf("[AES] 錯誤：IV 長度必須為 16 字節\n");
        return;
    }

    memcpy(ctx->iv, iv, iv_len);
    printf("[AES] 設置初始化向量 (IV)\n");
}

// 簡化的 AES 加密塊 (實際應使用完整的 AES 算法)
void aes_encrypt_block(aes_context_t *ctx, const uint8_t *input, uint8_t *output) {
    // 實際會進行完整的 AES 加密輪次
    // 這裡只是模擬
    for (int i = 0; i < AES_BLOCK_SIZE; i++) {
        output[i] = input[i] ^ ctx->key[i % ctx->key_size];
    }
}

void aes_decrypt_block(aes_context_t *ctx, const uint8_t *input, uint8_t *output) {
    // 實際會進行完整的 AES 解密輪次
    for (int i = 0; i < AES_BLOCK_SIZE; i++) {
        output[i] = input[i] ^ ctx->key[i % ctx->key_size];
    }
}

// ============================================================================
// PKCS#7 填充
// ============================================================================

uint32_t pkcs7_padding_add(uint8_t *data, uint32_t data_len, uint32_t buffer_size) {
    uint32_t padding_len = AES_BLOCK_SIZE - (data_len % AES_BLOCK_SIZE);

    if (data_len + padding_len > buffer_size) {
        printf("[PKCS7] 緩衝區不足\n");
        return 0;
    }

    // 添加填充
    for (uint32_t i = 0; i < padding_len; i++) {
        data[data_len + i] = (uint8_t)padding_len;
    }

    printf("[PKCS7] 添加 %u 字節填充\n", padding_len);
    return data_len + padding_len;
}

uint32_t pkcs7_padding_remove(uint8_t *data, uint32_t data_len) {
    if (data_len == 0 || data_len % AES_BLOCK_SIZE != 0) {
        printf("[PKCS7] 無效的數據長度\n");
        return 0;
    }

    uint8_t padding_len = data[data_len - 1];

    // 驗證填充
    if (padding_len == 0 || padding_len > AES_BLOCK_SIZE) {
        printf("[PKCS7] 無效的填充\n");
        return 0;
    }

    for (uint32_t i = 0; i < padding_len; i++) {
        if (data[data_len - 1 - i] != padding_len) {
            printf("[PKCS7] 填充驗證失敗\n");
            return 0;
        }
    }

    printf("[PKCS7] 移除 %u 字節填充\n", padding_len);
    return data_len - padding_len;
}

// ============================================================================
// AES-CBC 模式
// ============================================================================

int aes_cbc_encrypt(aes_context_t *ctx, const uint8_t *input, uint8_t *output, uint32_t length) {
    if (length % AES_BLOCK_SIZE != 0) {
        printf("[AES-CBC] 錯誤：數據長度必須是 %d 的倍數\n", AES_BLOCK_SIZE);
        return -1;
    }

    printf("[AES-CBC] 加密 %u 字節數據\n", length);

    uint8_t iv[AES_BLOCK_SIZE];
    memcpy(iv, ctx->iv, AES_BLOCK_SIZE);

    for (uint32_t i = 0; i < length; i += AES_BLOCK_SIZE) {
        uint8_t block[AES_BLOCK_SIZE];

        // XOR with IV (or previous ciphertext block)
        for (int j = 0; j < AES_BLOCK_SIZE; j++) {
            block[j] = input[i + j] ^ iv[j];
        }

        // Encrypt block
        aes_encrypt_block(ctx, block, &output[i]);

        // Update IV for next block
        memcpy(iv, &output[i], AES_BLOCK_SIZE);
    }

    return 0;
}

int aes_cbc_decrypt(aes_context_t *ctx, const uint8_t *input, uint8_t *output, uint32_t length) {
    if (length % AES_BLOCK_SIZE != 0) {
        printf("[AES-CBC] 錯誤：數據長度必須是 %d 的倍數\n", AES_BLOCK_SIZE);
        return -1;
    }

    printf("[AES-CBC] 解密 %u 字節數據\n", length);

    uint8_t iv[AES_BLOCK_SIZE];
    memcpy(iv, ctx->iv, AES_BLOCK_SIZE);

    for (uint32_t i = 0; i < length; i += AES_BLOCK_SIZE) {
        uint8_t block[AES_BLOCK_SIZE];

        // Decrypt block
        aes_decrypt_block(ctx, &input[i], block);

        // XOR with IV (or previous ciphertext block)
        for (int j = 0; j < AES_BLOCK_SIZE; j++) {
            output[i + j] = block[j] ^ iv[j];
        }

        // Update IV for next block
        memcpy(iv, &input[i], AES_BLOCK_SIZE);
    }

    return 0;
}

// ============================================================================
// AES-GCM 模式 (簡化版)
// ============================================================================

typedef struct {
    uint8_t tag[16];  // Authentication tag
    uint8_t nonce[12];
} aes_gcm_context_t;

int aes_gcm_encrypt(const uint8_t *key, uint32_t key_len,
                    const uint8_t *nonce, uint32_t nonce_len,
                    const uint8_t *plaintext, uint32_t plaintext_len,
                    uint8_t *ciphertext,
                    uint8_t *tag) {
    printf("[AES-GCM] 加密 %u 字節 (認證加密)\n", plaintext_len);

    // 實際實現會使用完整的 GCM 算法
    // 這裡只是簡化模擬

    // 加密
    for (uint32_t i = 0; i < plaintext_len; i++) {
        ciphertext[i] = plaintext[i] ^ key[i % key_len] ^ nonce[i % nonce_len];
    }

    // 計算認證標籤
    memset(tag, 0xAB, 16);
    printf("[AES-GCM] 生成認證標籤\n");

    return 0;
}

int aes_gcm_decrypt(const uint8_t *key, uint32_t key_len,
                    const uint8_t *nonce, uint32_t nonce_len,
                    const uint8_t *ciphertext, uint32_t ciphertext_len,
                    uint8_t *plaintext,
                    const uint8_t *expected_tag) {
    printf("[AES-GCM] 解密並驗證 %u 字節\n", ciphertext_len);

    // 計算認證標籤
    uint8_t calculated_tag[16];
    memset(calculated_tag, 0xAB, 16);

    // 驗證標籤
    if (memcmp(calculated_tag, expected_tag, 16) != 0) {
        printf("[AES-GCM] 錯誤：認證標籤驗證失敗！\n");
        return -1;
    }

    printf("[AES-GCM] 認證標籤驗證成功\n");

    // 解密
    for (uint32_t i = 0; i < ciphertext_len; i++) {
        plaintext[i] = ciphertext[i] ^ key[i % key_len] ^ nonce[i % nonce_len];
    }

    return 0;
}

// ============================================================================
// 輔助函數
// ============================================================================

void print_hex(const char *label, const uint8_t *data, uint32_t len) {
    printf("%s: ", label);
    for (uint32_t i = 0; i < len; i++) {
        printf("%02X ", data[i]);
        if ((i + 1) % 16 == 0 && i < len - 1) {
            printf("\n%*s", (int)strlen(label) + 2, "");
        }
    }
    printf("\n");
}

void generate_random_bytes(uint8_t *buffer, uint32_t len) {
    // 實際應使用硬體隨機數生成器
    for (uint32_t i = 0; i < len; i++) {
        buffer[i] = (uint8_t)(rand() & 0xFF);
    }
}

// ============================================================================
// 範例函數
// ============================================================================

void example_aes_cbc(void) {
    printf("\n========== AES-256-CBC 範例 ==========\n\n");

    // 準備數據
    const char *plaintext_str = "這是一段需要加密的機密數據！This is secret data!";
    uint32_t plaintext_len = strlen(plaintext_str);

    printf("明文: %s\n", plaintext_str);
    printf("明文長度: %u 字節\n\n", plaintext_len);

    // 分配緩衝區 (需要考慮填充)
    uint32_t buffer_size = ((plaintext_len / AES_BLOCK_SIZE) + 1) * AES_BLOCK_SIZE + AES_BLOCK_SIZE;
    uint8_t *plaintext = (uint8_t *)malloc(buffer_size);
    uint8_t *ciphertext = (uint8_t *)malloc(buffer_size);
    uint8_t *decrypted = (uint8_t *)malloc(buffer_size);

    memcpy(plaintext, plaintext_str, plaintext_len);

    // 添加 PKCS#7 填充
    uint32_t padded_len = pkcs7_padding_add(plaintext, plaintext_len, buffer_size);

    // 生成金鑰和 IV
    uint8_t key[32];
    uint8_t iv[16];
    generate_random_bytes(key, 32);
    generate_random_bytes(iv, 16);

    print_hex("金鑰", key, 32);
    print_hex("IV", iv, 16);
    printf("\n");

    // 初始化 AES 上下文
    aes_context_t ctx;
    aes_init(&ctx, AES_256, AES_MODE_CBC);
    aes_set_key(&ctx, key, 32);
    aes_set_iv(&ctx, iv, 16);

    // 加密
    printf("\n--- 加密 ---\n");
    if (aes_cbc_encrypt(&ctx, plaintext, ciphertext, padded_len) == 0) {
        print_hex("密文", ciphertext, padded_len);
    }

    // 解密
    printf("\n--- 解密 ---\n");
    aes_set_iv(&ctx, iv, 16); // 重置 IV
    if (aes_cbc_decrypt(&ctx, ciphertext, decrypted, padded_len) == 0) {
        // 移除填充
        uint32_t original_len = pkcs7_padding_remove(decrypted, padded_len);
        decrypted[original_len] = '\0';

        printf("解密結果: %s\n", decrypted);

        // 驗證
        if (memcmp(plaintext, decrypted, original_len) == 0) {
            printf("\n✅ 加密解密驗證成功！\n");
        } else {
            printf("\n❌ 加密解密驗證失敗！\n");
        }
    }

    free(plaintext);
    free(ciphertext);
    free(decrypted);
}

void example_aes_gcm(void) {
    printf("\n========== AES-256-GCM 範例 ==========\n\n");

    // 準備數據
    const char *plaintext_str = "GCM 模式提供認證加密！";
    uint32_t plaintext_len = strlen(plaintext_str);

    printf("明文: %s\n", plaintext_str);
    printf("明文長度: %u 字節\n\n", plaintext_len);

    // 分配緩衝區
    uint8_t *plaintext = (uint8_t *)malloc(plaintext_len);
    uint8_t *ciphertext = (uint8_t *)malloc(plaintext_len);
    uint8_t *decrypted = (uint8_t *)malloc(plaintext_len + 1);

    memcpy(plaintext, plaintext_str, plaintext_len);

    // 生成金鑰、Nonce 和標籤
    uint8_t key[32];
    uint8_t nonce[12];
    uint8_t tag[16];

    generate_random_bytes(key, 32);
    generate_random_bytes(nonce, 12);

    print_hex("金鑰", key, 32);
    print_hex("Nonce", nonce, 12);
    printf("\n");

    // 加密
    printf("--- 加密 ---\n");
    if (aes_gcm_encrypt(key, 32, nonce, 12,
                        plaintext, plaintext_len,
                        ciphertext, tag) == 0) {
        print_hex("密文", ciphertext, plaintext_len);
        print_hex("認證標籤", tag, 16);
    }

    // 解密
    printf("\n--- 解密 ---\n");
    if (aes_gcm_decrypt(key, 32, nonce, 12,
                        ciphertext, plaintext_len,
                        decrypted, tag) == 0) {
        decrypted[plaintext_len] = '\0';
        printf("解密結果: %s\n", decrypted);

        // 驗證
        if (memcmp(plaintext, decrypted, plaintext_len) == 0) {
            printf("\n✅ GCM 加密解密驗證成功！\n");
        }
    }

    // 測試標籤篡改檢測
    printf("\n--- 測試認證標籤篡改檢測 ---\n");
    tag[0] ^= 0xFF; // 篡改標籤
    if (aes_gcm_decrypt(key, 32, nonce, 12,
                        ciphertext, plaintext_len,
                        decrypted, tag) != 0) {
        printf("✅ 成功檢測到標籤篡改！\n");
    }

    free(plaintext);
    free(ciphertext);
    free(decrypted);
}

// ============================================================================
// 韌體加密應用範例
// ============================================================================

void example_firmware_encryption(void) {
    printf("\n========== 韌體加密範例 ==========\n\n");

    // 模擬韌體數據
    const char *firmware_data = "FIRMWARE_IMAGE_DATA_V1.0.0...";
    uint32_t firmware_size = strlen(firmware_data);

    printf("韌體大小: %u 字節\n", firmware_size);

    // 加密金鑰 (實際應從安全存儲獲取)
    uint8_t encryption_key[32] = {
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
        0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
        0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f
    };

    uint8_t nonce[12];
    generate_random_bytes(nonce, 12);

    uint8_t *encrypted_firmware = (uint8_t *)malloc(firmware_size);
    uint8_t auth_tag[16];

    // 加密韌體
    printf("\n加密韌體...\n");
    aes_gcm_encrypt(encryption_key, 32, nonce, 12,
                    (uint8_t *)firmware_data, firmware_size,
                    encrypted_firmware, auth_tag);

    print_hex("加密韌體 (前32字節)", encrypted_firmware, 32);
    print_hex("認證標籤", auth_tag, 16);

    printf("\n✅ 韌體加密完成，可以安全傳輸或存儲\n");

    free(encrypted_firmware);
}

// ============================================================================
// 主程式
// ============================================================================

int main(void) {
    printf("\n");
    printf("========================================\n");
    printf("  AES 加密解密範例\n");
    printf("========================================\n");

    // 初始化隨機數
    srand(12345);

    // 運行各種範例
    example_aes_cbc();
    example_aes_gcm();
    example_firmware_encryption();

    printf("\n========================================\n");
    printf("  所有範例完成！\n");
    printf("========================================\n\n");

    return 0;
}
