"""
預測腳本
使用訓練好的模型進行預測
"""

import pandas as pd
import argparse
import os
from churn_predictor import ChurnPredictor


def predict_from_file(input_file, output_file, model_path):
    """
    從檔案讀取資料並預測

    Args:
        input_file: 輸入 CSV 檔案路徑
        output_file: 輸出 CSV 檔案路徑
        model_path: 模型檔案路徑
    """
    print(f"載入資料: {input_file}")
    df = pd.read_csv(input_file)
    print(f"資料筆數: {len(df)}")

    # 載入模型
    print(f"\n載入模型: {model_path}")
    predictor = ChurnPredictor()
    predictor.load_model(model_path)

    # 預測
    print("\n執行預測...")
    result_df = predictor.predict_batch(df)

    # 統計
    churn_count = (result_df['churn_prediction'] == 'Yes').sum()
    churn_rate = churn_count / len(result_df) * 100

    print(f"\n預測結果統計:")
    print(f"  總客戶數: {len(result_df)}")
    print(f"  預測流失: {churn_count} ({churn_rate:.2f}%)")
    print(f"  預測留存: {len(result_df) - churn_count} ({100-churn_rate:.2f}%)")

    # 風險分層
    high_risk = (result_df['churn_probability'] > 0.7).sum()
    medium_risk = ((result_df['churn_probability'] > 0.3) &
                   (result_df['churn_probability'] <= 0.7)).sum()
    low_risk = (result_df['churn_probability'] <= 0.3).sum()

    print(f"\n風險分層:")
    print(f"  🔴 高風險 (>70%): {high_risk} ({high_risk/len(result_df)*100:.1f}%)")
    print(f"  🟡 中風險 (30-70%): {medium_risk} ({medium_risk/len(result_df)*100:.1f}%)")
    print(f"  🟢 低風險 (<30%): {low_risk} ({low_risk/len(result_df)*100:.1f}%)")

    # 儲存結果
    result_df.to_csv(output_file, index=False)
    print(f"\n✅ 預測結果已儲存: {output_file}")

    # 顯示高風險客戶範例
    if high_risk > 0:
        print(f"\n高風險客戶範例 (前 5 筆):")
        high_risk_customers = result_df[result_df['churn_probability'] > 0.7].head()
        print(high_risk_customers[['customer_id', 'churn_probability']].to_string(index=False))


def predict_interactive():
    """互動式預測"""
    print("="*60)
    print("互動式客戶流失預測")
    print("="*60)

    # 載入模型
    model_path = 'models/best_model.pkl'
    if not os.path.exists(model_path):
        print(f"❌ 找不到模型檔案: {model_path}")
        print("請先執行 train.py 訓練模型")
        return

    predictor = ChurnPredictor()
    predictor.load_model(model_path)

    # 收集客戶資料
    print("\n請輸入客戶資料:")

    customer_data = {}

    # 數值特徵
    customer_data['tenure'] = int(input("使用服務月數 (1-72): "))
    customer_data['monthly_charges'] = float(input("月費用 ($): "))
    customer_data['total_charges'] = float(input("總費用 ($): "))

    # 類別特徵
    customer_data['senior_citizen'] = int(input("是否為老年人 (0/1): "))
    customer_data['partner'] = input("是否有伴侶 (Yes/No): ")
    customer_data['dependents'] = input("是否有家屬 (Yes/No): ")
    customer_data['phone_service'] = input("是否使用電話服務 (Yes/No): ")

    print("\n網路服務類型:")
    print("  1. DSL")
    print("  2. Fiber optic")
    print("  3. No")
    internet_choice = input("選擇 (1-3): ")
    internet_map = {'1': 'DSL', '2': 'Fiber optic', '3': 'No'}
    customer_data['internet_service'] = internet_map.get(internet_choice, 'No')

    if customer_data['internet_service'] != 'No':
        customer_data['online_security'] = input("是否有線上安全 (Yes/No): ")
        customer_data['online_backup'] = input("是否有線上備份 (Yes/No): ")
        customer_data['device_protection'] = input("是否有設備保護 (Yes/No): ")
        customer_data['tech_support'] = input("是否有技術支援 (Yes/No): ")
        customer_data['streaming_tv'] = input("是否訂閱串流電視 (Yes/No): ")
        customer_data['streaming_movies'] = input("是否訂閱串流電影 (Yes/No): ")
    else:
        for service in ['online_security', 'online_backup', 'device_protection',
                       'tech_support', 'streaming_tv', 'streaming_movies']:
            customer_data[service] = 'No internet service'

    print("\n合約類型:")
    print("  1. Month-to-month")
    print("  2. One year")
    print("  3. Two year")
    contract_choice = input("選擇 (1-3): ")
    contract_map = {'1': 'Month-to-month', '2': 'One year', '3': 'Two year'}
    customer_data['contract_type'] = contract_map.get(contract_choice, 'Month-to-month')

    customer_data['paperless_billing'] = input("是否使用無紙化帳單 (Yes/No): ")

    print("\n付款方式:")
    print("  1. Electronic check")
    print("  2. Mailed check")
    print("  3. Bank transfer (automatic)")
    print("  4. Credit card (automatic)")
    payment_choice = input("選擇 (1-4): ")
    payment_map = {
        '1': 'Electronic check',
        '2': 'Mailed check',
        '3': 'Bank transfer (automatic)',
        '4': 'Credit card (automatic)'
    }
    customer_data['payment_method'] = payment_map.get(payment_choice, 'Electronic check')

    # 預測
    print("\n分析中...")
    churn_prob = predictor.predict_single(customer_data)

    # 顯示結果
    print("\n" + "="*60)
    print("預測結果")
    print("="*60)
    print(f"\n客戶流失機率: {churn_prob:.2%}")

    if churn_prob > 0.7:
        risk_level = "🔴 高風險"
    elif churn_prob > 0.3:
        risk_level = "🟡 中風險"
    else:
        risk_level = "🟢 低風險"

    print(f"風險等級: {risk_level}")

    # 提供建議
    recommendations = predictor.get_retention_recommendations(customer_data, churn_prob)
    print(f"\n挽留建議:")
    for i, rec in enumerate(recommendations, 1):
        print(f"  {i}. {rec}")


def main():
    """主函數"""
    parser = argparse.ArgumentParser(description='客戶流失預測')
    parser.add_argument('--input', type=str, help='輸入 CSV 檔案路徑')
    parser.add_argument('--output', type=str, help='輸出 CSV 檔案路徑')
    parser.add_argument('--model', type=str, default='models/best_model.pkl',
                        help='模型檔案路徑')
    parser.add_argument('--interactive', action='store_true',
                        help='互動式預測模式')

    args = parser.parse_args()

    if args.interactive:
        predict_interactive()
    elif args.input and args.output:
        predict_from_file(args.input, args.output, args.model)
    else:
        parser.print_help()
        print("\n範例用法:")
        print("  批次預測: python predict.py --input data/test_customers.csv --output predictions.csv")
        print("  互動預測: python predict.py --interactive")


if __name__ == '__main__':
    main()
