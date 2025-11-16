#!/usr/bin/env python3
"""
Data Cleaner - 資料清理和驗證工具

功能：
- 移除空白與特殊字元
- 標準化格式（日期、電話、郵箱）
- 資料驗證規則
- 異常值檢測
- 資料類型推斷
- 清理報告生成
"""

import argparse
import sys
import re
import csv
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np
from email_validator import validate_email, EmailNotValidError

def load_csv(file_path: str) -> pd.DataFrame:
    """載入 CSV 檔案"""
    try:
        return pd.read_csv(file_path)
    except FileNotFoundError:
        print(f"❌ 檔案不存在: {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 讀取錯誤: {e}")
        sys.exit(1)

def save_csv(df: pd.DataFrame, output_file: str):
    """儲存 CSV 檔案"""
    df.to_csv(output_file, index=False, encoding='utf-8')
    print(f"✅ 已儲存: {output_file}")

def remove_whitespace(df: pd.DataFrame) -> pd.DataFrame:
    """移除字串欄位的前後空白"""
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].str.strip()
    return df

def remove_duplicates(df: pd.DataFrame, subset: List[str] = None) -> Tuple[pd.DataFrame, int]:
    """移除重複資料"""
    before_count = len(df)
    df = df.drop_duplicates(subset=subset, keep='first')
    removed = before_count - len(df)
    print(f"🗑️  移除 {removed} 筆重複資料")
    return df, removed

def handle_missing_values(df: pd.DataFrame, strategy: str = 'drop', fill_value: Any = None) -> pd.DataFrame:
    """處理缺失值"""
    if strategy == 'drop':
        before_count = len(df)
        df = df.dropna()
        removed = before_count - len(df)
        print(f"🗑️  移除 {removed} 筆含缺失值的資料")
    elif strategy == 'fill':
        df = df.fillna(fill_value if fill_value is not None else 'N/A')
        print(f"✅ 已填充缺失值: {fill_value}")
    elif strategy == 'forward':
        df = df.fillna(method='ffill')
        print("✅ 使用前一筆資料填充")
    elif strategy == 'backward':
        df = df.fillna(method='bfill')
        print("✅ 使用後一筆資料填充")
    return df

def validate_email_column(df: pd.DataFrame, column: str) -> pd.DataFrame:
    """驗證郵箱格式"""
    def is_valid_email(email):
        if pd.isna(email):
            return False
        try:
            validate_email(email)
            return True
        except EmailNotValidError:
            return False

    valid_mask = df[column].apply(is_valid_email)
    invalid_count = (~valid_mask).sum()
    print(f"📧 郵箱驗證: {valid_mask.sum()} 有效, {invalid_count} 無效")

    # 標記無效的郵箱
    df[f'{column}_valid'] = valid_mask
    return df

def validate_phone_column(df: pd.DataFrame, column: str) -> pd.DataFrame:
    """驗證電話格式（簡單規則）"""
    def is_valid_phone(phone):
        if pd.isna(phone):
            return False
        # 移除常見分隔符號
        phone_clean = re.sub(r'[\s\-\(\)]', '', str(phone))
        # 檢查是否為 10-15 位數字
        return bool(re.match(r'^\+?\d{10,15}$', phone_clean))

    valid_mask = df[column].apply(is_valid_phone)
    invalid_count = (~valid_mask).sum()
    print(f"📱 電話驗證: {valid_mask.sum()} 有效, {invalid_count} 無效")

    df[f'{column}_valid'] = valid_mask
    return df

def standardize_date(df: pd.DataFrame, column: str, target_format: str = '%Y-%m-%d') -> pd.DataFrame:
    """標準化日期格式"""
    try:
        df[column] = pd.to_datetime(df[column], errors='coerce')
        df[column] = df[column].dt.strftime(target_format)
        print(f"📅 已標準化日期格式: {column} -> {target_format}")
    except Exception as e:
        print(f"❌ 日期轉換失敗: {e}")
    return df

def remove_outliers(df: pd.DataFrame, columns: List[str], method: str = 'iqr', threshold: float = 1.5) -> pd.DataFrame:
    """移除異常值"""
    before_count = len(df)

    for column in columns:
        if column not in df.columns:
            print(f"⚠️  欄位不存在: {column}")
            continue

        if not pd.api.types.is_numeric_dtype(df[column]):
            print(f"⚠️  {column} 不是數值類型")
            continue

        if method == 'iqr':
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - threshold * IQR
            upper_bound = Q3 + threshold * IQR
            df = df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
        elif method == 'zscore':
            z_scores = np.abs((df[column] - df[column].mean()) / df[column].std())
            df = df[z_scores < threshold]

    removed = before_count - len(df)
    print(f"🗑️  移除 {removed} 筆異常值")
    return df

def normalize_text(df: pd.DataFrame, columns: List[str] = None, case: str = 'lower') -> pd.DataFrame:
    """標準化文字格式"""
    if columns is None:
        columns = df.select_dtypes(include=['object']).columns

    for column in columns:
        if column not in df.columns:
            continue

        if case == 'lower':
            df[column] = df[column].str.lower()
        elif case == 'upper':
            df[column] = df[column].str.upper()
        elif case == 'title':
            df[column] = df[column].str.title()

    print(f"✅ 已標準化文字格式: {case}")
    return df

def infer_data_types(df: pd.DataFrame) -> pd.DataFrame:
    """自動推斷資料類型"""
    print("🔍 推斷資料類型...")

    for column in df.columns:
        # 嘗試轉換為數值
        try:
            df[column] = pd.to_numeric(df[column])
            print(f"  {column}: 數值")
            continue
        except (ValueError, TypeError):
            pass

        # 嘗試轉換為日期
        try:
            df[column] = pd.to_datetime(df[column])
            print(f"  {column}: 日期")
            continue
        except (ValueError, TypeError):
            pass

        # 嘗試轉換為布林值
        if df[column].str.lower().isin(['true', 'false', '1', '0', 'yes', 'no']).all():
            df[column] = df[column].map({'true': True, 'false': False, '1': True, '0': False, 'yes': True, 'no': False})
            print(f"  {column}: 布林值")
            continue

        print(f"  {column}: 文字")

    return df

def generate_report(df: pd.DataFrame, original_df: pd.DataFrame, output_file: str = None):
    """生成清理報告"""
    report = []
    report.append("=" * 60)
    report.append("資料清理報告")
    report.append("=" * 60)
    report.append(f"\n📊 資料統計:")
    report.append(f"  原始資料筆數: {len(original_df)}")
    report.append(f"  清理後筆數: {len(df)}")
    report.append(f"  移除筆數: {len(original_df) - len(df)}")
    report.append(f"  保留率: {len(df) / len(original_df) * 100:.2f}%")

    report.append(f"\n📋 欄位資訊:")
    report.append(f"  欄位數量: {len(df.columns)}")
    report.append(f"  欄位名稱: {', '.join(df.columns)}")

    report.append(f"\n🔍 資料品質:")
    report.append(f"  缺失值總數: {df.isnull().sum().sum()}")
    report.append(f"  重複資料: {df.duplicated().sum()}")

    report.append(f"\n📈 數值欄位統計:")
    numeric_cols = df.select_dtypes(include=['number']).columns
    for col in numeric_cols:
        report.append(f"  {col}:")
        report.append(f"    平均值: {df[col].mean():.2f}")
        report.append(f"    中位數: {df[col].median():.2f}")
        report.append(f"    標準差: {df[col].std():.2f}")

    report_text = "\n".join(report)
    print(report_text)

    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report_text)
        print(f"\n✅ 報告已儲存: {output_file}")

def main():
    parser = argparse.ArgumentParser(
        description='Data Cleaner - 資料清理和驗證工具',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('input', help='輸入 CSV 檔案')
    parser.add_argument('--clean-all', action='store_true', help='執行所有清理操作')
    parser.add_argument('--remove-whitespace', action='store_true', help='移除空白')
    parser.add_argument('--deduplicate', action='store_true', help='移除重複資料')
    parser.add_argument('--handle-na', choices=['drop', 'fill', 'forward', 'backward'], help='處理缺失值')
    parser.add_argument('--fill-value', type=str, help='填充缺失值的值')
    parser.add_argument('--validate-email', type=str, metavar='COLUMN', help='驗證郵箱欄位')
    parser.add_argument('--validate-phone', type=str, metavar='COLUMN', help='驗證電話欄位')
    parser.add_argument('--standardize-date', type=str, metavar='COLUMN', help='標準化日期欄位')
    parser.add_argument('--date-format', type=str, default='%Y-%m-%d', help='目標日期格式')
    parser.add_argument('--remove-outliers', type=str, help='移除異常值的欄位（逗號分隔）')
    parser.add_argument('--outlier-method', choices=['iqr', 'zscore'], default='iqr', help='異常值檢測方法')
    parser.add_argument('--normalize-text', choices=['lower', 'upper', 'title'], help='標準化文字格式')
    parser.add_argument('--infer-types', action='store_true', help='自動推斷資料類型')
    parser.add_argument('--report', type=str, metavar='FILE', help='生成清理報告')
    parser.add_argument('-o', '--output', type=str, help='輸出檔案路徑')

    args = parser.parse_args()

    # 載入資料
    print(f"📂 讀取檔案: {args.input}")
    df = load_csv(args.input)
    original_df = df.copy()

    print(f"📊 資料筆數: {len(df)}, 欄位數: {len(df.columns)}\n")

    # 執行清理操作
    if args.clean_all or args.remove_whitespace:
        print("🧹 移除空白...")
        df = remove_whitespace(df)

    if args.clean_all or args.deduplicate:
        print("🔍 移除重複...")
        df, _ = remove_duplicates(df)

    if args.handle_na or args.clean_all:
        strategy = args.handle_na or 'drop'
        print(f"🔧 處理缺失值: {strategy}")
        df = handle_missing_values(df, strategy, args.fill_value)

    if args.validate_email:
        print(f"📧 驗證郵箱: {args.validate_email}")
        df = validate_email_column(df, args.validate_email)

    if args.validate_phone:
        print(f"📱 驗證電話: {args.validate_phone}")
        df = validate_phone_column(df, args.validate_phone)

    if args.standardize_date:
        print(f"📅 標準化日期: {args.standardize_date}")
        df = standardize_date(df, args.standardize_date, args.date_format)

    if args.remove_outliers:
        columns = [c.strip() for c in args.remove_outliers.split(',')]
        print(f"📉 移除異常值: {', '.join(columns)}")
        df = remove_outliers(df, columns, args.outlier_method)

    if args.normalize_text:
        print(f"✏️  標準化文字: {args.normalize_text}")
        df = normalize_text(df, case=args.normalize_text)

    if args.infer_types:
        df = infer_data_types(df)

    # 生成報告
    if args.report:
        generate_report(df, original_df, args.report)

    # 儲存結果
    if args.output:
        save_csv(df, args.output)
    else:
        print("\n預覽清理結果:")
        print(df.head())

if __name__ == '__main__':
    main()
