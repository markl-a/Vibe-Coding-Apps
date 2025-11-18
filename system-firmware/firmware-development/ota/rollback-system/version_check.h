/**
 * @file version_check.h
 * @brief 版本檢查接口
 * @details 固件版本比較和驗證
 */

#ifndef VERSION_CHECK_H
#define VERSION_CHECK_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* 版本號結構 */
typedef struct {
    uint8_t major;      /* 主版本號 */
    uint8_t minor;      /* 次版本號 */
    uint8_t patch;      /* 補丁版本號 */
    uint8_t build;      /* 構建版本號 */
} version_t;

/**
 * @brief 解析版本字符串
 * @param version_str 版本字符串（例如："1.2.3"）
 * @param version 版本號輸出
 * @return 0: 成功, <0: 錯誤碼
 */
int version_parse(const char *version_str, version_t *version);

/**
 * @brief 版本號轉字符串
 * @param version 版本號
 * @param buffer 輸出緩衝區
 * @param size 緩衝區大小
 * @return 0: 成功, <0: 錯誤碼
 */
int version_to_string(const version_t *version, char *buffer, size_t size);

/**
 * @brief 比較版本號
 * @param v1 版本號1
 * @param v2 版本號2
 * @return >0: v1>v2, 0: v1==v2, <0: v1<v2
 */
int version_compare(const version_t *v1, const version_t *v2);

/**
 * @brief 檢查版本兼容性
 * @param current 當前版本
 * @param required 要求版本
 * @return true: 兼容, false: 不兼容
 */
bool version_is_compatible(const version_t *current, const version_t *required);

/**
 * @brief 檢查是否為升級
 * @param current 當前版本
 * @param new_version 新版本
 * @return true: 是升級, false: 不是升級
 */
bool version_is_upgrade(const version_t *current, const version_t *new_version);

/**
 * @brief 檢查是否為降級
 * @param current 當前版本
 * @param new_version 新版本
 * @return true: 是降級, false: 不是降級
 */
bool version_is_downgrade(const version_t *current, const version_t *new_version);

/**
 * @brief 驗證版本號有效性
 * @param version 版本號
 * @return true: 有效, false: 無效
 */
bool version_is_valid(const version_t *version);

#ifdef __cplusplus
}
#endif

#endif /* VERSION_CHECK_H */
