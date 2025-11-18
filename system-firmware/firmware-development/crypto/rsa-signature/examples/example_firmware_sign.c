/**
 * @file example_firmware_sign.c
 * @brief Firmware Signature Example
 * @version 1.0
 * @date 2025-11-18
 */

#include "../rsa_crypto.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/**
 * Example: Sign and verify firmware using RSA-2048
 */
int main(void)
{
    printf("========================================\n");
    printf("Firmware Signature Example\n");
    printf("========================================\n\n");

    // Step 1: Generate RSA key pair
    printf("Step 1: Generating RSA-2048 key pair...\n");
    rsa_public_key_t pub_key;
    rsa_private_key_t priv_key;

    int ret = rsa_generate_keypair(&pub_key, &priv_key, RSA_KEY_2048, 65537);
    if (ret != RSA_OK) {
        printf("Error: Failed to generate key pair: %s\n",
               rsa_get_error_string(ret));
        return 1;
    }

    printf("Key pair generated successfully\n");
    printf("  Key size: %d bits\n", pub_key.key_size);
    printf("  Signature size: %zu bytes\n\n",
           rsa_get_signature_length(pub_key.key_size));

    // Step 2: Simulate firmware data
    printf("Step 2: Loading firmware data...\n");
    size_t firmware_size = 65536; // 64 KB firmware
    uint8_t *firmware = malloc(firmware_size);
    if (!firmware) {
        printf("Error: Failed to allocate memory\n");
        rsa_free_public_key(&pub_key);
        rsa_free_private_key(&priv_key);
        return 1;
    }

    // Fill with dummy data
    for (size_t i = 0; i < firmware_size; i++) {
        firmware[i] = (uint8_t)(i & 0xFF);
    }

    printf("Firmware loaded: %zu bytes\n\n", firmware_size);

    // Step 3: Compute firmware hash
    printf("Step 3: Computing firmware hash (SHA-256)...\n");
    uint8_t hash[32];
    size_t hash_len;

    ret = rsa_compute_hash(RSA_HASH_SHA256, firmware, firmware_size,
                          hash, &hash_len);
    if (ret != RSA_OK) {
        printf("Error: Failed to compute hash: %s\n",
               rsa_get_error_string(ret));
        free(firmware);
        rsa_free_public_key(&pub_key);
        rsa_free_private_key(&priv_key);
        return 1;
    }

    printf("Hash computed: ");
    for (size_t i = 0; i < hash_len; i++) {
        printf("%02x", hash[i]);
    }
    printf("\n\n");

    // Step 4: Sign firmware with private key
    printf("Step 4: Signing firmware with RSA private key...\n");
    uint8_t signature[512];
    size_t sig_len;

    ret = rsa_sign_pkcs1v15(&priv_key, RSA_HASH_SHA256,
                           hash, hash_len, signature, &sig_len);
    if (ret != RSA_OK) {
        printf("Error: Failed to sign firmware: %s\n",
               rsa_get_error_string(ret));
        free(firmware);
        rsa_free_public_key(&pub_key);
        rsa_free_private_key(&priv_key);
        return 1;
    }

    printf("Firmware signed successfully\n");
    printf("  Signature length: %zu bytes\n", sig_len);
    printf("  Signature (first 32 bytes): ");
    for (size_t i = 0; i < 32 && i < sig_len; i++) {
        printf("%02x", signature[i]);
    }
    printf("...\n\n");

    // Step 5: Verify firmware signature with public key
    printf("Step 5: Verifying firmware signature...\n");

    ret = rsa_verify_pkcs1v15(&pub_key, RSA_HASH_SHA256,
                             hash, hash_len, signature, sig_len);
    if (ret == RSA_OK) {
        printf("Signature verification: SUCCESS\n");
        printf("  Firmware is authentic and untampered\n\n");
    } else {
        printf("Signature verification: FAILED\n");
        printf("  Error: %s\n\n", rsa_get_error_string(ret));
    }

    // Step 6: Test tampering detection
    printf("Step 6: Testing tampering detection...\n");
    printf("  Modifying firmware byte at offset 1000...\n");

    firmware[1000] ^= 0xFF; // Tamper with firmware

    // Recompute hash
    rsa_compute_hash(RSA_HASH_SHA256, firmware, firmware_size,
                    hash, &hash_len);

    // Try to verify with tampered firmware
    ret = rsa_verify_pkcs1v15(&pub_key, RSA_HASH_SHA256,
                             hash, hash_len, signature, sig_len);
    if (ret == RSA_ERR_VERIFICATION_FAILED) {
        printf("  Tampering detected successfully!\n");
        printf("  Signature verification correctly failed\n\n");
    } else {
        printf("  Warning: Tampering not detected!\n\n");
    }

    // Step 7: Show typical use case flow
    printf("========================================\n");
    printf("Typical Firmware Update Flow:\n");
    printf("========================================\n");
    printf("1. Developer signs firmware with private key\n");
    printf("2. Firmware + signature distributed to devices\n");
    printf("3. Device verifies signature with public key\n");
    printf("4. If valid, device installs firmware\n");
    printf("5. If invalid, device rejects firmware\n");
    printf("========================================\n\n");

    // Cleanup
    free(firmware);
    rsa_free_public_key(&pub_key);
    rsa_free_private_key(&priv_key);

    printf("Example completed successfully!\n\n");
    return 0;
}
