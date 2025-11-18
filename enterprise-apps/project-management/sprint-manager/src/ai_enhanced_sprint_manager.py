"""
AI 增強的 Sprint 管理器
整合 AI 助手提供智能化的 Sprint 管理功能
"""

import sys
import os

# 添加 AI 助手模組到路徑
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../ai-assistant/src'))

from sprint_manager import SprintManager, UserStory, Sprint
from ai_assistant import AITaskEstimator, AISprintPlanner, AIPriorityAdvisor
from datetime import datetime
from typing import List, Dict, Optional


class AIEnhancedSprintManager(SprintManager):
    """AI 增強的 Sprint 管理器"""

    def __init__(self, team_name: str = "Scrum Team"):
        super().__init__(team_name)
        self.ai_estimator = AITaskEstimator()
        self.ai_planner = AISprintPlanner()
        self.ai_priority_advisor = AIPriorityAdvisor()

        # AI 輔助歷史記錄
        self.estimation_history = []
        self.planning_history = []

    def add_story_with_ai_estimation(
        self,
        title: str,
        description: str,
        complexity: str = "MEDIUM",
        priority: str = "MEDIUM",
        assignee_experience: str = "MEDIUM",
        tags: List[str] = None
    ) -> tuple:
        """
        使用 AI 估算故事點並添加到 Backlog

        Args:
            title: 故事標題
            description: 故事描述
            complexity: 複雜度 (LOW/MEDIUM/HIGH)
            priority: 優先級
            assignee_experience: 負責人經驗
            tags: 標籤

        Returns:
            (story, estimation_result) 元組
        """
        # 使用 AI 估算工時
        estimation = self.ai_estimator.estimate_task(
            title=title,
            description=description,
            complexity=complexity,
            priority=priority,
            assignee_experience=assignee_experience,
            tags=tags or []
        )

        # 轉換為故事點（假設 8 小時 = 1 故事點）
        story_points = max(1, round(estimation['estimated_hours'] / 8))

        # 創建 User Story
        story = UserStory(
            title=title,
            description=description,
            story_points=story_points,
            priority=self._priority_to_int(priority)
        )

        if tags:
            story.tags = tags

        # 添加到 Backlog
        self.add_to_backlog(story)

        # 記錄估算歷史
        self.estimation_history.append({
            'story_id': story.id,
            'title': title,
            'ai_estimated_hours': estimation['estimated_hours'],
            'story_points': story_points,
            'confidence': estimation['confidence'],
            'timestamp': datetime.now().isoformat()
        })

        return story, estimation

    def plan_sprint_with_ai(
        self,
        sprint_id: str,
        sprint_goal: str = None
    ) -> Dict:
        """
        使用 AI 智能規劃 Sprint

        Args:
            sprint_id: Sprint ID
            sprint_goal: Sprint 目標

        Returns:
            規劃結果和建議
        """
        if sprint_id not in self.sprints:
            return {'error': 'Sprint 不存在'}

        sprint = self.sprints[sprint_id]

        # 準備 Backlog 數據
        backlog = []
        for story in self.prioritize_backlog():
            if story.sprint_id is None:  # 只選擇未分配的故事
                backlog.append(story.to_dict())

        # 獲取團隊速度
        team_velocity = self.get_team_velocity()
        if team_velocity == 0:
            # 如果沒有歷史速度，使用容量的 70%
            team_velocity = self.get_team_capacity() * 0.7

        # 使用 AI 規劃
        plan = self.ai_planner.suggest_sprint_plan(
            backlog=backlog,
            team_capacity=self.get_team_capacity(),
            team_velocity=team_velocity,
            sprint_goal=sprint_goal
        )

        # 應用 AI 建議
        suggested_story_ids = [item['id'] for item in plan['suggested_items']]
        self.plan_sprint(sprint_id, suggested_story_ids)

        # 記錄規劃歷史
        self.planning_history.append({
            'sprint_id': sprint_id,
            'sprint_name': sprint.name,
            'total_story_points': plan['total_story_points'],
            'utilization': plan['utilization'],
            'timestamp': datetime.now().isoformat()
        })

        return plan

    def get_story_priority_suggestions(self) -> List[Dict]:
        """
        獲取所有未完成故事的優先級建議

        Returns:
            優先級建議列表
        """
        suggestions = []

        for story in self.product_backlog.values():
            if story.status != 'DONE':
                # 準備任務數據
                task_data = {
                    'id': story.id,
                    'title': story.title,
                    'description': story.description,
                    'priority': self._int_to_priority(story.priority),
                    'estimated_hours': story.story_points * 8,
                    'tags': story.tags
                }

                # 獲取 AI 建議
                suggestion = self.ai_priority_advisor.suggest_task_priority(
                    task=task_data,
                    related_tasks=[]
                )

                if suggestion['should_change']:
                    suggestions.append({
                        'story_id': story.id,
                        'title': story.title,
                        'current_priority': suggestion['current_priority'],
                        'suggested_priority': suggestion['suggested_priority'],
                        'priority_score': suggestion['priority_score'],
                        'confidence': suggestion['confidence'],
                        'reasons': suggestion['reasons']
                    })

        # 按優先級分數排序
        suggestions.sort(key=lambda x: x['priority_score'], reverse=True)

        return suggestions

    def update_story_with_actual_hours(
        self,
        story_id: str,
        actual_hours: float
    ) -> bool:
        """
        更新故事的實際工時，用於改進 AI 估算

        Args:
            story_id: 故事 ID
            actual_hours: 實際工時

        Returns:
            是否更新成功
        """
        if story_id not in self.product_backlog:
            return False

        story = self.product_backlog[story_id]

        # 找到對應的估算記錄
        for record in self.estimation_history:
            if record['story_id'] == story_id:
                record['actual_hours'] = actual_hours

                # 添加到 AI 學習數據
                self.ai_estimator.add_historical_data({
                    'title': story.title,
                    'description': story.description,
                    'tags': story.tags,
                    'story_points': story.story_points,
                    'estimated_hours': record['ai_estimated_hours'],
                    'actual_hours': actual_hours
                })

                break

        return True

    def get_ai_insights(self, sprint_id: str = None) -> Dict:
        """
        獲取 AI 洞察和建議

        Args:
            sprint_id: Sprint ID（可選）

        Returns:
            AI 洞察報告
        """
        insights = {
            'estimation_accuracy': self._calculate_estimation_accuracy(),
            'priority_suggestions': self.get_story_priority_suggestions(),
            'backlog_health': self._analyze_backlog_health(),
        }

        if sprint_id and sprint_id in self.sprints:
            sprint = self.sprints[sprint_id]
            insights['sprint_prediction'] = self._predict_sprint_outcome(sprint)

        return insights

    def _calculate_estimation_accuracy(self) -> Dict:
        """計算 AI 估算準確率"""
        completed_estimations = [
            record for record in self.estimation_history
            if 'actual_hours' in record
        ]

        if not completed_estimations:
            return {
                'total_estimations': len(self.estimation_history),
                'completed_estimations': 0,
                'accuracy': None,
                'avg_deviation': None
            }

        # 計算平均偏差
        deviations = []
        for record in completed_estimations:
            estimated = record['ai_estimated_hours']
            actual = record['actual_hours']
            deviation = abs(estimated - actual) / actual if actual > 0 else 0
            deviations.append(deviation)

        avg_deviation = sum(deviations) / len(deviations) if deviations else 0
        accuracy = max(0, 1 - avg_deviation) * 100

        return {
            'total_estimations': len(self.estimation_history),
            'completed_estimations': len(completed_estimations),
            'accuracy': round(accuracy, 2),
            'avg_deviation': round(avg_deviation * 100, 2)
        }

    def _analyze_backlog_health(self) -> Dict:
        """分析 Backlog 健康度"""
        total_stories = len(self.product_backlog)
        unestimated_stories = sum(
            1 for story in self.product_backlog.values()
            if story.story_points == 0
        )

        prioritized_stories = sum(
            1 for story in self.product_backlog.values()
            if story.priority < 999
        )

        stories_with_tags = sum(
            1 for story in self.product_backlog.values()
            if len(story.tags) > 0
        )

        health_score = 0
        if total_stories > 0:
            # 估算完整性
            estimation_score = (1 - unestimated_stories / total_stories) * 30
            # 優先級完整性
            priority_score = (prioritized_stories / total_stories) * 40
            # 標籤完整性
            tags_score = (stories_with_tags / total_stories) * 30

            health_score = estimation_score + priority_score + tags_score

        health_level = 'EXCELLENT' if health_score >= 80 else \
                      'GOOD' if health_score >= 60 else \
                      'FAIR' if health_score >= 40 else 'POOR'

        return {
            'health_score': round(health_score, 2),
            'health_level': health_level,
            'total_stories': total_stories,
            'unestimated_stories': unestimated_stories,
            'prioritized_stories': prioritized_stories,
            'stories_with_tags': stories_with_tags,
            'recommendations': self._generate_backlog_recommendations(
                unestimated_stories, prioritized_stories, stories_with_tags, total_stories
            )
        }

    def _generate_backlog_recommendations(
        self,
        unestimated: int,
        prioritized: int,
        with_tags: int,
        total: int
    ) -> List[str]:
        """生成 Backlog 改進建議"""
        recommendations = []

        if unestimated > 0:
            recommendations.append(
                f"有 {unestimated} 個故事未估算，建議使用 AI 估算功能"
            )

        if prioritized < total * 0.8:
            recommendations.append(
                "建議為更多故事設置優先級，使用 AI 優先級建議功能"
            )

        if with_tags < total * 0.5:
            recommendations.append(
                "建議為故事添加標籤，以便更好地分類和搜索"
            )

        if total < 10:
            recommendations.append(
                "Product Backlog 項目較少，建議添加更多故事"
            )
        elif total > 100:
            recommendations.append(
                "Product Backlog 項目較多，建議定期清理已完成或不再需要的故事"
            )

        return recommendations

    def _predict_sprint_outcome(self, sprint: Sprint) -> Dict:
        """預測 Sprint 結果"""
        if sprint.status != 'ACTIVE':
            return {'status': '只能預測進行中的 Sprint'}

        # 計算進度
        days_total = (sprint.end_date - sprint.start_date).days if sprint.start_date and sprint.end_date else 14
        days_passed = (datetime.now() - sprint.start_date).days if sprint.start_date else 0
        progress_percent = (days_passed / days_total * 100) if days_total > 0 else 0

        # 計算完成率
        completion_rate = (sprint.completed_points / sprint.committed_points * 100) if sprint.committed_points > 0 else 0

        # 預測最終完成點數
        if days_passed > 0:
            daily_velocity = sprint.completed_points / days_passed
            predicted_completion = daily_velocity * days_total
        else:
            predicted_completion = sprint.committed_points

        # 預測成功概率
        success_probability = min(100, (predicted_completion / sprint.committed_points * 100)) if sprint.committed_points > 0 else 0

        # 預測結果
        if success_probability >= 95:
            predicted_outcome = 'ON_TRACK'
        elif success_probability >= 80:
            predicted_outcome = 'AT_RISK'
        else:
            predicted_outcome = 'LIKELY_MISS'

        return {
            'days_total': days_total,
            'days_passed': days_passed,
            'days_remaining': days_total - days_passed,
            'progress_percent': round(progress_percent, 2),
            'completion_rate': round(completion_rate, 2),
            'predicted_completion': round(predicted_completion, 2),
            'success_probability': round(success_probability, 2),
            'predicted_outcome': predicted_outcome,
            'recommendations': self._generate_sprint_recommendations(
                predicted_outcome, completion_rate, progress_percent
            )
        }

    def _generate_sprint_recommendations(
        self,
        predicted_outcome: str,
        completion_rate: float,
        progress_percent: float
    ) -> List[str]:
        """生成 Sprint 建議"""
        recommendations = []

        if predicted_outcome == 'LIKELY_MISS':
            recommendations.append("Sprint 可能無法按時完成，建議：")
            recommendations.append("  - 重新評估 Sprint 範圍")
            recommendations.append("  - 移除低優先級故事")
            recommendations.append("  - 增加團隊成員或延長 Sprint")
        elif predicted_outcome == 'AT_RISK':
            recommendations.append("Sprint 存在風險，建議：")
            recommendations.append("  - 每日站會重點關注進度")
            recommendations.append("  - 識別和移除阻礙")
            recommendations.append("  - 考慮調整範圍")
        else:
            recommendations.append("Sprint 進展順利，建議：")
            recommendations.append("  - 保持當前節奏")
            recommendations.append("  - 關注質量")

        if completion_rate < progress_percent - 10:
            recommendations.append("完成率低於時間進度，需要加快速度")
        elif completion_rate > progress_percent + 10:
            recommendations.append("進度超前，可以考慮增加額外任務")

        return recommendations

    def _priority_to_int(self, priority: str) -> int:
        """優先級字符串轉整數"""
        priority_map = {
            'URGENT': 0,
            'HIGH': 1,
            'MEDIUM': 2,
            'LOW': 3
        }
        return priority_map.get(priority, 2)

    def _int_to_priority(self, priority_int: int) -> str:
        """整數轉優先級字符串"""
        int_map = {
            0: 'URGENT',
            1: 'HIGH',
            2: 'MEDIUM',
            3: 'LOW'
        }
        return int_map.get(priority_int, 'MEDIUM')


if __name__ == "__main__":
    # 測試 AI 增強功能
    print("AI 增強 Sprint 管理器測試")
    print("=" * 80)

    # 創建管理器
    manager = AIEnhancedSprintManager("AI 增強開發團隊")

    # 添加團隊成員
    manager.add_team_member("Alice", "Senior Developer", 40)
    manager.add_team_member("Bob", "Developer", 40)
    manager.add_team_member("Carol", "Junior Developer", 40)

    print(f"\n團隊容量: {manager.get_team_capacity()} 小時")

    # 使用 AI 添加故事
    print("\n使用 AI 估算並添加故事...")

    stories_data = [
        {
            'title': '作為用戶，我想要能夠註冊帳號',
            'description': '實現完整的用戶註冊功能，包括 Email 驗證',
            'complexity': 'MEDIUM',
            'priority': 'HIGH',
            'tags': ['backend', 'authentication']
        },
        {
            'title': '作為用戶，我想要能夠登入系統',
            'description': '實現用戶登入功能，支持 JWT Token',
            'complexity': 'MEDIUM',
            'priority': 'HIGH',
            'tags': ['backend', 'authentication']
        },
        {
            'title': '作為用戶，我想要能夠重置密碼',
            'description': '實現密碼重置功能',
            'complexity': 'LOW',
            'priority': 'MEDIUM',
            'tags': ['backend', 'authentication']
        },
    ]

    created_stories = []
    for story_data in stories_data:
        story, estimation = manager.add_story_with_ai_estimation(**story_data)
        created_stories.append(story)

        print(f"\n故事: {story.title}")
        print(f"  AI 估時: {estimation['estimated_hours']} 小時")
        print(f"  故事點: {story.story_points}")
        print(f"  信心度: {estimation['confidence'] * 100}%")

    # 分析 Backlog
    print("\n\nBacklog 健康度分析:")
    print("=" * 80)
    backlog_health = manager._analyze_backlog_health()
    print(f"健康分數: {backlog_health['health_score']}/100 ({backlog_health['health_level']})")
    print(f"總故事數: {backlog_health['total_stories']}")
    print(f"已估算: {backlog_health['total_stories'] - backlog_health['unestimated_stories']}")
    print(f"已設優先級: {backlog_health['prioritized_stories']}")

    # 創建並規劃 Sprint
    print("\n\n使用 AI 規劃 Sprint:")
    print("=" * 80)
    sprint = manager.create_sprint("Sprint 1", "實現基本用戶認證功能", 2)
    plan = manager.plan_sprint_with_ai(sprint.id, "實現基本用戶認證功能")

    print(f"Sprint: {sprint.name}")
    print(f"目標容量: {plan['target_capacity']} 故事點")
    print(f"規劃點數: {plan['total_story_points']} 故事點")
    print(f"利用率: {plan['utilization']}%")

    print("\n建議的故事:")
    for item in plan['suggested_items']:
        print(f"  - [{item.get('story_points', 0)} pts] {item['title']}")

    if plan.get('recommendations'):
        print("\nAI 建議:")
        for rec in plan['recommendations']:
            print(f"  - {rec}")

    # 獲取 AI 洞察
    print("\n\nAI 洞察報告:")
    print("=" * 80)
    insights = manager.get_ai_insights()

    print(f"\n估算準確性:")
    acc = insights['estimation_accuracy']
    print(f"  總估算: {acc['total_estimations']}")
    print(f"  已完成: {acc['completed_estimations']}")
    if acc['accuracy'] is not None:
        print(f"  準確率: {acc['accuracy']}%")

    print("\n✅ AI 增強功能測試完成！")
