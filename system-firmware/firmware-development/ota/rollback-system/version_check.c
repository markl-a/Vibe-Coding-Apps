/**
 * @file version_check.c
 * @brief 版本檢查實現
 */

#include "version_check.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/**
 * @brief 解析版本字符串
 */
int version_parse(const char *version_str, version_t *version)
{
    if (!version_str || !version) {
        return -1;
    }

    memset(version, 0, sizeof(version_t));

    /* 解析 major.minor.patch 或 major.minor.patch.build */
    int parsed = sscanf(version_str, "%hhu.%hhu.%hhu.%hhu",
                        &version->major, &version->minor,
                        &version->patch, &version->build);

    if (parsed < 3) {
        /* 至少需要 major.minor.patch */
        return -2;
    }

    return 0;
}

/**
 * @brief 版本號轉字符串
 */
int version_to_string(const version_t *version, char *buffer, size_t size)
{
    if (!version || !buffer || size == 0) {
        return -1;
    }

    int ret;

    if (version->build > 0) {
        ret = snprintf(buffer, size, "%u.%u.%u.%u",
                       version->major, version->minor,
                       version->patch, version->build);
    } else {
        ret = snprintf(buffer, size, "%u.%u.%u",
                       version->major, version->minor,
                       version->patch);
    }

    if (ret < 0 || (size_t)ret >= size) {
        return -2;
    }

    return 0;
}

/**
 * @brief 比較版本號
 */
int version_compare(const version_t *v1, const version_t *v2)
{
    if (!v1 || !v2) {
        return 0;
    }

    /* 比較主版本號 */
    if (v1->major != v2->major) {
        return (v1->major > v2->major) ? 1 : -1;
    }

    /* 比較次版本號 */
    if (v1->minor != v2->minor) {
        return (v1->minor > v2->minor) ? 1 : -1;
    }

    /* 比較補丁版本號 */
    if (v1->patch != v2->patch) {
        return (v1->patch > v2->patch) ? 1 : -1;
    }

    /* 比較構建版本號 */
    if (v1->build != v2->build) {
        return (v1->build > v2->build) ? 1 : -1;
    }

    return 0;
}

/**
 * @brief 檢查版本兼容性
 */
bool version_is_compatible(const version_t *current, const version_t *required)
{
    if (!current || !required) {
        return false;
    }

    /* 主版本號必須相同 */
    if (current->major != required->major) {
        return false;
    }

    /* 當前版本的次版本號必須 >= 要求版本 */
    if (current->minor < required->minor) {
        return false;
    }

    /* 如果次版本號相同，補丁版本號必須 >= 要求版本 */
    if (current->minor == required->minor &&
        current->patch < required->patch) {
        return false;
    }

    return true;
}

/**
 * @brief 檢查是否為升級
 */
bool version_is_upgrade(const version_t *current, const version_t *new_version)
{
    if (!current || !new_version) {
        return false;
    }

    return version_compare(new_version, current) > 0;
}

/**
 * @brief 檢查是否為降級
 */
bool version_is_downgrade(const version_t *current, const version_t *new_version)
{
    if (!current || !new_version) {
        return false;
    }

    return version_compare(new_version, current) < 0;
}

/**
 * @brief 驗證版本號有效性
 */
bool version_is_valid(const version_t *version)
{
    if (!version) {
        return false;
    }

    /* 版本號不能全為0 */
    if (version->major == 0 && version->minor == 0 &&
        version->patch == 0 && version->build == 0) {
        return false;
    }

    return true;
}
