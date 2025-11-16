# RAG Chatbot - 檢索增強生成聊天機器人

📚 基於 RAG (Retrieval-Augmented Generation) 技術的智能問答系統，能夠基於您的文檔資料庫提供精確回答

## 功能特點

- ✅ 文檔自動索引（PDF、TXT、Markdown、DOCX）
- ✅ 向量資料庫儲存（FAISS/ChromaDB）
- ✅ 語義搜尋
- ✅ 上下文感知回答
- ✅ 來源引用追蹤
- ✅ 多文檔支援
- ✅ 增量更新索引
- ✅ 自定義嵌入模型

## 什麼是 RAG？

RAG (Retrieval-Augmented Generation) 是一種結合資訊檢索和生成式 AI 的技術：

1. **檢索 (Retrieval)**: 從文檔庫中找出相關資訊
2. **增強 (Augmented)**: 將檢索到的資訊加入提示詞
3. **生成 (Generation)**: 基於檢索資訊生成準確回答

## 快速開始

### 安裝依賴

```bash
pip install -r requirements.txt
```

### 配置

```bash
cp .env.example .env
# 編輯 .env 設定 OpenAI API 金鑰
```

### 1. 索引文檔

```bash
# 將文檔放入 documents/ 目錄
cp your_docs.pdf documents/

# 建立索引
python build_index.py
```

### 2. 執行聊天機器人

```bash
# 命令列模式
python rag_bot.py

# Web UI 模式
streamlit run app.py
```

## 使用範例

```python
from rag_bot import RAGChatbot

# 初始化 RAG 聊天機器人
bot = RAGChatbot(
    vector_db_path="./vector_db",
    model="gpt-3.5-turbo",
    chunk_size=500,
    chunk_overlap=50
)

# 添加文檔
bot.add_document("path/to/document.pdf")

# 提問
response = bot.query(
    "什麼是機器學習？",
    top_k=3,  # 檢索前 3 個最相關片段
    include_sources=True
)

print(f"回答: {response['answer']}")
print(f"來源: {response['sources']}")
```

## 專案結構

```
rag-chatbot/
├── README.md              # 專案說明
├── requirements.txt       # 依賴套件
├── .env.example          # 環境變數範例
├── rag_bot.py            # RAG 機器人核心
├── app.py                # Streamlit UI
├── build_index.py        # 索引建立工具
├── document_loader.py    # 文檔載入器
├── vector_store.py       # 向量資料庫
├── documents/            # 待索引文檔
│   └── sample.pdf
└── vector_db/            # 向量資料庫儲存
```

## 核心概念

### 文檔分塊 (Chunking)

將長文檔分割成小片段，便於檢索：

```python
bot = RAGChatbot(
    chunk_size=500,      # 每塊 500 字元
    chunk_overlap=50     # 重疊 50 字元避免語義斷裂
)
```

### 嵌入 (Embedding)

將文本轉換為向量表示：

```python
# 使用 OpenAI 嵌入模型
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 或使用本地模型
from sentence_transformers import SentenceTransformer
embeddings = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
```

### 向量搜尋

基於語義相似度搜尋相關內容：

```python
# 檢索最相關的 5 個文檔片段
results = bot.similarity_search(query, k=5)
```

### 回答生成

結合檢索內容生成答案：

```python
prompt = f"""
基於以下內容回答問題：

{retrieved_context}

問題：{user_question}
"""
```

## 支援的文檔格式

- **PDF** - `.pdf`
- **Word** - `.docx`, `.doc`
- **文本** - `.txt`
- **Markdown** - `.md`
- **HTML** - `.html`
- **CSV** - `.csv`

## 進階功能

### 1. 自定義檢索策略

```python
# 混合檢索（關鍵字 + 語義）
bot.set_retrieval_mode("hybrid")

# 純語義檢索
bot.set_retrieval_mode("semantic")

# 純關鍵字檢索
bot.set_retrieval_mode("keyword")
```

### 2. 元資料過濾

```python
# 只搜尋特定類型的文檔
response = bot.query(
    "什麼是深度學習？",
    metadata_filter={"category": "機器學習", "year": 2023}
)
```

### 3. 批次索引

```python
# 批次處理多個文檔
documents = ["doc1.pdf", "doc2.pdf", "doc3.pdf"]
bot.add_documents_batch(documents, batch_size=10)
```

### 4. 增量更新

```python
# 只索引新文檔
bot.update_index(incremental=True)
```

## 效能優化

### 1. 選擇合適的分塊大小

- **小塊 (200-300)**: 精確度高，但可能遺失上下文
- **中塊 (500-800)**: 平衡精確度和上下文
- **大塊 (1000+)**: 保留完整上下文，但檢索準確度降低

### 2. 向量資料庫選擇

- **FAISS**: 快速、記憶體效率高，適合本地部署
- **ChromaDB**: 易用、支援持久化
- **Pinecone**: 雲端託管、可擴展性強

### 3. 快取策略

```python
# 快取常見問題的回答
bot.enable_cache(ttl=3600)  # 1小時過期
```

## 評估指標

### 檢索品質

```python
# 計算檢索準確率
metrics = bot.evaluate_retrieval(test_queries)
print(f"MRR: {metrics['mrr']}")  # Mean Reciprocal Rank
print(f"Recall@5: {metrics['recall_at_5']}")
```

### 回答品質

- **準確性**: 答案是否正確
- **相關性**: 是否回答了問題
- **來源可信度**: 引用來源是否準確

## 實際應用場景

1. **企業知識庫**: 員工查詢公司政策、流程
2. **技術文檔助手**: 開發者查詢 API 文檔
3. **學術研究**: 快速檢索論文內容
4. **法律諮詢**: 查詢法規條文
5. **醫療問答**: 基於醫學文獻回答

## 技術棧

- **Python 3.8+**
- **LangChain** - RAG 框架
- **FAISS / ChromaDB** - 向量資料庫
- **OpenAI Embeddings** - 文本嵌入
- **PyPDF2 / pdfplumber** - PDF 處理
- **Streamlit** - Web UI

## 最佳實踐

1. **文檔品質**: 確保文檔內容清晰、結構良好
2. **定期更新**: 保持索引與文檔同步
3. **測試查詢**: 用實際問題測試檢索效果
4. **監控效能**: 追蹤回答品質和用戶滿意度
5. **來源驗證**: 始終提供來源引用供用戶驗證

## 授權

MIT License
