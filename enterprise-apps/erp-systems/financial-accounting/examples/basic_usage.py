"""
財務會計系統基本使用範例
"""
import sys
sys.path.insert(0, '../src')

from accounting_manager import AccountingManager


def main():
    # 創建管理器
    manager = AccountingManager('demo_accounting.db')

    print("初始化數據庫和會計科目...")
    manager.initialize_db()

    # 查看所有科目
    print("\n會計科目列表:")
    accounts = manager.get_all_accounts()
    for acc in accounts[:10]:  # 顯示前10個
        print(f"  {acc['code']} - {acc['name']} ({acc['type']})")

    # 創建會計憑證 - 銷售收入
    print("\n創建憑證 - 銷售收入...")
    voucher1_id = manager.create_voucher(
        '2024-01-15',
        '銷售產品收入',
        entries=[
            {'account_code': '1101', 'debit': 100000, 'credit': 0, 'description': '應收帳款-A客戶'},
            {'account_code': '4001', 'debit': 0, 'credit': 100000, 'description': '銷售收入'}
        ],
        created_by='accountant01'
    )
    print(f"憑證創建成功，憑證ID: {voucher1_id}")

    # 查詢憑證
    voucher = manager.get_voucher(voucher1_id)
    print(f"憑證編號: {voucher['voucher_no']}")
    print(f"憑證日期: {voucher['voucher_date']}")
    print(f"摘要: {voucher['description']}")
    print(f"狀態: {voucher['status']}")
    print("分錄:")
    for entry in voucher['entries']:
        if entry['debit'] > 0:
            print(f"  借: {entry['account_name']} ${entry['debit']:,.0f}")
        if entry['credit'] > 0:
            print(f"  貸: {entry['account_name']} ${entry['credit']:,.0f}")

    # 審核憑證
    print("\n審核憑證...")
    manager.approve_voucher(voucher1_id, 'manager01')
    print("憑證已審核")

    # 過帳憑證
    print("\n過帳憑證...")
    manager.post_voucher(voucher1_id)
    print("憑證已過帳")

    # 創建更多憑證
    print("\n創建憑證 - 支付費用...")
    voucher2_id = manager.create_voucher(
        '2024-01-20',
        '支付管理費用',
        entries=[
            {'account_code': '5101', 'debit': 30000, 'credit': 0, 'description': '管理費用'},
            {'account_code': '1001', 'debit': 0, 'credit': 30000, 'description': '現金支付'}
        ],
        created_by='accountant01'
    )
    manager.approve_voucher(voucher2_id, 'manager01')
    manager.post_voucher(voucher2_id)
    print(f"憑證 {voucher2_id} 已過帳")

    # 創建憑證 - 收款
    print("\n創建憑證 - 收回應收帳款...")
    voucher3_id = manager.create_voucher(
        '2024-01-25',
        '收回A客戶貨款',
        entries=[
            {'account_code': '1002', 'debit': 100000, 'credit': 0, 'description': '銀行存款'},
            {'account_code': '1101', 'debit': 0, 'credit': 100000, 'description': '應收帳款-A客戶'}
        ],
        created_by='accountant01'
    )
    manager.approve_voucher(voucher3_id, 'manager01')
    manager.post_voucher(voucher3_id)
    print(f"憑證 {voucher3_id} 已過帳")

    # 查詢科目餘額
    print("\n查詢科目餘額:")
    accounts_to_check = ['1001', '1002', '1101', '4001', '5101']
    for code in accounts_to_check:
        balance = manager.get_account_balance(code, '2024-01')
        account = manager.get_account(code)
        print(f"  {code} {account['name']}: ${balance:,.0f}")

    # 生成資產負債表
    print("\n生成資產負債表 (2024-01-31):")
    balance_sheet = manager.generate_balance_sheet('2024-01-31')
    print(f"  資產總計: ${balance_sheet['total_assets']:,.0f}")
    print(f"  負債總計: ${balance_sheet['total_liabilities']:,.0f}")
    print(f"  權益總計: ${balance_sheet['total_equity']:,.0f}")

    # 生成損益表
    print("\n生成損益表 (2024-01-01 ~ 2024-01-31):")
    income_statement = manager.generate_income_statement('2024-01-01', '2024-01-31')
    print(f"  收入總計: ${income_statement['total_revenue']:,.0f}")
    print(f"  費用總計: ${income_statement['total_expense']:,.0f}")
    print(f"  淨利潤: ${income_statement['net_income']:,.0f}")

    print("\n✓ 範例執行完成！")


if __name__ == '__main__':
    main()
