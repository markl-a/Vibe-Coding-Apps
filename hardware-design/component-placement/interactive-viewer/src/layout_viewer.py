"""
互動式佈局視覺化工具
"""

import numpy as np
import json
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict


@dataclass
class Component:
    """元件資料類別"""
    name: str
    size: Tuple[float, float]
    position: Tuple[float, float]
    power: float = 0.0
    category: str = "default"


@dataclass
class Connection:
    """連接資料類別"""
    comp1: str
    comp2: str
    weight: float = 1.0


class LayoutViewer:
    """佈局視覺化器"""

    def __init__(self, board_size: Tuple[float, float] = (100, 80)):
        """
        初始化視覺化器

        Args:
            board_size: 板子大小 (width, height) in mm
        """
        self.board_size = board_size
        self.components: Dict[str, Component] = {}
        self.connections: List[Connection] = []

    def add_component(self, name: str, size: Tuple[float, float],
                     position: Tuple[float, float],
                     power: float = 0.0, category: str = "default"):
        """添加元件"""
        self.components[name] = Component(name, size, position, power, category)

    def add_connection(self, comp1: str, comp2: str, weight: float = 1.0):
        """添加連接"""
        self.connections.append(Connection(comp1, comp2, weight))

    def load_from_dict(self, data: Dict[str, Any]):
        """從字典載入佈局"""
        if 'board_size' in data:
            self.board_size = tuple(data['board_size'])

        if 'components' in data:
            for comp_data in data['components']:
                self.add_component(
                    comp_data['name'],
                    tuple(comp_data['size']),
                    tuple(comp_data['position']),
                    comp_data.get('power', 0.0),
                    comp_data.get('category', 'default')
                )

        if 'connections' in data:
            for conn_data in data['connections']:
                self.add_connection(
                    conn_data['comp1'],
                    conn_data['comp2'],
                    conn_data.get('weight', 1.0)
                )

    def load_from_json(self, filepath: str):
        """從 JSON 檔案載入佈局"""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.load_from_dict(data)

    def save_to_json(self, filepath: str):
        """儲存佈局到 JSON 檔案"""
        data = {
            'board_size': list(self.board_size),
            'components': [
                {
                    'name': comp.name,
                    'size': list(comp.size),
                    'position': list(comp.position),
                    'power': comp.power,
                    'category': comp.category
                }
                for comp in self.components.values()
            ],
            'connections': [
                {
                    'comp1': conn.comp1,
                    'comp2': conn.comp2,
                    'weight': conn.weight
                }
                for conn in self.connections
            ]
        }

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def show_matplotlib(self, save_path: Optional[str] = None):
        """使用 Matplotlib 顯示基本視圖"""
        try:
            import matplotlib.pyplot as plt
            import matplotlib.patches as patches

            fig, ax = plt.subplots(figsize=(12, 10))

            # 繪製板子邊界
            ax.add_patch(patches.Rectangle(
                (0, 0), self.board_size[0], self.board_size[1],
                fill=False, edgecolor='black', linewidth=2
            ))

            # 顏色映射
            categories = list(set(comp.category for comp in self.components.values()))
            colors = plt.cm.Set3(np.linspace(0, 1, len(categories)))
            category_colors = dict(zip(categories, colors))

            # 繪製連接線（先繪製，在底層）
            for conn in self.connections:
                if conn.comp1 in self.components and conn.comp2 in self.components:
                    comp1 = self.components[conn.comp1]
                    comp2 = self.components[conn.comp2]

                    x1 = comp1.position[0] + comp1.size[0] / 2
                    y1 = comp1.position[1] + comp1.size[1] / 2
                    x2 = comp2.position[0] + comp2.size[0] / 2
                    y2 = comp2.position[1] + comp2.size[1] / 2

                    # 線寬根據權重
                    linewidth = 0.5 + conn.weight * 0.5

                    ax.plot([x1, x2], [y1, y2], 'b-', alpha=0.2, linewidth=linewidth)

            # 繪製元件
            for comp in self.components.values():
                x, y = comp.position
                w, h = comp.size

                color = category_colors[comp.category]

                # 元件矩形
                ax.add_patch(patches.Rectangle(
                    (x, y), w, h,
                    facecolor=color, edgecolor='black', alpha=0.7, linewidth=1.5
                ))

                # 標籤
                label = comp.name
                if comp.power > 0:
                    label += f"\n{comp.power:.1f}W"

                ax.text(x + w/2, y + h/2, label,
                       ha='center', va='center', fontsize=8, fontweight='bold',
                       bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8))

            # 計算統計資訊
            total_wire_length = self._calculate_total_wire_length()
            num_components = len(self.components)
            num_connections = len(self.connections)

            # 添加統計資訊
            stats_text = f"元件數: {num_components}\n"
            stats_text += f"連接數: {num_connections}\n"
            stats_text += f"總連線長度: {total_wire_length:.1f} mm"

            ax.text(0.02, 0.98, stats_text,
                   transform=ax.transAxes,
                   verticalalignment='top',
                   bbox=dict(boxstyle='round', facecolor='lightyellow', alpha=0.8),
                   fontsize=9)

            ax.set_xlim(-5, self.board_size[0] + 5)
            ax.set_ylim(-5, self.board_size[1] + 5)
            ax.set_aspect('equal')
            ax.set_xlabel('X (mm)', fontsize=10)
            ax.set_ylabel('Y (mm)', fontsize=10)
            ax.set_title('PCB 元件佈局', fontsize=12, fontweight='bold')
            ax.grid(True, alpha=0.3)

            plt.tight_layout()

            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                print(f"圖片已儲存到: {save_path}")
            else:
                plt.show()

            plt.close()

        except ImportError:
            print("需要安裝 matplotlib 才能顯示視圖")

    def show_plotly(self, save_path: Optional[str] = None):
        """使用 Plotly 顯示互動視圖"""
        try:
            import plotly.graph_objects as go
            from plotly.subplots import make_subplots

            fig = go.Figure()

            # 添加板子邊界
            fig.add_trace(go.Scatter(
                x=[0, self.board_size[0], self.board_size[0], 0, 0],
                y=[0, 0, self.board_size[1], self.board_size[1], 0],
                mode='lines',
                line=dict(color='black', width=2),
                name='Board',
                hoverinfo='skip'
            ))

            # 添加連接線
            for conn in self.connections:
                if conn.comp1 in self.components and conn.comp2 in self.components:
                    comp1 = self.components[conn.comp1]
                    comp2 = self.components[conn.comp2]

                    x1 = comp1.position[0] + comp1.size[0] / 2
                    y1 = comp1.position[1] + comp1.size[1] / 2
                    x2 = comp2.position[0] + comp2.size[0] / 2
                    y2 = comp2.position[1] + comp2.size[1] / 2

                    fig.add_trace(go.Scatter(
                        x=[x1, x2],
                        y=[y1, y2],
                        mode='lines',
                        line=dict(color='lightblue', width=1),
                        showlegend=False,
                        hoverinfo='text',
                        hovertext=f"{conn.comp1} ↔ {conn.comp2}<br>權重: {conn.weight:.1f}"
                    ))

            # 添加元件
            categories = list(set(comp.category for comp in self.components.values()))

            for category in categories:
                comps = [c for c in self.components.values() if c.category == category]

                for comp in comps:
                    x, y = comp.position
                    w, h = comp.size

                    # 元件矩形（使用 shape）
                    fig.add_shape(
                        type="rect",
                        x0=x, y0=y, x1=x+w, y1=y+h,
                        line=dict(color="black", width=1),
                        fillcolor="lightblue",
                        opacity=0.7
                    )

                    # 元件標籤
                    hover_text = f"{comp.name}<br>"
                    hover_text += f"大小: {comp.size[0]:.1f} × {comp.size[1]:.1f} mm<br>"
                    hover_text += f"位置: ({comp.position[0]:.1f}, {comp.position[1]:.1f})<br>"
                    if comp.power > 0:
                        hover_text += f"功耗: {comp.power:.1f} W"

                    fig.add_trace(go.Scatter(
                        x=[x + w/2],
                        y=[y + h/2],
                        mode='markers+text',
                        marker=dict(size=10, color='rgba(0,0,0,0)'),
                        text=comp.name,
                        textposition='middle center',
                        textfont=dict(size=8, color='black'),
                        name=category,
                        legendgroup=category,
                        showlegend=(comp == comps[0]),
                        hoverinfo='text',
                        hovertext=hover_text
                    ))

            fig.update_layout(
                title='PCB 元件佈局 - 互動視圖',
                xaxis=dict(title='X (mm)', range=[-5, self.board_size[0]+5]),
                yaxis=dict(title='Y (mm)', range=[-5, self.board_size[1]+5], scaleanchor="x", scaleratio=1),
                hovermode='closest',
                showlegend=True,
                width=1000,
                height=800
            )

            if save_path:
                if save_path.endswith('.html'):
                    fig.write_html(save_path)
                    print(f"互動 HTML 已儲存到: {save_path}")
                else:
                    fig.write_image(save_path)
                    print(f"圖片已儲存到: {save_path}")
            else:
                fig.show()

        except ImportError as e:
            print(f"需要安裝 plotly 才能顯示互動視圖: {e}")

    def show_statistics(self, save_path: Optional[str] = None):
        """顯示統計分析"""
        try:
            import matplotlib.pyplot as plt

            # 計算統計資訊
            wire_lengths = []
            for conn in self.connections:
                if conn.comp1 in self.components and conn.comp2 in self.components:
                    comp1 = self.components[conn.comp1]
                    comp2 = self.components[conn.comp2]

                    x1 = comp1.position[0] + comp1.size[0] / 2
                    y1 = comp1.position[1] + comp1.size[1] / 2
                    x2 = comp2.position[0] + comp2.size[0] / 2
                    y2 = comp2.position[1] + comp2.size[1] / 2

                    length = np.sqrt((x2-x1)**2 + (y2-y1)**2)
                    wire_lengths.append(length)

            component_sizes = [comp.size[0] * comp.size[1] for comp in self.components.values()]
            power_values = [comp.power for comp in self.components.values() if comp.power > 0]

            fig, axes = plt.subplots(2, 2, figsize=(14, 10))

            # 1. 連線長度分佈
            axes[0, 0].hist(wire_lengths, bins=20, edgecolor='black', alpha=0.7)
            axes[0, 0].set_xlabel('連線長度 (mm)')
            axes[0, 0].set_ylabel('數量')
            axes[0, 0].set_title('連線長度分佈')
            axes[0, 0].grid(True, alpha=0.3)

            # 2. 元件大小分佈
            axes[0, 1].hist(component_sizes, bins=15, edgecolor='black', alpha=0.7, color='green')
            axes[0, 1].set_xlabel('元件面積 (mm²)')
            axes[0, 1].set_ylabel('數量')
            axes[0, 1].set_title('元件大小分佈')
            axes[0, 1].grid(True, alpha=0.3)

            # 3. 功耗分佈
            if power_values:
                axes[1, 0].bar(range(len(power_values)), sorted(power_values, reverse=True),
                              edgecolor='black', alpha=0.7, color='red')
                axes[1, 0].set_xlabel('元件索引')
                axes[1, 0].set_ylabel('功耗 (W)')
                axes[1, 0].set_title('元件功耗分佈')
                axes[1, 0].grid(True, alpha=0.3)
            else:
                axes[1, 0].text(0.5, 0.5, '無功耗資訊',
                               ha='center', va='center', fontsize=12)
                axes[1, 0].set_title('元件功耗分佈')

            # 4. 統計摘要
            axes[1, 1].axis('off')
            stats_text = "=== 統計摘要 ===\n\n"
            stats_text += f"元件總數: {len(self.components)}\n"
            stats_text += f"連接總數: {len(self.connections)}\n\n"

            if wire_lengths:
                stats_text += f"總連線長度: {sum(wire_lengths):.1f} mm\n"
                stats_text += f"平均連線長度: {np.mean(wire_lengths):.1f} mm\n"
                stats_text += f"最長連線: {max(wire_lengths):.1f} mm\n"
                stats_text += f"最短連線: {min(wire_lengths):.1f} mm\n\n"

            if power_values:
                stats_text += f"總功耗: {sum(power_values):.2f} W\n"
                stats_text += f"平均功耗: {np.mean(power_values):.2f} W\n"
                stats_text += f"最高功耗: {max(power_values):.2f} W\n"

            axes[1, 1].text(0.1, 0.9, stats_text,
                           verticalalignment='top',
                           fontfamily='monospace',
                           fontsize=11)

            plt.suptitle('PCB 佈局統計分析', fontsize=14, fontweight='bold')
            plt.tight_layout()

            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                print(f"統計圖已儲存到: {save_path}")
            else:
                plt.show()

            plt.close()

        except ImportError:
            print("需要安裝 matplotlib 才能顯示統計分析")

    def _calculate_total_wire_length(self) -> float:
        """計算總連線長度"""
        total = 0.0
        for conn in self.connections:
            if conn.comp1 in self.components and conn.comp2 in self.components:
                comp1 = self.components[conn.comp1]
                comp2 = self.components[conn.comp2]

                x1 = comp1.position[0] + comp1.size[0] / 2
                y1 = comp1.position[1] + comp1.size[1] / 2
                x2 = comp2.position[0] + comp2.size[0] / 2
                y2 = comp2.position[1] + comp2.size[1] / 2

                length = np.sqrt((x2-x1)**2 + (y2-y1)**2)
                total += length * conn.weight

        return total

    def print_summary(self):
        """列印摘要資訊"""
        print("=== PCB 佈局摘要 ===")
        print(f"板子大小: {self.board_size[0]} × {self.board_size[1]} mm")
        print(f"元件數量: {len(self.components)}")
        print(f"連接數量: {len(self.connections)}")
        print(f"總連線長度: {self._calculate_total_wire_length():.2f} mm")

        total_power = sum(comp.power for comp in self.components.values())
        if total_power > 0:
            print(f"總功耗: {total_power:.2f} W")

        print("\n元件列表:")
        for comp in sorted(self.components.values(), key=lambda c: c.name):
            print(f"  {comp.name:12s}: {comp.size[0]:5.1f} × {comp.size[1]:5.1f} mm @ "
                  f"({comp.position[0]:6.2f}, {comp.position[1]:6.2f})")
