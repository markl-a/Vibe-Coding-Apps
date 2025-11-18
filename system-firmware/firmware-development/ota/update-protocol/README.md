# OTA Update Protocol - OTA 更新協議

## 概述

實現完整的 OTA 更新協議，支持 HTTP/HTTPS/MQTT/CoAP 等多種傳輸方式，提供下載管理、進度跟踪、斷點續傳等功能。

## 功能特點

- **多協議支持**: HTTP, HTTPS, MQTT, CoAP
- **下載管理**: 支持斷點續傳、多線程下載、速度限制
- **進度跟踪**: 實時進度顯示、速度計算、剩餘時間估算
- **安全驗證**: SHA256 校驗、數字簽名驗證、SSL/TLS 支持
- **錯誤處理**: 自動重試、超時控制、狀態管理
- **靈活配置**: 可配置超時、重試次數、分塊大小等

## 目錄結構

```
update-protocol/
├── ota_protocol.h          # OTA 協議接口定義
├── ota_protocol.c          # OTA 協議實現
├── download_manager.h      # 下載管理器接口
├── download_manager.c      # 下載管理器實現
├── progress_tracker.h      # 進度跟踪器接口
├── progress_tracker.c      # 進度跟踪器實現
├── test_protocol.c         # 測試程序
├── Makefile               # 構建文件
└── README.md              # 本文檔
```

## API 接口

### OTA 協議 API

#### 初始化

```c
ota_config_t config = {
    .protocol = OTA_PROTOCOL_HTTPS,
    .server_url = "https://ota.example.com",
    .server_port = 443,
    .device_id = "DEVICE_001",
    .api_key = "your_api_key",
    .timeout_ms = 30000,
    .retry_count = 3,
    .auto_update = false,
    .verify_signature = true,
    .cert_path = "/path/to/ca-cert.pem"
};

ota_context_t ctx;
int ret = ota_protocol_init(&ctx, &config);
```

#### 檢查更新

```c
ota_firmware_info_t firmware_info;
int ret = ota_protocol_check_update(&ctx, "1.0.0", &firmware_info);

if (ret == 0) {
    printf("New firmware available: %s\n", firmware_info.version);
    printf("Size: %u bytes\n", firmware_info.size);
    printf("URL: %s\n", firmware_info.url);
}
```

#### 下載固件

```c
const char *output_path = "/tmp/firmware_new.bin";
ret = ota_protocol_download_firmware(&ctx, &firmware_info, output_path);

if (ret == 0) {
    printf("Firmware downloaded successfully\n");
}
```

#### 驗證固件

```c
ret = ota_protocol_verify_firmware(&ctx, output_path, &firmware_info);

if (ret == 0) {
    printf("Firmware verification successful\n");
}
```

#### 執行更新

```c
ret = ota_protocol_perform_update(&ctx, output_path);

if (ret == 0) {
    printf("Firmware update completed\n");
}
```

#### 清理

```c
ota_protocol_deinit(&ctx);
```

### 下載管理器 API

#### 創建下載管理器

```c
download_config_t config = {
    .timeout_ms = 30000,
    .retry_count = 3,
    .chunk_size = 4096,
    .resume_support = true,
    .verify_ssl = true
};

download_manager_handle_t handle = download_manager_create(&config);
```

#### 同步下載

```c
ret = download_manager_download(handle,
                                "https://example.com/file.bin",
                                "/tmp/file.bin");
```

#### 異步下載（帶進度回調）

```c
void progress_callback(uint64_t downloaded, uint64_t total, void *user_data)
{
    int percent = (total > 0) ? (downloaded * 100 / total) : 0;
    printf("\rProgress: %d%%", percent);
    fflush(stdout);
}

ret = download_manager_download_async(handle,
                                      "https://example.com/file.bin",
                                      "/tmp/file.bin",
                                      progress_callback,
                                      NULL);
```

#### 控制下載

```c
/* 暫停下載 */
download_manager_pause(handle);

/* 恢復下載 */
download_manager_resume(handle);

/* 取消下載 */
download_manager_cancel(handle);

/* 獲取狀態 */
download_state_t state = download_manager_get_state(handle);

/* 獲取統計信息 */
download_stats_t stats;
download_manager_get_stats(handle, &stats);
printf("Downloaded: %lu/%lu bytes\n", stats.downloaded_bytes, stats.total_bytes);
printf("Speed: %u B/s\n", stats.speed_bps);
printf("Progress: %u%%\n", stats.progress_percent);
```

### 進度跟踪器 API

```c
/* 創建進度跟踪器 */
progress_tracker_handle_t tracker = progress_tracker_create();

/* 啟動跟踪 */
progress_tracker_start(tracker);

/* 更新進度 */
uint64_t total_bytes = 1024 * 1024;  // 1 MB
uint64_t current_bytes = 512 * 1024;  // 512 KB
progress_tracker_update(tracker, current_bytes, total_bytes);

/* 打印進度條 */
progress_tracker_print_bar(tracker, 50);
// Output: [==========================>                       ] 50% | ...

/* 獲取詳細信息 */
progress_info_t info;
progress_tracker_get_info(tracker, &info);
printf("Speed: %u B/s\n", info.speed_bps);
printf("ETA: %u seconds\n", info.eta_ms / 1000);

/* 停止並清理 */
progress_tracker_stop(tracker);
progress_tracker_destroy(tracker);
```

## 協議格式

### HTTP/HTTPS 協議

#### 檢查更新請求

```
GET /api/firmware/check?device_id=DEVICE_001&version=1.0.0
Authorization: Bearer <api_key>
```

#### 檢查更新響應

```json
{
    "update_available": true,
    "version": "1.1.0",
    "size": 524288,
    "url": "https://cdn.example.com/firmware/v1.1.0.bin",
    "checksum": "a1b2c3d4...",
    "signature": "base64_encoded_signature",
    "timestamp": 1637654321,
    "description": "Bug fixes and performance improvements"
}
```

#### 狀態報告

```
POST /api/firmware/status?device_id=DEVICE_001
Content-Type: application/json

{
    "state": 5,
    "error_code": 0,
    "version": "1.1.0"
}
```

### MQTT 協議

#### 訂閱主題

- `ota/<device_id>/update` - 接收更新通知
- `ota/<device_id>/command` - 接收控制命令

#### 發布主題

- `ota/<device_id>/status` - 報告更新狀態
- `ota/<device_id>/progress` - 報告下載進度

## 錯誤碼

| 錯誤碼 | 名稱 | 說明 |
|--------|------|------|
| 0 | OTA_ERR_NONE | 成功 |
| -1 | OTA_ERR_INVALID_PARAM | 無效參數 |
| -2 | OTA_ERR_NETWORK | 網絡錯誤 |
| -3 | OTA_ERR_DOWNLOAD | 下載失敗 |
| -4 | OTA_ERR_VERIFY | 驗證失敗 |
| -5 | OTA_ERR_STORAGE | 存儲錯誤 |
| -6 | OTA_ERR_NO_MEMORY | 內存不足 |
| -7 | OTA_ERR_TIMEOUT | 超時 |
| -8 | OTA_ERR_PROTOCOL | 協議錯誤 |
| -9 | OTA_ERR_VERSION | 版本錯誤 |
| -10 | OTA_ERR_SIGNATURE | 簽名驗證失敗 |

## 狀態機

```
IDLE ──> CHECKING ──> DOWNLOADING ──> VERIFYING ──> UPDATING ──> SUCCESS
  ^         │              │              │              │            │
  │         v              v              v              v            v
  └──────FAILED/CANCELLED/ROLLBACK <─────┴──────────────┴────────────┘
```

## 編譯和測試

### 編譯

```bash
make
```

### 運行測試

```bash
make test
```

### 安裝

```bash
sudo make install
```

### 清理

```bash
make clean
```

## 依賴項

- **libcurl**: HTTP/HTTPS 下載
- **OpenSSL**: SHA256 校驗和數字簽名驗證
- **pthread**: 多線程支持

### 安裝依賴（Ubuntu/Debian）

```bash
sudo apt-get install libcurl4-openssl-dev libssl-dev
```

### 安裝依賴（CentOS/RHEL）

```bash
sudo yum install libcurl-devel openssl-devel
```

## 使用示例

### 完整的 OTA 更新流程

```c
#include "ota_protocol.h"
#include <stdio.h>

int main(void)
{
    /* 配置 OTA */
    ota_config_t config = {
        .protocol = OTA_PROTOCOL_HTTPS,
        .server_url = "https://ota.example.com",
        .server_port = 443,
        .device_id = "DEVICE_001",
        .api_key = "your_api_key",
        .timeout_ms = 30000,
        .retry_count = 3,
        .verify_signature = true
    };

    ota_context_t ctx;

    /* 初始化 */
    if (ota_protocol_init(&ctx, &config) != OTA_ERR_NONE) {
        fprintf(stderr, "Failed to initialize OTA\n");
        return 1;
    }

    /* 檢查更新 */
    ota_firmware_info_t firmware_info;
    int ret = ota_protocol_check_update(&ctx, "1.0.0", &firmware_info);

    if (ret == 0) {
        printf("New firmware found: %s\n", firmware_info.version);

        /* 下載固件 */
        const char *download_path = "/tmp/firmware_new.bin";
        ret = ota_protocol_download_firmware(&ctx, &firmware_info, download_path);

        if (ret == OTA_ERR_NONE) {
            /* 驗證固件 */
            ret = ota_protocol_verify_firmware(&ctx, download_path, &firmware_info);

            if (ret == OTA_ERR_NONE) {
                /* 執行更新 */
                ret = ota_protocol_perform_update(&ctx, download_path);

                if (ret == OTA_ERR_NONE) {
                    printf("OTA update completed successfully!\n");
                    ota_protocol_report_status(&ctx, OTA_STATE_SUCCESS, OTA_ERR_NONE);
                } else {
                    fprintf(stderr, "Update failed: %d\n", ret);
                    ota_protocol_report_status(&ctx, OTA_STATE_FAILED, ret);
                }
            } else {
                fprintf(stderr, "Verification failed: %d\n", ret);
            }
        } else {
            fprintf(stderr, "Download failed: %d\n", ret);
        }
    } else if (ret == 1) {
        printf("No update available\n");
    } else {
        fprintf(stderr, "Check update failed: %d\n", ret);
    }

    /* 清理 */
    ota_protocol_deinit(&ctx);

    return 0;
}
```

## 安全考慮

1. **傳輸安全**
   - 使用 HTTPS 加密傳輸
   - 驗證服務器證書
   - 使用 API 密鑰認證

2. **固件驗證**
   - SHA256 校驗和驗證
   - 數字簽名驗證（可選）
   - 版本號檢查

3. **錯誤處理**
   - 下載失敗自動重試
   - 驗證失敗拒絕更新
   - 更新失敗自動回滾

## 性能優化

1. **下載優化**
   - 斷點續傳減少重複下載
   - 分塊下載提高成功率
   - 並發下載提升速度

2. **內存優化**
   - 流式處理避免大內存佔用
   - 及時釋放資源
   - 使用內存池管理

3. **網絡優化**
   - 連接復用
   - 超時控制
   - 智能重試策略

## 故障排查

### 下載失敗

- 檢查網絡連接
- 驗證服務器 URL
- 檢查防火牆設置
- 增加超時時間

### 驗證失敗

- 確認固件完整下載
- 檢查校驗和是否正確
- 驗證證書配置

### 更新失敗

- 檢查存儲空間
- 驗證分區配置
- 查看錯誤日誌

## 版本歷史

- **v1.0.0** - 初始版本
  - 支持 HTTP/HTTPS 協議
  - 實現下載管理器
  - 實現進度跟踪器
  - 基礎安全驗證

## 許可證

MIT License

## 相關文檔

- [Delta Update](../delta-update/README.md) - 差分更新實現
- [Rollback System](../rollback-system/README.md) - 回滾系統實現
- [OTA Manager](../README.md) - OTA 管理器總覽
