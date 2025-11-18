/*
 * enhanced_chardev.c - 增强型字符设备驱动
 *
 * 这是一个增强的字符设备驱动范例，展示了：
 * - 完整的 file_operations 实现
 * - ioctl 命令处理
 * - sysfs 接口
 * - 非阻塞 I/O
 * - poll/select 支持
 * - 异步通知 (fasync)
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>
#include <linux/slab.h>
#include <linux/mutex.h>
#include <linux/wait.h>
#include <linux/poll.h>
#include <linux/sched.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("AI-Assisted Developer");
MODULE_DESCRIPTION("Enhanced Character Device Driver with ioctl and sysfs");
MODULE_VERSION("2.0");

#define DEVICE_NAME "echardev"
#define CLASS_NAME "echardev_class"
#define BUFFER_SIZE 4096

/* ioctl 命令定义 */
#define ECHARDEV_IOC_MAGIC 'E'
#define ECHARDEV_IOCRESET    _IO(ECHARDEV_IOC_MAGIC, 0)
#define ECHARDEV_IOCGSIZE    _IOR(ECHARDEV_IOC_MAGIC, 1, int)
#define ECHARDEV_IOCSSIZE    _IOW(ECHARDEV_IOC_MAGIC, 2, int)
#define ECHARDEV_IOCXSIZE    _IOWR(ECHARDEV_IOC_MAGIC, 3, int)
#define ECHARDEV_IOC_MAXNR   3

/* 设备状态 */
enum device_state {
	DEV_IDLE = 0,
	DEV_BUSY,
	DEV_ERROR
};

/* 设备私有数据 */
struct echardev_data {
	dev_t dev_num;			/* 设备号 */
	struct cdev cdev;		/* 字符设备结构 */
	struct class *class;		/* 设备类 */
	struct device *device;		/* 设备 */
	char *buffer;			/* 数据缓冲区 */
	size_t buffer_size;		/* 当前数据大小 */
	size_t max_size;		/* 最大缓冲区大小 */
	struct mutex lock;		/* 互斥锁 */
	wait_queue_head_t read_queue;	/* 读等待队列 */
	wait_queue_head_t write_queue;	/* 写等待队列 */
	struct fasync_struct *async_queue; /* 异步通知 */
	enum device_state state;	/* 设备状态 */
	unsigned long flags;		/* 标志 */
	int open_count;			/* 打开次数 */
	/* 统计信息 */
	unsigned long reads;		/* 读取次数 */
	unsigned long writes;		/* 写入次数 */
	unsigned long errors;		/* 错误次数 */
};

static struct echardev_data *echardev;

/*
 * device_fasync - 异步通知设置
 */
static int device_fasync(int fd, struct file *file, int mode)
{
	struct echardev_data *dev = file->private_data;
	return fasync_helper(fd, file, mode, &dev->async_queue);
}

/*
 * device_open - 打开设备
 */
static int device_open(struct inode *inode, struct file *file)
{
	struct echardev_data *dev;

	dev = container_of(inode->i_cdev, struct echardev_data, cdev);
	file->private_data = dev;

	mutex_lock(&dev->lock);
	dev->open_count++;
	dev->state = DEV_BUSY;
	mutex_unlock(&dev->lock);

	pr_info("%s: Device opened (count: %d)\n", DEVICE_NAME, dev->open_count);
	return 0;
}

/*
 * device_release - 关闭设备
 */
static int device_release(struct inode *inode, struct file *file)
{
	struct echardev_data *dev = file->private_data;

	/* 移除异步通知 */
	device_fasync(-1, file, 0);

	mutex_lock(&dev->lock);
	dev->open_count--;
	if (dev->open_count == 0)
		dev->state = DEV_IDLE;
	mutex_unlock(&dev->lock);

	pr_info("%s: Device closed (count: %d)\n", DEVICE_NAME, dev->open_count);
	return 0;
}

/*
 * device_read - 从设备读取
 */
static ssize_t device_read(struct file *file, char __user *user_buffer,
			   size_t len, loff_t *offset)
{
	struct echardev_data *dev = file->private_data;
	size_t bytes_to_read;
	int ret;

	if (mutex_lock_interruptible(&dev->lock))
		return -ERESTARTSYS;

	/* 非阻塞模式且没有数据 */
	while (dev->buffer_size == 0) {
		mutex_unlock(&dev->lock);

		if (file->f_flags & O_NONBLOCK)
			return -EAGAIN;

		if (wait_event_interruptible(dev->read_queue,
					     dev->buffer_size > 0))
			return -ERESTARTSYS;

		if (mutex_lock_interruptible(&dev->lock))
			return -ERESTARTSYS;
	}

	/* 计算要读取的字节数 */
	bytes_to_read = min(len, dev->buffer_size);

	ret = copy_to_user(user_buffer, dev->buffer, bytes_to_read);
	if (ret) {
		mutex_unlock(&dev->lock);
		dev->errors++;
		return -EFAULT;
	}

	/* 移除已读取的数据 */
	memmove(dev->buffer, dev->buffer + bytes_to_read,
		dev->buffer_size - bytes_to_read);
	dev->buffer_size -= bytes_to_read;

	dev->reads++;
	mutex_unlock(&dev->lock);

	/* 唤醒等待写入的进程 */
	wake_up_interruptible(&dev->write_queue);

	pr_debug("%s: Read %zu bytes\n", DEVICE_NAME, bytes_to_read);
	return bytes_to_read;
}

/*
 * device_write - 向设备写入
 */
static ssize_t device_write(struct file *file, const char __user *user_buffer,
			    size_t len, loff_t *offset)
{
	struct echardev_data *dev = file->private_data;
	size_t bytes_to_write;
	size_t available;
	int ret;

	if (mutex_lock_interruptible(&dev->lock))
		return -ERESTARTSYS;

	/* 检查可用空间 */
	while (dev->buffer_size >= dev->max_size) {
		mutex_unlock(&dev->lock);

		if (file->f_flags & O_NONBLOCK)
			return -EAGAIN;

		if (wait_event_interruptible(dev->write_queue,
					     dev->buffer_size < dev->max_size))
			return -ERESTARTSYS;

		if (mutex_lock_interruptible(&dev->lock))
			return -ERESTARTSYS;
	}

	/* 计算可写入的字节数 */
	available = dev->max_size - dev->buffer_size;
	bytes_to_write = min(len, available);

	ret = copy_from_user(dev->buffer + dev->buffer_size,
			     user_buffer, bytes_to_write);
	if (ret) {
		mutex_unlock(&dev->lock);
		dev->errors++;
		return -EFAULT;
	}

	dev->buffer_size += bytes_to_write;
	dev->writes++;
	mutex_unlock(&dev->lock);

	/* 唤醒等待读取的进程 */
	wake_up_interruptible(&dev->read_queue);

	/* 发送异步通知 */
	if (dev->async_queue)
		kill_fasync(&dev->async_queue, SIGIO, POLL_IN);

	pr_debug("%s: Wrote %zu bytes\n", DEVICE_NAME, bytes_to_write);
	return bytes_to_write;
}

/*
 * device_ioctl - ioctl 处理
 */
static long device_ioctl(struct file *file, unsigned int cmd, unsigned long arg)
{
	struct echardev_data *dev = file->private_data;
	int err = 0, ret = 0;
	int tmp;

	/* 验证命令 */
	if (_IOC_TYPE(cmd) != ECHARDEV_IOC_MAGIC)
		return -ENOTTY;
	if (_IOC_NR(cmd) > ECHARDEV_IOC_MAXNR)
		return -ENOTTY;

	/* 检查访问权限 */
	if (_IOC_DIR(cmd) & _IOC_READ)
		err = !access_ok((void __user *)arg, _IOC_SIZE(cmd));
	else if (_IOC_DIR(cmd) & _IOC_WRITE)
		err = !access_ok((void __user *)arg, _IOC_SIZE(cmd));
	if (err)
		return -EFAULT;

	/* 处理命令 */
	switch (cmd) {
	case ECHARDEV_IOCRESET:
		pr_info("%s: ioctl RESET\n", DEVICE_NAME);
		mutex_lock(&dev->lock);
		dev->buffer_size = 0;
		dev->reads = 0;
		dev->writes = 0;
		dev->errors = 0;
		mutex_unlock(&dev->lock);
		break;

	case ECHARDEV_IOCGSIZE:
		pr_debug("%s: ioctl GETSIZE\n", DEVICE_NAME);
		ret = put_user(dev->buffer_size, (int __user *)arg);
		break;

	case ECHARDEV_IOCSSIZE:
		pr_debug("%s: ioctl SETSIZE\n", DEVICE_NAME);
		ret = get_user(tmp, (int __user *)arg);
		if (ret == 0) {
			if (tmp < 0 || tmp > BUFFER_SIZE)
				return -EINVAL;
			mutex_lock(&dev->lock);
			dev->max_size = tmp;
			mutex_unlock(&dev->lock);
		}
		break;

	case ECHARDEV_IOCXSIZE:
		pr_debug("%s: ioctl XCHGSIZE\n", DEVICE_NAME);
		tmp = dev->buffer_size;
		ret = put_user(tmp, (int __user *)arg);
		if (ret == 0) {
			ret = get_user(tmp, (int __user *)arg);
			if (ret == 0 && tmp >= 0 && tmp <= BUFFER_SIZE) {
				mutex_lock(&dev->lock);
				dev->max_size = tmp;
				mutex_unlock(&dev->lock);
			}
		}
		break;

	default:
		return -ENOTTY;
	}

	return ret;
}

/*
 * device_poll - poll/select 支持
 */
static __poll_t device_poll(struct file *file, poll_table *wait)
{
	struct echardev_data *dev = file->private_data;
	__poll_t mask = 0;

	poll_wait(file, &dev->read_queue, wait);
	poll_wait(file, &dev->write_queue, wait);

	mutex_lock(&dev->lock);

	/* 有数据可读 */
	if (dev->buffer_size > 0)
		mask |= POLLIN | POLLRDNORM;

	/* 有空间可写 */
	if (dev->buffer_size < dev->max_size)
		mask |= POLLOUT | POLLWRNORM;

	mutex_unlock(&dev->lock);

	return mask;
}

/* 文件操作结构 */
static struct file_operations fops = {
	.owner = THIS_MODULE,
	.open = device_open,
	.release = device_release,
	.read = device_read,
	.write = device_write,
	.unlocked_ioctl = device_ioctl,
	.poll = device_poll,
	.fasync = device_fasync,
};

/* === sysfs 接口 === */

/*
 * state_show - 显示设备状态
 */
static ssize_t state_show(struct device *dev, struct device_attribute *attr,
			  char *buf)
{
	struct echardev_data *edev = dev_get_drvdata(dev);
	const char *state_str;

	switch (edev->state) {
	case DEV_IDLE:
		state_str = "idle";
		break;
	case DEV_BUSY:
		state_str = "busy";
		break;
	case DEV_ERROR:
		state_str = "error";
		break;
	default:
		state_str = "unknown";
	}

	return sprintf(buf, "%s\n", state_str);
}
static DEVICE_ATTR_RO(state);

/*
 * buffer_size_show - 显示当前缓冲区大小
 */
static ssize_t buffer_size_show(struct device *dev,
				struct device_attribute *attr, char *buf)
{
	struct echardev_data *edev = dev_get_drvdata(dev);
	return sprintf(buf, "%zu\n", edev->buffer_size);
}
static DEVICE_ATTR_RO(buffer_size);

/*
 * max_size_show/store - 显示/设置最大缓冲区大小
 */
static ssize_t max_size_show(struct device *dev,
			     struct device_attribute *attr, char *buf)
{
	struct echardev_data *edev = dev_get_drvdata(dev);
	return sprintf(buf, "%zu\n", edev->max_size);
}

static ssize_t max_size_store(struct device *dev,
			      struct device_attribute *attr,
			      const char *buf, size_t count)
{
	struct echardev_data *edev = dev_get_drvdata(dev);
	size_t new_size;
	int ret;

	ret = kstrtoul(buf, 10, &new_size);
	if (ret)
		return ret;

	if (new_size > BUFFER_SIZE)
		return -EINVAL;

	mutex_lock(&edev->lock);
	edev->max_size = new_size;
	mutex_unlock(&edev->lock);

	return count;
}
static DEVICE_ATTR_RW(max_size);

/*
 * stats_show - 显示统计信息
 */
static ssize_t stats_show(struct device *dev, struct device_attribute *attr,
			  char *buf)
{
	struct echardev_data *edev = dev_get_drvdata(dev);
	return sprintf(buf, "reads: %lu\nwrites: %lu\nerrors: %lu\nopen_count: %d\n",
		       edev->reads, edev->writes, edev->errors, edev->open_count);
}
static DEVICE_ATTR_RO(stats);

/* sysfs 属性组 */
static struct attribute *echardev_attrs[] = {
	&dev_attr_state.attr,
	&dev_attr_buffer_size.attr,
	&dev_attr_max_size.attr,
	&dev_attr_stats.attr,
	NULL,
};
ATTRIBUTE_GROUPS(echardev);

/*
 * echardev_init - 模块初始化
 */
static int __init echardev_init(void)
{
	int ret;

	pr_info("%s: Initializing enhanced character device\n", DEVICE_NAME);

	/* 分配设备结构 */
	echardev = kzalloc(sizeof(*echardev), GFP_KERNEL);
	if (!echardev)
		return -ENOMEM;

	/* 分配缓冲区 */
	echardev->buffer = kzalloc(BUFFER_SIZE, GFP_KERNEL);
	if (!echardev->buffer) {
		ret = -ENOMEM;
		goto err_free_dev;
	}

	/* 初始化设备 */
	echardev->buffer_size = 0;
	echardev->max_size = BUFFER_SIZE;
	echardev->state = DEV_IDLE;
	echardev->open_count = 0;
	echardev->reads = 0;
	echardev->writes = 0;
	echardev->errors = 0;

	mutex_init(&echardev->lock);
	init_waitqueue_head(&echardev->read_queue);
	init_waitqueue_head(&echardev->write_queue);

	/* 分配设备号 */
	ret = alloc_chrdev_region(&echardev->dev_num, 0, 1, DEVICE_NAME);
	if (ret < 0) {
		pr_err("%s: Failed to allocate device number\n", DEVICE_NAME);
		goto err_free_buffer;
	}

	/* 初始化字符设备 */
	cdev_init(&echardev->cdev, &fops);
	echardev->cdev.owner = THIS_MODULE;

	ret = cdev_add(&echardev->cdev, echardev->dev_num, 1);
	if (ret < 0) {
		pr_err("%s: Failed to add cdev\n", DEVICE_NAME);
		goto err_unregister_chrdev;
	}

	/* 创建设备类 */
	echardev->class = class_create(THIS_MODULE, CLASS_NAME);
	if (IS_ERR(echardev->class)) {
		ret = PTR_ERR(echardev->class);
		pr_err("%s: Failed to create class\n", DEVICE_NAME);
		goto err_cdev_del;
	}

	/* 设置 sysfs 属性组 */
	echardev->class->dev_groups = echardev_groups;

	/* 创建设备节点 */
	echardev->device = device_create(echardev->class, NULL,
					 echardev->dev_num, echardev,
					 DEVICE_NAME);
	if (IS_ERR(echardev->device)) {
		ret = PTR_ERR(echardev->device);
		pr_err("%s: Failed to create device\n", DEVICE_NAME);
		goto err_class_destroy;
	}

	pr_info("%s: Module loaded successfully\n", DEVICE_NAME);
	pr_info("%s: Device created at /dev/%s\n", DEVICE_NAME, DEVICE_NAME);
	pr_info("%s: sysfs attributes at /sys/class/%s/%s/\n",
		DEVICE_NAME, CLASS_NAME, DEVICE_NAME);

	return 0;

err_class_destroy:
	class_destroy(echardev->class);
err_cdev_del:
	cdev_del(&echardev->cdev);
err_unregister_chrdev:
	unregister_chrdev_region(echardev->dev_num, 1);
err_free_buffer:
	kfree(echardev->buffer);
err_free_dev:
	kfree(echardev);
	return ret;
}

/*
 * echardev_exit - 模块退出
 */
static void __exit echardev_exit(void)
{
	pr_info("%s: Unloading module\n", DEVICE_NAME);

	device_destroy(echardev->class, echardev->dev_num);
	class_destroy(echardev->class);
	cdev_del(&echardev->cdev);
	unregister_chrdev_region(echardev->dev_num, 1);
	kfree(echardev->buffer);
	kfree(echardev);

	pr_info("%s: Module unloaded successfully\n", DEVICE_NAME);
}

module_init(echardev_init);
module_exit(echardev_exit);
