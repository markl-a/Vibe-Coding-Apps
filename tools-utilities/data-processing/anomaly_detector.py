#!/usr/bin/env python3
"""
Anomaly Detector - 資料異常偵測工具

功能:
- 統計方法異常檢測
- 機器學習異常檢測
- 時間序列異常檢測
- 多維度異常分析
- 自動異常標記
- 視覺化異常分布
- 異常解釋和建議
"""

import argparse
import sys
from pathlib import Path
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np
from scipy import stats
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')


class AnomalyDetector:
    """異常檢測器"""

    def __init__(self, file_path: str):
        self.file_path = Path(file_path)
        self.df = None
        self.anomalies = {}
        self._load_data()

    def _load_data(self):
        """載入資料"""
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

    def detect_statistical_anomalies(self, method: str = 'iqr', threshold: float = 1.5) -> Dict[str, Any]:
        """使用統計方法檢測異常"""
        print(f"\n🔍 使用統計方法檢測異常 (method={method}, threshold={threshold})...")

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        results = {}

        for col in numeric_cols:
            data = self.df[col].dropna()

            if len(data) == 0:
                continue

            if method == 'iqr':
                # IQR 方法
                Q1 = data.quantile(0.25)
                Q3 = data.quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - threshold * IQR
                upper_bound = Q3 + threshold * IQR

                anomaly_mask = (self.df[col] < lower_bound) | (self.df[col] > upper_bound)

            elif method == 'zscore':
                # Z-score 方法
                z_scores = np.abs(stats.zscore(data))
                anomaly_mask = pd.Series(False, index=self.df.index)
                anomaly_mask[data.index] = z_scores > threshold

            elif method == 'modified_zscore':
                # Modified Z-score 方法 (更穩健)
                median = data.median()
                mad = np.median(np.abs(data - median))
                modified_z_scores = 0.6745 * (data - median) / mad
                anomaly_mask = pd.Series(False, index=self.df.index)
                anomaly_mask[data.index] = np.abs(modified_z_scores) > threshold

            else:
                print(f"⚠️  未知的方法: {method}")
                continue

            anomaly_indices = self.df.index[anomaly_mask].tolist()
            anomaly_count = len(anomaly_indices)

            results[col] = {
                'method': method,
                'anomaly_count': anomaly_count,
                'anomaly_percentage': (anomaly_count / len(self.df)) * 100,
                'anomaly_indices': anomaly_indices[:10],  # 只保留前10個
                'anomaly_values': self.df.loc[anomaly_indices[:10], col].tolist() if anomaly_count > 0 else []
            }

            if method == 'iqr':
                results[col]['bounds'] = {
                    'lower': float(lower_bound),
                    'upper': float(upper_bound)
                }

            print(f"  • {col}: 發現 {anomaly_count} 個異常值 ({results[col]['anomaly_percentage']:.1f}%)")

        self.anomalies['statistical'] = results
        return results

    def detect_ml_anomalies(self, contamination: float = 0.1) -> Dict[str, Any]:
        """使用機器學習檢測異常 (Isolation Forest)"""
        print(f"\n🤖 使用機器學習檢測異常 (contamination={contamination})...")

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns

        if len(numeric_cols) < 2:
            print("⚠️  數值欄位不足,無法進行機器學習異常檢測")
            return {}

        # 準備資料
        X = self.df[numeric_cols].copy()

        # 處理缺失值
        X = X.fillna(X.mean())

        # 標準化
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # 使用 Isolation Forest
        iso_forest = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )

        # 預測異常 (-1 為異常, 1 為正常)
        predictions = iso_forest.fit_predict(X_scaled)
        anomaly_scores = iso_forest.score_samples(X_scaled)

        # 找出異常點
        anomaly_mask = predictions == -1
        anomaly_indices = self.df.index[anomaly_mask].tolist()
        anomaly_count = len(anomaly_indices)

        results = {
            'method': 'isolation_forest',
            'anomaly_count': anomaly_count,
            'anomaly_percentage': (anomaly_count / len(self.df)) * 100,
            'anomaly_indices': anomaly_indices[:20],  # 前20個
            'features_used': list(numeric_cols),
            'contamination': contamination
        }

        # 為每個異常點計算異常分數
        if anomaly_count > 0:
            anomaly_samples = []
            for idx in anomaly_indices[:10]:
                row_data = self.df.loc[idx, numeric_cols].to_dict()
                anomaly_samples.append({
                    'index': int(idx),
                    'score': float(anomaly_scores[idx]),
                    'values': {k: float(v) for k, v in row_data.items()}
                })

            results['top_anomalies'] = anomaly_samples

        print(f"  • 發現 {anomaly_count} 個多維異常點 ({results['anomaly_percentage']:.1f}%)")

        self.anomalies['machine_learning'] = results
        return results

    def detect_univariate_patterns(self) -> Dict[str, Any]:
        """檢測單變量模式異常"""
        print(f"\n📊 檢測單變量模式異常...")

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        results = {}

        for col in numeric_cols:
            data = self.df[col].dropna()

            if len(data) < 10:
                continue

            patterns = {}

            # 1. 檢測常數值
            if data.nunique() == 1:
                patterns['constant_value'] = True

            # 2. 檢測過度重複值
            value_counts = data.value_counts()
            if len(value_counts) > 0:
                most_common_pct = value_counts.iloc[0] / len(data) * 100
                if most_common_pct > 80:
                    patterns['excessive_repetition'] = {
                        'value': float(value_counts.index[0]),
                        'percentage': float(most_common_pct)
                    }

            # 3. 檢測突然跳變
            if len(data) > 1:
                diff = data.diff().abs()
                if diff.max() > 10 * diff.median():
                    patterns['sudden_jump'] = True

            # 4. 檢測趨勢異常 (如果是時間序列)
            if len(data) >= 30:
                # 簡單的趨勢檢測
                x = np.arange(len(data))
                slope, _, r_value, _, _ = stats.linregress(x, data.values)

                if abs(r_value) > 0.8:  # 強趨勢
                    patterns['strong_trend'] = {
                        'direction': 'increasing' if slope > 0 else 'decreasing',
                        'r_squared': float(r_value ** 2)
                    }

            if patterns:
                results[col] = patterns
                pattern_names = ', '.join(patterns.keys())
                print(f"  • {col}: 發現模式異常 ({pattern_names})")

        self.anomalies['patterns'] = results
        return results

    def detect_correlation_anomalies(self, threshold: float = 0.7) -> Dict[str, Any]:
        """檢測相關性異常"""
        print(f"\n🔗 檢測相關性異常 (threshold={threshold})...")

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns

        if len(numeric_cols) < 2:
            print("⚠️  數值欄位不足")
            return {}

        # 計算相關係數
        corr_matrix = self.df[numeric_cols].corr()

        # 找出高相關性的欄位對
        high_correlations = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) > threshold:
                    high_correlations.append({
                        'column1': corr_matrix.columns[i],
                        'column2': corr_matrix.columns[j],
                        'correlation': float(corr_value),
                        'type': 'positive' if corr_value > 0 else 'negative'
                    })

        results = {
            'high_correlation_pairs': high_correlations,
            'threshold': threshold
        }

        if high_correlations:
            print(f"  • 發現 {len(high_correlations)} 組高相關性欄位對")
            for pair in high_correlations[:5]:
                print(f"    - {pair['column1']} ↔ {pair['column2']}: {pair['correlation']:.3f}")

        self.anomalies['correlations'] = results
        return results

    def comprehensive_detection(self,
                                statistical_method: str = 'iqr',
                                ml_contamination: float = 0.1) -> Dict[str, Any]:
        """執行全面異常檢測"""
        print("🚀 開始全面異常檢測...\n")

        self.detect_statistical_anomalies(method=statistical_method)
        self.detect_ml_anomalies(contamination=ml_contamination)
        self.detect_univariate_patterns()
        self.detect_correlation_anomalies()

        return self.anomalies

    def print_summary(self):
        """列印異常檢測摘要"""
        print("\n" + "="*70)
        print("📋 異常檢測摘要報告")
        print("="*70)

        # 統計方法檢測結果
        if 'statistical' in self.anomalies:
            print(f"\n📊 統計方法檢測:")
            total_anomalies = sum(
                info['anomaly_count']
                for info in self.anomalies['statistical'].values()
            )
            print(f"  • 檢測到 {total_anomalies} 個統計異常")

            # 列出異常最多的欄位
            sorted_cols = sorted(
                self.anomalies['statistical'].items(),
                key=lambda x: x[1]['anomaly_count'],
                reverse=True
            )
            if sorted_cols:
                print(f"  • 異常最多的欄位:")
                for col, info in sorted_cols[:3]:
                    print(f"    - {col}: {info['anomaly_count']} 個 ({info['anomaly_percentage']:.1f}%)")

        # 機器學習檢測結果
        if 'machine_learning' in self.anomalies:
            ml_results = self.anomalies['machine_learning']
            print(f"\n🤖 機器學習檢測:")
            print(f"  • 多維異常點: {ml_results['anomaly_count']} 個 ({ml_results['anomaly_percentage']:.1f}%)")

        # 模式異常
        if 'patterns' in self.anomalies:
            patterns = self.anomalies['patterns']
            if patterns:
                print(f"\n📈 模式異常:")
                print(f"  • {len(patterns)} 個欄位發現模式異常")

        # 相關性異常
        if 'correlations' in self.anomalies:
            corr = self.anomalies['correlations']
            if corr['high_correlation_pairs']:
                print(f"\n🔗 相關性異常:")
                print(f"  • {len(corr['high_correlation_pairs'])} 組高相關性欄位對")

        print("\n" + "="*70)

    def save_report(self, output_file: str):
        """儲存異常檢測報告"""
        import json

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.anomalies, f, ensure_ascii=False, indent=2, default=str)

        print(f"\n✅ 報告已儲存: {output_file}")

    def mark_anomalies(self, output_file: str):
        """標記異常並儲存"""
        marked_df = self.df.copy()

        # 添加異常標記欄位
        marked_df['anomaly_statistical'] = False
        marked_df['anomaly_ml'] = False

        # 標記統計異常
        if 'statistical' in self.anomalies:
            for col, info in self.anomalies['statistical'].items():
                if col in marked_df.columns:
                    marked_df.loc[info['anomaly_indices'], 'anomaly_statistical'] = True

        # 標記機器學習異常
        if 'machine_learning' in self.anomalies:
            ml_indices = self.anomalies['machine_learning']['anomaly_indices']
            marked_df.loc[ml_indices, 'anomaly_ml'] = True

        # 儲存
        file_ext = Path(output_file).suffix.lower()
        if file_ext == '.csv':
            marked_df.to_csv(output_file, index=False, encoding='utf-8')
        elif file_ext == '.json':
            marked_df.to_json(output_file, orient='records', force_ascii=False, indent=2)
        elif file_ext in ['.xlsx', '.xls']:
            marked_df.to_excel(output_file, index=False)

        print(f"✅ 已標記異常並儲存: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description='Anomaly Detector - 資料異常偵測工具',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('file', help='要檢測的資料檔案')
    parser.add_argument('--method', choices=['iqr', 'zscore', 'modified_zscore'],
                       default='iqr', help='統計檢測方法')
    parser.add_argument('--threshold', type=float, default=1.5,
                       help='異常檢測閾值')
    parser.add_argument('--contamination', type=float, default=0.1,
                       help='機器學習異常比例預期')
    parser.add_argument('--statistical-only', action='store_true',
                       help='只使用統計方法')
    parser.add_argument('--ml-only', action='store_true',
                       help='只使用機器學習方法')
    parser.add_argument('--report', type=str,
                       help='儲存異常報告 (JSON)')
    parser.add_argument('--mark', type=str,
                       help='標記異常並儲存資料')

    args = parser.parse_args()

    # 創建異常檢測器
    detector = AnomalyDetector(args.file)

    # 執行檢測
    if args.statistical_only:
        detector.detect_statistical_anomalies(method=args.method, threshold=args.threshold)
    elif args.ml_only:
        detector.detect_ml_anomalies(contamination=args.contamination)
    else:
        detector.comprehensive_detection(
            statistical_method=args.method,
            ml_contamination=args.contamination
        )

    # 列印摘要
    detector.print_summary()

    # 儲存報告
    if args.report:
        detector.save_report(args.report)

    # 標記異常
    if args.mark:
        detector.mark_anomalies(args.mark)


if __name__ == '__main__':
    main()
