/**
 * @file secure_storage.c
 * @brief Secure Storage Implementation
 * @version 1.0
 * @date 2025-11-18
 */

#include "secure_storage.h"
#include "key_management.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

// Platform-specific includes
#ifdef USE_MBEDTLS
#include "mbedtls/gcm.h"
#include "mbedtls/sha256.h"
#endif

#define STORAGE_MAGIC 0x53544F52  // 'STOR'
#define STORAGE_VERSION 0x00000001

/* ============================================================================
 * Private Helper Functions
 * ========================================================================== */

static bool validate_slot(storage_slot_t slot)
{
    return (slot >= 0 && slot < SECURE_STORAGE_MAX_SLOTS);
}

static int encrypt_data(const uint8_t *key,
                       const uint8_t *nonce,
                       const uint8_t *plaintext, size_t plaintext_len,
                       uint8_t *ciphertext,
                       uint8_t *tag)
{
#ifdef USE_MBEDTLS
    mbedtls_gcm_context gcm;
    mbedtls_gcm_init(&gcm);
    
    int ret = mbedtls_gcm_setkey(&gcm, MBEDTLS_CIPHER_ID_AES, key, 256);
    if (ret != 0) {
        mbedtls_gcm_free(&gcm);
        return STORAGE_ERR_ENCRYPTION;
    }
    
    ret = mbedtls_gcm_crypt_and_tag(&gcm, MBEDTLS_GCM_ENCRYPT,
                                    plaintext_len, nonce, 12,
                                    NULL, 0,
                                    plaintext, ciphertext,
                                    16, tag);
    
    mbedtls_gcm_free(&gcm);
    return (ret == 0) ? STORAGE_OK : STORAGE_ERR_ENCRYPTION;
#else
    return STORAGE_ERR_ENCRYPTION;
#endif
}

static int decrypt_data(const uint8_t *key,
                       const uint8_t *nonce,
                       const uint8_t *ciphertext, size_t ciphertext_len,
                       const uint8_t *tag,
                       uint8_t *plaintext)
{
#ifdef USE_MBEDTLS
    mbedtls_gcm_context gcm;
    mbedtls_gcm_init(&gcm);
    
    int ret = mbedtls_gcm_setkey(&gcm, MBEDTLS_CIPHER_ID_AES, key, 256);
    if (ret != 0) {
        mbedtls_gcm_free(&gcm);
        return STORAGE_ERR_DECRYPTION;
    }
    
    ret = mbedtls_gcm_auth_decrypt(&gcm, ciphertext_len,
                                   nonce, 12,
                                   NULL, 0,
                                   tag, 16,
                                   ciphertext, plaintext);
    
    mbedtls_gcm_free(&gcm);
    
    if (ret == MBEDTLS_ERR_GCM_AUTH_FAILED) {
        return STORAGE_ERR_AUTH_FAILED;
    }
    return (ret == 0) ? STORAGE_OK : STORAGE_ERR_DECRYPTION;
#else
    return STORAGE_ERR_DECRYPTION;
#endif
}

/* ============================================================================
 * Core API Implementation
 * ========================================================================== */

int secure_storage_init(secure_storage_context_t *ctx)
{
    if (!ctx) {
        return STORAGE_ERR_INVALID_PARAM;
    }
    
    memset(ctx, 0, sizeof(secure_storage_context_t));
    
    // Get device UID
    int ret = secure_storage_get_device_uid(ctx->device_uid);
    if (ret != STORAGE_OK) {
        return ret;
    }
    
    // Derive master key from device UID
    ret = key_derive_from_device_uid(ctx->device_uid, SECURE_STORAGE_UID_SIZE,
                                    ctx->master_key);
    if (ret != 0) {
        return STORAGE_ERR_ENCRYPTION;
    }
    
    // Initialize slot metadata
    for (int i = 0; i < SECURE_STORAGE_MAX_SLOTS; i++) {
        ctx->slots[i].magic = STORAGE_MAGIC;
        ctx->slots[i].version = STORAGE_VERSION;
        ctx->slots[i].slot_id = i;
        ctx->slots[i].in_use = false;
    }
    
    ctx->initialized = true;
    return STORAGE_OK;
}

void secure_storage_deinit(secure_storage_context_t *ctx)
{
    if (!ctx) {
        return;
    }
    
    // Clear sensitive data
    secure_storage_memzero(ctx->master_key, sizeof(ctx->master_key));
    secure_storage_memzero(ctx, sizeof(secure_storage_context_t));
}

int secure_storage_write(secure_storage_context_t *ctx,
                         storage_slot_t slot,
                         const uint8_t *data,
                         size_t data_size)
{
    if (!ctx || !data) {
        return STORAGE_ERR_INVALID_PARAM;
    }
    
    if (!ctx->initialized) {
        return STORAGE_ERR_NOT_INITIALIZED;
    }
    
    if (!validate_slot(slot)) {
        return STORAGE_ERR_INVALID_SLOT;
    }
    
    if (data_size > SECURE_STORAGE_MAX_DATA_SIZE) {
        return STORAGE_ERR_SIZE_EXCEEDED;
    }
    
    storage_metadata_t *meta = &ctx->slots[slot];
    
    // Generate nonce
    key_generate_iv(meta->nonce, SECURE_STORAGE_NONCE_SIZE);
    
    // Allocate encrypted data buffer
    uint8_t *encrypted_data = malloc(data_size);
    if (!encrypted_data) {
        return STORAGE_ERR_ENCRYPTION;
    }
    
    // Encrypt data
    int ret = encrypt_data(ctx->master_key, meta->nonce,
                          data, data_size,
                          encrypted_data, meta->tag);
    if (ret != STORAGE_OK) {
        free(encrypted_data);
        return ret;
    }
    
    // Compute CRC
    meta->crc32 = secure_storage_crc32(encrypted_data, data_size);
    
    // Update metadata
    meta->data_size = data_size;
    meta->in_use = true;
    meta->write_count++;
    
    // Write to backend storage (simplified)
    // In real implementation, would write to Flash/EEPROM
    
    free(encrypted_data);
    return STORAGE_OK;
}

int secure_storage_read(secure_storage_context_t *ctx,
                        storage_slot_t slot,
                        uint8_t *data,
                        size_t buffer_size,
                        size_t *data_size)
{
    if (!ctx || !data || !data_size) {
        return STORAGE_ERR_INVALID_PARAM;
    }
    
    if (!ctx->initialized) {
        return STORAGE_ERR_NOT_INITIALIZED;
    }
    
    if (!validate_slot(slot)) {
        return STORAGE_ERR_INVALID_SLOT;
    }
    
    storage_metadata_t *meta = &ctx->slots[slot];
    
    if (!meta->in_use) {
        return STORAGE_ERR_SLOT_EMPTY;
    }
    
    if (buffer_size < meta->data_size) {
        return STORAGE_ERR_INVALID_PARAM;
    }
    
    // Read from backend storage (simplified)
    uint8_t *encrypted_data = malloc(meta->data_size);
    if (!encrypted_data) {
        return STORAGE_ERR_DECRYPTION;
    }
    
    // In real implementation, would read from Flash/EEPROM
    // For now, simulate
    
    // Decrypt data
    int ret = decrypt_data(ctx->master_key, meta->nonce,
                          encrypted_data, meta->data_size,
                          meta->tag, data);
    
    free(encrypted_data);
    
    if (ret == STORAGE_OK) {
        *data_size = meta->data_size;
    }
    
    return ret;
}

int secure_storage_erase(secure_storage_context_t *ctx, storage_slot_t slot)
{
    if (!ctx) {
        return STORAGE_ERR_INVALID_PARAM;
    }
    
    if (!validate_slot(slot)) {
        return STORAGE_ERR_INVALID_SLOT;
    }
    
    storage_metadata_t *meta = &ctx->slots[slot];
    
    // Clear metadata
    secure_storage_memzero(meta, sizeof(storage_metadata_t));
    meta->magic = STORAGE_MAGIC;
    meta->version = STORAGE_VERSION;
    meta->slot_id = slot;
    meta->in_use = false;
    
    return STORAGE_OK;
}

int secure_storage_erase_all(secure_storage_context_t *ctx)
{
    if (!ctx) {
        return STORAGE_ERR_INVALID_PARAM;
    }
    
    for (int i = 0; i < SECURE_STORAGE_MAX_SLOTS; i++) {
        secure_storage_erase(ctx, i);
    }
    
    return STORAGE_OK;
}

bool secure_storage_is_slot_used(const secure_storage_context_t *ctx,
                                 storage_slot_t slot)
{
    if (!ctx || !validate_slot(slot)) {
        return false;
    }
    
    return ctx->slots[slot].in_use;
}

/* ============================================================================
 * Utility Functions
 * ========================================================================== */

int secure_storage_get_device_uid(uint8_t *uid)
{
    if (!uid) {
        return STORAGE_ERR_INVALID_PARAM;
    }
    
    // Platform-specific implementation
    // For STM32: Read from UID register
    // For ESP32: Read from eFuse
    // For simulation: Generate pseudo-random UID
    
    for (int i = 0; i < SECURE_STORAGE_UID_SIZE; i++) {
        uid[i] = (uint8_t)(i * 0x5A);
    }
    
    return STORAGE_OK;
}

uint32_t secure_storage_crc32(const uint8_t *data, size_t size)
{
    uint32_t crc = 0xFFFFFFFF;
    
    for (size_t i = 0; i < size; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            crc = (crc >> 1) ^ (0xEDB88320 & -(crc & 1));
        }
    }
    
    return ~crc;
}

void secure_storage_memzero(void *ptr, size_t len)
{
    if (!ptr || len == 0) {
        return;
    }
    
    volatile uint8_t *p = (volatile uint8_t *)ptr;
    while (len--) {
        *p++ = 0;
    }
}

const char* secure_storage_get_error_string(int error_code)
{
    switch (error_code) {
        case STORAGE_OK:
            return "Success";
        case STORAGE_ERR_INVALID_PARAM:
            return "Invalid parameter";
        case STORAGE_ERR_INVALID_SLOT:
            return "Invalid slot";
        case STORAGE_ERR_NOT_INITIALIZED:
            return "Not initialized";
        case STORAGE_ERR_SLOT_EMPTY:
            return "Slot is empty";
        case STORAGE_ERR_ENCRYPTION:
            return "Encryption failed";
        case STORAGE_ERR_DECRYPTION:
            return "Decryption failed";
        case STORAGE_ERR_AUTH_FAILED:
            return "Authentication failed";
        case STORAGE_ERR_SIZE_EXCEEDED:
            return "Data size exceeded";
        default:
            return "Unknown error";
    }
}

const char* secure_storage_get_slot_name(storage_slot_t slot)
{
    static const char *slot_names[] = {
        "WiFi Password",
        "API Key",
        "Private Key",
        "Certificate",
        "Encryption Key",
        "Firmware Key",
        "User Data 1",
        "User Data 2",
        "User Data 3",
        "User Data 4",
        "Reserved 1",
        "Reserved 2",
        "Reserved 3",
        "Reserved 4",
        "Reserved 5",
        "Reserved 6"
    };
    
    if (validate_slot(slot)) {
        return slot_names[slot];
    }
    return "Invalid Slot";
}
