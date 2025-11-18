##########################################################
# FreeRTOS Task Management - CMakeLists.txt
# Target: STM32F4 Discovery Board (STM32F407VG)
# Author: AI-Assisted Development Team
# Date: 2025-11-18
##########################################################

cmake_minimum_required(VERSION 3.15)

# Set toolchain
set(CMAKE_TOOLCHAIN_FILE "${CMAKE_CURRENT_SOURCE_DIR}/cmake/arm-none-eabi-gcc.cmake")

# Project name and languages
project(freertos_task_management C ASM)

# Set C standard
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Export compile commands for IDE support
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

##########################################################
# MCU Configuration
##########################################################

set(MCU_FAMILY STM32F4xx)
set(MCU_MODEL STM32F407xx)
set(CPU_TYPE cortex-m4)
set(FPU_TYPE fpv4-sp-d16)
set(FLOAT_ABI hard)

##########################################################
# Build Configuration
##########################################################

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Debug)
endif()

# Compiler options
set(MCU_FLAGS
    -mcpu=${CPU_TYPE}
    -mthumb
    -mfpu=${FPU_TYPE}
    -mfloat-abi=${FLOAT_ABI}
)

set(COMMON_FLAGS
    ${MCU_FLAGS}
    -Wall
    -Wextra
    -Wpedantic
    -fdata-sections
    -ffunction-sections
)

set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${COMMON_FLAGS}")
set(CMAKE_ASM_FLAGS "${CMAKE_ASM_FLAGS} ${MCU_FLAGS}")

# Debug flags
set(CMAKE_C_FLAGS_DEBUG "-Og -g -gdwarf-2")
# Release flags
set(CMAKE_C_FLAGS_RELEASE "-O2 -DNDEBUG")

##########################################################
# Linker Configuration
##########################################################

set(LINKER_SCRIPT "${CMAKE_CURRENT_SOURCE_DIR}/STM32F407VGTx_FLASH.ld")

set(CMAKE_EXE_LINKER_FLAGS
    "${CMAKE_EXE_LINKER_FLAGS} \
    ${MCU_FLAGS} \
    -specs=nano.specs \
    -T${LINKER_SCRIPT} \
    -Wl,-Map=${PROJECT_NAME}.map,--cref \
    -Wl,--gc-sections \
    -Wl,--print-memory-usage"
)

##########################################################
# Project Sources
##########################################################

# Main application sources
set(APP_SOURCES
    src/main.c
    src/stm32f4xx_it.c
    src/stm32f4xx_hal_msp.c
    src/system_stm32f4xx.c
    src/syscalls.c
)

# Startup file
set(STARTUP_SOURCE startup_stm32f407xx.s)

# FreeRTOS configuration
set(FREERTOS_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../third_party/FreeRTOS")

# FreeRTOS sources
set(FREERTOS_SOURCES
    ${FREERTOS_DIR}/Source/tasks.c
    ${FREERTOS_DIR}/Source/queue.c
    ${FREERTOS_DIR}/Source/list.c
    ${FREERTOS_DIR}/Source/timers.c
    ${FREERTOS_DIR}/Source/event_groups.c
    ${FREERTOS_DIR}/Source/stream_buffer.c
    ${FREERTOS_DIR}/Source/portable/GCC/ARM_CM4F/port.c
    ${FREERTOS_DIR}/Source/portable/MemMang/heap_4.c
)

# HAL configuration
set(HAL_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../third_party/STM32F4xx_HAL_Driver")

# HAL sources
set(HAL_SOURCES
    ${HAL_DIR}/Src/stm32f4xx_hal.c
    ${HAL_DIR}/Src/stm32f4xx_hal_cortex.c
    ${HAL_DIR}/Src/stm32f4xx_hal_rcc.c
    ${HAL_DIR}/Src/stm32f4xx_hal_gpio.c
    ${HAL_DIR}/Src/stm32f4xx_hal_uart.c
    ${HAL_DIR}/Src/stm32f4xx_hal_tim.c
    ${HAL_DIR}/Src/stm32f4xx_hal_pwr.c
    ${HAL_DIR}/Src/stm32f4xx_hal_dma.c
)

##########################################################
# Include Directories
##########################################################

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${FREERTOS_DIR}/Source/include
    ${FREERTOS_DIR}/Source/portable/GCC/ARM_CM4F
    ${HAL_DIR}/Inc
    ${HAL_DIR}/Inc/Legacy
    ${CMAKE_CURRENT_SOURCE_DIR}/CMSIS/Device/ST/${MCU_FAMILY}/Include
    ${CMAKE_CURRENT_SOURCE_DIR}/CMSIS/Include
)

##########################################################
# Compiler Definitions
##########################################################

add_definitions(
    -D${MCU_MODEL}
    -DUSE_HAL_DRIVER
    -DUSE_FULL_ASSERT
)

##########################################################
# Build Targets
##########################################################

# Create executable
add_executable(${PROJECT_NAME}.elf
    ${APP_SOURCES}
    ${FREERTOS_SOURCES}
    ${HAL_SOURCES}
    ${STARTUP_SOURCE}
)

# Generate additional binary formats
add_custom_command(TARGET ${PROJECT_NAME}.elf POST_BUILD
    COMMAND ${CMAKE_OBJCOPY} -O ihex $<TARGET_FILE:${PROJECT_NAME}.elf> ${PROJECT_NAME}.hex
    COMMAND ${CMAKE_OBJCOPY} -O binary $<TARGET_FILE:${PROJECT_NAME}.elf> ${PROJECT_NAME}.bin
    COMMAND ${CMAKE_SIZE} --format=berkeley $<TARGET_FILE:${PROJECT_NAME}.elf>
    COMMENT "Building HEX and BIN files"
)

##########################################################
# Custom Targets
##########################################################

# Flash target
add_custom_target(flash
    COMMAND openocd -f interface/stlink.cfg -f target/stm32f4x.cfg
        -c "program ${PROJECT_NAME}.elf verify reset exit"
    DEPENDS ${PROJECT_NAME}.elf
    COMMENT "Flashing target hardware"
)

# Size analysis
add_custom_target(size
    COMMAND ${CMAKE_SIZE} --format=berkeley $<TARGET_FILE:${PROJECT_NAME}.elf>
    DEPENDS ${PROJECT_NAME}.elf
    COMMENT "Memory usage analysis"
)

# Disassembly
add_custom_target(disasm
    COMMAND ${CMAKE_OBJDUMP} -d $<TARGET_FILE:${PROJECT_NAME}.elf> > ${PROJECT_NAME}.dis
    DEPENDS ${PROJECT_NAME}.elf
    COMMENT "Generating disassembly"
)

# Clean all
add_custom_target(clean-all
    COMMAND ${CMAKE_BUILD_TOOL} clean
    COMMAND ${CMAKE_COMMAND} -E remove ${PROJECT_NAME}.hex ${PROJECT_NAME}.bin ${PROJECT_NAME}.map ${PROJECT_NAME}.dis
    COMMENT "Cleaning all build artifacts"
)
