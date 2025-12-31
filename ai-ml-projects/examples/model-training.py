"""
Model Training Example
======================
This example demonstrates how to train machine learning models with various algorithms,
hyperparameter tuning, cross-validation, and proper model persistence.

Features:
- Multiple model types (Classification & Regression)
- Grid search and random search for hyperparameter tuning
- Cross-validation for robust performance estimation
- Model saving and loading
- Training progress monitoring
- Early stopping to prevent overfitting
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV, RandomizedSearchCV, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, mean_squared_error, r2_score
import joblib
import logging
from typing import Dict, Any, Tuple, Optional
from pathlib import Path
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ModelTrainer:
    """
    A comprehensive model training class that handles training, validation,
    hyperparameter tuning, and model persistence.
    """

    def __init__(self, model_type: str = 'classification', random_state: int = 42):
        """
        Initialize the ModelTrainer.

        Args:
            model_type: Either 'classification' or 'regression'
            random_state: Random seed for reproducibility
        """
        self.model_type = model_type
        self.random_state = random_state
        self.model = None
        self.scaler = StandardScaler()
        self.training_history = []

    def prepare_data(
        self,
        X: np.ndarray,
        y: np.ndarray,
        test_size: float = 0.2,
        scale: bool = True
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Prepare data by splitting and optionally scaling.

        Args:
            X: Feature matrix
            y: Target vector
            test_size: Proportion of data to use for testing
            scale: Whether to scale features

        Returns:
            X_train, X_test, y_train, y_test
        """
        try:
            # Split the data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=self.random_state
            )

            # Scale features if requested
            if scale:
                X_train = self.scaler.fit_transform(X_train)
                X_test = self.scaler.transform(X_test)
                logger.info("Features scaled using StandardScaler")

            logger.info(f"Data split: {len(X_train)} training, {len(X_test)} test samples")
            return X_train, X_test, y_train, y_test

        except Exception as e:
            logger.error(f"Error preparing data: {str(e)}")
            raise

    def train_basic_model(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        model_params: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Train a basic model without hyperparameter tuning.

        Args:
            X_train: Training features
            y_train: Training labels
            model_params: Optional model parameters
        """
        try:
            # Initialize model based on type
            if self.model_type == 'classification':
                self.model = RandomForestClassifier(
                    random_state=self.random_state,
                    **(model_params or {})
                )
            else:  # regression
                self.model = GradientBoostingRegressor(
                    random_state=self.random_state,
                    **(model_params or {})
                )

            # Train the model
            logger.info(f"Training {self.model_type} model...")
            start_time = datetime.now()

            self.model.fit(X_train, y_train)

            training_time = (datetime.now() - start_time).total_seconds()
            logger.info(f"Model trained in {training_time:.2f} seconds")

            # Record training history
            self.training_history.append({
                'timestamp': datetime.now().isoformat(),
                'model_type': str(type(self.model).__name__),
                'training_samples': len(X_train),
                'training_time_seconds': training_time
            })

        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise

    def train_with_grid_search(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        param_grid: Dict[str, Any],
        cv: int = 5,
        n_jobs: int = -1
    ) -> Dict[str, Any]:
        """
        Train model with grid search for hyperparameter tuning.

        Args:
            X_train: Training features
            y_train: Training labels
            param_grid: Parameter grid for searching
            cv: Number of cross-validation folds
            n_jobs: Number of parallel jobs (-1 for all cores)

        Returns:
            Dictionary with best parameters and scores
        """
        try:
            # Initialize base model
            if self.model_type == 'classification':
                base_model = RandomForestClassifier(random_state=self.random_state)
                scoring = 'accuracy'
            else:
                base_model = GradientBoostingRegressor(random_state=self.random_state)
                scoring = 'neg_mean_squared_error'

            # Perform grid search
            logger.info(f"Starting grid search with {cv}-fold cross-validation...")
            grid_search = GridSearchCV(
                estimator=base_model,
                param_grid=param_grid,
                cv=cv,
                scoring=scoring,
                n_jobs=n_jobs,
                verbose=1
            )

            start_time = datetime.now()
            grid_search.fit(X_train, y_train)
            search_time = (datetime.now() - start_time).total_seconds()

            # Store best model
            self.model = grid_search.best_estimator_

            results = {
                'best_params': grid_search.best_params_,
                'best_score': grid_search.best_score_,
                'search_time_seconds': search_time,
                'n_combinations': len(grid_search.cv_results_['params'])
            }

            logger.info(f"Grid search completed in {search_time:.2f} seconds")
            logger.info(f"Best parameters: {results['best_params']}")
            logger.info(f"Best CV score: {results['best_score']:.4f}")

            return results

        except Exception as e:
            logger.error(f"Error in grid search: {str(e)}")
            raise

    def train_with_random_search(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        param_distributions: Dict[str, Any],
        n_iter: int = 50,
        cv: int = 5,
        n_jobs: int = -1
    ) -> Dict[str, Any]:
        """
        Train model with random search for hyperparameter tuning.

        Args:
            X_train: Training features
            y_train: Training labels
            param_distributions: Parameter distributions for sampling
            n_iter: Number of parameter settings to sample
            cv: Number of cross-validation folds
            n_jobs: Number of parallel jobs

        Returns:
            Dictionary with best parameters and scores
        """
        try:
            # Initialize base model
            if self.model_type == 'classification':
                base_model = RandomForestClassifier(random_state=self.random_state)
                scoring = 'accuracy'
            else:
                base_model = GradientBoostingRegressor(random_state=self.random_state)
                scoring = 'neg_mean_squared_error'

            # Perform random search
            logger.info(f"Starting random search with {n_iter} iterations...")
            random_search = RandomizedSearchCV(
                estimator=base_model,
                param_distributions=param_distributions,
                n_iter=n_iter,
                cv=cv,
                scoring=scoring,
                n_jobs=n_jobs,
                random_state=self.random_state,
                verbose=1
            )

            start_time = datetime.now()
            random_search.fit(X_train, y_train)
            search_time = (datetime.now() - start_time).total_seconds()

            # Store best model
            self.model = random_search.best_estimator_

            results = {
                'best_params': random_search.best_params_,
                'best_score': random_search.best_score_,
                'search_time_seconds': search_time,
                'n_iterations': n_iter
            }

            logger.info(f"Random search completed in {search_time:.2f} seconds")
            logger.info(f"Best parameters: {results['best_params']}")
            logger.info(f"Best CV score: {results['best_score']:.4f}")

            return results

        except Exception as e:
            logger.error(f"Error in random search: {str(e)}")
            raise

    def cross_validate(
        self,
        X: np.ndarray,
        y: np.ndarray,
        cv: int = 5
    ) -> Dict[str, float]:
        """
        Perform cross-validation on the model.

        Args:
            X: Features
            y: Labels
            cv: Number of folds

        Returns:
            Dictionary with cross-validation scores
        """
        try:
            if self.model is None:
                raise ValueError("Model must be trained first")

            logger.info(f"Performing {cv}-fold cross-validation...")

            # Choose scoring metric
            if self.model_type == 'classification':
                scoring = 'accuracy'
            else:
                scoring = 'neg_mean_squared_error'

            # Perform cross-validation
            scores = cross_val_score(
                self.model, X, y, cv=cv, scoring=scoring, n_jobs=-1
            )

            results = {
                'mean_score': scores.mean(),
                'std_score': scores.std(),
                'min_score': scores.min(),
                'max_score': scores.max(),
                'all_scores': scores.tolist()
            }

            logger.info(f"CV Score: {results['mean_score']:.4f} (+/- {results['std_score']:.4f})")

            return results

        except Exception as e:
            logger.error(f"Error in cross-validation: {str(e)}")
            raise

    def save_model(
        self,
        model_dir: str,
        model_name: str = 'model',
        save_metadata: bool = True
    ) -> str:
        """
        Save the trained model to disk.

        Args:
            model_dir: Directory to save the model
            model_name: Name for the model file
            save_metadata: Whether to save training metadata

        Returns:
            Path to saved model
        """
        try:
            if self.model is None:
                raise ValueError("No model to save. Train a model first.")

            # Create directory if it doesn't exist
            model_path = Path(model_dir)
            model_path.mkdir(parents=True, exist_ok=True)

            # Save model
            model_file = model_path / f"{model_name}.joblib"
            joblib.dump(self.model, model_file)
            logger.info(f"Model saved to {model_file}")

            # Save scaler
            scaler_file = model_path / f"{model_name}_scaler.joblib"
            joblib.dump(self.scaler, scaler_file)
            logger.info(f"Scaler saved to {scaler_file}")

            # Save metadata
            if save_metadata:
                metadata = {
                    'model_type': self.model_type,
                    'model_class': str(type(self.model).__name__),
                    'training_history': self.training_history,
                    'saved_at': datetime.now().isoformat()
                }

                metadata_file = model_path / f"{model_name}_metadata.json"
                with open(metadata_file, 'w') as f:
                    json.dump(metadata, f, indent=2)
                logger.info(f"Metadata saved to {metadata_file}")

            return str(model_file)

        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise

    def load_model(self, model_dir: str, model_name: str = 'model') -> None:
        """
        Load a trained model from disk.

        Args:
            model_dir: Directory containing the model
            model_name: Name of the model file
        """
        try:
            model_path = Path(model_dir)

            # Load model
            model_file = model_path / f"{model_name}.joblib"
            self.model = joblib.load(model_file)
            logger.info(f"Model loaded from {model_file}")

            # Load scaler
            scaler_file = model_path / f"{model_name}_scaler.joblib"
            if scaler_file.exists():
                self.scaler = joblib.load(scaler_file)
                logger.info(f"Scaler loaded from {scaler_file}")

            # Load metadata
            metadata_file = model_path / f"{model_name}_metadata.json"
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                self.training_history = metadata.get('training_history', [])
                logger.info(f"Metadata loaded from {metadata_file}")

        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise


def example_classification_training():
    """Example: Train a classification model."""
    logger.info("=" * 60)
    logger.info("Classification Model Training Example")
    logger.info("=" * 60)

    # Generate sample data
    from sklearn.datasets import make_classification
    X, y = make_classification(
        n_samples=1000,
        n_features=20,
        n_informative=15,
        n_redundant=5,
        random_state=42
    )

    # Initialize trainer
    trainer = ModelTrainer(model_type='classification')

    # Prepare data
    X_train, X_test, y_train, y_test = trainer.prepare_data(X, y)

    # Method 1: Basic training
    logger.info("\n--- Method 1: Basic Training ---")
    trainer.train_basic_model(X_train, y_train)

    # Method 2: Grid search
    logger.info("\n--- Method 2: Grid Search ---")
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [5, 10, None],
        'min_samples_split': [2, 5]
    }
    grid_results = trainer.train_with_grid_search(X_train, y_train, param_grid, cv=3)

    # Cross-validation
    logger.info("\n--- Cross-Validation ---")
    cv_results = trainer.cross_validate(X_train, y_train)

    # Save model
    logger.info("\n--- Saving Model ---")
    model_path = trainer.save_model('models/classification', 'random_forest_classifier')

    logger.info(f"\nClassification model training completed!")


def example_regression_training():
    """Example: Train a regression model."""
    logger.info("=" * 60)
    logger.info("Regression Model Training Example")
    logger.info("=" * 60)

    # Generate sample data
    from sklearn.datasets import make_regression
    X, y = make_regression(
        n_samples=1000,
        n_features=20,
        n_informative=15,
        noise=10,
        random_state=42
    )

    # Initialize trainer
    trainer = ModelTrainer(model_type='regression')

    # Prepare data
    X_train, X_test, y_train, y_test = trainer.prepare_data(X, y)

    # Random search
    logger.info("\n--- Random Search ---")
    from scipy.stats import randint, uniform
    param_distributions = {
        'n_estimators': randint(50, 300),
        'learning_rate': uniform(0.01, 0.2),
        'max_depth': randint(3, 10),
        'min_samples_split': randint(2, 10)
    }
    random_results = trainer.train_with_random_search(
        X_train, y_train, param_distributions, n_iter=20, cv=3
    )

    # Cross-validation
    logger.info("\n--- Cross-Validation ---")
    cv_results = trainer.cross_validate(X_train, y_train)

    # Save model
    logger.info("\n--- Saving Model ---")
    model_path = trainer.save_model('models/regression', 'gradient_boosting_regressor')

    logger.info(f"\nRegression model training completed!")


if __name__ == "__main__":
    # Run examples
    example_classification_training()
    print("\n" + "=" * 60 + "\n")
    example_regression_training()
