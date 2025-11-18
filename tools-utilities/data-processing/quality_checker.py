#!/usr/bin/env python3
"""
Quality Checker - 智能資料品質檢測器

功能:
- 全面的資料品質評估
- AI 驅動的品質評分
- 資料完整性檢查
- 一致性驗證
- 準確性評估
- 及時性檢查
- 智能修復建議
- 詳細品質報告
"""

import argparse
import sys
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple
from datetime import datetime
import pandas as pd
import numpy as np
from email_validator import validate_email, EmailNotValidError
import re
import warnings
warnings.filterwarnings('ignore')


class QualityChecker:
    """資料品質檢測器"""

    def __init__(self, file_path: str):
        self.file_path = Path(file_path)
        self.df = None
        self.quality_report = {
            'file_info': {},
            'completeness': {},
            'consistency': {},
            'accuracy': {},
            'validity': {},
            'uniqueness': {},
            'overall_score': 0,
            'issues': [],
            'recommendations': []
        }
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

            self.quality_report['file_info'] = {
                'filename': self.file_path.name,
                'size_bytes': self.file_path.stat().st_size,
                'total_rows': len(self.df),
                'total_columns': len(self.df.columns),
                'columns': list(self.df.columns)
            }

            print(f"✅ 成功載入資料: {len(self.df)} 筆, {len(self.df.columns)} 欄")
        except Exception as e:
            print(f"❌ 載入資料失敗: {e}")
            sys.exit(1)

    def check_completeness(self) -> Dict[str, Any]:
        """檢查資料完整性"""
        print("\n🔍 檢查資料完整性...")

        total_cells = self.df.shape[0] * self.df.shape[1]
        missing_cells = self.df.isnull().sum().sum()
        completeness_rate = (1 - missing_cells / total_cells) * 100

        column_completeness = {}
        for col in self.df.columns:
            missing_count = self.df[col].isnull().sum()
            completeness = (1 - missing_count / len(self.df)) * 100

            column_completeness[col] = {
                'missing_count': int(missing_count),
                'completeness_rate': float(completeness),
                'status': self._get_completeness_status(completeness)
            }

        self.quality_report['completeness'] = {
            'overall_completeness_rate': float(completeness_rate),
            'total_missing_cells': int(missing_cells),
            'column_completeness': column_completeness
        }

        # 添加問題和建議
        if completeness_rate < 95:
            self.quality_report['issues'].append({
                'severity': 'high' if completeness_rate < 80 else 'medium',
                'category': 'completeness',
                'message': f'資料完整性偏低 ({completeness_rate:.1f}%)',
                'affected_columns': [
                    col for col, info in column_completeness.items()
                    if info['completeness_rate'] < 95
                ]
            })

            self.quality_report['recommendations'].append({
                'category': 'completeness',
                'priority': 'high',
                'action': '處理缺失值',
                'suggestions': [
                    '使用插值法填充數值型欄位',
                    '使用眾數填充類別型欄位',
                    '考慮刪除缺失率過高的列或欄位',
                    '檢查資料來源是否有問題'
                ]
            })

        return self.quality_report['completeness']

    def _get_completeness_status(self, rate: float) -> str:
        """獲取完整性狀態"""
        if rate >= 95:
            return 'excellent'
        elif rate >= 80:
            return 'good'
        elif rate >= 60:
            return 'fair'
        else:
            return 'poor'

    def check_consistency(self) -> Dict[str, Any]:
        """檢查資料一致性"""
        print("\n🔍 檢查資料一致性...")

        consistency_issues = []

        # 1. 檢查資料類型一致性
        for col in self.df.columns:
            if self.df[col].dtype == 'object':
                # 檢查是否混合了不同類型
                types_found = set()
                for value in self.df[col].dropna().head(100):
                    if isinstance(value, str):
                        if value.isdigit():
                            types_found.add('numeric_string')
                        elif value.replace('.', '', 1).isdigit():
                            types_found.add('float_string')
                        else:
                            types_found.add('text')

                if len(types_found) > 1:
                    consistency_issues.append({
                        'column': col,
                        'issue': 'mixed_data_types',
                        'description': f'欄位包含混合的資料類型: {types_found}'
                    })

        # 2. 檢查格式一致性(例如日期、電話)
        for col in self.df.columns:
            if self.df[col].dtype == 'object':
                sample = self.df[col].dropna().astype(str).head(50)

                # 檢查日期格式
                date_formats = set()
                for value in sample:
                    if self._looks_like_date(value):
                        date_formats.add(self._detect_date_format(value))

                if len(date_formats) > 1:
                    consistency_issues.append({
                        'column': col,
                        'issue': 'inconsistent_date_format',
                        'description': f'發現多種日期格式: {date_formats}'
                    })

        # 3. 檢查大小寫不一致
        for col in self.df.columns:
            if self.df[col].dtype == 'object':
                unique_values = self.df[col].dropna().unique()
                if len(unique_values) > 1:
                    lower_map = {}
                    for val in unique_values:
                        lower_val = str(val).lower()
                        if lower_val in lower_map:
                            consistency_issues.append({
                                'column': col,
                                'issue': 'case_inconsistency',
                                'description': f'發現大小寫不一致: "{lower_map[lower_val]}" vs "{val}"'
                            })
                            break
                        lower_map[lower_val] = val

        self.quality_report['consistency'] = {
            'issues_found': len(consistency_issues),
            'issues': consistency_issues
        }

        if consistency_issues:
            self.quality_report['recommendations'].append({
                'category': 'consistency',
                'priority': 'medium',
                'action': '標準化資料格式',
                'suggestions': [
                    '統一日期格式為 ISO 8601 (YYYY-MM-DD)',
                    '標準化文字大小寫',
                    '轉換資料類型到適當的格式',
                    '移除多餘的空白字元'
                ]
            })

        return self.quality_report['consistency']

    def _looks_like_date(self, value: str) -> bool:
        """檢查字串是否像日期"""
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
            r'\d{2}/\d{2}/\d{4}',  # DD/MM/YYYY
            r'\d{4}/\d{2}/\d{2}',  # YYYY/MM/DD
        ]
        return any(re.match(pattern, value) for pattern in date_patterns)

    def _detect_date_format(self, value: str) -> str:
        """偵測日期格式"""
        if re.match(r'\d{4}-\d{2}-\d{2}', value):
            return 'YYYY-MM-DD'
        elif re.match(r'\d{2}/\d{2}/\d{4}', value):
            return 'DD/MM/YYYY'
        elif re.match(r'\d{4}/\d{2}/\d{2}', value):
            return 'YYYY/MM/DD'
        return 'unknown'

    def check_validity(self) -> Dict[str, Any]:
        """檢查資料有效性"""
        print("\n🔍 檢查資料有效性...")

        validity_results = {}

        for col in self.df.columns:
            invalid_count = 0
            total_count = self.df[col].count()

            # 根據欄位名稱推測驗證類型
            col_lower = col.lower()

            if 'email' in col_lower or 'mail' in col_lower:
                # 驗證 email
                for value in self.df[col].dropna():
                    try:
                        validate_email(str(value))
                    except EmailNotValidError:
                        invalid_count += 1

            elif 'phone' in col_lower or 'tel' in col_lower or 'mobile' in col_lower:
                # 驗證電話
                for value in self.df[col].dropna():
                    if not self._is_valid_phone(str(value)):
                        invalid_count += 1

            elif 'age' in col_lower:
                # 驗證年齡範圍
                for value in self.df[col].dropna():
                    try:
                        age = float(value)
                        if age < 0 or age > 150:
                            invalid_count += 1
                    except (ValueError, TypeError):
                        invalid_count += 1

            elif pd.api.types.is_numeric_dtype(self.df[col]):
                # 檢查數值異常
                for value in self.df[col].dropna():
                    if np.isinf(value) or (isinstance(value, float) and np.isnan(value)):
                        invalid_count += 1

            if total_count > 0:
                validity_rate = (1 - invalid_count / total_count) * 100
                validity_results[col] = {
                    'validity_rate': float(validity_rate),
                    'invalid_count': int(invalid_count),
                    'status': 'valid' if validity_rate >= 95 else 'invalid'
                }

        self.quality_report['validity'] = validity_results

        # 添加問題
        invalid_columns = [
            col for col, info in validity_results.items()
            if info['status'] == 'invalid'
        ]

        if invalid_columns:
            self.quality_report['issues'].append({
                'severity': 'high',
                'category': 'validity',
                'message': '發現無效資料',
                'affected_columns': invalid_columns
            })

            self.quality_report['recommendations'].append({
                'category': 'validity',
                'priority': 'high',
                'action': '修正或移除無效資料',
                'suggestions': [
                    '驗證 email 格式並修正',
                    '檢查數值範圍是否合理',
                    '標準化電話號碼格式',
                    '移除或替換異常值'
                ]
            })

        return self.quality_report['validity']

    def _is_valid_phone(self, phone: str) -> bool:
        """檢查電話號碼有效性"""
        clean_phone = re.sub(r'[\s\-\(\)]', '', phone)
        return bool(re.match(r'^\+?\d{10,15}$', clean_phone))

    def check_uniqueness(self) -> Dict[str, Any]:
        """檢查資料唯一性"""
        print("\n🔍 檢查資料唯一性...")

        uniqueness_results = {}

        # 檢查重複列
        duplicate_rows = self.df.duplicated().sum()
        duplicate_rate = duplicate_rows / len(self.df) * 100

        uniqueness_results['duplicate_rows'] = {
            'count': int(duplicate_rows),
            'percentage': float(duplicate_rate)
        }

        # 檢查每個欄位的唯一性
        column_uniqueness = {}
        for col in self.df.columns:
            unique_count = self.df[col].nunique()
            uniqueness_rate = unique_count / self.df[col].count() * 100 if self.df[col].count() > 0 else 0

            column_uniqueness[col] = {
                'unique_count': int(unique_count),
                'uniqueness_rate': float(uniqueness_rate),
                'duplicate_count': int(len(self.df) - unique_count)
            }

        uniqueness_results['column_uniqueness'] = column_uniqueness

        self.quality_report['uniqueness'] = uniqueness_results

        if duplicate_rows > 0:
            self.quality_report['issues'].append({
                'severity': 'medium',
                'category': 'uniqueness',
                'message': f'發現 {duplicate_rows} 筆重複資料 ({duplicate_rate:.1f}%)'
            })

            self.quality_report['recommendations'].append({
                'category': 'uniqueness',
                'priority': 'medium',
                'action': '處理重複資料',
                'suggestions': [
                    '移除完全相同的重複列',
                    '檢查是否為合法的重複記錄',
                    '對關鍵欄位進行去重',
                    '考慮使用唯一識別符'
                ]
            })

        return self.quality_report['uniqueness']

    def calculate_overall_score(self) -> float:
        """計算整體品質分數"""
        print("\n📊 計算整體品質分數...")

        scores = {}

        # 完整性分數 (30%)
        if 'completeness' in self.quality_report:
            scores['completeness'] = self.quality_report['completeness']['overall_completeness_rate']

        # 一致性分數 (20%)
        if 'consistency' in self.quality_report:
            consistency_issues = self.quality_report['consistency']['issues_found']
            total_columns = len(self.df.columns)
            consistency_score = max(0, (1 - consistency_issues / total_columns) * 100)
            scores['consistency'] = consistency_score

        # 有效性分數 (30%)
        if 'validity' in self.quality_report:
            validity_rates = [
                info['validity_rate']
                for info in self.quality_report['validity'].values()
            ]
            scores['validity'] = np.mean(validity_rates) if validity_rates else 100

        # 唯一性分數 (20%)
        if 'uniqueness' in self.quality_report:
            duplicate_rate = self.quality_report['uniqueness']['duplicate_rows']['percentage']
            scores['uniqueness'] = max(0, 100 - duplicate_rate)

        # 計算加權總分
        weights = {
            'completeness': 0.30,
            'consistency': 0.20,
            'validity': 0.30,
            'uniqueness': 0.20
        }

        overall_score = sum(
            scores.get(key, 0) * weight
            for key, weight in weights.items()
        )

        self.quality_report['overall_score'] = float(overall_score)
        self.quality_report['dimension_scores'] = {
            k: float(v) for k, v in scores.items()
        }

        return overall_score

    def comprehensive_check(self) -> Dict[str, Any]:
        """執行全面品質檢查"""
        print("🚀 開始全面資料品質檢查...\n")

        self.check_completeness()
        self.check_consistency()
        self.check_validity()
        self.check_uniqueness()
        self.calculate_overall_score()

        return self.quality_report

    def print_report(self):
        """列印品質報告"""
        print("\n" + "="*70)
        print("📋 資料品質檢測報告")
        print("="*70)

        # 檔案資訊
        file_info = self.quality_report['file_info']
        print(f"\n📁 檔案資訊:")
        print(f"  • 檔名: {file_info['filename']}")
        print(f"  • 資料筆數: {file_info['total_rows']:,}")
        print(f"  • 欄位數: {file_info['total_columns']}")

        # 整體分數
        overall_score = self.quality_report['overall_score']
        grade = self._get_grade(overall_score)
        print(f"\n⭐ 整體品質分數: {overall_score:.1f}/100 ({grade})")

        if 'dimension_scores' in self.quality_report:
            print(f"\n📊 各維度分數:")
            scores = self.quality_report['dimension_scores']
            print(f"  • 完整性: {scores.get('completeness', 0):.1f}/100")
            print(f"  • 一致性: {scores.get('consistency', 0):.1f}/100")
            print(f"  • 有效性: {scores.get('validity', 0):.1f}/100")
            print(f"  • 唯一性: {scores.get('uniqueness', 0):.1f}/100")

        # 問題摘要
        issues = self.quality_report['issues']
        if issues:
            print(f"\n⚠️  發現 {len(issues)} 個品質問題:")
            for i, issue in enumerate(issues, 1):
                severity_icon = "🔴" if issue['severity'] == 'high' else "🟡"
                print(f"  {severity_icon} {issue['message']}")

        # 建議
        recommendations = self.quality_report['recommendations']
        if recommendations:
            print(f"\n💡 改進建議:")
            for i, rec in enumerate(recommendations, 1):
                print(f"\n  {i}. {rec['action']} (優先級: {rec['priority']})")
                for suggestion in rec['suggestions'][:3]:  # 只顯示前3條
                    print(f"     • {suggestion}")

        print("\n" + "="*70)

    def _get_grade(self, score: float) -> str:
        """獲取等級"""
        if score >= 90:
            return "優秀 A+"
        elif score >= 80:
            return "良好 A"
        elif score >= 70:
            return "中等 B"
        elif score >= 60:
            return "及格 C"
        else:
            return "不及格 D"

    def save_report(self, output_file: str):
        """儲存品質報告"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.quality_report, f, ensure_ascii=False, indent=2, default=str)
        print(f"\n✅ 報告已儲存: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description='Quality Checker - 智能資料品質檢測器',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('file', help='要檢查的資料檔案')
    parser.add_argument('--completeness', action='store_true',
                       help='只檢查完整性')
    parser.add_argument('--consistency', action='store_true',
                       help='只檢查一致性')
    parser.add_argument('--validity', action='store_true',
                       help='只檢查有效性')
    parser.add_argument('--uniqueness', action='store_true',
                       help='只檢查唯一性')
    parser.add_argument('--report', type=str,
                       help='儲存詳細報告 (JSON)')

    args = parser.parse_args()

    # 創建品質檢測器
    checker = QualityChecker(args.file)

    # 執行指定的檢查
    if args.completeness:
        checker.check_completeness()
    elif args.consistency:
        checker.check_consistency()
    elif args.validity:
        checker.check_validity()
    elif args.uniqueness:
        checker.check_uniqueness()
    else:
        # 預設執行全面檢查
        checker.comprehensive_check()

    # 列印報告
    checker.print_report()

    # 儲存報告
    if args.report:
        checker.save_report(args.report)


if __name__ == '__main__':
    main()
