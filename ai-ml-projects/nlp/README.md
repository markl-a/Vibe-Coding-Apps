# 自然語言處理 Natural Language Processing

🔤 使用 AI 進行文本分析、分類、情感分析和語言理解

## 功能特點

- ✅ 文本分類
- ✅ 情感分析
- ✅ 命名實體識別 (NER)
- ✅ 文本摘要
- ✅ 關鍵字提取
- ✅ 文本相似度
- ✅ 語言翻譯
- ✅ 問答系統

## 專案結構

這個目錄包含多個 NLP 子專案和共用工具：

### 子專案（獨立的完整專案）

```
nlp/
├── sentiment-analyzer/    # 情感分析器（使用 Transformers）
├── text-summarizer/       # 文本摘要工具（使用 BART/T5）
├── spam-classifier/       # 垃圾郵件分類器（傳統 ML）
└── ner-extractor/         # 命名實體識別器（spaCy/Transformers）
```

### 共用工具和快速原型

```
├── README.md              # 專案說明
├── requirements.txt       # 依賴套件
├── text_classifier.py     # 通用文本分類器
├── sentiment_analyzer.py  # 快速情感分析
├── keyword_extractor.py  # 關鍵字提取
├── app.py                # Streamlit UI
├── models/               # 模型儲存
└── data/                 # 資料集
```

每個子專案都包含完整的功能、文檔和範例，可獨立使用。

## 安裝

```bash
pip install -r requirements.txt
```

## 使用方式

### 1. 文本分類

```python
from text_classifier import TextClassifier

# 初始化分類器
classifier = TextClassifier(
    model_name='distilbert-base-uncased',
    num_labels=3
)

# 訓練模型
classifier.train(train_texts, train_labels, epochs=3)

# 預測
result = classifier.predict("This is a great product!")
print(f"Label: {result['label']}, Confidence: {result['confidence']:.2%}")
```

### 2. 情感分析

```python
from sentiment_analyzer import SentimentAnalyzer

# 初始化分析器
analyzer = SentimentAnalyzer()

# 分析情感
sentiment = analyzer.analyze("I love this movie!")
print(f"Sentiment: {sentiment['label']} ({sentiment['score']:.2%})")

# 批次分析
results = analyzer.analyze_batch([
    "Great product!",
    "Terrible experience.",
    "It's okay, nothing special."
])
```

### 3. 命名實體識別

```python
from ner_extractor import NERExtractor

# 初始化 NER
ner = NERExtractor()

# 提取實體
text = "Apple Inc. was founded by Steve Jobs in Cupertino, California."
entities = ner.extract(text)

for entity in entities:
    print(f"{entity['text']}: {entity['label']}")
# Output:
# Apple Inc.: ORG
# Steve Jobs: PER
# Cupertino: LOC
# California: LOC
```

### 4. 文本摘要

```python
from summarizer import TextSummarizer

# 初始化摘要器
summarizer = TextSummarizer(method='extractive')

# 生成摘要
long_text = "..."
summary = summarizer.summarize(long_text, max_length=100)
print(summary)

# 抽象式摘要
summarizer = TextSummarizer(method='abstractive')
summary = summarizer.summarize(long_text)
```

### 5. 關鍵字提取

```python
from keyword_extractor import KeywordExtractor

extractor = KeywordExtractor()

# 提取關鍵字
text = "Machine learning is a subset of artificial intelligence..."
keywords = extractor.extract(text, top_n=5)

for keyword, score in keywords:
    print(f"{keyword}: {score:.3f}")
```

### 6. 文本相似度

```python
from similarity import TextSimilarity

sim = TextSimilarity()

# 計算相似度
text1 = "The cat sits on the mat."
text2 = "A cat is sitting on a mat."

similarity = sim.compute_similarity(text1, text2)
print(f"Similarity: {similarity:.2%}")

# 找最相似的文本
query = "machine learning algorithms"
documents = ["AI and ML", "deep learning models", "cooking recipes"]

most_similar = sim.find_most_similar(query, documents)
print(f"Most similar: {most_similar}")
```

### 7. Web UI

```bash
streamlit run app.py
```

## 支援的模型

### Transformers (Hugging Face)
- BERT
- DistilBERT
- RoBERTa
- GPT-2
- T5
- BART

### 傳統 NLP 模型
- TF-IDF
- Word2Vec
- FastText
- spaCy

## 範例應用

### 1. 社群媒體情感分析

```python
from sentiment_analyzer import SentimentAnalyzer

analyzer = SentimentAnalyzer()

# 分析推文
tweets = [
    "Just bought the new iPhone, loving it! 📱",
    "Worst customer service ever 😠",
    "The product is okay, could be better"
]

for tweet in tweets:
    result = analyzer.analyze(tweet)
    print(f"{tweet}")
    print(f"  → {result['label']}: {result['score']:.2%}\n")
```

### 2. 新聞文章分類

```python
from text_classifier import TextClassifier

# 訓練新聞分類器
classifier = TextClassifier(num_labels=4)  # Sports, Politics, Tech, Entertainment
classifier.train(news_texts, news_labels)

# 分類新文章
article = "Apple announces new AI features..."
category = classifier.predict(article)
print(f"Category: {category['label']}")
```

### 3. 客戶評論分析

```python
from sentiment_analyzer import SentimentAnalyzer
from keyword_extractor import KeywordExtractor

analyzer = SentimentAnalyzer()
extractor = KeywordExtractor()

review = "The battery life is amazing, but the camera quality could be better."

# 情感分析
sentiment = analyzer.analyze(review)

# 關鍵詞提取
keywords = extractor.extract(review, top_n=3)

print(f"Sentiment: {sentiment['label']}")
print(f"Key aspects: {', '.join([k[0] for k in keywords])}")
```

### 4. 智能問答系統

```python
from transformers import pipeline

qa_pipeline = pipeline("question-answering")

context = """
Python is a high-level programming language. It was created by
Guido van Rossum and first released in 1991.
"""

question = "Who created Python?"

answer = qa_pipeline(question=question, context=context)
print(f"Answer: {answer['answer']}")
print(f"Confidence: {answer['score']:.2%}")
```

## 技術棧

- **Transformers** (Hugging Face) - 預訓練模型
- **spaCy** - NLP 處理
- **NLTK** - 自然語言工具包
- **scikit-learn** - 傳統 ML
- **Gensim** - 主題建模、Word2Vec
- **TextBlob** - 簡單 NLP 任務
- **Streamlit** - Web UI
- **PyTorch** / **TensorFlow** - 深度學習

## 常見應用場景

1. **客戶服務**
   - 自動分類客戶問題
   - 情感分析客戶反饋
   - 聊天機器人

2. **內容分析**
   - 新聞分類
   - 文章摘要
   - 關鍵詞提取

3. **社群媒體監控**
   - 品牌情感追蹤
   - 趨勢分析
   - 輿情監控

4. **文檔處理**
   - 自動標記
   - 資訊提取
   - 文檔搜尋

5. **翻譯服務**
   - 多語言翻譯
   - 語言檢測
   - 文本本地化

## 效能優化

- 使用較小的模型（DistilBERT）加快推理
- 批次處理提高吞吐量
- GPU 加速
- 模型量化
- 快取常見結果

## 最佳實踐

1. **資料準備**
   - 清理和標準化文本
   - 處理特殊字符和表情符號
   - 平衡訓練資料

2. **模型選擇**
   - 從預訓練模型開始
   - 根據任務選擇適當的模型大小
   - 考慮延遲和準確性的權衡

3. **評估**
   - 使用多個指標
   - 測試邊緣案例
   - 持續監控性能

## 子專案介紹

### 1. sentiment-analyzer (情感分析器)
功能完整的情感分析工具，使用 Hugging Face Transformers。
- 支援多語言情感分析
- 提供 CLI 和 API 介面
- 批量處理支援
- 詳細文檔和範例

查看 `sentiment-analyzer/README.md` 了解更多。

### 2. text-summarizer (文本摘要工具)
自動生成文本摘要的工具。
- 使用 BART/T5 等先進模型
- 支援長文本分段摘要
- 可調整摘要長度和比例
- REST API 服務

查看 `text-summarizer/README.md` 了解更多。

### 3. spam-classifier (垃圾郵件分類器)
基於傳統機器學習的垃圾郵件過濾器。
- 使用 TF-IDF + 機器學習
- 支援多種分類算法（NB, LR, RF, SVM）
- 可訓練自定義數據集
- 模型保存和載入功能

查看 `spam-classifier/README.md` 了解更多。

### 4. ner-extractor (命名實體識別器)
提取文本中的命名實體（人名、地名、組織等）。
- 支援 spaCy 和 Transformers 兩種後端
- 實體可視化功能
- 批量處理支援
- 實體類型過濾

查看 `ner-extractor/README.md` 了解更多。

## 授權

MIT License
