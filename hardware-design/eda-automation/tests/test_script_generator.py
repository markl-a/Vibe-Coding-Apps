#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
測試腳本生成器
"""

import unittest
import sys
import os
from pathlib import Path

# 添加 src 到路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.script_generator import ScriptGenerator, GeneratedScript


class TestScriptGenerator(unittest.TestCase):
    """腳本生成器測試"""

    def setUp(self):
        """設定測試"""
        self.gen = ScriptGenerator(tool="kicad", model="mock")

    def test_init(self):
        """測試初始化"""
        self.assertEqual(self.gen.tool, "kicad")
        self.assertEqual(self.gen.model, "mock")

    def test_generate_mock_script(self):
        """測試生成模擬腳本"""
        task = "測試任務：將所有電阻排成一列"
        script = self.gen.generate(task, validate=False)

        self.assertIsInstance(script, GeneratedScript)
        self.assertIn("import pcbnew", script.code)
        self.assertIn("def main", script.code)

    def test_script_validation(self):
        """測試腳本驗證"""
        # 有效腳本
        valid_code = """
import pcbnew

def main():
    board = pcbnew.GetBoard()
    print("Test")

if __name__ == "__main__":
    main()
"""
        script = GeneratedScript(valid_code, "kicad")
        is_valid, errors = script.validate()
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)

        # 無效腳本（語法錯誤）
        invalid_code = "import pcbnew\ndef main(\n    pass"
        script = GeneratedScript(invalid_code, "kicad")
        is_valid, errors = script.validate()
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)

    def test_unsupported_tool(self):
        """測試不支援的工具"""
        with self.assertRaises(ValueError):
            ScriptGenerator(tool="invalid_tool")


class TestGeneratedScript(unittest.TestCase):
    """生成腳本測試"""

    def setUp(self):
        """設定測試"""
        self.code = """
import pcbnew

def main():
    board = pcbnew.GetBoard()
    print("Test script")
    return True

if __name__ == "__main__":
    main()
"""
        self.script = GeneratedScript(
            code=self.code,
            tool="kicad",
            task="Test task",
            model="mock"
        )

    def test_get_info(self):
        """測試獲取資訊"""
        info = self.script.get_info()
        self.assertEqual(info['tool'], 'kicad')
        self.assertEqual(info['model'], 'mock')
        self.assertEqual(info['task'], 'Test task')
        self.assertGreater(info['lines'], 0)
        self.assertGreater(info['size'], 0)

    def test_save(self):
        """測試保存腳本"""
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.py') as f:
            temp_file = f.name

        try:
            self.script.save(temp_file)
            self.assertTrue(os.path.exists(temp_file))

            with open(temp_file, 'r') as f:
                content = f.read()
                self.assertEqual(content, self.code)

        finally:
            if os.path.exists(temp_file):
                os.unlink(temp_file)


if __name__ == '__main__':
    unittest.main()
