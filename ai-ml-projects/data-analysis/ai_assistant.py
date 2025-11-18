"""
AI-Assisted Data Analysis
提供AI辅助的数据分析、洞察生成和自动化建议
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import warnings
warnings.filterwarnings('ignore')


class AIDataAssistant:
    """AI辅助数据分析器"""

    def __init__(self, df: pd.DataFrame):
        """
        初始化AI数据助手

        Args:
            df: 输入数据框
        """
        self.df = df.copy()
        self.numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        self.categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        self.insights = []

    def generate_data_quality_report(self) -> Dict[str, Any]:
        """
        生成数据质量报告

        Returns:
            包含数据质量信息的字典
        """
        report = {
            'overview': {},
            'missing_values': {},
            'duplicates': {},
            'outliers': {},
            'data_types': {},
            'recommendations': []
        }

        # 概览
        report['overview'] = {
            'total_rows': len(self.df),
            'total_columns': len(self.df.columns),
            'numeric_columns': len(self.numeric_cols),
            'categorical_columns': len(self.categorical_cols),
            'memory_usage_mb': self.df.memory_usage(deep=True).sum() / 1024**2
        }

        # 缺失值分析
        missing = self.df.isnull().sum()
        missing_pct = (missing / len(self.df)) * 100
        report['missing_values'] = {
            'columns_with_missing': missing[missing > 0].to_dict(),
            'missing_percentage': missing_pct[missing_pct > 0].to_dict(),
            'total_missing': missing.sum()
        }

        # 重复值
        duplicates = self.df.duplicated().sum()
        report['duplicates'] = {
            'count': int(duplicates),
            'percentage': float(duplicates / len(self.df) * 100)
        }

        # 异常值检测（数值列）
        outliers_info = {}
        for col in self.numeric_cols:
            Q1 = self.df[col].quantile(0.25)
            Q3 = self.df[col].quantile(0.75)
            IQR = Q3 - Q1
            outliers = ((self.df[col] < Q1 - 1.5 * IQR) |
                       (self.df[col] > Q3 + 1.5 * IQR)).sum()
            if outliers > 0:
                outliers_info[col] = {
                    'count': int(outliers),
                    'percentage': float(outliers / len(self.df) * 100)
                }
        report['outliers'] = outliers_info

        # 数据类型
        report['data_types'] = self.df.dtypes.astype(str).to_dict()

        # 生成建议
        report['recommendations'] = self._generate_quality_recommendations(report)

        return report

    def _generate_quality_recommendations(self, report: Dict) -> List[str]:
        """生成数据质量改进建议"""
        recommendations = []

        # 缺失值建议
        if report['missing_values']['total_missing'] > 0:
            high_missing = {k: v for k, v in report['missing_values']['missing_percentage'].items() if v > 50}
            if high_missing:
                recommendations.append(
                    f"⚠️ 发现 {len(high_missing)} 列缺失值超过50%，建议考虑删除这些列: {list(high_missing.keys())}"
                )
            else:
                recommendations.append(
                    "💡 建议使用合适的方法填充缺失值（均值、中位数、众数或预测填充）"
                )

        # 重复值建议
        if report['duplicates']['percentage'] > 5:
            recommendations.append(
                f"⚠️ 发现 {report['duplicates']['percentage']:.1f}% 的重复数据，建议检查并处理"
            )

        # 异常值建议
        if report['outliers']:
            recommendations.append(
                f"💡 在 {len(report['outliers'])} 列中检测到异常值，建议进一步分析是否为真实异常或数据错误"
            )

        # 数据类型建议
        for col in self.df.columns:
            if self.df[col].dtype == 'object':
                unique_ratio = self.df[col].nunique() / len(self.df)
                if unique_ratio > 0.5:
                    recommendations.append(
                        f"💡 列 '{col}' 可能是高基数类别变量（唯一值比例: {unique_ratio:.1%}），考虑特殊编码方式"
                    )

        return recommendations

    def auto_detect_column_types(self) -> Dict[str, str]:
        """
        自动检测列的语义类型

        Returns:
            列名到语义类型的映射
        """
        column_types = {}

        for col in self.df.columns:
            col_type = 'unknown'

            # 检查是否为ID列
            if 'id' in col.lower():
                col_type = 'identifier'

            # 检查是否为日期列
            elif 'date' in col.lower() or 'time' in col.lower():
                col_type = 'datetime'

            # 检查是否为类别列
            elif self.df[col].dtype == 'object':
                unique_ratio = self.df[col].nunique() / len(self.df)
                if unique_ratio < 0.05:
                    col_type = 'categorical_low_cardinality'
                elif unique_ratio < 0.5:
                    col_type = 'categorical_medium_cardinality'
                else:
                    col_type = 'categorical_high_cardinality'

            # 数值列
            elif self.df[col].dtype in ['int64', 'float64']:
                # 检查是否为二元变量
                if self.df[col].nunique() == 2:
                    col_type = 'binary'
                # 检查是否为计数数据
                elif (self.df[col] >= 0).all() and (self.df[col] % 1 == 0).all():
                    col_type = 'count'
                # 检查是否为百分比
                elif (self.df[col] >= 0).all() and (self.df[col] <= 1).all():
                    col_type = 'percentage'
                else:
                    col_type = 'continuous'

            column_types[col] = col_type

        return column_types

    def suggest_feature_engineering(self) -> List[Dict[str, Any]]:
        """
        提供特征工程建议

        Returns:
            特征工程建议列表
        """
        suggestions = []

        column_types = self.auto_detect_column_types()

        # 日期特征建议
        date_cols = [col for col, typ in column_types.items() if typ == 'datetime']
        if date_cols:
            suggestions.append({
                'type': 'datetime_features',
                'columns': date_cols,
                'suggestion': '从日期列提取时间特征（年、月、日、星期、季度等）',
                'priority': 'high'
            })

        # 类别变量编码建议
        low_card_cols = [col for col, typ in column_types.items()
                        if typ == 'categorical_low_cardinality']
        if low_card_cols:
            suggestions.append({
                'type': 'onehot_encoding',
                'columns': low_card_cols,
                'suggestion': '使用One-Hot编码处理低基数类别变量',
                'priority': 'high'
            })

        high_card_cols = [col for col, typ in column_types.items()
                         if typ == 'categorical_high_cardinality']
        if high_card_cols:
            suggestions.append({
                'type': 'target_encoding',
                'columns': high_card_cols,
                'suggestion': '使用目标编码或频率编码处理高基数类别变量',
                'priority': 'medium'
            })

        # 数值特征交互建议
        if len(self.numeric_cols) >= 2:
            suggestions.append({
                'type': 'interaction_features',
                'columns': self.numeric_cols[:5],  # 限制数量
                'suggestion': '创建数值特征之间的交互项（乘法、除法等）',
                'priority': 'medium'
            })

        # 多项式特征建议
        continuous_cols = [col for col, typ in column_types.items()
                          if typ == 'continuous']
        if continuous_cols:
            suggestions.append({
                'type': 'polynomial_features',
                'columns': continuous_cols[:3],
                'suggestion': '创建多项式特征以捕捉非线性关系',
                'priority': 'low'
            })

        # 特征缩放建议
        if self.numeric_cols:
            ranges = {}
            for col in self.numeric_cols:
                ranges[col] = self.df[col].max() - self.df[col].min()

            if max(ranges.values()) / min(ranges.values()) > 100:
                suggestions.append({
                    'type': 'feature_scaling',
                    'columns': self.numeric_cols,
                    'suggestion': '数值特征范围差异较大，建议进行标准化或归一化',
                    'priority': 'high'
                })

        return suggestions

    def detect_correlations(self, threshold: float = 0.8) -> Dict[str, Any]:
        """
        检测高相关性特征

        Args:
            threshold: 相关系数阈值

        Returns:
            相关性信息
        """
        if not self.numeric_cols:
            return {'high_correlations': [], 'correlation_matrix': None}

        corr_matrix = self.df[self.numeric_cols].corr()

        # 找出高相关性对
        high_corr_pairs = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i + 1, len(corr_matrix.columns)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) > threshold:
                    high_corr_pairs.append({
                        'feature_1': corr_matrix.columns[i],
                        'feature_2': corr_matrix.columns[j],
                        'correlation': float(corr_value),
                        'recommendation': f"考虑删除其中一个特征以减少多重共线性"
                    })

        return {
            'high_correlations': high_corr_pairs,
            'correlation_matrix': corr_matrix,
            'recommendation': f"发现 {len(high_corr_pairs)} 对高相关性特征（|r| > {threshold}）"
        }

    def suggest_models(self, task_type: Optional[str] = None,
                      target_column: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        根据数据特征建议合适的模型

        Args:
            task_type: 任务类型 ('classification', 'regression', 'clustering')
            target_column: 目标列名

        Returns:
            模型建议列表
        """
        suggestions = []

        # 自动检测任务类型
        if task_type is None and target_column:
            if target_column in self.df.columns:
                unique_values = self.df[target_column].nunique()
                if unique_values <= 20:
                    task_type = 'classification'
                else:
                    task_type = 'regression'

        # 数据集大小
        n_samples = len(self.df)
        n_features = len(self.df.columns)

        if task_type == 'classification':
            # 分类任务建议
            if n_samples < 1000:
                suggestions.append({
                    'model': 'Logistic Regression',
                    'reason': '样本量较小，简单模型更合适',
                    'priority': 'high',
                    'complexity': 'low'
                })

            suggestions.append({
                'model': 'Random Forest',
                'reason': '处理非线性关系和特征交互效果好，不易过拟合',
                'priority': 'high',
                'complexity': 'medium'
            })

            suggestions.append({
                'model': 'XGBoost/LightGBM',
                'reason': '通常在结构化数据上表现最好',
                'priority': 'high',
                'complexity': 'medium'
            })

            if n_samples > 10000:
                suggestions.append({
                    'model': 'Neural Network',
                    'reason': '大数据集可以充分利用深度学习的优势',
                    'priority': 'medium',
                    'complexity': 'high'
                })

        elif task_type == 'regression':
            # 回归任务建议
            suggestions.append({
                'model': 'Linear Regression',
                'reason': '基线模型，快速验证线性关系',
                'priority': 'high',
                'complexity': 'low'
            })

            suggestions.append({
                'model': 'Random Forest Regressor',
                'reason': '捕捉非线性关系，特征重要性分析',
                'priority': 'high',
                'complexity': 'medium'
            })

            suggestions.append({
                'model': 'XGBoost/LightGBM',
                'reason': '通常在结构化数据上表现最好',
                'priority': 'high',
                'complexity': 'medium'
            })

            if n_features > n_samples / 2:
                suggestions.append({
                    'model': 'Ridge/Lasso Regression',
                    'reason': '特征数量多，需要正则化防止过拟合',
                    'priority': 'high',
                    'complexity': 'low'
                })

        elif task_type == 'clustering':
            # 聚类任务建议
            suggestions.append({
                'model': 'K-Means',
                'reason': '简单高效，适合球形簇',
                'priority': 'high',
                'complexity': 'low'
            })

            suggestions.append({
                'model': 'DBSCAN',
                'reason': '可以发现任意形状的簇，处理噪声点',
                'priority': 'medium',
                'complexity': 'medium'
            })

            if n_samples < 5000:
                suggestions.append({
                    'model': 'Hierarchical Clustering',
                    'reason': '样本量适中，可以生成聚类树状图',
                    'priority': 'medium',
                    'complexity': 'medium'
                })

        return suggestions

    def generate_insights(self) -> List[str]:
        """
        生成数据洞察

        Returns:
            洞察列表
        """
        insights = []

        # 数据规模洞察
        n_rows, n_cols = self.df.shape
        insights.append(f"📊 数据集包含 {n_rows:,} 行和 {n_cols} 列")

        # 缺失值洞察
        missing_total = self.df.isnull().sum().sum()
        if missing_total > 0:
            missing_pct = missing_total / (n_rows * n_cols) * 100
            insights.append(f"⚠️ 总共有 {missing_total:,} 个缺失值 ({missing_pct:.2f}%)")

        # 数值列统计洞察
        if self.numeric_cols:
            for col in self.numeric_cols[:3]:  # 只显示前3列
                mean_val = self.df[col].mean()
                std_val = self.df[col].std()
                cv = (std_val / mean_val) * 100 if mean_val != 0 else 0

                if cv > 100:
                    insights.append(f"📈 列 '{col}' 变异系数较高 ({cv:.1f}%)，数据波动大")

                # 检查偏态
                skewness = self.df[col].skew()
                if abs(skewness) > 1:
                    direction = "右偏" if skewness > 0 else "左偏"
                    insights.append(f"📊 列 '{col}' 呈现{direction}分布 (偏度: {skewness:.2f})")

        # 类别列洞察
        if self.categorical_cols:
            for col in self.categorical_cols[:3]:
                n_unique = self.df[col].nunique()
                insights.append(f"🏷️ 类别列 '{col}' 有 {n_unique} 个唯一值")

                # 不平衡检测
                if n_unique <= 10:
                    value_counts = self.df[col].value_counts()
                    max_pct = value_counts.iloc[0] / len(self.df) * 100
                    if max_pct > 80:
                        insights.append(
                            f"⚠️ 列 '{col}' 类别不平衡，最常见值占 {max_pct:.1f}%"
                        )

        # 相关性洞察
        if len(self.numeric_cols) >= 2:
            corr_info = self.detect_correlations(threshold=0.7)
            if corr_info['high_correlations']:
                insights.append(
                    f"🔗 发现 {len(corr_info['high_correlations'])} 对高相关性特征"
                )

        return insights

    def auto_analyze(self) -> Dict[str, Any]:
        """
        自动分析并生成完整报告

        Returns:
            完整的分析报告
        """
        print("=" * 80)
        print("AI 辅助数据分析报告")
        print("=" * 80)

        # 数据质量报告
        print("\n1. 数据质量分析")
        print("-" * 80)
        quality_report = self.generate_data_quality_report()

        print(f"数据维度: {quality_report['overview']['total_rows']} 行 × "
              f"{quality_report['overview']['total_columns']} 列")
        print(f"数值列: {quality_report['overview']['numeric_columns']}")
        print(f"类别列: {quality_report['overview']['categorical_columns']}")
        print(f"内存使用: {quality_report['overview']['memory_usage_mb']:.2f} MB")

        if quality_report['missing_values']['total_missing'] > 0:
            print(f"\n缺失值: {quality_report['missing_values']['total_missing']} 个")

        if quality_report['duplicates']['count'] > 0:
            print(f"重复行: {quality_report['duplicates']['count']} 行 "
                  f"({quality_report['duplicates']['percentage']:.1f}%)")

        # 建议
        print("\n📋 数据质量建议:")
        for i, rec in enumerate(quality_report['recommendations'], 1):
            print(f"  {i}. {rec}")

        # 列类型检测
        print("\n2. 列类型自动检测")
        print("-" * 80)
        column_types = self.auto_detect_column_types()
        type_counts = {}
        for col_type in column_types.values():
            type_counts[col_type] = type_counts.get(col_type, 0) + 1

        for col_type, count in sorted(type_counts.items()):
            print(f"  {col_type}: {count} 列")

        # 特征工程建议
        print("\n3. 特征工程建议")
        print("-" * 80)
        fe_suggestions = self.suggest_feature_engineering()
        for i, sug in enumerate(fe_suggestions, 1):
            print(f"  {i}. [{sug['priority'].upper()}] {sug['suggestion']}")
            print(f"     列: {', '.join(sug['columns'][:5])}"
                  f"{'...' if len(sug['columns']) > 5 else ''}")

        # 相关性分析
        print("\n4. 特征相关性分析")
        print("-" * 80)
        corr_info = self.detect_correlations(threshold=0.7)
        if corr_info['high_correlations']:
            print(f"发现 {len(corr_info['high_correlations'])} 对高相关性特征:")
            for pair in corr_info['high_correlations'][:5]:
                print(f"  • {pair['feature_1']} ↔ {pair['feature_2']}: "
                      f"r = {pair['correlation']:.3f}")
        else:
            print("未发现高度相关的特征对")

        # 数据洞察
        print("\n5. 数据洞察")
        print("-" * 80)
        insights = self.generate_insights()
        for insight in insights:
            print(f"  {insight}")

        print("\n" + "=" * 80)

        return {
            'quality_report': quality_report,
            'column_types': column_types,
            'feature_engineering_suggestions': fe_suggestions,
            'correlation_info': corr_info,
            'insights': insights
        }


def main():
    """示例用法"""
    # 创建示例数据
    np.random.seed(42)
    df = pd.DataFrame({
        'id': range(1000),
        'age': np.random.randint(18, 80, 1000),
        'income': np.random.randint(20000, 150000, 1000),
        'credit_score': np.random.randint(300, 850, 1000),
        'category': np.random.choice(['A', 'B', 'C', 'D'], 1000),
        'region': np.random.choice(['North', 'South', 'East', 'West'], 1000),
        'purchase_amount': np.random.uniform(10, 1000, 1000),
        'date': pd.date_range('2023-01-01', periods=1000, freq='D')
    })

    # 添加一些缺失值
    df.loc[np.random.choice(1000, 50, replace=False), 'income'] = np.nan
    df.loc[np.random.choice(1000, 30, replace=False), 'category'] = np.nan

    # 添加一些重复行
    df = pd.concat([df, df.iloc[:20]], ignore_index=True)

    # 初始化AI助手
    assistant = AIDataAssistant(df)

    # 自动分析
    report = assistant.auto_analyze()

    # 获取模型建议
    print("\n6. 模型选择建议")
    print("-" * 80)
    model_suggestions = assistant.suggest_models(
        task_type='classification',
        target_column='category'
    )

    for i, sug in enumerate(model_suggestions, 1):
        print(f"  {i}. {sug['model']} (复杂度: {sug['complexity']})")
        print(f"     理由: {sug['reason']}")
        print()


if __name__ == '__main__':
    main()
