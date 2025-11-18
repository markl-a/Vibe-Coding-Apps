"""
需求預測系統範例使用腳本
展示如何使用 API 進行預測和 AI 分析
"""
import requests
import json
from datetime import datetime, timedelta
import pandas as pd
import random
import numpy as np


# API 基礎 URL
BASE_URL = "http://localhost:8000"


def print_section(title):
    """打印章節標題"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def generate_sample_data(item_id="LAPTOP-001", item_name="筆記型電腦", months=36):
    """生成範例歷史數據"""
    print_section("📊 生成範例歷史數據")

    base_demand = 400
    trend = 1.01  # 每月增長 1%
    seasonality = [0.85, 0.90, 1.10, 1.05, 1.00, 0.95, 1.15, 1.20, 1.10, 1.00, 0.95, 1.25]

    records = []
    start_date = datetime.now() - timedelta(days=30 * months)

    for i in range(months):
        date = start_date + timedelta(days=30 * i)
        month_index = i % 12

        # 基礎需求 * 趨勢 * 季節性 + 隨機波動
        demand = base_demand * (trend ** i) * seasonality[month_index]
        demand = demand * (1 + random.uniform(-0.1, 0.1))  # ±10% 波動
        demand = max(0, int(demand))

        # 是否有促銷（20% 機率）
        is_promotion = 1 if random.random() < 0.2 else 0
        if is_promotion:
            demand = int(demand * 1.3)  # 促銷增加 30%

        records.append({
            "item_id": item_id,
            "item_name": item_name,
            "date": date.isoformat(),
            "quantity": demand,
            "is_promotion": is_promotion,
            "price": round(20000 + random.uniform(-500, 500), 2)
        })

    print(f"✓ 生成了 {len(records)} 筆歷史數據")
    print(f"  時間範圍: {records[0]['date'][:10]} 至 {records[-1]['date'][:10]}")
    print(f"  平均需求: {np.mean([r['quantity'] for r in records]):.0f} 件/月")
    print(f"  需求範圍: {min(r['quantity'] for r in records)} - {max(r['quantity'] for r in records)} 件")

    return records


def upload_sample_data(records):
    """上傳範例數據到 API"""
    print_section("📤 上傳歷史數據到 API")

    url = f"{BASE_URL}/api/demand-history/batch"

    try:
        response = requests.post(url, json={"records": records})
        response.raise_for_status()
        result = response.json()

        print(f"✓ 成功上傳 {result['count']} 筆數據")
        print(f"  訊息: {result['message']}")
        return True

    except Exception as e:
        print(f"✗ 上傳失敗: {e}")
        return False


def test_prophet_forecast(item_id="LAPTOP-001"):
    """測試 Prophet 預測"""
    print_section("🔮 測試 Prophet 時間序列預測")

    url = f"{BASE_URL}/api/forecast/"

    payload = {
        "item_id": item_id,
        "periods": 12,
        "frequency": "M",
        "include_promotions": False
    }

    try:
        print("⏳ 正在運行 Prophet 模型...")
        response = requests.post(url, json=payload, timeout=120)
        response.raise_for_status()
        result = response.json()

        print("✓ Prophet 預測完成\n")

        # 顯示預測結果
        print("預測結果:")
        print(f"{'期間':<10} {'預測需求':>10} {'下界':>10} {'上界':>10}")
        print("-" * 45)

        for i, fc in enumerate(result['forecasts'][:6], 1):
            print(f"期間 {i:<4} {fc['predicted_quantity']:>10.0f} "
                  f"{fc['lower_bound']:>10.0f} {fc['upper_bound']:>10.0f}")

        # 顯示準確度
        print(f"\n準確度指標:")
        metrics = result['accuracy_metrics']
        print(f"  MAPE: {metrics['mape']:.2f}%")
        print(f"  RMSE: {metrics['rmse']:.2f}")
        print(f"  MAE:  {metrics['mae']:.2f}")
        print(f"  R²:   {metrics['r2_score']:.4f}")

        return result

    except Exception as e:
        print(f"✗ Prophet 預測失敗: {e}")
        return None


def test_lstm_forecast(item_id="LAPTOP-001"):
    """測試 LSTM 深度學習預測"""
    print_section("🧠 測試 LSTM 深度學習預測")

    url = f"{BASE_URL}/api/forecast/lstm"

    payload = {
        "item_id": item_id,
        "periods": 12,
        "lookback_window": 24,
        "model_type": "lstm"
    }

    try:
        print("⏳ 正在訓練 LSTM 模型（這可能需要幾分鐘）...")
        response = requests.post(url, json=payload, timeout=300)
        response.raise_for_status()
        result = response.json()

        print("✓ LSTM 預測完成\n")

        # 顯示訓練信息
        print("訓練信息:")
        metrics = result['training_metrics']
        print(f"  訓練樣本數: {metrics['training_samples']}")
        print(f"  訓練輪數: {metrics['epochs_trained']}")
        print(f"  最終驗證損失: {metrics['final_val_loss']:.4f}")
        print(f"  最終驗證 MAE: {metrics['final_val_mae']:.2f}")

        # 顯示預測結果
        print(f"\n預測結果:")
        print(f"{'期間':<10} {'預測需求':>12}")
        print("-" * 25)

        for i, fc in enumerate(result['forecasts'][:6], 1):
            print(f"期間 {i:<4} {fc['predicted_quantity']:>12.0f}")

        return result

    except Exception as e:
        print(f"✗ LSTM 預測失敗: {e}")
        return None


def test_smart_forecast(item_id="LAPTOP-001"):
    """測試智能預測（自動選擇模型）"""
    print_section("🎯 測試智能預測（自動選擇最佳模型）")

    url = f"{BASE_URL}/api/forecast/smart"

    payload = {
        "item_id": item_id,
        "periods": 12,
        "frequency": "M"
    }

    try:
        print("⏳ 正在自動選擇最佳模型並預測...")
        response = requests.post(url, json=payload, timeout=300)
        response.raise_for_status()
        result = response.json()

        print("✓ 智能預測完成\n")

        # 顯示使用的模型
        model_type = result.get('model_type', result.get('model_info', {}).get('model_type', 'Unknown'))
        print(f"自動選擇的模型: {model_type}")

        # 顯示預測結果
        print(f"\n預測結果:")
        for i, fc in enumerate(result['forecasts'][:6], 1):
            pred = fc['predicted_quantity']
            print(f"期間 {i}: {pred:.0f} 件")

        return result

    except Exception as e:
        print(f"✗ 智能預測失敗: {e}")
        return None


def test_ai_analysis(item_id="LAPTOP-001"):
    """測試 AI 分析"""
    print_section("🤖 測試 AI 智能分析")

    url = f"{BASE_URL}/api/ai/analyze"

    payload = {
        "item_id": item_id,
        "periods": 12,
        "frequency": "M"
    }

    try:
        print("⏳ 正在進行 AI 分析...")
        response = requests.post(url, json=payload, timeout=120)
        response.raise_for_status()
        result = response.json()

        print("✓ AI 分析完成\n")

        # 顯示洞察
        if 'ai_analysis' in result:
            analysis = result['ai_analysis']

            # 摘要
            print(f"📋 摘要: {analysis.get('summary', 'N/A')}\n")

            # 洞察
            if analysis.get('insights'):
                print("💡 關鍵洞察:")
                for insight in analysis['insights']:
                    emoji = {
                        'excellent': '✅',
                        'good': '👍',
                        'info': 'ℹ️',
                        'warning': '⚠️'
                    }.get(insight['level'], '•')
                    print(f"  {emoji} {insight['message']}")
                    print(f"     {insight['details']}")
                print()

            # 警報
            if analysis.get('alerts'):
                print("⚠️  警報:")
                for alert in analysis['alerts']:
                    print(f"  • {alert['message']}")
                    print(f"    行動: {alert['action']}")
                print()

            # 建議
            if analysis.get('next_actions'):
                print("📌 優先行動建議:")
                for i, action in enumerate(analysis['next_actions'], 1):
                    print(f"  {i}. {action}")
                print()

        # 顯示自然語言報告
        if 'natural_language_report' in result:
            print("\n" + "─" * 80)
            print("📄 自然語言報告:\n")
            print(result['natural_language_report'])

        return result

    except Exception as e:
        print(f"✗ AI 分析失敗: {e}")
        return None


def test_ai_chat():
    """測試 AI 助手對話"""
    print_section("💬 測試 AI 助手對話")

    url = f"{BASE_URL}/api/ai/chat"

    questions = [
        "預測準確嗎？",
        "未來趨勢如何？",
        "有什麼建議？",
        "你有什麼功能？"
    ]

    for question in questions:
        print(f"\n👤 用戶: {question}")

        try:
            response = requests.post(url, json={"message": question}, timeout=30)
            response.raise_for_status()
            result = response.json()

            print(f"🤖 AI:  {result['ai_response']}")

        except Exception as e:
            print(f"✗ 對話失敗: {e}")

    print()


def test_anomaly_detection(item_id="LAPTOP-001"):
    """測試異常檢測"""
    print_section("🔍 測試需求異常檢測")

    url = f"{BASE_URL}/api/anomalies/{item_id}"

    try:
        print("⏳ 正在檢測異常...")
        response = requests.get(url, params={"contamination": 0.1}, timeout=30)
        response.raise_for_status()
        result = response.json()

        print("✓ 異常檢測完成\n")

        total = result['total_records']
        anomaly_count = result['anomaly_count']

        print(f"總記錄數: {total}")
        print(f"異常記錄數: {anomaly_count} ({anomaly_count/total*100:.1f}%)")

        if result.get('anomalies'):
            print(f"\n檢測到的異常:")
            print(f"{'日期':<15} {'需求量':>10}")
            print("-" * 30)

            for anomaly in result['anomalies'][:10]:
                print(f"{anomaly['date'][:10]:<15} {anomaly['quantity']:>10.0f}")

        return result

    except Exception as e:
        print(f"✗ 異常檢測失敗: {e}")
        return None


def run_all_tests():
    """運行所有測試"""
    print("\n" + "╔" + "═" * 78 + "╗")
    print("║" + " " * 20 + "需求預測系統完整測試範例" + " " * 25 + "║")
    print("╚" + "═" * 78 + "╝")

    # 檢查 API 健康狀態
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        response.raise_for_status()
        print("\n✓ API 服務正常運行")
    except Exception as e:
        print(f"\n✗ 無法連接到 API: {e}")
        print("請確保後端服務已啟動: python main.py")
        return

    # 1. 生成並上傳範例數據
    sample_data = generate_sample_data(months=36)
    if not upload_sample_data(sample_data):
        print("數據上傳失敗，停止測試")
        return

    # 2. 測試異常檢測
    test_anomaly_detection()

    # 3. 測試 Prophet 預測
    prophet_result = test_prophet_forecast()

    # 4. 測試 LSTM 預測（可選，較慢）
    print("\n是否測試 LSTM 深度學習預測？（這可能需要幾分鐘）")
    test_lstm = input("輸入 'y' 測試，其他鍵跳過: ").lower() == 'y'
    if test_lstm:
        lstm_result = test_lstm_forecast()

    # 5. 測試智能預測
    test_smart_forecast()

    # 6. 測試 AI 分析
    test_ai_analysis()

    # 7. 測試 AI 聊天
    test_ai_chat()

    # 完成
    print_section("✅ 所有測試完成！")
    print("""
下一步建議:
1. 嘗試調整預測參數以提升準確度
2. 探索 AI 分析提供的洞察和建議
3. 使用 AI 助手詢問更多問題
4. 查看自然語言報告了解詳細分析
5. 將預測結果整合到您的業務流程中

API 文檔: http://localhost:8000/docs
    """)


if __name__ == "__main__":
    run_all_tests()
