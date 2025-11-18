#!/usr/bin/env python3
"""
AI-Powered Data Analyzer - AI 驅動的資料分析工具

功能:
- 自動化資料分析和見解生成
- 統計分析和趨勢識別
- 資料分布視覺化
- 相關性分析
- 異常值識別
- 智能報告生成
- AI 輔助的資料解釋
"""

import argparse
import sys
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple
from datetime import datetime
import pandas as pd
import numpy as np
from scipy import stats
from collections import Counter
import warnings
warnings.filterwarnings('ignore')


class DataAnalyzer:
    """AI 驅動的資料分析器"""

    def __init__(self, file_path: str):
        self.file_path = Path(file_path)
        self.df = None
        self.analysis_results = {}
        self._load_data()

    def _load_data(self):
        """載入資料檔案"""
        try:
            file_ext = self.file_path.suffix.lower()

            if file_ext == '.csv':
                self.df = pd.read_csv(self.file_path)
            elif file_ext == '.json':
                self.df = pd.read_json(self.file_path)
            elif file_ext in ['.xlsx', '.xls']:
                self.df = pd.read_excel(self.file_path)
            else:
                raise ValueError(f"不支援的檔案格式: {file_ext}")

            print(f"✅ 成功載入資料: {len(self.df)} 筆, {len(self.df.columns)} 欄")
        except Exception as e:
            print(f"❌ 載入資料失敗: {e}")
            sys.exit(1)

    def basic_statistics(self) -> Dict[str, Any]:
        """基本統計分析"""
        print("\n📊 執行基本統計分析...")

        stats_result = {
            'overview': {
                'total_rows': len(self.df),
                'total_columns': len(self.df.columns),
                'memory_usage_mb': self.df.memory_usage(deep=True).sum() / 1024 / 1024,
                'duplicate_rows': int(self.df.duplicated().sum()),
                'missing_cells': int(self.df.isnull().sum().sum()),
            },
            'columns': {}
        }

        # 分析每個欄位
        for col in self.df.columns:
            col_stats = {
                'dtype': str(self.df[col].dtype),
                'non_null_count': int(self.df[col].count()),
                'null_count': int(self.df[col].isnull().sum()),
                'null_percentage': float(self.df[col].isnull().sum() / len(self.df) * 100),
                'unique_count': int(self.df[col].nunique()),
            }

            # 數值型欄位的統計
            if pd.api.types.is_numeric_dtype(self.df[col]):
                col_stats.update({
                    'mean': float(self.df[col].mean()) if not self.df[col].isnull().all() else None,
                    'median': float(self.df[col].median()) if not self.df[col].isnull().all() else None,
                    'std': float(self.df[col].std()) if not self.df[col].isnull().all() else None,
                    'min': float(self.df[col].min()) if not self.df[col].isnull().all() else None,
                    'max': float(self.df[col].max()) if not self.df[col].isnull().all() else None,
                    'q25': float(self.df[col].quantile(0.25)) if not self.df[col].isnull().all() else None,
                    'q75': float(self.df[col].quantile(0.75)) if not self.df[col].isnull().all() else None,
                })

            # 類別型欄位的統計
            else:
                top_values = self.df[col].value_counts().head(5)
                col_stats['top_values'] = {
                    str(k): int(v) for k, v in top_values.items()
                }

            stats_result['columns'][col] = col_stats

        self.analysis_results['basic_statistics'] = stats_result
        return stats_result

    def correlation_analysis(self) -> Dict[str, Any]:
        """相關性分析"""
        print("\n🔗 執行相關性分析...")

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns

        if len(numeric_cols) < 2:
            print("⚠️  數值欄位不足,無法進行相關性分析")
            return {}

        # 計算相關係數矩陣
        corr_matrix = self.df[numeric_cols].corr()

        # 找出高相關性的欄位對
        high_correlations = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) > 0.7:  # 高相關性閾值
                    high_correlations.append({
                        'column1': corr_matrix.columns[i],
                        'column2': corr_matrix.columns[j],
                        'correlation': float(corr_value),
                        'strength': 'strong positive' if corr_value > 0.7 else 'strong negative'
                    })

        result = {
            'correlation_matrix': corr_matrix.to_dict(),
            'high_correlations': high_correlations,
            'numeric_columns': list(numeric_cols)
        }

        self.analysis_results['correlation'] = result
        return result

    def distribution_analysis(self) -> Dict[str, Any]:
        """資料分布分析"""
        print("\n📈 執行資料分布分析...")

        distribution_result = {}
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            data = self.df[col].dropna()

            if len(data) == 0:
                continue

            # 計算偏度和峰度
            skewness = float(stats.skew(data))
            kurtosis = float(stats.kurtosis(data))

            # 正態性檢驗 (Shapiro-Wilk test)
            if len(data) > 3 and len(data) < 5000:
                _, p_value = stats.shapiro(data)
                is_normal = p_value > 0.05
            else:
                is_normal = None
                p_value = None

            distribution_result[col] = {
                'skewness': skewness,
                'skewness_interpretation': self._interpret_skewness(skewness),
                'kurtosis': kurtosis,
                'kurtosis_interpretation': self._interpret_kurtosis(kurtosis),
                'is_normal_distribution': is_normal,
                'normality_p_value': float(p_value) if p_value else None,
            }

        self.analysis_results['distribution'] = distribution_result
        return distribution_result

    def _interpret_skewness(self, skewness: float) -> str:
        """解釋偏度"""
        if abs(skewness) < 0.5:
            return "近似對稱"
        elif skewness > 0:
            return "右偏(正偏)"
        else:
            return "左偏(負偏)"

    def _interpret_kurtosis(self, kurtosis: float) -> str:
        """解釋峰度"""
        if abs(kurtosis) < 0.5:
            return "正常峰度"
        elif kurtosis > 0:
            return "高峰態(尖峰)"
        else:
            return "低峰態(平峰)"

    def outlier_detection(self) -> Dict[str, Any]:
        """異常值檢測"""
        print("\n🔍 執行異常值檢測...")

        outliers_result = {}
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            data = self.df[col].dropna()

            if len(data) == 0:
                continue

            # IQR 方法
            Q1 = data.quantile(0.25)
            Q3 = data.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            outliers_mask = (self.df[col] < lower_bound) | (self.df[col] > upper_bound)
            outliers_count = int(outliers_mask.sum())
            outliers_percentage = float(outliers_count / len(self.df) * 100)

            # Z-score 方法
            z_scores = np.abs(stats.zscore(data))
            z_outliers_count = int((z_scores > 3).sum())

            outliers_result[col] = {
                'iqr_method': {
                    'lower_bound': float(lower_bound),
                    'upper_bound': float(upper_bound),
                    'outliers_count': outliers_count,
                    'outliers_percentage': outliers_percentage,
                },
                'zscore_method': {
                    'outliers_count': z_outliers_count,
                    'outliers_percentage': float(z_outliers_count / len(data) * 100),
                }
            }

        self.analysis_results['outliers'] = outliers_result
        return outliers_result

    def trend_analysis(self) -> Dict[str, Any]:
        """趨勢分析(如果有時間序列)"""
        print("\n📉 檢查趨勢分析可能性...")

        # 尋找可能的時間欄位
        date_columns = []
        for col in self.df.columns:
            if pd.api.types.is_datetime64_any_dtype(self.df[col]):
                date_columns.append(col)
            elif self.df[col].dtype == 'object':
                try:
                    pd.to_datetime(self.df[col].head(10))
                    date_columns.append(col)
                except:
                    pass

        if not date_columns:
            print("⚠️  未發現時間序列欄位")
            return {}

        trend_result = {
            'detected_date_columns': date_columns,
            'message': '發現可能的時間序列欄位,可進行趨勢分析'
        }

        self.analysis_results['trend'] = trend_result
        return trend_result

    def generate_insights(self) -> List[str]:
        """生成 AI 驅動的數據見解"""
        print("\n🤖 生成智能見解...")

        insights = []

        # 基於統計分析生成見解
        if 'basic_statistics' in self.analysis_results:
            stats = self.analysis_results['basic_statistics']
            overview = stats['overview']

            # 資料品質見解
            missing_pct = (overview['missing_cells'] /
                          (overview['total_rows'] * overview['total_columns']) * 100)
            if missing_pct > 10:
                insights.append(
                    f"⚠️  資料品質警告: 有 {missing_pct:.1f}% 的資料遺失,建議進行清理"
                )
            elif missing_pct > 0:
                insights.append(
                    f"ℹ️  資料品質: 有 {missing_pct:.1f}% 的資料遺失,屬於可接受範圍"
                )
            else:
                insights.append("✅ 資料品質優秀: 無遺失值")

            # 重複資料見解
            dup_pct = overview['duplicate_rows'] / overview['total_rows'] * 100
            if dup_pct > 5:
                insights.append(
                    f"⚠️  發現 {overview['duplicate_rows']} 筆重複資料 ({dup_pct:.1f}%),建議去重"
                )

        # 基於相關性分析生成見解
        if 'correlation' in self.analysis_results:
            corr = self.analysis_results['correlation']
            if corr.get('high_correlations'):
                insights.append(
                    f"🔗 發現 {len(corr['high_correlations'])} 組高相關性欄位,可能存在冗餘或因果關係"
                )
                for hc in corr['high_correlations'][:3]:  # 只顯示前3組
                    insights.append(
                        f"   • {hc['column1']} 與 {hc['column2']} 的相關性: {hc['correlation']:.3f}"
                    )

        # 基於異常值檢測生成見解
        if 'outliers' in self.analysis_results:
            outliers = self.analysis_results['outliers']
            high_outlier_cols = [
                col for col, data in outliers.items()
                if data['iqr_method']['outliers_percentage'] > 5
            ]
            if high_outlier_cols:
                insights.append(
                    f"🔍 以下欄位有較多異常值 (>5%): {', '.join(high_outlier_cols)}"
                )

        # 基於分布分析生成見解
        if 'distribution' in self.analysis_results:
            dist = self.analysis_results['distribution']
            skewed_cols = [
                col for col, data in dist.items()
                if abs(data['skewness']) > 1
            ]
            if skewed_cols:
                insights.append(
                    f"📊 以下欄位呈現明顯偏態分布: {', '.join(skewed_cols)}"
                )

        if not insights:
            insights.append("✅ 資料整體品質良好,未發現明顯問題")

        self.analysis_results['insights'] = insights
        return insights

    def comprehensive_analysis(self) -> Dict[str, Any]:
        """執行全面分析"""
        print("🚀 開始全面資料分析...\n")

        # 執行所有分析
        self.basic_statistics()
        self.correlation_analysis()
        self.distribution_analysis()
        self.outlier_detection()
        self.trend_analysis()
        self.generate_insights()

        return self.analysis_results

    def print_summary(self):
        """列印分析摘要"""
        print("\n" + "="*70)
        print("📋 資料分析摘要報告")
        print("="*70)

        if 'basic_statistics' in self.analysis_results:
            stats = self.analysis_results['basic_statistics']['overview']
            print(f"\n📊 資料概覽:")
            print(f"  • 總筆數: {stats['total_rows']:,}")
            print(f"  • 欄位數: {stats['total_columns']}")
            print(f"  • 記憶體使用: {stats['memory_usage_mb']:.2f} MB")
            print(f"  • 重複筆數: {stats['duplicate_rows']:,}")
            print(f"  • 遺失值: {stats['missing_cells']:,}")

        if 'insights' in self.analysis_results:
            print(f"\n💡 智能見解:")
            for insight in self.analysis_results['insights']:
                print(f"  {insight}")

        print("\n" + "="*70)

    def save_report(self, output_file: str, format: str = 'json'):
        """儲存分析報告"""
        output_path = Path(output_file)

        if format == 'json':
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(self.analysis_results, f, ensure_ascii=False, indent=2, default=str)
        elif format == 'html':
            self._generate_html_report(output_path)

        print(f"\n✅ 報告已儲存: {output_path}")

    def _generate_html_report(self, output_path: Path):
        """生成 HTML 格式報告"""
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>資料分析報告 - {self.file_path.name}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
        }}
        .section {{
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .metric {{
            display: inline-block;
            margin: 10px 20px 10px 0;
        }}
        .metric-label {{
            color: #666;
            font-size: 14px;
        }}
        .metric-value {{
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }}
        .insight {{
            padding: 10px;
            margin: 5px 0;
            background: #f8f9fa;
            border-left: 4px solid #667eea;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background-color: #667eea;
            color: white;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 資料分析報告</h1>
        <p>檔案: {self.file_path.name}</p>
        <p>分析時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>
"""

        # 基本統計
        if 'basic_statistics' in self.analysis_results:
            stats = self.analysis_results['basic_statistics']['overview']
            html_content += f"""
    <div class="section">
        <h2>📈 資料概覽</h2>
        <div class="metric">
            <div class="metric-label">總筆數</div>
            <div class="metric-value">{stats['total_rows']:,}</div>
        </div>
        <div class="metric">
            <div class="metric-label">欄位數</div>
            <div class="metric-value">{stats['total_columns']}</div>
        </div>
        <div class="metric">
            <div class="metric-label">記憶體使用</div>
            <div class="metric-value">{stats['memory_usage_mb']:.2f} MB</div>
        </div>
        <div class="metric">
            <div class="metric-label">重複筆數</div>
            <div class="metric-value">{stats['duplicate_rows']:,}</div>
        </div>
    </div>
"""

        # 智能見解
        if 'insights' in self.analysis_results:
            html_content += """
    <div class="section">
        <h2>💡 智能見解</h2>
"""
            for insight in self.analysis_results['insights']:
                html_content += f'        <div class="insight">{insight}</div>\n'
            html_content += "    </div>\n"

        html_content += """
</body>
</html>
"""

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)


def main():
    parser = argparse.ArgumentParser(
        description='AI-Powered Data Analyzer - AI 驅動的資料分析工具',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('file', help='要分析的資料檔案')
    parser.add_argument('--basic', action='store_true', help='只執行基本統計分析')
    parser.add_argument('--correlation', action='store_true', help='只執行相關性分析')
    parser.add_argument('--distribution', action='store_true', help='只執行分布分析')
    parser.add_argument('--outliers', action='store_true', help='只執行異常值檢測')
    parser.add_argument('--full', action='store_true', help='執行完整分析(預設)')
    parser.add_argument('--report', type=str, help='儲存分析報告')
    parser.add_argument('--format', choices=['json', 'html'], default='json',
                       help='報告格式')

    args = parser.parse_args()

    # 創建分析器
    analyzer = DataAnalyzer(args.file)

    # 執行指定的分析
    if args.basic:
        analyzer.basic_statistics()
    elif args.correlation:
        analyzer.correlation_analysis()
    elif args.distribution:
        analyzer.distribution_analysis()
    elif args.outliers:
        analyzer.outlier_detection()
    else:
        # 預設執行完整分析
        analyzer.comprehensive_analysis()

    # 列印摘要
    analyzer.print_summary()

    # 儲存報告
    if args.report:
        analyzer.save_report(args.report, args.format)


if __name__ == '__main__':
    main()
