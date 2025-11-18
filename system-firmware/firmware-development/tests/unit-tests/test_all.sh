#!/bin/bash

# Unit Tests Runner Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test list
TESTS=(
    "test_secure_boot"
    "test_crypto"
    "test_flash"
    "test_ota"
)

echo "========================================"
echo "Unit Test Suite"
echo "========================================"
echo ""

# Run each test
for test in "${TESTS[@]}"; do
    if [ -x "./$test" ]; then
        echo -e "${BLUE}Running: $test${NC}"
        TOTAL_TESTS=$((TOTAL_TESTS + 1))

        if ./"$test"; then
            echo -e "${GREEN}✓ $test PASSED${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}✗ $test FAILED${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        echo ""
    else
        echo -e "${YELLOW}Warning: $test not found or not executable${NC}"
        echo ""
    fi
done

# Summary
echo "========================================"
echo "Unit Test Summary"
echo "========================================"
echo "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo "========================================"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}All unit tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some unit tests failed!${NC}"
    exit 1
fi
