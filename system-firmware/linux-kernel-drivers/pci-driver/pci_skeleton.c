/*
 * pci_skeleton.c - PCI/PCIe 驱动骨架示例
 *
 * 这是一个 PCI 驱动程序范例，展示了：
 * - PCI 设备探测和移除
 * - 配置空间访问
 * - 内存和 I/O 资源映射
 * - MSI/MSI-X 中断处理
 * - DMA 传输
 * - 电源管理
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/pci.h>
#include <linux/init.h>
#include <linux/interrupt.h>
#include <linux/dma-mapping.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("AI-Assisted Developer");
MODULE_DESCRIPTION("PCI Skeleton Driver Example");
MODULE_VERSION("1.0");

#define DRV_NAME "pci_skel"
#define DMA_BUF_SIZE (4 * PAGE_SIZE)

/* PCI 设备 ID 表 */
static const struct pci_device_id pci_skel_ids[] = {
	/* 示例：Intel E1000 网卡 */
	{ PCI_DEVICE(0x8086, 0x100E) },
	/* 添加你的设备 ID */
	{ PCI_DEVICE(0x0000, 0x0000) },  /* 替换为实际的 VID:PID */
	{ 0, }
};
MODULE_DEVICE_TABLE(pci, pci_skel_ids);

/* 设备私有数据结构 */
struct pci_skel_dev {
	struct pci_dev		*pdev;		/* PCI 设备 */
	void __iomem		*mmio_base;	/* MMIO 基地址 */
	unsigned long		mmio_start;	/* MMIO 起始地址 */
	unsigned long		mmio_len;	/* MMIO 长度 */

	/* DMA 相关 */
	dma_addr_t		dma_handle;	/* DMA 物理地址 */
	void			*dma_virt;	/* DMA 虚拟地址 */

	/* 中断 */
	int			irq;		/* IRQ 编号 */
	bool			msi_enabled;	/* MSI 是否启用 */

	/* 字符设备 */
	dev_t			dev_num;	/* 设备号 */
	struct cdev		cdev;		/* 字符设备 */
	struct class		*class;		/* 设备类 */
	struct device		*device;	/* 设备 */

	/* 同步 */
	spinlock_t		lock;		/* 自旋锁 */
	struct mutex		mutex;		/* 互斥锁 */
};

/*
 * pci_skel_read_config - 读取 PCI 配置空间
 */
static void pci_skel_read_config(struct pci_dev *pdev)
{
	u16 vendor, device;
	u8 revision, irq_line;
	u32 bar0;

	pci_read_config_word(pdev, PCI_VENDOR_ID, &vendor);
	pci_read_config_word(pdev, PCI_DEVICE_ID, &device);
	pci_read_config_byte(pdev, PCI_REVISION_ID, &revision);
	pci_read_config_byte(pdev, PCI_INTERRUPT_LINE, &irq_line);
	pci_read_config_dword(pdev, PCI_BASE_ADDRESS_0, &bar0);

	pr_info("%s: Vendor:Device = %04x:%04x, Rev = %02x\n",
		DRV_NAME, vendor, device, revision);
	pr_info("%s: IRQ Line = %d, BAR0 = 0x%08x\n",
		DRV_NAME, irq_line, bar0);
}

/*
 * pci_skel_isr - 中断服务程序
 */
static irqreturn_t pci_skel_isr(int irq, void *dev_id)
{
	struct pci_skel_dev *sdev = dev_id;
	u32 status;

	/* 读取中断状态（示例，实际地址依赖于硬件） */
	if (sdev->mmio_base) {
		status = ioread32(sdev->mmio_base);

		/* 检查是否是我们的中断 */
		if (!(status & 0x1))
			return IRQ_NONE;

		/* 清除中断状态 */
		iowrite32(status, sdev->mmio_base);

		pr_info("%s: Interrupt received, status = 0x%08x\n",
			DRV_NAME, status);
	}

	return IRQ_HANDLED;
}

/*
 * pci_skel_setup_dma - 设置 DMA
 */
static int pci_skel_setup_dma(struct pci_skel_dev *sdev)
{
	struct pci_dev *pdev = sdev->pdev;
	int ret;

	/* 设置 DMA 掩码（支持 64 位 DMA） */
	ret = dma_set_mask_and_coherent(&pdev->dev, DMA_BIT_MASK(64));
	if (ret) {
		/* 尝试 32 位 DMA */
		ret = dma_set_mask_and_coherent(&pdev->dev, DMA_BIT_MASK(32));
		if (ret) {
			dev_err(&pdev->dev, "No suitable DMA available\n");
			return ret;
		}
		pr_info("%s: Using 32-bit DMA\n", DRV_NAME);
	} else {
		pr_info("%s: Using 64-bit DMA\n", DRV_NAME);
	}

	/* 分配一致性 DMA 缓冲区 */
	sdev->dma_virt = dma_alloc_coherent(&pdev->dev, DMA_BUF_SIZE,
					    &sdev->dma_handle, GFP_KERNEL);
	if (!sdev->dma_virt) {
		dev_err(&pdev->dev, "Failed to allocate DMA buffer\n");
		return -ENOMEM;
	}

	pr_info("%s: DMA buffer allocated at phys=0x%llx, virt=%p\n",
		DRV_NAME, (unsigned long long)sdev->dma_handle, sdev->dma_virt);

	return 0;
}

/*
 * pci_skel_cleanup_dma - 清理 DMA
 */
static void pci_skel_cleanup_dma(struct pci_skel_dev *sdev)
{
	if (sdev->dma_virt) {
		dma_free_coherent(&sdev->pdev->dev, DMA_BUF_SIZE,
				  sdev->dma_virt, sdev->dma_handle);
		sdev->dma_virt = NULL;
	}
}

/*
 * device_open - 打开设备
 */
static int device_open(struct inode *inode, struct file *file)
{
	struct pci_skel_dev *sdev;

	sdev = container_of(inode->i_cdev, struct pci_skel_dev, cdev);
	file->private_data = sdev;

	pr_info("%s: Device opened\n", DRV_NAME);
	return 0;
}

/*
 * device_release - 关闭设备
 */
static int device_release(struct inode *inode, struct file *file)
{
	pr_info("%s: Device closed\n", DRV_NAME);
	return 0;
}

/*
 * device_read - 从设备读取
 */
static ssize_t device_read(struct file *file, char __user *buffer,
			   size_t len, loff_t *offset)
{
	struct pci_skel_dev *sdev = file->private_data;
	char data[256];
	int bytes;

	if (*offset > 0)
		return 0;

	/* 准备要读取的数据 */
	bytes = snprintf(data, sizeof(data),
			"PCI Device Information:\n"
			"  Vendor:Device = %04x:%04x\n"
			"  MMIO Base = 0x%lx\n"
			"  MMIO Length = 0x%lx\n"
			"  DMA Address = 0x%llx\n"
			"  IRQ = %d\n"
			"  MSI Enabled = %s\n",
			sdev->pdev->vendor, sdev->pdev->device,
			sdev->mmio_start, sdev->mmio_len,
			(unsigned long long)sdev->dma_handle,
			sdev->irq,
			sdev->msi_enabled ? "Yes" : "No");

	if (len < bytes)
		bytes = len;

	if (copy_to_user(buffer, data, bytes))
		return -EFAULT;

	*offset += bytes;
	return bytes;
}

/*
 * device_write - 向设备写入
 */
static ssize_t device_write(struct file *file, const char __user *buffer,
			    size_t len, loff_t *offset)
{
	struct pci_skel_dev *sdev = file->private_data;
	char cmd[64];
	size_t cmd_len;

	cmd_len = min(len, sizeof(cmd) - 1);

	if (copy_from_user(cmd, buffer, cmd_len))
		return -EFAULT;

	cmd[cmd_len] = '\0';

	pr_info("%s: Received command: %s\n", DRV_NAME, cmd);

	/* 处理命令（示例） */
	if (strncmp(cmd, "reset", 5) == 0) {
		pr_info("%s: Reset command received\n", DRV_NAME);
		/* 执行设备重置 */
	}

	return len;
}

/* 文件操作 */
static const struct file_operations fops = {
	.owner = THIS_MODULE,
	.open = device_open,
	.release = device_release,
	.read = device_read,
	.write = device_write,
};

/*
 * pci_skel_probe - PCI 设备探测
 */
static int pci_skel_probe(struct pci_dev *pdev,
			  const struct pci_device_id *id)
{
	struct pci_skel_dev *sdev;
	int ret;

	dev_info(&pdev->dev, "Probing PCI device %04x:%04x\n",
		 pdev->vendor, pdev->device);

	/* 分配设备私有数据 */
	sdev = kzalloc(sizeof(*sdev), GFP_KERNEL);
	if (!sdev)
		return -ENOMEM;

	sdev->pdev = pdev;
	spin_lock_init(&sdev->lock);
	mutex_init(&sdev->mutex);
	pci_set_drvdata(pdev, sdev);

	/* 启用 PCI 设备 */
	ret = pci_enable_device(pdev);
	if (ret) {
		dev_err(&pdev->dev, "Failed to enable PCI device\n");
		goto err_free_sdev;
	}

	/* 读取配置空间 */
	pci_skel_read_config(pdev);

	/* 请求内存区域 */
	ret = pci_request_regions(pdev, DRV_NAME);
	if (ret) {
		dev_err(&pdev->dev, "Failed to request PCI regions\n");
		goto err_disable_device;
	}

	/* 映射 BAR0 (MMIO) */
	sdev->mmio_start = pci_resource_start(pdev, 0);
	sdev->mmio_len = pci_resource_len(pdev, 0);

	if (sdev->mmio_len > 0) {
		sdev->mmio_base = pci_iomap(pdev, 0, sdev->mmio_len);
		if (!sdev->mmio_base) {
			dev_err(&pdev->dev, "Failed to map MMIO region\n");
			ret = -ENOMEM;
			goto err_release_regions;
		}
		pr_info("%s: MMIO mapped at %p (phys: 0x%lx, len: 0x%lx)\n",
			DRV_NAME, sdev->mmio_base, sdev->mmio_start,
			sdev->mmio_len);
	}

	/* 设置总线主控 */
	pci_set_master(pdev);

	/* 设置 DMA */
	ret = pci_skel_setup_dma(sdev);
	if (ret)
		goto err_iounmap;

	/* 尝试启用 MSI */
	ret = pci_enable_msi(pdev);
	if (ret == 0) {
		sdev->msi_enabled = true;
		pr_info("%s: MSI enabled\n", DRV_NAME);
	} else {
		sdev->msi_enabled = false;
		pr_info("%s: MSI not available, using legacy IRQ\n", DRV_NAME);
	}

	/* 请求中断 */
	sdev->irq = pdev->irq;
	ret = request_irq(sdev->irq, pci_skel_isr, IRQF_SHARED,
			  DRV_NAME, sdev);
	if (ret) {
		dev_err(&pdev->dev, "Failed to request IRQ %d\n", sdev->irq);
		goto err_disable_msi;
	}
	pr_info("%s: IRQ %d registered\n", DRV_NAME, sdev->irq);

	/* 创建字符设备 */
	ret = alloc_chrdev_region(&sdev->dev_num, 0, 1, DRV_NAME);
	if (ret < 0) {
		dev_err(&pdev->dev, "Failed to allocate device number\n");
		goto err_free_irq;
	}

	cdev_init(&sdev->cdev, &fops);
	sdev->cdev.owner = THIS_MODULE;

	ret = cdev_add(&sdev->cdev, sdev->dev_num, 1);
	if (ret < 0) {
		dev_err(&pdev->dev, "Failed to add cdev\n");
		goto err_unregister_chrdev;
	}

	/* 创建设备类和设备节点 */
	sdev->class = class_create(THIS_MODULE, DRV_NAME);
	if (IS_ERR(sdev->class)) {
		ret = PTR_ERR(sdev->class);
		dev_err(&pdev->dev, "Failed to create class\n");
		goto err_cdev_del;
	}

	sdev->device = device_create(sdev->class, &pdev->dev, sdev->dev_num,
				     NULL, DRV_NAME);
	if (IS_ERR(sdev->device)) {
		ret = PTR_ERR(sdev->device);
		dev_err(&pdev->dev, "Failed to create device\n");
		goto err_class_destroy;
	}

	dev_info(&pdev->dev, "PCI device probe successful\n");
	dev_info(&pdev->dev, "Device node created at /dev/%s\n", DRV_NAME);

	return 0;

err_class_destroy:
	class_destroy(sdev->class);
err_cdev_del:
	cdev_del(&sdev->cdev);
err_unregister_chrdev:
	unregister_chrdev_region(sdev->dev_num, 1);
err_free_irq:
	free_irq(sdev->irq, sdev);
err_disable_msi:
	if (sdev->msi_enabled)
		pci_disable_msi(pdev);
	pci_skel_cleanup_dma(sdev);
err_iounmap:
	if (sdev->mmio_base)
		pci_iounmap(pdev, sdev->mmio_base);
err_release_regions:
	pci_release_regions(pdev);
err_disable_device:
	pci_disable_device(pdev);
err_free_sdev:
	kfree(sdev);
	return ret;
}

/*
 * pci_skel_remove - PCI 设备移除
 */
static void pci_skel_remove(struct pci_dev *pdev)
{
	struct pci_skel_dev *sdev = pci_get_drvdata(pdev);

	dev_info(&pdev->dev, "Removing PCI device\n");

	/* 删除设备节点 */
	if (sdev->device)
		device_destroy(sdev->class, sdev->dev_num);
	if (sdev->class)
		class_destroy(sdev->class);
	cdev_del(&sdev->cdev);
	unregister_chrdev_region(sdev->dev_num, 1);

	/* 释放中断 */
	free_irq(sdev->irq, sdev);

	/* 禁用 MSI */
	if (sdev->msi_enabled)
		pci_disable_msi(pdev);

	/* 清理 DMA */
	pci_skel_cleanup_dma(sdev);

	/* 取消映射 MMIO */
	if (sdev->mmio_base)
		pci_iounmap(pdev, sdev->mmio_base);

	/* 释放区域 */
	pci_release_regions(pdev);

	/* 禁用设备 */
	pci_disable_device(pdev);

	/* 释放私有数据 */
	kfree(sdev);

	dev_info(&pdev->dev, "PCI device removed successfully\n");
}

/*
 * pci_skel_suspend - 挂起设备
 */
static int pci_skel_suspend(struct pci_dev *pdev, pm_message_t state)
{
	dev_info(&pdev->dev, "Suspending device\n");

	/* 保存设备状态 */
	pci_save_state(pdev);

	/* 设置电源状态 */
	pci_set_power_state(pdev, pci_choose_state(pdev, state));

	return 0;
}

/*
 * pci_skel_resume - 恢复设备
 */
static int pci_skel_resume(struct pci_dev *pdev)
{
	dev_info(&pdev->dev, "Resuming device\n");

	/* 恢复电源状态 */
	pci_set_power_state(pdev, PCI_D0);

	/* 恢复设备状态 */
	pci_restore_state(pdev);

	/* 重新启用设备 */
	if (pci_enable_device(pdev) < 0) {
		dev_err(&pdev->dev, "Failed to re-enable device\n");
		return -EIO;
	}

	pci_set_master(pdev);

	return 0;
}

/* PCI 驱动结构 */
static struct pci_driver pci_skel_driver = {
	.name = DRV_NAME,
	.id_table = pci_skel_ids,
	.probe = pci_skel_probe,
	.remove = pci_skel_remove,
	.suspend = pci_skel_suspend,
	.resume = pci_skel_resume,
};

module_pci_driver(pci_skel_driver);
