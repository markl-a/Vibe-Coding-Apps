/**
 * @file rsa_crypto.h
 * @brief RSA Digital Signature Implementation
 * @version 1.0
 * @date 2025-11-18
 *
 * Supports RSA-2048/4096 with PKCS#1 v1.5 and PSS padding
 * Hardware acceleration for STM32 and ESP32
 * mbedTLS integration support
 */

#ifndef RSA_CRYPTO_H
#define RSA_CRYPTO_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ============================================================================
 * Configuration Options
 * ========================================================================== */

// Hardware acceleration support
#define RSA_HW_ACCEL_MBEDTLS    1  // mbedTLS software implementation
#define RSA_HW_ACCEL_STM32      2  // STM32 PKA peripheral
#define RSA_HW_ACCEL_ESP32      3  // ESP32 RSA accelerator

// Select hardware platform
#ifndef RSA_HW_ACCEL
#define RSA_HW_ACCEL RSA_HW_ACCEL_MBEDTLS
#endif

// Maximum key sizes
#define RSA_MAX_KEY_SIZE        4096
#define RSA_MAX_SIGNATURE_SIZE  (RSA_MAX_KEY_SIZE / 8)

/* ============================================================================
 * Type Definitions
 * ========================================================================== */

/**
 * @brief RSA key sizes
 */
typedef enum {
    RSA_KEY_1024 = 1024,  // Not recommended for new applications
    RSA_KEY_2048 = 2048,  // Minimum recommended
    RSA_KEY_3072 = 3072,  // Higher security
    RSA_KEY_4096 = 4096   // Maximum security
} rsa_key_size_t;

/**
 * @brief RSA padding schemes
 */
typedef enum {
    RSA_PADDING_PKCS1_V15 = 0,  // PKCS#1 v1.5 (traditional)
    RSA_PADDING_PSS             // PSS (Probabilistic Signature Scheme)
} rsa_padding_t;

/**
 * @brief Hash algorithms
 */
typedef enum {
    RSA_HASH_SHA256 = 0,
    RSA_HASH_SHA384,
    RSA_HASH_SHA512
} rsa_hash_t;

/**
 * @brief RSA public key structure
 */
typedef struct {
    uint8_t n[RSA_MAX_SIGNATURE_SIZE];  // Modulus
    uint8_t e[8];                        // Public exponent (typically 65537)
    size_t n_len;                        // Modulus length in bytes
    size_t e_len;                        // Exponent length in bytes
    rsa_key_size_t key_size;             // Key size in bits
    bool initialized;                     // Initialization flag

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
    void *mbedtls_ctx;                   // mbedTLS context
#elif RSA_HW_ACCEL == RSA_HW_ACCEL_STM32
    void *hw_handle;                     // STM32 PKA handle
#elif RSA_HW_ACCEL == RSA_HW_ACCEL_ESP32
    void *hw_ctx;                        // ESP32 context
#endif
} rsa_public_key_t;

/**
 * @brief RSA private key structure
 */
typedef struct {
    uint8_t n[RSA_MAX_SIGNATURE_SIZE];  // Modulus
    uint8_t e[8];                        // Public exponent
    uint8_t d[RSA_MAX_SIGNATURE_SIZE];  // Private exponent
    uint8_t p[RSA_MAX_SIGNATURE_SIZE/2];// Prime 1
    uint8_t q[RSA_MAX_SIGNATURE_SIZE/2];// Prime 2
    size_t n_len;                        // Modulus length
    size_t e_len;                        // Public exponent length
    size_t d_len;                        // Private exponent length
    size_t p_len;                        // Prime 1 length
    size_t q_len;                        // Prime 2 length
    rsa_key_size_t key_size;             // Key size in bits
    bool initialized;                     // Initialization flag

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
    void *mbedtls_ctx;                   // mbedTLS context
#elif RSA_HW_ACCEL == RSA_HW_ACCEL_STM32
    void *hw_handle;                     // STM32 PKA handle
#elif RSA_HW_ACCEL == RSA_HW_ACCEL_ESP32
    void *hw_ctx;                        // ESP32 context
#endif
} rsa_private_key_t;

/**
 * @brief RSA signature context
 */
typedef struct {
    rsa_padding_t padding;               // Padding scheme
    rsa_hash_t hash_alg;                 // Hash algorithm
    uint8_t salt_len;                    // Salt length for PSS (0 = hash length)
} rsa_signature_context_t;

/* ============================================================================
 * Error Codes
 * ========================================================================== */

#define RSA_OK                      0
#define RSA_ERR_INVALID_PARAM      -1
#define RSA_ERR_INVALID_KEY        -2
#define RSA_ERR_INVALID_SIGNATURE  -3
#define RSA_ERR_BUFFER_TOO_SMALL   -4
#define RSA_ERR_NOT_INITIALIZED    -5
#define RSA_ERR_HW_FAILURE         -6
#define RSA_ERR_VERIFICATION_FAILED -7
#define RSA_ERR_MEMORY_ALLOCATION  -8
#define RSA_ERR_KEY_GENERATION     -9
#define RSA_ERR_PEM_PARSE          -10

/* ============================================================================
 * Key Management Functions
 * ========================================================================== */

/**
 * @brief Generate RSA key pair
 *
 * @param public_key Pointer to public key structure
 * @param private_key Pointer to private key structure
 * @param key_size Key size in bits
 * @param exponent Public exponent (typically 65537)
 * @return RSA_OK on success, error code otherwise
 */
int rsa_generate_keypair(rsa_public_key_t *public_key,
                         rsa_private_key_t *private_key,
                         rsa_key_size_t key_size,
                         uint32_t exponent);

/**
 * @brief Load public key from PEM format
 *
 * @param key Pointer to public key structure
 * @param pem_data PEM formatted key data
 * @param pem_len Length of PEM data
 * @return RSA_OK on success, error code otherwise
 */
int rsa_load_public_key_pem(rsa_public_key_t *key,
                            const char *pem_data,
                            size_t pem_len);

/**
 * @brief Load private key from PEM format
 *
 * @param key Pointer to private key structure
 * @param pem_data PEM formatted key data
 * @param pem_len Length of PEM data
 * @param password Password for encrypted keys (NULL if not encrypted)
 * @return RSA_OK on success, error code otherwise
 */
int rsa_load_private_key_pem(rsa_private_key_t *key,
                             const char *pem_data,
                             size_t pem_len,
                             const char *password);

/**
 * @brief Load public key from DER format
 *
 * @param key Pointer to public key structure
 * @param der_data DER formatted key data
 * @param der_len Length of DER data
 * @return RSA_OK on success, error code otherwise
 */
int rsa_load_public_key_der(rsa_public_key_t *key,
                            const uint8_t *der_data,
                            size_t der_len);

/**
 * @brief Load private key from DER format
 *
 * @param key Pointer to private key structure
 * @param der_data DER formatted key data
 * @param der_len Length of DER data
 * @return RSA_OK on success, error code otherwise
 */
int rsa_load_private_key_der(rsa_private_key_t *key,
                             const uint8_t *der_data,
                             size_t der_len);

/**
 * @brief Export public key to PEM format
 *
 * @param key Pointer to public key structure
 * @param pem_buffer Buffer to store PEM data
 * @param buffer_size Size of buffer
 * @param pem_len Output: length of PEM data
 * @return RSA_OK on success, error code otherwise
 */
int rsa_export_public_key_pem(const rsa_public_key_t *key,
                              char *pem_buffer,
                              size_t buffer_size,
                              size_t *pem_len);

/**
 * @brief Free public key and clear sensitive data
 *
 * @param key Pointer to public key structure
 */
void rsa_free_public_key(rsa_public_key_t *key);

/**
 * @brief Free private key and clear sensitive data
 *
 * @param key Pointer to private key structure
 */
void rsa_free_private_key(rsa_private_key_t *key);

/* ============================================================================
 * Signature Functions
 * ========================================================================== */

/**
 * @brief Sign data using RSA private key (PKCS#1 v1.5)
 *
 * @param key Pointer to private key
 * @param hash_alg Hash algorithm to use
 * @param hash Hash value to sign
 * @param hash_len Length of hash
 * @param signature Buffer to store signature
 * @param sig_len Output: signature length
 * @return RSA_OK on success, error code otherwise
 */
int rsa_sign_pkcs1v15(const rsa_private_key_t *key,
                      rsa_hash_t hash_alg,
                      const uint8_t *hash,
                      size_t hash_len,
                      uint8_t *signature,
                      size_t *sig_len);

/**
 * @brief Sign data using RSA private key (PSS)
 *
 * @param key Pointer to private key
 * @param hash_alg Hash algorithm to use
 * @param hash Hash value to sign
 * @param hash_len Length of hash
 * @param signature Buffer to store signature
 * @param sig_len Output: signature length
 * @param salt_len Salt length (0 = hash length)
 * @return RSA_OK on success, error code otherwise
 */
int rsa_sign_pss(const rsa_private_key_t *key,
                 rsa_hash_t hash_alg,
                 const uint8_t *hash,
                 size_t hash_len,
                 uint8_t *signature,
                 size_t *sig_len,
                 size_t salt_len);

/**
 * @brief Verify signature using RSA public key (PKCS#1 v1.5)
 *
 * @param key Pointer to public key
 * @param hash_alg Hash algorithm used
 * @param hash Hash value to verify
 * @param hash_len Length of hash
 * @param signature Signature to verify
 * @param sig_len Signature length
 * @return RSA_OK if valid, RSA_ERR_VERIFICATION_FAILED if invalid
 */
int rsa_verify_pkcs1v15(const rsa_public_key_t *key,
                        rsa_hash_t hash_alg,
                        const uint8_t *hash,
                        size_t hash_len,
                        const uint8_t *signature,
                        size_t sig_len);

/**
 * @brief Verify signature using RSA public key (PSS)
 *
 * @param key Pointer to public key
 * @param hash_alg Hash algorithm used
 * @param hash Hash value to verify
 * @param hash_len Length of hash
 * @param signature Signature to verify
 * @param sig_len Signature length
 * @param salt_len Salt length (0 = hash length)
 * @return RSA_OK if valid, RSA_ERR_VERIFICATION_FAILED if invalid
 */
int rsa_verify_pss(const rsa_public_key_t *key,
                   rsa_hash_t hash_alg,
                   const uint8_t *hash,
                   size_t hash_len,
                   const uint8_t *signature,
                   size_t sig_len,
                   size_t salt_len);

/* ============================================================================
 * Utility Functions
 * ========================================================================== */

/**
 * @brief Compute hash of data
 *
 * @param hash_alg Hash algorithm to use
 * @param data Data to hash
 * @param data_len Length of data
 * @param hash Buffer to store hash
 * @param hash_len Output: hash length
 * @return RSA_OK on success, error code otherwise
 */
int rsa_compute_hash(rsa_hash_t hash_alg,
                     const uint8_t *data,
                     size_t data_len,
                     uint8_t *hash,
                     size_t *hash_len);

/**
 * @brief Get hash length for algorithm
 *
 * @param hash_alg Hash algorithm
 * @return Hash length in bytes, 0 on error
 */
size_t rsa_get_hash_length(rsa_hash_t hash_alg);

/**
 * @brief Get signature length for key size
 *
 * @param key_size RSA key size
 * @return Signature length in bytes
 */
size_t rsa_get_signature_length(rsa_key_size_t key_size);

/**
 * @brief Secure memory clear
 *
 * @param ptr Pointer to memory
 * @param len Length to clear
 */
void rsa_secure_memzero(void *ptr, size_t len);

/**
 * @brief Get error string
 *
 * @param error_code Error code
 * @return Error description string
 */
const char* rsa_get_error_string(int error_code);

/**
 * @brief Get key size from public key
 *
 * @param key Pointer to public key
 * @return Key size in bits
 */
rsa_key_size_t rsa_get_key_size(const rsa_public_key_t *key);

/* ============================================================================
 * Performance Benchmarking
 * ========================================================================== */

/**
 * @brief Benchmark RSA signature performance
 *
 * @param key_size Key size to test
 * @param padding Padding scheme
 * @param hash_alg Hash algorithm
 * @param iterations Number of iterations
 * @return Operations per second
 */
uint32_t rsa_benchmark_sign(rsa_key_size_t key_size,
                            rsa_padding_t padding,
                            rsa_hash_t hash_alg,
                            uint32_t iterations);

/**
 * @brief Benchmark RSA verification performance
 *
 * @param key_size Key size to test
 * @param padding Padding scheme
 * @param hash_alg Hash algorithm
 * @param iterations Number of iterations
 * @return Operations per second
 */
uint32_t rsa_benchmark_verify(rsa_key_size_t key_size,
                              rsa_padding_t padding,
                              rsa_hash_t hash_alg,
                              uint32_t iterations);

#ifdef __cplusplus
}
#endif

#endif /* RSA_CRYPTO_H */
