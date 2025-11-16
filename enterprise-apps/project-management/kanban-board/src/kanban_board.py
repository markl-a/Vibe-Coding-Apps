"""
任務看板系統核心模組
提供完整的看板管理功能
"""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional
from enum import Enum


class TaskStatus(Enum):
    """任務狀態枚舉"""
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    IN_REVIEW = "IN_REVIEW"
    DONE = "DONE"


class TaskPriority(Enum):
    """任務優先級枚舉"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class Task:
    """任務類"""

    def __init__(
        self,
        title: str,
        description: str = "",
        assignee: str = "",
        priority: str = "MEDIUM",
        estimated_hours: float = 0,
        tags: List[str] = None,
        task_id: str = None
    ):
        self.id = task_id or f"task_{uuid.uuid4().hex[:8]}"
        self.title = title
        self.description = description
        self.status = TaskStatus.TODO.value
        self.priority = priority
        self.assignee = assignee
        self.tags = tags or []
        self.estimated_hours = estimated_hours
        self.actual_hours = 0
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()
        self.completed_at = None
        self.comments = []
        self.history = []

    def to_dict(self) -> dict:
        """轉換為字典"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "assignee": self.assignee,
            "tags": self.tags,
            "estimated_hours": self.estimated_hours,
            "actual_hours": self.actual_hours,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "completed_at": self.completed_at,
            "comments": self.comments,
            "history": self.history
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Task':
        """從字典創建任務"""
        task = cls(
            title=data["title"],
            description=data.get("description", ""),
            assignee=data.get("assignee", ""),
            priority=data.get("priority", "MEDIUM"),
            estimated_hours=data.get("estimated_hours", 0),
            tags=data.get("tags", []),
            task_id=data.get("id")
        )
        task.status = data.get("status", TaskStatus.TODO.value)
        task.actual_hours = data.get("actual_hours", 0)
        task.created_at = data.get("created_at", task.created_at)
        task.updated_at = data.get("updated_at", task.updated_at)
        task.completed_at = data.get("completed_at")
        task.comments = data.get("comments", [])
        task.history = data.get("history", [])
        return task


class KanbanBoard:
    """看板類"""

    def __init__(self, name: str = "Kanban Board"):
        self.name = name
        self.tasks: Dict[str, Task] = {}
        self.created_at = datetime.now().isoformat()

    def add_task(self, task: Task) -> str:
        """添加任務"""
        self.tasks[task.id] = task
        self._add_history(task.id, "created", None, "Task created")
        return task.id

    def move_task(self, task_id: str, new_status: str) -> bool:
        """移動任務狀態"""
        if task_id not in self.tasks:
            return False

        task = self.tasks[task_id]
        old_status = task.status

        # 驗證狀態
        try:
            TaskStatus(new_status)
        except ValueError:
            return False

        task.status = new_status
        task.updated_at = datetime.now().isoformat()

        # 如果移動到 DONE，記錄完成時間
        if new_status == TaskStatus.DONE.value:
            task.completed_at = datetime.now().isoformat()

        # 記錄歷史
        self._add_history(task_id, "status", old_status, new_status)

        return True

    def update_task(self, task_id: str, **kwargs) -> bool:
        """更新任務"""
        if task_id not in self.tasks:
            return False

        task = self.tasks[task_id]

        for key, value in kwargs.items():
            if hasattr(task, key):
                old_value = getattr(task, key)
                setattr(task, key, value)
                self._add_history(task_id, key, old_value, value)

        task.updated_at = datetime.now().isoformat()
        return True

    def delete_task(self, task_id: str) -> bool:
        """刪除任務"""
        if task_id in self.tasks:
            del self.tasks[task_id]
            return True
        return False

    def add_comment(self, task_id: str, content: str, author: str) -> bool:
        """添加評論"""
        if task_id not in self.tasks:
            return False

        comment = {
            "author": author,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }

        self.tasks[task_id].comments.append(comment)
        self.tasks[task_id].updated_at = datetime.now().isoformat()
        return True

    def update_actual_hours(self, task_id: str, hours: float) -> bool:
        """更新實際工時"""
        return self.update_task(task_id, actual_hours=hours)

    def get_tasks_by_status(self, status: str) -> List[Task]:
        """獲取特定狀態的任務"""
        return [task for task in self.tasks.values() if task.status == status]

    def get_tasks_by_assignee(self, assignee: str) -> List[Task]:
        """獲取特定負責人的任務"""
        return [task for task in self.tasks.values() if task.assignee == assignee]

    def search_tasks(self, keyword: str) -> List[Task]:
        """搜索任務"""
        keyword = keyword.lower()
        results = []

        for task in self.tasks.values():
            if (keyword in task.title.lower() or
                keyword in task.description.lower() or
                keyword in task.assignee.lower() or
                any(keyword in tag.lower() for tag in task.tags)):
                results.append(task)

        return results

    def get_statistics(self) -> dict:
        """獲取看板統計"""
        total_tasks = len(self.tasks)

        if total_tasks == 0:
            return {
                "total_tasks": 0,
                "completion_rate": 0,
                "status_distribution": {},
                "priority_distribution": {},
                "average_completion_time": 0,
                "total_estimated_hours": 0,
                "total_actual_hours": 0
            }

        # 狀態分布
        status_dist = {}
        for status in TaskStatus:
            count = len(self.get_tasks_by_status(status.value))
            status_dist[status.value] = count

        # 優先級分布
        priority_dist = {}
        for priority in TaskPriority:
            count = len([t for t in self.tasks.values() if t.priority == priority.value])
            priority_dist[priority.value] = count

        # 完成率
        done_tasks = len(self.get_tasks_by_status(TaskStatus.DONE.value))
        completion_rate = (done_tasks / total_tasks) * 100

        # 工時統計
        total_estimated = sum(t.estimated_hours for t in self.tasks.values())
        total_actual = sum(t.actual_hours for t in self.tasks.values())

        # 平均完成時間（已完成任務）
        completed_tasks = [t for t in self.tasks.values() if t.completed_at]
        avg_completion_time = 0
        if completed_tasks:
            completion_times = []
            for task in completed_tasks:
                created = datetime.fromisoformat(task.created_at)
                completed = datetime.fromisoformat(task.completed_at)
                duration = (completed - created).total_seconds() / 3600  # 小時
                completion_times.append(duration)
            avg_completion_time = sum(completion_times) / len(completion_times)

        return {
            "total_tasks": total_tasks,
            "completion_rate": round(completion_rate, 2),
            "status_distribution": status_dist,
            "priority_distribution": priority_dist,
            "average_completion_time": round(avg_completion_time, 2),
            "total_estimated_hours": round(total_estimated, 2),
            "total_actual_hours": round(total_actual, 2),
            "efficiency": round((total_estimated / total_actual * 100) if total_actual > 0 else 0, 2)
        }

    def export_to_json(self, filepath: str) -> bool:
        """導出為 JSON"""
        try:
            data = {
                "name": self.name,
                "created_at": self.created_at,
                "tasks": [task.to_dict() for task in self.tasks.values()]
            }

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            return True
        except Exception as e:
            print(f"導出失敗: {e}")
            return False

    def import_from_json(self, filepath: str) -> bool:
        """從 JSON 導入"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            self.name = data.get("name", self.name)
            self.created_at = data.get("created_at", self.created_at)

            for task_data in data.get("tasks", []):
                task = Task.from_dict(task_data)
                self.tasks[task.id] = task

            return True
        except Exception as e:
            print(f"導入失敗: {e}")
            return False

    def _add_history(self, task_id: str, field: str, old_value, new_value):
        """添加歷史記錄"""
        if task_id not in self.tasks:
            return

        history_entry = {
            "field": field,
            "old_value": str(old_value) if old_value is not None else None,
            "new_value": str(new_value) if new_value is not None else None,
            "timestamp": datetime.now().isoformat()
        }

        self.tasks[task_id].history.append(history_entry)


if __name__ == "__main__":
    # 測試示例
    board = KanbanBoard("測試看板")

    # 創建任務
    task1 = Task(
        title="實現用戶登入",
        description="使用 JWT 實現安全認證",
        assignee="張三",
        priority="HIGH",
        estimated_hours=8,
        tags=["backend", "security"]
    )

    task2 = Task(
        title="設計 UI 介面",
        description="創建響應式設計",
        assignee="李四",
        priority="MEDIUM",
        estimated_hours=12,
        tags=["frontend", "design"]
    )

    # 添加任務
    board.add_task(task1)
    board.add_task(task2)

    # 移動任務
    board.move_task(task1.id, "IN_PROGRESS")
    board.add_comment(task1.id, "開始開發", "張三")
    board.update_actual_hours(task1.id, 3.5)

    # 獲取統計
    stats = board.get_statistics()
    print("看板統計:")
    print(f"總任務數: {stats['total_tasks']}")
    print(f"完成率: {stats['completion_rate']}%")
    print(f"狀態分布: {stats['status_distribution']}")

    # 導出
    board.export_to_json("kanban_data.json")
    print("\n數據已導出到 kanban_data.json")
