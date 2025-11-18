/**
 * @file mock.h
 * @brief Mock Functions for Testing
 */

#ifndef MOCK_H
#define MOCK_H

#include <stdint.h>
#include <stdbool.h>
#include <stdlib.h>

/* Mock function call tracking */
typedef struct {
    const char *function_name;
    int call_count;
    int expected_calls;
    void *return_value;
    int return_code;
    bool enabled;
} mock_function_t;

#define MAX_MOCK_FUNCTIONS 100

/* Mock system */
typedef struct {
    mock_function_t functions[MAX_MOCK_FUNCTIONS];
    int function_count;
} mock_system_t;

/* Global mock system */
extern mock_system_t g_mock_system;

/* Mock system functions */
void mock_init(void);
void mock_reset(void);
void mock_cleanup(void);

/* Mock function registration */
mock_function_t* mock_register(const char *name);
mock_function_t* mock_find(const char *name);

/* Mock function control */
void mock_set_return_value(const char *name, void *value);
void mock_set_return_code(const char *name, int code);
void mock_set_expected_calls(const char *name, int count);
void mock_enable(const char *name);
void mock_disable(const char *name);

/* Mock function tracking */
void mock_called(const char *name);
int mock_get_call_count(const char *name);
bool mock_verify_calls(const char *name);
void mock_print_report(void);

/* Hardware mock functions */
int mock_flash_read(uint32_t address, uint8_t *buffer, size_t size);
int mock_flash_write(uint32_t address, const uint8_t *buffer, size_t size);
int mock_flash_erase(uint32_t address, size_t size);

int mock_crypto_init(void);
int mock_crypto_encrypt(const uint8_t *input, size_t input_len, uint8_t *output, size_t *output_len);
int mock_crypto_decrypt(const uint8_t *input, size_t input_len, uint8_t *output, size_t *output_len);
int mock_crypto_sign(const uint8_t *data, size_t data_len, uint8_t *signature, size_t *sig_len);
int mock_crypto_verify(const uint8_t *data, size_t data_len, const uint8_t *signature, size_t sig_len);

int mock_network_send(const uint8_t *data, size_t size);
int mock_network_receive(uint8_t *data, size_t max_size);
bool mock_network_is_connected(void);

/* Macro helpers */
#define MOCK_CALL(func) mock_called(#func)
#define MOCK_RETURN(func, type) ((type)mock_find(#func)->return_value)
#define MOCK_RETURN_CODE(func) (mock_find(#func)->return_code)

#endif /* MOCK_H */
