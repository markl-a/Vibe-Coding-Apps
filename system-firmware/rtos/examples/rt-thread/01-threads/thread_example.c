/**
 * @file thread_example.c
 * @brief RT-Thread 執行緒管理範例
 * @author AI-Assisted Development Team
 * @date 2025-11-17
 *
 * 本範例展示：
 * 1. 執行緒創建和管理
 * 2. 靜態與動態執行緒
 * 3. 執行緒優先權和時間片
 * 4. 執行緒控制（掛起、恢復、刪除）
 * 5. 執行緒間同步
 */

#include <rtthread.h>
#include <rtdevice.h>

#define DBG_TAG "thread_example"
#define DBG_LVL DBG_LOG
#include <rtdbg.h>

/* ==================== 執行緒配置 ==================== */

#define THREAD_PRIORITY         10
#define THREAD_STACK_SIZE       1024
#define THREAD_TIMESLICE        10

/* 靜態執行緒堆疊和控制塊 */
ALIGN(RT_ALIGN_SIZE)
static rt_uint8_t thread1_stack[THREAD_STACK_SIZE];
static struct rt_thread thread1;

ALIGN(RT_ALIGN_SIZE)
static rt_uint8_t thread2_stack[THREAD_STACK_SIZE];
static struct rt_thread thread2;

/* 動態執行緒句柄 */
static rt_thread_t dynamic_thread = RT_NULL;

/* ==================== 執行緒函數 ==================== */

/**
 * @brief 執行緒 1 - 週期性任務
 */
static void thread1_entry(void *parameter)
{
    rt_uint32_t count = 0;

    LOG_I("Thread1 started (static thread)");

    while (1)
    {
        count++;
        LOG_I("[Thread1] Running... count=%u, priority=%u",
              count, rt_thread_self()->current_priority);

        /* 每 5 次讓出 CPU */
        if (count % 5 == 0)
        {
            LOG_I("[Thread1] Yielding CPU...");
            rt_thread_yield();
        }

        rt_thread_mdelay(1000);
    }
}

/**
 * @brief 執行緒 2 - 使用參數
 */
static void thread2_entry(void *parameter)
{
    rt_uint32_t param = (rt_uint32_t)parameter;
    rt_uint32_t count = 0;

    LOG_I("Thread2 started with parameter: %u", param);

    while (1)
    {
        count++;
        LOG_I("[Thread2] Processing... count=%u (param=%u)", count, param);

        /* 動態調整優先權 */
        if (count == 5)
        {
            LOG_I("[Thread2] Changing priority to 8");
            rt_thread_control(&thread2, RT_THREAD_CTRL_CHANGE_PRIORITY, (void *)8);
        }
        if (count == 10)
        {
            LOG_I("[Thread2] Restoring priority to %u", THREAD_PRIORITY);
            rt_thread_control(&thread2, RT_THREAD_CTRL_CHANGE_PRIORITY,
                            (void *)THREAD_PRIORITY);
        }

        rt_thread_mdelay(1500);
    }
}

/**
 * @brief 動態執行緒 - 有限生命週期
 */
static void dynamic_thread_entry(void *parameter)
{
    rt_uint32_t iterations = (rt_uint32_t)parameter;

    LOG_I("Dynamic thread started (will run %u iterations)", iterations);

    for (rt_uint32_t i = 0; i < iterations; i++)
    {
        LOG_I("[DynamicThread] Iteration %u/%u", i + 1, iterations);
        rt_thread_mdelay(500);
    }

    LOG_I("Dynamic thread completed");
    /* 執行緒函數返回會自動刪除執行緒 */
}

/**
 * @brief 可控制的執行緒
 */
static void controllable_thread_entry(void *parameter)
{
    rt_uint32_t count = 0;

    LOG_I("Controllable thread started");

    while (1)
    {
        count++;
        LOG_I("[Controllable] Running... count=%u", count);

        rt_thread_mdelay(800);

        /* 自我終止條件 */
        if (count >= 15)
        {
            LOG_I("[Controllable] Self-terminating after 15 iterations");
            return;
        }
    }
}

/* ==================== 執行緒控制任務 ==================== */

static void controller_thread_entry(void *parameter)
{
    LOG_I("Controller thread started");

    rt_thread_mdelay(5000);

    while (1)
    {
        LOG_I("\n=== Controller Actions ===");

        /* 掛起 Thread1 */
        LOG_I("[Controller] Suspending Thread1...");
        rt_thread_suspend(&thread1);
        rt_thread_mdelay(3000);

        LOG_I("[Controller] Resuming Thread1...");
        rt_thread_resume(&thread1);

        rt_thread_mdelay(2000);

        /* 改變 Thread2 優先權 */
        rt_uint8_t current_prio = thread2.current_priority;
        LOG_I("[Controller] Thread2 priority: %u -> 7", current_prio);
        rt_thread_control(&thread2, RT_THREAD_CTRL_CHANGE_PRIORITY, (void *)7);

        rt_thread_mdelay(2000);

        LOG_I("[Controller] Restoring Thread2 priority to %u", THREAD_PRIORITY);
        rt_thread_control(&thread2, RT_THREAD_CTRL_CHANGE_PRIORITY,
                         (void *)THREAD_PRIORITY);

        rt_thread_mdelay(3000);

        /* 創建動態執行緒 */
        if (dynamic_thread == RT_NULL || dynamic_thread->stat == RT_THREAD_CLOSE)
        {
            LOG_I("[Controller] Creating dynamic thread...");
            dynamic_thread = rt_thread_create("dynamic",
                                             dynamic_thread_entry,
                                             (void *)5,
                                             THREAD_STACK_SIZE,
                                             THREAD_PRIORITY,
                                             THREAD_TIMESLICE);

            if (dynamic_thread != RT_NULL)
            {
                rt_thread_startup(dynamic_thread);
                LOG_I("[Controller] Dynamic thread created");
            }
            else
            {
                LOG_E("[Controller] Failed to create dynamic thread");
            }
        }

        LOG_I("=== End Control Cycle ===\n");

        rt_thread_mdelay(10000);
    }
}

/* ==================== 監控執行緒 ==================== */

static void monitor_thread_entry(void *parameter)
{
    LOG_I("Monitor thread started");

    rt_thread_mdelay(8000);

    while (1)
    {
        rt_kprintf("\n========== Thread Monitor ==========\n");
        rt_kprintf("System tick: %lu\n", rt_tick_get());

        /* 列出所有執行緒 */
        extern long list_thread(void);
        list_thread();

        rt_kprintf("\nMemory Information:\n");
        rt_kprintf("  Total memory: %u bytes\n", RT_HEAP_SIZE);
        rt_kprintf("  Used memory:  %u bytes\n", rt_memory_info(RT_NULL));

        rt_kprintf("====================================\n\n");

        rt_thread_mdelay(15000);
    }
}

/* ==================== 初始化函數 ==================== */

static int thread_example_init(void)
{
    rt_err_t result;

    LOG_I("\n==========================================");
    LOG_I("  RT-Thread Thread Management Example");
    LOG_I("  Version: %d.%d.%d", RT_VERSION, RT_SUBVERSION, RT_REVISION);
    LOG_I("==========================================\n");

    /* 初始化並啟動靜態執行緒 1 */
    result = rt_thread_init(&thread1,
                           "thread1",
                           thread1_entry,
                           RT_NULL,
                           &thread1_stack[0],
                           sizeof(thread1_stack),
                           THREAD_PRIORITY,
                           THREAD_TIMESLICE);

    if (result == RT_EOK)
    {
        rt_thread_startup(&thread1);
        LOG_I("Thread1 created (static)");
    }

    /* 初始化並啟動靜態執行緒 2 */
    result = rt_thread_init(&thread2,
                           "thread2",
                           thread2_entry,
                           (void *)100,
                           &thread2_stack[0],
                           sizeof(thread2_stack),
                           THREAD_PRIORITY,
                           THREAD_TIMESLICE);

    if (result == RT_EOK)
    {
        rt_thread_startup(&thread2);
        LOG_I("Thread2 created (static)");
    }

    /* 創建可控制執行緒（動態） */
    rt_thread_t controllable = rt_thread_create("controllable",
                                                controllable_thread_entry,
                                                RT_NULL,
                                                THREAD_STACK_SIZE,
                                                THREAD_PRIORITY + 1,
                                                THREAD_TIMESLICE);

    if (controllable != RT_NULL)
    {
        rt_thread_startup(controllable);
        LOG_I("Controllable thread created");
    }

    /* 創建控制執行緒 */
    rt_thread_t controller = rt_thread_create("controller",
                                             controller_thread_entry,
                                             RT_NULL,
                                             THREAD_STACK_SIZE,
                                             THREAD_PRIORITY - 1,
                                             THREAD_TIMESLICE);

    if (controller != RT_NULL)
    {
        rt_thread_startup(controller);
        LOG_I("Controller thread created");
    }

    /* 創建監控執行緒 */
    rt_thread_t monitor = rt_thread_create("monitor",
                                          monitor_thread_entry,
                                          RT_NULL,
                                          THREAD_STACK_SIZE * 2,
                                          THREAD_PRIORITY + 2,
                                          THREAD_TIMESLICE);

    if (monitor != RT_NULL)
    {
        rt_thread_startup(monitor);
        LOG_I("Monitor thread created");
    }

    LOG_I("\nAll threads created successfully!\n");

    return 0;
}
INIT_APP_EXPORT(thread_example_init);

/* ==================== MSH 命令 ==================== */

/**
 * @brief 列出執行緒資訊
 */
static int cmd_thread_info(int argc, char **argv)
{
    rt_kprintf("\n========== Thread Information ==========\n");

    rt_kprintf("Thread1 (static):\n");
    rt_kprintf("  Priority: %u\n", thread1.current_priority);
    rt_kprintf("  Status:   %u\n", thread1.stat);

    rt_kprintf("\nThread2 (static):\n");
    rt_kprintf("  Priority: %u\n", thread2.current_priority);
    rt_kprintf("  Status:   %u\n", thread2.stat);

    if (dynamic_thread != RT_NULL)
    {
        rt_kprintf("\nDynamic thread:\n");
        rt_kprintf("  Priority: %u\n", dynamic_thread->current_priority);
        rt_kprintf("  Status:   %u\n", dynamic_thread->stat);
    }

    rt_kprintf("========================================\n\n");

    return 0;
}
MSH_CMD_EXPORT_ALIAS(cmd_thread_info, thread_info, Show thread information);
