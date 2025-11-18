# 快速開始指南

## 🚀 10 分鐘快速體驗專案管理系統

### 方法 1: 使用 Docker（推薦）

#### 前置需求
- Docker
- Docker Compose

#### 啟動步驟

```bash
# 1. 進入專案目錄
cd enterprise-apps/project-management

# 2. 一鍵啟動
./docker-run.sh

# 或使用 docker-compose
docker-compose up -d
```

#### 訪問應用

- **Sprint Manager**: http://localhost:8501
  - 管理 Sprint、User Stories
  - AI 任務估時
  - 燃盡圖和速度追蹤

- **Kanban Board**: http://localhost:8502
  - 可視化任務流程
  - 拖拽式任務管理
  - AI 優先級建議

- **Gantt Chart**: http://localhost:8503
  - 時間軸視圖
  - 依賴關係管理
  - 關鍵路徑分析

- **Dashboard**: http://localhost:8504
  - 綜合儀表板
  - 多專案概覽
  - AI 風險預測

### 方法 2: 本地運行

#### 前置需求
- Python 3.8+
- pip

#### 安裝步驟

```bash
# 1. 進入專案目錄
cd enterprise-apps/project-management

# 2. 安裝依賴
pip install -r ai-assistant/requirements.txt
pip install -r sprint-manager/requirements.txt
pip install -r kanban-board/requirements.txt
pip install -r gantt-chart/requirements.txt
pip install -r project-dashboard/requirements.txt

# 3. 運行示例
# 整合示例
python integrated_example.py

# AI 增強 Sprint Manager
python sprint-manager/src/example_ai_sprint.py

# AI 助手功能示例
python ai-assistant/src/example_usage.py
```

#### 啟動 Web 界面

```bash
# Sprint Manager
streamlit run sprint-manager/src/web_app.py --server.port=8501

# Kanban Board
streamlit run kanban-board/src/web_app.py --server.port=8502

# Gantt Chart
streamlit run gantt-chart/src/web_app.py --server.port=8503

# Dashboard
streamlit run project-dashboard/src/dashboard.py --server.port=8504
```

## 🎯 基本使用流程

### 1. 設置團隊

```python
from ai_enhanced_sprint_manager import AIEnhancedSprintManager

manager = AIEnhancedSprintManager("我的團隊")

# 添加團隊成員
manager.add_team_member("Alice", "Senior Developer", 40)
manager.add_team_member("Bob", "Developer", 40)
```

### 2. 創建 Product Backlog

```python
# 使用 AI 估算並添加故事
story, estimation = manager.add_story_with_ai_estimation(
    title="作為用戶，我想要能夠註冊帳號",
    description="實現完整的用戶註冊功能",
    complexity="MEDIUM",
    priority="HIGH",
    tags=['backend', 'authentication']
)

print(f"AI 估時: {estimation['estimated_hours']} 小時")
print(f"故事點: {story.story_points}")
```

### 3. 規劃 Sprint

```python
# 創建 Sprint
sprint = manager.create_sprint(
    name="Sprint 1",
    goal="實現用戶認證功能",
    duration_weeks=2
)

# 使用 AI 自動規劃
plan = manager.plan_sprint_with_ai(sprint.id)
print(f"承諾: {plan['total_story_points']} 故事點")
print(f"利用率: {plan['utilization']}%")
```

### 4. 執行 Sprint

```python
# 開始 Sprint
manager.start_sprint(sprint.id)

# 更新任務狀態
manager.update_story_status(story.id, "IN_PROGRESS")
manager.update_story_status(story.id, "DONE")

# 記錄每日站會
manager.add_daily_standup(
    sprint.id,
    completed_points=5,
    notes="完成用戶註冊功能"
)
```

### 5. 查看 AI 洞察

```python
# 獲取 AI 洞察和建議
insights = manager.get_ai_insights(sprint.id)

print(f"估算準確率: {insights['estimation_accuracy']['accuracy']}%")

# 獲取優先級建議
suggestions = manager.get_story_priority_suggestions()
for s in suggestions:
    print(f"{s['title']}: {s['current_priority']} → {s['suggested_priority']}")
```

## 📚 進階功能

### AI 風險預測

```python
from ai_assistant import AIRiskPredictor

predictor = AIRiskPredictor()
risk_report = predictor.predict_project_risk(
    project_data=project_info,
    tasks=task_list,
    team_members=team
)

print(f"風險等級: {risk_report['overall_risk_level']}")
```

### AI 資源優化

```python
from ai_assistant import AIResourceOptimizer

optimizer = AIResourceOptimizer()
allocation = optimizer.optimize_resource_allocation(
    tasks=tasks,
    resources=available_resources
)

print(f"平均利用率: {allocation['metrics']['average_utilization']}%")
```

### 整合使用

```python
from integrated_example import IntegratedProjectManagement

# 創建整合系統
pm = IntegratedProjectManagement("專案名稱", "團隊名稱")

# 設置團隊
pm.setup_team(team_members)

# 創建 Backlog
pm.create_project_backlog(user_stories)

# 規劃 Sprint
sprint, plan = pm.plan_sprint("Sprint 1", "目標", 2)

# 分配資源
pm.allocate_resources(sprint.id)

# 風險評估
pm.assess_project_risk(sprint.id)

# 查看儀表板
pm.get_comprehensive_dashboard(sprint.id)
```

## 🔧 常見問題

### Q: 如何提高 AI 估算準確性？

A: 定期更新實際工時：

```python
manager.update_story_with_actual_hours(story_id, actual_hours)
```

AI 會從歷史數據中學習，提高未來估算的準確性。

### Q: 如何自定義 AI 估時模型？

A: 繼承 AITaskEstimator 並重寫方法：

```python
from ai_assistant import AITaskEstimator

class CustomEstimator(AITaskEstimator):
    def __init__(self):
        super().__init__()
        # 自定義估時矩陣
        self.base_estimates = {
            'LOW': {...},
            'MEDIUM': {...},
            'HIGH': {...}
        }
```

### Q: Docker 容器無法啟動？

A: 檢查端口占用：

```bash
# 查看端口占用
netstat -tulpn | grep 850

# 修改 docker-compose.yml 中的端口映射
ports:
  - "8601:8501"  # 使用其他端口
```

## 📖 相關文檔

- [AI 助手模組](ai-assistant/README.md)
- [Sprint Manager](sprint-manager/README.md)
- [Kanban Board](kanban-board/README.md)
- [Gantt Chart](gantt-chart/README.md)
- [Resource Allocator](resource-allocator/README.md)
- [Project Dashboard](project-dashboard/README.md)

## 💡 最佳實踐

1. **定期更新實際數據**
   - 每個 Sprint 結束後更新實際工時
   - 記錄準確的完成時間
   - 收集團隊反饋

2. **充分利用 AI 建議**
   - 每週運行風險評估
   - 根據優先級建議調整 Backlog
   - 使用 AI 規劃優化 Sprint 容量

3. **保持 Backlog 健康**
   - 確保所有故事都有估算
   - 設置合理的優先級
   - 添加詳細的描述和標籤

4. **持續改進**
   - 定期審查 AI 洞察報告
   - 調整估時策略
   - 優化團隊工作流程

## 🆘 獲取幫助

- 查看完整文檔: [README.md](README.md)
- 運行示例代碼學習使用方法
- 查看各模組的詳細 README

## 🎉 開始使用

現在你已經了解了基本使用方法，可以開始體驗專案管理系統了！

```bash
# 啟動整合示例
python integrated_example.py

# 或啟動 Web 界面
./docker-run.sh
```

祝你使用愉快！ 🚀
