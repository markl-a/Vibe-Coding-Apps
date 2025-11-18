"""
RAG Chatbot - 檢索增強生成聊天機器人
使用向量資料庫和語義搜尋提供基於文檔的精確回答
增強版：支援多模態、智能分塊、重排序和混合搜索
"""

import os
from typing import List, Dict, Optional, Tuple, Any
from pathlib import Path
import openai
from dotenv import load_dotenv
import re

try:
    import faiss
    import numpy as np
    FAISS_AVAILABLE = True
except ImportError:
    print("警告: FAISS 未安裝，將使用簡化版向量搜尋")
    FAISS_AVAILABLE = False
    import numpy as np

# 可選的PDF處理
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("提示：安裝 PyPDF2 以支援PDF文檔")

# 可選的文檔處理
try:
    from docx import Document as DocxDocument
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("提示：安裝 python-docx 以支援Word文檔")

load_dotenv()


class RAGChatbot:
    """基於 RAG 的聊天機器人"""

    def __init__(
        self,
        vector_db_path: str = "./vector_db",
        model: str = "gpt-4o-mini",
        chunk_size: int = 800,
        chunk_overlap: int = 100,
        api_key: Optional[str] = None,
        chunk_strategy: str = "semantic",  # "semantic" 或 "fixed"
        enable_reranking: bool = True,
        enable_hybrid_search: bool = True
    ):
        """
        初始化 RAG 聊天機器人

        Args:
            vector_db_path: 向量資料庫路徑
            model: OpenAI 模型名稱
            chunk_size: 文檔分塊大小
            chunk_overlap: 分塊重疊大小
            api_key: OpenAI API 金鑰
            chunk_strategy: 分塊策略 ("semantic" 或 "fixed")
            enable_reranking: 是否啟用重排序
            enable_hybrid_search: 是否啟用混合搜索
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = openai.OpenAI(api_key=self.api_key)

        self.model = model
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.chunk_strategy = chunk_strategy
        self.enable_reranking = enable_reranking
        self.enable_hybrid_search = enable_hybrid_search
        self.vector_db_path = Path(vector_db_path)

        # 文檔儲存
        self.documents = []  # List of (chunk_text, metadata, embedding)
        self.document_embeddings = None
        self.index = None

        # 載入現有索引
        self._load_index()

    def _load_index(self):
        """載入向量索引"""
        if self.vector_db_path.exists():
            try:
                # 載入文檔
                import pickle
                docs_file = self.vector_db_path / "documents.pkl"
                if docs_file.exists():
                    with open(docs_file, 'rb') as f:
                        self.documents = pickle.load(f)

                # 載入 FAISS 索引
                if faiss:
                    index_file = self.vector_db_path / "index.faiss"
                    if index_file.exists():
                        self.index = faiss.read_index(str(index_file))
                        print(f"已載入索引：{len(self.documents)} 個文檔片段")
            except Exception as e:
                print(f"載入索引錯誤: {e}")

    def _save_index(self):
        """儲存向量索引"""
        self.vector_db_path.mkdir(parents=True, exist_ok=True)

        # 儲存文檔
        import pickle
        docs_file = self.vector_db_path / "documents.pkl"
        with open(docs_file, 'wb') as f:
            pickle.dump(self.documents, f)

        # 儲存 FAISS 索引
        if faiss and self.index:
            index_file = self.vector_db_path / "index.faiss"
            faiss.write_index(self.index, str(index_file))

        print(f"索引已儲存：{len(self.documents)} 個文檔片段")

    def _get_embedding(self, text: str) -> np.ndarray:
        """取得文本嵌入向量"""
        try:
            response = openai.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return np.array(response.data[0].embedding, dtype='float32')
        except Exception as e:
            print(f"嵌入生成錯誤: {e}")
            # 返回隨機向量作為後備方案
            return np.random.randn(1536).astype('float32')

    def _chunk_text(self, text: str) -> List[str]:
        """將文本分塊（根據策略選擇）"""
        if self.chunk_strategy == "semantic":
            return self._semantic_chunk(text)
        else:
            return self._fixed_chunk(text)

    def _fixed_chunk(self, text: str) -> List[str]:
        """固定大小分塊"""
        chunks = []
        text_length = len(text)

        start = 0
        while start < text_length:
            end = start + self.chunk_size
            chunk = text[start:end]

            # 嘗試在句子邊界分割
            if end < text_length:
                # 尋找最近的句號、問號或驚嘆號
                for i in range(len(chunk) - 1, max(0, len(chunk) - 100), -1):
                    if chunk[i] in '.!?。！？':
                        chunk = chunk[:i + 1]
                        end = start + i + 1
                        break

            chunks.append(chunk.strip())
            start = end - self.chunk_overlap

        return chunks

    def _semantic_chunk(self, text: str) -> List[str]:
        """語義分塊（基於段落和主題）"""
        # 首先按段落分割
        paragraphs = re.split(r'\n\s*\n', text)

        chunks = []
        current_chunk = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # 如果添加這個段落不會超過大小限制
            if len(current_chunk) + len(para) + 2 <= self.chunk_size:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para
            else:
                # 保存當前chunk
                if current_chunk:
                    chunks.append(current_chunk)

                # 如果段落本身太大，再分割
                if len(para) > self.chunk_size:
                    # 按句子分割
                    sentences = re.split(r'([.!?。！？]+)', para)
                    current_chunk = ""

                    for i in range(0, len(sentences), 2):
                        sentence = sentences[i]
                        if i + 1 < len(sentences):
                            sentence += sentences[i + 1]

                        if len(current_chunk) + len(sentence) <= self.chunk_size:
                            current_chunk += sentence
                        else:
                            if current_chunk:
                                chunks.append(current_chunk.strip())
                            current_chunk = sentence
                else:
                    current_chunk = para

        # 添加最後一個chunk
        if current_chunk:
            chunks.append(current_chunk.strip())

        return [c for c in chunks if c]  # 過濾空chunk

    def add_document(self, file_path: str, metadata: Optional[Dict] = None):
        """
        添加文檔到向量資料庫

        Args:
            file_path: 文檔路徑
            metadata: 文檔元資料
        """
        print(f"處理文檔: {file_path}")

        # 讀取文檔內容
        text = self._load_document(file_path)

        if not text:
            print(f"警告: 無法讀取文檔 {file_path}")
            return

        # 分塊
        chunks = self._chunk_text(text)
        print(f"分割為 {len(chunks)} 個片段")

        # 生成元資料
        if metadata is None:
            metadata = {}
        metadata['source'] = file_path
        metadata['total_chunks'] = len(chunks)

        # 為每個分塊生成嵌入並儲存
        for i, chunk in enumerate(chunks):
            chunk_metadata = metadata.copy()
            chunk_metadata['chunk_id'] = i

            embedding = self._get_embedding(chunk)
            self.documents.append((chunk, chunk_metadata, embedding))

        # 重建索引
        self._rebuild_index()
        self._save_index()

        print(f"文檔已添加: {len(chunks)} 個片段")

    def _load_document(self, file_path: str) -> str:
        """載入文檔內容（支援多種格式）"""
        path = Path(file_path)

        try:
            if path.suffix == '.txt':
                with open(path, 'r', encoding='utf-8') as f:
                    return f.read()

            elif path.suffix in ['.md', '.markdown']:
                with open(path, 'r', encoding='utf-8') as f:
                    return f.read()

            elif path.suffix == '.pdf':
                if not PDF_AVAILABLE:
                    print("請安裝 PyPDF2: pip install PyPDF2")
                    return ""
                try:
                    with open(path, 'rb') as f:
                        reader = PyPDF2.PdfReader(f)
                        text = ""
                        for page in reader.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text += page_text + "\n\n"
                        return text
                except Exception as e:
                    print(f"PDF讀取錯誤: {e}")
                    return ""

            elif path.suffix in ['.docx', '.doc']:
                if not DOCX_AVAILABLE:
                    print("請安裝 python-docx: pip install python-docx")
                    return ""
                try:
                    doc = DocxDocument(path)
                    text = "\n\n".join([para.text for para in doc.paragraphs if para.text.strip()])
                    return text
                except Exception as e:
                    print(f"DOCX讀取錯誤: {e}")
                    return ""

            else:
                print(f"不支援的檔案格式: {path.suffix}")
                print("支援的格式: .txt, .md, .pdf, .docx")
                return ""

        except Exception as e:
            print(f"讀取文檔錯誤: {e}")
            return ""

    def _rebuild_index(self):
        """重建 FAISS 索引"""
        if not self.documents:
            return

        # 提取所有嵌入向量
        embeddings = np.array([doc[2] for doc in self.documents])

        if FAISS_AVAILABLE and faiss:
            # 使用 FAISS
            dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
            self.index.add(embeddings)
        else:
            # 簡化版：儲存為 numpy 陣列
            self.document_embeddings = embeddings

    def similarity_search(
        self,
        query: str,
        k: int = 3,
        metadata_filter: Optional[Dict] = None
    ) -> List[Tuple[str, Dict, float]]:
        """
        語義搜尋相關文檔（支援混合搜索和重排序）

        Args:
            query: 查詢文本
            k: 返回前 k 個結果
            metadata_filter: 元資料過濾條件

        Returns:
            [(chunk_text, metadata, score), ...]
        """
        if not self.documents:
            return []

        # 使用混合搜索
        if self.enable_hybrid_search:
            results = self._hybrid_search(query, k * 2, metadata_filter)
        else:
            results = self._vector_search(query, k * 2, metadata_filter)

        # 使用重排序
        if self.enable_reranking and len(results) > k:
            results = self._rerank(query, results)

        return results[:k]

    def _vector_search(
        self,
        query: str,
        k: int,
        metadata_filter: Optional[Dict] = None
    ) -> List[Tuple[str, Dict, float]]:
        """向量搜索"""
        query_embedding = self._get_embedding(query)

        if FAISS_AVAILABLE and faiss and self.index:
            # 使用 FAISS 搜尋
            query_vec = query_embedding.reshape(1, -1)
            distances, indices = self.index.search(query_vec, min(k, len(self.documents)))

            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx < len(self.documents):
                    chunk, metadata, _ = self.documents[idx]

                    # 應用元資料過濾
                    if metadata_filter:
                        if not all(metadata.get(k) == v for k, v in metadata_filter.items()):
                            continue

                    # 轉換距離為相似度分數
                    score = 1 / (1 + dist)
                    results.append((chunk, metadata, score))

            return results

        else:
            # 簡化版：計算餘弦相似度
            similarities = []
            for chunk, metadata, embedding in self.documents:
                # 餘弦相似度
                similarity = np.dot(query_embedding, embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(embedding)
                )
                similarities.append((chunk, metadata, float(similarity)))

            # 排序並返回 top k
            similarities.sort(key=lambda x: x[2], reverse=True)

            # 應用元資料過濾
            if metadata_filter:
                similarities = [
                    (chunk, meta, score)
                    for chunk, meta, score in similarities
                    if all(meta.get(k) == v for k, v in metadata_filter.items())
                ]

            return similarities[:k]

    def _keyword_search(self, query: str, k: int) -> List[Tuple[str, Dict, float]]:
        """關鍵字搜索（BM25風格）"""
        query_terms = set(query.lower().split())
        scores = []

        for chunk, metadata, _ in self.documents:
            chunk_terms = set(chunk.lower().split())
            # 計算重疊詞數
            overlap = len(query_terms & chunk_terms)
            # 簡化的BM25分數
            score = overlap / (len(query_terms) + 1)
            scores.append((chunk, metadata, score))

        scores.sort(key=lambda x: x[2], reverse=True)
        return scores[:k]

    def _hybrid_search(
        self,
        query: str,
        k: int,
        metadata_filter: Optional[Dict] = None
    ) -> List[Tuple[str, Dict, float]]:
        """混合搜索（向量 + 關鍵字）"""
        # 獲取向量搜索結果
        vector_results = self._vector_search(query, k, metadata_filter)

        # 獲取關鍵字搜索結果
        keyword_results = self._keyword_search(query, k)

        # 合併結果（RRF - Reciprocal Rank Fusion）
        scores_dict = {}

        # 向量搜索權重
        for rank, (chunk, metadata, score) in enumerate(vector_results):
            key = chunk[:100]  # 使用chunk前100字符作為key
            scores_dict[key] = {
                'chunk': chunk,
                'metadata': metadata,
                'score': 1 / (rank + 60)  # RRF score
            }

        # 關鍵字搜索權重
        for rank, (chunk, metadata, score) in enumerate(keyword_results):
            key = chunk[:100]
            if key in scores_dict:
                scores_dict[key]['score'] += 1 / (rank + 60)
            else:
                scores_dict[key] = {
                    'chunk': chunk,
                    'metadata': metadata,
                    'score': 1 / (rank + 60)
                }

        # 排序合併結果
        merged = [(v['chunk'], v['metadata'], v['score']) for v in scores_dict.values()]
        merged.sort(key=lambda x: x[2], reverse=True)

        return merged[:k]

    def _rerank(
        self,
        query: str,
        candidates: List[Tuple[str, Dict, float]]
    ) -> List[Tuple[str, Dict, float]]:
        """使用AI重排序結果"""
        if len(candidates) <= 1:
            return candidates

        try:
            # 準備候選文本
            docs_text = "\n\n---\n\n".join([
                f"[文檔{i}]\n{chunk}"
                for i, (chunk, _, _) in enumerate(candidates)
            ])

            # 使用AI評估相關性
            prompt = f"""評估以下文檔與查詢的相關性，給每個文檔打分（0-10）。

查詢：{query}

文檔：
{docs_text}

請以JSON格式返回分數，格式：{{"0": 分數, "1": 分數, ...}}"""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0
            )

            result = response.choices[0].message.content
            import json
            # 嘗試解析JSON
            scores = json.loads(result)

            # 更新分數
            reranked = []
            for i, (chunk, metadata, _) in enumerate(candidates):
                new_score = float(scores.get(str(i), 0)) / 10.0
                reranked.append((chunk, metadata, new_score))

            # 重新排序
            reranked.sort(key=lambda x: x[2], reverse=True)
            return reranked

        except Exception as e:
            print(f"重排序錯誤: {e}")
            # 降級返回原始結果
            return candidates

    def query(
        self,
        question: str,
        top_k: int = 3,
        include_sources: bool = True
    ) -> Dict:
        """
        查詢並生成回答

        Args:
            question: 用戶問題
            top_k: 檢索文檔數量
            include_sources: 是否包含來源資訊

        Returns:
            包含答案和來源的字典
        """
        # 檢索相關文檔
        results = self.similarity_search(question, k=top_k)

        if not results:
            return {
                "answer": "抱歉，我在資料庫中找不到相關資訊。請嘗試換個方式提問。",
                "sources": [],
                "confidence": 0.0
            }

        # 建構上下文
        context_parts = []
        sources = []

        for i, (chunk, metadata, score) in enumerate(results):
            context_parts.append(f"[文檔 {i+1}]\n{chunk}\n")
            sources.append({
                "source": metadata.get('source', 'Unknown'),
                "chunk_id": metadata.get('chunk_id', 0),
                "relevance_score": score
            })

        context = "\n".join(context_parts)

        # 生成回答
        answer = self._generate_answer(question, context)

        # 計算平均信心度
        avg_confidence = sum(s['relevance_score'] for s in sources) / len(sources)

        result = {
            "answer": answer,
            "confidence": avg_confidence
        }

        if include_sources:
            result["sources"] = sources

        return result

    def _generate_answer(self, question: str, context: str) -> str:
        """基於上下文生成回答"""
        try:
            system_prompt = """你是一個專業的問答助手。
請基於提供的文檔內容回答問題。
如果文檔中沒有相關資訊，請明確告知用戶。
回答要準確、簡潔且有幫助。"""

            user_prompt = f"""
參考文檔：
{context}

問題：{question}

請基於以上文檔內容回答問題。如果文檔中沒有相關資訊，請說明。
"""

            response = openai.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"回答生成錯誤: {e}")
            return "抱歉，生成回答時發生錯誤。"

    def get_stats(self) -> Dict:
        """取得統計資訊"""
        unique_sources = set(
            doc[1].get('source', 'Unknown')
            for doc in self.documents
        )

        return {
            "total_chunks": len(self.documents),
            "total_documents": len(unique_sources),
            "sources": list(unique_sources)
        }


def main():
    """命令列測試"""
    print("=== RAG 聊天機器人 ===")
    print("輸入 'quit' 結束對話")
    print("輸入 'stats' 查看統計\n")

    bot = RAGChatbot()

    # 顯示統計
    stats = bot.get_stats()
    print(f"已載入 {stats['total_documents']} 個文檔，"
          f"共 {stats['total_chunks']} 個片段\n")

    if stats['total_chunks'] == 0:
        print("提示：請先使用 build_index.py 建立索引\n")

    while True:
        try:
            question = input("問題: ").strip()

            if question.lower() == 'quit':
                print("再見！")
                break

            if question.lower() == 'stats':
                stats = bot.get_stats()
                print(f"\n統計資訊:")
                print(f"  文檔數: {stats['total_documents']}")
                print(f"  片段數: {stats['total_chunks']}")
                print(f"  來源: {', '.join(stats['sources'])}\n")
                continue

            if not question:
                continue

            # 查詢
            result = bot.query(question, top_k=3)

            print(f"\n回答: {result['answer']}")
            print(f"信心度: {result['confidence']:.2f}")

            if result.get('sources'):
                print("\n來源:")
                for i, source in enumerate(result['sources'], 1):
                    print(f"  {i}. {source['source']} "
                          f"(相關度: {source['relevance_score']:.2f})")

            print()

        except KeyboardInterrupt:
            print("\n\n再見！")
            break
        except Exception as e:
            print(f"錯誤: {e}\n")


if __name__ == "__main__":
    main()
