"""
Data Validators - 資料驗證器

提供各種資料驗證功能
"""

import re
from typing import Any, List, Dict
from datetime import datetime


def validate_email(email: str) -> bool:
    """驗證郵箱格式"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str, country: str = 'tw') -> bool:
    """驗證電話號碼"""
    # 移除空白和分隔符號
    clean_phone = re.sub(r'[\s\-\(\)]', '', phone)

    if country == 'tw':
        # 台灣手機或市話
        return bool(re.match(r'^(09\d{8}|0\d{1,2}\d{6,8})$', clean_phone))
    elif country == 'us':
        # 美國電話
        return bool(re.match(r'^\+?1?\d{10}$', clean_phone))
    else:
        # 通用格式
        return bool(re.match(r'^\+?\d{10,15}$', clean_phone))


def validate_url(url: str) -> bool:
    """驗證 URL 格式"""
    pattern = r'^https?://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(/.*)?$'
    return bool(re.match(pattern, url))


def validate_date(date_string: str, format: str = '%Y-%m-%d') -> bool:
    """驗證日期格式"""
    try:
        datetime.strptime(date_string, format)
        return True
    except (ValueError, TypeError):
        return False


def validate_ip_address(ip: str) -> bool:
    """驗證 IP 位址（IPv4）"""
    pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    if not re.match(pattern, ip):
        return False

    # 檢查每個數字是否在 0-255 之間
    parts = ip.split('.')
    return all(0 <= int(part) <= 255 for part in parts)


def validate_credit_card(card_number: str) -> bool:
    """驗證信用卡號碼（Luhn 演算法）"""
    # 移除空白和破折號
    clean_number = re.sub(r'[\s\-]', '', card_number)

    # 檢查是否全為數字
    if not clean_number.isdigit():
        return False

    # Luhn 演算法
    total = 0
    reverse_digits = clean_number[::-1]

    for i, digit in enumerate(reverse_digits):
        n = int(digit)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        total += n

    return total % 10 == 0


def validate_dataframe_schema(df, schema: Dict[str, Any]) -> List[str]:
    """驗證 DataFrame 是否符合 Schema"""
    errors = []

    # 檢查必要欄位
    required_columns = schema.get('required_columns', [])
    missing_columns = set(required_columns) - set(df.columns)
    if missing_columns:
        errors.append(f"缺少必要欄位: {', '.join(missing_columns)}")

    # 檢查資料類型
    column_types = schema.get('column_types', {})
    for column, expected_type in column_types.items():
        if column in df.columns:
            actual_type = str(df[column].dtype)
            if actual_type != expected_type:
                errors.append(f"{column}: 預期類型 {expected_type}，實際類型 {actual_type}")

    # 檢查值範圍
    value_ranges = schema.get('value_ranges', {})
    for column, (min_val, max_val) in value_ranges.items():
        if column in df.columns:
            if df[column].min() < min_val or df[column].max() > max_val:
                errors.append(f"{column}: 值超出範圍 [{min_val}, {max_val}]")

    return errors


def validate_not_null(value: Any) -> bool:
    """驗證非空值"""
    if value is None:
        return False
    if isinstance(value, str) and value.strip() == '':
        return False
    return True


def validate_in_range(value: float, min_val: float, max_val: float) -> bool:
    """驗證數值範圍"""
    try:
        return min_val <= float(value) <= max_val
    except (ValueError, TypeError):
        return False


def validate_in_list(value: Any, valid_values: List[Any]) -> bool:
    """驗證值是否在允許列表中"""
    return value in valid_values


def validate_regex(value: str, pattern: str) -> bool:
    """驗證正則表達式"""
    return bool(re.match(pattern, value))
