#ifndef OTA_BOOTLOADER_H
#define OTA_BOOTLOADER_H

#include <stdint.h>
#include <stdbool.h>

// 分區定義
typedef enum {
    PARTITION_A = 0,
    PARTITION_B = 1,
    PARTITION_INVALID = 0xFF
} partition_t;

// OTA 狀態
typedef enum {
    OTA_STATE_IDLE = 0,
    OTA_STATE_DOWNLOADING,
    OTA_STATE_VERIFYING,
    OTA_STATE_INSTALLING,
    OTA_STATE_TESTING,
    OTA_STATE_CONFIRMED,
    OTA_STATE_ROLLBACK
} ota_state_t;

// OTA 更新包標頭
typedef struct __attribute__((packed)) {
    uint32_t magic;
    uint32_t version;
    uint32_t size;
    uint32_t crc32;
    uint8_t  sha256[32];
    uint8_t  signature[256];
    uint32_t timestamp;
} ota_package_header_t;

// 分區資訊
typedef struct __attribute__((packed)) {
    partition_t active_partition;
    uint32_t boot_count;
    uint32_t update_timestamp;
    ota_state_t state;
    uint32_t crc32;
} ota_boot_info_t;

// API 函數
int ota_bootloader_init(void);
bool ota_check_update_flag(void);
int ota_perform_update(void);
partition_t ota_get_active_partition(void);
bool ota_verify_firmware(partition_t partition);
int ota_rollback_to_previous(void);
void ota_confirm_update(void);
void boot_partition(partition_t partition);

#endif // OTA_BOOTLOADER_H
