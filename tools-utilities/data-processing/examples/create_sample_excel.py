#!/usr/bin/env python3
"""
創建範例 Excel 檔案
"""

import pandas as pd
from pathlib import Path

# 設置輸出目錄
output_dir = Path(__file__).parent

# 創建多工作表的 Excel 檔案
with pd.ExcelWriter(output_dir / 'sample_data.xlsx', engine='openpyxl') as writer:
    # 工作表 1: 員工資料
    employees = pd.DataFrame({
        'emp_id': ['E001', 'E002', 'E003', 'E004', 'E005', 'E006', 'E007', 'E008'],
        'name': ['張小明', '李小華', '王大偉', '陳美麗', '林志明', '黃小芳', '吳建國', '鄭雅婷'],
        'department': ['工程部', '工程部', '工程部', '設計部', '設計部', '行銷部', '行銷部', '人資部'],
        'position': ['工程師', '資深工程師', '工程師', '設計師', '資深設計師', '行銷專員', '行銷經理', 'HR專員'],
        'salary': [65000, 75000, 58000, 62000, 72000, 55000, 80000, 58000],
        'hire_date': ['2022-03-15', '2021-07-20', '2023-01-10', '2022-11-05', '2021-05-18', '2023-02-14', '2020-08-22', '2022-06-15'],
        'email': [
            'zhang.xiaoming@company.com',
            'li.xiaohua@company.com',
            'wang.dawei@company.com',
            'chen.meili@company.com',
            'lin.zhiming@company.com',
            'huang.xiaofang@company.com',
            'wu.jianguo@company.com',
            'zheng.yating@company.com'
        ]
    })
    employees.to_excel(writer, sheet_name='員工資料', index=False)

    # 工作表 2: 部門資料
    departments = pd.DataFrame({
        'dept_id': ['D001', 'D002', 'D003', 'D004'],
        'dept_name': ['工程部', '設計部', '行銷部', '人資部'],
        'manager': ['李小華', '林志明', '吳建國', '鄭雅婷'],
        'budget': [5000000, 3000000, 2500000, 1500000],
        'headcount': [15, 10, 8, 5]
    })
    departments.to_excel(writer, sheet_name='部門資料', index=False)

    # 工作表 3: 專案資料
    projects = pd.DataFrame({
        'project_id': ['PRJ001', 'PRJ002', 'PRJ003', 'PRJ004', 'PRJ005'],
        'project_name': ['電商平台開發', '品牌重塑專案', '內部系統升級', '新產品行銷', '人才招募計畫'],
        'department': ['工程部', '設計部', '工程部', '行銷部', '人資部'],
        'status': ['進行中', '已完成', '進行中', '規劃中', '進行中'],
        'start_date': ['2024-01-01', '2023-10-01', '2024-02-15', '2024-03-01', '2024-01-15'],
        'end_date': ['2024-06-30', '2024-02-28', '2024-05-31', '2024-04-30', '2024-03-31'],
        'budget': [2000000, 800000, 1500000, 600000, 300000]
    })
    projects.to_excel(writer, sheet_name='專案資料', index=False)

    # 工作表 4: 銷售資料
    sales = pd.DataFrame({
        'order_id': [f'ORD{i:04d}' for i in range(1, 21)],
        'product': ['筆記型電腦', '滑鼠', '鍵盤', '顯示器', '桌子'] * 4,
        'quantity': [2, 10, 5, 3, 2, 1, 8, 4, 2, 1, 3, 5, 6, 1, 2, 2, 12, 3, 4, 1],
        'unit_price': [35000, 500, 1200, 8000, 6000] * 4,
        'order_date': [
            '2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19',
            '2024-01-20', '2024-01-21', '2024-01-22', '2024-01-23', '2024-01-24',
            '2024-01-25', '2024-01-26', '2024-01-27', '2024-01-28', '2024-01-29',
            '2024-01-30', '2024-01-31', '2024-02-01', '2024-02-02', '2024-02-03'
        ],
        'region': ['北區', '南區', '中區', '東區', '西區'] * 4
    })
    sales['total'] = sales['quantity'] * sales['unit_price']
    sales.to_excel(writer, sheet_name='銷售資料', index=False)

print("✅ 已創建 sample_data.xlsx")
print("   包含 4 個工作表: 員工資料、部門資料、專案資料、銷售資料")
