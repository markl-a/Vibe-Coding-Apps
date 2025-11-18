"""
測試 AI 費用預測功能
"""

from ai_expense_predictor import AIExpensePredictor
from datetime import datetime, timedelta
import random


def generate_sample_expenses(months=6):
    """生成範例費用數據"""
    categories = ['餐飲', '交通', '購物', '娛樂', '醫療', '教育']
    payment_methods = ['現金', '信用卡', '轉帳', '電子支付']
    vendors = ['全聯', '家樂福', '誠品', '星巴克', '台鐵', '計程車']

    expenses = []
    start_date = datetime.now() - timedelta(days=months * 30)

    for day in range(months * 30):
        current_date = start_date + timedelta(days=day)

        # 每天隨機生成 1-3 筆費用
        num_expenses = random.randint(1, 3)

        for _ in range(num_expenses):
            category = random.choice(categories)

            # 不同分類有不同的價格範圍
            if category == '餐飲':
                amount = random.randint(50, 500)
            elif category == '交通':
                amount = random.randint(20, 300)
            elif category == '購物':
                amount = random.randint(100, 2000)
            elif category == '娛樂':
                amount = random.randint(200, 800)
            elif category == '醫療':
                amount = random.randint(100, 1500)
            else:  # 教育
                amount = random.randint(500, 3000)

            expenses.append({
                'date': current_date.isoformat()[:10],
                'amount': amount,
                'category': category,
                'description': f'{category}支出',
                'payment_method': random.choice(payment_methods),
                'vendor': random.choice(vendors)
            })

    return expenses


def test_ai_expense_predictor():
    """測試 AI 預測功能"""

    print("=" * 60)
    print("AI 費用預測器功能測試")
    print("=" * 60)

    # 生成範例數據
    print("\n【生成測試數據】")
    expenses = generate_sample_expenses(months=6)
    print(f"✓ 生成 {len(expenses)} 筆費用記錄，涵蓋 6 個月")

    predictor = AIExpensePredictor()

    # 測試 1: 預測下個月支出
    print("\n【測試 1: 預測下個月支出】")
    prediction = predictor.predict_next_month_spending(expenses)
    print(f"  預測總額: ${prediction['predicted_total']:,.2f}")
    print(f"  信心度: {prediction['confidence']}")
    print(f"  季節性因子: {prediction['seasonal_factor']}")
    print(f"  數據月份: {prediction['data_months']}")
    print(f"  備註: {prediction['note']}")

    print("\n  各分類預測:")
    for category, amount in prediction['predicted_breakdown'].items():
        print(f"    {category}: ${amount:,.2f}")

    # 測試 2: 識別支出模式
    print("\n【測試 2: 識別支出模式】")
    patterns = predictor.identify_spending_patterns(expenses)
    print(f"  總交易筆數: {patterns['total_transactions']}")
    print(f"  分析期間: {patterns['analysis_period']}")
    print("\n  發現的模式:")
    for pattern in patterns['patterns']:
        print(f"\n    類型: {pattern['type']}")
        print(f"    描述: {pattern['description']}")
        if 'amount' in pattern:
            print(f"    金額: ${pattern['amount']:,.2f}")
        if 'count' in pattern:
            print(f"    次數: {pattern['count']}")
        if 'percentage' in pattern:
            print(f"    佔比: {pattern['percentage']}%")

    # 測試 3: 檢測異常支出
    print("\n【測試 3: 檢測異常支出】")
    anomalies = predictor.detect_unusual_spending(expenses, threshold=2.0)
    print(f"  發現 {len(anomalies)} 個異常支出")

    if anomalies:
        print("\n  前 5 個異常:")
        for i, anomaly in enumerate(anomalies[:5], 1):
            expense = anomaly['expense']
            print(f"\n    {i}. {expense['category']} - {expense['description']}")
            print(f"       金額: ${expense['amount']:,.2f}")
            print(f"       日期: {expense['date']}")
            print(f"       Z-score: {anomaly['z_score']}")
            print(f"       嚴重程度: {anomaly['severity']}")
            print(f"       原因: {anomaly['reason']}")

    # 測試 4: 節省建議
    print("\n【測試 4: 節省機會建議】")
    savings = predictor.suggest_savings_opportunities(expenses)
    print(f"  發現 {len(savings)} 個節省機會")

    total_potential_savings = sum(s['potential_savings'] for s in savings)
    print(f"  潛在總節省: ${total_potential_savings:,.2f}")

    for i, suggestion in enumerate(savings, 1):
        print(f"\n    {i}. {suggestion['description']}")
        print(f"       潛在節省: ${suggestion['potential_savings']:,.2f}")
        print(f"       詳情: {suggestion['detail']}")
        print(f"       建議行動: {suggestion['action']}")

    # 測試 5: 現金流預測
    print("\n【測試 5: 現金流預測】")
    monthly_income = 80000  # 假設月收入
    cash_flow = predictor.predict_cash_flow(monthly_income, expenses, months=3)

    print(f"  當前平均月支出: ${cash_flow['current_avg_monthly_expense']:,.2f}")

    if cash_flow.get('warnings'):
        print("\n  ⚠️ 警告:")
        for warning in cash_flow['warnings']:
            print(f"    - {warning}")

    print("\n  未來 3 個月預測:")
    for pred in cash_flow['predictions']:
        status_emoji = "✓" if pred['status'] == 'positive' else "✗"
        print(f"\n    第 {pred['month']} 個月 ({pred['month_name']}):")
        print(f"      收入: ${pred['predicted_income']:,.2f}")
        print(f"      預測支出: ${pred['predicted_expense']:,.2f}")
        print(f"      預測結餘: ${pred['predicted_balance']:,.2f} {status_emoji}")
        print(f"      累積餘額: ${pred['cumulative_balance']:,.2f}")

    # 測試 6: 智能預算分配
    print("\n【測試 6: 智能預算分配】")
    total_budget = 60000
    allocation = predictor.smart_budget_allocation(total_budget, expenses)

    print(f"  預算分配方法: {allocation['method']}")
    print(f"  總預算: ${allocation['total_budget']:,.2f}")
    print("\n  建議分配:")

    for category, details in allocation['allocations'].items():
        print(f"\n    {category}:")
        print(f"      金額: ${details['amount']:,.2f}")
        print(f"      佔比: {details['percentage']}%")
        if details.get('historical_avg', 0) > 0:
            print(f"      歷史月均: ${details['historical_avg']:,.2f}")

    # 測試 7: 預測準確度評估
    print("\n【測試 7: 預測準確度評估】")

    # 模擬實際和預測數據
    actual_test_expenses = generate_sample_expenses(months=1)
    test_prediction = predictor.predict_next_month_spending(expenses)

    accuracy = predictor.expense_forecast_accuracy(actual_test_expenses, test_prediction)

    print(f"  實際總額: ${accuracy['actual_total']:,.2f}")
    print(f"  預測總額: ${accuracy['predicted_total']:,.2f}")
    print(f"  誤差: ${accuracy['error']:,.2f} ({accuracy['error_percentage']:.2f}%)")
    print(f"  準確度: {accuracy['accuracy']:.2f}%")
    print(f"  評估: {accuracy['assessment']}")

    # 統計摘要
    print("\n" + "=" * 60)
    print("測試摘要")
    print("=" * 60)

    total_expenses = sum(e['amount'] for e in expenses)
    avg_daily = total_expenses / (len(expenses) / 3)  # 假設每天平均 3 筆

    print(f"總費用記錄: {len(expenses)} 筆")
    print(f"總支出金額: ${total_expenses:,.2f}")
    print(f"平均日支出: ${avg_daily:,.2f}")
    print(f"預測下月支出: ${prediction['predicted_total']:,.2f}")
    print(f"發現異常: {len(anomalies)} 筆")
    print(f"節省機會: {len(savings)} 個")
    print(f"潛在節省: ${total_potential_savings:,.2f}")

    print("\n" + "=" * 60)
    print("所有測試完成！")
    print("=" * 60)


if __name__ == "__main__":
    # 設定隨機種子以獲得可重現的結果
    random.seed(42)
    test_ai_expense_predictor()
