"""
Build Index - 建立 RAG 向量索引
掃描 documents 目錄並建立向量資料庫
"""

import os
from pathlib import Path
from rag_bot import RAGChatbot


def build_index(documents_dir: str = "./documents"):
    """
    建立向量索引

    Args:
        documents_dir: 文檔目錄路徑
    """
    print("=== RAG 索引建立工具 ===\n")

    # 初始化機器人
    bot = RAGChatbot()

    # 掃描文檔目錄
    docs_path = Path(documents_dir)

    if not docs_path.exists():
        print(f"錯誤: 找不到目錄 {documents_dir}")
        print("請建立目錄並放入文檔")
        return

    # 支援的檔案格式
    supported_extensions = {'.txt', '.md', '.pdf'}

    # 找出所有文檔
    documents = []
    for ext in supported_extensions:
        documents.extend(docs_path.glob(f"**/*{ext}"))

    if not documents:
        print(f"在 {documents_dir} 中找不到任何文檔")
        print(f"支援的格式: {', '.join(supported_extensions)}")
        return

    print(f"找到 {len(documents)} 個文檔:\n")
    for doc in documents:
        print(f"  - {doc.name}")

    print("\n開始建立索引...\n")

    # 處理每個文檔
    for i, doc_path in enumerate(documents, 1):
        print(f"[{i}/{len(documents)}] 處理: {doc_path.name}")

        try:
            # 添加文檔
            metadata = {
                'filename': doc_path.name,
                'file_type': doc_path.suffix,
                'file_size': doc_path.stat().st_size
            }

            bot.add_document(str(doc_path), metadata)
            print(f"  ✓ 完成\n")

        except Exception as e:
            print(f"  ✗ 錯誤: {e}\n")

    # 顯示統計
    stats = bot.get_stats()
    print("\n" + "=" * 50)
    print("索引建立完成！")
    print("=" * 50)
    print(f"文檔數量: {stats['total_documents']}")
    print(f"文檔片段: {stats['total_chunks']}")
    print(f"\n現在可以執行 python rag_bot.py 開始使用")


if __name__ == "__main__":
    build_index()
