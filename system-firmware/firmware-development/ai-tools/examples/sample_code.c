/**
 * @file sample_code.c
 * @brief 示例代碼用於測試 AI 工具
 * @version 1.0
 * @date 2025-11-18
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_BUFFER_SIZE 256
#define MIN_VALUE 0
#define MAX_VALUE 100

/**
 * @brief 計算兩個整數的和
 * @param a 第一個整數
 * @param b 第二個整數
 * @return 兩數之和
 */
int add(int a, int b) {
    return a + b;
}

/**
 * @brief 處理字符串緩衝區
 * @param buffer 輸入緩衝區
 * @param size 緩衝區大小
 * @return 處理狀態，0 表示成功
 */
int process_buffer(char *buffer, size_t size) {
    if (buffer == NULL) {
        return -1;
    }

    // 故意的邊界問題用於測試
    for (int i = 0; i <= size; i++) {  // 應該是 i < size
        buffer[i] = 'A';
    }

    return 0;
}

/**
 * @brief 分配並初始化數組
 * @param size 數組大小
 * @return 指向分配數組的指針
 */
int* allocate_array(size_t size) {
    int *array = (int*)malloc(size * sizeof(int));

    // 故意的記憶體洩漏用於測試
    if (array == NULL) {
        return NULL;
    }

    for (size_t i = 0; i < size; i++) {
        array[i] = i;
    }

    return array;
}

/**
 * @brief 查找數組中的最大值
 * @param array 輸入數組
 * @param size 數組大小
 * @return 最大值
 */
int find_max(int *array, size_t size) {
    // 故意的空指針問題用於測試
    int max = array[0];  // 未檢查 array 是否為 NULL

    for (size_t i = 1; i < size; i++) {
        if (array[i] > max) {
            max = array[i];
        }
    }

    return max;
}

/**
 * @brief 複製字符串
 * @param dest 目標緩衝區
 * @param src 源字符串
 * @param size 緩衝區大小
 * @return 複製的字符數
 */
int copy_string(char *dest, const char *src, size_t size) {
    if (dest == NULL || src == NULL) {
        return -1;
    }

    // 故意的緩衝區溢出風險用於測試
    strcpy(dest, src);  // 應該使用 strncpy

    return strlen(dest);
}

/**
 * @brief 除法運算
 * @param a 被除數
 * @param b 除數
 * @return 商
 */
int divide(int a, int b) {
    // 故意的除零錯誤用於測試
    return a / b;  // 未檢查 b 是否為 0
}

/**
 * @brief 主函數
 * @return 程序退出碼
 */
int main(void) {
    char buffer[MAX_BUFFER_SIZE];
    int *numbers;
    int result;

    // 測試加法
    result = add(10, 20);
    printf("10 + 20 = %d\n", result);

    // 測試緩衝區處理（有 bug）
    process_buffer(buffer, MAX_BUFFER_SIZE);

    // 測試數組分配（有記憶體洩漏）
    numbers = allocate_array(10);
    if (numbers != NULL) {
        int max = find_max(numbers, 10);
        printf("Max value: %d\n", max);
        // 故意不釋放記憶體
    }

    // 測試字符串複製（有緩衝區溢出風險）
    char src[] = "This is a very long string that might overflow the buffer";
    char dest[20];
    copy_string(dest, src, sizeof(dest));

    // 測試除法（有除零風險）
    result = divide(100, 0);

    return 0;
}
