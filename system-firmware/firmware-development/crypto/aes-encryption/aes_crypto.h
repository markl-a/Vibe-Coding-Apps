/**
 * @file aes_crypto.h
 * @brief AES Encryption/Decryption Implementation
 * @version 1.0
 * @date 2025-11-18
 *
 * Supports AES-128/192/256 with CBC, CTR, GCM modes
 * Hardware acceleration for STM32 and ESP32
 * mbedTLS integration support
 */

#ifndef AES_CRYPTO_H
#define AES_CRYPTO_H

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
#define AES_HW_ACCEL_STM32      1  // STM32 CRYP peripheral
#define AES_HW_ACCEL_ESP32      2  // ESP32 AES accelerator
#define AES_HW_ACCEL_MBEDTLS    3  // mbedTLS software implementation

// Select hardware platform (configure based on your target)
#ifndef AES_HW_ACCEL
#define AES_HW_ACCEL AES_HW_ACCEL_MBEDTLS
#endif

/* ============================================================================
 * Type Definitions
 * ========================================================================== */

/**
 * @brief AES key sizes
 */
typedef enum {
    AES_KEY_128 = 128,  // 128-bit key (16 bytes)
    AES_KEY_192 = 192,  // 192-bit key (24 bytes)
    AES_KEY_256 = 256   // 256-bit key (32 bytes)
} aes_key_size_t;

/**
 * @brief AES operation modes
 */
typedef enum {
    AES_MODE_ECB = 0,   // Electronic Codebook (not recommended)
    AES_MODE_CBC,       // Cipher Block Chaining
    AES_MODE_CTR,       // Counter mode
    AES_MODE_GCM        // Galois/Counter Mode (authenticated encryption)
} aes_mode_t;

/**
 * @brief AES operation direction
 */
typedef enum {
    AES_ENCRYPT = 0,
    AES_DECRYPT
} aes_operation_t;

/**
 * @brief AES context structure
 */
typedef struct {
    aes_key_size_t key_size;      // Key size in bits
    aes_mode_t mode;               // Operation mode
    uint8_t key[32];               // Encryption key (max 256 bits)
    uint8_t iv[16];                // Initialization vector
    uint8_t nonce[16];             // Nonce for CTR/GCM modes
    uint32_t counter[4];           // Counter for CTR mode
    uint8_t tag[16];               // Authentication tag for GCM
    bool initialized;              // Context initialized flag

#if AES_HW_ACCEL == AES_HW_ACCEL_STM32
    void *hw_handle;               // STM32 CRYP handle
#elif AES_HW_ACCEL == AES_HW_ACCEL_ESP32
    void *hw_ctx;                  // ESP32 context
#elif AES_HW_ACCEL == AES_HW_ACCEL_MBEDTLS
    void *mbedtls_ctx;             // mbedTLS context
#endif
} aes_context_t;

/**
 * @brief AES GCM additional authenticated data
 */
typedef struct {
    const uint8_t *data;
    size_t length;
} aes_aad_t;

/* ============================================================================
 * Error Codes
 * ========================================================================== */

#define AES_OK                  0
#define AES_ERR_INVALID_PARAM   -1
#define AES_ERR_INVALID_KEY     -2
#define AES_ERR_INVALID_MODE    -3
#define AES_ERR_NOT_INITIALIZED -4
#define AES_ERR_HW_FAILURE      -5
#define AES_ERR_AUTH_FAILED     -6
#define AES_ERR_BUFFER_TOO_SMALL -7
#define AES_ERR_ALIGNMENT       -8

/* ============================================================================
 * Core API Functions
 * ========================================================================== */

/**
 * @brief Initialize AES context
 *
 * @param ctx Pointer to AES context
 * @param key_size Key size (128, 192, or 256 bits)
 * @param mode Operation mode (ECB, CBC, CTR, GCM)
 * @return AES_OK on success, error code otherwise
 */
int aes_init(aes_context_t *ctx, aes_key_size_t key_size, aes_mode_t mode);

/**
 * @brief Set encryption key
 *
 * @param ctx Pointer to AES context
 * @param key Pointer to key data
 * @param key_len Key length in bytes (16, 24, or 32)
 * @return AES_OK on success, error code otherwise
 */
int aes_set_key(aes_context_t *ctx, const uint8_t *key, size_t key_len);

/**
 * @brief Set initialization vector (for CBC, CTR modes)
 *
 * @param ctx Pointer to AES context
 * @param iv Pointer to IV data
 * @param iv_len IV length in bytes (must be 16)
 * @return AES_OK on success, error code otherwise
 */
int aes_set_iv(aes_context_t *ctx, const uint8_t *iv, size_t iv_len);

/**
 * @brief Set nonce (for GCM mode)
 *
 * @param ctx Pointer to AES context
 * @param nonce Pointer to nonce data
 * @param nonce_len Nonce length in bytes (typically 12)
 * @return AES_OK on success, error code otherwise
 */
int aes_set_nonce(aes_context_t *ctx, const uint8_t *nonce, size_t nonce_len);

/**
 * @brief Encrypt data
 *
 * @param ctx Pointer to AES context
 * @param input Pointer to plaintext data
 * @param output Pointer to ciphertext buffer
 * @param length Data length in bytes (must be multiple of 16 for ECB/CBC)
 * @return AES_OK on success, error code otherwise
 */
int aes_encrypt(aes_context_t *ctx, const uint8_t *input, uint8_t *output, size_t length);

/**
 * @brief Decrypt data
 *
 * @param ctx Pointer to AES context
 * @param input Pointer to ciphertext data
 * @param output Pointer to plaintext buffer
 * @param length Data length in bytes (must be multiple of 16 for ECB/CBC)
 * @return AES_OK on success, error code otherwise
 */
int aes_decrypt(aes_context_t *ctx, const uint8_t *input, uint8_t *output, size_t length);

/**
 * @brief Free AES context and clear sensitive data
 *
 * @param ctx Pointer to AES context
 */
void aes_free(aes_context_t *ctx);

/* ============================================================================
 * GCM Authenticated Encryption Functions
 * ========================================================================== */

/**
 * @brief AES-GCM encryption with authentication
 *
 * @param ctx Pointer to AES context
 * @param input Pointer to plaintext data
 * @param input_len Length of plaintext
 * @param output Pointer to ciphertext buffer
 * @param aad Additional authenticated data (can be NULL)
 * @param tag Pointer to authentication tag buffer (16 bytes)
 * @return AES_OK on success, error code otherwise
 */
int aes_gcm_encrypt(aes_context_t *ctx,
                    const uint8_t *input, size_t input_len,
                    uint8_t *output,
                    const aes_aad_t *aad,
                    uint8_t *tag);

/**
 * @brief AES-GCM decryption with authentication
 *
 * @param ctx Pointer to AES context
 * @param input Pointer to ciphertext data
 * @param input_len Length of ciphertext
 * @param output Pointer to plaintext buffer
 * @param aad Additional authenticated data (can be NULL)
 * @param tag Pointer to authentication tag (16 bytes)
 * @return AES_OK on success, AES_ERR_AUTH_FAILED if tag verification fails
 */
int aes_gcm_decrypt(aes_context_t *ctx,
                    const uint8_t *input, size_t input_len,
                    uint8_t *output,
                    const aes_aad_t *aad,
                    const uint8_t *tag);

/* ============================================================================
 * Utility Functions
 * ========================================================================== */

/**
 * @brief Apply PKCS#7 padding
 *
 * @param data Pointer to data buffer
 * @param data_len Current data length
 * @param buffer_size Total buffer size
 * @param padded_len Output: padded length
 * @return AES_OK on success, error code otherwise
 */
int aes_pkcs7_pad(uint8_t *data, size_t data_len, size_t buffer_size, size_t *padded_len);

/**
 * @brief Remove PKCS#7 padding
 *
 * @param data Pointer to padded data
 * @param padded_len Padded data length
 * @param unpadded_len Output: unpadded length
 * @return AES_OK on success, error code otherwise
 */
int aes_pkcs7_unpad(const uint8_t *data, size_t padded_len, size_t *unpadded_len);

/**
 * @brief Secure memory clear (prevents compiler optimization)
 *
 * @param ptr Pointer to memory
 * @param len Length to clear
 */
void aes_secure_memzero(void *ptr, size_t len);

/**
 * @brief Get error string
 *
 * @param error_code Error code
 * @return Error description string
 */
const char* aes_get_error_string(int error_code);

/* ============================================================================
 * Performance Benchmarking
 * ========================================================================== */

/**
 * @brief Benchmark AES encryption performance
 *
 * @param key_size Key size to test
 * @param mode Mode to test
 * @param iterations Number of iterations
 * @param data_size Size of data per iteration
 * @return Throughput in bytes per second
 */
uint32_t aes_benchmark(aes_key_size_t key_size, aes_mode_t mode,
                       uint32_t iterations, size_t data_size);

/* ============================================================================
 * Hardware Acceleration Functions
 * ========================================================================== */

#if AES_HW_ACCEL == AES_HW_ACCEL_STM32
/**
 * @brief Initialize STM32 CRYP peripheral
 *
 * @return AES_OK on success, error code otherwise
 */
int aes_hw_init_stm32(void);

/**
 * @brief Deinitialize STM32 CRYP peripheral
 */
void aes_hw_deinit_stm32(void);
#endif

#if AES_HW_ACCEL == AES_HW_ACCEL_ESP32
/**
 * @brief Initialize ESP32 AES accelerator
 *
 * @return AES_OK on success, error code otherwise
 */
int aes_hw_init_esp32(void);

/**
 * @brief Deinitialize ESP32 AES accelerator
 */
void aes_hw_deinit_esp32(void);
#endif

#ifdef __cplusplus
}
#endif

#endif /* AES_CRYPTO_H */
