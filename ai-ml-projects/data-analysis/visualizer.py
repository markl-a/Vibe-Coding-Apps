"""
Data Visualization Tools
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Optional, Tuple


class DataVisualizer:
    """Data visualization utilities"""

    def __init__(self, df: pd.DataFrame):
        """
        Initialize visualizer

        Args:
            df: DataFrame to visualize
        """
        self.df = df
        self.numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        self.categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()

        # Set style
        sns.set_style("whitegrid")
        plt.rcParams['figure.figsize'] = (10, 6)

    def plot_distribution(
        self,
        column: str,
        bins: int = 30,
        kde: bool = True,
        save_path: Optional[str] = None
    ):
        """
        Plot distribution of a numeric column

        Args:
            column: Column name
            bins: Number of bins
            kde: Whether to show KDE
            save_path: Path to save figure
        """
        plt.figure(figsize=(10, 6))

        if column in self.numeric_cols:
            sns.histplot(self.df[column], bins=bins, kde=kde)
            plt.title(f'Distribution of {column}')
            plt.xlabel(column)
            plt.ylabel('Frequency')
        else:
            self.df[column].value_counts().plot(kind='bar')
            plt.title(f'Distribution of {column}')
            plt.xlabel(column)
            plt.ylabel('Count')
            plt.xticks(rotation=45)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')

        plt.show()

    def plot_correlation_heatmap(
        self,
        columns: Optional[List[str]] = None,
        annot: bool = True,
        save_path: Optional[str] = None
    ):
        """
        Plot correlation heatmap

        Args:
            columns: Columns to include (None = all numeric)
            annot: Whether to annotate values
            save_path: Path to save figure
        """
        if columns is None:
            columns = self.numeric_cols

        corr = self.df[columns].corr()

        plt.figure(figsize=(12, 10))
        sns.heatmap(
            corr,
            annot=annot,
            fmt='.2f',
            cmap='coolwarm',
            center=0,
            square=True,
            linewidths=1,
            cbar_kws={"shrink": 0.8}
        )
        plt.title('Correlation Heatmap')
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')

        plt.show()

    def scatter_plot(
        self,
        x: str,
        y: str,
        hue: Optional[str] = None,
        save_path: Optional[str] = None
    ):
        """
        Create scatter plot

        Args:
            x: X-axis column
            y: Y-axis column
            hue: Column for color coding
            save_path: Path to save figure
        """
        plt.figure(figsize=(10, 6))
        sns.scatterplot(data=self.df, x=x, y=y, hue=hue, alpha=0.6)
        plt.title(f'{y} vs {x}')
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')

        plt.show()

    def scatter_matrix(
        self,
        columns: Optional[List[str]] = None,
        save_path: Optional[str] = None
    ):
        """
        Create scatter plot matrix

        Args:
            columns: Columns to include
            save_path: Path to save figure
        """
        if columns is None:
            columns = self.numeric_cols[:5]  # Limit to 5 for readability

        pd.plotting.scatter_matrix(
            self.df[columns],
            figsize=(12, 12),
            alpha=0.5,
            diagonal='kde'
        )
        plt.suptitle('Scatter Matrix')
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')

        plt.show()

    def box_plot(
        self,
        columns: Optional[List[str]] = None,
        save_path: Optional[str] = None
    ):
        """
        Create box plots

        Args:
            columns: Columns to plot
            save_path: Path to save figure
        """
        if columns is None:
            columns = self.numeric_cols

        n_cols = len(columns)
        n_rows = (n_cols + 2) // 3

        fig, axes = plt.subplots(n_rows, 3, figsize=(15, 5 * n_rows))
        axes = axes.flatten() if n_cols > 1 else [axes]

        for i, col in enumerate(columns):
            sns.boxplot(data=self.df, y=col, ax=axes[i])
            axes[i].set_title(f'Box Plot: {col}')

        # Hide extra subplots
        for i in range(n_cols, len(axes)):
            axes[i].set_visible(False)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')

        plt.show()

    def time_series_plot(
        self,
        date_column: str,
        value_column: str,
        save_path: Optional[str] = None
    ):
        """
        Create time series plot

        Args:
            date_column: Date column name
            value_column: Value column name
            save_path: Path to save figure
        """
        df_copy = self.df.copy()
        df_copy[date_column] = pd.to_datetime(df_copy[date_column])
        df_copy = df_copy.sort_values(date_column)

        plt.figure(figsize=(12, 6))
        plt.plot(df_copy[date_column], df_copy[value_column], marker='o', markersize=3)
        plt.title(f'{value_column} over Time')
        plt.xlabel('Date')
        plt.ylabel(value_column)
        plt.xticks(rotation=45)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')

        plt.show()

    def count_plot(
        self,
        column: str,
        top_n: int = 10,
        save_path: Optional[str] = None
    ):
        """
        Create count plot for categorical variable

        Args:
            column: Column name
            top_n: Number of top categories to show
            save_path: Path to save figure
        """
        top_categories = self.df[column].value_counts().head(top_n).index

        plt.figure(figsize=(10, 6))
        sns.countplot(
            data=self.df[self.df[column].isin(top_categories)],
            y=column,
            order=top_categories
        )
        plt.title(f'Top {top_n} {column}')
        plt.xlabel('Count')
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')

        plt.show()


def main():
    """Example usage"""
    # Create sample data
    np.random.seed(42)
    df = pd.DataFrame({
        'age': np.random.randint(18, 80, 100),
        'income': np.random.randint(30000, 150000, 100),
        'score': np.random.randint(0, 100, 100),
        'category': np.random.choice(['A', 'B', 'C'], 100)
    })

    viz = DataVisualizer(df)

    # Distribution plot
    print("Creating distribution plot...")
    viz.plot_distribution('age')

    # Correlation heatmap
    print("Creating correlation heatmap...")
    viz.plot_correlation_heatmap()

    # Scatter plot
    print("Creating scatter plot...")
    viz.scatter_plot('age', 'income', hue='category')

    # Box plot
    print("Creating box plot...")
    viz.box_plot(['age', 'income', 'score'])


if __name__ == "__main__":
    main()
