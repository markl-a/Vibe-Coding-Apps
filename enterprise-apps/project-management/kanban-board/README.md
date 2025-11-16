# 任務看板系統 (Kanban Board)

一個功能完整的任務看板系統，支持拖拽式任務管理、狀態追蹤和團隊協作。

## 功能特點

- ✅ 可視化任務看板（待處理、進行中、審查中、已完成）
- 🔄 任務狀態流轉和歷史記錄
- 👥 團隊成員分配和協作
- 🏷️ 任務標籤和優先級管理
- ⏱️ 工時估算和實際工時追蹤
- 📊 看板統計和分析
- 💾 JSON 數據持久化
- 🔍 任務搜索和篩選

## 快速開始

### 安裝依賴

```bash
pip install -r requirements.txt
```

### 運行應用

```bash
# 命令行界面
python src/main.py

# Web 界面（使用 Streamlit）
streamlit run src/web_app.py
```

## 使用示例

### 基本操作

```python
from kanban_board import KanbanBoard, Task

# 創建看板
board = KanbanBoard("我的專案看板")

# 創建任務
task = Task(
    title="實現用戶登入功能",
    description="使用 JWT 實現安全的用戶認證",
    assignee="張三",
    priority="HIGH",
    estimated_hours=8
)

# 添加任務
board.add_task(task)

# 移動任務狀態
board.move_task(task.id, "IN_PROGRESS")

# 添加評論
board.add_comment(task.id, "已完成 API 設計", "張三")

# 更新實際工時
board.update_actual_hours(task.id, 6.5)

# 完成任務
board.move_task(task.id, "DONE")

# 查看看板統計
stats = board.get_statistics()
print(f"總任務數: {stats['total_tasks']}")
print(f"完成率: {stats['completion_rate']}%")
```

## 數據結構

### 任務 (Task)

```python
{
    "id": "task_001",
    "title": "任務標題",
    "description": "詳細描述",
    "status": "TODO",  # TODO, IN_PROGRESS, IN_REVIEW, DONE
    "priority": "MEDIUM",  # LOW, MEDIUM, HIGH, URGENT
    "assignee": "負責人",
    "tags": ["frontend", "urgent"],
    "estimated_hours": 8,
    "actual_hours": 6.5,
    "created_at": "2025-01-15T10:00:00",
    "updated_at": "2025-01-16T15:30:00",
    "completed_at": "2025-01-16T15:30:00",
    "comments": [
        {
            "author": "張三",
            "content": "已完成",
            "timestamp": "2025-01-16T15:00:00"
        }
    ],
    "history": [
        {
            "field": "status",
            "old_value": "TODO",
            "new_value": "IN_PROGRESS",
            "changed_by": "張三",
            "timestamp": "2025-01-15T10:30:00"
        }
    ]
}
```

## API 參考

### KanbanBoard 類

#### 方法

- `add_task(task: Task) -> str`: 添加新任務
- `move_task(task_id: str, new_status: str) -> bool`: 移動任務狀態
- `update_task(task_id: str, **kwargs) -> bool`: 更新任務資訊
- `delete_task(task_id: str) -> bool`: 刪除任務
- `add_comment(task_id: str, content: str, author: str) -> bool`: 添加評論
- `get_tasks_by_status(status: str) -> List[Task]`: 獲取特定狀態的任務
- `get_tasks_by_assignee(assignee: str) -> List[Task]`: 獲取特定負責人的任務
- `search_tasks(keyword: str) -> List[Task]`: 搜索任務
- `get_statistics() -> dict`: 獲取看板統計數據
- `export_to_json(filepath: str) -> bool`: 導出為 JSON
- `import_from_json(filepath: str) -> bool`: 從 JSON 導入

## Web 界面

使用 Streamlit 提供的 Web 界面功能：

- 📋 拖拽式任務管理
- ➕ 快速創建和編輯任務
- 📊 實時統計圖表
- 🔍 任務搜索和篩選
- 📥 導入/導出功能

## 技術棧

- **Python 3.8+**
- **Streamlit**: Web 界面
- **Pandas**: 數據處理
- **Rich**: 命令行美化輸出

## 擴展功能

可以輕鬆擴展的功能：

1. **集成數據庫**: 替換 JSON 存儲為 SQLite/PostgreSQL
2. **多看板管理**: 支持多個專案看板
3. **任務依賴**: 添加任務間的依賴關係
4. **通知系統**: 任務狀態變更時發送通知
5. **時間追蹤**: 集成工時追蹤功能
6. **報表導出**: 生成 PDF/Excel 報表

## 授權

MIT License
