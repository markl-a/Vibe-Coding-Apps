"""
資源分配系統核心模組
實現智能資源分配和優化算法
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Set, Optional
from collections import defaultdict


class Resource:
    """資源（人員）類"""

    def __init__(
        self,
        name: str,
        skills: List[str] = None,
        capacity_per_week: int = 40,
        resource_id: str = None
    ):
        self.id = resource_id or f"res_{uuid.uuid4().hex[:8]}"
        self.name = name
        self.skills = set(skills or [])
        self.capacity_per_week = capacity_per_week
        self.allocations = []  # {project_id, hours, start_date, end_date}
        self.unavailable_dates = []  # 休假等不可用日期

    def get_available_capacity(self, start_date: datetime, end_date: datetime) -> float:
        """獲取可用容量"""
        weeks = (end_date - start_date).days / 7
        total_capacity = self.capacity_per_week * weeks

        # 減去已分配的時間
        allocated_hours = sum(
            alloc["hours"] for alloc in self.allocations
            if self._dates_overlap(
                start_date, end_date,
                alloc["start_date"], alloc["end_date"]
            )
        )

        return max(0, total_capacity - allocated_hours)

    def _dates_overlap(self, start1, end1, start2, end2):
        """檢查日期是否重疊"""
        return start1 <= end2 and end1 >= start2

    def add_allocation(
        self,
        project_id: str,
        hours: float,
        start_date: datetime,
        end_date: datetime
    ):
        """添加資源分配"""
        self.allocations.append({
            "project_id": project_id,
            "hours": hours,
            "start_date": start_date,
            "end_date": end_date
        })

    def to_dict(self) -> dict:
        """轉換為字典"""
        return {
            "id": self.id,
            "name": self.name,
            "skills": list(self.skills),
            "capacity_per_week": self.capacity_per_week,
            "allocations": [
                {
                    **alloc,
                    "start_date": alloc["start_date"].isoformat(),
                    "end_date": alloc["end_date"].isoformat()
                }
                for alloc in self.allocations
            ]
        }


class ProjectDemand:
    """專案資源需求類"""

    def __init__(
        self,
        project_id: str,
        required_skills: List[str],
        required_hours: float,
        start_date: datetime,
        end_date: datetime,
        priority: int = 5
    ):
        self.project_id = project_id
        self.required_skills = set(required_skills)
        self.required_hours = required_hours
        self.start_date = start_date
        self.end_date = end_date
        self.priority = priority


class ResourceAllocator:
    """資源分配器"""

    def __init__(self):
        self.resources: Dict[str, Resource] = {}
        self.projects: Dict[str, ProjectDemand] = {}
        self.allocations = []

    def add_resource(
        self,
        name: str,
        skills: List[str] = None,
        capacity_per_week: int = 40
    ) -> str:
        """添加資源"""
        resource = Resource(name, skills, capacity_per_week)
        self.resources[resource.id] = resource
        return resource.id

    def add_project_demand(
        self,
        project_id: str,
        required_skills: List[str],
        required_hours: float,
        start_date: datetime,
        end_date: datetime,
        priority: int = 5
    ):
        """添加專案需求"""
        demand = ProjectDemand(
            project_id,
            required_skills,
            required_hours,
            start_date,
            end_date,
            priority
        )
        self.projects[project_id] = demand

    def find_matching_resources(
        self,
        required_skills: Set[str],
        min_match_ratio: float = 0.5
    ) -> List[Resource]:
        """查找匹配的資源"""
        matching_resources = []

        for resource in self.resources.values():
            if not required_skills:
                matching_resources.append((resource, 1.0))
                continue

            # 計算技能匹配度
            matched_skills = resource.skills.intersection(required_skills)
            match_ratio = len(matched_skills) / len(required_skills)

            if match_ratio >= min_match_ratio:
                matching_resources.append((resource, match_ratio))

        # 按匹配度排序
        matching_resources.sort(key=lambda x: x[1], reverse=True)

        return [res for res, _ in matching_resources]

    def allocate_resources(
        self,
        project_id: str,
        strategy: str = "balanced"
    ) -> Dict:
        """分配資源"""
        if project_id not in self.projects:
            return {"success": False, "message": "專案不存在"}

        demand = self.projects[project_id]

        # 查找匹配的資源
        matching_resources = self.find_matching_resources(demand.required_skills)

        if not matching_resources:
            return {
                "success": False,
                "message": "找不到匹配的資源"
            }

        # 分配策略
        if strategy == "balanced":
            allocation = self._balanced_allocation(demand, matching_resources)
        elif strategy == "minimize_resources":
            allocation = self._minimize_resources_allocation(demand, matching_resources)
        else:
            allocation = self._greedy_allocation(demand, matching_resources)

        return allocation

    def _balanced_allocation(
        self,
        demand: ProjectDemand,
        resources: List[Resource]
    ) -> Dict:
        """平衡分配策略"""
        remaining_hours = demand.required_hours
        allocated_resources = []

        # 平均分配給可用資源
        for resource in resources:
            if remaining_hours <= 0:
                break

            available_capacity = resource.get_available_capacity(
                demand.start_date,
                demand.end_date
            )

            if available_capacity > 0:
                allocated_hours = min(remaining_hours, available_capacity)
                resource.add_allocation(
                    demand.project_id,
                    allocated_hours,
                    demand.start_date,
                    demand.end_date
                )

                allocated_resources.append({
                    "resource_id": resource.id,
                    "resource_name": resource.name,
                    "allocated_hours": allocated_hours,
                    "utilization": (allocated_hours / available_capacity * 100)
                })

                remaining_hours -= allocated_hours

        return {
            "success": remaining_hours <= 0,
            "allocated_resources": allocated_resources,
            "remaining_hours": max(0, remaining_hours),
            "total_allocated": demand.required_hours - remaining_hours
        }

    def _minimize_resources_allocation(
        self,
        demand: ProjectDemand,
        resources: List[Resource]
    ) -> Dict:
        """最小化資源數量策略"""
        remaining_hours = demand.required_hours
        allocated_resources = []

        # 盡可能用最少的資源
        for resource in resources:
            if remaining_hours <= 0:
                break

            available_capacity = resource.get_available_capacity(
                demand.start_date,
                demand.end_date
            )

            if available_capacity > 0:
                # 盡可能多地分配給單個資源
                allocated_hours = min(remaining_hours, available_capacity)

                resource.add_allocation(
                    demand.project_id,
                    allocated_hours,
                    demand.start_date,
                    demand.end_date
                )

                allocated_resources.append({
                    "resource_id": resource.id,
                    "resource_name": resource.name,
                    "allocated_hours": allocated_hours,
                    "utilization": (allocated_hours / available_capacity * 100)
                })

                remaining_hours -= allocated_hours

        return {
            "success": remaining_hours <= 0,
            "allocated_resources": allocated_resources,
            "remaining_hours": max(0, remaining_hours),
            "resources_used": len(allocated_resources)
        }

    def _greedy_allocation(
        self,
        demand: ProjectDemand,
        resources: List[Resource]
    ) -> Dict:
        """貪婪分配策略"""
        return self._balanced_allocation(demand, resources)

    def get_resource_utilization(self) -> Dict[str, float]:
        """獲取資源利用率"""
        utilization = {}

        for resource in self.resources.values():
            total_allocated = sum(alloc["hours"] for alloc in resource.allocations)
            # 假設分析一個月（4週）
            total_capacity = resource.capacity_per_week * 4
            utilization[resource.name] = (
                (total_allocated / total_capacity * 100) if total_capacity > 0 else 0
            )

        return utilization

    def detect_over_allocation(self) -> List[Dict]:
        """檢測過度分配"""
        over_allocated = []

        for resource in self.resources.values():
            # 檢查每週的分配
            weekly_allocations = defaultdict(float)

            for alloc in resource.allocations:
                weeks = (alloc["end_date"] - alloc["start_date"]).days / 7
                hours_per_week = alloc["hours"] / weeks if weeks > 0 else alloc["hours"]

                # 簡化：只檢查總體分配
                weekly_allocations["total"] += hours_per_week

            if weekly_allocations["total"] > resource.capacity_per_week:
                over_allocated.append({
                    "resource_name": resource.name,
                    "capacity": resource.capacity_per_week,
                    "allocated": weekly_allocations["total"],
                    "over_by": weekly_allocations["total"] - resource.capacity_per_week
                })

        return over_allocated

    def export_to_json(self, filepath: str) -> bool:
        """導出為 JSON"""
        try:
            data = {
                "resources": [res.to_dict() for res in self.resources.values()],
                "projects": [
                    {
                        "project_id": proj.project_id,
                        "required_skills": list(proj.required_skills),
                        "required_hours": proj.required_hours,
                        "start_date": proj.start_date.isoformat(),
                        "end_date": proj.end_date.isoformat(),
                        "priority": proj.priority
                    }
                    for proj in self.projects.values()
                ]
            }

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            return True
        except Exception as e:
            print(f"導出失敗: {e}")
            return False


if __name__ == "__main__":
    # 測試示例
    allocator = ResourceAllocator()

    # 添加資源
    allocator.add_resource("張三", ["Python", "Django", "PostgreSQL"], 40)
    allocator.add_resource("李四", ["React", "TypeScript", "Node.js"], 40)
    allocator.add_resource("王五", ["Python", "React", "AWS"], 40)
    allocator.add_resource("趙六", ["Java", "Spring", "MySQL"], 40)

    # 添加專案需求
    start_date = datetime.now()
    end_date = start_date + timedelta(weeks=4)

    allocator.add_project_demand(
        "proj_001",
        ["Python", "Django"],
        80,
        start_date,
        end_date,
        priority=1
    )

    allocator.add_project_demand(
        "proj_002",
        ["React", "TypeScript"],
        60,
        start_date,
        end_date,
        priority=2
    )

    # 分配資源
    result1 = allocator.allocate_resources("proj_001", strategy="balanced")
    print(f"\n專案 1 分配結果:")
    print(f"  成功: {result1['success']}")
    print(f"  已分配: {result1['total_allocated']} 小時")
    print(f"  資源:")
    for res in result1['allocated_resources']:
        print(f"    - {res['resource_name']}: {res['allocated_hours']}h ({res['utilization']:.1f}%)")

    result2 = allocator.allocate_resources("proj_002", strategy="balanced")
    print(f"\n專案 2 分配結果:")
    print(f"  成功: {result2['success']}")
    print(f"  已分配: {result2['total_allocated']} 小時")

    # 查看利用率
    print(f"\n資源利用率:")
    for name, util in allocator.get_resource_utilization().items():
        print(f"  {name}: {util:.1f}%")

    # 檢測過度分配
    over_alloc = allocator.detect_over_allocation()
    if over_alloc:
        print(f"\n過度分配警告:")
        for item in over_alloc:
            print(f"  {item['resource_name']}: 超出 {item['over_by']:.1f} 小時")

    # 導出
    allocator.export_to_json("resource_allocation.json")
    print("\n數據已導出到 resource_allocation.json")
