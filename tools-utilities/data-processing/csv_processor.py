#!/usr/bin/env python3
"""
csv_processor.py - CSV 處理工具
使用 AI 輔助開發的強大 CSV 處理和轉換工具
"""

import sys
import argparse
import csv
import json
from pathlib import Path
from typing import List, Dict, Optional
from collections import Counter


class CSVProcessor:
    """CSV 處理器類別"""

    def __init__(self, file_path: str, encoding: str = 'utf-8',
                 delimiter: str = ','):
        self.file_path = Path(file_path)
        self.encoding = encoding
        self.delimiter = delimiter
        self.headers = []
        self.rows = []
        self._load_data()

    def _load_data(self):
        """載入 CSV 資料"""
        if not self.file_path.exists():
            raise FileNotFoundError(f"檔案不存在: {self.file_path}")

        with open(self.file_path, 'r', encoding=self.encoding,
                  newline='', errors='replace') as f:
            reader = csv.reader(f, delimiter=self.delimiter)
            try:
                self.headers = next(reader)
                self.rows = list(reader)
            except StopIteration:
                self.headers = []
                self.rows = []

    def get_info(self) -> Dict:
        """取得 CSV 基本資訊"""
        info = {
            'file': str(self.file_path),
            'rows': len(self.rows),
            'columns': len(self.headers),
            'headers': self.headers,
            'size': self.file_path.stat().st_size,
            'encoding': self.encoding
        }

        # 計算每欄的統計資訊
        column_stats = {}
        for i, header in enumerate(self.headers):
            values = [row[i] if i < len(row) else '' for row in self.rows]
            non_empty = [v for v in values if v.strip()]

            column_stats[header] = {
                'total': len(values),
                'non_empty': len(non_empty),
                'empty': len(values) - len(non_empty),
                'unique': len(set(non_empty)),
                'sample': non_empty[:3] if non_empty else []
            }

        info['column_stats'] = column_stats
        return info

    def select_columns(self, columns: List[str]) -> 'CSVProcessor':
        """選擇特定欄位"""
        # 找出欄位索引
        indices = []
        new_headers = []

        for col in columns:
            if col in self.headers:
                idx = self.headers.index(col)
                indices.append(idx)
                new_headers.append(col)

        if not indices:
            raise ValueError("沒有找到指定的欄位")

        # 過濾資料
        new_rows = []
        for row in self.rows:
            new_row = [row[i] if i < len(row) else '' for i in indices]
            new_rows.append(new_row)

        # 更新當前資料
        self.headers = new_headers
        self.rows = new_rows

        return self

    def filter_rows(self, column: str, value: str,
                   operator: str = 'equals') -> 'CSVProcessor':
        """過濾列"""
        if column not in self.headers:
            raise ValueError(f"欄位不存在: {column}")

        col_idx = self.headers.index(column)
        filtered_rows = []

        for row in self.rows:
            cell_value = row[col_idx] if col_idx < len(row) else ''

            if operator == 'equals':
                if cell_value == value:
                    filtered_rows.append(row)
            elif operator == 'contains':
                if value in cell_value:
                    filtered_rows.append(row)
            elif operator == 'startswith':
                if cell_value.startswith(value):
                    filtered_rows.append(row)
            elif operator == 'endswith':
                if cell_value.endswith(value):
                    filtered_rows.append(row)

        self.rows = filtered_rows
        return self

    def deduplicate(self, key_columns: Optional[List[str]] = None) -> 'CSVProcessor':
        """去除重複列"""
        if key_columns:
            # 根據特定欄位去重
            key_indices = [self.headers.index(col) for col in key_columns
                          if col in self.headers]
            seen = set()
            unique_rows = []

            for row in self.rows:
                key = tuple(row[i] if i < len(row) else '' for i in key_indices)
                if key not in seen:
                    seen.add(key)
                    unique_rows.append(row)

            self.rows = unique_rows
        else:
            # 完全相同的列去重
            unique_rows = []
            seen = set()

            for row in self.rows:
                row_tuple = tuple(row)
                if row_tuple not in seen:
                    seen.add(row_tuple)
                    unique_rows.append(row)

            self.rows = unique_rows

        return self

    def fill_missing(self, value: str = 'N/A',
                    columns: Optional[List[str]] = None) -> 'CSVProcessor':
        """填充缺失值"""
        if columns:
            col_indices = [self.headers.index(col) for col in columns
                          if col in self.headers]
        else:
            col_indices = list(range(len(self.headers)))

        for row in self.rows:
            for i in col_indices:
                if i >= len(row) or not row[i].strip():
                    # 擴展行以確保索引存在
                    while len(row) <= i:
                        row.append('')
                    row[i] = value

        return self

    def to_json(self, output_path: Optional[str] = None,
                pretty: bool = True) -> str:
        """轉換為 JSON"""
        data = []
        for row in self.rows:
            item = {}
            for i, header in enumerate(self.headers):
                item[header] = row[i] if i < len(row) else ''
            data.append(item)

        json_str = json.dumps(data, indent=2 if pretty else None,
                            ensure_ascii=False)

        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(json_str)

        return json_str

    def to_dict_list(self) -> List[Dict]:
        """轉換為字典列表"""
        data = []
        for row in self.rows:
            item = {}
            for i, header in enumerate(self.headers):
                item[header] = row[i] if i < len(row) else ''
            data.append(item)
        return data

    def save(self, output_path: str, encoding: Optional[str] = None):
        """儲存為 CSV"""
        encoding = encoding or self.encoding

        with open(output_path, 'w', encoding=encoding, newline='') as f:
            writer = csv.writer(f, delimiter=self.delimiter)
            writer.writerow(self.headers)
            writer.writerows(self.rows)

    @staticmethod
    def merge(files: List[str], output_path: str,
              encoding: str = 'utf-8') -> 'CSVProcessor':
        """合併多個 CSV 檔案"""
        if not files:
            raise ValueError("沒有提供檔案")

        # 載入第一個檔案作為基礎
        merged = CSVProcessor(files[0], encoding=encoding)

        # 合併其他檔案
        for file_path in files[1:]:
            other = CSVProcessor(file_path, encoding=encoding)

            # 檢查欄位是否相同
            if other.headers != merged.headers:
                print(f"警告: {file_path} 的欄位與第一個檔案不同，跳過",
                      file=sys.stderr)
                continue

            merged.rows.extend(other.rows)

        # 儲存合併結果
        merged.save(output_path, encoding=encoding)
        return merged


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="CSV 處理工具 - AI 輔助開發",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s data.csv --info                          # 顯示資訊
  %(prog)s data.csv --select "name,age"             # 選擇欄位
  %(prog)s data.csv --to-json output.json           # 轉換為 JSON
  %(prog)s data.csv --deduplicate -o clean.csv      # 去重
  %(prog)s data.csv --fill-na "N/A"                 # 填充缺失值
  %(prog)s *.csv --merge -o merged.csv              # 合併檔案
        """
    )

    parser.add_argument('files', nargs='+',
                       help='要處理的 CSV 檔案')

    # 資訊選項
    parser.add_argument('--info', action='store_true',
                       help='顯示 CSV 資訊')

    # 處理選項
    parser.add_argument('--select', metavar='COLUMNS',
                       help='選擇特定欄位（逗號分隔）')
    parser.add_argument('--filter', nargs=3, metavar=('COLUMN', 'OPERATOR', 'VALUE'),
                       help='過濾列（operator: equals, contains, startswith, endswith）')
    parser.add_argument('--deduplicate', action='store_true',
                       help='去除重複列')
    parser.add_argument('--fill-na', metavar='VALUE',
                       help='填充缺失值')

    # 轉換選項
    parser.add_argument('--to-json', metavar='FILE',
                       help='轉換為 JSON')
    parser.add_argument('--merge', action='store_true',
                       help='合併多個 CSV 檔案')

    # 輸出選項
    parser.add_argument('-o', '--output', metavar='FILE',
                       help='輸出檔案路徑')
    parser.add_argument('--encoding', default='utf-8',
                       help='檔案編碼（預設：utf-8）')
    parser.add_argument('--delimiter', default=',',
                       help='分隔符（預設：,）')

    args = parser.parse_args()

    try:
        # 處理合併
        if args.merge:
            if len(args.files) < 2:
                print("錯誤: 合併至少需要 2 個檔案", file=sys.stderr)
                sys.exit(1)

            if not args.output:
                print("錯誤: 合併需要指定輸出檔案 (-o)", file=sys.stderr)
                sys.exit(1)

            processor = CSVProcessor.merge(args.files, args.output,
                                          encoding=args.encoding)
            print(f"✓ 已合併 {len(args.files)} 個檔案到 {args.output}")
            print(f"  總列數: {len(processor.rows)}")
            return

        # 處理單個檔案
        processor = CSVProcessor(args.files[0],
                                encoding=args.encoding,
                                delimiter=args.delimiter)

        # 顯示資訊
        if args.info:
            info = processor.get_info()
            print(f"\n檔案: {info['file']}")
            print(f"列數: {info['rows']}")
            print(f"欄數: {info['columns']}")
            print(f"大小: {info['size']} bytes")
            print(f"編碼: {info['encoding']}")
            print(f"\n欄位資訊:")

            for header, stats in info['column_stats'].items():
                print(f"\n  {header}:")
                print(f"    總數: {stats['total']}")
                print(f"    非空: {stats['non_empty']}")
                print(f"    空值: {stats['empty']}")
                print(f"    唯一: {stats['unique']}")
                if stats['sample']:
                    print(f"    範例: {', '.join(stats['sample'][:3])}")

            return

        # 選擇欄位
        if args.select:
            columns = [c.strip() for c in args.select.split(',')]
            processor.select_columns(columns)
            print(f"✓ 已選擇 {len(columns)} 個欄位")

        # 過濾列
        if args.filter:
            column, operator, value = args.filter
            processor.filter_rows(column, value, operator)
            print(f"✓ 已過濾列，剩餘 {len(processor.rows)} 列")

        # 去重
        if args.deduplicate:
            original_count = len(processor.rows)
            processor.deduplicate()
            removed = original_count - len(processor.rows)
            print(f"✓ 已去除 {removed} 個重複列")

        # 填充缺失值
        if args.fill_na:
            processor.fill_missing(args.fill_na)
            print(f"✓ 已填充缺失值為 '{args.fill_na}'")

        # 轉換為 JSON
        if args.to_json:
            processor.to_json(args.to_json, pretty=True)
            print(f"✓ 已轉換為 JSON: {args.to_json}")

        # 儲存結果
        if args.output and not args.to_json:
            processor.save(args.output, encoding=args.encoding)
            print(f"✓ 已儲存到 {args.output}")

    except Exception as e:
        print(f"錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
