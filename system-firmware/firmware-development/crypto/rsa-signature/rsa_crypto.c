/**
 * @file rsa_crypto.c
 * @brief RSA Digital Signature Implementation
 * @version 1.0
 * @date 2025-11-18
 */

#include "rsa_crypto.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
#include "mbedtls/rsa.h"
#include "mbedtls/pk.h"
#include "mbedtls/sha256.h"
#include "mbedtls/sha512.h"
#include "mbedtls/entropy.h"
#include "mbedtls/ctr_drbg.h"
#elif RSA_HW_ACCEL == RSA_HW_ACCEL_STM32
#include "stm32_crypto.h"
#elif RSA_HW_ACCEL == RSA_HW_ACCEL_ESP32
#include "esp_rsa.h"
#endif

/* ============================================================================
 * Private Helper Functions
 * ========================================================================== */

/**
 * @brief Validate public key
 */
static int validate_public_key(const rsa_public_key_t *key)
{
    if (!key) {
        return RSA_ERR_INVALID_PARAM;
    }
    if (!key->initialized) {
        return RSA_ERR_NOT_INITIALIZED;
    }
    return RSA_OK;
}

/**
 * @brief Validate private key
 */
static int validate_private_key(const rsa_private_key_t *key)
{
    if (!key) {
        return RSA_ERR_INVALID_PARAM;
    }
    if (!key->initialized) {
        return RSA_ERR_NOT_INITIALIZED;
    }
    return RSA_OK;
}

/**
 * @brief Get mbedTLS hash ID
 */
#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
static mbedtls_md_type_t get_mbedtls_hash_id(rsa_hash_t hash_alg)
{
    switch (hash_alg) {
        case RSA_HASH_SHA256:
            return MBEDTLS_MD_SHA256;
        case RSA_HASH_SHA384:
            return MBEDTLS_MD_SHA384;
        case RSA_HASH_SHA512:
            return MBEDTLS_MD_SHA512;
        default:
            return MBEDTLS_MD_NONE;
    }
}
#endif

/* ============================================================================
 * Key Management Implementation
 * ========================================================================== */

int rsa_generate_keypair(rsa_public_key_t *public_key,
                         rsa_private_key_t *private_key,
                         rsa_key_size_t key_size,
                         uint32_t exponent)
{
    if (!public_key || !private_key) {
        return RSA_ERR_INVALID_PARAM;
    }

    if (key_size != RSA_KEY_2048 && key_size != RSA_KEY_4096) {
        return RSA_ERR_INVALID_KEY;
    }

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
    mbedtls_rsa_context *rsa = malloc(sizeof(mbedtls_rsa_context));
    if (!rsa) {
        return RSA_ERR_MEMORY_ALLOCATION;
    }

    mbedtls_entropy_context entropy;
    mbedtls_ctr_drbg_context ctr_drbg;

    mbedtls_rsa_init(rsa, MBEDTLS_RSA_PKCS_V15, 0);
    mbedtls_entropy_init(&entropy);
    mbedtls_ctr_drbg_init(&ctr_drbg);

    const char *pers = "rsa_keygen";
    int ret = mbedtls_ctr_drbg_seed(&ctr_drbg, mbedtls_entropy_func, &entropy,
                                     (const unsigned char *)pers, strlen(pers));
    if (ret != 0) {
        mbedtls_rsa_free(rsa);
        free(rsa);
        return RSA_ERR_KEY_GENERATION;
    }

    // Generate key pair
    ret = mbedtls_rsa_gen_key(rsa, mbedtls_ctr_drbg_random, &ctr_drbg,
                              key_size, exponent);
    if (ret != 0) {
        mbedtls_rsa_free(rsa);
        free(rsa);
        return RSA_ERR_KEY_GENERATION;
    }

    // Extract public key parameters
    public_key->key_size = key_size;
    public_key->n_len = mbedtls_rsa_get_len(rsa);
    public_key->e_len = 4; // Typical size for exponent 65537

    mbedtls_mpi_write_binary(&rsa->N, public_key->n, public_key->n_len);
    mbedtls_mpi_write_binary(&rsa->E, public_key->e, public_key->e_len);

    // Extract private key parameters
    private_key->key_size = key_size;
    private_key->n_len = public_key->n_len;
    private_key->e_len = public_key->e_len;
    private_key->d_len = mbedtls_rsa_get_len(rsa);
    private_key->p_len = mbedtls_rsa_get_len(rsa) / 2;
    private_key->q_len = mbedtls_rsa_get_len(rsa) / 2;

    memcpy(private_key->n, public_key->n, public_key->n_len);
    memcpy(private_key->e, public_key->e, public_key->e_len);
    mbedtls_mpi_write_binary(&rsa->D, private_key->d, private_key->d_len);
    mbedtls_mpi_write_binary(&rsa->P, private_key->p, private_key->p_len);
    mbedtls_mpi_write_binary(&rsa->Q, private_key->q, private_key->q_len);

    public_key->mbedtls_ctx = rsa;
    private_key->mbedtls_ctx = rsa;
    public_key->initialized = true;
    private_key->initialized = true;

    mbedtls_entropy_free(&entropy);
    mbedtls_ctr_drbg_free(&ctr_drbg);

    return RSA_OK;
#else
    return RSA_ERR_HW_FAILURE;
#endif
}

int rsa_load_public_key_pem(rsa_public_key_t *key,
                            const char *pem_data,
                            size_t pem_len)
{
    if (!key || !pem_data) {
        return RSA_ERR_INVALID_PARAM;
    }

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
    mbedtls_pk_context pk;
    mbedtls_pk_init(&pk);

    int ret = mbedtls_pk_parse_public_key(&pk, (const unsigned char *)pem_data, pem_len);
    if (ret != 0) {
        mbedtls_pk_free(&pk);
        return RSA_ERR_PEM_PARSE;
    }

    if (mbedtls_pk_get_type(&pk) != MBEDTLS_PK_RSA) {
        mbedtls_pk_free(&pk);
        return RSA_ERR_INVALID_KEY;
    }

    mbedtls_rsa_context *rsa = mbedtls_pk_rsa(pk);

    // Extract key parameters
    key->key_size = mbedtls_rsa_get_bitlen(rsa);
    key->n_len = mbedtls_rsa_get_len(rsa);
    key->e_len = 4;

    mbedtls_mpi_write_binary(&rsa->N, key->n, key->n_len);
    mbedtls_mpi_write_binary(&rsa->E, key->e, key->e_len);

    // Allocate and copy mbedTLS context
    mbedtls_rsa_context *rsa_copy = malloc(sizeof(mbedtls_rsa_context));
    if (!rsa_copy) {
        mbedtls_pk_free(&pk);
        return RSA_ERR_MEMORY_ALLOCATION;
    }

    mbedtls_rsa_init(rsa_copy, MBEDTLS_RSA_PKCS_V15, 0);
    mbedtls_rsa_copy(rsa_copy, rsa);

    key->mbedtls_ctx = rsa_copy;
    key->initialized = true;

    mbedtls_pk_free(&pk);
    return RSA_OK;
#else
    return RSA_ERR_HW_FAILURE;
#endif
}

int rsa_load_private_key_pem(rsa_private_key_t *key,
                             const char *pem_data,
                             size_t pem_len,
                             const char *password)
{
    if (!key || !pem_data) {
        return RSA_ERR_INVALID_PARAM;
    }

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
    mbedtls_pk_context pk;
    mbedtls_pk_init(&pk);

    int ret = mbedtls_pk_parse_key(&pk, (const unsigned char *)pem_data, pem_len,
                                    (const unsigned char *)password,
                                    password ? strlen(password) : 0);
    if (ret != 0) {
        mbedtls_pk_free(&pk);
        return RSA_ERR_PEM_PARSE;
    }

    if (mbedtls_pk_get_type(&pk) != MBEDTLS_PK_RSA) {
        mbedtls_pk_free(&pk);
        return RSA_ERR_INVALID_KEY;
    }

    mbedtls_rsa_context *rsa = mbedtls_pk_rsa(pk);

    // Extract key parameters
    key->key_size = mbedtls_rsa_get_bitlen(rsa);
    key->n_len = mbedtls_rsa_get_len(rsa);
    key->e_len = 4;
    key->d_len = mbedtls_rsa_get_len(rsa);
    key->p_len = mbedtls_rsa_get_len(rsa) / 2;
    key->q_len = mbedtls_rsa_get_len(rsa) / 2;

    mbedtls_mpi_write_binary(&rsa->N, key->n, key->n_len);
    mbedtls_mpi_write_binary(&rsa->E, key->e, key->e_len);
    mbedtls_mpi_write_binary(&rsa->D, key->d, key->d_len);
    mbedtls_mpi_write_binary(&rsa->P, key->p, key->p_len);
    mbedtls_mpi_write_binary(&rsa->Q, key->q, key->q_len);

    // Allocate and copy mbedTLS context
    mbedtls_rsa_context *rsa_copy = malloc(sizeof(mbedtls_rsa_context));
    if (!rsa_copy) {
        mbedtls_pk_free(&pk);
        return RSA_ERR_MEMORY_ALLOCATION;
    }

    mbedtls_rsa_init(rsa_copy, MBEDTLS_RSA_PKCS_V15, 0);
    mbedtls_rsa_copy(rsa_copy, rsa);

    key->mbedtls_ctx = rsa_copy;
    key->initialized = true;

    mbedtls_pk_free(&pk);
    return RSA_OK;
#else
    return RSA_ERR_HW_FAILURE;
#endif
}

void rsa_free_public_key(rsa_public_key_t *key)
{
    if (!key) {
        return;
    }

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
    if (key->mbedtls_ctx) {
        mbedtls_rsa_free((mbedtls_rsa_context *)key->mbedtls_ctx);
        free(key->mbedtls_ctx);
        key->mbedtls_ctx = NULL;
    }
#endif

    rsa_secure_memzero(key, sizeof(rsa_public_key_t));
}

void rsa_free_private_key(rsa_private_key_t *key)
{
    if (!key) {
        return;
    }

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
    if (key->mbedtls_ctx) {
        mbedtls_rsa_free((mbedtls_rsa_context *)key->mbedtls_ctx);
        free(key->mbedtls_ctx);
        key->mbedtls_ctx = NULL;
    }
#endif

    rsa_secure_memzero(key, sizeof(rsa_private_key_t));
}

/* ============================================================================
 * Signature Functions Implementation
 * ========================================================================== */

int rsa_sign_pkcs1v15(const rsa_private_key_t *key,
                      rsa_hash_t hash_alg,
                      const uint8_t *hash,
                      size_t hash_len,
                      uint8_t *signature,
                      size_t *sig_len)
{
    int ret = validate_private_key(key);
    if (ret != RSA_OK) {
        return ret;
    }

    if (!hash || !signature || !sig_len) {
        return RSA_ERR_INVALID_PARAM;
    }

    // Validate hash length
    size_t expected_hash_len = rsa_get_hash_length(hash_alg);
    if (hash_len != expected_hash_len) {
        return RSA_ERR_INVALID_PARAM;
    }

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
    mbedtls_rsa_context *rsa = (mbedtls_rsa_context *)key->mbedtls_ctx;
    mbedtls_md_type_t md_alg = get_mbedtls_hash_id(hash_alg);

    ret = mbedtls_rsa_pkcs1_sign(rsa, NULL, NULL, MBEDTLS_RSA_PRIVATE,
                                 md_alg, hash_len, hash, signature);
    if (ret != 0) {
        return RSA_ERR_INVALID_SIGNATURE;
    }

    *sig_len = mbedtls_rsa_get_len(rsa);
    return RSA_OK;
#else
    return RSA_ERR_HW_FAILURE;
#endif
}

int rsa_sign_pss(const rsa_private_key_t *key,
                 rsa_hash_t hash_alg,
                 const uint8_t *hash,
                 size_t hash_len,
                 uint8_t *signature,
                 size_t *sig_len,
                 size_t salt_len)
{
    int ret = validate_private_key(key);
    if (ret != RSA_OK) {
        return ret;
    }

    if (!hash || !signature || !sig_len) {
        return RSA_ERR_INVALID_PARAM;
    }

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
    mbedtls_rsa_context *rsa = (mbedtls_rsa_context *)key->mbedtls_ctx;
    mbedtls_md_type_t md_alg = get_mbedtls_hash_id(hash_alg);

    // Set PSS mode
    mbedtls_rsa_set_padding(rsa, MBEDTLS_RSA_PKCS_V21, md_alg);

    // Setup RNG for PSS
    mbedtls_entropy_context entropy;
    mbedtls_ctr_drbg_context ctr_drbg;
    mbedtls_entropy_init(&entropy);
    mbedtls_ctr_drbg_init(&ctr_drbg);

    const char *pers = "rsa_sign_pss";
    ret = mbedtls_ctr_drbg_seed(&ctr_drbg, mbedtls_entropy_func, &entropy,
                                (const unsigned char *)pers, strlen(pers));
    if (ret != 0) {
        return RSA_ERR_HW_FAILURE;
    }

    ret = mbedtls_rsa_rsassa_pss_sign(rsa, mbedtls_ctr_drbg_random, &ctr_drbg,
                                       MBEDTLS_RSA_PRIVATE, md_alg, hash_len,
                                       hash, signature);

    mbedtls_entropy_free(&entropy);
    mbedtls_ctr_drbg_free(&ctr_drbg);

    if (ret != 0) {
        return RSA_ERR_INVALID_SIGNATURE;
    }

    *sig_len = mbedtls_rsa_get_len(rsa);
    return RSA_OK;
#else
    return RSA_ERR_HW_FAILURE;
#endif
}

int rsa_verify_pkcs1v15(const rsa_public_key_t *key,
                        rsa_hash_t hash_alg,
                        const uint8_t *hash,
                        size_t hash_len,
                        const uint8_t *signature,
                        size_t sig_len)
{
    int ret = validate_public_key(key);
    if (ret != RSA_OK) {
        return ret;
    }

    if (!hash || !signature) {
        return RSA_ERR_INVALID_PARAM;
    }

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
    mbedtls_rsa_context *rsa = (mbedtls_rsa_context *)key->mbedtls_ctx;
    mbedtls_md_type_t md_alg = get_mbedtls_hash_id(hash_alg);

    ret = mbedtls_rsa_pkcs1_verify(rsa, NULL, NULL, MBEDTLS_RSA_PUBLIC,
                                   md_alg, hash_len, hash, signature);
    if (ret != 0) {
        return RSA_ERR_VERIFICATION_FAILED;
    }

    return RSA_OK;
#else
    return RSA_ERR_HW_FAILURE;
#endif
}

int rsa_verify_pss(const rsa_public_key_t *key,
                   rsa_hash_t hash_alg,
                   const uint8_t *hash,
                   size_t hash_len,
                   const uint8_t *signature,
                   size_t sig_len,
                   size_t salt_len)
{
    int ret = validate_public_key(key);
    if (ret != RSA_OK) {
        return ret;
    }

    if (!hash || !signature) {
        return RSA_ERR_INVALID_PARAM;
    }

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
    mbedtls_rsa_context *rsa = (mbedtls_rsa_context *)key->mbedtls_ctx);
    mbedtls_md_type_t md_alg = get_mbedtls_hash_id(hash_alg);

    // Set PSS mode
    mbedtls_rsa_set_padding(rsa, MBEDTLS_RSA_PKCS_V21, md_alg);

    ret = mbedtls_rsa_rsassa_pss_verify(rsa, NULL, NULL, MBEDTLS_RSA_PUBLIC,
                                         md_alg, hash_len, hash, signature);
    if (ret != 0) {
        return RSA_ERR_VERIFICATION_FAILED;
    }

    return RSA_OK;
#else
    return RSA_ERR_HW_FAILURE;
#endif
}

/* ============================================================================
 * Utility Functions Implementation
 * ========================================================================== */

int rsa_compute_hash(rsa_hash_t hash_alg,
                     const uint8_t *data,
                     size_t data_len,
                     uint8_t *hash,
                     size_t *hash_len)
{
    if (!data || !hash || !hash_len) {
        return RSA_ERR_INVALID_PARAM;
    }

#if RSA_HW_ACCEL == RSA_HW_ACCEL_MBEDTLS
    int ret;
    switch (hash_alg) {
        case RSA_HASH_SHA256:
            ret = mbedtls_sha256_ret(data, data_len, hash, 0);
            *hash_len = 32;
            break;
        case RSA_HASH_SHA384:
            ret = mbedtls_sha512_ret(data, data_len, hash, 1);
            *hash_len = 48;
            break;
        case RSA_HASH_SHA512:
            ret = mbedtls_sha512_ret(data, data_len, hash, 0);
            *hash_len = 64;
            break;
        default:
            return RSA_ERR_INVALID_PARAM;
    }

    return (ret == 0) ? RSA_OK : RSA_ERR_HW_FAILURE;
#else
    return RSA_ERR_HW_FAILURE;
#endif
}

size_t rsa_get_hash_length(rsa_hash_t hash_alg)
{
    switch (hash_alg) {
        case RSA_HASH_SHA256:
            return 32;
        case RSA_HASH_SHA384:
            return 48;
        case RSA_HASH_SHA512:
            return 64;
        default:
            return 0;
    }
}

size_t rsa_get_signature_length(rsa_key_size_t key_size)
{
    return key_size / 8;
}

void rsa_secure_memzero(void *ptr, size_t len)
{
    if (!ptr || len == 0) {
        return;
    }

    volatile uint8_t *p = (volatile uint8_t *)ptr;
    while (len--) {
        *p++ = 0;
    }
}

const char* rsa_get_error_string(int error_code)
{
    switch (error_code) {
        case RSA_OK:
            return "Success";
        case RSA_ERR_INVALID_PARAM:
            return "Invalid parameter";
        case RSA_ERR_INVALID_KEY:
            return "Invalid key";
        case RSA_ERR_INVALID_SIGNATURE:
            return "Invalid signature";
        case RSA_ERR_BUFFER_TOO_SMALL:
            return "Buffer too small";
        case RSA_ERR_NOT_INITIALIZED:
            return "Not initialized";
        case RSA_ERR_HW_FAILURE:
            return "Hardware failure";
        case RSA_ERR_VERIFICATION_FAILED:
            return "Verification failed";
        case RSA_ERR_MEMORY_ALLOCATION:
            return "Memory allocation failed";
        case RSA_ERR_KEY_GENERATION:
            return "Key generation failed";
        case RSA_ERR_PEM_PARSE:
            return "PEM parse error";
        default:
            return "Unknown error";
    }
}

rsa_key_size_t rsa_get_key_size(const rsa_public_key_t *key)
{
    if (!key || !key->initialized) {
        return 0;
    }
    return key->key_size;
}

/* ============================================================================
 * Performance Benchmarking
 * ========================================================================== */

uint32_t rsa_benchmark_sign(rsa_key_size_t key_size,
                            rsa_padding_t padding,
                            rsa_hash_t hash_alg,
                            uint32_t iterations)
{
    rsa_public_key_t pub_key;
    rsa_private_key_t priv_key;
    uint8_t hash[64];
    uint8_t signature[RSA_MAX_SIGNATURE_SIZE];
    size_t sig_len;

    // Generate key pair
    if (rsa_generate_keypair(&pub_key, &priv_key, key_size, 65537) != RSA_OK) {
        return 0;
    }

    // Prepare hash
    size_t hash_len = rsa_get_hash_length(hash_alg);
    memset(hash, 0xAA, hash_len);

    // Measure signing time
    uint32_t start_time = 0; // Get system tick
    for (uint32_t i = 0; i < iterations; i++) {
        if (padding == RSA_PADDING_PKCS1_V15) {
            rsa_sign_pkcs1v15(&priv_key, hash_alg, hash, hash_len, signature, &sig_len);
        } else {
            rsa_sign_pss(&priv_key, hash_alg, hash, hash_len, signature, &sig_len, 0);
        }
    }
    uint32_t end_time = 0; // Get system tick

    uint32_t elapsed_ms = end_time - start_time;
    uint32_t ops_per_sec = (elapsed_ms > 0) ? (iterations * 1000 / elapsed_ms) : 0;

    // Cleanup
    rsa_free_public_key(&pub_key);
    rsa_free_private_key(&priv_key);

    return ops_per_sec;
}

uint32_t rsa_benchmark_verify(rsa_key_size_t key_size,
                              rsa_padding_t padding,
                              rsa_hash_t hash_alg,
                              uint32_t iterations)
{
    rsa_public_key_t pub_key;
    rsa_private_key_t priv_key;
    uint8_t hash[64];
    uint8_t signature[RSA_MAX_SIGNATURE_SIZE];
    size_t sig_len;

    // Generate key pair
    if (rsa_generate_keypair(&pub_key, &priv_key, key_size, 65537) != RSA_OK) {
        return 0;
    }

    // Prepare hash and signature
    size_t hash_len = rsa_get_hash_length(hash_alg);
    memset(hash, 0xAA, hash_len);

    if (padding == RSA_PADDING_PKCS1_V15) {
        rsa_sign_pkcs1v15(&priv_key, hash_alg, hash, hash_len, signature, &sig_len);
    } else {
        rsa_sign_pss(&priv_key, hash_alg, hash, hash_len, signature, &sig_len, 0);
    }

    // Measure verification time
    uint32_t start_time = 0; // Get system tick
    for (uint32_t i = 0; i < iterations; i++) {
        if (padding == RSA_PADDING_PKCS1_V15) {
            rsa_verify_pkcs1v15(&pub_key, hash_alg, hash, hash_len, signature, sig_len);
        } else {
            rsa_verify_pss(&pub_key, hash_alg, hash, hash_len, signature, sig_len, 0);
        }
    }
    uint32_t end_time = 0; // Get system tick

    uint32_t elapsed_ms = end_time - start_time;
    uint32_t ops_per_sec = (elapsed_ms > 0) ? (iterations * 1000 / elapsed_ms) : 0;

    // Cleanup
    rsa_free_public_key(&pub_key);
    rsa_free_private_key(&priv_key);

    return ops_per_sec;
}
