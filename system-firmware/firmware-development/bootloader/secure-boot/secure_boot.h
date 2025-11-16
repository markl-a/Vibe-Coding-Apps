#ifndef SECURE_BOOT_H
#define SECURE_BOOT_H

#include <stdint.h>
#include <stdbool.h>

// 版本資訊
#define SECURE_BOOT_VERSION_MAJOR  1
#define SECURE_BOOT_VERSION_MINOR  0
#define SECURE_BOOT_VERSION_PATCH  0

// 記憶體配置
#define PUBLIC_KEY_FLASH_ADDR     0x08010000
#define ROLLBACK_INFO_ADDR        0x08011000
#define APP_FIRMWARE_ADDR         0x08020000
#define APP_FIRMWARE_MAX_SIZE     (512 * 1024)

// 簽名配置
#define RSA_KEY_SIZE              2048
#define RSA_SIGNATURE_SIZE        (RSA_KEY_SIZE / 8)
#define SHA256_HASH_SIZE          32

// 魔術數字
#define FIRMWARE_MAGIC            0x46574D47  // "FWMG"
#define PUBLIC_KEY_MAGIC          0x50554B59  // "PUKY"
#define ROLLBACK_MAGIC            0x524C4253  // "RLBS"

// 韌體標頭結構
typedef struct __attribute__((packed)) {
    uint32_t magic;                           // 魔術數字
    uint32_t version;                         // 韌體版本
    uint32_t size;                            // 韌體大小
    uint32_t crc32;                           // CRC32 校驗
    uint8_t  hash[SHA256_HASH_SIZE];         // SHA-256 哈希
    uint8_t  signature[RSA_SIGNATURE_SIZE];  // RSA 簽名
    uint32_t timestamp;                       // 編譯時間戳
    uint8_t  reserved[64];                    // 保留欄位
} firmware_header_t;

// 公鑰儲存結構
typedef struct __attribute__((packed)) {
    uint32_t magic;                           // 魔術數字
    uint32_t key_size;                        // 金鑰大小
    uint8_t  modulus[RSA_SIGNATURE_SIZE];    // RSA 模數
    uint8_t  exponent[4];                     // RSA 指數 (通常是 65537)
    uint32_t crc32;                           // CRC32 校驗
} public_key_t;

// 回滾保護資訊
typedef struct __attribute__((packed)) {
    uint32_t magic;                           // 魔術數字
    uint32_t min_version;                     // 最小允許版本
    uint32_t boot_count;                      // 啟動計數
    uint32_t last_boot_timestamp;             // 最後啟動時間
    uint8_t  device_id[16];                   // 設備唯一 ID
    uint32_t crc32;                           // CRC32 校驗
} rollback_info_t;

// 啟動結果
typedef enum {
    BOOT_SUCCESS = 0,
    BOOT_ERROR_INVALID_HEADER,
    BOOT_ERROR_HASH_MISMATCH,
    BOOT_ERROR_SIGNATURE_INVALID,
    BOOT_ERROR_VERSION_ROLLBACK,
    BOOT_ERROR_SIZE_INVALID,
    BOOT_ERROR_PUBLIC_KEY_INVALID,
    BOOT_ERROR_CRC_MISMATCH,
    BOOT_ERROR_UNKNOWN
} boot_result_t;

// 安全啟動 API
boot_result_t secure_boot_verify_and_jump(void);
bool verify_firmware_signature(uint32_t fw_addr, uint32_t fw_size);
bool verify_firmware_hash(uint32_t fw_addr, const firmware_header_t *header);
bool check_firmware_version(uint32_t new_version);
bool load_public_key(public_key_t *key);
void jump_to_application(uint32_t app_addr);
void handle_boot_failure(boot_result_t error);

// 工具函數
uint32_t calculate_crc32(const uint8_t *data, uint32_t length);
void get_device_unique_id(uint8_t *uid, uint32_t len);
uint32_t get_current_timestamp(void);

// 記錄函數
void log_boot_event(const char *message);
void log_security_event(boot_result_t error);

#endif // SECURE_BOOT_H
