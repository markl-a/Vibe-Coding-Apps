"""
Sprint 管理工具 - 命令行界面
"""

from sprint_manager import SprintManager, UserStory, Sprint
from rich.console import Console
from rich.table import Table
from datetime import datetime

console = Console()


def main():
    """主程序"""
    # 創建示例
    manager = SprintManager("敏捷開發團隊")

    # 添加團隊成員
    manager.add_team_member("張三", "開發", 40)
    manager.add_team_member("李四", "開發", 40)
    manager.add_team_member("王五", "測試", 30)

    # 創建 User Stories
    stories = [
        UserStory("實現用戶註冊功能", "包含郵箱驗證", 5, 1),
        UserStory("實現用戶登入功能", "支持 OAuth", 3, 2),
        UserStory("實現商品列表頁面", "響應式設計", 8, 3),
        UserStory("實現購物車功能", "支持多商品", 5, 4),
        UserStory("實現訂單系統", "包含支付", 13, 5),
    ]

    for story in stories:
        manager.add_to_backlog(story)

    # 創建 Sprint
    sprint = manager.create_sprint(
        "Sprint 1",
        "實現基本的用戶和商品功能",
        2,
        datetime.now()
    )

    # 規劃 Sprint
    manager.plan_sprint(sprint.id, [s.id for s in stories[:3]])
    manager.start_sprint(sprint.id)

    # 顯示 Backlog
    console.print("\n[bold cyan]Product Backlog[/bold cyan]\n")
    table = Table()
    table.add_column("ID", style="cyan")
    table.add_column("Story", style="white")
    table.add_column("Points", style="yellow")
    table.add_column("Priority", style="magenta")
    table.add_column("Status", style="green")

    for story in manager.prioritize_backlog():
        table.add_row(
            story.id[:8],
            story.title[:50],
            str(story.story_points),
            str(story.priority),
            story.status
        )

    console.print(table)

    # 顯示 Sprint 信息
    console.print(f"\n[bold cyan]當前 Sprint: {sprint.name}[/bold cyan]")
    console.print(f"目標: {sprint.goal}")
    console.print(f"承諾點數: {sprint.committed_points}")
    console.print(f"團隊容量: {sprint.team_capacity}")

    # 模擬進度
    console.print("\n[bold]模擬 Sprint 進度...[/bold]")
    manager.update_story_status(stories[0].id, "IN_PROGRESS")
    manager.add_daily_standup(sprint.id, 0, "開始開發")

    manager.update_story_status(stories[0].id, "DONE")
    manager.add_daily_standup(sprint.id, 5, "完成用戶註冊")

    manager.update_story_status(stories[1].id, "IN_PROGRESS")
    manager.add_daily_standup(sprint.id, 0, "開始用戶登入")

    # 顯示燃盡圖數據
    burndown = manager.get_burndown_chart(sprint.id)
    console.print("\n[bold cyan]燃盡圖數據（前 5 天）:[/bold cyan]")
    for i, data in enumerate(burndown[:5], 1):
        console.print(
            f"Day {i}: 理想剩餘={data['ideal_remaining']:.1f}, "
            f"實際剩餘={data['actual_remaining']:.1f}"
        )

    # 顯示指標
    metrics = manager.get_sprint_metrics(sprint.id)
    console.print(f"\n[bold cyan]Sprint 指標:[/bold cyan]")
    console.print(f"  完成率: {metrics['completion_rate']}%")
    console.print(f"  容量利用率: {metrics['capacity_utilization']}%")
    console.print(f"  Story 完成: {metrics['completed_stories']}/{metrics['total_stories']}")

    # 導出
    manager.export_to_json("sprint_demo.json")
    console.print("\n[green]✓ 數據已導出到 sprint_demo.json[/green]")


if __name__ == "__main__":
    main()
