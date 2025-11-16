# RAM 磁碟塊設備驅動 (RAM Disk Block Device Driver)

這是一個完整的 Linux 塊設備驅動範例，實現了基於記憶體的虛擬磁碟。

## 📋 專案簡介

此專案實現了一個功能完整的 RAM 磁碟塊設備驅動，特性包括：
- 基於記憶體的塊存儲設備
- 支援標準文件系統（ext4、FAT32等）
- 支援分區
- 使用 blk-mq（塊多佇列）架構
- 100MB 存儲空間

## 🎯 學習目標

- 理解 Linux 塊設備驅動架構
- 掌握 blk-mq（塊多佇列）機制
- 學習 bio 請求處理
- 了解塊設備的扇區和數據傳輸
- 實踐文件系統與塊設備的交互

## 🛠️ 編譯與安裝

### 前置需求

```bash
# Ubuntu/Debian
sudo apt-get install build-essential linux-headers-$(uname -r) parted

# CentOS/RHEL
sudo yum install gcc kernel-devel kernel-headers parted
```

### 編譯模組

```bash
make
```

### 載入模組

```bash
make install
```

或手動載入：

```bash
sudo insmod simple_ramdisk.ko
```

### 查看設備

```bash
lsblk | grep sramdisk
ls -l /dev/sramdisk*
```

### 卸載模組

```bash
make uninstall
```

或手動卸載：

```bash
sudo umount /mnt/ramdisk  # 如果已掛載
sudo rmmod simple_ramdisk
```

## 🧪 測試驅動

### 自動測試（推薦）

```bash
# 完整測試（包含格式化、掛載、讀寫）
make test
```

### 手動測試

1. **創建文件系統**

```bash
# 使用 ext4
sudo mkfs.ext4 /dev/sramdisk

# 或使用 FAT32
sudo mkfs.vfat /dev/sramdisk
```

2. **掛載磁碟**

```bash
sudo mkdir -p /mnt/ramdisk
sudo mount /dev/sramdisk /mnt/ramdisk
```

3. **測試讀寫**

```bash
# 寫入文件
echo "Hello, RAM Disk!" | sudo tee /mnt/ramdisk/test.txt

# 讀取文件
cat /mnt/ramdisk/test.txt

# 創建更多文件
sudo dd if=/dev/urandom of=/mnt/ramdisk/random.dat bs=1M count=10

# 查看磁碟使用
df -h /mnt/ramdisk
```

4. **卸載磁碟**

```bash
sudo umount /mnt/ramdisk
```

### 分區測試

```bash
# 自動分區測試
make test-partition
```

手動創建分區：

```bash
# 創建分區表
sudo parted /dev/sramdisk mklabel msdos

# 創建兩個分區
sudo parted /dev/sramdisk mkpart primary ext4 0% 50%
sudo parted /dev/sramdisk mkpart primary ext4 50% 100%

# 格式化分區
sudo mkfs.ext4 /dev/sramdisk1
sudo mkfs.ext4 /dev/sramdisk2

# 掛載分區
sudo mkdir -p /mnt/ramdisk1 /mnt/ramdisk2
sudo mount /dev/sramdisk1 /mnt/ramdisk1
sudo mount /dev/sramdisk2 /mnt/ramdisk2
```

### 性能測試

```bash
# 自動性能測試
make test-performance
```

手動性能測試：

```bash
# 準備磁碟
sudo mkfs.ext4 /dev/sramdisk
sudo mount /dev/sramdisk /mnt/ramdisk

# 寫入性能測試
sudo dd if=/dev/zero of=/mnt/ramdisk/testfile bs=1M count=100

# 讀取性能測試
sudo dd if=/mnt/ramdisk/testfile of=/dev/null bs=1M

# 隨機讀寫測試（需要 fio 工具）
sudo fio --name=randwrite --ioengine=libaio --iodepth=16 \
    --rw=randwrite --bs=4k --direct=1 --size=50M \
    --filename=/mnt/ramdisk/testfile
```

## 📊 代碼結構

```
simple_ramdisk.c
├── 數據結構
│   └── ramdisk_device - 設備私有數據
├── 數據傳輸
│   └── ramdisk_transfer() - 執行讀寫操作
├── 請求處理
│   └── ramdisk_request() - 處理 bio 請求
├── 塊設備操作
│   └── ramdisk_fops - 文件操作結構
└── 模組操作
    ├── ramdisk_init() - 模組初始化
    └── ramdisk_exit() - 模組卸載
```

## 🔍 核心概念解析

### 1. 塊設備註冊

```c
ramdisk_dev->major = register_blkdev(0, RAMDISK_NAME);
```

- 註冊塊設備並獲取主設備號
- `0` 表示由核心動態分配主設備號

### 2. blk-mq（塊多佇列）

```c
struct blk_mq_tag_set tag_set;
blk_mq_alloc_tag_set(&tag_set);
ramdisk_dev->disk = blk_mq_alloc_disk(&tag_set, ramdisk_dev);
```

- 現代 Linux 使用的塊設備架構
- 支援多佇列並行處理請求
- 提升多核心系統性能

### 3. bio 請求處理

```c
rq_for_each_segment(bvec, req, iter) {
    buffer = page_address(bvec.bv_page) + bvec.bv_offset;
    // 處理數據傳輸
}
```

- bio 是塊 I/O 的基本單位
- 請求可能包含多個 bio segment
- 每個 segment 對應一個記憶體頁面區域

### 4. 扇區與數據傳輸

```c
sector_t sector = blk_rq_pos(req);
unsigned long nbytes = nsect * RAMDISK_SECTOR_SIZE;
```

- 扇區大小通常是 512 字節
- `sector` 是扇區編號
- 所有 I/O 操作以扇區為單位

### 5. 磁碟容量設置

```c
set_capacity(ramdisk_dev->disk, RAMDISK_SECTORS);
```

- 設置磁碟總扇區數
- 決定磁碟的總容量

### 6. 記憶體分配

```c
ramdisk_dev->data = vmalloc(RAMDISK_SIZE);
```

- 使用 `vmalloc` 分配大塊連續虛擬記憶體
- 適合分配大型緩衝區（> 1MB）
- 相對於 `kmalloc` 可分配更大空間

## 📈 進階擴展

### 動態調整磁碟大小

添加 module 參數：

```c
static int ramdisk_size = 100;  /* MB */
module_param(ramdisk_size, int, 0644);
MODULE_PARM_DESC(ramdisk_size, "RAM disk size in MB");

// 使用時
insmod simple_ramdisk.ko ramdisk_size=200
```

### 添加 ioctl 支援

```c
static int ramdisk_ioctl(struct block_device *bdev, fmode_t mode,
                        unsigned cmd, unsigned long arg)
{
    switch (cmd) {
    case MY_IOCTL_CMD:
        // 處理命令
        break;
    default:
        return -ENOTTY;
    }
    return 0;
}
```

### 實現磁碟加密

```c
static int ramdisk_transfer_encrypted(struct ramdisk_device *dev,
                                     sector_t sector, unsigned long nsect,
                                     char *buffer, int write)
{
    if (write) {
        encrypt_data(buffer, nbytes);
        memcpy(dev->data + offset, buffer, nbytes);
    } else {
        memcpy(buffer, dev->data + offset, nbytes);
        decrypt_data(buffer, nbytes);
    }
    return 0;
}
```

### 支援多個 RAM 磁碟

```c
#define NUM_RAMDISKS 4
static struct ramdisk_device *ramdisk_devices[NUM_RAMDISKS];
```

## 🐛 常見問題

### 1. 模組載入失敗

**問題**: `insmod: ERROR: could not insert module`

**解決方案**:
```bash
dmesg | tail
# 查看具體錯誤訊息
```

### 2. 找不到設備節點

**問題**: `/dev/sramdisk` 不存在

**解決方案**:
```bash
# 檢查模組是否載入
lsmod | grep simple_ramdisk

# 查看設備註冊資訊
cat /proc/devices | grep sramdisk

# 手動創建設備節點（通常不需要）
sudo mknod /dev/sramdisk b <major> 0
```

### 3. 無法格式化

**問題**: `mkfs.ext4: Device or resource busy`

**解決方案**:
```bash
# 確認設備未被掛載
mount | grep sramdisk

# 如果已掛載，先卸載
sudo umount /dev/sramdisk
```

### 4. 記憶體分配失敗

**問題**: `Failed to allocate RAM storage`

**解決方案**:
```bash
# 檢查可用記憶體
free -h

# 減小 RAM 磁碟大小（修改 RAMDISK_SIZE）
# 或增加系統記憶體
```

## 🔬 實用應用場景

### 1. 高速緩存

```bash
# 用作編譯緩存
export TMPDIR=/mnt/ramdisk
make -j$(nproc)
```

### 2. 臨時文件存儲

```bash
# 設置瀏覽器緩存
# Chrome: --disk-cache-dir=/mnt/ramdisk/chrome
```

### 3. 資料庫臨時表空間

```bash
# MySQL tmpdir
tmpdir=/mnt/ramdisk/mysql
```

### 4. 測試環境

```bash
# 快速創建和銷毀測試環境
sudo mount /dev/sramdisk /mnt/test
# 進行測試
sudo umount /mnt/test
sudo rmmod simple_ramdisk  # 數據自動清除
```

## 📚 延伸閱讀

- [Linux Device Drivers, 3rd Edition](https://lwn.net/Kernel/LDD3/) - Chapter 16: Block Drivers
- [Linux Block Layer Documentation](https://www.kernel.org/doc/html/latest/block/index.html)
- [blk-mq Documentation](https://www.kernel.org/doc/html/latest/block/blk-mq.html)

## 🔄 與字元設備的比較

| 特性 | 字元設備 | 塊設備 |
|------|---------|--------|
| 訪問方式 | 順序訪問 | 隨機訪問 |
| 基本單位 | 字節 | 扇區（通常512B） |
| 緩衝 | 通常無緩衝 | 系統有緩衝層 |
| 文件系統 | 不支援 | 支援 |
| 範例 | 串口、鍵盤 | 硬碟、SSD |

## 📝 授權

GPL v2

## 👨‍💻 貢獻者

AI-Assisted Development Team
