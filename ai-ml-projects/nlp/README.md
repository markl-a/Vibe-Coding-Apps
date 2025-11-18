# 自然語言處理 Natural Language Processing

🔤 使用 AI 進行文本分析、分類、情感分析和語言理解

## 功能特點

- ✅ **文本分類** - 使用 Transformers 進行多類別分類
- ✅ **情感分析** - 正面/負面情感檢測
- ✅ **情緒檢測** - 細緻情緒識別 (喜悅、悲傷、憤怒等)
- ✅ **命名實體識別 (NER)** - 提取人名、地名、組織等
- ✅ **文本摘要** - 抽取式和生成式摘要
- ✅ **關鍵字提取** - 多種演算法 (TF-IDF, RAKE, TextRank, KeyBERT)
- ✅ **文本相似度** - 多種相似度計算方法
- ✅ **語言偵測** - 支援 11 種語言的自動偵測
- ✅ **問答系統** - 基於上下文的智能問答
- ✅ **零樣本分類** - 無需訓練資料的分類
- ✅ **垃圾郵件檢測** - 傳統 ML 方法

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
├── keyword_extractor.py   # 🆕 進階關鍵字提取 (RAKE, TextRank, KeyBERT)
├── text_similarity.py     # 🆕 文本相似度比較工具
├── qa_system.py           # 🆕 問答系統
├── language_detector.py   # 🆕 語言偵測工具
├── zero_shot_classifier.py # 🆕 零樣本分類器
├── emotion_detector.py    # 🆕 情緒檢測器
├── app.py                 # Streamlit UI
├── models/                # 模型儲存
└── data/                  # 資料集
```

每個子專案都包含完整的功能、文檔和範例，可獨立使用。

## 🆕 新增功能亮點

### 1. 進階關鍵字提取 (keyword_extractor.py)
- **多種演算法**：TF-IDF、RAKE、TextRank、KeyBERT
- **AI 增強**：可選的 BERT 語義關鍵字提取
- **方法比較**：一鍵比較所有方法的效果
- **上下文提取**：顯示關鍵字出現的上下文

### 2. 文本相似度分析 (text_similarity.py)
- **多種相似度方法**：Cosine、Jaccard、Levenshtein、N-gram
- **語義相似度**：基於 BERT 的語義比對（可選）
- **文檔搜尋**：從文檔集合中找出最相似的文本
- **重複檢測**：自動偵測近似重複的文本
- **相似度矩陣**：計算多個文本之間的兩兩相似度

### 3. 問答系統 (qa_system.py)
- **提取式問答**：從上下文中提取精確答案
- **多文檔問答**：跨多個文檔搜尋答案
- **對話式問答**：維持上下文的連續問答
- **答案驗證**：驗證給定答案的正確性
- **批次處理**：一次處理多個問題

### 4. 語言偵測 (language_detector.py)
- **11 種語言支援**：EN, ES, FR, DE, IT, PT, ZH, JA, KO, RU, AR
- **多種檢測方法**：腳本檢測、詞彙比對、字元頻率
- **混合語言分析**：分析包含多種語言的文本
- **80%+ 準確率**：特別是對非拉丁字母語言
- **批次處理**：高效處理大量文本

### 5. 零樣本分類 (zero_shot_classifier.py)
- **無需訓練**：不需要訓練資料即可分類
- **動態類別**：可隨時更改分類類別
- **多標籤支援**：一個文本可屬於多個類別
- **階層式分類**：支援多層次分類結構
- **自訂假設模板**：靈活的分類邏輯

### 6. 情緒檢測 (emotion_detector.py)
- **細緻情緒**：joy, sadness, anger, fear, surprise, love, disgust
- **情緒強度**：分析情緒的強烈程度
- **對話分析**：追蹤對話中的情緒變化軌跡
- **情緒分佈**：統計多個文本的情緒分佈
- **社群媒體監控**：適用於即時情緒分析

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

### 5. 關鍵字提取（進階版）

```python
from keyword_extractor import KeywordExtractor

# 基礎使用
extractor = KeywordExtractor()

text = """
Machine learning is a subset of artificial intelligence that focuses on
the development of algorithms and statistical models. Deep learning uses
neural networks with multiple layers.
"""

# TF-IDF 提取
keywords = extractor.extract(text, top_n=5, method='tfidf')

# RAKE 演算法（適合提取短語）
phrases = extractor.extract_rake(text, top_n=5)

# TextRank 演算法（基於圖）
keywords = extractor.extract_textrank(text, top_n=5)

# 比較所有方法
extractor.compare_methods(text, top_n=5)

# AI 增強版（需要額外安裝）
ai_extractor = KeywordExtractor(use_ai=True)
keywords = ai_extractor.extract_keybert(text, top_n=5, diversity=0.7)
```

### 6. 文本相似度（全新工具）

```python
from text_similarity import TextSimilarity

analyzer = TextSimilarity()

text1 = "Machine learning is a branch of artificial intelligence."
text2 = "Machine learning is a subset of AI."

# 多種相似度方法
similarities = analyzer.compute_all_similarities(text1, text2)
# 返回: {'cosine_tfidf': 0.34, 'jaccard': 0.38, 'levenshtein': 0.57, ...}

# 文檔搜尋
documents = [
    "Machine learning is transforming the world.",
    "Python is a popular programming language.",
    "Deep learning is a subset of machine learning.",
]
query = "What is machine learning?"
results = analyzer.find_most_similar(query, documents, top_k=2)

# 重複檢測
texts = ["Text 1", "Text 1", "Different text"]
duplicates = analyzer.find_duplicates(texts, threshold=0.9)

# AI 語義相似度（可選）
ai_analyzer = TextSimilarity(use_ai=True)
semantic_sim = ai_analyzer.semantic_similarity(text1, text2)
```

### 7. 問答系統（全新）

```python
from qa_system import QuestionAnsweringSystem

qa = QuestionAnsweringSystem()

context = """
Python is a high-level programming language. It was created by
Guido van Rossum and first released in 1991.
"""

# 單個問題
answer = qa.answer("Who created Python?", context)
print(answer['best_answer'])  # "Guido van Rossum"
print(answer['confidence'])   # 0.95

# 多文檔問答
contexts = [context1, context2, context3]
answers = qa.answer_multiple_contexts(question, contexts, top_k=3)

# 對話式問答
questions = ["What is Python?", "Who created it?", "When was it released?"]
conversation = qa.ask_conversational(questions, context)
```

### 8. 語言偵測（全新）

```python
from language_detector import LanguageDetector

detector = LanguageDetector()

# 偵測單一文本
result = detector.detect_combined("Bonjour le monde!")
print(result['language'])    # 'fr'
print(result['confidence'])  # 0.87

# 批次處理
texts = [
    "Hello world!",
    "Hola mundo!",
    "Bonjour le monde!",
    "这是中文"
]
results = detector.detect_batch(texts)

# 混合語言分析
mixed = "Hello 世界! This is mixed text. 日本語も含む。"
scripts = detector.detect_script(mixed)
# {'latin': 0.67, 'japanese': 0.18, 'chinese': 0.15}
```

### 9. 零樣本分類（全新）

```python
from zero_shot_classifier import ZeroShotClassifier

classifier = ZeroShotClassifier()

text = "Apple announced its latest iPhone with improved camera."

# 新聞分類（無需訓練）
categories = ["technology", "sports", "politics", "entertainment"]
result = classifier.classify(text, categories)
print(result['best_label'])  # 'technology'

# 多標籤分類
movie = "An action-packed sci-fi thriller with dramatic moments."
genres = ["action", "drama", "science fiction", "comedy", "romance"]
result = classifier.classify(movie, genres, multi_label=True)

# 階層式分類
hierarchy = {
    "science": ["biology", "physics", "chemistry"],
    "business": ["finance", "marketing", "management"]
}
result = classifier.hierarchical_classify(text, hierarchy)
```

### 10. 情緒檢測（全新）

```python
from emotion_detector import EmotionDetector

detector = EmotionDetector()

# 基本情緒檢測
text = "I'm so happy and excited about this!"
result = detector.detect(text, top_k=3)
print(result['primary_emotion'])  # 'joy'
print(result['confidence'])       # 0.94

# 情緒強度
emotion, intensity = detector.get_emotion_intensity(text)
# ('joy', 'very strong')

# 對話情緒分析
conversation = [
    "Hi! I'm so excited!",
    "I have a question.",
    "I'm getting frustrated.",
    "Oh wait, I found the solution!",
    "Yes! It works!"
]
analysis = detector.analyze_conversation(conversation)
print(analysis['emotional_arc'])
print(analysis['dominant_emotion'])

# 批次處理
reviews = ["Great product!", "Terrible quality.", "It's okay."]
results = detector.detect_batch(reviews)
```

### 11. Web UI

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
