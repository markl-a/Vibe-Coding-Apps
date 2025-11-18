"""
庫存管理AI輔助功能
提供智能補貨建議、庫存優化、需求預測等功能
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import statistics


class InventoryAIAssistant:
    """庫存管理AI助手"""

    def __init__(self, inventory_manager):
        """初始化AI助手"""
        self.inventory_manager = inventory_manager

    def suggest_reorder(self, days_to_analyze: int = 30,
                       safety_stock_factor: float = 1.5) -> List[Dict]:
        """
        智能補貨建議

        根據歷史消耗數據，分析哪些產品需要補貨

        Args:
            days_to_analyze: 分析過去幾天的數據
            safety_stock_factor: 安全庫存係數（建議庫存 = 平均消耗 * 天數 * 係數）

        Returns:
            補貨建議列表
        """
        suggestions = []

        # 獲取所有產品
        products = self.inventory_manager.get_all_products()

        for product in products:
            product_code = product['code']

            # 獲取歷史異動記錄
            transactions = self.inventory_manager.get_transactions(
                product_code=product_code,
                limit=1000
            )

            # 分析過去N天的出庫量
            cutoff_date = datetime.now() - timedelta(days=days_to_analyze)
            recent_outbound = [
                t for t in transactions
                if t['transaction_type'] == 'OUT' and
                datetime.fromisoformat(t['timestamp']) >= cutoff_date
            ]

            if not recent_outbound:
                continue

            # 計算平均每日消耗量
            total_outbound = sum(t['quantity'] for t in recent_outbound)
            avg_daily_consumption = total_outbound / days_to_analyze

            # 獲取當前庫存
            current_stocks = self.inventory_manager.get_stock(product_code)
            if isinstance(current_stocks, dict):
                current_stocks = [current_stocks] if current_stocks.get('quantity', 0) > 0 else []

            total_current_stock = sum(s['quantity'] for s in current_stocks)

            # 計算建議補貨量
            # 建議庫存 = 平均每日消耗 * 天數 * 安全係數
            recommended_stock = avg_daily_consumption * days_to_analyze * safety_stock_factor
            min_quantity = product['min_quantity']

            # 使用最低庫存量和計算出的建議庫存量中較大的那個
            target_stock = max(recommended_stock, min_quantity)

            if total_current_stock < target_stock:
                reorder_quantity = target_stock - total_current_stock

                # 計算預計用完天數
                days_until_stockout = (
                    total_current_stock / avg_daily_consumption
                    if avg_daily_consumption > 0 else 999
                )

                suggestion = {
                    'product_code': product_code,
                    'product_name': product['name'],
                    'current_stock': total_current_stock,
                    'avg_daily_consumption': round(avg_daily_consumption, 2),
                    'recommended_stock': round(target_stock, 2),
                    'reorder_quantity': round(reorder_quantity, 2),
                    'days_until_stockout': round(days_until_stockout, 1),
                    'urgency': self._calculate_urgency(days_until_stockout),
                    'reason': self._generate_reorder_reason(
                        total_current_stock, target_stock,
                        avg_daily_consumption, days_until_stockout
                    )
                }
                suggestions.append(suggestion)

        # 按緊急程度排序
        suggestions.sort(key=lambda x: (
            {'high': 0, 'medium': 1, 'low': 2}[x['urgency']],
            x['days_until_stockout']
        ))

        return suggestions

    def _calculate_urgency(self, days_until_stockout: float) -> str:
        """計算緊急程度"""
        if days_until_stockout < 7:
            return 'high'
        elif days_until_stockout < 14:
            return 'medium'
        else:
            return 'low'

    def _generate_reorder_reason(self, current_stock: float, target_stock: float,
                                 avg_consumption: float, days: float) -> str:
        """生成補貨原因說明"""
        if days < 7:
            return f"緊急！當前庫存僅可維持{days:.1f}天，建議立即補貨"
        elif current_stock < target_stock * 0.5:
            return f"庫存已低於建議量50%，平均每日消耗{avg_consumption:.1f}個"
        else:
            return f"預計{days:.1f}天後庫存不足，建議提前補貨"

    def analyze_slow_moving_stock(self, days_threshold: int = 60) -> List[Dict]:
        """
        分析滯銷品

        找出長時間沒有出庫的產品

        Args:
            days_threshold: 定義滯銷的天數閾值

        Returns:
            滯銷品列表
        """
        slow_moving = []

        # 獲取所有有庫存的產品
        all_stock = self.inventory_manager.get_all_stock()

        for stock in all_stock:
            product_code = stock['product_code']

            # 獲取最近的出庫記錄
            transactions = self.inventory_manager.get_transactions(
                product_code=product_code,
                transaction_type='OUT',
                limit=1
            )

            if not transactions:
                # 從未出庫過
                days_since_last_outbound = 999
                last_outbound_date = None
            else:
                last_transaction = transactions[0]
                last_outbound_date = datetime.fromisoformat(last_transaction['timestamp'])
                days_since_last_outbound = (datetime.now() - last_outbound_date).days

            if days_since_last_outbound >= days_threshold:
                # 計算庫存價值（假設有單價）
                stock_value = stock['quantity']  # 簡化版，實際應該乘以單價

                slow_moving.append({
                    'product_code': product_code,
                    'product_name': stock['product_name'],
                    'warehouse': stock['warehouse_name'],
                    'quantity': stock['quantity'],
                    'days_since_last_outbound': days_since_last_outbound,
                    'last_outbound_date': last_outbound_date.strftime('%Y-%m-%d') if last_outbound_date else '從未出庫',
                    'suggestion': self._generate_slow_moving_suggestion(days_since_last_outbound, stock['quantity'])
                })

        # 按滯銷天數排序
        slow_moving.sort(key=lambda x: x['days_since_last_outbound'], reverse=True)

        return slow_moving

    def _generate_slow_moving_suggestion(self, days: int, quantity: int) -> str:
        """生成滯銷品處理建議"""
        if days > 180:
            return f"超過半年無出庫，建議清倉促銷或報廢處理"
        elif days > 90:
            return f"超過3個月無出庫，建議折扣促銷"
        else:
            return f"已{days}天無出庫，建議關注銷售狀況"

    def predict_stock_demand(self, product_code: str, days_ahead: int = 30) -> Dict:
        """
        預測未來需求

        基於歷史數據預測未來N天的需求量

        Args:
            product_code: 產品編號
            days_ahead: 預測未來幾天

        Returns:
            預測結果
        """
        # 獲取歷史出庫記錄
        transactions = self.inventory_manager.get_transactions(
            product_code=product_code,
            transaction_type='OUT',
            limit=1000
        )

        if not transactions:
            return {
                'product_code': product_code,
                'prediction': 0,
                'confidence': 'low',
                'method': 'no_data',
                'message': '無歷史數據，無法預測'
            }

        # 按日期分組統計每日出庫量
        daily_consumption = defaultdict(float)
        for t in transactions:
            date = datetime.fromisoformat(t['timestamp']).date()
            daily_consumption[date] += t['quantity']

        # 計算統計指標
        quantities = list(daily_consumption.values())

        if len(quantities) < 7:
            return {
                'product_code': product_code,
                'prediction': sum(quantities),
                'confidence': 'low',
                'method': 'simple_average',
                'message': '數據量不足，使用簡單平均'
            }

        # 計算平均值和標準差
        mean_consumption = statistics.mean(quantities)
        std_consumption = statistics.stdev(quantities) if len(quantities) > 1 else 0

        # 簡單預測：假設未來消耗等於歷史平均
        predicted_total = mean_consumption * days_ahead

        # 計算置信度
        coefficient_of_variation = std_consumption / mean_consumption if mean_consumption > 0 else 0
        if coefficient_of_variation < 0.3:
            confidence = 'high'
        elif coefficient_of_variation < 0.6:
            confidence = 'medium'
        else:
            confidence = 'low'

        return {
            'product_code': product_code,
            'predicted_total_demand': round(predicted_total, 2),
            'avg_daily_demand': round(mean_consumption, 2),
            'std_daily_demand': round(std_consumption, 2),
            'confidence': confidence,
            'days_analyzed': len(daily_consumption),
            'method': 'moving_average',
            'recommendation': self._generate_demand_recommendation(
                predicted_total, mean_consumption, confidence
            )
        }

    def _generate_demand_recommendation(self, predicted_total: float,
                                       avg_daily: float, confidence: str) -> str:
        """生成需求預測建議"""
        if confidence == 'high':
            return f"預測準確度高，建議按預測量{predicted_total:.0f}備貨"
        elif confidence == 'medium':
            return f"預測準確度中等，建議準備{predicted_total * 1.2:.0f}（含20%緩衝）"
        else:
            return f"歷史數據波動大，建議保守備貨並密切監控"

    def optimize_warehouse_allocation(self) -> List[Dict]:
        """
        倉庫庫存優化建議

        分析各倉庫的庫存分布，提供優化建議

        Returns:
            優化建議列表
        """
        recommendations = []

        # 獲取所有產品
        products = self.inventory_manager.get_all_products()

        for product in products:
            product_code = product['code']

            # 獲取該產品在各倉庫的庫存
            stocks = self.inventory_manager.get_stock(product_code)
            if isinstance(stocks, dict):
                stocks = [stocks] if stocks.get('quantity', 0) > 0 else []

            if len(stocks) <= 1:
                continue  # 只在一個倉庫，無需優化

            # 分析各倉庫的出庫頻率
            warehouse_stats = {}
            for stock in stocks:
                warehouse_code = stock['warehouse_code']

                # 獲取該倉庫的出庫記錄
                transactions = self.inventory_manager.get_transactions(
                    product_code=product_code,
                    warehouse_code=warehouse_code,
                    transaction_type='OUT',
                    limit=100
                )

                warehouse_stats[warehouse_code] = {
                    'name': stock['warehouse_name'],
                    'current_stock': stock['quantity'],
                    'outbound_count': len(transactions),
                    'total_outbound': sum(t['quantity'] for t in transactions)
                }

            # 計算總出庫量
            total_outbound = sum(ws['total_outbound'] for ws in warehouse_stats.values())

            if total_outbound == 0:
                continue

            # 檢查是否有嚴重的庫存不平衡
            for warehouse_code, stats in warehouse_stats.items():
                outbound_ratio = stats['total_outbound'] / total_outbound if total_outbound > 0 else 0
                total_stock = sum(ws['current_stock'] for ws in warehouse_stats.values())
                stock_ratio = stats['current_stock'] / total_stock if total_stock > 0 else 0

                # 如果出庫比例和庫存比例相差超過30%，建議調整
                if abs(outbound_ratio - stock_ratio) > 0.3:
                    ideal_stock = total_stock * outbound_ratio
                    adjustment = ideal_stock - stats['current_stock']

                    if abs(adjustment) > 10:  # 只有調整量大於10才建議
                        recommendations.append({
                            'product_code': product_code,
                            'product_name': product['name'],
                            'warehouse': stats['name'],
                            'current_stock': stats['current_stock'],
                            'ideal_stock': round(ideal_stock, 2),
                            'adjustment': round(adjustment, 2),
                            'action': '調入' if adjustment > 0 else '調出',
                            'reason': f"出庫佔比{outbound_ratio:.0%}，但庫存佔比{stock_ratio:.0%}，建議調整平衡"
                        })

        return recommendations

    def get_inventory_health_report(self) -> Dict:
        """
        獲取庫存健康度報告

        Returns:
            健康度報告
        """
        # 獲取基本統計
        summary = self.inventory_manager.get_stock_summary()

        # 獲取低庫存產品
        low_stock = self.inventory_manager.get_low_stock_products()

        # 獲取補貨建議
        reorder_suggestions = self.suggest_reorder(days_to_analyze=30)

        # 獲取滯銷品
        slow_moving = self.analyze_slow_moving_stock(days_threshold=60)

        # 計算健康度得分
        total_products = summary['total_products']
        health_score = 100

        # 低庫存產品扣分
        if len(low_stock) > 0:
            health_score -= min(30, len(low_stock) / total_products * 100)

        # 需要緊急補貨扣分
        urgent_reorders = [r for r in reorder_suggestions if r['urgency'] == 'high']
        if len(urgent_reorders) > 0:
            health_score -= min(20, len(urgent_reorders) / total_products * 100)

        # 滯銷品扣分
        if len(slow_moving) > 0:
            health_score -= min(20, len(slow_moving) / total_products * 100)

        health_score = max(0, health_score)

        # 判定健康等級
        if health_score >= 80:
            health_grade = 'excellent'
            health_message = '庫存狀況良好'
        elif health_score >= 60:
            health_grade = 'good'
            health_message = '庫存狀況正常，有小幅改進空間'
        elif health_score >= 40:
            health_grade = 'fair'
            health_message = '庫存狀況一般，建議關注補貨和滯銷問題'
        else:
            health_grade = 'poor'
            health_message = '庫存狀況較差，需要立即處理'

        return {
            'health_score': round(health_score, 1),
            'health_grade': health_grade,
            'health_message': health_message,
            'summary': summary,
            'issues': {
                'low_stock_count': len(low_stock),
                'urgent_reorder_count': len(urgent_reorders),
                'slow_moving_count': len(slow_moving)
            },
            'recommendations': {
                'immediate_actions': len(urgent_reorders),
                'reorder_suggestions': len(reorder_suggestions),
                'slow_moving_items': len(slow_moving)
            },
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
