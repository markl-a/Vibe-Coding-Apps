/**
 * @file example_pss.c
 * @brief RSA-PSS Signature Example
 * @version 1.0
 * @date 2025-11-18
 */

#include "../rsa_crypto.h"
#include <stdio.h>
#include <string.h>

/**
 * Example: Sign and verify using RSA-PSS padding scheme
 */
int main(void)
{
    printf("========================================\n");
    printf("RSA-PSS Signature Example\n");
    printf("========================================\n\n");

    printf("PSS (Probabilistic Signature Scheme) provides:\n");
    printf("  - Better security than PKCS#1 v1.5\n");
    printf("  - Provable security guarantees\n");
    printf("  - Randomized padding (different signatures each time)\n\n");

    // Generate RSA key pair
    printf("Generating RSA-2048 key pair...\n");
    rsa_public_key_t pub_key;
    rsa_private_key_t priv_key;

    int ret = rsa_generate_keypair(&pub_key, &priv_key, RSA_KEY_2048, 65537);
    if (ret != RSA_OK) {
        printf("Error: %s\n", rsa_get_error_string(ret));
        return 1;
    }
    printf("Key pair generated\n\n");

    // Message to sign
    const char *message = "Important message requiring secure signature";
    printf("Message: %s\n\n", message);

    // Compute hash
    printf("Computing SHA-256 hash...\n");
    uint8_t hash[32];
    size_t hash_len;

    ret = rsa_compute_hash(RSA_HASH_SHA256,
                          (const uint8_t *)message, strlen(message),
                          hash, &hash_len);
    if (ret != RSA_OK) {
        printf("Error: %s\n", rsa_get_error_string(ret));
        rsa_free_public_key(&pub_key);
        rsa_free_private_key(&priv_key);
        return 1;
    }

    printf("Hash (hex): ");
    for (size_t i = 0; i < hash_len; i++) {
        printf("%02x", hash[i]);
    }
    printf("\n\n");

    // Sign with PSS - First signature
    printf("Signing with RSA-PSS (first time)...\n");
    uint8_t signature1[512];
    size_t sig_len1;

    ret = rsa_sign_pss(&priv_key, RSA_HASH_SHA256,
                      hash, hash_len, signature1, &sig_len1, 0);
    if (ret != RSA_OK) {
        printf("Error: %s\n", rsa_get_error_string(ret));
        rsa_free_public_key(&pub_key);
        rsa_free_private_key(&priv_key);
        return 1;
    }

    printf("Signature 1 (first 32 bytes): ");
    for (size_t i = 0; i < 32; i++) {
        printf("%02x", signature1[i]);
    }
    printf("...\n\n");

    // Sign with PSS - Second signature (will be different due to randomization)
    printf("Signing with RSA-PSS (second time)...\n");
    uint8_t signature2[512];
    size_t sig_len2;

    ret = rsa_sign_pss(&priv_key, RSA_HASH_SHA256,
                      hash, hash_len, signature2, &sig_len2, 0);
    if (ret != RSA_OK) {
        printf("Error: %s\n", rsa_get_error_string(ret));
        rsa_free_public_key(&pub_key);
        rsa_free_private_key(&priv_key);
        return 1;
    }

    printf("Signature 2 (first 32 bytes): ");
    for (size_t i = 0; i < 32; i++) {
        printf("%02x", signature2[i]);
    }
    printf("...\n\n");

    // Show that signatures are different
    bool same = (memcmp(signature1, signature2, sig_len1) == 0);
    printf("Signatures are %s (due to randomization)\n\n",
           same ? "SAME" : "DIFFERENT");

    // Verify both signatures
    printf("Verifying first signature...\n");
    ret = rsa_verify_pss(&pub_key, RSA_HASH_SHA256,
                        hash, hash_len, signature1, sig_len1, 0);
    if (ret == RSA_OK) {
        printf("  Verification: SUCCESS\n\n");
    } else {
        printf("  Verification: FAILED (%s)\n\n",
               rsa_get_error_string(ret));
    }

    printf("Verifying second signature...\n");
    ret = rsa_verify_pss(&pub_key, RSA_HASH_SHA256,
                        hash, hash_len, signature2, sig_len2, 0);
    if (ret == RSA_OK) {
        printf("  Verification: SUCCESS\n\n");
    } else {
        printf("  Verification: FAILED (%s)\n\n",
               rsa_get_error_string(ret));
    }

    // Compare with PKCS#1 v1.5
    printf("========================================\n");
    printf("Comparison: PSS vs PKCS#1 v1.5\n");
    printf("========================================\n");
    printf("PSS:\n");
    printf("  + Better security (provable)\n");
    printf("  + Randomized (different signatures)\n");
    printf("  - Slightly more complex\n");
    printf("  - Requires RNG\n\n");

    printf("PKCS#1 v1.5:\n");
    printf("  + Widely supported\n");
    printf("  + Deterministic (same signature)\n");
    printf("  + Simple implementation\n");
    printf("  - Weaker security proof\n\n");

    printf("Recommendation: Use PSS for new applications\n");
    printf("========================================\n\n");

    // Cleanup
    rsa_free_public_key(&pub_key);
    rsa_free_private_key(&priv_key);

    printf("Example completed successfully!\n\n");
    return 0;
}
