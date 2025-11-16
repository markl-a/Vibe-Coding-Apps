/**
 * @file device_model.h
 * @brief Unified Device Model Interface
 * @version 1.0.0
 */

#ifndef DEVICE_MODEL_H
#define DEVICE_MODEL_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stddef.h>

/* 設備類型 */
#define DEVICE_TYPE_CHAR    0x01
#define DEVICE_TYPE_BLOCK   0x02
#define DEVICE_TYPE_NETWORK 0x03
#define DEVICE_TYPE_SPECIAL 0x04

/* 前向聲明 */
typedef struct device device_t;

/* 設備操作介面 */
typedef struct device_ops {
    int (*open)(device_t *device);
    int (*close)(device_t *device);
    int (*read)(device_t *device, void *buffer, size_t size);
    int (*write)(device_t *device, const void *buffer, size_t size);
    int (*ioctl)(device_t *device, uint32_t cmd, void *arg);
} device_ops_t;

/* 設備結構 */
struct device {
    const char *name;
    uint8_t type;
    void *private_data;
    const device_ops_t *ops;
    device_t *next;
};

/* API 函數 */
int device_register(device_t *device);
int device_unregister(const char *name);
device_t *device_find(const char *name);
int device_open(device_t *device);
int device_close(device_t *device);
int device_read(device_t *device, void *buffer, size_t size);
int device_write(device_t *device, const void *buffer, size_t size);
int device_ioctl(device_t *device, uint32_t cmd, void *arg);
void device_list_all(void);

#ifdef __cplusplus
}
#endif

#endif /* DEVICE_MODEL_H */
