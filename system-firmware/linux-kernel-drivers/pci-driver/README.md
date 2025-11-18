# PCI/PCIe 设备驱动开发

## 📋 概述

本目录包含 PCI/PCIe 设备驱动的完整实现示例，展示了如何开发 Linux PCI 驱动程序。

## 🎯 功能特性

### PCI Skeleton 驱动 (pci_skeleton.c)

这是一个完整的 PCI 驱动骨架，包含：

1. **设备管理**
   - PCI 设备探测 (probe)
   - 设备移除 (remove)
   - 电源管理 (suspend/resume)
   - 设备引用管理

2. **资源管理**
   - 配置空间访问
   - MMIO (Memory-Mapped I/O) 映射
   - I/O 端口映射
   - BAR (Base Address Register) 管理

3. **中断处理**
   - 传统 INTx 中断
   - MSI (Message Signaled Interrupts)
   - MSI-X 中断
   - 中断共享

4. **DMA 支持**
   - DMA 掩码设置 (32/64 位)
   - 一致性 DMA 缓冲区
   - Streaming DMA
   - Scatter-Gather DMA

5. **字符设备接口**
   - 设备节点创建
   - 读写操作
   - 用户空间接口

## 🔧 编译和安装

### 前置要求

```bash
# 安装内核开发包
sudo apt-get install linux-headers-$(uname -r) build-essential pciutils

# 或在 Fedora/CentOS
sudo dnf install kernel-devel kernel-headers pciutils
```

### 编译

```bash
# 编译驱动
make

# 查看模块信息
make info

# 查看 PCI 设备
make lspci
```

### 安装和测试

```bash
# 加载驱动
sudo insmod pci_skeleton.ko

# 查看驱动是否加载
lsmod | grep pci_skeleton

# 查看内核日志
dmesg | tail -20

# 卸载驱动
sudo rmmod pci_skeleton
```

## 📚 PCI 驱动开发基础

### PCI 设备标识

PCI 设备通过 Vendor ID 和 Device ID 来标识：

```c
static const struct pci_device_id pci_ids[] = {
    { PCI_DEVICE(0x8086, 0x100E) },  /* Intel E1000 */
    { PCI_DEVICE(0x10EC, 0x8139) },  /* Realtek 8139 */
    { 0, }
};
MODULE_DEVICE_TABLE(pci, pci_ids);
```

**如何查找设备 VID:PID：**

```bash
# 列出所有 PCI 设备
lspci -nn

# 详细信息
lspci -v -s 00:1f.2

# 显示设备树
lspci -t

# 示例输出：
# 02:00.0 Ethernet controller [0200]: Intel Corporation 82540EM [8086:100e]
```

### 配置空间访问

PCI 配置空间包含设备的基本信息：

```c
u16 vendor_id, device_id;
u8 revision_id, irq_line;
u32 bar0;

/* 读取配置空间 */
pci_read_config_word(pdev, PCI_VENDOR_ID, &vendor_id);
pci_read_config_word(pdev, PCI_DEVICE_ID, &device_id);
pci_read_config_byte(pdev, PCI_REVISION_ID, &revision_id);
pci_read_config_byte(pdev, PCI_INTERRUPT_LINE, &irq_line);
pci_read_config_dword(pdev, PCI_BASE_ADDRESS_0, &bar0);

/* 写入配置空间 */
pci_write_config_word(pdev, PCI_COMMAND, command);
```

### BAR (Base Address Registers)

PCI 设备最多有 6 个 BAR，用于映射内存和 I/O 资源：

```c
/* 获取 BAR 信息 */
unsigned long bar_start = pci_resource_start(pdev, 0);  /* BAR0 */
unsigned long bar_len = pci_resource_len(pdev, 0);
unsigned long bar_flags = pci_resource_flags(pdev, 0);

/* 检查 BAR 类型 */
if (bar_flags & IORESOURCE_MEM) {
    /* MMIO 区域 */
    void __iomem *mmio = pci_iomap(pdev, 0, bar_len);

    /* 读写 MMIO */
    u32 value = ioread32(mmio);
    iowrite32(0x12345678, mmio);

    /* 释放映射 */
    pci_iounmap(pdev, mmio);
} else if (bar_flags & IORESOURCE_IO) {
    /* I/O 端口区域 */
    unsigned long port = bar_start;

    /* 读写 I/O 端口 */
    u8 value = inb(port);
    outb(0xFF, port);
}
```

### DMA 操作

**一致性 DMA (Coherent DMA)：**

```c
/* 设置 DMA 掩码 */
int ret = dma_set_mask_and_coherent(&pdev->dev, DMA_BIT_MASK(64));
if (ret)
    ret = dma_set_mask_and_coherent(&pdev->dev, DMA_BIT_MASK(32));

/* 分配一致性 DMA 缓冲区 */
dma_addr_t dma_handle;
void *cpu_addr = dma_alloc_coherent(&pdev->dev, size, &dma_handle, GFP_KERNEL);

/* 使用 DMA 缓冲区 */
/* CPU 可以直接访问 cpu_addr */
/* 设备使用物理地址 dma_handle */

/* 释放 DMA 缓冲区 */
dma_free_coherent(&pdev->dev, size, cpu_addr, dma_handle);
```

**流式 DMA (Streaming DMA)：**

```c
/* 映射单个缓冲区 */
dma_addr_t dma_addr = dma_map_single(&pdev->dev, buffer, size, DMA_TO_DEVICE);
if (dma_mapping_error(&pdev->dev, dma_addr)) {
    /* 处理错误 */
}

/* DMA 传输 */

/* 取消映射 */
dma_unmap_single(&pdev->dev, dma_addr, size, DMA_TO_DEVICE);
```

**Scatter-Gather DMA：**

```c
struct scatterlist *sg;
int nents, mapped;

/* 映射 scatter-gather 列表 */
mapped = dma_map_sg(&pdev->dev, sg, nents, DMA_TO_DEVICE);

/* 使用 DMA */

/* 取消映射 */
dma_unmap_sg(&pdev->dev, sg, nents, DMA_TO_DEVICE);
```

### 中断处理

**传统 INTx 中断：**

```c
int ret = request_irq(pdev->irq, irq_handler, IRQF_SHARED, "my_driver", dev);
if (ret) {
    pr_err("Failed to request IRQ\n");
    return ret;
}

/* 中断处理函数 */
static irqreturn_t irq_handler(int irq, void *dev_id)
{
    /* 读取中断状态 */
    /* 处理中断 */
    /* 清除中断 */

    return IRQ_HANDLED;  /* 或 IRQ_NONE */
}

/* 释放中断 */
free_irq(pdev->irq, dev);
```

**MSI 中断：**

```c
/* 启用 MSI */
int ret = pci_enable_msi(pdev);
if (ret == 0) {
    /* MSI 成功启用 */
    pr_info("MSI enabled\n");
} else {
    /* 使用传统 INTx */
    pr_info("MSI not available\n");
}

/* 请求中断 */
request_irq(pdev->irq, irq_handler, 0, "my_driver", dev);

/* 禁用 MSI */
pci_disable_msi(pdev);
```

**MSI-X 中断：**

```c
/* 分配 MSI-X 向量 */
struct msix_entry entries[N_VECTORS];
for (i = 0; i < N_VECTORS; i++)
    entries[i].entry = i;

int nvec = pci_enable_msix_range(pdev, entries, 1, N_VECTORS);
if (nvec < 0) {
    pr_err("Failed to enable MSI-X\n");
    return nvec;
}

/* 为每个向量请求中断 */
for (i = 0; i < nvec; i++) {
    request_irq(entries[i].vector, irq_handler, 0, "my_driver", dev);
}

/* 禁用 MSI-X */
pci_disable_msix(pdev);
```

## 🔬 调试技巧

### 1. 查看 PCI 设备信息

```bash
# 列出所有 PCI 设备
lspci

# 详细信息（包括 BAR）
lspci -v

# 超详细信息（包括配置空间）
sudo lspci -vvv

# 显示特定设备
lspci -s 02:00.0 -vvv

# 显示数字 ID
lspci -nn

# 显示设备树
lspci -tv
```

### 2. 读取 PCI 配置空间

```bash
# 使用 lspci
sudo lspci -xxx -s 02:00.0

# 使用 setpci 读取
sudo setpci -s 02:00.0 00.w  # 读取 Vendor ID
sudo setpci -s 02:00.0 02.w  # 读取 Device ID
sudo setpci -s 02:00.0 10.l  # 读取 BAR0
```

### 3. sysfs 接口

```bash
# PCI 设备目录
cd /sys/bus/pci/devices/0000:02:00.0/

# 查看设备信息
cat vendor       # Vendor ID
cat device       # Device ID
cat resource     # BAR 资源
cat irq          # IRQ 编号

# 读取配置空间
sudo hexdump -C config

# 启用/禁用设备
echo 0 | sudo tee enable  # 禁用
echo 1 | sudo tee enable  # 启用
```

### 4. 内核调试

```bash
# 启用 PCI 调试
echo 'module pci +p' | sudo tee /sys/kernel/debug/dynamic_debug/control

# 查看 PCI 日志
dmesg | grep -i pci

# 查看中断统计
cat /proc/interrupts | grep pci
```

## 🎓 学习资源

### 官方文档

1. **Linux PCI 驱动文档**
   ```bash
   # 在内核源码中
   Documentation/PCI/
   Documentation/PCI/pci.rst
   ```

2. **PCI 规范**
   - PCI Local Bus Specification
   - PCI Express Base Specification
   - 下载：https://pcisig.com/specifications

### 内核示例

内核源码中的 PCI 驱动示例：
```bash
drivers/net/ethernet/intel/e1000/    # Intel E1000 网卡
drivers/net/ethernet/realtek/r8169/  # Realtek 网卡
drivers/ata/ahci.c                   # AHCI SATA 控制器
drivers/gpu/drm/                     # 显卡驱动
```

## 🧪 常见 PCI 设备类别

### 1. 网络控制器 (Class 0x02)

```c
static const struct pci_device_id network_ids[] = {
    { PCI_DEVICE(0x8086, 0x100E) },  /* Intel E1000 */
    { PCI_DEVICE(0x10EC, 0x8139) },  /* Realtek 8139 */
    { }
};
```

### 2. 存储控制器 (Class 0x01)

```c
/* SATA AHCI 控制器 */
static const struct pci_device_id ahci_ids[] = {
    { PCI_DEVICE(0x8086, 0x2829) },  /* Intel ICH8M */
    { }
};
```

### 3. 显示控制器 (Class 0x03)

```c
/* NVIDIA GPU */
static const struct pci_device_id gpu_ids[] = {
    { PCI_DEVICE(0x10DE, 0x1B80) },  /* NVIDIA GTX 1080 */
    { }
};
```

### 4. 通用匹配

```c
/* 匹配所有网络设备 */
{ PCI_DEVICE_CLASS(PCI_CLASS_NETWORK_ETHERNET << 8, 0xffff00) },

/* 匹配所有 Intel 设备 */
{ PCI_VDEVICE(INTEL, PCI_ANY_ID) },

/* 匹配子系统 */
{ PCI_DEVICE_SUB(0x8086, 0x100E, 0x8086, 0x1376) },
```

## 🤖 AI 辅助开发建议

### 代码生成提示

```
"生成一个 PCIe 网卡驱动的基本框架，包括 NAPI 支持"
"如何实现 PCI 设备的 DMA scatter-gather 传输？"
"为 PCI 驱动添加 sysfs 接口以调整设备参数"
```

### 调试辅助

```
"PCI BAR 映射失败返回 NULL，可能的原因是什么？"
"如何调试 MSI 中断无法触发的问题？"
"DMA 传输后数据损坏，如何排查 cache 一致性问题？"
```

### 性能优化

```
"如何优化 PCI DMA 传输的吞吐量？"
"PCIe 带宽利用率低，如何分析瓶颈？"
"解释 PCIe payload size 对性能的影响"
```

## ⚠️ 注意事项

### 安全考虑

1. **MMIO 访问**
   ```c
   /* 始终使用 ioread/iowrite，不要直接解引用 */
   u32 val = ioread32(mmio_base);  /* 正确 */
   u32 val = *(u32 *)mmio_base;    /* 错误 */
   ```

2. **DMA 缓冲区**
   ```c
   /* 确保使用正确的 DMA 方向 */
   dma_map_single(&pdev->dev, buf, size, DMA_TO_DEVICE);    /* 写到设备 */
   dma_map_single(&pdev->dev, buf, size, DMA_FROM_DEVICE);  /* 从设备读 */
   dma_map_single(&pdev->dev, buf, size, DMA_BIDIRECTIONAL);/* 双向 */
   ```

3. **中断处理**
   ```c
   /* 在中断中不要睡眠 */
   spin_lock(&lock);     /* 可以 */
   mutex_lock(&mutex);   /* 不可以 */
   ```

### 性能优化

1. **预取 (Prefetch)**
   ```c
   /* 预取 PCI 配置空间以提高性能 */
   pci_read_config_dword(pdev, PCI_COMMAND, &cmd);
   ```

2. **批量 DMA**
   - 使用 scatter-gather DMA 减少传输开销
   - 合并小的 DMA 传输

3. **中断合并**
   - 使用中断延迟减少中断频率
   - 实现 NAPI 轮询（网络驱动）

## 🔧 故障排除

### 常见问题

| 问题 | 可能原因 | 解决方法 |
|------|----------|----------|
| probe 未调用 | 设备 ID 不匹配 | 检查 VID:PID，使用 lspci -nn |
| MMIO 映射失败 | 资源未请求 | 先调用 pci_request_regions() |
| 中断不工作 | 未启用总线主控 | 调用 pci_set_master() |
| DMA 错误 | DMA 掩码未设置 | 调用 dma_set_mask_and_coherent() |
| MSI 失败 | 硬件不支持 | 回退到传统 INTx 中断 |

### 调试步骤

1. **确认设备存在**
   ```bash
   lspci -d 8086:100e
   ```

2. **检查驱动绑定**
   ```bash
   ls /sys/bus/pci/drivers/pci_skel/
   cat /sys/bus/pci/devices/0000:02:00.0/driver
   ```

3. **查看资源**
   ```bash
   cat /sys/bus/pci/devices/0000:02:00.0/resource
   cat /proc/iomem | grep pci
   ```

4. **监控中断**
   ```bash
   watch -n 1 'cat /proc/interrupts | grep pci'
   ```

## 📊 性能分析

### PCI 带宽测试

```bash
# 使用 pcm (Performance Counter Monitor)
sudo pcm-pcie.x -B

# 使用 perf
sudo perf stat -e pci/* -a sleep 10
```

### DMA 性能

```c
/* 测量 DMA 传输速度 */
ktime_t start = ktime_get();

/* DMA 传输 */

ktime_t end = ktime_get();
s64 elapsed_ns = ktime_to_ns(ktime_sub(end, start));
u64 bandwidth_mbps = (size * 1000) / elapsed_ns;

pr_info("DMA bandwidth: %llu MB/s\n", bandwidth_mbps);
```

## 📄 授权

本驱动遵循 GPL v2 授权。

## 🤝 贡献

欢迎提交问题报告和改进建议！

---

**最后更新**: 2025-11-18
**维护者**: AI-Assisted Development Team
