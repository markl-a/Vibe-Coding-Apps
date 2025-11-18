/**
 * @file device_model.c
 * @brief Unified Device Model Implementation
 * @version 1.0.0
 * @date 2025-11-18
 *
 * 統一設備模型實作
 * 提供設備註冊、查找和操作的通用介面
 */

#include "device_model.h"
#include <string.h>
#include <stdio.h>

/* ========== 私有定義 ========== */

#define MAX_DEVICES  32    /**< 最大設備數量 */

/**
 * @brief 設備管理器結構
 */
typedef struct {
    device_t *head;         /**< 設備鏈表頭 */
    uint16_t count;         /**< 已註冊設備數量 */
} device_manager_t;

/* ========== 私有變數 ========== */

static device_manager_t device_manager = {
    .head = NULL,
    .count = 0
};

/* ========== 私有函數聲明 ========== */

static bool device_name_exists(const char *name);
static const char* device_type_to_string(uint8_t type);

/* ========== API 實作 ========== */

/**
 * @brief 註冊設備
 */
int device_register(device_t *device)
{
    if (device == NULL || device->name == NULL || device->ops == NULL) {
        return -1;
    }

    /* 檢查設備數量限制 */
    if (device_manager.count >= MAX_DEVICES) {
        return -1;
    }

    /* 檢查設備名稱是否已存在 */
    if (device_name_exists(device->name)) {
        return -1;
    }

    /* 添加到鏈表頭部 */
    device->next = device_manager.head;
    device_manager.head = device;
    device_manager.count++;

    return 0;
}

/**
 * @brief 註銷設備
 */
int device_unregister(const char *name)
{
    if (name == NULL) {
        return -1;
    }

    device_t *prev = NULL;
    device_t *curr = device_manager.head;

    /* 遍歷鏈表查找設備 */
    while (curr != NULL) {
        if (strcmp(curr->name, name) == 0) {
            /* 從鏈表中移除 */
            if (prev == NULL) {
                device_manager.head = curr->next;
            } else {
                prev->next = curr->next;
            }

            device_manager.count--;
            return 0;
        }

        prev = curr;
        curr = curr->next;
    }

    return -1;  /* 設備未找到 */
}

/**
 * @brief 查找設備
 */
device_t* device_find(const char *name)
{
    if (name == NULL) {
        return NULL;
    }

    device_t *curr = device_manager.head;

    while (curr != NULL) {
        if (strcmp(curr->name, name) == 0) {
            return curr;
        }
        curr = curr->next;
    }

    return NULL;
}

/**
 * @brief 打開設備
 */
int device_open(device_t *device)
{
    if (device == NULL || device->ops == NULL || device->ops->open == NULL) {
        return -1;
    }

    return device->ops->open(device);
}

/**
 * @brief 關閉設備
 */
int device_close(device_t *device)
{
    if (device == NULL || device->ops == NULL || device->ops->close == NULL) {
        return -1;
    }

    return device->ops->close(device);
}

/**
 * @brief 讀取設備
 */
int device_read(device_t *device, void *buffer, size_t size)
{
    if (device == NULL || device->ops == NULL || device->ops->read == NULL) {
        return -1;
    }

    if (buffer == NULL || size == 0) {
        return -1;
    }

    return device->ops->read(device, buffer, size);
}

/**
 * @brief 寫入設備
 */
int device_write(device_t *device, const void *buffer, size_t size)
{
    if (device == NULL || device->ops == NULL || device->ops->write == NULL) {
        return -1;
    }

    if (buffer == NULL || size == 0) {
        return -1;
    }

    return device->ops->write(device, buffer, size);
}

/**
 * @brief 設備控制
 */
int device_ioctl(device_t *device, uint32_t cmd, void *arg)
{
    if (device == NULL || device->ops == NULL || device->ops->ioctl == NULL) {
        return -1;
    }

    return device->ops->ioctl(device, cmd, arg);
}

/**
 * @brief 列出所有設備
 */
void device_list_all(void)
{
    printf("\nRegistered Devices (%d/%d):\n", device_manager.count, MAX_DEVICES);
    printf("%-20s %-15s %-10s\n", "Name", "Type", "Status");
    printf("%-20s %-15s %-10s\n", "--------------------", "---------------", "----------");

    device_t *curr = device_manager.head;

    if (curr == NULL) {
        printf("No devices registered.\n");
        return;
    }

    while (curr != NULL) {
        printf("%-20s %-15s %-10s\n",
               curr->name,
               device_type_to_string(curr->type),
               "Ready");

        curr = curr->next;
    }

    printf("\n");
}

/* ========== 便利函數 ========== */

/**
 * @brief 按名稱打開設備
 */
device_t* device_open_by_name(const char *name)
{
    device_t *device = device_find(name);

    if (device != NULL) {
        if (device_open(device) == 0) {
            return device;
        }
    }

    return NULL;
}

/**
 * @brief 按名稱讀取設備
 */
int device_read_by_name(const char *name, void *buffer, size_t size)
{
    device_t *device = device_find(name);

    if (device == NULL) {
        return -1;
    }

    return device_read(device, buffer, size);
}

/**
 * @brief 按名稱寫入設備
 */
int device_write_by_name(const char *name, const void *buffer, size_t size)
{
    device_t *device = device_find(name);

    if (device == NULL) {
        return -1;
    }

    return device_write(device, buffer, size);
}

/**
 * @brief 獲取設備數量
 */
uint16_t device_get_count(void)
{
    return device_manager.count;
}

/**
 * @brief 檢查設備是否已註冊
 */
bool device_is_registered(const char *name)
{
    return device_find(name) != NULL;
}

/**
 * @brief 獲取第一個設備
 */
device_t* device_get_first(void)
{
    return device_manager.head;
}

/**
 * @brief 獲取下一個設備
 */
device_t* device_get_next(device_t *device)
{
    if (device == NULL) {
        return NULL;
    }

    return device->next;
}

/**
 * @brief 按類型查找設備
 */
device_t* device_find_by_type(uint8_t type)
{
    device_t *curr = device_manager.head;

    while (curr != NULL) {
        if (curr->type == type) {
            return curr;
        }
        curr = curr->next;
    }

    return NULL;
}

/**
 * @brief 獲取設備私有數據
 */
void* device_get_private_data(device_t *device)
{
    if (device == NULL) {
        return NULL;
    }

    return device->private_data;
}

/**
 * @brief 設置設備私有數據
 */
int device_set_private_data(device_t *device, void *data)
{
    if (device == NULL) {
        return -1;
    }

    device->private_data = data;

    return 0;
}

/* ========== 批量操作 ========== */

/**
 * @brief 打開所有設備
 */
int device_open_all(void)
{
    int success_count = 0;
    device_t *curr = device_manager.head;

    while (curr != NULL) {
        if (device_open(curr) == 0) {
            success_count++;
        }
        curr = curr->next;
    }

    return success_count;
}

/**
 * @brief 關閉所有設備
 */
int device_close_all(void)
{
    int success_count = 0;
    device_t *curr = device_manager.head;

    while (curr != NULL) {
        if (device_close(curr) == 0) {
            success_count++;
        }
        curr = curr->next;
    }

    return success_count;
}

/**
 * @brief 註銷所有設備
 */
void device_unregister_all(void)
{
    device_manager.head = NULL;
    device_manager.count = 0;
}

/* ========== 私有函數實作 ========== */

/**
 * @brief 檢查設備名稱是否已存在
 */
static bool device_name_exists(const char *name)
{
    return device_find(name) != NULL;
}

/**
 * @brief 設備類型轉字串
 */
static const char* device_type_to_string(uint8_t type)
{
    switch (type) {
        case DEVICE_TYPE_CHAR:    return "Character";
        case DEVICE_TYPE_BLOCK:   return "Block";
        case DEVICE_TYPE_NETWORK: return "Network";
        case DEVICE_TYPE_SPECIAL: return "Special";
        default:                  return "Unknown";
    }
}

/* ========== 調試功能 ========== */

/**
 * @brief 顯示設備詳細信息
 */
void device_print_info(device_t *device)
{
    if (device == NULL) {
        printf("Device is NULL\n");
        return;
    }

    printf("\nDevice Information:\n");
    printf("  Name:        %s\n", device->name);
    printf("  Type:        %s (0x%02X)\n", device_type_to_string(device->type), device->type);
    printf("  Private Data: %p\n", device->private_data);
    printf("  Operations:\n");
    printf("    open:      %p\n", (void *)device->ops->open);
    printf("    close:     %p\n", (void *)device->ops->close);
    printf("    read:      %p\n", (void *)device->ops->read);
    printf("    write:     %p\n", (void *)device->ops->write);
    printf("    ioctl:     %p\n", (void *)device->ops->ioctl);
    printf("\n");
}

/**
 * @brief 統計設備數量（按類型）
 */
void device_print_statistics(void)
{
    uint16_t char_count = 0;
    uint16_t block_count = 0;
    uint16_t network_count = 0;
    uint16_t special_count = 0;
    uint16_t other_count = 0;

    device_t *curr = device_manager.head;

    while (curr != NULL) {
        switch (curr->type) {
            case DEVICE_TYPE_CHAR:    char_count++; break;
            case DEVICE_TYPE_BLOCK:   block_count++; break;
            case DEVICE_TYPE_NETWORK: network_count++; break;
            case DEVICE_TYPE_SPECIAL: special_count++; break;
            default:                  other_count++; break;
        }
        curr = curr->next;
    }

    printf("\nDevice Statistics:\n");
    printf("  Total Devices:     %d\n", device_manager.count);
    printf("  Character Devices: %d\n", char_count);
    printf("  Block Devices:     %d\n", block_count);
    printf("  Network Devices:   %d\n", network_count);
    printf("  Special Devices:   %d\n", special_count);
    printf("  Other Devices:     %d\n", other_count);
    printf("\n");
}
