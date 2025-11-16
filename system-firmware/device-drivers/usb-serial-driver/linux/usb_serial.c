/*
 * USB Serial Driver - Linux Kernel Module
 *
 * 通用 USB 串口驅動，支援 FTDI、CP210x、CH340 等晶片
 */

#include <linux/kernel.h>
#include <linux/module.h>
#include <linux/usb.h>
#include <linux/tty.h>
#include <linux/tty_driver.h>
#include <linux/tty_flip.h>
#include <linux/slab.h>
#include <linux/uaccess.h>

#define DRIVER_VERSION "1.0"
#define DRIVER_AUTHOR "AI-Assisted Development Team"
#define DRIVER_DESC "Generic USB Serial Driver"

/* 支援的設備列表 */
static struct usb_device_id usb_serial_id_table[] = {
    /* FTDI 晶片 */
    { USB_DEVICE(0x0403, 0x6001) },  /* FT232R */
    { USB_DEVICE(0x0403, 0x6014) },  /* FT232H */
    { USB_DEVICE(0x0403, 0x6010) },  /* FT2232D */

    /* Silabs CP210x 晶片 */
    { USB_DEVICE(0x10C4, 0xEA60) },  /* CP2102 */
    { USB_DEVICE(0x10C4, 0xEA63) },  /* CP2104 */
    { USB_DEVICE(0x10C4, 0xEA70) },  /* CP2105 */

    /* WCH CH340/CH341 晶片 */
    { USB_DEVICE(0x1A86, 0x7523) },  /* CH340G */
    { USB_DEVICE(0x1A86, 0x5523) },  /* CH341A */

    { } /* 結束標記 */
};

MODULE_DEVICE_TABLE(usb, usb_serial_id_table);

/* 設備私有資料結構 */
struct usb_serial_port {
    struct usb_device *udev;
    struct usb_interface *interface;
    struct tty_port port;
    struct urb *read_urb;
    struct urb *write_urb;
    unsigned char *read_buffer;
    unsigned char *write_buffer;
    int read_buffer_size;
    int write_buffer_size;
    int open_count;
    spinlock_t lock;
    struct work_struct work;

    /* 端點資訊 */
    __u8 bulk_in_endpoint;
    __u8 bulk_out_endpoint;
    int bulk_in_size;
    int bulk_out_size;
};

#define SERIAL_TTY_MINORS 4
static struct usb_serial_port *serial_table[SERIAL_TTY_MINORS];
static struct tty_driver *usb_serial_tty_driver;

/* URB 讀取完成回調 */
static void usb_serial_read_callback(struct urb *urb)
{
    struct usb_serial_port *port = urb->context;
    struct tty_port *tty_port = &port->port;
    int status = urb->status;
    int retval;

    pr_debug("usb_serial: read callback, status=%d\n", status);

    switch (status) {
    case 0:
        /* 成功 */
        break;
    case -ECONNRESET:
    case -ENOENT:
    case -ESHUTDOWN:
        /* URB 被取消 */
        pr_debug("usb_serial: URB cancelled\n");
        return;
    default:
        pr_err("usb_serial: read error: %d\n", status);
        goto resubmit;
    }

    if (urb->actual_length) {
        /* 將資料推送到 TTY 層 */
        tty_insert_flip_string(tty_port, urb->transfer_buffer,
                               urb->actual_length);
        tty_flip_buffer_push(tty_port);

        pr_debug("usb_serial: received %d bytes\n", urb->actual_length);
    }

resubmit:
    /* 重新提交 URB 繼續接收 */
    retval = usb_submit_urb(urb, GFP_ATOMIC);
    if (retval)
        pr_err("usb_serial: failed to resubmit read urb: %d\n", retval);
}

/* URB 寫入完成回調 */
static void usb_serial_write_callback(struct urb *urb)
{
    struct usb_serial_port *port = urb->context;
    int status = urb->status;

    pr_debug("usb_serial: write callback, status=%d\n", status);

    if (status) {
        pr_err("usb_serial: write error: %d\n", status);
    }

    /* 喚醒寫入等待 */
    tty_port_tty_wakeup(&port->port);
}

/* TTY 操作: 開啟 */
static int usb_serial_open(struct tty_struct *tty, struct file *filp)
{
    struct usb_serial_port *port;
    int minor = tty->index;
    int retval;

    pr_info("usb_serial: opening port %d\n", minor);

    if (minor >= SERIAL_TTY_MINORS)
        return -ENODEV;

    port = serial_table[minor];
    if (!port)
        return -ENODEV;

    tty->driver_data = port;
    tty_port_tty_set(&port->port, tty);

    spin_lock_irq(&port->lock);
    port->open_count++;
    spin_unlock_irq(&port->lock);

    if (port->open_count == 1) {
        /* 第一次開啟，提交讀取 URB */
        retval = usb_submit_urb(port->read_urb, GFP_KERNEL);
        if (retval) {
            pr_err("usb_serial: failed to submit read urb: %d\n", retval);
            port->open_count--;
            return retval;
        }
    }

    return 0;
}

/* TTY 操作: 關閉 */
static void usb_serial_close(struct tty_struct *tty, struct file *filp)
{
    struct usb_serial_port *port = tty->driver_data;

    if (!port)
        return;

    pr_info("usb_serial: closing port\n");

    spin_lock_irq(&port->lock);
    port->open_count--;

    if (port->open_count == 0) {
        /* 最後一次關閉，取消 URB */
        usb_kill_urb(port->read_urb);
        usb_kill_urb(port->write_urb);
    }
    spin_unlock_irq(&port->lock);
}

/* TTY 操作: 寫入 */
static int usb_serial_write(struct tty_struct *tty,
                           const unsigned char *buf, int count)
{
    struct usb_serial_port *port = tty->driver_data;
    int retval;
    int bytes_to_write;

    if (!port)
        return -ENODEV;

    pr_debug("usb_serial: writing %d bytes\n", count);

    /* 限制寫入大小 */
    bytes_to_write = min(count, port->bulk_out_size);

    /* 複製資料到寫入緩衝區 */
    memcpy(port->write_buffer, buf, bytes_to_write);

    /* 設定 URB */
    usb_fill_bulk_urb(port->write_urb, port->udev,
                     usb_sndbulkpipe(port->udev, port->bulk_out_endpoint),
                     port->write_buffer, bytes_to_write,
                     usb_serial_write_callback, port);

    /* 提交 URB */
    retval = usb_submit_urb(port->write_urb, GFP_KERNEL);
    if (retval) {
        pr_err("usb_serial: failed to submit write urb: %d\n", retval);
        return retval;
    }

    return bytes_to_write;
}

/* TTY 操作: 可寫入空間 */
static unsigned int usb_serial_write_room(struct tty_struct *tty)
{
    struct usb_serial_port *port = tty->driver_data;

    if (!port)
        return 0;

    return port->bulk_out_size;
}

/* TTY 操作: 可用字元數 */
static unsigned int usb_serial_chars_in_buffer(struct tty_struct *tty)
{
    /* 簡化實現，假設緩衝區總是空的 */
    return 0;
}

/* TTY 操作結構 */
static const struct tty_operations usb_serial_ops = {
    .open = usb_serial_open,
    .close = usb_serial_close,
    .write = usb_serial_write,
    .write_room = usb_serial_write_room,
    .chars_in_buffer = usb_serial_chars_in_buffer,
};

/* USB 探測函數 */
static int usb_serial_probe(struct usb_interface *interface,
                           const struct usb_device_id *id)
{
    struct usb_device *udev = interface_to_usbdev(interface);
    struct usb_serial_port *port;
    struct usb_host_interface *iface_desc;
    struct usb_endpoint_descriptor *endpoint;
    int i, minor;
    int retval = -ENOMEM;

    pr_info("usb_serial: probing device %04x:%04x\n",
           le16_to_cpu(udev->descriptor.idVendor),
           le16_to_cpu(udev->descriptor.idProduct));

    /* 分配設備結構 */
    port = kzalloc(sizeof(struct usb_serial_port), GFP_KERNEL);
    if (!port)
        goto error;

    port->udev = usb_get_dev(udev);
    port->interface = interface;
    spin_lock_init(&port->lock);
    tty_port_init(&port->port);

    /* 找到可用的 minor number */
    for (minor = 0; minor < SERIAL_TTY_MINORS; minor++) {
        if (!serial_table[minor])
            break;
    }

    if (minor >= SERIAL_TTY_MINORS) {
        pr_err("usb_serial: no free minor numbers\n");
        retval = -ENODEV;
        goto error;
    }

    /* 解析端點 */
    iface_desc = interface->cur_altsetting;
    for (i = 0; i < iface_desc->desc.bNumEndpoints; i++) {
        endpoint = &iface_desc->endpoint[i].desc;

        if (usb_endpoint_is_bulk_in(endpoint)) {
            port->bulk_in_endpoint = endpoint->bEndpointAddress;
            port->bulk_in_size = le16_to_cpu(endpoint->wMaxPacketSize);
        } else if (usb_endpoint_is_bulk_out(endpoint)) {
            port->bulk_out_endpoint = endpoint->bEndpointAddress;
            port->bulk_out_size = le16_to_cpu(endpoint->wMaxPacketSize);
        }
    }

    if (!port->bulk_in_endpoint || !port->bulk_out_endpoint) {
        pr_err("usb_serial: missing endpoints\n");
        retval = -ENODEV;
        goto error;
    }

    pr_info("usb_serial: bulk in: 0x%02x (size %d), bulk out: 0x%02x (size %d)\n",
           port->bulk_in_endpoint, port->bulk_in_size,
           port->bulk_out_endpoint, port->bulk_out_size);

    /* 分配緩衝區 */
    port->read_buffer_size = port->bulk_in_size;
    port->read_buffer = kmalloc(port->read_buffer_size, GFP_KERNEL);
    if (!port->read_buffer)
        goto error;

    port->write_buffer_size = port->bulk_out_size;
    port->write_buffer = kmalloc(port->write_buffer_size, GFP_KERNEL);
    if (!port->write_buffer)
        goto error;

    /* 分配並初始化讀取 URB */
    port->read_urb = usb_alloc_urb(0, GFP_KERNEL);
    if (!port->read_urb)
        goto error;

    usb_fill_bulk_urb(port->read_urb, udev,
                     usb_rcvbulkpipe(udev, port->bulk_in_endpoint),
                     port->read_buffer, port->read_buffer_size,
                     usb_serial_read_callback, port);

    /* 分配寫入 URB */
    port->write_urb = usb_alloc_urb(0, GFP_KERNEL);
    if (!port->write_urb)
        goto error;

    /* 保存設備資料 */
    usb_set_intfdata(interface, port);
    serial_table[minor] = port;

    /* 註冊 TTY 設備 */
    tty_port_register_device(&port->port, usb_serial_tty_driver, minor, &interface->dev);

    pr_info("usb_serial: device now attached to ttyUSB%d\n", minor);

    return 0;

error:
    if (port) {
        usb_free_urb(port->read_urb);
        usb_free_urb(port->write_urb);
        kfree(port->read_buffer);
        kfree(port->write_buffer);
        tty_port_destroy(&port->port);
        usb_put_dev(port->udev);
        kfree(port);
    }
    return retval;
}

/* USB 斷開函數 */
static void usb_serial_disconnect(struct usb_interface *interface)
{
    struct usb_serial_port *port = usb_get_intfdata(interface);
    int minor;

    if (!port)
        return;

    pr_info("usb_serial: device disconnected\n");

    /* 找到 minor number */
    for (minor = 0; minor < SERIAL_TTY_MINORS; minor++) {
        if (serial_table[minor] == port)
            break;
    }

    /* 取消註冊 TTY 設備 */
    tty_unregister_device(usb_serial_tty_driver, minor);
    serial_table[minor] = NULL;

    /* 取消所有 URB */
    usb_kill_urb(port->read_urb);
    usb_kill_urb(port->write_urb);

    /* 釋放資源 */
    usb_free_urb(port->read_urb);
    usb_free_urb(port->write_urb);
    kfree(port->read_buffer);
    kfree(port->write_buffer);
    tty_port_destroy(&port->port);
    usb_put_dev(port->udev);
    kfree(port);

    usb_set_intfdata(interface, NULL);
}

/* USB 驅動結構 */
static struct usb_driver usb_serial_driver = {
    .name = "usb_serial",
    .probe = usb_serial_probe,
    .disconnect = usb_serial_disconnect,
    .id_table = usb_serial_id_table,
};

/* 模組初始化 */
static int __init usb_serial_init(void)
{
    int retval;

    pr_info("usb_serial: USB Serial Driver v%s\n", DRIVER_VERSION);

    /* 註冊 TTY 驅動 */
    usb_serial_tty_driver = tty_alloc_driver(SERIAL_TTY_MINORS, 0);
    if (IS_ERR(usb_serial_tty_driver)) {
        pr_err("usb_serial: failed to allocate tty driver\n");
        return PTR_ERR(usb_serial_tty_driver);
    }

    usb_serial_tty_driver->driver_name = "usb_serial";
    usb_serial_tty_driver->name = "ttyUSB";
    usb_serial_tty_driver->major = 0;  /* 動態分配 */
    usb_serial_tty_driver->minor_start = 0;
    usb_serial_tty_driver->type = TTY_DRIVER_TYPE_SERIAL;
    usb_serial_tty_driver->subtype = SERIAL_TYPE_NORMAL;
    usb_serial_tty_driver->flags = TTY_DRIVER_REAL_RAW | TTY_DRIVER_DYNAMIC_DEV;
    usb_serial_tty_driver->init_termios = tty_std_termios;
    usb_serial_tty_driver->init_termios.c_cflag = B9600 | CS8 | CREAD | HUPCL | CLOCAL;
    usb_serial_tty_driver->init_termios.c_ispeed = 9600;
    usb_serial_tty_driver->init_termios.c_ospeed = 9600;

    tty_set_operations(usb_serial_tty_driver, &usb_serial_ops);

    retval = tty_register_driver(usb_serial_tty_driver);
    if (retval) {
        pr_err("usb_serial: failed to register tty driver: %d\n", retval);
        tty_driver_kref_put(usb_serial_tty_driver);
        return retval;
    }

    /* 註冊 USB 驅動 */
    retval = usb_register(&usb_serial_driver);
    if (retval) {
        pr_err("usb_serial: failed to register usb driver: %d\n", retval);
        tty_unregister_driver(usb_serial_tty_driver);
        tty_driver_kref_put(usb_serial_tty_driver);
        return retval;
    }

    return 0;
}

/* 模組清理 */
static void __exit usb_serial_exit(void)
{
    pr_info("usb_serial: unloading driver\n");

    usb_deregister(&usb_serial_driver);
    tty_unregister_driver(usb_serial_tty_driver);
    tty_driver_kref_put(usb_serial_tty_driver);
}

module_init(usb_serial_init);
module_exit(usb_serial_exit);

MODULE_AUTHOR(DRIVER_AUTHOR);
MODULE_DESCRIPTION(DRIVER_DESC);
MODULE_LICENSE("GPL");
MODULE_VERSION(DRIVER_VERSION);
