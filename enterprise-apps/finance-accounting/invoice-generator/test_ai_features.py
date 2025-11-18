"""
測試 AI 發票助手功能
"""

from ai_invoice_helper import AIInvoiceHelper
from datetime import datetime, timedelta


def test_ai_invoice_features():
    """測試 AI 功能"""

    print("=" * 60)
    print("AI 發票助手功能測試")
    print("=" * 60)

    ai_helper = AIInvoiceHelper()

    # 測試 1: 價格建議
    print("\n【測試 1: 智能價格建議】")
    items_to_price = ["網站開發", "APP開發", "UI設計", "系統維護", "技術諮詢"]
    for item in items_to_price:
        price = ai_helper.suggest_item_price(item)
        print(f"  {item}: ${price:,.2f}")

    # 測試 2: 項目分類
    print("\n【測試 2: 智能項目分類】")
    test_descriptions = [
        "React 前端開發",
        "Logo 設計服務",
        "技術顧問諮詢",
        "雲端伺服器月費"
    ]
    for desc in test_descriptions:
        result = ai_helper.smart_item_categorization(desc)
        print(f"\n  項目: {desc}")
        print(f"  分類: {result['category']}")
        print(f"  建議價格: ${result['suggested_price']:,.2f}")
        print(f"  建議稅率: {result['suggested_tax_rate']}%")

    # 測試 3: 重複檢測
    print("\n【測試 3: 重複項目檢測】")
    items = [
        {"description": "網站開發", "quantity": 1, "unit_price": 50000},
        {"description": "APP開發", "quantity": 1, "unit_price": 80000},
        {"description": "網站開發", "quantity": 1, "unit_price": 50000},  # 重複
    ]
    duplicates = ai_helper.detect_duplicate_items(items)
    if duplicates:
        print(f"  發現 {len(duplicates)} 個重複項目:")
        for dup in duplicates:
            print(f"    - 項目 {dup['index']}: {dup['item']['description']}")
    else:
        print("  未發現重複項目")

    # 測試 4: 付款條件建議
    print("\n【測試 4: 付款條件建議】")
    test_amounts = [5000, 25000, 75000, 150000]
    for amount in test_amounts:
        terms = ai_helper.suggest_payment_terms(amount)
        print(f"  金額 ${amount:,.2f}: {terms}")

    # 測試 5: 折扣建議
    print("\n【測試 5: 折扣建議】")
    large_order_items = [
        {"description": "網站開發", "quantity": 15, "unit_price": 5000},
        {"description": "維護服務", "quantity": 1, "unit_price": 30000},
    ]
    discount_result = ai_helper.suggest_discount(
        large_order_items,
        customer_history={"order_count": 12}
    )
    print(f"  有折扣建議: {discount_result['has_discount']}")
    print(f"  最高折扣: {discount_result['max_discount']}%")
    for suggestion in discount_result['suggestions']:
        print(f"    - {suggestion['type']}: {suggestion['percentage']}% ({suggestion['reason']})")

    # 測試 6: 付款日期預測
    print("\n【測試 6: 付款日期預測】")
    invoice_date = datetime.now().isoformat()[:10]
    prediction = ai_helper.predict_payment_date(
        invoice_date,
        "Net 30",
        customer_history={"avg_payment_delay_days": 3}
    )
    print(f"  發票日期: {invoice_date}")
    print(f"  預期付款日: {prediction['expected_date']}")
    print(f"  預測付款日: {prediction['predicted_date']}")
    print(f"  信心度: {prediction['confidence']}")
    print(f"  備註: {prediction['note']}")

    # 測試 7: 電子郵件驗證
    print("\n【測試 7: 電子郵件驗證】")
    test_emails = [
        "customer@example.com",
        "invalid-email",
        "test@gamil.com",  # 拼寫錯誤
        ""
    ]
    for email in test_emails:
        valid, message = ai_helper.validate_customer_email(email)
        status = "✓" if valid else "✗"
        print(f"  {status} {email or '(空)'}: {message if not valid else '有效'}")

    # 測試 8: 幣別建議
    print("\n【測試 8: 智能幣別建議】")
    test_addresses = [
        "台北市信義區",
        "New York, USA",
        "Tokyo, Japan",
        "深圳市"
    ]
    for address in test_addresses:
        currency = ai_helper.smart_currency_suggestion(address)
        print(f"  {address} → {currency}")

    # 測試 9: 發票健康度分析
    print("\n【測試 9: 發票健康度分析】")
    sample_invoice = {
        "invoice_number": "INV-001",
        "customer": {
            "name": "測試客戶",
            "email": "test@example.com",
            "address": "台北市"
        },
        "items": [
            {"description": "網站開發", "quantity": 1, "unit_price": 50000},
            {"description": "維護服務", "quantity": 1, "unit_price": 15000},
        ],
        "notes": "付款條件: Net 30"
    }

    health = ai_helper.analyze_invoice_health(sample_invoice)
    print(f"  健康分數: {health['health_score']}/100")
    print(f"  狀態: {health['status']}")
    if health['issues']:
        print(f"  問題: {', '.join(health['issues'])}")
    if health['warnings']:
        print(f"  警告: {', '.join(health['warnings'])}")
    if health['suggestions']:
        print(f"  建議: {', '.join(health['suggestions'])}")

    # 測試 10: 自動生成備註
    print("\n【測試 10: 自動生成備註】")
    invoice_data = {
        "payment_terms": "Net 30",
        "due_date": (datetime.now() + timedelta(days=30)).isoformat()[:10]
    }
    notes = ai_helper.generate_invoice_notes(invoice_data)
    print("  生成的備註:")
    for line in notes.split('\n'):
        print(f"    {line}")

    print("\n" + "=" * 60)
    print("測試完成！")
    print("=" * 60)


if __name__ == "__main__":
    test_ai_invoice_features()
