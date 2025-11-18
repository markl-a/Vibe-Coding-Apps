/**
 * @file example_cbc.c
 * @brief AES-CBC Mode Encryption Example
 * @version 1.0
 * @date 2025-11-18
 */

#include "../aes_crypto.h"
#include <stdio.h>
#include <string.h>

/**
 * Example: Encrypt and decrypt data using AES-256 CBC mode
 */
int main(void)
{
    printf("========================================\n");
    printf("AES-256 CBC Mode Example\n");
    printf("========================================\n\n");

    // Configuration
    uint8_t key[32] = {
        0x60, 0x3d, 0xeb, 0x10, 0x15, 0xca, 0x71, 0xbe,
        0x2b, 0x73, 0xae, 0xf0, 0x85, 0x7d, 0x77, 0x81,
        0x1f, 0x35, 0x2c, 0x07, 0x3b, 0x61, 0x08, 0xd7,
        0x2d, 0x98, 0x10, 0xa3, 0x09, 0x14, 0xdf, 0xf4
    };

    uint8_t iv[16] = {
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f
    };

    // Original message
    char message[] = "This is a confidential message that needs encryption!";
    size_t msg_len = strlen(message);

    printf("Original Message: %s\n", message);
    printf("Message Length: %zu bytes\n\n", msg_len);

    // Allocate buffers (with padding)
    uint8_t plaintext[128];
    uint8_t ciphertext[128];
    uint8_t decrypted[128];

    // Copy message to plaintext buffer
    memcpy(plaintext, message, msg_len);

    // Apply PKCS#7 padding
    size_t padded_len;
    int ret = aes_pkcs7_pad(plaintext, msg_len, 128, &padded_len);
    if (ret != AES_OK) {
        printf("Error: Failed to apply padding: %s\n", aes_get_error_string(ret));
        return 1;
    }

    printf("Padded Length: %zu bytes\n\n", padded_len);

    // Initialize AES context
    aes_context_t ctx;
    ret = aes_init(&ctx, AES_KEY_256, AES_MODE_CBC);
    if (ret != AES_OK) {
        printf("Error: Failed to initialize AES: %s\n", aes_get_error_string(ret));
        return 1;
    }

    // Set encryption key
    ret = aes_set_key(&ctx, key, 32);
    if (ret != AES_OK) {
        printf("Error: Failed to set key: %s\n", aes_get_error_string(ret));
        aes_free(&ctx);
        return 1;
    }

    // Set initialization vector
    ret = aes_set_iv(&ctx, iv, 16);
    if (ret != AES_OK) {
        printf("Error: Failed to set IV: %s\n", aes_get_error_string(ret));
        aes_free(&ctx);
        return 1;
    }

    // Encrypt the data
    printf("Encrypting...\n");
    ret = aes_encrypt(&ctx, plaintext, ciphertext, padded_len);
    if (ret != AES_OK) {
        printf("Error: Encryption failed: %s\n", aes_get_error_string(ret));
        aes_free(&ctx);
        return 1;
    }

    printf("Ciphertext (hex): ");
    for (size_t i = 0; i < padded_len; i++) {
        printf("%02x", ciphertext[i]);
    }
    printf("\n\n");

    // Decrypt the data (need to reset IV)
    ret = aes_set_iv(&ctx, iv, 16);
    if (ret != AES_OK) {
        printf("Error: Failed to reset IV: %s\n", aes_get_error_string(ret));
        aes_free(&ctx);
        return 1;
    }

    printf("Decrypting...\n");
    ret = aes_decrypt(&ctx, ciphertext, decrypted, padded_len);
    if (ret != AES_OK) {
        printf("Error: Decryption failed: %s\n", aes_get_error_string(ret));
        aes_free(&ctx);
        return 1;
    }

    // Remove padding
    size_t unpadded_len;
    ret = aes_pkcs7_unpad(decrypted, padded_len, &unpadded_len);
    if (ret != AES_OK) {
        printf("Error: Failed to remove padding: %s\n", aes_get_error_string(ret));
        aes_free(&ctx);
        return 1;
    }

    // Null-terminate for printing
    decrypted[unpadded_len] = '\0';

    printf("Decrypted Message: %s\n", decrypted);
    printf("Decrypted Length: %zu bytes\n\n", unpadded_len);

    // Verify
    if (memcmp(message, decrypted, msg_len) == 0) {
        printf("Success: Decrypted message matches original!\n");
    } else {
        printf("Error: Decrypted message does not match original!\n");
    }

    // Cleanup
    aes_free(&ctx);

    printf("\n========================================\n");
    return 0;
}
