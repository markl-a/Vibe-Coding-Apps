/**
 * ARM Cortex-M 裸機 GPIO 控制範例
 *
 * 功能：直接操作暫存器控制 GPIO
 * 平台：STM32F4 (Cortex-M4)
 * 開發：裸機程式設計（無 HAL 庫）
 *
 * 此範例展示如何不使用任何函式庫，直接操作暫存器
 */

#include <stdint.h>

/* RCC 暫存器位址 */
#define RCC_BASE            0x40023800
#define RCC_AHB1ENR         (*(volatile uint32_t *)(RCC_BASE + 0x30))

/* GPIOA 暫存器位址 */
#define GPIOA_BASE          0x40020000
#define GPIOA_MODER         (*(volatile uint32_t *)(GPIOA_BASE + 0x00))
#define GPIOA_ODR           (*(volatile uint32_t *)(GPIOA_BASE + 0x14))
#define GPIOA_IDR           (*(volatile uint32_t *)(GPIOA_BASE + 0x10))
#define GPIOA_BSRR          (*(volatile uint32_t *)(GPIOA_BASE + 0x18))

/* 腳位定義 */
#define LED_PIN             5   // PA5

/* 函數原型 */
void gpio_init(void);
void led_on(void);
void led_off(void);
void led_toggle(void);
void delay(uint32_t count);

/**
 * 主程式
 */
int main(void)
{
    /* 初始化 GPIO */
    gpio_init();

    /* 主循環 - LED 閃爍 */
    while (1)
    {
        led_on();
        delay(1000000);

        led_off();
        delay(1000000);
    }
}

/**
 * GPIO 初始化
 * 配置 PA5 為輸出
 */
void gpio_init(void)
{
    /* 1. 啟用 GPIOA 時鐘 */
    RCC_AHB1ENR |= (1 << 0);  // 設定 bit 0 (GPIOAEN)

    /* 2. 配置 PA5 模式為輸出 */
    /* MODER[11:10] = 01 (通用輸出模式) */
    GPIOA_MODER &= ~(3 << (LED_PIN * 2));  // 清除
    GPIOA_MODER |= (1 << (LED_PIN * 2));   // 設定為 01

    /* 3. 初始狀態：LED 關閉 */
    led_off();
}

/**
 * 點亮 LED
 */
void led_on(void)
{
    /* 方法 1: 直接寫 ODR */
    GPIOA_ODR |= (1 << LED_PIN);

    /* 方法 2: 使用 BSRR (Bit Set/Reset Register) */
    // GPIOA_BSRR = (1 << LED_PIN);  // 設定 bit
}

/**
 * 關閉 LED
 */
void led_off(void)
{
    /* 方法 1: 直接寫 ODR */
    GPIOA_ODR &= ~(1 << LED_PIN);

    /* 方法 2: 使用 BSRR */
    // GPIOA_BSRR = (1 << (LED_PIN + 16));  // 重置 bit
}

/**
 * 切換 LED 狀態
 */
void led_toggle(void)
{
    GPIOA_ODR ^= (1 << LED_PIN);
}

/**
 * 簡單延遲函數
 * 注意：此延遲不精確，僅供示範
 */
void delay(uint32_t count)
{
    volatile uint32_t i;
    for (i = 0; i < count; i++)
    {
        __asm volatile ("nop");  // 防止編譯器優化
    }
}

/**
 * 系統啟動處理函數
 * 在實際應用中，這裡需要初始化堆疊和 .data/.bss 區段
 */
void Reset_Handler(void)
{
    /* 呼叫主程式 */
    main();

    /* 如果 main 返回，進入無限循環 */
    while (1);
}

/**
 * 預設中斷處理函數
 */
void Default_Handler(void)
{
    while (1);
}

/* 弱符號定義，可被覆寫 */
void NMI_Handler(void) __attribute__ ((weak, alias("Default_Handler")));
void HardFault_Handler(void) __attribute__ ((weak, alias("Default_Handler")));

/**
 * 向量表
 * 必須放在記憶體開頭（通常是 0x08000000）
 */
extern uint32_t _estack;  // 堆疊頂端位址（由連結腳本定義）

__attribute__ ((section(".isr_vector")))
void (* const vector_table[])(void) = {
    (void (*)(void))(&_estack),     // 初始堆疊指標
    Reset_Handler,                   // Reset
    NMI_Handler,                     // NMI
    HardFault_Handler,               // Hard Fault
    /* ... 其他中斷向量 ... */
};

/*
 * 裸機程式設計要點：
 *
 * 1. 暫存器操作
 *    - 使用 volatile 防止編譯器優化
 *    - 理解每個暫存器的功能
 *    - 參考晶片參考手冊
 *
 * 2. 記憶體映射
 *    - Flash: 0x08000000
 *    - SRAM:  0x20000000
 *    - 外設:  0x40000000 起
 *
 * 3. 時鐘配置
 *    - 預設使用 HSI (16 MHz)
 *    - 可配置 PLL 提高頻率
 *    - 外設時鐘需要單獨啟用
 *
 * 4. 中斷向量表
 *    - 必須放在 Flash 開頭
 *    - 第一個元素是堆疊指標
 *    - 第二個元素是 Reset_Handler
 *
 * 5. 連結腳本
 *    - 定義記憶體佈局
 *    - 指定各區段位置
 *    - 定義堆疊位置
 */
