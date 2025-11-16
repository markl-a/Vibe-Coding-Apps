"""
測試數據生成器
生成模擬的歷史需求數據用於測試
"""
import requests
from datetime import datetime, timedelta
import random
import numpy as np

API_URL = "http://localhost:8000"

def generate_sample_data(item_id: str, item_name: str, months: int = 24):
    """
    生成樣本數據

    參數:
    - item_id: 物料編號
    - item_name: 物料名稱
    - months: 生成幾個月的數據
    """
    records = []
    base_demand = 1000
    start_date = datetime.now() - timedelta(days=30 * months)

    for i in range(months):
        # 日期
        date = start_date + timedelta(days=30 * i)

        # 基礎需求
        demand = base_demand

        # 趨勢 (逐月增長)
        trend = i * 10

        # 季節性 (夏季高峰)
        month = date.month
        seasonality = 200 * np.sin((month - 1) * np.pi / 6)

        # 隨機波動
        noise = random.gauss(0, 50)

        # 促銷影響
        is_promotion = 1 if random.random() < 0.15 else 0
        promotion_boost = 300 if is_promotion else 0

        # 總需求
        quantity = max(0, demand + trend + seasonality + noise + promotion_boost)

        # 價格
        base_price = 100
        price = base_price * (0.9 if is_promotion else 1.0)

        records.append({
            "item_id": item_id,
            "item_name": item_name,
            "date": date.isoformat(),
            "quantity": round(quantity, 2),
            "is_promotion": is_promotion,
            "price": round(price, 2)
        })

    return records

def upload_data(records):
    """上傳數據到 API"""
    try:
        response = requests.post(
            f"{API_URL}/api/demand-history/batch",
            json={"records": records}
        )
        response.raise_for_status()
        print(f"✓ 成功上傳 {len(records)} 筆記錄")
        print(f"  響應: {response.json()}")
        return True
    except Exception as e:
        print(f"✗ 上傳失敗: {str(e)}")
        return False

def generate_forecast(item_id: str, periods: int = 12):
    """生成預測"""
    try:
        response = requests.post(
            f"{API_URL}/api/forecast/",
            json={
                "item_id": item_id,
                "periods": periods,
                "frequency": "M",
                "include_promotions": False
            }
        )
        response.raise_for_status()
        result = response.json()

        print(f"\n✓ 預測生成成功")
        print(f"  物料: {result['item_id']}")
        print(f"  準確度指標: {result['accuracy_metrics']}")
        print(f"\n  未來 {periods} 個月預測:")

        for fc in result['forecasts'][:5]:  # 只顯示前 5 個月
            print(f"    {fc['date'][:10]}: {fc['predicted_quantity']:.0f} "
                  f"(區間: {fc['lower_bound']:.0f} - {fc['upper_bound']:.0f})")

        return result
    except Exception as e:
        print(f"✗ 預測失敗: {str(e)}")
        return None

if __name__ == "__main__":
    print("=" * 60)
    print("智能需求預測系統 - 測試數據生成器")
    print("=" * 60)

    # 生成多個物料的數據
    items = [
        {"item_id": "ITEM-001", "item_name": "筆記型電腦"},
        {"item_id": "ITEM-002", "item_name": "智能手機"},
        {"item_id": "ITEM-003", "item_name": "平板電腦"},
    ]

    for item in items:
        print(f"\n正在生成物料 {item['item_id']} ({item['item_name']}) 的數據...")
        records = generate_sample_data(item['item_id'], item['item_name'], months=24)
        upload_data(records)

    # 生成預測
    print("\n" + "=" * 60)
    print("生成預測")
    print("=" * 60)

    for item in items:
        print(f"\n物料: {item['item_id']} ({item['item_name']})")
        generate_forecast(item['item_id'], periods=12)

    print("\n" + "=" * 60)
    print("完成!")
    print("=" * 60)
