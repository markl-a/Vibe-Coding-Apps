/**
 * @file mock.c
 * @brief Mock Functions Implementation
 */

#include "mock.h"
#include <stdio.h>
#include <string.h>

/* Global mock system */
mock_system_t g_mock_system = {0};

/**
 * @brief Initialize mock system
 */
void mock_init(void)
{
    memset(&g_mock_system, 0, sizeof(mock_system_t));
}

/**
 * @brief Reset mock system
 */
void mock_reset(void)
{
    for (int i = 0; i < g_mock_system.function_count; i++) {
        g_mock_system.functions[i].call_count = 0;
    }
}

/**
 * @brief Cleanup mock system
 */
void mock_cleanup(void)
{
    memset(&g_mock_system, 0, sizeof(mock_system_t));
}

/**
 * @brief Register a mock function
 */
mock_function_t* mock_register(const char *name)
{
    if (g_mock_system.function_count >= MAX_MOCK_FUNCTIONS) {
        return NULL;
    }

    mock_function_t *func = &g_mock_system.functions[g_mock_system.function_count++];
    func->function_name = name;
    func->call_count = 0;
    func->expected_calls = -1;
    func->return_value = NULL;
    func->return_code = 0;
    func->enabled = true;

    return func;
}

/**
 * @brief Find a mock function
 */
mock_function_t* mock_find(const char *name)
{
    for (int i = 0; i < g_mock_system.function_count; i++) {
        if (strcmp(g_mock_system.functions[i].function_name, name) == 0) {
            return &g_mock_system.functions[i];
        }
    }
    return mock_register(name);
}

/**
 * @brief Set return value for mock function
 */
void mock_set_return_value(const char *name, void *value)
{
    mock_function_t *func = mock_find(name);
    if (func) {
        func->return_value = value;
    }
}

/**
 * @brief Set return code for mock function
 */
void mock_set_return_code(const char *name, int code)
{
    mock_function_t *func = mock_find(name);
    if (func) {
        func->return_code = code;
    }
}

/**
 * @brief Set expected call count
 */
void mock_set_expected_calls(const char *name, int count)
{
    mock_function_t *func = mock_find(name);
    if (func) {
        func->expected_calls = count;
    }
}

/**
 * @brief Enable mock function
 */
void mock_enable(const char *name)
{
    mock_function_t *func = mock_find(name);
    if (func) {
        func->enabled = true;
    }
}

/**
 * @brief Disable mock function
 */
void mock_disable(const char *name)
{
    mock_function_t *func = mock_find(name);
    if (func) {
        func->enabled = false;
    }
}

/**
 * @brief Record function call
 */
void mock_called(const char *name)
{
    mock_function_t *func = mock_find(name);
    if (func && func->enabled) {
        func->call_count++;
    }
}

/**
 * @brief Get call count
 */
int mock_get_call_count(const char *name)
{
    mock_function_t *func = mock_find(name);
    return func ? func->call_count : 0;
}

/**
 * @brief Verify expected calls
 */
bool mock_verify_calls(const char *name)
{
    mock_function_t *func = mock_find(name);
    if (!func || func->expected_calls < 0) {
        return true;
    }
    return func->call_count == func->expected_calls;
}

/**
 * @brief Print mock report
 */
void mock_print_report(void)
{
    printf("\n=== Mock Function Report ===\n");
    for (int i = 0; i < g_mock_system.function_count; i++) {
        mock_function_t *func = &g_mock_system.functions[i];
        printf("Function: %s\n", func->function_name);
        printf("  Calls: %d", func->call_count);
        if (func->expected_calls >= 0) {
            printf(" (expected: %d) %s\n",
                   func->expected_calls,
                   func->call_count == func->expected_calls ? "PASS" : "FAIL");
        } else {
            printf("\n");
        }
    }
    printf("===========================\n");
}

/* Hardware mock implementations */

static uint8_t mock_flash_memory[1024 * 1024] = {0};

int mock_flash_read(uint32_t address, uint8_t *buffer, size_t size)
{
    MOCK_CALL(flash_read);
    if (address + size > sizeof(mock_flash_memory)) {
        return -1;
    }
    memcpy(buffer, &mock_flash_memory[address], size);
    return 0;
}

int mock_flash_write(uint32_t address, const uint8_t *buffer, size_t size)
{
    MOCK_CALL(flash_write);
    if (address + size > sizeof(mock_flash_memory)) {
        return -1;
    }
    memcpy(&mock_flash_memory[address], buffer, size);
    return 0;
}

int mock_flash_erase(uint32_t address, size_t size)
{
    MOCK_CALL(flash_erase);
    if (address + size > sizeof(mock_flash_memory)) {
        return -1;
    }
    memset(&mock_flash_memory[address], 0xFF, size);
    return 0;
}

int mock_crypto_init(void)
{
    MOCK_CALL(crypto_init);
    return MOCK_RETURN_CODE(crypto_init);
}

int mock_crypto_encrypt(const uint8_t *input, size_t input_len, uint8_t *output, size_t *output_len)
{
    MOCK_CALL(crypto_encrypt);
    memcpy(output, input, input_len);
    *output_len = input_len;
    return MOCK_RETURN_CODE(crypto_encrypt);
}

int mock_crypto_decrypt(const uint8_t *input, size_t input_len, uint8_t *output, size_t *output_len)
{
    MOCK_CALL(crypto_decrypt);
    memcpy(output, input, input_len);
    *output_len = input_len;
    return MOCK_RETURN_CODE(crypto_decrypt);
}

int mock_crypto_sign(const uint8_t *data, size_t data_len, uint8_t *signature, size_t *sig_len)
{
    MOCK_CALL(crypto_sign);
    memset(signature, 0xAB, 64);
    *sig_len = 64;
    return MOCK_RETURN_CODE(crypto_sign);
}

int mock_crypto_verify(const uint8_t *data, size_t data_len, const uint8_t *signature, size_t sig_len)
{
    MOCK_CALL(crypto_verify);
    return MOCK_RETURN_CODE(crypto_verify);
}

static bool mock_network_connected = true;

int mock_network_send(const uint8_t *data, size_t size)
{
    MOCK_CALL(network_send);
    return mock_network_connected ? (int)size : -1;
}

int mock_network_receive(uint8_t *data, size_t max_size)
{
    MOCK_CALL(network_receive);
    return mock_network_connected ? 0 : -1;
}

bool mock_network_is_connected(void)
{
    MOCK_CALL(network_is_connected);
    return mock_network_connected;
}
