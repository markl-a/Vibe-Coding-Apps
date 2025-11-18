#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
測試供應商整合模組
"""

import unittest
import sys
from pathlib import Path

# 添加 src 到路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.supplier_integration import (
    SupplierIntegration,
    ComponentPrice,
    DigiKeyAPI,
    MouserAPI,
    LCSCAPI
)


class TestComponentPrice(unittest.TestCase):
    """元件價格測試"""

    def setUp(self):
        """設定測試"""
        self.price = ComponentPrice(
            supplier="Test",
            sku="TEST-001",
            mpn="TEST-PART",
            manufacturer="Test Mfr",
            description="Test component",
            stock=1000,
            moq=1,
            pricing={
                1: 1.00,
                10: 0.90,
                100: 0.80,
                1000: 0.70
            }
        )

    def test_get_unit_price(self):
        """測試獲取單價"""
        self.assertEqual(self.price.get_unit_price(1), 1.00)
        self.assertEqual(self.price.get_unit_price(10), 0.90)
        self.assertEqual(self.price.get_unit_price(50), 0.90)  # 使用 10 的價格
        self.assertEqual(self.price.get_unit_price(100), 0.80)
        self.assertEqual(self.price.get_unit_price(1000), 0.70)
        self.assertEqual(self.price.get_unit_price(2000), 0.70)  # 使用 1000 的價格

    def test_get_total_price(self):
        """測試獲取總價"""
        self.assertEqual(self.price.get_total_price(1), 1.00)
        self.assertEqual(self.price.get_total_price(10), 9.00)
        self.assertEqual(self.price.get_total_price(100), 80.00)


class TestSupplierAPIs(unittest.TestCase):
    """供應商 API 測試"""

    def test_digikey_search(self):
        """測試 Digi-Key 搜尋"""
        api = DigiKeyAPI()
        results = api.search("TEST-MPN", "Test Manufacturer")

        self.assertGreater(len(results), 0)
        self.assertEqual(results[0].supplier, "Digi-Key")
        self.assertEqual(results[0].mpn, "TEST-MPN")

    def test_mouser_search(self):
        """測試 Mouser 搜尋"""
        api = MouserAPI()
        results = api.search("TEST-MPN", "Test Manufacturer")

        self.assertGreater(len(results), 0)
        self.assertEqual(results[0].supplier, "Mouser")
        self.assertEqual(results[0].mpn, "TEST-MPN")

    def test_lcsc_search(self):
        """測試 LCSC 搜尋"""
        api = LCSCAPI()
        results = api.search("TEST-MPN", "Test Manufacturer")

        self.assertGreater(len(results), 0)
        self.assertEqual(results[0].supplier, "LCSC")
        self.assertEqual(results[0].mpn, "TEST-MPN")


class TestSupplierIntegration(unittest.TestCase):
    """供應商整合測試"""

    def setUp(self):
        """設定測試"""
        self.integration = SupplierIntegration(suppliers=['digikey', 'mouser', 'lcsc'])

    def test_init(self):
        """測試初始化"""
        self.assertIn('digikey', self.integration.apis)
        self.assertIn('mouser', self.integration.apis)
        self.assertIn('lcsc', self.integration.apis)

    def test_search_component(self):
        """測試搜尋元件"""
        results = self.integration.search_component('TEST-MPN', 'Test Manufacturer')

        self.assertIn('digikey', results)
        self.assertIn('mouser', results)
        self.assertIn('lcsc', results)

        for supplier, prices in results.items():
            if prices:
                self.assertIsInstance(prices[0], ComponentPrice)

    def test_compare_prices(self):
        """測試比較價格"""
        comparisons = self.integration.compare_prices('TEST-MPN', 'Test Manufacturer', quantity=10)

        self.assertGreater(len(comparisons), 0)

        # 檢查是否按價格排序
        for i in range(len(comparisons) - 1):
            self.assertLessEqual(comparisons[i][2], comparisons[i+1][2])

    def test_estimate_bom_cost(self):
        """測試估算 BOM 成本"""
        bom = [
            {'mpn': 'PART-001', 'manufacturer': 'Mfr1', 'quantity': 1},
            {'mpn': 'PART-002', 'manufacturer': 'Mfr2', 'quantity': 10}
        ]

        estimate = self.integration.estimate_bom_cost(bom, quantity=100)

        self.assertEqual(estimate['board_quantity'], 100)
        self.assertGreater(estimate['total_cost'], 0)
        self.assertGreater(estimate['cost_per_board'], 0)
        self.assertGreaterEqual(estimate['available_components'], 0)
        self.assertIn('components', estimate)
        self.assertIn('currency', estimate)


if __name__ == '__main__':
    unittest.main()
