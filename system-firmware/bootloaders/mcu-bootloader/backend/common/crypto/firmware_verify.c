/*
 * Firmware Verification Module
 *
 * Copyright (C) 2025 AI-Assisted Development Team
 * SPDX-License-Identifier: MIT
 */

#include <stdint.h>
#include <stdbool.h>
#include <string.h>

/* CRC32 lookup table */
static const uint32_t crc32_table[256] = {
    /* Generated CRC32 table ... */
    0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA,
    0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
    /* ... (省略完整表格) */
};

/**
 * Calculate CRC32 checksum
 */
uint32_t crc32_calculate(const uint8_t *data, uint32_t length)
{
    uint32_t crc = 0xFFFFFFFF;

    while (length--) {
        crc = (crc >> 8) ^ crc32_table[(crc ^ *data++) & 0xFF];
    }

    return crc ^ 0xFFFFFFFF;
}

/**
 * Verify firmware CRC32
 */
bool firmware_verify_crc32(const uint8_t *firmware, uint32_t length, uint32_t expected_crc)
{
    uint32_t calculated_crc = crc32_calculate(firmware, length);
    return (calculated_crc == expected_crc);
}

#ifdef USE_MBEDTLS

#include "mbedtls/sha256.h"
#include "mbedtls/rsa.h"
#include "mbedtls/pk.h"

/**
 * Calculate SHA256 hash
 */
int firmware_calculate_sha256(const uint8_t *data, uint32_t length, uint8_t *hash)
{
    mbedtls_sha256_context ctx;

    mbedtls_sha256_init(&ctx);
    mbedtls_sha256_starts(&ctx, 0);  // 0 = SHA256, 1 = SHA224
    mbedtls_sha256_update(&ctx, data, length);
    mbedtls_sha256_finish(&ctx, hash);
    mbedtls_sha256_free(&ctx);

    return 0;
}

/**
 * Verify RSA signature
 */
bool firmware_verify_rsa_signature(const uint8_t *firmware,
                                   uint32_t length,
                                   const uint8_t *signature,
                                   const uint8_t *public_key,
                                   uint32_t key_length)
{
    mbedtls_pk_context pk;
    uint8_t hash[32];
    int ret;

    // Calculate SHA256 hash of firmware
    firmware_calculate_sha256(firmware, length, hash);

    // Initialize public key
    mbedtls_pk_init(&pk);

    ret = mbedtls_pk_parse_public_key(&pk, public_key, key_length);
    if (ret != 0) {
        mbedtls_pk_free(&pk);
        return false;
    }

    // Verify signature
    ret = mbedtls_pk_verify(&pk,
                           MBEDTLS_MD_SHA256,
                           hash, sizeof(hash),
                           signature, 256);  // RSA-2048 signature size

    mbedtls_pk_free(&pk);

    return (ret == 0);
}

#endif /* USE_MBEDTLS */

/**
 * Firmware header structure
 */
typedef struct {
    uint32_t magic;              // Magic number 0x46574152 ("FWAR")
    uint32_t version;            // Firmware version
    uint32_t timestamp;          // Build timestamp
    uint32_t size;               // Firmware size
    uint32_t crc32;              // CRC32 checksum
    uint8_t  sha256[32];         // SHA256 hash
    uint8_t  signature[256];     // RSA signature
    uint8_t  reserved[64];       // Reserved for future use
} __attribute__((packed)) firmware_header_t;

#define FIRMWARE_MAGIC 0x46574152

/**
 * Verify complete firmware package
 */
bool firmware_verify_complete(const uint8_t *package,
                              uint32_t package_size,
                              const uint8_t *public_key,
                              uint32_t key_length)
{
    if (package_size < sizeof(firmware_header_t)) {
        return false;
    }

    firmware_header_t *header = (firmware_header_t *)package;

    // Check magic number
    if (header->magic != FIRMWARE_MAGIC) {
        return false;
    }

    // Check size
    if (header->size + sizeof(firmware_header_t) != package_size) {
        return false;
    }

    const uint8_t *firmware = package + sizeof(firmware_header_t);

    // Verify CRC32
    if (!firmware_verify_crc32(firmware, header->size, header->crc32)) {
        return false;
    }

#ifdef USE_MBEDTLS
    // Verify SHA256
    uint8_t calculated_hash[32];
    firmware_calculate_sha256(firmware, header->size, calculated_hash);

    if (memcmp(calculated_hash, header->sha256, 32) != 0) {
        return false;
    }

    // Verify RSA signature
    if (!firmware_verify_rsa_signature(firmware, header->size,
                                       header->signature,
                                       public_key, key_length)) {
        return false;
    }
#endif

    return true;
}

/**
 * Get firmware version from header
 */
uint32_t firmware_get_version(const uint8_t *package)
{
    firmware_header_t *header = (firmware_header_t *)package;
    return header->version;
}
