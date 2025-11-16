"""
甘特圖時程管理工具 - 命令行界面
"""

from gantt_chart import GanttChart, GanttTask
from datetime import datetime
import plotly.figure_factory as ff
import plotly.graph_objects as go
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
import sys


console = Console()


def display_tasks(gantt: GanttChart):
    """顯示任務列表"""
    if not gantt.tasks:
        console.print("[yellow]尚無任務[/yellow]")
        return

    table = Table(title=f"{gantt.project_name} - 任務列表")
    table.add_column("ID", style="cyan", no_wrap=True)
    table.add_column("任務名稱", style="white")
    table.add_column("負責人", style="green")
    table.add_column("工期", style="yellow")
    table.add_column("開始日期", style="magenta")
    table.add_column("結束日期", style="magenta")
    table.add_column("進度", style="blue")
    table.add_column("關鍵", style="red")

    for task in gantt.tasks.values():
        critical_mark = "✓" if task.is_critical else ""
        milestone_mark = "📍" if task.is_milestone else ""

        table.add_row(
            task.id[:8],
            f"{milestone_mark}{task.name}",
            task.assignee or "-",
            f"{task.duration}天",
            task.start_date.strftime("%Y-%m-%d") if task.start_date else "-",
            task.end_date.strftime("%Y-%m-%d") if task.end_date else "-",
            f"{task.progress}%",
            critical_mark
        )

    console.print(table)


def create_task(gantt: GanttChart):
    """創建任務"""
    console.print("\n[bold]創建新任務[/bold]")

    name = Prompt.ask("任務名稱")
    duration = int(Prompt.ask("工期（天）", default="1"))
    assignee = Prompt.ask("負責人", default="")

    use_custom_date = Confirm.ask("自定義開始日期？", default=False)
    start_date = None
    if use_custom_date:
        date_str = Prompt.ask("開始日期 (YYYY-MM-DD)")
        start_date = date_str

    task_id = gantt.add_task(name, duration, start_date, assignee)
    console.print(f"[green]✓ 任務已創建: {task_id}[/green]")


def add_dependency_interactive(gantt: GanttChart):
    """添加依賴關係"""
    if len(gantt.tasks) < 2:
        console.print("[red]至少需要兩個任務才能添加依賴[/red]")
        return

    console.print("\n[bold]添加依賴關係[/bold]")

    # 顯示任務列表供選擇
    console.print("\n可用任務:")
    for task in gantt.tasks.values():
        console.print(f"  {task.id[:8]}: {task.name}")

    pred_id = Prompt.ask("\n前置任務 ID（前 8 位）")
    succ_id = Prompt.ask("後續任務 ID（前 8 位）")

    # 查找完整 ID
    pred_full_id = next((tid for tid in gantt.tasks.keys() if tid.startswith(pred_id)), None)
    succ_full_id = next((tid for tid in gantt.tasks.keys() if tid.startswith(succ_id)), None)

    if not pred_full_id or not succ_full_id:
        console.print("[red]找不到任務[/red]")
        return

    dep_type = Prompt.ask(
        "依賴類型",
        choices=["FS", "SS", "FF", "SF"],
        default="FS"
    )
    lag = int(Prompt.ask("延遲天數", default="0"))

    if gantt.add_dependency(pred_full_id, succ_full_id, dep_type, lag):
        console.print(f"[green]✓ 依賴關係已添加[/green]")
    else:
        console.print("[red]添加依賴失敗[/red]")


def show_critical_path(gantt: GanttChart):
    """顯示關鍵路徑"""
    critical_path = gantt.calculate_critical_path()

    if not critical_path:
        console.print("[yellow]無法計算關鍵路徑[/yellow]")
        return

    panel_content = f"[bold cyan]專案總工期:[/bold cyan] {gantt.get_project_duration()} 天\n\n"
    panel_content += "[bold cyan]關鍵路徑任務:[/bold cyan]\n"

    for i, task in enumerate(critical_path, 1):
        panel_content += f"\n{i}. {task.name}\n"
        panel_content += f"   工期: {task.duration} 天\n"
        panel_content += f"   開始: {task.early_start.date()}\n"
        panel_content += f"   結束: {task.early_finish.date()}\n"
        panel_content += f"   負責人: {task.assignee or '未分配'}\n"

    console.print(Panel(panel_content, title="關鍵路徑分析", border_style="red"))


def generate_gantt_chart(gantt: GanttChart):
    """生成甘特圖"""
    if not gantt.tasks:
        console.print("[yellow]尚無任務，無法生成圖表[/yellow]")
        return

    # 計算排程
    gantt.calculate_schedule()

    # 準備數據
    df_data = []
    for task in gantt.tasks.values():
        df_data.append({
            'Task': task.name,
            'Start': task.start_date,
            'Finish': task.end_date,
            'Resource': task.assignee or '未分配',
            'Complete': task.progress
        })

    # 創建甘特圖
    colors = {}
    for task in gantt.tasks.values():
        if task.is_critical:
            colors[task.name] = 'rgb(255, 0, 0)'  # 紅色表示關鍵任務
        elif task.is_milestone:
            colors[task.name] = 'rgb(0, 255, 0)'  # 綠色表示里程碑
        else:
            colors[task.name] = 'rgb(0, 123, 255)'  # 藍色表示普通任務

    fig = ff.create_gantt(
        df_data,
        colors=colors,
        index_col='Resource',
        show_colorbar=True,
        title=f"{gantt.project_name} - 甘特圖",
        showgrid_x=True,
        showgrid_y=True
    )

    # 添加里程碑標記
    for name, task_id in gantt.milestones.items():
        task = gantt.tasks[task_id]
        fig.add_trace(go.Scatter(
            x=[task.end_date],
            y=[task.name],
            mode='markers',
            marker=dict(size=15, symbol='diamond', color='gold'),
            name=f'里程碑: {name}',
            showlegend=True
        ))

    fig.update_layout(
        xaxis_title="日期",
        yaxis_title="任務",
        height=max(400, len(gantt.tasks) * 40)
    )

    # 保存並顯示
    fig.write_html("gantt_chart.html")
    console.print("[green]✓ 甘特圖已保存到 gantt_chart.html[/green]")
    console.print("[cyan]正在瀏覽器中打開...[/cyan]")

    try:
        fig.show()
    except:
        console.print("[yellow]無法自動打開瀏覽器，請手動打開 gantt_chart.html[/yellow]")


def show_task_details(gantt: GanttChart):
    """顯示任務詳情"""
    task_id = Prompt.ask("輸入任務 ID（前 8 位）")

    full_id = next((tid for tid in gantt.tasks.keys() if tid.startswith(task_id)), None)

    if not full_id:
        console.print("[red]找不到任務[/red]")
        return

    task = gantt.tasks[full_id]

    content = f"""
[bold]任務名稱:[/bold] {task.name}
[bold]ID:[/bold] {task.id}
[bold]負責人:[/bold] {task.assignee or '未分配'}
[bold]工期:[/bold] {task.duration} 天
[bold]進度:[/bold] {task.progress}%

[bold cyan]時程信息:[/bold cyan]
  開始日期: {task.start_date.date() if task.start_date else '未設定'}
  結束日期: {task.end_date.date() if task.end_date else '未設定'}
  最早開始: {task.early_start.date() if task.early_start else '未計算'}
  最早完成: {task.early_finish.date() if task.early_finish else '未計算'}
  最晚開始: {task.late_start.date() if task.late_start else '未計算'}
  最晚完成: {task.late_finish.date() if task.late_finish else '未計算'}
  浮動時間: {task.total_float} 天

[bold cyan]狀態:[/bold cyan]
  關鍵任務: {'是' if task.is_critical else '否'}
  里程碑: {'是' if task.is_milestone else '否'}

[bold cyan]依賴關係:[/bold cyan]
"""

    if task.dependencies:
        for dep in task.dependencies:
            pred = gantt.tasks.get(dep["predecessor_id"])
            content += f"  ← {pred.name if pred else '未知'} ({dep['type']})\n"
    else:
        content += "  無前置任務\n"

    if task.successors:
        content += "\n[bold cyan]後續任務:[/bold cyan]\n"
        for succ_id in task.successors:
            succ = gantt.tasks.get(succ_id)
            content += f"  → {succ.name if succ else '未知'}\n"

    console.print(Panel(content, title="任務詳情", border_style="cyan"))


def main_menu():
    """主菜單"""
    console.print("[bold cyan]甘特圖時程管理工具[/bold cyan]\n")

    project_name = Prompt.ask("專案名稱", default="我的專案")
    start_date = Prompt.ask("專案開始日期 (YYYY-MM-DD)", default=datetime.now().strftime("%Y-%m-%d"))

    gantt = GanttChart(project_name, start_date)

    while True:
        console.print("\n" + "=" * 60)
        console.print(f"[bold]{gantt.project_name}[/bold]")
        console.print("=" * 60 + "\n")

        display_tasks(gantt)

        console.print("\n[bold cyan]操作選單:[/bold cyan]")
        console.print("1. 創建任務")
        console.print("2. 添加依賴關係")
        console.print("3. 添加里程碑")
        console.print("4. 更新進度")
        console.print("5. 顯示關鍵路徑")
        console.print("6. 查看任務詳情")
        console.print("7. 生成甘特圖")
        console.print("8. 保存數據")
        console.print("9. 載入數據")
        console.print("0. 退出")

        choice = Prompt.ask("\n選擇操作", choices=["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])

        console.clear()

        if choice == "1":
            create_task(gantt)
        elif choice == "2":
            add_dependency_interactive(gantt)
        elif choice == "3":
            task_id = Prompt.ask("任務 ID（前 8 位）")
            full_id = next((tid for tid in gantt.tasks.keys() if tid.startswith(task_id)), None)
            if full_id:
                milestone_name = Prompt.ask("里程碑名稱")
                gantt.add_milestone(milestone_name, full_id)
                console.print("[green]✓ 里程碑已添加[/green]")
        elif choice == "4":
            task_id = Prompt.ask("任務 ID（前 8 位）")
            full_id = next((tid for tid in gantt.tasks.keys() if tid.startswith(task_id)), None)
            if full_id:
                progress = float(Prompt.ask("進度 (0-100)", default="0"))
                gantt.update_progress(full_id, progress)
                console.print("[green]✓ 進度已更新[/green]")
        elif choice == "5":
            show_critical_path(gantt)
        elif choice == "6":
            show_task_details(gantt)
        elif choice == "7":
            generate_gantt_chart(gantt)
        elif choice == "8":
            gantt.export_to_json("gantt_data.json")
            console.print("[green]✓ 數據已保存[/green]")
        elif choice == "9":
            if gantt.import_from_json("gantt_data.json"):
                console.print("[green]✓ 數據已載入[/green]")
        elif choice == "0":
            if Confirm.ask("確定要退出嗎？"):
                console.print("\n[cyan]再見！[/cyan]")
                sys.exit(0)

        if choice not in ["5", "6"]:
            Prompt.ask("\n按 Enter 繼續")


if __name__ == "__main__":
    try:
        main_menu()
    except KeyboardInterrupt:
        console.print("\n\n[cyan]再見！[/cyan]")
        sys.exit(0)
