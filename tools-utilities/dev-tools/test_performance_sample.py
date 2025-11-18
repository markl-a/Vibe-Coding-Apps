#!/usr/bin/env python3
"""測試性能分析的範例腳本"""

import time

def slow_function():
    """慢速函數"""
    total = 0
    for i in range(1000000):
        total += i
    return total

def fast_function():
    """快速函數"""
    return sum(range(1000000))

def main():
    """主函數"""
    print("測試性能分析...")

    start = time.time()
    result1 = slow_function()
    print(f"慢速函數結果: {result1}, 耗時: {time.time() - start:.4f}s")

    start = time.time()
    result2 = fast_function()
    print(f"快速函數結果: {result2}, 耗時: {time.time() - start:.4f}s")

    time.sleep(0.1)
    print("測試完成!")

if __name__ == '__main__':
    main()
