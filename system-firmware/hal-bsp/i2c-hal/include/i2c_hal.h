/**
 * @file i2c_hal.h
 * @brief I2C Hardware Abstraction Layer Interface
 * @version 1.0.0
 */

#ifndef I2C_HAL_H
#define I2C_HAL_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

/* I2C 模式 */
typedef enum {
    I2C_MODE_MASTER = 0,
    I2C_MODE_SLAVE
} i2c_mode_t;

/* I2C 地址模式 */
typedef enum {
    I2C_ADDR_7BIT = 0,
    I2C_ADDR_10BIT
} i2c_addr_mode_t;

/* I2C 速度 */
#define I2C_SPEED_STANDARD  100000   // 100kHz
#define I2C_SPEED_FAST      400000   // 400kHz
#define I2C_SPEED_FAST_PLUS 1000000  // 1MHz
#define I2C_SPEED_HIGH      3400000  // 3.4MHz

/* I2C 配置 */
typedef struct {
    i2c_mode_t mode;
    uint32_t clock_speed;
    i2c_addr_mode_t address_mode;
    uint16_t own_address;
} i2c_config_t;

/* I2C 句柄 */
typedef void* i2c_handle_t;

/* API 函數 */
i2c_handle_t i2c_init(uint8_t i2c_num, const i2c_config_t *config);
int i2c_deinit(i2c_handle_t handle);
int i2c_master_write(i2c_handle_t handle, uint16_t dev_addr, const uint8_t *data, size_t len);
int i2c_master_read(i2c_handle_t handle, uint16_t dev_addr, uint8_t *data, size_t len);
int i2c_mem_write(i2c_handle_t handle, uint16_t dev_addr, uint16_t mem_addr, const uint8_t *data, size_t len);
int i2c_mem_read(i2c_handle_t handle, uint16_t dev_addr, uint16_t mem_addr, uint8_t *data, size_t len);
int i2c_scan(i2c_handle_t handle, uint16_t *devices, size_t max_devices);

#ifdef __cplusplus
}
#endif

#endif /* I2C_HAL_H */
