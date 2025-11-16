#ifndef CRYPTO_VERIFY_H
#define CRYPTO_VERIFY_H

#include <stdint.h>
#include <stdbool.h>
#include "secure_boot.h"

// SHA-256 API
void sha256_init(void);
void sha256_update(const uint8_t *data, uint32_t length);
void sha256_final(uint8_t *hash);
void sha256_compute(const uint8_t *data, uint32_t length, uint8_t *hash);

// RSA API
bool rsa_verify_signature(
    const uint8_t *signature,
    const uint8_t *hash,
    uint32_t hash_len,
    const public_key_t *public_key
);

// 工具函數
bool constant_time_compare(const uint8_t *a, const uint8_t *b, uint32_t len);
void secure_memzero(void *ptr, uint32_t len);

// 硬體加密加速 (可選)
#ifdef USE_HW_CRYPTO
bool hw_sha256_compute(const uint8_t *data, uint32_t length, uint8_t *hash);
bool hw_rsa_verify(const uint8_t *signature, const uint8_t *hash,
                   uint32_t hash_len, const public_key_t *key);
#endif

#endif // CRYPTO_VERIFY_H
