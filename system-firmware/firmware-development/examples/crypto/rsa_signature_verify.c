/**
 * @file rsa_signature_verify.c
 * @brief RSA 簽名與驗證範例
 * @description 展示如何使用 RSA 算法進行韌體簽名和驗證
 */

#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

// ============================================================================
// RSA 配置
// ============================================================================

#define RSA_KEY_SIZE        2048
#define RSA_KEY_BYTES       (RSA_KEY_SIZE / 8)
#define SHA256_SIZE         32

// ============================================================================
// RSA 密鑰結構
// ============================================================================

typedef struct {
    uint32_t key_size;
    uint8_t modulus[RSA_KEY_BYTES];
    uint8_t public_exponent[4];     // 通常是 65537 (0x010001)
    uint8_t private_exponent[RSA_KEY_BYTES];  // 僅用於簽名
} rsa_key_t;

// ============================================================================
// SHA-256 實現 (簡化版)
// ============================================================================

void sha256_compute(const uint8_t *data, uint32_t length, uint8_t *hash) {
    printf("[SHA256] 計算哈希 (%u 字節)\n", length);
    // 實際應使用 mbedtls_sha256() 或硬體加速
    // 這裡用簡化模擬
    for (uint32_t i = 0; i < SHA256_SIZE; i++) {
        hash[i] = (uint8_t)((data[i % length] + i) & 0xFF);
    }
}

// ============================================================================
// RSA 操作 (簡化版，實際應使用 mbedtls)
// ============================================================================

void rsa_generate_keypair(rsa_key_t *key) {
    printf("[RSA] 生成 RSA-%u 密鑰對\n", RSA_KEY_SIZE);

    key->key_size = RSA_KEY_SIZE;

    // 生成模數 (n = p * q)
    memset(key->modulus, 0xAB, RSA_KEY_BYTES);

    // 公開指數 (e = 65537)
    key->public_exponent[0] = 0x01;
    key->public_exponent[1] = 0x00;
    key->public_exponent[2] = 0x01;
    key->public_exponent[3] = 0x00;

    // 私有指數 (d)
    memset(key->private_exponent, 0xCD, RSA_KEY_BYTES);

    printf("[RSA] 密鑰對生成完成\n");
}

bool rsa_sign(const rsa_key_t *private_key,
              const uint8_t *hash,
              uint32_t hash_len,
              uint8_t *signature) {
    printf("[RSA] 使用私鑰簽名數據\n");

    // 實際實現會使用 RSA-PSS 或 PKCS#1 v1.5
    // 這裡簡化模擬：signature = hash ^ d mod n

    // 添加填充 (PKCS#1 v1.5)
    memset(signature, 0xFF, RSA_KEY_BYTES);
    signature[0] = 0x00;
    signature[1] = 0x01;
    signature[RSA_KEY_BYTES - hash_len - 1] = 0x00;
    memcpy(&signature[RSA_KEY_BYTES - hash_len], hash, hash_len);

    printf("[RSA] 簽名完成 (%d 字節)\n", RSA_KEY_BYTES);
    return true;
}

bool rsa_verify(const rsa_key_t *public_key,
                const uint8_t *signature,
                const uint8_t *hash,
                uint32_t hash_len) {
    printf("[RSA] 使用公鑰驗證簽名\n");

    // 實際實現：recovered_hash = signature ^ e mod n
    uint8_t recovered_hash[SHA256_SIZE];

    // 從簽名中提取哈希 (移除填充)
    memcpy(recovered_hash,
           &signature[RSA_KEY_BYTES - hash_len],
           hash_len);

    // 比較哈希
    if (memcmp(recovered_hash, hash, hash_len) == 0) {
        printf("[RSA] ✅ 簽名驗證成功\n");
        return true;
    }

    printf("[RSA] ❌ 簽名驗證失敗\n");
    return false;
}

// ============================================================================
// 輔助函數
// ============================================================================

void print_hex(const char *label, const uint8_t *data, uint32_t len) {
    printf("%s: ", label);
    uint32_t print_len = (len > 32) ? 32 : len;
    for (uint32_t i = 0; i < print_len; i++) {
        printf("%02X", data[i]);
        if ((i + 1) % 16 == 0 && i < print_len - 1) {
            printf("\n%*s", (int)strlen(label) + 2, "");
        }
    }
    if (len > 32) {
        printf("... (%u 字節總共)", len);
    }
    printf("\n");
}

// ============================================================================
// 範例：韌體簽名
// ============================================================================

void example_firmware_signing(void) {
    printf("\n========== 韌體簽名範例 ==========\n\n");

    // 模擬韌體數據
    const char *firmware = "FIRMWARE_IMAGE_DATA_V1.0.0_FOR_PRODUCTION";
    uint32_t firmware_size = strlen(firmware);

    printf("韌體大小: %u 字節\n", firmware_size);
    printf("韌體內容: %s\n\n", firmware);

    // 生成密鑰對
    rsa_key_t keypair;
    rsa_generate_keypair(&keypair);

    // 計算韌體哈希
    uint8_t firmware_hash[SHA256_SIZE];
    sha256_compute((uint8_t *)firmware, firmware_size, firmware_hash);
    print_hex("韌體 SHA-256", firmware_hash, SHA256_SIZE);

    // 使用私鑰簽名
    uint8_t signature[RSA_KEY_BYTES];
    rsa_sign(&keypair, firmware_hash, SHA256_SIZE, signature);
    print_hex("RSA 簽名", signature, RSA_KEY_BYTES);

    // 使用公鑰驗證
    printf("\n");
    bool verified = rsa_verify(&keypair, signature, firmware_hash, SHA256_SIZE);

    if (verified) {
        printf("\n✅ 韌體簽名和驗證成功！\n");
    } else {
        printf("\n❌ 韌體簽名驗證失敗！\n");
    }
}

// ============================================================================
// 範例：篡改檢測
// ============================================================================

void example_tampering_detection(void) {
    printf("\n========== 篡改檢測範例 ==========\n\n");

    const char *original_firmware = "ORIGINAL_FIRMWARE_DATA";
    const char *tampered_firmware = "TAMPERED_FIRMWARE_DATA";  // 被篡改

    rsa_key_t keypair;
    rsa_generate_keypair(&keypair);

    // 對原始韌體簽名
    uint8_t original_hash[SHA256_SIZE];
    sha256_compute((uint8_t *)original_firmware,
                   strlen(original_firmware),
                   original_hash);

    uint8_t signature[RSA_KEY_BYTES];
    rsa_sign(&keypair, original_hash, SHA256_SIZE, signature);

    printf("原始韌體已簽名\n\n");

    // 驗證原始韌體
    printf("--- 驗證原始韌體 ---\n");
    bool verified = rsa_verify(&keypair, signature, original_hash, SHA256_SIZE);

    // 嘗試驗證被篡改的韌體
    printf("\n--- 驗證被篡改的韌體 ---\n");
    uint8_t tampered_hash[SHA256_SIZE];
    sha256_compute((uint8_t *)tampered_firmware,
                   strlen(tampered_firmware),
                   tampered_hash);

    bool tampered_verified = rsa_verify(&keypair, signature,
                                       tampered_hash, SHA256_SIZE);

    if (!tampered_verified) {
        printf("\n✅ 成功檢測到韌體篡改！\n");
    }
}

// ============================================================================
// 範例：密鑰管理
// ============================================================================

typedef struct {
    uint32_t magic;
    uint32_t version;
    rsa_key_t public_key;
    uint32_t crc32;
} public_key_storage_t;

void example_key_management(void) {
    printf("\n========== 密鑰管理範例 ==========\n\n");

    // 生成密鑰對
    rsa_key_t keypair;
    rsa_generate_keypair(&keypair);

    // 準備公鑰存儲結構
    public_key_storage_t pub_key_storage;
    pub_key_storage.magic = 0x50554B59;  // "PUKY"
    pub_key_storage.version = 1;
    memcpy(&pub_key_storage.public_key, &keypair, sizeof(rsa_key_t));

    // 計算 CRC
    pub_key_storage.crc32 = 0;
    // pub_key_storage.crc32 = crc32_calculate(...);

    printf("公鑰存儲結構準備完成\n");
    printf("  Magic: 0x%08X\n", pub_key_storage.magic);
    printf("  Version: %u\n", pub_key_storage.version);
    printf("  Key Size: %u bits\n", pub_key_storage.public_key.key_size);

    // 實際應用中會將公鑰燒錄到 Flash
    printf("\n將公鑰寫入 Flash @ 0x08010000\n");
    // flash_write(0x08010000, &pub_key_storage, sizeof(pub_key_storage));

    printf("\n✅ 公鑰已安全存儲\n");
}

// ============================================================================
// 範例：證書鏈驗證
// ============================================================================

typedef struct {
    char issuer[64];
    char subject[64];
    uint32_t not_before;
    uint32_t not_after;
    rsa_key_t public_key;
    uint8_t signature[RSA_KEY_BYTES];
} certificate_t;

void example_certificate_chain(void) {
    printf("\n========== 證書鏈驗證範例 ==========\n\n");

    // 根 CA 證書
    certificate_t root_ca;
    strcpy(root_ca.issuer, "Root CA");
    strcpy(root_ca.subject, "Root CA");
    root_ca.not_before = 1700000000;
    root_ca.not_after = 1800000000;
    rsa_generate_keypair(&root_ca.public_key);

    printf("根 CA:\n");
    printf("  Issuer: %s\n", root_ca.issuer);
    printf("  Subject: %s\n", root_ca.subject);

    // 中間 CA 證書
    certificate_t intermediate_ca;
    strcpy(intermediate_ca.issuer, "Root CA");
    strcpy(intermediate_ca.subject, "Intermediate CA");
    intermediate_ca.not_before = 1700000000;
    intermediate_ca.not_after = 1750000000;
    rsa_generate_keypair(&intermediate_ca.public_key);

    printf("\n中間 CA:\n");
    printf("  Issuer: %s\n", intermediate_ca.issuer);
    printf("  Subject: %s\n", intermediate_ca.subject);

    // 終端實體證書
    certificate_t end_entity;
    strcpy(end_entity.issuer, "Intermediate CA");
    strcpy(end_entity.subject, "Device Certificate");
    end_entity.not_before = 1700000000;
    end_entity.not_after = 1720000000;
    rsa_generate_keypair(&end_entity.public_key);

    printf("\n終端實體:\n");
    printf("  Issuer: %s\n", end_entity.issuer);
    printf("  Subject: %s\n", end_entity.subject);

    printf("\n✅ 證書鏈建立完成\n");
    printf("  Root CA → Intermediate CA → End Entity\n");
}

// ============================================================================
// 主程式
// ============================================================================

int main(void) {
    printf("\n");
    printf("========================================\n");
    printf("  RSA 簽名與驗證範例\n");
    printf("  RSA-%d 位\n", RSA_KEY_SIZE);
    printf("========================================\n");

    // 運行範例
    example_firmware_signing();
    example_tampering_detection();
    example_key_management();
    example_certificate_chain();

    printf("\n========================================\n");
    printf("  所有範例完成！\n");
    printf("========================================\n\n");

    return 0;
}
