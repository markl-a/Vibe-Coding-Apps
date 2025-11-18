##########################################################
# ARM GCC Toolchain CMake Configuration
# For ARM Cortex-M embedded development
# Author: AI-Assisted Development Team
# Date: 2025-11-18
##########################################################

set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR ARM)

# Toolchain prefix
set(TOOLCHAIN_PREFIX arm-none-eabi-)

# Compilers
set(CMAKE_C_COMPILER ${TOOLCHAIN_PREFIX}gcc)
set(CMAKE_CXX_COMPILER ${TOOLCHAIN_PREFIX}g++)
set(CMAKE_ASM_COMPILER ${TOOLCHAIN_PREFIX}gcc)
set(CMAKE_AR ${TOOLCHAIN_PREFIX}ar)
set(CMAKE_OBJCOPY ${TOOLCHAIN_PREFIX}objcopy)
set(CMAKE_OBJDUMP ${TOOLCHAIN_PREFIX}objdump)
set(CMAKE_SIZE ${TOOLCHAIN_PREFIX}size)
set(CMAKE_DEBUGGER ${TOOLCHAIN_PREFIX}gdb)

# Compiler flags
set(CMAKE_C_FLAGS_INIT "-fno-common -ffunction-sections -fdata-sections")
set(CMAKE_CXX_FLAGS_INIT "-fno-common -ffunction-sections -fdata-sections")

# Find root path for toolchain
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)

# Disable compiler checks (cross-compiling)
set(CMAKE_C_COMPILER_WORKS 1)
set(CMAKE_CXX_COMPILER_WORKS 1)

# Try compile flags
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)
