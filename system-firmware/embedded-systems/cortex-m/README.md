# ARM Cortex-M 裸機開發

ARM Cortex-M 微控制器裸機程式開發範例。

## 🎯 Cortex-M 系列

- **Cortex-M0/M0+** - 超低功耗，32-bit
- **Cortex-M3** - 主流性能
- **Cortex-M4** - DSP 和 FPU
- **Cortex-M7** - 高性能，雙精度 FPU
- **Cortex-M33** - 安全性增強

## 🔧 裸機開發特點

- 無作業系統
- 直接硬體控制
- 最小記憶體佔用
- 確定性執行時間
- 完全控制

## 📝 基礎範例

### 啟動程式碼

```c
// startup.c - Cortex-M 啟動程式碼範例

#include <stdint.h>

/* 堆疊頂端位址 */
extern uint32_t _estack;

/* 主程式 */
int main(void);

/* 重置處理函數 */
void Reset_Handler(void)
{
    /* 複製 .data 區段到 RAM */
    extern uint32_t _sdata, _edata, _sidata;
    uint32_t *src = &_sidata;
    uint32_t *dst = &_sdata;

    while (dst < &_edata) {
        *dst++ = *src++;
    }

    /* 清空 .bss 區段 */
    extern uint32_t _sbss, _ebss;
    dst = &_sbss;

    while (dst < &_ebss) {
        *dst++ = 0;
    }

    /* 呼叫主程式 */
    main();

    /* 無限循環 */
    while (1);
}

/* 預設中斷處理函數 */
void Default_Handler(void)
{
    while (1);
}

/* 中斷向量表 */
__attribute__ ((section(".isr_vector")))
void (* const vector_table[])(void) = {
    (void (*)(void))(&_estack),
    Reset_Handler,
    /* ... 其他中斷向量 ... */
};
```

### 直接暫存器操作

```c
// GPIO 直接暫存器控制範例（STM32F4）

#define RCC_AHB1ENR     (*(volatile uint32_t *)0x40023830)
#define GPIOA_MODER     (*(volatile uint32_t *)0x40020000)
#define GPIOA_ODR       (*(volatile uint32_t *)0x40020014)

void gpio_init(void)
{
    /* 啟用 GPIOA 時鐘 */
    RCC_AHB1ENR |= (1 << 0);

    /* 設定 PA5 為輸出 */
    GPIOA_MODER &= ~(3 << 10);
    GPIOA_MODER |= (1 << 10);
}

void led_on(void)
{
    GPIOA_ODR |= (1 << 5);
}

void led_off(void)
{
    GPIOA_ODR &= ~(1 << 5);
}
```

## 🛠️ 開發工具鏈

### 編譯器
```bash
# 安裝 ARM GCC
sudo apt-get install gcc-arm-none-eabi

# 編譯
arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -o output.elf main.c

# 生成二進位檔
arm-none-eabi-objcopy -O binary output.elf output.bin
```

### 除錯
```bash
# 使用 OpenOCD + GDB
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg

# 另一個終端
arm-none-eabi-gdb output.elf
(gdb) target remote localhost:3333
(gdb) load
(gdb) continue
```

## 📚 重要概念

- **中斷向量表** - 系統啟動和中斷處理
- **記憶體映射** - Flash、RAM、外設
- **堆疊指標** - MSP 和 PSP
- **NVIC** - 嵌套向量中斷控制器
- **SysTick** - 系統滴答定時器

## 🔗 資源

- [ARM Cortex-M 文檔](https://developer.arm.com/ip-products/processors/cortex-m)
- [CMSIS 標準](https://arm-software.github.io/CMSIS_5/)

## 📄 授權

MIT License
