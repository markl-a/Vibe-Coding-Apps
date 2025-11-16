# 📥 Update Client - 更新客戶端

## 概述

OTA 更新客戶端，負責從服務器下載韌體更新並觸發安裝流程。

## 功能特點

- ✅ HTTP/HTTPS 下載
- ✅ MQTT 推送通知
- ✅ 斷點續傳
- ✅ 進度回調
- ✅ 完整性驗證
- ✅ 更新調度

## 使用範例

```c
#include "update_client.h"

void check_for_updates(void)
{
    update_info_t info;

    // 檢查更新
    if (update_check_available(&info) == 0) {
        printf("New version: %s\n", info.version);
        printf("Size: %lu bytes\n", info.size);

        // 下載更新
        if (update_download(&info, progress_callback) == 0) {
            // 驗證並安裝
            update_install();
        }
    }
}

void progress_callback(uint32_t downloaded, uint32_t total)
{
    printf("Progress: %lu%%\n", (downloaded * 100) / total);
}
```

## 協議支援

- HTTP/HTTPS GET
- MQTT Subscribe
- CoAP Block Transfer
- 自定義協議

**狀態**: ✅ 可用
