#!/usr/bin/env python3
"""
driver_generator.py - AI 辅助的内核驱动代码生成器

这个工具使用模板和 AI 建议来生成内核驱动的骨架代码。
"""

import argparse
import sys
from pathlib import Path
from datetime import datetime

# 驱动类型模板
CHAR_DEVICE_TEMPLATE = '''/*
 * {driver_name}.c - {description}
 *
 * AI Generated Character Device Driver
 * Generated: {timestamp}
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>
#include <linux/slab.h>
#include <linux/mutex.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("{author}");
MODULE_DESCRIPTION("{description}");
MODULE_VERSION("1.0");

#define DEVICE_NAME "{driver_name}"
#define CLASS_NAME "{driver_name}_class"
#define BUFFER_SIZE {buffer_size}

/* 设备私有数据 */
struct {driver_name}_dev {{
    dev_t dev_num;
    struct cdev cdev;
    struct class *class;
    struct device *device;
    char *buffer;
    size_t buffer_size;
    struct mutex lock;
}};

static struct {driver_name}_dev *{driver_name}_device;

/*
 * device_open - 打开设备
 */
static int device_open(struct inode *inode, struct file *file)
{{
    pr_info("%s: Device opened\\n", DEVICE_NAME);
    file->private_data = {driver_name}_device;
    return 0;
}}

/*
 * device_release - 关闭设备
 */
static int device_release(struct inode *inode, struct file *file)
{{
    pr_info("%s: Device closed\\n", DEVICE_NAME);
    return 0;
}}

/*
 * device_read - 从设备读取
 */
static ssize_t device_read(struct file *file, char __user *user_buffer,
                          size_t len, loff_t *offset)
{{
    struct {driver_name}_dev *dev = file->private_data;
    size_t bytes_to_read;
    int ret;

    if (*offset >= dev->buffer_size)
        return 0;

    mutex_lock(&dev->lock);

    bytes_to_read = min(len, (size_t)(dev->buffer_size - *offset));

    ret = copy_to_user(user_buffer, dev->buffer + *offset, bytes_to_read);
    if (ret) {{
        mutex_unlock(&dev->lock);
        return -EFAULT;
    }}

    *offset += bytes_to_read;
    mutex_unlock(&dev->lock);

    pr_info("%s: Read %zu bytes\\n", DEVICE_NAME, bytes_to_read);
    return bytes_to_read;
}}

/*
 * device_write - 向设备写入
 */
static ssize_t device_write(struct file *file, const char __user *user_buffer,
                           size_t len, loff_t *offset)
{{
    struct {driver_name}_dev *dev = file->private_data;
    size_t bytes_to_write;
    int ret;

    if (*offset >= BUFFER_SIZE)
        return -ENOSPC;

    mutex_lock(&dev->lock);

    bytes_to_write = min(len, (size_t)(BUFFER_SIZE - *offset));

    ret = copy_from_user(dev->buffer + *offset, user_buffer, bytes_to_write);
    if (ret) {{
        mutex_unlock(&dev->lock);
        return -EFAULT;
    }}

    *offset += bytes_to_write;
    dev->buffer_size = max(dev->buffer_size, (size_t)*offset);
    mutex_unlock(&dev->lock);

    pr_info("%s: Wrote %zu bytes\\n", DEVICE_NAME, bytes_to_write);
    return bytes_to_write;
}}

/* 文件操作结构 */
static struct file_operations fops = {{
    .owner = THIS_MODULE,
    .open = device_open,
    .release = device_release,
    .read = device_read,
    .write = device_write,
}};

/*
 * {driver_name}_init - 模块初始化
 */
static int __init {driver_name}_init(void)
{{
    int ret;

    pr_info("%s: Initializing module\\n", DEVICE_NAME);

    /* 分配设备结构 */
    {driver_name}_device = kzalloc(sizeof(*{driver_name}_device), GFP_KERNEL);
    if (!{driver_name}_device)
        return -ENOMEM;

    /* 分配缓冲区 */
    {driver_name}_device->buffer = kzalloc(BUFFER_SIZE, GFP_KERNEL);
    if (!{driver_name}_device->buffer) {{
        ret = -ENOMEM;
        goto err_free_dev;
    }}

    mutex_init(&{driver_name}_device->lock);

    /* 分配设备号 */
    ret = alloc_chrdev_region(&{driver_name}_device->dev_num, 0, 1, DEVICE_NAME);
    if (ret < 0) {{
        pr_err("%s: Failed to allocate device number\\n", DEVICE_NAME);
        goto err_free_buffer;
    }}

    /* 初始化字符设备 */
    cdev_init(&{driver_name}_device->cdev, &fops);
    {driver_name}_device->cdev.owner = THIS_MODULE;

    ret = cdev_add(&{driver_name}_device->cdev, {driver_name}_device->dev_num, 1);
    if (ret < 0) {{
        pr_err("%s: Failed to add cdev\\n", DEVICE_NAME);
        goto err_unregister_chrdev;
    }}

    /* 创建设备类 */
    {driver_name}_device->class = class_create(THIS_MODULE, CLASS_NAME);
    if (IS_ERR({driver_name}_device->class)) {{
        ret = PTR_ERR({driver_name}_device->class);
        pr_err("%s: Failed to create class\\n", DEVICE_NAME);
        goto err_cdev_del;
    }}

    /* 创建设备节点 */
    {driver_name}_device->device = device_create({driver_name}_device->class, NULL,
                                                 {driver_name}_device->dev_num,
                                                 NULL, DEVICE_NAME);
    if (IS_ERR({driver_name}_device->device)) {{
        ret = PTR_ERR({driver_name}_device->device);
        pr_err("%s: Failed to create device\\n", DEVICE_NAME);
        goto err_class_destroy;
    }}

    pr_info("%s: Module loaded, device at /dev/%s\\n", DEVICE_NAME, DEVICE_NAME);
    return 0;

err_class_destroy:
    class_destroy({driver_name}_device->class);
err_cdev_del:
    cdev_del(&{driver_name}_device->cdev);
err_unregister_chrdev:
    unregister_chrdev_region({driver_name}_device->dev_num, 1);
err_free_buffer:
    kfree({driver_name}_device->buffer);
err_free_dev:
    kfree({driver_name}_device);
    return ret;
}}

/*
 * {driver_name}_exit - 模块退出
 */
static void __exit {driver_name}_exit(void)
{{
    pr_info("%s: Unloading module\\n", DEVICE_NAME);

    device_destroy({driver_name}_device->class, {driver_name}_device->dev_num);
    class_destroy({driver_name}_device->class);
    cdev_del(&{driver_name}_device->cdev);
    unregister_chrdev_region({driver_name}_device->dev_num, 1);
    kfree({driver_name}_device->buffer);
    kfree({driver_name}_device);

    pr_info("%s: Module unloaded\\n", DEVICE_NAME);
}}

module_init({driver_name}_init);
module_exit({driver_name}_exit);
'''

MAKEFILE_TEMPLATE = '''# Makefile for {driver_name}

obj-m += {driver_name}.o

KDIR := /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
\t$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
\t$(MAKE) -C $(KDIR) M=$(PWD) clean

install:
\tsudo insmod {driver_name}.ko

uninstall:
\tsudo rmmod {driver_name}

test:
\t@echo "Testing {driver_name}..."
\t@sudo insmod {driver_name}.ko
\t@sleep 1
\t@echo "Hello from userspace" | sudo tee /dev/{driver_name}
\t@sudo cat /dev/{driver_name}
\t@sudo rmmod {driver_name}

.PHONY: all clean install uninstall test
'''

def generate_char_driver(args):
    """生成字符设备驱动"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 生成驱动代码
    driver_code = CHAR_DEVICE_TEMPLATE.format(
        driver_name=args.name,
        description=args.description,
        author=args.author,
        timestamp=timestamp,
        buffer_size=args.buffer_size
    )

    # 生成 Makefile
    makefile = MAKEFILE_TEMPLATE.format(driver_name=args.name)

    # 创建输出目录
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 写入文件
    driver_file = output_dir / f"{args.name}.c"
    makefile_file = output_dir / "Makefile"

    with open(driver_file, 'w') as f:
        f.write(driver_code)

    with open(makefile_file, 'w') as f:
        f.write(makefile)

    print(f"✓ 成功生成字符设备驱动:")
    print(f"  驱动代码: {driver_file}")
    print(f"  Makefile: {makefile_file}")
    print(f"\n编译命令:")
    print(f"  cd {output_dir} && make")
    print(f"\n加载驱动:")
    print(f"  sudo insmod {args.name}.ko")
    print(f"\n测试驱动:")
    print(f"  echo 'test' | sudo tee /dev/{args.name}")
    print(f"  sudo cat /dev/{args.name}")

def generate_readme(args):
    """生成 README 文档"""
    readme_template = f'''# {args.name} 驱动

## 描述
{args.description}

## 编译
```bash
make
```

## 安装
```bash
sudo insmod {args.name}.ko
```

## 使用
```bash
# 写入数据
echo "Hello" | sudo tee /dev/{args.name}

# 读取数据
sudo cat /dev/{args.name}
```

## 卸载
```bash
sudo rmmod {args.name}
```

## 调试
```bash
# 查看内核日志
dmesg | tail -20

# 查看模块信息
lsmod | grep {args.name}
modinfo {args.name}.ko
```

---
生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
作者: {args.author}
'''

    readme_file = Path(args.output) / "README.md"
    with open(readme_file, 'w') as f:
        f.write(readme_template)

    print(f"✓ 生成 README: {readme_file}")

def main():
    parser = argparse.ArgumentParser(
        description="AI 辅助的 Linux 内核驱动代码生成器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 生成字符设备驱动
  %(prog)s --type char --name my_driver --description "我的设备驱动"

  # 指定输出目录
  %(prog)s --type char --name my_driver --output ./my_driver_dir

  # 自定义缓冲区大小
  %(prog)s --type char --name my_driver --buffer-size 2048
        """
    )

    parser.add_argument('--type', choices=['char', 'block', 'net'],
                       default='char',
                       help='驱动类型 (默认: char)')
    parser.add_argument('--name', required=True,
                       help='驱动名称')
    parser.add_argument('--description',
                       default='Kernel Driver',
                       help='驱动描述')
    parser.add_argument('--author',
                       default='AI-Assisted Developer',
                       help='作者名称')
    parser.add_argument('--output', '-o',
                       default='.',
                       help='输出目录 (默认: 当前目录)')
    parser.add_argument('--buffer-size', type=int,
                       default=1024,
                       help='缓冲区大小 (默认: 1024)')
    parser.add_argument('--with-readme', action='store_true',
                       help='生成 README 文档')

    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"  Linux 内核驱动代码生成器 (AI 辅助)")
    print(f"{'='*60}\n")

    if args.type == 'char':
        generate_char_driver(args)
    else:
        print(f"错误: 暂不支持 {args.type} 类型的驱动")
        return 1

    if args.with_readme:
        generate_readme(args)

    print(f"\n{'='*60}")
    print(f"  生成完成！")
    print(f"{'='*60}\n")

    return 0

if __name__ == '__main__':
    sys.exit(main())
