/**
 * @file secure_storage.h
 * @brief Secure Storage Implementation
 * @version 1.0
 * @date 2025-11-18
 *
 * Encrypted storage for sensitive data (keys, certificates, credentials)
 * Hardware acceleration for STM32 and ESP32
 * AES-256-GCM encryption with authentication
 */

#ifndef SECURE_STORAGE_H
#define SECURE_STORAGE_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ============================================================================
 * Configuration Options
 * ========================================================================== */

// Maximum number of storage slots
#define SECURE_STORAGE_MAX_SLOTS        16

// Maximum data size per slot (bytes)
#define SECURE_STORAGE_MAX_DATA_SIZE    4096

// Authentication tag size (AES-GCM)
#define SECURE_STORAGE_TAG_SIZE         16

// Nonce/IV size
#define SECURE_STORAGE_NONCE_SIZE       12

// Device UID size (for key derivation)
#define SECURE_STORAGE_UID_SIZE         16

/* ============================================================================
 * Storage Slot Definitions
 * ========================================================================== */

/**
 * @brief Predefined storage slots
 */
typedef enum {
    SLOT_WIFI_PASSWORD = 0,     // WiFi credentials
    SLOT_API_KEY,               // API keys
    SLOT_PRIVATE_KEY,           // RSA/ECC private keys
    SLOT_CERTIFICATE,           // X.509 certificates
    SLOT_ENCRYPTION_KEY,        // Encryption keys
    SLOT_FIRMWARE_KEY,          // Firmware signing key
    SLOT_USER_DATA_1,           // User-defined data
    SLOT_USER_DATA_2,           // User-defined data
    SLOT_USER_DATA_3,           // User-defined data
    SLOT_USER_DATA_4,           // User-defined data
    SLOT_RESERVED_1,            // Reserved
    SLOT_RESERVED_2,            // Reserved
    SLOT_RESERVED_3,            // Reserved
    SLOT_RESERVED_4,            // Reserved
    SLOT_RESERVED_5,            // Reserved
    SLOT_RESERVED_6             // Reserved
} storage_slot_t;

/**
 * @brief Storage slot metadata
 */
typedef struct {
    uint32_t magic;              // Magic number for validation
    uint32_t version;            // Format version
    uint32_t slot_id;            // Slot identifier
    uint32_t data_size;          // Actual data size
    uint8_t nonce[SECURE_STORAGE_NONCE_SIZE];  // Encryption nonce
    uint8_t tag[SECURE_STORAGE_TAG_SIZE];      // Authentication tag
    uint32_t crc32;              // CRC32 checksum
    bool in_use;                 // Slot in use flag
    uint32_t write_count;        // Write counter (for wear leveling)
    uint8_t reserved[16];        // Reserved for future use
} storage_metadata_t;

/**
 * @brief Secure storage context
 */
typedef struct {
    uint8_t master_key[32];              // Master encryption key (AES-256)
    uint8_t device_uid[SECURE_STORAGE_UID_SIZE];  // Device unique ID
    storage_metadata_t slots[SECURE_STORAGE_MAX_SLOTS];  // Slot metadata
    bool initialized;                     // Initialization flag
    void *backend_ctx;                    // Backend storage context (Flash/EEPROM)
} secure_storage_context_t;

/* ============================================================================
 * Error Codes
 * ========================================================================== */

#define STORAGE_OK                  0
#define STORAGE_ERR_INVALID_PARAM  -1
#define STORAGE_ERR_INVALID_SLOT   -2
#define STORAGE_ERR_NOT_INITIALIZED -3
#define STORAGE_ERR_SLOT_EMPTY     -4
#define STORAGE_ERR_SLOT_FULL      -5
#define STORAGE_ERR_ENCRYPTION     -6
#define STORAGE_ERR_DECRYPTION     -7
#define STORAGE_ERR_AUTH_FAILED    -8
#define STORAGE_ERR_FLASH_WRITE    -9
#define STORAGE_ERR_FLASH_READ     -10
#define STORAGE_ERR_CRC_MISMATCH   -11
#define STORAGE_ERR_SIZE_EXCEEDED  -12

/* ============================================================================
 * Core API Functions
 * ========================================================================== */

/**
 * @brief Initialize secure storage system
 *
 * @param ctx Pointer to storage context
 * @return STORAGE_OK on success, error code otherwise
 */
int secure_storage_init(secure_storage_context_t *ctx);

/**
 * @brief Deinitialize secure storage system
 *
 * @param ctx Pointer to storage context
 */
void secure_storage_deinit(secure_storage_context_t *ctx);

/**
 * @brief Write data to secure storage slot
 *
 * @param ctx Pointer to storage context
 * @param slot Slot identifier
 * @param data Pointer to data
 * @param data_size Size of data in bytes
 * @return STORAGE_OK on success, error code otherwise
 */
int secure_storage_write(secure_storage_context_t *ctx,
                         storage_slot_t slot,
                         const uint8_t *data,
                         size_t data_size);

/**
 * @brief Read data from secure storage slot
 *
 * @param ctx Pointer to storage context
 * @param slot Slot identifier
 * @param data Buffer to store decrypted data
 * @param buffer_size Size of buffer
 * @param data_size Output: actual data size
 * @return STORAGE_OK on success, error code otherwise
 */
int secure_storage_read(secure_storage_context_t *ctx,
                        storage_slot_t slot,
                        uint8_t *data,
                        size_t buffer_size,
                        size_t *data_size);

/**
 * @brief Erase data from storage slot
 *
 * @param ctx Pointer to storage context
 * @param slot Slot identifier
 * @return STORAGE_OK on success, error code otherwise
 */
int secure_storage_erase(secure_storage_context_t *ctx,
                         storage_slot_t slot);

/**
 * @brief Erase all storage slots
 *
 * @param ctx Pointer to storage context
 * @return STORAGE_OK on success, error code otherwise
 */
int secure_storage_erase_all(secure_storage_context_t *ctx);

/**
 * @brief Check if slot is in use
 *
 * @param ctx Pointer to storage context
 * @param slot Slot identifier
 * @return true if slot is in use, false otherwise
 */
bool secure_storage_is_slot_used(const secure_storage_context_t *ctx,
                                 storage_slot_t slot);

/**
 * @brief Get data size in slot
 *
 * @param ctx Pointer to storage context
 * @param slot Slot identifier
 * @param data_size Output: data size
 * @return STORAGE_OK on success, error code otherwise
 */
int secure_storage_get_size(const secure_storage_context_t *ctx,
                            storage_slot_t slot,
                            size_t *data_size);

/* ============================================================================
 * Advanced Functions
 * ========================================================================== */

/**
 * @brief Verify integrity of all slots
 *
 * @param ctx Pointer to storage context
 * @param corrupted_slots Output: array of corrupted slot IDs
 * @param num_corrupted Output: number of corrupted slots
 * @return STORAGE_OK if all valid, error code otherwise
 */
int secure_storage_verify_integrity(const secure_storage_context_t *ctx,
                                    storage_slot_t *corrupted_slots,
                                    size_t *num_corrupted);

/**
 * @brief Get storage statistics
 *
 * @param ctx Pointer to storage context
 * @param used_slots Output: number of used slots
 * @param total_bytes Output: total bytes used
 * @return STORAGE_OK on success, error code otherwise
 */
int secure_storage_get_stats(const secure_storage_context_t *ctx,
                             size_t *used_slots,
                             size_t *total_bytes);

/**
 * @brief Rotate master encryption key
 *
 * @param ctx Pointer to storage context
 * @param new_key New master key (32 bytes)
 * @return STORAGE_OK on success, error code otherwise
 */
int secure_storage_rotate_key(secure_storage_context_t *ctx,
                              const uint8_t *new_key);

/**
 * @brief Export slot data (for backup)
 *
 * @param ctx Pointer to storage context
 * @param slot Slot identifier
 * @param export_data Buffer to store exported data (encrypted)
 * @param buffer_size Size of buffer
 * @param export_size Output: size of exported data
 * @return STORAGE_OK on success, error code otherwise
 */
int secure_storage_export_slot(const secure_storage_context_t *ctx,
                               storage_slot_t slot,
                               uint8_t *export_data,
                               size_t buffer_size,
                               size_t *export_size);

/**
 * @brief Import slot data (from backup)
 *
 * @param ctx Pointer to storage context
 * @param slot Slot identifier
 * @param import_data Exported data (encrypted)
 * @param import_size Size of imported data
 * @return STORAGE_OK on success, error code otherwise
 */
int secure_storage_import_slot(secure_storage_context_t *ctx,
                               storage_slot_t slot,
                               const uint8_t *import_data,
                               size_t import_size);

/* ============================================================================
 * Utility Functions
 * ========================================================================== */

/**
 * @brief Get device unique ID
 *
 * @param uid Buffer to store UID (16 bytes)
 * @return STORAGE_OK on success, error code otherwise
 */
int secure_storage_get_device_uid(uint8_t *uid);

/**
 * @brief Compute CRC32 checksum
 *
 * @param data Data to checksum
 * @param size Data size
 * @return CRC32 value
 */
uint32_t secure_storage_crc32(const uint8_t *data, size_t size);

/**
 * @brief Secure memory clear
 *
 * @param ptr Pointer to memory
 * @param len Length to clear
 */
void secure_storage_memzero(void *ptr, size_t len);

/**
 * @brief Get error string
 *
 * @param error_code Error code
 * @return Error description string
 */
const char* secure_storage_get_error_string(int error_code);

/**
 * @brief Get slot name
 *
 * @param slot Slot identifier
 * @return Slot name string
 */
const char* secure_storage_get_slot_name(storage_slot_t slot);

/* ============================================================================
 * Backend Storage Interface
 * ========================================================================== */

/**
 * @brief Backend storage operations structure
 */
typedef struct {
    int (*init)(void *ctx);
    int (*deinit)(void *ctx);
    int (*write)(void *ctx, uint32_t address, const uint8_t *data, size_t size);
    int (*read)(void *ctx, uint32_t address, uint8_t *data, size_t size);
    int (*erase)(void *ctx, uint32_t address, size_t size);
} storage_backend_t;

/**
 * @brief Register backend storage operations
 *
 * @param ctx Pointer to storage context
 * @param backend Pointer to backend operations structure
 * @return STORAGE_OK on success, error code otherwise
 */
int secure_storage_register_backend(secure_storage_context_t *ctx,
                                    const storage_backend_t *backend);

#ifdef __cplusplus
}
#endif

#endif /* SECURE_STORAGE_H */
