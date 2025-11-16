"""
Data Processing Utils - 資料處理工具函數

提供各種實用功能
"""

import os
import hashlib
from typing import Any, List, Dict
from pathlib import Path
import pandas as pd


def calculate_file_hash(file_path: str, algorithm: str = 'md5') -> str:
    """計算檔案雜湊值"""
    hash_func = hashlib.new(algorithm)

    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            hash_func.update(chunk)

    return hash_func.hexdigest()


def get_file_info(file_path: str) -> Dict[str, Any]:
    """取得檔案資訊"""
    path = Path(file_path)

    return {
        'name': path.name,
        'size': path.stat().st_size,
        'size_human': format_bytes(path.stat().st_size),
        'extension': path.suffix,
        'created': path.stat().st_ctime,
        'modified': path.stat().st_mtime,
        'is_file': path.is_file(),
        'is_dir': path.is_dir(),
        'absolute_path': str(path.absolute())
    }


def format_bytes(bytes_value: int) -> str:
    """格式化位元組大小"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.2f} PB"


def ensure_directory(directory: str):
    """確保目錄存在"""
    Path(directory).mkdir(parents=True, exist_ok=True)


def safe_filename(filename: str) -> str:
    """生成安全的檔案名稱（移除特殊字元）"""
    import re
    # 移除或替換不安全的字元
    safe = re.sub(r'[<>:"/\\|?*]', '_', filename)
    return safe.strip()


def chunk_dataframe(df: pd.DataFrame, chunk_size: int):
    """將 DataFrame 分塊"""
    for i in range(0, len(df), chunk_size):
        yield df[i:i + chunk_size]


def detect_delimiter(file_path: str, num_lines: int = 5) -> str:
    """自動偵測 CSV 分隔符號"""
    import csv

    with open(file_path, 'r', encoding='utf-8') as f:
        sample = '\n'.join([f.readline() for _ in range(num_lines)])

    sniffer = csv.Sniffer()
    try:
        dialect = sniffer.sniff(sample)
        return dialect.delimiter
    except:
        return ','


def detect_encoding(file_path: str) -> str:
    """偵測檔案編碼"""
    import chardet

    with open(file_path, 'rb') as f:
        result = chardet.detect(f.read(10000))

    return result['encoding']


def sample_dataframe(df: pd.DataFrame, n: int = 5, method: str = 'head'):
    """取得 DataFrame 樣本"""
    if method == 'head':
        return df.head(n)
    elif method == 'tail':
        return df.tail(n)
    elif method == 'random':
        return df.sample(n)
    else:
        return df.head(n)


def compare_dataframes(df1: pd.DataFrame, df2: pd.DataFrame) -> Dict[str, Any]:
    """比較兩個 DataFrame"""
    comparison = {
        'shape_equal': df1.shape == df2.shape,
        'columns_equal': list(df1.columns) == list(df2.columns),
        'dtypes_equal': df1.dtypes.equals(df2.dtypes),
        'content_equal': df1.equals(df2),
        'df1_shape': df1.shape,
        'df2_shape': df2.shape,
        'df1_columns': list(df1.columns),
        'df2_columns': list(df2.columns),
    }

    # 找出差異
    if not comparison['columns_equal']:
        comparison['columns_only_in_df1'] = list(set(df1.columns) - set(df2.columns))
        comparison['columns_only_in_df2'] = list(set(df2.columns) - set(df1.columns))

    return comparison


def memory_usage_report(df: pd.DataFrame) -> Dict[str, Any]:
    """生成記憶體使用報告"""
    memory_bytes = df.memory_usage(deep=True)

    return {
        'total_bytes': memory_bytes.sum(),
        'total_human': format_bytes(memory_bytes.sum()),
        'by_column': {
            col: format_bytes(memory_bytes[col])
            for col in df.columns
        },
        'rows': len(df),
        'columns': len(df.columns)
    }


def find_duplicate_columns(df: pd.DataFrame) -> List[List[str]]:
    """找出內容相同的欄位"""
    duplicates = []
    checked = set()

    for col1 in df.columns:
        if col1 in checked:
            continue

        group = [col1]
        for col2 in df.columns:
            if col2 != col1 and col2 not in checked:
                if df[col1].equals(df[col2]):
                    group.append(col2)
                    checked.add(col2)

        if len(group) > 1:
            duplicates.append(group)
            checked.add(col1)

    return duplicates


def suggest_data_types(df: pd.DataFrame) -> Dict[str, str]:
    """建議最佳資料類型"""
    suggestions = {}

    for col in df.columns:
        current_type = str(df[col].dtype)

        # 嘗試轉換為更小的類型
        if current_type == 'int64':
            max_val = df[col].max()
            min_val = df[col].min()

            if min_val >= 0:
                if max_val < 256:
                    suggestions[col] = 'uint8'
                elif max_val < 65536:
                    suggestions[col] = 'uint16'
                elif max_val < 4294967296:
                    suggestions[col] = 'uint32'
            else:
                if -128 <= min_val and max_val < 128:
                    suggestions[col] = 'int8'
                elif -32768 <= min_val and max_val < 32768:
                    suggestions[col] = 'int16'
                elif -2147483648 <= min_val and max_val < 2147483648:
                    suggestions[col] = 'int32'

        elif current_type == 'float64':
            suggestions[col] = 'float32'

        elif current_type == 'object':
            # 檢查是否可以轉為類別型
            unique_ratio = df[col].nunique() / len(df)
            if unique_ratio < 0.5:
                suggestions[col] = 'category'

    return suggestions


def create_backup(file_path: str, backup_dir: str = None) -> str:
    """建立檔案備份"""
    from datetime import datetime
    import shutil

    path = Path(file_path)

    if backup_dir:
        backup_path = Path(backup_dir)
        backup_path.mkdir(parents=True, exist_ok=True)
    else:
        backup_path = path.parent

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = backup_path / f"{path.stem}_backup_{timestamp}{path.suffix}"

    shutil.copy2(file_path, backup_file)
    return str(backup_file)
