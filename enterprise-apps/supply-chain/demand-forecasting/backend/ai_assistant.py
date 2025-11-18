"""
AI 助手模組
提供智能對話、建議生成和洞察分析
"""
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json


class DemandForecastingAssistant:
    """需求預測 AI 助手"""

    def __init__(self):
        self.context = {}

    def analyze_forecast(
        self,
        historical_data: pd.DataFrame,
        forecasts: List[Dict],
        accuracy_metrics: Dict
    ) -> Dict:
        """
        分析預測結果並生成智能洞察

        Args:
            historical_data: 歷史數據
            forecasts: 預測結果
            accuracy_metrics: 準確度指標

        Returns:
            分析報告
        """
        insights = []
        recommendations = []
        alerts = []

        # 1. 分析準確度
        mape = accuracy_metrics.get('mape', 0)
        if mape < 5:
            insights.append({
                "type": "accuracy",
                "level": "excellent",
                "message": f"預測準確度極佳 (MAPE: {mape:.2f}%)",
                "details": "模型表現優秀，可以信賴這些預測結果"
            })
        elif mape < 10:
            insights.append({
                "type": "accuracy",
                "level": "good",
                "message": f"預測準確度良好 (MAPE: {mape:.2f}%)",
                "details": "模型表現穩定，適合用於業務決策"
            })
        elif mape < 20:
            insights.append({
                "type": "accuracy",
                "level": "moderate",
                "message": f"預測準確度中等 (MAPE: {mape:.2f}%)",
                "details": "建議結合人工判斷，並考慮增加更多特徵或數據"
            })
            recommendations.append("收集更多歷史數據以提升預測準確度")
        else:
            alerts.append({
                "type": "accuracy",
                "severity": "high",
                "message": f"預測準確度較低 (MAPE: {mape:.2f}%)",
                "action": "建議檢查數據質量，可能存在異常值或趨勢變化"
            })
            recommendations.append("檢查數據質量，移除異常值")
            recommendations.append("考慮使用更複雜的模型或添加外部變量")

        # 2. 分析趨勢
        if len(forecasts) >= 3:
            forecast_values = [f['predicted_quantity'] for f in forecasts]
            trend = self._analyze_trend(forecast_values)

            if trend['type'] == 'increasing':
                insights.append({
                    "type": "trend",
                    "level": "info",
                    "message": f"預測顯示上升趨勢 (增長率: {trend['rate']:.1f}%)",
                    "details": "需求預計將增長，建議提前備貨"
                })
                recommendations.append("考慮增加庫存水平以應對需求增長")
                recommendations.append("與供應商溝通，確保供應能力")
            elif trend['type'] == 'decreasing':
                insights.append({
                    "type": "trend",
                    "level": "warning",
                    "message": f"預測顯示下降趨勢 (下降率: {trend['rate']:.1f}%)",
                    "details": "需求預計將下降，注意庫存積壓風險"
                })
                recommendations.append("調整庫存策略，避免過度庫存")
                recommendations.append("評估促銷活動或產品調整")
            else:
                insights.append({
                    "type": "trend",
                    "level": "info",
                    "message": "預測顯示穩定趨勢",
                    "details": "需求保持平穩，維持當前策略即可"
                })

        # 3. 分析季節性
        if historical_data is not None and len(historical_data) >= 12:
            seasonality = self._detect_seasonality(historical_data['quantity'].values)
            if seasonality['has_seasonality']:
                insights.append({
                    "type": "seasonality",
                    "level": "info",
                    "message": f"檢測到{seasonality['period']}個週期的季節性模式",
                    "details": f"峰值月份: {seasonality['peak_months']}"
                })
                recommendations.append(f"在{seasonality['peak_months']}前提前備貨")

        # 4. 檢測異常
        forecast_values = [f['predicted_quantity'] for f in forecasts]
        anomalies = self._detect_forecast_anomalies(forecast_values)
        if anomalies:
            for anomaly in anomalies:
                alerts.append({
                    "type": "anomaly",
                    "severity": "medium",
                    "message": f"預測第 {anomaly['index']+1} 期出現異常值",
                    "action": f"預測值 {anomaly['value']:.0f} 偏離平均值 {anomaly['deviation']:.1f}%"
                })

        # 5. 庫存建議
        inventory_advice = self._generate_inventory_advice(forecasts)
        recommendations.extend(inventory_advice)

        return {
            "insights": insights,
            "recommendations": recommendations,
            "alerts": alerts,
            "summary": self._generate_summary(insights, alerts),
            "next_actions": self._prioritize_actions(recommendations)[:5]
        }

    def _analyze_trend(self, values: List[float]) -> Dict:
        """分析趨勢"""
        if len(values) < 2:
            return {"type": "stable", "rate": 0}

        # 簡單線性回歸
        x = np.arange(len(values))
        y = np.array(values)

        # 計算斜率
        slope = np.polyfit(x, y, 1)[0]

        # 計算增長率
        avg_value = np.mean(values)
        rate = (slope / avg_value) * 100 if avg_value != 0 else 0

        if abs(rate) < 2:
            return {"type": "stable", "rate": rate}
        elif rate > 0:
            return {"type": "increasing", "rate": rate}
        else:
            return {"type": "decreasing", "rate": abs(rate)}

    def _detect_seasonality(self, data: np.ndarray) -> Dict:
        """檢測季節性"""
        from scipy import signal

        if len(data) < 24:
            return {"has_seasonality": False}

        # 使用自相關函數檢測週期性
        acf = np.correlate(data - np.mean(data), data - np.mean(data), mode='full')
        acf = acf[len(acf)//2:]
        acf = acf / acf[0]

        # 查找峰值
        peaks, _ = signal.find_peaks(acf[1:13], height=0.3)

        if len(peaks) > 0:
            period = peaks[0] + 1
            # 找出峰值月份
            seasonal_pattern = data.reshape(-1, period).mean(axis=0)
            peak_months = np.argsort(seasonal_pattern)[-3:]  # 前三個峰值月

            return {
                "has_seasonality": True,
                "period": period,
                "peak_months": ", ".join([f"{m+1}月" for m in peak_months])
            }

        return {"has_seasonality": False}

    def _detect_forecast_anomalies(self, values: List[float]) -> List[Dict]:
        """檢測預測異常值"""
        if len(values) < 3:
            return []

        anomalies = []
        mean_val = np.mean(values)
        std_val = np.std(values)

        for i, val in enumerate(values):
            if std_val > 0:
                z_score = abs((val - mean_val) / std_val)
                if z_score > 2:  # 2個標準差以外
                    deviation = ((val - mean_val) / mean_val) * 100
                    anomalies.append({
                        "index": i,
                        "value": val,
                        "deviation": deviation
                    })

        return anomalies

    def _generate_inventory_advice(self, forecasts: List[Dict]) -> List[str]:
        """生成庫存建議"""
        advice = []

        if not forecasts:
            return advice

        # 計算平均預測需求
        avg_demand = np.mean([f['predicted_quantity'] for f in forecasts])

        # 計算變異性
        std_demand = np.std([f['predicted_quantity'] for f in forecasts])
        cv = (std_demand / avg_demand) * 100 if avg_demand > 0 else 0

        if cv < 10:
            advice.append(f"需求穩定(變異係數: {cv:.1f}%)，可採用定期定量訂購策略")
        elif cv < 25:
            advice.append(f"需求中等變異(變異係數: {cv:.1f}%)，建議採用定期不定量訂購策略")
        else:
            advice.append(f"需求高度變異(變異係數: {cv:.1f}%)，建議提高安全庫存並密切監控")

        # 檢查置信區間
        first_forecast = forecasts[0]
        if 'lower_bound' in first_forecast and 'upper_bound' in first_forecast:
            uncertainty = first_forecast['upper_bound'] - first_forecast['lower_bound']
            if uncertainty / first_forecast['predicted_quantity'] > 0.5:
                advice.append("預測不確定性較高，建議增加安全庫存緩衝")

        return advice

    def _generate_summary(self, insights: List[Dict], alerts: List[Dict]) -> str:
        """生成摘要"""
        summary_parts = []

        if insights:
            accuracy_insight = next(
                (i for i in insights if i['type'] == 'accuracy'),
                None
            )
            if accuracy_insight:
                summary_parts.append(accuracy_insight['message'])

        if alerts:
            summary_parts.append(f"發現 {len(alerts)} 個需要關注的問題")

        if not summary_parts:
            summary_parts.append("預測分析完成，未發現異常")

        return "。".join(summary_parts)

    def _prioritize_actions(self, recommendations: List[str]) -> List[str]:
        """優先排序行動項"""
        # 簡單的優先級排序（可以根據關鍵詞）
        priority_keywords = {
            "檢查": 3,
            "增加": 2,
            "提前": 2,
            "密切": 2,
            "調整": 1,
            "考慮": 1
        }

        def get_priority(rec: str) -> int:
            for keyword, priority in priority_keywords.items():
                if keyword in rec:
                    return priority
            return 0

        return sorted(recommendations, key=get_priority, reverse=True)

    def chat(self, user_message: str, context: Dict = None) -> str:
        """
        聊天功能（簡化版）

        Args:
            user_message: 用戶消息
            context: 上下文信息

        Returns:
            AI 回覆
        """
        message_lower = user_message.lower()

        # 更新上下文
        if context:
            self.context.update(context)

        # 簡單的規則匹配（實際應用可接入 LLM）
        if any(keyword in message_lower for keyword in ['準確', 'accuracy', 'mape']):
            if 'accuracy_metrics' in self.context:
                mape = self.context['accuracy_metrics'].get('mape', 0)
                return f"當前預測模型的 MAPE 為 {mape:.2f}%。" + (
                    "準確度很高，可以放心使用。" if mape < 10 else
                    "建議收集更多數據或調整模型參數以提升準確度。"
                )
            return "請先生成預測結果，我才能評估準確度。"

        elif any(keyword in message_lower for keyword in ['趨勢', 'trend']):
            if 'forecasts' in self.context:
                forecasts = self.context['forecasts']
                trend = self._analyze_trend([f['predicted_quantity'] for f in forecasts])
                if trend['type'] == 'increasing':
                    return f"預測顯示需求呈上升趨勢，增長率約 {trend['rate']:.1f}%。建議提前備貨。"
                elif trend['type'] == 'decreasing':
                    return f"預測顯示需求呈下降趨勢，下降率約 {trend['rate']:.1f}%。注意控制庫存。"
                else:
                    return "預測顯示需求保持穩定，維持當前策略即可。"
            return "請先生成預測結果，我才能分析趨勢。"

        elif any(keyword in message_lower for keyword in ['建議', 'recommend', '怎麼辦']):
            return """我可以提供以下幾方面的建議：
1. 預測準確度評估和改進建議
2. 庫存策略優化建議
3. 供應鏈風險預警
4. 季節性模式分析

請告訴我您最關心哪個方面？"""

        elif any(keyword in message_lower for keyword in ['幫助', 'help', '功能']):
            return """我是需求預測 AI 助手，可以協助您：
- 📊 分析預測結果的準確度
- 📈 識別需求趨勢和季節性模式
- 💡 提供庫存管理建議
- ⚠️ 預警異常情況
- 🤝 回答供應鏈相關問題

您可以問我：「當前預測準確嗎？」、「未來趨勢如何？」等問題。"""

        else:
            return """我理解您的問題。我可以幫您分析：
- 預測準確度
- 需求趨勢
- 庫存建議
- 風險預警

請嘗試更具體的問題，例如「預測準確嗎？」或「趨勢如何？」"""


def generate_natural_language_report(
    item_name: str,
    forecasts: List[Dict],
    accuracy_metrics: Dict,
    insights: Dict
) -> str:
    """
    生成自然語言預測報告

    Args:
        item_name: 物料名稱
        forecasts: 預測結果
        accuracy_metrics: 準確度指標
        insights: 洞察分析

    Returns:
        自然語言報告
    """
    report_lines = []

    # 標題
    report_lines.append(f"# {item_name} 需求預測報告")
    report_lines.append(f"生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    report_lines.append("")

    # 摘要
    report_lines.append("## 執行摘要")
    report_lines.append(insights.get('summary', '預測分析完成'))
    report_lines.append("")

    # 準確度
    report_lines.append("## 預測準確度")
    mape = accuracy_metrics.get('mape', 0)
    rmse = accuracy_metrics.get('rmse', 0)
    report_lines.append(f"- 平均絕對百分比誤差 (MAPE): {mape:.2f}%")
    report_lines.append(f"- 均方根誤差 (RMSE): {rmse:.2f}")

    accuracy_level = "優秀" if mape < 5 else "良好" if mape < 10 else "中等" if mape < 20 else "需改進"
    report_lines.append(f"- 準確度評級: **{accuracy_level}**")
    report_lines.append("")

    # 預測結果
    report_lines.append("## 預測結果")
    report_lines.append("| 期間 | 預測需求 | 下界 | 上界 |")
    report_lines.append("|------|---------|------|------|")

    for i, forecast in enumerate(forecasts[:6], 1):  # 只顯示前6期
        pred = forecast['predicted_quantity']
        lower = forecast.get('lower_bound', pred * 0.9)
        upper = forecast.get('upper_bound', pred * 1.1)
        report_lines.append(f"| 期間 {i} | {pred:.0f} | {lower:.0f} | {upper:.0f} |")

    report_lines.append("")

    # 關鍵洞察
    if insights.get('insights'):
        report_lines.append("## 關鍵洞察")
        for insight in insights['insights']:
            emoji = "✅" if insight['level'] == 'excellent' else "ℹ️" if insight['level'] == 'info' else "⚠️"
            report_lines.append(f"{emoji} **{insight['message']}**")
            report_lines.append(f"   {insight['details']}")
            report_lines.append("")

    # 警報
    if insights.get('alerts'):
        report_lines.append("## ⚠️ 需要關注")
        for alert in insights['alerts']:
            report_lines.append(f"- **{alert['message']}**")
            report_lines.append(f"  行動: {alert['action']}")
            report_lines.append("")

    # 建議
    if insights.get('next_actions'):
        report_lines.append("## 💡 行動建議")
        for i, action in enumerate(insights['next_actions'], 1):
            report_lines.append(f"{i}. {action}")
        report_lines.append("")

    return "\n".join(report_lines)
