#!/usr/bin/env python3
"""
基礎聊天機器人使用範例
展示如何使用 Chatbot 類進行基本對話
"""

import os
from chatbot import Chatbot
from utils import print_colored

def basic_chat_example():
    """基本對話範例"""
    print_colored("=== 基礎聊天機器人範例 ===", "green")
    print_colored("這個範例展示如何使用 Chatbot 類進行簡單對話\n", "blue")

    # 檢查 API 金鑰
    if not os.getenv("OPENAI_API_KEY"):
        print_colored("錯誤：請設定 OPENAI_API_KEY 環境變數", "red")
        print_colored("你可以複製 .env.example 為 .env 並填入你的 API 金鑰", "yellow")
        return

    # 初始化聊天機器人
    try:
        bot = Chatbot(
            provider="openai",
            model="gpt-3.5-turbo",
            system_prompt="你是一個友善、專業的 AI 助手，專門協助程式設計相關問題。",
            temperature=0.7
        )
        print_colored("✓ 聊天機器人已初始化\n", "green")
    except Exception as e:
        print_colored(f"初始化錯誤: {e}", "red")
        return

    # 範例對話列表
    example_questions = [
        "你好！請簡單介紹一下你自己。",
        "Python 和 JavaScript 的主要差異是什麼？",
        "如何學習機器學習？給我 3 個建議。"
    ]

    print_colored("開始範例對話...\n", "blue")

    for i, question in enumerate(example_questions, 1):
        print_colored(f"[問題 {i}]", "yellow")
        print(f"使用者: {question}\n")

        # 獲取回應
        response = bot.chat(question)

        print_colored("AI 助手:", "blue")
        print(f"{response}\n")
        print("-" * 60 + "\n")

    # 顯示對話歷史
    print_colored("=== 對話歷史 ===", "green")
    history = bot.get_history()
    print(f"共 {len(history)} 條訊息（包含系統提示）\n")

    # 儲存對話
    filename = "example_conversation.json"
    bot.save_history(filename)
    print_colored(f"✓ 對話已儲存至 {filename}", "green")


def streaming_example():
    """串流回應範例"""
    print_colored("\n=== 串流回應範例 ===", "green")
    print_colored("這個範例展示如何使用串流模式獲取即時回應\n", "blue")

    # 檢查 API 金鑰
    if not os.getenv("OPENAI_API_KEY"):
        print_colored("錯誤：請設定 OPENAI_API_KEY 環境變數", "red")
        return

    try:
        bot = Chatbot(
            provider="openai",
            model="gpt-3.5-turbo",
            temperature=0.7
        )

        question = "請用三句話解釋什麼是 Docker 容器化技術。"
        print(f"使用者: {question}\n")
        print_colored("AI 助手 (串流模式): ", "blue", end="")

        # 串流回應
        for chunk in bot.chat_stream(question):
            print(chunk, end="", flush=True)

        print("\n")

    except Exception as e:
        print_colored(f"錯誤: {e}", "red")


def ollama_example():
    """使用本地 Ollama 模型範例"""
    print_colored("\n=== Ollama 本地模型範例 ===", "green")
    print_colored("這個範例展示如何使用本地 Ollama 模型\n", "blue")
    print_colored("注意：需要先安裝並啟動 Ollama (https://ollama.ai)\n", "yellow")

    try:
        bot = Chatbot(
            provider="ollama",
            model="llama2",
            system_prompt="你是一個友善的 AI 助手。",
            temperature=0.7
        )

        question = "Hello! What can you help me with?"
        print(f"使用者: {question}\n")

        response = bot.chat(question)
        print_colored("AI 助手:", "blue")
        print(f"{response}\n")

    except Exception as e:
        print_colored(f"錯誤: {e}", "red")
        print_colored("請確保 Ollama 已安裝並運行", "yellow")


def main():
    """主函數"""
    # 執行基本對話範例
    basic_chat_example()

    # 執行串流範例
    streaming_example()

    # 執行 Ollama 範例（可選）
    # 取消註解以下行來測試 Ollama
    # ollama_example()


if __name__ == "__main__":
    main()
