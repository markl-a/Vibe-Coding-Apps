#!/bin/bash

# Integration Tests Runner Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build test framework first
echo -e "${BLUE}Building test framework...${NC}"
make -C ../test-framework -f - <<'EOF'
CC = gcc
CFLAGS = -Wall -Wextra -g -std=c11

OBJS = test_framework.o test_utils.o mock.o

all: $(OBJS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f *.o
EOF

# Build integration tests
echo -e "${BLUE}Building integration tests...${NC}"
gcc -Wall -Wextra -g -std=c11 -I../test-framework \
    test_full_ota_flow.c \
    ../test-framework/test_framework.c \
    ../test-framework/test_utils.c \
    ../test-framework/mock.c \
    -o test_full_ota_flow -lm

gcc -Wall -Wextra -g -std=c11 -I../test-framework \
    test_secure_boot_chain.c \
    ../test-framework/test_framework.c \
    ../test-framework/test_utils.c \
    ../test-framework/mock.c \
    -o test_secure_boot_chain -lm

gcc -Wall -Wextra -g -std=c11 -I../test-framework \
    test_partition_update.c \
    ../test-framework/test_framework.c \
    ../test-framework/test_utils.c \
    ../test-framework/mock.c \
    -o test_partition_update -lm

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test list
TESTS=(
    "test_full_ota_flow"
    "test_secure_boot_chain"
    "test_partition_update"
)

echo ""
echo "========================================"
echo "Integration Test Suite"
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
echo "Integration Test Summary"
echo "========================================"
echo "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo "========================================"

# Cleanup
echo -e "${BLUE}Cleaning up...${NC}"
rm -f test_full_ota_flow test_secure_boot_chain test_partition_update

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}All integration tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some integration tests failed!${NC}"
    exit 1
fi
