# AI 助手整合模組 (AI Assistant)

為專案管理系統提供全方位的 AI 輔助功能，包括任務估時、風險預測、資源優化、優先級建議和 Sprint 規劃。

## 🎯 功能特點

### 1. AI 任務估時 (AITaskEstimator)
- 📊 智能預測任務工時
- 🎯 基於多因子分析（複雜度、優先級、經驗等）
- 📈 提供信心度和範圍估計
- 🔍 尋找相似歷史任務
- 💡 生成估時建議

### 2. AI 風險預測 (AIRiskPredictor)
- ⚠️ 多維度風險分析
  - 進度風險
  - 資源風險
  - 範圍風險
  - 團隊風險
- 📊 整體風險評分和等級
- 🎯 識別具體風險問題
- 💡 提供應對建議
- 📈 預測專案結果

### 3. AI 資源優化 (AIResourceOptimizer)
- 👥 智能資源分配
- 🎯 技能匹配優化
- ⚖️ 工作負載平衡
- 🔍 衝突檢測
- 📊 利用率分析
- 💡 優化建議

### 4. AI 優先級建議 (AIPriorityAdvisor)
- 🎯 智能優先級評估
- ⏰ 基於截止日期
- 🔗 考慮依賴關係
- 💼 業務價值分析
- 📊 優先級分數計算
- 💡 調整建議

### 5. AI Sprint 規劃 (AISprintPlanner)
- 📋 自動 Sprint Backlog 選擇
- 📊 基於團隊速度和容量
- 🎯 優先級智能排序
- ⚠️ 風險識別
- 💡 規劃建議
- 📈 容量利用分析

## 🚀 快速開始

### 安裝依賴

```bash
pip install -r requirements.txt
```

### 基本使用

```python
from ai_assistant import (
    AITaskEstimator,
    AIRiskPredictor,
    AIResourceOptimizer,
    AIPriorityAdvisor,
    AISprintPlanner
)

# 1. 任務估時
estimator = AITaskEstimator()
result = estimator.estimate_task(
    title="實現用戶認證 API",
    description="包括註冊、登入、JWT 管理等功能",
    complexity="HIGH",
    priority="HIGH",
    assignee_experience="MEDIUM",
    tags=['backend', 'security']
)

print(f"預估工時: {result['estimated_hours']} 小時")
print(f"信心度: {result['confidence']} %")

# 2. 風險預測
predictor = AIRiskPredictor()
risk_report = predictor.predict_project_risk(
    project_data=project_info,
    tasks=task_list,
    team_members=team_list
)

print(f"風險等級: {risk_report['overall_risk_level']}")
print(f"風險分數: {risk_report['overall_risk_score']}")

# 3. 資源優化
optimizer = AIResourceOptimizer()
allocation = optimizer.optimize_resource_allocation(
    tasks=tasks,
    resources=available_resources,
    constraints={'max_utilization': 0.9}
)

print(f"已分配: {len(allocation['allocations'])} 個任務")
print(f"平均利用率: {allocation['metrics']['average_utilization']}%")

# 4. 優先級建議
advisor = AIPriorityAdvisor()
priority = advisor.suggest_task_priority(
    task=task_data,
    project_context=context,
    related_tasks=related
)

print(f"建議優先級: {priority['suggested_priority']}")
print(f"當前優先級: {priority['current_priority']}")

# 5. Sprint 規劃
planner = AISprintPlanner()
sprint_plan = planner.suggest_sprint_plan(
    backlog=product_backlog,
    team_capacity=120,
    team_velocity=25
)

print(f"建議承諾: {sprint_plan['total_story_points']} 故事點")
print(f"利用率: {sprint_plan['utilization']}%")
```

## 📚 詳細示例

### 任務估時示例

```python
from ai_assistant import AITaskEstimator

estimator = AITaskEstimator()

# 添加歷史數據以提高準確性
estimator.add_historical_data({
    'title': '用戶登入功能',
    'tags': ['backend', 'authentication'],
    'estimated_hours': 8,
    'actual_hours': 12
})

# 估算新任務
result = estimator.estimate_task(
    title="實現 OAuth2 整合",
    description="支持 Google 和 Facebook 登入",
    complexity="MEDIUM",
    priority="HIGH",
    assignee_experience="JUNIOR",
    tags=['backend', 'oauth', 'authentication']
)

# 輸出結果
print(f"""
估時結果:
  預估工時: {result['estimated_hours']} 小時
  範圍: {result['range']['min']} - {result['range']['max']} 小時
  信心度: {result['confidence'] * 100}%

影響因子:
  基礎工時: {result['factors']['base_hours']}h
  描述因子: {result['factors']['description_factor']}
  經驗因子: {result['factors']['experience_factor']}
  標籤因子: {result['factors']['tag_factor']}

建議:
""")

for rec in result['recommendations']:
    print(f"  - {rec}")

if result['similar_tasks']:
    print("\n相似任務:")
    for task in result['similar_tasks']:
        print(f"  - {task['title']}: {task['actual_hours']}h (相似度: {task['similarity']})")
```

### 風險預測示例

```python
from ai_assistant import AIRiskPredictor
from datetime import datetime, timedelta

predictor = AIRiskPredictor()

# 準備專案數據
project_data = {
    'id': 'proj_001',
    'name': '電商平台開發',
    'start_date': (datetime.now() - timedelta(days=60)).isoformat(),
    'end_date': (datetime.now() + timedelta(days=14)).isoformat(),
    'progress': 75
}

tasks = [
    {'id': 't1', 'title': '前端開發', 'status': 'DONE', 'priority': 'HIGH', 'estimated_hours': 80, 'assignee': 'Alice'},
    {'id': 't2', 'title': '後端開發', 'status': 'IN_PROGRESS', 'priority': 'HIGH', 'estimated_hours': 120, 'assignee': 'Alice'},
    {'id': 't3', 'title': '測試', 'status': 'TODO', 'priority': 'URGENT', 'estimated_hours': 60, 'assignee': None},
    {'id': 't4', 'title': '部署', 'status': 'TODO', 'priority': 'URGENT', 'estimated_hours': 40, 'assignee': None},
]

team_members = [
    {'id': 'm1', 'name': 'Alice', 'skills': ['React', 'Python']},
    {'id': 'm2', 'name': 'Bob', 'skills': ['Testing']},
]

# 執行風險分析
report = predictor.predict_project_risk(
    project_data=project_data,
    tasks=tasks,
    team_members=team_members
)

# 輸出報告
print(f"""
專案風險評估報告
{'=' * 60}

專案: {project_data['name']}
進度: {project_data['progress']}%

整體風險:
  等級: {report['overall_risk_level']}
  分數: {report['overall_risk_score']}/100

風險詳情:
""")

for risk in report['risks']:
    print(f"""
  {risk['name']} ({risk['category']})
    等級: {risk['level']}
    分數: {risk['score']}/100
""")
    if risk['issues']:
        print("    問題:")
        for issue in risk['issues']:
            print(f"      - {issue}")

print("\n建議措施:")
for i, rec in enumerate(report['recommendations'], 1):
    print(f"  {i}. {rec}")

forecast = report['forecast']
print(f"""
專案預測:
  成功概率: {forecast['success_probability']}%
  預期結果: {forecast['likely_outcome']}
""")

if 'estimated_delay_days' in forecast:
    print(f"  預計延遲: {forecast['estimated_delay_days']} 天")
```

### 資源優化示例

```python
from ai_assistant import AIResourceOptimizer

optimizer = AIResourceOptimizer()

tasks = [
    {
        'id': 't1',
        'title': '前端開發',
        'estimated_hours': 40,
        'priority': 'HIGH',
        'tags': ['React', 'Frontend'],
        'complexity': 'MEDIUM'
    },
    {
        'id': 't2',
        'title': '後端 API',
        'estimated_hours': 60,
        'priority': 'HIGH',
        'tags': ['Python', 'Backend'],
        'complexity': 'HIGH'
    },
    # ... 更多任務
]

resources = [
    {
        'id': 'r1',
        'name': 'Alice',
        'skills': ['React', 'Python', 'Frontend'],
        'experience_level': 'SENIOR'
    },
    {
        'id': 'r2',
        'name': 'Bob',
        'skills': ['Python', 'Backend', 'SQL'],
        'experience_level': 'SENIOR'
    },
    # ... 更多資源
]

# 執行優化
result = optimizer.optimize_resource_allocation(
    tasks=tasks,
    resources=resources,
    constraints={
        'max_hours_per_day': 8,
        'max_utilization': 0.9,
        'skill_matching': True
    }
)

# 輸出結果
print(f"""
資源分配優化結果
{'=' * 60}

指標:
  已分配任務: {result['metrics']['total_tasks_allocated']}
  平均利用率: {result['metrics']['average_utilization']}%
  平均匹配度: {result['metrics']['average_match_score']}

分配詳情:
""")

for allocation in result['allocations']:
    print(f"""
  {allocation['resource_name']}:
    任務: {allocation['task_title']}
    工時: {allocation['estimated_hours']}h
    匹配度: {allocation['match_score']:.2%}
""")

if result['unallocated_tasks']:
    print(f"\n未分配任務 ({len(result['unallocated_tasks'])}):")
    for task in result['unallocated_tasks']:
        print(f"  - {task['title']}")

if result['conflicts']:
    print(f"\n資源衝突 ({len(result['conflicts'])}):")
    for conflict in result['conflicts']:
        print(f"  - {conflict['type']}: {conflict}")

print("\n建議:")
for rec in result['recommendations']:
    print(f"  - {rec}")
```

## 🔧 進階功能

### 自定義估時模型

```python
from ai_assistant import AITaskEstimator

class CustomTaskEstimator(AITaskEstimator):
    def __init__(self):
        super().__init__()
        # 自定義估時矩陣
        self.base_estimates = {
            'LOW': {'LOW': 1, 'MEDIUM': 2, 'HIGH': 4, 'URGENT': 6},
            'MEDIUM': {'LOW': 3, 'MEDIUM': 6, 'HIGH': 10, 'URGENT': 14},
            'HIGH': {'LOW': 6, 'MEDIUM': 12, 'HIGH': 20, 'URGENT': 28},
        }

    def _calculate_confidence(self, title, description, complexity, priority, assignee_experience):
        # 自定義信心度計算
        confidence = super()._calculate_confidence(
            title, description, complexity, priority, assignee_experience
        )

        # 根據歷史數據調整
        if len(self.historical_data) > 20:
            confidence += 0.1

        return min(confidence, 1.0)

estimator = CustomTaskEstimator()
```

### 整合到專案管理系統

```python
from sprint_manager import SprintManager
from ai_assistant import AITaskEstimator, AISprintPlanner

# 創建 Sprint 管理器
manager = SprintManager("開發團隊")

# 添加 AI 輔助
estimator = AITaskEstimator()
planner = AISprintPlanner()

# 使用 AI 估算任務
def add_story_with_ai_estimation(title, description, complexity, priority):
    # AI 估時
    estimation = estimator.estimate_task(
        title=title,
        description=description,
        complexity=complexity,
        priority=priority,
        assignee_experience='MEDIUM'
    )

    # 轉換為故事點（假設 8 小時 = 1 故事點）
    story_points = round(estimation['estimated_hours'] / 8)

    # 創建 User Story
    story = UserStory(
        title=title,
        description=description,
        story_points=story_points,
        priority=priority
    )

    manager.add_to_backlog(story)
    return story, estimation

# 使用 AI 規劃 Sprint
def plan_sprint_with_ai(sprint_id):
    # 獲取 Backlog
    backlog = [story.to_dict() for story in manager.prioritize_backlog()]

    # 使用 AI 規劃
    plan = planner.suggest_sprint_plan(
        backlog=backlog,
        team_capacity=manager.get_team_capacity(),
        team_velocity=manager.get_team_velocity()
    )

    # 應用建議
    suggested_story_ids = [item['id'] for item in plan['suggested_items']]
    manager.plan_sprint(sprint_id, suggested_story_ids)

    return plan
```

## 📊 性能和準確性

### 提高 AI 準確性的建議

1. **收集歷史數據**
   ```python
   # 定期添加完成任務的實際數據
   estimator.add_historical_data({
       'title': '...',
       'tags': [...],
       'estimated_hours': 8,
       'actual_hours': 10,
       'complexity': 'MEDIUM'
   })
   ```

2. **定期評估和調整**
   ```python
   # 比較預測和實際結果
   predictions = []
   actuals = []

   for task in completed_tasks:
       prediction = estimator.estimate_task(...)
       predictions.append(prediction['estimated_hours'])
       actuals.append(task['actual_hours'])

   # 計算準確率
   accuracy = calculate_accuracy(predictions, actuals)
   ```

3. **團隊特定調整**
   - 根據團隊特點調整因子
   - 考慮團隊文化和工作方式
   - 定期回顧和校準

## 🔗 整合其他模組

AI 助手可以整合到所有專案管理模組中：

- **Sprint Manager**: 任務估時、Sprint 規劃
- **Kanban Board**: 優先級建議
- **Resource Allocator**: 資源優化
- **Gantt Chart**: 時程優化
- **Project Dashboard**: 風險預測、進度預測

## 🛠️ 技術棧

- **Python 3.8+**
- **核心算法**:
  - 多因子分析
  - 啟發式優化
  - 風險評分模型
  - 相似度匹配

## 📈 未來增強

- [ ] 機器學習模型整合
- [ ] 自然語言處理（NLP）分析任務描述
- [ ] 深度學習預測模型
- [ ] 更複雜的優化算法（遺傳算法、模擬退火）
- [ ] 實時風險監控
- [ ] 團隊績效分析

## 📝 許可證

MIT License
