/**
 * @file boot_flag.c
 * @brief 啟動標誌管理實現
 */

#include "boot_flag.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/**
 * @brief 計算校驗和
 */
uint32_t boot_flag_calculate_checksum(const boot_flag_t *boot_flag)
{
    if (!boot_flag) {
        return 0;
    }

    uint32_t checksum = 0;
    const uint8_t *data = (const uint8_t *)boot_flag;
    size_t size = sizeof(boot_flag_t) - sizeof(uint32_t);  /* 排除 checksum 字段 */

    for (size_t i = 0; i < size; i++) {
        checksum += data[i];
    }

    return checksum;
}

/**
 * @brief 讀取啟動標誌
 */
int boot_flag_read(boot_flag_t *boot_flag, const char *path)
{
    if (!boot_flag || !path) {
        return -1;
    }

    FILE *fp = fopen(path, "rb");
    if (!fp) {
        return -2;
    }

    size_t read = fread(boot_flag, 1, sizeof(boot_flag_t), fp);
    fclose(fp);

    if (read != sizeof(boot_flag_t)) {
        return -3;
    }

    /* 驗證校驗和 */
    uint32_t calculated_checksum = boot_flag_calculate_checksum(boot_flag);
    if (calculated_checksum != boot_flag->checksum) {
        printf("[BootFlag] Checksum mismatch: expected=0x%08x, calculated=0x%08x\n",
               boot_flag->checksum, calculated_checksum);
        return -4;
    }

    /* 驗證魔數 */
    if (!boot_flag_validate(boot_flag)) {
        return -5;
    }

    return 0;
}

/**
 * @brief 寫入啟動標誌
 */
int boot_flag_write(const boot_flag_t *boot_flag, const char *path)
{
    if (!boot_flag || !path) {
        return -1;
    }

    boot_flag_t flag_copy;
    memcpy(&flag_copy, boot_flag, sizeof(boot_flag_t));

    /* 計算並設置校驗和 */
    flag_copy.checksum = boot_flag_calculate_checksum(&flag_copy);

    FILE *fp = fopen(path, "wb");
    if (!fp) {
        return -2;
    }

    size_t written = fwrite(&flag_copy, 1, sizeof(boot_flag_t), fp);
    fclose(fp);

    if (written != sizeof(boot_flag_t)) {
        return -3;
    }

    return 0;
}

/**
 * @brief 初始化啟動標誌
 */
void boot_flag_init(boot_flag_t *boot_flag)
{
    if (!boot_flag) {
        return;
    }

    memset(boot_flag, 0, sizeof(boot_flag_t));

    boot_flag->magic = BOOT_FLAG_MAGIC;
    boot_flag->version = BOOT_FLAG_VERSION;
    boot_flag->active_slot = PARTITION_SLOT_A;
    boot_flag->boot_slot = PARTITION_SLOT_A;
    boot_flag->checksum = boot_flag_calculate_checksum(boot_flag);
}

/**
 * @brief 驗證啟動標誌
 */
bool boot_flag_validate(const boot_flag_t *boot_flag)
{
    if (!boot_flag) {
        return false;
    }

    if (boot_flag->magic != BOOT_FLAG_MAGIC) {
        return false;
    }

    if (boot_flag->version > BOOT_FLAG_VERSION) {
        return false;
    }

    return true;
}

/**
 * @brief 增加啟動計數
 */
int boot_flag_increment_boot_count(boot_flag_t *boot_flag, partition_slot_t slot)
{
    if (!boot_flag) {
        return -1;
    }

    if (slot == PARTITION_SLOT_A) {
        boot_flag->boot_count_a++;
    } else if (slot == PARTITION_SLOT_B) {
        boot_flag->boot_count_b++;
    } else {
        return -2;
    }

    return 0;
}

/**
 * @brief 重置啟動計數
 */
int boot_flag_reset_boot_count(boot_flag_t *boot_flag, partition_slot_t slot)
{
    if (!boot_flag) {
        return -1;
    }

    if (slot == PARTITION_SLOT_A) {
        boot_flag->boot_count_a = 0;
    } else if (slot == PARTITION_SLOT_B) {
        boot_flag->boot_count_b = 0;
    } else {
        return -2;
    }

    return 0;
}

/**
 * @brief 標記啟動成功
 */
int boot_flag_mark_boot_successful(boot_flag_t *boot_flag, partition_slot_t slot)
{
    if (!boot_flag) {
        return -1;
    }

    if (slot == PARTITION_SLOT_A) {
        boot_flag->successful_boots_a++;
        boot_flag->boot_count_a = 0;
    } else if (slot == PARTITION_SLOT_B) {
        boot_flag->successful_boots_b++;
        boot_flag->boot_count_b = 0;
    } else {
        return -2;
    }

    return 0;
}
