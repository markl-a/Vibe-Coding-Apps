#!/bin/bash

# Complete Test Suite Runner
# Runs all tests: unit, integration, performance, and hardware tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

# Print banner
print_banner() {
    echo -e "${CYAN}"
    echo "========================================"
    echo "  Firmware Development Test Suite"
    echo "========================================"
    echo -e "${NC}"
    echo "Date: $(date)"
    echo "Platform: $(uname -s) $(uname -m)"
    echo ""
}

# Print section header
print_section() {
    echo ""
    echo -e "${MAGENTA}========================================"
    echo "  $1"
    echo -e "========================================${NC}"
    echo ""
}

# Run test suite
run_suite() {
    local name=$1
    local script=$2

    TOTAL_SUITES=$((TOTAL_SUITES + 1))

    echo -e "${BLUE}Running: $name${NC}"

    if bash "$script"; then
        echo -e "${GREEN}✓ $name PASSED${NC}"
        PASSED_SUITES=$((PASSED_SUITES + 1))
        return 0
    else
        echo -e "${RED}✗ $name FAILED${NC}"
        FAILED_SUITES=$((FAILED_SUITES + 1))
        return 1
    fi
}

# Build test framework
build_framework() {
    print_section "Building Test Framework"

    cd test-framework

    gcc -Wall -Wextra -g -std=c11 -c test_framework.c -o test_framework.o
    gcc -Wall -Wextra -g -std=c11 -c test_utils.c -o test_utils.o
    gcc -Wall -Wextra -g -std=c11 -c mock.c -o mock.o

    echo -e "${GREEN}Test framework built successfully${NC}"

    cd ..
}

# Clean all builds
clean_all() {
    print_section "Cleaning Previous Builds"

    find . -name "*.o" -delete
    find . -name "test_*" -type f -executable -delete
    find . -name "benchmark_*" -type f -executable -delete

    echo -e "${GREEN}Clean complete${NC}"
}

# Print summary
print_summary() {
    echo ""
    echo -e "${CYAN}========================================"
    echo "  Test Suite Summary"
    echo -e "========================================${NC}"
    echo "Total Test Suites: $TOTAL_SUITES"
    echo -e "${GREEN}Passed:            $PASSED_SUITES${NC}"
    echo -e "${RED}Failed:            $FAILED_SUITES${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""

    if [ $FAILED_SUITES -eq 0 ]; then
        echo -e "${GREEN}SUCCESS: All test suites passed!${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}FAILURE: $FAILED_SUITES test suite(s) failed!${NC}"
        echo ""
        return 1
    fi
}

# Main execution
main() {
    print_banner

    # Clean previous builds
    clean_all

    # Build test framework
    build_framework

    # Run unit tests
    print_section "Unit Tests"
    if [ -f "unit-tests/test_all.sh" ]; then
        run_suite "Unit Tests" "unit-tests/test_all.sh"
    else
        echo -e "${YELLOW}Unit tests not found, skipping...${NC}"
    fi

    # Run integration tests
    print_section "Integration Tests"
    if [ -f "integration-tests/run_integration_tests.sh" ]; then
        run_suite "Integration Tests" "integration-tests/run_integration_tests.sh"
    else
        echo -e "${YELLOW}Integration tests not found, skipping...${NC}"
    fi

    # Run performance tests
    print_section "Performance Tests"
    if [ -d "performance-tests" ]; then
        echo -e "${BLUE}Building performance benchmarks...${NC}"

        cd performance-tests

        gcc -Wall -Wextra -g -std=c11 -I../test-framework \
            benchmark_crypto.c \
            ../test-framework/test_framework.c \
            ../test-framework/test_utils.c \
            ../test-framework/mock.c \
            -o benchmark_crypto -lm

        gcc -Wall -Wextra -g -std=c11 -I../test-framework \
            benchmark_flash.c \
            ../test-framework/test_framework.c \
            ../test-framework/test_utils.c \
            ../test-framework/mock.c \
            -o benchmark_flash -lm

        gcc -Wall -Wextra -g -std=c11 -I../test-framework \
            benchmark_ota.c \
            ../test-framework/test_framework.c \
            ../test-framework/test_utils.c \
            ../test-framework/mock.c \
            -o benchmark_ota -lm

        TOTAL_SUITES=$((TOTAL_SUITES + 1))

        if ./benchmark_crypto && ./benchmark_flash && ./benchmark_ota; then
            echo -e "${GREEN}✓ Performance Tests PASSED${NC}"
            PASSED_SUITES=$((PASSED_SUITES + 1))
        else
            echo -e "${RED}✗ Performance Tests FAILED${NC}"
            FAILED_SUITES=$((FAILED_SUITES + 1))
        fi

        cd ..
    else
        echo -e "${YELLOW}Performance tests not found, skipping...${NC}"
    fi

    # Run hardware tests
    print_section "Hardware Tests"
    if [ -d "hardware-tests" ]; then
        echo -e "${BLUE}Building hardware tests...${NC}"

        cd hardware-tests

        gcc -Wall -Wextra -g -std=c11 -I../test-framework \
            test_stm32.c \
            ../test-framework/test_framework.c \
            ../test-framework/test_utils.c \
            ../test-framework/mock.c \
            -o test_stm32 -lm

        gcc -Wall -Wextra -g -std=c11 -I../test-framework \
            test_esp32.c \
            ../test-framework/test_framework.c \
            ../test-framework/test_utils.c \
            ../test-framework/mock.c \
            -o test_esp32 -lm

        gcc -Wall -Wextra -g -std=c11 -I../test-framework \
            test_nrf52.c \
            ../test-framework/test_framework.c \
            ../test-framework/test_utils.c \
            ../test-framework/mock.c \
            -o test_nrf52 -lm

        TOTAL_SUITES=$((TOTAL_SUITES + 1))

        if ./test_stm32 && ./test_esp32 && ./test_nrf52; then
            echo -e "${GREEN}✓ Hardware Tests PASSED${NC}"
            PASSED_SUITES=$((PASSED_SUITES + 1))
        else
            echo -e "${RED}✗ Hardware Tests FAILED${NC}"
            FAILED_SUITES=$((FAILED_SUITES + 1))
        fi

        cd ..
    else
        echo -e "${YELLOW}Hardware tests not found, skipping...${NC}"
    fi

    # Print final summary
    print_summary

    # Return exit code
    if [ $FAILED_SUITES -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main
main
