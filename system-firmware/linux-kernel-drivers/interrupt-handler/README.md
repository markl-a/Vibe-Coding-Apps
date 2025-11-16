# 中斷處理驅動 (Interrupt Handler Driver)

Linux 中斷處理機制範例，展示中斷驅動開發。

## 📋 專案簡介

此專案展示 Linux 中斷處理的完整機制，包括：
- 中斷註冊和釋放
- 頂半部（Top Half）處理
- 底半部（Bottom Half）處理
- Tasklet 機制
- Work Queue 機制
- 中斷統計

## 🎯 學習目標

- 理解 Linux 中斷處理架構
- 掌握中斷處理的兩階段模型
- 學習 Tasklet 和 Workqueue
- 了解中斷共享機制
- 實踐線程化中斷

## 🛠️ 編譯與使用

### 基本使用（演示模式）

```bash
make                # 編譯
make install        # 載入（無實際 IRQ）
make show-stats     # 查看統計
make uninstall      # 卸載
```

### 使用實際 IRQ

```bash
# 查看可用的中斷
cat /proc/interrupts

# 載入並指定 IRQ 號（謹慎使用！）
sudo insmod interrupt_example.ko irq_number=5
```

## 🔍 核心概念

### 1. 中斷處理函數

```c
static irqreturn_t irq_handler(int irq, void *dev_id)
{
    /* 頂半部：快速處理 */
    // 讀取硬體狀態
    // 清除中斷標誌
    // 調度底半部

    return IRQ_HANDLED;
}
```

### 2. 中斷註冊

```c
/* 標準中斷 */
request_irq(irq, handler, flags, name, dev_id);

/* 線程化中斷 */
request_threaded_irq(irq, handler, thread_fn, flags, name, dev_id);
```

### 3. 底半部機制

**Tasklet**（不能睡眠）
```c
tasklet_init(&my_tasklet, tasklet_func, data);
tasklet_schedule(&my_tasklet);
```

**Workqueue**（可以睡眠）
```c
INIT_WORK(&my_work, work_func);
schedule_work(&my_work);
```

## 📊 中斷處理流程

```
硬體中斷發生
    ↓
中斷處理器（頂半部）
    ├─ 快速處理
    ├─ 保存數據
    └─ 調度底半部
    ↓
底半部執行
    ├─ Tasklet（原子上下文）
    └─ Workqueue（進程上下文）
```

## ⚠️ 注意事項

### 頂半部限制

- 必須快速執行
- 不能睡眠
- 不能調用可能阻塞的函數
- 使用 spinlock 而非 mutex

### 底半部選擇

| 機制 | 上下文 | 能否睡眠 | 執行時機 |
|------|--------|----------|----------|
| Softirq | 原子 | 否 | 中斷返回時 |
| Tasklet | 原子 | 否 | 中斷返回時 |
| Workqueue | 進程 | 是 | 稍後調度 |

## 🔬 實際應用

### 網卡中斷

```c
static irqreturn_t eth_interrupt(int irq, void *dev_id)
{
    /* 頂半部：確認中斷並禁用 */
    // 讀取中斷狀態
    // 禁用進一步中斷
    // 調度 NAPI

    napi_schedule(&priv->napi);
    return IRQ_HANDLED;
}
```

### GPIO 中斷

```c
static irqreturn_t gpio_irq_handler(int irq, void *dev_id)
{
    /* 讀取 GPIO 狀態 */
    int value = gpio_get_value(gpio_num);

    /* 調度工作佇列處理 */
    schedule_work(&gpio_work);

    return IRQ_HANDLED;
}
```

## 📚 延伸閱讀

- [Linux Interrupt Handling](https://www.kernel.org/doc/html/latest/core-api/genericirq.html)
- [Deferred Work](https://www.kernel.org/doc/html/latest/core-api/workqueue.html)
- [Linux Device Drivers, Chapter 10](https://lwn.net/Kernel/LDD3/)

## 📝 授權

GPL v2
