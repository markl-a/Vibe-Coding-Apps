#!/bin/bash
#
# kernel-profiler.sh - Linux Kernel Boot Performance Profiler
#
# Copyright (C) 2025 AI-Assisted Development Team
# SPDX-License-Identifier: MIT
#
# This script analyzes kernel boot performance using dmesg,
# ftrace, and other kernel profiling tools.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OUTPUT_DIR="./kernel_profile_$(date +%Y%m%d_%H%M%S)"
DMESG_LOG="${OUTPUT_DIR}/dmesg.log"
ANALYSIS_REPORT="${OUTPUT_DIR}/kernel_analysis.txt"
JSON_REPORT="${OUTPUT_DIR}/kernel_analysis.json"

# Create output directory
mkdir -p "${OUTPUT_DIR}"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Linux Kernel Boot Performance Profiler                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root (needed for some operations)
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Warning: Not running as root. Some features may not work.${NC}"
    echo ""
fi

##############################################################################
# Function: Extract boot time from dmesg
##############################################################################
analyze_dmesg() {
    echo -e "${GREEN}[1/6] Analyzing dmesg output...${NC}"

    # Save dmesg to file
    dmesg -T > "${DMESG_LOG}"

    # Extract key events with timestamps
    echo "Extracting kernel boot events..."

    cat > "${ANALYSIS_REPORT}" << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║              Kernel Boot Time Analysis                       ║
╚══════════════════════════════════════════════════════════════╝

EOF

    echo "Key Boot Events:" >> "${ANALYSIS_REPORT}"
    echo "----------------------------------------" >> "${ANALYSIS_REPORT}"

    # Parse important kernel events
    grep -E '\[[ ]*[0-9]+\.[0-9]+\]' "${DMESG_LOG}" | \
    grep -E '(Booting|ACPI|PCI|USB|SATA|mounted|Starting|systemd)' | \
    head -30 >> "${ANALYSIS_REPORT}" || true

    echo "" >> "${ANALYSIS_REPORT}"
}

##############################################################################
# Function: Analyze initcall timing
##############################################################################
analyze_initcalls() {
    echo -e "${GREEN}[2/6] Analyzing initcall timing...${NC}"

    echo "Initcall Timing (slowest first):" >> "${ANALYSIS_REPORT}"
    echo "----------------------------------------" >> "${ANALYSIS_REPORT}"

    # Extract initcall timing information
    # Format: [    0.123456] initcall function+0x0/0x100 returned 0 after 1234 usecs
    dmesg | grep -E 'initcall.*returned.*after' | \
    sed 's/.*initcall \(.*\) returned.* after \([0-9]*\) usecs/\2 \1/' | \
    sort -rn | head -20 | \
    awk '{printf "%8d us  %s\n", $1, $2}' >> "${ANALYSIS_REPORT}" || true

    echo "" >> "${ANALYSIS_REPORT}"
}

##############################################################################
# Function: Analyze device probe timing
##############################################################################
analyze_probe_timing() {
    echo -e "${GREEN}[3/6] Analyzing device probe timing...${NC}"

    echo "Device Probe Timing:" >> "${ANALYSIS_REPORT}"
    echo "----------------------------------------" >> "${ANALYSIS_REPORT}"

    # Extract device probe times
    dmesg | grep -E 'probe.*took' | \
    sed 's/.*\[\s*\([0-9.]*\)\].*took \([0-9]*\).*/\2 \1/' | \
    sort -rn | head -20 | \
    awk '{printf "%8s ms  at [%s]\n", $1, $2}' >> "${ANALYSIS_REPORT}" || true

    echo "" >> "${ANALYSIS_REPORT}"
}

##############################################################################
# Function: Analyze kernel command line
##############################################################################
analyze_cmdline() {
    echo -e "${GREEN}[4/6] Analyzing kernel command line...${NC}"

    echo "Kernel Command Line:" >> "${ANALYSIS_REPORT}"
    echo "----------------------------------------" >> "${ANALYSIS_REPORT}"

    if [ -f /proc/cmdline ]; then
        cat /proc/cmdline >> "${ANALYSIS_REPORT}"
    fi

    echo "" >> "${ANALYSIS_REPORT}"
    echo "" >> "${ANALYSIS_REPORT}"
}

##############################################################################
# Function: Check for boot optimization opportunities
##############################################################################
suggest_optimizations() {
    echo -e "${GREEN}[5/6] Generating optimization suggestions...${NC}"

    echo "╔══════════════════════════════════════════════════════════════╗" >> "${ANALYSIS_REPORT}"
    echo "║              Optimization Recommendations                    ║" >> "${ANALYSIS_REPORT}"
    echo "╚══════════════════════════════════════════════════════════════╝" >> "${ANALYSIS_REPORT}"
    echo "" >> "${ANALYSIS_REPORT}"

    # Check for slow initcalls
    SLOW_INITCALLS=$(dmesg | grep -E 'initcall.*returned.*after' | \
                     sed 's/.*after \([0-9]*\) usecs/\1/' | \
                     awk '$1 > 100000 {count++} END {print count+0}')

    if [ "${SLOW_INITCALLS}" -gt 0 ]; then
        cat >> "${ANALYSIS_REPORT}" << EOF
🔴 Found ${SLOW_INITCALLS} slow initcalls (>100ms)

   Suggestions:
   - Review kernel config and disable unnecessary drivers
   - Use asynchronous device probing (probe_type=async)
   - Consider compiling some drivers as modules for lazy loading

EOF
    fi

    # Check for synchronous probing
    if dmesg | grep -q 'synchronous probe'; then
        cat >> "${ANALYSIS_REPORT}" << 'EOF'
🟡 Synchronous device probing detected

   Suggestions:
   - Enable async probing: add "probe_type=async" to driver
   - Parallelize device initialization
   - Use deferred probe for non-critical devices

EOF
    fi

    # Check initramfs size
    if [ -f /boot/initrd.img-$(uname -r) ]; then
        INITRD_SIZE=$(stat -c%s /boot/initrd.img-$(uname -r) 2>/dev/null || echo 0)
        INITRD_SIZE_MB=$((INITRD_SIZE / 1024 / 1024))

        if [ "${INITRD_SIZE_MB}" -gt 50 ]; then
            cat >> "${ANALYSIS_REPORT}" << EOF
🟡 Large initramfs detected (${INITRD_SIZE_MB} MB)

   Suggestions:
   - Use host-only initramfs (dracut --hostonly)
   - Remove unnecessary firmware files
   - Compress with lz4 or zstd for faster decompression

EOF
        fi
    fi

    # General suggestions
    cat >> "${ANALYSIS_REPORT}" << 'EOF'
💡 General Kernel Boot Optimization Tips:

   1. Kernel Command Line:
      - quiet: Reduce console output
      - init=/usr/lib/systemd/systemd: Specify init directly
      - rootfstype=ext4: Specify filesystem type

   2. Kernel Configuration:
      - CONFIG_CC_OPTIMIZE_FOR_SIZE=n (optimize for speed)
      - CONFIG_MODULE_SIG_ALL=n (if not needed)
      - Enable kernel compression (LZ4/ZSTD)

   3. Compiler Optimizations:
      - Use LTO (Link Time Optimization)
      - Profile-Guided Optimization (PGO)
      - Use -O3 optimization level

   4. Hardware Optimizations:
      - Enable CPU frequency scaling
      - Use fastest I/O scheduler for SSD
      - Enable DMA for all devices

   5. Module Loading:
      - Load modules asynchronously
      - Use module blacklisting for unused drivers
      - Defer non-critical module loading

EOF

    echo "" >> "${ANALYSIS_REPORT}"
}

##############################################################################
# Function: Generate JSON report
##############################################################################
generate_json_report() {
    echo -e "${GREEN}[6/6] Generating JSON report...${NC}"

    # Extract total boot time
    BOOT_TIME=$(dmesg | grep -E 'Freeing unused kernel memory' | \
                tail -1 | sed 's/.*\[\s*\([0-9.]*\)\].*/\1/' || echo "0")

    # Get kernel version
    KERNEL_VERSION=$(uname -r)

    # Count initcalls
    TOTAL_INITCALLS=$(dmesg | grep -c 'initcall.*returned' || echo 0)

    # Count slow initcalls (>100ms)
    SLOW_INITCALLS=$(dmesg | grep -E 'initcall.*returned.*after' | \
                     sed 's/.*after \([0-9]*\) usecs/\1/' | \
                     awk '$1 > 100000 {count++} END {print count+0}')

    cat > "${JSON_REPORT}" << EOF
{
  "kernel_boot_analysis": {
    "timestamp": "$(date -Iseconds)",
    "kernel_version": "${KERNEL_VERSION}",
    "boot_time_seconds": ${BOOT_TIME},
    "statistics": {
      "total_initcalls": ${TOTAL_INITCALLS},
      "slow_initcalls": ${SLOW_INITCALLS}
    },
    "files": {
      "dmesg_log": "${DMESG_LOG}",
      "analysis_report": "${ANALYSIS_REPORT}"
    }
  }
}
EOF

    echo "JSON report generated: ${JSON_REPORT}"
}

##############################################################################
# Main execution
##############################################################################
main() {
    echo -e "Output directory: ${BLUE}${OUTPUT_DIR}${NC}"
    echo ""

    # Run all analysis steps
    analyze_dmesg
    analyze_initcalls
    analyze_probe_timing
    analyze_cmdline
    suggest_optimizations
    generate_json_report

    echo ""
    echo -e "${GREEN}✅ Analysis complete!${NC}"
    echo ""
    echo "Reports generated:"
    echo "  - Text report: ${ANALYSIS_REPORT}"
    echo "  - JSON report: ${JSON_REPORT}"
    echo "  - dmesg log:   ${DMESG_LOG}"
    echo ""
    echo "To view the report:"
    echo "  cat ${ANALYSIS_REPORT}"
    echo ""
}

# Run main function
main
