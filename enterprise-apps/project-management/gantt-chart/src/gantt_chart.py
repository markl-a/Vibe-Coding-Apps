"""
甘特圖時程管理工具核心模組
實現完整的 CPM (Critical Path Method) 算法
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from enum import Enum
import networkx as nx


class DependencyType(Enum):
    """依賴類型"""
    FS = "FS"  # Finish-to-Start
    SS = "SS"  # Start-to-Start
    FF = "FF"  # Finish-to-Finish
    SF = "SF"  # Start-to-Finish


class GanttTask:
    """甘特圖任務類"""

    def __init__(
        self,
        name: str,
        duration: int,
        start_date: datetime = None,
        assignee: str = "",
        task_id: str = None
    ):
        self.id = task_id or f"task_{uuid.uuid4().hex[:8]}"
        self.name = name
        self.duration = duration  # 工期（天）
        self.start_date = start_date
        self.end_date = None
        self.assignee = assignee
        self.progress = 0  # 完成百分比
        self.is_milestone = False
        self.is_critical = False

        # CPM 計算用
        self.early_start = None
        self.early_finish = None
        self.late_start = None
        self.late_finish = None
        self.total_float = 0

        # 依賴關係
        self.dependencies: List[Dict] = []  # {predecessor_id, type, lag}
        self.successors: List[str] = []

        if start_date:
            self.calculate_end_date()

    def calculate_end_date(self):
        """計算結束日期"""
        if self.start_date and self.duration > 0:
            self.end_date = self.start_date + timedelta(days=self.duration - 1)

    def to_dict(self) -> dict:
        """轉換為字典"""
        return {
            "id": self.id,
            "name": self.name,
            "duration": self.duration,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "assignee": self.assignee,
            "progress": self.progress,
            "is_milestone": self.is_milestone,
            "is_critical": self.is_critical,
            "early_start": self.early_start.isoformat() if self.early_start else None,
            "early_finish": self.early_finish.isoformat() if self.early_finish else None,
            "late_start": self.late_start.isoformat() if self.late_start else None,
            "late_finish": self.late_finish.isoformat() if self.late_finish else None,
            "total_float": self.total_float,
            "dependencies": self.dependencies,
            "successors": self.successors
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'GanttTask':
        """從字典創建任務"""
        start_date = datetime.fromisoformat(data["start_date"]) if data.get("start_date") else None
        task = cls(
            name=data["name"],
            duration=data["duration"],
            start_date=start_date,
            assignee=data.get("assignee", ""),
            task_id=data.get("id")
        )
        task.progress = data.get("progress", 0)
        task.is_milestone = data.get("is_milestone", False)
        task.is_critical = data.get("is_critical", False)
        task.dependencies = data.get("dependencies", [])
        task.successors = data.get("successors", [])
        return task


class GanttChart:
    """甘特圖類"""

    def __init__(self, project_name: str, start_date: str = None):
        self.project_name = project_name
        self.project_start_date = datetime.fromisoformat(start_date) if start_date else datetime.now()
        self.tasks: Dict[str, GanttTask] = {}
        self.milestones: Dict[str, str] = {}  # {milestone_name: task_id}
        self.graph = nx.DiGraph()  # 用於關鍵路徑計算

    def add_task(
        self,
        name: str,
        duration: int,
        start_date: str = None,
        assignee: str = "",
        **kwargs
    ) -> str:
        """添加任務"""
        task_start = datetime.fromisoformat(start_date) if start_date else None
        task = GanttTask(name, duration, task_start, assignee)

        for key, value in kwargs.items():
            if hasattr(task, key):
                setattr(task, key, value)

        self.tasks[task.id] = task
        self.graph.add_node(task.id, task=task)

        return task.id

    def add_dependency(
        self,
        predecessor_id: str,
        successor_id: str,
        dep_type: str = "FS",
        lag: int = 0
    ) -> bool:
        """添加依賴關係"""
        if predecessor_id not in self.tasks or successor_id not in self.tasks:
            return False

        # 驗證依賴類型
        try:
            DependencyType(dep_type)
        except ValueError:
            return False

        # 添加依賴
        dependency = {
            "predecessor_id": predecessor_id,
            "type": dep_type,
            "lag": lag
        }
        self.tasks[successor_id].dependencies.append(dependency)
        self.tasks[predecessor_id].successors.append(successor_id)

        # 更新圖
        self.graph.add_edge(predecessor_id, successor_id, type=dep_type, lag=lag)

        return True

    def add_milestone(self, name: str, task_id: str) -> bool:
        """添加里程碑"""
        if task_id not in self.tasks:
            return False

        self.tasks[task_id].is_milestone = True
        self.milestones[name] = task_id
        return True

    def update_progress(self, task_id: str, progress: float) -> bool:
        """更新進度"""
        if task_id not in self.tasks:
            return False

        self.tasks[task_id].progress = max(0, min(100, progress))
        return True

    def calculate_schedule(self):
        """計算排程（使用 CPM 算法）"""
        # 1. 拓撲排序（確保按依賴順序處理）
        try:
            topo_order = list(nx.topological_sort(self.graph))
        except nx.NetworkXError:
            print("警告：發現循環依賴")
            return

        # 2. 前推法 (Forward Pass) - 計算最早開始和最早完成
        for task_id in topo_order:
            task = self.tasks[task_id]

            if not task.dependencies:
                # 沒有依賴的任務從專案開始日期開始
                task.early_start = task.start_date or self.project_start_date
            else:
                # 計算所有前置任務完成後的最早開始時間
                earliest_start = self.project_start_date

                for dep in task.dependencies:
                    pred_task = self.tasks[dep["predecessor_id"]]
                    dep_type = dep["type"]
                    lag = dep.get("lag", 0)

                    if dep_type == "FS":
                        # Finish-to-Start
                        candidate = pred_task.early_finish + timedelta(days=lag + 1)
                    elif dep_type == "SS":
                        # Start-to-Start
                        candidate = pred_task.early_start + timedelta(days=lag)
                    elif dep_type == "FF":
                        # Finish-to-Finish
                        candidate = pred_task.early_finish + timedelta(days=lag) - timedelta(days=task.duration - 1)
                    else:  # SF
                        # Start-to-Finish
                        candidate = pred_task.early_start + timedelta(days=lag) - timedelta(days=task.duration - 1)

                    if candidate > earliest_start:
                        earliest_start = candidate

                task.early_start = earliest_start

            # 計算最早完成
            task.early_finish = task.early_start + timedelta(days=task.duration - 1)

        # 3. 後推法 (Backward Pass) - 計算最晚開始和最晚完成
        # 專案結束日期 = 所有任務的最晚完成日期
        project_end = max([task.early_finish for task in self.tasks.values()])

        for task_id in reversed(topo_order):
            task = self.tasks[task_id]

            if not task.successors:
                # 沒有後續任務的，最晚完成時間 = 最早完成時間
                task.late_finish = project_end if task.early_finish == project_end else task.early_finish
            else:
                # 計算所有後續任務的最晚開始時間
                latest_finish = project_end

                for succ_id in task.successors:
                    succ_task = self.tasks[succ_id]

                    # 找到這個後續任務的依賴信息
                    dep_info = next(
                        (d for d in succ_task.dependencies if d["predecessor_id"] == task_id),
                        None
                    )

                    if dep_info:
                        dep_type = dep_info["type"]
                        lag = dep_info.get("lag", 0)

                        if dep_type == "FS":
                            candidate = succ_task.late_start - timedelta(days=lag + 1)
                        elif dep_type == "SS":
                            candidate = succ_task.late_start - timedelta(days=lag)
                        elif dep_type == "FF":
                            candidate = succ_task.late_finish - timedelta(days=lag)
                        else:  # SF
                            candidate = succ_task.late_finish + timedelta(days=task.duration - 1) - timedelta(days=lag)

                        if candidate < latest_finish:
                            latest_finish = candidate

                task.late_finish = latest_finish

            # 計算最晚開始
            task.late_start = task.late_finish - timedelta(days=task.duration - 1)

            # 計算總浮動時間
            task.total_float = (task.late_start - task.early_start).days

            # 標記關鍵任務
            task.is_critical = (task.total_float == 0)

            # 更新實際開始和結束日期
            if not task.start_date:
                task.start_date = task.early_start
                task.calculate_end_date()

    def calculate_critical_path(self) -> List[GanttTask]:
        """計算關鍵路徑"""
        self.calculate_schedule()

        # 返回所有關鍵任務
        critical_tasks = [task for task in self.tasks.values() if task.is_critical]

        # 按開始日期排序
        critical_tasks.sort(key=lambda t: t.early_start)

        return critical_tasks

    def get_project_duration(self) -> int:
        """獲取專案總工期"""
        if not self.tasks:
            return 0

        self.calculate_schedule()

        project_end = max([task.late_finish for task in self.tasks.values()])
        duration = (project_end - self.project_start_date).days + 1

        return duration

    def get_schedule_variance(self) -> float:
        """計算進度偏差"""
        total_planned = sum(task.duration for task in self.tasks.values())
        total_actual = sum(task.duration * task.progress / 100 for task in self.tasks.values())

        if total_planned == 0:
            return 0

        return ((total_actual - total_planned) / total_planned) * 100

    def export_to_json(self, filepath: str) -> bool:
        """導出為 JSON"""
        try:
            data = {
                "project_name": self.project_name,
                "start_date": self.project_start_date.isoformat(),
                "tasks": [task.to_dict() for task in self.tasks.values()],
                "milestones": self.milestones
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

            self.project_name = data.get("project_name", self.project_name)
            self.project_start_date = datetime.fromisoformat(data.get("start_date", datetime.now().isoformat()))

            # 導入任務
            for task_data in data.get("tasks", []):
                task = GanttTask.from_dict(task_data)
                self.tasks[task.id] = task
                self.graph.add_node(task.id, task=task)

            # 重建依賴關係圖
            for task in self.tasks.values():
                for dep in task.dependencies:
                    self.graph.add_edge(
                        dep["predecessor_id"],
                        task.id,
                        type=dep["type"],
                        lag=dep.get("lag", 0)
                    )

            self.milestones = data.get("milestones", {})

            return True
        except Exception as e:
            print(f"導入失敗: {e}")
            return False


if __name__ == "__main__":
    # 測試示例
    gantt = GanttChart("網站開發專案", "2025-01-15")

    # 添加任務
    task1 = gantt.add_task("需求分析", 5, assignee="產品經理")
    task2 = gantt.add_task("UI 設計", 7, assignee="設計師")
    task3 = gantt.add_task("前端開發", 10, assignee="前端工程師")
    task4 = gantt.add_task("後端開發", 12, assignee="後端工程師")
    task5 = gantt.add_task("測試", 5, assignee="測試工程師")
    task6 = gantt.add_task("部署上線", 2, assignee="運維工程師")

    # 添加依賴
    gantt.add_dependency(task1, task2, "FS")
    gantt.add_dependency(task2, task3, "FS")
    gantt.add_dependency(task1, task4, "FS")
    gantt.add_dependency(task3, task5, "FS")
    gantt.add_dependency(task4, task5, "FS")
    gantt.add_dependency(task5, task6, "FS")

    # 添加里程碑
    gantt.add_milestone("設計完成", task2)
    gantt.add_milestone("開發完成", task4)
    gantt.add_milestone("專案上線", task6)

    # 計算關鍵路徑
    critical_path = gantt.calculate_critical_path()

    print(f"專案: {gantt.project_name}")
    print(f"總工期: {gantt.get_project_duration()} 天")
    print(f"\n關鍵路徑:")
    for task in critical_path:
        print(f"  - {task.name} ({task.duration}天)")
        print(f"    開始: {task.early_start.date()}, 結束: {task.early_finish.date()}")
        print(f"    浮動時間: {task.total_float} 天")

    # 導出
    gantt.export_to_json("gantt_data.json")
    print("\n數據已導出到 gantt_data.json")
