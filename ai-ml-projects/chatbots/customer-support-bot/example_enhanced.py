"""
Enhanced Customer Support Bot Example
展示向量搜索、AI工具調用和對話歷史等新功能
"""

from support_bot import CustomerSupportBot
import json


def main():
    print("=" * 60)
    print("增強版客戶服務機器人示例")
    print("=" * 60)
    print()

    # 初始化機器人（啟用所有增強功能）
    print("初始化機器人...")
    bot = CustomerSupportBot(
        knowledge_base_path="data/faq.json",
        escalation_threshold=0.3,
        use_vector_search=True,  # 啟用向量搜索
        enable_function_calling=True  # 啟用AI工具調用
    )
    print("✓ 機器人初始化完成")
    print()

    # 模擬對話
    user_id = "demo_user_001"

    scenarios = [
        {
            "name": "場景1：一般問題（使用FAQ）",
            "message": "如何追蹤我的訂單？"
        },
        {
            "name": "場景2：訂單查詢（使用AI工具調用）",
            "message": "請幫我查詢訂單ORD123456的狀態"
        },
        {
            "name": "場景3：庫存查詢（使用AI工具調用）",
            "message": "請問產品PROD999還有庫存嗎？"
        },
        {
            "name": "場景4：退款請求（使用AI工具調用）",
            "message": "我想退訂單ORD123456，因為商品有瑕疵"
        },
        {
            "name": "場景5：多語言支持",
            "message": "What are your shipping options?"
        }
    ]

    for i, scenario in enumerate(scenarios, 1):
        print(f"\n{'-' * 60}")
        print(f"🎯 {scenario['name']}")
        print(f"{'-' * 60}")
        print(f"客戶: {scenario['message']}")

        # 處理查詢
        response = bot.handle_query(
            message=scenario['message'],
            user_id=user_id,
            language="zh-TW" if i != 5 else "en-US"
        )

        # 顯示回應
        print(f"\n客服機器人: {response['answer']}")
        print(f"\n📊 分析資訊:")
        print(f"  類別: {response['category']}")
        print(f"  信心度: {response['confidence']:.2%}")
        print(f"  情緒: {response['sentiment']}")
        print(f"  需要升級: {'是' if response['needs_escalation'] else '否'}")

    # 顯示對話歷史
    print(f"\n{'-' * 60}")
    print("📜 對話歷史")
    print(f"{'-' * 60}")
    history = bot.get_conversation_history(user_id)
    print(f"共 {len(history)} 條訊息")

    # 顯示最後一輪對話
    if len(history) >= 2:
        print(f"\n最後一輪對話:")
        print(f"  用戶: {history[-2]['content']}")
        print(f"  助手: {history[-1]['content'][:100]}...")

    # 展示向量搜索功能
    print(f"\n{'-' * 60}")
    print("🔍 向量搜索測試")
    print(f"{'-' * 60}")

    test_queries = [
        "我的包裹在哪裡？",
        "訂單還沒到",
        "追蹤物流"
    ]

    for query in test_queries:
        answer, confidence = bot._search_faq(query)
        if answer:
            print(f"\n查詢: {query}")
            print(f"  信心度: {confidence:.2%}")
            print(f"  答案: {answer[:100]}...")

    # 展示工具調用功能
    print(f"\n{'-' * 60}")
    print("🛠️ AI工具調用示例")
    print(f"{'-' * 60}")

    # 直接測試工具函數
    print("\n1. 訂單狀態查詢:")
    order_status = bot._search_order_status("ORD123456")
    print(json.dumps(order_status, indent=2, ensure_ascii=False))

    print("\n2. 產品庫存查詢:")
    product_info = bot._check_product_availability("PROD999")
    print(json.dumps(product_info, indent=2, ensure_ascii=False))

    print("\n3. 退款發起:")
    refund_info = bot._initiate_refund("ORD123456", "商品瑕疵")
    print(json.dumps(refund_info, indent=2, ensure_ascii=False))

    # 清除對話歷史
    print(f"\n{'-' * 60}")
    print("🗑️ 清除對話歷史")
    print(f"{'-' * 60}")
    bot.clear_conversation_history(user_id)
    print("✓ 對話歷史已清除")

    history_after = bot.get_conversation_history(user_id)
    print(f"清除後的訊息數: {len(history_after)}")

    print(f"\n{'-' * 60}")
    print("✅ 示例運行完成！")
    print(f"{'-' * 60}")


if __name__ == "__main__":
    main()
