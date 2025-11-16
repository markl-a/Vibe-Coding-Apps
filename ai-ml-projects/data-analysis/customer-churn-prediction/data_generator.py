"""
客戶流失資料生成器
生成模擬的電信客戶資料用於訓練和測試
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

class ChurnDataGenerator:
    def __init__(self, n_samples=5000, random_state=42):
        """
        初始化資料生成器

        Args:
            n_samples: 要生成的樣本數量
            random_state: 隨機種子
        """
        self.n_samples = n_samples
        np.random.seed(random_state)

    def generate(self):
        """生成客戶流失資料"""

        # 生成基本特徵
        data = {
            'customer_id': [f'CUST{str(i).zfill(6)}' for i in range(self.n_samples)],
            'tenure': np.random.randint(1, 73, self.n_samples),  # 1-72 個月
            'senior_citizen': np.random.choice([0, 1], self.n_samples, p=[0.84, 0.16]),
            'partner': np.random.choice(['Yes', 'No'], self.n_samples, p=[0.48, 0.52]),
            'dependents': np.random.choice(['Yes', 'No'], self.n_samples, p=[0.30, 0.70]),
        }

        # 服務相關特徵
        data['phone_service'] = np.random.choice(['Yes', 'No'], self.n_samples, p=[0.90, 0.10])
        data['internet_service'] = np.random.choice(
            ['DSL', 'Fiber optic', 'No'],
            self.n_samples,
            p=[0.34, 0.44, 0.22]
        )

        # 網路相關服務（只有在有網路服務時才可能有）
        has_internet = data['internet_service'] != 'No'
        data['online_security'] = np.where(
            has_internet,
            np.random.choice(['Yes', 'No'], self.n_samples, p=[0.29, 0.71]),
            'No internet service'
        )
        data['online_backup'] = np.where(
            has_internet,
            np.random.choice(['Yes', 'No'], self.n_samples, p=[0.34, 0.66]),
            'No internet service'
        )
        data['device_protection'] = np.where(
            has_internet,
            np.random.choice(['Yes', 'No'], self.n_samples, p=[0.34, 0.66]),
            'No internet service'
        )
        data['tech_support'] = np.where(
            has_internet,
            np.random.choice(['Yes', 'No'], self.n_samples, p=[0.29, 0.71]),
            'No internet service'
        )
        data['streaming_tv'] = np.where(
            has_internet,
            np.random.choice(['Yes', 'No'], self.n_samples, p=[0.38, 0.62]),
            'No internet service'
        )
        data['streaming_movies'] = np.where(
            has_internet,
            np.random.choice(['Yes', 'No'], self.n_samples, p=[0.38, 0.62]),
            'No internet service'
        )

        # 合約相關
        data['contract_type'] = np.random.choice(
            ['Month-to-month', 'One year', 'Two year'],
            self.n_samples,
            p=[0.55, 0.21, 0.24]
        )
        data['paperless_billing'] = np.random.choice(['Yes', 'No'], self.n_samples, p=[0.59, 0.41])
        data['payment_method'] = np.random.choice(
            ['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'],
            self.n_samples,
            p=[0.34, 0.23, 0.22, 0.21]
        )

        # 費用（基於服務類型）
        base_charges = np.random.uniform(18, 30, self.n_samples)

        # 有光纖服務的客戶費用較高
        fiber_bonus = np.where(data['internet_service'] == 'Fiber optic',
                               np.random.uniform(20, 40, self.n_samples), 0)

        # 額外服務費用
        service_charges = (
            (data['online_security'] == 'Yes').astype(int) * 5 +
            (data['online_backup'] == 'Yes').astype(int) * 5 +
            (data['device_protection'] == 'Yes').astype(int) * 5 +
            (data['tech_support'] == 'Yes').astype(int) * 5 +
            (data['streaming_tv'] == 'Yes').astype(int) * 8 +
            (data['streaming_movies'] == 'Yes').astype(int) * 8
        )

        data['monthly_charges'] = np.round(base_charges + fiber_bonus + service_charges, 2)
        data['total_charges'] = np.round(
            data['monthly_charges'] * data['tenure'] * np.random.uniform(0.95, 1.05, self.n_samples),
            2
        )

        # 生成流失標籤（基於多個因素的邏輯）
        churn_probability = self._calculate_churn_probability(data)
        data['churn'] = np.random.binomial(1, churn_probability).astype(str)
        data['churn'] = np.where(data['churn'] == '1', 'Yes', 'No')

        return pd.DataFrame(data)

    def _calculate_churn_probability(self, data):
        """
        基於多個因素計算流失機率
        這個函數模擬真實世界的流失模式
        """
        prob = np.full(self.n_samples, 0.15)  # 基礎機率

        # 短期客戶更容易流失
        prob += np.where(data['tenure'] < 12, 0.25, 0)
        prob += np.where(data['tenure'] < 6, 0.15, 0)

        # 月付合約更容易流失
        prob += np.where(data['contract_type'] == 'Month-to-month', 0.20, 0)
        prob -= np.where(data['contract_type'] == 'Two year', 0.15, 0)

        # 電子支票付款方式流失率較高
        prob += np.where(data['payment_method'] == 'Electronic check', 0.15, 0)

        # 高費用客戶
        high_charges = data['monthly_charges'] > np.percentile(data['monthly_charges'], 75)
        prob += np.where(high_charges, 0.10, 0)

        # 光纖但無額外服務的客戶
        fiber_no_services = (
            (data['internet_service'] == 'Fiber optic') &
            (data['online_security'] == 'No') &
            (data['tech_support'] == 'No')
        )
        prob += np.where(fiber_no_services, 0.15, 0)

        # 老年客戶且有伴侶的流失率較低
        stable_customers = (data['senior_citizen'] == 1) & (data['partner'] == 'Yes')
        prob -= np.where(stable_customers, 0.10, 0)

        # 確保機率在 [0, 1] 範圍內
        prob = np.clip(prob, 0, 1)

        return prob

    def save_datasets(self, output_dir='data', train_ratio=0.7, val_ratio=0.15):
        """
        生成並儲存訓練集、驗證集和測試集

        Args:
            output_dir: 輸出資料夾
            train_ratio: 訓練集比例
            val_ratio: 驗證集比例
        """
        # 創建輸出資料夾
        os.makedirs(output_dir, exist_ok=True)

        # 生成完整資料集
        print(f"生成 {self.n_samples} 筆客戶資料...")
        df = self.generate()

        # 分割資料集
        n_train = int(self.n_samples * train_ratio)
        n_val = int(self.n_samples * val_ratio)

        # 隨機打亂
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)

        train_df = df[:n_train]
        val_df = df[n_train:n_train + n_val]
        test_df = df[n_train + n_val:]

        # 儲存檔案
        train_path = os.path.join(output_dir, 'train_customers.csv')
        val_path = os.path.join(output_dir, 'val_customers.csv')
        test_path = os.path.join(output_dir, 'test_customers.csv')
        full_path = os.path.join(output_dir, 'all_customers.csv')

        train_df.to_csv(train_path, index=False)
        val_df.to_csv(val_path, index=False)
        test_df.to_csv(test_path, index=False)
        df.to_csv(full_path, index=False)

        # 統計資訊
        print(f"\n資料集已儲存到 {output_dir}/")
        print(f"  訓練集: {len(train_df)} 筆 ({len(train_df)/len(df)*100:.1f}%)")
        print(f"  驗證集: {len(val_df)} 筆 ({len(val_df)/len(df)*100:.1f}%)")
        print(f"  測試集: {len(test_df)} 筆 ({len(test_df)/len(df)*100:.1f}%)")
        print(f"\n流失率統計:")
        print(f"  訓練集: {(train_df['churn']=='Yes').sum()/len(train_df)*100:.2f}%")
        print(f"  驗證集: {(val_df['churn']=='Yes').sum()/len(val_df)*100:.2f}%")
        print(f"  測試集: {(test_df['churn']=='Yes').sum()/len(test_df)*100:.2f}%")

        # 生成一些示例資料用於展示
        sample_df = df.sample(n=min(20, len(df)), random_state=42)
        sample_path = os.path.join(output_dir, 'sample_customers.csv')
        sample_df.to_csv(sample_path, index=False)
        print(f"\n示例資料: {sample_path} ({len(sample_df)} 筆)")

        return train_df, val_df, test_df


def main():
    """主函數"""
    print("=" * 60)
    print("客戶流失資料生成器")
    print("=" * 60)

    # 生成資料
    generator = ChurnDataGenerator(n_samples=5000, random_state=42)
    train_df, val_df, test_df = generator.save_datasets(
        output_dir='data',
        train_ratio=0.7,
        val_ratio=0.15
    )

    print("\n✅ 資料生成完成!")
    print(f"\n資料欄位: {list(train_df.columns)}")
    print(f"\n前 5 筆範例資料:")
    print(train_df.head())


if __name__ == '__main__':
    main()
