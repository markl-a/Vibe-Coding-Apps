"""
儀表板生成核心功能模組
"""

from datetime import datetime, timedelta
from calendar import monthrange


class DashboardGenerator:
    """儀表板生成器類"""

    def __init__(self):
        pass

    def get_date_range(self, period):
        """
        根據期間返回日期範圍

        Args:
            period: 期間類型（本月、上月、本季、本年）

        Returns:
            tuple: (開始日期, 結束日期)
        """
        today = datetime.now().date()

        if period == "本月":
            start_date = today.replace(day=1)
            end_date = today

        elif period == "上月":
            first_day_this_month = today.replace(day=1)
            last_day_last_month = first_day_this_month - timedelta(days=1)
            start_date = last_day_last_month.replace(day=1)
            end_date = last_day_last_month

        elif period == "本季":
            quarter = (today.month - 1) // 3
            start_month = quarter * 3 + 1
            start_date = today.replace(month=start_month, day=1)
            end_date = today

        elif period == "本年":
            start_date = today.replace(month=1, day=1)
            end_date = today

        else:  # 默認本月
            start_date = today.replace(day=1)
            end_date = today

        return start_date, end_date

    def calculate_growth_rate(self, current, previous):
        """
        計算增長率

        Args:
            current: 當前值
            previous: 前期值

        Returns:
            float: 增長率（百分比）
        """
        if previous == 0:
            return 0 if current == 0 else 100

        return ((current - previous) / previous) * 100

    def calculate_financial_ratios(self, balance_sheet, income_statement):
        """
        計算財務比率

        Args:
            balance_sheet: 資產負債表數據
            income_statement: 損益表數據

        Returns:
            dict: 財務比率
        """
        # 流動性比率
        current_assets = balance_sheet.get('current_assets', 0)
        current_liabilities = balance_sheet.get('current_liabilities', 0)
        inventory = balance_sheet.get('inventory', 0)

        current_ratio = (current_assets / current_liabilities) if current_liabilities > 0 else 0
        quick_ratio = ((current_assets - inventory) / current_liabilities) if current_liabilities > 0 else 0

        # 獲利能力比率
        net_income = income_statement.get('net_income', 0)
        revenue = income_statement.get('revenue', 0)
        total_assets = balance_sheet.get('total_assets', 0)
        equity = balance_sheet.get('equity', 0)

        profit_margin = (net_income / revenue * 100) if revenue > 0 else 0
        roa = (net_income / total_assets * 100) if total_assets > 0 else 0
        roe = (net_income / equity * 100) if equity > 0 else 0

        # 槓桿比率
        total_liabilities = balance_sheet.get('total_liabilities', 0)

        debt_ratio = (total_liabilities / total_assets * 100) if total_assets > 0 else 0
        debt_to_equity = (total_liabilities / equity) if equity > 0 else 0

        return {
            'current_ratio': round(current_ratio, 2),
            'quick_ratio': round(quick_ratio, 2),
            'profit_margin': round(profit_margin, 2),
            'roa': round(roa, 2),
            'roe': round(roe, 2),
            'debt_ratio': round(debt_ratio, 2),
            'debt_to_equity': round(debt_to_equity, 2)
        }

    def generate_kpi_summary(self, financial_data):
        """
        生成 KPI 摘要

        Args:
            financial_data: 財務數據

        Returns:
            dict: KPI 摘要
        """
        revenue = financial_data.get('total_revenue', 0)
        expense = financial_data.get('total_expense', 0)
        net_profit = revenue - expense

        return {
            'revenue': revenue,
            'expense': expense,
            'net_profit': net_profit,
            'profit_margin': (net_profit / revenue * 100) if revenue > 0 else 0,
            'status': 'profitable' if net_profit > 0 else 'loss'
        }
