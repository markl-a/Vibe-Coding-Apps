/**
 * @file key_management.c
 * @brief Key Management Implementation
 * @version 1.0
 * @date 2025-11-18
 */

#include "key_management.h"
#include <string.h>
#include <stdlib.h>

#ifdef USE_MBEDTLS
#include "mbedtls/hkdf.h"
#include "mbedtls/pkcs5.h"
#include "mbedtls/md.h"
#include "mbedtls/entropy.h"
#include "mbedtls/ctr_drbg.h"
#endif

/* ============================================================================
 * Key Derivation Implementation
 * ========================================================================== */

int key_derive_hkdf_sha256(const uint8_t *input_key, size_t input_len,
                          const uint8_t *salt, size_t salt_len,
                          const char *info,
                          uint8_t *output_key, size_t output_len)
{
#ifdef USE_MBEDTLS
    mbedtls_md_context_t md_ctx;
    mbedtls_md_init(&md_ctx);
    
    const mbedtls_md_info_t *md_info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
    int ret = mbedtls_md_setup(&md_ctx, md_info, 1);
    if (ret != 0) {
        mbedtls_md_free(&md_ctx);
        return -1;
    }
    
    ret = mbedtls_hkdf(md_info, salt, salt_len,
                      input_key, input_len,
                      (const unsigned char *)info, info ? strlen(info) : 0,
                      output_key, output_len);
    
    mbedtls_md_free(&md_ctx);
    return (ret == 0) ? 0 : -1;
#else
    return -1;
#endif
}

int key_derive_pbkdf2_sha256(const char *password, size_t password_len,
                            const uint8_t *salt, size_t salt_len,
                            uint32_t iterations,
                            uint8_t *output_key, size_t output_len)
{
#ifdef USE_MBEDTLS
    mbedtls_md_context_t md_ctx;
    mbedtls_md_init(&md_ctx);
    
    const mbedtls_md_info_t *md_info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
    int ret = mbedtls_md_setup(&md_ctx, md_info, 1);
    if (ret != 0) {
        mbedtls_md_free(&md_ctx);
        return -1;
    }
    
    ret = mbedtls_pkcs5_pbkdf2_hmac(&md_ctx,
                                    (const unsigned char *)password, password_len,
                                    salt, salt_len,
                                    iterations,
                                    output_len, output_key);
    
    mbedtls_md_free(&md_ctx);
    return (ret == 0) ? 0 : -1;
#else
    return -1;
#endif
}

int key_derive_from_device_uid(const uint8_t *device_uid, size_t uid_len,
                               uint8_t *master_key)
{
    const char *info = "SECURE_STORAGE_MASTER_KEY";
    return key_derive_hkdf_sha256(device_uid, uid_len,
                                 NULL, 0,
                                 info,
                                 master_key, KEY_SIZE_256);
}

/* ============================================================================
 * Key Generation Implementation
 * ========================================================================== */

int key_generate_random(uint8_t *key, size_t key_len)
{
#ifdef USE_MBEDTLS
    mbedtls_entropy_context entropy;
    mbedtls_ctr_drbg_context ctr_drbg;
    
    mbedtls_entropy_init(&entropy);
    mbedtls_ctr_drbg_init(&ctr_drbg);
    
    const char *pers = "key_gen";
    int ret = mbedtls_ctr_drbg_seed(&ctr_drbg, mbedtls_entropy_func, &entropy,
                                    (const unsigned char *)pers, strlen(pers));
    if (ret != 0) {
        mbedtls_entropy_free(&entropy);
        mbedtls_ctr_drbg_free(&ctr_drbg);
        return -1;
    }
    
    ret = mbedtls_ctr_drbg_random(&ctr_drbg, key, key_len);
    
    mbedtls_entropy_free(&entropy);
    mbedtls_ctr_drbg_free(&ctr_drbg);
    
    return (ret == 0) ? 0 : -1;
#else
    // Fallback: pseudo-random (NOT cryptographically secure)
    for (size_t i = 0; i < key_len; i++) {
        key[i] = (uint8_t)(rand() & 0xFF);
    }
    return 0;
#endif
}

int key_generate_salt(uint8_t *salt, size_t salt_len)
{
    return key_generate_random(salt, salt_len);
}

int key_generate_iv(uint8_t *iv, size_t iv_len)
{
    return key_generate_random(iv, iv_len);
}

/* ============================================================================
 * Key Validation Implementation
 * ========================================================================== */

bool key_validate_strength(const uint8_t *key, size_t key_len)
{
    if (!key || key_len < 16) {
        return false;
    }
    
    // Check if key is all zeros
    if (key_is_zero(key, key_len)) {
        return false;
    }
    
    // Check for minimal entropy (simplified)
    int zero_count = 0;
    int ff_count = 0;
    
    for (size_t i = 0; i < key_len; i++) {
        if (key[i] == 0x00) zero_count++;
        if (key[i] == 0xFF) ff_count++;
    }
    
    // Reject if too many repeated bytes
    if (zero_count > key_len / 2 || ff_count > key_len / 2) {
        return false;
    }
    
    return true;
}

bool key_is_zero(const uint8_t *key, size_t key_len)
{
    if (!key) {
        return true;
    }
    
    for (size_t i = 0; i < key_len; i++) {
        if (key[i] != 0) {
            return false;
        }
    }
    
    return true;
}

/* ============================================================================
 * Secure Memory Operations
 * ========================================================================== */

void key_secure_copy(uint8_t *dst, const uint8_t *src, size_t len)
{
    if (!dst || !src) {
        return;
    }
    
    volatile uint8_t *d = (volatile uint8_t *)dst;
    volatile const uint8_t *s = (volatile const uint8_t *)src;
    
    while (len--) {
        *d++ = *s++;
    }
}

int key_secure_compare(const uint8_t *key1, const uint8_t *key2, size_t len)
{
    if (!key1 || !key2) {
        return -1;
    }
    
    volatile uint8_t diff = 0;
    
    for (size_t i = 0; i < len; i++) {
        diff |= key1[i] ^ key2[i];
    }
    
    return diff;
}

void key_secure_erase(uint8_t *key, size_t len)
{
    if (!key || len == 0) {
        return;
    }
    
    volatile uint8_t *p = (volatile uint8_t *)key;
    while (len--) {
        *p++ = 0;
    }
}
