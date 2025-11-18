"""
採購訂單管理系統單元測試
"""
import pytest
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from purchase_manager import PurchaseManager


@pytest.fixture
def manager():
    """創建測試用的管理器實例"""
    db_path = 'test_purchase.db'
    # 刪除舊的測試數據庫
    if os.path.exists(db_path):
        os.remove(db_path)

    mgr = PurchaseManager(db_path)
    mgr.initialize_db()

    # 新增測試供應商
    mgr.add_supplier(
        code='S001',
        name='測試供應商1',
        contact_person='張三',
        phone='02-12345678',
        email='supplier1@test.com',
        payment_terms='NET30',
        rating=5
    )
    mgr.add_supplier(
        code='S002',
        name='測試供應商2',
        contact_person='李四',
        phone='02-87654321',
        email='supplier2@test.com',
        payment_terms='NET60',
        rating=4
    )

    yield mgr

    # 測試後清理
    if os.path.exists(db_path):
        os.remove(db_path)


class TestSupplierManagement:
    """供應商管理測試"""

    def test_add_supplier(self, manager):
        """測試新增供應商"""
        success = manager.add_supplier(
            code='S003',
            name='新供應商',
            contact_person='王五',
            phone='03-11111111',
            email='new@test.com',
            payment_terms='NET45',
            rating=3
        )
        assert success is True

        supplier = manager.get_supplier('S003')
        assert supplier is not None
        assert supplier['name'] == '新供應商'
        assert supplier['contact_person'] == '王五'
        assert supplier['rating'] == 3

    def test_add_duplicate_supplier(self, manager):
        """測試新增重複供應商"""
        success = manager.add_supplier(
            code='S001',
            name='重複供應商',
            phone='12345'
        )
        assert success is False

    def test_get_supplier(self, manager):
        """測試獲取供應商資訊"""
        supplier = manager.get_supplier('S001')
        assert supplier is not None
        assert supplier['code'] == 'S001'
        assert supplier['name'] == '測試供應商1'
        assert supplier['contact_person'] == '張三'
        assert supplier['payment_terms'] == 'NET30'

    def test_get_nonexistent_supplier(self, manager):
        """測試獲取不存在的供應商"""
        supplier = manager.get_supplier('S999')
        assert supplier is None

    def test_get_all_suppliers(self, manager):
        """測試獲取所有供應商"""
        suppliers = manager.get_all_suppliers()
        assert len(suppliers) >= 2
        assert any(s['code'] == 'S001' for s in suppliers)
        assert any(s['code'] == 'S002' for s in suppliers)


class TestPurchaseOrderManagement:
    """採購訂單管理測試"""

    def test_create_order(self, manager):
        """測試創建採購訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
            {'product_code': 'P002', 'product_name': '產品2', 'quantity': 5, 'unit_price': 200.0},
        ]

        order_id = manager.create_order(
            supplier_code='S001',
            items=items,
            requester='測試人員',
            delivery_date='2025-12-31',
            notes='測試訂單'
        )

        assert order_id > 0

        order = manager.get_order(order_id)
        assert order is not None
        assert order['supplier_code'] == 'S001'
        assert order['status'] == 'DRAFT'
        assert order['total_amount'] == 2000.0  # 10*100 + 5*200
        assert order['requester'] == '測試人員'
        assert len(order['items']) == 2

    def test_create_order_invalid_supplier(self, manager):
        """測試創建訂單時供應商不存在"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]

        with pytest.raises(ValueError, match="供應商.*不存在"):
            manager.create_order(
                supplier_code='S999',
                items=items
            )

    def test_create_order_empty_items(self, manager):
        """測試創建空訂單"""
        items = []
        order_id = manager.create_order(
            supplier_code='S001',
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
        order_id = manager.create_order('S001', items)

        order = manager.get_order(order_id)
        assert order is not None
        assert order['id'] == order_id
        assert 'supplier_name' in order
        assert order['supplier_name'] == '測試供應商1'
        assert 'items' in order

    def test_get_nonexistent_order(self, manager):
        """測試獲取不存在的訂單"""
        order = manager.get_order(99999)
        assert order is None


class TestOrderApproval:
    """訂單審批測試"""

    def test_approve_order(self, manager):
        """測試審批訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('S001', items)

        success = manager.approve_order(order_id, approver='主管A', notes='已審核通過')
        assert success is True

        order = manager.get_order(order_id)
        assert order['status'] == 'APPROVED'
        assert order['approver'] == '主管A'
        assert order['approved_at'] is not None

    def test_approve_nonexistent_order(self, manager):
        """測試審批不存在的訂單"""
        with pytest.raises(ValueError, match="訂單.*不存在"):
            manager.approve_order(99999, approver='主管A')

    def test_approve_already_approved_order(self, manager):
        """測試重複審批訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('S001', items)
        manager.approve_order(order_id, approver='主管A')

        with pytest.raises(ValueError, match="不允許審批"):
            manager.approve_order(order_id, approver='主管B')

    def test_reject_order(self, manager):
        """測試拒絕訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('S001', items)

        success = manager.reject_order(order_id, approver='主管A', reason='價格太高')
        assert success is True

        order = manager.get_order(order_id)
        assert order['status'] == 'REJECTED'
        assert order['approver'] == '主管A'
        assert '價格太高' in order['notes']

    def test_cancel_order(self, manager):
        """測試取消訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('S001', items)

        success = manager.cancel_order(order_id)
        assert success is True

        order = manager.get_order(order_id)
        assert order['status'] == 'CANCELLED'


class TestGoodsReceipt:
    """收貨管理測試"""

    def test_receive_goods(self, manager):
        """測試收貨"""
        # 創建並審批訂單
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
            {'product_code': 'P002', 'product_name': '產品2', 'quantity': 5, 'unit_price': 200.0},
        ]
        order_id = manager.create_order('S001', items)
        manager.approve_order(order_id, approver='主管A')

        # 部分收貨
        receipt_items = [
            {'product_code': 'P001', 'quantity': 5},
        ]
        receipt_id = manager.receive_goods(
            order_id=order_id,
            items=receipt_items,
            receiver='收貨員A',
            notes='部分收貨'
        )

        assert receipt_id > 0

        # 檢查訂單明細的收貨數量
        order = manager.get_order(order_id)
        p001_item = next((item for item in order['items'] if item['product_code'] == 'P001'), None)
        assert p001_item is not None
        assert p001_item['received_quantity'] == 5
        assert order['status'] == 'APPROVED'  # 未全部收貨

    def test_receive_all_goods(self, manager):
        """測試全部收貨"""
        # 創建並審批訂單
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('S001', items)
        manager.approve_order(order_id, approver='主管A')

        # 全部收貨
        receipt_items = [
            {'product_code': 'P001', 'quantity': 10},
        ]
        manager.receive_goods(
            order_id=order_id,
            items=receipt_items,
            receiver='收貨員A'
        )

        # 檢查訂單狀態
        order = manager.get_order(order_id)
        assert order['status'] == 'COMPLETED'

    def test_receive_goods_multiple_times(self, manager):
        """測試多次收貨"""
        # 創建並審批訂單
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('S001', items)
        manager.approve_order(order_id, approver='主管A')

        # 第一次收貨
        manager.receive_goods(order_id, [{'product_code': 'P001', 'quantity': 3}])

        # 第二次收貨
        manager.receive_goods(order_id, [{'product_code': 'P001', 'quantity': 7}])

        # 檢查訂單狀態
        order = manager.get_order(order_id)
        assert order['status'] == 'COMPLETED'
        p001_item = order['items'][0]
        assert p001_item['received_quantity'] == 10

    def test_receive_goods_unapproved_order(self, manager):
        """測試收貨未審批的訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id = manager.create_order('S001', items)

        with pytest.raises(ValueError, match="APPROVED"):
            manager.receive_goods(
                order_id=order_id,
                items=[{'product_code': 'P001', 'quantity': 5}]
            )

    def test_receive_goods_nonexistent_order(self, manager):
        """測試收貨不存在的訂單"""
        with pytest.raises(ValueError, match="不存在"):
            manager.receive_goods(
                order_id=99999,
                items=[{'product_code': 'P001', 'quantity': 5}]
            )


class TestOrderQueries:
    """訂單查詢測試"""

    def test_get_all_orders(self, manager):
        """測試獲取所有訂單"""
        # 創建多個訂單
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        manager.create_order('S001', items)
        manager.create_order('S002', items)

        orders = manager.get_all_orders()
        assert len(orders) >= 2

    def test_get_orders_by_status(self, manager):
        """測試按狀態查詢訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        order_id1 = manager.create_order('S001', items)
        order_id2 = manager.create_order('S001', items)
        manager.approve_order(order_id2, approver='主管A')

        draft_orders = manager.get_all_orders(status='DRAFT')
        assert len(draft_orders) >= 1
        assert all(o['status'] == 'DRAFT' for o in draft_orders)

        approved_orders = manager.get_all_orders(status='APPROVED')
        assert len(approved_orders) >= 1
        assert all(o['status'] == 'APPROVED' for o in approved_orders)

    def test_get_orders_by_supplier(self, manager):
        """測試按供應商查詢訂單"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]
        manager.create_order('S001', items)
        manager.create_order('S002', items)

        s001_orders = manager.get_all_orders(supplier_code='S001')
        assert len(s001_orders) >= 1
        assert all(o['supplier_code'] == 'S001' for o in s001_orders)


class TestSupplierPerformance:
    """供應商績效測試"""

    def test_supplier_performance(self, manager):
        """測試供應商績效統計"""
        items = [
            {'product_code': 'P001', 'product_name': '產品1', 'quantity': 10, 'unit_price': 100.0},
        ]

        # 創建多個訂單
        order_id1 = manager.create_order('S001', items, requester='測試')
        order_id2 = manager.create_order('S001', items, requester='測試')
        order_id3 = manager.create_order('S001', items, requester='測試')

        # 審批並完成第一個訂單
        manager.approve_order(order_id1, approver='主管A')
        manager.receive_goods(order_id1, [{'product_code': 'P001', 'quantity': 10}])

        # 取消第二個訂單
        manager.cancel_order(order_id2)

        # 獲取績效統計
        stats = manager.get_supplier_performance('S001')

        assert stats['total_orders'] == 3
        assert stats['completed_orders'] >= 1
        assert stats['cancelled_orders'] >= 1
        assert stats['total_amount'] == 3000.0
        assert 0 <= stats['completion_rate'] <= 100

    def test_supplier_performance_no_orders(self, manager):
        """測試沒有訂單的供應商績效"""
        stats = manager.get_supplier_performance('S002')

        assert stats['total_orders'] == 0
        assert stats['completed_orders'] == 0
        assert stats['cancelled_orders'] == 0
        assert stats['total_amount'] == 0
        assert stats['completion_rate'] == 0


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
