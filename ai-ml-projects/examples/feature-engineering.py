"""
Feature Engineering Example
============================
This example demonstrates comprehensive feature engineering techniques including
feature creation, transformation, selection, extraction, and interaction features.

Features:
- Feature creation from datetime
- Polynomial features
- Feature interactions
- Feature selection (filter, wrapper, embedded)
- Dimensionality reduction (PCA, LDA)
- Feature extraction
- Text feature engineering
- Custom transformers
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import PolynomialFeatures
from sklearn.feature_selection import (
    SelectKBest, f_classif, f_regression, RFE,
    SelectFromModel, VarianceThreshold, mutual_info_classif
)
from sklearn.decomposition import PCA, TruncatedSVD
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
import logging
from typing import List, Dict, Any, Optional, Union, Tuple
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DateTimeFeatureExtractor:
    """
    Extract features from datetime columns.
    """

    def __init__(self):
        """Initialize the DateTimeFeatureExtractor."""
        self.datetime_columns = []

    def extract_datetime_features(
        self,
        df: pd.DataFrame,
        datetime_cols: List[str],
        extract_all: bool = True
    ) -> pd.DataFrame:
        """
        Extract features from datetime columns.

        Args:
            df: Input DataFrame
            datetime_cols: List of datetime column names
            extract_all: Whether to extract all available features

        Returns:
            DataFrame with extracted datetime features
        """
        try:
            df_features = df.copy()
            self.datetime_columns = datetime_cols

            logger.info(f"Extracting datetime features from {len(datetime_cols)} columns")

            for col in datetime_cols:
                # Ensure column is datetime
                if not pd.api.types.is_datetime64_any_dtype(df_features[col]):
                    df_features[col] = pd.to_datetime(df_features[col])

                # Extract basic components
                df_features[f'{col}_year'] = df_features[col].dt.year
                df_features[f'{col}_month'] = df_features[col].dt.month
                df_features[f'{col}_day'] = df_features[col].dt.day
                df_features[f'{col}_dayofweek'] = df_features[col].dt.dayofweek
                df_features[f'{col}_hour'] = df_features[col].dt.hour

                if extract_all:
                    # Additional features
                    df_features[f'{col}_quarter'] = df_features[col].dt.quarter
                    df_features[f'{col}_dayofyear'] = df_features[col].dt.dayofyear
                    df_features[f'{col}_week'] = df_features[col].dt.isocalendar().week
                    df_features[f'{col}_is_weekend'] = (
                        df_features[col].dt.dayofweek >= 5
                    ).astype(int)
                    df_features[f'{col}_is_month_start'] = (
                        df_features[col].dt.is_month_start
                    ).astype(int)
                    df_features[f'{col}_is_month_end'] = (
                        df_features[col].dt.is_month_end
                    ).astype(int)

                    # Time of day
                    hour = df_features[col].dt.hour
                    df_features[f'{col}_is_morning'] = (
                        (hour >= 6) & (hour < 12)
                    ).astype(int)
                    df_features[f'{col}_is_afternoon'] = (
                        (hour >= 12) & (hour < 18)
                    ).astype(int)
                    df_features[f'{col}_is_evening'] = (
                        (hour >= 18) & (hour < 24)
                    ).astype(int)
                    df_features[f'{col}_is_night'] = (
                        (hour >= 0) & (hour < 6)
                    ).astype(int)

            logger.info(f"Extracted datetime features. New shape: {df_features.shape}")
            return df_features

        except Exception as e:
            logger.error(f"Error extracting datetime features: {str(e)}")
            raise


class PolynomialFeatureCreator:
    """
    Create polynomial and interaction features.
    """

    def __init__(self, degree: int = 2, interaction_only: bool = False):
        """
        Initialize the PolynomialFeatureCreator.

        Args:
            degree: Degree of polynomial features
            interaction_only: If True, only interaction features are produced
        """
        self.degree = degree
        self.interaction_only = interaction_only
        self.poly = None

    def create_polynomial_features(
        self,
        df: pd.DataFrame,
        columns: Optional[List[str]] = None,
        include_bias: bool = False
    ) -> pd.DataFrame:
        """
        Create polynomial features.

        Args:
            df: Input DataFrame
            columns: Columns to create features from (if None, use all numeric)
            include_bias: Whether to include bias column

        Returns:
            DataFrame with polynomial features
        """
        try:
            if columns is None:
                columns = df.select_dtypes(include=[np.number]).columns.tolist()

            logger.info(
                f"Creating polynomial features (degree={self.degree}) "
                f"from {len(columns)} columns"
            )

            # Create polynomial features
            self.poly = PolynomialFeatures(
                degree=self.degree,
                interaction_only=self.interaction_only,
                include_bias=include_bias
            )

            poly_features = self.poly.fit_transform(df[columns])

            # Create feature names
            feature_names = self.poly.get_feature_names_out(columns)

            # Create DataFrame
            df_poly = pd.DataFrame(
                poly_features,
                columns=feature_names,
                index=df.index
            )

            # Combine with original DataFrame
            df_combined = pd.concat([df.drop(columns=columns), df_poly], axis=1)

            logger.info(f"Created polynomial features. New shape: {df_combined.shape}")
            return df_combined

        except Exception as e:
            logger.error(f"Error creating polynomial features: {str(e)}")
            raise


class CustomFeatureCreator(BaseEstimator, TransformerMixin):
    """
    Create custom features with domain knowledge.
    """

    def __init__(self):
        """Initialize the CustomFeatureCreator."""
        self.feature_names = []

    def fit(self, X, y=None):
        """Fit the transformer (no-op)."""
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Transform data by creating custom features.

        Args:
            X: Input DataFrame

        Returns:
            DataFrame with custom features
        """
        try:
            X_transformed = X.copy()

            # Example: Create ratio features
            numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()

            if len(numeric_cols) >= 2:
                for i, col1 in enumerate(numeric_cols):
                    for col2 in numeric_cols[i+1:]:
                        # Ratio feature
                        feature_name = f'{col1}_div_{col2}'
                        X_transformed[feature_name] = X[col1] / (X[col2] + 1e-8)

                        # Sum feature
                        feature_name = f'{col1}_plus_{col2}'
                        X_transformed[feature_name] = X[col1] + X[col2]

                        # Difference feature
                        feature_name = f'{col1}_minus_{col2}'
                        X_transformed[feature_name] = X[col1] - X[col2]

                        # Product feature
                        feature_name = f'{col1}_times_{col2}'
                        X_transformed[feature_name] = X[col1] * X[col2]

            logger.info(f"Created custom features. New shape: {X_transformed.shape}")
            return X_transformed

        except Exception as e:
            logger.error(f"Error creating custom features: {str(e)}")
            raise


class FeatureSelector:
    """
    Select important features using various methods.
    """

    def __init__(self, method: str = 'variance', n_features: int = 10):
        """
        Initialize the FeatureSelector.

        Args:
            method: Selection method ('variance', 'kbest', 'rfe', 'model_based', 'mutual_info')
            n_features: Number of features to select
        """
        self.method = method
        self.n_features = n_features
        self.selector = None
        self.selected_features = []

    def select_features_variance(
        self,
        X: pd.DataFrame,
        threshold: float = 0.0
    ) -> pd.DataFrame:
        """
        Select features based on variance threshold.

        Args:
            X: Input features
            threshold: Variance threshold

        Returns:
            DataFrame with selected features
        """
        try:
            logger.info(f"Selecting features with variance > {threshold}")

            self.selector = VarianceThreshold(threshold=threshold)
            X_selected = self.selector.fit_transform(X)

            # Get selected feature names
            self.selected_features = X.columns[self.selector.get_support()].tolist()

            logger.info(f"Selected {len(self.selected_features)} features")

            return pd.DataFrame(X_selected, columns=self.selected_features, index=X.index)

        except Exception as e:
            logger.error(f"Error selecting features by variance: {str(e)}")
            raise

    def select_features_kbest(
        self,
        X: pd.DataFrame,
        y: np.ndarray,
        score_func=f_classif
    ) -> pd.DataFrame:
        """
        Select K best features based on statistical tests.

        Args:
            X: Input features
            y: Target variable
            score_func: Scoring function (f_classif or f_regression)

        Returns:
            DataFrame with selected features
        """
        try:
            logger.info(f"Selecting {self.n_features} best features using statistical tests")

            self.selector = SelectKBest(score_func=score_func, k=self.n_features)
            X_selected = self.selector.fit_transform(X, y)

            # Get selected feature names
            self.selected_features = X.columns[self.selector.get_support()].tolist()

            # Get feature scores
            scores = pd.DataFrame({
                'feature': X.columns,
                'score': self.selector.scores_
            }).sort_values('score', ascending=False)

            logger.info(f"Selected {len(self.selected_features)} features")
            logger.info(f"Top 5 features:\n{scores.head()}")

            return pd.DataFrame(X_selected, columns=self.selected_features, index=X.index)

        except Exception as e:
            logger.error(f"Error selecting K best features: {str(e)}")
            raise

    def select_features_rfe(
        self,
        X: pd.DataFrame,
        y: np.ndarray,
        estimator=None
    ) -> pd.DataFrame:
        """
        Select features using Recursive Feature Elimination.

        Args:
            X: Input features
            y: Target variable
            estimator: Estimator to use (if None, use RandomForest)

        Returns:
            DataFrame with selected features
        """
        try:
            logger.info(f"Selecting {self.n_features} features using RFE")

            if estimator is None:
                estimator = RandomForestClassifier(n_estimators=100, random_state=42)

            self.selector = RFE(estimator=estimator, n_features_to_select=self.n_features)
            X_selected = self.selector.fit_transform(X, y)

            # Get selected feature names
            self.selected_features = X.columns[self.selector.get_support()].tolist()

            # Get feature rankings
            rankings = pd.DataFrame({
                'feature': X.columns,
                'ranking': self.selector.ranking_
            }).sort_values('ranking')

            logger.info(f"Selected {len(self.selected_features)} features")
            logger.info(f"Feature rankings:\n{rankings.head(10)}")

            return pd.DataFrame(X_selected, columns=self.selected_features, index=X.index)

        except Exception as e:
            logger.error(f"Error in RFE feature selection: {str(e)}")
            raise

    def select_features_model_based(
        self,
        X: pd.DataFrame,
        y: np.ndarray,
        estimator=None,
        threshold: str = 'median'
    ) -> pd.DataFrame:
        """
        Select features based on model importance.

        Args:
            X: Input features
            y: Target variable
            estimator: Estimator to use (if None, use RandomForest)
            threshold: Threshold for feature selection

        Returns:
            DataFrame with selected features
        """
        try:
            logger.info("Selecting features based on model importance")

            if estimator is None:
                estimator = RandomForestClassifier(n_estimators=100, random_state=42)

            # Train model
            estimator.fit(X, y)

            # Select features
            self.selector = SelectFromModel(estimator, threshold=threshold, prefit=True)
            X_selected = self.selector.transform(X)

            # Get selected feature names
            self.selected_features = X.columns[self.selector.get_support()].tolist()

            # Get feature importances
            importances = pd.DataFrame({
                'feature': X.columns,
                'importance': estimator.feature_importances_
            }).sort_values('importance', ascending=False)

            logger.info(f"Selected {len(self.selected_features)} features")
            logger.info(f"Top 10 important features:\n{importances.head(10)}")

            return pd.DataFrame(X_selected, columns=self.selected_features, index=X.index)

        except Exception as e:
            logger.error(f"Error in model-based feature selection: {str(e)}")
            raise


class DimensionalityReducer:
    """
    Reduce dimensionality using various techniques.
    """

    def __init__(self, method: str = 'pca', n_components: int = 10):
        """
        Initialize the DimensionalityReducer.

        Args:
            method: Reduction method ('pca', 'svd', 'lda')
            n_components: Number of components to keep
        """
        self.method = method
        self.n_components = n_components
        self.reducer = None

    def reduce_dimensionality(
        self,
        X: pd.DataFrame,
        y: Optional[np.ndarray] = None
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Reduce dimensionality of features.

        Args:
            X: Input features
            y: Target variable (required for LDA)

        Returns:
            Tuple of (reduced features, info dict)
        """
        try:
            logger.info(
                f"Reducing dimensionality using {self.method} "
                f"to {self.n_components} components"
            )

            if self.method == 'pca':
                self.reducer = PCA(n_components=self.n_components, random_state=42)
                X_reduced = self.reducer.fit_transform(X)

                # Calculate explained variance
                info = {
                    'explained_variance_ratio': self.reducer.explained_variance_ratio_.tolist(),
                    'cumulative_variance': np.cumsum(
                        self.reducer.explained_variance_ratio_
                    ).tolist()
                }

                logger.info(
                    f"PCA completed. Explained variance: "
                    f"{info['cumulative_variance'][-1]:.4f}"
                )

            elif self.method == 'svd':
                self.reducer = TruncatedSVD(n_components=self.n_components, random_state=42)
                X_reduced = self.reducer.fit_transform(X)

                info = {
                    'explained_variance_ratio': self.reducer.explained_variance_ratio_.tolist(),
                    'cumulative_variance': np.cumsum(
                        self.reducer.explained_variance_ratio_
                    ).tolist()
                }

                logger.info(
                    f"SVD completed. Explained variance: "
                    f"{info['cumulative_variance'][-1]:.4f}"
                )

            elif self.method == 'lda':
                if y is None:
                    raise ValueError("LDA requires target variable y")

                self.reducer = LinearDiscriminantAnalysis(n_components=self.n_components)
                X_reduced = self.reducer.fit_transform(X, y)

                info = {
                    'explained_variance_ratio': self.reducer.explained_variance_ratio_.tolist()
                }

                logger.info("LDA completed")

            else:
                raise ValueError(f"Unknown method: {self.method}")

            return X_reduced, info

        except Exception as e:
            logger.error(f"Error reducing dimensionality: {str(e)}")
            raise


class TextFeatureExtractor:
    """
    Extract features from text data.
    """

    def __init__(self, method: str = 'tfidf', max_features: int = 100):
        """
        Initialize the TextFeatureExtractor.

        Args:
            method: Extraction method ('tfidf', 'count', 'custom')
            max_features: Maximum number of features
        """
        self.method = method
        self.max_features = max_features
        self.vectorizer = None

    def extract_text_features(
        self,
        texts: List[str],
        ngram_range: Tuple[int, int] = (1, 2)
    ) -> Tuple[np.ndarray, List[str]]:
        """
        Extract features from text.

        Args:
            texts: List of text documents
            ngram_range: Range of n-grams to extract

        Returns:
            Tuple of (feature matrix, feature names)
        """
        try:
            logger.info(
                f"Extracting text features using {self.method} "
                f"(max_features={self.max_features})"
            )

            if self.method == 'tfidf':
                self.vectorizer = TfidfVectorizer(
                    max_features=self.max_features,
                    ngram_range=ngram_range,
                    stop_words='english'
                )
            elif self.method == 'count':
                self.vectorizer = CountVectorizer(
                    max_features=self.max_features,
                    ngram_range=ngram_range,
                    stop_words='english'
                )
            else:
                raise ValueError(f"Unknown method: {self.method}")

            # Extract features
            features = self.vectorizer.fit_transform(texts).toarray()
            feature_names = self.vectorizer.get_feature_names_out().tolist()

            logger.info(f"Extracted {len(feature_names)} text features")

            return features, feature_names

        except Exception as e:
            logger.error(f"Error extracting text features: {str(e)}")
            raise

    def extract_custom_text_features(self, texts: List[str]) -> pd.DataFrame:
        """
        Extract custom text features.

        Args:
            texts: List of text documents

        Returns:
            DataFrame with custom text features
        """
        try:
            logger.info("Extracting custom text features")

            features = []
            for text in texts:
                text_features = {
                    'length': len(text),
                    'word_count': len(text.split()),
                    'char_count': len(text.replace(' ', '')),
                    'avg_word_length': np.mean([len(word) for word in text.split()]) if text.split() else 0,
                    'uppercase_count': sum(1 for c in text if c.isupper()),
                    'lowercase_count': sum(1 for c in text if c.islower()),
                    'digit_count': sum(1 for c in text if c.isdigit()),
                    'special_char_count': sum(1 for c in text if not c.isalnum() and not c.isspace())
                }
                features.append(text_features)

            df_features = pd.DataFrame(features)

            logger.info(f"Extracted {len(df_features.columns)} custom text features")

            return df_features

        except Exception as e:
            logger.error(f"Error extracting custom text features: {str(e)}")
            raise


def example_datetime_features():
    """Example: Extract datetime features."""
    logger.info("=" * 60)
    logger.info("DateTime Feature Extraction Example")
    logger.info("=" * 60)

    # Create sample data
    dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='D')
    df = pd.DataFrame({
        'date': dates,
        'value': np.random.randn(len(dates))
    })

    logger.info(f"Original data shape: {df.shape}")

    # Extract datetime features
    extractor = DateTimeFeatureExtractor()
    df_features = extractor.extract_datetime_features(df, ['date'])

    logger.info(f"New data shape: {df_features.shape}")
    logger.info(f"New columns: {df_features.columns.tolist()}")


def example_polynomial_features():
    """Example: Create polynomial features."""
    logger.info("=" * 60)
    logger.info("Polynomial Feature Creation Example")
    logger.info("=" * 60)

    # Create sample data
    df = pd.DataFrame({
        'feature1': np.random.randn(100),
        'feature2': np.random.randn(100),
        'feature3': np.random.randn(100)
    })

    logger.info(f"Original data shape: {df.shape}")

    # Create polynomial features
    creator = PolynomialFeatureCreator(degree=2, interaction_only=False)
    df_poly = creator.create_polynomial_features(df)

    logger.info(f"New data shape: {df_poly.shape}")
    logger.info(f"Sample columns: {df_poly.columns.tolist()[:10]}")


def example_feature_selection():
    """Example: Select important features."""
    logger.info("=" * 60)
    logger.info("Feature Selection Example")
    logger.info("=" * 60)

    # Generate sample data
    from sklearn.datasets import make_classification
    X, y = make_classification(
        n_samples=1000, n_features=50, n_informative=20,
        n_redundant=10, random_state=42
    )

    df = pd.DataFrame(X, columns=[f'feature_{i}' for i in range(X.shape[1])])

    logger.info(f"Original data shape: {df.shape}")

    # Select features using different methods
    selector = FeatureSelector(method='kbest', n_features=10)
    df_selected = selector.select_features_kbest(df, y, score_func=f_classif)

    logger.info(f"Selected features shape: {df_selected.shape}")
    logger.info(f"Selected features: {selector.selected_features}")


def example_dimensionality_reduction():
    """Example: Reduce dimensionality."""
    logger.info("=" * 60)
    logger.info("Dimensionality Reduction Example")
    logger.info("=" * 60)

    # Generate sample data
    from sklearn.datasets import make_classification
    X, y = make_classification(
        n_samples=1000, n_features=50, n_informative=20,
        random_state=42
    )

    df = pd.DataFrame(X, columns=[f'feature_{i}' for i in range(X.shape[1])])

    logger.info(f"Original data shape: {df.shape}")

    # Reduce dimensionality using PCA
    reducer = DimensionalityReducer(method='pca', n_components=10)
    X_reduced, info = reducer.reduce_dimensionality(df)

    logger.info(f"Reduced data shape: {X_reduced.shape}")
    logger.info(f"Explained variance: {info['cumulative_variance'][-1]:.4f}")


def example_text_features():
    """Example: Extract text features."""
    logger.info("=" * 60)
    logger.info("Text Feature Extraction Example")
    logger.info("=" * 60)

    # Sample texts
    texts = [
        "This is a sample text for feature extraction",
        "Machine learning is awesome and powerful",
        "Feature engineering is crucial for model performance",
        "Text processing can reveal interesting patterns",
        "Natural language processing opens new possibilities"
    ]

    # Extract TF-IDF features
    extractor = TextFeatureExtractor(method='tfidf', max_features=20)
    features, feature_names = extractor.extract_text_features(texts)

    logger.info(f"Extracted features shape: {features.shape}")
    logger.info(f"Feature names: {feature_names}")

    # Extract custom text features
    custom_features = extractor.extract_custom_text_features(texts)
    logger.info(f"\nCustom features:\n{custom_features}")


if __name__ == "__main__":
    # Run examples
    example_datetime_features()
    print("\n")

    example_polynomial_features()
    print("\n")

    example_feature_selection()
    print("\n")

    example_dimensionality_reduction()
    print("\n")

    example_text_features()

    logger.info("\nAll feature engineering examples completed!")
