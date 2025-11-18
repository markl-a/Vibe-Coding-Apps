# 📊 Partition Manager - 分區管理器

## 概述

Flash 分區管理系統，提供完整的分區表管理、分區操作和掛載管理功能。支援多種分區類型和靈活的分區配置。

## 功能特點

- ✅ **分區表管理** - 創建、刪除、更新分區
- ✅ **多種分區類型** - 引導程序、應用、數據、OTA 等
- ✅ **分區標誌** - 只讀、加密、壓縮、可引導
- ✅ **掛載管理** - 分區掛載/卸載、掛載點管理
- ✅ **完整性檢查** - CRC32 校驗
- ✅ **序列化支援** - 保存/加載分區表
- ✅ **重疊檢測** - 自動檢測分區重疊
- ✅ **單元測試** - 完整測試覆蓋

## 架構設計

```
partition-manager/
├── partition_manager.h/c   # 分區管理器
├── partition_table.h/c     # 分區表管理
├── mount.h/c               # 掛載管理
├── test_partition.c        # 單元測試
├── Makefile                # 構建系統
└── README.md               # 本文件
```

## 分區類型

```c
typedef enum {
    PARTITION_TYPE_DATA = 0,    /* 通用數據分區 */
    PARTITION_TYPE_APP,         /* 應用程序代碼 */
    PARTITION_TYPE_FS,          /* 文件系統 */
    PARTITION_TYPE_BOOTLOADER,  /* 引導程序 */
    PARTITION_TYPE_CONFIG,      /* 配置數據 */
    PARTITION_TYPE_LOG,         /* 日誌數據 */
    PARTITION_TYPE_OTA,         /* OTA 更新 */
    PARTITION_TYPE_FACTORY,     /* 出廠數據 */
    PARTITION_TYPE_USER,        /* 用戶自定義 */
} partition_type_t;
```

## 分區標誌

```c
typedef enum {
    PARTITION_FLAG_NONE = 0,
    PARTITION_FLAG_READONLY = (1 << 0),     /* 只讀分區 */
    PARTITION_FLAG_ENCRYPTED = (1 << 1),    /* 加密分區 */
    PARTITION_FLAG_COMPRESSED = (1 << 2),   /* 壓縮分區 */
    PARTITION_FLAG_BOOT = (1 << 3),         /* 可引導分區 */
    PARTITION_FLAG_ACTIVE = (1 << 4),       /* 活動分區 */
} partition_flags_t;
```

## API 介面

### 分區管理器

```c
// 初始化
partition_mgr_ctx_t *partition_mgr_init(const partition_mgr_config_t *config);

// 清理
partition_status_t partition_mgr_deinit(partition_mgr_ctx_t *ctx);

// 加載分區表
partition_status_t partition_mgr_load_table(partition_mgr_ctx_t *ctx);

// 保存分區表
partition_status_t partition_mgr_save_table(partition_mgr_ctx_t *ctx);

// 創建分區
partition_status_t partition_mgr_create(partition_mgr_ctx_t *ctx,
                                        const char *name,
                                        partition_type_t type,
                                        uint32_t offset,
                                        uint32_t size,
                                        uint32_t flags);

// 刪除分區
partition_status_t partition_mgr_delete(partition_mgr_ctx_t *ctx,
                                        const char *name);

// 讀取分區
partition_status_t partition_mgr_read(partition_mgr_ctx_t *ctx,
                                      const char *name,
                                      uint32_t offset,
                                      uint8_t *data,
                                      uint32_t size);

// 寫入分區
partition_status_t partition_mgr_write(partition_mgr_ctx_t *ctx,
                                       const char *name,
                                       uint32_t offset,
                                       const uint8_t *data,
                                       uint32_t size);

// 擦除分區
partition_status_t partition_mgr_erase(partition_mgr_ctx_t *ctx,
                                       const char *name);

// 列出分區
void partition_mgr_list(partition_mgr_ctx_t *ctx);
```

### 分區表

```c
// 初始化分區表
partition_table_ctx_t *partition_table_init(uint32_t flash_size);

// 添加分區
partition_status_t partition_table_add(partition_table_ctx_t *ctx,
                                       const partition_entry_t *entry);

// 移除分區
partition_status_t partition_table_remove(partition_table_ctx_t *ctx,
                                          const char *name);

// 查找分區
partition_status_t partition_table_find(partition_table_ctx_t *ctx,
                                        const char *name,
                                        partition_entry_t *entry);

// 驗證分區表
partition_status_t partition_table_validate(partition_table_ctx_t *ctx);

// 序列化
size_t partition_table_serialize(partition_table_ctx_t *ctx,
                                 uint8_t *buffer,
                                 size_t size);

// 反序列化
partition_status_t partition_table_deserialize(partition_table_ctx_t *ctx,
                                               const uint8_t *buffer,
                                               size_t size);
```

### 掛載管理

```c
// 初始化掛載管理器
mount_mgr_ctx_t *mount_mgr_init(void);

// 掛載分區
partition_status_t mount_partition(mount_mgr_ctx_t *ctx,
                                   const char *partition_name,
                                   const char *mount_path,
                                   uint32_t flags);

// 卸載分區
partition_status_t unmount_partition(mount_mgr_ctx_t *ctx,
                                     const char *mount_path);

// 檢查是否已掛載
bool is_partition_mounted(mount_mgr_ctx_t *ctx,
                          const char *partition_name);

// 列出掛載點
void list_mount_points(mount_mgr_ctx_t *ctx);

// 卸載所有分區
partition_status_t unmount_all(mount_mgr_ctx_t *ctx);
```

## 使用範例

### 基本分區管理

```c
#include "partition_manager.h"

// Flash 操作回調
static partition_status_t flash_read_cb(uint32_t addr, uint8_t *data, uint32_t size) {
    return flash_read(addr, data, size);
}

static partition_status_t flash_write_cb(uint32_t addr, const uint8_t *data, uint32_t size) {
    return flash_write(addr, data, size);
}

static partition_status_t flash_erase_cb(uint32_t addr, uint32_t size) {
    return flash_erase(addr, size);
}

static const partition_flash_ops_t flash_ops = {
    .read = flash_read_cb,
    .write = flash_write_cb,
    .erase = flash_erase_cb,
};

void partition_example(void)
{
    // 配置
    partition_mgr_config_t config = {
        .flash_size = 1024 * 1024,      // 1MB
        .partition_table_offset = 0,     // 分區表位置
        .flash_ops = &flash_ops,
    };

    // 初始化
    partition_mgr_ctx_t *mgr = partition_mgr_init(&config);

    // 創建分區
    partition_mgr_create(mgr, "bootloader",
                        PARTITION_TYPE_BOOTLOADER,
                        0x1000, 64 * 1024,
                        PARTITION_FLAG_READONLY);

    partition_mgr_create(mgr, "app",
                        PARTITION_TYPE_APP,
                        0x11000, 512 * 1024,
                        PARTITION_FLAG_NONE);

    partition_mgr_create(mgr, "data",
                        PARTITION_TYPE_DATA,
                        0x91000, 256 * 1024,
                        PARTITION_FLAG_NONE);

    // 保存分區表到 Flash
    partition_mgr_save_table(mgr);

    // 列出所有分區
    partition_mgr_list(mgr);

    // 清理
    partition_mgr_deinit(mgr);
}
```

### 讀寫分區

```c
void partition_read_write_example(partition_mgr_ctx_t *mgr)
{
    uint8_t write_data[256];
    uint8_t read_data[256];

    // 準備數據
    for (int i = 0; i < 256; i++) {
        write_data[i] = i;
    }

    // 寫入到數據分區
    partition_status_t status = partition_mgr_write(mgr, "data", 0,
                                                    write_data, 256);
    if (status == PART_OK) {
        printf("寫入成功\n");
    }

    // 從數據分區讀取
    status = partition_mgr_read(mgr, "data", 0, read_data, 256);
    if (status == PART_OK) {
        printf("讀取成功\n");
    }

    // 擦除數據分區
    status = partition_mgr_erase(mgr, "data");
    if (status == PART_OK) {
        printf("擦除成功\n");
    }
}
```

### 分區掛載

```c
void partition_mount_example(void)
{
    // 初始化掛載管理器
    mount_mgr_ctx_t *mount_mgr = mount_mgr_init();

    // 掛載引導程序分區為只讀
    mount_partition(mount_mgr, "bootloader", "/boot",
                   MOUNT_FLAG_READONLY);

    // 掛載數據分區
    mount_partition(mount_mgr, "data", "/data",
                   MOUNT_FLAG_NONE);

    // 列出所有掛載點
    list_mount_points(mount_mgr);

    // 輸出示例:
    // ========================================
    //   Mount Points
    // ========================================
    //
    // Partition        Mount Path       Flags    Reads      Writes
    // ---------------- ---------------- -------- ---------- ----------
    // bootloader       /boot            RO              10          0
    // data             /data            RW             100         50

    // 卸載分區
    unmount_partition(mount_mgr, "/boot");

    // 清理
    mount_mgr_deinit(mount_mgr);
}
```

### 加載現有分區表

```c
void load_partition_table_example(partition_mgr_ctx_t *mgr)
{
    // 從 Flash 加載分區表
    partition_status_t status = partition_mgr_load_table(mgr);

    if (status == PART_OK) {
        printf("分區表加載成功\n");

        // 檢查分區是否存在
        if (partition_mgr_exists(mgr, "app")) {
            // 獲取分區信息
            partition_entry_t entry;
            partition_mgr_get_info(mgr, "app", &entry);

            printf("App 分區:\n");
            printf("  偏移: 0x%08X\n", entry.offset);
            printf("  大小: %u KB\n", entry.size / 1024);
            printf("  類型: %s\n", partition_type_to_string(entry.type));
        }
    }
}
```

## 典型分區佈局

### 基本佈局（1MB Flash）

```
+------------------+ 0x00000000
| 分區表 (4KB)     |
+------------------+ 0x00001000
| Bootloader (64KB)|
+------------------+ 0x00011000
| App (512KB)      |
+------------------+ 0x00091000
| Data (256KB)     |
+------------------+ 0x000D1000
| OTA (256KB)      |
+------------------+ 0x00111000
| Reserved         |
+------------------+ 0x00100000
```

### OTA 佈局（2MB Flash）

```
+------------------+ 0x00000000
| 分區表 (4KB)     |
+------------------+ 0x00001000
| Bootloader (64KB)|
+------------------+ 0x00011000
| App 1 (896KB)    |
+------------------+ 0x000F1000
| App 2 (896KB)    |
+------------------+ 0x001D1000
| Config (16KB)    |
+------------------+ 0x001D5000
| Data (172KB)     |
+------------------+ 0x00200000
```

## 構建和測試

### 編譯

```bash
make
```

### 運行測試

```bash
make test
```

### 檢查記憶體洩漏

```bash
make memcheck
```

## 最佳實踐

### 分區大小對齊

將分區大小對齊到塊邊界（通常 4KB）：

```c
#define ALIGN_TO_BLOCK(size) (((size) + 4095) & ~4095)

partition_mgr_create(mgr, "data",
                    PARTITION_TYPE_DATA,
                    offset,
                    ALIGN_TO_BLOCK(256 * 1024),
                    flags);
```

### 保留空間

為分區表和未來擴展保留一些空間：

```c
#define PARTITION_TABLE_SIZE (4 * 1024)     // 4KB
#define RESERVED_SIZE (16 * 1024)           // 16KB

// 第一個分區從 PARTITION_TABLE_SIZE 之後開始
uint32_t first_partition_offset = PARTITION_TABLE_SIZE;
```

### 只讀保護

將關鍵分區標記為只讀：

```c
// 引導程序應該是只讀的
partition_mgr_create(mgr, "bootloader",
                    PARTITION_TYPE_BOOTLOADER,
                    offset, size,
                    PARTITION_FLAG_READONLY);

// 出廠數據也應該是只讀的
partition_mgr_create(mgr, "factory",
                    PARTITION_TYPE_FACTORY,
                    offset, size,
                    PARTITION_FLAG_READONLY);
```

### 驗證分區表

在使用前驗證分區表的完整性：

```c
partition_status_t status = partition_mgr_load_table(mgr);

if (status != PART_OK) {
    printf("分區表損壞，使用默認配置\n");
    // 創建默認分區
    create_default_partitions(mgr);
    // 保存新的分區表
    partition_mgr_save_table(mgr);
}
```

## 注意事項

1. **分區表位置**: 通常放在 Flash 開始處，便於引導程序訪問
2. **重疊檢測**: 創建分區時自動檢查重疊，確保分區不會相互覆蓋
3. **CRC 校驗**: 使用 CRC32 驗證分區表完整性
4. **原子更新**: 更新分區表時應該是原子性的，防止部分寫入
5. **版本控制**: 分區表包含版本號，便於未來升級

## 故障排除

### 分區表損壞

```c
// 檢測到損壞時重建分區表
if (partition_mgr_load_table(mgr) != PART_OK) {
    printf("分區表損壞，重建中...\n");
    create_default_partitions(mgr);
    partition_mgr_save_table(mgr);
}
```

### 分區重疊

創建分區時會自動檢測重疊：

```c
partition_status_t status = partition_mgr_create(...);
if (status == PART_OVERLAP) {
    printf("錯誤：分區與現有分區重疊\n");
}
```

### 空間不足

```c
uint32_t free_space = partition_mgr_get_free_space(mgr);
if (free_space < required_size) {
    printf("空間不足：需要 %u 字節，可用 %u 字節\n",
           required_size, free_space);
}
```

## 未來改進

- [ ] 支援動態分區調整大小
- [ ] 實現分區加密
- [ ] 添加分區完整性自動修復
- [ ] 支援分區快照
- [ ] 實現分區配額管理

## 相關模組

- **Flash Driver** - 底層 Flash 操作
- **Wear Leveling** - 可在分區之上使用
- **File System** - 可掛載到分區上

## 許可證

MIT License

**狀態**: ✅ 完成並經過測試
