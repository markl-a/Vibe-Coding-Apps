/**
 * @file example_gcm.c
 * @brief AES-GCM Authenticated Encryption Example
 * @version 1.0
 * @date 2025-11-18
 */

#include "../aes_crypto.h"
#include <stdio.h>
#include <string.h>

/**
 * Example: Authenticated encryption using AES-256 GCM mode
 */
int main(void)
{
    printf("========================================\n");
    printf("AES-256 GCM Authenticated Encryption\n");
    printf("========================================\n\n");

    // Configuration
    uint8_t key[32] = {
        0xfe, 0xff, 0xe9, 0x92, 0x86, 0x65, 0x73, 0x1c,
        0x6d, 0x6a, 0x8f, 0x94, 0x67, 0x30, 0x83, 0x08,
        0xfe, 0xff, 0xe9, 0x92, 0x86, 0x65, 0x73, 0x1c,
        0x6d, 0x6a, 0x8f, 0x94, 0x67, 0x30, 0x83, 0x08
    };

    uint8_t nonce[12] = {
        0xca, 0xfe, 0xba, 0xbe, 0xfa, 0xce, 0xdb, 0xad,
        0xde, 0xca, 0xf8, 0x88
    };

    // Additional Authenticated Data (not encrypted, but authenticated)
    char aad_string[] = "metadata:version=1.0,type=firmware";
    aes_aad_t aad = {
        .data = (uint8_t *)aad_string,
        .length = strlen(aad_string)
    };

    // Secret message to encrypt
    char message[] = "Firmware update payload: binary data here...";
    size_t msg_len = strlen(message);

    printf("Message: %s\n", message);
    printf("Message Length: %zu bytes\n", msg_len);
    printf("AAD: %s\n", aad_string);
    printf("AAD Length: %zu bytes\n\n", aad.length);

    // Buffers
    uint8_t ciphertext[128];
    uint8_t decrypted[128];
    uint8_t tag[16];

    // Initialize AES-GCM context
    aes_context_t ctx;
    int ret = aes_init(&ctx, AES_KEY_256, AES_MODE_GCM);
    if (ret != AES_OK) {
        printf("Error: Failed to initialize AES-GCM: %s\n", aes_get_error_string(ret));
        return 1;
    }

    // Set encryption key
    ret = aes_set_key(&ctx, key, 32);
    if (ret != AES_OK) {
        printf("Error: Failed to set key: %s\n", aes_get_error_string(ret));
        aes_free(&ctx);
        return 1;
    }

    // Set nonce
    ret = aes_set_nonce(&ctx, nonce, 12);
    if (ret != AES_OK) {
        printf("Error: Failed to set nonce: %s\n", aes_get_error_string(ret));
        aes_free(&ctx);
        return 1;
    }

    // Encrypt and authenticate
    printf("Encrypting and generating authentication tag...\n");
    ret = aes_gcm_encrypt(&ctx, (uint8_t *)message, msg_len,
                         ciphertext, &aad, tag);
    if (ret != AES_OK) {
        printf("Error: GCM encryption failed: %s\n", aes_get_error_string(ret));
        aes_free(&ctx);
        return 1;
    }

    printf("Ciphertext (hex): ");
    for (size_t i = 0; i < msg_len; i++) {
        printf("%02x", ciphertext[i]);
    }
    printf("\n");

    printf("Auth Tag (hex): ");
    for (int i = 0; i < 16; i++) {
        printf("%02x", tag[i]);
    }
    printf("\n\n");

    // Decrypt and verify authentication tag
    ret = aes_set_nonce(&ctx, nonce, 12);
    if (ret != AES_OK) {
        printf("Error: Failed to reset nonce: %s\n", aes_get_error_string(ret));
        aes_free(&ctx);
        return 1;
    }

    printf("Decrypting and verifying authentication tag...\n");
    ret = aes_gcm_decrypt(&ctx, ciphertext, msg_len,
                         decrypted, &aad, tag);
    if (ret != AES_OK) {
        if (ret == AES_ERR_AUTH_FAILED) {
            printf("Error: Authentication failed! Data has been tampered!\n");
        } else {
            printf("Error: GCM decryption failed: %s\n", aes_get_error_string(ret));
        }
        aes_free(&ctx);
        return 1;
    }

    // Null-terminate for printing
    decrypted[msg_len] = '\0';

    printf("Decrypted Message: %s\n\n", decrypted);

    // Verify
    if (memcmp(message, decrypted, msg_len) == 0) {
        printf("Success: Decryption and authentication verified!\n");
    } else {
        printf("Error: Decrypted message does not match original!\n");
    }

    // Test tampering detection
    printf("\n--- Testing Tampering Detection ---\n");
    uint8_t tampered_ciphertext[128];
    memcpy(tampered_ciphertext, ciphertext, msg_len);
    tampered_ciphertext[0] ^= 0xFF; // Tamper with first byte

    ret = aes_set_nonce(&ctx, nonce, 12);
    ret = aes_gcm_decrypt(&ctx, tampered_ciphertext, msg_len,
                         decrypted, &aad, tag);

    if (ret == AES_ERR_AUTH_FAILED) {
        printf("Success: Tampering detected and rejected!\n");
    } else {
        printf("Error: Tampering not detected!\n");
    }

    // Cleanup
    aes_free(&ctx);

    printf("\n========================================\n");
    return 0;
}
