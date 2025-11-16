"""
Sprint 管理工具核心模組
實現完整的 Scrum Sprint 管理功能
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from enum import Enum


class StoryStatus(Enum):
    """Story 狀態"""
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    IN_REVIEW = "IN_REVIEW"
    DONE = "DONE"


class SprintStatus(Enum):
    """Sprint 狀態"""
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"


class UserStory:
    """User Story 類"""

    def __init__(
        self,
        title: str,
        description: str = "",
        story_points: int = 0,
        priority: int = 999,
        story_id: str = None
    ):
        self.id = story_id or f"story_{uuid.uuid4().hex[:8]}"
        self.title = title
        self.description = description
        self.story_points = story_points
        self.priority = priority
        self.status = StoryStatus.TODO.value
        self.assignee = ""
        self.sprint_id = None
        self.acceptance_criteria = []
        self.tags = []
        self.created_at = datetime.now().isoformat()
        self.completed_at = None

    def to_dict(self) -> dict:
        """轉換為字典"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "story_points": self.story_points,
            "priority": self.priority,
            "status": self.status,
            "assignee": self.assignee,
            "sprint_id": self.sprint_id,
            "acceptance_criteria": self.acceptance_criteria,
            "tags": self.tags,
            "created_at": self.created_at,
            "completed_at": self.completed_at
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'UserStory':
        """從字典創建"""
        story = cls(
            title=data["title"],
            description=data.get("description", ""),
            story_points=data.get("story_points", 0),
            priority=data.get("priority", 999),
            story_id=data.get("id")
        )
        story.status = data.get("status", StoryStatus.TODO.value)
        story.assignee = data.get("assignee", "")
        story.sprint_id = data.get("sprint_id")
        story.acceptance_criteria = data.get("acceptance_criteria", [])
        story.tags = data.get("tags", [])
        story.created_at = data.get("created_at", story.created_at)
        story.completed_at = data.get("completed_at")
        return story


class Sprint:
    """Sprint 類"""

    def __init__(
        self,
        name: str,
        goal: str,
        duration_weeks: int = 2,
        sprint_id: str = None
    ):
        self.id = sprint_id or f"sprint_{uuid.uuid4().hex[:8]}"
        self.name = name
        self.goal = goal
        self.status = SprintStatus.PLANNED.value
        self.duration_weeks = duration_weeks
        self.start_date = None
        self.end_date = None
        self.committed_points = 0
        self.completed_points = 0
        self.team_capacity = 0
        self.story_ids = []
        self.daily_standups = []
        self.retrospective = None
        self.created_at = datetime.now().isoformat()

    def to_dict(self) -> dict:
        """轉換為字典"""
        return {
            "id": self.id,
            "name": self.name,
            "goal": self.goal,
            "status": self.status,
            "duration_weeks": self.duration_weeks,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "committed_points": self.committed_points,
            "completed_points": self.completed_points,
            "team_capacity": self.team_capacity,
            "story_ids": self.story_ids,
            "daily_standups": self.daily_standups,
            "retrospective": self.retrospective,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Sprint':
        """從字典創建"""
        sprint = cls(
            name=data["name"],
            goal=data.get("goal", ""),
            duration_weeks=data.get("duration_weeks", 2),
            sprint_id=data.get("id")
        )
        sprint.status = data.get("status", SprintStatus.PLANNED.value)
        sprint.start_date = datetime.fromisoformat(data["start_date"]) if data.get("start_date") else None
        sprint.end_date = datetime.fromisoformat(data["end_date"]) if data.get("end_date") else None
        sprint.committed_points = data.get("committed_points", 0)
        sprint.completed_points = data.get("completed_points", 0)
        sprint.team_capacity = data.get("team_capacity", 0)
        sprint.story_ids = data.get("story_ids", [])
        sprint.daily_standups = data.get("daily_standups", [])
        sprint.retrospective = data.get("retrospective")
        sprint.created_at = data.get("created_at", sprint.created_at)
        return sprint


class SprintManager:
    """Sprint 管理器"""

    def __init__(self, team_name: str = "Scrum Team"):
        self.team_name = team_name
        self.team_members = {}  # {member_id: {name, role, capacity}}
        self.product_backlog = {}  # {story_id: UserStory}
        self.sprints = {}  # {sprint_id: Sprint}
        self.current_sprint_id = None

    def add_team_member(self, name: str, role: str = "Developer", capacity_per_sprint: int = 40) -> str:
        """添加團隊成員"""
        member_id = f"member_{uuid.uuid4().hex[:8]}"
        self.team_members[member_id] = {
            "name": name,
            "role": role,
            "capacity_per_sprint": capacity_per_sprint
        }
        return member_id

    def get_team_capacity(self) -> int:
        """獲取團隊總容量"""
        return sum(m["capacity_per_sprint"] for m in self.team_members.values())

    def add_to_backlog(self, story: UserStory) -> str:
        """添加到 Product Backlog"""
        self.product_backlog[story.id] = story
        return story.id

    def prioritize_backlog(self):
        """按優先級排序 Backlog"""
        sorted_stories = sorted(
            self.product_backlog.values(),
            key=lambda s: (s.priority, s.created_at)
        )
        return sorted_stories

    def create_sprint(
        self,
        name: str,
        goal: str,
        duration_weeks: int = 2,
        start_date: datetime = None
    ) -> Sprint:
        """創建 Sprint"""
        sprint = Sprint(name, goal, duration_weeks)
        sprint.team_capacity = self.get_team_capacity()

        if start_date:
            sprint.start_date = start_date
            sprint.end_date = start_date + timedelta(weeks=duration_weeks)

        self.sprints[sprint.id] = sprint
        return sprint

    def plan_sprint(self, sprint_id: str, story_ids: List[str]) -> bool:
        """規劃 Sprint"""
        if sprint_id not in self.sprints:
            return False

        sprint = self.sprints[sprint_id]

        # 計算承諾的故事點
        committed_points = 0
        for story_id in story_ids:
            if story_id in self.product_backlog:
                story = self.product_backlog[story_id]
                story.sprint_id = sprint_id
                committed_points += story.story_points

        sprint.story_ids = story_ids
        sprint.committed_points = committed_points

        return True

    def start_sprint(self, sprint_id: str) -> bool:
        """開始 Sprint"""
        if sprint_id not in self.sprints:
            return False

        sprint = self.sprints[sprint_id]
        sprint.status = SprintStatus.ACTIVE.value

        if not sprint.start_date:
            sprint.start_date = datetime.now()
            sprint.end_date = sprint.start_date + timedelta(weeks=sprint.duration_weeks)

        self.current_sprint_id = sprint_id
        return True

    def update_story_status(self, story_id: str, new_status: str) -> bool:
        """更新 Story 狀態"""
        if story_id not in self.product_backlog:
            return False

        story = self.product_backlog[story_id]
        old_status = story.status
        story.status = new_status

        # 如果完成，記錄完成時間
        if new_status == StoryStatus.DONE.value and old_status != StoryStatus.DONE.value:
            story.completed_at = datetime.now().isoformat()

            # 更新 Sprint 完成點數
            if story.sprint_id and story.sprint_id in self.sprints:
                sprint = self.sprints[story.sprint_id]
                sprint.completed_points += story.story_points

        return True

    def add_daily_standup(
        self,
        sprint_id: str,
        completed_points: int = 0,
        notes: str = ""
    ) -> bool:
        """添加每日站會記錄"""
        if sprint_id not in self.sprints:
            return False

        standup = {
            "date": datetime.now().isoformat(),
            "completed_points": completed_points,
            "notes": notes
        }

        self.sprints[sprint_id].daily_standups.append(standup)
        return True

    def complete_sprint(self, sprint_id: str) -> bool:
        """完成 Sprint"""
        if sprint_id not in self.sprints:
            return False

        sprint = self.sprints[sprint_id]
        sprint.status = SprintStatus.COMPLETED.value

        if not sprint.end_date:
            sprint.end_date = datetime.now()

        # 計算實際完成的故事點
        completed_points = sum(
            self.product_backlog[sid].story_points
            for sid in sprint.story_ids
            if sid in self.product_backlog and self.product_backlog[sid].status == StoryStatus.DONE.value
        )
        sprint.completed_points = completed_points

        # 將未完成的 Story 移回 Backlog
        for story_id in sprint.story_ids:
            if story_id in self.product_backlog:
                story = self.product_backlog[story_id]
                if story.status != StoryStatus.DONE.value:
                    story.sprint_id = None
                    story.status = StoryStatus.TODO.value

        if self.current_sprint_id == sprint_id:
            self.current_sprint_id = None

        return True

    def add_retrospective(
        self,
        sprint_id: str,
        what_went_well: List[str],
        what_to_improve: List[str],
        action_items: List[str]
    ) -> bool:
        """添加回顧記錄"""
        if sprint_id not in self.sprints:
            return False

        self.sprints[sprint_id].retrospective = {
            "what_went_well": what_went_well,
            "what_to_improve": what_to_improve,
            "action_items": action_items,
            "date": datetime.now().isoformat()
        }
        return True

    def get_burndown_chart(self, sprint_id: str) -> List[Dict]:
        """獲取燃盡圖數據"""
        if sprint_id not in self.sprints:
            return []

        sprint = self.sprints[sprint_id]
        if not sprint.start_date or not sprint.end_date:
            return []

        # 理想燃盡線
        total_days = (sprint.end_date - sprint.start_date).days
        daily_ideal_burn = sprint.committed_points / total_days if total_days > 0 else 0

        burndown_data = []
        current_date = sprint.start_date
        remaining_points = sprint.committed_points

        for day in range(total_days + 1):
            date = current_date + timedelta(days=day)

            # 理想剩餘點數
            ideal_remaining = sprint.committed_points - (daily_ideal_burn * day)

            # 實際剩餘點數（基於每日站會）
            actual_remaining = remaining_points
            for standup in sprint.daily_standups:
                standup_date = datetime.fromisoformat(standup["date"])
                if standup_date.date() == date.date():
                    remaining_points -= standup.get("completed_points", 0)
                    actual_remaining = remaining_points

            burndown_data.append({
                "date": date.isoformat(),
                "ideal_remaining": max(0, ideal_remaining),
                "actual_remaining": max(0, actual_remaining)
            })

        return burndown_data

    def get_team_velocity(self, last_n_sprints: int = 3) -> float:
        """獲取團隊平均速度"""
        completed_sprints = [
            s for s in self.sprints.values()
            if s.status == SprintStatus.COMPLETED.value
        ]

        # 取最近 N 個 Sprint
        completed_sprints.sort(key=lambda s: s.created_at, reverse=True)
        recent_sprints = completed_sprints[:last_n_sprints]

        if not recent_sprints:
            return 0.0

        total_velocity = sum(s.completed_points for s in recent_sprints)
        return total_velocity / len(recent_sprints)

    def get_sprint_metrics(self, sprint_id: str) -> Dict:
        """獲取 Sprint 指標"""
        if sprint_id not in self.sprints:
            return {}

        sprint = self.sprints[sprint_id]

        # 完成率
        completion_rate = (sprint.completed_points / sprint.committed_points * 100) if sprint.committed_points > 0 else 0

        # 容量利用率
        capacity_utilization = (sprint.committed_points / sprint.team_capacity * 100) if sprint.team_capacity > 0 else 0

        # Story 統計
        total_stories = len(sprint.story_ids)
        completed_stories = sum(
            1 for sid in sprint.story_ids
            if sid in self.product_backlog and self.product_backlog[sid].status == StoryStatus.DONE.value
        )

        return {
            "sprint_name": sprint.name,
            "status": sprint.status,
            "committed_points": sprint.committed_points,
            "completed_points": sprint.completed_points,
            "completion_rate": round(completion_rate, 2),
            "team_capacity": sprint.team_capacity,
            "capacity_utilization": round(capacity_utilization, 2),
            "total_stories": total_stories,
            "completed_stories": completed_stories,
            "story_completion_rate": round((completed_stories / total_stories * 100) if total_stories > 0 else 0, 2)
        }

    def export_to_json(self, filepath: str) -> bool:
        """導出為 JSON"""
        try:
            data = {
                "team_name": self.team_name,
                "team_members": self.team_members,
                "product_backlog": [s.to_dict() for s in self.product_backlog.values()],
                "sprints": [s.to_dict() for s in self.sprints.values()],
                "current_sprint_id": self.current_sprint_id
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

            self.team_name = data.get("team_name", self.team_name)
            self.team_members = data.get("team_members", {})
            self.current_sprint_id = data.get("current_sprint_id")

            # 導入 Backlog
            for story_data in data.get("product_backlog", []):
                story = UserStory.from_dict(story_data)
                self.product_backlog[story.id] = story

            # 導入 Sprints
            for sprint_data in data.get("sprints", []):
                sprint = Sprint.from_dict(sprint_data)
                self.sprints[sprint.id] = sprint

            return True
        except Exception as e:
            print(f"導入失敗: {e}")
            return False


if __name__ == "__main__":
    # 測試示例
    manager = SprintManager("電商開發團隊")

    # 添加團隊成員
    manager.add_team_member("張三", "開發", 40)
    manager.add_team_member("李四", "開發", 40)
    manager.add_team_member("王五", "測試", 40)

    # 創建 User Stories
    stories = [
        UserStory("作為用戶，我想要能夠註冊帳號", "實現用戶註冊", 5, 1),
        UserStory("作為用戶，我想要能夠登入", "實現用戶登入", 3, 2),
        UserStory("作為用戶，我想要能夠瀏覽商品", "實現商品列表", 8, 3),
        UserStory("作為用戶，我想要能夠加入購物車", "實現購物車功能", 5, 4),
    ]

    for story in stories:
        manager.add_to_backlog(story)

    # 創建並開始 Sprint
    sprint = manager.create_sprint("Sprint 1", "實現基本用戶功能", 2)
    manager.plan_sprint(sprint.id, [stories[0].id, stories[1].id])
    manager.start_sprint(sprint.id)

    # 模擬進度更新
    manager.update_story_status(stories[0].id, "IN_PROGRESS")
    manager.update_story_status(stories[0].id, "DONE")
    manager.add_daily_standup(sprint.id, 5, "完成用戶註冊功能")

    # 查看指標
    metrics = manager.get_sprint_metrics(sprint.id)
    print(f"\nSprint 指標:")
    print(f"  承諾點數: {metrics['committed_points']}")
    print(f"  完成點數: {metrics['completed_points']}")
    print(f"  完成率: {metrics['completion_rate']}%")

    # 導出
    manager.export_to_json("sprint_data.json")
    print("\n數據已導出到 sprint_data.json")
