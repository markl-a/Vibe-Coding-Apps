/**
 * @file ipc_example.c
 * @brief RT-Thread 執行緒間通訊 (IPC) 範例
 * @author AI-Assisted Development Team
 * @date 2025-11-17
 *
 * 本範例展示：
 * 1. 信號量 (Semaphore)
 * 2. 互斥鎖 (Mutex)
 * 3. 事件 (Event)
 * 4. 郵箱 (Mailbox)
 * 5. 訊息佇列 (Message Queue)
 */

#include <rtthread.h>
#include <rtdevice.h>

#define DBG_TAG "ipc_example"
#define DBG_LVL DBG_LOG
#include <rtdbg.h>

/* ==================== IPC 物件 ==================== */

/* 信號量 */
static rt_sem_t binary_sem = RT_NULL;
static rt_sem_t counting_sem = RT_NULL;

/* 互斥鎖 */
static rt_mutex_t data_mutex = RT_NULL;

/* 事件 */
static rt_event_t event = RT_NULL;

/* 郵箱 */
static rt_mailbox_t mailbox = RT_NULL;

/* 訊息佇列 */
static rt_mq_t message_queue = RT_NULL;

/* 事件標誌定義 */
#define EVENT_FLAG_0    (1 << 0)
#define EVENT_FLAG_1    (1 << 1)
#define EVENT_FLAG_2    (1 << 2)

/* 共享資源 */
static rt_uint32_t shared_counter = 0;
static char shared_buffer[64];

/* 數據結構 */
struct sensor_data
{
    rt_uint32_t sensor_id;
    float value;
    rt_uint32_t timestamp;
};

/* ==================== 信號量範例 ==================== */

static void producer_thread_entry(void *parameter)
{
    rt_uint32_t item = 0;

    LOG_I("Producer thread started");

    while (1)
    {
        item++;

        /* 模擬生產 */
        rt_thread_mdelay(300);

        /* 釋放計數信號量 */
        rt_sem_release(counting_sem);
        LOG_I("[Producer] Produced item #%u", item);

        /* 每 5 個項目釋放二進制信號量 */
        if (item % 5 == 0)
        {
            rt_sem_release(binary_sem);
            LOG_I("[Producer] Released binary semaphore");
        }
    }
}

static void consumer_thread_entry(void *parameter)
{
    rt_uint32_t consumed = 0;

    LOG_I("Consumer thread started");

    while (1)
    {
        /* 等待計數信號量 */
        if (rt_sem_take(counting_sem, rt_tick_from_millisecond(2000)) == RT_EOK)
        {
            consumed++;
            LOG_I("[Consumer] Consumed item (total: %u)", consumed);

            /* 模擬處理 */
            rt_thread_mdelay(500);
        }
        else
        {
            LOG_I("[Consumer] Timeout - no items available");
        }
    }
}

static void binary_sem_waiter_entry(void *parameter)
{
    LOG_I("Binary semaphore waiter started");

    while (1)
    {
        /* 永遠等待二進制信號量 */
        rt_sem_take(binary_sem, RT_WAITING_FOREVER);
        LOG_I("[BinarySemWaiter] Binary semaphore received!");
    }
}

/* ==================== 互斥鎖範例 ==================== */

static void writer_thread1_entry(void *parameter)
{
    LOG_I("Writer1 thread started");

    while (1)
    {
        /* 獲取互斥鎖 */
        rt_mutex_take(data_mutex, RT_WAITING_FOREVER);

        /* 臨界區 */
        shared_counter++;
        rt_snprintf(shared_buffer, sizeof(shared_buffer),
                   "Written by Writer1, count=%u", shared_counter);
        LOG_I("[Writer1] %s", shared_buffer);

        rt_thread_mdelay(100);  /* 模擬處理 */

        /* 釋放互斥鎖 */
        rt_mutex_release(data_mutex);

        rt_thread_mdelay(400);
    }
}

static void writer_thread2_entry(void *parameter)
{
    LOG_I("Writer2 thread started");

    while (1)
    {
        rt_mutex_take(data_mutex, RT_WAITING_FOREVER);

        shared_counter++;
        rt_snprintf(shared_buffer, sizeof(shared_buffer),
                   "Written by Writer2, count=%u", shared_counter);
        LOG_I("[Writer2] %s", shared_buffer);

        rt_thread_mdelay(100);

        rt_mutex_release(data_mutex);

        rt_thread_mdelay(600);
    }
}

static void reader_thread_entry(void *parameter)
{
    LOG_I("Reader thread started");

    while (1)
    {
        rt_mutex_take(data_mutex, RT_WAITING_FOREVER);

        LOG_I("[Reader] Reading: %s", shared_buffer);

        rt_mutex_release(data_mutex);

        rt_thread_mdelay(1000);
    }
}

/* ==================== 事件範例 ==================== */

static void event_sender_entry(void *parameter)
{
    rt_uint32_t cycle = 0;

    LOG_I("Event sender thread started");

    rt_thread_mdelay(2000);

    while (1)
    {
        cycle++;

        /* 發送不同的事件標誌 */
        if (cycle % 2 == 0)
        {
            LOG_I("[EventSender] Sending EVENT_FLAG_0");
            rt_event_send(event, EVENT_FLAG_0);
        }

        if (cycle % 3 == 0)
        {
            LOG_I("[EventSender] Sending EVENT_FLAG_1");
            rt_event_send(event, EVENT_FLAG_1);
        }

        if (cycle % 5 == 0)
        {
            LOG_I("[EventSender] Sending EVENT_FLAG_2");
            rt_event_send(event, EVENT_FLAG_2);
        }

        rt_thread_mdelay(1000);
    }
}

static void event_receiver_any_entry(void *parameter)
{
    rt_uint32_t recved;

    LOG_I("Event receiver (ANY) thread started");

    while (1)
    {
        /* 等待任一事件 (OR) */
        if (rt_event_recv(event,
                         EVENT_FLAG_0 | EVENT_FLAG_1,
                         RT_EVENT_FLAG_OR | RT_EVENT_FLAG_CLEAR,
                         RT_WAITING_FOREVER,
                         &recved) == RT_EOK)
        {
            if (recved & EVENT_FLAG_0)
            {
                LOG_I("[EventRecvANY] EVENT_FLAG_0 received!");
            }
            if (recved & EVENT_FLAG_1)
            {
                LOG_I("[EventRecvANY] EVENT_FLAG_1 received!");
            }
        }
    }
}

static void event_receiver_all_entry(void *parameter)
{
    rt_uint32_t recved;

    LOG_I("Event receiver (ALL) thread started");

    while (1)
    {
        /* 等待所有事件 (AND) */
        LOG_I("[EventRecvALL] Waiting for all events...");

        if (rt_event_recv(event,
                         EVENT_FLAG_0 | EVENT_FLAG_1 | EVENT_FLAG_2,
                         RT_EVENT_FLAG_AND | RT_EVENT_FLAG_CLEAR,
                         RT_WAITING_FOREVER,
                         &recved) == RT_EOK)
        {
            LOG_I("[EventRecvALL] All events received!");
        }
    }
}

/* ==================== 郵箱範例 ==================== */

static void mailbox_sender_entry(void *parameter)
{
    static struct sensor_data data_pool[5];
    rt_uint32_t count = 0;

    LOG_I("Mailbox sender thread started");

    while (1)
    {
        count++;

        /* 準備數據 */
        struct sensor_data *data = &data_pool[count % 5];
        data->sensor_id = count % 3;
        data->value = 20.0f + (count % 10);
        data->timestamp = rt_tick_get();

        /* 發送到郵箱 */
        if (rt_mb_send(mailbox, (rt_ubase_t)data) == RT_EOK)
        {
            LOG_I("[MailboxSender] Sent data from sensor %u: %.2f",
                  data->sensor_id, data->value);
        }
        else
        {
            LOG_W("[MailboxSender] Mailbox full!");
        }

        rt_thread_mdelay(700);
    }
}

static void mailbox_receiver_entry(void *parameter)
{
    rt_ubase_t value;

    LOG_I("Mailbox receiver thread started");

    while (1)
    {
        /* 從郵箱接收 */
        if (rt_mb_recv(mailbox, &value, RT_WAITING_FOREVER) == RT_EOK)
        {
            struct sensor_data *data = (struct sensor_data *)value;
            LOG_I("[MailboxReceiver] Received from sensor %u: %.2f (age=%u ms)",
                  data->sensor_id, data->value,
                  rt_tick_get() - data->timestamp);
        }
    }
}

/* ==================== 訊息佇列範例 ==================== */

static void msgq_sender_entry(void *parameter)
{
    rt_uint32_t msg = 0;

    LOG_I("Message queue sender thread started");

    while (1)
    {
        msg++;

        /* 發送到訊息佇列 */
        if (rt_mq_send(message_queue, &msg, sizeof(msg)) == RT_EOK)
        {
            LOG_I("[MsgQSender] Sent message: %u", msg);
        }
        else
        {
            LOG_W("[MsgQSender] Message queue full! Message %u dropped", msg);
        }

        rt_thread_mdelay(600);
    }
}

static void msgq_receiver_entry(void *parameter)
{
    rt_uint32_t received_msg;

    LOG_I("Message queue receiver thread started");

    while (1)
    {
        /* 從訊息佇列接收 */
        if (rt_mq_recv(message_queue, &received_msg, sizeof(received_msg),
                      rt_tick_from_millisecond(2000)) == RT_EOK)
        {
            LOG_I("[MsgQReceiver] Received message: %u", received_msg);
        }
        else
        {
            LOG_I("[MsgQReceiver] Timeout - no messages");
        }
    }
}

/* ==================== 初始化函數 ==================== */

static int ipc_example_init(void)
{
    LOG_I("\n==========================================");
    LOG_I("  RT-Thread IPC Example");
    LOG_I("==========================================\n");

    /* 創建信號量 */
    binary_sem = rt_sem_create("bin_sem", 0, RT_IPC_FLAG_FIFO);
    counting_sem = rt_sem_create("cnt_sem", 0, RT_IPC_FLAG_FIFO);

    /* 創建互斥鎖 */
    data_mutex = rt_mutex_create("data_mtx", RT_IPC_FLAG_FIFO);

    /* 創建事件 */
    event = rt_event_create("event", RT_IPC_FLAG_FIFO);

    /* 創建郵箱 */
    mailbox = rt_mb_create("mailbox", 10, RT_IPC_FLAG_FIFO);

    /* 創建訊息佇列 */
    message_queue = rt_mq_create("msgq", sizeof(rt_uint32_t), 10, RT_IPC_FLAG_FIFO);

    LOG_I("All IPC objects created\n");

    /* 創建信號量相關執行緒 */
    rt_thread_t producer = rt_thread_create("producer", producer_thread_entry,
                                           RT_NULL, 1024, 10, 10);
    if (producer) rt_thread_startup(producer);

    rt_thread_t consumer = rt_thread_create("consumer", consumer_thread_entry,
                                           RT_NULL, 1024, 10, 10);
    if (consumer) rt_thread_startup(consumer);

    rt_thread_t bin_waiter = rt_thread_create("bin_waiter", binary_sem_waiter_entry,
                                             RT_NULL, 1024, 10, 10);
    if (bin_waiter) rt_thread_startup(bin_waiter);

    /* 創建互斥鎖相關執行緒 */
    rt_thread_t writer1 = rt_thread_create("writer1", writer_thread1_entry,
                                          RT_NULL, 1024, 11, 10);
    if (writer1) rt_thread_startup(writer1);

    rt_thread_t writer2 = rt_thread_create("writer2", writer_thread2_entry,
                                          RT_NULL, 1024, 11, 10);
    if (writer2) rt_thread_startup(writer2);

    rt_thread_t reader = rt_thread_create("reader", reader_thread_entry,
                                         RT_NULL, 1024, 12, 10);
    if (reader) rt_thread_startup(reader);

    /* 創建事件相關執行緒 */
    rt_thread_t evt_sender = rt_thread_create("evt_sender", event_sender_entry,
                                             RT_NULL, 1024, 10, 10);
    if (evt_sender) rt_thread_startup(evt_sender);

    rt_thread_t evt_recv_any = rt_thread_create("evt_any", event_receiver_any_entry,
                                               RT_NULL, 1024, 10, 10);
    if (evt_recv_any) rt_thread_startup(evt_recv_any);

    rt_thread_t evt_recv_all = rt_thread_create("evt_all", event_receiver_all_entry,
                                               RT_NULL, 1024, 10, 10);
    if (evt_recv_all) rt_thread_startup(evt_recv_all);

    /* 創建郵箱相關執行緒 */
    rt_thread_t mb_sender = rt_thread_create("mb_sender", mailbox_sender_entry,
                                            RT_NULL, 1024, 10, 10);
    if (mb_sender) rt_thread_startup(mb_sender);

    rt_thread_t mb_receiver = rt_thread_create("mb_receiver", mailbox_receiver_entry,
                                              RT_NULL, 1024, 10, 10);
    if (mb_receiver) rt_thread_startup(mb_receiver);

    /* 創建訊息佇列相關執行緒 */
    rt_thread_t mq_sender = rt_thread_create("mq_sender", msgq_sender_entry,
                                            RT_NULL, 1024, 10, 10);
    if (mq_sender) rt_thread_startup(mq_sender);

    rt_thread_t mq_receiver = rt_thread_create("mq_receiver", msgq_receiver_entry,
                                              RT_NULL, 1024, 10, 10);
    if (mq_receiver) rt_thread_startup(mq_receiver);

    LOG_I("All threads created successfully!\n");

    return 0;
}
INIT_APP_EXPORT(ipc_example_init);
