"""
庫存管理系統單元測試
"""
import pytest
import os
import sys
sys.path.insert(0, '../src')

from inventory_manager import InventoryManager


@pytest.fixture
def manager():
    """創建測試用的管理器實例"""
    db_path = 'test_inventory.db'
    # 刪除舊的測試數據庫
    if os.path.exists(db_path):
        os.remove(db_path)

    mgr = InventoryManager(db_path)
    mgr.initialize_db()

    # 新增測試數據
    mgr.add_product('P001', '測試產品1', '個', min_quantity=10)
    mgr.add_product('P002', '測試產品2', '箱', min_quantity=5)
    mgr.add_warehouse('WH001', '測試倉庫1', '台北')
    mgr.add_warehouse('WH002', '測試倉庫2', '新北')

    yield mgr

    # 測試後清理
    if os.path.exists(db_path):
        os.remove(db_path)


class TestProductManagement:
    """產品管理測試"""

    def test_add_product(self, manager):
        """測試新增產品"""
        success = manager.add_product('P003', '新產品', '台', 15)
        assert success is True

        product = manager.get_product('P003')
        assert product['name'] == '新產品'
        assert product['unit'] == '台'
        assert product['min_quantity'] == 15

    def test_add_duplicate_product(self, manager):
        """測試新增重複產品"""
        success = manager.add_product('P001', '重複產品', '個')
        assert success is False

    def test_get_product(self, manager):
        """測試獲取產品"""
        product = manager.get_product('P001')
        assert product is not None
        assert product['code'] == 'P001'
        assert product['name'] == '測試產品1'

    def test_get_all_products(self, manager):
        """測試獲取所有產品"""
        products = manager.get_all_products()
        assert len(products) >= 2


class TestWarehouseManagement:
    """倉庫管理測試"""

    def test_add_warehouse(self, manager):
        """測試新增倉庫"""
        success = manager.add_warehouse('WH003', '新倉庫', '桃園')
        assert success is True

        warehouse = manager.get_warehouse('WH003')
        assert warehouse['name'] == '新倉庫'
        assert warehouse['location'] == '桃園'

    def test_add_duplicate_warehouse(self, manager):
        """測試新增重複倉庫"""
        success = manager.add_warehouse('WH001', '重複倉庫', '台中')
        assert success is False

    def test_get_all_warehouses(self, manager):
        """測試獲取所有倉庫"""
        warehouses = manager.get_all_warehouses()
        assert len(warehouses) >= 2


class TestStockOperations:
    """庫存操作測試"""

    def test_stock_in(self, manager):
        """測試入庫"""
        success = manager.stock_in('P001', 100, 'WH001', batch_no='B001')
        assert success is True

        stock = manager.get_stock('P001', 'WH001')
        assert stock['quantity'] == 100

    def test_stock_in_multiple(self, manager):
        """測試多次入庫"""
        manager.stock_in('P001', 50, 'WH001')
        manager.stock_in('P001', 30, 'WH001')

        stock = manager.get_stock('P001', 'WH001')
        assert stock['quantity'] == 80

    def test_stock_out(self, manager):
        """測試出庫"""
        manager.stock_in('P001', 100, 'WH001')
        success = manager.stock_out('P001', 30, 'WH001', reference='SO-001')
        assert success is True

        stock = manager.get_stock('P001', 'WH001')
        assert stock['quantity'] == 70

    def test_stock_out_insufficient(self, manager):
        """測試庫存不足時出庫"""
        manager.stock_in('P001', 50, 'WH001')

        with pytest.raises(ValueError, match="庫存不足"):
            manager.stock_out('P001', 100, 'WH001')

    def test_stock_out_no_stock(self, manager):
        """測試無庫存時出庫"""
        with pytest.raises(ValueError, match="無庫存"):
            manager.stock_out('P001', 10, 'WH001')

    def test_invalid_quantity(self, manager):
        """測試無效數量"""
        with pytest.raises(ValueError):
            manager.stock_in('P001', 0, 'WH001')

        with pytest.raises(ValueError):
            manager.stock_out('P001', -10, 'WH001')


class TestStockQueries:
    """庫存查詢測試"""

    def test_get_stock(self, manager):
        """測試獲取庫存"""
        manager.stock_in('P001', 100, 'WH001')
        stock = manager.get_stock('P001', 'WH001')

        assert stock['quantity'] == 100
        assert stock['product_code'] == 'P001'
        assert stock['warehouse_code'] == 'WH001'

    def test_get_stock_multiple_warehouses(self, manager):
        """測試獲取多倉庫庫存"""
        manager.stock_in('P001', 100, 'WH001')
        manager.stock_in('P001', 50, 'WH002')

        stocks = manager.get_stock('P001')
        assert len(stocks) == 2

    def test_get_all_stock(self, manager):
        """測試獲取所有庫存"""
        manager.stock_in('P001', 100, 'WH001')
        manager.stock_in('P002', 50, 'WH002')

        stocks = manager.get_all_stock()
        assert len(stocks) >= 2

    def test_get_low_stock_products(self, manager):
        """測試獲取低庫存產品"""
        # P001 最低庫存 10，入庫 5
        manager.stock_in('P001', 5, 'WH001')

        low_stocks = manager.get_low_stock_products()
        assert len(low_stocks) > 0


class TestTransactions:
    """異動記錄測試"""

    def test_get_transactions(self, manager):
        """測試獲取異動記錄"""
        manager.stock_in('P001', 100, 'WH001')
        manager.stock_out('P001', 30, 'WH001')

        transactions = manager.get_transactions(product_code='P001')
        assert len(transactions) == 2

    def test_get_transactions_by_type(self, manager):
        """測試按類型獲取異動記錄"""
        manager.stock_in('P001', 100, 'WH001')
        manager.stock_out('P001', 30, 'WH001')

        in_trans = manager.get_transactions(transaction_type='IN')
        assert all(t['transaction_type'] == 'IN' for t in in_trans)

        out_trans = manager.get_transactions(transaction_type='OUT')
        assert all(t['transaction_type'] == 'OUT' for t in out_trans)


class TestSummary:
    """統計測試"""

    def test_get_summary(self, manager):
        """測試獲取統計摘要"""
        manager.stock_in('P001', 100, 'WH001')

        summary = manager.get_stock_summary()
        assert summary['total_products'] >= 2
        assert summary['total_warehouses'] >= 2
        assert summary['total_stock_items'] >= 1
        assert summary['total_transactions'] >= 1


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
