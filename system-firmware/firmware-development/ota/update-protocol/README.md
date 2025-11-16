# 📡 Update Protocol - 更新協議

## 概述

定義 OTA 更新的通訊協議，支援 HTTP, MQTT, CoAP 等傳輸方式。

## 功能特點

- ✅ HTTP/HTTPS 更新
- ✅ MQTT 推送更新
- ✅ CoAP Block Transfer
- ✅ 斷點續傳
- ✅ 增量更新
- ✅ 多設備批量更新

## 協議格式

### 更新請求

```json
{
    "device_id": "ESP32_001",
    "current_version": "1.0.0",
    "hardware_version": "v2.0"
}
```

### 更新響應

```json
{
    "update_available": true,
    "version": "1.1.0",
    "url": "https://example.com/firmware.bin",
    "size": 524288,
    "checksum": "sha256:abcd1234...",
    "signature": "base64_signature",
    "release_notes": "Bug fixes and improvements"
}
```

## HTTP 更新範例

```c
#include "update_protocol.h"

void http_ota_update(void)
{
    update_request_t req = {
        .device_id = "ESP32_001",
        .current_version = "1.0.0",
    };

    update_response_t resp;

    // 檢查更新
    if (update_check_http("https://ota.example.com/check", &req, &resp) == 0) {
        if (resp.update_available) {
            printf("New version: %s\n", resp.version);

            // 下載更新
            update_download_http(resp.url, progress_callback);
        }
    }
}
```

## MQTT 更新範例

```c
void mqtt_ota_subscribe(void)
{
    mqtt_subscribe("ota/ESP32_001/update", ota_message_handler);
}

void ota_message_handler(const char *topic, const uint8_t *payload, size_t len)
{
    update_response_t resp;
    parse_update_response(payload, len, &resp);

    if (resp.update_available) {
        update_download_http(resp.url, NULL);
    }
}
```

**狀態**: ✅ 可用
