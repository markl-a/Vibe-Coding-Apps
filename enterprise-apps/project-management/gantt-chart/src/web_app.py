"""
甘特圖時程管理工具 - Web 界面
使用 Plotly 和 Dash 創建互動式甘特圖
"""

from gantt_chart import GanttChart, GanttTask
import plotly.figure_factory as ff
import plotly.graph_objects as go
from datetime import datetime, timedelta
import pandas as pd


def create_interactive_gantt(gantt: GanttChart):
    """創建互動式甘特圖"""
    if not gantt.tasks:
        print("尚無任務")
        return None

    # 計算排程
    gantt.calculate_schedule()

    # 準備數據
    tasks_data = []
    for task in gantt.tasks.values():
        tasks_data.append({
            'Task': task.name,
            'Start': task.start_date,
            'Finish': task.end_date,
            'Resource': task.assignee or '未分配',
            'Complete': task.progress,
            'Critical': task.is_critical,
            'Milestone': task.is_milestone
        })

    df = pd.DataFrame(tasks_data)

    # 根據任務類型設置顏色
    colors = {}
    for _, row in df.iterrows():
        if row['Critical']:
            colors[row['Task']] = 'rgb(220, 53, 69)'  # 紅色 - 關鍵任務
        elif row['Milestone']:
            colors[row['Task']] = 'rgb(40, 167, 69)'  # 綠色 - 里程碑
        else:
            colors[row['Task']] = 'rgb(0, 123, 255)'  # 藍色 - 普通任務

    # 創建甘特圖
    fig = ff.create_gantt(
        df,
        colors=colors,
        index_col='Resource',
        show_colorbar=True,
        showgrid_x=True,
        showgrid_y=True,
        group_tasks=True
    )

    # 更新布局
    fig.update_layout(
        title={
            'text': f"{gantt.project_name} - 甘特圖",
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 24}
        },
        xaxis_title="日期",
        yaxis_title="任務",
        height=max(500, len(gantt.tasks) * 50),
        hovermode='closest',
        showlegend=True
    )

    # 添加里程碑標記
    for name, task_id in gantt.milestones.items():
        task = gantt.tasks[task_id]
        fig.add_trace(go.Scatter(
            x=[task.end_date],
            y=[task.name],
            mode='markers+text',
            marker=dict(
                size=20,
                symbol='diamond',
                color='gold',
                line=dict(width=2, color='darkgoldenrod')
            ),
            text=[f"📍 {name}"],
            textposition="top center",
            name=f'里程碑: {name}',
            showlegend=True,
            hovertemplate=f"<b>{name}</b><br>完成日期: {task.end_date.strftime('%Y-%m-%d')}<extra></extra>"
        ))

    # 添加進度條
    for task in gantt.tasks.values():
        if task.progress > 0 and task.start_date and task.end_date:
            progress_duration = (task.end_date - task.start_date).days * (task.progress / 100)
            progress_end = task.start_date + timedelta(days=progress_duration)

            fig.add_trace(go.Scatter(
                x=[task.start_date, progress_end],
                y=[task.name, task.name],
                mode='lines',
                line=dict(color='green', width=10),
                name=f'{task.name} 進度',
                showlegend=False,
                hovertemplate=f"<b>{task.name}</b><br>進度: {task.progress}%<extra></extra>"
            ))

    # 添加依賴關係箭頭（視覺化）
    for task in gantt.tasks.values():
        for dep in task.dependencies:
            pred_task = gantt.tasks.get(dep['predecessor_id'])
            if pred_task and pred_task.end_date and task.start_date:
                fig.add_annotation(
                    x=pred_task.end_date,
                    y=pred_task.name,
                    ax=task.start_date,
                    ay=task.name,
                    xref='x',
                    yref='y',
                    axref='x',
                    ayref='y',
                    showarrow=True,
                    arrowhead=2,
                    arrowsize=1,
                    arrowwidth=1.5,
                    arrowcolor='gray',
                    opacity=0.5
                )

    # 高亮今天的日期
    today = datetime.now()
    fig.add_vline(
        x=today,
        line_dash="dash",
        line_color="red",
        annotation_text="今天",
        annotation_position="top"
    )

    return fig


def main():
    """主程序"""
    # 創建示例專案
    gantt = GanttChart("網站開發專案", "2025-01-15")

    # 添加任務
    task1 = gantt.add_task("需求分析", 5, assignee="產品經理")
    task2 = gantt.add_task("UI 設計", 7, assignee="設計師")
    task3 = gantt.add_task("前端開發", 10, assignee="前端工程師")
    task4 = gantt.add_task("後端開發", 12, assignee="後端工程師")
    task5 = gantt.add_task("數據庫設計", 4, assignee="DBA")
    task6 = gantt.add_task("API 開發", 8, assignee="後端工程師")
    task7 = gantt.add_task("整合測試", 5, assignee="測試工程師")
    task8 = gantt.add_task("性能優化", 3, assignee="後端工程師")
    task9 = gantt.add_task("用戶驗收測試", 4, assignee="產品經理")
    task10 = gantt.add_task("部署上線", 2, assignee="運維工程師")

    # 添加依賴關係
    gantt.add_dependency(task1, task2, "FS")
    gantt.add_dependency(task2, task3, "FS")
    gantt.add_dependency(task1, task5, "FS")
    gantt.add_dependency(task5, task6, "FS")
    gantt.add_dependency(task6, task4, "SS", lag=2)
    gantt.add_dependency(task3, task7, "FS")
    gantt.add_dependency(task4, task7, "FS")
    gantt.add_dependency(task7, task8, "FS")
    gantt.add_dependency(task8, task9, "FS")
    gantt.add_dependency(task9, task10, "FS")

    # 添加里程碑
    gantt.add_milestone("設計完成", task2)
    gantt.add_milestone("開發完成", task4)
    gantt.add_milestone("測試完成", task9)
    gantt.add_milestone("專案上線", task10)

    # 更新一些任務的進度
    gantt.update_progress(task1, 100)
    gantt.update_progress(task2, 80)
    gantt.update_progress(task5, 100)
    gantt.update_progress(task6, 60)
    gantt.update_progress(task3, 40)

    # 計算關鍵路徑
    critical_path = gantt.calculate_critical_path()

    print(f"專案: {gantt.project_name}")
    print(f"總工期: {gantt.get_project_duration()} 天")
    print(f"專案開始: {gantt.project_start_date.date()}")
    print(f"\n關鍵路徑:")
    for task in critical_path:
        print(f"  - {task.name} ({task.duration}天)")

    # 創建並顯示甘特圖
    fig = create_interactive_gantt(gantt)

    if fig:
        # 保存為 HTML
        fig.write_html("interactive_gantt.html")
        print("\n✓ 互動式甘特圖已保存到 interactive_gantt.html")

        # 在瀏覽器中打開
        try:
            fig.show()
        except:
            print("無法自動打開瀏覽器，請手動打開 interactive_gantt.html")

    # 導出數據
    gantt.export_to_json("project_data.json")
    print("✓ 專案數據已導出到 project_data.json")


if __name__ == "__main__":
    main()
