"""
AI 線索評分模組

提供基於機器學習的線索評分功能，自動評估線索質量和轉化概率。
"""

import re
from datetime import datetime, timedelta
from typing import Dict, Tuple
from django.db.models import Count, Avg
from django.utils import timezone
from .models import Lead, Activity


class LeadScoringEngine:
    """
    線索評分引擎

    使用規則引擎和統計模型自動評估線索質量
    """

    # 行業評分權重
    INDUSTRY_SCORES = {
        '科技': 90,
        '金融': 85,
        '製造': 75,
        '零售': 70,
        '服務': 65,
        '教育': 60,
        '其他': 50,
    }

    # 公司規模評分權重
    COMPANY_SIZE_SCORES = {
        '大型企業': 90,
        '中型企業': 75,
        '小型企業': 60,
        '初創公司': 50,
    }

    # 來源評分權重
    SOURCE_SCORES = {
        'referral': 90,  # 推薦
        'event': 80,     # 活動
        'website': 70,   # 網站
        'social': 60,    # 社交媒體
        'email': 55,     # 郵件
        'phone': 50,     # 電話
        'other': 40,     # 其他
    }

    def __init__(self, lead: Lead):
        """
        初始化評分引擎

        Args:
            lead: 要評分的線索對象
        """
        self.lead = lead

    def calculate_score(self) -> Tuple[int, Dict[str, any]]:
        """
        計算線索綜合評分

        Returns:
            (總分, 評分詳情字典)
        """
        scores = {
            'demographic_score': self._calculate_demographic_score(),
            'behavior_score': self._calculate_behavior_score(),
            'engagement_score': self._calculate_engagement_score(),
            'budget_score': self._calculate_budget_score(),
            'timing_score': self._calculate_timing_score(),
        }

        # 加權計算總分
        weights = {
            'demographic_score': 0.25,
            'behavior_score': 0.30,
            'engagement_score': 0.25,
            'budget_score': 0.10,
            'timing_score': 0.10,
        }

        total_score = sum(scores[key] * weights[key] for key in scores.keys())

        # 規範化到 0-100
        total_score = max(0, min(100, int(total_score)))

        return total_score, scores

    def _calculate_demographic_score(self) -> int:
        """
        計算人口統計學評分

        基於公司、行業、職位等基本信息評分
        """
        score = 50  # 基礎分

        # 行業評分
        if self.lead.industry:
            score += self.INDUSTRY_SCORES.get(self.lead.industry, 50) * 0.3

        # 公司規模評分
        if self.lead.company_size:
            score += self.COMPANY_SIZE_SCORES.get(self.lead.company_size, 50) * 0.3

        # 職位評分（高級職位加分）
        if self.lead.job_title:
            title_lower = self.lead.job_title.lower()
            if any(keyword in title_lower for keyword in ['總', '經理', 'ceo', 'cto', 'cfo', 'vp', 'director']):
                score += 20
            elif any(keyword in title_lower for keyword in ['主管', 'manager', 'lead']):
                score += 10

        # 公司名稱完整性
        if self.lead.company and len(self.lead.company) > 0:
            score += 10

        return min(100, int(score))

    def _calculate_behavior_score(self) -> int:
        """
        計算行為評分

        基於線索的互動行為評分
        """
        score = 50  # 基礎分

        # 活動記錄數量
        activities_count = self.lead.activities.count()
        score += min(30, activities_count * 5)  # 每個活動加5分，最多30分

        # 不同類型的活動
        activity_types = self.lead.activities.values_list('activity_type', flat=True).distinct()
        score += len(activity_types) * 5  # 每種類型加5分

        # 最近的活動（最近7天）
        recent_activities = self.lead.activities.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        score += min(20, recent_activities * 5)

        return min(100, int(score))

    def _calculate_engagement_score(self) -> int:
        """
        計算參與度評分

        基於線索的響應程度和活躍度評分
        """
        score = 50  # 基礎分

        # 來源評分
        score += self.SOURCE_SCORES.get(self.lead.source, 40) * 0.3

        # 最後聯繫時間（越近越好）
        if self.lead.last_contacted:
            days_since_contact = (timezone.now() - self.lead.last_contacted).days
            if days_since_contact <= 3:
                score += 25
            elif days_since_contact <= 7:
                score += 20
            elif days_since_contact <= 14:
                score += 10
            elif days_since_contact <= 30:
                score += 5

        # 狀態評分
        status_scores = {
            'new': 50,
            'contacted': 60,
            'qualified': 80,
            'unqualified': 20,
            'converted': 100,
            'lost': 0,
        }
        score += status_scores.get(self.lead.status, 50) * 0.3

        # 郵箱有效性（企業郵箱加分）
        if self.lead.email:
            if self._is_corporate_email(self.lead.email):
                score += 15

        return min(100, int(score))

    def _calculate_budget_score(self) -> int:
        """
        計算預算評分

        基於線索的預算範圍評分
        """
        if not self.lead.budget:
            return 50  # 沒有預算信息，給中等分數

        budget = float(self.lead.budget)

        if budget >= 1000000:  # 100萬以上
            return 100
        elif budget >= 500000:  # 50-100萬
            return 85
        elif budget >= 100000:  # 10-50萬
            return 70
        elif budget >= 50000:   # 5-10萬
            return 55
        else:
            return 40

    def _calculate_timing_score(self) -> int:
        """
        計算時機評分

        基於線索的時效性評分
        """
        score = 50  # 基礎分

        # 線索新鮮度（創建時間）
        days_since_creation = (timezone.now() - self.lead.created_at).days
        if days_since_creation <= 1:
            score += 40  # 新線索
        elif days_since_creation <= 7:
            score += 30
        elif days_since_creation <= 30:
            score += 20
        elif days_since_creation <= 90:
            score += 10

        # 更新頻率
        days_since_update = (timezone.now() - self.lead.updated_at).days
        if days_since_update <= 1:
            score += 10
        elif days_since_update <= 7:
            score += 5

        return min(100, int(score))

    def _is_corporate_email(self, email: str) -> bool:
        """
        判斷是否為企業郵箱

        Args:
            email: 郵箱地址

        Returns:
            是否為企業郵箱
        """
        free_email_providers = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'qq.com', '163.com', '126.com', 'sina.com'
        ]

        domain = email.split('@')[-1].lower()
        return domain not in free_email_providers

    def suggest_rating(self, score: int) -> str:
        """
        根據評分建議評級

        Args:
            score: 評分 (0-100)

        Returns:
            評級 ('hot', 'warm', 'cold')
        """
        if score >= 75:
            return 'hot'
        elif score >= 50:
            return 'warm'
        else:
            return 'cold'

    def generate_recommendation(self, score: int, scores_detail: Dict) -> str:
        """
        生成行動建議

        Args:
            score: 總評分
            scores_detail: 各項評分詳情

        Returns:
            行動建議文本
        """
        recommendations = []

        if score >= 80:
            recommendations.append("🔥 高質量線索！建議立即跟進，安排產品演示或會議。")
        elif score >= 60:
            recommendations.append("⭐ 中等質量線索，建議在2-3天內聯繫。")
        else:
            recommendations.append("📝 潛力較低，建議通過郵件培育，定期跟蹤。")

        # 具體建議
        if scores_detail['engagement_score'] < 50:
            recommendations.append("- 增加互動：嘗試通過多種渠道（電話、郵件、社交媒體）接觸。")

        if scores_detail['behavior_score'] < 50:
            recommendations.append("- 提高參與度：分享相關案例研究或白皮書。")

        if not self.lead.last_contacted:
            recommendations.append("- 首次聯繫：發送個性化介紹郵件。")
        elif (timezone.now() - self.lead.last_contacted).days > 14:
            recommendations.append("- 重新激活：線索已超過2週未聯繫，建議主動跟進。")

        if not self.lead.budget:
            recommendations.append("- 確認預算：在下次溝通中了解客戶預算範圍。")

        return "\n".join(recommendations)


class BatchLeadScorer:
    """
    批量線索評分器

    用於批量更新線索評分
    """

    @staticmethod
    def score_all_leads(queryset=None):
        """
        為所有線索計算評分

        Args:
            queryset: 可選的線索查詢集，默認為所有線索

        Returns:
            更新的線索數量
        """
        if queryset is None:
            queryset = Lead.objects.all()

        updated_count = 0

        for lead in queryset:
            engine = LeadScoringEngine(lead)
            score, _ = engine.calculate_score()
            rating = engine.suggest_rating(score)

            if lead.score != score or lead.rating != rating:
                lead.score = score
                lead.rating = rating
                lead.save(update_fields=['score', 'rating', 'updated_at'])
                updated_count += 1

        return updated_count

    @staticmethod
    def score_new_leads():
        """
        為新線索（評分為0）計算評分

        Returns:
            更新的線索數量
        """
        new_leads = Lead.objects.filter(score=0)
        return BatchLeadScorer.score_all_leads(new_leads)

    @staticmethod
    def rescore_old_leads(days=30):
        """
        重新評分舊線索

        Args:
            days: 多少天前的線索需要重新評分

        Returns:
            更新的線索數量
        """
        cutoff_date = timezone.now() - timedelta(days=days)
        old_leads = Lead.objects.filter(updated_at__lt=cutoff_date)
        return BatchLeadScorer.score_all_leads(old_leads)


class LeadAnalytics:
    """
    線索分析工具

    提供線索數據的統計分析功能
    """

    @staticmethod
    def get_score_distribution():
        """
        獲取評分分佈

        Returns:
            評分區間的統計數據
        """
        from django.db.models import Count, Q

        return {
            'excellent': Lead.objects.filter(score__gte=80).count(),
            'good': Lead.objects.filter(score__gte=60, score__lt=80).count(),
            'average': Lead.objects.filter(score__gte=40, score__lt=60).count(),
            'poor': Lead.objects.filter(score__lt=40).count(),
        }

    @staticmethod
    def get_conversion_by_score():
        """
        按評分範圍統計轉化率

        Returns:
            各評分範圍的轉化率
        """
        from django.db.models import Count, Q, Case, When, IntegerField

        results = []
        score_ranges = [
            (80, 100, 'excellent'),
            (60, 80, 'good'),
            (40, 60, 'average'),
            (0, 40, 'poor'),
        ]

        for min_score, max_score, label in score_ranges:
            total = Lead.objects.filter(
                score__gte=min_score,
                score__lt=max_score
            ).count()

            converted = Lead.objects.filter(
                score__gte=min_score,
                score__lt=max_score,
                status='converted'
            ).count()

            conversion_rate = (converted / total * 100) if total > 0 else 0

            results.append({
                'range': label,
                'min_score': min_score,
                'max_score': max_score,
                'total_leads': total,
                'converted_leads': converted,
                'conversion_rate': round(conversion_rate, 2)
            })

        return results

    @staticmethod
    def predict_conversion_probability(lead: Lead) -> float:
        """
        預測線索轉化概率

        基於歷史數據和當前評分預測轉化概率

        Args:
            lead: 線索對象

        Returns:
            轉化概率 (0-1)
        """
        # 簡單的基於評分的概率模型
        score = lead.score

        # 基礎概率曲線
        base_probability = score / 100

        # 根據狀態調整
        status_multipliers = {
            'new': 0.8,
            'contacted': 1.0,
            'qualified': 1.3,
            'unqualified': 0.2,
            'converted': 1.0,
            'lost': 0.0,
        }

        probability = base_probability * status_multipliers.get(lead.status, 1.0)

        # 根據活動數量調整
        activities_count = lead.activities.count()
        if activities_count > 5:
            probability *= 1.2
        elif activities_count == 0:
            probability *= 0.8

        return min(1.0, max(0.0, probability))
