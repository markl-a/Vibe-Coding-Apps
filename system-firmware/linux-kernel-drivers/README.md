# 🐧 Linux Kernel & Drivers 開發
> 使用 AI 驅動的方法進行 Linux 核心與驅動程式開發

⚠️ **驗證階段專案** - 此領域目前處於研究與開發階段

## 📋 專案概述

Linux Kernel 是現代計算的核心，從伺服器到嵌入式設備無處不在。本專案展示如何使用 AI 輔助工具來開發 Linux 核心模組、驅動程式和子系統，提升開發效率和代碼品質。

## 🎯 開發領域

### 1. 字元設備驅動 (Character Device Drivers)
- **基礎字元驅動**
  - file_operations 結構實作
  - open/close/read/write 操作
  - ioctl 命令處理
  - poll/select 機制

- **進階功能**
  - 非阻塞 I/O
  - 異步通知 (fasync)
  - 記憶體映射 (mmap)
  - 多設備支援

### 2. 塊設備驅動 (Block Device Drivers)
- **塊設備基礎**
  - request_queue 管理
  - bio 請求處理
  - I/O 調度器
  - 扇區讀寫

- **儲存驅動**
  - RAM disk 驅動
  - Flash 存儲驅動
  - NVMe 驅動
  - 虛擬塊設備

### 3. 網路設備驅動
- **網路驅動開發**
  - net_device 結構
  - 數據包發送接收
  - 網路統計資訊
  - NAPI 輪詢機制

- **協定實作**
  - Ethernet 驅動
  - Wi-Fi 驅動基礎
  - 虛擬網路設備
  - 網路過濾器

### 4. USB 驅動程式
- **USB 核心**
  - USB 總線驅動
  - URB (USB Request Block)
  - 端點配置
  - 描述符解析

- **USB 設備類別**
  - USB Serial 驅動
  - USB Storage 驅動
  - HID (人機介面設備)
  - USB Camera 驅動

### 5. PCI/PCIe 驅動
- **PCI 子系統**
  - PCI 設備掃描
  - 配置空間訪問
  - 記憶體/IO 資源映射
  - 中斷處理

- **PCIe 進階功能**
  - MSI/MSI-X 中斷
  - DMA 傳輸
  - 電源管理
  - 熱插拔支援

### 6. I2C/SPI 驅動
- **I2C 驅動**
  - I2C 適配器驅動
  - I2C 設備驅動
  - SMBus 協議
  - 設備樹綁定

- **SPI 驅動**
  - SPI 主機驅動
  - SPI 設備驅動
  - 傳輸模式配置
  - DMA 傳輸支援

### 7. Kernel 子系統開發
- **檔案系統**
  - VFS (虛擬檔案系統)
  - 自定義檔案系統
  - Procfs/Sysfs 介面
  - Debugfs 除錯介面

- **記憶體管理**
  - slab/slub 分配器
  - 頁面分配
  - vmalloc 區域
  - CMA (連續記憶體分配)

- **排程器**
  - CFS (完全公平調度器)
  - 即時排程
  - CPU 親和性
  - cgroup 整合

### 8. 核心除錯與優化
- **除錯技術**
  - printk 與日誌級別
  - kgdb 核心除錯
  - ftrace 函數追蹤
  - kprobe 動態探測

- **性能優化**
  - perf 性能分析
  - lockdep 鎖依賴檢測
  - KASAN (地址消毒器)
  - 熱點函數優化

## 🛠️ 技術棧

### 開發語言
- **C** - Kernel 主要語言
- **Assembly** - 架構相關代碼
- **Rust** - 實驗性 Kernel 支援
- **Python** - 測試腳本和工具

### 開發工具
- **GCC/Clang** - 編譯器
- **Make/Kbuild** - 建構系統
- **GDB/kgdb** - 除錯器
- **QEMU** - 虛擬化測試
- **Git** - 版本控制

### 分析工具
- **perf** - 性能分析
- **ftrace** - 函數追蹤
- **strace** - 系統調用追蹤
- **valgrind** - 記憶體檢測
- **sparse** - 靜態分析

## 🚀 快速開始

### 1. 建置開發環境

```bash
# 安裝開發工具 (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install build-essential libncurses-dev bison flex \
    libssl-dev libelf-dev git fakeroot bc dwarves

# 下載 Linux Kernel 源碼
git clone https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git
cd linux

# 或下載穩定版本
wget https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-6.6.tar.xz
tar xf linux-6.6.tar.xz
cd linux-6.6
```

### 2. 配置與編譯核心

```bash
# 使用當前系統配置
make defconfig

# 或使用圖形化配置
make menuconfig

# 編譯核心
make -j$(nproc)

# 編譯模組
make modules

# 安裝模組
sudo make modules_install

# 安裝核心
sudo make install
```

### 3. 開發簡單字元驅動

```c
// simple_char_driver.c
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/uaccess.h>

#define DEVICE_NAME "simple_char"
#define BUF_SIZE 1024

static dev_t dev_num;
static struct cdev simple_cdev;
static char kernel_buffer[BUF_SIZE];

static int device_open(struct inode *inode, struct file *file)
{
    pr_info("simple_char: Device opened\n");
    return 0;
}

static int device_release(struct inode *inode, struct file *file)
{
    pr_info("simple_char: Device closed\n");
    return 0;
}

static ssize_t device_read(struct file *file, char __user *user_buffer,
                          size_t len, loff_t *offset)
{
    size_t bytes_to_read = min(len, (size_t)(BUF_SIZE - *offset));

    if (bytes_to_read == 0)
        return 0;

    if (copy_to_user(user_buffer, kernel_buffer + *offset, bytes_to_read))
        return -EFAULT;

    *offset += bytes_to_read;
    return bytes_to_read;
}

static ssize_t device_write(struct file *file, const char __user *user_buffer,
                           size_t len, loff_t *offset)
{
    size_t bytes_to_write = min(len, (size_t)(BUF_SIZE - *offset));

    if (bytes_to_write == 0)
        return -ENOSPC;

    if (copy_from_user(kernel_buffer + *offset, user_buffer, bytes_to_write))
        return -EFAULT;

    *offset += bytes_to_write;
    return bytes_to_write;
}

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = device_open,
    .release = device_release,
    .read = device_read,
    .write = device_write,
};

static int __init simple_char_init(void)
{
    int ret;

    // 分配設備號
    ret = alloc_chrdev_region(&dev_num, 0, 1, DEVICE_NAME);
    if (ret < 0) {
        pr_err("simple_char: Failed to allocate device number\n");
        return ret;
    }

    // 初始化並添加字元設備
    cdev_init(&simple_cdev, &fops);
    simple_cdev.owner = THIS_MODULE;

    ret = cdev_add(&simple_cdev, dev_num, 1);
    if (ret < 0) {
        unregister_chrdev_region(dev_num, 1);
        pr_err("simple_char: Failed to add cdev\n");
        return ret;
    }

    pr_info("simple_char: Module loaded with major number %d\n", MAJOR(dev_num));
    return 0;
}

static void __exit simple_char_exit(void)
{
    cdev_del(&simple_cdev);
    unregister_chrdev_region(dev_num, 1);
    pr_info("simple_char: Module unloaded\n");
}

module_init(simple_char_init);
module_exit(simple_char_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("AI-Assisted Developer");
MODULE_DESCRIPTION("Simple Character Device Driver");
MODULE_VERSION("1.0");
```

### 4. Makefile 配置

```makefile
# Makefile
obj-m += simple_char_driver.o

KDIR := /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
	make -C $(KDIR) M=$(PWD) modules

clean:
	make -C $(KDIR) M=$(PWD) clean

install:
	sudo insmod simple_char_driver.ko

uninstall:
	sudo rmmod simple_char_driver

test:
	@echo "Testing driver..."
	@sudo mknod /dev/simple_char c $(shell cat /proc/devices | grep simple_char | awk '{print $$1}') 0
	@echo "Hello from userspace" | sudo tee /dev/simple_char
	@sudo cat /dev/simple_char
```

## 📚 開發範例

### 範例 1: 中斷處理

```c
#include <linux/interrupt.h>

#define IRQ_NUMBER 11

static irqreturn_t irq_handler(int irq, void *dev_id)
{
    pr_info("Interrupt handled: IRQ %d\n", irq);

    // 處理中斷

    return IRQ_HANDLED;
}

static int __init irq_example_init(void)
{
    int ret;

    ret = request_irq(IRQ_NUMBER, irq_handler, IRQF_SHARED,
                     "irq_example", (void *)irq_handler);
    if (ret) {
        pr_err("Failed to request IRQ %d\n", IRQ_NUMBER);
        return ret;
    }

    pr_info("IRQ %d handler registered\n", IRQ_NUMBER);
    return 0;
}

static void __exit irq_example_exit(void)
{
    free_irq(IRQ_NUMBER, (void *)irq_handler);
    pr_info("IRQ handler unregistered\n");
}
```

### 範例 2: 工作佇列 (Workqueue)

```c
#include <linux/workqueue.h>

static struct workqueue_struct *my_wq;
static struct work_struct my_work;

static void work_handler(struct work_struct *work)
{
    pr_info("Work handler executed\n");
    // 執行耗時操作
}

static int __init wq_example_init(void)
{
    my_wq = create_singlethread_workqueue("my_wq");
    if (!my_wq)
        return -ENOMEM;

    INIT_WORK(&my_work, work_handler);

    // 排程工作
    queue_work(my_wq, &my_work);

    return 0;
}

static void __exit wq_example_exit(void)
{
    flush_workqueue(my_wq);
    destroy_workqueue(my_wq);
}
```

### 範例 3: DMA 操作

```c
#include <linux/dma-mapping.h>

static int setup_dma(struct device *dev)
{
    dma_addr_t dma_handle;
    void *cpu_addr;
    size_t size = PAGE_SIZE;

    // 分配 DMA 一致性記憶體
    cpu_addr = dma_alloc_coherent(dev, size, &dma_handle, GFP_KERNEL);
    if (!cpu_addr) {
        pr_err("DMA allocation failed\n");
        return -ENOMEM;
    }

    pr_info("DMA buffer allocated at physical address 0x%llx\n",
            (unsigned long long)dma_handle);

    // 使用 DMA 緩衝區
    // ...

    // 釋放 DMA 記憶體
    dma_free_coherent(dev, size, cpu_addr, dma_handle);

    return 0;
}
```

### 範例 4: Sysfs 介面

```c
#include <linux/sysfs.h>
#include <linux/kobject.h>

static struct kobject *example_kobj;
static int example_value = 0;

static ssize_t value_show(struct kobject *kobj, struct kobj_attribute *attr,
                         char *buf)
{
    return sprintf(buf, "%d\n", example_value);
}

static ssize_t value_store(struct kobject *kobj, struct kobj_attribute *attr,
                          const char *buf, size_t count)
{
    sscanf(buf, "%d", &example_value);
    return count;
}

static struct kobj_attribute value_attribute =
    __ATTR(value, 0664, value_show, value_store);

static int __init sysfs_example_init(void)
{
    int ret;

    // 創建 kobject
    example_kobj = kobject_create_and_add("example", kernel_kobj);
    if (!example_kobj)
        return -ENOMEM;

    // 創建 sysfs 文件
    ret = sysfs_create_file(example_kobj, &value_attribute.attr);
    if (ret)
        kobject_put(example_kobj);

    return ret;
}

// 訪問方式: cat /sys/kernel/example/value
//          echo 123 > /sys/kernel/example/value
```

## 🤖 AI 輔助開發策略

### 1. 程式碼理解
```
"解釋 Linux kernel 中的 spinlock 和 mutex 的區別和使用場景"
"kmalloc 和 vmalloc 的內部實現有什麼不同？"
"解釋 copy_to_user 為什麼必須使用而不能用 memcpy"
```

### 2. 驅動程式生成
```
"生成一個 I2C 設備驅動的基本框架"
"創建一個支援 ioctl 的字元設備驅動範例"
"生成 PCI 設備驅動的初始化代碼"
```

### 3. 除錯協助
```
"分析這個 kernel panic 堆疊，找出可能的空指針解引用位置"
"這個 'sleeping function called from invalid context' 錯誤是什麼原因？"
"如何使用 ftrace 追蹤特定函數的調用路徑？"
```

### 4. 性能優化
```
"這段驅動程式的記憶體分配可以如何優化？"
"如何減少中斷處理的延遲？"
"解釋如何使用 per-CPU 變數提升性能"
```

## 📊 專案結構

```
linux-kernel-drivers/
├── README.md
├── examples/
│   ├── char-device/          # 字元設備範例
│   │   ├── simple_char.c
│   │   ├── ioctl_example.c
│   │   └── Makefile
│   ├── block-device/         # 塊設備範例
│   │   ├── ramdisk.c
│   │   └── Makefile
│   ├── network/              # 網路驅動範例
│   │   ├── virtual_net.c
│   │   └── Makefile
│   ├── usb/                  # USB 驅動範例
│   │   ├── usb_serial.c
│   │   └── Makefile
│   ├── i2c-spi/             # I2C/SPI 驅動
│   │   ├── i2c_device.c
│   │   ├── spi_device.c
│   │   └── Makefile
│   └── platform/            # 平台驅動
│       ├── platform_device.c
│       └── Makefile
├── docs/
│   ├── kernel-build.md       # Kernel 編譯指南
│   ├── driver-development.md # 驅動開發文檔
│   ├── debugging-guide.md    # 除錯指南
│   └── coding-style.md       # 編碼規範
├── scripts/
│   ├── build-kernel.sh       # 核心編譯腳本
│   ├── load-module.sh        # 模組載入腳本
│   └── test-driver.sh        # 驅動測試腳本
└── tools/
    ├── kernel-debugger/      # Kernel 除錯工具
    ├── module-analyzer/      # 模組分析器
    └── patch-generator/      # 補丁生成工具
```

## 🧪 開發路線圖

### Phase 1: 基礎驅動 ✅
- [x] 簡單字元設備
- [x] 基本模組載入
- [x] printk 日誌
- [x] procfs 介面

### Phase 2: 中級驅動 (進行中)
- [ ] 中斷處理
- [ ] DMA 傳輸
- [ ] 工作佇列
- [ ] Sysfs 介面

### Phase 3: 進階驅動
- [ ] PCI 設備驅動
- [ ] USB 設備驅動
- [ ] 網路設備驅動
- [ ] 塊設備驅動

### Phase 4: 子系統開發
- [ ] 自定義子系統
- [ ] Kernel 補丁提交
- [ ] 性能優化
- [ ] 穩定性測試

## 🔬 學習資源

### 必讀書籍
1. **Linux Device Drivers, 3rd Edition** - Jonathan Corbet et al.
   - 驅動開發聖經
   - 詳細範例和解釋

2. **Linux Kernel Development** - Robert Love
   - Kernel 內部機制
   - 子系統詳解

3. **Understanding the Linux Kernel** - Daniel P. Bovet
   - 核心原理深入分析
   - 記憶體管理和排程

### 線上資源
- [Kernel.org](https://kernel.org/) - 官方網站
- [KernelNewbies](https://kernelnewbies.org/) - 新手指南
- [LWN.net](https://lwn.net/) - Kernel 新聞和文章
- [Linux Driver Documentation](https://www.kernel.org/doc/html/latest/) - 官方文檔

### 社群
- [Linux Kernel Mailing List (LKML)](https://lkml.org/)
- [Stack Overflow - Linux Kernel](https://stackoverflow.com/questions/tagged/linux-kernel)
- [Reddit r/kernel](https://reddit.com/r/kernel)

## ⚙️ 開發最佳實踐

### 1. Kernel Coding Style
```c
// 正確的縮排 (Tab = 8 spaces)
if (condition) {
	do_something();
	do_another_thing();
}

// 函數命名
static int device_probe(struct platform_device *pdev)
{
	// ...
}

// 錯誤處理
ret = some_function();
if (ret < 0) {
	pr_err("Function failed: %d\n", ret);
	goto err_cleanup;
}

err_cleanup:
	cleanup_resources();
	return ret;
```

### 2. 記憶體管理
```c
// 核心記憶體分配
void *buffer = kmalloc(size, GFP_KERNEL);  // 可睡眠上下文
void *buffer = kmalloc(size, GFP_ATOMIC);  // 中斷上下文

// 檢查分配失敗
if (!buffer) {
	pr_err("Memory allocation failed\n");
	return -ENOMEM;
}

// 釋放記憶體
kfree(buffer);
```

### 3. 同步機制
```c
// Spinlock (短時間鎖定,中斷上下文可用)
spinlock_t my_lock;
spin_lock_init(&my_lock);
spin_lock(&my_lock);
// 臨界區
spin_unlock(&my_lock);

// Mutex (可睡眠,僅進程上下文)
struct mutex my_mutex;
mutex_init(&my_mutex);
mutex_lock(&my_mutex);
// 臨界區
mutex_unlock(&my_mutex);
```

### 4. 除錯技巧
```c
// 日誌級別
pr_emerg("System is unusable\n");
pr_alert("Action must be taken immediately\n");
pr_crit("Critical conditions\n");
pr_err("Error conditions\n");
pr_warning("Warning conditions\n");
pr_notice("Normal but significant\n");
pr_info("Informational\n");
pr_debug("Debug-level messages\n");

// 動態除錯
pr_devel("Development debug message\n");

// 斷言
BUG_ON(ptr == NULL);
WARN_ON(condition);
```

## ⚠️ 注意事項

### 開發限制
1. **核心空間限制**
   - 不能使用標準 C 庫 (如 printf, malloc)
   - 堆疊空間有限 (約 8KB)
   - 不能浮點運算 (需特殊處理)

2. **並發考慮**
   - 必須處理多處理器競爭
   - 正確使用鎖機制
   - 避免死鎖

3. **記憶體限制**
   - 盡量減少記憶體使用
   - 及時釋放資源
   - 注意記憶體洩漏

### 安全注意
```c
// 檢查用戶空間指針
if (!access_ok(user_ptr, size))
	return -EFAULT;

// 使用安全的複製函數
if (copy_from_user(kernel_buf, user_buf, size))
	return -EFAULT;

// 檢查整數溢出
if (size > MAX_SIZE || size < 0)
	return -EINVAL;
```

## 🎯 測試與驗證

### 單元測試
```bash
# 使用 KUnit (Kernel Unit Testing)
make menuconfig
# 啟用 CONFIG_KUNIT

# 運行測試
make kunit_tool run
```

### 靜態分析
```bash
# Sparse 檢查
make C=1 M=drivers/char

# Coccinelle 語義補丁
make coccicheck MODE=report M=drivers/char

# Checkpatch 風格檢查
./scripts/checkpatch.pl --file mydriver.c
```

### 動態測試
```bash
# KASAN (Address Sanitizer)
CONFIG_KASAN=y

# UBSAN (Undefined Behavior Sanitizer)
CONFIG_UBSAN=y

# Lockdep (鎖依賴檢測)
CONFIG_PROVE_LOCKING=y
```

## 📄 授權

遵循 GPL v2 授權 (與 Linux Kernel 一致)

## 📞 貢獻

- **問題回報**: GitHub Issues
- **功能建議**: GitHub Discussions
- **補丁提交**: 遵循 Kernel 提交流程

---

**最後更新**: 2025-11-16
**狀態**: 🚧 研究與開發中
**維護者**: AI-Assisted Development Team
