"""
庫存優化系統範例使用腳本
展示如何使用 API 進行庫存優化分析
"""
import requests
import json

# API 基礎 URL
BASE_URL = "http://localhost:8002"


def print_section(title):
    """打印章節標題"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def test_eoq_calculation():
    """測試 EOQ 計算"""
    print_section("📦 測試經濟訂購量 (EOQ) 計算")

    url = f"{BASE_URL}/api/eoq"

    payload = {
        "annual_demand": 5000,
        "ordering_cost": 5000,
        "holding_cost_rate": 0.20,
        "unit_cost": 20000
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        print("✓ EOQ 計算完成\n")
        print("輸入參數:")
        print(f"  年需求量: {payload['annual_demand']:,} 台")
        print(f"  每次訂購成本: ${payload['ordering_cost']:,}")
        print(f"  持有成本率: {payload['holding_cost_rate']*100}%")
        print(f"  單位成本: ${payload['unit_cost']:,}")

        print(f"\n計算結果:")
        eoq_result = result['result']
        print(f"  經濟訂購量 (EOQ): {eoq_result['eoq']:.0f} 台")
        print(f"  年度訂購次數: {eoq_result['orders_per_year']:.1f} 次")
        print(f"  訂購週期: {eoq_result['days_between_orders']:.1f} 天")
        print(f"  平均庫存: {eoq_result['average_inventory']:.0f} 台")
        print(f"  年度訂購成本: ${eoq_result['annual_ordering_cost']:,.2f}")
        print(f"  年度持有成本: ${eoq_result['annual_holding_cost']:,.2f}")
        print(f"  年度總成本: ${eoq_result['total_annual_cost']:,.2f}")

        print(f"\n建議:")
        for rec in result['recommendations']:
            print(f"  • {rec}")

        return result

    except Exception as e:
        print(f"✗ EOQ 計算失敗: {e}")
        return None


def test_safety_stock_calculation():
    """測試安全庫存計算"""
    print_section("🛡️  測試安全庫存計算")

    url = f"{BASE_URL}/api/safety-stock"

    payload = {
        "avg_demand": 13.7,  # 日需求
        "demand_std": 50.0,  # 需求標準差
        "lead_time": 14.0,   # 前置時間(天)
        "lead_time_std": 2.0,  # 前置時間標準差
        "service_level": 0.95  # 95% 服務水平
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        print("✓ 安全庫存計算完成\n")

        safety_result = result['result']
        print(f"安全庫存: {safety_result['safety_stock']:.0f} 台")
        print(f"Z-score: {safety_result['z_score']:.2f}")
        print(f"服務水平: {safety_result['service_level']*100}%")
        print(f"缺貨概率: {safety_result['stockout_probability']*100:.2f}%")
        print(f"前置時間需求: {safety_result['demand_during_lead_time']:.0f} 台")

        print(f"\n建議:")
        for rec in result['recommendations']:
            print(f"  • {rec}")

        return result

    except Exception as e:
        print(f"✗ 安全庫存計算失敗: {e}")
        return None


def test_reorder_point_calculation():
    """測試補貨點計算"""
    print_section("📍 測試補貨點計算")

    url = f"{BASE_URL}/api/reorder-point"

    payload = {
        "avg_daily_demand": 13.7,
        "lead_time_days": 14.0,
        "demand_std": 50.0,
        "service_level": 0.95
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        print("✓ 補貨點計算完成\n")

        rop_result = result['result']
        print(f"補貨點 (ROP): {rop_result['reorder_point']:.0f} 台")
        print(f"前置時間需求: {rop_result['demand_during_lead_time']:.0f} 台")
        print(f"安全庫存: {rop_result['safety_stock']:.0f} 台")
        print(f"前置時間: {rop_result['lead_time_days']} 天")

        print(f"\n建議:")
        for rec in result['recommendations']:
            print(f"  • {rec}")

        return result

    except Exception as e:
        print(f"✗ 補貨點計算失敗: {e}")
        return None


def test_abc_analysis():
    """測試 ABC 分類分析"""
    print_section("📊 測試 ABC 分類分析")

    url = f"{BASE_URL}/api/abc-analysis"

    # 範例物料數據
    items = [
        {"item_id": "LP-001", "annual_value": 100000000},
        {"item_id": "TB-002", "annual_value": 45000000},
        {"item_id": "MS-003", "annual_value": 24000000},
        {"item_id": "KB-004", "annual_value": 15000000},
        {"item_id": "AC-005", "annual_value": 12000000},
        {"item_id": "CH-006", "annual_value": 8000000},
        {"item_id": "CA-007", "annual_value": 6000000},
        {"item_id": "HD-008", "annual_value": 4000000},
        {"item_id": "SSD-009", "annual_value": 3000000},
        {"item_id": "RAM-010", "annual_value": 2000000},
    ]

    payload = {"items": items}

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        print("✓ ABC 分類完成\n")

        abc_result = result['result']
        print(f"總物料數: {abc_result['total_items']}")
        print(f"總價值: ${abc_result['total_value']:,}\n")

        print("類別分布:")
        for category, info in abc_result['category_distribution'].items():
            print(f"  {category} 類: {info['count']} 個物料 ({info['percentage']}%)")

        print(f"\nTop 5 物料:")
        print(f"{'物料編號':<12} {'年度價值':>15} {'累積%':>10} {'類別':>6}")
        print("-" * 50)

        for item in abc_result['items'][:5]:
            print(f"{item['item_id']:<12} ${item['annual_value']:>14,} "
                  f"{item['cumulative_percentage']:>9.1f}% {item['category']:>6}")

        print(f"\n建議:")
        for rec in result['recommendations']:
            print(f"  • {rec}")

        return result

    except Exception as e:
        print(f"✗ ABC 分析失敗: {e}")
        return None


def test_comprehensive_optimization():
    """測試綜合庫存優化"""
    print_section("🎯 測試綜合庫存優化")

    url = f"{BASE_URL}/api/optimize"

    payload = {
        "item_id": "LAPTOP-001",
        "annual_demand": 5000,
        "ordering_cost": 5000,
        "holding_cost_rate": 0.20,
        "unit_cost": 20000,
        "avg_daily_demand": 13.7,
        "demand_std": 50.0,
        "lead_time_days": 14.0,
        "lead_time_std": 2.0,
        "service_level": 0.95
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        print("✓ 綜合優化完成\n")

        policy = result['inventory_policy']
        print("庫存策略:")
        print(f"  訂購量: {policy['order_quantity']:.0f} 台")
        print(f"  補貨點: {policy['reorder_point']:.0f} 台")
        print(f"  安全庫存: {policy['safety_stock']:.0f} 台")
        print(f"  最大庫存: {policy['max_stock']:.0f} 台")
        print(f"  服務水平: {policy['service_level']}%")

        print(f"\n優化結果:")
        opt_results = result['optimization_results']
        print(f"  EOQ: {opt_results['economic_order_quantity']['eoq']:.0f} 台")
        print(f"  年度總成本: ${opt_results['economic_order_quantity']['total_annual_cost']:,.2f}")

        print(f"\n建議:")
        for rec in result['recommendations']:
            print(f"  • {rec}")

        return result

    except Exception as e:
        print(f"✗ 綜合優化失敗: {e}")
        return None


def run_all_tests():
    """運行所有測試"""
    print("\n" + "╔" + "═" * 78 + "╗")
    print("║" + " " * 20 + "庫存優化系統完整測試範例" + " " * 25 + "║")
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

    # 運行所有測試
    test_eoq_calculation()
    test_safety_stock_calculation()
    test_reorder_point_calculation()
    test_abc_analysis()
    test_comprehensive_optimization()

    # 完成
    print_section("✅ 所有測試完成！")
    print("""
下一步建議:
1. 根據計算結果調整庫存策略
2. 定期重新計算 EOQ 和安全庫存
3. 使用 ABC 分析優先管理高價值物料
4. 建立補貨點監控機制
5. 定期評估服務水平和成本

API 文檔: http://localhost:8002/docs
    """)


if __name__ == "__main__":
    run_all_tests()
