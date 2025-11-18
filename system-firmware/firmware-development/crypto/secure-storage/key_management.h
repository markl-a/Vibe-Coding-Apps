/**
 * @file key_management.h
 * @brief Key Management for Secure Storage
 * @version 1.0
 * @date 2025-11-18
 *
 * Key derivation, generation, and management
 */

#ifndef KEY_MANAGEMENT_H
#define KEY_MANAGEMENT_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ============================================================================
 * Configuration
 * ========================================================================== */

#define KEY_SIZE_128    16
#define KEY_SIZE_192    24
#define KEY_SIZE_256    32

#define SALT_SIZE       32
#define IV_SIZE         16

/* ============================================================================
 * Key Derivation Functions
 * ========================================================================== */

/**
 * @brief Derive key using HKDF-SHA256
 *
 * @param input_key Input key material
 * @param input_len Input key length
 * @param salt Salt value (can be NULL)
 * @param salt_len Salt length
 * @param info Context information string
 * @param output_key Output key buffer
 * @param output_len Desired output key length
 * @return 0 on success, negative on error
 */
int key_derive_hkdf_sha256(const uint8_t *input_key, size_t input_len,
                          const uint8_t *salt, size_t salt_len,
                          const char *info,
                          uint8_t *output_key, size_t output_len);

/**
 * @brief Derive key using PBKDF2-SHA256
 *
 * @param password Password string
 * @param password_len Password length
 * @param salt Salt value
 * @param salt_len Salt length
 * @param iterations Number of iterations (min 10000)
 * @param output_key Output key buffer
 * @param output_len Desired output key length
 * @return 0 on success, negative on error
 */
int key_derive_pbkdf2_sha256(const char *password, size_t password_len,
                            const uint8_t *salt, size_t salt_len,
                            uint32_t iterations,
                            uint8_t *output_key, size_t output_len);

/**
 * @brief Derive master key from device UID
 *
 * @param device_uid Device unique identifier
 * @param uid_len UID length
 * @param master_key Output master key (32 bytes)
 * @return 0 on success, negative on error
 */
int key_derive_from_device_uid(const uint8_t *device_uid, size_t uid_len,
                               uint8_t *master_key);

/* ============================================================================
 * Key Generation
 * ========================================================================== */

/**
 * @brief Generate random key
 *
 * @param key Output key buffer
 * @param key_len Desired key length
 * @return 0 on success, negative on error
 */
int key_generate_random(uint8_t *key, size_t key_len);

/**
 * @brief Generate random salt
 *
 * @param salt Output salt buffer
 * @param salt_len Desired salt length
 * @return 0 on success, negative on error
 */
int key_generate_salt(uint8_t *salt, size_t salt_len);

/**
 * @brief Generate random IV/nonce
 *
 * @param iv Output IV buffer
 * @param iv_len Desired IV length
 * @return 0 on success, negative on error
 */
int key_generate_iv(uint8_t *iv, size_t iv_len);

/* ============================================================================
 * Key Wrapping (Key Encryption Key)
 * ========================================================================== */

/**
 * @brief Wrap (encrypt) key with KEK
 *
 * @param kek Key encryption key
 * @param kek_len KEK length
 * @param plaintext_key Key to wrap
 * @param key_len Key length
 * @param wrapped_key Output wrapped key
 * @param wrapped_len Output: wrapped key length
 * @return 0 on success, negative on error
 */
int key_wrap(const uint8_t *kek, size_t kek_len,
            const uint8_t *plaintext_key, size_t key_len,
            uint8_t *wrapped_key, size_t *wrapped_len);

/**
 * @brief Unwrap (decrypt) key with KEK
 *
 * @param kek Key encryption key
 * @param kek_len KEK length
 * @param wrapped_key Wrapped key
 * @param wrapped_len Wrapped key length
 * @param plaintext_key Output plaintext key
 * @param key_len Output: key length
 * @return 0 on success, negative on error
 */
int key_unwrap(const uint8_t *kek, size_t kek_len,
              const uint8_t *wrapped_key, size_t wrapped_len,
              uint8_t *plaintext_key, size_t *key_len);

/* ============================================================================
 * Key Validation
 * ========================================================================== */

/**
 * @brief Validate key strength
 *
 * @param key Key to validate
 * @param key_len Key length
 * @return true if key is valid, false otherwise
 */
bool key_validate_strength(const uint8_t *key, size_t key_len);

/**
 * @brief Check if key is all zeros
 *
 * @param key Key to check
 * @param key_len Key length
 * @return true if all zeros, false otherwise
 */
bool key_is_zero(const uint8_t *key, size_t key_len);

/* ============================================================================
 * Secure Memory Operations
 * ========================================================================== */

/**
 * @brief Secure key copy
 *
 * @param dst Destination buffer
 * @param src Source key
 * @param len Key length
 */
void key_secure_copy(uint8_t *dst, const uint8_t *src, size_t len);

/**
 * @brief Secure key compare
 *
 * @param key1 First key
 * @param key2 Second key
 * @param len Key length
 * @return 0 if equal, non-zero otherwise
 */
int key_secure_compare(const uint8_t *key1, const uint8_t *key2, size_t len);

/**
 * @brief Secure key erase
 *
 * @param key Key to erase
 * @param len Key length
 */
void key_secure_erase(uint8_t *key, size_t len);

#ifdef __cplusplus
}
#endif

#endif /* KEY_MANAGEMENT_H */
