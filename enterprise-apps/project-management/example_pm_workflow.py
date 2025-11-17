"""
專案管理系統綜合範例
展示完整的專案管理工作流程
"""

import os
from datetime import datetime, timedelta

print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                      專案管理系統綜合範例                                      ║
║                                                                              ║
║  涵蓋專案管理的核心功能:                                                      ║
║  1. Sprint 管理器 (Sprint Manager)                                          ║
║  2. 資源分配器 (Resource Allocator)                                         ║
║  3. 看板系統 (Kanban Board)                                                 ║
║  4. 甘特圖 (Gantt Chart)                                                    ║
║  5. 專案儀表板 (Project Dashboard)                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")

def demo_sprint_manager():
    """Sprint 管理器示範"""
    print("\n" + "🔵" * 40)
    print("模組 1: Sprint 管理器 (完整度: 95%)")
    print("🔵" * 40)

    print("""
🏃 Sprint 管理器功能:
   ✓ Scrum Sprint 管理
   ✓ User Story 追蹤
   ✓ 燃盡圖生成
   ✓ 速度計算
   ✓ Sprint 回顧

🚀 快速開始:
   cd sprint-manager
   pip install -r requirements.txt
   python example_usage.py

💡 核心功能:

1. Sprint 規劃
   - 創建 Sprint
   - 設定時間範圍
   - 分配 Story Points
   - 優先級排序

2. User Story 管理
   - Story 創建與編輯
   - Story Points 估算
   - 狀態追蹤 (Todo/In Progress/Done)
   - 任務分解

3. 進度追蹤
   - 燃盡圖可視化
   - 每日 Stand-up 記錄
   - 團隊速度計算
   - Sprint 健康度評估

4. 報表生成
   - Sprint 總結報告
   - 速度趨勢圖
   - 完成率統計
    """)

    print("\n【示範：Sprint 執行流程】")
    print("""
Sprint #15: "用戶認證功能"
──────────────────────────────────────
時間: 2025-11-18 至 2025-12-01 (2週)
目標: 完成用戶登入/註冊功能
承諾點數: 50 Story Points
團隊成員: 5人

User Stories:
  [8 pts] 🟩 As a user, I can register a new account
  [5 pts] 🟩 As a user, I can login with email
  [5 pts] 🟩 As a user, I can reset password
  [8 pts] 🟨 As a user, I can use OAuth login
  [3 pts] 🟨 As a user, I can edit my profile
  [5 pts] 🟥 As a user, I can enable 2FA
  [8 pts] 🟥 As a user, I can manage sessions
  [8 pts] 🟥 As admin, I can manage user roles

圖例: 🟩 完成 🟨 進行中 🟥 待辦

燃盡圖 (剩餘點數):
Day  1: ██████████████████████████ 50
Day  2: ████████████████████████▌  48
Day  3: ███████████████████████    45
Day  4: ██████████████████████     43
Day  5: ████████████████████       40
Day  6: ███████████████████        37
Day  7: ██████████████████         35
Day  8: ███████████████            30
Day  9: ████████████               25
Day 10: █████████                  18
Day 11: ██████                     12
Day 12: ███                        6
Day 13: █                          2
Day 14: ▁                          0 ✓

Sprint 指標:
  計劃點數: 50
  完成點數: 50
  完成率: 100%
  團隊速度: 50 points/sprint
  預測下次: 48-52 points
──────────────────────────────────────
    """)

    print("\n💻 Python 使用範例:")
    print("""
from sprint_manager import SprintManager, UserStory

# 創建 Sprint
manager = SprintManager()
sprint = manager.create_sprint(
    name="Sprint 15",
    start_date="2025-11-18",
    end_date="2025-12-01",
    capacity=50
)

# 添加 User Story
story = UserStory(
    title="As a user, I can register",
    points=8,
    priority="High"
)
sprint.add_story(story)

# 更新進度
story.update_status("In Progress")
story.update_status("Done")

# 生成燃盡圖
sprint.generate_burndown_chart()

# 計算速度
velocity = manager.calculate_velocity()
print(f"團隊速度: {velocity} points/sprint")
    """)

def demo_resource_allocator():
    """資源分配器示範"""
    print("\n" + "🟢" * 40)
    print("模組 2: 資源分配器 (完整度: 90%)")
    print("🟢" * 40)

    print("""
👥 資源分配器功能:
   ✓ 團隊成員管理
   ✓ 技能匹配
   ✓ 工作負載平衡
   ✓ 多種分配策略
   ✓ 過度分配檢測

🚀 快速開始:
   cd resource-allocator
   pip install -r requirements.txt
   python example_usage.py

💡 核心功能:

1. 資源管理
   - 成員技能記錄
   - 可用性管理
   - 工作時數追蹤

2. 智能分配
   - 技能匹配算法
   - 負載平衡
   - 優先級調整
   - 最佳化分配

3. 衝突檢測
   - 過度分配警報
   - 技能缺口識別
   - 時間衝突檢查

4. 分配策略
   - 技能優先
   - 負載均衡
   - 成本最小化
    """)

    print("\n【示範：資源分配】")
    print("""
專案: 電商平台開發
需求分析:

任務列表:
  T1: 前端開發 (需要: React, 40小時)
  T2: 後端 API (需要: Python, 60小時)
  T3: 資料庫設計 (需要: SQL, 30小時)
  T4: UI 設計 (需要: Design, 20小時)
  T5: 測試 (需要: Testing, 40小時)

團隊成員:
  👨‍💻 Alice: [React, Python] - 可用 80h/週
  👨‍💻 Bob:   [Python, SQL] - 可用 40h/週
  👩‍💻 Carol: [Design, React] - 可用 40h/週
  👨‍💻 David: [Testing, SQL] - 可用 40h/週

分配結果 (技能匹配策略):
──────────────────────────────────────
Alice (使用率: 100%)
  ✓ T1: 前端開發 (40h) - 匹配度: 100%
  ✓ T2: 後端 API (40h) - 匹配度: 100%

Bob (使用率: 90%)
  ✓ T2: 後端 API (20h) - 匹配度: 100%
  ✓ T3: 資料庫設計 (16h) - 匹配度: 100%

Carol (使用率: 50%)
  ✓ T4: UI 設計 (20h) - 匹配度: 100%

David (使用率: 88%)
  ✓ T3: 資料庫設計 (14h) - 匹配度: 100%
  ✓ T5: 測試 (21h) - 匹配度: 100%

未分配:
  ⚠️  T5: 測試 (19h 未分配)

建議:
  💡 Alice 負載較重，建議減少工作量
  💡 Carol 有空閒時間，可承擔更多任務
  💡 考慮招聘測試人員或外包
──────────────────────────────────────
    """)

def demo_kanban_board():
    """看板系統示範"""
    print("\n" + "🟡" * 40)
    print("模組 3: 看板系統 (完整度: 90%)")
    print("🟡" * 40)

    print("""
📋 看板系統功能:
   ✓ 任務卡片管理
   ✓ 多欄位工作流程
   ✓ WIP 限制
   ✓ 泳道分類
   ✓ 流程指標

🚀 快速開始:
   cd kanban-board
   pip install -r requirements.txt
   python example_usage.py

💡 核心功能:

1. 看板管理
   - 創建看板
   - 自定義欄位
   - WIP 限制設定
   - 泳道管理

2. 任務卡片
   - 卡片創建
   - 狀態拖放
   - 標籤管理
   - 優先級設定

3. 協作功能
   - 成員分配
   - 評論討論
   - 附件上傳
   - 活動記錄

4. 指標追蹤
   - 週期時間
   - 前置時間
   - 吞吐量
   - 累積流圖
    """)

    print("\n【示範：看板視圖】")
    print("""
看板: 產品開發流程
──────────────────────────────────────────────────────────────
│ Backlog (∞) │ Todo (5)    │ In Progress │ Testing (3) │ Done  │
│              │             │ (3) WIP=3   │             │       │
├──────────────┼─────────────┼─────────────┼─────────────┼───────┤
│              │             │             │             │       │
│ [P2] 購物車  │ [P1] 支付   │ [P1] 用戶   │ [P1] 搜尋   │ [✓]   │
│ 優化         │ 整合        │ 認證 👤A    │ 功能 👤C    │ 首頁  │
│              │             │ 🏷️ Backend  │ 🏷️ Frontend │       │
│              │             │             │             │       │
│ [P3] 推薦    │ [P2] 評論   │ [P1] 商品   │ [P2] 訂單   │ [✓]   │
│ 系統         │ 系統        │ 管理 👤B    │ 追蹤 👤D    │ 登入  │
│              │             │ 🏷️ Backend  │ 🏷️ Backend  │       │
│              │             │             │             │       │
│ [P3] 多語言  │ [P2] 優惠券 │ [P2] 圖片   │ [P3] 報表   │ [✓]   │
│ 支援         │             │ 上傳 👤A    │ 生成 👤B    │ 註冊  │
│              │             │ 🏷️ Frontend │ 🏷️ Backend  │       │
│              │             │             │             │       │
│              │ [P3] SEO    │             │             │       │
│              │ 優化        │             │             │       │
│              │             │             │             │       │
│              │ [P3] 效能   │             │             │       │
│              │ 監控        │             │             │       │
──────────────────────────────────────────────────────────────

圖例: [P1]=高優先級 [P2]=中優先級 [P3]=低優先級
      👤=負責人 🏷️=標籤

WIP 警告:
  ⚠️  "In Progress" 欄位已達 WIP 上限 (3/3)
  💡 建議先完成現有任務再開始新任務

流程指標:
  平均週期時間: 3.5 天
  平均前置時間: 5.2 天
  本週吞吐量: 12 張卡片
──────────────────────────────────────────────────────────────
    """)

def demo_gantt_chart():
    """甘特圖示範"""
    print("\n" + "🟣" * 40)
    print("模組 4: 甘特圖系統 (完整度: 95%)")
    print("🟣" * 40)

    print("""
📅 甘特圖功能:
   ✓ 任務時間軸視圖
   ✓ 依賴關係管理
   ✓ 關鍵路徑計算 (CPM)
   ✓ 里程碑追蹤
   ✓ 進度更新

🚀 快速開始:
   cd gantt-chart
   pip install -r requirements.txt
   python example_usage.py

💡 核心功能:

1. 任務規劃
   - 創建任務
   - 設定工期
   - 分配資源
   - 優先級管理

2. 依賴管理
   - FS (Finish-to-Start)
   - SS (Start-to-Start)
   - FF (Finish-to-Finish)
   - SF (Start-to-Finish)

3. 關鍵路徑分析
   - CPM 算法
   - 浮動時間計算
   - 關鍵任務識別
   - 時程優化

4. 視覺化
   - Gantt 圖生成
   - 里程碑標記
   - 進度百分比
   - 資源負載圖
    """)

    print("\n【示範：專案甘特圖】")
    print("""
專案: 網站重新設計
時間範圍: 2025-11-01 至 2025-12-31
──────────────────────────────────────────────────────────────
任務                  11月            12月
                  1─────15────30  1─────15────30
──────────────────────────────────────────────────────────────
需求分析 (5d)     ████             [關鍵路徑]
  └─ 用戶調研     ██
  └─ 競品分析       ███

設計階段 (10d)        ██████████   [關鍵路徑]
  └─ UI 設計           ████
  └─ 原型製作              ██████

開發階段 (20d)               ████████████████████ [關鍵路徑]
  └─ 前端開發                 ████████████
  └─ 後端開發                      ████████████
  └─ 整合測試                           ████

部署上線 (3d)                                  ██ [關鍵路徑]

里程碑:
  🎯 需求確認: 11/05
  🎯 設計完成: 11/20
  🎯 開發完成: 12/20
  🎯 正式上線: 12/31

關鍵路徑: 需求分析 → 設計階段 → 開發階段 → 部署上線
總工期: 38 天
關鍵任務: 4 個
浮動時間: 0 天 (關鍵路徑上)

資源分配:
  設計師: 10天 (11/11-11/20)
  前端: 12天 (11/21-12/05)
  後端: 12天 (12/01-12/15)
  測試: 4天 (12/16-12/20)
──────────────────────────────────────────────────────────────
    """)

def demo_project_dashboard():
    """專案儀表板示範"""
    print("\n" + "🔴" * 40)
    print("模組 5: 專案儀表板 (完整度: 75%)")
    print("🔴" * 40)

    print("""
📊 專案儀表板功能:
   ✓ 多專案概覽
   ✓ 關鍵指標追蹤
   ✓ 風險預警
   ✓ 互動式報表

🚀 快速開始:
   cd project-dashboard
   pip install -r requirements.txt
   streamlit run dashboard.py

瀏覽器訪問: http://localhost:8501

💡 核心功能:

1. KPI 監控
   - 專案進度
   - 預算使用率
   - 資源利用率
   - 風險等級

2. 視覺化圖表
   - 進度甘特圖
   - 燃盡圖
   - 資源分配圖
   - 成本趨勢

3. 多專案管理
   - 專案組合視圖
   - 優先級排序
   - 資源衝突檢測

4. 報表導出
   - PDF 報告
   - Excel 數據
   - 圖表下載
    """)

    print("\n【示範：儀表板概覽】")
    print("""
══════════════════════════════════════════════════════════════
                    專案管理儀表板
══════════════════════════════════════════════════════════════

📊 總覽指標
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 活躍專案     │ 完成專案     │ 總預算       │ 已使用預算   │
│   12         │   45         │  $2.5M       │  $1.8M(72%) │
└──────────────┴──────────────┴──────────────┴──────────────┘

🎯 專案狀態分佈
  ✅ 準時 (75%):      █████████████████▌
  ⚠️  風險 (20%):     ████▌
  🔴 延遲 (5%):       █▌

📈 關鍵專案
──────────────────────────────────────────────────────────────
專案名稱            進度    預算    狀態    負責人
──────────────────────────────────────────────────────────────
電商平台開發        85%    $500K   ✅準時  Alice
CRM 系統升級        60%    $300K   ⚠️風險  Bob
行動 App 重構       45%    $400K   ✅準時  Carol
數據分析平台        30%    $600K   🔴延遲  David
──────────────────────────────────────────────────────────────

⚠️  風險預警
  • CRM 系統升級: 預算超支 15%
  • 數據分析平台: 進度落後 2 週
  • 行動 App: 關鍵資源即將離職

💡 建議行動
  1. 增加 CRM 專案預算或調整範圍
  2. 數據平台增派 2 名開發人員
  3. 開始招募替代資源

📅 本週里程碑
  • 11/18: 電商平台 UAT 開始
  • 11/20: CRM 第二階段交付
  • 11/22: App 設計審查會議
══════════════════════════════════════════════════════════════
    """)

def demo_integrated_pm_workflow():
    """整合專案管理工作流程"""
    print("\n" + "🌟" * 40)
    print("完整專案管理工作流程整合")
    print("🌟" * 40)

    print("""
🔄 端到端專案管理流程:

【情境】啟動並執行一個軟體開發專案

階段 1: 專案啟動 (Gantt Chart)
   ↓ 定義專案目標和範圍
   ↓ 拆分任務和工作包
   ↓ 建立任務依賴關係
   ↓ 計算關鍵路徑
   ↓ 設定里程碑

階段 2: 資源規劃 (Resource Allocator)
   ↓ 識別所需技能
   ↓ 評估團隊能力
   ↓ 分配任務給成員
   ↓ 平衡工作負載
   ↓ 檢測資源衝突

階段 3: Sprint 規劃 (Sprint Manager)
   ↓ 創建 Sprint
   ↓ 選擇 User Stories
   ↓ 估算 Story Points
   ↓ 設定 Sprint 目標
   ↓ 承諾完成範圍

階段 4: 日常執行 (Kanban Board)
   ↓ 任務可視化
   ↓ 工作流程管理
   ↓ 每日站會更新
   ↓ WIP 限制控制
   ↓ 協作與溝通

階段 5: 進度追蹤 (Sprint Manager + Dashboard)
   ↓ 更新燃盡圖
   ↓ 監控 KPI
   ↓ 識別阻礙
   ↓ 調整計劃
   ↓ 風險管理

階段 6: Sprint 回顧
   ↓ 檢視完成情況
   ↓ 計算團隊速度
   ↓ 收集改進建議
   ↓ 更新流程
   ↓ 規劃下一個 Sprint

階段 7: 專案收尾
   ↓ 完成所有任務
   ↓ 交付成果
   ↓ 生成報告
   ↓ 經驗教訓總結
   ↓ 歸檔文檔

💡 工具組合建議:

敏捷團隊:
  Sprint Manager + Kanban Board
  → 適合迭代開發和持續交付

瀑布式專案:
  Gantt Chart + Resource Allocator
  → 適合需要嚴格計劃的大型專案

混合方法:
  全部工具整合使用
  → 適合複雜的企業專案

小型團隊:
  Kanban Board + Dashboard
  → 簡單直觀，快速上手
    """)

def main():
    """主函數"""
    demo_sprint_manager()
    demo_resource_allocator()
    demo_kanban_board()
    demo_gantt_chart()
    demo_project_dashboard()
    demo_integrated_pm_workflow()

    print("\n" + "🎉" * 40)
    print("專案管理系統範例介紹完成！")
    print("🎉" * 40)

    print("""
📚 學習路徑建議:

初學者:
   1. 從 Kanban Board 開始 (視覺化，容易理解)
   2. 嘗試 Sprint Manager (體驗敏捷開發)
   3. 使用 Dashboard 查看整體狀況

中級用戶:
   1. 深入 Gantt Chart (理解專案規劃)
   2. 掌握 Resource Allocator (優化資源)
   3. 整合多個工具協同工作

高級用戶:
   1. 自定義工作流程
   2. 開發整合 API
   3. 建立企業級 PMO 系統

🎯 實踐建議:
   • 選擇適合團隊的方法論 (Scrum/Kanban/混合)
   • 從小規模試點開始
   • 定期回顧和調整流程
   • 培訓團隊成員
   • 持續改進

📖 相關資源:
   • Scrum Guide: https://scrumguides.org/
   • Kanban Method: https://www.kanbanize.com/
   • PMBOK Guide: https://www.pmi.org/
   • Agile Manifesto: https://agilemanifesto.org/

💻 技術棧:
   • Python: 核心邏輯
   • Matplotlib/Plotly: 視覺化
   • SQLite: 數據存儲
   • Streamlit: Web 介面
    """)

if __name__ == '__main__':
    main()
