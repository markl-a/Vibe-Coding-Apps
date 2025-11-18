"""
Enhanced RAG Chatbot Example
展示語義分塊、混合搜索、重排序等進階功能
"""

from rag_bot import RAGChatbot
from pathlib import Path
import json


def main():
    print("=" * 70)
    print("增強版 RAG 聊天機器人示例")
    print("=" * 70)
    print()

    # 初始化機器人（啟用所有增強功能）
    print("初始化機器人...")
    bot = RAGChatbot(
        vector_db_path="./vector_db_enhanced",
        model="gpt-4o-mini",
        chunk_size=800,
        chunk_overlap=100,
        chunk_strategy="semantic",  # 使用語義分塊
        enable_reranking=True,  # 啟用AI重排序
        enable_hybrid_search=True  # 啟用混合搜索
    )
    print("✓ 機器人初始化完成")
    print(f"  分塊策略: semantic")
    print(f"  混合搜索: 啟用")
    print(f"  AI重排序: 啟用")
    print()

    # 檢查現有文檔
    stats = bot.get_stats()
    print(f"📊 當前狀態:")
    print(f"  文檔數: {stats['total_documents']}")
    print(f"  片段數: {stats['total_chunks']}")
    if stats['sources']:
        print(f"  來源: {', '.join(stats['sources'][:3])}")
    print()

    # 如果沒有文檔，添加示例文檔
    if stats['total_chunks'] == 0:
        print("=" * 70)
        print("📄 添加示例文檔")
        print("=" * 70)

        documents_dir = Path("documents")
        if documents_dir.exists():
            docs = list(documents_dir.glob("*"))
            for doc_path in docs[:3]:  # 只添加前3個文檔
                print(f"\n處理: {doc_path.name}")
                try:
                    bot.add_document(
                        str(doc_path),
                        metadata={"filename": doc_path.name}
                    )
                except Exception as e:
                    print(f"錯誤: {e}")

        # 更新統計
        stats = bot.get_stats()
        print(f"\n更新後的統計:")
        print(f"  文檔數: {stats['total_documents']}")
        print(f"  片段數: {stats['total_chunks']}")

    # 測試查詢
    print("\n" + "=" * 70)
    print("🔍 測試查詢")
    print("=" * 70)

    test_queries = [
        "產品保固政策是什麼？",
        "如何安裝和設置產品？",
        "公司的退貨流程如何進行？"
    ]

    for i, query in enumerate(test_queries, 1):
        print(f"\n{'-' * 70}")
        print(f"查詢 {i}: {query}")
        print(f"{'-' * 70}")

        # 執行查詢
        result = bot.query(
            question=query,
            top_k=3,
            include_sources=True
        )

        # 顯示結果
        print(f"\n✨ 回答:")
        print(result['answer'])
        print(f"\n📈 信心度: {result['confidence']:.2%}")

        if result.get('sources'):
            print(f"\n📚 來源文檔:")
            for j, source in enumerate(result['sources'], 1):
                print(f"  {j}. {source['source']}")
                print(f"     相關度: {source['relevance_score']:.2%}")

    # 測試不同搜索策略
    print("\n" + "=" * 70)
    print("🔬 比較搜索策略")
    print("=" * 70)

    test_query = "保固期限"

    # 1. 僅向量搜索
    print(f"\n查詢: {test_query}")
    print(f"\n1️⃣  向量搜索 (Vector Search):")
    bot.enable_hybrid_search = False
    bot.enable_reranking = False
    results = bot.similarity_search(test_query, k=3)
    for i, (chunk, meta, score) in enumerate(results, 1):
        print(f"  {i}. [{meta.get('source', 'Unknown')}] (分數: {score:.3f})")
        print(f"     {chunk[:100]}...")

    # 2. 混合搜索
    print(f"\n2️⃣  混合搜索 (Hybrid Search):")
    bot.enable_hybrid_search = True
    bot.enable_reranking = False
    results = bot.similarity_search(test_query, k=3)
    for i, (chunk, meta, score) in enumerate(results, 1):
        print(f"  {i}. [{meta.get('source', 'Unknown')}] (分數: {score:.3f})")
        print(f"     {chunk[:100]}...")

    # 3. 混合搜索 + 重排序
    print(f"\n3️⃣  混合搜索 + AI重排序:")
    bot.enable_hybrid_search = True
    bot.enable_reranking = True
    results = bot.similarity_search(test_query, k=3)
    for i, (chunk, meta, score) in enumerate(results, 1):
        print(f"  {i}. [{meta.get('source', 'Unknown')}] (分數: {score:.3f})")
        print(f"     {chunk[:100]}...")

    # 測試分塊策略
    print("\n" + "=" * 70)
    print("📐 分塊策略比較")
    print("=" * 70)

    sample_text = """
這是第一段文字。它討論產品的基本資訊。

這是第二段文字。它討論產品的技術規格。
規格包括尺寸、重量和材質。

這是第三段文字。它討論產品的使用方法。
使用方法非常簡單，只需按照說明操作即可。
""" * 3  # 重複3次以產生更長的文本

    print("\n固定大小分塊:")
    fixed_chunks = bot._fixed_chunk(sample_text)
    print(f"  片段數: {len(fixed_chunks)}")
    for i, chunk in enumerate(fixed_chunks[:2], 1):
        print(f"  片段{i}: {len(chunk)} 字符")

    print("\n語義分塊:")
    semantic_chunks = bot._semantic_chunk(sample_text)
    print(f"  片段數: {len(semantic_chunks)}")
    for i, chunk in enumerate(semantic_chunks[:2], 1):
        print(f"  片段{i}: {len(chunk)} 字符")

    # 性能建議
    print("\n" + "=" * 70)
    print("💡 優化建議")
    print("=" * 70)
    print("""
1. 文檔質量：
   - 確保文檔結構清晰，段落分明
   - 使用標題和子標題組織內容
   - 避免過長的段落

2. 分塊策略：
   - 技術文檔：使用語義分塊
   - 對話文本：使用固定分塊
   - 混合內容：測試後選擇

3. 搜索策略：
   - 專業術語搜索：混合搜索效果更好
   - 概念性問題：向量搜索即可
   - 關鍵字查詢：啟用重排序

4. 性能調優：
   - 調整chunk_size (500-1000)
   - 調整top_k (3-5)
   - 監控API使用量
    """)

    print("\n" + "=" * 70)
    print("✅ 示例運行完成！")
    print("=" * 70)


if __name__ == "__main__":
    main()
