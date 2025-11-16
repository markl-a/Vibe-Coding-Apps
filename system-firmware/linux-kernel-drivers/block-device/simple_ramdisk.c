/*
 * simple_ramdisk.c - 簡單 RAM 磁碟塊設備驅動
 *
 * 這是一個基於記憶體的塊設備驅動範例，展示了：
 * - 塊設備註冊
 * - 請求佇列處理
 * - bio 請求處理
 * - 分區支援
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/bio.h>
#include <linux/blkdev.h>
#include <linux/blk-mq.h>
#include <linux/vmalloc.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("AI-Assisted Developer");
MODULE_DESCRIPTION("Simple RAM Disk Block Device Driver");
MODULE_VERSION("1.0");

#define RAMDISK_NAME "sramdisk"
#define RAMDISK_SECTOR_SIZE 512
#define RAMDISK_SECTORS 204800  /* 100MB = 204800 * 512 bytes */
#define RAMDISK_SIZE (RAMDISK_SECTORS * RAMDISK_SECTOR_SIZE)
#define KERNEL_SECTOR_SIZE 512

/* RAM 磁碟設備結構 */
struct ramdisk_device {
    int major;                      /* 主設備號 */
    u8 *data;                       /* 數據存儲區 */
    struct gendisk *disk;           /* 通用磁碟結構 */
    struct blk_mq_tag_set tag_set;  /* 塊多佇列標籤集 */
    spinlock_t lock;                /* 自旋鎖 */
};

static struct ramdisk_device *ramdisk_dev;

/*
 * ramdisk_transfer - 執行數據傳輸
 */
static int ramdisk_transfer(struct ramdisk_device *dev, sector_t sector,
                           unsigned long nsect, char *buffer, int write)
{
    unsigned long offset = sector * RAMDISK_SECTOR_SIZE;
    unsigned long nbytes = nsect * RAMDISK_SECTOR_SIZE;

    if ((offset + nbytes) > RAMDISK_SIZE) {
        pr_err("%s: Beyond-end write (%ld %ld)\n", RAMDISK_NAME,
               offset, nbytes);
        return -EIO;
    }

    if (write) {
        memcpy(dev->data + offset, buffer, nbytes);
    } else {
        memcpy(buffer, dev->data + offset, nbytes);
    }

    return 0;
}

/*
 * ramdisk_request - 處理 bio 請求
 */
static blk_status_t ramdisk_request(struct blk_mq_hw_ctx *hctx,
                                   const struct blk_mq_queue_data *bd)
{
    struct request *req = bd->rq;
    struct ramdisk_device *dev = req->q->queuedata;
    struct bio_vec bvec;
    struct req_iterator iter;
    sector_t pos = blk_rq_pos(req);
    void *buffer;
    blk_status_t ret = BLK_STS_OK;

    blk_mq_start_request(req);

    /* 遍歷請求中的所有 bio segment */
    rq_for_each_segment(bvec, req, iter) {
        size_t len = bvec.bv_len;

        buffer = page_address(bvec.bv_page) + bvec.bv_offset;

        if (ramdisk_transfer(dev, pos, len / RAMDISK_SECTOR_SIZE, buffer,
                            rq_data_dir(req))) {
            ret = BLK_STS_IOERR;
            break;
        }

        pos += len / RAMDISK_SECTOR_SIZE;
    }

    blk_mq_end_request(req, ret);
    return ret;
}

/* 塊設備操作 */
static struct blk_mq_ops ramdisk_mq_ops = {
    .queue_rq = ramdisk_request,
};

/* 塊設備文件操作 */
static struct block_device_operations ramdisk_fops = {
    .owner = THIS_MODULE,
};

/*
 * ramdisk_init - 模組初始化
 */
static int __init ramdisk_init(void)
{
    int ret;

    pr_info("%s: Initializing RAM disk driver\n", RAMDISK_NAME);

    /* 分配設備結構 */
    ramdisk_dev = kzalloc(sizeof(struct ramdisk_device), GFP_KERNEL);
    if (!ramdisk_dev) {
        pr_err("%s: Failed to allocate device structure\n", RAMDISK_NAME);
        return -ENOMEM;
    }

    /* 分配 RAM 存儲空間 */
    ramdisk_dev->data = vmalloc(RAMDISK_SIZE);
    if (!ramdisk_dev->data) {
        pr_err("%s: Failed to allocate RAM storage\n", RAMDISK_NAME);
        ret = -ENOMEM;
        goto err_free_dev;
    }

    /* 清空存儲空間 */
    memset(ramdisk_dev->data, 0, RAMDISK_SIZE);

    spin_lock_init(&ramdisk_dev->lock);

    /* 註冊塊設備並獲取主設備號 */
    ramdisk_dev->major = register_blkdev(0, RAMDISK_NAME);
    if (ramdisk_dev->major < 0) {
        pr_err("%s: Failed to register block device\n", RAMDISK_NAME);
        ret = ramdisk_dev->major;
        goto err_free_data;
    }

    pr_info("%s: Registered with major number %d\n",
            RAMDISK_NAME, ramdisk_dev->major);

    /* 初始化標籤集 */
    memset(&ramdisk_dev->tag_set, 0, sizeof(ramdisk_dev->tag_set));
    ramdisk_dev->tag_set.ops = &ramdisk_mq_ops;
    ramdisk_dev->tag_set.nr_hw_queues = 1;
    ramdisk_dev->tag_set.queue_depth = 128;
    ramdisk_dev->tag_set.numa_node = NUMA_NO_NODE;
    ramdisk_dev->tag_set.cmd_size = 0;
    ramdisk_dev->tag_set.flags = BLK_MQ_F_SHOULD_MERGE;
    ramdisk_dev->tag_set.driver_data = ramdisk_dev;

    ret = blk_mq_alloc_tag_set(&ramdisk_dev->tag_set);
    if (ret) {
        pr_err("%s: Failed to allocate tag set\n", RAMDISK_NAME);
        goto err_unregister_blkdev;
    }

    /* 分配磁碟結構 */
    ramdisk_dev->disk = blk_mq_alloc_disk(&ramdisk_dev->tag_set, ramdisk_dev);
    if (IS_ERR(ramdisk_dev->disk)) {
        pr_err("%s: Failed to allocate disk\n", RAMDISK_NAME);
        ret = PTR_ERR(ramdisk_dev->disk);
        goto err_free_tag_set;
    }

    /* 設置磁碟屬性 */
    ramdisk_dev->disk->major = ramdisk_dev->major;
    ramdisk_dev->disk->first_minor = 0;
    ramdisk_dev->disk->minors = 16;  /* 支援 16 個分區 */
    ramdisk_dev->disk->fops = &ramdisk_fops;
    ramdisk_dev->disk->private_data = ramdisk_dev;
    snprintf(ramdisk_dev->disk->disk_name, 32, RAMDISK_NAME);
    set_capacity(ramdisk_dev->disk, RAMDISK_SECTORS);

    /* 設置請求佇列屬性 */
    blk_queue_logical_block_size(ramdisk_dev->disk->queue,
                                RAMDISK_SECTOR_SIZE);
    blk_queue_physical_block_size(ramdisk_dev->disk->queue,
                                 RAMDISK_SECTOR_SIZE);

    /* 添加磁碟到系統 */
    ret = add_disk(ramdisk_dev->disk);
    if (ret) {
        pr_err("%s: Failed to add disk\n", RAMDISK_NAME);
        goto err_cleanup_disk;
    }

    pr_info("%s: RAM disk created successfully (%d MB)\n",
            RAMDISK_NAME, RAMDISK_SIZE / (1024 * 1024));
    pr_info("%s: Device available at /dev/%s\n",
            RAMDISK_NAME, ramdisk_dev->disk->disk_name);

    return 0;

err_cleanup_disk:
    put_disk(ramdisk_dev->disk);
err_free_tag_set:
    blk_mq_free_tag_set(&ramdisk_dev->tag_set);
err_unregister_blkdev:
    unregister_blkdev(ramdisk_dev->major, RAMDISK_NAME);
err_free_data:
    vfree(ramdisk_dev->data);
err_free_dev:
    kfree(ramdisk_dev);
    return ret;
}

/*
 * ramdisk_exit - 模組卸載
 */
static void __exit ramdisk_exit(void)
{
    pr_info("%s: Unloading RAM disk driver\n", RAMDISK_NAME);

    if (ramdisk_dev) {
        if (ramdisk_dev->disk) {
            del_gendisk(ramdisk_dev->disk);
            put_disk(ramdisk_dev->disk);
        }
        blk_mq_free_tag_set(&ramdisk_dev->tag_set);
        unregister_blkdev(ramdisk_dev->major, RAMDISK_NAME);
        vfree(ramdisk_dev->data);
        kfree(ramdisk_dev);
    }

    pr_info("%s: Module unloaded successfully\n", RAMDISK_NAME);
}

module_init(ramdisk_init);
module_exit(ramdisk_exit);
