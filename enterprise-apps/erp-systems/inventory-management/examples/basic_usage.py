"""
基本使用範例
"""
import sys
sys.path.insert(0, '../src')

from inventory_manager import InventoryManager


def main():
    # 創建管理器實例
    manager = InventoryManager('demo_inventory.db')

    # 初始化數據庫
    print("初始化數據庫...")
    manager.initialize_db()

    # 新增產品
    print("\n新增產品...")
    manager.add_product('P001', '筆記本電腦', '台', min_quantity=10)
    manager.add_product('P002', '無線滑鼠', '個', min_quantity=20)
    manager.add_product('P003', '機械鍵盤', '個', min_quantity=15)

    # 新增倉庫
    print("新增倉庫...")
    manager.add_warehouse('WH001', '主倉庫', '台北市信義區')
    manager.add_warehouse('WH002', '備用倉庫', '新北市板橋區')

    # 入庫操作
    print("\n執行入庫操作...")
    manager.stock_in('P001', 50, 'WH001', batch_no='B20240101', operator='張三')
    manager.stock_in('P002', 100, 'WH001', batch_no='B20240102', operator='李四')
    manager.stock_in('P003', 80, 'WH002', batch_no='B20240103', operator='王五')

    # 查詢庫存
    print("\n查詢庫存...")
    stock = manager.get_stock('P001', 'WH001')
    print(f"產品 P001 在 WH001 的庫存: {stock['quantity']} {stock['unit']}")

    # 出庫操作
    print("\n執行出庫操作...")
    manager.stock_out('P001', 10, 'WH001', reference='SO-001', operator='張三')

    # 再次查詢庫存
    stock = manager.get_stock('P001', 'WH001')
    print(f"出庫後，產品 P001 在 WH001 的庫存: {stock['quantity']} {stock['unit']}")

    # 查詢所有庫存
    print("\n所有庫存:")
    all_stock = manager.get_all_stock()
    for s in all_stock:
        print(f"  {s['product_code']} ({s['product_name']}) - "
              f"{s['warehouse_code']}: {s['quantity']} {s['unit']}")

    # 查詢異動記錄
    print("\n最近 10 筆異動記錄:")
    transactions = manager.get_transactions(limit=10)
    for t in transactions:
        print(f"  {t['timestamp']} - {t['transaction_type']} - "
              f"產品 {t['product_code']} - 倉庫 {t['warehouse_code']} - "
              f"數量 {t['quantity']}")

    # 統計摘要
    print("\n庫存統計摘要:")
    summary = manager.get_stock_summary()
    for key, value in summary.items():
        print(f"  {key}: {value}")

    print("\n✓ 範例執行完成！")


if __name__ == '__main__':
    main()
