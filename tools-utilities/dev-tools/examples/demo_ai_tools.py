#!/usr/bin/env python3
"""
demo_ai_tools.py - AI 工具綜合演示
展示所有新增 AI 輔助開發工具的使用
"""

import time
import random


def slow_fibonacci(n):
    """慢速的斐波那契數列計算（用於性能分析演示）"""
    if n <= 1:
        return n
    return slow_fibonacci(n - 1) + slow_fibonacci(n - 2)


def fast_fibonacci(n):
    """快速的斐波那契數列計算（使用緩存）"""
    cache = {0: 0, 1: 1}

    def fib(x):
        if x not in cache:
            cache[x] = fib(x - 1) + fib(x - 2)
        return cache[x]

    return fib(n)


def insecure_function(user_input):
    """不安全的函數（用於安全掃描演示）"""
    # 不安全：使用 eval
    # result = eval(user_input)  # 這會被安全掃描工具檢測到

    # 不安全：SQL 注入風險
    # query = "SELECT * FROM users WHERE id = " + user_input  # 這會被檢測到

    # 硬編碼密碼（演示用）
    # password = "secret123"  # 這會被檢測到

    # 安全的實現
    result = user_input.upper()
    return result


def performance_test():
    """性能測試函數"""
    data = []

    # 模擬一些計算密集型操作
    for i in range(1000):
        data.append(i ** 2)

    # 字符串拼接（可能效率低下）
    text = ""
    for i in range(100):
        text += str(i)

    return sum(data), text


class DemoClass:
    """演示類別"""

    def __init__(self, name):
        """初始化"""
        self.name = name
        self.data = []

    def add_data(self, item):
        """添加數據"""
        self.data.append(item)

    def process(self):
        """處理數據"""
        # 模擬複雜的處理邏輯
        result = []
        for item in self.data:
            if isinstance(item, int):
                result.append(item * 2)
            elif isinstance(item, str):
                result.append(item.upper())
        return result

    def get_statistics(self):
        """獲取統計數據"""
        numbers = [x for x in self.data if isinstance(x, int)]
        if not numbers:
            return None

        return {
            'count': len(numbers),
            'sum': sum(numbers),
            'average': sum(numbers) / len(numbers),
            'min': min(numbers),
            'max': max(numbers)
        }


def main():
    """主函數"""
    print("AI 工具綜合演示")
    print("="*60)

    # 1. 測試基本功能
    print("\n1. 基本功能測試")
    print("-"*60)

    demo = DemoClass("測試")
    for i in range(10):
        demo.add_data(random.randint(1, 100))

    results = demo.process()
    print(f"處理結果: {results[:5]}...")

    stats = demo.get_statistics()
    if stats:
        print(f"統計數據: {stats}")

    # 2. 性能測試
    print("\n2. 性能測試")
    print("-"*60)

    start = time.time()
    sum_data, text_data = performance_test()
    end = time.time()

    print(f"性能測試完成，耗時: {end - start:.4f} 秒")
    print(f"計算結果: {sum_data}")

    # 3. 斐波那契測試
    print("\n3. 斐波那契數列測試")
    print("-"*60)

    n = 10
    start = time.time()
    result_fast = fast_fibonacci(n)
    time_fast = time.time() - start

    print(f"快速版本: fib({n}) = {result_fast}, 耗時: {time_fast:.6f} 秒")

    # 慢速版本（不運行，只展示代碼）
    # start = time.time()
    # result_slow = slow_fibonacci(n)
    # time_slow = time.time() - start
    # print(f"慢速版本: fib({n}) = {result_slow}, 耗時: {time_slow:.6f} 秒")

    # 4. 測試安全功能
    print("\n4. 安全功能測試")
    print("-"*60)

    test_input = "hello world"
    result = insecure_function(test_input)
    print(f"處理結果: {result}")

    print("\n演示完成！")
    print("="*60)


if __name__ == '__main__':
    main()
