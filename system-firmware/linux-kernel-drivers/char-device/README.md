# 字元設備驅動 (Character Device Driver)

這是一個完整的 Linux 字元設備驅動範例，展示了字元設備驅動開發的核心概念。

## 📋 專案簡介

此專案實現了一個簡單但功能完整的字元設備驅動，支援基本的文件操作：
- `open()` - 打開設備
- `close()` - 關閉設備
- `read()` - 從設備讀取數據
- `write()` - 向設備寫入數據
- `llseek()` - 定位到特定位置

## 🎯 學習目標

- 理解 Linux 字元設備驅動架構
- 掌握 `cdev` 結構和設備號分配
- 學習用戶空間與核心空間數據傳輸
- 了解設備類別和設備節點自動創建
- 掌握基本的同步機制（mutex）

## 🛠️ 編譯與安裝

### 前置需求

```bash
# Ubuntu/Debian
sudo apt-get install build-essential linux-headers-$(uname -r)

# CentOS/RHEL
sudo yum install gcc kernel-devel kernel-headers
```

### 編譯模組

```bash
make
```

編譯成功後會生成 `simple_chardev.ko` 模組文件。

### 載入模組

```bash
make install
```

或手動載入：

```bash
sudo insmod simple_chardev.ko
```

### 查看模組狀態

```bash
lsmod | grep simple_chardev
dmesg | tail
```

### 卸載模組

```bash
make uninstall
```

或手動卸載：

```bash
sudo rmmod simple_chardev
```

## 🧪 測試驅動

### 自動測試

```bash
make test
```

### 手動測試

1. **寫入數據到設備**
```bash
echo "Hello, Kernel!" | sudo tee /dev/simple_char
```

2. **從設備讀取數據**
```bash
sudo cat /dev/simple_char
```

3. **使用 C 程式測試**

創建測試程式 `test.c`：

```c
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>

int main() {
    int fd;
    char write_buf[] = "Hello from test program!";
    char read_buf[100];
    ssize_t ret;

    // 打開設備
    fd = open("/dev/simple_char", O_RDWR);
    if (fd < 0) {
        perror("Failed to open device");
        return 1;
    }

    // 寫入數據
    ret = write(fd, write_buf, strlen(write_buf));
    if (ret < 0) {
        perror("Failed to write");
        close(fd);
        return 1;
    }
    printf("Wrote %zd bytes\n", ret);

    // 重新定位到開頭
    lseek(fd, 0, SEEK_SET);

    // 讀取數據
    ret = read(fd, read_buf, sizeof(read_buf) - 1);
    if (ret < 0) {
        perror("Failed to read");
        close(fd);
        return 1;
    }
    read_buf[ret] = '\0';
    printf("Read %zd bytes: %s\n", ret, read_buf);

    close(fd);
    return 0;
}
```

編譯並運行：

```bash
gcc -o test test.c
sudo ./test
```

## 📊 代碼結構

```
simple_chardev.c
├── 數據結構
│   └── chardev_data - 設備私有數據
├── 文件操作
│   ├── device_open() - 打開操作
│   ├── device_release() - 關閉操作
│   ├── device_read() - 讀取操作
│   ├── device_write() - 寫入操作
│   └── device_llseek() - 定位操作
└── 模組操作
    ├── chardev_init() - 模組初始化
    └── chardev_exit() - 模組卸載
```

## 🔍 核心概念解析

### 1. 設備號分配

```c
alloc_chrdev_region(&chardev->dev_num, 0, 1, DEVICE_NAME);
```

- 動態分配主設備號和次設備號
- `0` - 次設備號起始值
- `1` - 請求的設備數量

### 2. 字元設備初始化

```c
cdev_init(&chardev->cdev, &fops);
cdev_add(&chardev->cdev, chardev->dev_num, 1);
```

- `cdev_init()` - 初始化 cdev 結構並關聯文件操作
- `cdev_add()` - 向核心註冊字元設備

### 3. 設備節點自動創建

```c
chardev->class = class_create(THIS_MODULE, CLASS_NAME);
chardev->device = device_create(chardev->class, NULL,
                               chardev->dev_num, NULL, DEVICE_NAME);
```

- 自動在 `/dev/` 目錄下創建設備節點
- 不需要手動使用 `mknod` 命令

### 4. 用戶空間數據傳輸

```c
// 核心空間 -> 用戶空間
copy_to_user(user_buffer, kernel_buffer, size);

// 用戶空間 -> 核心空間
copy_from_user(kernel_buffer, user_buffer, size);
```

- 不能直接使用 `memcpy()`
- 這些函數會檢查用戶空間指針的有效性
- 支援頁面錯誤處理

### 5. 同步保護

```c
mutex_lock(&data->lock);
// 臨界區代碼
mutex_unlock(&data->lock);
```

- 使用 mutex 保護共享數據
- 防止多個進程同時訪問造成競爭條件

## 📈 進階擴展

### 添加 ioctl 支援

```c
static long device_ioctl(struct file *file, unsigned int cmd, unsigned long arg)
{
    switch (cmd) {
    case MY_IOCTL_CMD:
        // 處理命令
        break;
    default:
        return -EINVAL;
    }
    return 0;
}
```

### 實現 poll/select

```c
static unsigned int device_poll(struct file *file, poll_table *wait)
{
    unsigned int mask = 0;

    poll_wait(file, &device_queue, wait);

    // 檢查設備狀態
    if (data_available)
        mask |= POLLIN | POLLRDNORM;
    if (space_available)
        mask |= POLLOUT | POLLWRNORM;

    return mask;
}
```

### 支援多個設備

修改設備數量：

```c
#define NUM_DEVICES 4
alloc_chrdev_region(&dev_num, 0, NUM_DEVICES, DEVICE_NAME);
```

## 🐛 常見問題

### 1. 模組載入失敗

**問題**: `insmod: ERROR: could not insert module`

**解決方案**:
```bash
dmesg | tail
# 查看具體錯誤訊息
```

### 2. 設備節點未創建

**問題**: `/dev/simple_char` 不存在

**解決方案**:
- 檢查 `class_create()` 和 `device_create()` 是否成功
- 查看 `dmesg` 輸出的錯誤訊息

### 3. 權限被拒絕

**問題**: `Permission denied` 訪問設備

**解決方案**:
```bash
# 修改設備權限
sudo chmod 666 /dev/simple_char

# 或使用 sudo
sudo cat /dev/simple_char
```

### 4. 編譯錯誤

**問題**: 找不到 kernel headers

**解決方案**:
```bash
# 安裝對應版本的 kernel headers
sudo apt-get install linux-headers-$(uname -r)
```

## 📚 延伸閱讀

- [Linux Device Drivers, 3rd Edition](https://lwn.net/Kernel/LDD3/) - Chapter 3: Char Drivers
- [The Linux Kernel Module Programming Guide](https://sysprog21.github.io/lkmpg/)
- [Kernel Documentation - Character devices](https://www.kernel.org/doc/html/latest/driver-api/index.html)

## 📝 授權

GPL v2

## 👨‍💻 貢獻者

AI-Assisted Development Team
