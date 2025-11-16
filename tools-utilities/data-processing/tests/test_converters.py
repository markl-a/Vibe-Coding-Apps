"""
測試 converters 模組
"""

import unittest
import sys
from pathlib import Path

# 將父目錄加入路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib.converters import (
    normalize_date_format,
    normalize_phone_format,
    bytes_to_human_readable,
    flatten_dict,
    unflatten_dict
)


class TestConverters(unittest.TestCase):
    """測試轉換器功能"""

    def test_normalize_date_format(self):
        """測試日期格式轉換"""
        result = normalize_date_format('2024-01-15', '%Y-%m-%d', '%d/%m/%Y')
        self.assertEqual(result, '15/01/2024')

        result = normalize_date_format('01/15/2024', '%m/%d/%Y', '%Y-%m-%d')
        self.assertEqual(result, '2024-01-15')

    def test_bytes_to_human_readable(self):
        """測試位元組轉換"""
        self.assertEqual(bytes_to_human_readable(1024), '1.00 KB')
        self.assertEqual(bytes_to_human_readable(1048576), '1.00 MB')
        self.assertEqual(bytes_to_human_readable(1073741824), '1.00 GB')

    def test_flatten_dict(self):
        """測試字典展平"""
        nested = {
            'a': 1,
            'b': {
                'c': 2,
                'd': {
                    'e': 3
                }
            }
        }

        flattened = flatten_dict(nested)
        self.assertEqual(flattened['a'], 1)
        self.assertEqual(flattened['b.c'], 2)
        self.assertEqual(flattened['b.d.e'], 3)

    def test_unflatten_dict(self):
        """測試字典還原"""
        flattened = {
            'a': 1,
            'b.c': 2,
            'b.d.e': 3
        }

        nested = unflatten_dict(flattened)
        self.assertEqual(nested['a'], 1)
        self.assertEqual(nested['b']['c'], 2)
        self.assertEqual(nested['b']['d']['e'], 3)


if __name__ == '__main__':
    unittest.main()
