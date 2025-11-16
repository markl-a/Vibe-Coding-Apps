"""
費用管理核心功能模組
"""

import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict


class ExpenseManager:
    """費用管理器類"""

    def __init__(self):
        pass

    def calculate_statistics(self, expenses):
        """
        計算統計資訊

        Args:
            expenses: 費用列表

        Returns:
            dict: 統計資訊字典
        """
        if not expenses:
            return {
                'total': 0,
                'count': 0,
                'average': 0,
                'max': 0,
                'min': 0
            }

        amounts = [e['amount'] for e in expenses]

        return {
            'total': sum(amounts),
            'count': len(amounts),
            'average': sum(amounts) / len(amounts),
            'max': max(amounts),
            'min': min(amounts)
        }

    def group_by_category(self, expenses):
        """
        按分類分組

        Args:
            expenses: 費用列表

        Returns:
            dict: 分類分組結果
        """
        grouped = defaultdict(list)

        for expense in expenses:
            category = expense.get('category', '未分類')
            grouped[category].append(expense)

        # 計算每個分類的統計資訊
        result = {}
        for category, items in grouped.items():
            result[category] = {
                'items': items,
                'total': sum(item['amount'] for item in items),
                'count': len(items),
                'average': sum(item['amount'] for item in items) / len(items)
            }

        return result

    def group_by_month(self, expenses):
        """
        按月份分組

        Args:
            expenses: 費用列表

        Returns:
            dict: 月份分組結果
        """
        grouped = defaultdict(list)

        for expense in expenses:
            date = expense.get('date', '')
            month = date[:7]  # YYYY-MM
            grouped[month].append(expense)

        # 計算每個月的統計資訊
        result = {}
        for month, items in grouped.items():
            result[month] = {
                'items': items,
                'total': sum(item['amount'] for item in items),
                'count': len(items),
                'average': sum(item['amount'] for item in items) / len(items)
            }

        return result

    def find_recurring_expenses(self, expenses, tolerance_days=3):
        """
        識別定期費用

        Args:
            expenses: 費用列表
            tolerance_days: 容許的日期差異天數

        Returns:
            list: 可能的定期費用
        """
        # 按描述或供應商分組
        vendor_expenses = defaultdict(list)

        for expense in expenses:
            key = expense.get('vendor', '') or expense.get('description', '')
            if key:
                vendor_expenses[key].append(expense)

        recurring = []

        for vendor, items in vendor_expenses.items():
            if len(items) >= 2:
                # 檢查是否有規律性
                items.sort(key=lambda x: x['date'])
                dates = [datetime.fromisoformat(item['date']) for item in items]

                # 計算間隔
                intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]

                # 如果間隔相近（約30天），視為定期費用
                if intervals and all(25 <= interval <= 35 for interval in intervals):
                    avg_amount = sum(item['amount'] for item in items) / len(items)

                    recurring.append({
                        'vendor': vendor,
                        'frequency': '每月',
                        'average_amount': avg_amount,
                        'occurrences': len(items),
                        'last_date': items[-1]['date'],
                        'next_expected': (dates[-1] + timedelta(days=30)).isoformat()
                    })

        return recurring

    def detect_anomalies(self, expenses, threshold=2.0):
        """
        檢測異常支出

        Args:
            expenses: 費用列表
            threshold: 異常閾值（標準差倍數）

        Returns:
            list: 異常支出列表
        """
        if len(expenses) < 3:
            return []

        amounts = [e['amount'] for e in expenses]
        mean = sum(amounts) / len(amounts)

        # 計算標準差
        variance = sum((x - mean) ** 2 for x in amounts) / len(amounts)
        std_dev = variance ** 0.5

        # 找出超過閾值的支出
        anomalies = []
        for expense in expenses:
            if abs(expense['amount'] - mean) > threshold * std_dev:
                anomalies.append({
                    'expense': expense,
                    'deviation': abs(expense['amount'] - mean) / std_dev,
                    'reason': f"金額 ${expense['amount']:.2f} 偏離平均值 ${mean:.2f} 超過 {threshold} 個標準差"
                })

        return anomalies

    def generate_monthly_report(self, expenses_df, month_date):
        """
        生成月度報表

        Args:
            expenses_df: 費用 DataFrame
            month_date: 月份日期

        Returns:
            dict: 月度報表
        """
        if expenses_df.empty:
            return {
                'month': month_date.strftime('%Y-%m'),
                'total_expenses': 0,
                'transaction_count': 0,
                'categories': {},
                'summary': '本月無費用記錄'
            }

        # 總體統計
        total = expenses_df['amount'].sum()
        count = len(expenses_df)
        average = expenses_df['amount'].mean()

        # 分類統計
        category_stats = expenses_df.groupby('category').agg({
            'amount': ['sum', 'count', 'mean', 'max']
        }).to_dict()

        # 付款方式統計
        payment_stats = expenses_df.groupby('payment_method')['amount'].sum().to_dict()

        # 前 5 大支出
        top_expenses = expenses_df.nlargest(5, 'amount')[['date', 'category', 'description', 'amount']].to_dict('records')

        return {
            'month': month_date.strftime('%Y-%m'),
            'total_expenses': float(total),
            'transaction_count': int(count),
            'average_transaction': float(average),
            'categories': category_stats,
            'payment_methods': payment_stats,
            'top_expenses': top_expenses,
            'summary': f"本月總支出 ${total:,.2f}，共 {count} 筆交易，平均每筆 ${average:,.2f}"
        }

    def calculate_budget_health(self, expenses, budgets):
        """
        計算預算健康度

        Args:
            expenses: 費用列表
            budgets: 預算字典 {category: budget_amount}

        Returns:
            dict: 預算健康度報告
        """
        category_spending = defaultdict(float)

        for expense in expenses:
            category = expense.get('category', '未分類')
            category_spending[category] += expense.get('amount', 0)

        health_report = {}

        for category, budget in budgets.items():
            spent = category_spending.get(category, 0)
            remaining = budget - spent
            percentage = (spent / budget * 100) if budget > 0 else 0

            # 健康狀態
            if percentage < 75:
                status = 'healthy'
                color = 'green'
            elif percentage < 90:
                status = 'warning'
                color = 'orange'
            else:
                status = 'critical'
                color = 'red'

            health_report[category] = {
                'budget': budget,
                'spent': spent,
                'remaining': remaining,
                'percentage': percentage,
                'status': status,
                'color': color
            }

        return health_report

    def predict_monthly_spending(self, expenses, days_passed):
        """
        預測月度支出

        Args:
            expenses: 本月到目前為止的費用列表
            days_passed: 已經過的天數

        Returns:
            dict: 預測結果
        """
        if not expenses or days_passed == 0:
            return {
                'predicted_total': 0,
                'current_total': 0,
                'daily_average': 0
            }

        current_total = sum(e['amount'] for e in expenses)
        daily_average = current_total / days_passed
        predicted_total = daily_average * 30  # 假設每月 30 天

        return {
            'current_total': current_total,
            'daily_average': daily_average,
            'predicted_total': predicted_total,
            'days_passed': days_passed,
            'days_remaining': 30 - days_passed
        }

    def get_spending_trends(self, expenses_by_month):
        """
        分析支出趨勢

        Args:
            expenses_by_month: 按月分組的費用字典

        Returns:
            dict: 趨勢分析
        """
        if not expenses_by_month:
            return {
                'trend': 'stable',
                'average_monthly': 0,
                'growth_rate': 0
            }

        # 按月份排序
        sorted_months = sorted(expenses_by_month.keys())
        monthly_totals = [expenses_by_month[month]['total'] for month in sorted_months]

        if len(monthly_totals) < 2:
            return {
                'trend': 'insufficient_data',
                'average_monthly': monthly_totals[0] if monthly_totals else 0,
                'growth_rate': 0
            }

        # 計算增長率
        first_month = monthly_totals[0]
        last_month = monthly_totals[-1]

        if first_month > 0:
            growth_rate = ((last_month - first_month) / first_month) * 100
        else:
            growth_rate = 0

        # 判斷趨勢
        if growth_rate > 10:
            trend = 'increasing'
        elif growth_rate < -10:
            trend = 'decreasing'
        else:
            trend = 'stable'

        average_monthly = sum(monthly_totals) / len(monthly_totals)

        return {
            'trend': trend,
            'average_monthly': average_monthly,
            'growth_rate': growth_rate,
            'months_analyzed': len(monthly_totals)
        }
