# Firmware Development Test Suite

Complete testing framework for firmware development with unit tests, integration tests, performance benchmarks, and hardware-specific tests.

## Overview

This test suite provides comprehensive testing capabilities for embedded firmware development, including:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions and workflows
- **Performance Tests**: Benchmark critical operations
- **Hardware Tests**: Platform-specific hardware tests

## Directory Structure

```
tests/
├── test-framework/          # Core testing framework
│   ├── test_framework.h/c   # Test macros and utilities
│   ├── test_utils.h/c       # Helper functions
│   └── mock.h/c             # Mock implementations
│
├── unit-tests/              # Unit tests
│   ├── test_secure_boot.c   # Secure boot tests
│   ├── test_crypto.c        # Cryptography tests
│   ├── test_flash.c         # Flash memory tests
│   ├── test_ota.c           # OTA update tests
│   ├── Makefile             # Build system
│   └── test_all.sh          # Run all unit tests
│
├── integration-tests/       # Integration tests
│   ├── test_full_ota_flow.c        # Complete OTA flow
│   ├── test_secure_boot_chain.c    # Secure boot chain
│   ├── test_partition_update.c     # Partition management
│   └── run_integration_tests.sh    # Run integration tests
│
├── performance-tests/       # Performance benchmarks
│   ├── benchmark_crypto.c   # Crypto performance
│   ├── benchmark_flash.c    # Flash performance
│   ├── benchmark_ota.c      # OTA performance
│   └── generate_report.py   # Generate reports
│
├── hardware-tests/          # Hardware-specific tests
│   ├── test_stm32.c         # STM32 platform tests
│   ├── test_esp32.c         # ESP32 platform tests
│   └── test_nrf52.c         # nRF52 platform tests
│
├── CI/                      # CI/CD configurations
│   ├── github-actions.yml   # GitHub Actions
│   └── gitlab-ci.yml        # GitLab CI
│
├── README.md                # This file
├── run_all_tests.sh         # Run entire test suite
└── test_report.py           # Generate test reports
```

## Quick Start

### Prerequisites

- GCC compiler
- Make
- Python 3.6+

### Running All Tests

```bash
cd tests
./run_all_tests.sh
```

### Running Specific Test Suites

```bash
# Unit tests only
cd unit-tests
make test

# Integration tests only
cd integration-tests
./run_integration_tests.sh

# Performance benchmarks
cd performance-tests
make benchmark

# Hardware tests
cd hardware-tests
make test-stm32
make test-esp32
make test-nrf52
```

## Test Framework

### Basic Test Structure

```c
#include "../test-framework/test_framework.h"

static int test_example(void)
{
    TEST_CASE_START("Example Test");

    // Test assertions
    TEST_ASSERT(condition, "Error message");
    TEST_ASSERT_EQUAL(expected, actual, "Error message");
    TEST_ASSERT_NOT_NULL(ptr, "Error message");

    TEST_CASE_END();
}

int main(void)
{
    TEST_INIT();
    RUN_TEST(test_example);
    TEST_SUMMARY();
    TEST_EXIT();
}
```

### Available Assertions

- `TEST_ASSERT(condition, message)` - Assert condition is true
- `TEST_ASSERT_EQUAL(expected, actual, message)` - Assert equality
- `TEST_ASSERT_NOT_NULL(ptr, message)` - Assert pointer is not NULL
- `TEST_ASSERT_MEM_EQUAL(buf1, buf2, size, message)` - Assert memory equality
- `TEST_SKIP(reason)` - Skip test with reason

### Mock Functions

The framework provides mock implementations for hardware operations:

```c
#include "../test-framework/mock.h"

mock_init();

// Mock flash operations
mock_flash_read(address, buffer, size);
mock_flash_write(address, buffer, size);
mock_flash_erase(address, size);

// Mock crypto operations
mock_crypto_encrypt(input, input_len, output, output_len);
mock_crypto_decrypt(input, input_len, output, output_len);
mock_crypto_sign(data, data_len, signature, sig_len);
mock_crypto_verify(data, data_len, signature, sig_len);

// Mock network operations
mock_network_send(data, size);
mock_network_receive(data, max_size);
mock_network_is_connected();

mock_cleanup();
```

## Unit Tests

### Test Categories

1. **Secure Boot Tests** (`test_secure_boot.c`)
   - Boot initialization
   - Signature verification
   - Chain of trust
   - Rollback protection

2. **Cryptography Tests** (`test_crypto.c`)
   - AES encryption/decryption
   - SHA256 hashing
   - Digital signatures
   - Key derivation

3. **Flash Memory Tests** (`test_flash.c`)
   - Read/write/erase operations
   - Page boundary handling
   - Wear leveling
   - Bounds checking

4. **OTA Update Tests** (`test_ota.c`)
   - Header validation
   - Download simulation
   - CRC verification
   - Rollback capability

### Running Unit Tests

```bash
cd unit-tests
make clean
make all
./test_all.sh
```

## Integration Tests

Integration tests verify complete workflows:

1. **Full OTA Flow** - Complete OTA update process
2. **Secure Boot Chain** - Multi-stage boot verification
3. **Partition Update** - Partition management and swapping

```bash
cd integration-tests
./run_integration_tests.sh
```

## Performance Tests

Performance benchmarks measure:

- Cryptographic operation throughput
- Flash memory access speeds
- OTA update timing
- Variable data size performance

```bash
cd performance-tests
make benchmark
./generate_report.py
```

### Viewing Reports

After running benchmarks:
- `performance_report.html` - Detailed HTML report
- `performance_report.json` - Machine-readable data

## Hardware Tests

Platform-specific tests for:

### STM32 Platform
- Flash memory operations
- Secure boot features
- Dual-bank OTA
- RDP (Read Protection)
- Crypto hardware acceleration

### ESP32 Platform
- SPI flash operations
- Secure boot v2
- OTA partitions
- Flash encryption
- WiFi OTA updates
- NVS storage

### nRF52 Platform
- Flash operations
- Bootloader verification
- DFU over BLE
- SoftDevice protection
- UICR configuration
- Low power features

```bash
cd hardware-tests
gcc -I../test-framework test_stm32.c ../test-framework/*.c -o test_stm32
./test_stm32
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Firmware Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd tests
          ./run_all_tests.sh
```

### GitLab CI

```yaml
test:
  stage: test
  script:
    - cd tests
    - ./run_all_tests.sh
```

## Best Practices

1. **Write Tests First**: Follow TDD principles
2. **Keep Tests Fast**: Unit tests should run in milliseconds
3. **Use Mocks**: Isolate hardware dependencies
4. **Test Edge Cases**: Include boundary conditions
5. **Document Tests**: Clear test names and comments
6. **Automate**: Run tests in CI/CD pipelines

## Troubleshooting

### Compilation Errors

```bash
# Clean and rebuild
cd unit-tests
make clean
make all
```

### Test Failures

- Check mock initialization: `mock_init()` at test start
- Verify mock cleanup: `mock_cleanup()` at test end
- Review test output for assertion details

### Performance Issues

- Reduce iteration count in benchmarks
- Use optimized compiler flags: `-O2` or `-O3`
- Profile with: `gprof` or `valgrind`

## Contributing

When adding new tests:

1. Follow existing test structure
2. Add to appropriate test suite
3. Update Makefile and run scripts
4. Document test purpose and expected behavior
5. Ensure tests pass before committing

## License

This test suite is part of the firmware development project.

## Contact

For questions or issues, please refer to the main project documentation.

---

**Version**: 1.0
**Last Updated**: 2025-11-18
