/**
 * @file i2c_hal_stm32.c
 * @brief I2C HAL implementation for STM32F4xx
 * @version 1.0.0
 * @date 2025-11-18
 *
 * STM32F4 平台的 I2C HAL 實作
 * 支援主機模式、從機模式、記憶體讀寫和裝置掃描
 */

#include "i2c_hal.h"

#ifdef STM32F4

#include "stm32f4xx_hal.h"
#include <string.h>

/* ========== 私有定義 ========== */

#define MAX_I2C_INSTANCES  3    /**< STM32F4 最多支援 3 個 I2C */
#define I2C_TIMEOUT        1000  /**< 預設超時時間 (ms) */

/**
 * @brief I2C 內部上下文結構
 */
typedef struct {
    I2C_HandleTypeDef hi2c;     /**< STM32 HAL I2C 句柄 */
    uint8_t i2c_num;            /**< I2C 編號 */
    bool initialized;           /**< 初始化標誌 */
} i2c_context_t;

/* ========== 私有變數 ========== */

static i2c_context_t i2c_contexts[MAX_I2C_INSTANCES] = {0};

/* ========== 私有函數聲明 ========== */

static I2C_TypeDef* i2c_get_instance(uint8_t i2c_num);
static void i2c_enable_clock(uint8_t i2c_num);
static i2c_context_t* i2c_get_context(i2c_handle_t handle);
static uint32_t i2c_convert_speed(uint32_t speed);

/* ========== API 實作 ========== */

/**
 * @brief 初始化 I2C
 */
i2c_handle_t i2c_init(uint8_t i2c_num, const i2c_config_t *config)
{
    if (i2c_num == 0 || i2c_num > MAX_I2C_INSTANCES || config == NULL) {
        return NULL;
    }

    i2c_context_t *ctx = &i2c_contexts[i2c_num - 1];

    /* 檢查是否已初始化 */
    if (ctx->initialized) {
        return NULL;
    }

    /* 儲存配置 */
    ctx->i2c_num = i2c_num;

    /* 啟用時鐘 */
    i2c_enable_clock(i2c_num);

    /* 配置 I2C */
    ctx->hi2c.Instance = i2c_get_instance(i2c_num);
    ctx->hi2c.Init.ClockSpeed = config->clock_speed;
    ctx->hi2c.Init.DutyCycle = I2C_DUTYCYCLE_2;

    /* 地址模式 */
    ctx->hi2c.Init.AddressingMode = (config->address_mode == I2C_ADDR_10BIT) ?
                                     I2C_ADDRESSINGMODE_10BIT :
                                     I2C_ADDRESSINGMODE_7BIT;

    /* 從機地址（僅從機模式使用）*/
    ctx->hi2c.Init.OwnAddress1 = config->own_address << 1;  /* 左移1位 */
    ctx->hi2c.Init.OwnAddress2 = 0;

    /* 其他配置 */
    ctx->hi2c.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
    ctx->hi2c.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
    ctx->hi2c.Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;

    /* 初始化 I2C */
    if (HAL_I2C_Init(&ctx->hi2c) != HAL_OK) {
        return NULL;
    }

    ctx->initialized = true;

    return (i2c_handle_t)ctx;
}

/**
 * @brief 解初始化 I2C
 */
int i2c_deinit(i2c_handle_t handle)
{
    i2c_context_t *ctx = i2c_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    HAL_I2C_DeInit(&ctx->hi2c);

    ctx->initialized = false;

    return 0;
}

/**
 * @brief 主機模式寫入數據
 */
int i2c_master_write(i2c_handle_t handle, uint16_t dev_addr,
                     const uint8_t *data, size_t len)
{
    i2c_context_t *ctx = i2c_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    /* 7位地址左移1位 */
    uint16_t addr = dev_addr << 1;

    HAL_StatusTypeDef status = HAL_I2C_Master_Transmit(&ctx->hi2c, addr,
                                                        (uint8_t *)data, len,
                                                        I2C_TIMEOUT);

    return (status == HAL_OK) ? (int)len : -1;
}

/**
 * @brief 主機模式讀取數據
 */
int i2c_master_read(i2c_handle_t handle, uint16_t dev_addr,
                    uint8_t *data, size_t len)
{
    i2c_context_t *ctx = i2c_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    /* 7位地址左移1位 */
    uint16_t addr = dev_addr << 1;

    HAL_StatusTypeDef status = HAL_I2C_Master_Receive(&ctx->hi2c, addr,
                                                       data, len,
                                                       I2C_TIMEOUT);

    return (status == HAL_OK) ? (int)len : -1;
}

/**
 * @brief 記憶體寫入（EEPROM等）
 */
int i2c_mem_write(i2c_handle_t handle, uint16_t dev_addr,
                  uint16_t mem_addr, const uint8_t *data, size_t len)
{
    i2c_context_t *ctx = i2c_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    /* 7位地址左移1位 */
    uint16_t addr = dev_addr << 1;

    /* 判斷記憶體地址大小 */
    uint16_t mem_addr_size = (mem_addr > 0xFF) ?
                             I2C_MEMADD_SIZE_16BIT : I2C_MEMADD_SIZE_8BIT;

    HAL_StatusTypeDef status = HAL_I2C_Mem_Write(&ctx->hi2c, addr, mem_addr,
                                                  mem_addr_size,
                                                  (uint8_t *)data, len,
                                                  I2C_TIMEOUT);

    return (status == HAL_OK) ? (int)len : -1;
}

/**
 * @brief 記憶體讀取（EEPROM等）
 */
int i2c_mem_read(i2c_handle_t handle, uint16_t dev_addr,
                 uint16_t mem_addr, uint8_t *data, size_t len)
{
    i2c_context_t *ctx = i2c_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    /* 7位地址左移1位 */
    uint16_t addr = dev_addr << 1;

    /* 判斷記憶體地址大小 */
    uint16_t mem_addr_size = (mem_addr > 0xFF) ?
                             I2C_MEMADD_SIZE_16BIT : I2C_MEMADD_SIZE_8BIT;

    HAL_StatusTypeDef status = HAL_I2C_Mem_Read(&ctx->hi2c, addr, mem_addr,
                                                 mem_addr_size,
                                                 data, len,
                                                 I2C_TIMEOUT);

    return (status == HAL_OK) ? (int)len : -1;
}

/**
 * @brief 掃描 I2C 總線上的裝置
 */
int i2c_scan(i2c_handle_t handle, uint16_t *devices, size_t max_devices)
{
    i2c_context_t *ctx = i2c_get_context(handle);

    if (ctx == NULL || !ctx->initialized || devices == NULL || max_devices == 0) {
        return -1;
    }

    int count = 0;

    /* 掃描 7 位地址範圍 (0x03 到 0x77) */
    for (uint16_t addr = 0x03; addr <= 0x77 && count < max_devices; addr++) {
        /* 檢查裝置是否存在 */
        HAL_StatusTypeDef status = HAL_I2C_IsDeviceReady(&ctx->hi2c,
                                                          addr << 1,
                                                          3,  /* 重試次數 */
                                                          10); /* 超時 */

        if (status == HAL_OK) {
            devices[count++] = addr;
        }
    }

    return count;
}

/* ========== 進階 API ========== */

/**
 * @brief 主機模式寫入-讀取組合操作
 */
int i2c_write_read(i2c_handle_t handle, uint16_t dev_addr,
                   const uint8_t *write_data, size_t write_len,
                   uint8_t *read_data, size_t read_len)
{
    i2c_context_t *ctx = i2c_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }

    if (write_data == NULL || write_len == 0) {
        return -1;
    }

    if (read_data == NULL || read_len == 0) {
        return -1;
    }

    uint16_t addr = dev_addr << 1;

    /* 先寫入 */
    HAL_StatusTypeDef status = HAL_I2C_Master_Transmit(&ctx->hi2c, addr,
                                                        (uint8_t *)write_data,
                                                        write_len,
                                                        I2C_TIMEOUT);

    if (status != HAL_OK) {
        return -1;
    }

    /* 再讀取 */
    status = HAL_I2C_Master_Receive(&ctx->hi2c, addr,
                                     read_data, read_len,
                                     I2C_TIMEOUT);

    return (status == HAL_OK) ? (int)read_len : -1;
}

/**
 * @brief 檢查裝置是否就緒
 */
bool i2c_is_device_ready(i2c_handle_t handle, uint16_t dev_addr)
{
    i2c_context_t *ctx = i2c_get_context(handle);

    if (ctx == NULL || !ctx->initialized) {
        return false;
    }

    uint16_t addr = dev_addr << 1;

    HAL_StatusTypeDef status = HAL_I2C_IsDeviceReady(&ctx->hi2c, addr, 3, 10);

    return (status == HAL_OK);
}

/**
 * @brief 寫入單個暫存器
 */
int i2c_write_register(i2c_handle_t handle, uint16_t dev_addr,
                       uint8_t reg_addr, uint8_t value)
{
    uint8_t data[2] = {reg_addr, value};

    return i2c_master_write(handle, dev_addr, data, 2);
}

/**
 * @brief 讀取單個暫存器
 */
int i2c_read_register(i2c_handle_t handle, uint16_t dev_addr,
                      uint8_t reg_addr, uint8_t *value)
{
    i2c_context_t *ctx = i2c_get_context(handle);

    if (ctx == NULL || !ctx->initialized || value == NULL) {
        return -1;
    }

    uint16_t addr = dev_addr << 1;

    /* 寫入暫存器地址 */
    HAL_StatusTypeDef status = HAL_I2C_Master_Transmit(&ctx->hi2c, addr,
                                                        &reg_addr, 1,
                                                        I2C_TIMEOUT);

    if (status != HAL_OK) {
        return -1;
    }

    /* 讀取暫存器值 */
    status = HAL_I2C_Master_Receive(&ctx->hi2c, addr, value, 1, I2C_TIMEOUT);

    return (status == HAL_OK) ? 0 : -1;
}

/**
 * @brief 讀取多個暫存器
 */
int i2c_read_registers(i2c_handle_t handle, uint16_t dev_addr,
                       uint8_t reg_addr, uint8_t *data, size_t len)
{
    i2c_context_t *ctx = i2c_get_context(handle);

    if (ctx == NULL || !ctx->initialized || data == NULL || len == 0) {
        return -1;
    }

    uint16_t addr = dev_addr << 1;

    /* 寫入起始暫存器地址 */
    HAL_StatusTypeDef status = HAL_I2C_Master_Transmit(&ctx->hi2c, addr,
                                                        &reg_addr, 1,
                                                        I2C_TIMEOUT);

    if (status != HAL_OK) {
        return -1;
    }

    /* 讀取多個暫存器 */
    status = HAL_I2C_Master_Receive(&ctx->hi2c, addr, data, len, I2C_TIMEOUT);

    return (status == HAL_OK) ? (int)len : -1;
}

/* ========== 私有函數實作 ========== */

/**
 * @brief 獲取 I2C 實例
 */
static I2C_TypeDef* i2c_get_instance(uint8_t i2c_num)
{
    switch (i2c_num) {
        case 1:  return I2C1;
        case 2:  return I2C2;
        case 3:  return I2C3;
        default: return NULL;
    }
}

/**
 * @brief 啟用 I2C 時鐘
 */
static void i2c_enable_clock(uint8_t i2c_num)
{
    switch (i2c_num) {
        case 1:  __HAL_RCC_I2C1_CLK_ENABLE(); break;
        case 2:  __HAL_RCC_I2C2_CLK_ENABLE(); break;
        case 3:  __HAL_RCC_I2C3_CLK_ENABLE(); break;
    }
}

/**
 * @brief 從句柄獲取上下文
 */
static i2c_context_t* i2c_get_context(i2c_handle_t handle)
{
    i2c_context_t *ctx = (i2c_context_t *)handle;

    /* 驗證句柄 */
    if (ctx < i2c_contexts || ctx >= &i2c_contexts[MAX_I2C_INSTANCES]) {
        return NULL;
    }

    return ctx;
}

/**
 * @brief 轉換速度到 STM32 定義
 */
static uint32_t i2c_convert_speed(uint32_t speed)
{
    /* STM32F4 的 I2C 支援的標準速度 */
    if (speed <= 100000) {
        return 100000;  /* 標準模式 100kHz */
    } else if (speed <= 400000) {
        return 400000;  /* 快速模式 400kHz */
    } else {
        return 400000;  /* 預設使用快速模式 */
    }
}

#endif /* STM32F4 */
