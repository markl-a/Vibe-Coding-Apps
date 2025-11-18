##########################################################
# FreeRTOS Task Management - Makefile
# Target: STM32F4 Discovery Board (STM32F407VG)
# Author: AI-Assisted Development Team
# Date: 2025-11-18
##########################################################

# Project name
PROJECT = freertos_task_management

# Target MCU
MCU = STM32F407xx
CPU = -mcpu=cortex-m4
FPU = -mfpu=fpv4-sp-d16
FLOAT-ABI = -mfloat-abi=hard

# Build directory
BUILD_DIR = build

# Toolchain
PREFIX = arm-none-eabi-
CC = $(PREFIX)gcc
AS = $(PREFIX)gcc -x assembler-with-cpp
CP = $(PREFIX)objcopy
SZ = $(PREFIX)size
HEX = $(CP) -O ihex
BIN = $(CP) -O binary -S

##########################################################
# Source Files
##########################################################

# C sources
C_SOURCES = \
src/main.c \
src/stm32f4xx_it.c \
src/stm32f4xx_hal_msp.c \
src/system_stm32f4xx.c \
src/syscalls.c

# FreeRTOS sources (adjust paths according to your FreeRTOS installation)
FREERTOS_DIR = ../../third_party/FreeRTOS
FREERTOS_SOURCES = \
$(FREERTOS_DIR)/Source/tasks.c \
$(FREERTOS_DIR)/Source/queue.c \
$(FREERTOS_DIR)/Source/list.c \
$(FREERTOS_DIR)/Source/timers.c \
$(FREERTOS_DIR)/Source/event_groups.c \
$(FREERTOS_DIR)/Source/stream_buffer.c \
$(FREERTOS_DIR)/Source/portable/GCC/ARM_CM4F/port.c \
$(FREERTOS_DIR)/Source/portable/MemMang/heap_4.c

# HAL sources (adjust paths according to your HAL installation)
HAL_DIR = ../../third_party/STM32F4xx_HAL_Driver
HAL_SOURCES = \
$(HAL_DIR)/Src/stm32f4xx_hal.c \
$(HAL_DIR)/Src/stm32f4xx_hal_cortex.c \
$(HAL_DIR)/Src/stm32f4xx_hal_rcc.c \
$(HAL_DIR)/Src/stm32f4xx_hal_gpio.c \
$(HAL_DIR)/Src/stm32f4xx_hal_uart.c \
$(HAL_DIR)/Src/stm32f4xx_hal_tim.c \
$(HAL_DIR)/Src/stm32f4xx_hal_pwr.c \
$(HAL_DIR)/Src/stm32f4xx_hal_dma.c

# ASM sources
ASM_SOURCES = startup_stm32f407xx.s

##########################################################
# Include Directories
##########################################################

C_INCLUDES = \
-Iinclude \
-I$(FREERTOS_DIR)/Source/include \
-I$(FREERTOS_DIR)/Source/portable/GCC/ARM_CM4F \
-I$(HAL_DIR)/Inc \
-I$(HAL_DIR)/Inc/Legacy \
-ICMSIS/Device/ST/STM32F4xx/Include \
-ICMSIS/Include

##########################################################
# Compiler Flags
##########################################################

# Macros
C_DEFS = \
-D$(MCU) \
-DUSE_HAL_DRIVER \
-DUSE_FULL_ASSERT \
-DDEBUG

# Optimization
OPT = -Og

# C Flags
CFLAGS = $(CPU) $(FPU) $(FLOAT-ABI) $(C_DEFS) $(C_INCLUDES) $(OPT)
CFLAGS += -Wall -Wextra -Werror -fdata-sections -ffunction-sections -g -gdwarf-2
CFLAGS += -MMD -MP

# Generate dependency information
CFLAGS += -MF"$(@:%.o=%.d)"

##########################################################
# Linker Flags
##########################################################

# Linker script
LDSCRIPT = STM32F407VGTx_FLASH.ld

# Libraries
LIBS = -lc -lm -lnosys
LIBDIR =

LDFLAGS = $(CPU) $(FPU) $(FLOAT-ABI) -specs=nano.specs -T$(LDSCRIPT) $(LIBDIR) $(LIBS)
LDFLAGS += -Wl,-Map=$(BUILD_DIR)/$(PROJECT).map,--cref -Wl,--gc-sections

##########################################################
# Build Targets
##########################################################

# Default target
all: $(BUILD_DIR)/$(PROJECT).elf $(BUILD_DIR)/$(PROJECT).hex $(BUILD_DIR)/$(PROJECT).bin

# List of objects
OBJECTS = $(addprefix $(BUILD_DIR)/,$(notdir $(C_SOURCES:.c=.o)))
vpath %.c $(sort $(dir $(C_SOURCES)))

# List of FreeRTOS objects
FREERTOS_OBJECTS = $(addprefix $(BUILD_DIR)/,$(notdir $(FREERTOS_SOURCES:.c=.o)))
vpath %.c $(sort $(dir $(FREERTOS_SOURCES)))

# List of HAL objects
HAL_OBJECTS = $(addprefix $(BUILD_DIR)/,$(notdir $(HAL_SOURCES:.c=.o)))
vpath %.c $(sort $(dir $(HAL_SOURCES)))

# List of ASM objects
ASM_OBJECTS = $(addprefix $(BUILD_DIR)/,$(notdir $(ASM_SOURCES:.s=.o)))
vpath %.s $(sort $(dir $(ASM_SOURCES)))

# Build object files
$(BUILD_DIR)/%.o: %.c Makefile | $(BUILD_DIR)
	@echo "Compiling: $<"
	$(CC) -c $(CFLAGS) -Wa,-a,-ad,-alms=$(BUILD_DIR)/$(notdir $(<:.c=.lst)) $< -o $@

$(BUILD_DIR)/%.o: %.s Makefile | $(BUILD_DIR)
	@echo "Assembling: $<"
	$(AS) -c $(CFLAGS) $< -o $@

# Build ELF
$(BUILD_DIR)/$(PROJECT).elf: $(OBJECTS) $(FREERTOS_OBJECTS) $(HAL_OBJECTS) $(ASM_OBJECTS) Makefile
	@echo "Linking: $@"
	$(CC) $(OBJECTS) $(FREERTOS_OBJECTS) $(HAL_OBJECTS) $(ASM_OBJECTS) $(LDFLAGS) -o $@
	$(SZ) $@

# Build HEX
$(BUILD_DIR)/%.hex: $(BUILD_DIR)/%.elf | $(BUILD_DIR)
	@echo "Creating HEX: $@"
	$(HEX) $< $@

# Build BIN
$(BUILD_DIR)/%.bin: $(BUILD_DIR)/%.elf | $(BUILD_DIR)
	@echo "Creating BIN: $@"
	$(BIN) $< $@

# Create build directory
$(BUILD_DIR):
	mkdir -p $@

##########################################################
# Utility Targets
##########################################################

# Clean build files
clean:
	-rm -fR $(BUILD_DIR)

# Flash to target
flash: all
	openocd -f interface/stlink.cfg -f target/stm32f4x.cfg \
		-c "program $(BUILD_DIR)/$(PROJECT).elf verify reset exit"

# Debug with GDB
debug:
	openocd -f interface/stlink.cfg -f target/stm32f4x.cfg &
	$(PREFIX)gdb $(BUILD_DIR)/$(PROJECT).elf \
		-ex "target extended-remote localhost:3333" \
		-ex "load" \
		-ex "monitor reset halt"

# Size analysis
size: all
	@echo ""
	@echo "=== Memory Usage ==="
	$(SZ) --format=berkeley $(BUILD_DIR)/$(PROJECT).elf

# Disassemble
disasm: all
	$(PREFIX)objdump -d $(BUILD_DIR)/$(PROJECT).elf > $(BUILD_DIR)/$(PROJECT).dis

# Help
help:
	@echo "Available targets:"
	@echo "  all     - Build project (default)"
	@echo "  clean   - Remove build files"
	@echo "  flash   - Flash to target using OpenOCD"
	@echo "  debug   - Start OpenOCD and GDB debug session"
	@echo "  size    - Show memory usage"
	@echo "  disasm  - Generate disassembly listing"
	@echo "  help    - Show this help"

# Include dependencies
-include $(wildcard $(BUILD_DIR)/*.d)

.PHONY: all clean flash debug size disasm help
