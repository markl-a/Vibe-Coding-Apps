"""
AI 助手使用示例
展示各種 AI 輔助功能的使用方法
"""

from ai_assistant import (
    AITaskEstimator,
    AIRiskPredictor,
    AIResourceOptimizer,
    AIPriorityAdvisor,
    AISprintPlanner
)
from datetime import datetime, timedelta
import json


def demo_task_estimator():
    """示範 AI 任務估時"""
    print("=" * 80)
    print("AI 任務估時示範")
    print("=" * 80)

    estimator = AITaskEstimator()

    # 示例任務
    task = {
        'title': '實現用戶認證 API',
        'description': '''
        需要實現完整的用戶認證系統，包括：
        1. 用戶註冊功能
        2. 登入/登出
        3. JWT Token 管理
        4. 密碼重置
        5. Email 驗證

        技術要求：
        - 使用 bcrypt 加密密碼
        - 實現 refresh token 機制
        - 添加速率限制
        ''',
        'complexity': 'HIGH',
        'priority': 'HIGH',
        'assignee_experience': 'MEDIUM',
        'tags': ['backend', 'security', 'api']
    }

    result = estimator.estimate_task(
        title=task['title'],
        description=task['description'],
        complexity=task['complexity'],
        priority=task['priority'],
        assignee_experience=task['assignee_experience'],
        tags=task['tags']
    )

    print(f"\n任務: {task['title']}")
    print(f"複雜度: {task['complexity']} | 優先級: {task['priority']}")
    print(f"\n📊 估時結果:")
    print(f"  預估工時: {result['estimated_hours']} 小時")
    print(f"  信心度: {result['confidence'] * 100}%")
    print(f"  範圍: {result['range']['min']} - {result['range']['max']} 小時")

    print(f"\n🔍 估時因子:")
    for factor, value in result['factors'].items():
        print(f"  {factor}: {value}")

    if result['recommendations']:
        print(f"\n💡 建議:")
        for rec in result['recommendations']:
            print(f"  - {rec}")

    if result['similar_tasks']:
        print(f"\n📝 相似任務:")
        for similar in result['similar_tasks']:
            print(f"  - {similar['title']} ({similar['actual_hours']}h, 相似度: {similar['similarity']})")


def demo_risk_predictor():
    """示範 AI 風險預測"""
    print("\n" + "=" * 80)
    print("AI 風險預測示範")
    print("=" * 80)

    predictor = AIRiskPredictor()

    # 示例專案數據
    project_data = {
        'id': 'proj_001',
        'name': '電商平台開發',
        'start_date': (datetime.now() - timedelta(days=30)).isoformat(),
        'end_date': (datetime.now() + timedelta(days=7)).isoformat(),
        'progress': 60
    }

    # 示例任務
    tasks = [
        {'id': 't1', 'title': '前端開發', 'status': 'DONE', 'priority': 'HIGH', 'estimated_hours': 40, 'assignee': 'Alice'},
        {'id': 't2', 'title': '後端 API', 'status': 'IN_PROGRESS', 'priority': 'HIGH', 'estimated_hours': 60, 'assignee': 'Alice'},
        {'id': 't3', 'title': '資料庫設計', 'status': 'DONE', 'priority': 'HIGH', 'estimated_hours': 30, 'assignee': 'Bob'},
        {'id': 't4', 'title': 'UI 設計', 'status': 'TODO', 'priority': 'MEDIUM', 'estimated_hours': 20, 'assignee': None},
        {'id': 't5', 'title': '測試', 'status': 'TODO', 'priority': 'HIGH', 'estimated_hours': 40, 'assignee': None},
        {'id': 't6', 'title': '部署', 'status': 'TODO', 'priority': 'URGENT', 'estimated_hours': 16, 'assignee': None},
    ]

    # 示例團隊
    team_members = [
        {'id': 'm1', 'name': 'Alice', 'skills': ['React', 'Python']},
        {'id': 'm2', 'name': 'Bob', 'skills': ['SQL', 'Python']},
    ]

    result = predictor.predict_project_risk(
        project_data=project_data,
        tasks=tasks,
        team_members=team_members
    )

    print(f"\n專案: {project_data['name']}")
    print(f"進度: {project_data['progress']}%")
    print(f"\n🎯 整體風險評估:")
    print(f"  風險等級: {result['overall_risk_level']}")
    print(f"  風險分數: {result['overall_risk_score']}/100")

    print(f"\n⚠️ 風險詳情:")
    for risk in result['risks']:
        print(f"\n  【{risk['name']}】")
        print(f"    等級: {risk['level']} (分數: {risk['score']})")
        if risk['issues']:
            print(f"    問題:")
            for issue in risk['issues']:
                print(f"      - {issue}")

    print(f"\n💡 建議措施:")
    for rec in result['recommendations']:
        print(f"  - {rec}")

    print(f"\n📈 專案預測:")
    forecast = result['forecast']
    print(f"  成功概率: {forecast['success_probability']}%")
    print(f"  預期結果: {forecast['likely_outcome']}")
    if 'estimated_delay_days' in forecast:
        print(f"  預計延遲: {forecast['estimated_delay_days']} 天")


def demo_resource_optimizer():
    """示範 AI 資源優化"""
    print("\n" + "=" * 80)
    print("AI 資源優化示範")
    print("=" * 80)

    optimizer = AIResourceOptimizer()

    # 示例任務
    tasks = [
        {
            'id': 't1', 'title': '前端開發',
            'estimated_hours': 40, 'priority': 'HIGH',
            'tags': ['React', 'Frontend'], 'complexity': 'MEDIUM'
        },
        {
            'id': 't2', 'title': '後端 API',
            'estimated_hours': 60, 'priority': 'HIGH',
            'tags': ['Python', 'Backend'], 'complexity': 'HIGH'
        },
        {
            'id': 't3', 'title': '資料庫設計',
            'estimated_hours': 30, 'priority': 'HIGH',
            'tags': ['SQL', 'Database'], 'complexity': 'MEDIUM'
        },
        {
            'id': 't4', 'title': 'UI 設計',
            'estimated_hours': 20, 'priority': 'MEDIUM',
            'tags': ['Design', 'UI'], 'complexity': 'LOW'
        },
        {
            'id': 't5', 'title': '自動化測試',
            'estimated_hours': 40, 'priority': 'MEDIUM',
            'tags': ['Testing', 'Automation'], 'complexity': 'MEDIUM'
        },
    ]

    # 示例資源
    resources = [
        {
            'id': 'r1', 'name': 'Alice',
            'skills': ['React', 'Python', 'Frontend'],
            'experience_level': 'SENIOR'
        },
        {
            'id': 'r2', 'name': 'Bob',
            'skills': ['Python', 'SQL', 'Backend'],
            'experience_level': 'SENIOR'
        },
        {
            'id': 'r3', 'name': 'Carol',
            'skills': ['Design', 'UI', 'React'],
            'experience_level': 'MEDIUM'
        },
        {
            'id': 'r4', 'name': 'David',
            'skills': ['Testing', 'Python', 'Automation'],
            'experience_level': 'JUNIOR'
        },
    ]

    result = optimizer.optimize_resource_allocation(
        tasks=tasks,
        resources=resources,
        constraints={
            'max_hours_per_day': 8,
            'max_utilization': 0.9,
            'skill_matching': True
        }
    )

    print(f"\n📊 分配結果:")
    print(f"  已分配任務: {result['metrics']['total_tasks_allocated']}")
    print(f"  平均利用率: {result['metrics']['average_utilization']}%")
    print(f"  平均匹配度: {result['metrics']['average_match_score']}")

    print(f"\n👥 資源分配詳情:")
    for allocation in result['allocations']:
        print(f"\n  {allocation['resource_name']}:")
        print(f"    任務: {allocation['task_title']}")
        print(f"    工時: {allocation['estimated_hours']}h")
        print(f"    匹配度: {allocation['match_score']:.2f}")

    print(f"\n📈 資源利用率:")
    for resource, hours in result['metrics']['resource_utilization_details'].items():
        utilization_pct = (hours / 40) * 100  # 假設每週40小時
        bar_length = int(utilization_pct / 5)
        bar = '█' * bar_length
        print(f"  {resource:10s} [{bar:20s}] {hours}h ({utilization_pct:.1f}%)")

    if result['unallocated_tasks']:
        print(f"\n⚠️ 未分配任務:")
        for task in result['unallocated_tasks']:
            print(f"  - {task['title']}")

    if result['conflicts']:
        print(f"\n🔴 資源衝突:")
        for conflict in result['conflicts']:
            print(f"  - {conflict['type']}: {conflict}")

    print(f"\n💡 優化建議:")
    for rec in result['recommendations']:
        print(f"  - {rec}")


def demo_priority_advisor():
    """示範 AI 優先級建議"""
    print("\n" + "=" * 80)
    print("AI 優先級建議示範")
    print("=" * 80)

    advisor = AIPriorityAdvisor()

    # 示例任務
    tasks = [
        {
            'id': 't1',
            'title': 'Critical bug fix - 用戶無法登入',
            'description': '生產環境緊急問題，影響所有用戶',
            'priority': 'MEDIUM',  # 當前優先級設置錯誤
            'estimated_hours': 4,
            'due_date': (datetime.now() + timedelta(days=1)).isoformat()
        },
        {
            'id': 't2',
            'title': '添加新功能 - 深色模式',
            'description': '用戶請求的新功能',
            'priority': 'HIGH',  # 可能優先級過高
            'estimated_hours': 40,
            'due_date': (datetime.now() + timedelta(days=30)).isoformat()
        },
        {
            'id': 't3',
            'title': '更新文檔',
            'description': '更新 API 文檔',
            'priority': 'LOW',
            'estimated_hours': 2,
        }
    ]

    # 相關任務（用於檢查依賴）
    related_tasks = [
        {'id': 't4', 'title': '部署', 'blocked_by': 't1'},
        {'id': 't5', 'title': '測試', 'blocked_by': 't1'},
    ]

    project_context = {
        'phase': 'CRITICAL',  # 專案處於關鍵階段
    }

    print("\n分析任務優先級...")

    for task in tasks:
        result = advisor.suggest_task_priority(
            task=task,
            project_context=project_context,
            related_tasks=related_tasks
        )

        print(f"\n📋 任務: {task['title']}")
        print(f"  當前優先級: {result['current_priority']}")
        print(f"  建議優先級: {result['suggested_priority']}")
        print(f"  優先級分數: {result['priority_score']}")
        print(f"  信心度: {result['confidence'] * 100}%")

        if result['should_change']:
            print(f"  ⚠️ 建議調整優先級")
        else:
            print(f"  ✅ 優先級設置合理")

        if result['reasons']:
            print(f"  理由:")
            for reason in result['reasons']:
                print(f"    - {reason}")


def demo_sprint_planner():
    """示範 AI Sprint 規劃"""
    print("\n" + "=" * 80)
    print("AI Sprint 規劃示範")
    print("=" * 80)

    planner = AISprintPlanner()

    # 示例 Product Backlog
    backlog = [
        {'id': 's1', 'title': '用戶註冊', 'story_points': 5, 'priority': 'HIGH'},
        {'id': 's2', 'title': '用戶登入', 'story_points': 3, 'priority': 'HIGH'},
        {'id': 's3', 'title': '密碼重置', 'story_points': 5, 'priority': 'MEDIUM'},
        {'id': 's4', 'title': '個人資料頁面', 'story_points': 8, 'priority': 'MEDIUM'},
        {'id': 's5', 'title': 'OAuth 整合', 'story_points': 13, 'priority': 'LOW', 'dependencies': ['s1', 's2']},
        {'id': 's6', 'title': 'Email 驗證', 'story_points': 5, 'priority': 'HIGH'},
        {'id': 's7', 'title': '雙因素認證', 'story_points': 8, 'priority': 'LOW'},
    ]

    team_capacity = 120  # 團隊總容量（小時）
    team_velocity = 25   # 歷史速度（故事點/Sprint）

    result = planner.suggest_sprint_plan(
        backlog=backlog,
        team_capacity=team_capacity,
        team_velocity=team_velocity,
        sprint_goal="完成基本的用戶認證功能"
    )

    print(f"\n🎯 Sprint 規劃建議:")
    print(f"  目標容量: {result['target_capacity']} 故事點")
    print(f"  規劃總點數: {result['total_story_points']} 故事點")
    print(f"  容量利用率: {result['utilization']}%")

    print(f"\n📋 建議的 Sprint Backlog:")
    for item in result['suggested_items']:
        print(f"  [{item['story_points']} pts] {item['title']} (優先級: {item['priority']})")

    if result['recommendations']:
        print(f"\n💡 規劃建議:")
        for rec in result['recommendations']:
            print(f"  - {rec}")

    if result['risks']:
        print(f"\n⚠️ Sprint 風險:")
        for risk in result['risks']:
            print(f"  [{risk['severity']}] {risk['type']}: {risk['description']}")
            print(f"      緩解措施: {risk['mitigation']}")


def main():
    """主函數"""
    print("\n")
    print("🤖 " * 30)
    print("專案管理 AI 助手示範")
    print("🤖 " * 30)

    # 運行所有示範
    demo_task_estimator()
    demo_risk_predictor()
    demo_resource_optimizer()
    demo_priority_advisor()
    demo_sprint_planner()

    print("\n" + "=" * 80)
    print("✅ 所有 AI 助手示範完成！")
    print("=" * 80)

    print("""
📚 使用建議:

1. AITaskEstimator - 任務估時
   - 在創建新任務時使用
   - 幫助團隊更準確地估算工時
   - 基於歷史數據持續改進

2. AIRiskPredictor - 風險預測
   - 定期（每週）運行風險評估
   - 關注高風險和關鍵風險
   - 提前制定應對措施

3. AIResourceOptimizer - 資源優化
   - 在 Sprint 規劃時使用
   - 優化任務分配，平衡工作負載
   - 提高技能匹配度

4. AIPriorityAdvisor - 優先級建議
   - 處理 Backlog 時使用
   - 確保重要任務優先處理
   - 避免關鍵任務被忽視

5. AISprintPlanner - Sprint 規劃
   - Sprint Planning Meeting 使用
   - 基於團隊速度自動選擇任務
   - 識別潛在風險

💡 最佳實踐:
   - 收集歷史數據以提高 AI 準確性
   - 定期審查 AI 建議並調整
   - 結合人工判斷和 AI 建議
   - 持續優化和改進
    """)


if __name__ == '__main__':
    main()
