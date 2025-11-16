# Sprint 管理工具 (Sprint Manager)

一個完整的 Scrum Sprint 管理工具，支持故事點估算、速度追蹤、燃盡圖和回顧會議。

## 功能特點

- 📋 Product Backlog 管理
- 🎯 Sprint 規劃和執行
- 📊 燃盡圖 (Burndown Chart)
- 🚀 速度 (Velocity) 追蹤
- 👥 團隊容量管理
- 📈 累積流量圖 (Cumulative Flow Diagram)
- 🔄 每日站會記錄
- 🎓 Sprint 回顧 (Retrospective)
- 📝 故事點估算
- 💾 數據持久化和報表導出

## 快速開始

### 安裝依賴

```bash
pip install -r requirements.txt
```

### 運行應用

```bash
# 命令行界面
python src/main.py

# Web 界面
streamlit run src/web_app.py
```

## 使用示例

### 基本操作

```python
from sprint_manager import SprintManager, UserStory, Sprint

# 創建 Sprint 管理器
manager = SprintManager("電商平台開發團隊")

# 添加團隊成員
manager.add_team_member("張三", role="開發", capacity_per_sprint=40)
manager.add_team_member("李四", role="開發", capacity_per_sprint=40)
manager.add_team_member("王五", role="測試", capacity_per_sprint=40)

# 創建 User Stories
story1 = UserStory(
    title="作為用戶，我想要能夠註冊帳號",
    description="實現用戶註冊功能",
    story_points=5,
    priority=1
)

story2 = UserStory(
    title="作為用戶，我想要能夠登入",
    description="實現用戶登入功能",
    story_points=3,
    priority=2
)

# 添加到 Product Backlog
manager.add_to_backlog(story1)
manager.add_to_backlog(story2)

# 創建 Sprint
sprint = manager.create_sprint(
    name="Sprint 1",
    goal="實現基本的用戶認證功能",
    duration_weeks=2
)

# 規劃 Sprint（從 Backlog 選擇 Stories）
manager.plan_sprint(sprint.id, [story1.id, story2.id])

# 開始 Sprint
manager.start_sprint(sprint.id)

# 更新 Story 狀態
manager.update_story_status(story1.id, "IN_PROGRESS")
manager.update_story_status(story1.id, "DONE")

# 記錄每日站會
manager.add_daily_standup(
    sprint.id,
    completed_points=5,
    notes="完成用戶註冊功能"
)

# 生成燃盡圖
burndown_data = manager.get_burndown_chart(sprint.id)

# 完成 Sprint
manager.complete_sprint(sprint.id)

# 添加回顧記錄
manager.add_retrospective(
    sprint.id,
    what_went_well=["團隊協作良好", "按時完成任務"],
    what_to_improve=["需要更好的需求澄清", "減少技術債務"],
    action_items=["每週進行代碼審查", "設立需求澄清會議"]
)

# 查看團隊速度
velocity = manager.get_team_velocity()
print(f"團隊平均速度: {velocity} 故事點/Sprint")
```

## 數據結構

### User Story

```python
{
    "id": "story_001",
    "title": "作為用戶，我想要...",
    "description": "詳細描述",
    "story_points": 5,
    "priority": 1,
    "status": "TODO",  # TODO, IN_PROGRESS, IN_REVIEW, DONE
    "assignee": "張三",
    "sprint_id": "sprint_001",
    "acceptance_criteria": [
        "標準1",
        "標準2"
    ],
    "tags": ["backend", "authentication"],
    "created_at": "2025-01-15T10:00:00",
    "completed_at": "2025-01-20T15:00:00"
}
```

### Sprint

```python
{
    "id": "sprint_001",
    "name": "Sprint 1",
    "goal": "Sprint 目標",
    "status": "PLANNED",  # PLANNED, ACTIVE, COMPLETED
    "start_date": "2025-01-15",
    "end_date": "2025-01-28",
    "duration_weeks": 2,
    "committed_points": 34,
    "completed_points": 30,
    "team_capacity": 120,
    "stories": [...],
    "daily_standups": [...],
    "retrospective": {...},
    "velocity": 30
}
```

## API 參考

### SprintManager 類

#### 團隊管理

- `add_team_member(name, role, capacity_per_sprint)`: 添加團隊成員
- `remove_team_member(member_id)`: 移除團隊成員
- `get_team_capacity()`: 獲取團隊總容量

#### Backlog 管理

- `add_to_backlog(story)`: 添加到 Product Backlog
- `prioritize_backlog()`: 重新排序 Backlog
- `estimate_story(story_id, story_points)`: 估算故事點

#### Sprint 管理

- `create_sprint(name, goal, duration_weeks)`: 創建 Sprint
- `plan_sprint(sprint_id, story_ids)`: 規劃 Sprint
- `start_sprint(sprint_id)`: 開始 Sprint
- `complete_sprint(sprint_id)`: 完成 Sprint
- `update_story_status(story_id, new_status)`: 更新 Story 狀態

#### 每日站會

- `add_daily_standup(sprint_id, completed_points, notes)`: 記錄站會
- `get_daily_standups(sprint_id)`: 獲取站會記錄

#### 報表和分析

- `get_burndown_chart(sprint_id)`: 獲取燃盡圖數據
- `get_velocity_chart()`: 獲取速度圖
- `get_cumulative_flow()`: 獲取累積流量圖
- `get_team_velocity(last_n_sprints=3)`: 獲取團隊速度
- `get_sprint_metrics(sprint_id)`: 獲取 Sprint 指標

#### 回顧

- `add_retrospective(sprint_id, what_went_well, what_to_improve, action_items)`: 添加回顧記錄

## Web 界面特性

- 📊 互動式燃盡圖和速度圖表
- 🎯 拖拽式 Sprint 規劃
- 📋 Product Backlog 優先級管理
- 👥 團隊成員和容量管理
- 📈 Sprint 進度追蹤
- 🔄 每日站會記錄
- 🎓 Sprint 回顧管理
- 💾 數據導入/導出

## Scrum 最佳實踐

### Sprint 規劃

1. 根據團隊容量選擇 User Stories
2. 確保 Sprint Goal 清晰明確
3. 每個 Story 都有明確的驗收標準
4. 團隊共同承諾 Sprint Backlog

### 每日站會

1. 昨天完成了什麼？
2. 今天計劃做什麼？
3. 遇到什麼障礙？

### Sprint 回顧

1. What went well? （做得好的）
2. What could be improved? （可以改進的）
3. Action items （行動項目）

## 技術棧

- **Python 3.8+**
- **Streamlit**: Web 界面
- **Plotly**: 圖表繪製
- **Pandas**: 數據分析
- **Rich**: 命令行美化

## 使用場景

- 敏捷軟體開發團隊
- Scrum Master 管理 Sprint
- 產品經理規劃 Backlog
- 開發團隊追蹤進度
- 團隊回顧和改進

## 擴展功能

1. **整合 Jira/GitHub**: 同步 Issues 和 PRs
2. **自動化報告**: 定期發送 Sprint 報告
3. **預測分析**: 使用機器學習預測 Sprint 完成率
4. **多團隊支持**: 管理多個 Scrum 團隊
5. **績效分析**: 團隊成員績效追蹤

## 授權

MIT License
