#!/usr/bin/env python3
"""
客戶服務機器人 CLI 範例
展示如何使用 CustomerSupportBot 處理客戶查詢
"""

import os
from support_bot import CustomerSupportBot

def demo_customer_service():
    """演示客戶服務機器人功能"""
    print("=" * 60)
    print("客戶服務聊天機器人範例")
    print("=" * 60)
    print()

    # 檢查 API 金鑰
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ 錯誤: 請設定 OPENAI_API_KEY 環境變數")
        print("提示: 複製 .env.example 為 .env 並填入你的 API 金鑰")
        return

    # 初始化機器人
    print("✓ 正在初始化客戶服務機器人...")
    bot = CustomerSupportBot(
        knowledge_base_path="data/faq.json",
        escalation_threshold=0.3  # 調整升級門檻
    )
    print("✓ 機器人已就緒\n")

    # 測試場景
    test_scenarios = [
        {
            "user_id": "customer_001",
            "query": "你好！我想知道如何追蹤我的訂單？",
            "description": "常見問題查詢 - FAQ 匹配"
        },
        {
            "user_id": "customer_002",
            "query": "我的商品收到時已經損壞了，非常不滿意！",
            "description": "負面情緒 - 應該升級到人工客服"
        },
        {
            "user_id": "customer_003",
            "query": "請問你們有賣外星人科技產品嗎？",
            "description": "不相關問題 - 低信心度回應"
        },
        {
            "user_id": "customer_004",
            "query": "可以開三聯式發票嗎？需要統編",
            "description": "發票相關問題 - FAQ 匹配"
        },
        {
            "user_id": "customer_005",
            "query": "我想修改訂單的配送地址",
            "description": "訂單修改 - FAQ 匹配"
        }
    ]

    print("開始測試客戶服務場景...\n")
    print("=" * 60)

    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n[場景 {i}] {scenario['description']}")
        print("-" * 60)
        print(f"客戶 ({scenario['user_id']}): {scenario['query']}")
        print()

        # 處理查詢
        result = bot.handle_query(
            message=scenario['query'],
            user_id=scenario['user_id']
        )

        # 顯示回應
        print(f"客服機器人: {result['answer']}")
        print()
        print(f"📊 分析結果:")
        print(f"   • 問題分類: {result['category']}")
        print(f"   • 信心度: {result['confidence']:.2%}")
        print(f"   • 情緒分析: {result['sentiment']}")
        print(f"   • 需要升級: {'是' if result['needs_escalation'] else '否'}")

        if result['needs_escalation']:
            print(f"   ⚠️  建議轉接人工客服")

        print("=" * 60)

    # 顯示統計
    print("\n📈 對話統計:")
    history = bot.get_conversation_history()
    print(f"   總對話數: {len(history)}")

    # 按類別統計
    categories = {}
    for entry in history:
        cat = entry['category']
        categories[cat] = categories.get(cat, 0) + 1

    print(f"\n   問題分類分佈:")
    for category, count in categories.items():
        print(f"      • {category}: {count}")

    # 創建工單範例
    print("\n" + "=" * 60)
    print("創建客服工單範例")
    print("-" * 60)

    ticket_id = bot.create_ticket(
        user_id="customer_002",
        subject="商品損壞投訴",
        description="客戶收到的商品在運送過程中損壞",
        priority="high"
    )

    print(f"✓ 工單已創建: {ticket_id}")
    print(f"   用戶: customer_002")
    print(f"   主題: 商品損壞投訴")
    print(f"   優先級: high")


def interactive_mode():
    """互動模式"""
    print("\n" + "=" * 60)
    print("互動模式 - 輸入 'quit' 結束對話")
    print("=" * 60)
    print()

    # 檢查 API 金鑰
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ 錯誤: 請設定 OPENAI_API_KEY 環境變數")
        return

    bot = CustomerSupportBot(knowledge_base_path="data/faq.json")
    user_id = "interactive_user"

    print("客服機器人已就緒！請輸入您的問題：\n")

    while True:
        try:
            query = input("客戶: ").strip()

            if not query:
                continue

            if query.lower() in ['quit', 'exit', 'bye']:
                print("\n感謝使用！再見！")
                break

            # 處理查詢
            result = bot.handle_query(query, user_id)

            print(f"\n客服: {result['answer']}")
            print(f"[{result['category']} | {result['sentiment']}]")

            if result['needs_escalation']:
                print("⚠️  正在轉接人工客服...")

            print()

        except KeyboardInterrupt:
            print("\n\n感謝使用！再見！")
            break
        except Exception as e:
            print(f"錯誤: {e}\n")


def main():
    """主函數"""
    # 執行演示
    demo_customer_service()

    # 可選：執行互動模式
    # 取消註解以下行來啟用互動模式
    # interactive_mode()


if __name__ == "__main__":
    main()
