"""
特徵工程工具
提供常用的特徵工程方法
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler,
    LabelEncoder, OneHotEncoder
)
from sklearn.feature_selection import (
    SelectKBest, f_classif, f_regression,
    RFE, VarianceThreshold
)
from sklearn.decomposition import PCA
import warnings
warnings.filterwarnings('ignore')


class FeatureEngineer:
    """特徵工程工具類"""

    def __init__(self, df=None):
        """
        初始化特徵工程器

        Args:
            df: 輸入 DataFrame
        """
        self.df = df.copy() if df is not None else None
        self.encoders = {}
        self.scalers = {}
        self.feature_names = []

    def handle_missing_values(self, strategy='mean', fill_value=None):
        """
        處理缺失值

        Args:
            strategy: 'mean', 'median', 'mode', 'ffill', 'bfill', 'drop', 'constant'
            fill_value: 當 strategy='constant' 時使用的值

        Returns:
            處理後的 DataFrame
        """
        if self.df is None:
            raise ValueError("請先載入 DataFrame")

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        categorical_cols = self.df.select_dtypes(include=['object']).columns

        if strategy == 'mean':
            self.df[numeric_cols] = self.df[numeric_cols].fillna(self.df[numeric_cols].mean())
        elif strategy == 'median':
            self.df[numeric_cols] = self.df[numeric_cols].fillna(self.df[numeric_cols].median())
        elif strategy == 'mode':
            for col in self.df.columns:
                self.df[col].fillna(self.df[col].mode()[0] if not self.df[col].mode().empty else 0,
                                   inplace=True)
        elif strategy == 'ffill':
            self.df.fillna(method='ffill', inplace=True)
        elif strategy == 'bfill':
            self.df.fillna(method='bfill', inplace=True)
        elif strategy == 'drop':
            self.df.dropna(inplace=True)
        elif strategy == 'constant':
            self.df.fillna(fill_value, inplace=True)
        else:
            raise ValueError(f"不支援的策略: {strategy}")

        return self.df

    def encode_categorical(self, columns=None, method='label'):
        """
        編碼類別變數

        Args:
            columns: 要編碼的欄位列表（None 則自動選擇所有類別欄位）
            method: 'label' 或 'onehot'

        Returns:
            編碼後的 DataFrame
        """
        if self.df is None:
            raise ValueError("請先載入 DataFrame")

        if columns is None:
            columns = self.df.select_dtypes(include=['object']).columns.tolist()

        if method == 'label':
            for col in columns:
                if col in self.df.columns:
                    le = LabelEncoder()
                    self.df[col] = le.fit_transform(self.df[col].astype(str))
                    self.encoders[col] = le

        elif method == 'onehot':
            self.df = pd.get_dummies(self.df, columns=columns, drop_first=True)

        else:
            raise ValueError(f"不支援的方法: {method}")

        return self.df

    def scale_features(self, columns=None, method='standard'):
        """
        特徵縮放

        Args:
            columns: 要縮放的欄位列表（None 則選擇所有數值欄位）
            method: 'standard', 'minmax', 'robust'

        Returns:
            縮放後的 DataFrame
        """
        if self.df is None:
            raise ValueError("請先載入 DataFrame")

        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns.tolist()

        if method == 'standard':
            scaler = StandardScaler()
        elif method == 'minmax':
            scaler = MinMaxScaler()
        elif method == 'robust':
            scaler = RobustScaler()
        else:
            raise ValueError(f"不支援的方法: {method}")

        self.df[columns] = scaler.fit_transform(self.df[columns])
        self.scalers[method] = scaler

        return self.df

    def create_polynomial_features(self, columns, degree=2):
        """
        創建多項式特徵

        Args:
            columns: 要創建多項式特徵的欄位列表
            degree: 多項式次數

        Returns:
            包含多項式特徵的 DataFrame
        """
        if self.df is None:
            raise ValueError("請先載入 DataFrame")

        from sklearn.preprocessing import PolynomialFeatures

        poly = PolynomialFeatures(degree=degree, include_bias=False)
        poly_features = poly.fit_transform(self.df[columns])

        # 創建新的欄位名稱
        feature_names = poly.get_feature_names_out(columns)

        # 添加新特徵到 DataFrame
        poly_df = pd.DataFrame(poly_features, columns=feature_names, index=self.df.index)

        # 移除原始欄位，添加多項式特徵
        self.df = self.df.drop(columns=columns)
        self.df = pd.concat([self.df, poly_df], axis=1)

        return self.df

    def create_interaction_features(self, column_pairs):
        """
        創建交互特徵

        Args:
            column_pairs: 欄位對的列表，例如 [('col1', 'col2'), ('col3', 'col4')]

        Returns:
            包含交互特徵的 DataFrame
        """
        if self.df is None:
            raise ValueError("請先載入 DataFrame")

        for col1, col2 in column_pairs:
            if col1 in self.df.columns and col2 in self.df.columns:
                new_col_name = f"{col1}_x_{col2}"
                self.df[new_col_name] = self.df[col1] * self.df[col2]

        return self.df

    def create_time_features(self, date_column):
        """
        從日期欄位創建時間特徵

        Args:
            date_column: 日期欄位名稱

        Returns:
            包含時間特徵的 DataFrame
        """
        if self.df is None:
            raise ValueError("請先載入 DataFrame")

        if date_column not in self.df.columns:
            raise ValueError(f"找不到欄位: {date_column}")

        # 轉換為 datetime
        self.df[date_column] = pd.to_datetime(self.df[date_column])

        # 提取時間特徵
        self.df['year'] = self.df[date_column].dt.year
        self.df['month'] = self.df[date_column].dt.month
        self.df['day'] = self.df[date_column].dt.day
        self.df['dayofweek'] = self.df[date_column].dt.dayofweek
        self.df['quarter'] = self.df[date_column].dt.quarter
        self.df['is_weekend'] = (self.df['dayofweek'] >= 5).astype(int)
        self.df['is_month_start'] = self.df[date_column].dt.is_month_start.astype(int)
        self.df['is_month_end'] = self.df[date_column].dt.is_month_end.astype(int)

        return self.df

    def create_binning(self, column, bins=5, labels=None):
        """
        特徵分箱

        Args:
            column: 要分箱的欄位
            bins: 箱數或箱的邊界列表
            labels: 箱的標籤

        Returns:
            包含分箱特徵的 DataFrame
        """
        if self.df is None:
            raise ValueError("請先載入 DataFrame")

        if column not in self.df.columns:
            raise ValueError(f"找不到欄位: {column}")

        new_col_name = f"{column}_binned"
        self.df[new_col_name] = pd.cut(self.df[column], bins=bins, labels=labels)

        return self.df

    def remove_outliers(self, columns=None, method='iqr', threshold=1.5):
        """
        移除異常值

        Args:
            columns: 要處理的欄位列表（None 則處理所有數值欄位）
            method: 'iqr' 或 'zscore'
            threshold: IQR 倍數或 Z-score 閾值

        Returns:
            移除異常值後的 DataFrame
        """
        if self.df is None:
            raise ValueError("請先載入 DataFrame")

        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns.tolist()

        initial_rows = len(self.df)

        for col in columns:
            if method == 'iqr':
                Q1 = self.df[col].quantile(0.25)
                Q3 = self.df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - threshold * IQR
                upper_bound = Q3 + threshold * IQR
                self.df = self.df[(self.df[col] >= lower_bound) & (self.df[col] <= upper_bound)]

            elif method == 'zscore':
                z_scores = np.abs((self.df[col] - self.df[col].mean()) / self.df[col].std())
                self.df = self.df[z_scores < threshold]

        removed_rows = initial_rows - len(self.df)
        print(f"移除了 {removed_rows} 筆異常值 ({removed_rows/initial_rows*100:.2f}%)")

        return self.df

    def select_features_univariate(self, X, y, k=10, task='classification'):
        """
        單變量特徵選擇

        Args:
            X: 特徵矩陣
            y: 目標變數
            k: 選擇的特徵數量
            task: 'classification' 或 'regression'

        Returns:
            選擇的特徵索引
        """
        if task == 'classification':
            selector = SelectKBest(f_classif, k=k)
        elif task == 'regression':
            selector = SelectKBest(f_regression, k=k)
        else:
            raise ValueError(f"不支援的任務類型: {task}")

        selector.fit(X, y)
        selected_indices = selector.get_support(indices=True)

        return selected_indices

    def select_features_rfe(self, X, y, estimator, n_features=10):
        """
        遞迴特徵消除

        Args:
            X: 特徵矩陣
            y: 目標變數
            estimator: 估計器（例如 RandomForestClassifier）
            n_features: 要選擇的特徵數量

        Returns:
            選擇的特徵索引
        """
        rfe = RFE(estimator, n_features_to_select=n_features)
        rfe.fit(X, y)
        selected_indices = rfe.get_support(indices=True)

        return selected_indices

    def reduce_dimensions_pca(self, X, n_components=0.95):
        """
        使用 PCA 降維

        Args:
            X: 特徵矩陣
            n_components: 保留的成分數量或解釋變異比例

        Returns:
            降維後的特徵矩陣和 PCA 物件
        """
        pca = PCA(n_components=n_components)
        X_reduced = pca.fit_transform(X)

        print(f"PCA 降維結果:")
        print(f"  原始特徵數: {X.shape[1]}")
        print(f"  降維後特徵數: {X_reduced.shape[1]}")
        print(f"  解釋變異比例: {pca.explained_variance_ratio_.sum():.4f}")

        return X_reduced, pca

    def remove_low_variance_features(self, threshold=0.01):
        """
        移除低變異特徵

        Args:
            threshold: 變異閾值

        Returns:
            移除低變異特徵後的 DataFrame
        """
        if self.df is None:
            raise ValueError("請先載入 DataFrame")

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns

        selector = VarianceThreshold(threshold=threshold)
        selector.fit(self.df[numeric_cols])

        selected_features = numeric_cols[selector.get_support()]
        removed_features = set(numeric_cols) - set(selected_features)

        if removed_features:
            print(f"移除了 {len(removed_features)} 個低變異特徵: {removed_features}")
            self.df = self.df[list(set(self.df.columns) - removed_features)]

        return self.df

    def get_correlation_features(self, threshold=0.8):
        """
        找出高度相關的特徵對

        Args:
            threshold: 相關係數閾值

        Returns:
            高度相關的特徵對列表
        """
        if self.df is None:
            raise ValueError("請先載入 DataFrame")

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        corr_matrix = self.df[numeric_cols].corr().abs()

        # 只取上三角矩陣（避免重複）
        upper_triangle = corr_matrix.where(
            np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
        )

        # 找出高度相關的特徵對
        high_corr_pairs = [
            (col, row, corr_matrix.loc[row, col])
            for col in upper_triangle.columns
            for row in upper_triangle.index
            if upper_triangle.loc[row, col] > threshold
        ]

        return high_corr_pairs

    def summary(self):
        """顯示資料摘要"""
        if self.df is None:
            raise ValueError("請先載入 DataFrame")

        print("=" * 60)
        print("資料摘要")
        print("=" * 60)
        print(f"資料筆數: {len(self.df)}")
        print(f"特徵數量: {len(self.df.columns)}")
        print(f"\n資料類型:")
        print(self.df.dtypes.value_counts())

        print(f"\n缺失值統計:")
        missing = self.df.isnull().sum()
        if missing.sum() > 0:
            print(missing[missing > 0])
        else:
            print("無缺失值")

        print(f"\n數值特徵統計:")
        print(self.df.describe())


def main():
    """示例用法"""
    # 創建示例資料
    np.random.seed(42)
    df = pd.DataFrame({
        'age': np.random.randint(18, 80, 1000),
        'income': np.random.randint(20000, 150000, 1000),
        'credit_score': np.random.randint(300, 850, 1000),
        'category': np.random.choice(['A', 'B', 'C'], 1000),
        'date': pd.date_range('2023-01-01', periods=1000, freq='D')
    })

    # 初始化特徵工程器
    fe = FeatureEngineer(df)

    # 顯示摘要
    fe.summary()

    # 編碼類別變數
    fe.encode_categorical(columns=['category'], method='label')

    # 創建時間特徵
    fe.create_time_features('date')

    # 特徵縮放
    fe.scale_features(columns=['age', 'income', 'credit_score'], method='standard')

    print(f"\n處理後的資料:")
    print(fe.df.head())
    print(f"\n特徵數量: {len(fe.df.columns)}")


if __name__ == '__main__':
    main()
