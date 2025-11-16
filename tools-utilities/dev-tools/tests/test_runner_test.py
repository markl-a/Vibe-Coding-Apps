"""
測試測試執行器
"""

import pytest
import sys
from pathlib import Path

# 添加父目錄到路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from test_runner import TestRunner


class TestTestRunner:
    """測試 TestRunner 類別"""

    def test_init(self):
        """測試初始化"""
        runner = TestRunner()
        assert runner.test_dir == Path('tests')

    def test_init_custom_dir(self):
        """測試自訂測試目錄"""
        runner = TestRunner(test_dir='custom_tests')
        assert runner.test_dir == Path('custom_tests')

    def test_should_ignore_pycache(self):
        """測試忽略 __pycache__"""
        runner = TestRunner()
        path = Path('tests/__pycache__/test.py')
        assert runner._should_ignore(path) is True

    def test_should_ignore_init(self):
        """測試忽略 __init__.py"""
        runner = TestRunner()
        path = Path('tests/__init__.py')
        assert runner._should_ignore(path) is True

    def test_discover_tests_no_dir(self):
        """測試不存在的測試目錄"""
        runner = TestRunner(test_dir='nonexistent')
        tests = runner.discover_tests()
        assert tests == []


def test_test_runner_can_be_imported():
    """測試可以匯入 TestRunner"""
    from test_runner import TestRunner
    assert TestRunner is not None
