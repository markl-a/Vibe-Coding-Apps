#!/bin/bash
#
# U-Boot Build Script
#
# Copyright (C) 2025 AI-Assisted Development Team
# SPDX-License-Identifier: GPL-2.0+
#

set -e

# Configuration
UBOOT_DIR="${UBOOT_DIR:-./u-boot}"
BOARD="${BOARD:-custom_board}"
ARCH="${ARCH:-arm}"
CROSS_COMPILE="${CROSS_COMPILE:-arm-linux-gnueabi-}"
OUTPUT_DIR="${OUTPUT_DIR:-./output}"
JOBS="${JOBS:-$(nproc)}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}  $1${NC}"
    echo -e "${GREEN}======================================${NC}"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    if ! command -v ${CROSS_COMPILE}gcc &> /dev/null; then
        print_error "Cross compiler not found: ${CROSS_COMPILE}gcc"
        exit 1
    fi

    if ! command -v dtc &> /dev/null; then
        print_error "Device tree compiler (dtc) not found"
        print_info "Install with: sudo apt-get install device-tree-compiler"
        exit 1
    fi

    if [ ! -d "$UBOOT_DIR" ]; then
        print_error "U-Boot directory not found: $UBOOT_DIR"
        exit 1
    fi

    print_success "All prerequisites met"
}

# Clean build
clean_build() {
    print_header "Cleaning Build"

    cd "$UBOOT_DIR"
    make ARCH=$ARCH CROSS_COMPILE=$CROSS_COMPILE distclean

    print_success "Clean complete"
}

# Configure U-Boot
configure_uboot() {
    print_header "Configuring U-Boot"

    cd "$UBOOT_DIR"

    print_info "Board: $BOARD"
    print_info "Architecture: $ARCH"
    print_info "Cross compiler: $CROSS_COMPILE"

    # Use board defconfig
    if [ -f "configs/${BOARD}_defconfig" ]; then
        make ARCH=$ARCH CROSS_COMPILE=$CROSS_COMPILE ${BOARD}_defconfig
    else
        print_error "Board config not found: configs/${BOARD}_defconfig"
        exit 1
    fi

    print_success "Configuration complete"
}

# Build U-Boot
build_uboot() {
    print_header "Building U-Boot"

    cd "$UBOOT_DIR"

    print_info "Building with $JOBS parallel jobs..."
    make ARCH=$ARCH CROSS_COMPILE=$CROSS_COMPILE -j$JOBS

    print_success "Build complete"
}

# Build device tree
build_dtb() {
    print_header "Building Device Tree"

    cd "$UBOOT_DIR"

    if [ -f "arch/$ARCH/dts/${BOARD}.dts" ]; then
        print_info "Compiling device tree: ${BOARD}.dts"
        make ARCH=$ARCH CROSS_COMPILE=$CROSS_COMPILE dtbs
        print_success "Device tree compiled"
    else
        print_info "No device tree found, skipping..."
    fi
}

# Copy output files
copy_outputs() {
    print_header "Copying Output Files"

    mkdir -p "$OUTPUT_DIR"

    cd "$UBOOT_DIR"

    # Copy U-Boot binary
    if [ -f "u-boot.bin" ]; then
        cp u-boot.bin "$OUTPUT_DIR/"
        print_success "Copied u-boot.bin"
    fi

    # Copy U-Boot ELF
    if [ -f "u-boot" ]; then
        cp u-boot "$OUTPUT_DIR/"
        print_success "Copied u-boot (ELF)"
    fi

    # Copy SPL if exists
    if [ -f "spl/u-boot-spl.bin" ]; then
        cp spl/u-boot-spl.bin "$OUTPUT_DIR/"
        print_success "Copied u-boot-spl.bin"
    fi

    # Copy device tree
    if [ -f "arch/$ARCH/dts/${BOARD}.dtb" ]; then
        cp "arch/$ARCH/dts/${BOARD}.dtb" "$OUTPUT_DIR/"
        print_success "Copied ${BOARD}.dtb"
    fi

    # Copy System.map
    if [ -f "System.map" ]; then
        cp System.map "$OUTPUT_DIR/"
        print_success "Copied System.map"
    fi

    print_info "Output directory: $OUTPUT_DIR"
    ls -lh "$OUTPUT_DIR"
}

# Generate build info
generate_build_info() {
    print_header "Generating Build Info"

    cat > "$OUTPUT_DIR/build-info.txt" << EOF
U-Boot Build Information
========================

Build Date:       $(date)
Board:            $BOARD
Architecture:     $ARCH
Cross Compiler:   $CROSS_COMPILE
U-Boot Version:   $(cd "$UBOOT_DIR" && make --no-print-directory version)

Build Host:       $(hostname)
Build User:       $(whoami)

Files Generated:
$(ls -lh "$OUTPUT_DIR" | tail -n +2)
EOF

    print_success "Build info generated: $OUTPUT_DIR/build-info.txt"
}

# Main execution
main() {
    print_header "U-Boot Build Script"

    # Parse arguments
    CLEAN=0
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                CLEAN=1
                shift
                ;;
            --board)
                BOARD="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --clean          Clean before build"
                echo "  --board BOARD    Specify board (default: custom_board)"
                echo "  --help           Show this help message"
                echo ""
                echo "Environment variables:"
                echo "  UBOOT_DIR        U-Boot source directory"
                echo "  ARCH             Target architecture (default: arm)"
                echo "  CROSS_COMPILE    Cross compiler prefix"
                echo "  OUTPUT_DIR       Output directory (default: ./output)"
                echo "  JOBS             Number of parallel jobs"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Execute build steps
    check_prerequisites

    if [ $CLEAN -eq 1 ]; then
        clean_build
    fi

    configure_uboot
    build_uboot
    build_dtb
    copy_outputs
    generate_build_info

    print_header "Build Complete!"
    print_success "All files are in: $OUTPUT_DIR"
}

# Run main
main "$@"
