"""
AI 費用預測器 - 使用機器學習預測費用趨勢
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any
from collections import defaultdict


class AIExpensePredictor:
    """AI 費用預測器類"""

    def __init__(self):
        self.seasonal_factors = {
            1: 1.2,   # 一月 - 新年假期
            2: 1.0,   # 二月
            3: 1.1,   # 三月
            4: 1.0,   # 四月
            5: 1.0,   # 五月
            6: 1.1,   # 六月 - 中旬假期
            7: 1.15,  # 七月 - 暑假
            8: 1.15,  # 八月 - 暑假
            9: 1.0,   # 九月
            10: 1.0,  # 十月
            11: 1.2,  # 十一月 - 購物季
            12: 1.3,  # 十二月 - 節日季
        }

    def predict_next_month_spending(self, expenses: List[Dict]) -> Dict[str, Any]:
        """
        預測下個月的支出

        Args:
            expenses: 歷史費用列表

        Returns:
            dict: 預測結果
        """
        if not expenses:
            return {
                "predicted_total": 0,
                "confidence": "low",
                "breakdown": {},
                "note": "無歷史數據，無法預測"
            }

        df = pd.DataFrame(expenses)
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.to_period('M')

        # 按月和分類統計
        monthly_category_spending = df.groupby(['month', 'category'])['amount'].sum().reset_index()

        # 計算各分類平均月支出
        category_avg = df.groupby('category')['amount'].sum() / df['month'].nunique()

        # 下個月
        next_month = datetime.now().month % 12 + 1
        seasonal_factor = self.seasonal_factors.get(next_month, 1.0)

        # 預測
        predicted_breakdown = {}
        for category, avg_amount in category_avg.items():
            # 應用季節性因子
            predicted = avg_amount * seasonal_factor

            # 添加趨勢調整
            category_expenses = df[df['category'] == category].groupby('month')['amount'].sum()
            if len(category_expenses) >= 3:
                # 計算趨勢
                recent_3_months = category_expenses.tail(3).values
                trend = (recent_3_months[-1] - recent_3_months[0]) / 3
                predicted += trend

            predicted_breakdown[category] = max(0, predicted)

        predicted_total = sum(predicted_breakdown.values())

        # 計算信心度
        data_months = df['month'].nunique()
        if data_months >= 6:
            confidence = "high"
        elif data_months >= 3:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "predicted_total": round(predicted_total, 2),
            "predicted_breakdown": {k: round(v, 2) for k, v in predicted_breakdown.items()},
            "confidence": confidence,
            "seasonal_factor": seasonal_factor,
            "data_months": data_months,
            "note": f"基於 {data_months} 個月的歷史數據預測"
        }

    def identify_spending_patterns(self, expenses: List[Dict]) -> Dict[str, Any]:
        """
        識別支出模式

        Args:
            expenses: 費用列表

        Returns:
            dict: 支出模式分析
        """
        if not expenses:
            return {"patterns": [], "note": "無足夠數據"}

        df = pd.DataFrame(expenses)
        df['date'] = pd.to_datetime(df['date'])
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day

        patterns = []

        # 模式 1: 每週特定日支出較高
        weekly_spending = df.groupby('day_of_week')['amount'].agg(['sum', 'count']).reset_index()
        max_day = weekly_spending.loc[weekly_spending['sum'].idxmax()]

        day_names = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']
        patterns.append({
            "type": "weekly_pattern",
            "description": f"{day_names[int(max_day['day_of_week'])]} 支出最高",
            "amount": round(max_day['sum'], 2),
            "frequency": int(max_day['count'])
        })

        # 模式 2: 月初/月中/月底支出模式
        df['period'] = pd.cut(df['day_of_month'], bins=[0, 10, 20, 31], labels=['月初', '月中', '月底'])
        period_spending = df.groupby('period')['amount'].sum()

        max_period = period_spending.idxmax()
        patterns.append({
            "type": "monthly_period_pattern",
            "description": f"{max_period}支出最多",
            "amount": round(period_spending[max_period], 2)
        })

        # 模式 3: 高頻率支出分類
        category_frequency = df['category'].value_counts()
        top_category = category_frequency.index[0]
        patterns.append({
            "type": "category_frequency",
            "description": f"最常見支出類別: {top_category}",
            "count": int(category_frequency.iloc[0]),
            "percentage": round(category_frequency.iloc[0] / len(df) * 100, 1)
        })

        # 模式 4: 平均交易金額
        avg_transaction = df['amount'].mean()
        patterns.append({
            "type": "average_transaction",
            "description": "平均交易金額",
            "amount": round(avg_transaction, 2)
        })

        return {
            "patterns": patterns,
            "total_transactions": len(df),
            "analysis_period": f"{df['date'].min().date()} 至 {df['date'].max().date()}"
        }

    def detect_unusual_spending(self, expenses: List[Dict], threshold: float = 2.0) -> List[Dict]:
        """
        檢測異常支出（改進版）

        Args:
            expenses: 費用列表
            threshold: Z-score 閾值

        Returns:
            list: 異常支出列表
        """
        if len(expenses) < 10:
            return []

        df = pd.DataFrame(expenses)

        # 按分類檢測異常
        anomalies = []

        for category in df['category'].unique():
            category_df = df[df['category'] == category]

            if len(category_df) < 3:
                continue

            amounts = category_df['amount'].values
            mean = np.mean(amounts)
            std = np.std(amounts)

            if std == 0:
                continue

            # 計算 Z-score
            z_scores = np.abs((amounts - mean) / std)

            # 找出異常
            for idx, (z_score, row) in enumerate(zip(z_scores, category_df.to_dict('records'))):
                if z_score > threshold:
                    anomalies.append({
                        "expense": row,
                        "z_score": round(z_score, 2),
                        "category_mean": round(mean, 2),
                        "category_std": round(std, 2),
                        "severity": "high" if z_score > 3 else "medium",
                        "reason": f"金額 ${row['amount']:,.2f} 比該分類平均 ${mean:,.2f} 高 {z_score:.1f} 個標準差"
                    })

        return sorted(anomalies, key=lambda x: x['z_score'], reverse=True)

    def suggest_savings_opportunities(self, expenses: List[Dict]) -> List[Dict]:
        """
        建議節省機會

        Args:
            expenses: 費用列表

        Returns:
            list: 節省建議
        """
        if not expenses:
            return []

        df = pd.DataFrame(expenses)
        suggestions = []

        # 建議 1: 高頻小額支出累積
        small_frequent = df[df['amount'] < df['amount'].quantile(0.25)]
        if len(small_frequent) > 20:
            total = small_frequent['amount'].sum()
            suggestions.append({
                "type": "small_frequent_expenses",
                "description": "高頻小額支出累積",
                "potential_savings": round(total * 0.3, 2),  # 假設可節省 30%
                "detail": f"{len(small_frequent)} 筆小額支出累積達 ${total:,.2f}",
                "action": "考慮合併購買或尋找訂閱方案"
            })

        # 建議 2: 同類別高支出
        category_totals = df.groupby('category')['amount'].sum().sort_values(ascending=False)
        if len(category_totals) > 0:
            top_category = category_totals.index[0]
            top_amount = category_totals.iloc[0]

            if top_amount > df['amount'].sum() * 0.3:  # 超過總支出 30%
                suggestions.append({
                    "type": "high_category_spending",
                    "description": f"{top_category} 支出過高",
                    "potential_savings": round(top_amount * 0.15, 2),  # 假設可節省 15%
                    "detail": f"{top_category} 佔總支出 {top_amount / df['amount'].sum() * 100:.1f}%",
                    "action": "檢視是否有降低或替代方案"
                })

        # 建議 3: 週末高支出
        df['date'] = pd.to_datetime(df['date'])
        df['is_weekend'] = df['date'].dt.dayofweek >= 5
        weekend_spending = df[df['is_weekend']]['amount'].sum()
        total_spending = df['amount'].sum()

        if weekend_spending > total_spending * 0.4:  # 週末支出超過 40%
            suggestions.append({
                "type": "weekend_overspending",
                "description": "週末支出偏高",
                "potential_savings": round(weekend_spending * 0.2, 2),
                "detail": f"週末支出 ${weekend_spending:,.2f}，佔總支出 {weekend_spending / total_spending * 100:.1f}%",
                "action": "規劃週末活動預算，尋找免費或低成本活動"
            })

        # 建議 4: 定期訂閱檢視
        subscription_keywords = ['訂閱', 'subscription', '會員', '月費', '年費']
        subscriptions = df[df['description'].str.contains('|'.join(subscription_keywords), case=False, na=False)]

        if len(subscriptions) > 5:
            total_sub = subscriptions['amount'].sum()
            suggestions.append({
                "type": "subscription_review",
                "description": "多個訂閱服務",
                "potential_savings": round(total_sub * 0.25, 2),
                "detail": f"{len(subscriptions)} 個訂閱服務，總計 ${total_sub:,.2f}",
                "action": "檢視並取消未充分使用的訂閱"
            })

        return suggestions

    def predict_cash_flow(self, income: float, expenses: List[Dict], months: int = 3) -> Dict:
        """
        預測未來現金流

        Args:
            income: 月收入
            expenses: 歷史費用
            months: 預測月數

        Returns:
            dict: 現金流預測
        """
        if not expenses:
            return {
                "predictions": [],
                "note": "無歷史數據"
            }

        df = pd.DataFrame(expenses)
        df['date'] = pd.to_datetime(df['date'])

        # 計算平均月支出
        df['month'] = df['date'].dt.to_period('M')
        monthly_avg = df.groupby('month')['amount'].sum().mean()

        predictions = []
        current_balance = income - monthly_avg  # 假設當前餘額

        for i in range(1, months + 1):
            future_month = (datetime.now().month + i - 1) % 12 + 1
            seasonal_factor = self.seasonal_factors.get(future_month, 1.0)

            predicted_expense = monthly_avg * seasonal_factor
            predicted_balance = income - predicted_expense
            current_balance += predicted_balance

            predictions.append({
                "month": i,
                "month_name": datetime(2024, future_month, 1).strftime('%B'),
                "predicted_income": income,
                "predicted_expense": round(predicted_expense, 2),
                "predicted_balance": round(predicted_balance, 2),
                "cumulative_balance": round(current_balance, 2),
                "status": "positive" if predicted_balance > 0 else "negative"
            })

        # 警告
        warnings = []
        if any(p['cumulative_balance'] < 0 for p in predictions):
            warnings.append("警告：預測期間內可能出現資金短缺")

        if any(p['predicted_expense'] > income for p in predictions):
            warnings.append("警告：某些月份支出可能超過收入")

        return {
            "predictions": predictions,
            "current_avg_monthly_expense": round(monthly_avg, 2),
            "warnings": warnings
        }

    def smart_budget_allocation(self, total_budget: float, expenses: List[Dict]) -> Dict:
        """
        智能預算分配建議

        Args:
            total_budget: 總預算
            expenses: 歷史費用

        Returns:
            dict: 預算分配建議
        """
        if not expenses:
            # 默認分配（50/30/20 法則）
            return {
                "allocations": {
                    "必需品": {"amount": total_budget * 0.5, "percentage": 50},
                    "娛樂": {"amount": total_budget * 0.3, "percentage": 30},
                    "儲蓄": {"amount": total_budget * 0.2, "percentage": 20}
                },
                "method": "50/30/20 法則（默認）"
            }

        df = pd.DataFrame(expenses)
        df['date'] = pd.to_datetime(df['date'])

        # 基於歷史數據計算各分類佔比
        category_totals = df.groupby('category')['amount'].sum()
        total = category_totals.sum()

        # 計算月數
        num_months = df['date'].dt.to_period('M').nunique()

        allocations = {}
        for category, amount in category_totals.items():
            percentage = (amount / total) * 100
            allocated_amount = (total_budget * amount) / total

            allocations[category] = {
                "amount": round(allocated_amount, 2),
                "percentage": round(percentage, 1),
                "historical_avg": round(amount / num_months, 2)
            }

        # 建議儲蓄
        total_allocated = sum(a['amount'] for a in allocations.values())
        if total_allocated < total_budget:
            allocations['儲蓄/緊急預備金'] = {
                "amount": round(total_budget - total_allocated, 2),
                "percentage": round((total_budget - total_allocated) / total_budget * 100, 1),
                "historical_avg": 0
            }

        return {
            "allocations": allocations,
            "method": "基於歷史數據",
            "total_budget": total_budget
        }

    def expense_forecast_accuracy(self, actual_expenses: List[Dict],
                                   predicted_expenses: Dict) -> Dict:
        """
        評估預測準確度

        Args:
            actual_expenses: 實際費用
            predicted_expenses: 預測費用

        Returns:
            dict: 準確度評估
        """
        if not actual_expenses:
            return {"accuracy": 0, "note": "無實際數據"}

        actual_total = sum(e['amount'] for e in actual_expenses)
        predicted_total = predicted_expenses.get('predicted_total', 0)

        if predicted_total == 0:
            return {"accuracy": 0, "note": "無預測數據"}

        # 計算誤差
        error = abs(actual_total - predicted_total)
        error_percentage = (error / actual_total) * 100

        accuracy = max(0, 100 - error_percentage)

        return {
            "accuracy": round(accuracy, 2),
            "actual_total": round(actual_total, 2),
            "predicted_total": round(predicted_total, 2),
            "error": round(error, 2),
            "error_percentage": round(error_percentage, 2),
            "assessment": "excellent" if accuracy > 90 else "good" if accuracy > 75 else "fair" if accuracy > 60 else "poor"
        }
