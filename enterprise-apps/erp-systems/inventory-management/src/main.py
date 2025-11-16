"""
庫存管理系統命令行介面
"""
import argparse
import sys
from inventory_manager import InventoryManager


def main():
    """主函數"""
    parser = argparse.ArgumentParser(description='庫存管理系統 CLI')
    parser.add_argument('--db', default='inventory.db', help='數據庫文件路徑')

    subparsers = parser.add_subparsers(dest='command', help='可用命令')

    # 初始化數據庫
    subparsers.add_parser('init', help='初始化數據庫')

    # 產品管理
    add_product = subparsers.add_parser('add-product', help='新增產品')
    add_product.add_argument('--code', required=True, help='產品編號')
    add_product.add_argument('--name', required=True, help='產品名稱')
    add_product.add_argument('--unit', required=True, help='計量單位')
    add_product.add_argument('--min-quantity', type=int, default=0, help='最低庫存量')
    add_product.add_argument('--description', help='產品描述')

    list_products = subparsers.add_parser('list-products', help='列出所有產品')

    # 倉庫管理
    add_warehouse = subparsers.add_parser('add-warehouse', help='新增倉庫')
    add_warehouse.add_argument('--code', required=True, help='倉庫編號')
    add_warehouse.add_argument('--name', required=True, help='倉庫名稱')
    add_warehouse.add_argument('--location', help='倉庫地址')
    add_warehouse.add_argument('--description', help='倉庫描述')

    list_warehouses = subparsers.add_parser('list-warehouses', help='列出所有倉庫')

    # 庫存操作
    stock_in = subparsers.add_parser('stock-in', help='入庫')
    stock_in.add_argument('--product-code', required=True, help='產品編號')
    stock_in.add_argument('--quantity', type=int, required=True, help='入庫數量')
    stock_in.add_argument('--warehouse', required=True, help='倉庫編號')
    stock_in.add_argument('--batch-no', help='批次號')
    stock_in.add_argument('--reference', help='參考單號')
    stock_in.add_argument('--operator', help='操作人員')

    stock_out = subparsers.add_parser('stock-out', help='出庫')
    stock_out.add_argument('--product-code', required=True, help='產品編號')
    stock_out.add_argument('--quantity', type=int, required=True, help='出庫數量')
    stock_out.add_argument('--warehouse', required=True, help='倉庫編號')
    stock_out.add_argument('--reference', help='參考單號')
    stock_out.add_argument('--operator', help='操作人員')

    # 庫存查詢
    check_stock = subparsers.add_parser('check-stock', help='查詢庫存')
    check_stock.add_argument('--product-code', required=True, help='產品編號')
    check_stock.add_argument('--warehouse', help='倉庫編號（可選）')

    list_stock = subparsers.add_parser('list-stock', help='列出所有庫存')

    low_stock = subparsers.add_parser('low-stock', help='查詢低庫存產品')

    # 異動記錄
    transactions = subparsers.add_parser('transactions', help='查詢異動記錄')
    transactions.add_argument('--product-code', help='產品編號')
    transactions.add_argument('--warehouse', help='倉庫編號')
    transactions.add_argument('--type', choices=['IN', 'OUT'], help='異動類型')
    transactions.add_argument('--limit', type=int, default=50, help='記錄數量限制')

    # 統計摘要
    summary = subparsers.add_parser('summary', help='查詢庫存統計摘要')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    manager = InventoryManager(args.db)

    try:
        if args.command == 'init':
            manager.initialize_db()
            print("✓ 數據庫初始化成功")

        elif args.command == 'add-product':
            success = manager.add_product(
                args.code, args.name, args.unit,
                args.min_quantity, args.description
            )
            if success:
                print(f"✓ 產品 {args.code} 新增成功")
            else:
                print(f"✗ 產品 {args.code} 已存在")

        elif args.command == 'list-products':
            products = manager.get_all_products()
            print(f"\n共 {len(products)} 個產品:")
            print("-" * 80)
            print(f"{'編號':<10} {'名稱':<20} {'單位':<10} {'最低庫存':<10}")
            print("-" * 80)
            for p in products:
                print(f"{p['code']:<10} {p['name']:<20} {p['unit']:<10} {p['min_quantity']:<10}")

        elif args.command == 'add-warehouse':
            success = manager.add_warehouse(
                args.code, args.name, args.location, args.description
            )
            if success:
                print(f"✓ 倉庫 {args.code} 新增成功")
            else:
                print(f"✗ 倉庫 {args.code} 已存在")

        elif args.command == 'list-warehouses':
            warehouses = manager.get_all_warehouses()
            print(f"\n共 {len(warehouses)} 個倉庫:")
            print("-" * 80)
            print(f"{'編號':<10} {'名稱':<20} {'地址':<30}")
            print("-" * 80)
            for w in warehouses:
                location = w['location'] or ''
                print(f"{w['code']:<10} {w['name']:<20} {location:<30}")

        elif args.command == 'stock-in':
            manager.stock_in(
                args.product_code, args.quantity, args.warehouse,
                args.batch_no, args.reference, args.operator
            )
            print(f"✓ 入庫成功: 產品 {args.product_code}, 數量 {args.quantity}, 倉庫 {args.warehouse}")

        elif args.command == 'stock-out':
            manager.stock_out(
                args.product_code, args.quantity, args.warehouse,
                args.reference, args.operator
            )
            print(f"✓ 出庫成功: 產品 {args.product_code}, 數量 {args.quantity}, 倉庫 {args.warehouse}")

        elif args.command == 'check-stock':
            stock = manager.get_stock(args.product_code, args.warehouse)
            if args.warehouse:
                if stock and stock.get('quantity', 0) > 0:
                    print(f"\n產品: {stock['product_name']} ({stock['product_code']})")
                    print(f"倉庫: {stock['warehouse_name']} ({stock['warehouse_code']})")
                    print(f"庫存: {stock['quantity']} {stock['unit']}")
                else:
                    print(f"產品 {args.product_code} 在倉庫 {args.warehouse} 無庫存")
            else:
                if stock:
                    print(f"\n產品 {args.product_code} 的庫存分布:")
                    print("-" * 60)
                    for s in stock:
                        print(f"倉庫 {s['warehouse_code']} ({s['warehouse_name']}): {s['quantity']} {s['unit']}")
                else:
                    print(f"產品 {args.product_code} 無庫存")

        elif args.command == 'list-stock':
            stocks = manager.get_all_stock()
            print(f"\n共 {len(stocks)} 筆庫存記錄:")
            print("-" * 100)
            print(f"{'產品編號':<12} {'產品名稱':<20} {'倉庫編號':<12} {'倉庫名稱':<20} {'數量':<10}")
            print("-" * 100)
            for s in stocks:
                print(f"{s['product_code']:<12} {s['product_name']:<20} "
                      f"{s['warehouse_code']:<12} {s['warehouse_name']:<20} "
                      f"{s['quantity']:<10}")

        elif args.command == 'low-stock':
            low_stocks = manager.get_low_stock_products()
            print(f"\n共 {len(low_stocks)} 個低庫存產品:")
            print("-" * 100)
            print(f"{'產品編號':<12} {'產品名稱':<20} {'倉庫':<12} {'當前庫存':<12} {'最低庫存':<12}")
            print("-" * 100)
            for s in low_stocks:
                wh_qty = s.get('warehouse_quantity') or 0
                print(f"{s['code']:<12} {s['name']:<20} "
                      f"{s.get('warehouse_code', 'N/A'):<12} "
                      f"{wh_qty:<12} {s['min_quantity']:<12}")

        elif args.command == 'transactions':
            trans = manager.get_transactions(
                args.product_code, args.warehouse, args.type, args.limit
            )
            print(f"\n共 {len(trans)} 筆異動記錄:")
            print("-" * 120)
            print(f"{'時間':<20} {'類型':<6} {'產品':<12} {'倉庫':<12} {'數量':<8} {'參考單號':<15}")
            print("-" * 120)
            for t in trans:
                ref = t.get('reference') or ''
                print(f"{t['timestamp']:<20} {t['transaction_type']:<6} "
                      f"{t['product_code']:<12} {t['warehouse_code']:<12} "
                      f"{t['quantity']:<8} {ref:<15}")

        elif args.command == 'summary':
            summary = manager.get_stock_summary()
            print("\n=== 庫存統計摘要 ===")
            print(f"產品總數: {summary['total_products']}")
            print(f"倉庫總數: {summary['total_warehouses']}")
            print(f"庫存項目數: {summary['total_stock_items']}")
            print(f"低庫存產品數: {summary['low_stock_count']}")
            print(f"異動記錄總數: {summary['total_transactions']}")

    except Exception as e:
        print(f"✗ 錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
