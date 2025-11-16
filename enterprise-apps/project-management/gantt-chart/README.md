# 甘特圖時程管理工具 (Gantt Chart Tool)

一個功能強大的甘特圖時程管理工具，支持專案時程規劃、關鍵路徑分析和進度追蹤。

## 功能特點

- 📊 可視化甘特圖展示
- 🔗 任務依賴關係管理（FS, SS, FF, SF）
- 🎯 關鍵路徑自動計算
- ⏱️ 浮動時間（Float/Slack）分析
- 📈 進度追蹤和實時更新
- 👥 資源分配和工作量管理
- 🔄 拖拽調整任務時間
- 📅 里程碑管理
- 💾 多種格式導出（JSON, CSV, Excel）

## 快速開始

### 安裝依賴

```bash
pip install -r requirements.txt
```

### 運行應用

```bash
# 命令行界面
python src/main.py

# Web 界面（使用 Plotly）
python src/web_app.py
```

## 使用示例

### 基本操作

```python
from gantt_chart import GanttChart, GanttTask, TaskDependency

# 創建甘特圖
gantt = GanttChart("網站開發專案", start_date="2025-01-15")

# 添加任務
task1 = gantt.add_task(
    name="需求分析",
    duration=5,  # 天數
    assignee="產品經理"
)

task2 = gantt.add_task(
    name="UI 設計",
    duration=7,
    assignee="設計師"
)

task3 = gantt.add_task(
    name="前端開發",
    duration=10,
    assignee="前端工程師"
)

task4 = gantt.add_task(
    name="後端開發",
    duration=12,
    assignee="後端工程師"
)

# 添加依賴關係
gantt.add_dependency(task1, task2, dep_type="FS")  # Finish-to-Start
gantt.add_dependency(task2, task3, dep_type="FS")
gantt.add_dependency(task1, task4, dep_type="FS")

# 添加里程碑
gantt.add_milestone("設計完成", task2)

# 計算關鍵路徑
critical_path = gantt.calculate_critical_path()
print(f"關鍵路徑: {[task.name for task in critical_path]}")
print(f"專案總工期: {gantt.get_project_duration()} 天")

# 更新進度
gantt.update_progress(task1, 80)  # 80% 完成

# 生成圖表
gantt.plot()  # 顯示甘特圖

# 導出
gantt.export_to_excel("project_timeline.xlsx")
```

## 數據結構

### 任務 (GanttTask)

```python
{
    "id": "task_001",
    "name": "任務名稱",
    "duration": 5,  # 工期（天）
    "start_date": "2025-01-15",
    "end_date": "2025-01-19",
    "progress": 50,  # 完成百分比
    "assignee": "負責人",
    "dependencies": [
        {
            "predecessor_id": "task_000",
            "type": "FS",  # FS, SS, FF, SF
            "lag": 0  # 延遲天數
        }
    ],
    "is_milestone": false,
    "is_critical": true,  # 是否在關鍵路徑上
    "early_start": "2025-01-15",
    "early_finish": "2025-01-19",
    "late_start": "2025-01-15",
    "late_finish": "2025-01-19",
    "total_float": 0  # 浮動時間
}
```

### 依賴類型

- **FS (Finish-to-Start)**: 前置任務完成後，後續任務才能開始（最常見）
- **SS (Start-to-Start)**: 前置任務開始時，後續任務可以開始
- **FF (Finish-to-Finish)**: 前置任務完成時，後續任務也完成
- **SF (Start-to-Finish)**: 前置任務開始後，後續任務才能完成（較少使用）

## API 參考

### GanttChart 類

#### 方法

- `add_task(name, duration, start_date=None, assignee="", **kwargs) -> GanttTask`: 添加任務
- `add_dependency(predecessor, successor, dep_type="FS", lag=0) -> bool`: 添加依賴
- `add_milestone(name, task) -> str`: 添加里程碑
- `update_progress(task_id, progress) -> bool`: 更新進度
- `reschedule_task(task_id, new_start_date) -> bool`: 重新安排任務
- `calculate_critical_path() -> List[GanttTask]`: 計算關鍵路徑
- `get_project_duration() -> int`: 獲取專案總工期
- `get_schedule_variance() -> float`: 獲取進度偏差
- `plot(show_critical=True) -> Figure`: 生成甘特圖
- `export_to_json(filepath) -> bool`: 導出為 JSON
- `export_to_excel(filepath) -> bool`: 導出為 Excel
- `export_to_csv(filepath) -> bool`: 導出為 CSV

## Web 界面特性

使用 Plotly 和 Dash 提供的互動式 Web 界面：

- 📊 互動式甘特圖
- 🎨 關鍵路徑高亮顯示
- 📅 日期拖拽調整
- 🔍 任務詳情查看
- 📈 進度追蹤儀表板
- 🎯 里程碑標記
- 💾 多格式導出

## 關鍵路徑方法 (CPM)

本工具實現了完整的關鍵路徑法 (Critical Path Method)：

1. **前推法 (Forward Pass)**: 計算最早開始和最早完成時間
2. **後推法 (Backward Pass)**: 計算最晚開始和最晚完成時間
3. **浮動時間計算**: Total Float = Late Start - Early Start
4. **關鍵路徑識別**: Total Float = 0 的任務

## 使用場景

- 軟體開發專案規劃
- 建築工程時程管理
- 活動策劃與執行
- 產品研發流程
- 多專案資源協調

## 技術棧

- **Python 3.8+**
- **Plotly**: 互動式圖表
- **Pandas**: 數據處理
- **NetworkX**: 圖論算法（關鍵路徑計算）
- **openpyxl**: Excel 導出

## 擴展功能

可以輕鬆擴展的功能：

1. **資源均衡**: 自動調整任務以平衡資源使用
2. **成本管理**: 整合成本追蹤功能
3. **基線對比**: 對比計劃與實際執行
4. **What-If 分析**: 模擬不同情境的影響
5. **多專案管理**: 支持多專案時程協調
6. **自動排程**: 使用啟發式算法優化排程

## 授權

MIT License
