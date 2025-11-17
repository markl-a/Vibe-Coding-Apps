"""
Data Converters - 資料轉換器

提供各種格式轉換功能
"""

import json
import csv
from typing import Any, Dict, List
from datetime import datetime
import pandas as pd


def csv_to_json(csv_file: str, json_file: str, orient: str = 'records'):
    """CSV 轉 JSON"""
    df = pd.read_csv(csv_file)
    df.to_json(json_file, orient=orient, force_ascii=False, indent=2)


def json_to_csv(json_file: str, csv_file: str):
    """JSON 轉 CSV"""
    df = pd.read_json(json_file)
    df.to_csv(csv_file, index=False, encoding='utf-8')


def excel_to_csv(excel_file: str, csv_file: str, sheet_name: int = 0):
    """Excel 轉 CSV"""
    df = pd.read_excel(excel_file, sheet_name=sheet_name)
    df.to_csv(csv_file, index=False, encoding='utf-8')


def csv_to_excel(csv_file: str, excel_file: str):
    """CSV 轉 Excel"""
    df = pd.read_csv(csv_file)
    df.to_excel(excel_file, index=False)


def dict_to_csv(data: List[Dict], csv_file: str):
    """字典列表轉 CSV"""
    if not data:
        return

    fieldnames = list(data[0].keys())
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)


def csv_to_dict(csv_file: str) -> List[Dict]:
    """CSV 轉字典列表"""
    result = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            result.append(dict(row))
    return result


def normalize_date_format(date_string: str, input_format: str, output_format: str) -> str:
    """標準化日期格式"""
    try:
        dt = datetime.strptime(date_string, input_format)
        return dt.strftime(output_format)
    except (ValueError, TypeError):
        return date_string


def normalize_phone_format(phone: str, format: str = 'standard') -> str:
    """標準化電話格式"""
    import re
    # 移除所有非數字字元
    clean = re.sub(r'\D', '', phone)

    if format == 'standard':
        # 標準格式: 0912-345-678
        if len(clean) == 10 and clean.startswith('09'):
            return f"{clean[:4]}-{clean[4:7]}-{clean[7:]}"
    elif format == 'dash':
        # 破折號格式
        if len(clean) == 10:
            return f"{clean[:3]}-{clean[3:6]}-{clean[6:]}"
    elif format == 'parentheses':
        # 括號格式: (0912) 345-678
        if len(clean) == 10:
            return f"({clean[:4]}) {clean[4:7]}-{clean[7:]}"

    return phone


def bytes_to_human_readable(bytes_value: int) -> str:
    """轉換位元組為人類可讀格式"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.2f} PB"


def flatten_dict(data: Dict, parent_key: str = '', sep: str = '.') -> Dict:
    """展平巢狀字典"""
    items = []
    for k, v in data.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            for i, item in enumerate(v):
                if isinstance(item, dict):
                    items.extend(flatten_dict(item, f"{new_key}[{i}]", sep=sep).items())
                else:
                    items.append((f"{new_key}[{i}]", item))
        else:
            items.append((new_key, v))
    return dict(items)


def unflatten_dict(data: Dict, sep: str = '.') -> Dict:
    """還原展平的字典"""
    result = {}
    for key, value in data.items():
        parts = key.split(sep)
        current = result
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        current[parts[-1]] = value
    return result


def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """標準化欄位名稱（移除空白、小寫、替換特殊字元）"""
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace(r'[^a-z0-9_]', '', regex=True)
    return df


def convert_encoding(input_file: str, output_file: str, from_encoding: str = 'gbk', to_encoding: str = 'utf-8'):
    """轉換檔案編碼"""
    with open(input_file, 'r', encoding=from_encoding) as f:
        content = f.read()

    with open(output_file, 'w', encoding=to_encoding) as f:
        f.write(content)
