# ⚖️ Wear Leveling - 磨損均衡

## 概述

Flash 磨損均衡算法實現，通過智能分配寫入操作來延長 Flash 使用壽命。支援動態和靜態磨損均衡策略。

## 功能特點

- ✅ **動態磨損均衡** - 實時分散寫入操作
- ✅ **靜態磨損均衡** - 定期重新分配數據
- ✅ **混合策略** - 結合動態和靜態均衡
- ✅ **塊映射表** - 邏輯到物理地址轉換
- ✅ **垃圾回收** - 自動回收過時數據
- ✅ **壞塊管理** - 識別並避免壞塊
- ✅ **詳細統計** - 擦除次數、性能指標
- ✅ **單元測試** - 完整測試覆蓋

## 架構設計

```
wear-leveling/
├── wear_leveling.h/c       # 主磨損均衡算法
├── block_mapping.h/c       # 塊映射表管理
├── statistics.h/c          # 統計信息收集
├── test_wear_leveling.c    # 單元測試
├── Makefile                # 構建系統
└── README.md               # 本文件
```

## 核心概念

### 邏輯與物理地址

- **邏輯地址**: 應用程序看到的地址空間
- **物理地址**: 實際 Flash 的地址
- **映射表**: 維護邏輯到物理的轉換關係

### 擦除次數追蹤

每個物理塊都有一個擦除計數器，用於：
- 監控塊的磨損程度
- 選擇最少使用的塊進行分配
- 觸發靜態磨損均衡

### 塊狀態

- **FREE**: 已擦除，可用於分配
- **ACTIVE**: 正在使用中
- **DIRTY**: 包含過時數據，待回收
- **BAD**: 損壞的塊，不再使用

## API 介面

### 主 API

```c
// 初始化磨損均衡
wl_ctx_t *wl_init(const wl_config_t *config);

// 清理資源
wl_status_t wl_deinit(wl_ctx_t *ctx);

// 讀取數據
wl_status_t wl_read(wl_ctx_t *ctx, uint32_t logical_addr,
                    uint8_t *data, uint32_t size);

// 寫入數據（自動處理磨損均衡）
wl_status_t wl_write(wl_ctx_t *ctx, uint32_t logical_addr,
                     const uint8_t *data, uint32_t size);

// 擦除塊
wl_status_t wl_erase(wl_ctx_t *ctx, uint32_t logical_addr);

// 觸發垃圾回收
wl_status_t wl_garbage_collect(wl_ctx_t *ctx);

// 執行磨損均衡
wl_status_t wl_perform_leveling(wl_ctx_t *ctx);

// 獲取統計信息
wl_status_t wl_get_statistics(wl_ctx_t *ctx, void *stats);

// 格式化 Flash
wl_status_t wl_format(wl_ctx_t *ctx);
```

### 塊映射 API

```c
// 初始化塊映射表
block_map_ctx_t *block_map_init(const block_map_config_t *config);

// 獲取物理塊
block_map_status_t block_map_get_physical(block_map_ctx_t *ctx,
                                          uint32_t logical_block,
                                          uint32_t *physical_block);

// 分配空閒塊
block_map_status_t block_map_allocate_block(block_map_ctx_t *ctx,
                                            uint32_t *physical_block);

// 標記塊為髒塊
block_map_status_t block_map_mark_dirty(block_map_ctx_t *ctx,
                                        uint32_t physical_block);

// 增加擦除計數
block_map_status_t block_map_increment_erase_count(block_map_ctx_t *ctx,
                                                   uint32_t physical_block);
```

### 統計 API

```c
// 初始化統計模塊
wl_stats_ctx_t *wl_stats_init(uint32_t total_blocks);

// 記錄讀取操作
void wl_stats_record_read(wl_stats_ctx_t *ctx, uint32_t bytes);

// 記錄寫入操作
void wl_stats_record_write(wl_stats_ctx_t *ctx, uint32_t bytes);

// 記錄擦除操作
void wl_stats_record_erase(wl_stats_ctx_t *ctx);

// 記錄垃圾回收
void wl_stats_record_gc(wl_stats_ctx_t *ctx, uint32_t duration_ms);

// 計算效率
float wl_stats_calculate_efficiency(wl_stats_ctx_t *ctx);

// 估算剩餘壽命
uint64_t wl_stats_estimate_lifetime(wl_stats_ctx_t *ctx, uint32_t max_erase_cycles);
```

## 使用範例

### 基本使用

```c
#include "wear_leveling.h"

// Flash 操作回調
static wl_status_t flash_read_cb(uint32_t addr, uint8_t *data, uint32_t size) {
    return flash_read(addr, data, size);
}

static wl_status_t flash_write_cb(uint32_t addr, const uint8_t *data, uint32_t size) {
    return flash_write(addr, data, size);
}

static wl_status_t flash_erase_cb(uint32_t addr) {
    return flash_erase_sector(addr);
}

static const wl_flash_ops_t flash_ops = {
    .read = flash_read_cb,
    .write = flash_write_cb,
    .erase = flash_erase_cb,
};

void wear_leveling_example(void)
{
    // 配置
    wl_config_t config = {
        .total_size = 512 * 1024,      // 512KB
        .block_size = 4096,            // 4KB 塊
        .reserved_blocks = 4,          // 保留 4 個塊
        .strategy = WL_STRATEGY_HYBRID,
        .gc_threshold = 4,             // 4 個髒塊觸發 GC
        .wl_threshold = 10,            // 擦除次數差 10 觸發均衡
        .flash_ops = &flash_ops,
    };

    // 初始化
    wl_ctx_t *wl = wl_init(&config);

    // 格式化 Flash
    wl_format(wl);

    // 寫入數據
    uint8_t data[256];
    for (int i = 0; i < 256; i++) {
        data[i] = i;
    }
    wl_write(wl, 0, data, 256);

    // 讀取數據
    uint8_t read_buf[256];
    wl_read(wl, 0, read_buf, 256);

    // 獲取統計
    wl_statistics_t stats;
    wl_get_statistics(wl, &stats);

    printf("讀取: %llu 次\n", stats.read_count);
    printf("寫入: %llu 次\n", stats.write_count);
    printf("擦除: %llu 次\n", stats.erase_count);
    printf("最小擦除次數: %u\n", stats.min_erase_count);
    printf("最大擦除次數: %u\n", stats.max_erase_count);
    printf("效率: %.2f%%\n", wl_stats_calculate_efficiency(wl->stats));

    // 清理
    wl_deinit(wl);
}
```

### 自動垃圾回收

```c
// 寫入操作會自動觸發 GC
for (int i = 0; i < 100; i++) {
    wl_write(wl, i * 256, data, 256);
    // 當髒塊達到閾值時自動執行 GC
}

// 手動觸發 GC
wl_garbage_collect(wl);
```

### 查看狀態

```c
// 打印詳細狀態
wl_print_status(wl);

// 輸出示例:
// ========================================
//   Wear Leveling Statistics
// ========================================
//
// Operation Counters:
//   Read operations:      1000
//   Write operations:     500
//   Erase operations:     50
//   Garbage collections:  10
//   Wear level ops:       5
```

## 算法說明

### 動態磨損均衡

1. 每次寫入操作選擇擦除次數最少的空閒塊
2. 分散寫入操作到不同的物理塊
3. 避免重複使用相同的塊

### 靜態磨損均衡

1. 監控擦除次數差異（delta）
2. 當 delta 超過閾值時觸發
3. 將高擦除次數塊的數據移到低擦除次數塊
4. 釋放高擦除次數塊供後續使用

### 垃圾回收

1. 當髒塊數量達到閾值時觸發
2. 擦除所有髒塊
3. 將它們標記為空閒狀態
4. 更新擦除計數

## 構建和測試

### 編譯

```bash
make
```

### 運行測試

```bash
make test
```

### 性能測試

```bash
# 使用 valgrind 檢查內存洩漏
make memcheck

# 生成代碼覆蓋率報告
make coverage
```

## 性能指標

### 寫入放大

寫入放大 = 實際 Flash 寫入量 / 邏輯寫入量

典型值：1.1x - 1.5x（取決於工作負載）

### 磨損均衡效率

效率 = (1 - delta / max_erase_count) × 100%

- 100%：完美均衡（所有塊擦除次數相同）
- 80-95%：良好均衡
- < 80%：需要優化

### 垃圾回收開銷

- 平均 GC 時間：< 50ms（4KB 塊）
- 觸發頻率：根據寫入模式調整閾值

## 配置建議

### 保留塊數量

- 最少：2-3 個（最小 GC 開銷）
- 推薦：5-10%（較好性能）
- 較多：15-20%（最佳壽命）

### GC 閾值

- 低閾值（2-3）：頻繁 GC，低延遲
- 中閾值（4-8）：平衡性能和空間
- 高閾值（10+）：少 GC，可能空間不足

### 磨損均衡閾值

- 低閾值（5-10）：積極均衡，更多開銷
- 中閾值（10-20）：平衡方案
- 高閾值（30+）：被動均衡，可能不均勻

## 注意事項

1. **掉電保護**: 寫入操作應該是原子性的
2. **映射表持久化**: 定期保存映射表到 Flash
3. **壞塊處理**: 檢測並隔離壞塊
4. **性能影響**: GC 和磨損均衡會增加延遲
5. **空間開銷**: 需要預留空間用於映射表和保留塊

## 未來改進

- [ ] 支援多分區磨損均衡
- [ ] 添加寫入緩存
- [ ] 實現增量 GC
- [ ] 支援 NAND Flash
- [ ] 添加斷電恢復機制

## 相關模組

- **Flash Driver** - 底層 Flash 操作
- **Partition Manager** - 配合分區管理使用
- **File System** - 可作為文件系統的後端

## 許可證

MIT License

**狀態**: ✅ 完成並經過測試
