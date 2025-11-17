#!/usr/bin/env python3
"""
RAG 聊天機器人使用範例
展示如何建立索引和使用 RAG 系統
"""

import os
from pathlib import Path
from rag_bot import RAGChatbot

def check_documents():
    """檢查文檔目錄"""
    docs_dir = Path("./documents")
    if not docs_dir.exists():
        print("❌ 找不到 documents 目錄")
        print("   請先創建 documents 目錄並放入文檔")
        return False

    docs = list(docs_dir.glob("*.txt")) + list(docs_dir.glob("*.md"))
    if not docs:
        print("❌ documents 目錄中沒有文檔")
        print("   請放入一些 .txt 或 .md 文件")
        return False

    print(f"✓ 找到 {len(docs)} 個文檔:")
    for doc in docs:
        print(f"  - {doc.name}")
    return True


def build_index_example():
    """建立索引範例"""
    print("=" * 60)
    print("RAG 索引建立範例")
    print("=" * 60)
    print()

    # 檢查 API 金鑰
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ 錯誤: 請設定 OPENAI_API_KEY 環境變數")
        return None

    # 檢查文檔
    if not check_documents():
        return None

    print("\n正在初始化 RAG 系統...")
    bot = RAGChatbot(
        vector_db_path="./vector_db",
        chunk_size=500,
        chunk_overlap=50
    )

    # 檢查是否已有索引
    stats = bot.get_stats()
    if stats['total_chunks'] > 0:
        print(f"\n✓ 已載入現有索引：{stats['total_chunks']} 個文檔片段")
        choice = input("\n是否重新建立索引？(y/n): ").strip().lower()
        if choice != 'y':
            return bot

    # 建立索引
    print("\n開始建立索引...")
    docs_dir = Path("./documents")

    for doc_path in docs_dir.glob("*.txt"):
        print(f"\n處理: {doc_path.name}")
        bot.add_document(str(doc_path), {"type": "txt"})

    for doc_path in docs_dir.glob("*.md"):
        print(f"\n處理: {doc_path.name}")
        bot.add_document(str(doc_path), {"type": "markdown"})

    print("\n" + "=" * 60)
    print("索引建立完成！")

    stats = bot.get_stats()
    print(f"文檔數量: {stats['total_documents']}")
    print(f"文檔片段: {stats['total_chunks']}")

    return bot


def search_example(bot):
    """語義搜尋範例"""
    print("\n" + "=" * 60)
    print("語義搜尋範例")
    print("=" * 60)
    print()

    test_queries = [
        "如何安裝系統？",
        "保固期限是多久？",
        "退貨政策是什麼？"
    ]

    for query in test_queries:
        print(f"查詢: {query}")
        results = bot.similarity_search(query, k=2)

        if results:
            print("\n相關文檔片段:")
            for i, (chunk, metadata, score) in enumerate(results, 1):
                print(f"\n  [{i}] 相關度: {score:.3f}")
                print(f"  來源: {metadata.get('source', 'N/A')}")
                print(f"  內容預覽: {chunk[:150]}...")
        else:
            print("  未找到相關文檔\n")

        print("-" * 60)


def qa_example(bot):
    """問答範例"""
    print("\n" + "=" * 60)
    print("RAG 問答範例")
    print("=" * 60)
    print()

    test_questions = [
        "Smart Home 系統支援哪些語音助手？",
        "如果產品故障了，保固範圍包含什麼？",
        "退貨需要在多少天內？",
        "會員有什麼福利？",
        "如何重設主控台？"
    ]

    for question in test_questions:
        print(f"問題: {question}")
        print()

        result = bot.query(question, top_k=3, include_sources=True)

        print(f"回答: {result['answer']}")
        print(f"\n信心度: {result['confidence']:.2%}")

        if result.get('sources'):
            print("\n參考來源:")
            for i, source in enumerate(result['sources'], 1):
                print(f"  [{i}] {Path(source['source']).name} "
                      f"(相關度: {source['relevance_score']:.3f})")

        print("\n" + "=" * 60 + "\n")


def interactive_mode(bot):
    """互動模式"""
    print("\n" + "=" * 60)
    print("RAG 互動問答模式")
    print("輸入問題開始查詢，輸入 'quit' 結束")
    print("輸入 'stats' 查看統計資訊")
    print("=" * 60)
    print()

    while True:
        try:
            question = input("問題: ").strip()

            if not question:
                continue

            if question.lower() in ['quit', 'exit']:
                print("\n再見！")
                break

            if question.lower() == 'stats':
                stats = bot.get_stats()
                print(f"\n統計資訊:")
                print(f"  文檔數: {stats['total_documents']}")
                print(f"  片段數: {stats['total_chunks']}")
                print(f"  來源: {', '.join([Path(s).name for s in stats['sources']])}")
                print()
                continue

            # 查詢
            result = bot.query(question, top_k=3)

            print(f"\n回答: {result['answer']}")
            print(f"信心度: {result['confidence']:.2%}\n")

            # 詢問是否顯示來源
            if result.get('sources'):
                show_sources = input("顯示來源？(y/n): ").strip().lower()
                if show_sources == 'y':
                    print("\n來源:")
                    for i, source in enumerate(result['sources'], 1):
                        print(f"  {i}. {Path(source['source']).name}")
                    print()

        except KeyboardInterrupt:
            print("\n\n再見！")
            break
        except Exception as e:
            print(f"錯誤: {e}\n")


def main():
    """主函數"""
    print("\n" + "=" * 60)
    print("RAG (檢索增強生成) 聊天機器人範例")
    print("=" * 60)
    print()

    # 1. 建立索引
    bot = build_index_example()
    if bot is None:
        print("\n索引建立失敗，程式結束")
        return

    # 2. 語義搜尋範例
    search_example(bot)

    # 3. 問答範例
    qa_example(bot)

    # 4. 互動模式（可選）
    choice = input("\n是否進入互動模式？(y/n): ").strip().lower()
    if choice == 'y':
        interactive_mode(bot)


if __name__ == "__main__":
    main()
