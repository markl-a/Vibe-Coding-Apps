# ⚖️ Wear Leveling - 磨損均衡

## 概述

Flash 磨損均衡算法，延長 Flash 使用壽命。

## 功能特點

- ✅ 動態磨損均衡
- ✅ 靜態磨損均衡
- ✅ 壞塊管理
- ✅ 磨損統計
- ✅ 垃圾回收

## 使用範例

```c
#include "wear_leveling.h"

void wl_example(void)
{
    wl_handle_t wl;

    // 初始化磨損均衡
    wl_init(&wl, 0x08080000, 512 * 1024);

    // 寫入數據 (自動進行磨損均衡)
    uint8_t data[256] = "Data";
    wl_write(&wl, 0, data, 256);

    // 讀取數據
    uint8_t read_buf[256];
    wl_read(&wl, 0, read_buf, 256);

    // 獲取磨損統計
    wl_stats_t stats;
    wl_get_stats(&wl, &stats);
    printf("Max erase count: %lu\n", stats.max_erase_count);
    printf("Min erase count: %lu\n", stats.min_erase_count);
}
```

## 算法說明

### 動態均衡

- 將寫入操作分散到不同扇區
- 追蹤每個扇區的擦除次數
- 優先使用擦除次數少的扇區

### 靜態均衡

- 定期移動靜態數據
- 釋放長期未擦除的扇區
- 平衡整體磨損

**狀態**: ✅ 可用
