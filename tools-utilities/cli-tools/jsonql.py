#!/usr/bin/env python3
"""
jsonql.py - JSON 查詢工具
使用 AI 輔助開發的強大 JSON 資料查詢與處理命令列工具
"""

import argparse
import json
import sys
import csv
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from io import StringIO

try:
    from jsonpath_ng import parse as jsonpath_parse
    from jsonpath_ng.ext import parse as jsonpath_ext_parse
    JSONPATH_AVAILABLE = True
except ImportError:
    JSONPATH_AVAILABLE = False
    print("⚠️  警告: jsonpath-ng 未安裝，部分功能可能不可用")
    print("請執行: pip install jsonpath-ng")


class JSONQueryTool:
    """JSON 查詢工具類別"""

    def __init__(self, data: Union[Dict, List, str]):
        """
        初始化 JSON 查詢工具

        Args:
            data: JSON 資料（字典、列表或 JSON 字串）
        """
        if isinstance(data, str):
            try:
                self.data = json.loads(data)
            except json.JSONDecodeError as e:
                raise ValueError(f"無效的 JSON 字串: {e}")
        else:
            self.data = data

    def query(self, jsonpath: str) -> List[Any]:
        """
        使用 JSONPath 查詢資料

        Args:
            jsonpath: JSONPath 查詢表達式

        Returns:
            查詢結果列表
        """
        if not JSONPATH_AVAILABLE:
            raise RuntimeError("需要安裝 jsonpath-ng: pip install jsonpath-ng")

        try:
            # 使用擴展解析器以支援更多功能
            jsonpath_expr = jsonpath_ext_parse(jsonpath)
            matches = jsonpath_expr.find(self.data)
            return [match.value for match in matches]
        except Exception as e:
            raise ValueError(f"JSONPath 查詢錯誤: {e}")

    def filter_data(self, key: str, value: Any = None, operator: str = "==") -> List[Dict]:
        """
        過濾資料

        Args:
            key: 要過濾的鍵
            value: 要比較的值
            operator: 比較運算子 (==, !=, >, <, >=, <=, contains)

        Returns:
            過濾後的結果
        """
        if not isinstance(self.data, list):
            raise ValueError("過濾操作需要資料為列表類型")

        results = []
        for item in self.data:
            if not isinstance(item, dict):
                continue

            if key not in item:
                continue

            item_value = item[key]

            # 執行比較
            match = False
            try:
                if operator == "==":
                    match = item_value == value
                elif operator == "!=":
                    match = item_value != value
                elif operator == ">":
                    match = item_value > value
                elif operator == "<":
                    match = item_value < value
                elif operator == ">=":
                    match = item_value >= value
                elif operator == "<=":
                    match = item_value <= value
                elif operator == "contains":
                    match = value in str(item_value)
                else:
                    raise ValueError(f"不支援的運算子: {operator}")
            except (TypeError, ValueError):
                continue

            if match:
                results.append(item)

        return results

    def get_keys(self, path: str = "") -> List[str]:
        """
        獲取 JSON 中的所有鍵

        Args:
            path: 路徑（用於遞迴）

        Returns:
            鍵列表
        """
        keys = []

        def extract_keys(obj, current_path=""):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    full_path = f"{current_path}.{key}" if current_path else key
                    keys.append(full_path)
                    extract_keys(value, full_path)
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    full_path = f"{current_path}[{i}]"
                    extract_keys(item, full_path)

        extract_keys(self.data)
        return sorted(set(keys))

    def get_statistics(self, key: str) -> Dict[str, Any]:
        """
        AI 輔助：獲取數值欄位的統計資訊

        Args:
            key: 要統計的鍵

        Returns:
            統計資訊字典
        """
        values = []

        def extract_values(obj):
            """遞迴提取數值"""
            if isinstance(obj, dict):
                if key in obj:
                    try:
                        values.append(float(obj[key]))
                    except (ValueError, TypeError):
                        pass
                # 繼續遞迴搜尋
                for v in obj.values():
                    extract_values(v)
            elif isinstance(obj, list):
                for item in obj:
                    extract_values(item)

        extract_values(self.data)

        if not values:
            return {"error": f"沒有找到數值型別的 '{key}' 欄位"}

        values.sort()
        n = len(values)

        return {
            "count": n,
            "sum": sum(values),
            "mean": sum(values) / n,
            "min": min(values),
            "max": max(values),
            "median": values[n // 2] if n % 2 == 1 else (values[n // 2 - 1] + values[n // 2]) / 2,
            "range": max(values) - min(values)
        }

    def suggest_queries(self) -> List[str]:
        """
        AI 輔助：根據資料結構建議可能有用的查詢

        Returns:
            建議的 JSONPath 查詢列表
        """
        suggestions = []

        # 基本查詢
        suggestions.append("$ - 獲取整個文檔")

        # 根據資料類型提供建議
        if isinstance(self.data, dict):
            keys = list(self.data.keys())[:5]  # 前 5 個鍵
            for key in keys:
                suggestions.append(f"$.{key} - 獲取 '{key}' 的值")

            # 如果有列表
            for key, value in self.data.items():
                if isinstance(value, list) and len(value) > 0:
                    suggestions.append(f"$.{key}[*] - 獲取 '{key}' 列表中的所有元素")
                    suggestions.append(f"$.{key}[0] - 獲取 '{key}' 列表中的第一個元素")

                    # 如果列表包含字典
                    if isinstance(value[0], dict):
                        sub_keys = list(value[0].keys())[:3]
                        for sub_key in sub_keys:
                            suggestions.append(f"$.{key}[*].{sub_key} - 獲取所有 '{sub_key}' 值")

        elif isinstance(self.data, list):
            suggestions.append("$[*] - 獲取所有元素")
            suggestions.append("$[0] - 獲取第一個元素")
            suggestions.append("$[-1] - 獲取最後一個元素")

            if len(self.data) > 0 and isinstance(self.data[0], dict):
                keys = list(self.data[0].keys())[:5]
                for key in keys:
                    suggestions.append(f"$[*].{key} - 獲取所有元素的 '{key}' 值")

                # 過濾建議
                for key in keys[:2]:
                    suggestions.append(f"$[?(@.{key})] - 過濾存在 '{key}' 的元素")

        return suggestions

    def analyze_structure(self) -> Dict[str, Any]:
        """
        AI 輔助：分析 JSON 結構

        Returns:
            結構分析結果
        """
        analysis = {
            "type": type(self.data).__name__,
            "size": len(str(self.data)),
            "depth": self._get_depth(self.data),
            "keys_count": 0,
            "array_count": 0,
            "nested_objects": 0,
            "total_elements": self._count_elements(self.data)
        }

        if isinstance(self.data, dict):
            analysis["keys_count"] = len(self.data)
            analysis["keys"] = list(self.data.keys())[:10]  # 前 10 個鍵
        elif isinstance(self.data, list):
            analysis["array_length"] = len(self.data)
            if len(self.data) > 0:
                analysis["first_element_type"] = type(self.data[0]).__name__

        # 統計數組和嵌套對象
        def count_structures(obj):
            if isinstance(obj, dict):
                analysis["nested_objects"] += 1
                for value in obj.values():
                    count_structures(value)
            elif isinstance(obj, list):
                analysis["array_count"] += 1
                for item in obj:
                    count_structures(item)

        count_structures(self.data)

        return analysis

    @staticmethod
    def _get_depth(obj, current_depth=0):
        """計算 JSON 深度"""
        if isinstance(obj, dict):
            if not obj:
                return current_depth
            return max(JSONQueryTool._get_depth(v, current_depth + 1) for v in obj.values())
        elif isinstance(obj, list):
            if not obj:
                return current_depth
            return max(JSONQueryTool._get_depth(item, current_depth + 1) for item in obj)
        else:
            return current_depth

    @staticmethod
    def _count_elements(obj):
        """計算總元素數"""
        if isinstance(obj, dict):
            return sum(1 + JSONQueryTool._count_elements(v) for v in obj.values())
        elif isinstance(obj, list):
            return sum(1 + JSONQueryTool._count_elements(item) for item in obj)
        else:
            return 0

    def to_csv(self, output_file: Optional[str] = None) -> str:
        """
        轉換為 CSV 格式

        Args:
            output_file: 輸出檔案路徑（可選）

        Returns:
            CSV 字串
        """
        if not isinstance(self.data, list):
            raise ValueError("CSV 轉換需要資料為列表類型")

        if not self.data:
            return ""

        # 確保所有元素都是字典
        if not all(isinstance(item, dict) for item in self.data):
            raise ValueError("CSV 轉換需要列表中的所有元素都是字典")

        # 收集所有鍵
        all_keys = set()
        for item in self.data:
            all_keys.update(item.keys())

        fieldnames = sorted(all_keys)

        # 生成 CSV
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(self.data)

        csv_content = output.getvalue()

        # 如果指定了輸出檔案
        if output_file:
            with open(output_file, 'w', encoding='utf-8', newline='') as f:
                f.write(csv_content)

        return csv_content

    def to_table(self, max_rows: int = 20) -> str:
        """
        轉換為表格格式

        Args:
            max_rows: 最大顯示行數

        Returns:
            表格字串
        """
        if not isinstance(self.data, list):
            raise ValueError("表格轉換需要資料為列表類型")

        if not self.data:
            return "空資料"

        # 確保所有元素都是字典
        if not all(isinstance(item, dict) for item in self.data):
            raise ValueError("表格轉換需要列表中的所有元素都是字典")

        # 收集所有鍵
        all_keys = set()
        for item in self.data[:max_rows]:
            all_keys.update(item.keys())

        headers = sorted(all_keys)

        # 計算列寬
        col_widths = {key: len(key) for key in headers}
        for item in self.data[:max_rows]:
            for key in headers:
                value = str(item.get(key, ''))
                col_widths[key] = max(col_widths[key], len(value))

        # 生成表格
        lines = []

        # 標題行
        header_line = " | ".join(key.ljust(col_widths[key]) for key in headers)
        separator = "-+-".join("-" * col_widths[key] for key in headers)

        lines.append(header_line)
        lines.append(separator)

        # 資料行
        for item in self.data[:max_rows]:
            row = " | ".join(str(item.get(key, '')).ljust(col_widths[key]) for key in headers)
            lines.append(row)

        if len(self.data) > max_rows:
            lines.append(f"\n... 還有 {len(self.data) - max_rows} 行")

        return "\n".join(lines)


def load_json_file(file_path: str) -> Union[Dict, List]:
    """載入 JSON 檔案"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ 錯誤: 檔案不存在: {file_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ 錯誤: 無效的 JSON 檔案: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 錯誤: {e}")
        sys.exit(1)


def load_json_stdin() -> Union[Dict, List]:
    """從標準輸入載入 JSON"""
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"❌ 錯誤: 無效的 JSON 輸入: {e}")
        sys.exit(1)


def main():
    """主程式入口"""
    parser = argparse.ArgumentParser(
        description='🔍 JSON Query Tool - JSON 查詢工具（AI 輔助）',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
範例:
  # 查詢 JSON 資料
  python jsonql.py data.json "$.users[*].name"

  # 從標準輸入查詢
  cat data.json | python jsonql.py "$.users[*]"

  # 過濾資料
  python jsonql.py data.json "$.users[?(@.age > 18)]"

  # 格式化輸出
  python jsonql.py data.json --pretty

  # 轉換為 CSV
  python jsonql.py data.json "$.users[*]" --output csv

  # 獲取建議查詢
  python jsonql.py data.json --suggest

  # 分析結構
  python jsonql.py data.json --analyze

  # 統計資訊
  python jsonql.py data.json --stats age
        '''
    )

    parser.add_argument(
        'file',
        nargs='?',
        help='JSON 檔案路徑（省略則從標準輸入讀取）'
    )

    parser.add_argument(
        'query',
        nargs='?',
        help='JSONPath 查詢表達式'
    )

    parser.add_argument(
        '-p', '--pretty',
        action='store_true',
        help='格式化 JSON 輸出'
    )

    parser.add_argument(
        '-o', '--output',
        choices=['json', 'csv', 'table'],
        default='json',
        help='輸出格式（預設：json）'
    )

    parser.add_argument(
        '--suggest',
        action='store_true',
        help='AI 建議可能有用的查詢'
    )

    parser.add_argument(
        '--analyze',
        action='store_true',
        help='AI 分析 JSON 結構'
    )

    parser.add_argument(
        '--keys',
        action='store_true',
        help='列出所有鍵'
    )

    parser.add_argument(
        '--stats',
        metavar='KEY',
        help='顯示指定鍵的統計資訊'
    )

    parser.add_argument(
        '--save',
        metavar='FILE',
        help='保存結果到檔案'
    )

    parser.add_argument(
        '--version',
        action='version',
        version='JSON Query Tool v1.0.0'
    )

    args = parser.parse_args()

    # 載入資料
    if args.file:
        data = load_json_file(args.file)
    else:
        if sys.stdin.isatty():
            parser.print_help()
            sys.exit(0)
        data = load_json_stdin()

    # 創建查詢工具
    tool = JSONQueryTool(data)

    # AI 建議
    if args.suggest:
        suggestions = tool.suggest_queries()
        print("\n🤖 AI 建議的查詢:")
        print("=" * 70)
        for i, suggestion in enumerate(suggestions, 1):
            print(f"{i}. {suggestion}")
        print("=" * 70 + "\n")
        return

    # AI 結構分析
    if args.analyze:
        analysis = tool.analyze_structure()
        print("\n🤖 AI 結構分析:")
        print("=" * 70)
        print(f"類型: {analysis['type']}")
        print(f"深度: {analysis['depth']}")
        print(f"大小: {analysis['size']} bytes")
        print(f"總元素數: {analysis['total_elements']}")
        print(f"嵌套對象數: {analysis['nested_objects']}")
        print(f"數組數: {analysis['array_count']}")

        if 'keys_count' in analysis:
            print(f"鍵數量: {analysis['keys_count']}")
            if 'keys' in analysis:
                print(f"鍵範例: {', '.join(analysis['keys'])}")

        if 'array_length' in analysis:
            print(f"數組長度: {analysis['array_length']}")
            if 'first_element_type' in analysis:
                print(f"第一個元素類型: {analysis['first_element_type']}")

        print("=" * 70 + "\n")
        return

    # 列出所有鍵
    if args.keys:
        keys = tool.get_keys()
        print("\n📋 所有鍵:")
        print("=" * 70)
        for key in keys:
            print(f"  {key}")
        print("=" * 70 + "\n")
        return

    # 統計資訊
    if args.stats:
        stats = tool.get_statistics(args.stats)
        print(f"\n📊 '{args.stats}' 的統計資訊:")
        print("=" * 70)
        if 'error' in stats:
            print(f"  ❌ {stats['error']}")
        else:
            print(f"  數量: {stats['count']}")
            print(f"  總和: {stats['sum']:.2f}")
            print(f"  平均: {stats['mean']:.2f}")
            print(f"  最小: {stats['min']:.2f}")
            print(f"  最大: {stats['max']:.2f}")
            print(f"  中位數: {stats['median']:.2f}")
            print(f"  範圍: {stats['range']:.2f}")
        print("=" * 70 + "\n")
        return

    # 執行查詢
    if args.query:
        try:
            result = tool.query(args.query)
        except Exception as e:
            print(f"❌ 查詢錯誤: {e}")
            sys.exit(1)
    else:
        result = data

    # 格式化輸出
    if args.output == 'csv':
        try:
            output_content = JSONQueryTool(result).to_csv(args.save)
            if not args.save:
                print(output_content)
            else:
                print(f"✅ 已保存到: {args.save}")
        except Exception as e:
            print(f"❌ CSV 轉換錯誤: {e}")
            sys.exit(1)

    elif args.output == 'table':
        try:
            output_content = JSONQueryTool(result).to_table()
            print(output_content)
            if args.save:
                with open(args.save, 'w', encoding='utf-8') as f:
                    f.write(output_content)
                print(f"\n✅ 已保存到: {args.save}")
        except Exception as e:
            print(f"❌ 表格轉換錯誤: {e}")
            sys.exit(1)

    else:  # json
        try:
            if args.pretty:
                output_content = json.dumps(result, indent=2, ensure_ascii=False)
            else:
                output_content = json.dumps(result, ensure_ascii=False)

            if args.save:
                with open(args.save, 'w', encoding='utf-8') as f:
                    f.write(output_content)
                print(f"✅ 已保存到: {args.save}")
            else:
                print(output_content)
        except Exception as e:
            print(f"❌ JSON 輸出錯誤: {e}")
            sys.exit(1)


if __name__ == '__main__':
    main()
