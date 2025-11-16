/*
 * simple_chardev.c - 簡單字元設備驅動
 *
 * 這是一個基本的字元設備驅動範例，展示了：
 * - 字元設備註冊
 * - file_operations 實作
 * - 用戶空間與核心空間數據傳輸
 * - 設備類別和設備節點自動創建
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>
#include <linux/slab.h>

#define DEVICE_NAME "simple_char"
#define CLASS_NAME "chardev"
#define BUFFER_SIZE 1024

MODULE_LICENSE("GPL");
MODULE_AUTHOR("AI-Assisted Developer");
MODULE_DESCRIPTION("Simple Character Device Driver");
MODULE_VERSION("1.0");

/* 設備結構 */
struct chardev_data {
    dev_t dev_num;              /* 設備號 */
    struct cdev cdev;           /* 字元設備結構 */
    struct class *class;        /* 設備類別 */
    struct device *device;      /* 設備 */
    char *buffer;               /* 數據緩衝區 */
    size_t buffer_size;         /* 緩衝區大小 */
    struct mutex lock;          /* 互斥鎖 */
};

static struct chardev_data *chardev;

/*
 * device_open - 設備打開操作
 */
static int device_open(struct inode *inode, struct file *file)
{
    pr_info("%s: Device opened\n", DEVICE_NAME);
    file->private_data = chardev;
    return 0;
}

/*
 * device_release - 設備關閉操作
 */
static int device_release(struct inode *inode, struct file *file)
{
    pr_info("%s: Device closed\n", DEVICE_NAME);
    return 0;
}

/*
 * device_read - 從設備讀取數據
 */
static ssize_t device_read(struct file *file, char __user *user_buffer,
                          size_t len, loff_t *offset)
{
    struct chardev_data *data = file->private_data;
    size_t bytes_to_read;
    int ret;

    if (*offset >= data->buffer_size)
        return 0;

    mutex_lock(&data->lock);

    bytes_to_read = min(len, (size_t)(data->buffer_size - *offset));

    ret = copy_to_user(user_buffer, data->buffer + *offset, bytes_to_read);
    if (ret) {
        mutex_unlock(&data->lock);
        pr_err("%s: Failed to copy data to user\n", DEVICE_NAME);
        return -EFAULT;
    }

    *offset += bytes_to_read;
    mutex_unlock(&data->lock);

    pr_info("%s: Read %zu bytes\n", DEVICE_NAME, bytes_to_read);
    return bytes_to_read;
}

/*
 * device_write - 向設備寫入數據
 */
static ssize_t device_write(struct file *file, const char __user *user_buffer,
                           size_t len, loff_t *offset)
{
    struct chardev_data *data = file->private_data;
    size_t bytes_to_write;
    int ret;

    if (*offset >= BUFFER_SIZE)
        return -ENOSPC;

    mutex_lock(&data->lock);

    bytes_to_write = min(len, (size_t)(BUFFER_SIZE - *offset));

    ret = copy_from_user(data->buffer + *offset, user_buffer, bytes_to_write);
    if (ret) {
        mutex_unlock(&data->lock);
        pr_err("%s: Failed to copy data from user\n", DEVICE_NAME);
        return -EFAULT;
    }

    *offset += bytes_to_write;
    data->buffer_size = max(data->buffer_size, (size_t)*offset);
    mutex_unlock(&data->lock);

    pr_info("%s: Wrote %zu bytes\n", DEVICE_NAME, bytes_to_write);
    return bytes_to_write;
}

/*
 * device_llseek - 設備定位操作
 */
static loff_t device_llseek(struct file *file, loff_t offset, int whence)
{
    struct chardev_data *data = file->private_data;
    loff_t new_pos;

    switch (whence) {
    case SEEK_SET:
        new_pos = offset;
        break;
    case SEEK_CUR:
        new_pos = file->f_pos + offset;
        break;
    case SEEK_END:
        new_pos = data->buffer_size + offset;
        break;
    default:
        return -EINVAL;
    }

    if (new_pos < 0 || new_pos > BUFFER_SIZE)
        return -EINVAL;

    file->f_pos = new_pos;
    return new_pos;
}

/* 文件操作結構 */
static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = device_open,
    .release = device_release,
    .read = device_read,
    .write = device_write,
    .llseek = device_llseek,
};

/*
 * chardev_init - 模組初始化
 */
static int __init chardev_init(void)
{
    int ret;

    pr_info("%s: Initializing module\n", DEVICE_NAME);

    /* 分配設備結構 */
    chardev = kzalloc(sizeof(struct chardev_data), GFP_KERNEL);
    if (!chardev) {
        pr_err("%s: Failed to allocate device structure\n", DEVICE_NAME);
        return -ENOMEM;
    }

    /* 分配數據緩衝區 */
    chardev->buffer = kzalloc(BUFFER_SIZE, GFP_KERNEL);
    if (!chardev->buffer) {
        pr_err("%s: Failed to allocate buffer\n", DEVICE_NAME);
        ret = -ENOMEM;
        goto err_free_chardev;
    }

    chardev->buffer_size = 0;
    mutex_init(&chardev->lock);

    /* 動態分配設備號 */
    ret = alloc_chrdev_region(&chardev->dev_num, 0, 1, DEVICE_NAME);
    if (ret < 0) {
        pr_err("%s: Failed to allocate device number\n", DEVICE_NAME);
        goto err_free_buffer;
    }

    pr_info("%s: Allocated major number %d\n", DEVICE_NAME, MAJOR(chardev->dev_num));

    /* 初始化並添加字元設備 */
    cdev_init(&chardev->cdev, &fops);
    chardev->cdev.owner = THIS_MODULE;

    ret = cdev_add(&chardev->cdev, chardev->dev_num, 1);
    if (ret < 0) {
        pr_err("%s: Failed to add cdev\n", DEVICE_NAME);
        goto err_unregister_chrdev;
    }

    /* 創建設備類別 */
    chardev->class = class_create(THIS_MODULE, CLASS_NAME);
    if (IS_ERR(chardev->class)) {
        pr_err("%s: Failed to create class\n", DEVICE_NAME);
        ret = PTR_ERR(chardev->class);
        goto err_cdev_del;
    }

    /* 創建設備節點 */
    chardev->device = device_create(chardev->class, NULL, chardev->dev_num,
                                   NULL, DEVICE_NAME);
    if (IS_ERR(chardev->device)) {
        pr_err("%s: Failed to create device\n", DEVICE_NAME);
        ret = PTR_ERR(chardev->device);
        goto err_class_destroy;
    }

    pr_info("%s: Module loaded successfully. Device created at /dev/%s\n",
            DEVICE_NAME, DEVICE_NAME);
    return 0;

err_class_destroy:
    class_destroy(chardev->class);
err_cdev_del:
    cdev_del(&chardev->cdev);
err_unregister_chrdev:
    unregister_chrdev_region(chardev->dev_num, 1);
err_free_buffer:
    kfree(chardev->buffer);
err_free_chardev:
    kfree(chardev);
    return ret;
}

/*
 * chardev_exit - 模組卸載
 */
static void __exit chardev_exit(void)
{
    pr_info("%s: Unloading module\n", DEVICE_NAME);

    device_destroy(chardev->class, chardev->dev_num);
    class_destroy(chardev->class);
    cdev_del(&chardev->cdev);
    unregister_chrdev_region(chardev->dev_num, 1);
    kfree(chardev->buffer);
    kfree(chardev);

    pr_info("%s: Module unloaded successfully\n", DEVICE_NAME);
}

module_init(chardev_init);
module_exit(chardev_exit);
