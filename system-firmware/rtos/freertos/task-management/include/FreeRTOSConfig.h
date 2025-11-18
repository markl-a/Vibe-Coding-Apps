/**
 * @file FreeRTOSConfig.h
 * @brief FreeRTOS 核心配置文件
 * @author AI-Assisted Development Team
 * @date 2025-11-18
 *
 * 此文件包含 FreeRTOS 核心的配置選項
 * 針對 STM32F407VG (Cortex-M4F) 優化
 */

#ifndef FREERTOS_CONFIG_H
#define FREERTOS_CONFIG_H

/*-----------------------------------------------------------
 * Application specific definitions.
 *
 * These definitions should be adjusted for your particular hardware and
 * application requirements.
 *
 * THESE PARAMETERS ARE DESCRIBED WITHIN THE 'CONFIGURATION' SECTION OF THE
 * FreeRTOS API DOCUMENTATION AVAILABLE ON THE FreeRTOS.org WEB SITE.
 *
 * See http://www.freertos.org/a00110.html
 *----------------------------------------------------------*/

/* ========== 基本配置 ========== */

#define configUSE_PREEMPTION                    1
#define configUSE_IDLE_HOOK                     1
#define configUSE_TICK_HOOK                     1
#define configUSE_TICKLESS_IDLE                 0
#define configCPU_CLOCK_HZ                      ( ( unsigned long ) 168000000 )
#define configTICK_RATE_HZ                      ( ( TickType_t ) 1000 )
#define configMAX_PRIORITIES                    ( 7 )
#define configMINIMAL_STACK_SIZE                ( ( unsigned short ) 128 )
#define configTOTAL_HEAP_SIZE                   ( ( size_t ) ( 20 * 1024 ) )
#define configMAX_TASK_NAME_LEN                 ( 16 )
#define configUSE_TRACE_FACILITY                1
#define configUSE_16_BIT_TICKS                  0
#define configIDLE_SHOULD_YIELD                 1
#define configUSE_MUTEXES                       1
#define configQUEUE_REGISTRY_SIZE               8
#define configCHECK_FOR_STACK_OVERFLOW          2
#define configUSE_RECURSIVE_MUTEXES             1
#define configUSE_MALLOC_FAILED_HOOK            1
#define configUSE_APPLICATION_TASK_TAG          0
#define configUSE_COUNTING_SEMAPHORES           1
#define configGENERATE_RUN_TIME_STATS           1

/* ========== 協程相關配置 ========== */

#define configUSE_CO_ROUTINES                   0
#define configMAX_CO_ROUTINE_PRIORITIES         ( 2 )

/* ========== 軟體定時器配置 ========== */

#define configUSE_TIMERS                        1
#define configTIMER_TASK_PRIORITY               ( 2 )
#define configTIMER_QUEUE_LENGTH                10
#define configTIMER_TASK_STACK_DEPTH            ( configMINIMAL_STACK_SIZE * 2 )

/* ========== 事件組配置 ========== */

#define configUSE_EVENT_GROUPS                  1

/* ========== 流緩衝區配置 ========== */

#define configUSE_STREAM_BUFFERS                1

/* ========== 任務通知配置 ========== */

#define configUSE_TASK_NOTIFICATIONS            1
#define configTASK_NOTIFICATION_ARRAY_ENTRIES   3

/* ========== API 函數可用性配置 ========== */

#define INCLUDE_vTaskPrioritySet                1
#define INCLUDE_uxTaskPriorityGet               1
#define INCLUDE_vTaskDelete                     1
#define INCLUDE_vTaskCleanUpResources           0
#define INCLUDE_vTaskSuspend                    1
#define INCLUDE_vTaskDelayUntil                 1
#define INCLUDE_vTaskDelay                      1
#define INCLUDE_xTaskGetSchedulerState          1
#define INCLUDE_xTaskGetCurrentTaskHandle       1
#define INCLUDE_uxTaskGetStackHighWaterMark     1
#define INCLUDE_xTaskGetIdleTaskHandle          1
#define INCLUDE_eTaskGetState                   1
#define INCLUDE_xEventGroupSetBitFromISR        1
#define INCLUDE_xTimerPendFunctionCall          1
#define INCLUDE_xTaskAbortDelay                 1
#define INCLUDE_xTaskGetHandle                  1
#define INCLUDE_xTaskResumeFromISR              1

/* ========== Cortex-M 特定配置 ========== */

/*
 * 最低中斷優先權，用於 FreeRTOS 系統調用
 * Cortex-M4 有 4 位優先權 (0-15)
 * 值越大，優先權越低
 */
#ifdef __NVIC_PRIO_BITS
    #define configPRIO_BITS                     __NVIC_PRIO_BITS
#else
    #define configPRIO_BITS                     4
#endif

/* 最低中斷優先權 */
#define configLIBRARY_LOWEST_INTERRUPT_PRIORITY         15

/*
 * 可被 FreeRTOS API 安全調用的最高中斷優先權
 * 優先權高於此值的中斷不能調用 FreeRTOS API
 */
#define configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY    5

/*
 * configKERNEL_INTERRUPT_PRIORITY 設置 RTOS 核心優先權
 * 應設置為最低優先權
 */
#define configKERNEL_INTERRUPT_PRIORITY \
    ( configLIBRARY_LOWEST_INTERRUPT_PRIORITY << (8 - configPRIO_BITS) )

/* configMAX_SYSCALL_INTERRUPT_PRIORITY 不能為 0 */
#define configMAX_SYSCALL_INTERRUPT_PRIORITY \
    ( configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY << (8 - configPRIO_BITS) )

/* ========== 斷言和除錯配置 ========== */

/*
 * 斷言定義
 * 在除錯版本中啟用，發布版本中可禁用
 */
#ifdef DEBUG
    #define configASSERT( x ) \
        if( ( x ) == 0 ) { taskDISABLE_INTERRUPTS(); for( ;; ); }
#else
    #define configASSERT( x )
#endif

/* ========== 運行時統計配置 ========== */

/*
 * 為運行時統計定義計時器
 * 使用一個比滴答計時器更高頻率的計時器
 */
extern void vConfigureTimerForRunTimeStats( void );
extern unsigned long ulGetRuntimeCounterValue( void );

#define portCONFIGURE_TIMER_FOR_RUN_TIME_STATS() vConfigureTimerForRunTimeStats()
#define portGET_RUN_TIME_COUNTER_VALUE()         ulGetRuntimeCounterValue()

/* ========== 中斷處理配置 ========== */

/*
 * 定義 SVC、PendSV 和 SysTick 中斷處理函數
 * 這些由 FreeRTOS 提供
 */
#define vPortSVCHandler     SVC_Handler
#define xPortPendSVHandler  PendSV_Handler
#define xPortSysTickHandler SysTick_Handler

/* ========== MPU 配置 ========== */

#define configENABLE_MPU                        0
#define configENABLE_FPU                        1
#define configENABLE_TRUSTZONE                  0

/* ========== 記憶體分配配置 ========== */

/*
 * 使用 heap_4.c 記憶體分配方案
 * 支援記憶體碎片合併
 */
#define configSUPPORT_STATIC_ALLOCATION         0
#define configSUPPORT_DYNAMIC_ALLOCATION        1

/* ========== 佇列集配置 ========== */

#define configUSE_QUEUE_SETS                    1

/* ========== 統計格式化配置 ========== */

/*
 * 配置任務列表和統計函數使用的緩衝區格式
 * 使用製表符分隔以便於解析
 */
#define configSTATS_BUFFER_MAX_LENGTH           256

/* ========== 空閒任務優化 ========== */

#define configIDLE_TASK_NAME                    "IDLE"

/* ========== 命令解釋器配置 ========== */

#define configCOMMAND_INT_MAX_OUTPUT_SIZE       256

/* ========== 低功耗配置 ========== */

#define configUSE_TICKLESS_IDLE                 0
#define configPRE_SLEEP_PROCESSING(x)
#define configPOST_SLEEP_PROCESSING(x)

/* ========== 其他選項配置 ========== */

#define configUSE_NEWLIB_REENTRANT              0
#define configUSE_STATS_FORMATTING_FUNCTIONS    1
#define configRECORD_STACK_HIGH_ADDRESS         1

/* ========== 可選功能 ========== */

/* 啟用任務名稱記錄（用於除錯） */
#define configRECORD_TASK_NAME                  1

/* 啟用佇列名稱（用於除錯） */
#define configQUEUE_REGISTRY_SIZE               8

/* ========== 向後兼容 ========== */

#define configENABLE_BACKWARD_COMPATIBILITY     0

#endif /* FREERTOS_CONFIG_H */
