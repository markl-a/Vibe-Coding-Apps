"""
測試 validators 模組
"""

import unittest
import sys
from pathlib import Path

# 將父目錄加入路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib.validators import (
    validate_email,
    validate_phone,
    validate_url,
    validate_date,
    validate_ip_address,
    validate_not_null,
    validate_in_range
)


class TestValidators(unittest.TestCase):
    """測試驗證器功能"""

    def test_validate_email(self):
        """測試郵箱驗證"""
        self.assertTrue(validate_email('test@example.com'))
        self.assertTrue(validate_email('user.name@domain.co.uk'))
        self.assertFalse(validate_email('invalid-email'))
        self.assertFalse(validate_email('@example.com'))
        self.assertFalse(validate_email('test@'))

    def test_validate_phone(self):
        """測試電話驗證"""
        self.assertTrue(validate_phone('0912345678', 'tw'))
        self.assertTrue(validate_phone('02-12345678', 'tw'))
        self.assertFalse(validate_phone('12345', 'tw'))

    def test_validate_url(self):
        """測試 URL 驗證"""
        self.assertTrue(validate_url('https://example.com'))
        self.assertTrue(validate_url('http://example.com/path'))
        self.assertFalse(validate_url('not-a-url'))
        self.assertFalse(validate_url('ftp://example.com'))

    def test_validate_date(self):
        """測試日期驗證"""
        self.assertTrue(validate_date('2024-01-01'))
        self.assertTrue(validate_date('01/01/2024', '%m/%d/%Y'))
        self.assertFalse(validate_date('2024-13-01'))
        self.assertFalse(validate_date('not-a-date'))

    def test_validate_ip_address(self):
        """測試 IP 驗證"""
        self.assertTrue(validate_ip_address('192.168.1.1'))
        self.assertTrue(validate_ip_address('8.8.8.8'))
        self.assertFalse(validate_ip_address('256.1.1.1'))
        self.assertFalse(validate_ip_address('192.168.1'))

    def test_validate_not_null(self):
        """測試非空驗證"""
        self.assertTrue(validate_not_null('value'))
        self.assertTrue(validate_not_null(123))
        self.assertFalse(validate_not_null(None))
        self.assertFalse(validate_not_null(''))
        self.assertFalse(validate_not_null('   '))

    def test_validate_in_range(self):
        """測試範圍驗證"""
        self.assertTrue(validate_in_range(5, 1, 10))
        self.assertTrue(validate_in_range(1, 1, 10))
        self.assertTrue(validate_in_range(10, 1, 10))
        self.assertFalse(validate_in_range(0, 1, 10))
        self.assertFalse(validate_in_range(11, 1, 10))


if __name__ == '__main__':
    unittest.main()
