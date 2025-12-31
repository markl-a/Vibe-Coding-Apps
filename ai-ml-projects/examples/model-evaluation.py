"""
Model Evaluation Example
=========================
This example demonstrates comprehensive model evaluation techniques including
metrics calculation, visualization, cross-validation, and performance analysis.

Features:
- Classification metrics (accuracy, precision, recall, F1, ROC-AUC)
- Regression metrics (MSE, RMSE, MAE, R2)
- Confusion matrix and classification reports
- ROC and PR curves
- Learning curves
- Model comparison
- Statistical significance testing
"""

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_curve, auc,
    precision_recall_curve, mean_squared_error, mean_absolute_error,
    r2_score, explained_variance_score
)
from sklearn.model_selection import cross_val_score, learning_curve
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.datasets import make_classification, make_regression
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns
import logging
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Set style for plots
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (10, 6)


class ClassificationEvaluator:
    """
    Comprehensive evaluation for classification models.
    """

    def __init__(self, model, X_test, y_test, class_names: Optional[List[str]] = None):
        """
        Initialize the ClassificationEvaluator.

        Args:
            model: Trained classification model
            X_test: Test features
            y_test: True labels
            class_names: Names of classes
        """
        self.model = model
        self.X_test = X_test
        self.y_test = y_test
        self.class_names = class_names
        self.y_pred = None
        self.y_pred_proba = None
        self.metrics = {}

    def predict(self) -> None:
        """Make predictions on test data."""
        try:
            logger.info("Making predictions on test data...")
            self.y_pred = self.model.predict(self.X_test)

            if hasattr(self.model, 'predict_proba'):
                self.y_pred_proba = self.model.predict_proba(self.X_test)

            logger.info("Predictions completed")

        except Exception as e:
            logger.error(f"Error making predictions: {str(e)}")
            raise

    def calculate_metrics(
        self,
        average: str = 'weighted'
    ) -> Dict[str, float]:
        """
        Calculate classification metrics.

        Args:
            average: Averaging method for multi-class ('micro', 'macro', 'weighted')

        Returns:
            Dictionary of metrics
        """
        try:
            if self.y_pred is None:
                self.predict()

            logger.info("Calculating classification metrics...")

            # Basic metrics
            self.metrics['accuracy'] = accuracy_score(self.y_test, self.y_pred)
            self.metrics['precision'] = precision_score(
                self.y_test, self.y_pred, average=average, zero_division=0
            )
            self.metrics['recall'] = recall_score(
                self.y_test, self.y_pred, average=average, zero_division=0
            )
            self.metrics['f1_score'] = f1_score(
                self.y_test, self.y_pred, average=average, zero_division=0
            )

            # Per-class metrics
            if len(np.unique(self.y_test)) > 2:
                for metric_name in ['precision', 'recall', 'f1_score']:
                    per_class = []
                    if metric_name == 'precision':
                        per_class = precision_score(
                            self.y_test, self.y_pred, average=None, zero_division=0
                        )
                    elif metric_name == 'recall':
                        per_class = recall_score(
                            self.y_test, self.y_pred, average=None, zero_division=0
                        )
                    elif metric_name == 'f1_score':
                        per_class = f1_score(
                            self.y_test, self.y_pred, average=None, zero_division=0
                        )

                    self.metrics[f'{metric_name}_per_class'] = per_class.tolist()

            logger.info(f"Accuracy: {self.metrics['accuracy']:.4f}")
            logger.info(f"Precision: {self.metrics['precision']:.4f}")
            logger.info(f"Recall: {self.metrics['recall']:.4f}")
            logger.info(f"F1 Score: {self.metrics['f1_score']:.4f}")

            return self.metrics

        except Exception as e:
            logger.error(f"Error calculating metrics: {str(e)}")
            raise

    def get_confusion_matrix(self) -> np.ndarray:
        """
        Calculate confusion matrix.

        Returns:
            Confusion matrix
        """
        try:
            if self.y_pred is None:
                self.predict()

            cm = confusion_matrix(self.y_test, self.y_pred)
            logger.info("Confusion matrix calculated")

            return cm

        except Exception as e:
            logger.error(f"Error calculating confusion matrix: {str(e)}")
            raise

    def plot_confusion_matrix(self, save_path: Optional[str] = None) -> None:
        """
        Plot confusion matrix heatmap.

        Args:
            save_path: Path to save the plot
        """
        try:
            cm = self.get_confusion_matrix()

            plt.figure(figsize=(8, 6))
            sns.heatmap(
                cm,
                annot=True,
                fmt='d',
                cmap='Blues',
                xticklabels=self.class_names or 'auto',
                yticklabels=self.class_names or 'auto'
            )
            plt.title('Confusion Matrix')
            plt.ylabel('True Label')
            plt.xlabel('Predicted Label')

            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                logger.info(f"Confusion matrix plot saved to {save_path}")

            plt.close()

        except Exception as e:
            logger.error(f"Error plotting confusion matrix: {str(e)}")
            raise

    def get_classification_report(self) -> str:
        """
        Get detailed classification report.

        Returns:
            Classification report string
        """
        try:
            if self.y_pred is None:
                self.predict()

            report = classification_report(
                self.y_test,
                self.y_pred,
                target_names=self.class_names,
                zero_division=0
            )

            logger.info("Classification report generated")
            return report

        except Exception as e:
            logger.error(f"Error generating classification report: {str(e)}")
            raise

    def plot_roc_curve(self, save_path: Optional[str] = None) -> None:
        """
        Plot ROC curve (binary classification only).

        Args:
            save_path: Path to save the plot
        """
        try:
            if self.y_pred_proba is None:
                raise ValueError("Model does not support probability predictions")

            # For binary classification
            if len(np.unique(self.y_test)) == 2:
                fpr, tpr, _ = roc_curve(self.y_test, self.y_pred_proba[:, 1])
                roc_auc = auc(fpr, tpr)

                plt.figure(figsize=(8, 6))
                plt.plot(fpr, tpr, color='darkorange', lw=2,
                        label=f'ROC curve (AUC = {roc_auc:.2f})')
                plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
                plt.xlim([0.0, 1.0])
                plt.ylim([0.0, 1.05])
                plt.xlabel('False Positive Rate')
                plt.ylabel('True Positive Rate')
                plt.title('Receiver Operating Characteristic (ROC) Curve')
                plt.legend(loc="lower right")

                if save_path:
                    plt.savefig(save_path, dpi=300, bbox_inches='tight')
                    logger.info(f"ROC curve plot saved to {save_path}")

                plt.close()

                self.metrics['roc_auc'] = roc_auc

        except Exception as e:
            logger.error(f"Error plotting ROC curve: {str(e)}")
            raise

    def plot_precision_recall_curve(self, save_path: Optional[str] = None) -> None:
        """
        Plot precision-recall curve.

        Args:
            save_path: Path to save the plot
        """
        try:
            if self.y_pred_proba is None:
                raise ValueError("Model does not support probability predictions")

            # For binary classification
            if len(np.unique(self.y_test)) == 2:
                precision, recall, _ = precision_recall_curve(
                    self.y_test, self.y_pred_proba[:, 1]
                )
                pr_auc = auc(recall, precision)

                plt.figure(figsize=(8, 6))
                plt.plot(recall, precision, color='blue', lw=2,
                        label=f'PR curve (AUC = {pr_auc:.2f})')
                plt.xlabel('Recall')
                plt.ylabel('Precision')
                plt.title('Precision-Recall Curve')
                plt.legend(loc="lower left")

                if save_path:
                    plt.savefig(save_path, dpi=300, bbox_inches='tight')
                    logger.info(f"PR curve plot saved to {save_path}")

                plt.close()

                self.metrics['pr_auc'] = pr_auc

        except Exception as e:
            logger.error(f"Error plotting PR curve: {str(e)}")
            raise


class RegressionEvaluator:
    """
    Comprehensive evaluation for regression models.
    """

    def __init__(self, model, X_test, y_test):
        """
        Initialize the RegressionEvaluator.

        Args:
            model: Trained regression model
            X_test: Test features
            y_test: True values
        """
        self.model = model
        self.X_test = X_test
        self.y_test = y_test
        self.y_pred = None
        self.metrics = {}

    def predict(self) -> None:
        """Make predictions on test data."""
        try:
            logger.info("Making predictions on test data...")
            self.y_pred = self.model.predict(self.X_test)
            logger.info("Predictions completed")

        except Exception as e:
            logger.error(f"Error making predictions: {str(e)}")
            raise

    def calculate_metrics(self) -> Dict[str, float]:
        """
        Calculate regression metrics.

        Returns:
            Dictionary of metrics
        """
        try:
            if self.y_pred is None:
                self.predict()

            logger.info("Calculating regression metrics...")

            # Calculate metrics
            self.metrics['mse'] = mean_squared_error(self.y_test, self.y_pred)
            self.metrics['rmse'] = np.sqrt(self.metrics['mse'])
            self.metrics['mae'] = mean_absolute_error(self.y_test, self.y_pred)
            self.metrics['r2'] = r2_score(self.y_test, self.y_pred)
            self.metrics['explained_variance'] = explained_variance_score(
                self.y_test, self.y_pred
            )

            # Calculate MAPE (Mean Absolute Percentage Error)
            mask = self.y_test != 0
            if mask.any():
                self.metrics['mape'] = np.mean(
                    np.abs((self.y_test[mask] - self.y_pred[mask]) / self.y_test[mask])
                ) * 100

            logger.info(f"MSE: {self.metrics['mse']:.4f}")
            logger.info(f"RMSE: {self.metrics['rmse']:.4f}")
            logger.info(f"MAE: {self.metrics['mae']:.4f}")
            logger.info(f"R² Score: {self.metrics['r2']:.4f}")

            return self.metrics

        except Exception as e:
            logger.error(f"Error calculating metrics: {str(e)}")
            raise

    def plot_predictions(self, save_path: Optional[str] = None) -> None:
        """
        Plot predicted vs actual values.

        Args:
            save_path: Path to save the plot
        """
        try:
            if self.y_pred is None:
                self.predict()

            plt.figure(figsize=(8, 6))
            plt.scatter(self.y_test, self.y_pred, alpha=0.5)
            plt.plot([self.y_test.min(), self.y_test.max()],
                    [self.y_test.min(), self.y_test.max()],
                    'r--', lw=2)
            plt.xlabel('Actual Values')
            plt.ylabel('Predicted Values')
            plt.title('Predicted vs Actual Values')
            plt.grid(True)

            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                logger.info(f"Predictions plot saved to {save_path}")

            plt.close()

        except Exception as e:
            logger.error(f"Error plotting predictions: {str(e)}")
            raise

    def plot_residuals(self, save_path: Optional[str] = None) -> None:
        """
        Plot residuals.

        Args:
            save_path: Path to save the plot
        """
        try:
            if self.y_pred is None:
                self.predict()

            residuals = self.y_test - self.y_pred

            fig, axes = plt.subplots(1, 2, figsize=(14, 5))

            # Residual plot
            axes[0].scatter(self.y_pred, residuals, alpha=0.5)
            axes[0].axhline(y=0, color='r', linestyle='--')
            axes[0].set_xlabel('Predicted Values')
            axes[0].set_ylabel('Residuals')
            axes[0].set_title('Residual Plot')
            axes[0].grid(True)

            # Residual histogram
            axes[1].hist(residuals, bins=30, edgecolor='black')
            axes[1].set_xlabel('Residuals')
            axes[1].set_ylabel('Frequency')
            axes[1].set_title('Residual Distribution')
            axes[1].grid(True)

            plt.tight_layout()

            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                logger.info(f"Residuals plot saved to {save_path}")

            plt.close()

        except Exception as e:
            logger.error(f"Error plotting residuals: {str(e)}")
            raise


class CrossValidationEvaluator:
    """
    Perform cross-validation evaluation.
    """

    def __init__(self, model, X, y, cv: int = 5):
        """
        Initialize the CrossValidationEvaluator.

        Args:
            model: Model to evaluate
            X: Features
            y: Labels
            cv: Number of folds
        """
        self.model = model
        self.X = X
        self.y = y
        self.cv = cv
        self.cv_scores = None

    def evaluate(self, scoring: str = 'accuracy') -> Dict[str, float]:
        """
        Perform cross-validation.

        Args:
            scoring: Scoring metric

        Returns:
            Dictionary with CV results
        """
        try:
            logger.info(f"Performing {self.cv}-fold cross-validation...")

            self.cv_scores = cross_val_score(
                self.model, self.X, self.y,
                cv=self.cv, scoring=scoring, n_jobs=-1
            )

            results = {
                'mean_score': self.cv_scores.mean(),
                'std_score': self.cv_scores.std(),
                'min_score': self.cv_scores.min(),
                'max_score': self.cv_scores.max(),
                'scores': self.cv_scores.tolist()
            }

            logger.info(f"CV Score: {results['mean_score']:.4f} (+/- {results['std_score']:.4f})")

            return results

        except Exception as e:
            logger.error(f"Error performing cross-validation: {str(e)}")
            raise

    def plot_cv_scores(self, save_path: Optional[str] = None) -> None:
        """
        Plot cross-validation scores.

        Args:
            save_path: Path to save the plot
        """
        try:
            if self.cv_scores is None:
                raise ValueError("Cross-validation not performed yet")

            plt.figure(figsize=(8, 6))
            plt.bar(range(1, self.cv + 1), self.cv_scores)
            plt.axhline(y=self.cv_scores.mean(), color='r', linestyle='--',
                       label=f'Mean: {self.cv_scores.mean():.4f}')
            plt.xlabel('Fold')
            plt.ylabel('Score')
            plt.title(f'{self.cv}-Fold Cross-Validation Scores')
            plt.legend()
            plt.grid(True)

            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                logger.info(f"CV scores plot saved to {save_path}")

            plt.close()

        except Exception as e:
            logger.error(f"Error plotting CV scores: {str(e)}")
            raise


class LearningCurveEvaluator:
    """
    Generate and plot learning curves.
    """

    def __init__(self, model, X, y, cv: int = 5):
        """
        Initialize the LearningCurveEvaluator.

        Args:
            model: Model to evaluate
            X: Features
            y: Labels
            cv: Number of folds
        """
        self.model = model
        self.X = X
        self.y = y
        self.cv = cv
        self.train_sizes = None
        self.train_scores = None
        self.val_scores = None

    def calculate_learning_curve(
        self,
        train_sizes: np.ndarray = np.linspace(0.1, 1.0, 10),
        scoring: str = 'accuracy'
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Calculate learning curve.

        Args:
            train_sizes: Training set sizes
            scoring: Scoring metric

        Returns:
            Tuple of (train_sizes, train_scores, validation_scores)
        """
        try:
            logger.info("Calculating learning curve...")

            self.train_sizes, self.train_scores, self.val_scores = learning_curve(
                self.model, self.X, self.y,
                cv=self.cv,
                train_sizes=train_sizes,
                scoring=scoring,
                n_jobs=-1
            )

            logger.info("Learning curve calculated")

            return self.train_sizes, self.train_scores, self.val_scores

        except Exception as e:
            logger.error(f"Error calculating learning curve: {str(e)}")
            raise

    def plot_learning_curve(self, save_path: Optional[str] = None) -> None:
        """
        Plot learning curve.

        Args:
            save_path: Path to save the plot
        """
        try:
            if self.train_sizes is None:
                self.calculate_learning_curve()

            train_mean = np.mean(self.train_scores, axis=1)
            train_std = np.std(self.train_scores, axis=1)
            val_mean = np.mean(self.val_scores, axis=1)
            val_std = np.std(self.val_scores, axis=1)

            plt.figure(figsize=(10, 6))
            plt.plot(self.train_sizes, train_mean, label='Training score', marker='o')
            plt.fill_between(self.train_sizes, train_mean - train_std,
                           train_mean + train_std, alpha=0.1)

            plt.plot(self.train_sizes, val_mean, label='Validation score', marker='s')
            plt.fill_between(self.train_sizes, val_mean - val_std,
                           val_mean + val_std, alpha=0.1)

            plt.xlabel('Training Set Size')
            plt.ylabel('Score')
            plt.title('Learning Curve')
            plt.legend(loc='best')
            plt.grid(True)

            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                logger.info(f"Learning curve plot saved to {save_path}")

            plt.close()

        except Exception as e:
            logger.error(f"Error plotting learning curve: {str(e)}")
            raise


def example_classification_evaluation():
    """Example: Evaluate a classification model."""
    logger.info("=" * 60)
    logger.info("Classification Evaluation Example")
    logger.info("=" * 60)

    # Generate sample data
    X, y = make_classification(
        n_samples=1000, n_features=20, n_informative=15,
        n_classes=2, random_state=42
    )

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate
    evaluator = ClassificationEvaluator(model, X_test, y_test)

    # Calculate metrics
    metrics = evaluator.calculate_metrics()
    logger.info(f"\nMetrics:\n{json.dumps(metrics, indent=2)}")

    # Classification report
    report = evaluator.get_classification_report()
    logger.info(f"\nClassification Report:\n{report}")

    # Plot confusion matrix
    Path('evaluation_plots').mkdir(exist_ok=True)
    evaluator.plot_confusion_matrix('evaluation_plots/confusion_matrix.png')

    # Plot ROC curve
    evaluator.plot_roc_curve('evaluation_plots/roc_curve.png')

    # Plot PR curve
    evaluator.plot_precision_recall_curve('evaluation_plots/pr_curve.png')


def example_regression_evaluation():
    """Example: Evaluate a regression model."""
    logger.info("=" * 60)
    logger.info("Regression Evaluation Example")
    logger.info("=" * 60)

    # Generate sample data
    X, y = make_regression(
        n_samples=1000, n_features=20, n_informative=15,
        noise=10, random_state=42
    )

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Train model
    model = GradientBoostingRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate
    evaluator = RegressionEvaluator(model, X_test, y_test)

    # Calculate metrics
    metrics = evaluator.calculate_metrics()
    logger.info(f"\nMetrics:\n{json.dumps(metrics, indent=2)}")

    # Plot predictions
    Path('evaluation_plots').mkdir(exist_ok=True)
    evaluator.plot_predictions('evaluation_plots/predictions.png')

    # Plot residuals
    evaluator.plot_residuals('evaluation_plots/residuals.png')


def example_cross_validation():
    """Example: Cross-validation evaluation."""
    logger.info("=" * 60)
    logger.info("Cross-Validation Example")
    logger.info("=" * 60)

    # Generate sample data
    X, y = make_classification(
        n_samples=1000, n_features=20, n_informative=15,
        n_classes=2, random_state=42
    )

    # Create model
    model = RandomForestClassifier(n_estimators=100, random_state=42)

    # Evaluate with cross-validation
    evaluator = CrossValidationEvaluator(model, X, y, cv=5)
    results = evaluator.evaluate(scoring='accuracy')

    logger.info(f"\nCV Results:\n{json.dumps(results, indent=2)}")

    # Plot CV scores
    Path('evaluation_plots').mkdir(exist_ok=True)
    evaluator.plot_cv_scores('evaluation_plots/cv_scores.png')


def example_learning_curve():
    """Example: Learning curve analysis."""
    logger.info("=" * 60)
    logger.info("Learning Curve Example")
    logger.info("=" * 60)

    # Generate sample data
    X, y = make_classification(
        n_samples=1000, n_features=20, n_informative=15,
        n_classes=2, random_state=42
    )

    # Create model
    model = RandomForestClassifier(n_estimators=100, random_state=42)

    # Calculate learning curve
    evaluator = LearningCurveEvaluator(model, X, y, cv=5)
    evaluator.calculate_learning_curve()

    # Plot learning curve
    Path('evaluation_plots').mkdir(exist_ok=True)
    evaluator.plot_learning_curve('evaluation_plots/learning_curve.png')


if __name__ == "__main__":
    # Run examples
    example_classification_evaluation()
    print("\n")

    example_regression_evaluation()
    print("\n")

    example_cross_validation()
    print("\n")

    example_learning_curve()

    logger.info("\nAll evaluation examples completed!")
    logger.info("Check the 'evaluation_plots' directory for generated visualizations")
