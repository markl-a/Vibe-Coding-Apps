/*
 * usb_skeleton.c - USB 驱动骨架示例
 *
 * 这是一个 USB 驱动程序范例，展示了：
 * - USB 设备探测和断开
 * - URB (USB Request Block) 处理
 * - 读写操作
 * - 中断和批量传输
 * - 设备节点创建
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/usb.h>
#include <linux/slab.h>
#include <linux/mutex.h>
#include <linux/uaccess.h>
#include <linux/semaphore.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("AI-Assisted Developer");
MODULE_DESCRIPTION("USB Skeleton Driver Example");
MODULE_VERSION("1.0");

#define USB_SKEL_MINOR_BASE	192
#define WRITES_IN_FLIGHT	8
#define MAX_TRANSFER		(PAGE_SIZE - 512)

/* USB 设备 ID 表 */
static const struct usb_device_id skel_table[] = {
	/* 添加你的 USB 设备 ID (这里使用通用设备作为示例) */
	{ USB_DEVICE(0x0000, 0x0000) },  /* 替换为实际的 VID:PID */
	{ }
};
MODULE_DEVICE_TABLE(usb, skel_table);

/* 设备私有数据结构 */
struct usb_skel {
	struct usb_device	*udev;			/* USB 设备 */
	struct usb_interface	*interface;		/* 接口 */
	struct usb_anchor	submitted;		/* URB anchor */
	struct urb		*bulk_in_urb;		/* 批量输入 URB */
	unsigned char           *bulk_in_buffer;	/* 输入缓冲区 */
	size_t			bulk_in_size;		/* 输入缓冲区大小 */
	size_t			bulk_in_filled;		/* 已填充字节数 */
	size_t			bulk_in_copied;		/* 已复制字节数 */
	__u8			bulk_in_endpointAddr;	/* 输入端点地址 */
	__u8			bulk_out_endpointAddr;	/* 输出端点地址 */
	int			errors;			/* 错误计数 */
	spinlock_t		err_lock;		/* 错误锁 */
	struct kref		kref;			/* 引用计数 */
	struct mutex		io_mutex;		/* I/O 互斥锁 */
	struct semaphore	limit_sem;		/* 限制并发写入 */
	unsigned long		disconnected:1;		/* 断开标志 */
	wait_queue_head_t	bulk_in_wait;		/* 读等待队列 */
};

#define to_skel_dev(d) container_of(d, struct usb_skel, kref)

static struct usb_driver skel_driver;

/*
 * skel_delete - 删除设备
 */
static void skel_delete(struct kref *kref)
{
	struct usb_skel *dev = to_skel_dev(kref);

	usb_free_urb(dev->bulk_in_urb);
	usb_put_dev(dev->udev);
	kfree(dev->bulk_in_buffer);
	kfree(dev);
}

/*
 * skel_open - 打开设备
 */
static int skel_open(struct inode *inode, struct file *file)
{
	struct usb_skel *dev;
	struct usb_interface *interface;
	int subminor;
	int retval = 0;

	subminor = iminor(inode);

	interface = usb_find_interface(&skel_driver, subminor);
	if (!interface) {
		pr_err("%s - error, can't find device for minor %d\n",
		       __func__, subminor);
		retval = -ENODEV;
		goto exit;
	}

	dev = usb_get_intfdata(interface);
	if (!dev) {
		retval = -ENODEV;
		goto exit;
	}

	retval = usb_autopm_get_interface(interface);
	if (retval)
		goto exit;

	/* 增加引用计数 */
	kref_get(&dev->kref);

	/* 保存设备指针供后续使用 */
	file->private_data = dev;

exit:
	return retval;
}

/*
 * skel_release - 关闭设备
 */
static int skel_release(struct inode *inode, struct file *file)
{
	struct usb_skel *dev;

	dev = file->private_data;
	if (dev == NULL)
		return -ENODEV;

	/* 允许设备休眠 */
	usb_autopm_put_interface(dev->interface);

	/* 减少引用计数 */
	kref_put(&dev->kref, skel_delete);
	return 0;
}

/*
 * skel_flush - 刷新设备
 */
static int skel_flush(struct file *file, fl_owner_t id)
{
	struct usb_skel *dev;
	int res;

	dev = file->private_data;
	if (dev == NULL)
		return -ENODEV;

	/* 等待所有 URB 完成 */
	res = usb_wait_anchor_empty_timeout(&dev->submitted, 1000);
	if (!res)
		usb_kill_anchored_urbs(&dev->submitted);

	return 0;
}

/*
 * skel_read_bulk_callback - 批量读取回调
 */
static void skel_read_bulk_callback(struct urb *urb)
{
	struct usb_skel *dev;
	unsigned long flags;

	dev = urb->context;

	spin_lock_irqsave(&dev->err_lock, flags);
	/* 同步/异步断开错误 */
	if (urb->status) {
		if (!(urb->status == -ENOENT ||
		      urb->status == -ECONNRESET ||
		      urb->status == -ESHUTDOWN))
			dev_err(&dev->interface->dev,
				"%s - nonzero read bulk status received: %d\n",
				__func__, urb->status);

		dev->errors = urb->status;
	} else {
		dev->bulk_in_filled = urb->actual_length;
	}
	dev->bulk_in_copied = 0;
	spin_unlock_irqrestore(&dev->err_lock, flags);

	/* 唤醒等待的读取进程 */
	wake_up_interruptible(&dev->bulk_in_wait);
}

/*
 * do_read_io - 执行读取操作
 */
static int do_read_io(struct usb_skel *dev, size_t count)
{
	int rv;

	/* 准备批量输入 URB */
	usb_fill_bulk_urb(dev->bulk_in_urb,
			dev->udev,
			usb_rcvbulkpipe(dev->udev,
				dev->bulk_in_endpointAddr),
			dev->bulk_in_buffer,
			min(dev->bulk_in_size, count),
			skel_read_bulk_callback,
			dev);

	/* 提交 URB */
	spin_lock_irq(&dev->err_lock);
	dev->bulk_in_filled = 0;
	dev->bulk_in_copied = 0;
	dev->errors = 0;
	spin_unlock_irq(&dev->err_lock);

	usb_anchor_urb(dev->bulk_in_urb, &dev->submitted);
	rv = usb_submit_urb(dev->bulk_in_urb, GFP_KERNEL);
	if (rv < 0) {
		dev_err(&dev->interface->dev,
			"%s - failed submitting read urb, error %d\n",
			__func__, rv);
		rv = (rv == -ENOMEM) ? rv : -EIO;
		spin_lock_irq(&dev->err_lock);
		dev->errors = rv;
		spin_unlock_irq(&dev->err_lock);
		usb_unanchor_urb(dev->bulk_in_urb);
	}

	return rv;
}

/*
 * skel_read - 从设备读取数据
 */
static ssize_t skel_read(struct file *file, char __user *buffer,
			 size_t count, loff_t *ppos)
{
	struct usb_skel *dev;
	int rv;
	bool ongoing_io;

	dev = file->private_data;

	if (!count)
		return 0;

	/* 禁止并发 I/O */
	rv = mutex_lock_interruptible(&dev->io_mutex);
	if (rv < 0)
		return rv;

	if (dev->disconnected) {
		rv = -ENODEV;
		goto exit;
	}

	/* 如果有数据，复制到用户空间 */
retry:
	spin_lock_irq(&dev->err_lock);
	ongoing_io = dev->bulk_in_filled && !dev->bulk_in_copied;
	spin_unlock_irq(&dev->err_lock);

	if (ongoing_io) {
		/* 等待读取完成或错误 */
		rv = wait_event_interruptible(dev->bulk_in_wait,
				dev->bulk_in_filled || dev->errors);
		if (rv < 0)
			goto exit;
	}

	rv = dev->errors;
	if (rv < 0) {
		/* 清除错误并重试 */
		dev->errors = 0;
		rv = (rv == -EPIPE) ? rv : -EIO;
		goto exit;
	}

	if (dev->bulk_in_filled) {
		/* 有数据可读 */
		size_t available = dev->bulk_in_filled - dev->bulk_in_copied;
		size_t chunk = min(available, count);

		if (!available) {
			/* 所有数据已复制，重新开始 I/O */
			do_read_io(dev, count);
			goto retry;
		}

		/* 复制数据到用户空间 */
		if (copy_to_user(buffer,
				 dev->bulk_in_buffer + dev->bulk_in_copied,
				 chunk)) {
			rv = -EFAULT;
		} else {
			rv = chunk;
			dev->bulk_in_copied += chunk;

			/* 如果所有数据已复制，重新开始 I/O */
			if (dev->bulk_in_copied >= dev->bulk_in_filled)
				do_read_io(dev, count);
		}
	} else {
		/* 没有数据，启动 I/O */
		do_read_io(dev, count);
		goto retry;
	}

exit:
	mutex_unlock(&dev->io_mutex);
	return rv;
}

/*
 * skel_write_bulk_callback - 批量写入回调
 */
static void skel_write_bulk_callback(struct urb *urb)
{
	struct usb_skel *dev;
	unsigned long flags;

	dev = urb->context;

	/* 同步/异步断开错误 */
	spin_lock_irqsave(&dev->err_lock, flags);
	if (urb->status) {
		if (!(urb->status == -ENOENT ||
		      urb->status == -ECONNRESET ||
		      urb->status == -ESHUTDOWN))
			dev_err(&dev->interface->dev,
				"%s - nonzero write bulk status received: %d\n",
				__func__, urb->status);

		dev->errors = urb->status;
	}
	spin_unlock_irqrestore(&dev->err_lock, flags);

	/* 释放分配的缓冲区 */
	usb_free_coherent(urb->dev, urb->transfer_buffer_length,
			  urb->transfer_buffer, urb->transfer_dma);
}

/*
 * skel_write - 向设备写入数据
 */
static ssize_t skel_write(struct file *file, const char __user *user_buffer,
			  size_t count, loff_t *ppos)
{
	struct usb_skel *dev;
	int retval = 0;
	struct urb *urb = NULL;
	char *buf = NULL;
	size_t writesize = min(count, (size_t)MAX_TRANSFER);

	dev = file->private_data;

	if (count == 0)
		goto exit;

	/* 限制并发写入数量 */
	if (!(file->f_flags & O_NONBLOCK)) {
		if (down_interruptible(&dev->limit_sem)) {
			retval = -ERESTARTSYS;
			goto exit;
		}
	} else {
		if (down_trylock(&dev->limit_sem)) {
			retval = -EAGAIN;
			goto exit;
		}
	}

	spin_lock_irq(&dev->err_lock);
	retval = dev->errors;
	if (retval < 0) {
		/* 清除错误 */
		dev->errors = 0;
		retval = (retval == -EPIPE) ? retval : -EIO;
	}
	spin_unlock_irq(&dev->err_lock);
	if (retval < 0)
		goto error;

	/* 创建 URB 并分配缓冲区 */
	urb = usb_alloc_urb(0, GFP_KERNEL);
	if (!urb) {
		retval = -ENOMEM;
		goto error;
	}

	buf = usb_alloc_coherent(dev->udev, writesize, GFP_KERNEL,
				 &urb->transfer_dma);
	if (!buf) {
		retval = -ENOMEM;
		goto error;
	}

	if (copy_from_user(buf, user_buffer, writesize)) {
		retval = -EFAULT;
		goto error;
	}

	/* 初始化 URB */
	usb_fill_bulk_urb(urb, dev->udev,
			  usb_sndbulkpipe(dev->udev, dev->bulk_out_endpointAddr),
			  buf, writesize, skel_write_bulk_callback, dev);
	urb->transfer_flags |= URB_NO_TRANSFER_DMA_MAP;
	usb_anchor_urb(urb, &dev->submitted);

	/* 提交 URB */
	retval = usb_submit_urb(urb, GFP_KERNEL);
	mutex_unlock(&dev->io_mutex);
	if (retval) {
		dev_err(&dev->interface->dev,
			"%s - failed submitting write urb, error %d\n",
			__func__, retval);
		goto error_unanchor;
	}

	/* 释放 URB 引用 */
	usb_free_urb(urb);

	return writesize;

error_unanchor:
	usb_unanchor_urb(urb);
error:
	if (urb) {
		usb_free_coherent(dev->udev, writesize, buf, urb->transfer_dma);
		usb_free_urb(urb);
	}
	up(&dev->limit_sem);

exit:
	return retval;
}

/* 文件操作 */
static const struct file_operations skel_fops = {
	.owner =	THIS_MODULE,
	.read =		skel_read,
	.write =	skel_write,
	.open =		skel_open,
	.release =	skel_release,
	.flush =	skel_flush,
	.llseek =	noop_llseek,
};

/* USB 类驱动结构 */
static struct usb_class_driver skel_class = {
	.name =		"usb/skel%d",
	.fops =		&skel_fops,
	.minor_base =	USB_SKEL_MINOR_BASE,
};

/*
 * skel_probe - USB 设备探测
 */
static int skel_probe(struct usb_interface *interface,
		      const struct usb_device_id *id)
{
	struct usb_skel *dev;
	struct usb_endpoint_descriptor *bulk_in, *bulk_out;
	int retval;

	/* 分配内存 */
	dev = kzalloc(sizeof(*dev), GFP_KERNEL);
	if (!dev)
		return -ENOMEM;

	kref_init(&dev->kref);
	init_usb_anchor(&dev->submitted);
	mutex_init(&dev->io_mutex);
	spin_lock_init(&dev->err_lock);
	sema_init(&dev->limit_sem, WRITES_IN_FLIGHT);
	init_waitqueue_head(&dev->bulk_in_wait);

	dev->udev = usb_get_dev(interface_to_usbdev(interface));
	dev->interface = interface;

	/* 查找批量端点 */
	retval = usb_find_common_endpoints(interface->cur_altsetting,
			&bulk_in, &bulk_out, NULL, NULL);
	if (retval) {
		dev_err(&interface->dev,
			"Could not find both bulk-in and bulk-out endpoints\n");
		goto error;
	}

	dev->bulk_in_size = usb_endpoint_maxp(bulk_in);
	dev->bulk_in_endpointAddr = bulk_in->bEndpointAddress;
	dev->bulk_in_buffer = kmalloc(dev->bulk_in_size, GFP_KERNEL);
	if (!dev->bulk_in_buffer) {
		retval = -ENOMEM;
		goto error;
	}
	dev->bulk_in_urb = usb_alloc_urb(0, GFP_KERNEL);
	if (!dev->bulk_in_urb) {
		retval = -ENOMEM;
		goto error;
	}

	dev->bulk_out_endpointAddr = bulk_out->bEndpointAddress;

	/* 保存设备指针 */
	usb_set_intfdata(interface, dev);

	/* 注册设备 */
	retval = usb_register_dev(interface, &skel_class);
	if (retval) {
		dev_err(&interface->dev,
			"Not able to get a minor for this device.\n");
		usb_set_intfdata(interface, NULL);
		goto error;
	}

	dev_info(&interface->dev,
		 "USB Skeleton device now attached to USBSkel-%d",
		 interface->minor);
	return 0;

error:
	kref_put(&dev->kref, skel_delete);
	return retval;
}

/*
 * skel_disconnect - USB 设备断开
 */
static void skel_disconnect(struct usb_interface *interface)
{
	struct usb_skel *dev;
	int minor = interface->minor;

	dev = usb_get_intfdata(interface);
	usb_set_intfdata(interface, NULL);

	/* 注销设备 */
	usb_deregister_dev(interface, &skel_class);

	/* 阻止更多 I/O */
	mutex_lock(&dev->io_mutex);
	dev->disconnected = 1;
	mutex_unlock(&dev->io_mutex);

	usb_kill_anchored_urbs(&dev->submitted);

	/* 减少引用计数 */
	kref_put(&dev->kref, skel_delete);

	dev_info(&interface->dev, "USB Skeleton #%d now disconnected", minor);
}

/*
 * skel_suspend - USB 设备挂起
 */
static int skel_suspend(struct usb_interface *intf, pm_message_t message)
{
	struct usb_skel *dev = usb_get_intfdata(intf);

	if (!dev)
		return 0;

	usb_kill_anchored_urbs(&dev->submitted);
	return 0;
}

/*
 * skel_resume - USB 设备恢复
 */
static int skel_resume(struct usb_interface *intf)
{
	return 0;
}

/*
 * skel_pre_reset - 重置前准备
 */
static int skel_pre_reset(struct usb_interface *intf)
{
	struct usb_skel *dev = usb_get_intfdata(intf);

	mutex_lock(&dev->io_mutex);
	usb_kill_anchored_urbs(&dev->submitted);

	return 0;
}

/*
 * skel_post_reset - 重置后处理
 */
static int skel_post_reset(struct usb_interface *intf)
{
	struct usb_skel *dev = usb_get_intfdata(intf);

	mutex_unlock(&dev->io_mutex);

	return 0;
}

/* USB 驱动结构 */
static struct usb_driver skel_driver = {
	.name =		"skeleton",
	.probe =	skel_probe,
	.disconnect =	skel_disconnect,
	.suspend =	skel_suspend,
	.resume =	skel_resume,
	.pre_reset =	skel_pre_reset,
	.post_reset =	skel_post_reset,
	.id_table =	skel_table,
	.supports_autosuspend = 1,
};

module_usb_driver(skel_driver);
