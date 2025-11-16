# ⚙️ Configuration Manager - 配置管理器

## 概述

提供非易失性配置存儲、讀取和管理功能，支持多種存儲後端。

## 功能特點

- ✅ Flash 存儲支援
- ✅ EEPROM 存儲支援
- ✅ JSON/Binary 格式
- ✅ CRC 完整性保護
- ✅ 默認值管理
- ✅ 配置版本控制

## API 示例

```c
// 讀取配置
config_t config;
if (config_read(&config) == 0) {
    printf("Device ID: %s\n", config.device_id);
}

// 寫入配置
config.network.port = 8080;
strcpy(config.network.ssid, "MyWiFi");
config_write(&config);

// 恢復默認
config_reset_to_defaults();
```

## 配置結構

```c
typedef struct {
    char device_id[32];
    struct {
        char ssid[64];
        char password[64];
        uint16_t port;
    } network;
    struct {
        uint8_t enabled;
        uint32_t interval_ms;
    } logging;
    uint32_t crc32;
} config_t;
```

**狀態**: ✅ 可用
