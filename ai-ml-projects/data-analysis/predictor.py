"""
Predictive Modeling
Enhanced with XGBoost, LightGBM, and CatBoost support
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    mean_squared_error, mean_absolute_error, r2_score,
    confusion_matrix, classification_report
)
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.svm import SVC, SVR
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from typing import Dict, Optional, Any, List
import joblib
import warnings
warnings.filterwarnings('ignore')

# Try to import XGBoost
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

# Try to import LightGBM
try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False

# Try to import CatBoost
try:
    from catboost import CatBoostClassifier, CatBoostRegressor
    CATBOOST_AVAILABLE = True
except ImportError:
    CATBOOST_AVAILABLE = False


class Predictor:
    """Predictive modeling for classification and regression tasks"""

    def __init__(self, task: str = 'classification'):
        """
        Initialize predictor

        Args:
            task: Task type ('classification' or 'regression')
        """
        if task not in ['classification', 'regression']:
            raise ValueError("Task must be 'classification' or 'regression'")

        self.task = task
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        self.is_fitted = False

    def _get_model(self, model_type: str) -> Any:
        """
        Get model instance

        Args:
            model_type: Type of model

        Returns:
            Model instance
        """
        if self.task == 'classification':
            models = {
                'logistic': LogisticRegression(max_iter=1000, random_state=42),
                'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
                'gradient_boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
                'decision_tree': DecisionTreeClassifier(random_state=42),
                'svm': SVC(probability=True, random_state=42)
            }

            # Add XGBoost if available
            if XGBOOST_AVAILABLE:
                models['xgboost'] = xgb.XGBClassifier(
                    n_estimators=100,
                    learning_rate=0.1,
                    random_state=42,
                    eval_metric='logloss'
                )

            # Add LightGBM if available
            if LIGHTGBM_AVAILABLE:
                models['lightgbm'] = lgb.LGBMClassifier(
                    n_estimators=100,
                    learning_rate=0.1,
                    random_state=42,
                    verbose=-1
                )

            # Add CatBoost if available
            if CATBOOST_AVAILABLE:
                models['catboost'] = CatBoostClassifier(
                    iterations=100,
                    learning_rate=0.1,
                    random_state=42,
                    verbose=False
                )

        else:  # regression
            models = {
                'linear': LinearRegression(),
                'ridge': Ridge(random_state=42),
                'lasso': Lasso(random_state=42),
                'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
                'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
                'decision_tree': DecisionTreeRegressor(random_state=42),
                'svm': SVR()
            }

            # Add XGBoost if available
            if XGBOOST_AVAILABLE:
                models['xgboost'] = xgb.XGBRegressor(
                    n_estimators=100,
                    learning_rate=0.1,
                    random_state=42
                )

            # Add LightGBM if available
            if LIGHTGBM_AVAILABLE:
                models['lightgbm'] = lgb.LGBMRegressor(
                    n_estimators=100,
                    learning_rate=0.1,
                    random_state=42,
                    verbose=-1
                )

            # Add CatBoost if available
            if CATBOOST_AVAILABLE:
                models['catboost'] = CatBoostRegressor(
                    iterations=100,
                    learning_rate=0.1,
                    random_state=42,
                    verbose=False
                )

        if model_type not in models:
            available = ', '.join(models.keys())
            raise ValueError(f"Unknown model type: {model_type}. Available: {available}")

        return models[model_type]

    def train(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        model_type: str = 'random_forest',
        scale: bool = True,
        cv: Optional[int] = None
    ) -> Dict[str, float]:
        """
        Train the model

        Args:
            X_train: Training features
            y_train: Training labels
            model_type: Type of model to use
            scale: Whether to scale features
            cv: Number of cross-validation folds

        Returns:
            Training metrics
        """
        self.feature_names = X_train.columns.tolist()

        # Scale features
        if scale:
            X_train_scaled = self.scaler.fit_transform(X_train)
        else:
            X_train_scaled = X_train.values

        # Initialize model
        self.model = self._get_model(model_type)

        # Train model
        print(f"Training {model_type} model...")
        self.model.fit(X_train_scaled, y_train)
        self.is_fitted = True

        # Cross-validation
        metrics = {}
        if cv:
            print(f"Performing {cv}-fold cross-validation...")
            if self.task == 'classification':
                scores = cross_val_score(self.model, X_train_scaled, y_train, cv=cv, scoring='accuracy')
                metrics['cv_accuracy_mean'] = float(scores.mean())
                metrics['cv_accuracy_std'] = float(scores.std())
            else:
                scores = cross_val_score(self.model, X_train_scaled, y_train, cv=cv, scoring='r2')
                metrics['cv_r2_mean'] = float(scores.mean())
                metrics['cv_r2_std'] = float(scores.std())

            print(f"CV Score: {scores.mean():.4f} (+/- {scores.std():.4f})")

        # Training score
        train_predictions = self.model.predict(X_train_scaled)
        if self.task == 'classification':
            metrics['train_accuracy'] = float(accuracy_score(y_train, train_predictions))
        else:
            metrics['train_r2'] = float(r2_score(y_train, train_predictions))

        return metrics

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions

        Args:
            X: Features

        Returns:
            Predictions
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call train() first.")

        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predict class probabilities (classification only)

        Args:
            X: Features

        Returns:
            Class probabilities
        """
        if self.task != 'classification':
            raise ValueError("predict_proba only available for classification")

        if not self.is_fitted:
            raise ValueError("Model not fitted. Call train() first.")

        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)

    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, float]:
        """
        Evaluate model performance

        Args:
            X_test: Test features
            y_test: Test labels

        Returns:
            Dictionary of metrics
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call train() first.")

        predictions = self.predict(X_test)
        metrics = {}

        if self.task == 'classification':
            metrics['accuracy'] = float(accuracy_score(y_test, predictions))
            metrics['precision'] = float(precision_score(y_test, predictions, average='weighted', zero_division=0))
            metrics['recall'] = float(recall_score(y_test, predictions, average='weighted', zero_division=0))
            metrics['f1'] = float(f1_score(y_test, predictions, average='weighted', zero_division=0))

            # ROC AUC for binary classification
            if len(np.unique(y_test)) == 2:
                try:
                    proba = self.predict_proba(X_test)
                    metrics['roc_auc'] = float(roc_auc_score(y_test, proba[:, 1]))
                except:
                    pass

            # Confusion matrix
            cm = confusion_matrix(y_test, predictions)
            metrics['confusion_matrix'] = cm.tolist()

        else:  # regression
            metrics['mse'] = float(mean_squared_error(y_test, predictions))
            metrics['rmse'] = float(np.sqrt(metrics['mse']))
            metrics['mae'] = float(mean_absolute_error(y_test, predictions))
            metrics['r2'] = float(r2_score(y_test, predictions))

        return metrics

    def feature_importance(self, top_n: int = 10) -> pd.DataFrame:
        """
        Get feature importance (for tree-based models)

        Args:
            top_n: Number of top features to return

        Returns:
            DataFrame with feature importance
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call train() first.")

        if not hasattr(self.model, 'feature_importances_'):
            raise ValueError("Model does not support feature importance")

        importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False).head(top_n)

        return importance

    def save_model(self, path: str):
        """
        Save model to disk

        Args:
            path: Save path
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call train() first.")

        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'task': self.task
        }

        joblib.dump(model_data, path)
        print(f"Model saved to {path}")

    def load_model(self, path: str):
        """
        Load model from disk

        Args:
            path: Model file path
        """
        model_data = joblib.load(path)

        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        self.task = model_data['task']
        self.is_fitted = True

        print(f"Model loaded from {path}")

    def list_available_models(self) -> List[str]:
        """
        List all available models for the current task

        Returns:
            List of available model names
        """
        if self.task == 'classification':
            models = ['logistic', 'random_forest', 'gradient_boosting', 'decision_tree', 'svm']
            if XGBOOST_AVAILABLE:
                models.append('xgboost')
            if LIGHTGBM_AVAILABLE:
                models.append('lightgbm')
            if CATBOOST_AVAILABLE:
                models.append('catboost')
        else:  # regression
            models = ['linear', 'ridge', 'lasso', 'random_forest', 'gradient_boosting', 'decision_tree', 'svm']
            if XGBOOST_AVAILABLE:
                models.append('xgboost')
            if LIGHTGBM_AVAILABLE:
                models.append('lightgbm')
            if CATBOOST_AVAILABLE:
                models.append('catboost')

        return models

    def compare_models(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_test: pd.DataFrame,
        y_test: pd.Series,
        models: Optional[List[str]] = None,
        cv: int = 5
    ) -> pd.DataFrame:
        """
        Compare multiple models

        Args:
            X_train: Training features
            y_train: Training labels
            X_test: Test features
            y_test: Test labels
            models: List of model names to compare (None = all available)
            cv: Number of cross-validation folds

        Returns:
            DataFrame with comparison results
        """
        if models is None:
            models = self.list_available_models()

        results = []

        for model_name in models:
            print(f"Training {model_name}...")
            try:
                # Create new instance for each model
                temp_predictor = Predictor(task=self.task)
                temp_predictor.train(X_train, y_train, model_type=model_name, cv=cv)

                # Evaluate
                metrics = temp_predictor.evaluate(X_test, y_test)

                result = {'model': model_name}
                result.update(metrics)
                results.append(result)

            except Exception as e:
                print(f"Error training {model_name}: {str(e)}")
                continue

        results_df = pd.DataFrame(results)

        # Sort by main metric
        if self.task == 'classification':
            results_df = results_df.sort_values('accuracy', ascending=False)
        else:
            results_df = results_df.sort_values('r2', ascending=False)

        return results_df


def main():
    """Example usage"""
    from sklearn.datasets import load_iris, load_diabetes

    # Classification example
    print("=== Classification Example ===")
    iris = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(
        pd.DataFrame(iris.data, columns=iris.feature_names),
        pd.Series(iris.target),
        test_size=0.2,
        random_state=42
    )

    clf = Predictor(task='classification')
    clf.train(X_train, y_train, model_type='random_forest', cv=5)

    metrics = clf.evaluate(X_test, y_test)
    print(f"Accuracy: {metrics['accuracy']:.2%}")
    print(f"F1 Score: {metrics['f1']:.3f}")

    print("\nFeature Importance:")
    print(clf.feature_importance())

    # Regression example
    print("\n=== Regression Example ===")
    diabetes = load_diabetes()
    X_train, X_test, y_train, y_test = train_test_split(
        pd.DataFrame(diabetes.data, columns=diabetes.feature_names),
        pd.Series(diabetes.target),
        test_size=0.2,
        random_state=42
    )

    reg = Predictor(task='regression')
    reg.train(X_train, y_train, model_type='random_forest', cv=5)

    metrics = reg.evaluate(X_test, y_test)
    print(f"R² Score: {metrics['r2']:.3f}")
    print(f"RMSE: {metrics['rmse']:.2f}")


if __name__ == "__main__":
    main()
