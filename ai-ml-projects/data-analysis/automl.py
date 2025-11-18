"""
AutoML - 自动化机器学习
自动化特征工程、模型选择、超参数调优
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
from sklearn.svm import SVC, SVR
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    mean_squared_error, mean_absolute_error, r2_score
)
from typing import Dict, List, Optional, Tuple, Any
import joblib
import warnings
warnings.filterwarnings('ignore')


class AutoML:
    """自动化机器学习系统"""

    def __init__(self, task: str = 'classification', time_budget: int = 300):
        """
        初始化AutoML

        Args:
            task: 任务类型 ('classification' 或 'regression')
            time_budget: 时间预算（秒）
        """
        if task not in ['classification', 'regression']:
            raise ValueError("Task must be 'classification' or 'regression'")

        self.task = task
        self.time_budget = time_budget
        self.best_model = None
        self.best_score = None
        self.best_params = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = None
        self.results = []

    def _get_models(self) -> Dict[str, Any]:
        """获取候选模型列表"""
        if self.task == 'classification':
            return {
                'logistic_regression': LogisticRegression(max_iter=1000, random_state=42),
                'random_forest': RandomForestClassifier(random_state=42),
                'gradient_boosting': GradientBoostingClassifier(random_state=42),
                'svm': SVC(probability=True, random_state=42)
            }
        else:  # regression
            return {
                'linear_regression': LinearRegression(),
                'ridge': Ridge(random_state=42),
                'lasso': Lasso(random_state=42),
                'random_forest': RandomForestRegressor(random_state=42),
                'gradient_boosting': GradientBoostingRegressor(random_state=42),
                'svr': SVR()
            }

    def _get_param_grids(self) -> Dict[str, Dict]:
        """获取超参数搜索空间"""
        if self.task == 'classification':
            return {
                'logistic_regression': {
                    'C': [0.01, 0.1, 1, 10, 100],
                    'penalty': ['l2'],
                    'solver': ['lbfgs']
                },
                'random_forest': {
                    'n_estimators': [50, 100, 200],
                    'max_depth': [5, 10, 20, None],
                    'min_samples_split': [2, 5, 10],
                    'min_samples_leaf': [1, 2, 4]
                },
                'gradient_boosting': {
                    'n_estimators': [50, 100, 200],
                    'learning_rate': [0.01, 0.1, 0.3],
                    'max_depth': [3, 5, 7],
                    'subsample': [0.8, 1.0]
                },
                'svm': {
                    'C': [0.1, 1, 10],
                    'kernel': ['rbf', 'linear'],
                    'gamma': ['scale', 'auto']
                }
            }
        else:  # regression
            return {
                'ridge': {
                    'alpha': [0.01, 0.1, 1, 10, 100]
                },
                'lasso': {
                    'alpha': [0.01, 0.1, 1, 10, 100]
                },
                'random_forest': {
                    'n_estimators': [50, 100, 200],
                    'max_depth': [5, 10, 20, None],
                    'min_samples_split': [2, 5, 10]
                },
                'gradient_boosting': {
                    'n_estimators': [50, 100, 200],
                    'learning_rate': [0.01, 0.1, 0.3],
                    'max_depth': [3, 5, 7]
                },
                'svr': {
                    'C': [0.1, 1, 10],
                    'kernel': ['rbf', 'linear'],
                    'gamma': ['scale', 'auto']
                }
            }

    def preprocess_data(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        test_size: float = 0.2
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        数据预处理

        Args:
            X: 特征数据
            y: 目标变量
            test_size: 测试集比例

        Returns:
            训练集和测试集
        """
        # 保存特征名
        self.feature_names = X.columns.tolist()

        # 处理类别变量
        X_processed = X.copy()
        categorical_cols = X_processed.select_dtypes(include=['object', 'category']).columns

        for col in categorical_cols:
            le = LabelEncoder()
            X_processed[col] = le.fit_transform(X_processed[col].astype(str))
            self.label_encoders[col] = le

        # 处理缺失值
        X_processed = X_processed.fillna(X_processed.mean())

        # 分割数据
        X_train, X_test, y_train, y_test = train_test_split(
            X_processed, y,
            test_size=test_size,
            random_state=42,
            stratify=y if self.task == 'classification' and y.nunique() < 20 else None
        )

        # 特征缩放
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        return X_train_scaled, X_test_scaled, y_train.values, y_test.values

    def fit(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        cv: int = 5,
        search_method: str = 'random',
        n_iter: int = 20
    ) -> Dict[str, Any]:
        """
        训练AutoML系统

        Args:
            X: 特征数据
            y: 目标变量
            cv: 交叉验证折数
            search_method: 搜索方法 ('grid' 或 'random')
            n_iter: 随机搜索迭代次数

        Returns:
            训练结果
        """
        print("=" * 80)
        print("AutoML 训练开始")
        print("=" * 80)

        # 数据预处理
        print("\n1. 数据预处理...")
        X_train, X_test, y_train, y_test = self.preprocess_data(X, y)
        print(f"   训练集: {X_train.shape[0]} 样本")
        print(f"   测试集: {X_test.shape[0]} 样本")
        print(f"   特征数: {X_train.shape[1]}")

        # 获取模型和参数空间
        models = self._get_models()
        param_grids = self._get_param_grids()

        # 评估指标
        scoring = 'accuracy' if self.task == 'classification' else 'r2'

        print(f"\n2. 模型训练与选择 (评估指标: {scoring})...")
        print("-" * 80)

        # 遍历所有模型
        for model_name, model in models.items():
            print(f"\n   训练 {model_name}...")

            try:
                # 超参数搜索
                if model_name in param_grids:
                    param_grid = param_grids[model_name]

                    if search_method == 'grid':
                        search = GridSearchCV(
                            model, param_grid,
                            cv=cv, scoring=scoring,
                            n_jobs=-1, verbose=0
                        )
                    else:  # random
                        search = RandomizedSearchCV(
                            model, param_grid,
                            n_iter=n_iter, cv=cv,
                            scoring=scoring,
                            n_jobs=-1, verbose=0,
                            random_state=42
                        )

                    search.fit(X_train, y_train)
                    best_model = search.best_estimator_
                    best_params = search.best_params_
                    cv_score = search.best_score_
                else:
                    # 无参数搜索，直接训练
                    model.fit(X_train, y_train)
                    best_model = model
                    best_params = {}
                    scores = cross_val_score(model, X_train, y_train, cv=cv, scoring=scoring)
                    cv_score = scores.mean()

                # 在测试集上评估
                if self.task == 'classification':
                    y_pred = best_model.predict(X_test)
                    test_score = accuracy_score(y_test, y_pred)
                    metrics = {
                        'accuracy': accuracy_score(y_test, y_pred),
                        'precision': precision_score(y_test, y_pred, average='weighted', zero_division=0),
                        'recall': recall_score(y_test, y_pred, average='weighted', zero_division=0),
                        'f1': f1_score(y_test, y_pred, average='weighted', zero_division=0)
                    }
                else:  # regression
                    y_pred = best_model.predict(X_test)
                    test_score = r2_score(y_test, y_pred)
                    metrics = {
                        'r2': r2_score(y_test, y_pred),
                        'mse': mean_squared_error(y_test, y_pred),
                        'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
                        'mae': mean_absolute_error(y_test, y_pred)
                    }

                # 保存结果
                result = {
                    'model_name': model_name,
                    'model': best_model,
                    'params': best_params,
                    'cv_score': cv_score,
                    'test_score': test_score,
                    'metrics': metrics
                }
                self.results.append(result)

                print(f"   ✓ CV Score: {cv_score:.4f}")
                print(f"   ✓ Test Score: {test_score:.4f}")
                print(f"   ✓ Best Params: {best_params}")

                # 更新最佳模型
                if self.best_score is None or cv_score > self.best_score:
                    self.best_score = cv_score
                    self.best_model = best_model
                    self.best_params = best_params

            except Exception as e:
                print(f"   ✗ 训练失败: {str(e)}")
                continue

        # 总结
        print("\n" + "=" * 80)
        print("3. 训练结果总结")
        print("=" * 80)

        # 按性能排序
        self.results.sort(key=lambda x: x['cv_score'], reverse=True)

        print(f"\n{'模型':<25} {'CV Score':<12} {'Test Score':<12}")
        print("-" * 50)
        for result in self.results:
            print(f"{result['model_name']:<25} {result['cv_score']:<12.4f} {result['test_score']:<12.4f}")

        print(f"\n最佳模型: {self.results[0]['model_name']}")
        print(f"CV Score: {self.results[0]['cv_score']:.4f}")
        print(f"Test Score: {self.results[0]['test_score']:.4f}")
        print(f"最佳参数: {self.results[0]['params']}")

        print("\n详细指标:")
        for metric, value in self.results[0]['metrics'].items():
            print(f"  {metric}: {value:.4f}")

        return {
            'best_model': self.best_model,
            'best_score': self.best_score,
            'best_params': self.best_params,
            'all_results': self.results
        }

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        使用最佳模型进行预测

        Args:
            X: 特征数据

        Returns:
            预测结果
        """
        if self.best_model is None:
            raise ValueError("模型未训练，请先调用 fit()")

        # 预处理
        X_processed = X.copy()
        for col, le in self.label_encoders.items():
            if col in X_processed.columns:
                X_processed[col] = le.transform(X_processed[col].astype(str))

        X_processed = X_processed.fillna(X_processed.mean())
        X_scaled = self.scaler.transform(X_processed)

        return self.best_model.predict(X_scaled)

    def get_feature_importance(self, top_n: int = 10) -> pd.DataFrame:
        """
        获取特征重要性

        Args:
            top_n: 返回前N个重要特征

        Returns:
            特征重要性DataFrame
        """
        if self.best_model is None:
            raise ValueError("模型未训练，请先调用 fit()")

        if hasattr(self.best_model, 'feature_importances_'):
            importance = pd.DataFrame({
                'feature': self.feature_names,
                'importance': self.best_model.feature_importances_
            }).sort_values('importance', ascending=False).head(top_n)

            return importance
        elif hasattr(self.best_model, 'coef_'):
            importance = pd.DataFrame({
                'feature': self.feature_names,
                'importance': np.abs(self.best_model.coef_.ravel())
            }).sort_values('importance', ascending=False).head(top_n)

            return importance
        else:
            print("该模型不支持特征重要性分析")
            return None

    def save(self, path: str):
        """
        保存模型

        Args:
            path: 保存路径
        """
        if self.best_model is None:
            raise ValueError("模型未训练，请先调用 fit()")

        model_data = {
            'model': self.best_model,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names,
            'task': self.task,
            'best_score': self.best_score,
            'best_params': self.best_params
        }

        joblib.dump(model_data, path)
        print(f"模型已保存到: {path}")

    def load(self, path: str):
        """
        加载模型

        Args:
            path: 模型路径
        """
        model_data = joblib.load(path)

        self.best_model = model_data['model']
        self.scaler = model_data['scaler']
        self.label_encoders = model_data['label_encoders']
        self.feature_names = model_data['feature_names']
        self.task = model_data['task']
        self.best_score = model_data['best_score']
        self.best_params = model_data['best_params']

        print(f"模型已从 {path} 加载")
        print(f"任务类型: {self.task}")
        print(f"最佳分数: {self.best_score:.4f}")


def main():
    """示例用法"""
    from sklearn.datasets import load_iris, load_diabetes

    # 分类任务示例
    print("=" * 80)
    print("分类任务示例")
    print("=" * 80)

    iris = load_iris()
    X_cls = pd.DataFrame(iris.data, columns=iris.feature_names)
    y_cls = pd.Series(iris.target)

    # 初始化AutoML
    automl_cls = AutoML(task='classification', time_budget=300)

    # 训练
    results_cls = automl_cls.fit(X_cls, y_cls, cv=5, search_method='random', n_iter=10)

    # 特征重要性
    importance = automl_cls.get_feature_importance(top_n=5)
    if importance is not None:
        print("\n特征重要性:")
        print(importance)

    # 回归任务示例
    print("\n\n" + "=" * 80)
    print("回归任务示例")
    print("=" * 80)

    diabetes = load_diabetes()
    X_reg = pd.DataFrame(diabetes.data, columns=diabetes.feature_names)
    y_reg = pd.Series(diabetes.target)

    # 初始化AutoML
    automl_reg = AutoML(task='regression', time_budget=300)

    # 训练
    results_reg = automl_reg.fit(X_reg, y_reg, cv=5, search_method='random', n_iter=10)

    # 特征重要性
    importance = automl_reg.get_feature_importance(top_n=5)
    if importance is not None:
        print("\n特征重要性:")
        print(importance)


if __name__ == '__main__':
    main()
