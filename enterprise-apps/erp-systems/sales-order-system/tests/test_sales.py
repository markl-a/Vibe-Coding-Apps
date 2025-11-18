"""
銷售訂單管理系統單元測試
"""
import pytest
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from sales_manager import SalesManager


@pytest.fixture
def manager():
    """創建測試用的管理器實例"""
    db_path = 'test_sales.db'
    # 刪除舊的測試數據庫
    if os.path.exists(db_path):
        os.remove(db_path)

    mgr = SalesManager(db_path)
    mgr.initialize_db()

    # 新增測試客戶
    mgr.add_customer(
        code='C001',
        name='測試客戶1',
        contact_person='張三',
        phone='02-12345678',
        email='customer1@test.com',
        credit_limit=100000.0,
        payment_terms='NET30'
    )
    mgr.add_customer(
        code='C002',
        name='測試客戶2',
        contact_person='李四',
        phone='02-87654321',
        email='customer2@test.com',
        credit_limit=50000.0,
        payment_terms='NET60'
    )

    yield mgr

    # 測試後清理
    if os.path.exists(db_path):
        os.remove(db_path)


class TestCustomerManagement:
    """客戶管理測試"""

    def test_add_customer(self, manager):
        """測試新增客戶"""
        success = manager.add_customer(
            code='C003',
            name='新客戶',
            contact_person='王五',
            phone='03-11111111',
            email='new@test.com',
            credit_limit=75000.0,
            payment_terms='NET45'
        )
        assert success is True

        customer = manager.get_customer('C003')
        assert customer is not None
        assert customer['name'] == '新客戶'
        assert customer['contact_person'] == '王五'
        assert customer['credit_limit'] == 75000.0

    def test_add_duplicate_customer(self, manager):
        """測試新增重複客戶"""
        success = manager.add_customer(
            code='C001',
            name='重複客戶',
            phone='12345'
        )
        assert success is False

    def test_get_customer(self, manager):
        """測試獲取客戶資訊"""
        customer = manager.get_customer('C001')
        assert customer is not None
        assert customer['code'] == 'C001'
        assert customer['name'] == '測試客戶1'
        assert customer['contact_person'] == '張三'
        assert customer['payment_terms'] == 'NET30'

    def test_get_nonexistent_customer(self, manager):
        """測試獲取不存在的客戶"""
        customer = manager.get_customer('C999')
        assert customer is None

    def test_get_all_customers(self, manager):
        """測試獲取所有客戶"""
        customers = manager.get_all_customers()
        assert len(customers) >= 2
        assert any(c['code'] == 'C001' for c in customers)
        assert any(c['code'] == 'C002' for c in customers)


class TestSalesOrderManagement:
    """銷售訂單管理測試"""

    def test_create_order(self, manager):
        """測試創建銷售訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
            {'product_code': 'P002', 'product_name': '產品2', 'quantity': 5, 'unit_price': 200.0},
        ]

        order_id = manager.create_order(
            customer_code='C001',
            items=items,
            sales_person='業務員A',
            delivery_address='台北市信義區',
            notes='測試訂單'
        )

        assert order_id > 0

        order = manager.get_order(order_id)
        assert order is not None
        assert order['customer_code'] == 'C001'
        assert order['status'] == 'DRAFT'
        assert order['total_amount'] == 2000.0  # 10*100 + 5*200
        assert order['sales_person'] == '業務員A'
        assert len(order['items']) == 2

    def test_create_order_invalid_customer(self, manager):
        """測試創建訂單時客戶不存在"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]

        with pytest.raises(ValueError, match="客戶.*不存在"):
            manager.create_order(
                customer_code='C999',
                items=items
            )

    def test_create_order_empty_items(self, manager):
        """測試創建空訂單"""
        items = []
        order_id = manager.create_order(
            customer_code='C001',
            items=items
        )
        assert order_id > 0

        order = manager.get_order(order_id)
        assert order['total_amount'] == 0
        assert len(order['items']) == 0

    def test_get_order(self, manager):
        """測試獲取訂單詳情"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('C001', items)

        order = manager.get_order(order_id)
        assert order is not None
        assert order['id'] == order_id
        assert 'customer_name' in order
        assert order['customer_name'] == '測試客戶1'
        assert 'items' in order

    def test_get_nonexistent_order(self, manager):
        """測試獲取不存在的訂單"""
        order = manager.get_order(99999)
        assert order is None


class TestOrderConfirmation:
    """訂單確認測試"""

    def test_confirm_order(self, manager):
        """測試確認訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('C001', items)

        success = manager.confirm_order(order_id)
        assert success is True

        order = manager.get_order(order_id)
        assert order['status'] == 'CONFIRMED'

    def test_confirm_nonexistent_order(self, manager):
        """測試確認不存在的訂單"""
        with pytest.raises(ValueError, match="訂單.*不存在"):
            manager.confirm_order(99999)

    def test_confirm_already_confirmed_order(self, manager):
        """測試重複確認訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('C001', items)
        manager.confirm_order(order_id)

        with pytest.raises(ValueError, match="不允許確認"):
            manager.confirm_order(order_id)

    def test_cancel_order(self, manager):
        """測試取消訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('C001', items)

        success = manager.cancel_order(order_id)
        assert success is True

        order = manager.get_order(order_id)
        assert order['status'] == 'CANCELLED'


class TestShipment:
    """出貨管理測試"""

    def test_ship_goods(self, manager):
        """測試出貨"""
        # 創建並確認訂單
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
            {'product_code': 'P002', 'product_name': '產品2', 'quantity': 5, 'unit_price': 200.0},
        ]
        order_id = manager.create_order('C001', items)
        manager.confirm_order(order_id)

        # 部分出貨
        shipment_items = [
            {'product_code': 'P001', 'quantity': 5},
        ]
        shipment_id = manager.ship_goods(
            order_id=order_id,
            items=shipment_items,
            tracking_no='TRK001',
            shipper='新竹物流',
            notes='部分出貨'
        )

        assert shipment_id > 0

        # 檢查訂單明細的出貨數量
        order = manager.get_order(order_id)
        p001_item = next((item for item in order['items'] if item['product_code'] == 'P001'), None)
        assert p001_item is not None
        assert p001_item['shipped_quantity'] == 5
        assert order['status'] == 'SHIPPED'

    def test_ship_all_goods(self, manager):
        """測試全部出貨並收款後訂單完成"""
        # 創建並確認訂單
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('C001', items)
        manager.confirm_order(order_id)

        # 全部出貨
        shipment_items = [
            {'product_code': 'P001', 'quantity': 10},
        ]
        manager.ship_goods(
            order_id=order_id,
            items=shipment_items
        )

        # 全額收款
        manager.record_payment(order_id, 1000.0)

        # 檢查訂單狀態
        order = manager.get_order(order_id)
        assert order['status'] == 'COMPLETED'

    def test_ship_goods_multiple_times(self, manager):
        """測試多次出貨"""
        # 創建並確認訂單
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('C001', items)
        manager.confirm_order(order_id)

        # 第一次出貨
        manager.ship_goods(order_id, [{'product_code': 'P001', 'quantity': 3}])

        # 第二次出貨
        manager.ship_goods(order_id, [{'product_code': 'P001', 'quantity': 7}])

        # 檢查訂單狀態
        order = manager.get_order(order_id)
        p001_item = order['items'][0]
        assert p001_item['shipped_quantity'] == 10

    def test_ship_goods_unconfirmed_order(self, manager):
        """測試出貨未確認的訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('C001', items)

        with pytest.raises(ValueError, match="CONFIRMED"):
            manager.ship_goods(
                order_id=order_id,
                items=[{'product_code': 'P001', 'quantity': 5}]
            )

    def test_ship_goods_nonexistent_order(self, manager):
        """測試出貨不存在的訂單"""
        with pytest.raises(ValueError, match="不存在"):
            manager.ship_goods(
                order_id=99999,
                items=[{'product_code': 'P001', 'quantity': 5}]
            )


class TestPayment:
    """收款管理測試"""

    def test_record_payment(self, manager):
        """測試記錄收款"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('C001', items)

        payment_id = manager.record_payment(
            order_id=order_id,
            amount=500.0,
            payment_method='信用卡',
            reference_no='CC001',
            notes='部分收款'
        )

        assert payment_id > 0

        # 檢查訂單已收款金額
        order = manager.get_order(order_id)
        assert order['paid_amount'] == 500.0

    def test_record_full_payment(self, manager):
        """測試全額收款"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('C001', items)
        manager.confirm_order(order_id)

        # 出貨
        manager.ship_goods(order_id, [{'product_code': 'P001', 'quantity': 10}])

        # 全額收款
        manager.record_payment(order_id, 1000.0)

        # 檢查訂單狀態
        order = manager.get_order(order_id)
        assert order['status'] == 'COMPLETED'
        assert order['paid_amount'] == order['total_amount']

    def test_record_payment_multiple_times(self, manager):
        """測試多次收款"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('C001', items)

        # 第一次收款
        manager.record_payment(order_id, 300.0)

        # 第二次收款
        manager.record_payment(order_id, 700.0)

        # 檢查訂單已收款金額
        order = manager.get_order(order_id)
        assert order['paid_amount'] == 1000.0


class TestOrderQueries:
    """訂單查詢測試"""

    def test_get_all_orders(self, manager):
        """測試獲取所有訂單"""
        # 創建多個訂單
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        manager.create_order('C001', items)
        manager.create_order('C002', items)

        orders = manager.get_all_orders()
        assert len(orders) >= 2

    def test_get_orders_by_status(self, manager):
        """測試按狀態查詢訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id1 = manager.create_order('C001', items)
        order_id2 = manager.create_order('C001', items)
        manager.confirm_order(order_id2)

        draft_orders = manager.get_all_orders(status='DRAFT')
        assert len(draft_orders) >= 1
        assert all(o['status'] == 'DRAFT' for o in draft_orders)

        confirmed_orders = manager.get_all_orders(status='CONFIRMED')
        assert len(confirmed_orders) >= 1
        assert all(o['status'] == 'CONFIRMED' for o in confirmed_orders)

    def test_get_orders_by_customer(self, manager):
        """測試按客戶查詢訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        manager.create_order('C001', items)
        manager.create_order('C002', items)

        c001_orders = manager.get_all_orders(customer_code='C001')
        assert len(c001_orders) >= 1
        assert all(o['customer_code'] == 'C001' for o in c001_orders)


class TestCustomerStats:
    """客戶統計測試"""

    def test_customer_stats(self, manager):
        """測試客戶統計"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]

        # 創建多個訂單
        order_id1 = manager.create_order('C001', items)
        order_id2 = manager.create_order('C001', items)
        order_id3 = manager.create_order('C001', items)

        # 確認並完成第一個訂單
        manager.confirm_order(order_id1)
        manager.ship_goods(order_id1, [{'product_code': 'P001', 'quantity': 10}])
        manager.record_payment(order_id1, 1000.0)

        # 部分收款第二個訂單
        manager.record_payment(order_id2, 500.0)

        # 獲取客戶統計
        stats = manager.get_customer_stats('C001')

        assert stats['total_orders'] == 3
        assert stats['completed_orders'] >= 1
        assert stats['total_amount'] == 3000.0
        assert stats['paid_amount'] == 1500.0
        assert stats['outstanding_amount'] == 1500.0

    def test_customer_stats_no_orders(self, manager):
        """測試沒有訂單的客戶統計"""
        stats = manager.get_customer_stats('C002')

        assert stats['total_orders'] == 0
        assert stats['completed_orders'] == 0
        assert stats['total_amount'] == 0
        assert stats['paid_amount'] == 0
        assert stats['outstanding_amount'] == 0


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
