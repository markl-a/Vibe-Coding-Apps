#include "secure_boot.h"
#include "crypto_verify.h"
#include <string.h>
#include <stdio.h>

// 全域變數
static public_key_t g_public_key;
static rollback_info_t g_rollback_info;

/**
 * @brief 主要安全啟動驗證和跳轉函數
 * @return 啟動結果
 */
boot_result_t secure_boot_verify_and_jump(void)
{
    firmware_header_t *header = (firmware_header_t *)APP_FIRMWARE_ADDR;

    log_boot_event("Starting secure boot verification...");

    // 1. 載入公鑰
    if (!load_public_key(&g_public_key)) {
        log_security_event(BOOT_ERROR_PUBLIC_KEY_INVALID);
        return BOOT_ERROR_PUBLIC_KEY_INVALID;
    }

    // 2. 驗證韌體標頭
    if (header->magic != FIRMWARE_MAGIC) {
        log_security_event(BOOT_ERROR_INVALID_HEADER);
        return BOOT_ERROR_INVALID_HEADER;
    }

    // 3. 檢查韌體大小
    if (header->size == 0 || header->size > APP_FIRMWARE_MAX_SIZE) {
        log_security_event(BOOT_ERROR_SIZE_INVALID);
        return BOOT_ERROR_SIZE_INVALID;
    }

    // 4. 驗證 CRC32
    uint32_t calculated_crc = calculate_crc32(
        (uint8_t *)(APP_FIRMWARE_ADDR + sizeof(firmware_header_t)),
        header->size - sizeof(firmware_header_t)
    );

    if (calculated_crc != header->crc32) {
        log_security_event(BOOT_ERROR_CRC_MISMATCH);
        return BOOT_ERROR_CRC_MISMATCH;
    }

    // 5. 驗證 SHA-256 哈希
    if (!verify_firmware_hash(APP_FIRMWARE_ADDR, header)) {
        log_security_event(BOOT_ERROR_HASH_MISMATCH);
        return BOOT_ERROR_HASH_MISMATCH;
    }

    // 6. 驗證 RSA 簽名
    if (!verify_firmware_signature(APP_FIRMWARE_ADDR, header->size)) {
        log_security_event(BOOT_ERROR_SIGNATURE_INVALID);
        return BOOT_ERROR_SIGNATURE_INVALID;
    }

    // 7. 檢查版本回滾保護
    if (!check_firmware_version(header->version)) {
        log_security_event(BOOT_ERROR_VERSION_ROLLBACK);
        return BOOT_ERROR_VERSION_ROLLBACK;
    }

    // 8. 更新啟動計數
    g_rollback_info.boot_count++;
    g_rollback_info.last_boot_timestamp = get_current_timestamp();

    log_boot_event("Secure boot verification successful!");

    // 9. 跳轉到應用程式
    jump_to_application(APP_FIRMWARE_ADDR + sizeof(firmware_header_t));

    // 不應該到達這裡
    return BOOT_ERROR_UNKNOWN;
}

/**
 * @brief 驗證韌體 RSA 簽名
 * @param fw_addr 韌體位址
 * @param fw_size 韌體大小
 * @return true 如果簽名有效
 */
bool verify_firmware_signature(uint32_t fw_addr, uint32_t fw_size)
{
    firmware_header_t *header = (firmware_header_t *)fw_addr;

    // 使用公鑰驗證簽名
    return rsa_verify_signature(
        header->signature,
        header->hash,
        SHA256_HASH_SIZE,
        &g_public_key
    );
}

/**
 * @brief 驗證韌體 SHA-256 哈希
 * @param fw_addr 韌體位址
 * @param header 韌體標頭
 * @return true 如果哈希匹配
 */
bool verify_firmware_hash(uint32_t fw_addr, const firmware_header_t *header)
{
    uint8_t calculated_hash[SHA256_HASH_SIZE];

    // 計算韌體哈希 (跳過標頭)
    sha256_compute(
        (uint8_t *)(fw_addr + sizeof(firmware_header_t)),
        header->size - sizeof(firmware_header_t),
        calculated_hash
    );

    // 常數時間比較，防止時序攻擊
    return constant_time_compare(
        calculated_hash,
        header->hash,
        SHA256_HASH_SIZE
    );
}

/**
 * @brief 檢查韌體版本，防止回滾攻擊
 * @param new_version 新韌體版本
 * @return true 如果版本有效
 */
bool check_firmware_version(uint32_t new_version)
{
    // 讀取回滾保護資訊
    rollback_info_t *stored_info = (rollback_info_t *)ROLLBACK_INFO_ADDR;

    if (stored_info->magic != ROLLBACK_MAGIC) {
        // 首次啟動，初始化回滾資訊
        g_rollback_info.magic = ROLLBACK_MAGIC;
        g_rollback_info.min_version = new_version;
        g_rollback_info.boot_count = 0;
        get_device_unique_id(g_rollback_info.device_id, 16);
        return true;
    }

    // 檢查版本是否回滾
    if (new_version < stored_info->min_version) {
        return false;  // 拒絕舊版本
    }

    // 更新最小版本
    if (new_version > stored_info->min_version) {
        g_rollback_info = *stored_info;
        g_rollback_info.min_version = new_version;
    } else {
        g_rollback_info = *stored_info;
    }

    return true;
}

/**
 * @brief 從 Flash 載入公鑰
 * @param key 公鑰結構指標
 * @return true 如果成功載入
 */
bool load_public_key(public_key_t *key)
{
    public_key_t *stored_key = (public_key_t *)PUBLIC_KEY_FLASH_ADDR;

    // 驗證魔術數字
    if (stored_key->magic != PUBLIC_KEY_MAGIC) {
        return false;
    }

    // 驗證 CRC
    uint32_t calculated_crc = calculate_crc32(
        (uint8_t *)stored_key,
        sizeof(public_key_t) - sizeof(uint32_t)
    );

    if (calculated_crc != stored_key->crc32) {
        return false;
    }

    // 複製公鑰
    memcpy(key, stored_key, sizeof(public_key_t));

    return true;
}

/**
 * @brief 跳轉到應用程式
 * @param app_addr 應用程式位址
 */
void jump_to_application(uint32_t app_addr)
{
    // 獲取應用程式堆疊指標和入口點
    uint32_t app_stack = *(__IO uint32_t *)app_addr;
    uint32_t app_entry = *(__IO uint32_t *)(app_addr + 4);

    // 函數指標類型定義
    typedef void (*app_entry_t)(void);
    app_entry_t application = (app_entry_t)app_entry;

    // 禁用所有中斷
    __disable_irq();

    // 重置所有外設 (特定於 MCU)
    // RCC->AHB1RSTR = 0xFFFFFFFF;
    // RCC->AHB1RSTR = 0;

    // 設置向量表偏移
    // SCB->VTOR = app_addr;

    // 設置主堆疊指標
    __set_MSP(app_stack);

    // 啟用中斷
    __enable_irq();

    // 跳轉到應用程式
    application();
}

/**
 * @brief 處理啟動失敗
 * @param error 錯誤代碼
 */
void handle_boot_failure(boot_result_t error)
{
    log_security_event(error);

    // 清除敏感資料
    memset(&g_public_key, 0, sizeof(g_public_key));
    memset(&g_rollback_info, 0, sizeof(g_rollback_info));

    // 可選: 進入恢復模式
    // enter_recovery_mode();

    // 無限迴圈，防止執行未驗證的代碼
    while (1) {
        // 閃爍 LED 指示錯誤
        // toggle_error_led();

        // 等待看門狗重置或除錯器介入
        for (volatile uint32_t i = 0; i < 1000000; i++);
    }
}

/**
 * @brief 計算 CRC32
 * @param data 資料指標
 * @param length 資料長度
 * @return CRC32 值
 */
uint32_t calculate_crc32(const uint8_t *data, uint32_t length)
{
    uint32_t crc = 0xFFFFFFFF;

    for (uint32_t i = 0; i < length; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            crc = (crc >> 1) ^ (0xEDB88320 & -(crc & 1));
        }
    }

    return ~crc;
}

/**
 * @brief 獲取設備唯一 ID
 * @param uid 輸出緩衝區
 * @param len 緩衝區長度
 */
void get_device_unique_id(uint8_t *uid, uint32_t len)
{
    // STM32 唯一 ID 位址 (96 bits)
    // 不同 MCU 的位址可能不同
    uint32_t *uid_base = (uint32_t *)0x1FFF7A10;

    for (uint32_t i = 0; i < len / 4 && i < 3; i++) {
        ((uint32_t *)uid)[i] = uid_base[i];
    }
}

/**
 * @brief 獲取當前時間戳
 * @return Unix 時間戳
 */
uint32_t get_current_timestamp(void)
{
    // 如果有 RTC，從 RTC 讀取
    // 否則返回啟動計數或固定值
    return 0;  // 需要實作
}

/**
 * @brief 記錄啟動事件
 * @param message 事件訊息
 */
void log_boot_event(const char *message)
{
#ifdef DEBUG
    // 開發階段透過 UART 輸出
    // uart_printf("[BOOT] %s\r\n", message);
#else
    // 生產環境記錄到 Flash 或靜默
    (void)message;
#endif
}

/**
 * @brief 記錄安全事件
 * @param error 錯誤代碼
 */
void log_security_event(boot_result_t error)
{
    const char *error_messages[] = {
        "Success",
        "Invalid header",
        "Hash mismatch",
        "Invalid signature",
        "Version rollback detected",
        "Invalid size",
        "Invalid public key",
        "CRC mismatch",
        "Unknown error"
    };

#ifdef DEBUG
    if (error < sizeof(error_messages) / sizeof(error_messages[0])) {
        log_boot_event(error_messages[error]);
    }
#else
    // 生產環境可以記錄到安全日誌
    (void)error;
#endif
}

/**
 * @brief 主函數
 */
int main(void)
{
    // 硬體初始化 (時鐘、GPIO 等)
    // hardware_init();

    // 執行安全啟動
    boot_result_t result = secure_boot_verify_and_jump();

    // 如果到達這裡，表示啟動失敗
    handle_boot_failure(result);

    // 永不返回
    while (1);

    return 0;
}
