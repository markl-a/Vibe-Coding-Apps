#!/usr/bin/env python3
"""
JSON Transformer - JSON 資料轉換和處理工具

功能：
- JSON 格式化與美化
- JSONPath 查詢與提取
- Schema 驗證
- 資料轉換（CSV、YAML、XML）
- 批次處理
- 深度合併
"""

import json
import argparse
import sys
import csv
from pathlib import Path
from typing import Any, Dict, List, Union
from jsonpath_ng import parse
from jsonschema import validate, ValidationError
import yaml

def load_json(file_path: str) -> Any:
    """載入 JSON 檔案"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ JSON 格式錯誤: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"❌ 檔案不存在: {file_path}")
        sys.exit(1)

def save_json(data: Any, file_path: str, prettify: bool = True):
    """儲存 JSON 檔案"""
    with open(file_path, 'w', encoding='utf-8') as f:
        if prettify:
            json.dump(data, f, ensure_ascii=False, indent=2)
        else:
            json.dump(data, f, ensure_ascii=False)
    print(f"✅ 已儲存: {file_path}")

def prettify_json(data: Any) -> str:
    """美化 JSON 格式"""
    return json.dumps(data, ensure_ascii=False, indent=2)

def minify_json(data: Any) -> str:
    """壓縮 JSON 格式"""
    return json.dumps(data, ensure_ascii=False, separators=(',', ':'))

def query_jsonpath(data: Any, path: str) -> List[Any]:
    """使用 JSONPath 查詢資料"""
    try:
        jsonpath_expr = parse(path)
        matches = jsonpath_expr.find(data)
        return [match.value for match in matches]
    except Exception as e:
        print(f"❌ JSONPath 查詢錯誤: {e}")
        return []

def validate_schema(data: Any, schema_file: str) -> bool:
    """驗證 JSON Schema"""
    try:
        schema = load_json(schema_file)
        validate(instance=data, schema=schema)
        print("✅ Schema 驗證通過")
        return True
    except ValidationError as e:
        print(f"❌ Schema 驗證失敗: {e.message}")
        return False
    except Exception as e:
        print(f"❌ 驗證錯誤: {e}")
        return False

def json_to_csv(data: Any, output_file: str):
    """將 JSON 轉換為 CSV"""
    # 處理列表格式的 JSON
    if isinstance(data, list):
        if not data:
            print("❌ 空的 JSON 陣列")
            return

        # 取得所有欄位
        fieldnames = set()
        for item in data:
            if isinstance(item, dict):
                fieldnames.update(item.keys())

        fieldnames = sorted(fieldnames)

        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for item in data:
                if isinstance(item, dict):
                    writer.writerow(item)

        print(f"✅ 已轉換為 CSV: {output_file}")
    else:
        print("❌ JSON 必須是陣列格式才能轉換為 CSV")

def json_to_yaml(data: Any, output_file: str):
    """將 JSON 轉換為 YAML"""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True)
        print(f"✅ 已轉換為 YAML: {output_file}")
    except Exception as e:
        print(f"❌ 轉換失敗: {e}")

def deep_merge(dict1: Dict, dict2: Dict) -> Dict:
    """深度合併兩個字典"""
    result = dict1.copy()
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result

def merge_json_files(files: List[str], merge_type: str = 'shallow') -> Any:
    """合併多個 JSON 檔案"""
    if not files:
        return {}

    result = load_json(files[0])

    for file_path in files[1:]:
        data = load_json(file_path)

        if merge_type == 'deep' and isinstance(result, dict) and isinstance(data, dict):
            result = deep_merge(result, data)
        elif isinstance(result, list) and isinstance(data, list):
            result.extend(data)
        elif isinstance(result, dict) and isinstance(data, dict):
            result.update(data)
        else:
            print(f"⚠️  無法合併不同類型的資料")

    return result

def extract_fields(data: Any, fields: List[str]) -> Any:
    """提取指定欄位"""
    if isinstance(data, list):
        return [
            {field: item.get(field) for field in fields if field in item}
            for item in data
            if isinstance(item, dict)
        ]
    elif isinstance(data, dict):
        return {field: data.get(field) for field in fields if field in data}
    return data

def flatten_json(data: Dict, parent_key: str = '', sep: str = '.') -> Dict:
    """展平巢狀 JSON"""
    items = []
    for k, v in data.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_json(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def main():
    parser = argparse.ArgumentParser(
        description='JSON Transformer - JSON 資料轉換和處理工具',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('files', nargs='+', help='JSON 檔案路徑')
    parser.add_argument('--prettify', action='store_true', help='美化 JSON 格式')
    parser.add_argument('--minify', action='store_true', help='壓縮 JSON 格式')
    parser.add_argument('--query', type=str, help='JSONPath 查詢表達式')
    parser.add_argument('--validate', type=str, metavar='SCHEMA', help='驗證 JSON Schema')
    parser.add_argument('--to-csv', type=str, metavar='OUTPUT', help='轉換為 CSV')
    parser.add_argument('--to-yaml', type=str, metavar='OUTPUT', help='轉換為 YAML')
    parser.add_argument('--merge', choices=['shallow', 'deep'], help='合併多個 JSON 檔案')
    parser.add_argument('--extract', type=str, help='提取指定欄位（逗號分隔）')
    parser.add_argument('--flatten', action='store_true', help='展平巢狀 JSON')
    parser.add_argument('-o', '--output', type=str, help='輸出檔案路徑')

    args = parser.parse_args()

    # 載入第一個 JSON 檔案
    data = load_json(args.files[0])

    # 合併多個檔案
    if args.merge:
        print(f"🔄 合併 {len(args.files)} 個檔案...")
        data = merge_json_files(args.files, args.merge)

    # JSONPath 查詢
    if args.query:
        print(f"🔍 查詢: {args.query}")
        results = query_jsonpath(data, args.query)
        print(f"找到 {len(results)} 個結果:")
        print(prettify_json(results))
        return

    # Schema 驗證
    if args.validate:
        validate_schema(data, args.validate)
        return

    # 提取欄位
    if args.extract:
        fields = [f.strip() for f in args.extract.split(',')]
        print(f"📋 提取欄位: {', '.join(fields)}")
        data = extract_fields(data, fields)

    # 展平 JSON
    if args.flatten:
        if isinstance(data, dict):
            print("🔧 展平巢狀 JSON...")
            data = flatten_json(data)
        else:
            print("⚠️  只能展平字典類型的 JSON")

    # 轉換為 CSV
    if args.to_csv:
        json_to_csv(data, args.to_csv)
        return

    # 轉換為 YAML
    if args.to_yaml:
        json_to_yaml(data, args.to_yaml)
        return

    # 美化或壓縮
    if args.prettify:
        output = prettify_json(data)
        print(output)
        if args.output:
            save_json(data, args.output, prettify=True)
    elif args.minify:
        output = minify_json(data)
        print(output)
        if args.output:
            save_json(data, args.output, prettify=False)
    elif args.output:
        save_json(data, args.output)
    else:
        print(prettify_json(data))

if __name__ == '__main__':
    main()
