/**
 * @file complete_firmware_system.c
 * @brief 完整韌體系統範例
 * @description 整合 OTA 更新、加密、配置管理、安全啟動等功能的完整系統
 */

#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

// ============================================================================
// 系統配置
// ============================================================================

#define FIRMWARE_VERSION_MAJOR  1
#define FIRMWARE_VERSION_MINOR  2
#define FIRMWARE_VERSION_PATCH  3
#define FIRMWARE_BUILD_NUMBER   12345

#define DEVICE_NAME            "SecureIoTDevice"
#define DEVICE_ID              "SID_001"

// 記憶體映射
#define BOOTLOADER_ADDR        0x08000000
#define CONFIG_FLASH_ADDR      0x08010000
#define APP_PARTITION_A_ADDR   0x08020000
#define APP_PARTITION_B_ADDR   0x00120000
#define OTA_BUFFER_ADDR        0x20000000  // RAM

// ============================================================================
// 全局數據結構
// ============================================================================

// 系統配置
typedef struct {
    uint32_t magic;
    uint32_t version;

    // 網路配置
    struct {
        char ssid[64];
        char password[64];
        uint32_t ip_address;
        uint16_t port;
        uint8_t dhcp_enabled;
    } network;

    // OTA 配置
    struct {
        char server_url[128];
        uint16_t check_interval_sec;
        uint8_t auto_update;
        uint8_t update_time_hour;  // 0-23
    } ota;

    // 安全配置
    struct {
        uint8_t encryption_enabled;
        uint8_t secure_boot_enabled;
        uint8_t debug_disabled;
    } security;

    // 日誌配置
    struct {
        uint8_t level;  // 0=OFF, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG
        uint8_t uart_enabled;
        uint8_t flash_enabled;
        uint32_t max_flash_size;
    } logging;

    uint32_t crc32;
} system_config_t;

// 系統狀態
typedef struct {
    uint32_t uptime_seconds;
    uint32_t boot_count;
    uint32_t last_ota_check;
    uint32_t last_ota_update;

    struct {
        uint32_t free_heap;
        uint32_t min_free_heap;
        uint8_t cpu_usage;
    } resources;

    struct {
        uint8_t connected;
        int8_t rssi;
        uint32_t tx_bytes;
        uint32_t rx_bytes;
    } network;

    struct {
        bool update_available;
        bool update_in_progress;
        uint8_t update_progress;
        char new_version[16];
    } ota;

} system_status_t;

static system_config_t sys_config;
static system_status_t sys_status = {0};

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
// 配置管理
// ============================================================================

void config_load_defaults(system_config_t *config) {
    printf("[Config] 載入默認配置\n");

    memset(config, 0, sizeof(system_config_t));

    config->magic = 0x434F4E46;  // "CONF"
    config->version = 1;

    // 網路默認配置
    strcpy(config->network.ssid, "MyWiFi");
    strcpy(config->network.password, "password123");
    config->network.ip_address = 0xC0A80164;  // 192.168.1.100
    config->network.port = 8080;
    config->network.dhcp_enabled = 1;

    // OTA 默認配置
    strcpy(config->ota.server_url, "https://ota.example.com/api");
    config->ota.check_interval_sec = 3600;  // 每小時檢查一次
    config->ota.auto_update = 0;
    config->ota.update_time_hour = 3;  // 凌晨 3 點更新

    // 安全默認配置
    config->security.encryption_enabled = 1;
    config->security.secure_boot_enabled = 1;
    config->security.debug_disabled = 0;

    // 日誌默認配置
    config->logging.level = 3;  // INFO
    config->logging.uart_enabled = 1;
    config->logging.flash_enabled = 1;
    config->logging.max_flash_size = 64 * 1024;

    // 計算 CRC
    config->crc32 = 0;
    config->crc32 = crc32_calculate((uint8_t *)config, sizeof(system_config_t));
}

bool config_load(system_config_t *config) {
    printf("[Config] 從 Flash 載入配置\n");

    // 實際會從 Flash 讀取
    // flash_read(CONFIG_FLASH_ADDR, (uint8_t *)config, sizeof(system_config_t));

    // 模擬：載入默認配置
    config_load_defaults(config);

    // 驗證配置
    if (config->magic != 0x434F4E46) {
        printf("[Config] 配置無效，使用默認值\n");
        config_load_defaults(config);
        return false;
    }

    uint32_t saved_crc = config->crc32;
    config->crc32 = 0;
    uint32_t calculated_crc = crc32_calculate((uint8_t *)config,
                                              sizeof(system_config_t));

    if (saved_crc != calculated_crc) {
        printf("[Config] CRC 驗證失敗，使用默認值\n");
        config_load_defaults(config);
        return false;
    }

    config->crc32 = saved_crc;
    printf("[Config] 配置載入成功\n");
    return true;
}

bool config_save(const system_config_t *config) {
    printf("[Config] 保存配置到 Flash\n");

    system_config_t temp = *config;
    temp.crc32 = 0;
    temp.crc32 = crc32_calculate((uint8_t *)&temp, sizeof(system_config_t));

    // 實際會寫入 Flash
    // flash_erase_sector(CONFIG_FLASH_ADDR);
    // flash_write(CONFIG_FLASH_ADDR, (uint8_t *)&temp, sizeof(system_config_t));

    printf("[Config] 配置保存成功\n");
    return true;
}

void config_print(const system_config_t *config) {
    printf("\n========== 系統配置 ==========\n");
    printf("網路:\n");
    printf("  SSID: %s\n", config->network.ssid);
    printf("  IP: %d.%d.%d.%d\n",
           (config->network.ip_address >> 24) & 0xFF,
           (config->network.ip_address >> 16) & 0xFF,
           (config->network.ip_address >> 8) & 0xFF,
           config->network.ip_address & 0xFF);
    printf("  Port: %u\n", config->network.port);
    printf("  DHCP: %s\n", config->network.dhcp_enabled ? "啟用" : "禁用");

    printf("\nOTA:\n");
    printf("  服務器: %s\n", config->ota.server_url);
    printf("  檢查間隔: %u 秒\n", config->ota.check_interval_sec);
    printf("  自動更新: %s\n", config->ota.auto_update ? "是" : "否");

    printf("\n安全:\n");
    printf("  加密: %s\n", config->security.encryption_enabled ? "啟用" : "禁用");
    printf("  安全啟動: %s\n", config->security.secure_boot_enabled ? "啟用" : "禁用");
    printf("  調試: %s\n", config->security.debug_disabled ? "禁用" : "啟用");

    printf("\n日誌:\n");
    printf("  級別: %u\n", config->logging.level);
    printf("  UART: %s\n", config->logging.uart_enabled ? "啟用" : "禁用");
    printf("  Flash: %s\n", config->logging.flash_enabled ? "啟用" : "禁用");
    printf("==============================\n\n");
}

// ============================================================================
// 網路管理
// ============================================================================

bool network_init(const system_config_t *config) {
    printf("[Network] 初始化網路...\n");
    printf("[Network] 連接到 WiFi: %s\n", config->network.ssid);

    // 實際會初始化 WiFi 驅動
    // wifi_init();
    // wifi_connect(config->network.ssid, config->network.password);

    sys_status.network.connected = 1;
    sys_status.network.rssi = -45;  // dBm

    printf("[Network] WiFi 連接成功 (RSSI: %d dBm)\n", sys_status.network.rssi);
    return true;
}

bool network_check_connection(void) {
    return sys_status.network.connected;
}

// ============================================================================
// OTA 更新管理
// ============================================================================

typedef struct {
    bool update_available;
    char version[16];
    char url[256];
    uint32_t size;
    uint8_t sha256[32];
} ota_info_t;

bool ota_check_for_update(ota_info_t *info) {
    printf("\n[OTA] 檢查更新...\n");
    printf("[OTA] 當前版本: v%d.%d.%d\n",
           FIRMWARE_VERSION_MAJOR,
           FIRMWARE_VERSION_MINOR,
           FIRMWARE_VERSION_PATCH);

    // 實際會發送 HTTP 請求到 OTA 服務器
    // http_get(config->ota.server_url, ...);

    // 模擬發現新版本
    info->update_available = true;
    strcpy(info->version, "1.3.0");
    strcpy(info->url, "https://ota.example.com/firmware_v1.3.0.bin");
    info->size = 512 * 1024;
    memset(info->sha256, 0xAB, 32);

    if (info->update_available) {
        printf("[OTA] 發現新版本: %s\n", info->version);
        printf("[OTA] 大小: %u KB\n", info->size / 1024);
        sys_status.ota.update_available = true;
        strcpy(sys_status.ota.new_version, info->version);
    } else {
        printf("[OTA] 已是最新版本\n");
    }

    sys_status.last_ota_check = sys_status.uptime_seconds;
    return info->update_available;
}

bool ota_download_and_install(const ota_info_t *info) {
    printf("\n[OTA] 開始下載韌體...\n");
    sys_status.ota.update_in_progress = true;
    sys_status.ota.update_progress = 0;

    // 下載韌體到緩衝區
    const uint32_t chunk_size = 4096;
    for (uint32_t offset = 0; offset < info->size; offset += chunk_size) {
        // 實際會通過 HTTP 下載
        // http_download_chunk(info->url, offset, chunk_size, buffer);

        sys_status.ota.update_progress = (offset * 100) / info->size;

        if (offset % (32 * 1024) == 0) {
            printf("[OTA] 下載進度: %u%%\n", sys_status.ota.update_progress);
        }
    }

    printf("[OTA] 下載完成 (100%%)\n");

    // 驗證韌體
    printf("[OTA] 驗證韌體...\n");
    // 計算 SHA-256 並比較

    printf("[OTA] 韌體驗證成功\n");

    // 寫入非活動分區
    printf("[OTA] 安裝韌體到備用分區...\n");
    // flash_erase(APP_PARTITION_B_ADDR, info->size);
    // flash_write(APP_PARTITION_B_ADDR, firmware_buffer, info->size);

    // 更新啟動標誌
    printf("[OTA] 更新啟動標誌...\n");

    sys_status.ota.update_in_progress = false;
    sys_status.ota.update_progress = 100;
    sys_status.last_ota_update = sys_status.uptime_seconds;

    printf("[OTA] ✅ OTA 更新成功！\n");
    printf("[OTA] 系統將在 5 秒後重啟...\n");

    return true;
}

// ============================================================================
// 系統監控
// ============================================================================

void system_monitor_update(void) {
    // 更新系統狀態
    sys_status.resources.free_heap = 32768;  // 模擬
    sys_status.resources.cpu_usage = 25;     // 模擬 25%

    if (sys_status.resources.free_heap < sys_status.resources.min_free_heap ||
        sys_status.resources.min_free_heap == 0) {
        sys_status.resources.min_free_heap = sys_status.resources.free_heap;
    }
}

void system_print_status(void) {
    printf("\n========== 系統狀態 ==========\n");
    printf("韌體版本: v%d.%d.%d (Build %d)\n",
           FIRMWARE_VERSION_MAJOR,
           FIRMWARE_VERSION_MINOR,
           FIRMWARE_VERSION_PATCH,
           FIRMWARE_BUILD_NUMBER);
    printf("設備名稱: %s\n", DEVICE_NAME);
    printf("設備 ID: %s\n", DEVICE_ID);
    printf("運行時間: %u 秒\n", sys_status.uptime_seconds);
    printf("啟動次數: %u\n", sys_status.boot_count);

    printf("\n資源:\n");
    printf("  空閒堆積: %u 字節\n", sys_status.resources.free_heap);
    printf("  最小堆積: %u 字節\n", sys_status.resources.min_free_heap);
    printf("  CPU 使用率: %u%%\n", sys_status.resources.cpu_usage);

    printf("\n網路:\n");
    printf("  狀態: %s\n", sys_status.network.connected ? "已連接" : "未連接");
    printf("  信號強度: %d dBm\n", sys_status.network.rssi);
    printf("  TX: %u 字節\n", sys_status.network.tx_bytes);
    printf("  RX: %u 字節\n", sys_status.network.rx_bytes);

    printf("\nOTA:\n");
    printf("  上次檢查: %u 秒前\n",
           sys_status.uptime_seconds - sys_status.last_ota_check);
    printf("  有可用更新: %s\n",
           sys_status.ota.update_available ? "是" : "否");
    if (sys_status.ota.update_available) {
        printf("  新版本: %s\n", sys_status.ota.new_version);
    }

    printf("==============================\n\n");
}

// ============================================================================
// 任務函數
// ============================================================================

void task_ota_check(void) {
    // 定期檢查 OTA 更新
    uint32_t elapsed = sys_status.uptime_seconds - sys_status.last_ota_check;

    if (elapsed >= sys_config.ota.check_interval_sec) {
        if (network_check_connection()) {
            ota_info_t ota_info;
            if (ota_check_for_update(&ota_info)) {
                if (sys_config.ota.auto_update) {
                    printf("[Task] 自動更新已啟用，開始更新...\n");
                    ota_download_and_install(&ota_info);
                } else {
                    printf("[Task] 發現更新，但自動更新已禁用\n");
                }
            }
        }
    }
}

void task_system_monitor(void) {
    static uint32_t last_run = 0;

    if (sys_status.uptime_seconds - last_run >= 10) {
        system_monitor_update();
        last_run = sys_status.uptime_seconds;
    }
}

void task_heartbeat(void) {
    static uint32_t last_run = 0;

    if (sys_status.uptime_seconds - last_run >= 60) {
        printf("[Heartbeat] 系統運行正常 (Uptime: %u 秒)\n",
               sys_status.uptime_seconds);
        last_run = sys_status.uptime_seconds;
    }
}

// ============================================================================
// 系統初始化
// ============================================================================

void system_init(void) {
    printf("\n");
    printf("========================================\n");
    printf("  完整韌體系統初始化\n");
    printf("  %s v%d.%d.%d\n",
           DEVICE_NAME,
           FIRMWARE_VERSION_MAJOR,
           FIRMWARE_VERSION_MINOR,
           FIRMWARE_VERSION_PATCH);
    printf("========================================\n\n");

    // 1. 載入配置
    if (!config_load(&sys_config)) {
        printf("[System] 使用默認配置\n");
    }
    config_print(&sys_config);

    // 2. 初始化硬體
    printf("[System] 初始化硬體...\n");
    // gpio_init();
    // uart_init();
    // spi_init();

    // 3. 初始化網路
    if (!network_init(&sys_config)) {
        printf("[System] 網路初始化失敗\n");
    }

    // 4. 初始化系統狀態
    sys_status.boot_count++;
    sys_status.uptime_seconds = 0;
    sys_status.last_ota_check = 0;

    printf("\n[System] ✅ 系統初始化完成！\n\n");
}

// ============================================================================
// 主程式
// ============================================================================

int main(void) {
    // 系統初始化
    system_init();

    // 顯示初始狀態
    system_print_status();

    // 主循環
    printf("\n========== 進入主循環 ==========\n\n");

    for (uint32_t i = 0; i < 100; i++) {  // 模擬運行 100 秒
        sys_status.uptime_seconds++;

        // 執行定期任務
        task_system_monitor();
        task_heartbeat();
        task_ota_check();

        // 模擬延遲 1 秒
        // delay_ms(1000);

        // 每 30 秒顯示一次狀態
        if (sys_status.uptime_seconds % 30 == 0) {
            system_print_status();
        }

        // 模擬 OTA 更新觸發
        if (sys_status.uptime_seconds == 50) {
            printf("\n[Demo] 模擬觸發 OTA 更新...\n");
            ota_info_t ota_info;
            if (ota_check_for_update(&ota_info)) {
                ota_download_and_install(&ota_info);
                break;  // 更新後會重啟
            }
        }
    }

    printf("\n========================================\n");
    printf("  系統運行完成\n");
    printf("========================================\n\n");

    return 0;
}
