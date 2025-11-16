"""
Data Analysis and Exploration
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Union
import matplotlib.pyplot as plt
import seaborn as sns


class DataAnalyzer:
    """Data analysis and exploration tool"""

    def __init__(self, data: Union[str, pd.DataFrame]):
        """
        Initialize data analyzer

        Args:
            data: CSV file path or pandas DataFrame
        """
        if isinstance(data, str):
            self.df = pd.read_csv(data)
            self.data_path = data
        else:
            self.df = data.copy()
            self.data_path = None

        self.numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        self.categorical_cols = self.df.select_dtypes(include=['object', 'category']).columns.tolist()

    def describe(self, percentiles: Optional[List[float]] = None) -> pd.DataFrame:
        """
        Generate descriptive statistics

        Args:
            percentiles: List of percentiles to include

        Returns:
            DataFrame with statistics
        """
        if percentiles is None:
            percentiles = [0.25, 0.5, 0.75]

        return self.df.describe(percentiles=percentiles)

    def info(self) -> Dict:
        """
        Get dataset information

        Returns:
            Dictionary with dataset info
        """
        info = {
            'shape': self.df.shape,
            'columns': len(self.df.columns),
            'rows': len(self.df),
            'memory_usage': self.df.memory_usage(deep=True).sum(),
            'numeric_columns': len(self.numeric_cols),
            'categorical_columns': len(self.categorical_cols),
            'dtypes': self.df.dtypes.to_dict()
        }

        return info

    def check_missing(self) -> pd.DataFrame:
        """
        Check for missing values

        Returns:
            DataFrame with missing value statistics
        """
        missing = pd.DataFrame({
            'Missing_Count': self.df.isnull().sum(),
            'Missing_Percentage': (self.df.isnull().sum() / len(self.df)) * 100
        })

        missing = missing[missing['Missing_Count'] > 0].sort_values(
            'Missing_Count',
            ascending=False
        )

        return missing

    def check_duplicates(self) -> Dict:
        """
        Check for duplicate rows

        Returns:
            Dictionary with duplicate information
        """
        duplicates = self.df.duplicated().sum()

        return {
            'duplicate_count': int(duplicates),
            'duplicate_percentage': float(duplicates / len(self.df) * 100),
            'unique_rows': len(self.df) - duplicates
        }

    def correlation_analysis(
        self,
        method: str = 'pearson',
        threshold: float = 0.7
    ) -> pd.DataFrame:
        """
        Analyze correlations between numeric features

        Args:
            method: Correlation method ('pearson', 'spearman', 'kendall')
            threshold: Correlation threshold for filtering

        Returns:
            Correlation matrix
        """
        if not self.numeric_cols:
            return pd.DataFrame()

        corr = self.df[self.numeric_cols].corr(method=method)

        # Find high correlations
        high_corr = []
        for i in range(len(corr.columns)):
            for j in range(i + 1, len(corr.columns)):
                if abs(corr.iloc[i, j]) > threshold:
                    high_corr.append({
                        'feature_1': corr.columns[i],
                        'feature_2': corr.columns[j],
                        'correlation': corr.iloc[i, j]
                    })

        if high_corr:
            print(f"\nHigh correlations (|r| > {threshold}):")
            for item in high_corr:
                print(f"  {item['feature_1']} <-> {item['feature_2']}: {item['correlation']:.3f}")

        return corr

    def detect_outliers(
        self,
        column: str,
        method: str = 'iqr'
    ) -> pd.Series:
        """
        Detect outliers in a numeric column

        Args:
            column: Column name
            method: Detection method ('iqr' or 'zscore')

        Returns:
            Boolean series indicating outliers
        """
        if column not in self.numeric_cols:
            raise ValueError(f"{column} is not a numeric column")

        data = self.df[column]

        if method == 'iqr':
            Q1 = data.quantile(0.25)
            Q3 = data.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            outliers = (data < lower_bound) | (data > upper_bound)

        elif method == 'zscore':
            z_scores = np.abs((data - data.mean()) / data.std())
            outliers = z_scores > 3

        else:
            raise ValueError(f"Unknown method: {method}")

        outlier_count = outliers.sum()
        print(f"Found {outlier_count} outliers in {column} ({outlier_count/len(data)*100:.2f}%)")

        return outliers

    def value_counts(self, column: str, top_n: int = 10) -> pd.Series:
        """
        Get value counts for a column

        Args:
            column: Column name
            top_n: Number of top values to return

        Returns:
            Series with value counts
        """
        counts = self.df[column].value_counts().head(top_n)
        return counts

    def summary_by_group(
        self,
        group_column: str,
        agg_columns: Optional[List[str]] = None,
        agg_func: str = 'mean'
    ) -> pd.DataFrame:
        """
        Summarize data by groups

        Args:
            group_column: Column to group by
            agg_columns: Columns to aggregate (None = all numeric)
            agg_func: Aggregation function

        Returns:
            Grouped summary DataFrame
        """
        if agg_columns is None:
            agg_columns = self.numeric_cols

        return self.df.groupby(group_column)[agg_columns].agg(agg_func)

    def generate_report(self, output: str = 'report.html'):
        """
        Generate an automated EDA report

        Args:
            output: Output file path
        """
        # This is a simplified version
        # In production, use pandas-profiling or sweetviz

        report = f"""
        <html>
        <head><title>Data Analysis Report</title></head>
        <body>
        <h1>Data Analysis Report</h1>

        <h2>Dataset Overview</h2>
        <p>Shape: {self.df.shape}</p>
        <p>Columns: {len(self.df.columns)}</p>
        <p>Rows: {len(self.df)}</p>

        <h2>Column Types</h2>
        <p>Numeric: {len(self.numeric_cols)}</p>
        <p>Categorical: {len(self.categorical_cols)}</p>

        <h2>Missing Values</h2>
        {self.check_missing().to_html()}

        <h2>Descriptive Statistics</h2>
        {self.describe().to_html()}

        <h2>Duplicates</h2>
        <p>{self.check_duplicates()}</p>

        </body>
        </html>
        """

        with open(output, 'w') as f:
            f.write(report)

        print(f"Report generated: {output}")


def main():
    """Example usage"""
    import sys

    if len(sys.argv) < 2:
        print("Usage: python analyzer.py <csv_file>")
        sys.exit(1)

    data_file = sys.argv[1]

    # Initialize analyzer
    print(f"Analyzing {data_file}...")
    analyzer = DataAnalyzer(data_file)

    # Dataset info
    print("\n=== Dataset Info ===")
    info = analyzer.info()
    print(f"Shape: {info['shape']}")
    print(f"Columns: {info['columns']}")
    print(f"Rows: {info['rows']}")

    # Missing values
    print("\n=== Missing Values ===")
    missing = analyzer.check_missing()
    if len(missing) > 0:
        print(missing)
    else:
        print("No missing values")

    # Duplicates
    print("\n=== Duplicates ===")
    dup_info = analyzer.check_duplicates()
    print(f"Duplicates: {dup_info['duplicate_count']} ({dup_info['duplicate_percentage']:.2f}%)")

    # Descriptive statistics
    print("\n=== Descriptive Statistics ===")
    print(analyzer.describe())

    # Generate report
    analyzer.generate_report()


if __name__ == "__main__":
    main()
