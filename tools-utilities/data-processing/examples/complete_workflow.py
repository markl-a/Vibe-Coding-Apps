#!/usr/bin/env python3
"""
完整資料處理工作流程範例

這個腳本展示如何在 Python 程式中組合使用多個資料處理工具：
1. 載入並清理髒資料
2. 合併多個資料來源
3. 轉換資料格式
4. 進行資料分析
5. 生成處理報告
6. 輸出處理後的資料
"""

import sys
import json
from pathlib import Path
from datetime import datetime

# 添加父目錄到路徑，以便導入工具模組
sys.path.insert(0, str(Path(__file__).parent.parent))

from csv_processor import CSVProcessor
import pandas as pd
import numpy as np

def print_section(title):
    """列印區段標題"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70 + "\n")

def main():
    """主工作流程"""

    # 設置路徑
    examples_dir = Path(__file__).parent
    output_dir = examples_dir / "workflow_output"
    output_dir.mkdir(exist_ok=True)

    print("\n" + "🚀 " * 20)
    print("資料處理完整工作流程範例")
    print("🚀 " * 20)

    # ========================================
    # 步驟 1: 載入和清理銷售資料
    # ========================================
    print_section("步驟 1: 清理銷售資料")

    print("📂 載入 sales_data.csv（包含髒資料）...")
    sales_file = examples_dir / "sales_data.csv"

    # 使用 CSVProcessor 載入資料
    sales_processor = CSVProcessor(str(sales_file))

    print(f"原始資料: {len(sales_processor.rows)} 列")
    print(f"欄位: {', '.join(sales_processor.headers)}")

    # 使用 pandas 進行更複雜的清理
    df_sales = pd.read_csv(sales_file)
    print(f"\n清理前統計:")
    print(f"  - 總列數: {len(df_sales)}")
    print(f"  - 缺失值: {df_sales.isnull().sum().sum()}")
    print(f"  - 重複列: {df_sales.duplicated().sum()}")

    # 清理資料
    print("\n🧹 執行清理操作...")

    # 1. 移除前後空白
    for col in df_sales.select_dtypes(include=['object']).columns:
        df_sales[col] = df_sales[col].str.strip()
    print("  ✓ 移除空白字元")

    # 2. 移除重複列
    before = len(df_sales)
    df_sales = df_sales.drop_duplicates()
    print(f"  ✓ 移除重複列 ({before - len(df_sales)} 列)")

    # 3. 處理缺失值
    df_sales['order_date'].fillna('2024-01-25', inplace=True)
    df_sales['quantity'].fillna(1, inplace=True)
    print("  ✓ 填充缺失值")

    # 4. 驗證電子郵件（簡單驗證）
    df_sales['email_valid'] = df_sales['customer_email'].str.contains('@', na=False)
    invalid_count = (~df_sales['email_valid']).sum()
    print(f"  ✓ 驗證電子郵件（{invalid_count} 個無效）")

    print(f"\n清理後統計:")
    print(f"  - 總列數: {len(df_sales)}")
    print(f"  - 缺失值: {df_sales.isnull().sum().sum()}")
    print(f"  - 重複列: {df_sales.duplicated().sum()}")

    # 儲存清理後的資料
    clean_sales_file = output_dir / "sales_cleaned.csv"
    df_sales.to_csv(clean_sales_file, index=False)
    print(f"\n✅ 已儲存清理後的資料: {clean_sales_file}")

    # ========================================
    # 步驟 2: 合併員工資料
    # ========================================
    print_section("步驟 2: 合併多部門員工資料")

    dept1_file = examples_dir / "employees_dept1.csv"
    dept2_file = examples_dir / "employees_dept2.csv"

    print(f"📂 載入部門資料...")
    df_dept1 = pd.read_csv(dept1_file)
    df_dept2 = pd.read_csv(dept2_file)

    print(f"  部門1: {len(df_dept1)} 位員工")
    print(f"  部門2: {len(df_dept2)} 位員工")

    # 合併資料
    df_employees = pd.concat([df_dept1, df_dept2], ignore_index=True)
    print(f"\n✅ 合併完成: 共 {len(df_employees)} 位員工")

    # 儲存合併後的資料
    employees_file = output_dir / "employees_all.csv"
    df_employees.to_csv(employees_file, index=False)
    print(f"✅ 已儲存: {employees_file}")

    # ========================================
    # 步驟 3: 資料分析
    # ========================================
    print_section("步驟 3: 資料分析與統計")

    # 銷售分析
    print("📊 銷售資料分析:")
    df_sales['total'] = df_sales['price'] * df_sales['quantity']

    # 按類別統計
    category_stats = df_sales.groupby('category').agg({
        'total': ['sum', 'mean', 'count'],
        'quantity': 'sum'
    }).round(2)

    print("\n  按類別統計:")
    print(category_stats)

    # 按區域統計
    region_stats = df_sales.groupby('region').agg({
        'total': 'sum',
        'quantity': 'sum'
    }).round(2)

    print("\n  按區域統計:")
    print(region_stats)

    # 員工分析
    print("\n📊 員工資料分析:")
    dept_stats = df_employees.groupby('department').agg({
        'salary': ['mean', 'min', 'max'],
        'emp_id': 'count'
    }).round(2)

    print("\n  按部門統計:")
    print(dept_stats)

    # ========================================
    # 步驟 4: 資料轉換
    # ========================================
    print_section("步驟 4: 資料格式轉換")

    # 轉換為 JSON
    print("🔄 轉換銷售資料為 JSON...")
    sales_json = df_sales.to_dict(orient='records')
    json_file = output_dir / "sales_data.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(sales_json, f, ensure_ascii=False, indent=2)
    print(f"✅ 已儲存: {json_file}")

    # 轉換員工資料為 JSON
    print("\n🔄 轉換員工資料為 JSON...")
    employees_json = df_employees.to_dict(orient='records')
    employees_json_file = output_dir / "employees_all.json"
    with open(employees_json_file, 'w', encoding='utf-8') as f:
        json.dump(employees_json, f, ensure_ascii=False, indent=2)
    print(f"✅ 已儲存: {employees_json_file}")

    # ========================================
    # 步驟 5: 生成處理報告
    # ========================================
    print_section("步驟 5: 生成處理報告")

    report = {
        'processing_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'workflow': '完整資料處理流程',
        'steps': [
            {
                'step': 1,
                'name': '清理銷售資料',
                'input_file': 'sales_data.csv',
                'output_file': 'sales_cleaned.csv',
                'original_rows': len(pd.read_csv(sales_file)),
                'processed_rows': len(df_sales),
                'operations': [
                    '移除空白字元',
                    '移除重複列',
                    '填充缺失值',
                    '驗證電子郵件'
                ]
            },
            {
                'step': 2,
                'name': '合併員工資料',
                'input_files': ['employees_dept1.csv', 'employees_dept2.csv'],
                'output_file': 'employees_all.csv',
                'total_employees': len(df_employees),
                'departments': df_employees['department'].unique().tolist()
            },
            {
                'step': 3,
                'name': '資料分析',
                'sales_analysis': {
                    'total_revenue': float(df_sales['total'].sum()),
                    'total_orders': len(df_sales),
                    'categories': df_sales['category'].unique().tolist(),
                    'regions': df_sales['region'].unique().tolist()
                },
                'employee_analysis': {
                    'total_employees': len(df_employees),
                    'average_salary': float(df_employees['salary'].mean()),
                    'departments': len(df_employees['department'].unique())
                }
            }
        ],
        'summary': {
            'files_processed': 3,
            'total_records': len(df_sales) + len(df_employees),
            'output_formats': ['CSV', 'JSON'],
            'success': True
        }
    }

    # 儲存 JSON 報告
    report_json_file = output_dir / "processing_report.json"
    with open(report_json_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    # 儲存文字報告
    report_txt_file = output_dir / "processing_report.txt"
    with open(report_txt_file, 'w', encoding='utf-8') as f:
        f.write("=" * 70 + "\n")
        f.write("資料處理完整工作流程報告\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"處理時間: {report['processing_date']}\n\n")

        f.write("處理步驟:\n")
        f.write("-" * 70 + "\n\n")

        for step in report['steps']:
            f.write(f"步驟 {step['step']}: {step['name']}\n")
            if 'input_file' in step:
                f.write(f"  輸入檔案: {step['input_file']}\n")
            if 'input_files' in step:
                f.write(f"  輸入檔案: {', '.join(step['input_files'])}\n")
            if 'output_file' in step:
                f.write(f"  輸出檔案: {step['output_file']}\n")
            f.write("\n")

        f.write("\n總結:\n")
        f.write("-" * 70 + "\n")
        f.write(f"處理檔案數: {report['summary']['files_processed']}\n")
        f.write(f"處理記錄數: {report['summary']['total_records']}\n")
        f.write(f"輸出格式: {', '.join(report['summary']['output_formats'])}\n")
        f.write(f"處理狀態: {'成功 ✅' if report['summary']['success'] else '失敗 ❌'}\n")

        f.write("\n" + "=" * 70 + "\n")

    print(f"✅ 已儲存 JSON 報告: {report_json_file}")
    print(f"✅ 已儲存文字報告: {report_txt_file}")

    # ========================================
    # 步驟 6: 生成摘要統計
    # ========================================
    print_section("步驟 6: 摘要統計")

    # 創建摘要資料框
    summary_data = {
        '資料集': ['銷售資料', '員工資料'],
        '記錄數': [len(df_sales), len(df_employees)],
        '欄位數': [len(df_sales.columns), len(df_employees.columns)],
        '缺失值': [df_sales.isnull().sum().sum(), df_employees.isnull().sum().sum()],
        '重複列': [df_sales.duplicated().sum(), df_employees.duplicated().sum()]
    }

    df_summary = pd.DataFrame(summary_data)
    print(df_summary.to_string(index=False))

    # 儲存摘要
    summary_file = output_dir / "summary.csv"
    df_summary.to_csv(summary_file, index=False)
    print(f"\n✅ 已儲存摘要: {summary_file}")

    # ========================================
    # 完成
    # ========================================
    print_section("處理完成！")

    print("✅ 所有步驟已完成")
    print(f"\n📁 輸出目錄: {output_dir}")
    print("\n生成的檔案:")

    output_files = sorted(output_dir.glob("*"))
    for i, file_path in enumerate(output_files, 1):
        file_size = file_path.stat().st_size
        print(f"  {i}. {file_path.name} ({file_size:,} bytes)")

    print("\n" + "🎉 " * 20)
    print("工作流程執行成功！")
    print("🎉 " * 20 + "\n")

    # 返回處理結果
    return {
        'sales_data': df_sales,
        'employees_data': df_employees,
        'report': report,
        'output_dir': output_dir
    }


if __name__ == '__main__':
    try:
        results = main()
        print("\n提示: 您可以查看 workflow_output/ 目錄中的所有輸出檔案")
        print("      或在 Python 中導入此模組來使用 main() 函數")

    except Exception as e:
        print(f"\n❌ 錯誤: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
