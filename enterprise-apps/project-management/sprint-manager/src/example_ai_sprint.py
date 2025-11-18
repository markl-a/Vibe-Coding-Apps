"""
AI 增強 Sprint 管理器完整使用示例
展示如何使用 AI 功能進行 Sprint 管理
"""

from ai_enhanced_sprint_manager import AIEnhancedSprintManager
from datetime import datetime, timedelta


def main():
    print("\n")
    print("🤖" * 40)
    print("AI 增強 Sprint 管理器示範")
    print("🤖" * 40)

    # 創建 AI 增強的 Sprint 管理器
    manager = AIEnhancedSprintManager("電商平台開發團隊")

    # === 階段 1: 團隊設置 ===
    print("\n" + "=" * 80)
    print("階段 1: 設置團隊")
    print("=" * 80)

    manager.add_team_member("Alice Chen", "Senior Full-Stack Developer", 40)
    manager.add_team_member("Bob Wang", "Backend Developer", 40)
    manager.add_team_member("Carol Li", "Frontend Developer", 40)
    manager.add_team_member("David Zhang", "QA Engineer", 40)

    print(f"\n✅ 團隊設置完成")
    print(f"團隊總容量: {manager.get_team_capacity()} 小時/Sprint")
    print(f"團隊成員: {len(manager.team_members)} 人")

    # === 階段 2: 使用 AI 創建 Product Backlog ===
    print("\n" + "=" * 80)
    print("階段 2: 使用 AI 創建 Product Backlog")
    print("=" * 80)

    user_stories = [
        {
            'title': '作為用戶，我想要能夠註冊新帳號',
            'description': '''
實現完整的用戶註冊功能:
- Email/手機號註冊
- 密碼強度驗證
- Email 驗證碼
- 用戶協議確認
- 基本資料填寫
            ''',
            'complexity': 'MEDIUM',
            'priority': 'HIGH',
            'assignee_experience': 'SENIOR',
            'tags': ['backend', 'authentication', 'user-management']
        },
        {
            'title': '作為用戶，我想要能夠登入系統',
            'description': '''
實現用戶登入功能:
- Email/手機號登入
- JWT Token 管理
- Remember me 功能
- 登入記錄
            ''',
            'complexity': 'MEDIUM',
            'priority': 'HIGH',
            'assignee_experience': 'SENIOR',
            'tags': ['backend', 'authentication']
        },
        {
            'title': '作為用戶，我想要能夠重置密碼',
            'description': '''
實現密碼重置功能:
- 忘記密碼流程
- Email 驗證碼
- 新密碼設置
            ''',
            'complexity': 'LOW',
            'priority': 'MEDIUM',
            'assignee_experience': 'MEDIUM',
            'tags': ['backend', 'authentication']
        },
        {
            'title': '作為用戶，我想要能夠編輯個人資料',
            'description': '''
實現個人資料編輯:
- 頭像上傳
- 基本信息修改
- 隱私設置
            ''',
            'complexity': 'MEDIUM',
            'priority': 'MEDIUM',
            'assignee_experience': 'MEDIUM',
            'tags': ['backend', 'frontend', 'user-management']
        },
        {
            'title': '作為管理員，我想要能夠管理用戶',
            'description': '''
實現用戶管理後台:
- 用戶列表查看
- 用戶狀態管理
- 權限設置
- 批量操作
            ''',
            'complexity': 'HIGH',
            'priority': 'LOW',
            'assignee_experience': 'SENIOR',
            'tags': ['backend', 'admin', 'user-management']
        },
        {
            'title': '作為用戶，我想要能夠使用第三方登入',
            'description': '''
整合 OAuth 登入:
- Google OAuth
- Facebook OAuth
- 帳號綁定
            ''',
            'complexity': 'HIGH',
            'priority': 'LOW',
            'assignee_experience': 'SENIOR',
            'tags': ['backend', 'oauth', 'authentication']
        },
    ]

    print("\n使用 AI 估算故事點...")
    created_stories = []

    for story_data in user_stories:
        story, estimation = manager.add_story_with_ai_estimation(**story_data)
        created_stories.append((story, estimation))

        print(f"\n📋 {story.title}")
        print(f"   複雜度: {story_data['complexity']}")
        print(f"   AI 估時: {estimation['estimated_hours']} 小時 (範圍: {estimation['range']['min']}-{estimation['range']['max']})")
        print(f"   故事點: {story.story_points}")
        print(f"   信心度: {estimation['confidence'] * 100:.1f}%")

        if estimation.get('recommendations'):
            print(f"   💡 建議:")
            for rec in estimation['recommendations']:
                print(f"      - {rec}")

    # === 階段 3: 分析 Backlog 健康度 ===
    print("\n" + "=" * 80)
    print("階段 3: Backlog 健康度分析")
    print("=" * 80)

    backlog_health = manager._analyze_backlog_health()

    print(f"\n📊 Backlog 健康度: {backlog_health['health_score']:.1f}/100")
    print(f"   等級: {backlog_health['health_level']}")
    print(f"   總故事數: {backlog_health['total_stories']}")
    print(f"   已估算: {backlog_health['total_stories'] - backlog_health['unestimated_stories']}")
    print(f"   已設優先級: {backlog_health['prioritized_stories']}")
    print(f"   有標籤: {backlog_health['stories_with_tags']}")

    if backlog_health.get('recommendations'):
        print(f"\n💡 改進建議:")
        for rec in backlog_health['recommendations']:
            print(f"   - {rec}")

    # === 階段 4: 獲取優先級建議 ===
    print("\n" + "=" * 80)
    print("階段 4: AI 優先級建議")
    print("=" * 80)

    priority_suggestions = manager.get_story_priority_suggestions()

    if priority_suggestions:
        print(f"\n發現 {len(priority_suggestions)} 個優先級調整建議:\n")

        for suggestion in priority_suggestions:
            print(f"📋 {suggestion['title']}")
            print(f"   當前: {suggestion['current_priority']} → 建議: {suggestion['suggested_priority']}")
            print(f"   分數: {suggestion['priority_score']} | 信心: {suggestion['confidence'] * 100:.1f}%")
            if suggestion.get('reasons'):
                print(f"   理由:")
                for reason in suggestion['reasons']:
                    print(f"      - {reason}")
            print()
    else:
        print("\n✅ 所有故事的優先級設置合理")

    # === 階段 5: 使用 AI 規劃 Sprint ===
    print("\n" + "=" * 80)
    print("階段 5: 使用 AI 規劃 Sprint")
    print("=" * 80)

    # 創建 Sprint
    sprint = manager.create_sprint(
        name="Sprint 1 - 用戶認證",
        goal="完成基本的用戶註冊和登入功能",
        duration_weeks=2,
        start_date=datetime.now()
    )

    print(f"\n創建 Sprint: {sprint.name}")
    print(f"目標: {sprint.goal}")
    print(f"時間: {sprint.duration_weeks} 週")
    print(f"團隊容量: {sprint.team_capacity} 小時")

    # 使用 AI 規劃
    print(f"\n使用 AI 規劃 Sprint...")
    plan = manager.plan_sprint_with_ai(sprint.id, sprint.goal)

    print(f"\n📊 AI 規劃結果:")
    print(f"   目標容量: {plan['target_capacity']} 故事點")
    print(f"   承諾點數: {plan['total_story_points']} 故事點")
    print(f"   容量利用率: {plan['utilization']}%")

    print(f"\n📋 Sprint Backlog ({len(plan['suggested_items'])} 個故事):")
    for item in plan['suggested_items']:
        print(f"   [{item.get('story_points', 0)} pts] {item['title']} (優先級: {item.get('priority', 'N/A')})")

    if plan.get('recommendations'):
        print(f"\n💡 AI 建議:")
        for rec in plan['recommendations']:
            print(f"   - {rec}")

    if plan.get('risks'):
        print(f"\n⚠️  Sprint 風險:")
        for risk in plan['risks']:
            print(f"   [{risk['severity']}] {risk['type']}: {risk['description']}")
            print(f"      緩解: {risk['mitigation']}")

    # === 階段 6: 開始 Sprint ===
    print("\n" + "=" * 80)
    print("階段 6: 開始 Sprint")
    print("=" * 80)

    manager.start_sprint(sprint.id)
    print(f"\n✅ Sprint 已開始")
    print(f"開始日期: {sprint.start_date.strftime('%Y-%m-%d')}")
    print(f"結束日期: {sprint.end_date.strftime('%Y-%m-%d')}")

    # === 階段 7: 模擬 Sprint 進度 ===
    print("\n" + "=" * 80)
    print("階段 7: Sprint 執行（模擬）")
    print("=" * 80)

    # 模擬完成一些故事
    completed_story_ids = plan['suggested_items'][:2]  # 完成前2個故事

    for item in completed_story_ids:
        story_id = item['id']
        story = manager.product_backlog[story_id]

        # 更新狀態
        manager.update_story_status(story_id, "IN_PROGRESS")
        manager.update_story_status(story_id, "DONE")

        # 記錄每日站會
        manager.add_daily_standup(
            sprint.id,
            completed_points=story.story_points,
            notes=f"完成 {story.title}"
        )

        # 模擬實際工時（略有偏差）
        actual_hours = story.story_points * 8 * (0.9 + 0.2 * (story.story_points % 2))
        manager.update_story_with_actual_hours(story_id, actual_hours)

        print(f"\n✅ 完成故事: {story.title}")
        print(f"   故事點: {story.story_points}")
        print(f"   實際工時: {actual_hours:.1f} 小時")

    # === 階段 8: Sprint 預測 ===
    print("\n" + "=" * 80)
    print("階段 8: Sprint 結果預測")
    print("=" * 80)

    prediction = manager._predict_sprint_outcome(sprint)

    print(f"\n📊 Sprint 預測:")
    print(f"   總天數: {prediction['days_total']}")
    print(f"   已過天數: {prediction['days_passed']}")
    print(f"   剩餘天數: {prediction['days_remaining']}")
    print(f"   時間進度: {prediction['progress_percent']:.1f}%")
    print(f"   完成率: {prediction['completion_rate']:.1f}%")
    print(f"   預測完成: {prediction['predicted_completion']:.1f} 故事點")
    print(f"   成功概率: {prediction['success_probability']:.1f}%")
    print(f"   預測結果: {prediction['predicted_outcome']}")

    if prediction.get('recommendations'):
        print(f"\n💡 建議:")
        for rec in prediction['recommendations']:
            print(f"   - {rec}")

    # === 階段 9: AI 洞察報告 ===
    print("\n" + "=" * 80)
    print("階段 9: AI 洞察報告")
    print("=" * 80)

    insights = manager.get_ai_insights(sprint.id)

    print(f"\n📊 估算準確性:")
    acc = insights['estimation_accuracy']
    print(f"   總估算: {acc['total_estimations']}")
    print(f"   已完成: {acc['completed_estimations']}")
    if acc['accuracy'] is not None:
        print(f"   準確率: {acc['accuracy']:.1f}%")
        print(f"   平均偏差: {acc['avg_deviation']:.1f}%")

    # === 總結 ===
    print("\n" + "=" * 80)
    print("✅ AI 增強 Sprint 管理器示範完成")
    print("=" * 80)

    print(f"""
📚 功能總結:

1. ✅ AI 任務估時
   - 自動計算故事點
   - 提供信心度和範圍
   - 生成估時建議

2. ✅ Backlog 健康度分析
   - 評估 Backlog 質量
   - 提供改進建議

3. ✅ AI 優先級建議
   - 智能分析任務優先級
   - 提供調整建議和理由

4. ✅ AI Sprint 規劃
   - 基於團隊速度自動選擇故事
   - 優化容量利用
   - 識別風險

5. ✅ Sprint 結果預測
   - 實時預測 Sprint 完成情況
   - 提供調整建議

6. ✅ AI 洞察報告
   - 估算準確性分析
   - 持續改進建議

💡 使用建議:
   - 收集歷史數據以提高 AI 準確性
   - 定期審查 AI 建議
   - 結合團隊經驗和 AI 洞察
   - 持續優化工作流程
    """)


if __name__ == '__main__':
    main()
