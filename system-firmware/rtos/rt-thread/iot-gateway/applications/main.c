/**
 * @file main.c
 * @brief RT-Thread IoT 閘道器範例 - 主程式
 * @author AI-Assisted Development Team
 * @date 2025-11-16
 */

#include <rtthread.h>
#include <rtdevice.h>
#include <board.h>

#define DBG_TAG "main"
#define DBG_LVL DBG_LOG
#include <rtdbg.h>

/* ========== 配置參數 ========== */

#define LED_PIN             GET_PIN(A, 5)
#define SENSOR_THREAD_PRIORITY      10
#define SENSOR_THREAD_STACK_SIZE    2048
#define SENSOR_THREAD_TIMESLICE     10

/* ========== 全域變數 ========== */

static rt_thread_t sensor_thread = RT_NULL;
static rt_sem_t data_sem = RT_NULL;
static rt_mutex_t data_mutex = RT_NULL;
static rt_mailbox_t data_mailbox = RT_NULL;

/* ========== 感測器資料結構 ========== */

struct sensor_data
{
    rt_uint32_t timestamp;
    float temperature;
    float humidity;
    rt_uint16_t light_level;
};

static struct sensor_data latest_data = {0};

/* ========== 模擬感測器讀取 ========== */

static float read_temperature(void)
{
    /* 模擬溫度讀取 (20-30°C) */
    return 20.0f + (rt_tick_get() % 100) / 10.0f;
}

static float read_humidity(void)
{
    /* 模擬濕度讀取 (40-80%) */
    return 40.0f + (rt_tick_get() % 400) / 10.0f;
}

static rt_uint16_t read_light_level(void)
{
    /* 模擬光照強度 (0-1023) */
    return rt_tick_get() % 1024;
}

/* ========== 感測器執行緒 ========== */

static void sensor_thread_entry(void *parameter)
{
    struct sensor_data data;
    rt_uint32_t count = 0;

    LOG_I("Sensor thread started");

    while (1)
    {
        /* 讀取感測器資料 */
        rt_mutex_take(data_mutex, RT_WAITING_FOREVER);

        data.timestamp = rt_tick_get();
        data.temperature = read_temperature();
        data.humidity = read_humidity();
        data.light_level = read_light_level();

        latest_data = data;

        rt_mutex_release(data_mutex);

        /* 打印資料 */
        count++;
        LOG_I("[%lu] Temp: %.2f°C, Hum: %.2f%%, Light: %d",
              count, data.temperature, data.humidity, data.light_level);

        /* 發送到郵箱（如果有其他任務需要） */
        if (data_mailbox != RT_NULL)
        {
            rt_mb_send(data_mailbox, (rt_uint32_t)&data);
        }

        /* 釋放信號量通知其他任務 */
        rt_sem_release(data_sem);

        /* LED 閃爍指示 */
        rt_pin_write(LED_PIN, PIN_HIGH);
        rt_thread_mdelay(50);
        rt_pin_write(LED_PIN, PIN_LOW);

        /* 延遲 2 秒 */
        rt_thread_mdelay(2000);
    }
}

/* ========== 資料處理執行緒 ========== */

static void data_process_thread_entry(void *parameter)
{
    struct sensor_data *data;
    rt_uint32_t mail_value;

    LOG_I("Data process thread started");

    while (1)
    {
        /* 等待信號量 */
        if (rt_sem_take(data_sem, RT_WAITING_FOREVER) == RT_EOK)
        {
            /* 從郵箱接收資料 */
            if (rt_mb_recv(data_mailbox, &mail_value, RT_WAITING_NO) == RT_EOK)
            {
                data = (struct sensor_data *)mail_value;

                LOG_D("Processing data: Temp=%.2f, Hum=%.2f",
                      data->temperature, data->humidity);

                /* 這裡可以進行資料處理、儲存或上傳 */

                /* 示範：檢查警報條件 */
                if (data->temperature > 28.0f)
                {
                    LOG_W("High temperature alert: %.2f°C", data->temperature);
                }

                if (data->humidity > 70.0f)
                {
                    LOG_W("High humidity alert: %.2f%%", data->humidity);
                }
            }
        }
    }
}

/* ========== Shell 命令 ========== */

/**
 * @brief 讀取當前感測器資料
 */
static int cmd_sensor_read(int argc, char **argv)
{
    struct sensor_data data;

    rt_mutex_take(data_mutex, RT_WAITING_FOREVER);
    data = latest_data;
    rt_mutex_release(data_mutex);

    rt_kprintf("\n========== Sensor Data ==========\n");
    rt_kprintf("Timestamp:   %lu ms\n", data.timestamp);
    rt_kprintf("Temperature: %.2f °C\n", data.temperature);
    rt_kprintf("Humidity:    %.2f %%\n", data.humidity);
    rt_kprintf("Light Level: %d\n", data.light_level);
    rt_kprintf("=================================\n\n");

    return 0;
}
MSH_CMD_EXPORT_ALIAS(cmd_sensor_read, sensor_read, Read current sensor data);

/**
 * @brief LED 控制命令
 */
static int cmd_led(int argc, char **argv)
{
    if (argc < 2)
    {
        rt_kprintf("Usage: led <on|off|toggle>\n");
        return -1;
    }

    if (rt_strcmp(argv[1], "on") == 0)
    {
        rt_pin_write(LED_PIN, PIN_HIGH);
        rt_kprintf("LED ON\n");
    }
    else if (rt_strcmp(argv[1], "off") == 0)
    {
        rt_pin_write(LED_PIN, PIN_LOW);
        rt_kprintf("LED OFF\n");
    }
    else if (rt_strcmp(argv[1], "toggle") == 0)
    {
        rt_pin_write(LED_PIN, !rt_pin_read(LED_PIN));
        rt_kprintf("LED toggled\n");
    }
    else
    {
        rt_kprintf("Invalid argument: %s\n", argv[1]);
        return -1;
    }

    return 0;
}
MSH_CMD_EXPORT(cmd_led, Control LED: led <on|off|toggle>);

/**
 * @brief 系統資訊命令
 */
static int cmd_sysinfo(int argc, char **argv)
{
    rt_kprintf("\n========== System Information ==========\n");
    rt_kprintf("RT-Thread Version: %d.%d.%d\n",
               RT_VERSION, RT_SUBVERSION, RT_REVISION);
    rt_kprintf("CPU Frequency:     %d Hz\n", SystemCoreClock);
    rt_kprintf("Tick Frequency:    %d Hz\n", RT_TICK_PER_SECOND);
    rt_kprintf("System Uptime:     %lu ms\n", rt_tick_get());
    rt_kprintf("Free Memory:       %d bytes\n", rt_memory_info(RT_NULL));
    rt_kprintf("========================================\n\n");

    return 0;
}
MSH_CMD_EXPORT(cmd_sysinfo, Display system information);

/* ========== 應用程式初始化 ========== */

static int application_init(void)
{
    rt_thread_t tid;

    LOG_I("Application initializing...");

    /* 配置 LED GPIO */
    rt_pin_mode(LED_PIN, PIN_MODE_OUTPUT);
    rt_pin_write(LED_PIN, PIN_LOW);

    /* 創建信號量 */
    data_sem = rt_sem_create("data_sem", 0, RT_IPC_FLAG_FIFO);
    if (data_sem == RT_NULL)
    {
        LOG_E("Failed to create semaphore");
        return -1;
    }

    /* 創建互斥鎖 */
    data_mutex = rt_mutex_create("data_mtx", RT_IPC_FLAG_FIFO);
    if (data_mutex == RT_NULL)
    {
        LOG_E("Failed to create mutex");
        return -1;
    }

    /* 創建郵箱 */
    data_mailbox = rt_mb_create("data_mb", 10, RT_IPC_FLAG_FIFO);
    if (data_mailbox == RT_NULL)
    {
        LOG_E("Failed to create mailbox");
        return -1;
    }

    /* 創建感測器執行緒 */
    sensor_thread = rt_thread_create("sensor",
                                     sensor_thread_entry,
                                     RT_NULL,
                                     SENSOR_THREAD_STACK_SIZE,
                                     SENSOR_THREAD_PRIORITY,
                                     SENSOR_THREAD_TIMESLICE);

    if (sensor_thread != RT_NULL)
    {
        rt_thread_startup(sensor_thread);
        LOG_I("Sensor thread created");
    }
    else
    {
        LOG_E("Failed to create sensor thread");
        return -1;
    }

    /* 創建資料處理執行緒 */
    tid = rt_thread_create("data_proc",
                           data_process_thread_entry,
                           RT_NULL,
                           2048,
                           SENSOR_THREAD_PRIORITY + 1,
                           10);

    if (tid != RT_NULL)
    {
        rt_thread_startup(tid);
        LOG_I("Data process thread created");
    }
    else
    {
        LOG_E("Failed to create data process thread");
        return -1;
    }

    LOG_I("Application initialized successfully");

    return 0;
}
INIT_APP_EXPORT(application_init);

/* ========== 主函數 ========== */

int main(void)
{
    LOG_I("\n");
    LOG_I("=========================================");
    LOG_I("  RT-Thread IoT Gateway Example");
    LOG_I("  Version: %d.%d.%d", RT_VERSION, RT_SUBVERSION, RT_REVISION);
    LOG_I("  Build: %s %s", __DATE__, __TIME__);
    LOG_I("=========================================");
    LOG_I("\n");

    /* LED 快閃三次表示啟動 */
    for (int i = 0; i < 3; i++)
    {
        rt_pin_write(LED_PIN, PIN_HIGH);
        rt_thread_mdelay(100);
        rt_pin_write(LED_PIN, PIN_LOW);
        rt_thread_mdelay(100);
    }

    LOG_I("System started successfully!");
    LOG_I("Type 'help' to see available commands");

    return 0;
}
