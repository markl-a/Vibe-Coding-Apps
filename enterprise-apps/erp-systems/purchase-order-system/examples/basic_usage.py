"""
採購訂單系統基本使用範例
"""
import sys
sys.path.insert(0, '../src')

from purchase_manager import PurchaseManager


def main():
    # 創建管理器
    manager = PurchaseManager('demo_purchase.db')

    print("初始化數據庫...")
    manager.initialize_db()

    # 新增供應商
    print("\n新增供應商...")
    manager.add_supplier('S001', 'ABC電子公司', '張經理', '02-12345678',
                        'zhang@abc.com', '台北市信義區', '月結30天', 5)
    manager.add_supplier('S002', 'XYZ電腦公司', '李經理', '02-87654321',
                        'li@xyz.com', '新北市板橋區', '月結45天', 4)

    # 創建採購訂單
    print("\n創建採購訂單...")
    order_items = [
        {'product_code': 'P001', 'product_name': '筆記本電腦', 'quantity': 10, 'unit_price': 25000},
        {'product_code': 'P002', 'product_name': '無線滑鼠', 'quantity': 50, 'unit_price': 500}
    ]

    order_id = manager.create_order(
        'S001',
        order_items,
        requester='user01',
        notes='Q4採購需求'
    )
    print(f"訂單創建成功，訂單ID: {order_id}")

    # 查詢訂單
    print("\n查詢訂單詳情...")
    order = manager.get_order(order_id)
    print(f"訂單編號: {order['order_no']}")
    print(f"供應商: {order['supplier_name']}")
    print(f"訂單總額: ${order['total_amount']:,.0f}")
    print(f"狀態: {order['status']}")
    print(f"明細:")
    for item in order['items']:
        print(f"  - {item['product_name']}: {item['quantity']} x ${item['unit_price']:,.0f}")

    # 審批訂單
    print("\n審批訂單...")
    manager.approve_order(order_id, 'manager01', '批准採購')
    order = manager.get_order(order_id)
    print(f"訂單狀態: {order['status']}")

    # 記錄收貨
    print("\n記錄收貨...")
    receipt_items = [
        {'product_code': 'P001', 'quantity': 10},
        {'product_code': 'P002', 'quantity': 50}
    ]
    receipt_id = manager.receive_goods(order_id, receipt_items, receiver='warehouse01')
    print(f"收貨記錄ID: {receipt_id}")

    # 查詢訂單狀態
    order = manager.get_order(order_id)
    print(f"訂單狀態: {order['status']}")

    # 供應商績效
    print("\n供應商績效...")
    performance = manager.get_supplier_performance('S001')
    print(f"總訂單數: {performance['total_orders']}")
    print(f"已完成: {performance['completed_orders']}")
    print(f"完成率: {performance['completion_rate']}%")
    print(f"總金額: ${performance['total_amount']:,.0f}")

    print("\n✓ 範例執行完成！")


if __name__ == '__main__':
    main()
