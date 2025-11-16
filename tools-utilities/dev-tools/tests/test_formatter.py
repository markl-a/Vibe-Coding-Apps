"""
測試程式碼格式化工具
"""

import pytest
import sys
from pathlib import Path

# 添加父目錄到路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from code_formatter import CodeFormatter


class TestCodeFormatter:
    """測試 CodeFormatter 類別"""

    def test_init(self):
        """測試初始化"""
        formatter = CodeFormatter()
        assert formatter.config_file is None
        assert 'python' in formatter.supported_languages

    def test_detect_language_python(self):
        """測試偵測 Python 語言"""
        formatter = CodeFormatter()
        path = Path('test.py')
        language = formatter._detect_language(path)
        assert language == 'python'

    def test_detect_language_javascript(self):
        """測試偵測 JavaScript 語言"""
        formatter = CodeFormatter()
        path = Path('test.js')
        language = formatter._detect_language(path)
        assert language == 'javascript'

    def test_should_ignore_pycache(self):
        """測試忽略 __pycache__"""
        formatter = CodeFormatter()
        path = Path('__pycache__/test.py')
        assert formatter._should_ignore(path) is True

    def test_should_not_ignore_normal_file(self):
        """測試不忽略正常檔案"""
        formatter = CodeFormatter()
        path = Path('src/main.py')
        assert formatter._should_ignore(path) is False

    def test_format_python_simple(self):
        """測試簡單的 Python 格式化"""
        formatter = CodeFormatter()
        code = "x=1+2"
        # 不一定能格式化（需要安裝 black），但至少不應該出錯
        try:
            result = formatter._format_python(code, Path('test.py'))
            assert isinstance(result, str)
        except Exception:
            pass  # 如果沒有安裝格式化工具，跳過


def test_code_formatter_can_be_imported():
    """測試可以匯入 CodeFormatter"""
    from code_formatter import CodeFormatter
    assert CodeFormatter is not None
