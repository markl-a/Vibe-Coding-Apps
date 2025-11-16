"""
銷售訂單系統基本使用範例
"""
import sys
sys.path.insert(0, '../src')

from sales_manager import SalesManager


def main():
    # 創建管理器
    manager = SalesManager('demo_sales.db')

    print("初始化數據庫...")
    manager.initialize_db()

    # 新增客戶
    print("\n新增客戶...")
    manager.add_customer('C001', '優質客戶公司', '陳經理', '02-12345678',
                        'chen@customer.com', '台北市中山區', 500000, '月結30天')
    manager.add_customer('C002', '長期合作夥伴', '林總監', '03-9876543',
                        'lin@partner.com', '新竹市東區', 1000000, '月結45天')

    # 創建銷售訂單
    print("\n創建銷售訂單...")
    order_items = [
        {'product_code': 'P001', 'product_name': '筆記本電腦', 'quantity': 20, 'unit_price': 28000},
        {'product_code': 'P002', 'product_name': '無線滑鼠', 'quantity': 100, 'unit_price': 600}
    ]

    order_id = manager.create_order(
        'C001',
        order_items,
        sales_person='sales01',
        delivery_address='台北市中山區民生東路100號',
        notes='Q4銷售訂單'
    )
    print(f"訂單創建成功，訂單ID: {order_id}")

    # 查詢訂單
    print("\n查詢訂單詳情...")
    order = manager.get_order(order_id)
    print(f"訂單編號: {order['order_no']}")
    print(f"客戶: {order['customer_name']}")
    print(f"訂單總額: ${order['total_amount']:,.0f}")
    print(f"狀態: {order['status']}")
    print(f"明細:")
    for item in order['items']:
        print(f"  - {item['product_name']}: {item['quantity']} x ${item['unit_price']:,.0f}")

    # 確認訂單
    print("\n確認訂單...")
    manager.confirm_order(order_id)
    order = manager.get_order(order_id)
    print(f"訂單狀態: {order['status']}")

    # 記錄出貨
    print("\n記錄出貨...")
    shipment_items = [
        {'product_code': 'P001', 'quantity': 20},
        {'product_code': 'P002', 'quantity': 100}
    ]
    shipment_id = manager.ship_goods(
        order_id, shipment_items,
        tracking_no='TW1234567890',
        shipper='warehouse01'
    )
    print(f"出貨記錄ID: {shipment_id}")

    # 記錄收款
    print("\n記錄收款...")
    payment_id = manager.record_payment(
        order_id,
        620000,
        payment_method='BANK_TRANSFER',
        reference_no='TXN20240101001'
    )
    print(f"收款記錄ID: {payment_id}")

    # 查詢訂單狀態
    order = manager.get_order(order_id)
    print(f"訂單狀態: {order['status']}")
    print(f"已收款: ${order['paid_amount']:,.0f}")

    # 客戶統計
    print("\n客戶統計...")
    stats = manager.get_customer_stats('C001')
    print(f"總訂單數: {stats['total_orders']}")
    print(f"已完成: {stats['completed_orders']}")
    print(f"總金額: ${stats['total_amount']:,.0f}")
    print(f"已收款: ${stats['paid_amount']:,.0f}")
    print(f"未收款: ${stats['outstanding_amount']:,.0f}")

    print("\n✓ 範例執行完成！")


if __name__ == '__main__':
    main()
