/**
 * @file aes_crypto.c
 * @brief AES Encryption/Decryption Implementation
 * @version 1.0
 * @date 2025-11-18
 */

#include "aes_crypto.h"
#include <string.h>
#include <stdio.h>

#if AES_HW_ACCEL == AES_HW_ACCEL_MBEDTLS
#include "mbedtls/aes.h"
#include "mbedtls/gcm.h"
#elif AES_HW_ACCEL == AES_HW_ACCEL_STM32
#include "stm32_crypto.h"
#elif AES_HW_ACCEL == AES_HW_ACCEL_ESP32
#include "esp_aes.h"
#endif

/* ============================================================================
 * Private Helper Functions
 * ========================================================================== */

/**
 * @brief Validate context and parameters
 */
static int validate_context(const aes_context_t *ctx)
{
    if (!ctx) {
        return AES_ERR_INVALID_PARAM;
    }
    if (!ctx->initialized) {
        return AES_ERR_NOT_INITIALIZED;
    }
    return AES_OK;
}

/**
 * @brief Validate key size
 */
static int validate_key_size(aes_key_size_t key_size)
{
    if (key_size != AES_KEY_128 &&
        key_size != AES_KEY_192 &&
        key_size != AES_KEY_256) {
        return AES_ERR_INVALID_KEY;
    }
    return AES_OK;
}

/**
 * @brief XOR two blocks
 */
static void xor_block(uint8_t *dst, const uint8_t *src, size_t len)
{
    for (size_t i = 0; i < len; i++) {
        dst[i] ^= src[i];
    }
}

/**
 * @brief Increment counter for CTR mode
 */
static void increment_counter(uint32_t *counter)
{
    for (int i = 3; i >= 0; i--) {
        counter[i]++;
        if (counter[i] != 0) {
            break;
        }
    }
}

/* ============================================================================
 * Core API Implementation
 * ========================================================================== */

int aes_init(aes_context_t *ctx, aes_key_size_t key_size, aes_mode_t mode)
{
    if (!ctx) {
        return AES_ERR_INVALID_PARAM;
    }

    // Validate parameters
    int ret = validate_key_size(key_size);
    if (ret != AES_OK) {
        return ret;
    }

    if (mode > AES_MODE_GCM) {
        return AES_ERR_INVALID_MODE;
    }

    // Clear context
    memset(ctx, 0, sizeof(aes_context_t));

    // Initialize context
    ctx->key_size = key_size;
    ctx->mode = mode;
    ctx->initialized = false;

#if AES_HW_ACCEL == AES_HW_ACCEL_MBEDTLS
    // Allocate mbedTLS context
    if (mode == AES_MODE_GCM) {
        ctx->mbedtls_ctx = malloc(sizeof(mbedtls_gcm_context));
        if (!ctx->mbedtls_ctx) {
            return AES_ERR_HW_FAILURE;
        }
        mbedtls_gcm_init((mbedtls_gcm_context *)ctx->mbedtls_ctx);
    } else {
        ctx->mbedtls_ctx = malloc(sizeof(mbedtls_aes_context));
        if (!ctx->mbedtls_ctx) {
            return AES_ERR_HW_FAILURE;
        }
        mbedtls_aes_init((mbedtls_aes_context *)ctx->mbedtls_ctx);
    }
#elif AES_HW_ACCEL == AES_HW_ACCEL_STM32
    ret = aes_hw_init_stm32();
    if (ret != AES_OK) {
        return ret;
    }
#elif AES_HW_ACCEL == AES_HW_ACCEL_ESP32
    ret = aes_hw_init_esp32();
    if (ret != AES_OK) {
        return ret;
    }
#endif

    return AES_OK;
}

int aes_set_key(aes_context_t *ctx, const uint8_t *key, size_t key_len)
{
    if (!ctx || !key) {
        return AES_ERR_INVALID_PARAM;
    }

    // Validate key length
    size_t expected_len = ctx->key_size / 8;
    if (key_len != expected_len) {
        return AES_ERR_INVALID_KEY;
    }

    // Copy key
    memcpy(ctx->key, key, key_len);

#if AES_HW_ACCEL == AES_HW_ACCEL_MBEDTLS
    if (ctx->mode == AES_MODE_GCM) {
        mbedtls_gcm_context *gcm = (mbedtls_gcm_context *)ctx->mbedtls_ctx;
        int ret = mbedtls_gcm_setkey(gcm, MBEDTLS_CIPHER_ID_AES, key, ctx->key_size);
        if (ret != 0) {
            return AES_ERR_INVALID_KEY;
        }
    } else {
        mbedtls_aes_context *aes = (mbedtls_aes_context *)ctx->mbedtls_ctx;
        mbedtls_aes_setkey_enc(aes, key, ctx->key_size);
        mbedtls_aes_setkey_dec(aes, key, ctx->key_size);
    }
#endif

    ctx->initialized = true;
    return AES_OK;
}

int aes_set_iv(aes_context_t *ctx, const uint8_t *iv, size_t iv_len)
{
    if (!ctx || !iv) {
        return AES_ERR_INVALID_PARAM;
    }

    if (iv_len != 16) {
        return AES_ERR_INVALID_PARAM;
    }

    memcpy(ctx->iv, iv, 16);
    return AES_OK;
}

int aes_set_nonce(aes_context_t *ctx, const uint8_t *nonce, size_t nonce_len)
{
    if (!ctx || !nonce) {
        return AES_ERR_INVALID_PARAM;
    }

    if (nonce_len > 16) {
        return AES_ERR_INVALID_PARAM;
    }

    memset(ctx->nonce, 0, 16);
    memcpy(ctx->nonce, nonce, nonce_len);
    return AES_OK;
}

int aes_encrypt(aes_context_t *ctx, const uint8_t *input, uint8_t *output, size_t length)
{
    int ret = validate_context(ctx);
    if (ret != AES_OK) {
        return ret;
    }

    if (!input || !output || length == 0) {
        return AES_ERR_INVALID_PARAM;
    }

    // Check alignment for block modes
    if ((ctx->mode == AES_MODE_ECB || ctx->mode == AES_MODE_CBC) && (length % 16 != 0)) {
        return AES_ERR_ALIGNMENT;
    }

#if AES_HW_ACCEL == AES_HW_ACCEL_MBEDTLS
    mbedtls_aes_context *aes = (mbedtls_aes_context *)ctx->mbedtls_ctx;

    switch (ctx->mode) {
        case AES_MODE_ECB:
            for (size_t i = 0; i < length; i += 16) {
                mbedtls_aes_crypt_ecb(aes, MBEDTLS_AES_ENCRYPT,
                                     input + i, output + i);
            }
            break;

        case AES_MODE_CBC: {
            uint8_t iv_copy[16];
            memcpy(iv_copy, ctx->iv, 16);
            mbedtls_aes_crypt_cbc(aes, MBEDTLS_AES_ENCRYPT, length,
                                 iv_copy, input, output);
            break;
        }

        case AES_MODE_CTR: {
            size_t nc_off = 0;
            uint8_t stream_block[16];
            uint8_t nonce_counter[16];
            memcpy(nonce_counter, ctx->nonce, 16);
            mbedtls_aes_crypt_ctr(aes, length, &nc_off,
                                 nonce_counter, stream_block,
                                 input, output);
            break;
        }

        case AES_MODE_GCM:
            return AES_ERR_INVALID_MODE; // Use aes_gcm_encrypt instead

        default:
            return AES_ERR_INVALID_MODE;
    }
#elif AES_HW_ACCEL == AES_HW_ACCEL_STM32
    // STM32 hardware acceleration implementation
    return stm32_aes_encrypt(ctx, input, output, length);
#elif AES_HW_ACCEL == AES_HW_ACCEL_ESP32
    // ESP32 hardware acceleration implementation
    return esp32_aes_encrypt(ctx, input, output, length);
#endif

    return AES_OK;
}

int aes_decrypt(aes_context_t *ctx, const uint8_t *input, uint8_t *output, size_t length)
{
    int ret = validate_context(ctx);
    if (ret != AES_OK) {
        return ret;
    }

    if (!input || !output || length == 0) {
        return AES_ERR_INVALID_PARAM;
    }

    // Check alignment for block modes
    if ((ctx->mode == AES_MODE_ECB || ctx->mode == AES_MODE_CBC) && (length % 16 != 0)) {
        return AES_ERR_ALIGNMENT;
    }

#if AES_HW_ACCEL == AES_HW_ACCEL_MBEDTLS
    mbedtls_aes_context *aes = (mbedtls_aes_context *)ctx->mbedtls_ctx;

    switch (ctx->mode) {
        case AES_MODE_ECB:
            for (size_t i = 0; i < length; i += 16) {
                mbedtls_aes_crypt_ecb(aes, MBEDTLS_AES_DECRYPT,
                                     input + i, output + i);
            }
            break;

        case AES_MODE_CBC: {
            uint8_t iv_copy[16];
            memcpy(iv_copy, ctx->iv, 16);
            mbedtls_aes_crypt_cbc(aes, MBEDTLS_AES_DECRYPT, length,
                                 iv_copy, input, output);
            break;
        }

        case AES_MODE_CTR: {
            // CTR mode is symmetric
            size_t nc_off = 0;
            uint8_t stream_block[16];
            uint8_t nonce_counter[16];
            memcpy(nonce_counter, ctx->nonce, 16);
            mbedtls_aes_crypt_ctr(aes, length, &nc_off,
                                 nonce_counter, stream_block,
                                 input, output);
            break;
        }

        case AES_MODE_GCM:
            return AES_ERR_INVALID_MODE; // Use aes_gcm_decrypt instead

        default:
            return AES_ERR_INVALID_MODE;
    }
#elif AES_HW_ACCEL == AES_HW_ACCEL_STM32
    return stm32_aes_decrypt(ctx, input, output, length);
#elif AES_HW_ACCEL == AES_HW_ACCEL_ESP32
    return esp32_aes_decrypt(ctx, input, output, length);
#endif

    return AES_OK;
}

void aes_free(aes_context_t *ctx)
{
    if (!ctx) {
        return;
    }

#if AES_HW_ACCEL == AES_HW_ACCEL_MBEDTLS
    if (ctx->mbedtls_ctx) {
        if (ctx->mode == AES_MODE_GCM) {
            mbedtls_gcm_free((mbedtls_gcm_context *)ctx->mbedtls_ctx);
        } else {
            mbedtls_aes_free((mbedtls_aes_context *)ctx->mbedtls_ctx);
        }
        free(ctx->mbedtls_ctx);
        ctx->mbedtls_ctx = NULL;
    }
#elif AES_HW_ACCEL == AES_HW_ACCEL_STM32
    aes_hw_deinit_stm32();
#elif AES_HW_ACCEL == AES_HW_ACCEL_ESP32
    aes_hw_deinit_esp32();
#endif

    // Clear sensitive data
    aes_secure_memzero(ctx, sizeof(aes_context_t));
}

/* ============================================================================
 * GCM Authenticated Encryption Implementation
 * ========================================================================== */

int aes_gcm_encrypt(aes_context_t *ctx,
                    const uint8_t *input, size_t input_len,
                    uint8_t *output,
                    const aes_aad_t *aad,
                    uint8_t *tag)
{
    int ret = validate_context(ctx);
    if (ret != AES_OK) {
        return ret;
    }

    if (ctx->mode != AES_MODE_GCM) {
        return AES_ERR_INVALID_MODE;
    }

    if (!input || !output || !tag) {
        return AES_ERR_INVALID_PARAM;
    }

#if AES_HW_ACCEL == AES_HW_ACCEL_MBEDTLS
    mbedtls_gcm_context *gcm = (mbedtls_gcm_context *)ctx->mbedtls_ctx;

    const uint8_t *aad_data = aad ? aad->data : NULL;
    size_t aad_len = aad ? aad->length : 0;

    ret = mbedtls_gcm_crypt_and_tag(gcm, MBEDTLS_GCM_ENCRYPT,
                                    input_len,
                                    ctx->nonce, 12,
                                    aad_data, aad_len,
                                    input, output,
                                    16, tag);
    if (ret != 0) {
        return AES_ERR_HW_FAILURE;
    }
#elif AES_HW_ACCEL == AES_HW_ACCEL_STM32
    return stm32_aes_gcm_encrypt(ctx, input, input_len, output, aad, tag);
#elif AES_HW_ACCEL == AES_HW_ACCEL_ESP32
    return esp32_aes_gcm_encrypt(ctx, input, input_len, output, aad, tag);
#endif

    return AES_OK;
}

int aes_gcm_decrypt(aes_context_t *ctx,
                    const uint8_t *input, size_t input_len,
                    uint8_t *output,
                    const aes_aad_t *aad,
                    const uint8_t *tag)
{
    int ret = validate_context(ctx);
    if (ret != AES_OK) {
        return ret;
    }

    if (ctx->mode != AES_MODE_GCM) {
        return AES_ERR_INVALID_MODE;
    }

    if (!input || !output || !tag) {
        return AES_ERR_INVALID_PARAM;
    }

#if AES_HW_ACCEL == AES_HW_ACCEL_MBEDTLS
    mbedtls_gcm_context *gcm = (mbedtls_gcm_context *)ctx->mbedtls_ctx;

    const uint8_t *aad_data = aad ? aad->data : NULL;
    size_t aad_len = aad ? aad->length : 0;

    ret = mbedtls_gcm_auth_decrypt(gcm, input_len,
                                    ctx->nonce, 12,
                                    aad_data, aad_len,
                                    tag, 16,
                                    input, output);
    if (ret == MBEDTLS_ERR_GCM_AUTH_FAILED) {
        return AES_ERR_AUTH_FAILED;
    } else if (ret != 0) {
        return AES_ERR_HW_FAILURE;
    }
#elif AES_HW_ACCEL == AES_HW_ACCEL_STM32
    return stm32_aes_gcm_decrypt(ctx, input, input_len, output, aad, tag);
#elif AES_HW_ACCEL == AES_HW_ACCEL_ESP32
    return esp32_aes_gcm_decrypt(ctx, input, input_len, output, aad, tag);
#endif

    return AES_OK;
}

/* ============================================================================
 * Utility Functions Implementation
 * ========================================================================== */

int aes_pkcs7_pad(uint8_t *data, size_t data_len, size_t buffer_size, size_t *padded_len)
{
    if (!data || !padded_len) {
        return AES_ERR_INVALID_PARAM;
    }

    // Calculate padding length
    size_t pad_len = 16 - (data_len % 16);
    size_t new_len = data_len + pad_len;

    if (new_len > buffer_size) {
        return AES_ERR_BUFFER_TOO_SMALL;
    }

    // Apply PKCS#7 padding
    for (size_t i = 0; i < pad_len; i++) {
        data[data_len + i] = (uint8_t)pad_len;
    }

    *padded_len = new_len;
    return AES_OK;
}

int aes_pkcs7_unpad(const uint8_t *data, size_t padded_len, size_t *unpadded_len)
{
    if (!data || !unpadded_len || padded_len == 0) {
        return AES_ERR_INVALID_PARAM;
    }

    // Get padding length from last byte
    uint8_t pad_len = data[padded_len - 1];

    // Validate padding
    if (pad_len == 0 || pad_len > 16 || pad_len > padded_len) {
        return AES_ERR_INVALID_PARAM;
    }

    // Verify all padding bytes
    for (size_t i = padded_len - pad_len; i < padded_len; i++) {
        if (data[i] != pad_len) {
            return AES_ERR_INVALID_PARAM;
        }
    }

    *unpadded_len = padded_len - pad_len;
    return AES_OK;
}

void aes_secure_memzero(void *ptr, size_t len)
{
    if (!ptr || len == 0) {
        return;
    }

    volatile uint8_t *p = (volatile uint8_t *)ptr;
    while (len--) {
        *p++ = 0;
    }
}

const char* aes_get_error_string(int error_code)
{
    switch (error_code) {
        case AES_OK:
            return "Success";
        case AES_ERR_INVALID_PARAM:
            return "Invalid parameter";
        case AES_ERR_INVALID_KEY:
            return "Invalid key size";
        case AES_ERR_INVALID_MODE:
            return "Invalid operation mode";
        case AES_ERR_NOT_INITIALIZED:
            return "Context not initialized";
        case AES_ERR_HW_FAILURE:
            return "Hardware failure";
        case AES_ERR_AUTH_FAILED:
            return "Authentication failed";
        case AES_ERR_BUFFER_TOO_SMALL:
            return "Buffer too small";
        case AES_ERR_ALIGNMENT:
            return "Data not aligned to block size";
        default:
            return "Unknown error";
    }
}

/* ============================================================================
 * Performance Benchmarking
 * ========================================================================== */

uint32_t aes_benchmark(aes_key_size_t key_size, aes_mode_t mode,
                       uint32_t iterations, size_t data_size)
{
    aes_context_t ctx;
    uint8_t key[32] = {0};
    uint8_t iv[16] = {0};
    uint8_t *input = malloc(data_size);
    uint8_t *output = malloc(data_size);

    if (!input || !output) {
        free(input);
        free(output);
        return 0;
    }

    // Initialize
    aes_init(&ctx, key_size, mode);
    aes_set_key(&ctx, key, key_size / 8);
    aes_set_iv(&ctx, iv, 16);

    // Measure encryption time
    uint32_t start_time = 0; // Get system tick
    for (uint32_t i = 0; i < iterations; i++) {
        aes_encrypt(&ctx, input, output, data_size);
    }
    uint32_t end_time = 0; // Get system tick

    uint32_t elapsed_ms = end_time - start_time;
    uint32_t total_bytes = iterations * data_size;
    uint32_t throughput = (elapsed_ms > 0) ? (total_bytes * 1000 / elapsed_ms) : 0;

    // Cleanup
    aes_free(&ctx);
    free(input);
    free(output);

    return throughput;
}

/* ============================================================================
 * Hardware Acceleration Stubs
 * ========================================================================== */

#if AES_HW_ACCEL == AES_HW_ACCEL_STM32
int aes_hw_init_stm32(void)
{
    // Initialize STM32 CRYP peripheral
    // Implementation depends on specific STM32 series
    return AES_OK;
}

void aes_hw_deinit_stm32(void)
{
    // Deinitialize STM32 CRYP peripheral
}
#endif

#if AES_HW_ACCEL == AES_HW_ACCEL_ESP32
int aes_hw_init_esp32(void)
{
    // Initialize ESP32 AES accelerator
    // No explicit initialization needed for ESP32
    return AES_OK;
}

void aes_hw_deinit_esp32(void)
{
    // Deinitialize ESP32 AES accelerator
    // No explicit deinitialization needed for ESP32
}
#endif
