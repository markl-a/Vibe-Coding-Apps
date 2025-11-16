#!/usr/bin/env python3
"""
Batch Processor - 批次處理工具

功能：
- 平行處理
- 進度顯示
- 錯誤處理與重試
- 處理記錄
- 自訂處理函數
- 結果彙總
"""

import argparse
import sys
import json
from pathlib import Path
from typing import List, Dict, Any, Callable
from glob import glob
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import pandas as pd
from tqdm import tqdm

class BatchProcessor:
    """批次處理器"""

    def __init__(self, workers: int = 4, verbose: bool = True):
        self.workers = workers
        self.verbose = verbose
        self.results = []
        self.errors = []
        self.start_time = None
        self.end_time = None

    def log(self, message: str):
        """記錄訊息"""
        if self.verbose:
            timestamp = datetime.now().strftime('%H:%M:%S')
            print(f"[{timestamp}] {message}")

    def process_files(self, files: List[str], processor: Callable, **kwargs) -> Dict[str, Any]:
        """批次處理檔案"""
        self.start_time = datetime.now()
        self.log(f"🚀 開始批次處理 {len(files)} 個檔案 (使用 {self.workers} 個工作者)")

        # 使用進度條
        with tqdm(total=len(files), desc="處理進度") as pbar:
            with ThreadPoolExecutor(max_workers=self.workers) as executor:
                # 提交所有任務
                future_to_file = {
                    executor.submit(processor, file_path, **kwargs): file_path
                    for file_path in files
                }

                # 收集結果
                for future in as_completed(future_to_file):
                    file_path = future_to_file[future]
                    try:
                        result = future.result()
                        self.results.append({
                            'file': file_path,
                            'status': 'success',
                            'result': result
                        })
                    except Exception as e:
                        self.errors.append({
                            'file': file_path,
                            'error': str(e)
                        })
                        self.log(f"❌ 處理失敗: {Path(file_path).name} - {e}")

                    pbar.update(1)

        self.end_time = datetime.now()
        return self.generate_summary()

    def generate_summary(self) -> Dict[str, Any]:
        """生成處理摘要"""
        total = len(self.results) + len(self.errors)
        success = len(self.results)
        failed = len(self.errors)
        duration = (self.end_time - self.start_time).total_seconds()

        summary = {
            'total': total,
            'success': success,
            'failed': failed,
            'success_rate': success / total * 100 if total > 0 else 0,
            'duration': duration,
            'results': self.results,
            'errors': self.errors
        }

        return summary

    def print_summary(self):
        """顯示處理摘要"""
        summary = self.generate_summary()

        print("\n" + "=" * 60)
        print("批次處理摘要")
        print("=" * 60)
        print(f"總檔案數: {summary['total']}")
        print(f"成功: {summary['success']} ✅")
        print(f"失敗: {summary['failed']} ❌")
        print(f"成功率: {summary['success_rate']:.2f}%")
        print(f"處理時間: {summary['duration']:.2f} 秒")

        if summary['failed'] > 0:
            print(f"\n失敗的檔案:")
            for error in self.errors:
                print(f"  ❌ {Path(error['file']).name}: {error['error']}")

        print("=" * 60)


def convert_file(file_path: str, output_dir: str, target_format: str) -> str:
    """轉換檔案格式"""
    file_ext = Path(file_path).suffix.lower()
    file_name = Path(file_path).stem

    # 載入資料
    if file_ext == '.csv':
        df = pd.read_csv(file_path)
    elif file_ext == '.json':
        df = pd.read_json(file_path)
    elif file_ext in ['.xlsx', '.xls']:
        df = pd.read_excel(file_path)
    else:
        raise ValueError(f"不支援的輸入格式: {file_ext}")

    # 輸出路徑
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # 儲存資料
    if target_format == 'csv':
        output_file = output_path / f"{file_name}.csv"
        df.to_csv(output_file, index=False, encoding='utf-8')
    elif target_format == 'json':
        output_file = output_path / f"{file_name}.json"
        df.to_json(output_file, orient='records', force_ascii=False, indent=2)
    elif target_format == 'excel':
        output_file = output_path / f"{file_name}.xlsx"
        df.to_excel(output_file, index=False)
    else:
        raise ValueError(f"不支援的輸出格式: {target_format}")

    return str(output_file)


def clean_file(file_path: str, output_dir: str) -> str:
    """清理資料檔案"""
    df = pd.read_csv(file_path)

    # 移除空白
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].str.strip()

    # 移除重複
    df = df.drop_duplicates()

    # 處理缺失值
    df = df.dropna()

    # 儲存
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    output_file = output_path / f"cleaned_{Path(file_path).name}"
    df.to_csv(output_file, index=False, encoding='utf-8')

    return str(output_file)


def validate_file(file_path: str, schema: Dict[str, Any] = None) -> Dict[str, Any]:
    """驗證檔案"""
    df = pd.read_csv(file_path)

    validation_result = {
        'file': file_path,
        'rows': len(df),
        'columns': len(df.columns),
        'missing_values': df.isnull().sum().sum(),
        'duplicates': df.duplicated().sum(),
        'valid': True,
        'errors': []
    }

    # 基本驗證
    if len(df) == 0:
        validation_result['valid'] = False
        validation_result['errors'].append('檔案為空')

    if df.isnull().sum().sum() > len(df) * 0.5:
        validation_result['valid'] = False
        validation_result['errors'].append('缺失值過多（>50%）')

    return validation_result


def merge_files(file_pattern: str, output_file: str) -> str:
    """合併多個檔案"""
    files = glob(file_pattern)

    if not files:
        raise ValueError(f"找不到符合的檔案: {file_pattern}")

    dfs = []
    for file_path in files:
        df = pd.read_csv(file_path)
        df['來源檔案'] = Path(file_path).name
        dfs.append(df)

    result = pd.concat(dfs, ignore_index=True)
    result.to_csv(output_file, index=False, encoding='utf-8')

    return output_file


def analyze_file(file_path: str) -> Dict[str, Any]:
    """分析檔案"""
    df = pd.read_csv(file_path)

    analysis = {
        'file': file_path,
        'rows': len(df),
        'columns': len(df.columns),
        'memory_mb': df.memory_usage(deep=True).sum() / 1024 / 1024,
        'dtypes': df.dtypes.value_counts().to_dict(),
        'missing_values': df.isnull().sum().to_dict(),
        'numeric_stats': {}
    }

    # 數值統計
    numeric_cols = df.select_dtypes(include=['number']).columns
    for col in numeric_cols:
        analysis['numeric_stats'][col] = {
            'mean': float(df[col].mean()),
            'median': float(df[col].median()),
            'std': float(df[col].std()),
            'min': float(df[col].min()),
            'max': float(df[col].max())
        }

    return analysis


def main():
    parser = argparse.ArgumentParser(
        description='Batch Processor - 批次處理工具',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('--input', type=str, required=True, help='輸入檔案模式（例如: *.csv）')
    parser.add_argument('--convert', choices=['csv', 'json', 'excel'], help='轉換格式')
    parser.add_argument('--clean', action='store_true', help='清理資料')
    parser.add_argument('--validate', action='store_true', help='驗證檔案')
    parser.add_argument('--analyze', action='store_true', help='分析檔案')
    parser.add_argument('--merge', action='store_true', help='合併檔案')
    parser.add_argument('--workers', type=int, default=4, help='平行工作者數量')
    parser.add_argument('--output', type=str, default='output', help='輸出目錄或檔案')
    parser.add_argument('--report', type=str, help='儲存處理報告（JSON）')
    parser.add_argument('--quiet', action='store_true', help='靜音模式')

    args = parser.parse_args()

    # 找出符合的檔案
    files = glob(args.input)

    if not files:
        print(f"❌ 找不到符合的檔案: {args.input}")
        sys.exit(1)

    print(f"📁 找到 {len(files)} 個檔案\n")

    # 創建批次處理器
    processor = BatchProcessor(workers=args.workers, verbose=not args.quiet)

    # 執行操作
    if args.merge:
        # 合併模式（不使用平行處理）
        print(f"🔄 合併檔案...")
        try:
            result = merge_files(args.input, args.output)
            print(f"✅ 已合併至: {result}")
        except Exception as e:
            print(f"❌ 合併失敗: {e}")
            sys.exit(1)

    elif args.convert:
        # 轉換模式
        summary = processor.process_files(
            files,
            convert_file,
            output_dir=args.output,
            target_format=args.convert
        )

    elif args.clean:
        # 清理模式
        summary = processor.process_files(
            files,
            clean_file,
            output_dir=args.output
        )

    elif args.validate:
        # 驗證模式
        summary = processor.process_files(
            files,
            validate_file
        )

        # 顯示驗證結果
        print("\n驗證結果:")
        for result in processor.results:
            validation = result['result']
            status = "✅" if validation['valid'] else "❌"
            print(f"{status} {Path(validation['file']).name}")
            if not validation['valid']:
                for error in validation['errors']:
                    print(f"    - {error}")

    elif args.analyze:
        # 分析模式
        summary = processor.process_files(
            files,
            analyze_file
        )

        # 顯示分析結果
        print("\n分析結果:")
        for result in processor.results:
            analysis = result['result']
            print(f"\n📄 {Path(analysis['file']).name}:")
            print(f"  資料筆數: {analysis['rows']}")
            print(f"  欄位數: {analysis['columns']}")
            print(f"  記憶體: {analysis['memory_mb']:.2f} MB")
            print(f"  缺失值: {sum(analysis['missing_values'].values())}")

    else:
        print("❌ 請指定操作: --convert, --clean, --validate, --analyze, --merge")
        sys.exit(1)

    # 顯示摘要
    if not args.merge:
        processor.print_summary()

        # 儲存報告
        if args.report:
            summary = processor.generate_summary()
            with open(args.report, 'w', encoding='utf-8') as f:
                json.dump(summary, f, ensure_ascii=False, indent=2, default=str)
            print(f"\n✅ 報告已儲存: {args.report}")


if __name__ == '__main__':
    main()
