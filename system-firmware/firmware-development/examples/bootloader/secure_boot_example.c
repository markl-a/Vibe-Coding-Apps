/**
 * @file secure_boot_example.c
 * @brief 安全啟動範例
 * @description 展示安全啟動流程，包括韌體驗證、簽名檢查和啟動跳轉
 */

#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

// ============================================================================
// 安全啟動配置
// ============================================================================

#define BOOTLOADER_VERSION      "1.0.0"

// 記憶體映射
#define BOOTLOADER_BASE         0x08000000
#define BOOTLOADER_SIZE         (64 * 1024)    // 64KB

#define PUBLIC_KEY_ADDR         0x08010000     // 公鑰存儲
#define ROLLBACK_INFO_ADDR      0x08011000     // 回滾保護資訊

#define APP_PARTITION_A         0x08020000     // 分區 A
#define APP_PARTITION_B         0x08120000     // 分區 B
#define APP_PARTITION_SIZE      (1024 * 1024)  // 1MB

#define BOOT_FLAG_ADDR          0x08012000     // 啟動標誌

// 安全配置
#define RSA_KEY_SIZE            2048
#define RSA_SIGNATURE_SIZE      (RSA_KEY_SIZE / 8)
#define SHA256_HASH_SIZE        32

#define FIRMWARE_MAGIC          0x46574D47  // "FWMG"
#define PUBLIC_KEY_MAGIC        0x50554B59  // "PUKY"
#define ROLLBACK_MAGIC          0x524C4253  // "RLBS"

// ============================================================================
// 數據結構
// ============================================================================

// 韌體標頭
typedef struct __attribute__((packed)) {
    uint32_t magic;
    uint32_t version;
    uint32_t size;
    uint32_t crc32;
    uint8_t  hash[SHA256_HASH_SIZE];
    uint8_t  signature[RSA_SIGNATURE_SIZE];
    uint32_t timestamp;
    uint8_t  reserved[64];
} firmware_header_t;

// 公鑰存儲
typedef struct __attribute__((packed)) {
    uint32_t magic;
    uint32_t key_size;
    uint8_t  modulus[RSA_SIGNATURE_SIZE];
    uint8_t  exponent[4];
    uint32_t crc32;
} public_key_t;

// 回滾保護
typedef struct __attribute__((packed)) {
    uint32_t magic;
    uint32_t min_version;
    uint32_t boot_count;
    uint32_t last_boot_timestamp;
    uint8_t  device_id[16];
    uint32_t crc32;
} rollback_info_t;

// 啟動標誌
typedef struct __attribute__((packed)) {
    uint32_t active_partition;  // 0 = A, 1 = B
    uint32_t boot_attempts;
    uint32_t magic;
    uint32_t crc32;
} boot_flag_t;

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
    BOOT_ERROR_MAX_ATTEMPTS,
    BOOT_ERROR_UNKNOWN
} boot_result_t;

const char *boot_error_strings[] = {
    "成功",
    "無效的韌體標頭",
    "哈希值不匹配",
    "簽名驗證失敗",
    "版本回滾攻擊",
    "韌體大小無效",
    "公鑰無效",
    "CRC 校驗失敗",
    "超過最大啟動嘗試次數",
    "未知錯誤"
};

// ============================================================================
// 加密函數 (簡化實現，實際應使用 mbedtls)
// ============================================================================

void sha256_compute(const uint8_t *data, uint32_t length, uint8_t *hash) {
    printf("[SHA256] 計算哈希值 (%u 字節)\n", length);
    // 實際實現使用 mbedtls_sha256()
    // 這裡使用簡單的模擬
    memset(hash, 0xAB, SHA256_HASH_SIZE);
}

bool rsa_verify_signature(const uint8_t *signature,
                          const uint8_t *hash,
                          uint32_t hash_len,
                          const public_key_t *public_key) {
    printf("[RSA] 驗證簽名...\n");

    // 實際實現使用 mbedtls_rsa_pkcs1_verify()
    // 驗證步驟:
    // 1. 使用公鑰解密簽名
    // 2. 比較解密後的哈希與計算的哈希

    // 模擬驗證成功
    return true;
}

// ============================================================================
// CRC32 計算
// ============================================================================

uint32_t crc32_calculate(const uint8_t *data, uint32_t length) {
    uint32_t crc = 0xFFFFFFFF;

    for (uint32_t i = 0; i < length; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            crc = (crc >> 1) ^ (0xEDB88320 & -(crc & 1));
        }
    }

    return ~crc;
}

// ============================================================================
// Flash 操作
// ============================================================================

void flash_read(uint32_t address, uint8_t *buffer, uint32_t size) {
    // 實際實現: memcpy(buffer, (void *)address, size);
    // 模擬讀取
    if (address == PUBLIC_KEY_ADDR) {
        // 模擬公鑰數據
        public_key_t *key = (public_key_t *)buffer;
        key->magic = PUBLIC_KEY_MAGIC;
        key->key_size = RSA_KEY_SIZE;
        memset(key->modulus, 0xCD, RSA_SIGNATURE_SIZE);
        key->exponent[0] = 0x01;
        key->exponent[1] = 0x00;
        key->exponent[2] = 0x01;
        key->exponent[3] = 0x00;
        key->crc32 = 0;
        key->crc32 = crc32_calculate((uint8_t *)key, sizeof(public_key_t));
    } else {
        memset(buffer, 0xFF, size);
    }
}

void flash_write(uint32_t address, const uint8_t *data, uint32_t size) {
    printf("[Flash] 寫入 %u 字節 @ 0x%08X\n", size, address);
}

// ============================================================================
// 設備唯一 ID
// ============================================================================

void get_device_unique_id(uint8_t *uid, uint32_t len) {
    // 實際會讀取 MCU 的唯一 ID
    // 例如 STM32: 0x1FFF7A10 (96 bits)
    for (uint32_t i = 0; i < len; i++) {
        uid[i] = (uint8_t)(0x12 + i);
    }
}

// ============================================================================
// 時間戳
// ============================================================================

uint32_t get_current_timestamp(void) {
    // 實際會從 RTC 讀取
    return 1700000000;
}

// ============================================================================
// 安全啟動核心功能
// ============================================================================

bool load_public_key(public_key_t *key) {
    printf("[SecureBoot] 載入公鑰...\n");

    flash_read(PUBLIC_KEY_ADDR, (uint8_t *)key, sizeof(public_key_t));

    // 驗證公鑰
    if (key->magic != PUBLIC_KEY_MAGIC) {
        printf("[SecureBoot] 錯誤：公鑰魔數無效\n");
        return false;
    }

    // 驗證 CRC
    uint32_t saved_crc = key->crc32;
    key->crc32 = 0;
    uint32_t calculated_crc = crc32_calculate((uint8_t *)key, sizeof(public_key_t));

    if (saved_crc != calculated_crc) {
        printf("[SecureBoot] 錯誤：公鑰 CRC 驗證失敗\n");
        return false;
    }

    key->crc32 = saved_crc;
    printf("[SecureBoot] 公鑰載入成功 (RSA-%u)\n", key->key_size);
    return true;
}

bool verify_firmware_header(const firmware_header_t *header) {
    printf("[SecureBoot] 驗證韌體標頭...\n");

    // 檢查魔數
    if (header->magic != FIRMWARE_MAGIC) {
        printf("[SecureBoot] 錯誤：韌體魔數無效 (0x%08X)\n", header->magic);
        return false;
    }

    // 檢查大小
    if (header->size == 0 || header->size > APP_PARTITION_SIZE) {
        printf("[SecureBoot] 錯誤：韌體大小無效 (%u 字節)\n", header->size);
        return false;
    }

    printf("[SecureBoot] 韌體標頭有效\n");
    printf("  版本: %u\n", header->version);
    printf("  大小: %u 字節\n", header->size);
    printf("  時間戳: %u\n", header->timestamp);

    return true;
}

bool verify_firmware_hash(uint32_t fw_addr, const firmware_header_t *header) {
    printf("[SecureBoot] 驗證韌體哈希...\n");

    // 計算韌體哈希 (跳過標頭)
    uint32_t fw_data_addr = fw_addr + sizeof(firmware_header_t);
    uint32_t fw_data_size = header->size - sizeof(firmware_header_t);

    uint8_t *fw_data = (uint8_t *)malloc(fw_data_size);
    flash_read(fw_data_addr, fw_data, fw_data_size);

    uint8_t calculated_hash[SHA256_HASH_SIZE];
    sha256_compute(fw_data, fw_data_size, calculated_hash);

    free(fw_data);

    // 比較哈希
    if (memcmp(header->hash, calculated_hash, SHA256_HASH_SIZE) == 0) {
        printf("[SecureBoot] 哈希驗證成功\n");
        return true;
    }

    printf("[SecureBoot] 錯誤：哈希驗證失敗\n");
    return false;
}

bool verify_firmware_signature(const firmware_header_t *header,
                               const public_key_t *public_key) {
    printf("[SecureBoot] 驗證韌體簽名...\n");

    if (!rsa_verify_signature(header->signature,
                              header->hash,
                              SHA256_HASH_SIZE,
                              public_key)) {
        printf("[SecureBoot] 錯誤：簽名驗證失敗\n");
        return false;
    }

    printf("[SecureBoot] 簽名驗證成功\n");
    return true;
}

bool check_firmware_version(uint32_t new_version) {
    printf("[SecureBoot] 檢查韌體版本...\n");

    rollback_info_t rollback_info;
    flash_read(ROLLBACK_INFO_ADDR, (uint8_t *)&rollback_info, sizeof(rollback_info));

    if (rollback_info.magic != ROLLBACK_MAGIC) {
        printf("[SecureBoot] 警告：無回滾保護資訊，初始化...\n");
        rollback_info.magic = ROLLBACK_MAGIC;
        rollback_info.min_version = new_version;
        rollback_info.boot_count = 0;
        rollback_info.last_boot_timestamp = get_current_timestamp();
        get_device_unique_id(rollback_info.device_id, 16);
        rollback_info.crc32 = 0;
        rollback_info.crc32 = crc32_calculate((uint8_t *)&rollback_info,
                                              sizeof(rollback_info));
        flash_write(ROLLBACK_INFO_ADDR, (uint8_t *)&rollback_info,
                   sizeof(rollback_info));
        return true;
    }

    // 檢查版本回滾
    if (new_version < rollback_info.min_version) {
        printf("[SecureBoot] 錯誤：檢測到版本回滾攻擊！\n");
        printf("  當前最小版本: %u\n", rollback_info.min_version);
        printf("  嘗試啟動版本: %u\n", new_version);
        return false;
    }

    printf("[SecureBoot] 版本檢查通過 (v%u)\n", new_version);

    // 更新啟動計數
    rollback_info.boot_count++;
    rollback_info.last_boot_timestamp = get_current_timestamp();
    rollback_info.crc32 = 0;
    rollback_info.crc32 = crc32_calculate((uint8_t *)&rollback_info,
                                          sizeof(rollback_info));
    flash_write(ROLLBACK_INFO_ADDR, (uint8_t *)&rollback_info,
               sizeof(rollback_info));

    return true;
}

void jump_to_application(uint32_t app_addr) {
    printf("[SecureBoot] 跳轉到應用程式 @ 0x%08X\n", app_addr);

    // 實際實現 (ARM Cortex-M):
    /*
    typedef void (*app_func_t)(void);

    // 禁用中斷
    __disable_irq();

    // 讀取向量表
    uint32_t app_stack = *(uint32_t *)app_addr;
    uint32_t app_entry = *(uint32_t *)(app_addr + 4);

    // 設置堆疊指針
    __set_MSP(app_stack);

    // 重新配置向量表
    SCB->VTOR = app_addr;

    // 跳轉
    app_func_t app = (app_func_t)app_entry;
    app();
    */

    printf("[SecureBoot] (模擬跳轉成功)\n");
}

void handle_boot_failure(boot_result_t error) {
    printf("\n");
    printf("========================================\n");
    printf("  ⚠️  安全啟動失敗！\n");
    printf("========================================\n");
    printf("錯誤代碼: %d\n", error);
    printf("錯誤訊息: %s\n", boot_error_strings[error]);
    printf("========================================\n\n");

    // 進入恢復模式
    printf("[RecoveryMode] 進入恢復模式...\n");
    printf("[RecoveryMode] 等待韌體更新...\n");

    // 實際會啟動 DFU 或串口更新模式
    while (1) {
        // LED 閃爍指示錯誤
    }
}

// ============================================================================
// 啟動標誌管理
// ============================================================================

bool read_boot_flag(boot_flag_t *flag) {
    flash_read(BOOT_FLAG_ADDR, (uint8_t *)flag, sizeof(boot_flag_t));

    if (flag->magic != 0xB007F1A6) {
        // 初始化啟動標誌
        flag->active_partition = 0;  // 默認分區 A
        flag->boot_attempts = 0;
        flag->magic = 0xB007F1A6;
        flag->crc32 = 0;
        flag->crc32 = crc32_calculate((uint8_t *)flag, sizeof(boot_flag_t));
        flash_write(BOOT_FLAG_ADDR, (uint8_t *)flag, sizeof(boot_flag_t));
    }

    return true;
}

void update_boot_flag(boot_flag_t *flag) {
    flag->crc32 = 0;
    flag->crc32 = crc32_calculate((uint8_t *)flag, sizeof(boot_flag_t));
    flash_write(BOOT_FLAG_ADDR, (uint8_t *)flag, sizeof(boot_flag_t));
}

// ============================================================================
// 主安全啟動流程
// ============================================================================

boot_result_t secure_boot_verify_and_jump(void) {
    printf("\n");
    printf("========================================\n");
    printf("  🔒 安全啟動 v%s\n", BOOTLOADER_VERSION);
    printf("========================================\n\n");

    // 1. 載入啟動標誌
    boot_flag_t boot_flag;
    read_boot_flag(&boot_flag);

    printf("[SecureBoot] 活動分區: %s\n",
           boot_flag.active_partition == 0 ? "A" : "B");
    printf("[SecureBoot] 啟動嘗試: %u\n", boot_flag.boot_attempts);

    // 檢查最大啟動嘗試次數
    if (boot_flag.boot_attempts >= 3) {
        printf("[SecureBoot] 警告：超過最大啟動嘗試次數，切換分區\n");
        boot_flag.active_partition = 1 - boot_flag.active_partition;
        boot_flag.boot_attempts = 0;
        update_boot_flag(&boot_flag);
    }

    // 2. 確定韌體地址
    uint32_t fw_addr = (boot_flag.active_partition == 0) ?
                       APP_PARTITION_A : APP_PARTITION_B;

    printf("\n[SecureBoot] 韌體地址: 0x%08X\n", fw_addr);

    // 3. 載入公鑰
    public_key_t public_key;
    if (!load_public_key(&public_key)) {
        return BOOT_ERROR_PUBLIC_KEY_INVALID;
    }

    // 4. 讀取韌體標頭
    firmware_header_t header;
    flash_read(fw_addr, (uint8_t *)&header, sizeof(firmware_header_t));

    // 5. 驗證韌體標頭
    if (!verify_firmware_header(&header)) {
        return BOOT_ERROR_INVALID_HEADER;
    }

    // 6. 驗證韌體哈希
    if (!verify_firmware_hash(fw_addr, &header)) {
        return BOOT_ERROR_HASH_MISMATCH;
    }

    // 7. 驗證韌體簽名
    if (!verify_firmware_signature(&header, &public_key)) {
        return BOOT_ERROR_SIGNATURE_INVALID;
    }

    // 8. 檢查韌體版本 (防回滾)
    if (!check_firmware_version(header.version)) {
        return BOOT_ERROR_VERSION_ROLLBACK;
    }

    // 9. 重置啟動嘗試計數
    boot_flag.boot_attempts = 0;
    update_boot_flag(&boot_flag);

    printf("\n");
    printf("========================================\n");
    printf("  ✅ 韌體驗證成功！\n");
    printf("========================================\n");
    printf("韌體版本: %u\n", header.version);
    printf("韌體大小: %u 字節\n", header.size);
    printf("啟動分區: %s\n", boot_flag.active_partition == 0 ? "A" : "B");
    printf("========================================\n\n");

    // 10. 跳轉到應用程式
    jump_to_application(fw_addr);

    return BOOT_SUCCESS;
}

// ============================================================================
// 主程式
// ============================================================================

int main(void) {
    // 執行安全啟動
    boot_result_t result = secure_boot_verify_and_jump();

    if (result != BOOT_SUCCESS) {
        // 增加啟動嘗試計數
        boot_flag_t boot_flag;
        read_boot_flag(&boot_flag);
        boot_flag.boot_attempts++;
        update_boot_flag(&boot_flag);

        // 處理啟動失敗
        handle_boot_failure(result);
    }

    return 0;
}
