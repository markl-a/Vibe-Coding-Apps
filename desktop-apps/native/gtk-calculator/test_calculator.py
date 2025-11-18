#!/usr/bin/env python3
"""
GTK 计算器测试脚本
验证计算器的各项功能
"""

import sys
import unittest
from calculator_enhanced import AICalculator, CalculatorHistory
import math


class TestAICalculator(unittest.TestCase):
    """AI 计算器测试"""

    def setUp(self):
        self.ai_calc = AICalculator()

    def test_natural_language_parsing(self):
        """测试自然语言解析"""
        # 测试中文运算符
        self.assertEqual(
            self.ai_calc.parse_natural_language("2加3"),
            "2+3"
        )
        self.assertEqual(
            self.ai_calc.parse_natural_language("5乘3"),
            "5*3"
        )
        self.assertEqual(
            self.ai_calc.parse_natural_language("10除以2"),
            "10/2"
        )

    def test_expression_evaluation(self):
        """测试表达式计算"""
        # 基本运算
        self.assertEqual(self.ai_calc.evaluate_expression("2+3"), 5)
        self.assertEqual(self.ai_calc.evaluate_expression("5*3"), 15)
        self.assertEqual(self.ai_calc.evaluate_expression("10/2"), 5)
        self.assertEqual(self.ai_calc.evaluate_expression("10-3"), 7)

        # 复杂表达式
        self.assertEqual(self.ai_calc.evaluate_expression("2+3*4"), 14)
        self.assertEqual(self.ai_calc.evaluate_expression("(2+3)*4"), 20)

        # 平方根
        self.assertEqual(self.ai_calc.evaluate_expression("math.sqrt(16)"), 4)

        # 幂运算
        self.assertEqual(self.ai_calc.evaluate_expression("2**3"), 8)

    def test_scientific_functions(self):
        """测试科学计算函数"""
        # sin, cos, tan (弧度)
        result = self.ai_calc.evaluate_expression("math.sin(0)")
        self.assertAlmostEqual(result, 0, places=5)

        result = self.ai_calc.evaluate_expression("math.cos(0)")
        self.assertAlmostEqual(result, 1, places=5)

        # pi
        pi_expr = f"{math.pi}"
        result = self.ai_calc.evaluate_expression(pi_expr)
        self.assertAlmostEqual(result, math.pi, places=5)

    def test_error_handling(self):
        """测试错误处理"""
        # 除以零
        with self.assertRaises(ValueError):
            self.ai_calc.evaluate_expression("10/0")

        # 非法字符
        with self.assertRaises(ValueError):
            self.ai_calc.evaluate_expression("import os")


class TestCalculatorHistory(unittest.TestCase):
    """计算历史记录测试"""

    def setUp(self):
        self.history = CalculatorHistory(max_items=5)

    def test_add_history(self):
        """测试添加历史记录"""
        self.history.add("2+3", "5")
        self.assertEqual(len(self.history.get_all()), 1)

        item = self.history.get_all()[0]
        self.assertEqual(item['expression'], "2+3")
        self.assertEqual(item['result'], "5")
        self.assertIn('timestamp', item)

    def test_max_items_limit(self):
        """测试历史记录数量限制"""
        # 添加超过限制的记录
        for i in range(10):
            self.history.add(f"{i}+1", str(i+1))

        # 应该只保留最新的 5 条
        self.assertEqual(len(self.history.get_all()), 5)

        # 最新的记录应该在前面
        self.assertEqual(self.history.get_all()[0]['expression'], "9+1")

    def test_clear_history(self):
        """测试清除历史记录"""
        self.history.add("2+3", "5")
        self.history.add("5*2", "10")

        self.assertEqual(len(self.history.get_all()), 2)

        self.history.clear()
        self.assertEqual(len(self.history.get_all()), 0)


class TestCalculatorOperations(unittest.TestCase):
    """基本计算器操作测试"""

    def test_basic_arithmetic(self):
        """测试基本算术运算"""
        # 加法
        self.assertEqual(2 + 3, 5)

        # 减法
        self.assertEqual(5 - 3, 2)

        # 乘法
        self.assertEqual(5 * 3, 15)

        # 除法
        self.assertAlmostEqual(10 / 3, 3.333333, places=5)

    def test_scientific_operations(self):
        """测试科学计算"""
        # 平方根
        self.assertEqual(math.sqrt(16), 4)
        self.assertEqual(math.sqrt(25), 5)

        # 平方
        self.assertEqual(5 ** 2, 25)

        # π
        self.assertAlmostEqual(math.pi, 3.14159, places=5)

    def test_format_result(self):
        """测试结果格式化"""
        # 整数结果
        result = 10.0
        formatted = str(int(result)) if result == int(result) else f"{result:.8f}".rstrip('0').rstrip('.')
        self.assertEqual(formatted, "10")

        # 小数结果
        result = 10.5
        formatted = str(int(result)) if result == int(result) else f"{result:.8f}".rstrip('0').rstrip('.')
        self.assertEqual(formatted, "10.5")

        # 去除尾随零
        result = 10.50000
        formatted = str(int(result)) if result == int(result) else f"{result:.8f}".rstrip('0').rstrip('.')
        self.assertEqual(formatted, "10.5")


def run_tests():
    """运行所有测试"""
    print("=" * 70)
    print("运行 GTK 计算器测试套件")
    print("=" * 70)

    # 创建测试套件
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # 添加测试类
    suite.addTests(loader.loadTestsFromTestCase(TestAICalculator))
    suite.addTests(loader.loadTestsFromTestCase(TestCalculatorHistory))
    suite.addTests(loader.loadTestsFromTestCase(TestCalculatorOperations))

    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # 打印总结
    print("\n" + "=" * 70)
    print(f"测试总结: 运行 {result.testsRun} 个测试")
    print(f"✅ 成功: {result.testsRun - len(result.failures) - len(result.errors)}")
    if result.failures:
        print(f"❌ 失败: {len(result.failures)}")
    if result.errors:
        print(f"⚠️  错误: {len(result.errors)}")
    print("=" * 70)

    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    sys.exit(run_tests())
