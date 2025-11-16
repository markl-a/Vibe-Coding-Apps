"""
資源分配系統 - 命令行界面
"""

from resource_allocator import ResourceAllocator, Resource
from rich.console import Console
from rich.table import Table
from datetime import datetime, timedelta

console = Console()


def main():
    """主程序"""
    console.print("[bold cyan]資源分配系統示例[/bold cyan]\n")

    # 創建分配器
    allocator = ResourceAllocator()

    # 添加資源
    console.print("[bold]添加資源...[/bold]")
    allocator.add_resource("張三", ["Python", "Django", "PostgreSQL"], 40)
    allocator.add_resource("李四", ["React", "TypeScript", "Node.js"], 40)
    allocator.add_resource("王五", ["Python", "React", "AWS"], 40)
    allocator.add_resource("趙六", ["Java", "Spring", "MySQL"], 32)
    allocator.add_resource("錢七", ["Python", "FastAPI", "Docker"], 40)

    # 顯示資源池
    table = Table(title="資源池")
    table.add_column("姓名", style="cyan")
    table.add_column("技能", style="green")
    table.add_column("容量/週", style="yellow")

    for resource in allocator.resources.values():
        table.add_row(
            resource.name,
            ", ".join(resource.skills),
            f"{resource.capacity_per_week}h"
        )

    console.print(table)

    # 添加專案需求
    console.print("\n[bold]添加專案需求...[/bold]")
    start_date = datetime.now()
    end_date = start_date + timedelta(weeks=4)

    projects = [
        ("電商平台後端", ["Python", "Django"], 120),
        ("移動應用前端", ["React", "TypeScript"], 80),
        ("數據處理服務", ["Python", "AWS"], 100),
        ("API 網關", ["Java", "Spring"], 64),
    ]

    for i, (name, skills, hours) in enumerate(projects, 1):
        proj_id = f"proj_{i:03d}"
        allocator.add_project_demand(
            proj_id,
            skills,
            hours,
            start_date,
            end_date,
            priority=i
        )
        console.print(f"  ✓ {name}: {hours}h, 需要技能: {', '.join(skills)}")

    # 執行資源分配
    console.print("\n[bold]執行資源分配（平衡策略）...[/bold]\n")

    for proj_id, demand in allocator.projects.items():
        result = allocator.allocate_resources(proj_id, strategy="balanced")

        console.print(f"[cyan]{demand.project_id}:[/cyan]")
        console.print(f"  狀態: {'✓ 成功' if result['success'] else '✗ 失敗'}")
        console.print(f"  已分配: {result['total_allocated']:.1f} / {demand.required_hours}h")

        if result['allocated_resources']:
            console.print(f"  分配資源:")
            for res in result['allocated_resources']:
                console.print(
                    f"    - {res['resource_name']}: {res['allocated_hours']:.1f}h "
                    f"({res['utilization']:.1f}% 利用率)"
                )

        if result['remaining_hours'] > 0:
            console.print(f"  [yellow]⚠ 尚缺: {result['remaining_hours']:.1f}h[/yellow]")

        console.print()

    # 資源利用率分析
    console.print("[bold]資源利用率分析:[/bold]\n")

    util_table = Table()
    util_table.add_column("資源", style="cyan")
    util_table.add_column("利用率", style="yellow")
    util_table.add_column("狀態", style="green")

    utilization = allocator.get_resource_utilization()
    for name, util in utilization.items():
        status = "理想" if 70 <= util <= 90 else ("低" if util < 70 else "過載")
        color = "green" if status == "理想" else ("yellow" if status == "低" else "red")

        util_table.add_row(
            name,
            f"{util:.1f}%",
            f"[{color}]{status}[/{color}]"
        )

    console.print(util_table)

    # 檢測過度分配
    over_alloc = allocator.detect_over_allocation()
    if over_alloc:
        console.print("\n[bold red]⚠ 過度分配警告:[/bold red]")
        for item in over_alloc:
            console.print(
                f"  {item['resource_name']}: "
                f"容量 {item['capacity']}h, "
                f"已分配 {item['allocated']:.1f}h, "
                f"超出 {item['over_by']:.1f}h"
            )
    else:
        console.print("\n[green]✓ 無過度分配問題[/green]")

    # 導出數據
    allocator.export_to_json("resource_allocation.json")
    console.print("\n[green]✓ 數據已導出到 resource_allocation.json[/green]")


if __name__ == "__main__":
    main()
