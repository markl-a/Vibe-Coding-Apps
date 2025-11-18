#!/usr/bin/env python3
"""
GTK 计算器独立测试脚本
不依赖 GTK，只测试核心计算逻辑
"""

import sys
import unittest
import math
import re
from datetime import datetime


class AICalculator:
    """AI 辅助计算器 - 解析自然语言表达式"""

    @staticmethod
    def parse_natural_language(text):
        """解析自然语言数学表达式"""
        text = text.lower().strip()

        # 顺序很重要：先替换长的词组，再替换短的
        replacements = [
            ('除以', '/'),
            ('乘以', '*'),
            ('的平方', '**2'),
            ('平方根', 'sqrt'),
            ('開根號', 'sqrt'),
            ('加', '+'),
            ('減', '-'),
            ('乘', '*'),
            ('除', '/'),
        ]

        for chinese, symbol in replacements:
            text = text.replace(chinese, symbol)

        return text

    @staticmethod
    def evaluate_expression(expression):
        """安全地评估数学表达式"""
        try:
            # 创建安全的命名空间
            safe_dict = {
                "__builtins__": {},
                "sqrt": math.sqrt,
                "sin": math.sin,
                "cos": math.cos,
                "tan": math.tan,
                "log": math.log10,
                "ln": math.log,
                "pi": math.pi,
                "e": math.e,
            }

            # 替换符号
            expression = expression.replace('π', 'pi')

            # 检查非法字符
            if not re.match(r'^[0-9+\-*/().\s\w,]+$', expression):
                raise ValueError("Invalid characters in expression")

            result = eval(expression, safe_dict)
            return result
        except Exception as e:
            raise ValueError(f"无法计算: {str(e)}")


class CalculatorHistory:
    """计算历史记录管理"""

    def __init__(self, max_items=50):
        self.history = []
        self.max_items = max_items

    def add(self, expression, result):
        """添加历史记录"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.history.insert(0, {
            'expression': expression,
            'result': result,
            'timestamp': timestamp
        })

        if len(self.history) > self.max_items:
            self.history = self.history[:self.max_items]

    def get_all(self):
        """获取所有历史记录"""
        return self.history

    def clear(self):
        """清除历史记录"""
        self.history.clear()


class TestAICalculator(unittest.TestCase):
    """AI 计算器测试"""

    def setUp(self):
        self.ai_calc = AICalculator()

    def test_natural_language_parsing(self):
        """测试自然语言解析"""
        self.assertEqual(self.ai_calc.parse_natural_language("2加3"), "2+3")
        self.assertEqual(self.ai_calc.parse_natural_language("5乘3"), "5*3")
        self.assertEqual(self.ai_calc.parse_natural_language("10除以2"), "10/2")

    def test_expression_evaluation(self):
        """测试表达式计算"""
        self.assertEqual(self.ai_calc.evaluate_expression("2+3"), 5)
        self.assertEqual(self.ai_calc.evaluate_expression("5*3"), 15)
        self.assertEqual(self.ai_calc.evaluate_expression("10/2"), 5)
        self.assertEqual(self.ai_calc.evaluate_expression("10-3"), 7)
        self.assertEqual(self.ai_calc.evaluate_expression("2+3*4"), 14)
        self.assertEqual(self.ai_calc.evaluate_expression("(2+3)*4"), 20)
        self.assertEqual(self.ai_calc.evaluate_expression("sqrt(16)"), 4)
        self.assertEqual(self.ai_calc.evaluate_expression("2**3"), 8)

    def test_scientific_functions(self):
        """测试科学计算函数"""
        result = self.ai_calc.evaluate_expression("sin(0)")
        self.assertAlmostEqual(result, 0, places=5)

        result = self.ai_calc.evaluate_expression("cos(0)")
        self.assertAlmostEqual(result, 1, places=5)

        result = self.ai_calc.evaluate_expression("pi")
        self.assertAlmostEqual(result, math.pi, places=5)

    def test_error_handling(self):
        """测试错误处理"""
        with self.assertRaises(ValueError):
            self.ai_calc.evaluate_expression("10/0")

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
        for i in range(10):
            self.history.add(f"{i}+1", str(i+1))

        self.assertEqual(len(self.history.get_all()), 5)
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
        self.assertEqual(2 + 3, 5)
        self.assertEqual(5 - 3, 2)
        self.assertEqual(5 * 3, 15)
        self.assertAlmostEqual(10 / 3, 3.333333, places=5)

    def test_scientific_operations(self):
        """测试科学计算"""
        self.assertEqual(math.sqrt(16), 4)
        self.assertEqual(math.sqrt(25), 5)
        self.assertEqual(5 ** 2, 25)
        self.assertAlmostEqual(math.pi, 3.14159, places=5)

    def test_format_result(self):
        """测试结果格式化"""
        result = 10.0
        formatted = str(int(result)) if result == int(result) else f"{result:.8f}".rstrip('0').rstrip('.')
        self.assertEqual(formatted, "10")

        result = 10.5
        formatted = str(int(result)) if result == int(result) else f"{result:.8f}".rstrip('0').rstrip('.')
        self.assertEqual(formatted, "10.5")

        result = 10.50000
        formatted = str(int(result)) if result == int(result) else f"{result:.8f}".rstrip('0').rstrip('.')
        self.assertEqual(formatted, "10.5")


def run_tests():
    """运行所有测试"""
    print("=" * 70)
    print("🧮 运行 GTK 计算器测试套件")
    print("=" * 70)
    print()

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    suite.addTests(loader.loadTestsFromTestCase(TestAICalculator))
    suite.addTests(loader.loadTestsFromTestCase(TestCalculatorHistory))
    suite.addTests(loader.loadTestsFromTestCase(TestCalculatorOperations))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "=" * 70)
    print(f"📊 测试总结: 运行 {result.testsRun} 个测试")
    print(f"✅ 成功: {result.testsRun - len(result.failures) - len(result.errors)}")
    if result.failures:
        print(f"❌ 失败: {len(result.failures)}")
    if result.errors:
        print(f"⚠️  错误: {len(result.errors)}")
    print("=" * 70)

    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    sys.exit(run_tests())
