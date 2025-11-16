# 📊 Partition Manager - 分區管理器

## 概述

Flash 分區管理系統，支援動態分區和分區表管理。

## 功能特點

- ✅ 分區表管理
- ✅ 動態分區創建
- ✅ 分區加密
- ✅ 分區完整性檢查
- ✅ 分區掛載/卸載

## 分區表定義

```c
typedef struct {
    char name[16];
    uint32_t offset;
    uint32_t size;
    uint8_t type;     // BOOTLOADER, APP, DATA, OTA等
    uint8_t flags;    // ENCRYPTED, READONLY等
} partition_entry_t;

const partition_entry_t partition_table[] = {
    {"bootloader", 0x00000000, 64*1024,  PART_TYPE_BOOTLOADER, 0},
    {"app",        0x00010000, 512*1024, PART_TYPE_APP,        0},
    {"ota",        0x00090000, 512*1024, PART_TYPE_OTA,        0},
    {"nvs",        0x00110000, 16*1024,  PART_TYPE_DATA,       PART_FLAG_ENCRYPTED},
    {"storage",    0x00114000, 240*1024, PART_TYPE_DATA,       0},
};
```

## 使用範例

```c
#include "partition_manager.h"

void partition_example(void)
{
    // 初始化分區管理器
    partition_mgr_init(partition_table, 5);

    // 查找分區
    partition_t *nvs = partition_find_by_name("nvs");
    if (nvs) {
        printf("NVS offset: 0x%08lx\n", nvs->offset);
        printf("NVS size: %lu KB\n", nvs->size / 1024);
    }

    // 讀寫分區
    uint8_t data[256];
    partition_read(nvs, 0, data, 256);
    partition_write(nvs, 0, data, 256);

    // 擦除分區
    partition_erase(nvs);
}
```

**狀態**: ✅ 可用
