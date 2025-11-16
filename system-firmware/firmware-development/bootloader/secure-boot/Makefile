# Secure Boot Makefile

# 工具鏈配置
PREFIX = arm-none-eabi-
CC = $(PREFIX)gcc
AS = $(PREFIX)as
LD = $(PREFIX)ld
OBJCOPY = $(PREFIX)objcopy
OBJDUMP = $(PREFIX)objdump
SIZE = $(PREFIX)size

# 目標 MCU (以 STM32F407 為例)
MCU = -mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16

# 編譯選項
CFLAGS = $(MCU) \
		 -O2 \
		 -g \
		 -Wall \
		 -Wextra \
		 -ffunction-sections \
		 -fdata-sections \
		 -I. \
		 -I./include \
		 -DSTM32F407xx \
		 -DUSE_HW_CRYPTO

# 連結選項
LDFLAGS = $(MCU) \
		  -T./linker/secure_boot.ld \
		  -Wl,--gc-sections \
		  -Wl,-Map=build/secure_boot.map \
		  --specs=nano.specs

# 源文件
SRCS = secure_boot.c \
	   crypto_verify.c

# 輸出文件
TARGET = build/secure_boot

# 規則
.PHONY: all clean dirs

all: dirs $(TARGET).elf $(TARGET).bin $(TARGET).hex
	@echo "Build complete!"
	@$(SIZE) $(TARGET).elf

dirs:
	@mkdir -p build

$(TARGET).elf: $(SRCS)
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $^

$(TARGET).bin: $(TARGET).elf
	$(OBJCOPY) -O binary $< $@

$(TARGET).hex: $(TARGET).elf
	$(OBJCOPY) -O ihex $< $@

clean:
	rm -rf build

# 燒錄規則
flash: $(TARGET).elf
	openocd -f interface/stlink.cfg -f target/stm32f4x.cfg \
		-c "program $(TARGET).elf verify reset exit"

# 除錯
debug:
	openocd -f interface/stlink.cfg -f target/stm32f4x.cfg

gdb: $(TARGET).elf
	$(PREFIX)gdb $(TARGET).elf \
		-ex "target extended-remote localhost:3333"

# 反組譯
disasm: $(TARGET).elf
	$(OBJDUMP) -d $< > build/secure_boot.asm

# 測試
test:
	@echo "Running unit tests..."
	gcc -DUNIT_TEST -I. tests/test_crypto.c crypto_verify.c -o build/test_crypto
	./build/test_crypto
