/**
 * @file thread_management.c
 * @brief Zephyr RTOS 執行緒管理範例
 * @author AI-Assisted Development Team
 * @date 2025-11-17
 *
 * 本範例展示：
 * 1. 執行緒創建和管理
 * 2. 執行緒優先權
 * 3. 執行緒同步
 * 4. 執行緒間通訊
 * 5. 工作佇列 (Work Queue)
 */

#include <zephyr/kernel.h>
#include <zephyr/sys/printk.h>
#include <zephyr/sys/util.h>

/* 執行緒堆疊大小 */
#define STACK_SIZE      1024
#define PRIORITY        7

/* 定義執行緒堆疊 */
K_THREAD_STACK_DEFINE(thread1_stack, STACK_SIZE);
K_THREAD_STACK_DEFINE(thread2_stack, STACK_SIZE);
K_THREAD_STACK_DEFINE(thread3_stack, STACK_SIZE);
K_THREAD_STACK_DEFINE(dynamic_thread_stack, STACK_SIZE);

/* 執行緒結構 */
struct k_thread thread1_data;
struct k_thread thread2_data;
struct k_thread thread3_data;
struct k_thread dynamic_thread_data;

/* 執行緒 ID */
k_tid_t thread1_tid;
k_tid_t thread2_tid;
k_tid_t thread3_tid;

/* ==================== 執行緒函數 ==================== */

/**
 * @brief 執行緒 1 - 週期性任務
 */
void thread1_entry(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    uint32_t count = 0;

    printk("[Thread1] Started (periodic task)\n");

    while (1) {
        count++;
        printk("[Thread1] Running... count=%u, priority=%d\n",
               count, k_thread_priority_get(k_current_get()));

        /* 休眠 1 秒 */
        k_sleep(K_SECONDS(1));

        /* 每 5 次讓出 CPU */
        if (count % 5 == 0) {
            printk("[Thread1] Yielding CPU...\n");
            k_yield();
        }
    }
}

/**
 * @brief 執行緒 2 - 使用參數
 */
void thread2_entry(void *arg1, void *arg2, void *arg3)
{
    int param1 = POINTER_TO_INT(arg1);
    int param2 = POINTER_TO_INT(arg2);

    printk("[Thread2] Started with params: %d, %d\n", param1, param2);

    uint32_t count = 0;

    while (1) {
        count++;
        printk("[Thread2] Processing... count=%u (param1=%d, param2=%d)\n",
               count, param1, param2);

        /* 休眠 1.5 秒 */
        k_sleep(K_MSEC(1500));

        /* 動態調整優先權 */
        if (count == 5) {
            printk("[Thread2] Changing priority to 5\n");
            k_thread_priority_set(k_current_get(), 5);
        }
        if (count == 10) {
            printk("[Thread2] Restoring priority to 7\n");
            k_thread_priority_set(k_current_get(), 7);
        }
    }
}

/**
 * @brief 執行緒 3 - 可控制的執行緒
 */
void thread3_entry(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    uint32_t count = 0;

    printk("[Thread3] Started (controllable thread)\n");

    while (1) {
        count++;
        printk("[Thread3] Running... count=%u\n", count);

        k_sleep(K_MSEC(800));

        /* 自我終止條件 */
        if (count >= 15) {
            printk("[Thread3] Terminating after 15 iterations\n");
            return;  /* 執行緒結束 */
        }
    }
}

/**
 * @brief 動態創建的執行緒
 */
void dynamic_thread_entry(void *arg1, void *arg2, void *arg3)
{
    int id = POINTER_TO_INT(arg1);

    printk("[DynamicThread-%d] Started\n", id);

    for (int i = 0; i < 5; i++) {
        printk("[DynamicThread-%d] Iteration %d\n", id, i + 1);
        k_sleep(K_MSEC(500));
    }

    printk("[DynamicThread-%d] Completed\n", id);
}

/* ==================== 工作佇列 ==================== */

/* 定義工作項目 */
struct k_work my_work;
struct k_work_delayable delayed_work;

/* 工作項目處理函數 */
void work_handler(struct k_work *work)
{
    static uint32_t work_count = 0;
    work_count++;

    printk("[WorkQueue] Work item executed #%u\n", work_count);

    /* 模擬工作處理 */
    k_sleep(K_MSEC(100));
}

/* 延遲工作項目處理函數 */
void delayed_work_handler(struct k_work *work)
{
    static uint32_t delayed_count = 0;
    delayed_count++;

    printk("[WorkQueue] Delayed work executed #%u\n", delayed_count);

    /* 重新提交延遲工作 (5 秒後) */
    k_work_schedule((struct k_work_delayable *)work, K_SECONDS(5));
}

/**
 * @brief 工作佇列提交任務
 */
void workqueue_submitter_thread(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[WorkSubmitter] Started\n");

    k_sleep(K_SECONDS(2));

    while (1) {
        /* 提交工作到系統工作佇列 */
        printk("[WorkSubmitter] Submitting work to queue...\n");
        k_work_submit(&my_work);

        k_sleep(K_SECONDS(3));
    }
}

/* ==================== 執行緒控制任務 ==================== */

void controller_thread(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[Controller] Started\n");

    k_sleep(K_SECONDS(5));

    while (1) {
        printk("\n[Controller] === Control Actions ===\n");

        /* 暫停 Thread1 */
        if (thread1_tid != NULL) {
            printk("[Controller] Suspending Thread1...\n");
            k_thread_suspend(thread1_tid);
            k_sleep(K_SECONDS(3));

            printk("[Controller] Resuming Thread1...\n");
            k_thread_resume(thread1_tid);
        }

        k_sleep(K_SECONDS(2));

        /* 改變 Thread2 優先權 */
        if (thread2_tid != NULL) {
            int current_prio = k_thread_priority_get(thread2_tid);
            printk("[Controller] Thread2 priority: %d -> 6\n", current_prio);
            k_thread_priority_set(thread2_tid, 6);

            k_sleep(K_SECONDS(2));

            printk("[Controller] Restoring Thread2 priority to %d\n", PRIORITY);
            k_thread_priority_set(thread2_tid, PRIORITY);
        }

        k_sleep(K_SECONDS(3));

        /* 創建動態執行緒 */
        printk("[Controller] Creating dynamic thread...\n");
        k_tid_t dynamic_tid = k_thread_create(&dynamic_thread_data,
                                               dynamic_thread_stack,
                                               K_THREAD_STACK_SIZEOF(dynamic_thread_stack),
                                               dynamic_thread_entry,
                                               INT_TO_POINTER(1), NULL, NULL,
                                               PRIORITY, 0, K_NO_WAIT);
        k_thread_name_set(dynamic_tid, "dynamic");

        printk("[Controller] === End Control Cycle ===\n\n");

        k_sleep(K_SECONDS(10));
    }
}

/* ==================== 監控執行緒 ==================== */

void monitor_thread(void *arg1, void *arg2, void *arg3)
{
    ARG_UNUSED(arg1);
    ARG_UNUSED(arg2);
    ARG_UNUSED(arg3);

    printk("[Monitor] Started\n");

    k_sleep(K_SECONDS(8));

    while (1) {
        printk("\n========== Thread Monitor ==========\n");
        printk("System uptime: %lld ms\n", k_uptime_get());

        /* 顯示執行緒資訊 */
        printk("\nThread Information:\n");
        printk("%-20s %-10s %-10s %-15s\n",
               "Name", "Priority", "State", "Stack Usage");
        printk("------------------------------------------------------------\n");

        /* Thread1 */
        if (thread1_tid != NULL) {
            size_t unused;
            k_thread_stack_space_get(thread1_tid, &unused);
            printk("%-20s %-10d %-10s %zu bytes unused\n",
                   "thread1",
                   k_thread_priority_get(thread1_tid),
                   "Running",
                   unused);
        }

        /* Thread2 */
        if (thread2_tid != NULL) {
            size_t unused;
            k_thread_stack_space_get(thread2_tid, &unused);
            printk("%-20s %-10d %-10s %zu bytes unused\n",
                   "thread2",
                   k_thread_priority_get(thread2_tid),
                   "Running",
                   unused);
        }

        printk("====================================\n\n");

        k_sleep(K_SECONDS(15));
    }
}

/* ==================== 主程式 ==================== */

int main(void)
{
    printk("\n");
    printk("==========================================\n");
    printk("  Zephyr Thread Management Example\n");
    printk("  Zephyr Version: %s\n", KERNEL_VERSION_STRING);
    printk("  Build: %s %s\n", __DATE__, __TIME__);
    printk("==========================================\n\n");

    /* 初始化工作佇列項目 */
    k_work_init(&my_work, work_handler);
    k_work_init_delayable(&delayed_work, delayed_work_handler);

    /* 啟動延遲工作 */
    k_work_schedule(&delayed_work, K_SECONDS(10));

    /* 創建執行緒 1 */
    thread1_tid = k_thread_create(&thread1_data,
                                   thread1_stack,
                                   K_THREAD_STACK_SIZEOF(thread1_stack),
                                   thread1_entry,
                                   NULL, NULL, NULL,
                                   PRIORITY, 0, K_NO_WAIT);
    k_thread_name_set(thread1_tid, "thread1");
    printk("Thread1 created\n");

    /* 創建執行緒 2 (帶參數) */
    thread2_tid = k_thread_create(&thread2_data,
                                   thread2_stack,
                                   K_THREAD_STACK_SIZEOF(thread2_stack),
                                   thread2_entry,
                                   INT_TO_POINTER(100),
                                   INT_TO_POINTER(200),
                                   NULL,
                                   PRIORITY, 0, K_NO_WAIT);
    k_thread_name_set(thread2_tid, "thread2");
    printk("Thread2 created\n");

    /* 創建執行緒 3 */
    thread3_tid = k_thread_create(&thread3_data,
                                   thread3_stack,
                                   K_THREAD_STACK_SIZEOF(thread3_stack),
                                   thread3_entry,
                                   NULL, NULL, NULL,
                                   PRIORITY + 1, 0, K_NO_WAIT);
    k_thread_name_set(thread3_tid, "thread3");
    printk("Thread3 created\n");

    /* 創建控制執行緒 */
    K_THREAD_STACK_DEFINE(controller_stack, STACK_SIZE);
    struct k_thread controller_data;
    k_tid_t controller_tid = k_thread_create(&controller_data,
                                              controller_stack,
                                              K_THREAD_STACK_SIZEOF(controller_stack),
                                              controller_thread,
                                              NULL, NULL, NULL,
                                              PRIORITY - 1, 0, K_NO_WAIT);
    k_thread_name_set(controller_tid, "controller");
    printk("Controller thread created\n");

    /* 創建監控執行緒 */
    K_THREAD_STACK_DEFINE(monitor_stack, STACK_SIZE);
    struct k_thread monitor_data;
    k_tid_t monitor_tid = k_thread_create(&monitor_data,
                                           monitor_stack,
                                           K_THREAD_STACK_SIZEOF(monitor_stack),
                                           monitor_thread,
                                           NULL, NULL, NULL,
                                           PRIORITY + 2, 0, K_NO_WAIT);
    k_thread_name_set(monitor_tid, "monitor");
    printk("Monitor thread created\n");

    /* 創建工作提交執行緒 */
    K_THREAD_STACK_DEFINE(work_submitter_stack, STACK_SIZE);
    struct k_thread work_submitter_data;
    k_thread_create(&work_submitter_data,
                    work_submitter_stack,
                    K_THREAD_STACK_SIZEOF(work_submitter_stack),
                    workqueue_submitter_thread,
                    NULL, NULL, NULL,
                    PRIORITY, 0, K_NO_WAIT);

    printk("\nAll threads created successfully!\n\n");

    return 0;
}
