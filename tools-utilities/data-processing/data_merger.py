#!/usr/bin/env python3
"""
Data Merger - 資料合併工具

功能：
- 多格式支援（CSV、JSON、Excel）
- 智能欄位映射
- 資料去重
- 關聯合併（類似 SQL JOIN）
- 衝突解決策略
- 合併報告
"""

import argparse
import sys
import json
from pathlib import Path
from typing import List, Dict, Any, Union
import pandas as pd

def load_data(file_path: str) -> pd.DataFrame:
    """載入資料檔案（自動偵測格式）"""
    try:
        file_ext = Path(file_path).suffix.lower()

        if file_ext == '.csv':
            return pd.read_csv(file_path)
        elif file_ext == '.json':
            return pd.read_json(file_path)
        elif file_ext in ['.xlsx', '.xls']:
            return pd.read_excel(file_path)
        else:
            print(f"❌ 不支援的檔案格式: {file_ext}")
            sys.exit(1)
    except FileNotFoundError:
        print(f"❌ 檔案不存在: {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 讀取錯誤: {e}")
        sys.exit(1)

def save_data(df: pd.DataFrame, output_file: str):
    """儲存資料（根據副檔名自動選擇格式）"""
    file_ext = Path(output_file).suffix.lower()

    if file_ext == '.csv':
        df.to_csv(output_file, index=False, encoding='utf-8')
    elif file_ext == '.json':
        df.to_json(output_file, orient='records', force_ascii=False, indent=2)
    elif file_ext in ['.xlsx', '.xls']:
        df.to_excel(output_file, index=False)
    else:
        print(f"⚠️  未知的輸出格式，使用 CSV")
        df.to_csv(output_file, index=False, encoding='utf-8')

    print(f"✅ 已儲存: {output_file}")

def simple_concat(files: List[str]) -> pd.DataFrame:
    """簡單垂直合併（堆疊）"""
    dfs = []
    for file_path in files:
        df = load_data(file_path)
        df['來源檔案'] = Path(file_path).name
        dfs.append(df)
        print(f"  📄 {Path(file_path).name}: {len(df)} 筆")

    result = pd.concat(dfs, ignore_index=True)
    print(f"\n✅ 合併完成，共 {len(result)} 筆資料")
    return result

def merge_with_key(files: List[str], key: str, how: str = 'inner') -> pd.DataFrame:
    """使用鍵值合併（類似 SQL JOIN）"""
    if len(files) < 2:
        print("❌ 需要至少 2 個檔案進行鍵值合併")
        sys.exit(1)

    result = load_data(files[0])
    print(f"  📄 基礎資料: {Path(files[0]).name} ({len(result)} 筆)")

    for file_path in files[1:]:
        df = load_data(file_path)
        print(f"  📄 合併: {Path(file_path).name} ({len(df)} 筆)")

        # 檢查鍵是否存在
        if key not in result.columns:
            print(f"❌ 鍵 '{key}' 不存在於 {Path(files[0]).name}")
            sys.exit(1)
        if key not in df.columns:
            print(f"❌ 鍵 '{key}' 不存在於 {Path(file_path).name}")
            sys.exit(1)

        # 執行合併
        result = pd.merge(result, df, on=key, how=how, suffixes=('', f'_{Path(file_path).stem}'))
        print(f"     → 合併後: {len(result)} 筆")

    print(f"\n✅ 合併完成，共 {len(result)} 筆資料")
    return result

def merge_with_mapping(files: List[str], mappings: Dict[str, str]) -> pd.DataFrame:
    """使用欄位映射合併"""
    if len(files) < 2:
        print("❌ 需要至少 2 個檔案進行合併")
        sys.exit(1)

    # 載入第一個檔案
    result = load_data(files[0])
    print(f"  📄 基礎資料: {Path(files[0]).name} ({len(result)} 筆)")

    # 合併其他檔案
    for file_path in files[1:]:
        df = load_data(file_path)

        # 重命名欄位
        rename_dict = {}
        for old_name, new_name in mappings.items():
            if old_name in df.columns:
                rename_dict[old_name] = new_name

        if rename_dict:
            df = df.rename(columns=rename_dict)
            print(f"  📄 {Path(file_path).name}: 重命名 {len(rename_dict)} 個欄位")

        # 垂直合併
        result = pd.concat([result, df], ignore_index=True)

    print(f"\n✅ 合併完成，共 {len(result)} 筆資料")
    return result

def smart_merge(files: List[str], threshold: float = 0.7) -> pd.DataFrame:
    """智能合併（自動偵測相似欄位）"""
    from difflib import SequenceMatcher

    def similarity(a: str, b: str) -> float:
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()

    # 載入所有檔案
    dfs = [load_data(f) for f in files]

    # 找出所有欄位
    all_columns = set()
    for df in dfs:
        all_columns.update(df.columns)

    print(f"🔍 偵測到 {len(all_columns)} 個不同的欄位名稱")

    # 建立欄位映射
    column_mapping = {}
    for i, df in enumerate(dfs):
        mapping = {}
        for col in df.columns:
            best_match = col
            best_score = 1.0

            # 找最相似的標準欄位
            for standard_col in all_columns:
                score = similarity(col, standard_col)
                if score > threshold and score < best_score:
                    best_match = standard_col
                    best_score = score

            mapping[col] = best_match

        if any(k != v for k, v in mapping.items()):
            print(f"  📄 {Path(files[i]).name}: 映射 {sum(1 for k, v in mapping.items() if k != v)} 個欄位")

        dfs[i] = df.rename(columns=mapping)

    # 合併所有資料
    result = pd.concat(dfs, ignore_index=True)
    print(f"\n✅ 智能合併完成，共 {len(result)} 筆資料")
    return result

def deduplicate_data(df: pd.DataFrame, subset: List[str] = None, strategy: str = 'first') -> pd.DataFrame:
    """去除重複資料"""
    before_count = len(df)

    if strategy == 'first':
        df = df.drop_duplicates(subset=subset, keep='first')
    elif strategy == 'last':
        df = df.drop_duplicates(subset=subset, keep='last')
    elif strategy == 'all':
        df = df.drop_duplicates(subset=subset, keep=False)

    removed = before_count - len(df)
    print(f"🗑️  移除 {removed} 筆重複資料（策略: {strategy}）")
    return df

def generate_merge_report(df: pd.DataFrame, files: List[str]):
    """生成合併報告"""
    print("\n" + "=" * 60)
    print("資料合併報告")
    print("=" * 60)

    print(f"\n📊 輸入檔案:")
    for i, file_path in enumerate(files, 1):
        print(f"  {i}. {Path(file_path).name}")

    print(f"\n📈 合併結果:")
    print(f"  總資料筆數: {len(df)}")
    print(f"  總欄位數: {len(df.columns)}")
    print(f"  記憶體使用: {df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB")

    print(f"\n📋 欄位資訊:")
    for col in df.columns:
        null_count = df[col].isnull().sum()
        null_percent = null_count / len(df) * 100
        dtype = df[col].dtype
        print(f"  {col}:")
        print(f"    類型: {dtype}, 缺失值: {null_count} ({null_percent:.1f}%)")

    print(f"\n🔍 資料品質:")
    print(f"  缺失值總數: {df.isnull().sum().sum()}")
    print(f"  重複資料: {df.duplicated().sum()}")

    # 數值統計
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) > 0:
        print(f"\n📊 數值欄位統計:")
        for col in numeric_cols[:5]:  # 只顯示前 5 個
            print(f"  {col}:")
            print(f"    平均值: {df[col].mean():.2f}, 中位數: {df[col].median():.2f}")

    print("\n" + "=" * 60)

def main():
    parser = argparse.ArgumentParser(
        description='Data Merger - 資料合併工具',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('files', nargs='+', help='要合併的檔案')
    parser.add_argument('--key', type=str, help='合併鍵值（用於 JOIN 操作）')
    parser.add_argument('--join', choices=['inner', 'outer', 'left', 'right'], default='inner',
                        help='JOIN 類型')
    parser.add_argument('--map', type=str, help='欄位映射（格式: old1:new1,old2:new2）')
    parser.add_argument('--smart', action='store_true', help='智能合併（自動偵測相似欄位）')
    parser.add_argument('--deduplicate', action='store_true', help='去除重複資料')
    parser.add_argument('--dedup-strategy', choices=['first', 'last', 'all'], default='first',
                        help='去重策略')
    parser.add_argument('--dedup-subset', type=str, help='去重參考欄位（逗號分隔）')
    parser.add_argument('--report', action='store_true', help='顯示合併報告')
    parser.add_argument('-o', '--output', type=str, required=True, help='輸出檔案路徑')

    args = parser.parse_args()

    if len(args.files) < 2:
        print("❌ 需要至少 2 個檔案進行合併")
        sys.exit(1)

    print(f"🔄 合併 {len(args.files)} 個檔案...\n")

    # 執行合併
    if args.key:
        # 鍵值合併
        print(f"🔑 使用鍵值合併: {args.key} ({args.join} join)")
        result = merge_with_key(args.files, args.key, args.join)
    elif args.map:
        # 欄位映射合併
        print("📋 使用欄位映射合併")
        mappings = {}
        for pair in args.map.split(','):
            old, new = pair.split(':')
            mappings[old.strip()] = new.strip()
        result = merge_with_mapping(args.files, mappings)
    elif args.smart:
        # 智能合併
        print("🧠 智能合併模式")
        result = smart_merge(args.files)
    else:
        # 簡單合併
        print("📚 簡單堆疊合併")
        result = simple_concat(args.files)

    # 去重
    if args.deduplicate:
        subset = None
        if args.dedup_subset:
            subset = [s.strip() for s in args.dedup_subset.split(',')]
        result = deduplicate_data(result, subset, args.dedup_strategy)

    # 顯示報告
    if args.report:
        generate_merge_report(result, args.files)

    # 儲存結果
    save_data(result, args.output)
    print(f"\n✅ 合併完成！資料筆數: {len(result)}, 欄位數: {len(result.columns)}")

if __name__ == '__main__':
    main()
