"""
销售分析 AI 增强模块
提供智能预测、异常检测和自动洞察
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any
from datetime import datetime, timedelta


class SalesAIEnhancer:
    """销售分析 AI 增强器"""

    def __init__(self):
        pass

    def predict_sales(
        self,
        sales_df: pd.DataFrame,
        days_ahead: int = 30
    ) -> Dict[str, Any]:
        """
        预测未来销售额

        Args:
            sales_df: 销售数据（需包含 order_date 和 amount 列）
            days_ahead: 预测天数

        Returns:
            预测结果字典
        """
        # 按日期聚合
        daily_sales = sales_df.groupby('order_date')['amount'].sum().reset_index()
        daily_sales = daily_sales.sort_values('order_date')

        # 简单的移动平均预测
        window = min(7, len(daily_sales) // 4)
        if window > 0:
            trend = daily_sales['amount'].rolling(window=window).mean().iloc[-1]
        else:
            trend = daily_sales['amount'].mean()

        # 计算增长率
        recent_data = daily_sales['amount'].tail(30).values
        if len(recent_data) > 1:
            growth_rate = (recent_data[-1] - recent_data[0]) / recent_data[0] / 30
        else:
            growth_rate = 0

        # 生成预测
        last_date = daily_sales['order_date'].max()
        predictions = []

        for i in range(1, days_ahead + 1):
            pred_date = last_date + timedelta(days=i)
            # 应用增长率
            pred_value = trend * (1 + growth_rate * i)
            predictions.append({
                'date': pred_date,
                'predicted_sales': pred_value,
                'confidence': max(0.5, 1 - (i / days_ahead) * 0.3)  # 置信度随时间递减
            })

        return {
            'predictions': pd.DataFrame(predictions),
            'base_trend': trend,
            'growth_rate': growth_rate * 100,  # 转换为百分比
            'method': 'Moving Average with Growth'
        }

    def detect_sales_anomalies(
        self,
        sales_df: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """
        检测销售异常

        Args:
            sales_df: 销售数据

        Returns:
            异常列表
        """
        # 按日期聚合
        daily_sales = sales_df.groupby('order_date')['amount'].sum().reset_index()

        # 计算统计量
        mean = daily_sales['amount'].mean()
        std = daily_sales['amount'].std()

        anomalies = []

        for idx, row in daily_sales.iterrows():
            z_score = abs((row['amount'] - mean) / std) if std > 0 else 0

            if z_score > 2.5:  # 2.5个标准差
                anomalies.append({
                    'date': row['order_date'],
                    'amount': row['amount'],
                    'expected': mean,
                    'z_score': z_score,
                    'type': 'low' if row['amount'] < mean else 'high',
                    'severity': 'critical' if z_score > 3 else 'warning'
                })

        return anomalies

    def generate_sales_insights(
        self,
        sales_df: pd.DataFrame,
        customers_df: pd.DataFrame = None
    ) -> List[str]:
        """
        生成销售洞察

        Args:
            sales_df: 销售数据
            customers_df: 客户数据（可选）

        Returns:
            洞察列表
        """
        insights = []

        # 1. 总体趋势
        sales_df_sorted = sales_df.sort_values('order_date')
        first_month_sales = sales_df_sorted.head(30)['amount'].sum()
        last_month_sales = sales_df_sorted.tail(30)['amount'].sum()

        if first_month_sales > 0:
            growth = ((last_month_sales - first_month_sales) / first_month_sales * 100)
            if growth > 10:
                insights.append(f"📈 销售额呈增长趋势，最近30天相比开始增长了 {growth:.1f}%")
            elif growth < -10:
                insights.append(f"📉 销售额呈下降趋势，最近30天相比开始下降了 {abs(growth):.1f}%")
            else:
                insights.append(f"➡️ 销售额相对稳定，波动在 {abs(growth):.1f}% 以内")

        # 2. 最畅销产品
        if 'product_name' in sales_df.columns:
            top_product = sales_df.groupby('product_name')['amount'].sum().idxmax()
            top_product_sales = sales_df.groupby('product_name')['amount'].sum().max()
            total_sales = sales_df['amount'].sum()
            contribution = (top_product_sales / total_sales * 100)
            insights.append(f"⭐ 最畅销产品是 '{top_product}'，占总销售额的 {contribution:.1f}%")

        # 3. 最佳销售渠道
        if 'channel' in sales_df.columns:
            top_channel = sales_df.groupby('channel')['amount'].sum().idxmax()
            channel_sales = sales_df.groupby('channel')['amount'].sum()
            top_channel_pct = (channel_sales[top_channel] / channel_sales.sum() * 100)
            insights.append(f"📺 最佳销售渠道是 '{top_channel}'，占 {top_channel_pct:.1f}%")

        # 4. 最佳地区
        if 'region' in sales_df.columns:
            top_region = sales_df.groupby('region')['amount'].sum().idxmax()
            region_sales = sales_df.groupby('region')['amount'].sum()
            top_region_pct = (region_sales[top_region] / region_sales.sum() * 100)
            insights.append(f"🌍 最佳销售地区是 '{top_region}'，占 {top_region_pct:.1f}%")

        # 5. 客户洞察
        if customers_df is not None and 'customer_id' in customers_df.columns:
            total_customers = customers_df['customer_id'].nunique()
            avg_transaction = customers_df['amount'].mean()
            insights.append(f"👥 共有 {total_customers} 位客户，平均交易金额 ${avg_transaction:.2f}")

        # 6. 周期性模式
        if 'order_date' in sales_df.columns:
            sales_df['day_of_week'] = pd.to_datetime(sales_df['order_date']).dt.dayofweek
            daily_avg = sales_df.groupby('day_of_week')['amount'].mean()
            best_day = daily_avg.idxmax()
            worst_day = daily_avg.idxmin()

            day_names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
            insights.append(f"📅 {day_names[best_day]}销售最佳，{day_names[worst_day]}销售最弱")

        return insights

    def recommend_actions(
        self,
        sales_df: pd.DataFrame,
        anomalies: List[Dict],
        predictions: Dict
    ) -> List[str]:
        """
        推荐行动建议

        Args:
            sales_df: 销售数据
            anomalies: 异常列表
            predictions: 预测结果

        Returns:
            建议列表
        """
        recommendations = []

        # 基于异常
        if anomalies:
            critical_anomalies = [a for a in anomalies if a['severity'] == 'critical']
            if critical_anomalies:
                recommendations.append(
                    f"⚠️ 发现 {len(critical_anomalies)} 个严重销售异常，建议立即调查原因"
                )

            low_anomalies = [a for a in anomalies if a['type'] == 'low']
            if len(low_anomalies) > 3:
                recommendations.append(
                    "📉 多次出现销售低点，建议分析是否存在系统性问题"
                )

        # 基于预测
        if predictions and 'growth_rate' in predictions:
            growth_rate = predictions['growth_rate']

            if growth_rate < -5:
                recommendations.append(
                    f"⚠️ 预测销售下降趋势（{growth_rate:.1f}%），建议：\n"
                    "  - 加强营销推广\n"
                    "  - 推出促销活动\n"
                    "  - 优化产品组合"
                )
            elif growth_rate > 15:
                recommendations.append(
                    f"🚀 预测销售强劲增长（{growth_rate:.1f}%），建议：\n"
                    "  - 增加库存准备\n"
                    "  - 扩大生产能力\n"
                    "  - 优化供应链"
                )

        # 基于产品分布
        if 'product_name' in sales_df.columns:
            product_sales = sales_df.groupby('product_name')['amount'].sum()
            top_product_pct = (product_sales.max() / product_sales.sum() * 100)

            if top_product_pct > 50:
                recommendations.append(
                    f"⚡ 销售过度依赖单一产品（{top_product_pct:.1f}%），建议：\n"
                    "  - 推广其他产品线\n"
                    "  - 降低业务风险\n"
                    "  - 开发新产品"
                )

        # 基于渠道
        if 'channel' in sales_df.columns:
            channel_sales = sales_df.groupby('channel')['amount'].sum()
            if len(channel_sales) > 1:
                lowest_channel = channel_sales.idxmin()
                lowest_pct = (channel_sales[lowest_channel] / channel_sales.sum() * 100)

                if lowest_pct < 10:
                    recommendations.append(
                        f"📢 '{lowest_channel}' 渠道表现不佳（{lowest_pct:.1f}%），建议：\n"
                        "  - 优化渠道策略\n"
                        "  - 增加投入或考虑退出"
                    )

        if not recommendations:
            recommendations.append("✅ 当前销售状况良好，建议保持现有策略")

        return recommendations


def add_ai_tab_to_sales_app():
    """
    为销售分析应用添加 AI 标签页
    这个函数可以被集成到主应用中
    """
    import streamlit as st

    st.header("🤖 AI 智能分析")
    st.markdown("**AI 驱动的销售预测和洞察**")

    # 这里可以添加 AI 功能的 UI
    st.info("AI 增强功能已集成！使用上述功能进行智能分析。")

    return True
