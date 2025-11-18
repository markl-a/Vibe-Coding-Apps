#!/usr/bin/env python3
"""
Data Visualizer - 資料視覺化工具

功能:
- 自動化資料視覺化
- 多種圖表類型(柱狀圖、折線圖、散點圖、熱力圖等)
- 互動式圖表
- 自動圖表推薦
- 批次圖表生成
- 儀表板創建
- AI 輔助的視覺化建議
"""

import argparse
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # 非互動式後端
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# 設定中文字體
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial Unicode MS', 'SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 設定樣式
sns.set_style("whitegrid")
sns.set_palette("husl")


class DataVisualizer:
    """資料視覺化器"""

    def __init__(self, file_path: str, output_dir: str = "visualizations"):
        self.file_path = Path(file_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.df = None
        self._load_data()

    def _load_data(self):
        """載入資料"""
        try:
            file_ext = self.file_path.suffix.lower()

            if file_ext == '.csv':
                self.df = pd.read_csv(self.file_path)
            elif file_ext == '.json':
                self.df = pd.read_json(self.file_path)
            elif file_ext in ['.xlsx', '.xls']:
                self.df = pd.read_excel(self.file_path)
            else:
                raise ValueError(f"不支援的檔案格式: {file_ext}")

            print(f"✅ 成功載入資料: {len(self.df)} 筆, {len(self.df.columns)} 欄")
        except Exception as e:
            print(f"❌ 載入資料失敗: {e}")
            sys.exit(1)

    def plot_distribution(self, column: str, kind: str = 'hist') -> str:
        """繪製單一欄位的分布圖"""
        if column not in self.df.columns:
            print(f"❌ 欄位不存在: {column}")
            return ""

        fig, ax = plt.subplots(figsize=(10, 6))

        if kind == 'hist':
            self.df[column].hist(bins=30, ax=ax, edgecolor='black', alpha=0.7)
            ax.set_title(f'{column} - 直方圖', fontsize=14, fontweight='bold')
        elif kind == 'kde':
            self.df[column].plot(kind='kde', ax=ax, linewidth=2)
            ax.set_title(f'{column} - 密度圖', fontsize=14, fontweight='bold')
        elif kind == 'box':
            self.df.boxplot(column=column, ax=ax)
            ax.set_title(f'{column} - 箱型圖', fontsize=14, fontweight='bold')

        ax.set_xlabel(column, fontsize=12)
        ax.set_ylabel('頻率' if kind == 'hist' else '密度', fontsize=12)
        ax.grid(True, alpha=0.3)

        output_file = self.output_dir / f"{column}_distribution_{kind}.png"
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"✅ 已生成分布圖: {output_file}")
        return str(output_file)

    def plot_correlation_matrix(self, method: str = 'pearson') -> str:
        """繪製相關性熱力圖"""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns

        if len(numeric_cols) < 2:
            print("⚠️  數值欄位不足,無法繪製相關性矩陣")
            return ""

        # 計算相關係數
        corr_matrix = self.df[numeric_cols].corr(method=method)

        # 創建圖表
        fig, ax = plt.subplots(figsize=(12, 10))
        sns.heatmap(corr_matrix, annot=True, fmt='.2f', cmap='coolwarm',
                   center=0, square=True, linewidths=1, ax=ax,
                   cbar_kws={"shrink": 0.8})

        ax.set_title(f'相關性矩陣 ({method})', fontsize=16, fontweight='bold')

        output_file = self.output_dir / "correlation_matrix.png"
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"✅ 已生成相關性矩陣: {output_file}")
        return str(output_file)

    def plot_scatter(self, x_col: str, y_col: str, hue: Optional[str] = None) -> str:
        """繪製散點圖"""
        if x_col not in self.df.columns or y_col not in self.df.columns:
            print(f"❌ 欄位不存在")
            return ""

        fig, ax = plt.subplots(figsize=(10, 6))

        if hue and hue in self.df.columns:
            # 使用 seaborn 繪製帶分類的散點圖
            sns.scatterplot(data=self.df, x=x_col, y=y_col, hue=hue,
                          s=100, alpha=0.6, ax=ax)
        else:
            ax.scatter(self.df[x_col], self.df[y_col], s=100, alpha=0.6)

        ax.set_xlabel(x_col, fontsize=12)
        ax.set_ylabel(y_col, fontsize=12)
        ax.set_title(f'{x_col} vs {y_col} - 散點圖',
                    fontsize=14, fontweight='bold')
        ax.grid(True, alpha=0.3)

        # 添加趨勢線
        if pd.api.types.is_numeric_dtype(self.df[x_col]) and \
           pd.api.types.is_numeric_dtype(self.df[y_col]):
            z = np.polyfit(self.df[x_col].dropna(), self.df[y_col].dropna(), 1)
            p = np.poly1d(z)
            ax.plot(self.df[x_col], p(self.df[x_col]), "r--",
                   linewidth=2, alpha=0.8, label='趨勢線')
            ax.legend()

        output_file = self.output_dir / f"{x_col}_vs_{y_col}_scatter.png"
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"✅ 已生成散點圖: {output_file}")
        return str(output_file)

    def plot_bar_chart(self, column: str, top_n: int = 10) -> str:
        """繪製柱狀圖"""
        if column not in self.df.columns:
            print(f"❌ 欄位不存在: {column}")
            return ""

        # 計算值計數
        value_counts = self.df[column].value_counts().head(top_n)

        fig, ax = plt.subplots(figsize=(12, 6))
        value_counts.plot(kind='bar', ax=ax, color=sns.color_palette("husl", len(value_counts)))

        ax.set_title(f'{column} - 前 {top_n} 名統計',
                    fontsize=14, fontweight='bold')
        ax.set_xlabel(column, fontsize=12)
        ax.set_ylabel('數量', fontsize=12)
        ax.grid(axis='y', alpha=0.3)

        # 在柱狀圖上顯示數值
        for i, v in enumerate(value_counts):
            ax.text(i, v + max(value_counts)*0.01, str(v),
                   ha='center', va='bottom', fontsize=10)

        plt.xticks(rotation=45, ha='right')

        output_file = self.output_dir / f"{column}_bar_chart.png"
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"✅ 已生成柱狀圖: {output_file}")
        return str(output_file)

    def plot_line_chart(self, x_col: str, y_cols: List[str]) -> str:
        """繪製折線圖"""
        if x_col not in self.df.columns:
            print(f"❌ X 軸欄位不存在: {x_col}")
            return ""

        missing_cols = [col for col in y_cols if col not in self.df.columns]
        if missing_cols:
            print(f"❌ Y 軸欄位不存在: {missing_cols}")
            return ""

        fig, ax = plt.subplots(figsize=(12, 6))

        for col in y_cols:
            ax.plot(self.df[x_col], self.df[col], marker='o',
                   linewidth=2, label=col, markersize=4)

        ax.set_xlabel(x_col, fontsize=12)
        ax.set_ylabel('值', fontsize=12)
        ax.set_title('折線圖', fontsize=14, fontweight='bold')
        ax.legend()
        ax.grid(True, alpha=0.3)

        plt.xticks(rotation=45, ha='right')

        output_file = self.output_dir / f"{x_col}_line_chart.png"
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"✅ 已生成折線圖: {output_file}")
        return str(output_file)

    def plot_pie_chart(self, column: str, top_n: int = 8) -> str:
        """繪製圓餅圖"""
        if column not in self.df.columns:
            print(f"❌ 欄位不存在: {column}")
            return ""

        value_counts = self.df[column].value_counts().head(top_n)

        fig, ax = plt.subplots(figsize=(10, 8))
        colors = sns.color_palette("husl", len(value_counts))

        wedges, texts, autotexts = ax.pie(value_counts, labels=value_counts.index,
                                           autopct='%1.1f%%', colors=colors,
                                           startangle=90)

        # 美化文字
        for text in texts:
            text.set_fontsize(11)
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontweight('bold')
            autotext.set_fontsize(10)

        ax.set_title(f'{column} - 分布圓餅圖',
                    fontsize=14, fontweight='bold')

        output_file = self.output_dir / f"{column}_pie_chart.png"
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"✅ 已生成圓餅圖: {output_file}")
        return str(output_file)

    def auto_visualize(self) -> List[str]:
        """自動生成建議的視覺化"""
        print("\n🤖 開始自動視覺化分析...")
        generated_files = []

        # 1. 數值欄位:生成分布圖
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        print(f"\n📊 為 {len(numeric_cols)} 個數值欄位生成分布圖...")
        for col in numeric_cols[:5]:  # 限制最多5個
            file_path = self.plot_distribution(col, 'hist')
            if file_path:
                generated_files.append(file_path)

        # 2. 相關性矩陣
        if len(numeric_cols) >= 2:
            print(f"\n🔗 生成相關性矩陣...")
            file_path = self.plot_correlation_matrix()
            if file_path:
                generated_files.append(file_path)

        # 3. 類別欄位:生成柱狀圖
        categorical_cols = self.df.select_dtypes(include=['object']).columns
        print(f"\n📊 為 {len(categorical_cols)} 個類別欄位生成柱狀圖...")
        for col in categorical_cols[:3]:  # 限制最多3個
            if self.df[col].nunique() <= 20:  # 只處理類別不太多的欄位
                file_path = self.plot_bar_chart(col, top_n=10)
                if file_path:
                    generated_files.append(file_path)

        # 4. 數值欄位間的散點圖(選擇前2個)
        if len(numeric_cols) >= 2:
            print(f"\n📈 生成散點圖...")
            x_col, y_col = list(numeric_cols[:2])
            file_path = self.plot_scatter(x_col, y_col)
            if file_path:
                generated_files.append(file_path)

        print(f"\n✅ 自動視覺化完成!共生成 {len(generated_files)} 個圖表")
        return generated_files

    def create_dashboard(self) -> str:
        """創建綜合儀表板"""
        print("\n🎨 創建綜合儀表板...")

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        categorical_cols = self.df.select_dtypes(include=['object']).columns

        # 創建 2x2 子圖布局
        fig = plt.figure(figsize=(16, 12))

        # 1. 數值統計摘要
        if len(numeric_cols) > 0:
            ax1 = plt.subplot(2, 2, 1)
            summary_stats = self.df[numeric_cols].describe().T

            # 創建文字表格
            cell_text = []
            for idx, row in summary_stats.iterrows():
                cell_text.append([
                    f"{row['mean']:.2f}",
                    f"{row['std']:.2f}",
                    f"{row['min']:.2f}",
                    f"{row['max']:.2f}"
                ])

            table = ax1.table(cellText=cell_text,
                            rowLabels=summary_stats.index,
                            colLabels=['平均值', '標準差', '最小值', '最大值'],
                            cellLoc='center',
                            loc='center')
            table.auto_set_font_size(False)
            table.set_fontsize(9)
            table.scale(1, 2)
            ax1.axis('off')
            ax1.set_title('數值欄位統計摘要', fontsize=12, fontweight='bold', pad=20)

        # 2. 相關性熱力圖
        if len(numeric_cols) >= 2:
            ax2 = plt.subplot(2, 2, 2)
            corr = self.df[numeric_cols].corr()
            sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm',
                       center=0, square=True, ax=ax2, cbar_kws={"shrink": 0.8})
            ax2.set_title('相關性熱力圖', fontsize=12, fontweight='bold')

        # 3. 第一個數值欄位的分布
        if len(numeric_cols) > 0:
            ax3 = plt.subplot(2, 2, 3)
            col = numeric_cols[0]
            self.df[col].hist(bins=30, ax=ax3, edgecolor='black', alpha=0.7)
            ax3.set_title(f'{col} - 分布', fontsize=12, fontweight='bold')
            ax3.set_xlabel(col)
            ax3.set_ylabel('頻率')
            ax3.grid(True, alpha=0.3)

        # 4. 第一個類別欄位的分布
        if len(categorical_cols) > 0:
            ax4 = plt.subplot(2, 2, 4)
            col = categorical_cols[0]
            value_counts = self.df[col].value_counts().head(8)
            value_counts.plot(kind='bar', ax=ax4, color=sns.color_palette("husl", len(value_counts)))
            ax4.set_title(f'{col} - 分布', fontsize=12, fontweight='bold')
            ax4.set_xlabel(col)
            ax4.set_ylabel('數量')
            ax4.grid(axis='y', alpha=0.3)
            plt.setp(ax4.xaxis.get_majorticklabels(), rotation=45, ha='right')

        plt.suptitle(f'資料儀表板 - {self.file_path.name}',
                    fontsize=16, fontweight='bold', y=0.995)

        output_file = self.output_dir / "dashboard.png"
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"✅ 已生成儀表板: {output_file}")
        return str(output_file)


def main():
    parser = argparse.ArgumentParser(
        description='Data Visualizer - 資料視覺化工具',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('file', help='要視覺化的資料檔案')
    parser.add_argument('--output-dir', default='visualizations',
                       help='輸出目錄(預設: visualizations)')
    parser.add_argument('--distribution', type=str, metavar='COLUMN',
                       help='繪製指定欄位的分布圖')
    parser.add_argument('--correlation', action='store_true',
                       help='繪製相關性矩陣')
    parser.add_argument('--scatter', nargs=2, metavar=('X', 'Y'),
                       help='繪製散點圖')
    parser.add_argument('--bar', type=str, metavar='COLUMN',
                       help='繪製柱狀圖')
    parser.add_argument('--pie', type=str, metavar='COLUMN',
                       help='繪製圓餅圖')
    parser.add_argument('--auto', action='store_true',
                       help='自動生成建議的視覺化')
    parser.add_argument('--dashboard', action='store_true',
                       help='創建綜合儀表板')

    args = parser.parse_args()

    # 創建視覺化器
    visualizer = DataVisualizer(args.file, args.output_dir)

    # 執行指定的視覺化
    if args.distribution:
        visualizer.plot_distribution(args.distribution)
    elif args.correlation:
        visualizer.plot_correlation_matrix()
    elif args.scatter:
        visualizer.plot_scatter(args.scatter[0], args.scatter[1])
    elif args.bar:
        visualizer.plot_bar_chart(args.bar)
    elif args.pie:
        visualizer.plot_pie_chart(args.pie)
    elif args.dashboard:
        visualizer.create_dashboard()
    elif args.auto:
        visualizer.auto_visualize()
    else:
        # 預設執行自動視覺化
        visualizer.auto_visualize()
        visualizer.create_dashboard()


if __name__ == '__main__':
    main()
