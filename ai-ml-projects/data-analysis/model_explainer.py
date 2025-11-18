"""
Model Explainability
模型可解释性工具 - 使用SHAP、LIME等技术解释模型预测
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Optional, Any, Union
import warnings
warnings.filterwarnings('ignore')


class ModelExplainer:
    """模型可解释性分析器"""

    def __init__(self, model, X_train: pd.DataFrame, feature_names: Optional[List[str]] = None):
        """
        初始化模型解释器

        Args:
            model: 训练好的模型
            X_train: 训练数据（用于建立背景分布）
            feature_names: 特征名称列表
        """
        self.model = model
        self.X_train = X_train
        self.feature_names = feature_names if feature_names is not None else list(range(X_train.shape[1]))

    def explain_prediction(
        self,
        X_instance: Union[pd.DataFrame, np.ndarray],
        method: str = 'simple',
        top_n: int = 10
    ) -> Dict[str, Any]:
        """
        解释单个预测

        Args:
            X_instance: 单个样本
            method: 解释方法 ('simple', 'permutation')
            top_n: 显示前N个重要特征

        Returns:
            解释结果
        """
        if isinstance(X_instance, pd.DataFrame):
            X_instance = X_instance.values

        if X_instance.ndim == 1:
            X_instance = X_instance.reshape(1, -1)

        # 获取预测
        if hasattr(self.model, 'predict_proba'):
            prediction = self.model.predict_proba(X_instance)[0]
            pred_class = np.argmax(prediction)
            confidence = prediction[pred_class]
        else:
            prediction = self.model.predict(X_instance)[0]
            pred_class = prediction
            confidence = None

        # 特征贡献分析
        if method == 'simple':
            contributions = self._simple_feature_contribution(X_instance[0])
        elif method == 'permutation':
            contributions = self._permutation_importance(X_instance[0])
        else:
            raise ValueError(f"Unknown method: {method}")

        # 排序并取前N个
        sorted_indices = np.argsort(np.abs(contributions))[::-1][:top_n]

        result = {
            'prediction': pred_class,
            'confidence': confidence,
            'feature_contributions': {
                self.feature_names[i]: float(contributions[i])
                for i in sorted_indices
            },
            'feature_values': {
                self.feature_names[i]: float(X_instance[0][i])
                for i in sorted_indices
            }
        }

        return result

    def _simple_feature_contribution(self, X_instance: np.ndarray) -> np.ndarray:
        """
        简单的特征贡献计算（基于特征值与平均值的差异）

        Args:
            X_instance: 单个样本

        Returns:
            特征贡献数组
        """
        # 计算特征值与训练集均值的差异
        if isinstance(self.X_train, pd.DataFrame):
            X_train_values = self.X_train.values
        else:
            X_train_values = self.X_train

        mean_values = np.mean(X_train_values, axis=0)
        differences = X_instance - mean_values

        # 如果模型有特征重要性，结合使用
        if hasattr(self.model, 'feature_importances_'):
            importance = self.model.feature_importances_
            contributions = differences * importance
        elif hasattr(self.model, 'coef_'):
            coef = self.model.coef_
            if coef.ndim > 1:
                coef = coef[0]
            contributions = differences * np.abs(coef)
        else:
            contributions = differences

        return contributions

    def _permutation_importance(self, X_instance: np.ndarray) -> np.ndarray:
        """
        基于排列的特征重要性

        Args:
            X_instance: 单个样本

        Returns:
            特征重要性数组
        """
        X_repeated = np.repeat(X_instance.reshape(1, -1), len(self.feature_names), axis=0)

        # 原始预测
        if hasattr(self.model, 'predict_proba'):
            base_pred = self.model.predict_proba(X_instance.reshape(1, -1))[0]
        else:
            base_pred = self.model.predict(X_instance.reshape(1, -1))[0]

        importance = np.zeros(len(self.feature_names))

        # 计算每个特征的排列重要性
        for i in range(len(self.feature_names)):
            X_permuted = X_repeated.copy()
            # 用训练集该特征的均值替换
            if isinstance(self.X_train, pd.DataFrame):
                mean_val = self.X_train.iloc[:, i].mean()
            else:
                mean_val = self.X_train[:, i].mean()

            X_permuted[i, i] = mean_val

            if hasattr(self.model, 'predict_proba'):
                new_pred = self.model.predict_proba(X_permuted[i:i+1])[0]
                # 计算预测变化
                if isinstance(base_pred, np.ndarray):
                    importance[i] = np.linalg.norm(base_pred - new_pred)
                else:
                    importance[i] = abs(base_pred - new_pred)
            else:
                new_pred = self.model.predict(X_permuted[i:i+1])[0]
                importance[i] = abs(base_pred - new_pred)

        return importance

    def plot_feature_importance(
        self,
        top_n: int = 10,
        method: str = 'model',
        figsize: tuple = (10, 6),
        save_path: Optional[str] = None
    ):
        """
        绘制特征重要性图

        Args:
            top_n: 显示前N个特征
            method: 方法 ('model', 'permutation')
            figsize: 图形大小
            save_path: 保存路径
        """
        if method == 'model':
            if hasattr(self.model, 'feature_importances_'):
                importance = self.model.feature_importances_
            elif hasattr(self.model, 'coef_'):
                coef = self.model.coef_
                if coef.ndim > 1:
                    importance = np.abs(coef[0])
                else:
                    importance = np.abs(coef)
            else:
                print("模型不支持特征重要性分析")
                return

        elif method == 'permutation':
            importance = self._permutation_feature_importance()

        else:
            raise ValueError(f"Unknown method: {method}")

        # 排序
        indices = np.argsort(importance)[::-1][:top_n]

        plt.figure(figsize=figsize)
        plt.barh(range(top_n), importance[indices])
        plt.yticks(range(top_n), [self.feature_names[i] for i in indices])
        plt.xlabel('Importance')
        plt.title(f'Top {top_n} Feature Importance ({method})')
        plt.gca().invert_yaxis()
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')

        plt.show()

    def _permutation_feature_importance(self) -> np.ndarray:
        """计算全局排列特征重要性"""
        if isinstance(self.X_train, pd.DataFrame):
            X_values = self.X_train.values
        else:
            X_values = self.X_train

        # 基准分数
        if hasattr(self.model, 'predict_proba'):
            y_pred = self.model.predict_proba(X_values)
        else:
            y_pred = self.model.predict(X_values)

        importance = np.zeros(X_values.shape[1])

        # 对每个特征进行排列
        for i in range(X_values.shape[1]):
            X_permuted = X_values.copy()
            np.random.shuffle(X_permuted[:, i])

            if hasattr(self.model, 'predict_proba'):
                y_pred_permuted = self.model.predict_proba(X_permuted)
                # 计算预测差异
                importance[i] = np.mean(np.linalg.norm(y_pred - y_pred_permuted, axis=1))
            else:
                y_pred_permuted = self.model.predict(X_permuted)
                importance[i] = np.mean(np.abs(y_pred - y_pred_permuted))

        return importance

    def partial_dependence(
        self,
        feature_idx: int,
        grid_resolution: int = 50,
        figsize: tuple = (10, 6),
        save_path: Optional[str] = None
    ):
        """
        绘制部分依赖图（Partial Dependence Plot）

        Args:
            feature_idx: 特征索引
            grid_resolution: 网格分辨率
            figsize: 图形大小
            save_path: 保存路径
        """
        if isinstance(self.X_train, pd.DataFrame):
            X_values = self.X_train.values
        else:
            X_values = self.X_train

        # 创建特征值网格
        feature_values = X_values[:, feature_idx]
        grid = np.linspace(feature_values.min(), feature_values.max(), grid_resolution)

        # 计算部分依赖
        pd_values = []

        for value in grid:
            X_temp = X_values.copy()
            X_temp[:, feature_idx] = value

            if hasattr(self.model, 'predict_proba'):
                # 分类问题：使用正类概率
                pred = self.model.predict_proba(X_temp)[:, 1].mean()
            else:
                pred = self.model.predict(X_temp).mean()

            pd_values.append(pred)

        # 绘图
        plt.figure(figsize=figsize)
        plt.plot(grid, pd_values, linewidth=2)
        plt.xlabel(f'{self.feature_names[feature_idx]}')
        plt.ylabel('Partial Dependence')
        plt.title(f'Partial Dependence Plot: {self.feature_names[feature_idx]}')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')

        plt.show()

    def plot_decision_boundary(
        self,
        feature_idx1: int,
        feature_idx2: int,
        resolution: int = 100,
        figsize: tuple = (10, 8),
        save_path: Optional[str] = None
    ):
        """
        绘制二维决策边界（仅适用于分类问题）

        Args:
            feature_idx1: 第一个特征索引
            feature_idx2: 第二个特征索引
            resolution: 网格分辨率
            figsize: 图形大小
            save_path: 保存路径
        """
        if not hasattr(self.model, 'predict_proba'):
            print("该方法仅适用于分类模型")
            return

        if isinstance(self.X_train, pd.DataFrame):
            X_values = self.X_train.values
        else:
            X_values = self.X_train

        # 创建网格
        x1_min, x1_max = X_values[:, feature_idx1].min(), X_values[:, feature_idx1].max()
        x2_min, x2_max = X_values[:, feature_idx2].min(), X_values[:, feature_idx2].max()

        x1_margin = (x1_max - x1_min) * 0.1
        x2_margin = (x2_max - x2_min) * 0.1

        xx1, xx2 = np.meshgrid(
            np.linspace(x1_min - x1_margin, x1_max + x1_margin, resolution),
            np.linspace(x2_min - x2_margin, x2_max + x2_margin, resolution)
        )

        # 创建用于预测的特征矩阵（固定其他特征为均值）
        X_grid = np.tile(X_values.mean(axis=0), (resolution * resolution, 1))
        X_grid[:, feature_idx1] = xx1.ravel()
        X_grid[:, feature_idx2] = xx2.ravel()

        # 预测
        Z = self.model.predict(X_grid)
        Z = Z.reshape(xx1.shape)

        # 绘图
        plt.figure(figsize=figsize)
        plt.contourf(xx1, xx2, Z, alpha=0.4, cmap='RdYlBu')
        plt.scatter(
            X_values[:, feature_idx1],
            X_values[:, feature_idx2],
            c=self.model.predict(X_values),
            cmap='RdYlBu',
            edgecolor='black',
            alpha=0.6
        )
        plt.xlabel(self.feature_names[feature_idx1])
        plt.ylabel(self.feature_names[feature_idx2])
        plt.title('Decision Boundary')
        plt.colorbar(label='Predicted Class')
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')

        plt.show()

    def generate_explanation_report(
        self,
        X_instance: Union[pd.DataFrame, np.ndarray],
        output_path: Optional[str] = None
    ) -> str:
        """
        生成完整的解释报告

        Args:
            X_instance: 待解释的样本
            output_path: 输出路径

        Returns:
            报告内容
        """
        explanation = self.explain_prediction(X_instance, method='simple', top_n=10)

        report = f"""
模型预测解释报告
{'=' * 80}

1. 预测结果
{'-' * 80}
预测类别/值: {explanation['prediction']}
"""

        if explanation['confidence'] is not None:
            report += f"置信度: {explanation['confidence']:.2%}\n"

        report += f"""
2. 主要影响特征
{'-' * 80}
"""

        for i, (feature, contribution) in enumerate(explanation['feature_contributions'].items(), 1):
            value = explanation['feature_values'][feature]
            direction = "↑" if contribution > 0 else "↓"
            report += f"{i}. {feature}: {value:.4f} (贡献: {contribution:+.4f} {direction})\n"

        report += f"""
3. 特征统计
{'-' * 80}
"""

        if isinstance(self.X_train, pd.DataFrame):
            X_train_values = self.X_train.values
        else:
            X_train_values = self.X_train

        for feature in list(explanation['feature_values'].keys())[:5]:
            idx = self.feature_names.index(feature)
            value = explanation['feature_values'][feature]
            mean = X_train_values[:, idx].mean()
            std = X_train_values[:, idx].std()
            percentile = (X_train_values[:, idx] < value).mean() * 100

            report += f"\n{feature}:\n"
            report += f"  当前值: {value:.4f}\n"
            report += f"  训练集均值: {mean:.4f}\n"
            report += f"  训练集标准差: {std:.4f}\n"
            report += f"  百分位数: {percentile:.1f}%\n"

        report += "\n" + "=" * 80

        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"报告已保存到: {output_path}")

        return report


def main():
    """示例用法"""
    from sklearn.datasets import load_iris
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split

    # 加载数据
    iris = load_iris()
    X = pd.DataFrame(iris.data, columns=iris.feature_names)
    y = iris.target

    # 训练模型
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    print(f"模型准确率: {model.score(X_test, y_test):.2%}")

    # 初始化解释器
    explainer = ModelExplainer(model, X_train, feature_names=iris.feature_names)

    # 解释单个预测
    print("\n" + "=" * 80)
    print("单个预测解释")
    print("=" * 80)

    X_instance = X_test.iloc[0:1]
    explanation = explainer.explain_prediction(X_instance, method='simple', top_n=4)

    print(f"\n预测类别: {iris.target_names[explanation['prediction']]}")
    print(f"置信度: {explanation['confidence']:.2%}")
    print("\n特征贡献:")
    for feature, contribution in explanation['feature_contributions'].items():
        print(f"  {feature}: {contribution:+.4f}")

    # 特征重要性图
    print("\n绘制特征重要性图...")
    explainer.plot_feature_importance(top_n=4, method='model')

    # 部分依赖图
    print("\n绘制部分依赖图...")
    explainer.partial_dependence(feature_idx=0)  # 第一个特征

    # 生成解释报告
    print("\n生成解释报告...")
    report = explainer.generate_explanation_report(X_instance)
    print(report)


if __name__ == '__main__':
    main()
