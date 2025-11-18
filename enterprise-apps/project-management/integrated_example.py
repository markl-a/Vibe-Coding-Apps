"""
專案管理系統整合示例
展示如何整合所有模組（Sprint Manager、Kanban Board、Resource Allocator、Gantt Chart、AI Assistant）
"""

import sys
import os
from datetime import datetime, timedelta

# 添加模組路徑
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'sprint-manager/src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'kanban-board/src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'resource-allocator/src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'gantt-chart/src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-assistant/src'))

from ai_enhanced_sprint_manager import AIEnhancedSprintManager
from kanban_board import KanbanBoard, Task
from ai_assistant import (
    AITaskEstimator, AIRiskPredictor, AIResourceOptimizer,
    AIPriorityAdvisor, AISprintPlanner
)

# 簡化的 Gantt 任務（避免導入完整模組）
class GanttTask:
    def __init__(self, name, start_date, duration_days, assignee, dependencies):
        self.name = name
        self.start_date = start_date
        self.duration_days = duration_days
        self.assignee = assignee
        self.dependencies = dependencies

class SimpleGanttChart:
    def __init__(self, name):
        self.name = name
        self.tasks = []

    def add_task(self, task):
        self.tasks.append(task)

# 簡化版資源類（用於整合示例）
class Resource:
    def __init__(self, name, skills, availability):
        self.name = name
        self.skills = skills
        self.availability = availability

class SimpleResourceAllocator:
    """簡化的資源分配器"""
    def __init__(self):
        self.resources = []

    def add_resource(self, resource):
        self.resources.append(resource)


class IntegratedProjectManagement:
    """整合專案管理系統"""

    def __init__(self, project_name: str, team_name: str):
        self.project_name = project_name
        self.team_name = team_name

        # 初始化各個模組
        self.sprint_manager = AIEnhancedSprintManager(team_name)
        self.kanban = KanbanBoard(f"{project_name} - 看板")
        self.resource_allocator = SimpleResourceAllocator()
        self.gantt = SimpleGanttChart(project_name)

        # AI 助手
        self.ai_estimator = AITaskEstimator()
        self.ai_risk_predictor = AIRiskPredictor()
        self.ai_optimizer = AIResourceOptimizer()

        print(f"\n🚀 整合專案管理系統已啟動")
        print(f"   專案: {project_name}")
        print(f"   團隊: {team_name}")

    def setup_team(self, team_members: list):
        """設置團隊成員"""
        print(f"\n📋 設置團隊成員...")

        for member in team_members:
            # 添加到 Sprint Manager
            self.sprint_manager.add_team_member(
                name=member['name'],
                role=member['role'],
                capacity_per_sprint=member.get('capacity', 40)
            )

            # 添加到 Resource Allocator
            resource = Resource(
                name=member['name'],
                skills=member.get('skills', []),
                availability=member.get('capacity', 40)
            )
            self.resource_allocator.add_resource(resource)

            print(f"   ✅ {member['name']} - {member['role']}")

        print(f"\n   團隊總容量: {self.sprint_manager.get_team_capacity()} 小時/Sprint")

    def create_project_backlog(self, user_stories: list):
        """創建 Product Backlog"""
        print(f"\n📝 創建 Product Backlog...")

        all_stories = []
        for story_data in user_stories:
            # 使用 AI 估算並添加到 Sprint Manager
            story, estimation = self.sprint_manager.add_story_with_ai_estimation(
                title=story_data['title'],
                description=story_data.get('description', ''),
                complexity=story_data.get('complexity', 'MEDIUM'),
                priority=story_data.get('priority', 'MEDIUM'),
                assignee_experience=story_data.get('experience', 'MEDIUM'),
                tags=story_data.get('tags', [])
            )

            all_stories.append({
                'story': story,
                'estimation': estimation,
                'data': story_data
            })

            print(f"\n   📋 {story.title}")
            print(f"      故事點: {story.story_points} | AI 估時: {estimation['estimated_hours']}h")
            print(f"      信心度: {estimation['confidence']*100:.1f}%")

        return all_stories

    def plan_sprint(self, sprint_name: str, sprint_goal: str, duration_weeks: int = 2):
        """規劃 Sprint"""
        print(f"\n🎯 規劃 Sprint: {sprint_name}")
        print(f"   目標: {sprint_goal}")

        # 創建 Sprint
        sprint = self.sprint_manager.create_sprint(
            name=sprint_name,
            goal=sprint_goal,
            duration_weeks=duration_weeks,
            start_date=datetime.now()
        )

        # 使用 AI 規劃
        plan = self.sprint_manager.plan_sprint_with_ai(sprint.id, sprint_goal)

        print(f"\n   📊 AI 規劃結果:")
        print(f"      承諾點數: {plan['total_story_points']}")
        print(f"      利用率: {plan['utilization']:.1f}%")
        print(f"      選擇故事: {len(plan['suggested_items'])} 個")

        # 將選擇的故事添加到 Kanban
        for item in plan['suggested_items']:
            story_id = item['id']
            story = self.sprint_manager.product_backlog[story_id]

            # 創建 Kanban 任務
            task = Task(
                title=story.title,
                description=story.description,
                priority=self._int_to_priority(story.priority),
                estimated_hours=story.story_points * 8,
                tags=story.tags
            )
            self.kanban.add_task(task)

            # 添加到 Gantt Chart
            gantt_task = GanttTask(
                name=story.title,
                start_date=sprint.start_date,
                duration_days=story.story_points,  # 簡化：1故事點=1天
                assignee=story.assignee,
                dependencies=[]
            )
            self.gantt.add_task(gantt_task)

        # 開始 Sprint
        self.sprint_manager.start_sprint(sprint.id)

        return sprint, plan

    def allocate_resources(self, sprint_id: str):
        """分配資源"""
        print(f"\n👥 使用 AI 優化資源分配...")

        sprint = self.sprint_manager.sprints.get(sprint_id)
        if not sprint:
            return

        # 準備任務數據
        tasks = []
        for story_id in sprint.story_ids:
            story = self.sprint_manager.product_backlog.get(story_id)
            if story and story.status != 'DONE':
                tasks.append({
                    'id': story.id,
                    'title': story.title,
                    'estimated_hours': story.story_points * 8,
                    'priority': self._int_to_priority(story.priority),
                    'tags': story.tags,
                    'complexity': 'MEDIUM'
                })

        # 準備資源數據
        resources = []
        for member_id, member in self.sprint_manager.team_members.items():
            resources.append({
                'id': member_id,
                'name': member['name'],
                'skills': [],  # 簡化版本
                'experience_level': 'MEDIUM'
            })

        # 使用 AI 優化分配
        result = self.ai_optimizer.optimize_resource_allocation(
            tasks=tasks,
            resources=resources
        )

        print(f"\n   📊 分配結果:")
        print(f"      已分配: {len(result['allocations'])} 個任務")
        print(f"      平均利用率: {result['metrics']['average_utilization']:.1f}%")
        print(f"      平均匹配度: {result['metrics']['average_match_score']:.2f}")

        # 應用分配結果
        for allocation in result['allocations']:
            story_id = allocation['task_id']
            resource_name = allocation['resource_name']

            # 更新 Sprint Manager
            if story_id in self.sprint_manager.product_backlog:
                self.sprint_manager.product_backlog[story_id].assignee = resource_name

            # 更新 Kanban
            for task in self.kanban.tasks.values():
                if task.title == allocation['task_title']:
                    task.assignee = resource_name

        if result.get('recommendations'):
            print(f"\n   💡 建議:")
            for rec in result['recommendations']:
                print(f"      - {rec}")

        return result

    def assess_project_risk(self, sprint_id: str = None):
        """評估專案風險"""
        print(f"\n⚠️  AI 風險評估...")

        # 準備專案數據
        if sprint_id and sprint_id in self.sprint_manager.sprints:
            sprint = self.sprint_manager.sprints[sprint_id]
            project_data = {
                'id': sprint_id,
                'name': sprint.name,
                'start_date': sprint.start_date.isoformat() if sprint.start_date else None,
                'end_date': sprint.end_date.isoformat() if sprint.end_date else None,
                'progress': sprint.completed_points / sprint.committed_points * 100 if sprint.committed_points > 0 else 0
            }
        else:
            project_data = {
                'id': 'project_001',
                'name': self.project_name,
                'progress': 0
            }

        # 準備任務數據
        tasks = []
        for story in self.sprint_manager.product_backlog.values():
            tasks.append({
                'id': story.id,
                'title': story.title,
                'status': story.status,
                'priority': self._int_to_priority(story.priority),
                'estimated_hours': story.story_points * 8,
                'assignee': story.assignee
            })

        # 準備團隊數據
        team_members = [
            {'id': mid, 'name': m['name'], 'skills': []}
            for mid, m in self.sprint_manager.team_members.items()
        ]

        # 執行風險評估
        risk_report = self.ai_risk_predictor.predict_project_risk(
            project_data=project_data,
            tasks=tasks,
            team_members=team_members
        )

        print(f"\n   🎯 整體風險: {risk_report['overall_risk_level']} (分數: {risk_report['overall_risk_score']}/100)")

        print(f"\n   風險詳情:")
        for risk in risk_report['risks']:
            if risk['score'] > 0:
                print(f"      {risk['name']}: {risk['level']} ({risk['score']})")
                for issue in risk['issues']:
                    print(f"         - {issue}")

        if risk_report.get('recommendations'):
            print(f"\n   💡 建議:")
            for rec in risk_report['recommendations']:
                print(f"      - {rec}")

        return risk_report

    def get_comprehensive_dashboard(self, sprint_id: str = None):
        """獲取綜合儀表板"""
        print(f"\n📊 綜合儀表板")
        print("=" * 80)

        # Sprint 指標
        if sprint_id and sprint_id in self.sprint_manager.sprints:
            sprint_metrics = self.sprint_manager.get_sprint_metrics(sprint_id)
            print(f"\n🎯 Sprint 指標:")
            print(f"   名稱: {sprint_metrics['sprint_name']}")
            print(f"   狀態: {sprint_metrics['status']}")
            print(f"   承諾/完成: {sprint_metrics['committed_points']}/{sprint_metrics['completed_points']} 故事點")
            print(f"   完成率: {sprint_metrics['completion_rate']}%")
            print(f"   故事完成率: {sprint_metrics['story_completion_rate']}%")

        # Backlog 健康度
        backlog_health = self.sprint_manager._analyze_backlog_health()
        print(f"\n📋 Backlog 健康度:")
        print(f"   分數: {backlog_health['health_score']:.1f}/100 ({backlog_health['health_level']})")
        print(f"   總故事: {backlog_health['total_stories']}")
        print(f"   已估算: {backlog_health['total_stories'] - backlog_health['unestimated_stories']}")

        # Kanban 統計
        kanban_stats = self.kanban.get_statistics()
        print(f"\n📋 Kanban 統計:")
        print(f"   總任務: {kanban_stats['total_tasks']}")
        if 'by_status' in kanban_stats:
            print(f"   各狀態:")
            for status, count in kanban_stats['by_status'].items():
                print(f"      {status}: {count}")

        # AI 洞察
        insights = self.sprint_manager.get_ai_insights(sprint_id)
        if insights['estimation_accuracy']['accuracy'] is not None:
            print(f"\n🤖 AI 估算準確性:")
            print(f"   準確率: {insights['estimation_accuracy']['accuracy']:.1f}%")
            print(f"   平均偏差: {insights['estimation_accuracy']['avg_deviation']:.1f}%")

        print("\n" + "=" * 80)

    def _int_to_priority(self, priority_int: int) -> str:
        """整數轉優先級字符串"""
        int_map = {0: 'URGENT', 1: 'HIGH', 2: 'MEDIUM', 3: 'LOW'}
        return int_map.get(priority_int, 'MEDIUM')


def main():
    """主示例"""
    print("\n" + "🌟" * 40)
    print("整合專案管理系統示範")
    print("🌟" * 40)

    # 創建整合系統
    pm = IntegratedProjectManagement(
        project_name="電商平台開發",
        team_name="電商開發團隊"
    )

    # 設置團隊
    team_members = [
        {'name': 'Alice Chen', 'role': 'Tech Lead', 'capacity': 40, 'skills': ['Python', 'React', 'AWS']},
        {'name': 'Bob Wang', 'role': 'Backend Dev', 'capacity': 40, 'skills': ['Python', 'Django', 'PostgreSQL']},
        {'name': 'Carol Li', 'role': 'Frontend Dev', 'capacity': 40, 'skills': ['React', 'TypeScript', 'CSS']},
        {'name': 'David Zhang', 'role': 'QA Engineer', 'capacity': 40, 'skills': ['Testing', 'Selenium', 'Python']},
    ]
    pm.setup_team(team_members)

    # 創建 Product Backlog
    user_stories = [
        {
            'title': '作為用戶，我想要能夠註冊新帳號',
            'description': '實現完整的用戶註冊功能，包括 Email 驗證、密碼強度檢查',
            'complexity': 'MEDIUM',
            'priority': 'HIGH',
            'tags': ['backend', 'authentication']
        },
        {
            'title': '作為用戶，我想要能夠登入系統',
            'description': '實現用戶登入功能，支持 JWT Token 管理',
            'complexity': 'MEDIUM',
            'priority': 'HIGH',
            'tags': ['backend', 'authentication']
        },
        {
            'title': '作為用戶，我想要能夠瀏覽商品',
            'description': '實現商品列表頁面，支持分類、搜索、排序',
            'complexity': 'HIGH',
            'priority': 'HIGH',
            'tags': ['frontend', 'backend', 'product']
        },
        {
            'title': '作為用戶，我想要能夠加入購物車',
            'description': '實現購物車功能，支持增減商品、計算總價',
            'complexity': 'MEDIUM',
            'priority': 'MEDIUM',
            'tags': ['frontend', 'cart']
        },
    ]
    pm.create_project_backlog(user_stories)

    # 規劃 Sprint
    sprint, plan = pm.plan_sprint(
        sprint_name="Sprint 1 - 基礎功能",
        sprint_goal="完成用戶認證和基本商品瀏覽功能",
        duration_weeks=2
    )

    # 分配資源
    pm.allocate_resources(sprint.id)

    # 風險評估
    pm.assess_project_risk(sprint.id)

    # 顯示綜合儀表板
    pm.get_comprehensive_dashboard(sprint.id)

    print("\n" + "✅" * 40)
    print("整合專案管理系統示範完成！")
    print("✅" * 40)

    print("""
📚 系統功能總結:

1. 🎯 Sprint 管理 (AI 增強)
   - AI 自動估算故事點
   - 智能 Sprint 規劃
   - Sprint 結果預測

2. 📋 Kanban 看板
   - 視覺化任務流程
   - 拖拽式任務管理
   - WIP 限制控制

3. 👥 資源分配 (AI 優化)
   - 智能資源匹配
   - 工作負載平衡
   - 技能匹配優化

4. 📅 甘特圖
   - 任務時間軸視圖
   - 依賴關係管理
   - 關鍵路徑分析

5. 🤖 AI 助手
   - 任務估時
   - 風險預測
   - 優先級建議
   - 資源優化

6. 📊 綜合儀表板
   - 多維度指標監控
   - AI 洞察報告
   - 風險預警

💡 最佳實踐:
   - 定期更新實際工時以提高 AI 準確性
   - 每日查看風險評估
   - 根據 AI 建議調整計劃
   - 保持 Backlog 健康度在良好水平
    """)


if __name__ == '__main__':
    main()
