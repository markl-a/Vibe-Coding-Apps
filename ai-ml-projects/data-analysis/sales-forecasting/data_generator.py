"""
銷售資料生成器
生成模擬的時間序列銷售資料
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

class SalesDataGenerator:
    def __init__(self, start_date='2022-01-01', n_days=730, random_state=42):
        """
        初始化資料生成器

        Args:
            start_date: 開始日期
            n_days: 生成天數
            random_state: 隨機種子
        """
        self.start_date = pd.to_datetime(start_date)
        self.n_days = n_days
        np.random.seed(random_state)

    def generate(self):
        """生成銷售時間序列資料"""

        # 生成日期範圍
        dates = pd.date_range(start=self.start_date, periods=self.n_days, freq='D')

        # 基礎銷售額（趨勢）
        trend = np.linspace(1000, 2000, self.n_days)

        # 週季節性（週末銷售較高）
        weekly_seasonality = 200 * np.sin(2 * np.pi * np.arange(self.n_days) / 7)

        # 年季節性（夏季和年底銷售較高）
        yearly_seasonality = 300 * np.sin(2 * np.pi * np.arange(self.n_days) / 365)

        # 隨機噪音
        noise = np.random.normal(0, 100, self.n_days)

        # 組合所有成分
        sales = trend + weekly_seasonality + yearly_seasonality + noise

        # 確保銷售額為正
        sales = np.maximum(sales, 100)

        # 創建資料框
        df = pd.DataFrame({
            'date': dates,
            'sales': sales.round(2)
        })

        # 添加額外特徵
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_name'] = df['date'].dt.day_name()
        df['month'] = df['date'].dt.month
        df['quarter'] = df['date'].dt.quarter
        df['year'] = df['date'].dt.year
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)

        # 促銷活動（隨機 10% 的日子）
        df['promotion'] = np.random.choice([0, 1], size=self.n_days, p=[0.9, 0.1])
        # 促銷日銷售額提升 20-50%
        promo_boost = np.where(df['promotion'] == 1,
                               np.random.uniform(1.2, 1.5, self.n_days),
                               1.0)
        df['sales'] = (df['sales'] * promo_boost).round(2)

        # 假日效應
        df['is_holiday'] = 0
        for date in df['date']:
            month, day = date.month, date.day
            # 主要假日
            if (month == 1 and day == 1) or \  # 元旦
               (month == 7 and day == 4) or \  # 美國國慶
               (month == 11 and day == 11) or \  # 雙11
               (month == 12 and day == 25):  # 聖誕節
                df.loc[df['date'] == date, 'is_holiday'] = 1
                df.loc[df['date'] == date, 'sales'] *= np.random.uniform(1.5, 2.0)

        df['sales'] = df['sales'].round(2)

        return df

    def save_datasets(self, output_dir='data'):
        """
        生成並儲存不同粒度的資料集

        Args:
            output_dir: 輸出資料夾
        """
        os.makedirs(output_dir, exist_ok=True)

        print(f"生成 {self.n_days} 天的銷售資料...")
        daily_df = self.generate()

        # 日資料
        daily_path = os.path.join(output_dir, 'sales_daily.csv')
        daily_df.to_csv(daily_path, index=False)
        print(f"✅ 日資料已儲存: {daily_path} ({len(daily_df)} 筆)")

        # 週資料（加總）
        weekly_df = daily_df.resample('W', on='date').agg({
            'sales': 'sum',
            'promotion': 'sum',
            'is_holiday': 'sum'
        }).reset_index()
        weekly_path = os.path.join(output_dir, 'sales_weekly.csv')
        weekly_df.to_csv(weekly_path, index=False)
        print(f"✅ 週資料已儲存: {weekly_path} ({len(weekly_df)} 筆)")

        # 月資料（加總）
        monthly_df = daily_df.resample('M', on='date').agg({
            'sales': 'sum',
            'promotion': 'sum',
            'is_holiday': 'sum'
        }).reset_index()
        monthly_path = os.path.join(output_dir, 'sales_monthly.csv')
        monthly_df.to_csv(monthly_path, index=False)
        print(f"✅ 月資料已儲存: {monthly_path} ({len(monthly_df)} 筆)")

        # 統計資訊
        print(f"\n銷售統計:")
        print(f"  平均日銷售額: ${daily_df['sales'].mean():.2f}")
        print(f"  最高日銷售額: ${daily_df['sales'].max():.2f}")
        print(f"  最低日銷售額: ${daily_df['sales'].min():.2f}")
        print(f"  總銷售額: ${daily_df['sales'].sum():.2f}")

        return daily_df, weekly_df, monthly_df


def main():
    """主函數"""
    print("="*60)
    print("銷售資料生成器")
    print("="*60)

    # 生成 2 年的資料
    generator = SalesDataGenerator(
        start_date='2022-01-01',
        n_days=730,
        random_state=42
    )

    daily_df, weekly_df, monthly_df = generator.save_datasets()

    print("\n前 10 筆日資料範例:")
    print(daily_df.head(10))

    print("\n✅ 資料生成完成!")


if __name__ == '__main__':
    main()
