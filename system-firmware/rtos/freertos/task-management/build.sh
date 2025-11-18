#!/bin/bash
##########################################################
# FreeRTOS Task Management Build Script
# Author: AI-Assisted Development Team
# Date: 2025-11-18
##########################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="freertos_task_management"
BUILD_DIR="build"
BUILD_TYPE="Debug"  # Debug or Release

# Print header
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  FreeRTOS Task Management Builder${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Print usage
usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  make          Build using Makefile (default)"
    echo "  cmake         Build using CMake"
    echo "  clean         Clean build directory"
    echo "  flash         Flash to target (requires OpenOCD)"
    echo "  debug         Start debug session"
    echo "  size          Show memory usage"
    echo "  help          Show this help"
    echo ""
    echo "Build types:"
    echo "  DEBUG=1       Build with debug symbols (default)"
    echo "  RELEASE=1     Build optimized release version"
    echo ""
    exit 0
}

# Clean build directory
clean_build() {
    echo -e "${YELLOW}Cleaning build directory...${NC}"
    rm -rf ${BUILD_DIR}
    echo -e "${GREEN}✓ Clean complete${NC}"
}

# Build with Make
build_make() {
    echo -e "${BLUE}Building with GNU Make...${NC}"
    make -j$(nproc) all

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Build successful!${NC}"
        echo ""
        make size
    else
        echo -e "${RED}✗ Build failed!${NC}"
        exit 1
    fi
}

# Build with CMake
build_cmake() {
    echo -e "${BLUE}Building with CMake...${NC}"

    # Create build directory
    mkdir -p ${BUILD_DIR}
    cd ${BUILD_DIR}

    # Configure
    echo -e "${YELLOW}Configuring...${NC}"
    cmake -DCMAKE_BUILD_TYPE=${BUILD_TYPE} ..

    # Build
    echo -e "${YELLOW}Compiling...${NC}"
    cmake --build . -j$(nproc)

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Build successful!${NC}"
        echo ""
        cmake --build . --target size
    else
        echo -e "${RED}✗ Build failed!${NC}"
        exit 1
    fi

    cd ..
}

# Flash to target
flash_target() {
    echo -e "${BLUE}Flashing to target...${NC}"

    if [ ! -f "${BUILD_DIR}/${PROJECT_NAME}.elf" ]; then
        echo -e "${RED}✗ Firmware not found! Build first.${NC}"
        exit 1
    fi

    openocd -f interface/stlink.cfg -f target/stm32f4x.cfg \
        -c "program ${BUILD_DIR}/${PROJECT_NAME}.elf verify reset exit"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Flash complete${NC}"
    else
        echo -e "${RED}✗ Flash failed!${NC}"
        exit 1
    fi
}

# Start debug session
debug_target() {
    echo -e "${BLUE}Starting debug session...${NC}"

    if [ ! -f "${BUILD_DIR}/${PROJECT_NAME}.elf" ]; then
        echo -e "${RED}✗ Firmware not found! Build first.${NC}"
        exit 1
    fi

    # Start OpenOCD in background
    openocd -f interface/stlink.cfg -f target/stm32f4x.cfg &
    OPENOCD_PID=$!

    sleep 2

    # Start GDB
    arm-none-eabi-gdb ${BUILD_DIR}/${PROJECT_NAME}.elf \
        -ex "target extended-remote localhost:3333" \
        -ex "load" \
        -ex "monitor reset halt"

    # Kill OpenOCD when GDB exits
    kill $OPENOCD_PID
}

# Show memory usage
show_size() {
    if [ ! -f "${BUILD_DIR}/${PROJECT_NAME}.elf" ]; then
        echo -e "${RED}✗ Firmware not found! Build first.${NC}"
        exit 1
    fi

    echo -e "${BLUE}Memory Usage:${NC}"
    arm-none-eabi-size --format=berkeley ${BUILD_DIR}/${PROJECT_NAME}.elf

    echo ""
    echo -e "${BLUE}Detailed Memory Map:${NC}"
    arm-none-eabi-size -A -x ${BUILD_DIR}/${PROJECT_NAME}.elf
}

# Check build environment
check_environment() {
    echo -e "${YELLOW}Checking build environment...${NC}"

    # Check for ARM GCC
    if ! command -v arm-none-eabi-gcc &> /dev/null; then
        echo -e "${RED}✗ arm-none-eabi-gcc not found!${NC}"
        echo "Please install ARM GCC toolchain"
        exit 1
    fi

    # Check for Make or CMake
    if [ "$1" == "cmake" ]; then
        if ! command -v cmake &> /dev/null; then
            echo -e "${RED}✗ cmake not found!${NC}"
            exit 1
        fi
    else
        if ! command -v make &> /dev/null; then
            echo -e "${RED}✗ make not found!${NC}"
            exit 1
        fi
    fi

    echo -e "${GREEN}✓ Build environment OK${NC}"
    echo ""
}

# Main script
main() {
    print_header

    # Parse arguments
    BUILD_SYSTEM="make"
    ACTION="build"

    if [ $# -gt 0 ]; then
        case "$1" in
            make)
                BUILD_SYSTEM="make"
                ;;
            cmake)
                BUILD_SYSTEM="cmake"
                ;;
            clean)
                ACTION="clean"
                ;;
            flash)
                ACTION="flash"
                ;;
            debug)
                ACTION="debug"
                ;;
            size)
                ACTION="size"
                ;;
            help|--help|-h)
                usage
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                usage
                ;;
        esac
    fi

    # Handle release build
    if [ ! -z "$RELEASE" ] && [ "$RELEASE" == "1" ]; then
        BUILD_TYPE="Release"
        echo -e "${YELLOW}Building RELEASE version${NC}"
    else
        BUILD_TYPE="Debug"
        echo -e "${YELLOW}Building DEBUG version${NC}"
    fi

    # Execute action
    case "$ACTION" in
        build)
            check_environment $BUILD_SYSTEM
            if [ "$BUILD_SYSTEM" == "cmake" ]; then
                build_cmake
            else
                build_make
            fi
            ;;
        clean)
            clean_build
            ;;
        flash)
            flash_target
            ;;
        debug)
            debug_target
            ;;
        size)
            show_size
            ;;
    esac

    echo ""
    echo -e "${GREEN}Done!${NC}"
}

# Run main
main "$@"
