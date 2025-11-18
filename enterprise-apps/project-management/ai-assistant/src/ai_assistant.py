"""
AI 助手整合模組
提供專案管理系統的 AI 輔助功能
"""

import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from collections import defaultdict
import random


class AITaskEstimator:
    """AI 任務估時助手"""

    def __init__(self):
        self.historical_data = []
        # 基於複雜度和優先級的基礎估時矩陣（小時）
        self.base_estimates = {
            'LOW': {'LOW': 2, 'MEDIUM': 4, 'HIGH': 6, 'URGENT': 8},
            'MEDIUM': {'LOW': 4, 'MEDIUM': 8, 'HIGH': 12, 'URGENT': 16},
            'HIGH': {'LOW': 8, 'MEDIUM': 16, 'HIGH': 24, 'URGENT': 32},
        }

    def estimate_task(
        self,
        title: str,
        description: str,
        complexity: str = "MEDIUM",
        priority: str = "MEDIUM",
        assignee_experience: str = "MEDIUM",
        tags: List[str] = None
    ) -> Dict:
        """
        預測任務工時

        Args:
            title: 任務標題
            description: 任務描述
            complexity: 複雜度 (LOW/MEDIUM/HIGH)
            priority: 優先級 (LOW/MEDIUM/HIGH/URGENT)
            assignee_experience: 負責人經驗 (JUNIOR/MEDIUM/SENIOR)
            tags: 任務標籤

        Returns:
            包含估時和信心度的字典
        """
        # 基礎估時
        base_hours = self.base_estimates.get(complexity, {}).get(priority, 8)

        # 根據描述長度調整
        desc_factor = 1.0
        if len(description) > 500:
            desc_factor = 1.3
        elif len(description) > 200:
            desc_factor = 1.1
        elif len(description) < 50:
            desc_factor = 0.8

        # 根據經驗調整
        exp_factors = {
            'JUNIOR': 1.5,
            'MEDIUM': 1.0,
            'SENIOR': 0.7
        }
        exp_factor = exp_factors.get(assignee_experience, 1.0)

        # 根據標籤調整（某些標籤可能需要更多時間）
        tag_factor = 1.0
        if tags:
            high_complexity_tags = ['migration', 'refactoring', 'architecture', 'security']
            if any(tag in high_complexity_tags for tag in tags):
                tag_factor = 1.2

        # 計算最終估時
        estimated_hours = base_hours * desc_factor * exp_factor * tag_factor

        # 計算信心度（基於可用信息的完整性）
        confidence = self._calculate_confidence(
            title, description, complexity, priority, assignee_experience
        )

        # 計算範圍（±20%）
        min_hours = estimated_hours * 0.8
        max_hours = estimated_hours * 1.2

        # 尋找相似任務
        similar_tasks = self._find_similar_tasks(title, description, tags)

        return {
            'estimated_hours': round(estimated_hours, 1),
            'confidence': round(confidence, 2),
            'range': {
                'min': round(min_hours, 1),
                'max': round(max_hours, 1)
            },
            'similar_tasks': similar_tasks,
            'factors': {
                'base_hours': base_hours,
                'description_factor': round(desc_factor, 2),
                'experience_factor': round(exp_factor, 2),
                'tag_factor': round(tag_factor, 2)
            },
            'recommendations': self._generate_estimation_recommendations(
                complexity, priority, estimated_hours
            )
        }

    def _calculate_confidence(
        self,
        title: str,
        description: str,
        complexity: str,
        priority: str,
        assignee_experience: str
    ) -> float:
        """計算估時信心度"""
        confidence = 0.5  # 基礎信心度

        # 標題和描述的完整性
        if len(title) > 10:
            confidence += 0.1
        if len(description) > 100:
            confidence += 0.2

        # 是否有明確的複雜度和優先級
        if complexity in ['LOW', 'MEDIUM', 'HIGH']:
            confidence += 0.1
        if priority in ['LOW', 'MEDIUM', 'HIGH', 'URGENT']:
            confidence += 0.1

        return min(confidence, 1.0)

    def _find_similar_tasks(
        self,
        title: str,
        description: str,
        tags: List[str] = None
    ) -> List[Dict]:
        """尋找相似的歷史任務"""
        # 簡化版本：基於關鍵詞匹配
        similar = []

        for task in self.historical_data[-10:]:  # 只看最近10個
            similarity_score = 0

            # 標題相似度
            title_words = set(title.lower().split())
            task_title_words = set(task.get('title', '').lower().split())
            title_overlap = len(title_words & task_title_words)
            if title_overlap > 0:
                similarity_score += title_overlap * 0.3

            # 標籤相似度
            if tags and task.get('tags'):
                tag_overlap = len(set(tags) & set(task['tags']))
                if tag_overlap > 0:
                    similarity_score += tag_overlap * 0.5

            if similarity_score > 0.5:
                similar.append({
                    'title': task['title'],
                    'actual_hours': task.get('actual_hours', 0),
                    'similarity': round(similarity_score, 2)
                })

        return sorted(similar, key=lambda x: x['similarity'], reverse=True)[:3]

    def _generate_estimation_recommendations(
        self,
        complexity: str,
        priority: str,
        estimated_hours: float
    ) -> List[str]:
        """生成估時建議"""
        recommendations = []

        if complexity == 'HIGH' and estimated_hours > 20:
            recommendations.append("建議將此任務拆分為更小的子任務")

        if priority == 'URGENT' and estimated_hours > 16:
            recommendations.append("緊急任務工時較長，建議增派人力或調整優先級")

        if estimated_hours > 40:
            recommendations.append("任務工時超過一週，建議重新評估範圍")

        return recommendations

    def add_historical_data(self, task_data: Dict):
        """添加歷史任務數據用於學習"""
        self.historical_data.append(task_data)


class AIRiskPredictor:
    """AI 風險預測助手"""

    def __init__(self):
        self.risk_indicators = {}

    def predict_project_risk(
        self,
        project_data: Dict,
        tasks: List[Dict],
        team_members: List[Dict],
        historical_projects: List[Dict] = None
    ) -> Dict:
        """
        預測專案風險

        Args:
            project_data: 專案基本信息
            tasks: 任務列表
            team_members: 團隊成員列表
            historical_projects: 歷史專案數據

        Returns:
            風險分析報告
        """
        risks = []
        overall_risk_score = 0

        # 1. 進度風險
        schedule_risk = self._analyze_schedule_risk(project_data, tasks)
        risks.append(schedule_risk)
        overall_risk_score += schedule_risk['score']

        # 2. 資源風險
        resource_risk = self._analyze_resource_risk(tasks, team_members)
        risks.append(resource_risk)
        overall_risk_score += resource_risk['score']

        # 3. 範圍風險
        scope_risk = self._analyze_scope_risk(project_data, tasks)
        risks.append(scope_risk)
        overall_risk_score += scope_risk['score']

        # 4. 團隊風險
        team_risk = self._analyze_team_risk(team_members, tasks)
        risks.append(team_risk)
        overall_risk_score += team_risk['score']

        # 計算整體風險等級
        avg_risk_score = overall_risk_score / len(risks)
        risk_level = self._categorize_risk(avg_risk_score)

        # 生成建議
        recommendations = self._generate_risk_recommendations(risks)

        return {
            'overall_risk_level': risk_level,
            'overall_risk_score': round(avg_risk_score, 2),
            'risks': risks,
            'recommendations': recommendations,
            'forecast': self._forecast_project_outcome(avg_risk_score, project_data)
        }

    def _analyze_schedule_risk(self, project_data: Dict, tasks: List[Dict]) -> Dict:
        """分析進度風險"""
        risk_score = 0
        issues = []

        # 檢查任務數量
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.get('status') == 'DONE')

        if total_tasks > 0:
            completion_rate = completed_tasks / total_tasks

            # 檢查是否有延遲
            if completion_rate < 0.5 and project_data.get('progress', 0) > 50:
                risk_score += 30
                issues.append("任務完成率低於預期進度")

        # 檢查截止日期
        if 'end_date' in project_data:
            end_date = datetime.fromisoformat(project_data['end_date'])
            days_remaining = (end_date - datetime.now()).days

            if days_remaining < 7 and completion_rate < 0.8:
                risk_score += 40
                issues.append(f"距離截止日期僅剩 {days_remaining} 天，但完成率僅 {completion_rate*100:.1f}%")
            elif days_remaining < 0:
                risk_score += 50
                issues.append("專案已逾期")

        return {
            'category': 'schedule',
            'name': '進度風險',
            'score': min(risk_score, 100),
            'level': self._categorize_risk(risk_score),
            'issues': issues
        }

    def _analyze_resource_risk(self, tasks: List[Dict], team_members: List[Dict]) -> Dict:
        """分析資源風險"""
        risk_score = 0
        issues = []

        # 檢查團隊規模
        if len(team_members) < 3:
            risk_score += 20
            issues.append("團隊規模較小，可能影響專案進度")

        # 檢查任務分配
        assigned_tasks = sum(1 for t in tasks if t.get('assignee'))
        unassigned_tasks = len(tasks) - assigned_tasks

        if unassigned_tasks > len(tasks) * 0.3:
            risk_score += 25
            issues.append(f"有 {unassigned_tasks} 個任務未分配負責人")

        # 檢查工作負載
        workload = defaultdict(int)
        for task in tasks:
            assignee = task.get('assignee')
            if assignee and task.get('status') != 'DONE':
                workload[assignee] += task.get('estimated_hours', 8)

        if workload:
            max_load = max(workload.values())
            avg_load = sum(workload.values()) / len(workload)

            if max_load > avg_load * 2:
                risk_score += 30
                issues.append("工作負載分配不均，某些成員負擔過重")

        return {
            'category': 'resource',
            'name': '資源風險',
            'score': min(risk_score, 100),
            'level': self._categorize_risk(risk_score),
            'issues': issues
        }

    def _analyze_scope_risk(self, project_data: Dict, tasks: List[Dict]) -> Dict:
        """分析範圍風險"""
        risk_score = 0
        issues = []

        # 檢查任務數量變化
        if len(tasks) > 50:
            risk_score += 20
            issues.append("任務數量較多，可能存在範圍蔓延")

        # 檢查高優先級任務比例
        high_priority_tasks = sum(1 for t in tasks if t.get('priority') in ['HIGH', 'URGENT'])
        if high_priority_tasks > len(tasks) * 0.5:
            risk_score += 15
            issues.append("高優先級任務過多，可能需要重新評估優先級")

        return {
            'category': 'scope',
            'name': '範圍風險',
            'score': min(risk_score, 100),
            'level': self._categorize_risk(risk_score),
            'issues': issues
        }

    def _analyze_team_risk(self, team_members: List[Dict], tasks: List[Dict]) -> Dict:
        """分析團隊風險"""
        risk_score = 0
        issues = []

        # 檢查關鍵人員依賴
        if team_members:
            task_distribution = defaultdict(int)
            for task in tasks:
                assignee = task.get('assignee')
                if assignee:
                    task_distribution[assignee] += 1

            if task_distribution:
                max_tasks = max(task_distribution.values())
                if max_tasks > len(tasks) * 0.5:
                    risk_score += 35
                    issues.append("存在關鍵人員依賴，單一成員負責過多任務")

        return {
            'category': 'team',
            'name': '團隊風險',
            'score': min(risk_score, 100),
            'level': self._categorize_risk(risk_score),
            'issues': issues
        }

    def _categorize_risk(self, score: float) -> str:
        """將風險分數轉換為等級"""
        if score < 20:
            return 'LOW'
        elif score < 50:
            return 'MEDIUM'
        elif score < 75:
            return 'HIGH'
        else:
            return 'CRITICAL'

    def _generate_risk_recommendations(self, risks: List[Dict]) -> List[str]:
        """生成風險應對建議"""
        recommendations = []

        for risk in risks:
            if risk['level'] in ['HIGH', 'CRITICAL']:
                if risk['category'] == 'schedule':
                    recommendations.append("建議增加人力或調整專案範圍以確保按時交付")
                elif risk['category'] == 'resource':
                    recommendations.append("建議重新分配任務，平衡團隊工作負載")
                elif risk['category'] == 'scope':
                    recommendations.append("建議與利益相關者討論，明確專案範圍和優先級")
                elif risk['category'] == 'team':
                    recommendations.append("建議進行知識分享，減少關鍵人員依賴")

        if not recommendations:
            recommendations.append("專案風險在可控範圍內，建議保持現有節奏")

        return recommendations

    def _forecast_project_outcome(self, risk_score: float, project_data: Dict) -> Dict:
        """預測專案結果"""
        success_probability = max(0, min(100, 100 - risk_score))

        forecast = {
            'success_probability': round(success_probability, 1),
            'likely_outcome': 'SUCCESS' if success_probability > 70 else 'AT_RISK' if success_probability > 40 else 'LIKELY_FAIL',
        }

        # 預測延遲
        if risk_score > 50:
            estimated_delay_days = int((risk_score - 50) / 10 * 7)  # 每10分 = 7天延遲
            forecast['estimated_delay_days'] = estimated_delay_days

        return forecast


class AIResourceOptimizer:
    """AI 資源優化助手"""

    def optimize_resource_allocation(
        self,
        tasks: List[Dict],
        resources: List[Dict],
        constraints: Dict = None
    ) -> Dict:
        """
        優化資源分配

        Args:
            tasks: 任務列表
            resources: 可用資源列表
            constraints: 約束條件

        Returns:
            優化的分配方案
        """
        constraints = constraints or {
            'max_hours_per_day': 8,
            'max_utilization': 0.9,
            'skill_matching': True
        }

        allocations = []
        unallocated_tasks = []
        resource_utilization = defaultdict(float)

        # 按優先級排序任務
        sorted_tasks = sorted(
            tasks,
            key=lambda t: (
                self._priority_score(t.get('priority', 'MEDIUM')),
                -t.get('estimated_hours', 0)
            ),
            reverse=True
        )

        # 嘗試為每個任務分配資源
        for task in sorted_tasks:
            best_resource = self._find_best_resource(
                task, resources, resource_utilization, constraints
            )

            if best_resource:
                allocation = {
                    'task_id': task['id'],
                    'task_title': task['title'],
                    'resource_id': best_resource['id'],
                    'resource_name': best_resource['name'],
                    'estimated_hours': task.get('estimated_hours', 8),
                    'match_score': self._calculate_match_score(task, best_resource),
                    'start_date': datetime.now().isoformat(),
                }
                allocations.append(allocation)

                # 更新資源利用率
                resource_utilization[best_resource['id']] += task.get('estimated_hours', 8)
            else:
                unallocated_tasks.append(task)

        # 計算指標
        metrics = self._calculate_allocation_metrics(
            allocations, resources, resource_utilization
        )

        # 檢測衝突
        conflicts = self._detect_conflicts(allocations, resource_utilization, constraints)

        # 生成建議
        recommendations = self._generate_allocation_recommendations(
            allocations, unallocated_tasks, conflicts, metrics
        )

        return {
            'allocations': allocations,
            'unallocated_tasks': [{'id': t['id'], 'title': t['title']} for t in unallocated_tasks],
            'metrics': metrics,
            'conflicts': conflicts,
            'recommendations': recommendations
        }

    def _priority_score(self, priority: str) -> int:
        """優先級分數"""
        scores = {'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}
        return scores.get(priority, 2)

    def _find_best_resource(
        self,
        task: Dict,
        resources: List[Dict],
        utilization: Dict,
        constraints: Dict
    ) -> Optional[Dict]:
        """尋找最佳資源"""
        best_resource = None
        best_score = -1

        max_hours = constraints.get('max_hours_per_day', 8) * 5 * constraints.get('max_utilization', 0.9)

        for resource in resources:
            # 檢查是否超載
            current_load = utilization.get(resource['id'], 0)
            if current_load + task.get('estimated_hours', 8) > max_hours:
                continue

            # 計算匹配分數
            match_score = self._calculate_match_score(task, resource)

            # 負載平衡加分
            load_factor = 1 - (current_load / max_hours)
            total_score = match_score * 0.7 + load_factor * 0.3

            if total_score > best_score:
                best_score = total_score
                best_resource = resource

        return best_resource

    def _calculate_match_score(self, task: Dict, resource: Dict) -> float:
        """計算任務和資源的匹配度"""
        score = 0.5  # 基礎分數

        # 技能匹配
        task_tags = set(task.get('tags', []))
        resource_skills = set(resource.get('skills', []))

        if task_tags and resource_skills:
            overlap = len(task_tags & resource_skills)
            if overlap > 0:
                score += 0.3 * (overlap / len(task_tags))

        # 經驗匹配
        if resource.get('experience_level') == 'SENIOR' and task.get('complexity') == 'HIGH':
            score += 0.2
        elif resource.get('experience_level') == 'JUNIOR' and task.get('complexity') == 'LOW':
            score += 0.1

        return min(score, 1.0)

    def _calculate_allocation_metrics(
        self,
        allocations: List[Dict],
        resources: List[Dict],
        utilization: Dict
    ) -> Dict:
        """計算分配指標"""
        if not resources:
            return {}

        # 平均利用率
        total_utilization = sum(utilization.values())
        max_capacity = len(resources) * 40  # 假設每人每週40小時
        avg_utilization = (total_utilization / max_capacity * 100) if max_capacity > 0 else 0

        # 平均匹配度
        avg_match_score = sum(a['match_score'] for a in allocations) / len(allocations) if allocations else 0

        return {
            'total_tasks_allocated': len(allocations),
            'average_utilization': round(avg_utilization, 2),
            'average_match_score': round(avg_match_score, 2),
            'resource_utilization_details': {
                r['name']: round(utilization.get(r['id'], 0), 1)
                for r in resources
            }
        }

    def _detect_conflicts(
        self,
        allocations: List[Dict],
        utilization: Dict,
        constraints: Dict
    ) -> List[Dict]:
        """檢測資源衝突"""
        conflicts = []
        max_hours = constraints.get('max_hours_per_day', 8) * 5 * constraints.get('max_utilization', 0.9)

        for resource_id, hours in utilization.items():
            if hours > max_hours:
                conflicts.append({
                    'type': 'overallocation',
                    'resource_id': resource_id,
                    'allocated_hours': round(hours, 1),
                    'max_hours': max_hours,
                    'excess_hours': round(hours - max_hours, 1)
                })

        return conflicts

    def _generate_allocation_recommendations(
        self,
        allocations: List[Dict],
        unallocated_tasks: List[Dict],
        conflicts: List[Dict],
        metrics: Dict
    ) -> List[str]:
        """生成分配建議"""
        recommendations = []

        if unallocated_tasks:
            recommendations.append(
                f"有 {len(unallocated_tasks)} 個任務未能分配，建議增加資源或調整任務優先級"
            )

        if conflicts:
            recommendations.append(
                f"檢測到 {len(conflicts)} 個資源衝突，建議重新平衡工作負載"
            )

        if metrics.get('average_utilization', 0) > 90:
            recommendations.append("資源利用率過高，建議增加人力或延長時程")
        elif metrics.get('average_utilization', 0) < 50:
            recommendations.append("資源利用率較低，可以考慮承接更多任務")

        if metrics.get('average_match_score', 0) < 0.6:
            recommendations.append("任務與資源匹配度較低，建議提供培訓或調整任務分配")

        return recommendations


class AIPriorityAdvisor:
    """AI 優先級建議助手"""

    def suggest_task_priority(
        self,
        task: Dict,
        project_context: Dict = None,
        related_tasks: List[Dict] = None
    ) -> Dict:
        """
        建議任務優先級

        Args:
            task: 任務信息
            project_context: 專案上下文
            related_tasks: 相關任務列表

        Returns:
            優先級建議
        """
        priority_score = 0
        reasons = []

        # 1. 基於截止日期
        if 'due_date' in task:
            due_date = datetime.fromisoformat(task['due_date'])
            days_until_due = (due_date - datetime.now()).days

            if days_until_due < 2:
                priority_score += 40
                reasons.append(f"距離截止日期僅剩 {days_until_due} 天")
            elif days_until_due < 7:
                priority_score += 25
                reasons.append(f"即將到期（{days_until_due} 天）")

        # 2. 基於依賴關係
        if related_tasks:
            blocking_count = sum(
                1 for t in related_tasks
                if t.get('blocked_by') == task['id']
            )
            if blocking_count > 0:
                priority_score += blocking_count * 10
                reasons.append(f"阻擋了 {blocking_count} 個其他任務")

        # 3. 基於業務價值關鍵詞
        high_value_keywords = ['critical', 'urgent', 'blocker', '緊急', '關鍵', '阻擋']
        title_desc = (task.get('title', '') + ' ' + task.get('description', '')).lower()

        for keyword in high_value_keywords:
            if keyword in title_desc:
                priority_score += 15
                reasons.append(f"包含高價值關鍵詞: {keyword}")
                break

        # 4. 基於估時（快速完成的小任務）
        estimated_hours = task.get('estimated_hours', 8)
        if estimated_hours < 2:
            priority_score += 10
            reasons.append("可快速完成的小任務")

        # 5. 基於專案階段
        if project_context:
            if project_context.get('phase') == 'CRITICAL':
                priority_score += 20
                reasons.append("專案處於關鍵階段")

        # 確定建議優先級
        if priority_score >= 60:
            suggested_priority = 'URGENT'
        elif priority_score >= 40:
            suggested_priority = 'HIGH'
        elif priority_score >= 20:
            suggested_priority = 'MEDIUM'
        else:
            suggested_priority = 'LOW'

        return {
            'suggested_priority': suggested_priority,
            'current_priority': task.get('priority', 'MEDIUM'),
            'priority_score': priority_score,
            'should_change': task.get('priority', 'MEDIUM') != suggested_priority,
            'reasons': reasons,
            'confidence': self._calculate_priority_confidence(reasons)
        }

    def _calculate_priority_confidence(self, reasons: List[str]) -> float:
        """計算優先級建議的信心度"""
        # 基於理由數量
        confidence = min(0.5 + len(reasons) * 0.15, 1.0)
        return round(confidence, 2)


class AISprintPlanner:
    """AI Sprint 規劃助手"""

    def suggest_sprint_plan(
        self,
        backlog: List[Dict],
        team_capacity: int,
        team_velocity: float = None,
        sprint_goal: str = None
    ) -> Dict:
        """
        建議 Sprint 計劃

        Args:
            backlog: Product Backlog
            team_capacity: 團隊容量（小時或故事點）
            team_velocity: 團隊歷史速度
            sprint_goal: Sprint 目標

        Returns:
            Sprint 計劃建議
        """
        # 使用歷史速度或容量的 70%
        target_capacity = team_velocity if team_velocity else team_capacity * 0.7

        selected_items = []
        total_points = 0

        # 按優先級和估時排序
        sorted_backlog = sorted(
            backlog,
            key=lambda item: (
                -self._priority_score(item.get('priority', 'MEDIUM')),
                item.get('story_points', 0)
            )
        )

        # 選擇任務直到達到容量
        for item in sorted_backlog:
            item_points = item.get('story_points', 0)

            if total_points + item_points <= target_capacity:
                selected_items.append(item)
                total_points += item_points
            elif total_points == 0:
                # 如果第一個任務就超過容量，建議拆分
                selected_items.append(item)
                total_points += item_points
                break

        # 生成建議
        recommendations = self._generate_sprint_recommendations(
            selected_items, total_points, target_capacity, team_capacity
        )

        return {
            'suggested_items': selected_items,
            'total_story_points': total_points,
            'target_capacity': target_capacity,
            'utilization': round((total_points / target_capacity * 100) if target_capacity > 0 else 0, 1),
            'recommendations': recommendations,
            'risks': self._identify_sprint_risks(selected_items, total_points, team_capacity)
        }

    def _priority_score(self, priority: str) -> int:
        """優先級分數"""
        scores = {'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}
        return scores.get(priority, 2)

    def _generate_sprint_recommendations(
        self,
        items: List[Dict],
        total_points: int,
        target_capacity: float,
        team_capacity: int
    ) -> List[str]:
        """生成 Sprint 建議"""
        recommendations = []

        utilization = (total_points / target_capacity * 100) if target_capacity > 0 else 0

        if utilization > 100:
            recommendations.append("承諾的故事點超過建議容量，建議減少任務或延長 Sprint")
        elif utilization < 70:
            recommendations.append("容量利用率較低，可以考慮增加更多任務")

        # 檢查大任務
        large_items = [item for item in items if item.get('story_points', 0) > team_capacity * 0.3]
        if large_items:
            recommendations.append(
                f"發現 {len(large_items)} 個大型任務，建議拆分為更小的任務"
            )

        return recommendations

    def _identify_sprint_risks(
        self,
        items: List[Dict],
        total_points: int,
        team_capacity: int
    ) -> List[Dict]:
        """識別 Sprint 風險"""
        risks = []

        # 容量風險
        if total_points > team_capacity:
            risks.append({
                'type': 'capacity',
                'severity': 'HIGH',
                'description': '承諾點數超過團隊容量',
                'mitigation': '減少任務或增加團隊成員'
            })

        # 依賴風險
        items_with_deps = [item for item in items if item.get('dependencies')]
        if items_with_deps:
            risks.append({
                'type': 'dependency',
                'severity': 'MEDIUM',
                'description': f'{len(items_with_deps)} 個任務存在外部依賴',
                'mitigation': '提前確認依賴任務的狀態'
            })

        return risks


# 導出所有 AI 助手
__all__ = [
    'AITaskEstimator',
    'AIRiskPredictor',
    'AIResourceOptimizer',
    'AIPriorityAdvisor',
    'AISprintPlanner'
]
