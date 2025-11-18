"""
电路优化可视化模块
提供各种图表和可视化功能，帮助分析和展示优化结果
"""

from typing import List, Dict, Optional, Tuple, Any
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # 使用非交互式后端
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd
from pathlib import Path


class CircuitVisualizer:
    """电路优化可视化器"""

    def __init__(self, output_dir: str = "output"):
        """
        初始化可视化器

        Args:
            output_dir: 输出目录
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

        # 设置中文字体
        try:
            plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
            plt.rcParams['axes.unicode_minus'] = False
        except:
            pass

    def plot_cost_breakdown(
        self,
        breakdown: Dict[str, float],
        title: str = "BOM 成本分解",
        save_path: Optional[str] = None
    ) -> str:
        """
        绘制成本分解饼图

        Args:
            breakdown: 成本分解字典 {类别: 成本}
            title: 图表标题
            save_path: 保存路径

        Returns:
            保存的文件路径
        """
        if save_path is None:
            save_path = self.output_dir / "cost_breakdown.png"

        fig, ax = plt.subplots(figsize=(10, 8))

        categories = list(breakdown.keys())
        costs = list(breakdown.values())
        total_cost = sum(costs)

        # 创建饼图
        colors = plt.cm.Set3(np.linspace(0, 1, len(categories)))
        wedges, texts, autotexts = ax.pie(
            costs,
            labels=categories,
            autopct=lambda pct: f'{pct:.1f}%\n${pct/100*total_cost:.2f}',
            colors=colors,
            startangle=90
        )

        # 美化文字
        for text in texts:
            text.set_fontsize(10)
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontsize(9)
            autotext.set_weight('bold')

        ax.set_title(f'{title}\n总成本: ${total_cost:.2f}', fontsize=14, weight='bold')

        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"成本分解图已保存到: {save_path}")
        return str(save_path)

    def plot_power_breakdown(
        self,
        breakdown: Dict[str, float],
        title: str = "功耗分解",
        save_path: Optional[str] = None
    ) -> str:
        """
        绘制功耗分解柱状图

        Args:
            breakdown: 功耗分解字典 {类别: 功耗(W)}
            title: 图表标题
            save_path: 保存路径

        Returns:
            保存的文件路径
        """
        if save_path is None:
            save_path = self.output_dir / "power_breakdown.png"

        fig, ax = plt.subplots(figsize=(12, 6))

        categories = list(breakdown.keys())
        powers = [p * 1000 for p in breakdown.values()]  # 转换为 mW
        total_power = sum(powers)

        # 创建柱状图
        bars = ax.bar(categories, powers, color=plt.cm.viridis(np.linspace(0, 1, len(categories))))

        # 添加数值标签
        for i, (bar, power) in enumerate(zip(bars, powers)):
            height = bar.get_height()
            percentage = (power / total_power) * 100 if total_power > 0 else 0
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{power:.1f}mW\n({percentage:.1f}%)',
                   ha='center', va='bottom', fontsize=9)

        ax.set_ylabel('功耗 (mW)', fontsize=12)
        ax.set_title(f'{title}\n总功耗: {total_power:.2f}mW', fontsize=14, weight='bold')
        ax.grid(axis='y', alpha=0.3, linestyle='--')

        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"功耗分解图已保存到: {save_path}")
        return str(save_path)

    def plot_pareto_front(
        self,
        individuals: List[Any],
        objectives: List[str],
        title: str = "Pareto 最优前沿",
        save_path: Optional[str] = None
    ) -> str:
        """
        绘制 Pareto 前沿图（2D 或 3D）

        Args:
            individuals: 个体列表
            objectives: 目标名称列表
            title: 图表标题
            save_path: 保存路径

        Returns:
            保存的文件路径
        """
        if save_path is None:
            save_path = self.output_dir / "pareto_front.html"

        if len(objectives) < 2:
            print("至少需要 2 个目标才能绘制 Pareto 前沿")
            return ""

        # 提取目标值
        data = {obj: [] for obj in objectives}
        for ind in individuals:
            for obj in objectives:
                data[obj].append(abs(ind.objectives[obj]))

        # 创建交互式图表
        if len(objectives) == 2:
            # 2D 散点图
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=data[objectives[0]],
                y=data[objectives[1]],
                mode='markers',
                marker=dict(
                    size=10,
                    color=data[objectives[0]],
                    colorscale='Viridis',
                    showscale=True,
                    colorbar=dict(title=objectives[0])
                ),
                text=[f'{objectives[0]}: {x:.3f}<br>{objectives[1]}: {y:.3f}'
                      for x, y in zip(data[objectives[0]], data[objectives[1]])],
                hoverinfo='text'
            ))

            fig.update_layout(
                title=title,
                xaxis_title=objectives[0],
                yaxis_title=objectives[1],
                hovermode='closest',
                width=800,
                height=600
            )

        elif len(objectives) >= 3:
            # 3D 散点图
            fig = go.Figure()
            fig.add_trace(go.Scatter3d(
                x=data[objectives[0]],
                y=data[objectives[1]],
                z=data[objectives[2]],
                mode='markers',
                marker=dict(
                    size=5,
                    color=data[objectives[0]],
                    colorscale='Viridis',
                    showscale=True,
                    colorbar=dict(title=objectives[0])
                ),
                text=[f'{objectives[0]}: {x:.3f}<br>{objectives[1]}: {y:.3f}<br>{objectives[2]}: {z:.3f}'
                      for x, y, z in zip(data[objectives[0]], data[objectives[1]], data[objectives[2]])],
                hoverinfo='text'
            ))

            fig.update_layout(
                title=title,
                scene=dict(
                    xaxis_title=objectives[0],
                    yaxis_title=objectives[1],
                    zaxis_title=objectives[2]
                ),
                width=900,
                height=700
            )

        fig.write_html(save_path)
        print(f"Pareto 前沿图已保存到: {save_path}")
        return str(save_path)

    def plot_optimization_progress(
        self,
        history: List[Dict[str, float]],
        objectives: List[str],
        save_path: Optional[str] = None
    ) -> str:
        """
        绘制优化进度图

        Args:
            history: 优化历史 [{objective1: value, ...}, ...]
            objectives: 目标名称列表
            save_path: 保存路径

        Returns:
            保存的文件路径
        """
        if save_path is None:
            save_path = self.output_dir / "optimization_progress.png"

        fig, axes = plt.subplots(len(objectives), 1, figsize=(12, 4 * len(objectives)))

        if len(objectives) == 1:
            axes = [axes]

        iterations = list(range(1, len(history) + 1))

        for i, obj in enumerate(objectives):
            values = [h.get(obj, 0) for h in history]

            axes[i].plot(iterations, values, marker='o', linewidth=2, markersize=4)
            axes[i].set_xlabel('迭代次数', fontsize=11)
            axes[i].set_ylabel(obj, fontsize=11)
            axes[i].set_title(f'{obj} 优化进度', fontsize=12, weight='bold')
            axes[i].grid(True, alpha=0.3, linestyle='--')

            # 标记最佳值
            if values:
                best_idx = np.argmin(values) if 'cost' in obj.lower() or 'power' in obj.lower() else np.argmax(values)
                best_val = values[best_idx]
                axes[i].axhline(y=best_val, color='r', linestyle='--', alpha=0.5, label=f'最佳值: {best_val:.3f}')
                axes[i].legend()

        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"优化进度图已保存到: {save_path}")
        return str(save_path)

    def plot_component_comparison(
        self,
        components: List[Dict[str, Any]],
        metrics: List[str] = ['cost', 'power', 'performance'],
        save_path: Optional[str] = None
    ) -> str:
        """
        绘制元件对比雷达图

        Args:
            components: 元件列表 [{name: str, metrics...}, ...]
            metrics: 要比较的指标
            save_path: 保存路径

        Returns:
            保存的文件路径
        """
        if save_path is None:
            save_path = self.output_dir / "component_comparison.html"

        # 创建雷达图
        fig = go.Figure()

        for comp in components:
            values = [comp.get(m, 0) for m in metrics]
            # 闭合雷达图
            values.append(values[0])
            labels = metrics + [metrics[0]]

            fig.add_trace(go.Scatterpolar(
                r=values,
                theta=labels,
                fill='toself',
                name=comp.get('name', 'Unknown')
            ))

        fig.update_layout(
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    range=[0, max([max([c.get(m, 0) for m in metrics]) for c in components])]
                )
            ),
            title="元件性能对比",
            showlegend=True,
            width=700,
            height=600
        )

        fig.write_html(save_path)
        print(f"元件对比图已保存到: {save_path}")
        return str(save_path)

    def create_interactive_dashboard(
        self,
        cost_breakdown: Dict[str, float],
        power_breakdown: Dict[str, float],
        optimization_history: Optional[List[Dict[str, float]]] = None,
        save_path: Optional[str] = None
    ) -> str:
        """
        创建交互式仪表板

        Args:
            cost_breakdown: 成本分解
            power_breakdown: 功耗分解
            optimization_history: 优化历史
            save_path: 保存路径

        Returns:
            保存的文件路径
        """
        if save_path is None:
            save_path = self.output_dir / "dashboard.html"

        # 创建子图
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('成本分解', '功耗分解', '成本趋势', '功耗趋势'),
            specs=[[{'type': 'pie'}, {'type': 'bar'}],
                   [{'type': 'scatter'}, {'type': 'scatter'}]]
        )

        # 1. 成本饼图
        fig.add_trace(
            go.Pie(labels=list(cost_breakdown.keys()),
                   values=list(cost_breakdown.values()),
                   name="成本"),
            row=1, col=1
        )

        # 2. 功耗柱状图
        fig.add_trace(
            go.Bar(x=list(power_breakdown.keys()),
                   y=[p * 1000 for p in power_breakdown.values()],  # 转换为 mW
                   name="功耗"),
            row=1, col=2
        )

        # 3. 和 4. 优化历史（如果有）
        if optimization_history:
            iterations = list(range(1, len(optimization_history) + 1))
            costs = [h.get('cost', 0) for h in optimization_history]
            powers = [h.get('power', 0) for h in optimization_history]

            fig.add_trace(
                go.Scatter(x=iterations, y=costs, mode='lines+markers', name='成本'),
                row=2, col=1
            )

            fig.add_trace(
                go.Scatter(x=iterations, y=powers, mode='lines+markers', name='功耗'),
                row=2, col=2
            )

        # 更新布局
        fig.update_layout(
            title_text="电路优化分析仪表板",
            showlegend=True,
            height=800,
            width=1200
        )

        fig.update_yaxes(title_text="功耗 (mW)", row=1, col=2)
        fig.update_yaxes(title_text="成本 ($)", row=2, col=1)
        fig.update_yaxes(title_text="功耗 (mW)", row=2, col=2)
        fig.update_xaxes(title_text="迭代次数", row=2, col=1)
        fig.update_xaxes(title_text="迭代次数", row=2, col=2)

        fig.write_html(save_path)
        print(f"交互式仪表板已保存到: {save_path}")
        return str(save_path)

    def generate_pdf_report(
        self,
        data: Dict[str, Any],
        save_path: Optional[str] = None
    ) -> str:
        """
        生成 PDF 报告（这里生成 HTML 版本）

        Args:
            data: 报告数据
            save_path: 保存路径

        Returns:
            保存的文件路径
        """
        if save_path is None:
            save_path = self.output_dir / "report.html"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>电路优化报告</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 40px;
                    line-height: 1.6;
                }}
                h1 {{
                    color: #2c3e50;
                    border-bottom: 3px solid #3498db;
                    padding-bottom: 10px;
                }}
                h2 {{
                    color: #34495e;
                    margin-top: 30px;
                }}
                table {{
                    border-collapse: collapse;
                    width: 100%;
                    margin: 20px 0;
                }}
                th, td {{
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }}
                th {{
                    background-color: #3498db;
                    color: white;
                }}
                tr:nth-child(even) {{
                    background-color: #f2f2f2;
                }}
                .summary {{
                    background-color: #ecf0f1;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .metric {{
                    display: inline-block;
                    margin: 10px 20px 10px 0;
                }}
                .metric-value {{
                    font-size: 24px;
                    font-weight: bold;
                    color: #2980b9;
                }}
                .metric-label {{
                    font-size: 14px;
                    color: #7f8c8d;
                }}
            </style>
        </head>
        <body>
            <h1>电路优化分析报告</h1>

            <div class="summary">
                <h2>优化摘要</h2>
                <div class="metric">
                    <div class="metric-value">${data.get('total_cost', 0):.2f}</div>
                    <div class="metric-label">总成本 ($)</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{data.get('total_power', 0)*1000:.2f}</div>
                    <div class="metric-label">总功耗 (mW)</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{data.get('component_count', 0)}</div>
                    <div class="metric-label">元件数量</div>
                </div>
            </div>

            <h2>成本分解</h2>
            <table>
                <tr>
                    <th>类别</th>
                    <th>成本 ($)</th>
                    <th>百分比</th>
                </tr>
        """

        cost_breakdown = data.get('cost_breakdown', {})
        total_cost = sum(cost_breakdown.values()) if cost_breakdown else 1
        for category, cost in cost_breakdown.items():
            percentage = (cost / total_cost) * 100
            html_content += f"""
                <tr>
                    <td>{category}</td>
                    <td>${cost:.2f}</td>
                    <td>{percentage:.1f}%</td>
                </tr>
            """

        html_content += """
            </table>

            <h2>功耗分解</h2>
            <table>
                <tr>
                    <th>类别</th>
                    <th>功耗 (mW)</th>
                    <th>百分比</th>
                </tr>
        """

        power_breakdown = data.get('power_breakdown', {})
        total_power = sum(power_breakdown.values()) if power_breakdown else 1
        for category, power in power_breakdown.items():
            percentage = (power / total_power) * 100
            html_content += f"""
                <tr>
                    <td>{category}</td>
                    <td>{power*1000:.2f}</td>
                    <td>{percentage:.1f}%</td>
                </tr>
            """

        html_content += """
            </table>

            <h2>优化建议</h2>
            <ul>
        """

        recommendations = data.get('recommendations', [])
        for rec in recommendations:
            html_content += f"<li>{rec}</li>"

        if not recommendations:
            html_content += "<li>暂无优化建议</li>"

        html_content += """
            </ul>
        </body>
        </html>
        """

        with open(save_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print(f"HTML 报告已保存到: {save_path}")
        return str(save_path)


def demonstrate_visualizer():
    """演示可视化器"""
    print("=" * 70)
    print("电路优化可视化器示范")
    print("=" * 70 + "\n")

    visualizer = CircuitVisualizer(output_dir="visualization_output")

    # 1. 成本分解图
    print("1. 生成成本分解图...")
    cost_breakdown = {
        'IC': 6.30,
        'Passive': 0.95,
        'Power': 0.30,
        'Connector': 0.50,
        'LED': 0.15
    }
    visualizer.plot_cost_breakdown(cost_breakdown)

    # 2. 功耗分解图
    print("\n2. 生成功耗分解图...")
    power_breakdown = {
        'IC': 0.210,  # W
        'LED': 0.060,
        'Power': 0.003,
        'Sensor': 0.0001
    }
    visualizer.plot_power_breakdown(power_breakdown)

    # 3. 优化进度图
    print("\n3. 生成优化进度图...")
    history = []
    for i in range(50):
        history.append({
            'cost': 10 - 2 * np.exp(-i/10) + np.random.normal(0, 0.1),
            'power': 300 - 50 * np.exp(-i/15) + np.random.normal(0, 5)
        })
    visualizer.plot_optimization_progress(history, ['cost', 'power'])

    # 4. 交互式仪表板
    print("\n4. 生成交互式仪表板...")
    visualizer.create_interactive_dashboard(
        cost_breakdown,
        power_breakdown,
        history
    )

    # 5. PDF 报告
    print("\n5. 生成 HTML 报告...")
    report_data = {
        'total_cost': sum(cost_breakdown.values()),
        'total_power': sum(power_breakdown.values()),
        'component_count': 42,
        'cost_breakdown': cost_breakdown,
        'power_breakdown': power_breakdown,
        'recommendations': [
            '考虑使用更高效的 LED 以降低功耗',
            'IC 成本占比最高，可考虑替代方案',
            '建议添加睡眠模式以延长电池寿命'
        ]
    }
    visualizer.generate_pdf_report(report_data)

    print("\n" + "=" * 70)
    print("所有可视化文件已生成在 visualization_output 目录中")
    print("=" * 70)


if __name__ == "__main__":
    demonstrate_visualizer()
