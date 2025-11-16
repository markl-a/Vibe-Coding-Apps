"""
任務看板系統 - 命令行界面
"""

from kanban_board import KanbanBoard, Task, TaskStatus, TaskPriority
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
import sys


console = Console()


def display_board(board: KanbanBoard):
    """顯示看板"""
    console.print(f"\n[bold cyan]{board.name}[/bold cyan]\n")

    # 為每個狀態創建表格
    for status in TaskStatus:
        tasks = board.get_tasks_by_status(status.value)

        table = Table(title=f"{status.value} ({len(tasks)})")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("標題", style="white")
        table.add_column("負責人", style="green")
        table.add_column("優先級", style="yellow")
        table.add_column("工時", style="magenta")

        for task in tasks:
            priority_color = {
                "LOW": "green",
                "MEDIUM": "yellow",
                "HIGH": "red",
                "URGENT": "bold red"
            }.get(task.priority, "white")

            table.add_row(
                task.id[:8],
                task.title,
                task.assignee or "-",
                f"[{priority_color}]{task.priority}[/{priority_color}]",
                f"{task.actual_hours}/{task.estimated_hours}h"
            )

        console.print(table)
        console.print()


def create_task(board: KanbanBoard):
    """創建新任務"""
    console.print("\n[bold]創建新任務[/bold]")

    title = Prompt.ask("任務標題")
    description = Prompt.ask("描述", default="")
    assignee = Prompt.ask("負責人", default="")
    priority = Prompt.ask(
        "優先級",
        choices=["LOW", "MEDIUM", "HIGH", "URGENT"],
        default="MEDIUM"
    )
    estimated_hours = float(Prompt.ask("預估工時", default="0"))
    tags_input = Prompt.ask("標籤（用逗號分隔）", default="")
    tags = [tag.strip() for tag in tags_input.split(",") if tag.strip()]

    task = Task(
        title=title,
        description=description,
        assignee=assignee,
        priority=priority,
        estimated_hours=estimated_hours,
        tags=tags
    )

    task_id = board.add_task(task)
    console.print(f"[green]✓ 任務已創建: {task_id}[/green]")


def move_task(board: KanbanBoard):
    """移動任務"""
    task_id = Prompt.ask("輸入任務 ID（前 8 位）")

    # 查找任務
    matching_tasks = [tid for tid in board.tasks.keys() if tid.startswith(task_id)]

    if not matching_tasks:
        console.print("[red]找不到任務[/red]")
        return

    full_task_id = matching_tasks[0]
    task = board.tasks[full_task_id]

    console.print(f"\n當前任務: {task.title}")
    console.print(f"當前狀態: {task.status}")

    new_status = Prompt.ask(
        "新狀態",
        choices=["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]
    )

    if board.move_task(full_task_id, new_status):
        console.print(f"[green]✓ 任務已移動到 {new_status}[/green]")
    else:
        console.print("[red]移動失敗[/red]")


def add_comment(board: KanbanBoard):
    """添加評論"""
    task_id = Prompt.ask("輸入任務 ID（前 8 位）")

    # 查找任務
    matching_tasks = [tid for tid in board.tasks.keys() if tid.startswith(task_id)]

    if not matching_tasks:
        console.print("[red]找不到任務[/red]")
        return

    full_task_id = matching_tasks[0]
    task = board.tasks[full_task_id]

    console.print(f"\n任務: {task.title}")

    content = Prompt.ask("評論內容")
    author = Prompt.ask("作者")

    if board.add_comment(full_task_id, content, author):
        console.print("[green]✓ 評論已添加[/green]")


def show_statistics(board: KanbanBoard):
    """顯示統計"""
    stats = board.get_statistics()

    panel_content = f"""
[bold]總任務數:[/bold] {stats['total_tasks']}
[bold]完成率:[/bold] {stats['completion_rate']}%
[bold]預估總工時:[/bold] {stats['total_estimated_hours']} 小時
[bold]實際總工時:[/bold] {stats['total_actual_hours']} 小時
[bold]效率:[/bold] {stats['efficiency']}%
[bold]平均完成時間:[/bold] {stats['average_completion_time']} 小時

[bold cyan]狀態分布:[/bold cyan]
"""

    for status, count in stats['status_distribution'].items():
        panel_content += f"  {status}: {count}\n"

    panel_content += "\n[bold cyan]優先級分布:[/bold cyan]\n"
    for priority, count in stats['priority_distribution'].items():
        panel_content += f"  {priority}: {count}\n"

    console.print(Panel(panel_content, title="看板統計", border_style="cyan"))


def main_menu():
    """主菜單"""
    board = KanbanBoard("我的專案看板")

    # 載入示例數據
    try:
        board.import_from_json("data/sample_tasks.json")
    except:
        # 創建示例任務
        sample_tasks = [
            Task("實現用戶登入", "JWT 認證", "張三", "HIGH", 8, ["backend"]),
            Task("設計 UI", "響應式設計", "李四", "MEDIUM", 12, ["frontend"]),
            Task("編寫測試", "單元測試", "王五", "LOW", 4, ["testing"])
        ]
        for task in sample_tasks:
            board.add_task(task)

    while True:
        console.clear()
        display_board(board)

        console.print("\n[bold cyan]操作選單:[/bold cyan]")
        console.print("1. 創建任務")
        console.print("2. 移動任務")
        console.print("3. 添加評論")
        console.print("4. 查看統計")
        console.print("5. 保存數據")
        console.print("6. 退出")

        choice = Prompt.ask("\n選擇操作", choices=["1", "2", "3", "4", "5", "6"])

        if choice == "1":
            create_task(board)
        elif choice == "2":
            move_task(board)
        elif choice == "3":
            add_comment(board)
        elif choice == "4":
            show_statistics(board)
        elif choice == "5":
            board.export_to_json("kanban_data.json")
            console.print("[green]✓ 數據已保存[/green]")
        elif choice == "6":
            if Confirm.ask("確定要退出嗎？"):
                console.print("\n[cyan]再見！[/cyan]")
                sys.exit(0)

        if choice != "4":  # 統計頁面不需要暫停
            Prompt.ask("\n按 Enter 繼續")


if __name__ == "__main__":
    try:
        main_menu()
    except KeyboardInterrupt:
        console.print("\n\n[cyan]再見！[/cyan]")
        sys.exit(0)
