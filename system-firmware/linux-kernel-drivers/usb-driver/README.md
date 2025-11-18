# USB 设备驱动开发

## 📋 概述

本目录包含 USB 设备驱动的完整实现示例，展示了如何开发 Linux USB 驱动程序。

## 🎯 功能特性

### USB Skeleton 驱动 (usb_skeleton.c)

这是一个完整的 USB 驱动骨架，包含：

1. **设备管理**
   - USB 设备探测 (probe)
   - 设备断开 (disconnect)
   - 设备引用计数管理
   - 自动电源管理

2. **数据传输**
   - URB (USB Request Block) 管理
   - 批量输入/输出 (Bulk IN/OUT)
   - 异步数据传输
   - 传输回调处理

3. **文件操作**
   - open/close/read/write
   - 非阻塞 I/O 支持
   - 数据缓冲管理
   - 用户空间数据交换

4. **电源管理**
   - 挂起/恢复支持
   - 自动挂起
   - USB 自动电源管理

5. **错误处理**
   - URB 错误处理
   - 设备断开处理
   - I/O 错误恢复
   - 超时处理

## 🔧 编译和安装

### 前置要求

```bash
# 安装内核开发包
sudo apt-get install linux-headers-$(uname -r) build-essential

# 或在 Fedora/CentOS
sudo dnf install kernel-devel kernel-headers
```

### 编译

```bash
# 编译驱动
make

# 查看模块信息
make info
```

### 安装和测试

```bash
# 加载驱动
sudo insmod usb_skeleton.ko

# 查看驱动是否加载
lsmod | grep usb_skeleton

# 查看内核日志
dmesg | tail -20

# 卸载驱动
sudo rmmod usb_skeleton
```

## 📚 USB 驱动开发基础

### USB 设备标识

USB 设备通过 VID (Vendor ID) 和 PID (Product ID) 来标识：

```c
static const struct usb_device_id skel_table[] = {
    { USB_DEVICE(0x1234, 0x5678) },  /* VID:PID */
    { }
};
MODULE_DEVICE_TABLE(usb, skel_table);
```

**如何查找设备 VID:PID：**

```bash
# 列出所有 USB 设备
lsusb

# 详细信息
lsusb -v

# 示例输出：
# Bus 001 Device 002: ID 1234:5678 Vendor Device
```

### URB (USB Request Block)

URB 是 USB 通信的基本单位：

```c
struct urb *urb;

/* 分配 URB */
urb = usb_alloc_urb(0, GFP_KERNEL);

/* 初始化批量传输 URB */
usb_fill_bulk_urb(urb, dev->udev,
                  usb_rcvbulkpipe(dev->udev, endpoint),
                  buffer, size, callback, context);

/* 提交 URB */
ret = usb_submit_urb(urb, GFP_KERNEL);

/* 释放 URB */
usb_free_urb(urb);
```

### 端点类型

USB 有四种端点类型：

1. **控制端点 (Control)**
   - 用于设备配置和控制
   - 所有设备必须支持端点 0

2. **批量端点 (Bulk)**
   - 用于大量数据传输
   - 不保证带宽但保证数据完整性
   - 适合：存储设备、打印机

3. **中断端点 (Interrupt)**
   - 用于小量、低延迟数据
   - 保证最大延迟时间
   - 适合：鼠标、键盘、游戏手柄

4. **等时端点 (Isochronous)**
   - 用于流媒体数据
   - 保证带宽但不保证数据完整性
   - 适合：音频、视频

### 数据传输模式

**同步传输：**
```c
int ret;
ret = usb_bulk_msg(dev->udev,
                   usb_rcvbulkpipe(dev->udev, endpoint),
                   buffer, size, &actual_length,
                   timeout);
```

**异步传输：**
```c
/* 准备 URB */
usb_fill_bulk_urb(urb, dev->udev, pipe, buffer, size,
                  callback, context);

/* 提交 URB */
usb_submit_urb(urb, GFP_KERNEL);

/* 在回调函数中处理结果 */
static void callback(struct urb *urb)
{
    if (urb->status == 0) {
        /* 传输成功 */
    }
}
```

## 🔬 调试技巧

### 1. 使用 usbmon 监控 USB 流量

```bash
# 加载 usbmon 模块
sudo modprobe usbmon

# 使用 wireshark 捕获 USB 数据包
sudo wireshark

# 或使用命令行工具
sudo cat /sys/kernel/debug/usb/usbmon/0u
```

### 2. USB 调试文件系统

```bash
# 查看 USB 设备树
cat /sys/kernel/debug/usb/devices

# 查看特定总线
ls /sys/bus/usb/devices/

# 查看设备详情
cat /sys/bus/usb/devices/1-1/uevent
```

### 3. 内核日志

```bash
# 启用 USB 调试日志
echo 'module usbcore +p' | sudo tee /sys/kernel/debug/dynamic_debug/control

# 查看日志
dmesg -w | grep -i usb
```

### 4. USB 工具

```bash
# 安装 USB 工具
sudo apt-get install usbutils

# 列出设备
lsusb -t  # 树状显示
lsusb -v  # 详细信息

# 获取设备描述符
sudo lsusb -v -d 1234:5678
```

## 🎓 学习资源

### 官方文档

1. **Linux USB 驱动文档**
   ```bash
   # 在内核源码中
   Documentation/driver-api/usb/
   Documentation/driver-api/usb/writing_usb_driver.rst
   ```

2. **USB 规范**
   - USB 2.0: https://www.usb.org/document-library
   - USB 3.0/3.1: https://www.usb.org/document-library

### 示例代码

内核源码中的 USB 驱动示例：
```bash
drivers/usb/usb-skeleton.c          # USB 骨架驱动
drivers/usb/class/usblp.c          # USB 打印机
drivers/usb/storage/usb.c          # USB 存储
drivers/usb/serial/ftdi_sio.c      # USB 串口
```

### 书籍推荐

1. **"Linux Device Drivers, 3rd Edition"** - Chapter 13: USB Drivers
2. **"USB Complete: The Developer's Guide"** - Jan Axelson
3. **"USB in a NutShell"** - Beyond Logic

## 🧪 常见应用场景

### 1. USB 串口驱动

```c
static const struct usb_device_id id_table[] = {
    { USB_DEVICE(0x0403, 0x6001) },  /* FTDI FT232 */
    { }
};

/* USB 串口转换器驱动 */
static struct usb_serial_driver ftdi_driver = {
    .driver = {
        .owner = THIS_MODULE,
        .name = "ftdi_sio",
    },
    .id_table = id_table,
    .num_ports = 1,
    .probe = ftdi_probe,
};
```

### 2. USB 存储驱动

```c
/* USB 大容量存储类 */
static const struct usb_device_id storage_table[] = {
    { USB_INTERFACE_INFO(USB_CLASS_MASS_STORAGE,
                        USB_SC_SCSI,
                        USB_PR_BULK) },
    { }
};
```

### 3. USB HID 设备

```c
/* USB 人机接口设备类 */
static const struct usb_device_id hid_table[] = {
    { USB_INTERFACE_INFO(USB_CLASS_HID, 0, 0) },
    { }
};
```

## 🤖 AI 辅助开发建议

### 代码生成提示

```
"生成一个 USB 鼠标驱动程序的基本框架"
"如何处理 USB 设备的热插拔事件？"
"为 USB 驱动添加 sysfs 接口以导出设备信息"
```

### 调试辅助

```
"分析这个 URB 提交失败的错误码：-ENOENT"
"USB 设备探测时返回 -EPROTO 是什么原因？"
"如何调试 USB 端点枚举失败的问题？"
```

### 性能优化

```
"如何优化 USB 批量传输的性能？"
"USB 驱动中如何使用 URB 预分配提升效率？"
"解释 USB NAPI 轮询机制的工作原理"
```

## ⚠️ 注意事项

### 安全考虑

1. **输入验证**
   ```c
   /* 验证用户空间数据 */
   if (count > MAX_TRANSFER)
       return -EINVAL;

   if (copy_from_user(buffer, user_buffer, count))
       return -EFAULT;
   ```

2. **资源释放**
   ```c
   /* 确保在错误路径释放资源 */
   if (urb) {
       usb_free_coherent(dev->udev, size, buf, urb->transfer_dma);
       usb_free_urb(urb);
   }
   ```

3. **并发保护**
   ```c
   /* 使用锁保护共享数据 */
   mutex_lock(&dev->io_mutex);
   /* 临界区 */
   mutex_unlock(&dev->io_mutex);
   ```

### 性能优化

1. **URB 批处理**
   - 一次提交多个 URB 以提高吞吐量
   - 使用 usb_anchor 管理 URB 组

2. **缓冲区管理**
   - 使用 DMA 一致性缓冲区
   - 预分配缓冲区避免运行时分配

3. **异步 I/O**
   - 优先使用异步 URB 而非同步传输
   - 避免在原子上下文中阻塞

## 🔧 故障排除

### 常见错误

| 错误码 | 含义 | 解决方法 |
|--------|------|----------|
| -ENODEV | 设备不存在 | 检查设备连接，确认 VID:PID |
| -ENOENT | URB 被取消 | 正常，可能是设备断开或驱动卸载 |
| -EPIPE | 端点暂停(stall) | 调用 usb_clear_halt() 清除 |
| -EPROTO | 协议错误 | 检查 USB 硬件和线缆 |
| -ETIME | 传输超时 | 增加超时时间或检查设备响应 |
| -EOVERFLOW | 数据溢出 | 增加缓冲区大小 |

### 调试步骤

1. **确认设备识别**
   ```bash
   lsusb -v -d VID:PID
   dmesg | grep -i usb
   ```

2. **检查驱动绑定**
   ```bash
   ls /sys/bus/usb/drivers/
   cat /sys/bus/usb/devices/*/driver
   ```

3. **监控传输**
   ```bash
   sudo cat /sys/kernel/debug/usb/usbmon/0u
   ```

## 📊 性能测试

### 吞吐量测试

```bash
# 使用 dd 测试读写速度
sudo dd if=/dev/usb_device of=/dev/null bs=1M count=100
sudo dd if=/dev/zero of=/dev/usb_device bs=1M count=100

# 查看 USB 带宽
cat /sys/kernel/debug/usb/devices | grep -A 5 "Product"
```

### 延迟测试

```bash
# 测量中断延迟
sudo cyclictest -t1 -p 80 -n -i 1000

# USB 响应时间
time cat /dev/usb_device
```

## 📄 授权

本驱动遵循 GPL v2 授权。

## 🤝 贡献

欢迎提交问题报告和改进建议！

---

**最后更新**: 2025-11-18
**维护者**: AI-Assisted Development Team
