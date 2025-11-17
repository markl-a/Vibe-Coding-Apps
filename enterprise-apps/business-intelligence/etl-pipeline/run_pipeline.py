"""
ETL Pipeline - 完整的資料抽取、轉換、載入流程
支持從多種數據源提取數據，進行清洗轉換，並載入到目標系統
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
import time


class DataExtractor:
    """數據提取器"""

    def extract_from_csv(self, file_path: str) -> pd.DataFrame:
        """從 CSV 文件提取數據"""
        print(f"📥 從 CSV 提取數據: {file_path}")
        try:
            df = pd.read_csv(file_path)
            print(f"   ✓ 提取 {len(df)} 筆記錄")
            return df
        except Exception as e:
            print(f"   ✗ 錯誤: {e}")
            return pd.DataFrame()

    def extract_from_json(self, file_path: str) -> pd.DataFrame:
        """從 JSON 文件提取數據"""
        print(f"📥 從 JSON 提取數據: {file_path}")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            df = pd.DataFrame(data)
            print(f"   ✓ 提取 {len(df)} 筆記錄")
            return df
        except Exception as e:
            print(f"   ✗ 錯誤: {e}")
            return pd.DataFrame()

    def extract_from_api_mock(self) -> pd.DataFrame:
        """模擬從 API 提取數據"""
        print(f"📥 從 API 提取數據 (模擬)")
        # 模擬 API 延遲
        time.sleep(0.5)

        # 生成模擬數據
        data = {
            'api_id': range(1, 101),
            'status': np.random.choice(['active', 'inactive', 'pending'], 100),
            'value': np.random.randint(1, 1000, 100),
            'timestamp': pd.date_range(end=datetime.now(), periods=100, freq='H')
        }
        df = pd.DataFrame(data)
        print(f"   ✓ 提取 {len(df)} 筆記錄")
        return df


class DataTransformer:
    """數據轉換器"""

    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """數據清洗"""
        print("🧹 執行數據清洗...")
        original_count = len(df)

        # 移除完全重複的行
        df = df.drop_duplicates()

        # 移除全部為空的行
        df = df.dropna(how='all')

        # 填補缺失值（數值型用中位數，類別型用眾數）
        for col in df.columns:
            if df[col].dtype in ['float64', 'int64']:
                df[col].fillna(df[col].median(), inplace=True)
            else:
                df[col].fillna(df[col].mode()[0] if len(df[col].mode()) > 0 else 'Unknown', inplace=True)

        cleaned_count = len(df)
        print(f"   ✓ 清洗完成: {original_count} → {cleaned_count} 筆 (移除 {original_count - cleaned_count} 筆)")
        return df

    def normalize_data(self, df: pd.DataFrame, columns: List[str]) -> pd.DataFrame:
        """數據標準化"""
        print(f"📊 標準化欄位: {', '.join(columns)}")
        for col in columns:
            if col in df.columns and df[col].dtype in ['float64', 'int64']:
                min_val = df[col].min()
                max_val = df[col].max()
                if max_val > min_val:
                    df[f'{col}_normalized'] = (df[col] - min_val) / (max_val - min_val)
                    print(f"   ✓ {col}: [{min_val:.2f}, {max_val:.2f}] → [0.00, 1.00]")
        return df

    def aggregate_data(self, df: pd.DataFrame, group_by: str, agg_dict: Dict) -> pd.DataFrame:
        """數據聚合"""
        print(f"📊 按 {group_by} 聚合數據...")
        if group_by not in df.columns:
            print(f"   ✗ 找不到欄位: {group_by}")
            return df

        result = df.groupby(group_by).agg(agg_dict).reset_index()
        print(f"   ✓ 聚合完成: {len(df)} → {len(result)} 筆")
        return result

    def enrich_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """數據增強"""
        print("✨ 執行數據增強...")

        # 添加處理時間戳
        df['processed_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # 添加數據品質分數（示例）
        df['data_quality_score'] = np.random.uniform(0.8, 1.0, len(df))

        print(f"   ✓ 添加 {2} 個增強欄位")
        return df


class DataLoader:
    """數據載入器"""

    def load_to_csv(self, df: pd.DataFrame, file_path: str):
        """載入到 CSV 文件"""
        print(f"💾 載入數據到 CSV: {file_path}")
        try:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            df.to_csv(file_path, index=False)
            print(f"   ✓ 成功載入 {len(df)} 筆記錄")
        except Exception as e:
            print(f"   ✗ 錯誤: {e}")

    def load_to_json(self, df: pd.DataFrame, file_path: str):
        """載入到 JSON 文件"""
        print(f"💾 載入數據到 JSON: {file_path}")
        try:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            df.to_json(file_path, orient='records', indent=2, force_ascii=False)
            print(f"   ✓ 成功載入 {len(df)} 筆記錄")
        except Exception as e:
            print(f"   ✗ 錯誤: {e}")

    def load_to_database_mock(self, df: pd.DataFrame, table_name: str):
        """模擬載入到數據庫"""
        print(f"💾 載入數據到數據庫 (模擬): {table_name}")
        # 模擬數據庫寫入延遲
        time.sleep(0.3)
        print(f"   ✓ 成功載入 {len(df)} 筆記錄到表 {table_name}")


class ETLPipeline:
    """ETL Pipeline 主流程"""

    def __init__(self):
        self.extractor = DataExtractor()
        self.transformer = DataTransformer()
        self.loader = DataLoader()
        self.metrics = {
            'start_time': None,
            'end_time': None,
            'records_extracted': 0,
            'records_transformed': 0,
            'records_loaded': 0,
            'errors': []
        }

    def run(self, config: Dict[str, Any]):
        """執行 ETL Pipeline"""
        print("=" * 80)
        print("🚀 ETL Pipeline 開始執行")
        print("=" * 80)
        self.metrics['start_time'] = datetime.now()

        try:
            # 1. Extract (提取)
            print("\n【階段 1/3】數據提取")
            print("-" * 80)
            df = self._extract(config.get('extract', {}))
            if df.empty:
                raise Exception("提取階段失敗：沒有數據")
            self.metrics['records_extracted'] = len(df)

            # 2. Transform (轉換)
            print("\n【階段 2/3】數據轉換")
            print("-" * 80)
            df = self._transform(df, config.get('transform', {}))
            self.metrics['records_transformed'] = len(df)

            # 3. Load (載入)
            print("\n【階段 3/3】數據載入")
            print("-" * 80)
            self._load(df, config.get('load', {}))
            self.metrics['records_loaded'] = len(df)

            self.metrics['end_time'] = datetime.now()
            self._print_summary()

        except Exception as e:
            self.metrics['errors'].append(str(e))
            print(f"\n❌ Pipeline 執行失敗: {e}")
            raise

    def _extract(self, extract_config: Dict) -> pd.DataFrame:
        """提取數據"""
        source_type = extract_config.get('type', 'csv')
        source_path = extract_config.get('path', '')

        if source_type == 'csv':
            return self.extractor.extract_from_csv(source_path)
        elif source_type == 'json':
            return self.extractor.extract_from_json(source_path)
        elif source_type == 'api':
            return self.extractor.extract_from_api_mock()
        else:
            raise ValueError(f"不支持的數據源類型: {source_type}")

    def _transform(self, df: pd.DataFrame, transform_config: Dict) -> pd.DataFrame:
        """轉換數據"""
        # 數據清洗
        if transform_config.get('clean', True):
            df = self.transformer.clean_data(df)

        # 數據標準化
        if 'normalize' in transform_config:
            df = self.transformer.normalize_data(df, transform_config['normalize'])

        # 數據聚合
        if 'aggregate' in transform_config:
            agg_config = transform_config['aggregate']
            df = self.transformer.aggregate_data(
                df,
                agg_config['group_by'],
                agg_config['functions']
            )

        # 數據增強
        if transform_config.get('enrich', True):
            df = self.transformer.enrich_data(df)

        return df

    def _load(self, df: pd.DataFrame, load_config: Dict):
        """載入數據"""
        target_type = load_config.get('type', 'csv')
        target_path = load_config.get('path', 'output/result.csv')

        if target_type == 'csv':
            self.loader.load_to_csv(df, target_path)
        elif target_type == 'json':
            self.loader.load_to_json(df, target_path)
        elif target_type == 'database':
            table_name = load_config.get('table', 'etl_result')
            self.loader.load_to_database_mock(df, table_name)
        else:
            raise ValueError(f"不支持的目標類型: {target_type}")

    def _print_summary(self):
        """打印執行摘要"""
        duration = (self.metrics['end_time'] - self.metrics['start_time']).total_seconds()

        print("\n" + "=" * 80)
        print("✅ ETL Pipeline 執行完成")
        print("=" * 80)
        print(f"⏱️  執行時間: {duration:.2f} 秒")
        print(f"📥 提取記錄: {self.metrics['records_extracted']:,} 筆")
        print(f"🔄 轉換記錄: {self.metrics['records_transformed']:,} 筆")
        print(f"💾 載入記錄: {self.metrics['records_loaded']:,} 筆")

        if self.metrics['errors']:
            print(f"\n⚠️  發生 {len(self.metrics['errors'])} 個錯誤:")
            for error in self.metrics['errors']:
                print(f"   - {error}")
        else:
            print("\n🎉 沒有錯誤發生")
        print("=" * 80)


def example_1_basic_pipeline():
    """範例 1：基本的 CSV 處理"""
    print("\n" + "🔵" * 40)
    print("範例 1：基本 ETL Pipeline - CSV 數據處理")
    print("🔵" * 40)

    # 先生成示例數據
    from data_generator import generate_sales_data
    os.makedirs('data', exist_ok=True)
    sales_df = generate_sales_data()
    sales_df.to_csv('data/sales_input.csv', index=False)

    config = {
        'extract': {
            'type': 'csv',
            'path': 'data/sales_input.csv'
        },
        'transform': {
            'clean': True,
            'enrich': True
        },
        'load': {
            'type': 'csv',
            'path': 'output/sales_cleaned.csv'
        }
    }

    pipeline = ETLPipeline()
    pipeline.run(config)


def example_2_aggregation_pipeline():
    """範例 2：帶聚合的 ETL"""
    print("\n" + "🟢" * 40)
    print("範例 2：聚合分析 Pipeline - 按類別統計")
    print("🟢" * 40)

    # 生成示例數據
    from data_generator import generate_sales_data
    os.makedirs('data', exist_ok=True)
    sales_df = generate_sales_data()
    sales_df.to_csv('data/sales_input.csv', index=False)

    config = {
        'extract': {
            'type': 'csv',
            'path': 'data/sales_input.csv'
        },
        'transform': {
            'clean': True,
            'aggregate': {
                'group_by': 'category',
                'functions': {
                    'amount': ['sum', 'mean', 'count'],
                    'quantity': 'sum'
                }
            },
            'enrich': True
        },
        'load': {
            'type': 'json',
            'path': 'output/category_summary.json'
        }
    }

    pipeline = ETLPipeline()
    pipeline.run(config)


def example_3_api_to_database():
    """範例 3：API 到數據庫"""
    print("\n" + "🟡" * 40)
    print("範例 3：API Pipeline - 從 API 提取並載入數據庫")
    print("🟡" * 40)

    config = {
        'extract': {
            'type': 'api'
        },
        'transform': {
            'clean': True,
            'normalize': ['value'],
            'enrich': True
        },
        'load': {
            'type': 'database',
            'table': 'api_data'
        }
    }

    pipeline = ETLPipeline()
    pipeline.run(config)


def main():
    """主函數：運行所有範例"""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                         ETL Pipeline 示範系統                                 ║
║                                                                              ║
║  展示完整的 Extract (提取)、Transform (轉換)、Load (載入) 流程               ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    # 運行所有範例
    try:
        example_1_basic_pipeline()
        example_2_aggregation_pipeline()
        example_3_api_to_database()

        print("\n" + "🎉" * 40)
        print("所有 ETL Pipeline 範例執行完成！")
        print("🎉" * 40)
        print("\n📁 輸出文件位置:")
        print("   - output/sales_cleaned.csv")
        print("   - output/category_summary.json")
        print("\n💡 提示：可以查看輸出文件來確認 ETL 處理結果")

    except Exception as e:
        print(f"\n❌ 執行失敗: {e}")
        raise


if __name__ == '__main__':
    main()
