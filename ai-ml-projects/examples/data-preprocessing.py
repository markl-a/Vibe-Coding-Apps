"""
Data Preprocessing Example
===========================
This example demonstrates comprehensive data preprocessing techniques for ML,
including cleaning, transformation, feature scaling, encoding, and handling missing data.

Features:
- Data cleaning and validation
- Missing value handling
- Feature scaling and normalization
- Categorical encoding
- Outlier detection and handling
- Feature transformation
- Data pipeline creation
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler,
    LabelEncoder, OneHotEncoder, OrdinalEncoder
)
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.base import BaseEstimator, TransformerMixin
import logging
from typing import List, Dict, Any, Optional, Union, Tuple
from pathlib import Path
import warnings

warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DataCleaner:
    """
    Comprehensive data cleaning and validation.
    """

    def __init__(self):
        """Initialize the DataCleaner."""
        self.cleaning_report = {}

    def clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean a DataFrame by removing duplicates, fixing data types, etc.

        Args:
            df: Input DataFrame

        Returns:
            Cleaned DataFrame
        """
        try:
            logger.info(f"Starting data cleaning. Shape: {df.shape}")
            df_clean = df.copy()

            # Remove duplicate rows
            n_duplicates = df_clean.duplicated().sum()
            if n_duplicates > 0:
                df_clean = df_clean.drop_duplicates()
                logger.info(f"Removed {n_duplicates} duplicate rows")
                self.cleaning_report['duplicates_removed'] = n_duplicates

            # Remove columns with all missing values
            null_cols = df_clean.columns[df_clean.isnull().all()].tolist()
            if null_cols:
                df_clean = df_clean.drop(columns=null_cols)
                logger.info(f"Removed {len(null_cols)} columns with all missing values")
                self.cleaning_report['null_columns_removed'] = null_cols

            # Remove rows with all missing values
            n_null_rows = df_clean.isnull().all(axis=1).sum()
            if n_null_rows > 0:
                df_clean = df_clean.dropna(how='all')
                logger.info(f"Removed {n_null_rows} rows with all missing values")
                self.cleaning_report['null_rows_removed'] = n_null_rows

            # Strip whitespace from string columns
            string_cols = df_clean.select_dtypes(include=['object']).columns
            for col in string_cols:
                df_clean[col] = df_clean[col].str.strip() if df_clean[col].dtype == 'object' else df_clean[col]

            logger.info(f"Cleaning completed. Final shape: {df_clean.shape}")
            return df_clean

        except Exception as e:
            logger.error(f"Error cleaning DataFrame: {str(e)}")
            raise

    def detect_data_issues(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Detect common data quality issues.

        Args:
            df: Input DataFrame

        Returns:
            Dictionary with detected issues
        """
        issues = {}

        # Missing values
        missing = df.isnull().sum()
        if missing.any():
            issues['missing_values'] = missing[missing > 0].to_dict()

        # Duplicate rows
        n_duplicates = df.duplicated().sum()
        if n_duplicates > 0:
            issues['duplicate_rows'] = n_duplicates

        # Constant columns (zero variance)
        constant_cols = [col for col in df.columns if df[col].nunique() <= 1]
        if constant_cols:
            issues['constant_columns'] = constant_cols

        # High cardinality categorical columns
        cat_cols = df.select_dtypes(include=['object']).columns
        high_cardinality = {
            col: df[col].nunique()
            for col in cat_cols
            if df[col].nunique() > 50
        }
        if high_cardinality:
            issues['high_cardinality_columns'] = high_cardinality

        # Check for infinite values in numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        inf_cols = []
        for col in numeric_cols:
            if np.isinf(df[col]).any():
                inf_cols.append(col)
        if inf_cols:
            issues['infinite_values'] = inf_cols

        return issues


class MissingValueHandler:
    """
    Handle missing values with various strategies.
    """

    def __init__(self, strategy: str = 'mean'):
        """
        Initialize the MissingValueHandler.

        Args:
            strategy: Strategy for imputation ('mean', 'median', 'mode', 'constant', 'knn')
        """
        self.strategy = strategy
        self.imputers = {}

    def fit_transform_numeric(
        self,
        df: pd.DataFrame,
        columns: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Handle missing values in numeric columns.

        Args:
            df: Input DataFrame
            columns: List of columns to process (if None, process all numeric)

        Returns:
            DataFrame with imputed values
        """
        try:
            df_imputed = df.copy()

            if columns is None:
                columns = df.select_dtypes(include=[np.number]).columns.tolist()

            logger.info(f"Imputing missing values in {len(columns)} numeric columns")

            if self.strategy == 'knn':
                imputer = KNNImputer(n_neighbors=5)
                df_imputed[columns] = imputer.fit_transform(df[columns])
                self.imputers['numeric_knn'] = imputer
            else:
                # Use sklearn SimpleImputer
                strategy_map = {
                    'mean': 'mean',
                    'median': 'median',
                    'mode': 'most_frequent',
                    'constant': 'constant'
                }
                sklearn_strategy = strategy_map.get(self.strategy, 'mean')

                imputer = SimpleImputer(strategy=sklearn_strategy, fill_value=0)
                df_imputed[columns] = imputer.fit_transform(df[columns])
                self.imputers['numeric'] = imputer

            logger.info(f"Numeric imputation completed using {self.strategy} strategy")
            return df_imputed

        except Exception as e:
            logger.error(f"Error imputing numeric values: {str(e)}")
            raise

    def fit_transform_categorical(
        self,
        df: pd.DataFrame,
        columns: Optional[List[str]] = None,
        fill_value: str = 'missing'
    ) -> pd.DataFrame:
        """
        Handle missing values in categorical columns.

        Args:
            df: Input DataFrame
            columns: List of columns to process (if None, process all categorical)
            fill_value: Value to use for missing data

        Returns:
            DataFrame with imputed values
        """
        try:
            df_imputed = df.copy()

            if columns is None:
                columns = df.select_dtypes(include=['object', 'category']).columns.tolist()

            logger.info(f"Imputing missing values in {len(columns)} categorical columns")

            for col in columns:
                if df_imputed[col].isnull().any():
                    # Use most frequent value or custom fill_value
                    if self.strategy == 'mode':
                        fill_val = df_imputed[col].mode()[0] if not df_imputed[col].mode().empty else fill_value
                    else:
                        fill_val = fill_value

                    df_imputed[col] = df_imputed[col].fillna(fill_val)

            logger.info("Categorical imputation completed")
            return df_imputed

        except Exception as e:
            logger.error(f"Error imputing categorical values: {str(e)}")
            raise


class OutlierHandler:
    """
    Detect and handle outliers in numeric data.
    """

    def __init__(self, method: str = 'iqr'):
        """
        Initialize the OutlierHandler.

        Args:
            method: Method for outlier detection ('iqr', 'zscore', 'isolation_forest')
        """
        self.method = method
        self.outlier_bounds = {}

    def detect_outliers_iqr(
        self,
        df: pd.DataFrame,
        columns: Optional[List[str]] = None,
        k: float = 1.5
    ) -> pd.DataFrame:
        """
        Detect outliers using Interquartile Range (IQR) method.

        Args:
            df: Input DataFrame
            columns: Columns to check (if None, check all numeric)
            k: IQR multiplier (typically 1.5 or 3.0)

        Returns:
            Boolean DataFrame indicating outliers
        """
        try:
            if columns is None:
                columns = df.select_dtypes(include=[np.number]).columns.tolist()

            outliers = pd.DataFrame(False, index=df.index, columns=columns)

            for col in columns:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1

                lower_bound = Q1 - k * IQR
                upper_bound = Q3 + k * IQR

                outliers[col] = (df[col] < lower_bound) | (df[col] > upper_bound)

                # Store bounds for reference
                self.outlier_bounds[col] = {
                    'lower': lower_bound,
                    'upper': upper_bound,
                    'n_outliers': outliers[col].sum()
                }

                logger.debug(
                    f"{col}: {outliers[col].sum()} outliers "
                    f"(bounds: [{lower_bound:.2f}, {upper_bound:.2f}])"
                )

            return outliers

        except Exception as e:
            logger.error(f"Error detecting outliers: {str(e)}")
            raise

    def handle_outliers(
        self,
        df: pd.DataFrame,
        outliers: pd.DataFrame,
        method: str = 'clip'
    ) -> pd.DataFrame:
        """
        Handle detected outliers.

        Args:
            df: Input DataFrame
            outliers: Boolean DataFrame indicating outliers
            method: How to handle outliers ('clip', 'remove', 'median', 'mean')

        Returns:
            DataFrame with outliers handled
        """
        try:
            df_handled = df.copy()

            for col in outliers.columns:
                if outliers[col].any():
                    if method == 'clip':
                        # Clip to bounds
                        bounds = self.outlier_bounds.get(col, {})
                        if bounds:
                            df_handled[col] = df_handled[col].clip(
                                lower=bounds['lower'],
                                upper=bounds['upper']
                            )
                    elif method == 'remove':
                        # Remove rows with outliers
                        df_handled = df_handled[~outliers[col]]
                    elif method == 'median':
                        # Replace with median
                        median_val = df[col].median()
                        df_handled.loc[outliers[col], col] = median_val
                    elif method == 'mean':
                        # Replace with mean
                        mean_val = df[col].mean()
                        df_handled.loc[outliers[col], col] = mean_val

            logger.info(f"Outliers handled using '{method}' method")
            return df_handled

        except Exception as e:
            logger.error(f"Error handling outliers: {str(e)}")
            raise


class FeatureScaler:
    """
    Scale and normalize features.
    """

    def __init__(self, method: str = 'standard'):
        """
        Initialize the FeatureScaler.

        Args:
            method: Scaling method ('standard', 'minmax', 'robust', 'log')
        """
        self.method = method
        self.scaler = None
        self._initialize_scaler()

    def _initialize_scaler(self):
        """Initialize the appropriate scaler."""
        if self.method == 'standard':
            self.scaler = StandardScaler()
        elif self.method == 'minmax':
            self.scaler = MinMaxScaler()
        elif self.method == 'robust':
            self.scaler = RobustScaler()
        elif self.method != 'log':
            raise ValueError(f"Unknown scaling method: {self.method}")

    def fit_transform(
        self,
        df: pd.DataFrame,
        columns: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Fit and transform features.

        Args:
            df: Input DataFrame
            columns: Columns to scale (if None, scale all numeric)

        Returns:
            DataFrame with scaled features
        """
        try:
            df_scaled = df.copy()

            if columns is None:
                columns = df.select_dtypes(include=[np.number]).columns.tolist()

            logger.info(f"Scaling {len(columns)} features using {self.method} method")

            if self.method == 'log':
                # Log transformation
                for col in columns:
                    # Add small constant to avoid log(0)
                    df_scaled[col] = np.log1p(df[col].clip(lower=0))
            else:
                # Use sklearn scaler
                df_scaled[columns] = self.scaler.fit_transform(df[columns])

            logger.info("Feature scaling completed")
            return df_scaled

        except Exception as e:
            logger.error(f"Error scaling features: {str(e)}")
            raise

    def transform(self, df: pd.DataFrame, columns: Optional[List[str]] = None) -> pd.DataFrame:
        """Transform features using fitted scaler."""
        try:
            if self.scaler is None and self.method != 'log':
                raise ValueError("Scaler not fitted. Call fit_transform first.")

            df_scaled = df.copy()

            if columns is None:
                columns = df.select_dtypes(include=[np.number]).columns.tolist()

            if self.method == 'log':
                for col in columns:
                    df_scaled[col] = np.log1p(df[col].clip(lower=0))
            else:
                df_scaled[columns] = self.scaler.transform(df[columns])

            return df_scaled

        except Exception as e:
            logger.error(f"Error transforming features: {str(e)}")
            raise


class CategoricalEncoder:
    """
    Encode categorical variables.
    """

    def __init__(self, method: str = 'onehot'):
        """
        Initialize the CategoricalEncoder.

        Args:
            method: Encoding method ('onehot', 'label', 'ordinal', 'target')
        """
        self.method = method
        self.encoders = {}

    def fit_transform(
        self,
        df: pd.DataFrame,
        columns: Optional[List[str]] = None,
        ordinal_order: Optional[Dict[str, List]] = None
    ) -> pd.DataFrame:
        """
        Encode categorical features.

        Args:
            df: Input DataFrame
            columns: Columns to encode (if None, encode all categorical)
            ordinal_order: Order for ordinal encoding (dict of column -> categories)

        Returns:
            DataFrame with encoded features
        """
        try:
            df_encoded = df.copy()

            if columns is None:
                columns = df.select_dtypes(include=['object', 'category']).columns.tolist()

            logger.info(f"Encoding {len(columns)} categorical features using {self.method} method")

            if self.method == 'label':
                # Label encoding
                for col in columns:
                    encoder = LabelEncoder()
                    df_encoded[col] = encoder.fit_transform(df[col].astype(str))
                    self.encoders[col] = encoder

            elif self.method == 'onehot':
                # One-hot encoding
                df_encoded = pd.get_dummies(
                    df_encoded,
                    columns=columns,
                    prefix=columns,
                    drop_first=False
                )

            elif self.method == 'ordinal':
                # Ordinal encoding
                if ordinal_order:
                    for col in columns:
                        if col in ordinal_order:
                            encoder = OrdinalEncoder(categories=[ordinal_order[col]])
                            df_encoded[col] = encoder.fit_transform(df[[col]])
                            self.encoders[col] = encoder

            logger.info("Categorical encoding completed")
            return df_encoded

        except Exception as e:
            logger.error(f"Error encoding categorical features: {str(e)}")
            raise


class PreprocessingPipeline:
    """
    Create a complete preprocessing pipeline.
    """

    def __init__(self):
        """Initialize the PreprocessingPipeline."""
        self.pipeline = None
        self.numeric_features = []
        self.categorical_features = []

    def build_pipeline(
        self,
        numeric_features: List[str],
        categorical_features: List[str],
        numeric_strategy: str = 'mean',
        categorical_strategy: str = 'constant',
        scaling_method: str = 'standard'
    ) -> Pipeline:
        """
        Build a complete preprocessing pipeline.

        Args:
            numeric_features: List of numeric feature names
            categorical_features: List of categorical feature names
            numeric_strategy: Imputation strategy for numeric features
            categorical_strategy: Imputation strategy for categorical features
            scaling_method: Scaling method for numeric features

        Returns:
            Fitted pipeline
        """
        try:
            self.numeric_features = numeric_features
            self.categorical_features = categorical_features

            # Numeric transformer
            numeric_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy=numeric_strategy)),
                ('scaler', StandardScaler() if scaling_method == 'standard' else MinMaxScaler())
            ])

            # Categorical transformer
            categorical_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy=categorical_strategy, fill_value='missing')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ])

            # Combine transformers
            preprocessor = ColumnTransformer(
                transformers=[
                    ('num', numeric_transformer, numeric_features),
                    ('cat', categorical_transformer, categorical_features)
                ]
            )

            self.pipeline = preprocessor
            logger.info("Preprocessing pipeline built successfully")

            return self.pipeline

        except Exception as e:
            logger.error(f"Error building pipeline: {str(e)}")
            raise

    def fit_transform(self, df: pd.DataFrame) -> np.ndarray:
        """Fit and transform data using the pipeline."""
        try:
            if self.pipeline is None:
                raise ValueError("Pipeline not built. Call build_pipeline first.")

            logger.info("Fitting and transforming data with pipeline")
            transformed = self.pipeline.fit_transform(df)

            logger.info(f"Pipeline transformation completed. Output shape: {transformed.shape}")
            return transformed

        except Exception as e:
            logger.error(f"Error fitting pipeline: {str(e)}")
            raise

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """Transform data using fitted pipeline."""
        try:
            if self.pipeline is None:
                raise ValueError("Pipeline not fitted. Call fit_transform first.")

            transformed = self.pipeline.transform(df)
            return transformed

        except Exception as e:
            logger.error(f"Error transforming with pipeline: {str(e)}")
            raise


def example_data_cleaning():
    """Example: Clean and validate data."""
    logger.info("=" * 60)
    logger.info("Data Cleaning Example")
    logger.info("=" * 60)

    # Create sample data with issues
    data = {
        'feature1': [1, 2, np.nan, 4, 5, 5],
        'feature2': [10, 20, 30, 40, np.nan, 40],
        'category': ['A', 'B', 'A', 'C', 'B', 'B'],
        'constant': [1, 1, 1, 1, 1, 1]
    }
    df = pd.DataFrame(data)

    # Add duplicate row
    df = pd.concat([df, df.iloc[[0]]], ignore_index=True)

    logger.info(f"Original data:\n{df}")

    # Clean data
    cleaner = DataCleaner()
    df_clean = cleaner.clean_dataframe(df)

    logger.info(f"\nCleaned data:\n{df_clean}")

    # Detect issues
    issues = cleaner.detect_data_issues(df)
    logger.info(f"\nDetected issues: {issues}")


def example_missing_values():
    """Example: Handle missing values."""
    logger.info("=" * 60)
    logger.info("Missing Value Handling Example")
    logger.info("=" * 60)

    # Create data with missing values
    data = {
        'num1': [1, 2, np.nan, 4, 5],
        'num2': [10, np.nan, 30, 40, 50],
        'cat1': ['A', 'B', None, 'C', 'D']
    }
    df = pd.DataFrame(data)

    logger.info(f"Original data:\n{df}")

    # Handle numeric missing values
    handler = MissingValueHandler(strategy='mean')
    df_imputed = handler.fit_transform_numeric(df)

    # Handle categorical missing values
    df_imputed = handler.fit_transform_categorical(df_imputed)

    logger.info(f"\nImputed data:\n{df_imputed}")


def example_outlier_handling():
    """Example: Detect and handle outliers."""
    logger.info("=" * 60)
    logger.info("Outlier Handling Example")
    logger.info("=" * 60)

    # Create data with outliers
    np.random.seed(42)
    data = {
        'feature1': np.concatenate([np.random.normal(10, 2, 95), [50, 60, -30, 70, 80]]),
        'feature2': np.concatenate([np.random.normal(100, 10, 95), [200, 250, 0, -50, 300]])
    }
    df = pd.DataFrame(data)

    logger.info(f"Data shape: {df.shape}")
    logger.info(f"Data statistics:\n{df.describe()}")

    # Detect outliers
    handler = OutlierHandler(method='iqr')
    outliers = handler.detect_outliers_iqr(df)

    logger.info(f"\nOutliers detected:\n{outliers.sum()}")

    # Handle outliers by clipping
    df_handled = handler.handle_outliers(df, outliers, method='clip')

    logger.info(f"\nData after handling outliers:\n{df_handled.describe()}")


def example_feature_scaling():
    """Example: Scale features."""
    logger.info("=" * 60)
    logger.info("Feature Scaling Example")
    logger.info("=" * 60)

    # Create sample data
    data = {
        'feature1': [1, 2, 3, 4, 5],
        'feature2': [100, 200, 300, 400, 500],
        'feature3': [0.1, 0.2, 0.3, 0.4, 0.5]
    }
    df = pd.DataFrame(data)

    logger.info(f"Original data:\n{df}")

    # Standard scaling
    scaler = FeatureScaler(method='standard')
    df_scaled = scaler.fit_transform(df)

    logger.info(f"\nStandard scaled data:\n{df_scaled}")

    # MinMax scaling
    scaler = FeatureScaler(method='minmax')
    df_scaled = scaler.fit_transform(df)

    logger.info(f"\nMinMax scaled data:\n{df_scaled}")


def example_categorical_encoding():
    """Example: Encode categorical features."""
    logger.info("=" * 60)
    logger.info("Categorical Encoding Example")
    logger.info("=" * 60)

    # Create sample data
    data = {
        'color': ['red', 'blue', 'green', 'red', 'blue'],
        'size': ['S', 'M', 'L', 'M', 'S'],
        'price': [10, 20, 30, 15, 12]
    }
    df = pd.DataFrame(data)

    logger.info(f"Original data:\n{df}")

    # Label encoding
    encoder = CategoricalEncoder(method='label')
    df_label = encoder.fit_transform(df, columns=['color', 'size'])

    logger.info(f"\nLabel encoded data:\n{df_label}")

    # One-hot encoding
    encoder = CategoricalEncoder(method='onehot')
    df_onehot = encoder.fit_transform(df, columns=['color', 'size'])

    logger.info(f"\nOne-hot encoded data:\n{df_onehot}")


def example_complete_pipeline():
    """Example: Complete preprocessing pipeline."""
    logger.info("=" * 60)
    logger.info("Complete Preprocessing Pipeline Example")
    logger.info("=" * 60)

    # Create sample data
    data = {
        'num1': [1, 2, np.nan, 4, 5],
        'num2': [10, 20, 30, np.nan, 50],
        'cat1': ['A', 'B', 'A', 'C', 'B'],
        'cat2': ['X', 'Y', 'X', 'Y', 'Z']
    }
    df = pd.DataFrame(data)

    logger.info(f"Original data:\n{df}")

    # Build and fit pipeline
    pipeline = PreprocessingPipeline()
    pipeline.build_pipeline(
        numeric_features=['num1', 'num2'],
        categorical_features=['cat1', 'cat2'],
        numeric_strategy='mean',
        scaling_method='standard'
    )

    transformed = pipeline.fit_transform(df)

    logger.info(f"\nTransformed data shape: {transformed.shape}")
    logger.info(f"Transformed data:\n{transformed}")


if __name__ == "__main__":
    # Run examples
    example_data_cleaning()
    print("\n")

    example_missing_values()
    print("\n")

    example_outlier_handling()
    print("\n")

    example_feature_scaling()
    print("\n")

    example_categorical_encoding()
    print("\n")

    example_complete_pipeline()
