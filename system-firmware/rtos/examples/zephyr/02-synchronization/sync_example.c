/**
 * @file sync_example.c
 * @brief Zephyr RTOS 同步機制範例
 * @author AI-Assisted Development Team
 * @date 2025-11-17
 *
 * 本範例展示：
 * 1. 信號量 (Semaphore)
 * 2. 互斥鎖 (Mutex)
 * 3. 訊息佇列 (Message Queue)
 * 4. FIFO
 * 5. 事件 (Poll/Signal)
 */

#include <zephyr/kernel.h>
#include <zephyr/sys/printk.h>

/* 定義信號量 */
K_SEM_DEFINE(binary_sem, 0, 1);           /* 二進制信號量 */
K_SEM_DEFINE(counting_sem, 0, 10);        /* 計數信號量 */

/* 定義互斥鎖 */
K_MUTEX_DEFINE(data_mutex);

/* 定義訊息佇列 */
#define MSGQ_MAX_MSGS  10
K_MSGQ_DEFINE(data_msgq, sizeof(uint32_t), MSGQ_MAX_MSGS, 4);

/* 定義 FIFO */
K_FIFO_DEFINE(my_fifo);

/* FIFO 數據結構 */
struct data_item {
    void *fifo_reserved;  /* 必須是第一個成員 */
    uint32_t value;
    uint32_t timestamp;
};

/* 共享資源 */
static uint32_t shared_counter = 0;
static char shared_buffer[64];

/* ==================== 信號量範例 ==================== */

void producer_thread(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[Producer] Started\n");

    uint32_t item = 0;

    while (1) {
        item++;

        /* 模擬生產 */
        k_sleep(K_MSEC(300));

        /* 釋放計數信號量 */
        k_sem_give(&counting_sem);
        printk("[Producer] Produced item #%u\n", item);

        /* 每 5 個項目釋放二進制信號量 */
        if (item % 5 == 0) {
            k_sem_give(&binary_sem);
            printk("[Producer] Released binary semaphore\n");
        }
    }
}

void consumer_thread(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[Consumer] Started\n");

    uint32_t consumed = 0;

    while (1) {
        /* 等待計數信號量 */
        if (k_sem_take(&counting_sem, K_SECONDS(2)) == 0) {
            consumed++;
            printk("[Consumer] Consumed item (total: %u)\n", consumed);

            /* 模擬處理 */
            k_sleep(K_MSEC(500));
        } else {
            printk("[Consumer] Timeout - no items available\n");
        }
    }
}

void binary_sem_waiter(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[BinarySemWaiter] Started\n");

    while (1) {
        /* 等待二進制信號量 */
        k_sem_take(&binary_sem, K_FOREVER);
        printk("[BinarySemWaiter] Binary semaphore received!\n");
    }
}

/* ==================== 互斥鎖範例 ==================== */

void writer_thread_1(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[Writer1] Started\n");

    while (1) {
        /* 獲取互斥鎖 */
        k_mutex_lock(&data_mutex, K_FOREVER);

        /* 臨界區 */
        shared_counter++;
        snprintf(shared_buffer, sizeof(shared_buffer),
                "Written by Writer1, count=%u", shared_counter);
        printk("[Writer1] %s\n", shared_buffer);

        k_sleep(K_MSEC(100));  /* 模擬處理 */

        /* 釋放互斥鎖 */
        k_mutex_unlock(&data_mutex);

        k_sleep(K_MSEC(400));
    }
}

void writer_thread_2(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[Writer2] Started\n");

    while (1) {
        k_mutex_lock(&data_mutex, K_FOREVER);

        shared_counter++;
        snprintf(shared_buffer, sizeof(shared_buffer),
                "Written by Writer2, count=%u", shared_counter);
        printk("[Writer2] %s\n", shared_buffer);

        k_sleep(K_MSEC(100));

        k_mutex_unlock(&data_mutex);

        k_sleep(K_MSEC(600));
    }
}

void reader_thread(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[Reader] Started\n");

    while (1) {
        k_mutex_lock(&data_mutex, K_FOREVER);

        printk("[Reader] Reading: %s\n", shared_buffer);

        k_mutex_unlock(&data_mutex);

        k_sleep(K_SECONDS(1));
    }
}

/* ==================== 訊息佇列範例 ==================== */

void msgq_sender(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[MsgQSender] Started\n");

    uint32_t msg = 0;

    while (1) {
        msg++;

        /* 發送到訊息佇列 */
        if (k_msgq_put(&data_msgq, &msg, K_NO_WAIT) == 0) {
            printk("[MsgQSender] Sent message: %u\n", msg);
        } else {
            printk("[MsgQSender] Queue full! Message %u dropped\n", msg);
        }

        k_sleep(K_MSEC(500));
    }
}

void msgq_receiver(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[MsgQReceiver] Started\n");

    uint32_t received_msg;

    while (1) {
        /* 從訊息佇列接收 */
        if (k_msgq_get(&data_msgq, &received_msg, K_SECONDS(2)) == 0) {
            printk("[MsgQReceiver] Received message: %u\n", received_msg);

            /* 顯示佇列狀態 */
            uint32_t used = k_msgq_num_used_get(&data_msgq);
            printk("  Queue status: %u/%u messages\n", used, MSGQ_MAX_MSGS);
        } else {
            printk("[MsgQReceiver] Timeout - no messages\n");
        }
    }
}

/* ==================== FIFO 範例 ==================== */

void fifo_producer(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[FIFOProducer] Started\n");

    while (1) {
        /* 分配數據項目 */
        struct data_item *item = k_malloc(sizeof(struct data_item));

        if (item != NULL) {
            item->value = k_uptime_get_32();
            item->timestamp = k_uptime_get_32();

            /* 放入 FIFO */
            k_fifo_put(&my_fifo, item);
            printk("[FIFOProducer] Put item: value=%u\n", item->value);
        } else {
            printk("[FIFOProducer] Memory allocation failed!\n");
        }

        k_sleep(K_MSEC(700));
    }
}

void fifo_consumer(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[FIFOConsumer] Started\n");

    while (1) {
        /* 從 FIFO 獲取 */
        struct data_item *item = k_fifo_get(&my_fifo, K_SECONDS(3));

        if (item != NULL) {
            printk("[FIFOConsumer] Got item: value=%u, age=%u ms\n",
                   item->value,
                   k_uptime_get_32() - item->timestamp);

            /* 釋放記憶體 */
            k_free(item);
        } else {
            printk("[FIFOConsumer] Timeout - FIFO empty\n");
        }
    }
}

/* ==================== 主程式 ==================== */

#define THREAD_STACK_SIZE  1024
#define THREAD_PRIORITY    7

int main(void)
{
    printk("\n");
    printk("==========================================\n");
    printk("  Zephyr Synchronization Example\n");
    printk("  Zephyr Version: %s\n", KERNEL_VERSION_STRING);
    printk("==========================================\n\n");

    /* 創建信號量相關執行緒 */
    K_THREAD_STACK_DEFINE(producer_stack, THREAD_STACK_SIZE);
    struct k_thread producer_data;
    k_thread_create(&producer_data, producer_stack,
                    K_THREAD_STACK_SIZEOF(producer_stack),
                    producer_thread, NULL, NULL, NULL,
                    THREAD_PRIORITY, 0, K_NO_WAIT);
    k_thread_name_set(&producer_data, "producer");

    K_THREAD_STACK_DEFINE(consumer_stack, THREAD_STACK_SIZE);
    struct k_thread consumer_data;
    k_thread_create(&consumer_data, consumer_stack,
                    K_THREAD_STACK_SIZEOF(consumer_stack),
                    consumer_thread, NULL, NULL, NULL,
                    THREAD_PRIORITY, 0, K_NO_WAIT);
    k_thread_name_set(&consumer_data, "consumer");

    K_THREAD_STACK_DEFINE(bin_sem_stack, THREAD_STACK_SIZE);
    struct k_thread bin_sem_data;
    k_thread_create(&bin_sem_data, bin_sem_stack,
                    K_THREAD_STACK_SIZEOF(bin_sem_stack),
                    binary_sem_waiter, NULL, NULL, NULL,
                    THREAD_PRIORITY, 0, K_NO_WAIT);

    /* 創建互斥鎖相關執行緒 */
    K_THREAD_STACK_DEFINE(writer1_stack, THREAD_STACK_SIZE);
    struct k_thread writer1_data;
    k_thread_create(&writer1_data, writer1_stack,
                    K_THREAD_STACK_SIZEOF(writer1_stack),
                    writer_thread_1, NULL, NULL, NULL,
                    THREAD_PRIORITY, 0, K_NO_WAIT);

    K_THREAD_STACK_DEFINE(writer2_stack, THREAD_STACK_SIZE);
    struct k_thread writer2_data;
    k_thread_create(&writer2_data, writer2_stack,
                    K_THREAD_STACK_SIZEOF(writer2_stack),
                    writer_thread_2, NULL, NULL, NULL,
                    THREAD_PRIORITY, 0, K_NO_WAIT);

    K_THREAD_STACK_DEFINE(reader_stack, THREAD_STACK_SIZE);
    struct k_thread reader_data;
    k_thread_create(&reader_data, reader_stack,
                    K_THREAD_STACK_SIZEOF(reader_stack),
                    reader_thread, NULL, NULL, NULL,
                    THREAD_PRIORITY + 1, 0, K_NO_WAIT);

    /* 創建訊息佇列相關執行緒 */
    K_THREAD_STACK_DEFINE(msgq_sender_stack, THREAD_STACK_SIZE);
    struct k_thread msgq_sender_data;
    k_thread_create(&msgq_sender_data, msgq_sender_stack,
                    K_THREAD_STACK_SIZEOF(msgq_sender_stack),
                    msgq_sender, NULL, NULL, NULL,
                    THREAD_PRIORITY, 0, K_NO_WAIT);

    K_THREAD_STACK_DEFINE(msgq_receiver_stack, THREAD_STACK_SIZE);
    struct k_thread msgq_receiver_data;
    k_thread_create(&msgq_receiver_data, msgq_receiver_stack,
                    K_THREAD_STACK_SIZEOF(msgq_receiver_stack),
                    msgq_receiver, NULL, NULL, NULL,
                    THREAD_PRIORITY, 0, K_NO_WAIT);

    /* 創建 FIFO 相關執行緒 */
    K_THREAD_STACK_DEFINE(fifo_prod_stack, THREAD_STACK_SIZE);
    struct k_thread fifo_prod_data;
    k_thread_create(&fifo_prod_data, fifo_prod_stack,
                    K_THREAD_STACK_SIZEOF(fifo_prod_stack),
                    fifo_producer, NULL, NULL, NULL,
                    THREAD_PRIORITY, 0, K_NO_WAIT);

    K_THREAD_STACK_DEFINE(fifo_cons_stack, THREAD_STACK_SIZE);
    struct k_thread fifo_cons_data;
    k_thread_create(&fifo_cons_data, fifo_cons_stack,
                    K_THREAD_STACK_SIZEOF(fifo_cons_stack),
                    fifo_consumer, NULL, NULL, NULL,
                    THREAD_PRIORITY, 0, K_NO_WAIT);

    printk("All threads created successfully!\n\n");

    return 0;
}
